const CycleProfile = require('../models/CycleProfile');
const SterilizationCycle = require('../models/SterilizationCycle');
const Equipment = require('../models/Equipment');

const getProfiles = async (req, res) => {
    try {
        const profiles = await CycleProfile.find().lean();
        res.json(profiles.map(p => ({ ...p, id: p._id })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getComplianceSummary = async (req, res) => {
    try {
        const totalCycles = await SterilizationCycle.countDocuments();
        const passedCycles = await SterilizationCycle.countDocuments({ result: 'PASS' });
        
        const complianceRate = totalCycles > 0 ? ((passedCycles / totalCycles) * 100).toFixed(1) : 100;
        
        res.json({
            overall_compliance: complianceRate,
            total_checks: totalCycles,
            passed_checks: passedCycles,
            failed_checks: totalCycles - passedCycles
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentCompliance = async (req, res) => {
    try {
        const equipment = await Equipment.find().lean();
        const equipmentCompliance = [];

        for (const eq of equipment) {
            const cycles = await SterilizationCycle.find({ equipment_id: eq._id }).lean();
            const total = cycles.length;
            const passed = cycles.filter(c => c.result === 'PASS').length;
            const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 100;

            equipmentCompliance.push({
                equipment_name: eq.name,
                eq_code: eq.equipment_id,
                compliance_score: rate,
                total_cycles: total,
                failures: total - passed
            });
        }
        
        res.json(equipmentCompliance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const checkCompliance = async (req, res) => res.json({ success: true });
const verifyCycle = async (req, res) => res.json({ success: true });

module.exports = {
    getProfiles,
    getComplianceSummary,
    getEquipmentCompliance,
    checkCompliance,
    verifyCycle
};
