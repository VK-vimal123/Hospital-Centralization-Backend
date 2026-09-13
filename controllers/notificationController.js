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

const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getNotifications, markAsRead };
