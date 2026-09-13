/**
 * Safe database query helper.
 * Wraps db.query() and returns null on connection errors instead of throwing.
 * Controllers can check `if (result === null)` to switch to demo fallback data.
 */
const db = require('../config/db');

const safeQuery = async (...args) => {
    try {
        return await db.query(...args);
    } catch (error) {
        // Connection-level errors (MySQL not running, AggregateError, ECONNREFUSED, etc.)
        if (
            error.constructor.name === 'AggregateError' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'PROTOCOL_CONNECTION_LOST' ||
            error.code === 'ER_ACCESS_DENIED_ERROR' ||
            error.code === 'ER_BAD_DB_ERROR' ||
            error.code === 'ER_NO_SUCH_TABLE' ||
            error.message?.includes('connect')
        ) {
            return null; // Signal: DB unavailable
        }
        // Re-throw actual SQL errors (syntax errors, constraint violations, etc.)
        throw error;
    }
};

module.exports = { safeQuery };
