const express = require('express');
const router = express.Router();
const {
    placeOrder,
    getMyOrders,
    getShopOrders,
    updateOrderStatus,
    getAvailableDeliveryOrders,
    getMyDeliveries,
    acceptOrder,
    rejectOrder,
    getUserInsights,
    getActiveOrder,
    cancelMyOrder,
    verifyArrival,
    verifyDelivery,
    raiseDispute,
    getZones
} = require('../controllers/orderController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');

router.post('/place', isAuthenticated, placeOrder);
router.get('/active', isAuthenticated, getActiveOrder);
router.get('/my', isAuthenticated, getMyOrders);
router.get('/shop', isAuthenticated, authorizeRoles('Owner'), getShopOrders);
router.put('/:id/status', isAuthenticated, updateOrderStatus);
router.put('/:id/cancel', isAuthenticated, cancelMyOrder);

// Advanced Delivery Routes
router.get('/zones', isAuthenticated, getZones);
router.post('/dispute', isAuthenticated, raiseDispute);
router.get('/delivery/available', isAuthenticated, authorizeRoles('Delivery'), getAvailableDeliveryOrders);
router.get('/delivery/my', isAuthenticated, authorizeRoles('Delivery'), getMyDeliveries);
router.put('/:id/accept', isAuthenticated, authorizeRoles('Delivery'), acceptOrder);
router.put('/:id/reject', isAuthenticated, authorizeRoles('Delivery'), rejectOrder);
router.put('/:id/verify-arrival', isAuthenticated, authorizeRoles('Delivery'), verifyArrival);
router.put('/:id/verify-delivery', isAuthenticated, authorizeRoles('Delivery'), verifyDelivery);

router.get('/insights', isAuthenticated, getUserInsights);

module.exports = router;
