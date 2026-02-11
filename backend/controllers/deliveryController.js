const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Toggle Delivery Partner Online Status
// @route   PUT /api/delivery/toggle-online
// @access  Private (Delivery)
exports.toggleOnline = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.deliverySpecs.isOnline = !user.deliverySpecs.isOnline;
        await user.save();

        res.status(200).json({
            success: true,
            isOnline: user.deliverySpecs.isOnline
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Delivery Partner Location
// @route   PUT /api/delivery/location
// @access  Private (Delivery)
exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        // Update user location
        await User.findByIdAndUpdate(req.user._id, {
            'deliverySpecs.currentLocation': { lat, lng }
        });

        // Update active orders for real-time tracking
        await Order.updateMany(
            { deliveryPartner: req.user._id, orderStatus: 'OutForDelivery' },
            {
                'deliveryPartnerLocation': {
                    latitude: lat,
                    longitude: lng,
                    lastUpdated: Date.now()
                }
            }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Delivery Partner Stats
// @route   GET /api/delivery/stats
// @access  Private (Delivery)
exports.getStats = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Calculate today's earnings
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaysOrders = await Order.find({
            deliveryPartner: req.user._id,
            orderStatus: 'Delivered',
            updatedAt: { $gte: startOfDay }
        });

        const todaysEarnings = todaysOrders.reduce((sum, order) => sum + (order.totalAmount * 0.1), 0);

        res.status(200).json({
            success: true,
            stats: {
                balance: user.deliverySpecs.balance,
                totalEarnings: user.deliverySpecs.totalEarnings,
                todaysEarnings: Math.round(todaysEarnings),
                completedDeliveries: user.deliverySpecs.completedDeliveries,
                rating: user.deliverySpecs.rating,
                isOnline: user.deliverySpecs.isOnline
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Complete Delivery & Process Commission
// @route   PUT /api/delivery/complete/:id
// @access  Private (Delivery)
exports.completeDelivery = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryPartner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized for this order' });
        }

        order.orderStatus = 'Delivered';
        order.statusHistory.push({
            status: 'Delivered',
            updatedBy: req.user._id
        });
        await order.save();

        // Financial processing (10% commission)
        const commission = order.totalAmount * 0.1;

        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                'deliverySpecs.balance': commission,
                'deliverySpecs.totalEarnings': commission,
                'deliverySpecs.completedDeliveries': 1
            }
        });

        res.status(200).json({
            success: true,
            message: 'Delivery completed successfully',
            commission: commission.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Delivery Partner Profile (KYC, Vehicle, Language)
// @route   PUT /api/delivery/profile
// @access  Private (Delivery)
exports.updateProfile = async (req, res) => {
    try {
        const { kyc, vehicle, language } = req.body;
        const user = await User.findById(req.user._id);

        if (kyc) {
            user.deliverySpecs.kyc = { ...user.deliverySpecs.kyc, ...kyc };
            // If all KYC docs are provided, set status to Pending
            if (user.deliverySpecs.kyc.aadhaar && user.deliverySpecs.kyc.pan && user.deliverySpecs.kyc.dl) {
                user.deliverySpecs.kyc.status = 'Pending';
            }
        }
        if (vehicle) user.deliverySpecs.vehicle = { ...user.deliverySpecs.vehicle, ...vehicle };
        if (language) user.deliverySpecs.language = language;

        await user.save();
        res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Wellness Stats (Steps, Water)
// @route   PUT /api/delivery/wellness
// @access  Private (Delivery)
exports.updateWellness = async (req, res) => {
    try {
        const { dailySteps, waterIntake } = req.body;
        const user = await User.findById(req.user._id);

        if (dailySteps !== undefined) user.deliverySpecs.health.dailySteps = dailySteps;
        if (waterIntake !== undefined) user.deliverySpecs.health.waterIntake = waterIntake;
        user.deliverySpecs.health.lastWellnessUpdate = Date.now();

        await user.save();
        res.status(200).json({ success: true, message: 'Wellness updated successfully', health: user.deliverySpecs.health });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
