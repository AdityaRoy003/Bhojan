const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Create a new subscription
exports.createSubscription = async (req, res) => {
    try {
        const { planType, duration, mealPlan, corporateDetails, paymentId, amountPaid } = req.body;

        const endDate = new Date();
        if (duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
        else endDate.setDate(endDate.getDate() + 7); // Weekly

        const subscription = new Subscription({
            user: req.user.id,
            planType,
            endDate,
            mealPlan,
            corporateDetails,
            paymentId,
            amountPaid
        });

        await subscription.save();

        // Update user Prime status if applicable
        if (planType === 'Prime') {
            await User.findByIdAndUpdate(req.user.id, {
                isPrime: true,
                primeExpiry: endDate
            });
        }

        res.status(201).json({ success: true, subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user subscriptions
exports.getMySubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, subscriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });

        if (subscription.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        subscription.status = 'Cancelled';
        await subscription.save();

        // Update user Prime status if applicable
        if (subscription.planType === 'Prime') {
            await User.findByIdAndUpdate(req.user.id, {
                isPrime: false,
                primeExpiry: null
            });
        }

        res.status(200).json({ success: true, message: 'Subscription cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check Prime eligibility for order
exports.checkPrimeEligibility = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const isPrimeActive = user.isPrime && user.primeExpiry && new Date(user.primeExpiry) > new Date();

        res.status(200).json({
            success: true,
            isPrime: isPrimeActive,
            benefits: isPrimeActive ? {
                freeDelivery: true,
                prioritySupport: true,
                exclusiveDeals: true
            } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
