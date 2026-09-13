const Equipment = require('../models/Equipment');
const SterilizationCycle = require('../models/SterilizationCycle');
const MaintenanceRecord = require('../models/MaintenanceRecord');

const getDashboardStats = async (req, res) => {
    try {
        const totalEquipment = await Equipment.countDocuments();
        
        const cycleCounts = await SterilizationCycle.aggregate([
            {
                $group: {
                    _id: "$result",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        let passedCycles = 0;
        let failedCycles = 0;
        let totalCycles = 0;

        cycleCounts.forEach(c => {
            totalCycles += c.count;
            if (c._id === 'PASS') passedCycles = c.count;
            if (c._id === 'FAIL') failedCycles = c.count;
        });
        
        const complianceRate = totalCycles > 0 ? Math.round((passedCycles / totalCycles) * 100) : 100;
        const pendingMaintenance = await MaintenanceRecord.countDocuments({ status: { $in: ['Scheduled', 'Overdue'] } });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCycles = await SterilizationCycle.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    passed: { $sum: { $cond: [{ $eq: ["$result", "PASS"] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ["$result", "FAIL"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const chartData = recentCycles.map(c => ({
            date: c._id,
            passed: c.passed,
            failed: c.failed
        }));

        res.json({
            success: true,
            stats: {
                totalEquipment,
                complianceRate,
                pendingMaintenance,
                totalCycles
            },
            chartData
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getRecentAlerts = async (req, res) => {
    try {
        const failedCycles = await SterilizationCycle.find({ result: 'FAIL' })
            .populate('equipment_id', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
            
        const overdueMaintenance = await MaintenanceRecord.find({ status: 'Overdue' })
            .populate('equipment_id', 'name')
            .sort({ service_date: -1 })
            .limit(5)
            .lean();
            
        const alerts = [];
        failedCycles.forEach(c => {
            alerts.push({
                id: `c_${c._id}`,
                type: 'Failure',
                message: `Cycle failed on ${c.equipment_id ? c.equipment_id.name : 'Unknown Equipment'}`,
                date: c.createdAt,
                severity: 'critical'
            });
        });
        
        overdueMaintenance.forEach(m => {
            alerts.push({
                id: `m_${m._id}`,
                type: 'Maintenance',
                message: `Overdue maintenance on ${m.equipment_id ? m.equipment_id.name : 'Unknown Equipment'}`,
                date: m.next_due_date || m.service_date,
                severity: 'warning'
            });
        });
        
        alerts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ success: true, alerts: alerts.slice(0, 5) });
    } catch (error) {
        console.error('getRecentAlerts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    getRecentAlerts
};
