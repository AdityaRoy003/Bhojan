const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Zone = require('../models/Zone');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');
const SystemConfig = require('../models/SystemConfig');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');

// Get Global Platform Stats
exports.getPlatformStats = async (req, res) => {
    try {
        const [totalUsers, totalShops, totalOrders, totalItems] = await Promise.all([
            User.countDocuments(),
            Shop.countDocuments(),
            Order.countDocuments(),
            Item.countDocuments()
        ]);

        const revenueData = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const pendingVerifications = await Shop.countDocuments({
            "owner.businessVerification.status": "Pending"
        });

        // Use populated query for accuracy (though slower)
        const pendingShopsCount = await Shop.find().populate({
            path: 'owner',
            match: { 'businessVerification.status': 'Pending' }
        });
        const actualPending = pendingShopsCount.filter(s => s.owner).length;

        const responseData = {
            success: true,
            stats: {
                totalUsers,
                totalShops,
                totalOrders,
                totalItems,
                totalRevenue: revenueData[0]?.total || 0,
                pendingVerifications: actualPending
            }
        };

        logger.info(`[ADMIN] Stats fetched: users=${totalUsers}, shops=${totalShops}`);

        res.status(200).json(responseData);
    } catch (error) {
        logger.error(`[ADMIN] getPlatformStats error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- USER MANAGEMENT ---

// Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        logger.info(`[ADMIN] getAllUsers count: ${users.length}`);
        res.status(200).json({ success: true, users });
    } catch (error) {
        logger.error(`[ADMIN] getAllUsers error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update User Status (Suspend/Ban)
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId, status, adminNotes } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.status = status;
        if (adminNotes) user.adminNotes = adminNotes;

        // If suspended/banned, clear sessions
        if (status !== 'Active') {
            user.securitySettings.activeSessions = [];
        }

        await user.save();
        res.status(200).json({ success: true, message: `User status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reset User Password
exports.resetUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.securitySettings.activeSessions = []; // Force re-login

        await user.save();
        res.status(200).json({ success: true, message: 'Password reset successful and sessions cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Manage User Role
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.role = role;
        await user.save();

        res.status(200).json({ success: true, message: 'User role updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- SHOP MANAGEMENT ---

// Get All Shops
exports.getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find().populate('owner', 'fullname email mobile businessVerification').sort({ createdAt: -1 });
        res.status(200).json({ success: true, shops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Pending Shop Verifications
exports.getPendingShops = async (req, res) => {
    try {
        const shops = await Shop.find().populate({
            path: 'owner',
            match: { 'businessVerification.status': 'Pending' }
        });
        const pendingShops = shops.filter(shop => shop.owner !== null);
        res.status(200).json({ success: true, shops: pendingShops });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify/Reject Shop
exports.verifyShop = async (req, res) => {
    try {
        const { shopId, status } = req.body;
        const shop = await Shop.findById(shopId).populate('owner');
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        shop.owner.businessVerification.status = status;
        await shop.owner.save();

        res.status(200).json({ success: true, message: `Shop verification status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle Shop Fields (isActive, isFeatured, isLocal)
exports.toggleShopField = async (req, res) => {
    try {
        const { shopId, field } = req.body;
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

        shop[field] = !shop[field];
        await shop.save();
        res.status(200).json({ success: true, message: `Shop ${field} toggled` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- MENU & ITEM OVERSIGHT ---

// Moderate Item
exports.moderateItem = async (req, res) => {
    try {
        const { itemId, status } = req.body;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        item.moderationStatus = status;
        await item.save();
        res.status(200).json({ success: true, message: `Item moderation status: ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Items for Moderation
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.find().populate('shop', 'name').sort({ createdAt: -1 });
        res.status(200).json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ORDER & FINANCIAL OVERSIGHT ---

// Get All Orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'fullname email')
            .populate('shop', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- SYSTEM CONFIG ---

// Get/Update System Config
exports.getSystemConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) config = await SystemConfig.create({});
        res.status(200).json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSystemConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) config = new SystemConfig();

        Object.assign(config, req.body);
        await config.save();
        res.status(200).json({ success: true, message: 'System configuration updated', config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// --- SUPPORT TICKET MANAGEMENT ---

// Get All Support Tickets
exports.getAllSupportTickets = async (req, res) => {
    try {
        const tickets = await require('../models/SupportTicket').find()
            .populate('user', 'fullname email mobile')
            .populate({
                path: 'orderId',
                select: 'totalAmount orderStatus items',
                populate: { path: 'items.item', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Ticket Status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { ticketId, status } = req.body;
        const SupportTicket = require('../models/SupportTicket');

        const ticket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            { status },
            { new: true }
        );

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        res.status(200).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- DELIVERY FLEET MANAGEMENT ---

// Get All Delivery Partners
exports.getAllDeliveryPartners = async (req, res) => {
    try {
        const partners = await User.find({ role: 'Delivery' })
            .select('-password')
            .sort({ 'deliverySpecs.isOnline': -1, updatedAt: -1 });

        res.status(200).json({ success: true, partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Manual Order Assignment
exports.assignOrderManually = async (req, res) => {
    try {
        const { orderId, partnerId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const partner = await User.findById(partnerId);
        if (!partner || partner.role !== 'Delivery') {
            return res.status(400).json({ success: false, message: 'Invalid delivery partner' });
        }

        // Assign partner
        order.deliveryPartner = partnerId;
        order.orderStatus = 'Preparing'; // Set to preparing if assigned manually to proceed
        order.statusHistory.push({
            status: 'Preparing',
            message: `Order manually assigned to ${partner.fullname} by Admin`,
            updatedBy: req.user._id
        });

        await order.save();

        // Notify partner
        // Create notification
        await Notification.create({
            user: partnerId,
            type: 'order',
            title: 'New Manual Assignment',
            message: `You have been manually assigned to Order #${order._id.toString().slice(-6)}`
        });

        res.status(200).json({ success: true, message: 'Order assigned successfully', order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Broadcast Notification
exports.broadcastNotification = async (req, res) => {
    try {
        const { title, message, targetRole, targetArea } = req.body;

        let query = {};
        if (targetRole) query.role = targetRole;
        if (targetArea) query.city = targetArea;

        const users = await User.find(query).select('_id');

        const notifications = users.map(u => ({
            user: u._id,
            type: 'announcement',
            title,
            message
        }));

        await Notification.insertMany(notifications);

        res.status(200).json({
            success: true,
            message: `Broadcast sent to ${users.length} users`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ADVANCED LOGISTICS ADMIN ---

// Get All raised disputes
exports.getAllDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate('order', 'totalAmount orderStatus')
            .populate('raisedBy', 'fullname email mobile role')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, disputes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Resolve a dispute
exports.resolveDispute = async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        dispute.status = status;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolvedBy = req.user._id;
        dispute.resolvedAt = new Date();
        await dispute.save();

        // Notify the user who raised it
        await Notification.create({
            user: dispute.raisedBy,
            type: 'announcement',
            title: 'Dispute Resolved',
            message: `Your dispute regarding Order #${dispute.order.toString().slice(-6)} has been ${status}.`
        });

        res.status(200).json({ success: true, dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Zone Surge Pricing
exports.updateZoneSurge = async (req, res) => {
    try {
        const { currentSurge, demandLevel, isActive } = req.body;
        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

        if (currentSurge !== undefined) zone.currentSurge = currentSurge;
        if (demandLevel !== undefined) zone.demandLevel = demandLevel;
        if (isActive !== undefined) zone.isActive = isActive;

        await zone.save();
        res.status(200).json({ success: true, zone });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new zone
exports.createZone = async (req, res) => {
    try {
        const zone = await Zone.create(req.body);
        res.status(201).json({ success: true, zone });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Promotional / Marketing Email Campaigns
exports.sendCampaignEmail = async (req, res) => {
    try {
        const { campaignType, recipientType, userId, details } = req.body;

        if (!campaignType || !recipientType) {
            return res.status(400).json({ success: false, message: 'Please provide campaignType and recipientType' });
        }

        let users = [];
        if (recipientType === 'single') {
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Please provide a userId for single recipient' });
            }
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            users.push(user);
        } else {
            // Find all active customers/owners
            users = await User.find({ status: 'Active', role: { $in: ['Customer', 'Owner', 'Admin'] } });
        }

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'No users found to send email' });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const user of users) {
            try {
                let html = '';
                let subject = '';

                switch (campaignType) {
                    case 'festival':
                        subject = `🎉 Special Festival Offer for You!`;
                        html = emailTemplates.festivalOffer({ ...details, user });
                        break;
                    case 'spin':
                        subject = `🎡 Spin & Win Food Rewards!`;
                        html = emailTemplates.spinTheWheel({ ...details, user });
                        break;
                    case 'feedback':
                        subject = `🍽️ How was your recent meal?`;
                        html = emailTemplates.feedbackRating({ ...details, orderId: details.orderId || 'recent' });
                        break;
                    case 'prime':
                        subject = `👑 Renew Your Bhojan Prime Membership`;
                        html = emailTemplates.primeMembership({ ...details, user });
                        break;
                    case 'referral':
                        subject = `👥 Invite Friends, Earn Loyalty Rewards!`;
                        html = emailTemplates.referral({ ...details, referralCode: user.referralCode });
                        break;
                    default:
                        return res.status(400).json({ success: false, message: 'Invalid campaign type specified' });
                }

                await sendEmail({
                    email: user.email,
                    subject,
                    html,
                    message: subject
                });
                sentCount++;
            } catch (err) {
                logger.error(`Failed to send campaign email to ${user.email}: ${err.message}`);
                failedCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Campaign email campaign processed: ${sentCount} successfully sent, ${failedCount} failed.`
        });
    } catch (error) {
        logger.error(`[ADMIN] sendCampaignEmail error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

