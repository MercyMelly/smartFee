const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');

router.post('/add', paymentsController.addPayment);
router.get('/student/:studentId', paymentsController.getPaymentsByStudent);
router.get('/today', paymentsController.getTodayPayments);
router.get('/pending-produce', paymentsController.getPendingProduce);
// router.get('/filter',paymentsController.filterPayments);
router.get('/receipt/:referenceNumber', paymentsController.getPaymentByReferenceNumber);



module.exports = router;
