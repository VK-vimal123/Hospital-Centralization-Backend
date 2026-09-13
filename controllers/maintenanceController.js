const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');
const { createSystemNotification } = require('../services/notificationService');

const getMaintenance = async (req, res) => {
    try {
        const result = await safeQuery('SELECT 1');
        if (result === null) {
            return res.json(demo.maintenanceRecords);
        }

        // Auto-mark as Overdue if next_due_date has passed
        const [overdueRecords] = await db.query(`
            SELECT m.id, m.equipment_id, e.name as equipment_name
            FROM maintenance_records m
            JOIN equipment e ON m.equipment_id = e.id
            WHERE m.status IN ('Scheduled', 'In Progress') 
            AND m.next_due_date < CURRENT_DATE()
        `);

        if (overdueRecords.length > 0) {
            const overdueIds = overdueRecords.map(r => r.id);
            await db.query(`UPDATE maintenance_records SET status = 'Overdue' WHERE id IN (?)`, [overdueIds]);

            for (const record of overdueRecords) {
                await createSystemNotification(
                    'Maintenance Overdue',
                    `${record.equipment_name} maintenance is now overdue! Immediate attention required.`,
                    'critical'
                );
            }
        }

        const [rows] = await db.query(`
            SELECT m.*, e.name as equipment_name, e.equipment_id as eq_code, u.name as technician_name
            FROM maintenance_records m
            JOIN equipment e ON m.equipment_id = e.id
            JOIN users u ON m.technician_id = u.id
            ORDER BY m.service_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('getMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMaintenanceById = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT m.*, e.name as equipment_name, u.name as technician_name
            FROM maintenance_records m
            JOIN equipment e ON m.equipment_id = e.id
            JOIN users u ON m.technician_id = u.id
            WHERE m.id = ?
        `, [req.params.id]);

        if (result === null) {
            const record = demo.maintenanceRecords.find(m => m.id === Number(req.params.id));
            if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
            return res.json(record);
        }

        if (result[0].length === 0) return res.status(404).json({ message: 'Maintenance record not found' });
        res.json(result[0][0]);
    } catch (error) {
        console.error('getMaintenanceById error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createMaintenance = async (req, res) => {
    try {
        const { equipment_id, technician_id, maintenance_type, service_date, description, parts_replaced, status, next_due_date } = req.body;

        if (!equipment_id || !service_date) {
            return res.status(400).json({ success: false, message: 'Equipment and service date are required' });
        }

        const assignedTechnician = technician_id || req.user.id;

        const result = await safeQuery(
            `INSERT INTO maintenance_records 
             (equipment_id, technician_id, maintenance_type, service_date, description, parts_replaced, status, next_due_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, assignedTechnician, maintenance_type || 'Preventive', service_date, description || '', parts_replaced || '', status || 'Scheduled', next_due_date || null]
        );

        if (result === null) {
            // Fallback for demo mode
            return res.status(201).json({ success: true, id: Math.floor(Math.random() * 1000) });
        }

        // Update equipment's maintenance dates
        if (next_due_date) {
            await safeQuery(
                'UPDATE equipment SET next_maintenance_date = ?, last_maintenance_date = ? WHERE id = ?',
                [next_due_date, service_date, equipment_id]
            );
        }

        // Audit log
        await safeQuery(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'MAINTENANCE', `Scheduled ${maintenance_type || 'Preventive'} maintenance for equipment ID ${equipment_id}`, result[0].insertId]
        );

        // Notification
        const dateStr = next_due_date ? new Date(next_due_date).toLocaleDateString() : service_date;
        await createSystemNotification(
            'Maintenance Scheduled',
            `Maintenance has been scheduled. Next due: ${dateStr}.`,
            'warning'
        );

        res.status(201).json({ success: true, id: result[0].insertId });
    } catch (error) {
        console.error('createMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + (error.message || 'Database connection failed') });
    }
};

const updateMaintenance = async (req, res) => {
    try {
        const { maintenance_type, service_date, description, parts_replaced, status, next_due_date, technician_id } = req.body;

        const result = await safeQuery(
            `UPDATE maintenance_records 
             SET maintenance_type=?, service_date=?, description=?, parts_replaced=?, status=?, next_due_date=?, technician_id=? 
             WHERE id=?`,
            [maintenance_type, service_date, description, parts_replaced, status, next_due_date || null, technician_id || req.user.id, req.params.id]
        );

        if (result === null) {
            return res.json({ success: true });
        }

        // Audit log
        await safeQuery(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'MAINTENANCE', `Updated maintenance record #${req.params.id} — status: ${status}`, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('updateMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + (error.message || 'Database connection failed') });
    }
};

const deleteMaintenance = async (req, res) => {
    try {
        const result = await safeQuery('DELETE FROM maintenance_records WHERE id = ?', [req.params.id]);

        if (result === null) {
            return res.json({ success: true });
        }

        await safeQuery(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'MAINTENANCE', `Deleted maintenance record #${req.params.id}`, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('deleteMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + (error.message || 'Database connection failed') });
    }
};

module.exports = {
    getMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
};
