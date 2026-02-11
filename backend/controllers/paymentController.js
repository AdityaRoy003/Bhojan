const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Use env in prod
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// Create Order
exports.createPaymentOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in smallest currency unit (paise)

        const options = {
            amount: amount * 100, // INR to Paise
            currency: "INR",
            receipt: "order_rcptid_" + Date.now()
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ success: true, message: 'Payment Verified' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid Signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get Razorpay Key
exports.getRazorpayKey = async (req, res) => {
    res.status(200).json({ success: true, key: process.env.RAZORPAY_KEY_ID });
};

// Validate Coupon
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const Coupon = require('../models/Coupon');

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'Coupon is inactive' });
        }

        if (new Date() > coupon.expiresAt) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (orderTotal < coupon.minOrderValue) {
            return res.status(400).json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` });
        }

        // Calculate Discount
        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discount = (orderTotal * coupon.value) / 100;
            if (coupon.maxDiscountAmount) {
                discount = Math.min(discount, coupon.maxDiscountAmount);
            }
        } else {
            discount = coupon.value;
        }

        res.status(200).json({
            success: true,
            discount: Math.floor(discount),
            couponCode: coupon.code,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
