const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
    cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SterilizationCycle', required: true },
    indicator_type: { type: String, enum: ['BI', 'CI', 'Bowie-Dick'], required: true },
    result: { type: String, enum: ['Pass', 'Fail', 'Pending'], default: 'Pending' },
    incubator_id: { type: String },
    read_time: { type: Date },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Indicator', indicatorSchema);