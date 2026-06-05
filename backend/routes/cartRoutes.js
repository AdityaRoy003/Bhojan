const express = require('express');
const router = express.Router();
const {
    createGroupCart,
    joinGroupCart,
    addItemToCart,
    lockCart
} = require('../controllers/cartController');
const { isAuthenticated } = require('../middlewares/auth');

router.post('/group', isAuthenticated, createGroupCart);
router.post('/group/:partyId/join', isAuthenticated, joinGroupCart);
router.post('/group/:partyId/items', isAuthenticated, addItemToCart);
router.put('/group/:partyId/lock', isAuthenticated, lockCart);

module.exports = router;
