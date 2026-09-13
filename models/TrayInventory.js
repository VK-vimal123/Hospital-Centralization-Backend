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