// const Student = require('../models/studentsDB');
// const Payment = require('../models/paymentsDB');

// exports.getDashboardSummary = async (req, res) => {
//   try {
//     const totalStudents = await Student.countDocuments();

//     const allPayments = await Payment.find();
//     const totalFeesCollected = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

//     const allStudents = await Student.find();
//     const totalOutstanding = allStudents.reduce((sum, s) => sum + (s.balance || 0), 0);

//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);
//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);

//     const paymentsToday = await Payment.countDocuments({
//       createdAt: { $gte: todayStart, $lte: todayEnd }
//     });

//     const topDefaulters = await Student.find()
//       .sort({ balance: -1 })
//       .limit(5)
//       .select('fullName balance');

//     res.json({
//       totalStudents,
//       totalFeesCollected,
//       totalOutstanding,
//       paymentsToday,
//       topDefaulters
//     });
//   } catch (err) {
//     console.error('Dashboard error:', err);
//     res.status(500).json({ message: 'Failed to fetch dashboard data', error: err.message });
//   }
// };


// backend/controllers/dashboardController.js


const Student = require('../models/studentsDB');
const Payment = require('../models/paymentsDB');

exports.getDashboardSummary = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();

        const allPayments = await Payment.find();
        // Use 'amountPaid' as per your Payment model, not 'amount'
        const totalFeesCollected = allPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0); // <-- UPDATED

        const allStudents = await Student.find();
        // Use 'feeDetails.remainingBalance' as per your Student model, not 'balance'
        const totalOutstanding = allStudents.reduce((sum, s) => sum + (s.feeDetails.remainingBalance || 0), 0); // <-- UPDATED

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const paymentsToday = await Payment.countDocuments({
            createdAt: { $gte: todayStart, $lte: todayEnd }
        });

        const topDefaulters = await Student.find()
            // Sort by 'feeDetails.remainingBalance', not 'balance'
            .sort({ 'feeDetails.remainingBalance': -1 }) // <-- UPDATED
            .limit(5)
            // Select 'feeDetails.remainingBalance', not 'balance'
            .select('fullName feeDetails.remainingBalance'); // <-- UPDATED

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