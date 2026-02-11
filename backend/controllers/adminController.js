const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Item = require('../models/Item');
const SystemConfig = require('../models/SystemConfig');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

// Get Global Platform Stats
exports.getPlatformStats = async (req, res) => {
    try {
        const redisClient = require('../config/redisClient');
        const CACHE_KEY = 'admin:platformStats';

        if (redisClient && redisClient.isOpen) {
            const cached = await redisClient.get(CACHE_KEY);
            if (cached) return res.json(JSON.parse(cached));
        }

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

        // Cache for 2 minutes (analytics don't need to be instant-instant)
        if (redisClient && redisClient.isOpen) {
            await redisClient.setEx(CACHE_KEY, 120, JSON.stringify(responseData));
        }

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
