const db = require('../config/db');

exports.addIndicator = async (req, res) => {
    try {
        const { cycle_id, indicator_type, result, incubator_id, remarks } = req.body;
        const operator_id = req.user.id;
        const read_time = new Date().toISOString();

        // Insert indicator
        const { rows: indResult } = await db.query(
            `INSERT INTO indicators (cycle_id, indicator_type, result, incubator_id, read_time, remarks) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [cycle_id, indicator_type, result, incubator_id || null, read_time, remarks || '']
        );

        // Update cycle overall result if this indicator failed
        if (result === 'Fail') {
            await db.query(
                `UPDATE sterilization_cycles SET indicator_result = 'Fail', overall_result = 'Failed' WHERE id = $1`,
                [cycle_id]
            );
        } else if (result === 'Pass') {
            // Check if all indicators passed to potentially mark as Passed (if cycle was Requires Review due to pending indicators)
            // For simplicity, we just update indicator_result
            await db.query(
                `UPDATE sterilization_cycles SET indicator_result = 'Pass' WHERE id = $1`,
                [cycle_id]
            );
        }

        // Audit Log
        await db.query(
            `INSERT INTO audit_logs (user_id, action, module, record_id, description) VALUES ($1, $2, $3, $4, $5)`,
            [operator_id, 'ADD_INDICATOR', 'INDICATORS', indResult[0].id, `Added ${indicator_type} indicator for cycle ID ${cycle_id} with result ${result}`]
        );

        res.status(201).json({ id: indResult[0].id, message: 'Indicator logged successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
