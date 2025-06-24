const Student = require('../models/studentsDB');
const Payment = require('../models/paymentsDB');
const User = require('../models/user'); // Assuming your User model for staff count if needed
const FeeStructure = require('../models/feeStructure'); // Although not used directly in this function, good to have if needed for other dashboard elements


exports.getDashboardSummary = async (req, res) => {
    // Role check is performed here directly using req.user, which is populated by auth middleware
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to view dashboard summary' });
    }

    console.log('[DASHBOARD_CONTROLLER] Starting getDashboardSummary function...');
    console.time('getDashboardSummary_total_execution');

    try {
        // --- Financial Summaries ---
        console.time('query_total_collected');
        const totalCollectedResult = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    totalCollected: { $sum: "$amountPaid" }
                }
            }
        ]);
        const totalCollected = totalCollectedResult.length > 0 ? totalCollectedResult[0].totalCollected : 0;
        console.timeEnd('query_total_collected');
        console.log('[DASHBOARD_CONTROLLER] Total Collected:', totalCollected);


        console.time('query_total_expected');
        const totalExpectedResult = await Student.aggregate([
            {
                $group: {
                    _id: null,
                    totalExpected: { $sum: "$feeDetails.totalFees" }
                }
            }
        ]);
        const totalExpected = totalExpectedResult.length > 0 ? totalExpectedResult[0].totalExpected : 0;
        console.timeEnd('query_total_expected');
        console.log('[DASHBOARD_CONTROLLER] Total Expected:', totalExpected);


        console.time('query_total_outstanding');
        const totalOutstandingResult = await Student.aggregate([
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: "$feeDetails.remainingBalance" }
                }
            }
        ]);
        const totalOutstanding = totalOutstandingResult.length > 0 ? totalOutstandingResult[0].totalOutstanding : 0;
        console.timeEnd('query_total_outstanding');
        console.log('[DASHBOARD_CONTROLLER] Total Outstanding:', totalOutstanding);


        // --- Additional Admin Dashboard Stats ---

        console.time('query_total_students');
        const totalStudents = await Student.countDocuments();
        console.timeEnd('query_total_students');
        console.log('[DASHBOARD_CONTROLLER] Total Students:', totalStudents);


        console.time('query_payments_today');
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const numberOfPaymentsToday = await Payment.countDocuments({
            paymentDate: { $gte: startOfToday, $lte: endOfToday }
        });
        console.timeEnd('query_payments_today');
        console.log('[DASHBOARD_CONTROLLER] Payments Today:', numberOfPaymentsToday);


        console.time('query_top_defaulters');
        const topDefaulters = await Student.find({ 'feeDetails.remainingBalance': { $gt: 0 } })
                                          .sort({ 'feeDetails.remainingBalance': -1 })
                                          .limit(5)
                                          .select('fullName admissionNumber feeDetails.remainingBalance')
                                          .lean();
        console.timeEnd('query_top_defaulters');
        console.log('[DASHBOARD_CONTROLLER] Top Defaulters Count:', topDefaulters.length);


        // --- NEW: Data for Charts ---

        console.time('data_fee_status_breakdown');
        const feeStatusBreakdown = [
            { name: "Collected", value: totalCollected },
            { name: "Outstanding", value: totalOutstanding }
        ];
        console.timeEnd('data_fee_status_breakdown');


        console.time('query_payments_by_method');
        const paymentsByMethod = await Payment.aggregate([
            {
                $group: {
                    _id: "$paymentMethod",
                    totalAmount: { $sum: "$amountPaid" }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);
        console.timeEnd('query_payments_by_method');
        console.log('[DASHBOARD_CONTROLLER] Payments By Method:', paymentsByMethod);


        console.time('query_fees_by_grade');
        const feesByGrade = await Student.aggregate([
            {
                $group: {
                    _id: "$gradeLevel",
                    totalExpectedForGrade: { $sum: "$feeDetails.totalFees" },
                    totalCollectedForGrade: { $sum: "$feeDetails.feesPaid" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        console.timeEnd('query_fees_by_grade');
        console.log('[DASHBOARD_CONTROLLER] Fees By Grade:', feesByGrade);


        res.json({
            totalFeesCollected: totalCollected,
            totalExpectedFees: totalExpected,
            totalOutstanding: totalOutstanding,
            totalStudents: totalStudents,
            numberOfPaymentsToday: numberOfPaymentsToday,
            topDefaulters: topDefaulters,
            feeStatusBreakdown: feeStatusBreakdown,
            paymentsByMethod: paymentsByMethod,
            feesByGrade: feesByGrade,
        });

    } catch (error) {
        console.error('[DASHBOARD_CONTROLLER] Error fetching dashboard summary:', error.message);
        // Also log the full error object for more detail
        console.error(error);
        res.status(500).send('Internal Server Error');
    } finally {
        console.timeEnd('getDashboardSummary_total_execution');
        console.log('[DASHBOARD_CONTROLLER] Finished getDashboardSummary function.');
    }
};