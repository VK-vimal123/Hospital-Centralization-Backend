const db = require('../config/db');

/**
 * Creates a system-wide notification.
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The type (e.g., 'INFO', 'ALERT', 'REMINDER')
 */
const createSystemNotification = async (title, message, type = 'INFO') => {
    try {
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [null, title, message, type]
        );
        console.log(`System notification created: ${title}`);
    } catch (error) {
        console.error('Failed to create system notification:', error);
    }
};

module.exports = {
    createSystemNotification
};
