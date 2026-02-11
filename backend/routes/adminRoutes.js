const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');
const {
    getPlatformStats,
    getAllUsers,
    getPendingShops,
    verifyShop,
    updateUserRole,
    updateUserStatus,
    resetUserPassword,
    getAllShops,
    toggleShopField,
    moderateItem,
    getAllItems,
    getAllOrders,
    getSystemConfig,
    updateSystemConfig,
    getAllSupportTickets,
    updateTicketStatus
} = require('../controllers/adminController');

// All routes are protected and restricted to Admin only
router.use(isAuthenticated, authorizeRoles('Admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/user/status', updateUserStatus);
router.put('/user/password-reset', resetUserPassword);
router.put('/user/role', updateUserRole);

router.get('/shops', getAllShops);
router.get('/shops/pending', getPendingShops);
router.put('/shop/verify', verifyShop);
router.put('/shop/toggle-field', toggleShopField);

router.get('/items', getAllItems);
router.put('/item/moderate', moderateItem);

router.get('/orders', getAllOrders);

router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);

// Support Routes
router.get('/tickets', getAllSupportTickets);
router.put('/ticket/status', updateTicketStatus);

module.exports = router;
