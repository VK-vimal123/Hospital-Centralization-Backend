const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

/**
 * POST /compliance/check
 * Validate cycle parameters against a profile
 */
const checkCompliance = async (req, res) => {
    try {
        const { profile_id, temperature, pressure, duration } = req.body;

        let profile = null;
        const result = await safeQuery('SELECT * FROM cycle_profiles WHERE id = ?', [profile_id]);
        if (result === null) {
            profile = demo.cycleProfiles.find(p => p.id === Number(profile_id));
        } else {
            if (result[0].length === 0) return res.status(404).json({ success: false, message: 'Profile not found' });
            profile = result[0][0];
        }

        if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

        let checkResult = 'PASS';
        const failure_reasons = [];

        if (temperature < profile.minimum_temperature) {
            checkResult = 'FAIL';
            failure_reasons.push(`Temperature (${temperature}°C) below minimum (${profile.minimum_temperature}°C).`);
        } else if (temperature > profile.maximum_temperature) {
            checkResult = 'FAIL';
            failure_reasons.push(`Temperature (${temperature}°C) above maximum (${profile.maximum_temperature}°C).`);
        }

        if (duration < profile.minimum_duration) {
            checkResult = 'FAIL';
            failure_reasons.push(`Duration (${duration} min) below minimum (${profile.minimum_duration} min).`);
        }

        if (pressure < profile.pressure_min) {
            checkResult = 'FAIL';
            failure_reasons.push(`Pressure (${pressure} PSI) below minimum (${profile.pressure_min} PSI).`);
        } else if (pressure > profile.pressure_max) {
            checkResult = 'FAIL';
            failure_reasons.push(`Pressure (${pressure} PSI) above maximum (${profile.pressure_max} PSI).`);
        }

        res.json({ success: true, result: checkResult, reason: failure_reasons.join(' ') });
    } catch (error) {
        console.error('checkCompliance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /compliance/summary
 * Overall compliance summary with weighted scoring
 */
const getComplianceSummary = async (req, res) => {
    try {
        const testResult = await safeQuery('SELECT 1');
        if (testResult === null) {
            // Demo fallback
            const cy = demo.cycles;
            const mt = demo.maintenanceRecords;
            const eq = demo.equipment;
            const total = cy.length;
            const passed = cy.filter(c => c.result === 'PASS').length;
            const failed = cy.filter(c => c.result === 'FAIL').length;
            const cyclePassRate = total > 0 ? (passed / total) * 100 : 100;
            const totalMaint = mt.length;
            const overdueMaint = mt.filter(m => m.status === 'Overdue').length;
            const maintRate = totalMaint > 0 ? ((totalMaint - overdueMaint) / totalMaint) * 100 : 100;
            const totalEq = eq.length;
            const activeEq = eq.filter(e => e.status === 'Active').length;
            const eqAvail = totalEq > 0 ? (activeEq / totalEq) * 100 : 100;
            const score = ((cyclePassRate * 0.60) + (maintRate * 0.20) + (eqAvail * 0.20)).toFixed(1);
            const numScore = Number(score);
            let level = 'Non-Compliant', color = 'red';
            if (numScore >= 95) { level = 'Excellent'; color = 'green'; }
            else if (numScore >= 80) { level = 'Warning'; color = 'amber'; }

            return res.json({
                success: true, compliance_percentage: numScore, compliance_level: level, compliance_color: color,
                total_cycles: total, successful_cycles: passed, failed_cycles: failed,
                cycle_pass_rate: cyclePassRate.toFixed(1), maintenance_compliance_rate: maintRate.toFixed(1),
                equipment_availability: eqAvail.toFixed(1), active_equipment: `${activeEq}/${totalEq} Online`,
                overdue_maintenance: overdueMaint
            });
        }

        // 1. Cycle pass rate (60% weight)
        const [cycleData] = await db.query(`
            SELECT 
                COUNT(*) as total_cycles,
                SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as successful_cycles,
                SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed_cycles
            FROM sterilization_cycles
        `);

        const total = Number(cycleData[0].total_cycles) || 0;
        const passed = Number(cycleData[0].successful_cycles) || 0;
        const failed = Number(cycleData[0].failed_cycles) || 0;
        const cyclePassRate = total > 0 ? (passed / total) * 100 : 100;

        // 2. Maintenance compliance (20% weight) — non-overdue ratio
        const [maintData] = await db.query(`
            SELECT 
                COUNT(*) as total_maint,
                SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_maint
            FROM maintenance_records
        `);
        const totalMaint = Number(maintData[0].total_maint) || 0;
        const overdueMaint = Number(maintData[0].overdue_maint) || 0;
        const maintComplianceRate = totalMaint > 0 ? ((totalMaint - overdueMaint) / totalMaint) * 100 : 100;

        // 3. Equipment availability (20% weight) — active ratio
        const [eqData] = await db.query(`
            SELECT 
                COUNT(*) as total_eq,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_eq
            FROM equipment
        `);
        const totalEq = Number(eqData[0].total_eq) || 0;
        const activeEq = Number(eqData[0].active_eq) || 0;
        const eqAvailability = totalEq > 0 ? (activeEq / totalEq) * 100 : 100;

        // Weighted compliance score
        const compliance_percentage = (
            (cyclePassRate * 0.60) +
            (maintComplianceRate * 0.20) +
            (eqAvailability * 0.20)
        ).toFixed(1);

        // Determine status level
        const score = Number(compliance_percentage);
        let compliance_level = 'Non-Compliant';
        let compliance_color = 'red';
        if (score >= 95) { compliance_level = 'Excellent'; compliance_color = 'green'; }
        else if (score >= 80) { compliance_level = 'Warning'; compliance_color = 'amber'; }

        res.json({
            success: true,
            compliance_percentage: score,
            compliance_level,
            compliance_color,
            total_cycles: total,
            successful_cycles: passed,
            failed_cycles: failed,
            cycle_pass_rate: cyclePassRate.toFixed(1),
            maintenance_compliance_rate: maintComplianceRate.toFixed(1),
            equipment_availability: eqAvailability.toFixed(1),
            active_equipment: `${activeEq}/${totalEq} Online`,
            overdue_maintenance: overdueMaint
        });
    } catch (error) {
        console.error('getComplianceSummary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /compliance/equipment
 * Per-equipment compliance scores
 */
const getEquipmentCompliance = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT 
                e.id, e.equipment_id, e.name, e.status, e.next_maintenance_date,
                COUNT(sc.id) as total_cycles,
                SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) as passed_cycles,
                SUM(CASE WHEN sc.result = 'FAIL' THEN 1 ELSE 0 END) as failed_cycles,
                ROUND(
                    CASE WHEN COUNT(sc.id) > 0 
                    THEN SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) * 100.0 / COUNT(sc.id)
                    ELSE NULL END
                , 1) as compliance_score,
                MAX(sc.created_at) as last_cycle_date
            FROM equipment e
            LEFT JOIN sterilization_cycles sc ON e.id = sc.equipment_id
            GROUP BY e.id, e.equipment_id, e.name, e.status, e.next_maintenance_date
            ORDER BY compliance_score ASC
        `);

        let rows;
        if (result === null) {
            rows = demo.equipment.map(eq => {
                const eqCycles = demo.cycles.filter(c => c.eq_code === eq.equipment_id);
                const passed = eqCycles.filter(c => c.result === 'PASS').length;
                const failed = eqCycles.filter(c => c.result === 'FAIL').length;
                const score = eqCycles.length > 0 ? ((passed / eqCycles.length) * 100).toFixed(1) : null;
                return { id: eq.id, equipment_id: eq.equipment_id, name: eq.name, status: eq.status, next_maintenance_date: eq.next_maintenance_date, total_cycles: eqCycles.length, passed_cycles: passed, failed_cycles: failed, compliance_score: score ? Number(score) : null, last_cycle_date: eqCycles.length > 0 ? eqCycles[eqCycles.length - 1].created_at : null };
            });
        } else {
            rows = result[0];
        }

        const data = rows.map(row => {
            const score = row.compliance_score;
            let level = 'No Data';
            let color = 'gray';
            if (score !== null) {
                if (score >= 95) { level = 'Excellent'; color = 'green'; }
                else if (score >= 80) { level = 'Warning'; color = 'amber'; }
                else { level = 'Non-Compliant'; color = 'red'; }
            }
            return { ...row, compliance_level: level, compliance_color: color };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('getEquipmentCompliance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /compliance/profiles
 */
const getProfiles = async (req, res) => {
    try {
        const result = await safeQuery('SELECT * FROM cycle_profiles ORDER BY created_at DESC');
        if (result === null) {
            return res.json({ success: true, data: demo.cycleProfiles });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getProfiles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /compliance/verify/:id
 */
const verifyCycle = async (req, res) => {
    try {
        const cycleId = req.params.id;
        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'COMPLIANCE', `Verified sterilization cycle #${cycleId}`, cycleId]
        );
        res.json({ success: true, message: `Cycle #${cycleId} verified successfully` });
    } catch (error) {
        console.error('verifyCycle error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    checkCompliance,
    getComplianceSummary,
    getEquipmentCompliance,
    getProfiles,
    verifyCycle
};
