const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [{ user_id: req.user.id }, { user_id: null }]
        }).sort({ createdAt: -1 }).lean();
        
        res.json({ success: true, data: notifications.map(n => ({ ...n, id: n._id })) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            is_read: false,
            $or: [{ user_id: req.user.id }, { user_id: null }]
        });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({
            is_read: false,
            $or: [{ user_id: req.user.id }, { user_id: null }]
        }, { is_read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
