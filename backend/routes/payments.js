const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');

router.post('/add', paymentsController.addPayment);
router.get('/student/:studentId', paymentsController.getPaymentsByStudent);
router.get('/today', paymentsController.getTodayPayments);
router.get('/pending-produce', paymentsController.getPendingProduce);

module.exports = router;
