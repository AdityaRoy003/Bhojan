const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    toggleWishlist,
    getWishlist,
    initiateTopUp,
    confirmTopUp,
    redeemGiftCard,
    getTransactions
} = require('../controllers/userActionController');

router.post('/wishlist/toggle', isAuthenticated, toggleWishlist);
router.get('/wishlist', isAuthenticated, getWishlist);
router.post('/wallet/topup/initiate', isAuthenticated, initiateTopUp);
router.post('/wallet/topup/confirm', isAuthenticated, confirmTopUp);
router.post('/wallet/giftcard/redeem', isAuthenticated, redeemGiftCard);
router.get('/wallet/transactions', isAuthenticated, getTransactions);

module.exports = router;
