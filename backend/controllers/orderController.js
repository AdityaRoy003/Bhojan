const crypto = require('crypto');
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
        const Item = require('../models/Item');
        const user = await User.findById(req.user.id);

        if (!['Customer', 'User', 'Admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only customers can place orders' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
        }

        // Validate items against DB prices to prevent client-side price tampering
        const mongoose = require('mongoose');
        const itemIds = items.map(i => (i.item || i._id)?.toString()).filter(Boolean);
        const validObjectIds = itemIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        const dbItems = validObjectIds.length > 0 ? await Item.find({ _id: { $in: validObjectIds } }) : [];
        const dbItemMap = {};
        dbItems.forEach(di => { dbItemMap[di._id.toString()] = di; });

        // Whitelist of valid promotional quick add-ons with server-enforced pricing
        const VERIFIED_QUICK_ADDONS = {
            'addon_gulab_jamun': { name: 'Gulab Jamun (2 Pcs)', price: 60, image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=200' },
            'addon_cold_drink': { name: 'Chilled Coke Can (300ml)', price: 40, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200' },
            'addon_lassi': { name: 'Punjabi Sweet Lassi', price: 55, image: 'https://images.unsplash.com/photo-1571006682875-c9f285223364?q=80&w=200' },
            'addon_brownie': { name: 'Choco Walnut Brownie', price: 85, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=200' },
            'addon_ice_cream': { name: 'Vanilla Sundae Scoop', price: 50, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=200' },
            'addon_extra_chutney': { name: 'Mint Chutney Dip', price: 20, image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=200' },
            'addon_roasted_papad': { name: 'Roasted Masala Papad (2 Pcs)', price: 30, image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=200' }
        };

        let calculatedSubtotal = 0;
        const verifiedItems = [];

        for (const it of items) {
            const itId = (it.item || it._id)?.toString();
            const dbItem = itId && dbItemMap[itId];
            const qty = Math.max(1, parseInt(it.quantity) || 1);
            
            if (dbItem) {
                // Calculate base price + variant + add-ons
                let itemPrice = Number(dbItem.price) || 0;
                if (it.selectedVariant && it.selectedVariant.price) {
                    itemPrice += Number(it.selectedVariant.price) || 0;
                }
                if (Array.isArray(it.selectedAddOns)) {
                    for (const addon of it.selectedAddOns) {
                        itemPrice += Number(addon.price) || 0;
                    }
                }
                calculatedSubtotal += itemPrice * qty;

                verifiedItems.push({
                    item: dbItem._id,
                    name: dbItem.name,
                    price: itemPrice,
                    quantity: qty,
                    image: dbItem.image,
                    note: it.note || '',
                    selectedVariant: it.selectedVariant || undefined,
                    selectedAddOns: Array.isArray(it.selectedAddOns) ? it.selectedAddOns : [],
                    cookingInstructions: it.cookingInstructions || it.note || ''
                });
            } else if (itId && VERIFIED_QUICK_ADDONS[itId]) {
                // Verified quick add-on with immutable server-enforced price
                const addonDef = VERIFIED_QUICK_ADDONS[itId];
                calculatedSubtotal += addonDef.price * qty;

                verifiedItems.push({
                    item: new mongoose.Types.ObjectId(),
                    name: addonDef.name,
                    price: addonDef.price,
                    quantity: qty,
                    image: addonDef.image,
                    note: it.note || '',
                    selectedVariant: undefined,
                    selectedAddOns: [],
                    cookingInstructions: it.cookingInstructions || it.note || ''
                });
            } else {
                // Unknown or unverified item ID — reject to prevent injection of fake dishes or tampered prices
                logger.warn(`[SECURITY] Rejected unverified item ID ${itId} submitted by user ${user._id}`);
                return res.status(400).json({
                    success: false,
                    message: `Item '${it.name || itId}' could not be verified in the restaurant menu.`
                });
            }
        }

        // Server-Side Coupon Verification
        let verifiedCouponDiscount = 0;
        if (couponCode) {
            const Coupon = require('../models/Coupon');
            const upperCode = String(couponCode).trim().toUpperCase();

            // 1. Check Personal Rewards wallet
            const userCoupon = user.coupons?.find(c => c && c.code && c.code.toUpperCase() === upperCode && !c.isUsed);
            if (userCoupon) {
                if (!userCoupon.expiresAt || new Date() <= userCoupon.expiresAt) {
                    if (userCoupon.type === 'free_delivery') {
                        verifiedCouponDiscount = Number(deliveryFee) || 30;
                    } else {
                        verifiedCouponDiscount = Math.min(Number(userCoupon.value) || 0, calculatedSubtotal);
                    }
                }
            } else {
                // 2. Check Global/Shop Coupons
                const globalCoupon = await Coupon.findOne({ code: upperCode, isActive: true });
                if (globalCoupon && (!globalCoupon.validUntil || new Date() <= globalCoupon.validUntil)) {
                    if (calculatedSubtotal >= (globalCoupon.minOrderValue || 0)) {
                        if (globalCoupon.discountType === 'Percentage') {
                            let discount = (calculatedSubtotal * globalCoupon.value) / 100;
                            if (globalCoupon.maxDiscount) {
                                discount = Math.min(discount, globalCoupon.maxDiscount);
                            }
                            verifiedCouponDiscount = Math.min(discount, calculatedSubtotal);
                        } else {
                            verifiedCouponDiscount = Math.min(Number(globalCoupon.value) || 0, calculatedSubtotal);
                        }
                    }
                }
            }
        }

        // Calculate expected order total server-side
        const verifiedDeliveryFee = Number(deliveryFee) || 0;
        const verifiedPlatformFee = 10;
        const verifiedTax = Math.round(calculatedSubtotal * 0.05); // 5% GST
        const verifiedTip = Math.max(0, Number(req.body.tipAmount) || 0);

        let serverOrderTotal = calculatedSubtotal + verifiedDeliveryFee + verifiedPlatformFee + verifiedTax + verifiedTip - verifiedCouponDiscount;
        serverOrderTotal = Math.max(0, Math.round(serverOrderTotal));

        // Validate client totalAmount against server calculated total (allow ±₹3 rounding leeway)
        const submittedTotal = Math.round(Number(totalAmount) || 0);
        if (Math.abs(submittedTotal - serverOrderTotal) > 3) {
            logger.warn(`[SECURITY] Price discrepancy detected: User ${user._id} submitted ₹${submittedTotal}, server calculated ₹${serverOrderTotal}`);
            return res.status(400).json({
                success: false,
                message: `Order total verification mismatch. Server computed ₹${serverOrderTotal}, received ₹${submittedTotal}. Please refresh your cart.`
            });
        }

        // Strict Razorpay Payment Verification for Online Orders
        if (paymentMethod === 'Online') {
            const isDev = process.env.NODE_ENV !== 'production';
            const isSimulated = isDev && typeof paymentId === 'string' && paymentId.startsWith('SIMULATED_PAY_');

            if (!isSimulated) {
                if (!orderId || !paymentId || !req.body.razorpay_signature) {
                    return res.status(400).json({
                        success: false,
                        message: 'Payment verification failed: Razorpay order ID, payment ID, and signature are required for online orders.'
                    });
                }

                const secret = process.env.RAZORPAY_KEY_SECRET;
                if (!secret || secret === 'secret_placeholder') {
                    if (!isDev) {
                        logger.error('[SECURITY] Razorpay secret is not configured in production');
                        return res.status(500).json({ success: false, message: 'Payment gateway configuration error' });
                    }
                } else {
                    const body = orderId + '|' + paymentId;
                    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
                    if (expectedSignature !== req.body.razorpay_signature) {
                        logger.warn(`[SECURITY] Invalid Razorpay signature attempt by user ${user._id} for order ${orderId}`);
                        return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature' });
                    }
                }
            }
        }

        let finalAmount = serverOrderTotal;
        let pointsRedeemed = 0;

        // Handle Point Redemption
        if (redeemPoints && user.loyaltyPoints > 0) {
            const maxDiscount = Math.floor(serverOrderTotal * 0.1); // Max 10% discount
            const maxPointsRedeemable = maxDiscount * 10;

            pointsRedeemed = Math.min(user.loyaltyPoints, maxPointsRedeemable);
            const discountAmount = pointsRedeemed / 10;

            finalAmount = Math.max(0, serverOrderTotal - discountAmount);

            // Deduct points
            user.loyaltyPoints -= pointsRedeemed;
        }

        // Calculate Points Earned (1 point per â‚¹10 spent)
        const pointsEarned = Math.floor(finalAmount / 10);
        user.loyaltyPoints += pointsEarned;

        // Update Milestones & Badges safely
        if (!user.milestones) {
            user.milestones = { totalOrders: 0 };
        }
        user.milestones.totalOrders = (user.milestones.totalOrders || 0) + 1;

        if (!Array.isArray(user.badges)) {
            user.badges = [];
        }

        // "First Bite" Badge - 1st Order
        if (user.milestones.totalOrders === 1) {
            user.badges.push({
                name: 'First Bite',
                icon: 'ðŸ”',
                description: 'Completed your first order!',
                earnedAt: new Date()
            });
        }

        // "Foodie" Badge - 5th Order
        if (user.milestones.totalOrders === 5) {
            user.badges.push({
                name: 'Foodie',
                icon: 'ðŸ‘‘',
                description: 'Placed 5 orders. You love food!',
                earnedAt: new Date()
            });
        }

        // Handle Coupon usage for Personal Rewards safely
        if (couponCode && Array.isArray(user.coupons)) {
            const userCoupon = user.coupons.find(c => c && c.code && c.code.toUpperCase() === couponCode.toUpperCase() && !c.isUsed);
            if (userCoupon) {
                userCoupon.isUsed = true;
                logger.info(`Personal coupon ${couponCode} marked as used for user ${user._id}`);
            }
        }

        await user.save();

        // Retrieve shop details to extract coordinates & ensure valid shop ID
        let effectiveShopId = shopId;
        if (!effectiveShopId && verifiedItems.length > 0) {
            const firstDbItem = dbItems[0];
            if (firstDbItem && firstDbItem.shop) {
                effectiveShopId = firstDbItem.shop;
            }
        }

        let shop = null;
        if (effectiveShopId) {
            try {
                shop = await Shop.findById(effectiveShopId);
            } catch (err) {
                logger.warn('[ORDER] Failed to find shop by ID: ' + err.message);
            }
        }

        if (!effectiveShopId && !shop) {
            return res.status(400).json({ success: false, message: 'Restaurant information is missing from the order' });
        }
        
        let restaurantCoords = req.body.restaurantCoords;
        let deliveryCoords = req.body.deliveryCoords;

        if (!restaurantCoords && shop && shop.location?.coordinates && shop.location.coordinates[0] !== 0) {
            restaurantCoords = {
                lat: shop.location.coordinates[1],
                lng: shop.location.coordinates[0]
            };
        }
        if (!restaurantCoords) {
            // Fallback (Noida / Delhi region)
            restaurantCoords = { lat: 28.5355, lng: 77.3910 };
        }

        if (!deliveryCoords) {
            // Generate a random delivery coordinate within ~2km of the shop
            const latOffset = (Math.random() - 0.5) * 0.02;
            const lngOffset = (Math.random() - 0.5) * 0.02;
            deliveryCoords = {
                lat: restaurantCoords.lat + latOffset,
                lng: restaurantCoords.lng + lngOffset
            };
        }

        const ALLOWED_PRESETS = ['none', 'leave_at_door', 'dont_ring_bell', 'call_at_gate', 'hand_to_security', 'contactless'];
        const safeDeliveryPreset = ALLOWED_PRESETS.includes(req.body.deliveryPreset) ? req.body.deliveryPreset : 'none';

        const safeScheduledSlot = (Boolean(req.body.isScheduled) && req.body.scheduledSlot) ? {
            date: String(req.body.scheduledSlot.date || ''),
            time: String(req.body.scheduledSlot.time || '')
        } : undefined;

        const newOrder = await Order.create({
            user: req.user.id || req.user._id,
            shop: effectiveShopId || shop?._id,
            items: verifiedItems,
            totalAmount: finalAmount, // Use discounted amount
            tipAmount: Number(req.body.tipAmount) || 0,
            optOutCutlery: Boolean(req.body.optOutCutlery),
            deliveryPreset: safeDeliveryPreset,
            isScheduled: Boolean(req.body.isScheduled),
            scheduledSlot: safeScheduledSlot,
            razorpayOrderId: orderId || null,
            razorpayPaymentId: paymentId || null,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            paymentMethod: paymentMethod || 'Online',
            isPaid: paymentMethod === 'Online',
            instructions: instructions || '',
            deliveryAddress: address || 'Default Address',
            deliveryFee: Number(deliveryFee) || 0,
            platformFee: Number(platformFee) || 0,
            taxAmount: Number(taxAmount) || 0,
            couponCode: couponCode || null,
            couponDiscount: Number(couponDiscount) || 0,
            restaurantCoords,
            deliveryCoords,
            statusHistory: [{
                status: 'Placed',
                timestamp: new Date(),
                updatedBy: req.user.id || req.user._id
            }]
        });

        const { sendNotification } = require('../utils/notificationHelper');
        
        // Notify Customer
        await sendNotification(
            req.user.id,
            'ðŸ›’ Order Placed!',
            `Your order #${newOrder._id.toString().slice(-6).toUpperCase()} has been placed successfully.`,
            'order'
        );

        // Notify Shop Owner
        if (shop && shop.owner) {
            await sendNotification(
                shop.owner,
                'ðŸ³ New Order Received!',
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

        // Populate user details for socket emission safely
        try {
            await newOrder.populate('user', 'fullname email mobile');
        } catch (popErr) {
            logger.warn('[ORDER] Failed to populate user: ' + popErr.message);
        }

        // Notify Shop owner via Socket safely
        const targetShopId = effectiveShopId || shop?._id;
        if (req.io && targetShopId) {
            req.io.to(`shop_${targetShopId}`).emit('new_order', newOrder);
        } else if (global.io && targetShopId) {
            global.io.to(`shop_${targetShopId}`).emit('new_order', newOrder);
        }
    } catch (error) {
        logger.error('[ORDER] Failed to place order: ' + error.message, { stack: error.stack });
        console.error('Order placement server error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while placing order' });
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

        // Verify authorization: Admin, Shop Owner, or assigned Delivery Partner
        const Shop = require('../models/Shop');
        const shop = await Shop.findById(order.shop);

        const isOwner = shop && shop.owner ? shop.owner.toString() === req.user._id.toString() : false;
        const isAdmin = req.user.role === 'Admin';
        const isAssignedDelivery = order.deliveryPartner?.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner && !isAssignedDelivery) {
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
        let title = 'ðŸ“¦ Order Update';
        let message = `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now: ${status}`;

        if (status === 'Preparing') {
            title = 'ðŸ³ Order Accepted';
            message = `The kitchen has started preparing your order from ${shop.name}!`;
        } else if (status === 'Ready') {
            title = 'ðŸ² Order Ready';
            message = `Your order from ${shop.name} is ready for pickup!`;
        } else if (status === 'OutForDelivery' || status === 'Out for Delivery') {
            title = 'ðŸ›µ Out for Delivery';
            message = `Your order from ${shop.name} is out for delivery!`;
        } else if (status === 'Delivered') {
            title = 'ðŸ½ï¸ Order Delivered';
            message = `Your order from ${shop.name} has been delivered. Enjoy your meal!`;
        } else if (status === 'Cancelled') {
            title = 'âŒ Order Cancelled';
            message = `Your order from ${shop.name} has been cancelled.`;
        }

        await sendNotification(order.user, title, message, 'order');

        // Emit socket events for Order Tracking screen
        await order.populate('deliveryPartner', 'fullname mobile');
        const statusPayload = {
            orderId: order._id,
            status,
            orderStatus: status,
            deliveryPartner: order.deliveryPartner
        };
        req.io.to(`order_${order._id}`).emit('status_update', statusPayload);
        req.io.to(`track_${order._id}`).emit('status_update', statusPayload);
        req.io.to(`user_${order.user}`).emit('status_update', statusPayload);

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

        // Customer Notification Handling:
        // As requested: Other statuses (Placed, Preparing, Ready, OutForDelivery, Cancelled) are notified
        // strictly via in-app notifications & socket events (already saved and emitted above).
        // The confirmation email with all items and invoice details is sent ONLY upon successful delivery!
        if (status === 'Delivered') {
            try {
                const User = require('../models/User');
                const customer = await User.findById(order.user);

                if (customer && customer.email) {
                    await order.populate('items.item', 'name price image');
                    await order.populate('shop', 'name address city');
                    await order.populate('deliveryPartner', 'fullname mobile');

                    await sendEmail({
                        email: customer.email,
                        subject: `Bhojan: Order Delivered & Receipt #${order._id.toString().slice(-6).toUpperCase()}`,
                        message: `Hi ${customer.fullname}, your order has been delivered!`,
                        html: emailTemplates.deliveryConfirmation
                            ? emailTemplates.deliveryConfirmation({ ...order.toObject(), user: customer, shop })
                            : emailTemplates.orderConfirmation({ ...order.toObject(), user: customer, shop })
                    });

                    if (customer.mobile) {
                        await sendSMS({
                            mobile: customer.mobile,
                            message: `Bhojan: Your order #${order._id.toString().slice(-6).toUpperCase()} from ${shop?.name || 'Bhojan'} has been DELIVERED! Enjoy your meal.`
                        });
                    }
                }
            } catch (notifErr) {
                console.error('Delivery Confirmation Email Error:', notifErr.message);
            }
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
            $or: [
                { deliveryPartner: { $exists: false } },
                { deliveryPartner: null }
            ],
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
            return res.status(400).json({ success: false, message: 'Order already assigned to another partner' });
        }

        order.deliveryPartner = req.user._id;
        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status: order.orderStatus,
            timestamp: new Date(),
            updatedBy: req.user._id
        });
        await order.save();

        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if (user) {
            user.deliverySpecs.totalOffered = (user.deliverySpecs.totalOffered || 0) + 1;
            const rejectedCount = user.deliverySpecs.rejectedOrders?.length || 0;
            const acceptedCount = Math.max(0, user.deliverySpecs.totalOffered - rejectedCount);
            if (user.deliverySpecs.totalOffered > 0) {
                user.deliverySpecs.acceptanceRate = Math.round((acceptedCount / user.deliverySpecs.totalOffered) * 100);
            }
            await user.save();
        }

        await order.populate('deliveryPartner', 'fullname mobile');
        await order.populate('shop', 'name address city location');
        await order.populate('user', 'fullname mobile');

        const partnerInfo = {
            _id: req.user._id,
            fullname: user?.fullname || 'Courier Partner',
            mobile: user?.mobile || ''
        };

        const updatePayload = {
            orderId: order._id,
            status: order.orderStatus,
            orderStatus: order.orderStatus,
            deliveryPartner: partnerInfo
        };

        // Emit real-time updates to Order Tracking room, tracking channel, and customer
        req.io.to(`order_${order._id}`).emit('status_update', updatePayload);
        req.io.to(`track_${order._id}`).emit('status_update', updatePayload);
        req.io.to(`user_${order.user?._id || order.user}`).emit('order_notification', {
            message: `Delivery partner ${user?.fullname || 'Courier'} has been assigned to your order.`,
            orderId: order._id,
            deliveryPartner: partnerInfo
        });

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

// ðŸ“ Geofencing: Partner Arrived at Restaurant
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

// ðŸ§¾ Proof of Delivery: Partner marking as Delivered
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

// ðŸ§‘âš–ï¸ Dispute Resolution: Partner raising a dispute
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

// ðŸ“¦ Smart Zone Management: Fetch zones
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

        // Restore redeemed loyalty points or refund online payment to Bhojan Money wallet
        try {
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (user) {
                let updated = false;
                if (order.pointsRedeemed && order.pointsRedeemed > 0) {
                    user.loyaltyPoints = (user.loyaltyPoints || 0) + order.pointsRedeemed;
                    updated = true;
                }
                if (order.paymentMethod === 'Online' && order.paymentStatus === 'Completed') {
                    user.bhojanMoney = (user.bhojanMoney || 0) + (order.totalAmount || 0);
                    updated = true;
                }
                if (updated) {
                    await user.save();
                }
            }
        } catch (walletErr) {
            logger.warn(`[ORDER] Wallet/points restoration warning on cancel: ${walletErr.message}`);
        }

        // Notify Shop owner, customer, and order rooms via Socket
        if (req.io) {
            const shopId = order.shop?.id || order.shop?._id || order.shop;
            req.io.to(`shop_${shopId}`).emit('status_update', { status: 'Cancelled', orderId: order._id });
            req.io.to(`order_${order._id}`).emit('orderStatusChanged', { status: 'Cancelled', orderId: order._id });
            req.io.to(`user_${userId}`).emit('order_cancelled', { orderId: order._id });
        }

        logger.info(`[ORDER] Order ${orderId} cancelled successfully by User ${authUserId}`);
        res.status(200).json({ success: true, message: 'Order cancelled successfully' });

    } catch (error) {
        logger.error(`[ORDER] Cancel error: ${error.message}`);
        res.status(500).json({ success: false, message: `System error: ${error.message}` });
    }
};
