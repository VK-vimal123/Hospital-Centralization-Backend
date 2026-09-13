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