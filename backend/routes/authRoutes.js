const express = require('express');
const {
    signup, signin, logout, forgotPassword, resetPassword,
    getUserProfile, updateProfile, addAddress, getAddresses, deleteAddress,
    changePassword, updatePreferences, updateSettings, deleteAccount, raiseSupportTicket,
    updateDeliveryLocation, sendMobileOTP, verifyMobileOTP,
    verify2FA, toggle2FA, generateBackupCodes, requestGDPRDataExport
} = require('../controllers/authController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/phone/send-otp', sendMobileOTP);
router.post('/phone/verify-otp', verifyMobileOTP);
router.post('/2fa/verify', verify2FA);
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

// 2FA & Privacy Settings
router.put('/me/2fa/toggle', isAuthenticated, toggle2FA);
router.put('/me/2fa/backup-codes', isAuthenticated, generateBackupCodes);
router.post('/me/privacy/gdpr-export', isAuthenticated, requestGDPRDataExport);

// Address Routes
router.post('/address/add', isAuthenticated, addAddress);
router.get('/addresses', isAuthenticated, getAddresses);
router.delete('/address/:id', isAuthenticated, deleteAddress);
router.post('/support/ticket', isAuthenticated, raiseSupportTicket);
router.put('/delivery/location', isAuthenticated, authorizeRoles('Delivery'), updateDeliveryLocation);

module.exports = router;
