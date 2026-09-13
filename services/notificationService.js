const Notification = require('../models/Notification');

/**
 * Creates a system-wide notification.
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The type (e.g., 'info', 'warning', 'critical', 'success')
 */
const createSystemNotification = async (title, message, type = 'info') => {
    try {
        const notif = await Notification.create({
            user_id: null,
            title,
            message,
            type: (type || 'info').toLowerCase(),
            is_read: false
        });
        console.log(`System notification created: ${title} (${notif._id})`);
        return notif;
    } catch (error) {
        console.error('Failed to create system notification:', error);
    }
};

module.exports = {
    createSystemNotification
};
