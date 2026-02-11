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
    getUserInsights,
    getActiveOrder,
    cancelMyOrder
} = require('../controllers/orderController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');

router.post('/place', isAuthenticated, placeOrder);
router.get('/active', isAuthenticated, getActiveOrder);
router.get('/my', isAuthenticated, getMyOrders);
router.get('/shop', isAuthenticated, isAuthenticated, authorizeRoles('Owner'), getShopOrders);
router.put('/:id/status', isAuthenticated, updateOrderStatus);
router.put('/:id/cancel', isAuthenticated, cancelMyOrder);
router.get('/delivery/available', isAuthenticated, authorizeRoles('Delivery'), getAvailableDeliveryOrders);
router.get('/delivery/my', isAuthenticated, authorizeRoles('Delivery'), getMyDeliveries);
router.put('/:id/accept', isAuthenticated, authorizeRoles('Delivery'), acceptOrder);
router.get('/insights', isAuthenticated, getUserInsights);

module.exports = router;
