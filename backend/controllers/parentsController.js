// backend/controllers/parentsController.js

const Student = require('../models/studentsDB');
const FeeStructure = require('../models/feeStructure'); // Assuming this model exists and contains fee components
const FeeDeadline = require('../models/feeDeadline'); // Your existing FeeDeadline model
const Payment = require('../models/paymentsDB'); // Assuming your Payment model exists
const Parent = require('../models/user'); // Assuming you have a Parent model that links to User

// Helper function to calculate total expected fees (Ensure this is consistent across controllers)
const calculateTotalExpectedFees = async (gradeLevel, boardingStatus, hasTransport, transportRoute) => {
    let feeRecord = null;

    if (boardingStatus === 'Day' && hasTransport && transportRoute) {
        const routeKey = transportRoute.toLowerCase();
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
        if (feeRecord && (!feeRecord.transportRoutes || !feeRecord.transportRoutes.get(routeKey))) {
            feeRecord = null; // No specific transport route found in structure
        }
    }

    if (!feeRecord && boardingStatus === 'Day' && !hasTransport) {
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: false,
        });
    }

    if (!feeRecord && boardingStatus === 'Boarding') {
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Boarding',
            hasTransport: false, // Boarding fees typically include transport if applicable, or it's a separate component
        });
    }

    // Fallback if the specific combination is not found, try a more general one
    if (!feeRecord && boardingStatus === 'Day' && hasTransport) { // Catch-all for Day with transport if specific route isn't found
        feeRecord = await FeeStructure.findOne({
            gradeLevel: gradeLevel,
            boardingStatus: 'Day',
            hasTransport: true,
        });
    }

    if (!feeRecord) {
        console.warn(`[FeeCalc] No definitive fee structure found for: Grade: ${gradeLevel}, Boarding: ${boardingStatus}, Transport: ${hasTransport}, Route: ${transportRoute}. Returning 0.`);
        return 0;
    }

    let totalCalculatedFee = feeRecord.totalCalculated || 0; // This should be the sum of base components

    // Add transport fee if applicable and found
    if (hasTransport && boardingStatus === 'Day' && transportRoute && feeRecord.transportRoutes) {
        const routeKey = transportRoute.toLowerCase();
        const transportAmount = feeRecord.transportRoutes.get(routeKey);
        if (transportAmount !== undefined && transportAmount !== null) {
            totalCalculatedFee += transportAmount;
        } else {
            console.warn(`[FeeCalc] Transport route '${transportRoute}' fee not found in fee structure for grade ${gradeLevel}. Transport component not added to totalCalculatedFee.`);
        }
    }
    return totalCalculatedFee;
};

/**
 * @route GET /api/parents/students
 * @desc Get all students assosciated with the logged-in parent
 * @access Private (Parent)
 */
const getMyStudents = async (req, res) => {
    // Role authorization should already be handled by middleware
    // if (req.user.role !== 'parent') {
    //     return res.status(403).json({ message: 'Not authorized to view student list.' });
    // }

    try {
        const parentEmail = req.user.email;
        const parentPhoneNumber = req.user.phoneNumber; // Assuming this field is available on req.user

        if (!parentEmail && !parentPhoneNumber) {
            return res.status(400).json({ message: 'Parent contact information (email or phone) missing for this user.' });
        }

        // Find students whose parent's email or phone number matches the logged-in parent's contact
        const students = await Student.find({
            $or: [
                { 'parent.email': parentEmail },
                { 'parent.phone': parentPhoneNumber }
            ]
        }).select('fullName admissionNumber gradeLevel gender boardingStatus hasTransport transportRoute parent.name parent.phone');

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found linked to this parent account. Ensure your contact details match your children\'s records.' });
        }

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching parent\'s students:', error);
        res.status(500).json({ message: 'Server error fetching student list.' });
    }
};


/**
 * @route GET /api/parents/students/:admissionNumber/profile
 * @desc Get detailed student profile for a parent (with authorization check, fee details, and payment history)
 * @access Private (Parent)
 */
