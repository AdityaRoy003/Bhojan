const express = require('express');
const { updateLocation, getTrackingDetails } = require('../controllers/trackingController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.put('/:orderId/location', isAuthenticated, updateLocation);
router.get('/:orderId', getTrackingDetails);

module.exports = router;
