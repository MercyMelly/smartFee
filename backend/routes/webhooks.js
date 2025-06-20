const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // For verifying Paystack signature
const PendingPayment = require('../models/pendingPayment');
const Student = require('../models/studentsDB'); // Assuming your Student model path is correct
const Payment = require('../models/paymentsDB');   // Assuming your Payment model path is correct
const auth = require('../middleware/auth'); // Your authentication middleware
const FeeStructure = require('../models/feeStructure');
const mongoose = require('mongoose');


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// --- Paystack Webhook Endpoint ---
router.post('/paystack', async (req, res) => {
    // IMPORTANT: Verify Paystack Signature (Crucial for security!)
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                       .update(req.rawBody) // Use req.rawBody here!
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Paystack Webhook: Invalid signature detected!');
        return res.status(400).send('Invalid signature'); // Now return 400 if invalid signature for real
    }

    const event = req.body;
    console.log(`Paystack Webhook Received: ${event.event}`);

    try {
        if (event.event === 'charge.success') {
            const data = event.data;

            const gatewayTransactionId = data.reference;
            const amount = data.amount / 100; // Paystack amounts are in kobo/cents, convert to main currency (KES)
            const paymentChannel = data.channel;
            const paidAt = new Date(data.paid_at);
            const payerEmail = data.customer?.email || '';
            const payerPhone = data.customer?.phone || '';
            const payerName = `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim();

            // This logic finds the admission number from Paystack's metadata
            const admissionNumberUsed = data.metadata?.custom_fields?.find(field => field.variable_name === 'admission_number')?.value || data.metadata?.account_name || '';

            // Check if this payment has already been processed (idempotency)
            const existingPendingPayment = await PendingPayment.findOne({ gatewayTransactionId });
            if (existingPendingPayment) {
                console.log(`Duplicate webhook for transaction ${gatewayTransactionId}. Ignoring.`);
                return res.status(200).send('Webhook already processed');
            }

            // Attempt to find the student using the admission number
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

            // Create a pending payment record
            const newPendingPayment = new PendingPayment({
                gatewayTransactionId,
                student: studentId,
                admissionNumberUsed: admissionNumberUsed,
                amount,
                paymentMethod: paymentChannel === 'mobile_money' ? 'M-Pesa' : paymentChannel, // Normalize to "M-Pesa"
                payerDetails: { email: payerEmail, phone: payerPhone, name: payerName },
                paidAt,
                paystackMetadata: event.data, // Store full data for audit
                status: 'pending' // Default status, awaiting bursar confirmation
            });

            await newPendingPayment.save();
            console.log(`New pending payment created: KES ${amount} for ${admissionNumberUsed || 'unknown student'} (Ref: ${gatewayTransactionId})`);

        } else {
            console.log(`Unhandled Paystack event: ${event.event}`);
        }

        res.status(200).send('Webhook received'); // Always respond with 200 OK to Paystack

    } catch (error) {
        console.error('Error processing Paystack webhook:', error);
        res.status(500).send('Internal Server Error'); // Or a more specific error code if needed
    }
});

// --- Bursar App Endpoints for Pending Payments ---

// GET /api/webhooks/pending - Fetch all pending payments for bursar review
router.get('/pending', auth, async (req, res) => {
    // Optional: add role check if only specific roles can view pending payments
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to view pending payments' });
    }

    try {
        const pendingPayments = await PendingPayment.find({ status: 'pending' })
            .populate('student', 'fullName admissionNumber') // Populate student details if linked
            .sort({ paidAt: -1 }); // Show newest payments first

        res.json(pendingPayments);
    } catch (error) {
        console.error('Error fetching pending payments:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// POST /api/webhooks/confirm-pending/:id - Bursar confirms a pending payment
router.post('/confirm-pending/:id', auth, async (req, res) => {
    // Optional: add role check for who can confirm payments
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to confirm payments' });
    }

    const session = await mongoose.startSession(); // Start transaction for atomicity
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

        // If bursar provides a manual student ID and no student was auto-linked
        if (manualStudentId && !pendingPayment.student) {
            const student = await Student.findById(manualStudentId).session(session);
            if (!student) {
                await session.abortTransaction();
                return res.status(400).json({ message: 'Manually linked student not found.' });
            }
            pendingPayment.student = manualStudentId;
            // Optionally, update admissionNumberUsed here too for consistency
            // pendingPayment.admissionNumberUsed = student.admissionNumber;
        }

        // Ensure a student is linked before creating the final Payment record
        if (!pendingPayment.student) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'No student linked to this payment. Please link manually before confirming.' });
        }

        // Fetch the student again to ensure we have their latest data for balance calculation
        // IMPORTANT: Use findByIdAndUpdate for atomic update later if setting totalFees
        let student = await Student.findById(pendingPayment.student).session(session);
        if (!student) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Linked student not found in database for final payment creation.' });
        }

        // --- NEW FEE CALCULATION AND INITIALIZATION LOGIC ---
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
        // --- END NEW FEE CALCULATION ---


        // Create the final Payment record
        const newPayment = new Payment({
            student: pendingPayment.student,
            admissionNumber: student.admissionNumber, // Get admission number from the fetched student
            amountPaid: pendingPayment.amount, // Amount from pending payment
            paymentMethod: pendingPayment.paymentMethod,
            transactionReference: pendingPayment.gatewayTransactionId,
            payerName: pendingPayment.payerDetails.name || pendingPayment.payerDetails.phone || 'Unknown Payer (from Paystack)',
            notes: notes || pendingPayment.notes || '',
            paymentDate: pendingPayment.paidAt,
            recordedBy: req.user.id,
            source: 'Paystack Webhook'
        });

        await newPayment.save({ session });

        // --- UPDATE STUDENT FEE DETAILS ---
        let updateFields = {
            $inc: { 'feeDetails.feesPaid': pendingPayment.amount },
        };

        // If totalFees is not set or is 0, initialize it
        if (!student.feeDetails.totalFees || student.feeDetails.totalFees === 0) {
            updateFields.$set = { 'feeDetails.totalFees': currentTotalFee };
            // Calculate initial remainingBalance for the first payment
            // student.feeDetails.feesPaid refers to the value *before* this update
            const initialFeesPaid = student.feeDetails.feesPaid || 0;
            const newRemainingBalance = currentTotalFee - initialFeesPaid - pendingPayment.amount;
            updateFields.$set['feeDetails.remainingBalance'] = newRemainingBalance;
        } else {
            // If totalFees already exists, just update remainingBalance based on existing totalFees
            updateFields.$inc['feeDetails.remainingBalance'] = -pendingPayment.amount;
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            student._id,
            updateFields,
            { new: true, session, runValidators: true } // Return updated document, run validators
        );

        if (!updatedStudent) {
            await session.abortTransaction();
            return res.status(500).json({ message: 'Failed to update student balance after payment confirmation.' });
        }
        // --- END UPDATE STUDENT FEE DETAILS ---


        // Update pending payment status to confirmed
        pendingPayment.status = 'confirmed';
        pendingPayment.confirmedBy = req.user.id;
        pendingPayment.confirmedAt = Date.now();
        await pendingPayment.save({ session }); // Save pending payment in the same transaction

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
        if (session.inTransaction()) { // Ensure session is ended even if transaction aborted
            session.endSession();
        }
    }
});

module.exports = router;
