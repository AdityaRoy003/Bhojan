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
    updateTicketStatus,
    getAllDeliveryPartners,
    assignOrderManually,
    broadcastNotification,
    getAllDisputes,
    resolveDispute,
    updateZoneSurge,
    createZone
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

// Delivery & Assignment Routes
router.get('/delivery/partners', getAllDeliveryPartners);
router.get('/delivery/disputes', getAllDisputes);
router.put('/delivery/dispute/:id', resolveDispute);
router.post('/delivery/zones', createZone);
router.put('/delivery/zone/:id', updateZoneSurge);
router.put('/order/assign', assignOrderManually);

// Notification Routes
router.post('/notifications/broadcast', broadcastNotification);

module.exports = router;
