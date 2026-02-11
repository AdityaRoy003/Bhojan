const express = require('express');
const {
    signup, signin, logout, forgotPassword, resetPassword,
    getUserProfile, updateProfile, addAddress, getAddresses, deleteAddress,
    changePassword, updatePreferences, updateSettings, deleteAccount, raiseSupportTicket
} = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/logout', logout);
router.get('/refresh', require('../controllers/authController').refreshToken);
router.post('/password/forgot', forgotPassword);
router.put('/password/reset', resetPassword);
router.get('/me', isAuthenticated, getUserProfile);
router.put('/me/update', isAuthenticated, updateProfile);
router.put('/password/change', isAuthenticated, changePassword);
router.put('/me/preferences', isAuthenticated, updatePreferences);
router.put('/me/settings', isAuthenticated, updateSettings);
router.post('/me/delete', isAuthenticated, deleteAccount);

// Address Routes
router.post('/address/add', isAuthenticated, addAddress);
router.get('/addresses', isAuthenticated, getAddresses);
router.delete('/address/:id', isAuthenticated, deleteAddress);
router.post('/support/ticket', isAuthenticated, raiseSupportTicket);

module.exports = router;
