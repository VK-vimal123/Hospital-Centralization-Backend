const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

const models = {
    'User.js': `
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Sterilization Staff', 'Maintenance Staff'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
`,
    'Equipment.js': `
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
    status: { type: String, enum: ['Active', 'Under Maintenance', 'Out of Service'], default: 'Active' },
    last_maintenance_date: { type: Date },
    next_maintenance_date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
`,
    'CycleProfile.js': `
const mongoose = require('mongoose');

const cycleProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cycle_type: { type: String, required: true },
    minimum_temperature: { type: Number },
    maximum_temperature: { type: Number },
    minimum_duration: { type: Number },
    pressure_min: { type: Number },
    pressure_max: { type: Number },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CycleProfile', cycleProfileSchema);
`,
    'SterilizationCycle.js': `
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
`,
    'MaintenanceRecord.js': `
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
`,
    'Notification.js': `
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String },
    is_read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
`,
    'AuditLog.js': `
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
`
};

for (const [filename, content] of Object.entries(models)) {
    fs.writeFileSync(path.join(modelsDir, filename), content.trim());
    console.log("Created " + filename);
}
