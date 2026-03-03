const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');

router.route('/my').get(isAuthenticated, getNotifications);
router.route('/read/all').put(isAuthenticated, markAllAsRead);
router.route('/:id/read').put(isAuthenticated, markAsRead);
router.route('/:id').delete(isAuthenticated, deleteNotification);

module.exports = router;
