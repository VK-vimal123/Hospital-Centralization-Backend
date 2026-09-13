const SterilizationCycle = require('../models/SterilizationCycle');
const MaintenanceRecord = require('../models/MaintenanceRecord');

const generateReport = async (req, res) => {
    try {
        const totalCycles = await SterilizationCycle.countDocuments();
        const passedCycles = await SterilizationCycle.countDocuments({ result: 'PASS' });
        const failedCycles = await SterilizationCycle.countDocuments({ result: 'FAIL' });
        
        const overdueMaintenance = await MaintenanceRecord.countDocuments({ status: 'Overdue' });

        res.json({
            success: true,
            data: {
                total_cycles: totalCycles,
                passed_cycles: passedCycles,
                failed_cycles: failedCycles,
                overdue_maintenance: overdueMaintenance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { generateReport };
