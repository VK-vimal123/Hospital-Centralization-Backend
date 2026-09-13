const mongoose = require('mongoose');

const complianceRecordSchema = new mongoose.Schema({
    cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SterilizationCycle', required: true },
    rule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ComplianceRule', required: true },
    parameter_checked: { type: String, required: true },
    recorded_value: { type: Number, required: true },
    min_allowed: { type: Number },
    max_allowed: { type: Number },
    status: { type: String, enum: ['Pass', 'Fail', 'Requires Review'], required: true },
    reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceRecord', complianceRecordSchema);