const getStudentProfileForParent = async (req, res) => {
    // Role authorization should already be handled by middleware
    // if (req.user.role !== 'parent') {
    //     return res.status(403).json({ message: 'Not authorized to view student profiles.' });
    // }

    try {
        const { admissionNumber } = req.params;
        const parentEmail = req.user.email;
        const parentPhoneNumber = req.user.phoneNumber;

        if (!parentEmail && !parentPhoneNumber) {
            return res.status(400).json({ message: 'Parent contact information (email or phone) missing for this user.' });
        }

        // Find student, ensuring they are linked to the authenticated parent
        const student = await Student.findOne({
            admissionNumber: admissionNumber.toUpperCase(), // Ensure consistency with how admission numbers are stored
            $or: [
                { 'parent.email': parentEmail },
                { 'parent.phone': parentPhoneNumber }
            ]
        }).lean(); // Use .lean() for plain JS objects, faster for reads if not saving changes immediately

        if (!student) {
            return res.status(404).json({ message: 'Student not found or not linked to your account.' });
        }

        // --- Calculate Current Fee Details ---
        const currentCalculatedTotalFees = await calculateTotalExpectedFees(
            student.gradeLevel,
            student.boardingStatus,
            student.hasTransport,
            student.transportRoute
        );

        // Aggregate total payments made for this student
        const totalPaymentsMadeResult = await Payment.aggregate([
            { $match: { student: student._id } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]);
        const feesPaidForLife = totalPaymentsMadeResult.length > 0 ? totalPaymentsMadeResult[0].total : 0;
        const remainingBalance = currentCalculatedTotalFees - feesPaidForLife;

        // Optionally, update student's feeDetails in DB for consistency if they are stale
        // This makes sure the stored balance is always accurate based on total payments
        let needsUpdate = false;
        const updateFields = {};
        if (student.feeDetails.totalFees !== currentCalculatedTotalFees) {
            updateFields['feeDetails.totalFees'] = currentCalculatedTotalFees;
            needsUpdate = true;
        }
        if (student.feeDetails.feesPaid !== feesPaidForLife) {
            updateFields['feeDetails.feesPaid'] = feesPaidForLife;
            needsUpdate = true;
        }
        if (student.feeDetails.remainingBalance !== remainingBalance) {
            updateFields['feeDetails.remainingBalance'] = remainingBalance;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await Student.updateOne({ _id: student._id }, { $set: updateFields });
            // Update the 'student' object in memory to reflect the changes for the response
            student.feeDetails.totalFees = currentCalculatedTotalFees;
            student.feeDetails.feesPaid = feesPaidForLife;
            student.feeDetails.remainingBalance = remainingBalance;
        }

        // Fetch termly fee components and notes for display
        let feeRecordForDisplay = null;
        if (student.boardingStatus === 'Day' && student.hasTransport && student.transportRoute) {
            const routeKey = student.transportRoute.toLowerCase();
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: true,
            });
            if (feeRecordForDisplay && (!feeRecordForDisplay.transportRoutes || !feeRecordForDisplay.transportRoutes.get(routeKey))) {
                feeRecordForDisplay = null;
            }
        }
        if (!feeRecordForDisplay && student.boardingStatus === 'Day' && !student.hasTransport) {
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Day',
                hasTransport: false,
            });
        }
        if (!feeRecordForDisplay && student.boardingStatus === 'Boarding') {
            feeRecordForDisplay = await FeeStructure.findOne({
                gradeLevel: student.gradeLevel,
                boardingStatus: 'Boarding',
                hasTransport: false,
            });
        }
        if (!feeRecordForDisplay && student.boardingStatus === 'Day' && student.hasTransport) { // Catch-all for Day with transport
             feeRecordForDisplay = await FeeStructure.findOne({
                 gradeLevel: student.gradeLevel,
                 boardingStatus: 'Day',
                 hasTransport: true,
             });
         }


        let termlyComponents = feeRecordForDisplay ? [...(feeRecordForDisplay.termlyComponents || [])] : [];
        let notes = feeRecordForDisplay ? feeRecordForDisplay.notes || '' : 'No matching fee structure details found for components/notes.';

        if (student.hasTransport && student.transportRoute && feeRecordForDisplay && feeRecordForDisplay.transportRoutes) {
            const routeKey = student.transportRoute.toLowerCase();
            const transportAmount = feeRecordForDisplay.transportRoutes.get(routeKey);
            if (transportAmount !== undefined && transportAmount !== null) {
                termlyComponents.push({ name: `Transport Fee (${student.transportRoute})`, amount: transportAmount });
                notes += (notes ? ' | ' : '') + `Transport fee for ${student.transportRoute} route included.`;
            }
        }


        // Fetch actual payment history for this student
        const paymentHistory = await Payment.find({ student: student._id }).sort({ paymentDate: -1 }).lean();

        // Fetch the current fee deadline (assuming one current deadline per term/year)
        const currentFeeDeadline = await FeeDeadline.findOne({
            // You might need more specific criteria here, e.g., isCurrent: true, or by date range
            // For now, let's just get the latest one or a specific one if defined.
        }).sort({ deadlineDate: -1 }); // Get the most recent deadline

        // Construct the full profile response
        const studentProfileData = {
            student: student, // The full student object
            feeDetails: {
                termlyComponents: termlyComponents,
                totalTermlyFee: currentCalculatedTotalFees,
                feesPaid: feesPaidForLife,
                remainingBalance: remainingBalance,
                notes: notes,
            },
            paymentHistory: paymentHistory,
            currentFeeDeadline: currentFeeDeadline, // Pass deadline data
        };

        res.status(200).json(studentProfileData);

    } catch (error) {
        console.error('Error fetching student profile for parent:', error);
        res.status(500).json({ message: 'Server error fetching student profile.', error: error.message });
    }
};

