const MaintenanceRecord = require('../models/MaintenanceRecord');
const Equipment = require('../models/Equipment');
const AuditLog = require('../models/AuditLog');
const { createSystemNotification } = require('../services/notificationService');

const getMaintenance = async (req, res) => {
    try {
        // Auto-mark as Overdue if next_due_date has passed
        const currentDate = new Date();
        const overdueRecords = await MaintenanceRecord.find({
            status: { $in: ['Scheduled', 'In Progress'] },
            next_due_date: { $lt: currentDate }
        }).populate('equipment_id');

        if (overdueRecords.length > 0) {
            const overdueIds = overdueRecords.map(r => r._id);
            await MaintenanceRecord.updateMany(
                { _id: { $in: overdueIds } },
                { status: 'Overdue' }
            );

            for (const record of overdueRecords) {
                if (record.equipment_id) {
                    await createSystemNotification(
                        'Maintenance Overdue',
                        `${record.equipment_id.name} maintenance is now overdue! Immediate attention required.`,
                        'critical'
                    );
                }
            }
        }

        const records = await MaintenanceRecord.find()
            .populate('equipment_id', 'name equipment_id')
            .populate('technician_id', 'name')
            .sort({ service_date: -1 })
            .lean();

        // Format for frontend
        const formattedRecords = records.map(m => ({
            id: m._id,
            equipment_id: m.equipment_id ? m.equipment_id._id : null,
            equipment_name: m.equipment_id ? m.equipment_id.name : 'Unknown',
            eq_code: m.equipment_id ? m.equipment_id.equipment_id : 'Unknown',
            technician_id: m.technician_id ? m.technician_id._id : null,
            technician_name: m.technician_id ? m.technician_id.name : 'Unknown',
            maintenance_type: m.maintenance_type,
            service_date: m.service_date,
            description: m.description,
            parts_replaced: m.parts_replaced,
            status: m.status,
            next_due_date: m.next_due_date,
            created_at: m.createdAt
        }));

        res.json(formattedRecords);
    } catch (error) {
        console.error('getMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMaintenanceById = async (req, res) => {
    try {
        const m = await MaintenanceRecord.findById(req.params.id)
            .populate('equipment_id', 'name equipment_id')
            .populate('technician_id', 'name')
            .lean();

        if (!m) return res.status(404).json({ message: 'Maintenance record not found' });

        const formattedRecord = {
            id: m._id,
            equipment_id: m.equipment_id ? m.equipment_id._id : null,
            equipment_name: m.equipment_id ? m.equipment_id.name : 'Unknown',
            technician_id: m.technician_id ? m.technician_id._id : null,
            technician_name: m.technician_id ? m.technician_id.name : 'Unknown',
            maintenance_type: m.maintenance_type,
            service_date: m.service_date,
            description: m.description,
            parts_replaced: m.parts_replaced,
            status: m.status,
            next_due_date: m.next_due_date,
            created_at: m.createdAt
        };

        res.json(formattedRecord);
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

        const newRecord = await MaintenanceRecord.create({
            equipment_id,
            technician_id: assignedTechnician,
            maintenance_type: maintenance_type || 'Preventive',
            service_date,
            description: description || '',
            parts_replaced: parts_replaced || '',
            status: status || 'Scheduled',
            next_due_date: next_due_date || null
        });

        if (next_due_date) {
            await Equipment.findByIdAndUpdate(equipment_id, {
                next_maintenance_date: next_due_date,
                last_maintenance_date: service_date
            });
        }

        await AuditLog.create({
            user_id: req.user.id,
            module: 'MAINTENANCE',
            action: `Scheduled ${maintenance_type || 'Preventive'} maintenance for equipment ID ${equipment_id}`,
            record_id: newRecord._id
        });

        const dateStr = next_due_date ? new Date(next_due_date).toLocaleDateString() : new Date(service_date).toLocaleDateString();
        await createSystemNotification(
            'Maintenance Scheduled',
            `Maintenance has been scheduled. Next due: ${dateStr}.`,
            'warning'
        );

        res.status(201).json({ success: true, id: newRecord._id });
    } catch (error) {
        console.error('createMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const updateMaintenance = async (req, res) => {
    try {
        const { maintenance_type, service_date, description, parts_replaced, status, next_due_date, technician_id } = req.body;

        await MaintenanceRecord.findByIdAndUpdate(req.params.id, {
            maintenance_type,
            service_date,
            description,
            parts_replaced,
            status,
            next_due_date: next_due_date || null,
            technician_id: technician_id || req.user.id
        });

        await AuditLog.create({
            user_id: req.user.id,
            module: 'MAINTENANCE',
            action: `Updated maintenance record #${req.params.id} — status: ${status}`,
            record_id: req.params.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('updateMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

const deleteMaintenance = async (req, res) => {
    try {
        await MaintenanceRecord.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            user_id: req.user.id,
            module: 'MAINTENANCE',
            action: `Deleted maintenance record #${req.params.id}`,
            record_id: req.params.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('deleteMaintenance error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

module.exports = {
    getMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
};
