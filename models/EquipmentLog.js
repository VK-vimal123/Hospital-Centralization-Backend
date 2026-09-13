const mongoose = require('mongoose');

const equipmentLogSchema = new mongoose.Schema({
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    log_type: { type: String, enum: ['Maintenance', 'Calibration', 'Breakdown', 'Inspection', 'Cleaning', 'Repair', 'Service', 'Status Change'], required: true },
    log_date: { type: Date, required: true },
    description: { type: String },
    performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previous_status: { type: String },
    new_status: { type: String },
    remarks: { type: String },
    document_ref: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EquipmentLog', equipmentLogSchema);