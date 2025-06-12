// const express = require('express');
// const router = express.Router();
// const studentsController = require('../controllers/studentsController');
// const paymentsController = require('../controllers/paymentsController');


// router.post('/register', studentsController.registerStudent);
// router.get('/', studentsController.getAllStudents);
// router.get('/:admissionNumber', studentsController.getStudentByAdmission);
// router.get('/outstandingByClass', paymentsController.getOutstandingFeesByClass);
// router.get('/totalOutstanding',paymentsController.getTotalOutstandingFees);
// router.get('/byStudent/:admissionNumber', paymentsController.getPaymentsByStudent);


// module.exports = router;


// routes/studentRoutes.js
const express = require('express');
const {
  registerStudent,
  getAllStudents,
  getStudentByAdmission,
  getStudentFees,
  updateStudent,
  deleteStudent
} = require('../controllers/studentsController'); // Ensure this path is correct

const router = express.Router();

router.post('/register', registerStudent); // To add a new student
router.get('/', getAllStudents); // To get all students
router.get('/:admissionNumber', getStudentByAdmission); // To get a single student's details
router.get('/:admissionNumber/fees', getStudentFees); // To get a single student's calculated fees
router.put('/:admissionNumber', updateStudent); // To update a student's details
router.delete('/:admissionNumber', deleteStudent); // To delete a student

module.exports = router;