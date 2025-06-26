// backend/routes/students.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import your authentication middleware

const {
    registerStudent,
    getAllStudents,
    getStudentByAdmission,
    getStudentProfile, // Ensure this is imported for profile route
    updateStudent,
    deleteStudent,
    // getStudentFees, // This was commented out in your version, keeping it out.
    // If you plan to use this, uncomment and ensure it exists in your controller.
} = require('../controllers/studentsController');

// Import the studentsController directly for the outstanding-balance-count route
// (or extract it if you have other student functions in the controller)
const Student = require('../models/studentsDB'); // Needed for countDocuments in the route directly

// @route POST /api/students/register
// @desc Register a new student
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.post('/register', auth, registerStudent);

// @route GET /api/students
// @desc Get all students
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.get('/', auth, getAllStudents);

// @route GET /api/students/:admissionNumber
// @desc Get student by admission number
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.get('/:admissionNumber', auth, getStudentByAdmission);

// @route GET /api/students/:admissionNumber/profile
// @desc Get detailed student profile
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.get('/:admissionNumber/profile', auth, getStudentProfile);

// @route PUT /api/students/:admissionNumber
// @desc Update student details
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.put('/:admissionNumber', auth, updateStudent);

// @route DELETE /api/students/:admissionNumber
// @desc Delete a student
// @access Private (Admin, Director roles should be handled in controller)
router.delete('/:admissionNumber', auth, deleteStudent);

// @route GET /api/students/outstanding-balance-count
// @desc Get the count of students with a remaining balance > 0
// @access Private (Bursar, Admin, Director roles should be handled in controller)
router.get('/outstanding-balance-count', auth, async (req, res) => {
    // Role authorization (this check should be consistent with your controller logic)
    if (req.user.role !== 'bursar' && req.user.role !== 'admin' && req.user.role !== 'director') {
        return res.status(403).json({ msg: 'Not authorized to view this count.' });
    }
    try {
        const count = await Student.countDocuments({ 'feeDetails.remainingBalance': { $gt: 0 } });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching outstanding balance count:', error.message);
        res.status(500).json({ msg: 'Server error.', error: error.message });
    }
});


module.exports = router;
