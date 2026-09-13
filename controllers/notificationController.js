const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

/**
 * GET /notifications
 * Get all notifications for this user (user-specific + system-wide)
 */
const getNotifications = async (req, res) => {
    try {
        const result = await safeQuery(
            `SELECT * FROM notifications 
             WHERE user_id = ? OR user_id IS NULL 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [req.user.id]
        );
        if (result === null) {
            return res.json(demo.notifications);
        }
        res.json(result[0]);
    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /notifications/unread-count
 * Badge count for sidebar/header
 */
const getUnreadCount = async (req, res) => {
    try {
        const result = await safeQuery(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE`,
            [req.user.id]
        );
        if (result === null) {
            return res.json({ success: true, count: demo.notifications.filter(n => !n.is_read).length });
        }
        res.json({ success: true, count: Number(result[0][0].count) || 0 });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read for this user
 */
const markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? OR user_id IS NULL',
            [req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /notifications/:id
 * Delete / dismiss a notification
 */
const deleteNotification = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
