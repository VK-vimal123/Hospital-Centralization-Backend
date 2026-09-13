const ComplianceRule = require('../models/ComplianceRule');
const SterilizationCycle = require('../models/SterilizationCycle');

const getComplianceRules = async (req, res) => {
    try {
        const rules = await ComplianceRule.find().lean();
        res.json({ success: true, data: rules.map(r => ({ ...r, id: r._id })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getComplianceRuleById = async (req, res) => {
    try {
        const rule = await ComplianceRule.findById(req.params.id).lean();
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
        res.json({ success: true, data: { ...rule, id: rule._id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createComplianceRule = async (req, res) => {
    try {
        const { cycle_type, equipment_type, min_temperature, max_temperature, min_pressure, max_pressure, min_exposure_time, max_exposure_time } = req.body;
        const rule = await ComplianceRule.create({
            cycle_type, equipment_type, min_temperature, max_temperature, min_pressure, max_pressure, min_exposure_time, max_exposure_time
        });
        res.status(201).json({ success: true, id: rule._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateComplianceRule = async (req, res) => {
    try {
        const { cycle_type, equipment_type, min_temperature, max_temperature, min_pressure, max_pressure, min_exposure_time, max_exposure_time } = req.body;
        const rule = await ComplianceRule.findByIdAndUpdate(req.params.id, {
            cycle_type, equipment_type, min_temperature, max_temperature, min_pressure, max_pressure, min_exposure_time, max_exposure_time
        });
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteComplianceRule = async (req, res) => {
    try {
        const rule = await ComplianceRule.findByIdAndDelete(req.params.id);
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getComplianceReport = async (req, res) => {
    try {
        const cycles = await SterilizationCycle.find()
            .populate('equipment_id', 'name equipment_id')
            .populate('operator_id', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = cycles.map(c => ({
            id: c._id,
            cycle_id: c.batch_number,
            equipment_name: c.equipment_id ? c.equipment_id.name : 'Unknown',
            operator_name: c.operator_id ? c.operator_id.name : 'Unknown',
            cycle_type: c.cycle_type,
            date: c.createdAt,
            status: c.result === 'PASS' ? 'Compliant' : 'Non-Compliant',
            details: c.failure_reason || 'Passed all parameters'
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getNonCompliantCycles = async (req, res) => {
    try {
        const cycles = await SterilizationCycle.find({ result: 'FAIL' })
            .populate('equipment_id', 'name equipment_id')
            .populate('operator_id', 'name')
            .sort({ createdAt: -1 })
            .lean();
        const formatted = cycles.map(c => ({
            id: c._id,
            cycle_id: c.batch_number,
            equipment_name: c.equipment_id ? c.equipment_id.name : 'Unknown',
            operator_name: c.operator_id ? c.operator_id.name : 'Unknown',
            cycle_type: c.cycle_type,
            date: c.createdAt,
            details: c.failure_reason || 'Failed parameters'
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getComplianceRules,
    getComplianceRuleById,
    createComplianceRule,
    updateComplianceRule,
    deleteComplianceRule,
    getComplianceReport,
    getNonCompliantCycles
};
