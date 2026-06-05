const Notification = require('../models/Notification');

/**
 * Creates a persistent notification in the database and broadcasts it in real-time via Socket.io
 * @param {string} userId - ID of the target user
 * @param {string} title - Title of the notification
 * @param {string} message - Message body of the notification
 * @param {string} type - Type of notification ('order', 'promotion', 'system', 'social')
 */
const sendNotification = async (userId, title, message, type = 'system') => {
    try {
        if (!userId) return;

        // Save to Database
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type
        });

        // Emit real-time Socket.io event if global.io is running
        if (global.io) {
            global.io.to(`user_${userId}`).emit('order_notification', {
                _id: notification._id,
                title,
                message,
                type,
                isRead: false,
                createdAt: notification.createdAt
            });

            // Additionally trigger delivery_alert if delivery type
            if (type === 'delivery') {
                global.io.to(`user_${userId}`).emit('delivery_alert', {
                    _id: notification._id,
                    title,
                    message,
                    type,
                    isRead: false,
                    createdAt: notification.createdAt
                });
            }
        }

        return notification;
    } catch (error) {
        console.error('Error in sendNotification helper:', error.message);
    }
};

module.exports = {
    sendNotification
};
