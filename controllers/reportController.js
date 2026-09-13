const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

const generateReport = async (req, res) => {
    try {
        const { type, startDate, endDate, equipmentId } = req.query;
        
        if (type === 'sterilization') {
            const result = await safeQuery(`
                SELECT c.*, e.name as equipment_name, u.name as operator_name 
                FROM sterilization_cycles c
                JOIN equipment e ON c.equipment_id = e.id
                JOIN users u ON c.operator_id = u.id
                WHERE 1=1
                ORDER BY c.created_at DESC
            `);
            if (result === null) {
                let data = demo.cycles;
                if (equipmentId) data = data.filter(c => String(c.equipment_id || c.eq_code) === String(equipmentId));
                return res.json(data);
            }

            // With DB available, use parameterized query
            let query = `
                SELECT c.*, e.name as equipment_name, u.name as operator_name 
                FROM sterilization_cycles c
                JOIN equipment e ON c.equipment_id = e.id
                JOIN users u ON c.operator_id = u.id
                WHERE 1=1
            `;
            let params = [];
            if (startDate) { query += ' AND c.created_at >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND c.created_at <= ?'; params.push(endDate); }
            if (equipmentId) { query += ' AND c.equipment_id = ?'; params.push(equipmentId); }
            
            const [rows] = await db.query(query, params);
            res.json(rows);
        } else if (type === 'maintenance') {
            const result = await safeQuery(`
                SELECT m.*, e.name as equipment_name, u.name as technician_name 
                FROM maintenance_records m
                JOIN equipment e ON m.equipment_id = e.id
                JOIN users u ON m.technician_id = u.id
                WHERE 1=1
                ORDER BY m.service_date DESC
            `);
            if (result === null) {
                return res.json(demo.maintenanceRecords);
            }

            let query = `
                SELECT m.*, e.name as equipment_name, u.name as technician_name 
                FROM maintenance_records m
                JOIN equipment e ON m.equipment_id = e.id
                JOIN users u ON m.technician_id = u.id
                WHERE 1=1
            `;
            let params = [];
            if (startDate) { query += ' AND m.service_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND m.service_date <= ?'; params.push(endDate); }
            if (equipmentId) { query += ' AND m.equipment_id = ?'; params.push(equipmentId); }
            
            const [rows] = await db.query(query, params);
            res.json(rows);
        } else {
            res.status(400).json({ message: 'Invalid report type' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    generateReport
};
