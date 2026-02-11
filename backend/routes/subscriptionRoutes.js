const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createSubscription,
    getMySubscriptions,
    cancelSubscription,
    checkPrimeEligibility
} = require('../controllers/subscriptionController');

router.post('/create', isAuthenticated, createSubscription);
router.get('/my', isAuthenticated, getMySubscriptions);
router.put('/cancel/:id', isAuthenticated, cancelSubscription);
router.get('/prime/check', isAuthenticated, checkPrimeEligibility);

module.exports = router;
