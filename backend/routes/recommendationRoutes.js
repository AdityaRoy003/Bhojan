const express = require('express');
const {
    getPersonalizedRecommendations,
    getTrendingItems,
    getTimeBasedSuggestions,
    getLeaderboardCustomers,
    getLeaderboardRestaurants,
    getLeaderboardDelivery,
    getPredictiveMealPlan,
    getAIRecommendations
} = require('../controllers/recommendationController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.get('/personalized', isAuthenticated, getPersonalizedRecommendations);
router.get('/trending', getTrendingItems);
router.get('/time-based', getTimeBasedSuggestions);
router.get('/leaderboard/customers', getLeaderboardCustomers);
router.get('/leaderboard/restaurants', getLeaderboardRestaurants);
router.get('/leaderboard/delivery', getLeaderboardDelivery);
router.get('/meal-plan', isAuthenticated, getPredictiveMealPlan);
router.get('/ai', getAIRecommendations);

module.exports = router;
