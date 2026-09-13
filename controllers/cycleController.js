const SterilizationCycle = require('../models/SterilizationCycle');
const CycleProfile = require('../models/CycleProfile');
const Equipment = require('../models/Equipment');
const AuditLog = require('../models/AuditLog');
const { createSystemNotification } = require('../services/notificationService');

const recordCycle = async (req, res) => {
    try {
        const {
            equipment_id, profile_id, batch_number, cycle_type,
            start_time, end_time, temperature, pressure, duration,
            chemical_indicator, biological_indicator, notes
        } = req.body;

        if (!equipment_id || !batch_number || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Equipment, batch number, start and end time are required' });
        }

        let result = 'PASS';
        let failure_reason = [];
        let profile = null;

        if (profile_id) {
            profile = await CycleProfile.findById(profile_id);
            if (profile) {
                if (profile.minimum_temperature && temperature < profile.minimum_temperature) {
                    result = 'FAIL';
                    failure_reason.push(`Temperature (${temperature}°C) below required minimum (${profile.minimum_temperature}°C)`);
                }
                if (profile.maximum_temperature && temperature > profile.maximum_temperature) {
                    result = 'FAIL';
                    failure_reason.push(`Temperature (${temperature}°C) above allowed maximum (${profile.maximum_temperature}°C)`);
                }
                if (profile.pressure_min && pressure < profile.pressure_min) {
                    result = 'FAIL';
                    failure_reason.push(`Pressure (${pressure} PSI) below required minimum (${profile.pressure_min} PSI)`);
                }
                if (profile.pressure_max && pressure > profile.pressure_max) {
                    result = 'FAIL';
                    failure_reason.push(`Pressure (${pressure} PSI) above allowed maximum (${profile.pressure_max} PSI)`);
                }
                if (profile.minimum_duration && duration < profile.minimum_duration) {
                    result = 'FAIL';
                    failure_reason.push(`Duration (${duration} min) below required minimum (${profile.minimum_duration} min)`);
                }
            }
        }

        if (chemical_indicator === 'FAIL') {
            result = 'FAIL';
            failure_reason.push('Chemical indicator test failed');
        }
        if (biological_indicator === 'FAIL') {
            result = 'FAIL';
            failure_reason.push('Biological indicator test failed');
        }

        const finalFailureReason = failure_reason.length > 0 ? failure_reason.join('. ') : null;

        const cycle = await SterilizationCycle.create({
            equipment_id,
            profile_id: profile_id || null,
            batch_number,
            operator_id: req.user.id,
            cycle_type: cycle_type || (profile ? profile.name : 'Standard'),
            start_time,
            end_time,
            temperature,
            pressure,
            duration,
            chemical_indicator,
            biological_indicator,
            result,
            failure_reason: finalFailureReason,
            notes
        });

        const eq = await Equipment.findById(equipment_id);
        const equipmentName = eq ? `${eq.name} (${eq.equipment_id})` : `Equipment ID ${equipment_id}`;

        await AuditLog.create({
            user_id: req.user.id,
            module: 'CYCLE',
            action: `Recorded sterilization cycle #${cycle._id} on ${equipmentName} — Result: ${result}`,
            record_id: cycle._id
        });

        if (result === 'FAIL') {
            await createSystemNotification(
                'Sterilization Cycle Failed',
                `Cycle #${cycle._id} on ${equipmentName} FAILED. Reason: ${finalFailureReason}. Immediate review required.`,
                'critical'
            );
        } else {
            await createSystemNotification(
                'Cycle Completed Successfully',
                `Cycle #${cycle._id} on ${equipmentName} completed with PASS result.`,
                'success'
            );
        }

        res.status(201).json({
            success: true,
            id: cycle._id,
            result,
            failure_reason: finalFailureReason
        });
    } catch (error) {
        console.error('recordCycle error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const getCycles = async (req, res) => {
    try {
        const cycles = await SterilizationCycle.find()
            .populate('equipment_id', 'name equipment_id')
            .populate('operator_id', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = cycles.map(c => ({
            id: c._id,
            batch_number: c.batch_number,
            cycle_type: c.cycle_type,
            start_time: c.start_time,
            end_time: c.end_time,
            temperature: c.temperature,
            pressure: c.pressure,
            duration: c.duration,
            chemical_indicator: c.chemical_indicator,
            biological_indicator: c.biological_indicator,
            result: c.result,
            failure_reason: c.failure_reason,
            notes: c.notes,
            created_at: c.createdAt,
            equipment_name: c.equipment_id ? c.equipment_id.name : 'Unknown',
            eq_code: c.equipment_id ? c.equipment_id.equipment_id : 'Unknown',
            operator_name: c.operator_id ? c.operator_id.name : 'Unknown'
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('getCycles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getCycleById = async (req, res) => {
    try {
        const c = await SterilizationCycle.findById(req.params.id)
            .populate('equipment_id', 'name equipment_id')
            .populate('operator_id', 'name')
            .populate('profile_id', 'name')
            .lean();

        if (!c) return res.status(404).json({ message: 'Cycle not found' });

        res.json({
            ...c,
            id: c._id,
            equipment_name: c.equipment_id ? c.equipment_id.name : 'Unknown',
            eq_code: c.equipment_id ? c.equipment_id.equipment_id : 'Unknown',
            operator_name: c.operator_id ? c.operator_id.name : 'Unknown',
            profile_name: c.profile_id ? c.profile_id.name : 'Unknown'
        });
    } catch (error) {
        console.error('getCycleById error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteCycle = async (req, res) => {
    try {
        const cycle = await SterilizationCycle.findByIdAndDelete(req.params.id);
        if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });

        await AuditLog.create({
            user_id: req.user.id,
            module: 'CYCLE',
            action: `Deleted sterilization cycle #${req.params.id} (Batch: ${cycle.batch_number})`,
            record_id: req.params.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('deleteCycle error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { recordCycle, getCycles, getCycleById, deleteCycle };
