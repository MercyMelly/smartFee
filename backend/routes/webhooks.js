const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const PendingPayment = require('../models/pendingPayment');
const Student = require('../models/studentsDB');
const Payment = require('../models/paymentsDB');
const FeeStructure = require('../models/feeStructure');
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); // Ensure mongoose is imported for sessions

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// --- Paystack Webhook Endpoint ---
router.post('/paystack', async (req, res) => {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                       .update(req.rawBody)
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Paystack Webhook: Invalid signature detected!');
        return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log(`Paystack Webhook Received: ${event.event}`);

    try {
        if (event.event === 'charge.success') {
            const data = event.data;

            const gatewayTransactionId = data.reference;
            const amount = data.amount / 100;
            const paymentChannel = data.channel;
            const paidAt = new Date(data.paid_at);
            const payerEmail = data.customer?.email || '';
            const payerPhone = data.customer?.phone || '';
            const payerName = `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim();

            const admissionNumberUsed = data.metadata?.custom_fields?.find(field => field.variable_name === 'admission_number')?.value || data.metadata?.account_name || '';

            const existingPendingPayment = await PendingPayment.findOne({ gatewayTransactionId });
            if (existingPendingPayment) {
                console.log(`Duplicate webhook for transaction ${gatewayTransactionId}. Ignoring.`);
                return res.status(200).send('Webhook already processed');
            }

            let studentId = null;
            if (admissionNumberUsed) {
                const student = await Student.findOne({ admissionNumber: admissionNumberUsed.toUpperCase().trim() });
                if (student) {
                    studentId = student._id;
                    console.log(`Auto-matched student ${student.fullName} (${admissionNumberUsed}) for payment ${gatewayTransactionId}`);
                } else {
                    console.warn(`Student not found for admission number: '${admissionNumberUsed}'. Payment ${gatewayTransactionId} will be pending manual linking.`);
                }
            } else {
                console.warn(`No admission number provided in Paystack metadata for transaction ${gatewayTransactionId}. Requires manual linking.`);
            }

            const newPendingPayment = new PendingPayment({
                gatewayTransactionId,
                student: studentId,
                admissionNumberUsed: admissionNumberUsed,
                amount,
                paymentMethod: paymentChannel === 'mobile_money' ? 'M-Pesa' : paymentChannel,
                payerDetails: { email: payerEmail, phone: payerPhone, name: payerName },
                paidAt,
                paystackMetadata: event.data,
                status: 'pending'
            });

            await newPendingPayment.save();
            console.log(`New pending payment created: KES ${amount} for ${admissionNumberUsed || 'unknown student'} (Ref: ${gatewayTransactionId})`);

        } else {
            console.log(`Unhandled Paystack event: ${event.event}`);
        }

        res.status(200).send('Webhook received');

    } catch (error) {
        console.error('Error processing Paystack webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

// @route   GET /api/webhooks/pending/count
// @desc    Get the count of pending payments
// @access  Private (Bursar, Admin, Director)
router.get('/pending/count', auth, async (req, res) => {
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to view pending payments count' });
    }
    try {
        const count = await PendingPayment.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching pending payments count:', error.message);
        res.status(500).send('Internal Server Error');
    }
});


// GET /api/webhooks/pending - Fetch all pending payments for bursar review
router.get('/pending', auth, async (req, res) => {
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to view pending payments' });
    }

    try {
        const pendingPayments = await PendingPayment.find({ status: 'pending' })
            .populate('student', 'fullName admissionNumber')
            .sort({ paidAt: -1 });

        res.json(pendingPayments);
    } catch (error) {
        console.error('Error fetching pending payments:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// POST /api/webhooks/confirm-pending/:id - Bursar confirms a pending payment
router.post('/confirm-pending/:id', auth, async (req, res) => {
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to confirm payments' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { notes, studentId: manualStudentId } = req.body;

        const pendingPayment = await PendingPayment.findById(id).session(session);

        if (!pendingPayment) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Pending payment not found' });
        }
        if (pendingPayment.status === 'confirmed') {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Payment already confirmed' });
        }

        if (manualStudentId && !pendingPayment.student) {
            const student = await Student.findById(manualStudentId).session(session);
            if (!student) {
                await session.abortTransaction();
                return res.status(400).json({ message: 'Manually linked student not found.' });
            }
            pendingPayment.student = manualStudentId;
        }

        if (!pendingPayment.student) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'No student linked to this payment. Please link manually before confirming.' });
        }

        let student = await Student.findById(pendingPayment.student).session(session);
        if (!student) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Linked student not found in database for final payment creation.' });
        }

        let currentTotalFee = 0;
        let feeRecordQuery = {
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport
        };

        const feeRecord = await FeeStructure.findOne(feeRecordQuery).session(session);

        if (!feeRecord) {
            await session.abortTransaction();
            return res.status(404).json({
                message: `Fee structure not found for student with Grade: ${student.gradeLevel}, ` +
                                 `Boarding: ${student.boardingStatus}, Transport: ${student.hasTransport ? 'Yes' : 'No'}. ` +
                                 `Please ensure a matching fee structure exists in the database.`,
                debugInfo: feeRecordQuery
            });
        }
        currentTotalFee = feeRecord.totalAmount || feeRecord.totalCalculated;

        if (
            student.boardingStatus === 'Day' &&
            student.hasTransport &&
            student.transportRoute &&
            feeRecord.transportRoutes &&
            feeRecord.transportRoutes.has(student.transportRoute)
        ) {
            const transportCost = feeRecord.transportRoutes.get(student.transportRoute);
            if (transportCost !== undefined) {
                currentTotalFee += transportCost;
            }
        }

        const newPayment = new Payment({
            student: pendingPayment.student,
            admissionNumber: student.admissionNumber,
            amountPaid: pendingPayment.amount,
            paymentMethod: pendingPayment.paymentMethod,
            transactionReference: pendingPayment.gatewayTransactionId,
            payerName: pendingPayment.payerDetails.name || pendingPayment.payerDetails.phone || 'Unknown Payer (from Paystack)',
            notes: notes || pendingPayment.notes || '',
            paymentDate: pendingPayment.paidAt,
            recordedBy: req.user.id,
            source: 'Paystack Webhook'
        });

        await newPayment.save({ session });

        let updateFields = {
            $inc: { 'feeDetails.feesPaid': pendingPayment.amount },
        };

        if (!student.feeDetails.totalFees || student.feeDetails.totalFees === 0) {
            updateFields.$set = { 'feeDetails.totalFees': currentTotalFee };
            const initialFeesPaid = student.feeDetails.feesPaid || 0;
            const newRemainingBalance = currentTotalFee - initialFeesPaid - pendingPayment.amount;
            updateFields.$set['feeDetails.remainingBalance'] = newRemainingBalance;
        } else {
            updateFields.$inc['feeDetails.remainingBalance'] = -pendingPayment.amount;
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            student._id,
            updateFields,
            { new: true, session, runValidators: true }
        );

        if (!updatedStudent) {
            await session.abortTransaction();
            return res.status(500).json({ message: 'Failed to update student balance after payment confirmation.' });
        }

        pendingPayment.status = 'confirmed';
        pendingPayment.confirmedBy = req.user.id;
        pendingPayment.confirmedAt = Date.now();
        await pendingPayment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: 'Payment confirmed and recorded successfully!',
            payment: newPayment,
            pendingPayment: pendingPayment,
            updatedStudentBalance: {
                feesPaid: updatedStudent.feeDetails.feesPaid,
                remainingBalance: updatedStudent.feeDetails.remainingBalance,
                currentTotalFee: updatedStudent.feeDetails.totalFees,
            },
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('Error confirming pending payment:', error.message);
        res.status(500).json({ message: 'Internal Server Error confirming payment.', error: error.message });
    } finally {
        if (session.inTransaction()) {
            session.endSession();
        }
    }
});

module.exports = router;
