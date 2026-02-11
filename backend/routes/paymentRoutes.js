const express = require('express');
const { createPaymentOrder, verifyPayment, getRazorpayKey, validateCoupon } = require('../controllers/paymentController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.post('/payment/create', isAuthenticated, createPaymentOrder);
router.post('/payment/verify', isAuthenticated, verifyPayment);
router.get('/payment/key', isAuthenticated, getRazorpayKey);
router.post('/payment/apply-coupon', isAuthenticated, validateCoupon);

module.exports = router;
