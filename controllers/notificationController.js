const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const notifications = await Notification.find({
            $or: [
                { user_id: userId },
                { user_id: null },
                { user_id: { $exists: false } }
            ]
        }).sort({ createdAt: -1 }).lean();
        
        res.json({
            success: true,
            data: notifications.map(n => ({
                ...n,
                id: n._id.toString(),
                createdAt: n.createdAt || n.created_at
            }))
        });
    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const count = await Notification.countDocuments({
            is_read: false,
            $or: [
                { user_id: userId },
                { user_id: null },
                { user_id: { $exists: false } }
            ]
        });
        res.json({ success: true, count });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(
            req.params.id,
            { is_read: true },
            { new: true }
        );
        if (!notif) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, data: { ...notif.toObject(), id: notif._id.toString() } });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        await Notification.updateMany({
            is_read: false,
            $or: [
                { user_id: userId },
                { user_id: null },
                { user_id: { $exists: false } }
            ]
        }, { is_read: true });
        res.json({ success: true });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
