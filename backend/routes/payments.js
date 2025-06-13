const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');

router.post('/record', paymentsController.recordPayment);
router.get('/:admissionNumber', paymentsController.getPaymentsByStudent);
router.get('/generate-receipt/:paymentId', paymentsController.generateReceipt);
router.get('/today', paymentsController.getTodayPayments);
router.get('/pending-produce', paymentsController.getPendingProduce);

module.exports = router;
