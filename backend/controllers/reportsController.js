const Student = require('../models/studentsDB');

exports.getOutstandingByClass = async (req, res) => {
  try {
    const data = await Student.aggregate([
      {
        $group: {
          _id: "$class",
          totalOutstanding: { $sum: "$balance" },
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



const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateBalanceReportPDF = async (req, res) => {
  try {
    const students = await Student.find({}, 'fullName class balance').sort({ class: 1 });

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, '../pdfs/balance_report.pdf');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('Student Balance Report', { align: 'center' });
    doc.moveDown();

    students.forEach((student, index) => {
      doc.fontSize(12).text(`${index + 1}. ${student.fullName} | Class: ${student.class} | Balance: KES ${student.balance}`);
    });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, 'balance_report.pdf', (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        fs.unlinkSync(filePath); 
      });
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};

const sendSMS = require('../utils/sendSMS');

exports.sendOutstandingBalanceAlerts = async (req, res) => {
  try {
    const students = await Student.find({ balance: { $gt: 0 } }, 'fullName parentPhone balance');

    const smsResults = [];

    for (const student of students) {
      const message = `Dear Parent, your child ${student.fullName} has an outstanding balance of KES ${student.balance}. Please clear it soon.`;
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
    const students = await Student.find({ balance: { $gt: 0 } })
      .sort({ balance: -1 })
      .select('fullName className balance parentPhone');

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
          totalPaid: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const outstanding = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: "$balance" }
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
