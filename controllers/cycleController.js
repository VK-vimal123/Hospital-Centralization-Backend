const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');
const { createSystemNotification } = require('../services/notificationService');

/**
 * POST /cycles
 * Record a new sterilization cycle with automatic PASS/FAIL validation
 */
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

        // Validate against cycle profile
        let result = 'PASS';
        let failure_reason = [];
        let profile = null;

        if (profile_id) {
            const [profiles] = await db.query('SELECT * FROM cycle_profiles WHERE id = ?', [profile_id]);
            if (profiles.length > 0) {
                profile = profiles[0];

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

        // Indicator overrides
        if (chemical_indicator === 'FAIL') {
            result = 'FAIL';
            failure_reason.push('Chemical indicator test failed');
        }
        if (biological_indicator === 'FAIL') {
            result = 'FAIL';
            failure_reason.push('Biological indicator test failed');
        }

        const finalFailureReason = failure_reason.length > 0 ? failure_reason.join('. ') : null;

        const [insertResult] = await db.query(
            `INSERT INTO sterilization_cycles 
             (equipment_id, profile_id, batch_number, operator_id, cycle_type, 
              start_time, end_time, temperature, pressure, duration, 
              chemical_indicator, biological_indicator, result, failure_reason, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                equipment_id, profile_id || null, batch_number, req.user.id,
                cycle_type || (profile ? profile.name : 'Standard'),
                start_time, end_time, temperature, pressure, duration,
                chemical_indicator || null, biological_indicator || null,
                result, finalFailureReason, notes || null
            ]
        );

        // Fetch equipment name for better notifications/audit
        const [eqRows] = await db.query('SELECT name, equipment_id FROM equipment WHERE id = ?', [equipment_id]);
        const equipmentName = eqRows.length > 0 ? `${eqRows[0].name} (${eqRows[0].equipment_id})` : `Equipment ID ${equipment_id}`;

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'CYCLE', `Recorded sterilization cycle #${insertResult.insertId} on ${equipmentName} — Result: ${result}`, insertResult.insertId]
        );

        // Notifications
        if (result === 'FAIL') {
            await createSystemNotification(
                'Sterilization Cycle Failed',
                `Cycle #${insertResult.insertId} on ${equipmentName} FAILED. Reason: ${finalFailureReason}. Immediate review required.`,
                'critical'
            );
        } else {
            await createSystemNotification(
                'Cycle Completed Successfully',
                `Cycle #${insertResult.insertId} on ${equipmentName} completed with PASS result.`,
                'success'
            );
        }

        res.status(201).json({
            success: true,
            id: insertResult.insertId,
            result,
            failure_reason: finalFailureReason
        });
    } catch (error) {
        console.error('recordCycle error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

/**
 * GET /cycles
 * Get all sterilization cycles
 */
const getCycles = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT 
                c.id, c.batch_number, c.cycle_type, c.start_time, c.end_time,
                c.temperature, c.pressure, c.duration,
                c.chemical_indicator, c.biological_indicator,
                c.result, c.failure_reason, c.notes, c.created_at,
                e.name as equipment_name, e.equipment_id as eq_code,
                u.name as operator_name
            FROM sterilization_cycles c
            JOIN equipment e ON c.equipment_id = e.id
            JOIN users u ON c.operator_id = u.id
            ORDER BY c.created_at DESC
        `);
        if (result === null) {
            return res.json(demo.cycles);
        }
        res.json(result[0]);
    } catch (error) {
        console.error('getCycles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /cycles/:id
 * Get a single cycle by ID
 */
const getCycleById = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT 
                c.*, e.name as equipment_name, e.equipment_id as eq_code,
                u.name as operator_name, cp.name as profile_name
            FROM sterilization_cycles c
            JOIN equipment e ON c.equipment_id = e.id
            JOIN users u ON c.operator_id = u.id
            LEFT JOIN cycle_profiles cp ON c.profile_id = cp.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (result === null) {
            const cycle = demo.cycles.find(c => c.id === Number(req.params.id));
            if (!cycle) return res.status(404).json({ message: 'Cycle not found' });
            return res.json(cycle);
        }

        if (result[0].length === 0) return res.status(404).json({ message: 'Cycle not found' });
        res.json(result[0][0]);
    } catch (error) {
        console.error('getCycleById error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /cycles/:id (Admin only)
 */
const deleteCycle = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, batch_number FROM sterilization_cycles WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Cycle not found' });

        await db.query('DELETE FROM sterilization_cycles WHERE id = ?', [req.params.id]);

        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'CYCLE', `Deleted sterilization cycle #${req.params.id} (Batch: ${rows[0].batch_number})`, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('deleteCycle error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { recordCycle, getCycles, getCycleById, deleteCycle };
