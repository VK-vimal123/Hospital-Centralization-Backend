const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    record_id: { type: mongoose.Schema.Types.ObjectId },
    previous_value: { type: String },
    new_value: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);