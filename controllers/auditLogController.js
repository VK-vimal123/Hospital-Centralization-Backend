const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('user_id', 'name role').sort({ createdAt: -1 }).lean();
        const formatted = logs.map(l => ({
            id: l._id,
            user_name: l.user_id ? l.user_id.name : 'System',
            user_role: l.user_id ? l.user_id.role : 'System',
            action: l.action,
            module: l.module,
            created_at: l.createdAt
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAuditLogs };
