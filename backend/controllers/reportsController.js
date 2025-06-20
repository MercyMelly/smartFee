// const Student = require('../models/studentsDB');
// const PDFDocument = require('pdfkit');

// exports.getOutstandingByClass = async (req, res) => {
//   try {
//     const data = await Student.aggregate([
//       {
//         $group: {
//           _id: "$class",
//           totalOutstanding: { $sum: "$balance" },
//           students: { $push: "$fullName" }
//         }
//       },
//       {
//         $sort: { totalOutstanding: -1 }
//       }
//     ]);

//     res.json(data);
//   } catch (err) {
//     console.error("Error in class report:", err);
//     res.status(500).json({ message: "Error fetching outstanding fees by class", error: err.message });
//   }
// };

// const fs = require('fs');
// const path = require('path');

// exports.generateBalanceReportPDF = async (req, res) => {
//   try {
//     const students = await Student.find({}, 'fullName class balance').sort({ class: 1 });

//     const doc = new PDFDocument();
//     const filePath = path.join(__dirname, '../pdfs/balance_report.pdf');
//     const stream = fs.createWriteStream(filePath);

//     doc.pipe(stream);

//     doc.fontSize(20).text('Student Balance Report', { align: 'center' });
//     doc.moveDown();

//     students.forEach((student, index) => {
//       doc.fontSize(12).text(`${index + 1}. ${student.fullName} | Class: ${student.class} | Balance: KES ${student.balance}`);
//     });

//     doc.end();

//     stream.on('finish', () => {
//       res.download(filePath, 'balance_report.pdf', (err) => {
//         if (err) {
//           console.error('Download error:', err);
//         }
//         fs.unlinkSync(filePath); 
//       });
//     });
//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
//   }
// };

// const sendSMS = require('../utils/sendSMS');

// exports.sendOutstandingBalanceAlerts = async (req, res) => {
//   try {
//     const students = await Student.find({ balance: { $gt: 0 } }, 'fullName parentPhone balance');

//     const smsResults = [];

//     for (const student of students) {
//       const message = `Dear Parent, your child ${student.fullName} has an outstanding balance of KES ${student.balance}. Please clear it soon.`;
//       const response = await sendSMS(student.parentPhone, message);
//       smsResults.push({ name: student.fullName, phone: student.parentPhone, response });
//     }

//     res.status(200).json({
//       message: 'SMS alerts sent',
//       results: smsResults,
//     });
//   } catch (error) {
//     console.error('Send alerts error:', error);
//     res.status(500).json({ message: 'Failed to send SMS alerts', error: error.message });
//   }
// };

// exports.getDefaultersList = async (req, res) => {
//   try {
//     const students = await Student.find({ balance: { $gt: 0 } })
//       .sort({ balance: -1 })
//       .select('fullName className balance parentPhone');

//     res.json(students);
//   } catch (err) {
//     console.error('Error fetching defaulters list:', err);
//     res.status(500).json({ message: 'Failed to fetch defaulters list', error: err.message });
//   }
// };

// exports.getDashboardStats = async (req, res) => {
//   try {
//     const start = new Date();
//     start.setHours(0, 0, 0, 0);
//     const end = new Date();
//     end.setHours(23, 59, 59, 999);

//     const todayPayments = await Payment.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: start, $lte: end }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalPaid: { $sum: "$amount" },
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     const outstanding = await Student.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalOutstanding: { $sum: "$balance" }
//         }
//       }
//     ]);

//     const studentCount = await Student.countDocuments();

//     res.json({
//       totalPaidToday: todayPayments[0]?.totalPaid || 0,
//       numberOfPaymentsToday: todayPayments[0]?.count || 0,
//       totalOutstanding: outstanding[0]?.totalOutstanding || 0,
//       totalStudents: studentCount
//     });
//   } catch (err) {
//     console.error('Dashboard stats error:', err);
//     res.status(500).json({ message: 'Failed to get dashboard stats', error: err.message });
//   }
// };

// exports.downloadOutstandingPDF = async (req, res) => {
//   try {
//     const students = await Student.find({ balance: { $gt: 0 } }).sort({ className: 1 });

//     const doc = new PDFDocument();

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=outstanding_balances.pdf');

//     doc.pipe(res);

//     doc.fontSize(18).text('Outstanding Fee Balances Report', { align: 'center' });
//     doc.moveDown();

//     students.forEach((s, i) => {
//       doc.fontSize(12).text(`${i + 1}. ${s.fullName} | Class: ${s.className} | Balance: KES ${s.balance}`);
//     });

//     doc.end();
//   } catch (err) {
//     console.error('PDF export error:', err);
//     res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
//   }
// };


// backend/controllers/reportsController.js


const Student = require('../models/studentsDB');
const Payment = require('../models/paymentsDB'); 
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sendSMS = require('../utils/sendSMS');

