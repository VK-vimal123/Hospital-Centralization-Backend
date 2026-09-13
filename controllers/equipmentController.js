const Equipment = require('../models/Equipment');
const SterilizationCycle = require('../models/SterilizationCycle');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const AuditLog = require('../models/AuditLog');
const { createSystemNotification } = require('../services/notificationService');

const generateEquipmentId = async () => {
    const eq = await Equipment.findOne().sort({ createdAt: -1 });
    if (!eq || !eq.equipment_id.startsWith('EQ-')) return 'EQ-001';
    
    const num = parseInt(eq.equipment_id.replace('EQ-', ''));
    if (isNaN(num)) return 'EQ-001';
    
    return `EQ-${String(num + 1).padStart(3, '0')}`;
};

const getEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find().sort({ createdAt: -1 }).lean();
        const formatted = equipment.map(e => ({ ...e, id: e._id }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('getEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentById = async (req, res) => {
    try {
        const e = await Equipment.findById(req.params.id).lean();
        if (!e) return res.status(404).json({ message: 'Equipment not found' });

        const cycles = await SterilizationCycle.find({ equipment_id: e._id });
        const passed_cycles = cycles.filter(c => c.result === 'PASS').length;
        const failed_cycles = cycles.filter(c => c.result === 'FAIL').length;
        const last_cycle = cycles.length > 0 ? cycles[cycles.length - 1].createdAt : null;

        res.json({
            success: true,
            data: {
                ...e,
                id: e._id,
                total_cycles: cycles.length,
                passed_cycles,
                failed_cycles,
                last_cycle_date: last_cycle
            }
        });
    } catch (error) {
        console.error('getEquipmentById error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentByQR = async (req, res) => {
    try {
        const { equipment_id } = req.params;
        const e = await Equipment.findOne({ equipment_id }).lean();
        if (!e) return res.status(404).json({ success: false, message: 'Equipment not found' });

        const cycles = await SterilizationCycle.find({ equipment_id: e._id });
        const passed_cycles = cycles.filter(c => c.result === 'PASS').length;
        const failed_cycles = cycles.filter(c => c.result === 'FAIL').length;
        
        const latestMaintenance = await MaintenanceRecord.findOne({ equipment_id: e._id }).sort({ service_date: -1 });

        const totalCycles = cycles.length;
        const complianceScore = totalCycles > 0 ? ((passed_cycles / totalCycles) * 100).toFixed(1) : null;

        res.json({
            success: true,
            data: {
                ...e,
                id: e._id,
                total_cycles: totalCycles,
                passed_cycles,
                failed_cycles,
                compliance_score: complianceScore,
                last_maintenance_status: latestMaintenance ? latestMaintenance.status : null,
                maintenance_due_date: latestMaintenance ? latestMaintenance.next_due_date : null
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

        if (!name) return res.status(400).json({ success: false, message: 'Equipment name is required' });

        const equipment_id = providedId || await generateEquipmentId();
        const existing = await Equipment.findOne({ equipment_id });
        if (existing) return res.status(400).json({ success: false, message: `Equipment ID '${equipment_id}' already exists` });

        const newEq = await Equipment.create({
            equipment_id, name, category, manufacturer, model, serial_number, location, installation_date, status: status || 'Active', next_maintenance_date
        });

        await AuditLog.create({
            user_id: req.user.id, module: 'EQUIPMENT', action: `Added equipment: ${name} (${equipment_id})`, record_id: newEq._id
        });

        await createSystemNotification('Equipment Added', `${name} (${equipment_id}) has been successfully registered.`, 'success');

        res.status(201).json({ success: true, id: newEq._id, equipment_id });
    } catch (error) {
        console.error('createEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { name, category, manufacturer, model, serial_number, location, status, installation_date, next_maintenance_date, last_maintenance_date } = req.body;

        const eq = await Equipment.findByIdAndUpdate(req.params.id, {
            name, category, manufacturer, model, serial_number, location, status, installation_date, next_maintenance_date, last_maintenance_date
        });

        if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });

        await AuditLog.create({
            user_id: req.user.id, module: 'EQUIPMENT', action: `Updated equipment: ${name} — status changed to ${status}`, record_id: req.params.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('updateEquipment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteEquipment = async (req, res) => {
    try {
        const eq = await Equipment.findByIdAndDelete(req.params.id);
        if (!eq) return res.status(404).json({ success: false, message: 'Equipment not found' });

        await AuditLog.create({
            user_id: req.user.id, module: 'EQUIPMENT', action: `Deleted equipment: ${eq.name} (${eq.equipment_id})`, record_id: req.params.id
        });

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
