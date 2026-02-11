const express = require('express');
const router = express.Router();
const {
    toggleOnline,
    updateLocation,
    getStats,
    completeDelivery,
    updateProfile,
    updateWellness
} = require('../controllers/deliveryController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');

router.use(isAuthenticated);
router.use(authorizeRoles('Delivery'));

router.put('/toggle-online', toggleOnline);
router.put('/location', updateLocation);
router.get('/stats', getStats);
router.put('/complete/:id', completeDelivery);
router.put('/profile', updateProfile);
router.put('/wellness', updateWellness);

module.exports = router;
