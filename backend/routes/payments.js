const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentsController');

// Middleware to capture raw body for webhook verification
router.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.includes('/webhook')) {
            req.rawBody = buf;
        }
    }
}));

// Payment Recording & Retrieval
// ============================

router.post(
  '/record',
  protect, // Auth middleware
  paymentController.recordPayment
);

// 🌟 Record IN-KIND payments (Produce)
router.post(
  '/record-in-kind',
  protect,
  paymentController.recordInKindPayment
);


// router.get('/student/:admissionNumber', 
//     protect, 
//     authorize(['bursar', 'admin', 'director']), 
//     paymentController.getStudentPayments
// );

router.get('/generate-receipt/:paymentId', 
    protect, 
    authorize(['bursar', 'admin', 'director']), 
    paymentController.generateReceipt
);


// Paystack Integration
// ====================
router.post('/initialize-paystack', 
    protect, 
    authorize('parent'), 
    paymentController.initializePaystackTransaction
);

router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handlePaystackWebhook);




router.get('/pending-in-kind', 
    protect, 
    authorize(['bursar', 'admin', 'director']), 
    paymentController.getPendingInKind
);

router.post('/link-pending', 
    protect, 
    authorize(['bursar', 'admin', 'director']), 
    paymentController.linkPendingPayment
);

// router.post('/confirm-pending/:paymentId', 
//     protect, 
//     authorize(['bursar', 'admin', 'director']), 
//     paymentController.confirmPendingPayment
// );
router.get('/pending', protect, paymentController.getPendingPayments);

// Confirm pending payment
router.post('/confirm-pending/:id', protect, paymentController.confirmPendingPayment);

// Additional utility endpoint
router.get('/pending/count', 
    protect, 
    // authorize(['bursar', 'admin', 'director']), 
    async (req, res) => {
        try {
            const count = await PendingPayment.countDocuments({ status: 'pending' });
            res.json({ count });
        } catch (error) {
            res.status(500).send('Internal Server Error');
        }
    }
);

module.exports = router;