const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// ─── Guard: fail fast if credentials are missing ─────────────────────────────
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET ||
    RAZORPAY_KEY_ID === 'rzp_test_placeholder' ||
    RAZORPAY_KEY_SECRET === 'secret_placeholder') {
    console.error(
        '[Razorpay] ⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing/placeholder.\n' +
        '           Open backend/.env and set your real Razorpay credentials, then restart the server.'
    );
}

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

// ─── Create Order ─────────────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR (will be converted to paise)

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(amount * 100), // INR → paise
            currency: 'INR',
            receipt: 'order_rcptid_' + Date.now(),
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('[Razorpay] createPaymentOrder error:', error);
        res.status(500).json({
            success: false,
            message: error?.error?.description || error.message || 'Failed to create payment order',
        });
    }
};

// ─── Verify Payment ───────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment fields' });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.status(200).json({ success: true, message: 'Payment Verified' });
        } else {
            console.warn('[Razorpay] verifyPayment: signature mismatch');
            res.status(400).json({ success: false, message: 'Invalid Signature' });
        }
    } catch (error) {
        console.error('[Razorpay] verifyPayment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Payment verification failed',
        });
    }
};

// ─── Get Razorpay Public Key ──────────────────────────────────────────────────
exports.getRazorpayKey = async (req, res) => {
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
        return res.status(500).json({
            success: false,
            message: 'Razorpay Key ID is not configured on the server. Please set RAZORPAY_KEY_ID in backend/.env',
        });
    }
    res.status(200).json({ success: true, key: RAZORPAY_KEY_ID });
};

// ─── Validate Coupon ──────────────────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderTotal, shopId } = req.body;
        const User = require('../models/User');
        const Coupon = require('../models/Coupon');

        const upperCode = code.toUpperCase();

        // 1. Check User's personal coupons wallet (e.g., from Spin-the-Wheel)
        const user = await User.findById(req.user.id);
        const personalCoupon = user.coupons?.find(c => c.code.toUpperCase() === upperCode);

        if (personalCoupon) {
            if (personalCoupon.isUsed) {
                return res.status(400).json({ success: false, message: 'Coupon already used' });
            }
            if (new Date() > personalCoupon.expiresAt) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            let discount = 0;
            if (personalCoupon.type === 'free_delivery') {
                discount = 30; // Match hardcoded delivery fee in Checkout.jsx
            } else {
                discount = Number(personalCoupon.value) || 0;
            }

            return res.status(200).json({
                success: true,
                discount: Math.floor(discount),
                couponCode: personalCoupon.code,
                message: personalCoupon.type === 'free_delivery' ? 'Free Delivery applied!' : 'Personal discount applied!',
            });
        }

        // 2. Fall back to global Shop Coupons
        const coupon = await Coupon.findOne({ code: upperCode });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        if (shopId && coupon.shop.toString() !== shopId) {
            return res.status(400).json({ success: false, message: 'Coupon not valid for this shop' });
        }

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'Coupon is inactive' });
        }

        if (new Date() > coupon.validUntil) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (orderTotal < coupon.minOrderValue) {
            return res.status(400).json({ success: false, message: `Minimum order value ₹${coupon.minOrderValue} required` });
        }

        // Calculate Discount
        let discount = 0;
        if (coupon.discountType === 'Percentage') {
            discount = (orderTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.value;
        }

        res.status(200).json({
            success: true,
            discount: Math.floor(discount),
            couponCode: coupon.code,
            message: 'Coupon applied successfully',
        });

    } catch (error) {
        console.error('[Razorpay] validateCoupon error:', error);
        res.status(500).json({ success: false, message: error.message || 'Coupon validation failed' });
    }
};
