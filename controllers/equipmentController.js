const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');
const { createSystemNotification } = require('../services/notificationService');

/**
 * Auto-generate equipment_id like EQ-001, EQ-002, etc.
 */
const generateEquipmentId = async () => {
    const result = await safeQuery('SELECT MAX(id) as maxId FROM equipment');
    if (result === null) {
        // Fallback for demo mode
        const maxId = demo.equipment.length > 0 ? Math.max(...demo.equipment.map(e => e.id)) : 0;
        return `EQ-${String(maxId + 1).padStart(3, '0')}`;
    }
    const nextId = (result[0][0].maxId || 0) + 1;
    return `EQ-${String(nextId).padStart(3, '0')}`;
};

const getEquipment = async (req, res) => {
    try {
        const result = await safeQuery('SELECT * FROM equipment ORDER BY created_at DESC');
        if (result === null) {
            return res.json({ success: true, data: demo.equipment });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentById = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT e.*,
                   COUNT(DISTINCT sc.id) as total_cycles,
                   SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) as passed_cycles,
                   SUM(CASE WHEN sc.result = 'FAIL' THEN 1 ELSE 0 END) as failed_cycles,
                   MAX(sc.created_at) as last_cycle_date
            FROM equipment e
            LEFT JOIN sterilization_cycles sc ON e.id = sc.equipment_id
            WHERE e.id = ?
            GROUP BY e.id
        `, [req.params.id]);

        if (result === null) {
            const eq = demo.equipment.find(e => e.id === Number(req.params.id));
            if (!eq) return res.status(404).json({ message: 'Equipment not found' });
            const eqCycles = demo.cycles.filter(c => c.eq_code === eq.equipment_id);
            return res.json({ success: true, data: { ...eq, total_cycles: eqCycles.length, passed_cycles: eqCycles.filter(c => c.result === 'PASS').length, failed_cycles: eqCycles.filter(c => c.result === 'FAIL').length, last_cycle_date: eqCycles.length > 0 ? eqCycles[eqCycles.length - 1].created_at : null } });
        }

        if (result[0].length === 0) return res.status(404).json({ message: 'Equipment not found' });
        res.json({ success: true, data: result[0][0] });
    } catch (error) {
        console.error('getEquipmentById error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * QR scan endpoint — returns equipment details by equipment_id string (public)
 */
const getEquipmentByQR = async (req, res) => {
    try {
        const { equipment_id } = req.params;
        const result = await safeQuery(`
            SELECT e.*,
                   COUNT(DISTINCT sc.id) as total_cycles,
                   SUM(CASE WHEN sc.result = 'PASS' THEN 1 ELSE 0 END) as passed_cycles,
                   SUM(CASE WHEN sc.result = 'FAIL' THEN 1 ELSE 0 END) as failed_cycles,
                   MAX(sc.created_at) as last_cycle_date,
                   (SELECT m.status FROM maintenance_records m WHERE m.equipment_id = e.id ORDER BY m.service_date DESC LIMIT 1) as last_maintenance_status,
                   (SELECT m.next_due_date FROM maintenance_records m WHERE m.equipment_id = e.id ORDER BY m.service_date DESC LIMIT 1) as maintenance_due_date
            FROM equipment e
            LEFT JOIN sterilization_cycles sc ON e.id = sc.equipment_id
            WHERE e.equipment_id = ?
            GROUP BY e.id
        `, [equipment_id]);

        if (result === null) {
            const eq = demo.equipment.find(e => e.equipment_id === equipment_id);
            if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });
            const eqCycles = demo.cycles.filter(c => c.eq_code === eq.equipment_id);
            const passed = eqCycles.filter(c => c.result === 'PASS').length;
            const complianceScore = eqCycles.length > 0 ? ((passed / eqCycles.length) * 100).toFixed(1) : null;
            return res.json({ success: true, data: { ...eq, total_cycles: eqCycles.length, passed_cycles: passed, failed_cycles: eqCycles.filter(c => c.result === 'FAIL').length, compliance_score: complianceScore } });
        }

        if (result[0].length === 0) return res.status(404).json({ success: false, message: 'Equipment not found' });

        const eq = result[0][0];
        const totalCycles = Number(eq.total_cycles) || 0;
        const passedCycles = Number(eq.passed_cycles) || 0;
        const complianceScore = totalCycles > 0 ? ((passedCycles / totalCycles) * 100).toFixed(1) : null;

        res.json({
            success: true,
            data: {
                ...eq,
                compliance_score: complianceScore
            }
        });
    } catch (error) {
        console.error('getEquipmentByQR error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createEquipment = async (req, res) => {
    try {
        const { equipment_id: providedId, name, category, manufacturer, model, serial_number, location, installation_date, status, next_maintenance_date } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Equipment name is required' });
        }

        // Auto-generate equipment_id if not provided
        const equipment_id = providedId || await generateEquipmentId();

        // Check if DB is available
        const testResult = await safeQuery('SELECT 1');
        if (testResult === null) {
            // DB is unavailable, save to demo mode array
            const existing = demo.equipment.find(e => e.equipment_id === equipment_id);
            if (existing) {
                return res.status(400).json({ success: false, message: `Equipment ID '${equipment_id}' already exists` });
            }

            const newId = demo.equipment.length > 0 ? Math.max(...demo.equipment.map(e => e.id)) + 1 : 1;
            const newEq = {
                id: newId,
                equipment_id, name, category: category || null, manufacturer: manufacturer || null, 
                model: model || null, serial_number: serial_number || null, location: location || null, 
                installation_date: installation_date || null, status: status || 'Active', 
                next_maintenance_date: next_maintenance_date || null, last_maintenance_date: null,
                created_at: new Date().toISOString()
            };
            demo.equipment.push(newEq);
            
            // Add a mock audit log
            const newAuditId = demo.auditLogs.length > 0 ? Math.max(...demo.auditLogs.map(l => l.id)) + 1 : 1;
            demo.auditLogs.push({
                id: newAuditId, user_id: req.user.id, module: 'EQUIPMENT', 
                action: `Added equipment: ${name} (${equipment_id}) (Demo Mode)`, 
                record_id: newId, created_at: new Date().toISOString(),
                user_name: req.user.name, user_role: req.user.role
            });

            return res.status(201).json({ success: true, id: newId, equipment_id });
        }

        // DB is available, perform actual insert
        const [existing] = await db.query('SELECT id FROM equipment WHERE equipment_id = ?', [equipment_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: `Equipment ID '${equipment_id}' already exists` });
        }

        const [result] = await db.query(
            `INSERT INTO equipment 
             (equipment_id, name, category, manufacturer, model, serial_number, location, installation_date, status, next_maintenance_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_id, name, category || null, manufacturer || null, model || null, serial_number || null, location || null, installation_date || null, status || 'Active', next_maintenance_date || null]
        );

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'EQUIPMENT', `Added equipment: ${name} (${equipment_id})`, result.insertId]
        );

        await createSystemNotification('Equipment Added', `${name} (${equipment_id}) has been successfully registered.`, 'success');

        res.status(201).json({ success: true, id: result.insertId, equipment_id });
    } catch (error) {
        console.error('createEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { name, category, manufacturer, model, serial_number, location, status, installation_date, next_maintenance_date, last_maintenance_date } = req.body;

        // Check if DB is available
        const testResult = await safeQuery('SELECT 1');
        if (testResult === null) {
            // DB is unavailable, update demo mode array
            const index = demo.equipment.findIndex(e => e.id === Number(req.params.id));
            if (index === -1) return res.status(404).json({ success: false, message: 'Equipment not found' });

            demo.equipment[index] = {
                ...demo.equipment[index],
                name, category, manufacturer, model, serial_number, location, status,
                installation_date: installation_date || null,
                next_maintenance_date: next_maintenance_date || null,
                last_maintenance_date: last_maintenance_date || null
            };

            // Add a mock audit log
            const newAuditId = demo.auditLogs.length > 0 ? Math.max(...demo.auditLogs.map(l => l.id)) + 1 : 1;
            demo.auditLogs.push({
                id: newAuditId, user_id: req.user.id, module: 'EQUIPMENT', 
                action: `Updated equipment: ${name} — status changed to ${status} (Demo Mode)`, 
                record_id: Number(req.params.id), created_at: new Date().toISOString(),
                user_name: req.user.name, user_role: req.user.role
            });

            return res.json({ success: true });
        }

        // Get old values for audit
        const [oldRows] = await db.query('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
        if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Equipment not found' });

        await db.query(
            `UPDATE equipment SET 
             name=?, category=?, manufacturer=?, model=?, serial_number=?, 
             location=?, status=?, installation_date=?, next_maintenance_date=?, last_maintenance_date=? 
             WHERE id=?`,
            [name, category, manufacturer, model, serial_number, location, status,
             installation_date || null, next_maintenance_date || null, last_maintenance_date || null,
             req.params.id]
        );

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'EQUIPMENT', `Updated equipment: ${name} — status changed to ${status}`, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('updateEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteEquipment = async (req, res) => {
    try {
        // Check if DB is available
        const testResult = await safeQuery('SELECT 1');
        if (testResult === null) {
            // DB is unavailable, update demo mode array
            const index = demo.equipment.findIndex(e => e.id === Number(req.params.id));
            if (index === -1) return res.status(404).json({ success: false, message: 'Equipment not found' });
            
            const eqName = demo.equipment[index].name;
            demo.equipment.splice(index, 1);
            
            // Add a mock audit log
            const newAuditId = demo.auditLogs.length > 0 ? Math.max(...demo.auditLogs.map(l => l.id)) + 1 : 1;
            demo.auditLogs.push({
                id: newAuditId, user_id: req.user.id, module: 'EQUIPMENT', 
                action: `Deleted equipment: ${eqName} (Demo Mode)`, 
                record_id: Number(req.params.id), created_at: new Date().toISOString(),
                user_name: req.user.name, user_role: req.user.role
            });

            return res.json({ success: true });
        }

        const [rows] = await db.query('SELECT name, equipment_id FROM equipment WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Equipment not found' });

        await db.query('DELETE FROM equipment WHERE id=?', [req.params.id]);

        // Audit log
        await db.query(
            'INSERT INTO audit_logs (user_id, module, action, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'EQUIPMENT', `Deleted equipment: ${rows[0].name} (${rows[0].equipment_id})`, req.params.id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('deleteEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getEquipment,
    getEquipmentById,
    getEquipmentByQR,
    createEquipment,
    updateEquipment,
    deleteEquipment
};
