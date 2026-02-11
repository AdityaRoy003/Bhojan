const User = require('../models/User');

// Spin the wheel and get reward
exports.spinWheel = async (req, res) => {
    try {
        const { prize } = req.body;
        const user = await User.findById(req.user.id);

        // Check if user has spun today
        const lastSpin = user.gamification?.lastSpinDate;
        const today = new Date().setHours(0, 0, 0, 0);

        if (lastSpin && new Date(lastSpin).setHours(0, 0, 0, 0) === today) {
            return res.status(400).json({ success: false, message: 'You can only spin once per day!' });
        }

        // Generate coupon code
        const couponCode = `SPIN${Date.now()}`;

        // Update user gamification data
        if (!user.gamification) user.gamification = {};
        user.gamification.lastSpinDate = new Date();
        user.gamification.totalSpins = (user.gamification.totalSpins || 0) + 1;

        // Add coupon to user (simplified - in production, create a Coupon model)
        if (!user.coupons) user.coupons = [];
        user.coupons.push({
            code: couponCode,
            type: prize.value === 'free_delivery' ? 'free_delivery' : 'discount',
            value: prize.value,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await user.save();

        res.status(200).json({
            success: true,
            coupon: { code: couponCode, prize }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user challenges
exports.getChallenges = async (req, res) => {
    try {
        const challenges = [
            {
                id: 1,
                title: 'Cuisine Explorer',
                description: 'Order from 5 different cuisines',
                progress: 2,
                target: 5,
                reward: '₹100 OFF',
                icon: '🌍'
            },
            {
                id: 2,
                title: 'Weekend Warrior',
                description: 'Order 3 times this weekend',
                progress: 1,
                target: 3,
                reward: 'Free Delivery',
                icon: '⚡'
            },
            {
                id: 3,
                title: 'Local Hero',
                description: 'Support 3 local gems',
                progress: 0,
                target: 3,
                reward: '20% OFF',
                icon: '❤️'
            }
        ];

        res.status(200).json({ success: true, challenges });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
