const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure');
const FeeDeadline = require('../models/feeDeadline');
const Payment = require('../models/paymentsDB');
const asyncHandler = require('express-async-handler');
const { generateReceiptPdf } = require('../utils/receiptGen');


const calculateTotalExpectedFees = async (gradeLevel, boardingStatus, hasTransport, transportRoute) => {
    let feeRecord = null;

    if (boardingStatus === 'Day' && hasTransport && transportRoute) {
        const routeKey = transportRoute.toLowerCase();
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
        if (feeRecord && (!feeRecord.transportRoutes || !feeRecord.transportRoutes.get(routeKey))) {
            feeRecord = null;
        }
    }

    if (!feeRecord && boardingStatus === 'Day' && !hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: false,
        });
    }

    if (!feeRecord && boardingStatus === 'Boarding') {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Boarding',
            hasTransport: false,
        });
    }

    if (!feeRecord && boardingStatus === 'Day' && hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
    }

    if (!feeRecord) {
        console.warn(`[FeeCalc] No definitive fee structure found for Grade: ${gradeLevel}, Boarding: ${boardingStatus}, Transport: ${hasTransport}, Route: ${transportRoute}. Returning 0.`);
        return 0;
    }

    let total = feeRecord.totalCalculated || 0;

    if (hasTransport && boardingStatus === 'Day' && transportRoute && feeRecord.transportRoutes) {
        const routeKey = transportRoute.toLowerCase();
        const transportAmount = feeRecord.transportRoutes.get(routeKey);
        if (transportAmount !== undefined && transportAmount !== null) {
            total += transportAmount;
        }
    }

    return total;
};

const getMyStudents = asyncHandler(async (req, res) => {
    const parentEmail = req.user.email;
    const parentPhoneNumber = req.user.phoneNumber;

    if (!parentEmail && !parentPhoneNumber) {
        return res.status(400).json({ message: 'Parent contact information missing.' });
    }

    const students = await Student.find({
        $or: [
            { 'parent.email': parentEmail },
            { 'parent.phone': parentPhoneNumber }
        ]
    }).select('fullName admissionNumber gradeLevel gender boardingStatus hasTransport transportRoute parent.name parent.phone');

    if (students.length === 0) {
        return res.status(404).json({ message: 'No students linked to this parent account.' });
    }

    res.status(200).json(students);
});

const getStudentProfileForParent = asyncHandler(async (req, res) => {
    const { admissionNumber } = req.params;
    const parentEmail = req.user.email;
    const parentPhoneNumber = req.user.phoneNumber;

    if (!parentEmail && !parentPhoneNumber) {
        return res.status(400).json({ message: 'Parent contact information missing.' });
    }

    const student = await Student.findOne({
        admissionNumber: admissionNumber.toUpperCase(),
        $or: [
            { 'parent.email': parentEmail },
            { 'parent.phone': parentPhoneNumber }
        ]
    }).lean();

    if (!student) {
        return res.status(404).json({ message: 'Student not found or not linked to your account.' });
    }

    const currentTotal = await calculateTotalExpectedFees(
        student.gradeLevel,
        student.boardingStatus,
        student.hasTransport,
        student.transportRoute
    );

    const paymentsAgg = await Payment.aggregate([
        { $match: { student: student._id } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    const feesPaid = paymentsAgg.length ? paymentsAgg[0].total : 0;
    const balance = currentTotal - feesPaid;

    let needsUpdate = false;
    const updateFields = {};
    if (student.feeDetails.totalFees !== currentTotal) {
        updateFields['feeDetails.totalFees'] = currentTotal;
        needsUpdate = true;
    }
    if (student.feeDetails.feesPaid !== feesPaid) {
        updateFields['feeDetails.feesPaid'] = feesPaid;
        needsUpdate = true;
    }
    if (student.feeDetails.remainingBalance !== balance) {
        updateFields['feeDetails.remainingBalance'] = balance;
        needsUpdate = true;
    }
    if (needsUpdate) {
        await Student.updateOne({ _id: student._id }, { $set: updateFields });
        student.feeDetails.totalFees = currentTotal;
        student.feeDetails.feesPaid = feesPaid;
        student.feeDetails.remainingBalance = balance;
    }

    const payments = await Payment.find({ student: student._id }).sort({ paymentDate: -1 }).lean();
    const deadline = await FeeDeadline.findOne().sort({ deadlineDate: -1 });

    res.status(200).json({
        student,
        feeDetails: {
            totalTermlyFee: currentTotal,
            feesPaid,
            remainingBalance: balance,
        },
        paymentHistory: payments,
        currentFeeDeadline: deadline,
    });
});

const getFeeDeadlines = asyncHandler(async (req, res) => {
    const deadlines = await FeeDeadline.find({
        deadlineDate: { $gte: new Date() }
    }).sort({ deadlineDate: 1 });

    res.status(200).json(deadlines);
});

const generateReceiptForParent = asyncHandler(async (req, res) => {
    console.log("[Receipt] Incoming request:", req.user);
    if (!['parent'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to generate receipts.' });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId).populate('student');
    if (!payment) {
        return res.status(404).json({ message: 'Payment record not found.' });
    }

    const student = await Student.findById(payment.student._id);
    if (!student) {
        return res.status(404).json({ message: 'Associated student not found.' });
    }

    const currentBalance = student.feeDetails.remainingBalance;

    const pdfBuffer = await generateReceiptPdf(payment.toObject(), student.toObject(), currentBalance, null);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.transactionReference || payment._id}.pdf`);
    res.send(pdfBuffer);
});



module.exports = {
    getMyStudents,
    getStudentProfileForParent,
    getFeeDeadlines,
    generateReceiptForParent,
};
