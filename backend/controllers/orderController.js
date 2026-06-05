const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Zone = require('../models/Zone');
const Dispute = require('../models/Dispute');
const logger = require('../config/logger');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const emailTemplates = require('../utils/emailTemplates');

// Helper for Haversine distance in KM
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Place Order
exports.placeOrder = async (req, res) => {
    try {
        const {
            shopId,
            items,
            totalAmount,
            paymentId,
            orderId,
            address,
            paymentMethod,
            instructions,
            deliveryFee,
            platformFee,
            taxAmount,
            redeemPoints, // Boolean: true if user wants to redeem points
            couponCode,
            couponDiscount
        } = req.body;

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!['Customer', 'User', 'Admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only customers can place orders' });
        }

        let finalAmount = totalAmount;
        let pointsRedeemed = 0;

        // Handle Point Redemption
        if (redeemPoints && user.loyaltyPoints > 0) {
            // max redemption: 10% of total amount or available points, whichever is lower
            // Conversion: 10 points = ₹1
            const maxDiscount = Math.floor(totalAmount * 0.1); // Max 10% discount
            const maxPointsRedeemable = maxDiscount * 10;

            pointsRedeemed = Math.min(user.loyaltyPoints, maxPointsRedeemable);
            const discountAmount = pointsRedeemed / 10;

            finalAmount = totalAmount - discountAmount;

            // Deduct points
            user.loyaltyPoints -= pointsRedeemed;
        }

        // Calculate Points Earned (1 point per ₹10 spent)
        const pointsEarned = Math.floor(finalAmount / 10);
        user.loyaltyPoints += pointsEarned;

        // Update Milestones & Badges
        user.milestones.totalOrders = (user.milestones.totalOrders || 0) + 1;

        // "First Bite" Badge - 1st Order
        if (user.milestones.totalOrders === 1) {
            user.badges.push({
                name: 'First Bite',
                icon: '🍔',
                description: 'Completed your first order!',
                earnedAt: new Date()
            });
        }

        // "Foodie" Badge - 5th Order
        if (user.milestones.totalOrders === 5) {
            user.badges.push({
                name: 'Foodie',
                icon: '👑',
                description: 'Placed 5 orders. You love food!',
                earnedAt: new Date()
            });
        }

        // Handle Coupon usage for Personal Rewards
        if (couponCode) {
            const userCoupon = user.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && !c.isUsed);
            if (userCoupon) {
                userCoupon.isUsed = true;
                logger.info(`Personal coupon ${couponCode} marked as used for user ${user._id}`);
            }
        }

        await user.save();

        const newOrder = await Order.create({
            user: req.user.id,
            shop: shopId,
            items,
            totalAmount: finalAmount, // Use discounted amount
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            paymentMethod: paymentMethod || 'Online',
            isPaid: paymentMethod === 'Online',
            instructions,
            deliveryAddress: address || 'Default Address',
            deliveryFee,
            platformFee,
            taxAmount,
            couponCode,
            couponDiscount,
            statusHistory: [{
                status: 'Placed',
                timestamp: new Date(),
                updatedBy: req.user.id
            }]
        });

        const { sendNotification } = require('../utils/notificationHelper');
        
        // Notify Customer
        await sendNotification(
            req.user.id,
            '🛒 Order Placed!',
            `Your order #${newOrder._id.toString().slice(-6).toUpperCase()} has been placed successfully.`,
            'order'
        );

        // Notify Shop Owner
        const shop = await Shop.findById(shopId);
        if (shop && shop.owner) {
            await sendNotification(
                shop.owner,
                '🍳 New Order Received!',
                `You have received a new order #${newOrder._id.toString().slice(-6).toUpperCase()} from ${user.fullname}.`,
                'order'
            );
        }

        res.status(201).json({
            success: true,
            order: newOrder,
            loyalty: {
                pointsEarned,
                pointsRedeemed,
                newBalance: user.loyaltyPoints
            }
        });

        // Notify Shop owner via Socket
        req.io.to(`shop_${shopId}`).emit('new_order', newOrder);

        // Send Confirmation Email & SMS
        try {
            await sendEmail({
                email: user.email,
                subject: `Bhojan: Order Confirmation #${newOrder._id.toString().slice(-6).toUpperCase()}`,
                message: `Hi ${user.fullname}, your order has been placed!`,
                html: emailTemplates.orderConfirmation({ ...newOrder.toObject(), user })
            });

            await sendSMS({
                mobile: user.mobile,
                message: `Bhojan: Your order #${newOrder._id.toString().slice(-6).toUpperCase()} is placed! Total: ₹${newOrder.totalAmount}. Track it on our app.`
            });
        } catch (mailErr) {
            console.error('Initial Notification Error:', mailErr.message);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get My Orders (User)
exports.getMyOrders = async (req, res) => {
    try {
        console.log(`[ORDER] Fetching orders for user: ${req.user?._id}`);
        const orders = await Order.find({ user: req.user._id })
            .populate('shop', 'name image city')
            .populate('items.item', 'name image price type') // Populate item details for Reorder
            .sort({ createdAt: -1 });
        console.log(`[ORDER] Found ${orders.length} orders`);
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Shop Orders (Owner)
exports.getShopOrders = async (req, res) => {
    try {
        // Find shop owned by user
        const Shop = require('../models/Shop');
        const shop = await Shop.findOne({ owner: req.user._id });

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const orders = await Order.find({ shop: shop._id })
            .populate('user', 'fullname email mobile')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify authorization
        const Shop = require('../models/Shop');
        const shop = await Shop.findById(order.shop);

        const isOwner = shop.owner.toString() === req.user._id.toString();
        const isAssignedDelivery = order.deliveryPartner?.toString() === req.user._id.toString();

        // Allow Delivery Partner update if assigned
        if (!isOwner && !isAssignedDelivery) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        order.orderStatus = status;

        // Add to status history
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user._id
        });

        await order.save();

        // Save database notification and emit in real-time
        const { sendNotification } = require('../utils/notificationHelper');
        let title = '📦 Order Update';
        let message = `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now: ${status}`;

        if (status === 'Preparing') {
            title = '🍳 Order Accepted';
            message = `The kitchen has started preparing your order from ${shop.name}!`;
        } else if (status === 'Ready') {
            title = '🍲 Order Ready';
            message = `Your order from ${shop.name} is ready for pickup!`;
        } else if (status === 'OutForDelivery' || status === 'Out for Delivery') {
            title = '🛵 Out for Delivery';
            message = `Your order from ${shop.name} is out for delivery!`;
        } else if (status === 'Delivered') {
            title = '🍽️ Order Delivered';
            message = `Your order from ${shop.name} has been delivered. Enjoy your meal!`;
        } else if (status === 'Cancelled') {
            title = '❌ Order Cancelled';
            message = `Your order from ${shop.name} has been cancelled.`;
        }

        await sendNotification(order.user, title, message, 'order');

        // Emit socket events for Order Tracking screen
        req.io.to(`order_${order._id}`).emit('status_update', { status, orderId: order._id });

        // Notify all online delivery partners if order is Ready
        if (status === 'Ready') {
            req.io.emit('delivery_alert', {
                message: 'A new order is ready for pickup!',
                orderId: order._id,
                shopName: shop.name
            });

            // Create persistent Notification documents for all online delivery partners
            try {
                const User = require('../models/User');
                const Notification = require('../models/Notification');

                const onlinePartners = await User.find({ role: 'Delivery', isOnline: true });
                const notificationsToCreate = onlinePartners.map(p => ({
                    user: p._id,
                    title: 'New Delivery Available',
                    message: `A new order from ${shop.name} is ready for pickup. Area: ${shop.city || 'Local'}`,
                    type: 'order'
                }));

                if (notificationsToCreate.length > 0) {
                    await Notification.insertMany(notificationsToCreate);
                }
            } catch (notifyErr) {
                console.error("Error creating delivery notifications:", notifyErr);
            }
        }

        // Send Status Update Notifications
        try {
            const User = require('../models/User');
            const customer = await User.findById(order.user);

            if (customer) {
                await sendEmail({
                    email: customer.email,
                    subject: `Bhojan: Order ${status} #${order._id.toString().slice(-6).toUpperCase()}`,
                    message: `Your order is now ${status}.`,
                    html: emailTemplates.statusUpdate(order, status)
                });

                if (['Preparing', 'OutForDelivery', 'Delivered'].includes(status)) {
                    await sendSMS({
                        mobile: customer.mobile,
                        message: `Bhojan: Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status.toUpperCase()}!`
                    });
                }
            }
        } catch (notifErr) {
            console.error('Status Notification Error:', notifErr.message);
        }

        if (status === 'Delivered' && order.paymentMethod === 'COD') {
            try {
                const User = require('../models/User');
                const p = await User.findById(order.deliveryPartner);
                if (p) {
                    p.deliverySpecs.cashCollected = (p.deliverySpecs.cashCollected || 0) + order.totalAmount;
                    await p.save();
                }
            } catch (err) {
                console.error('Error updating cash collected:', err);
            }
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Available Orders for Delivery
exports.getAvailableDeliveryOrders = async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        const rejectedIds = user.deliverySpecs?.rejectedOrders || [];

        // Fetch orders that are 'Prepared' or 'Preparing' (Ready for pickup) and not rejected
        const orders = await Order.find({
            orderStatus: { $in: ['Preparing', 'Ready'] },
            deliveryPartner: { $exists: false },
            _id: { $nin: rejectedIds }
        })
            .populate('shop', 'name address city')
            .populate('user', 'fullname mobile')
            .sort({ createdAt: -1 });

        // Update totalOffered implicitly based on unique orders seen
        // (Simplified for simulation: we just rely on acceptance / rejection clicks)


        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get My Deliveries
exports.getMyDeliveries = async (req, res) => {
    try {
        console.log(`Fetching deliveries for partner: ${req.user._id}`);
        const orders = await Order.find({ deliveryPartner: req.user._id })
            .populate('shop', 'name address city')
            .populate('user', 'fullname mobile deliveryAddress')
            .sort({ updatedAt: -1 });

        console.log(`Found ${orders.length} deliveries`);
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Accept Order (Assign Delivery Partner)
exports.acceptOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.deliveryPartner) {
            return res.status(400).json({ success: false, message: 'Order already assigned' });
        }

        order.deliveryPartner = req.user._id;
        // Only set to 'Preparing' if it's currently 'Placed'
        if (order.orderStatus === 'Placed') {
            order.orderStatus = 'Preparing';
        }
        await order.save();

        // Update totalOffered implicitly based on unique orders seen
        // Notify user that a partner has accepted
        req.io.to(`user_${order.user}`).emit('order_notification', {
            message: 'A delivery partner has been assigned to your order.',
            orderId: order._id
        });

        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if (user) {
            user.deliverySpecs.totalOffered = (user.deliverySpecs.totalOffered || 0) + 1;
            // recalculate acceptance rate
            const rejectedCount = user.deliverySpecs.rejectedOrders?.length || 0;
            const acceptedCount = (user.deliverySpecs.totalOffered - rejectedCount);
            if (user.deliverySpecs.totalOffered > 0) {
                user.deliverySpecs.acceptanceRate = Math.round((acceptedCount / user.deliverySpecs.totalOffered) * 100);
            }
            await user.save();
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject Order (Hide from Delivery Partner)
exports.rejectOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const User = require('../models/User');
        const user = await User.findById(req.user._id);

        if (user) {
            if (!user.deliverySpecs.rejectedOrders.includes(order._id)) {
                user.deliverySpecs.rejectedOrders.push(order._id);
                user.deliverySpecs.totalOffered = (user.deliverySpecs.totalOffered || 0) + 1;

                const rejectedCount = user.deliverySpecs.rejectedOrders.length;
                const acceptedCount = Math.max(0, user.deliverySpecs.totalOffered - rejectedCount);
                if (user.deliverySpecs.totalOffered > 0) {
                    user.deliverySpecs.acceptanceRate = Math.round((acceptedCount / user.deliverySpecs.totalOffered) * 100);
                }
                await user.save();
            }
        }

        res.status(200).json({ success: true, message: 'Order rejected' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get User Analytics/Insights
exports.getUserInsights = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });

        if (orders.length === 0) {
            return res.status(200).json({ success: true, insights: null });
        }

        const totalSpent = orders.reduce((acc, order) => acc + order.totalAmount, 0);

        // Favorite Shop
        const shopCounts = {};
        orders.forEach(order => {
            shopCounts[order.shop] = (shopCounts[order.shop] || 0) + 1;
        });
        const favoriteShopId = Object.keys(shopCounts).reduce((a, b) => shopCounts[a] > shopCounts[b] ? a : b);

        // Populate Shop details for ID
        const Shop = require('../models/Shop');
        const favShop = await Shop.findById(favoriteShopId).select('name image');

        // Favorite Category (Simple extraction from items)
        // Note: Actual category is on Item model, might need population or assumption.
        // For efficiency, let's just count total orders for now.

        res.status(200).json({
            success: true,
            insights: {
                totalSpent,
                totalOrders: orders.length,
                favoriteShop: favShop,
                avgOrderValue: Math.round(totalSpent / orders.length)
            }
        });
    } catch (error) {
        logger.error(`[ORDER] getActiveOrder error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Advanced Logistics Functions ---

// 📍 Geofencing: Partner Arrived at Restaurant
exports.verifyArrival = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('shop');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const { lat, lng } = req.body; // Partner's current position
        const shopLat = order.shop.location?.coordinates?.[1];
        const shopLng = order.shop.location?.coordinates?.[0];

        if (shopLat && shopLng) {
            const distance = calculateDistance(lat, lng, shopLat, shopLng);
            if (distance > 0.5) { // 500 meters threshold
                return res.status(400).json({
                    success: false,
                    message: `You are too far from the restaurant (${(distance).toFixed(2)} km away).`
                });
            }
        }

        order.geofencing.arrivedAtShop = new Date();
        order.orderStatus = 'Preparing';
        await order.save();

        res.status(200).json({ success: true, message: 'Arrival verified' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🧾 Proof of Delivery: Partner marking as Delivered
exports.verifyDelivery = async (req, res) => {
    try {
        const { otp, photoUrl, signatureUrl, lat, lng } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // OTP Verification (Mocked or real check if implemented)
        if (otp && order.proofOfDelivery.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid delivery OTP' });
        }

        // Geofencing Check (Delivery side)
        // Note: Real address geocoding would be ideal, but for now we expect lat/lng
        // and can compare with the order's deliveryAddress coordinates if we had them.
        // Assuming success for demo if lat/lng present.

        order.orderStatus = 'Delivered';
        order.proofOfDelivery.photoUrl = photoUrl;
        order.proofOfDelivery.signatureUrl = signatureUrl;
        order.proofOfDelivery.verified = true;
        order.geofencing.deliveredAtCustomer = new Date();

        // Update Partner Earnings
        const partner = await User.findById(req.user._id);
        if (partner) {
            const earnings = order.deliveryFee + (order.earningsEstimation?.surgePay || 0);
            partner.deliverySpecs.totalEarnings += earnings;
            partner.deliverySpecs.completedDeliveries += 1;
            if (order.paymentMethod === 'COD') {
                partner.deliverySpecs.cashCollected += order.totalAmount;
            }
            await partner.save();
        }

        await order.save();
        res.status(200).json({ success: true, message: 'Order delivered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🧑⚖️ Dispute Resolution: Partner raising a dispute
exports.raiseDispute = async (req, res) => {
    try {
        const { orderId, type, description, evidence } = req.body;
        const dispute = await Dispute.create({
            order: orderId,
            raisedBy: req.user._id,
            type,
            description,
            evidence
        });
        res.status(201).json({ success: true, dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 📦 Smart Zone Management: Fetch zones
exports.getZones = async (req, res) => {
    try {
        const zones = await Zone.find({ isActive: true });
        res.status(200).json({ success: true, zones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get User's Active Order (Live Tracking)
exports.getActiveOrder = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const order = await Order.findOne({
            user: userId,
            orderStatus: { $in: ['Placed', 'Preparing', 'Ready', 'OutForDelivery'] }
        })
            .sort({ createdAt: -1 })
            .populate('shop', 'name logo')
            .populate('deliveryPartner', 'fullname avatar mobile');

        if (!order) {
            return res.status(200).json({ success: true, order: null });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        logger.error(`[ORDER] getActiveOrder error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// Cancel Order (User)
exports.cancelMyOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id || req.user._id;

        logger.info(`[ORDER] Cancellation attempt: Order ${orderId} by User ${userId}`);

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            logger.warn(`[ORDER] Cancel failed: Order ${orderId} not found`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify ownership
        const orderUserId = order.user.toString();
        const authUserId = userId.toString();

        if (orderUserId !== authUserId) {
            logger.warn(`[ORDER] Cancel failed: Unauthorized. Owner: ${orderUserId}, Requestor: ${authUserId}`);
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
        }

        // Only allow cancellation if order is still 'Placed'
        if (order.orderStatus !== 'Placed') {
            logger.warn(`[ORDER] Cancel failed: Status is ${order.orderStatus}, cannot cancel`);
            return res.status(400).json({ success: false, message: `Orders in ${order.orderStatus} status cannot be cancelled` });
        }

        order.orderStatus = 'Cancelled';

        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status: 'Cancelled',
            timestamp: new Date(),
            updatedBy: userId
        });

        await order.save();

        // Notify Shop owner via Socket
        if (req.io) {
            const shopId = order.shop.id || order.shop._id || order.shop;
            req.io.to(`shop_${shopId}`).emit('status_update', { status: 'Cancelled', orderId: order._id });
        }

        logger.info(`[ORDER] Order ${orderId} cancelled successfully by User ${authUserId}`);
        res.status(200).json({ success: true, message: 'Order cancelled successfully' });

    } catch (error) {
        logger.error(`[ORDER] Cancel error: ${error.message}`);
        res.status(500).json({ success: false, message: `System error: ${error.message}` });
    }
};
