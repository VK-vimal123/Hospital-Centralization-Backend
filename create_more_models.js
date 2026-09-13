const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

const models = {
    'CalibrationRecord.js': `
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
`,
    'Indicator.js': `
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
`,
    'TrayInventory.js': `
const mongoose = require('mongoose');

const trayInventorySchema = new mongoose.Schema({
    barcode_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['Available', 'In Cycle', 'Sterile', 'Recalled', 'Used'], default: 'Available' },
    current_cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SterilizationCycle' },
    expiry_date: { type: Date },
    location: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TrayInventory', trayInventorySchema);
`,
    'ComplianceRule.js': `
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
`,
    'ComplianceRecord.js': `
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
`,
    'EquipmentLog.js': `
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
`
};

for (const [filename, content] of Object.entries(models)) {
    fs.writeFileSync(path.join(modelsDir, filename), content.trim());
    console.log("Created " + filename);
}
