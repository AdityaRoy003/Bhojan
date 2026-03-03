const express = require('express');
const router = express.Router();
const { addReview, getShopReviews } = require('../controllers/reviewController');
const { isAuthenticated } = require('../middlewares/auth');

router.post('/add', isAuthenticated, addReview);
router.get('/shop/:shopId', getShopReviews);

module.exports = router;