/**
 * @route GET /api/parents/deadlines
 * @desc Get upcoming fee deadlines for parents
 * @access Private (Parent)
 */
const getFeeDeadlines = async (req, res) => {
    // Role authorization should already be handled by middleware
    // if (req.user.role !== 'parent') {
    //     return res.status(403).json({ message: 'Not authorized to view deadlines.' });
    // }
    try {
        const today = new Date();
        // Get deadlines that are today or in the future
        const deadlines = await FeeDeadline.find({
            deadlineDate: { $gte: today }
        }).sort({ deadlineDate: 1 }); // Sort by date ascending

        res.status(200).json(deadlines);
    } catch (error) {
        console.error('Error fetching fee deadlines for parent:', error.message);
        res.status(500).json({ message: 'Server error fetching deadlines.', error: error.message });
    }
};

/**
 * @route GET /api/parents/payments/generate-receipt/:paymentId
 * @desc Generate receipt data for a payment, secured for parent
 * @access Private (Parent)
 */
const generateReceiptForParent = async (req, res) => {
    // Role authorization should already be handled by middleware
    // if (req.user.role !== 'parent') {
    //     return res.status(403).json({ message: 'Not authorized to generate receipts.' });
    // }
    try {
        const { paymentId } = req.params;
        const parentEmail = req.user.email;
        const parentPhoneNumber = req.user.phoneNumber;

        if (!parentEmail && !parentPhoneNumber) {
            return res.status(400).json({ message: 'Parent contact information (email or phone) missing for this user.' });
        }

        const payment = await Payment.findById(paymentId).populate('student').populate('recordedBy', 'fullName').lean();
        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }
        if (!payment.student) {
             return res.status(404).json({ message: 'Associated student not found for this payment.' });
        }

        // --- AUTHORIZATION CHECK ---
        // Verify that the payment's student is associated with the logged-in parent
        const isAuthorized = (
            (payment.student.parent.email && payment.student.parent.email === parentEmail) ||
            (payment.student.parent.phone && payment.student.parent.phone === parentPhoneNumber)
        );

        if (!isAuthorized) {
            return res.status(403).json({ message: 'You are not authorized to view this receipt.' });
        }
        // --- END AUTHORIZATION CHECK ---

        // Recalculate remaining balance for the student at the time of receipt generation
        // (or fetch the current balance if preferred)
        const student = await Student.findById(payment.student._id).lean();
        const currentBalance = student?.feeDetails?.remainingBalance || 0;


        // In a real application, you would call your PDF generation utility here
        // For example:
        // const { generateReceiptPdf } = require('../utils/pdfGenerator'); // Assuming you have this
        // const pdfBuffer = await generateReceiptPdf(payment, student, currentBalance);
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.transactionReference || payment._id}.pdf`);
        // res.send(pdfBuffer);

        // For now, sending a JSON response to simulate receipt data
        res.status(200).json({
            message: 'Receipt data retrieved successfully (PDF generation mock)',
            receipt: {
                payment: payment,
                student: student,
                currentBalance: currentBalance,
                recordedBy: payment.recordedBy?.fullName || 'N/A' // Include who recorded it
            }
        });

    } catch (error) {
        console.error('Error generating receipt for parent:', error.message);
        res.status(500).json({ message: 'Server error generating receipt.', error: error.message });
    }
};


module.exports = {
    getMyStudents,
    getStudentProfileForParent,
    getFeeDeadlines,
    generateReceiptForParent,
};
