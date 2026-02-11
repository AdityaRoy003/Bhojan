const express = require('express');
const { getPersonalizedRecommendations, getTrendingItems, getTimeBasedSuggestions } = require('../controllers/recommendationController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.get('/personalized', isAuthenticated, getPersonalizedRecommendations);
router.get('/trending', getTrendingItems);
router.get('/time-based', getTimeBasedSuggestions);

module.exports = router;
