const db = require('../config/db');

exports.startCycle = async (req, res) => {
    try {
        const { cycle_number, equipment_id, cycle_type, load_description } = req.body;
        const operator_id = req.user.id;
        const start_time = new Date().toISOString();

        const { rows: result } = await db.query(
            `INSERT INTO sterilization_cycles (cycle_number, equipment_id, operator_id, cycle_type, start_time, load_description, overall_result) 
             VALUES ($1, $2, $3, $4, $5, $6, 'In Progress') RETURNING id`,
            [cycle_number, equipment_id, operator_id, cycle_type, start_time, load_description || '']
        );

        // Audit Log
        await db.query(
            `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES ($1, $2, $3, $4, $5)`,
            [operator_id, 'START_CYCLE', 'CYCLES', result[0].id, `Started cycle ${cycle_number}`]
        );

        res.status(201).json({ id: result[0].id, message: 'Cycle started successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.completeCycle = async (req, res) => {
    try {
        const cycleId = req.params.id;
        const { temperature, pressure, exposure_time, remarks, trays = [] } = req.body;
        const operator_id = req.user.id;
        const end_time = new Date().toISOString();

        // Check if cycle exists
        const { rows: cycles } = await db.query('SELECT * FROM sterilization_cycles WHERE id = $1', [cycleId]);
        if (cycles.length === 0) return res.status(404).json({ message: 'Cycle not found' });
        const cycle = cycles[0];
        
        // Evaluate rules
        const { rows: rules } = await db.query('SELECT * FROM compliance_rules WHERE cycle_type = $1', [cycle.cycle_type]);
        
        let overall_result = 'Passed';
        let complianceIssues = [];

        if (rules.length > 0) {
            const rule = rules[0];
            
            if (temperature < rule.min_temperature || temperature > rule.max_temperature) {
                overall_result = 'Failed';
                complianceIssues.push({ rule_id: rule.id, param: 'Temperature', rec: temperature, min: rule.min_temperature, max: rule.max_temperature, status: 'Fail' });
            } else {
                complianceIssues.push({ rule_id: rule.id, param: 'Temperature', rec: temperature, min: rule.min_temperature, max: rule.max_temperature, status: 'Pass' });
            }

            if (pressure < rule.min_pressure || pressure > rule.max_pressure) {
                overall_result = 'Failed';
                complianceIssues.push({ rule_id: rule.id, param: 'Pressure', rec: pressure, min: rule.min_pressure, max: rule.max_pressure, status: 'Fail' });
            } else {
                complianceIssues.push({ rule_id: rule.id, param: 'Pressure', rec: pressure, min: rule.min_pressure, max: rule.max_pressure, status: 'Pass' });
            }

            if (exposure_time < rule.min_exposure_time || exposure_time > rule.max_exposure_time) {
                overall_result = 'Failed';
                complianceIssues.push({ rule_id: rule.id, param: 'Exposure Time', rec: exposure_time, min: rule.min_exposure_time, max: rule.max_exposure_time, status: 'Fail' });
            } else {
                complianceIssues.push({ rule_id: rule.id, param: 'Exposure Time', rec: exposure_time, min: rule.min_exposure_time, max: rule.max_exposure_time, status: 'Pass' });
            }
            
            // Check existing indicators for this cycle
            const { rows: indicators } = await db.query('SELECT * FROM indicators WHERE cycle_id = $1', [cycleId]);
            let hasPending = false;
            for (const ind of indicators) {
                if (ind.result === 'Fail') overall_result = 'Failed';
                else if (ind.result === 'Pending') hasPending = true;
            }
            if (overall_result !== 'Failed' && hasPending) {
                overall_result = 'Requires Review';
            }
        } else {
            overall_result = 'Requires Review'; // No rules found
        }

        // Update cycle
        await db.query(
            `UPDATE sterilization_cycles SET end_time = $1, temperature = $2, pressure = $3, exposure_time = $4, overall_result = $5, remarks = $6 WHERE id = $7`,
            [end_time, temperature, pressure, exposure_time, overall_result, remarks || '', cycleId]
        );

        // Insert compliance records
        for (const issue of complianceIssues) {
            await db.query(
                `INSERT INTO compliance_records (cycle_id, rule_id, parameter_checked, recorded_value, min_allowed, max_allowed, status, reason) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [cycleId, issue.rule_id, issue.param, issue.rec, issue.min, issue.max, issue.status, 'Completed cycle evaluation']
            );
        }

        // Update trays
        for (const barcode of trays) {
            let trayStatus = overall_result === 'Passed' ? 'Sterile' : 'In Cycle';
            if (overall_result === 'Failed') trayStatus = 'Available'; // Or whatever logic fits
            await db.query(`UPDATE trays_inventory SET status = $1, current_cycle_id = $2 WHERE barcode_id = $3`, [trayStatus, cycleId, barcode]);
        }

        // Update equipment cycle count
        const { rows: eqRows } = await db.query('SELECT cycle_count, maintenance_cycle_threshold FROM equipment WHERE id = $1', [cycle.equipment_id]);
        if (eqRows.length > 0) {
            const equip = eqRows[0];
            const newCount = equip.cycle_count + 1;
            let statusQuery = '';
            if (newCount >= equip.maintenance_cycle_threshold) {
                statusQuery = `, status = 'Calibration Due'`;
                await db.query(
                    `INSERT INTO equipment_logs (equipment_id, log_type, log_date, description, performed_by, previous_status, new_status, remarks)
                     VALUES ($1, 'Status Change', $2, 'Maintenance threshold reached', $3, 'Active', 'Calibration Due', 'Auto-generated by cycle completion')`,
                    [cycle.equipment_id, end_time, operator_id]
                );
            }
            await db.query(`UPDATE equipment SET cycle_count = $1 ${statusQuery} WHERE id = $2`, [newCount, cycle.equipment_id]);
        }

        // Audit Log
        await db.query(
            `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES ($1, $2, $3, $4, $5)`,
            [operator_id, 'COMPLETE_CYCLE', 'CYCLES', cycleId, `Completed cycle ${cycle.cycle_number} with result ${overall_result}`]
        );

        res.json({ message: 'Cycle completed successfully', overall_result });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
