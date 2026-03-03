const Notification = require('../models/Notification');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Mark ALL as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await notification.deleteOne();
        res.status(200).json({ success: true, message: 'Notification removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
