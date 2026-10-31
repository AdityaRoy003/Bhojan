const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const {
    createSubscription,
    getMySubscriptions,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    checkPrimeEligibility
} = require('../controllers/subscriptionController');

router.post('/create', isAuthenticated, createSubscription);
router.get('/my', isAuthenticated, getMySubscriptions);
router.put('/pause/:id', isAuthenticated, pauseSubscription);
router.put('/resume/:id', isAuthenticated, resumeSubscription);
router.put('/cancel/:id', isAuthenticated, cancelSubscription);
router.get('/prime/check', isAuthenticated, checkPrimeEligibility);

module.exports = router;
