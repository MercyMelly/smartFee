// backend/routes/students.js

const express = require('express');
const router = express.Router();
// Destructure the protect and authorize functions from your auth middleware
const { protect, authorize } = require('../middleware/auth'); 

const {
    registerStudent,
    getAllStudents,
    getStudentByAdmission,
    getStudentProfile,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentsController');

// All routes are now protected by the 'protect' middleware
// For specific roles, you would add 'authorize' middleware after 'protect'
router.post('/register', protect, registerStudent); // Fixed: using 'protect'
// @desc Get all students, or filter by outstanding balance if ?outstanding=true is provided
router.get('/', protect, getAllStudents); // Fixed: using 'protect'
router.get('/:admissionNumber', protect, getStudentByAdmission); // Fixed: using 'protect'
router.get('/:admissionNumber/profile', protect, getStudentProfile); // Fixed: using 'protect'
router.put('/:admissionNumber', protect, updateStudent); // Fixed: using 'protect'
router.delete('/:admissionNumber', protect, deleteStudent); // Fixed: using 'protect'

// The /outstanding-balance-count route is no longer explicitly needed
// as getAllStudents can now handle the filtering with ?outstanding=true
// and the frontend will fetch the full list to display and count.

module.exports = router;
