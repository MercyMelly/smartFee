const Student = require('../models/studentsDB');
const Payment = require('../models/paymentsDB');

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();

    const allPayments = await Payment.find();
    const totalFeesCollected = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const allStudents = await Student.find();
    const totalOutstanding = allStudents.reduce((sum, s) => sum + (s.balance || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const paymentsToday = await Payment.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const topDefaulters = await Student.find()
      .sort({ balance: -1 })
      .limit(5)
      .select('fullName balance');

    res.json({
      totalStudents,
      totalFeesCollected,
      totalOutstanding,
      paymentsToday,
      topDefaulters
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: err.message });
  }
};