exports.getOutstandingByClass = async (req, res) => {
    try {
        const data = await Student.aggregate([
            {
                $group: {
                    // Use gradeLevel from your Student model
                    _id: "$gradeLevel", // <-- UPDATED: Use gradeLevel
                    totalOutstanding: { $sum: "$feeDetails.remainingBalance" }, // <-- UPDATED: Use feeDetails.remainingBalance
                    students: { $push: "$fullName" }
                }
            },
            {
                $sort: { totalOutstanding: -1 }
            }
        ]);

        res.json(data);
    } catch (err) {
        console.error("Error in class report:", err);
        res.status(500).json({ message: "Error fetching outstanding fees by class", error: err.message });
    }
};

exports.generateBalanceReportPDF = async (req, res) => {
    try {
        // Use feeDetails.remainingBalance from your Student model
        const students = await Student.find({}, 'fullName gradeLevel feeDetails.remainingBalance').sort({ gradeLevel: 1 }); // <-- UPDATED: Select gradeLevel and feeDetails.remainingBalance

        const doc = new PDFDocument();
        const filePath = path.join(__dirname, '../pdfs/balance_report.pdf');
        // Ensure the directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(20).text('Student Balance Report for Tindiret Educational Centre', { align: 'center' }); // <-- UPDATED: Specific name
        doc.moveDown();

        students.forEach((student, index) => {
            // Use gradeLevel and feeDetails.remainingBalance
            doc.fontSize(12).text(`${index + 1}. ${student.fullName} | Grade: ${student.gradeLevel} | Balance: KES ${student.feeDetails.remainingBalance}`); // <-- UPDATED
        });

        doc.end();

        stream.on('finish', () => {
            res.download(filePath, 'balance_report.pdf', (err) => {
                if (err) {
                    console.error('Download error:', err);
                    // Do not attempt to unlink if there was a download error
                } else {
                    // Only unlink if download was successful
                    fs.unlink(filePath, (unlinkErr) => { // Use fs.unlink for async deletion
                        if (unlinkErr) console.error('Error deleting temp PDF:', unlinkErr);
                    });
                }
            });
        });

        stream.on('error', (err) => { // Handle stream errors
            console.error('PDF stream error:', err);
            res.status(500).json({ message: 'Failed to generate PDF due to stream error', error: err.message });
        });

    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
    }
};

exports.sendOutstandingBalanceAlerts = async (req, res) => {
    try {
        // Use feeDetails.remainingBalance from your Student model
        const students = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } }, 'fullName parentPhone feeDetails.remainingBalance'); // <-- UPDATED

        const smsResults = [];

        for (const student of students) {
            // Use feeDetails.remainingBalance
            const message = `Dear Parent, your child ${student.fullName} has an outstanding balance of KES ${student.feeDetails.remainingBalance}. Please clear it soon. - Tindiret Educational Centre`; // <-- UPDATED: Specific name
            // Assuming sendSMS is properly configured.
            const response = await sendSMS(student.parentPhone, message);
            smsResults.push({ name: student.fullName, phone: student.parentPhone, response });
        }

        res.status(200).json({
            message: 'SMS alerts sent',
            results: smsResults,
        });
    } catch (error) {
        console.error('Send alerts error:', error);
        res.status(500).json({ message: 'Failed to send SMS alerts', error: error.message });
    }
};

exports.getDefaultersList = async (req, res) => {
    try {
        // Use feeDetails.remainingBalance from your Student model
        const students = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } }) // <-- UPDATED
            .sort({ 'feeDetails.remainingBalance': -1 }) // <-- UPDATED
            .select('fullName gradeLevel feeDetails.remainingBalance parentPhone'); // <-- UPDATED: Use gradeLevel, feeDetails.remainingBalance

        res.json(students);
    } catch (err) {
        console.error('Error fetching defaulters list:', err);
        res.status(500).json({ message: 'Failed to fetch defaulters list', error: err.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const todayPayments = await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPaid: { $sum: "$amountPaid" }, // <-- UPDATED: Use amountPaid as per Payment model
                    count: { $sum: 1 }
                }
            }
        ]);

        const outstanding = await Student.aggregate([
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: "$feeDetails.remainingBalance" } // <-- UPDATED: Use feeDetails.remainingBalance
                }
            }
        ]);

        const studentCount = await Student.countDocuments();

        res.json({
            totalPaidToday: todayPayments[0]?.totalPaid || 0,
            numberOfPaymentsToday: todayPayments[0]?.count || 0,
            totalOutstanding: outstanding[0]?.totalOutstanding || 0,
            totalStudents: studentCount
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ message: 'Failed to get dashboard stats', error: err.message });
    }
};

exports.downloadOutstandingPDF = async (req, res) => {
    try {
        // Use feeDetails.remainingBalance and gradeLevel
        const students = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } }).sort({ gradeLevel: 1 }); // <-- UPDATED

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=outstanding_balances_Tindiret.pdf'); // <-- UPDATED: Add school name

        doc.pipe(res);

        doc.fontSize(18).text('Outstanding Fee Balances Report - Tindiret Educational Centre', { align: 'center' }); // <-- UPDATED: Add school name
        doc.moveDown();

        students.forEach((s, i) => {
            // Use feeDetails.remainingBalance and gradeLevel
            doc.fontSize(12).text(`${i + 1}. ${s.fullName} | Grade: ${s.gradeLevel} | Balance: KES ${s.feeDetails.remainingBalance}`); // <-- UPDATED
        });

        doc.end();
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
    }
};