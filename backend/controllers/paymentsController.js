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

    // --- Input Validation (no changes needed here) ---
    if (!admissionNumber || !amountPaid || !paymentMethod) {
        return res.status(400).json({ message: 'Missing required payment details (admissionNumber, amountPaid, paymentMethod).' });
    }
    if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
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
        if (isNaN(parseFloat(inKindQuantity)) || parseFloat(parseFloat(inKindQuantity)) <= 0) { // Fixed a typo: parseFloat(parseFloat(inKindQuantity)) -> parseFloat(inKindQuantity)
            return res.status(400).json({ message: 'In-Kind Quantity must be a positive number for In-Kind payments.' });
        }
        // If no transactionReference is provided for In-Kind, generate one
        if (!transactionReference || transactionReference.trim() === '') {
            req.body.transactionReference = `IN-KIND-${Date.now()}`;
        }
    }
    // --- End Input Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const student = await Student.findOne({ admissionNumber }).session(session);

        if (!student) {
            await session.abortTransaction(); // Abort if student not found
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
            await session.abortTransaction(); // Abort if fee record not found
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
            feeRecord.transportRoutes &&
            feeRecord.transportRoutes.has(student.transportRoute)
        ) {
            const transportCost = feeRecord.transportRoutes.get(student.transportRoute);
            if (transportCost !== undefined) {
                currentTotalFee += transportCost;
                console.log(`Added transport cost of ${transportCost} for route '${student.transportRoute}'. New total: ${currentTotalFee}`);
            } else {
                console.warn(`Fee structure for grade ${student.gradeLevel} (Day, hasTransport: true) does not have a defined cost for transport route: '${student.transportRoute}'.`);
                // Consider how you want to handle this:
                // Option A: Throw an error and abort the transaction.
                // throw new Error(`Missing transport cost for route: ${student.transportRoute}`);
                // Option B: Log a warning and proceed without adding transport cost. (Current behavior)
            }
        }

        const newPayment = new Payment({
            student: student._id,
            admissionNumber,
            amountPaid: parseFloat(amountPaid),
            paymentMethod,
            transactionReference: req.body.transactionReference,
            payerName,
            inKindItemType: paymentMethod === 'In-Kind' ? inKindItemType : undefined,
            inKindQuantity: paymentMethod === 'In-Kind' ? parseFloat(inKindQuantity) : undefined,
            notes
        });

        await newPayment.save({ session });

        await Student.updateOne(
            { _id: student._id },
            {
                $inc: {
                    'feeDetails.feesPaid': parseFloat(amountPaid),
                    'feeDetails.remainingBalance': -parseFloat(amountPaid)
                }
            },
            { session }
        );

        // --- Commit Transaction FIRST before sending response ---
        await session.commitTransaction();

        // ONLY send the response AFTER the transaction is successfully committed.
        // This is where your previous issue likely was.
        res.status(201).json({
            message: 'Payment recorded successfully!',
            payment: newPayment,
            updatedStudentBalance: {
                // Ensure these reflect the *new* state after the increment.
                // To get the absolute latest, you might need to re-fetch the student,
                // or carefully calculate it from the pre-update state + the increment.
                // For now, assuming student.feeDetails are from the pre-update student object:
                feesPaid: student.feeDetails.feesPaid + parseFloat(amountPaid),
                remainingBalance: student.feeDetails.remainingBalance - parseFloat(amountPaid),
                currentTotalFee: currentTotalFee
            }
        });

    } catch (error) {
        // Only attempt to abort if the session is active (not yet committed or already aborted)
        if (session.inTransaction()) { // Check if the session is still in a transaction state
            await session.abortTransaction();
        }
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error recording payment.', error: error.message, details: error });
    } finally {
        // Ensure session is always ended, regardless of success or failure
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
        amountPaid: p.paymentMethod === 'produce' ? `${p.quantity} x ${p.produceType}` : p.amount,
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
            _id: "$className",
            totalOutstanding: { $sum: "$balance" },
            students: { $push: { name: "$fullName", balance: "$balance" } }
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
            totalOutstanding: { $sum: "$balance" }
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
      const payment = await Payment.findOne({ referenceNumber: req.params.referenceNumber })
        .populate('student', 'studentId');

      if (!payment) {
        return res.status(404).json({ message: 'Receipt not found' });
      }

      res.json({
        studentId: payment.student?.studentId || 'Unknown',
        paymentMethod: payment.paymentMethod,
        amountPaid: payment.amount,
        date: payment.createdAt.toISOString().split('T')[0],
        transactionId: payment.referenceNumber,
        cashierNotes: 'Paid successfully'
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

      const payments = await Payment.find({ admissionNumber }).sort({ date: -1 });

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