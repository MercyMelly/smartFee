// backend/routes/parents.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const parentController = require('../controllers/parentsController');

// All parent routes should be protected and authorized for 'parent' role
router.use(protect, authorize('parent'));

router.get('/students', parentController.getMyStudents);
router.get('/students/:admissionNumber/profile', parentController.getStudentProfileForParent);
router.get('/deadlines', parentController.getFeeDeadlines);
router.get('/payments/generate-receipt/:paymentId', parentController.generateReceiptForParent); // NEW: Receipt Generation route

module.exports = router;
