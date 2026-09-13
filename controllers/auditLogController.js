const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

/**
 * GET /audit-logs
 * Returns all audit logs with user info (Admin only)
 * Records cannot be modified or deleted through the UI.
 */
const getAuditLogs = async (req, res) => {
    try {
        const { module: moduleName, limit = 100, offset = 0 } = req.query;

        const testResult = await safeQuery('SELECT 1');
        if (testResult === null) {
            let filtered = demo.auditLogs;
            if (moduleName && moduleName !== 'ALL') {
                filtered = filtered.filter(l => l.module === moduleName);
            }
            return res.json({
                success: true,
                data: filtered.slice(Number(offset), Number(offset) + Number(limit)),
                total: filtered.length
            });
        }

        let query = `
            SELECT 
                a.id,
                a.action,
                a.module,
                a.record_id,
                a.previous_value,
                a.new_value,
                a.created_at,
                COALESCE(u.name, 'System') as user_name,
                u.role as user_role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
        `;
        const params = [];

        if (moduleName && moduleName !== 'ALL') {
            query += ' WHERE a.module = ?';
            params.push(moduleName);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(query, params);

        // Count total for pagination
        const [countRows] = await db.query('SELECT COUNT(*) as total FROM audit_logs');

        res.json({
            success: true,
            data: rows,
            total: Number(countRows[0].total) || 0
        });
    } catch (error) {
        console.error('getAuditLogs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAuditLogs };
