const mongoose = require('mongoose');
const Payment = require('../models/paymentsDB');
const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure');
const { generateReceiptPdf } = require('../utils/receiptGen');

exports.recordPayment = async (req, res) => {
    const {
        admissionNumber,
        amountPaid,
        paymentMethod,
        transactionReference,
        payerName,
        inKindItemType,
        inKindQuantity,
        notes
    } = req.body;

    if (!admissionNumber || !amountPaid || !paymentMethod) {
        return res.status(400).json({ message: 'Missing required payment details (admissionNumber, amountPaid, paymentMethod).' });
    }
    const parsedAmountPaid = parseFloat(amountPaid);
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
        return res.status(400).json({ message: 'Amount paid must be a positive number.' });
    }

    const requiresReference = ['Bank Transfer', 'M-Pesa'].includes(paymentMethod);
    if (requiresReference && (!transactionReference || transactionReference.trim() === '')) {
        return res.status(400).json({ message: `Transaction Reference is required for ${paymentMethod} payments.` });
    }
    if (paymentMethod === 'In-Kind') {
        if (!inKindItemType || inKindItemType.trim() === '') {
            return res.status(400).json({ message: 'In-Kind Item Type is required for In-Kind payments.' });
        }
        const parsedInKindQuantity = parseFloat(inKindQuantity);
        if (isNaN(parsedInKindQuantity) || parsedInKindQuantity <= 0) {
            return res.status(400).json({ message: 'In-Kind Quantity must be a positive number for In-Kind payments.' });
        }
        if (!transactionReference || transactionReference.trim() === '') {
            req.body.transactionReference = `IN-KIND-${Date.now()}`;
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const student = await Student.findOne({ admissionNumber }).session(session);

        if (!student) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Student not found.' });
        }

        let feeRecordQuery = {
            gradeLevel: student.gradeLevel,
            boardingStatus: student.boardingStatus,
            hasTransport: student.hasTransport
        };

        console.log('FeeStructure Query (for base fee):', feeRecordQuery);

        const feeRecord = await FeeStructure.findOne(feeRecordQuery).session(session);

        console.log('Found Fee Record:', feeRecord);

        if (!feeRecord) {
            await session.abortTransaction();
            return res.status(404).json({
                message: `Fee structure not found for student with Grade: ${student.gradeLevel}, ` +
                                 `Boarding: ${student.boardingStatus}, Transport: ${student.hasTransport ? 'Yes' : 'No'}. ` +
                                 `Please ensure a matching fee structure exists in the database.`,
                debugInfo: feeRecordQuery
            });
        }

        let currentTotalFee = feeRecord.totalAmount || feeRecord.totalCalculated;

        if (
            student.boardingStatus === 'Day' &&
            student.hasTransport &&
            student.transportRoute &&
            feeRecord.transportRoutes && // Ensure transportRoutes exists on feeRecord
            feeRecord.transportRoutes.has(student.transportRoute)
        ) {
            const transportCost = feeRecord.transportRoutes.get(student.transportRoute);
            if (transportCost !== undefined) {
                currentTotalFee += transportCost;
                console.log(`Added transport cost of ${transportCost} for route '${student.transportRoute}'. New total: ${currentTotalFee}`);
            } else {
                console.warn(`Fee structure for grade ${student.gradeLevel} (Day, hasTransport: true) does not have a defined cost for transport route: '${student.transportRoute}'.`);
            }
        }

        // --- NEW LOGIC TO INITIALIZE/UPDATE student.feeDetails.totalFees ---
        let studentUpdate = {
            $inc: {
                'feeDetails.feesPaid': parsedAmountPaid,
            }
        };

        // If student's totalFees is 0 or undefined, initialize it with the currentTotalFee
        // This ensures remainingBalance calculations have a proper base.
        if (!student.feeDetails.totalFees || student.feeDetails.totalFees === 0) {
            studentUpdate.$set = { 'feeDetails.totalFees': currentTotalFee };
            // Also initialize remainingBalance if totalFees was 0 or not set
            // The remainingBalance will be updated by $inc below, but this ensures a correct starting point.
            // If totalFees was 0, remainingBalance might have been 0, then we want it to be currentTotalFee - feesPaid
            studentUpdate.$inc['feeDetails.remainingBalance'] = currentTotalFee - (student.feeDetails.feesPaid || 0) - parsedAmountPaid;
        } else {
             // If totalFees is already set, just decrement remainingBalance
            studentUpdate.$inc['feeDetails.remainingBalance'] = -parsedAmountPaid;
        }
        // --- END NEW LOGIC ---

        const newPayment = new Payment({
            student: student._id,
            admissionNumber, // This is expected to come from req.body, which it does.
            amountPaid: parsedAmountPaid,
            paymentMethod,
            transactionReference: req.body.transactionReference,
            payerName,
            inKindItemType: paymentMethod === 'In-Kind' ? inKindItemType : undefined,
            inKindQuantity: paymentMethod === 'In-Kind' ? parseFloat(inKindQuantity) : undefined,
            notes
        });

        await newPayment.save({ session });

        // Perform the student update based on the calculated values
        await Student.updateOne(
            { _id: student._id },
            studentUpdate, // Use the dynamically created update object
            { session, runValidators: true } // Run validators to catch errors like min:0 on remainingBalance
        );

        // Fetch the updated student to send back the latest balance
        const updatedStudent = await Student.findById(student._id).session(session);


        await session.commitTransaction();

        res.status(201).json({
            message: 'Payment recorded successfully!',
            payment: newPayment,
            updatedStudentBalance: {
                feesPaid: updatedStudent.feeDetails.feesPaid,
                remainingBalance: updatedStudent.feeDetails.remainingBalance,
                currentTotalFee: updatedStudent.feeDetails.totalFees // Reflect the actual totalFees on student
            }
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error recording payment.', error: error.message, details: error });
    } finally {
        session.endSession();
    }
};

exports.getTodayPayments = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const payments = await Payment.find({
            createdAt: { $gte: start, $lte: end }
        }).populate('student', 'fullName');

        const formatted = payments.map(p => ({
            id: p._id,
            studentName: p.student.fullName,
            amountPaid: p.paymentMethod === 'produce' ? `${p.quantity} x ${p.produceType}` : p.amountPaid, // Use p.amountPaid
            paymentMethod: p.paymentMethod.toUpperCase()
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching today’s payments', error: err.message });
    }
};

exports.getPendingProduce = async (req, res) => {
    try {
        const producePayments = await Payment.find({
            paymentMethod: 'produce',
            unitValue: { $in: [null, 0] }
        }).populate('student', 'parentName');

        const formatted = producePayments.map(p => ({
            id: p._id,
            parentName: p.student.parentName,
            produce: `${p.quantity} ${p.produceType}`
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending produce', error: err.message });
    }
};

exports.getOutstandingFeesByClass = async (req, res) => {
    try {
        const result = await Student.aggregate([
            {
                $group: {
                    _id: "$className", // Assuming className exists on student
                    totalOutstanding: { $sum: "$feeDetails.remainingBalance" }, // Sum remainingBalance
                    students: { $push: { name: "$fullName", balance: "$feeDetails.remainingBalance" } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching outstanding fees by class', error: err.message });
    }
};

exports.getTotalOutstandingFees = async (req, res) => {
    try {
        const result = await Student.aggregate([
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: "$feeDetails.remainingBalance" } // Sum remainingBalance
                }
            }
        ]);

        const total = result[0]?.totalOutstanding || 0;
        res.json({ totalOutstanding: total });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching total outstanding fees', error: err.message });
    }
};

exports.getPaymentByReferenceNumber = async (req, res) => {
    try {
        const payment = await Payment.findOne({ transactionReference: req.params.referenceNumber }) // Use transactionReference
            .populate('student', 'admissionNumber'); // Populate admissionNumber

        if (!payment) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        res.json({
            studentAdmissionNumber: payment.student?.admissionNumber || 'Unknown', // Changed to studentAdmissionNumber
            paymentMethod: payment.paymentMethod,
            amountPaid: payment.amountPaid, // Use amountPaid
            date: payment.createdAt.toISOString().split('T')[0],
            transactionId: payment.transactionReference,
            cashierNotes: payment.notes || 'Paid successfully' // Use actual notes
        });
    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPaymentsByStudent = async (req, res) => {
    const { admissionNumber } = req.params;

    try {
        const student = await Student.findOne({ admissionNumber });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const payments = await Payment.find({ student: student._id }).sort({ createdAt: -1 }); // Filter by student._id

        res.json({ student, payments });
    } catch (err) {
        console.error('Error fetching student payments:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.generateReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        const student = await Student.findById(payment.student);
        if (!student) {
            return res.status(404).json({ message: 'Associated student not found for this payment.' });
        }

        // Ensure currentBalance is fetched after the student's fees are potentially updated
        const currentBalance = student.feeDetails.remainingBalance;

        const pdfBuffer = await generateReceiptPdf(payment.toObject(), student.toObject(), currentBalance);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.transactionReference || payment._id}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ message: 'Server error generating receipt.', error: error.message });
    }
};

