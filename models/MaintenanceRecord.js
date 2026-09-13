const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    technician_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    maintenance_type: { type: String, enum: ['Preventive', 'Corrective', 'Inspection'], required: true },
    service_date: { type: Date, required: true },
    description: { type: String },
    parts_replaced: { type: String },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Overdue'], default: 'Scheduled' },
    next_due_date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);