const Equipment = require('../models/Equipment');
const SterilizationCycle = require('../models/SterilizationCycle');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Notification = require('../models/Notification');

const getDashboardSummary = async (req, res) => {
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
        
        res.json({
            success: true,
            data: {
                totalEquipment,
                complianceRate,
                pendingMaintenance,
                totalCycles
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getRecentCycles = async (req, res) => {
    try {
        const recentCycles = await SterilizationCycle.find()
            .populate('equipment_id', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        res.json({ success: true, data: recentCycles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getComplianceChart = async (req, res) => {
    try {
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
        
        res.json({ success: true, data: chartData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMonthlyStats = async (req, res) => {
    try {
        res.json({ success: true, data: [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentStatusChart = async (req, res) => {
    try {
        const active = await Equipment.countDocuments({ status: 'Active' });
        const inactive = await Equipment.countDocuments({ status: 'Inactive' });
        const maintenance = await Equipment.countDocuments({ status: 'Maintenance' });
        
        res.json({ success: true, data: { active, inactive, maintenance } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getEquipmentUsage = async (req, res) => {
    try {
        const usage = await SterilizationCycle.aggregate([
            {
                $group: {
                    _id: "$equipment_id",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // This would ideally map equipment IDs to names, but for now we return counts
        res.json({ success: true, data: usage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getRecentNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5).lean();
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getDashboardSummary,
    getRecentCycles,
    getComplianceChart,
    getMonthlyStats,
    getEquipmentStatusChart,
    getEquipmentUsage,
    getRecentNotifications
};
