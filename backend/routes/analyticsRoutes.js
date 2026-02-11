const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    getPredictiveSales,
    getDeliveryHeatmap,
    getCustomerInsights
} = require('../controllers/analyticsController');

router.get('/predictive-sales/:shopId', isAuthenticated, getPredictiveSales);
router.get('/heatmap', getDeliveryHeatmap);
router.get('/customer-insights', isAuthenticated, getCustomerInsights);

module.exports = router;
