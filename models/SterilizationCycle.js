const mongoose = require('mongoose');

const sterilizationCycleSchema = new mongoose.Schema({
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    profile_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CycleProfile', required: true },
    batch_number: { type: String, required: true },
    operator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycle_type: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    temperature: { type: Number, required: true },
    pressure: { type: Number, required: true },
    duration: { type: Number, required: true },
    chemical_indicator: { type: String },
    biological_indicator: { type: String },
    result: { type: String, enum: ['PASS', 'WARNING', 'FAIL'], required: true },
    failure_reason: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SterilizationCycle', sterilizationCycleSchema);