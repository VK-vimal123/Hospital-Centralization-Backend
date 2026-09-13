const mongoose = require('mongoose');

const calibrationRecordSchema = new mongoose.Schema({
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    calibration_date: { type: Date, required: true },
    next_calibration_date: { type: Date, required: true },
    status: { type: String, enum: ['Up to Date', 'Due Soon', 'Overdue'], required: true },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    certificate_number: { type: String },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CalibrationRecord', calibrationRecordSchema);