const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assuming your auth middleware path is correct

const {
    recordPayment,
    getTodayPayments,
    getPendingProduce,
    getOutstandingFeesByClass,
    getTotalOutstandingFees,
    getPaymentByReferenceNumber,
    getPaymentsByStudent,
    generateReceipt
} = require('../controllers/paymentsController');

// Apply auth middleware to routes that require authentication
router.post('/record', auth, recordPayment); // <--- FIX: Added 'auth' middleware here!
router.get('/today', auth, getTodayPayments);
router.get('/pending-produce', auth, getPendingProduce);
router.get('/outstanding/class', auth, getOutstandingFeesByClass);
router.get('/outstanding/total', auth, getTotalOutstandingFees);
router.get('/receipt/:referenceNumber', auth, getPaymentByReferenceNumber); // Assuming this is for viewing a receipt
router.get('/student/:admissionNumber', auth, getPaymentsByStudent);
router.get('/generate-receipt/:paymentId', auth, generateReceipt); // For generating PDF receipt

module.exports = router;
