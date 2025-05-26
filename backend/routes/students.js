const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const paymentsController = require('../controllers/paymentsController');


router.post('/register', studentsController.registerStudent);
router.get('/', studentsController.getAllStudents);
router.get('/:admissionNumber', studentsController.getStudentByAdmission);
router.get('/outstandingByClass', paymentsController.getOutstandingFeesByClass);
router.get('/totalOutstanding',paymentsController.getTotalOutstandingFees);


module.exports = router;
