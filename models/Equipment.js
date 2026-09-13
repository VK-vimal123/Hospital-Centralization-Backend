const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    equipment_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String },
    manufacturer: { type: String },
    model: { type: String },
    serial_number: { type: String },
    location: { type: String },
    installation_date: { type: Date },
    status: { type: String, enum: ['Active', 'In-Use', 'Under Maintenance', 'Out of Service'], default: 'Active' },
    last_maintenance_date: { type: Date },
    next_maintenance_date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);