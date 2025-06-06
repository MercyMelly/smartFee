const Payment = require('../models/paymentsDB');
const Student = require('../models/studentsDB');

exports.addPayment = async (req, res) => {
  try {
    const {
      studentId,
      paymentMethod,
      produceType,
      quantity,
      unitValue,
      bankName,
      referenceNumber,
      amount,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
      let totalAmount = 0;   
    if (paymentMethod === 'produce') {
      if (!quantity || !unitValue) {
        return res.status(400).json({ message: 'Missing quantity or unit value' });
      }
      totalAmount = quantity * unitValue;
    } else if (paymentMethod === 'mpesa' || paymentMethod === 'bank') {
      if (!amount || !referenceNumber) {
        return res.status(400).json({ message: 'Missing amount or reference number' });
      }
      totalAmount = amount;
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
  
    const newPayment = new Payment({
      student: studentId,
      paymentMethod,
      produceType,
      quantity,
      unitValue,
      bankName,
      referenceNumber,
      amount: totalAmount,
    });

    await newPayment.save();

    student.balance -= totalAmount;
    await student.save();
    student.balance = Math.max(student.balance - totalAmount, 0);


    if (student.balance > 0 && student.parentPhone) {
      const smsMessage = `Hello ${student.parentName}, your child ${student.fullName} has an outstanding balance of KES ${student.balance}. Please clear it.`;
      try {
        await sendSMS(student.parentPhone, smsMessage);
        console.log('SMS sent successfully.');
      } catch (err) {
        console.error('Failed to send SMS:', err.message);
      }
    }

    res.status(201).json({
      message: 'Payment recorded',
      payment: newPayment,
      newBalance: student.balance
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
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

// exports.filterPayments = async (req, res) => {
//   try {
//     const { paymentMethod, startDate, endDate, className, produceType } = req.query;

//     const query = {};

//     if (paymentMethod) query.paymentMethod = paymentMethod;
//     if (produceType) query.produceType = produceType;
//     if (startDate && endDate) {
//       query.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     if (className) {
//       const students = await Student.find({ className }).select('_id');
//       query.student = { $in: students.map(s => s._id) };
//     }

//     const payments = await Payment.find(query).populate('student', 'fullName className');

//     res.json(payments);
//   } catch (err) {
//     console.error('Filter payments error:', err);
//     res.status(500).json({ message: 'Failed to filter payments', error: err.message });
//   }
// };
