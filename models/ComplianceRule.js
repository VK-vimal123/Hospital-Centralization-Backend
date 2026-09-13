const mongoose = require('mongoose');

const complianceRuleSchema = new mongoose.Schema({
    cycle_type: { type: String, required: true },
    equipment_type: { type: String },
    min_temperature: { type: Number },
    max_temperature: { type: Number },
    min_pressure: { type: Number },
    max_pressure: { type: Number },
    min_exposure_time: { type: Number },
    max_exposure_time: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('ComplianceRule', complianceRuleSchema);