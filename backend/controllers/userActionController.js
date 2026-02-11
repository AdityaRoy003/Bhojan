const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Toggle Wishlist
exports.toggleWishlist = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);

        const index = user.wishlist.indexOf(itemId);
        if (index === -1) {
            user.wishlist.push(itemId);
        } else {
            user.wishlist.splice(index, 1);
        }

        await user.save();
        res.status(200).json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Initiate Bhojan Money Top-Up
exports.initiateTopUp = async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount * 100, // in paise
            currency: 'INR',
            receipt: `topup_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        const userId = req.user.id || req.user._id;
        // Create a pending transaction
        await Transaction.create({
            user: userId,
            type: 'TopUp',
            amount,
            status: 'Pending',
            paymentMethod: 'Razorpay',
            razorpayOrderId: order.id,
            description: 'Top up Bhojan Money'
        });

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Confirm Top-Up
exports.confirmTopUp = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
            if (transaction && transaction.status === 'Pending') {
                transaction.status = 'Completed';
                transaction.razorpayPaymentId = razorpay_payment_id;
                await transaction.save();

                const userId = req.user.id || req.user._id;
                const user = await User.findById(userId);
                user.bhojanMoney += transaction.amount;
                await user.save();

                return res.status(200).json({ success: true, message: 'Payment successful', balance: user.bhojanMoney });
            }
        }
        res.status(400).json({ success: false, message: 'Invalid signature or transaction' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Redeem Gift Card (Mock implementation)
exports.redeemGiftCard = async (req, res) => {
    try {
        const { code } = req.body;

        // Simple mock: if code starts with BHOJAN it adds 500 balance
        if (code.startsWith('BHOJAN')) {
            const amount = 500;
            const userId = req.user.id || req.user._id;
            const user = await User.findById(userId);
            user.walletBalance += amount;
            await user.save();

            await Transaction.create({
                user: userId,
                type: 'GiftCard',
                amount,
                status: 'Completed',
                paymentMethod: 'GiftCard',
                description: `Gift card redeemed: ${code}`
            });

            return res.status(200).json({ success: true, message: 'Gift card redeemed!', balance: user.walletBalance });
        }

        res.status(400).json({ success: false, message: 'Invalid or expired gift card code' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Wishlist Items
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId).populate('wishlist');
        res.status(200).json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Wallet Transactions
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
