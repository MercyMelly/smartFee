const express = require('express');
const router = express.Router();

const {
  registerStudent,
  getAllStudents,
  getStudentByAdmission,
  getStudentFees,
  updateStudent,
  deleteStudent,
  getStudentProfile
} = require('../controllers/studentsController');

router.post('/register', registerStudent); 
router.get('/', getAllStudents); 
router.get('/:admissionNumber', getStudentByAdmission); 
router.get('/:admissionNumber/fees', getStudentFees); 
router.put('/:admissionNumber', updateStudent);
router.delete('/:admissionNumber', deleteStudent);
router.get('/:admissionNumber/profile', getStudentProfile);

module.exports = router;