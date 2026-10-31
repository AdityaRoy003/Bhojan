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
        // Validate amount strictly
        const parsedAmount = Number(amount);
        if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 10 || parsedAmount > 50000) {
            return res.status(400).json({ success: false, message: 'Invalid top-up amount. Minimum is ₹10 and maximum is ₹50,000.' });
        }

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

// Redeem Gift Card
exports.redeemGiftCard = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, message: 'Valid gift card code is required' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const userId = req.user.id || req.user._id;

        // Verify if this gift card was already redeemed by ANY user
        const existingTxn = await Transaction.findOne({
            type: 'GiftCard',
            description: new RegExp(normalizedCode, 'i')
        });

        if (existingTxn) {
            return res.status(400).json({ success: false, message: 'This gift card has already been redeemed' });
        }

        // Whitelisted promotional gift cards with set denominations
        const VALID_GIFT_CARDS = {
            'BHOJAN50': 50,
            'BHOJAN100': 100,
            'BHOJANWELCOME': 100,
            'BHOJANFESTIVAL': 200,
            'BHOJAN500': 500
        };

        const amount = VALID_GIFT_CARDS[normalizedCode];
        if (!amount) {
            return res.status(400).json({ success: false, message: 'Invalid or expired gift card code' });
        }

        const user = await User.findById(userId);
        user.walletBalance = (user.walletBalance || 0) + amount;
        user.bhojanMoney = (user.bhojanMoney || 0) + amount;
        await user.save();

        await Transaction.create({
            user: userId,
            type: 'GiftCard',
            amount,
            status: 'Completed',
            paymentMethod: 'GiftCard',
            description: `Gift card redeemed: ${normalizedCode}`
        });

        return res.status(200).json({
            success: true,
            message: `🎉 ₹${amount} added to your wallet!`,
            balance: user.walletBalance
        });
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
