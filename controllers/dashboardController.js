const db = require('../config/db');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

/**
 * GET /dashboard/summary
 * Returns all key statistics from real DB data
 */
const getDashboardSummary = async (req, res) => {
    try {
        const result = await safeQuery('SELECT 1');
        if (result === null) {
            // Demo fallback
            const eq = demo.equipment;
            const cy = demo.cycles;
            const mt = demo.maintenanceRecords;
            const nf = demo.notifications;
            const total = cy.length;
            const passed = cy.filter(c => c.result === 'PASS').length;
            const failed = cy.filter(c => c.result === 'FAIL').length;

            return res.json({
                success: true,
                equipment: {
                    total: eq.length,
                    active: eq.filter(e => e.status === 'Active').length,
                    under_maintenance: eq.filter(e => e.status === 'Under Maintenance').length,
                    out_of_service: eq.filter(e => e.status === 'Out of Service').length,
                    inactive: eq.filter(e => e.status !== 'Active').length
                },
                cycles: {
                    total, today: 0, passed, failed, warning: 0, successful: passed
                },
                maintenance: {
                    scheduled: mt.filter(m => m.status === 'Scheduled').length,
                    overdue: mt.filter(m => m.status === 'Overdue').length,
                    in_progress: mt.filter(m => m.status === 'In Progress').length,
                    due: mt.filter(m => m.status === 'Scheduled').length
                },
                compliance_percentage: total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 0,
                unread_notifications: nf.filter(n => !n.is_read).length
            });
        }

        // Equipment counts
        const [equipmentCount] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as under_maintenance,
                SUM(CASE WHEN status = 'Out of Service' THEN 1 ELSE 0 END) as out_of_service
            FROM equipment
        `);

        // All-time cycle stats
        const [cycleStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN result = 'WARNING' THEN 1 ELSE 0 END) as warning
            FROM sterilization_cycles
        `);

        // Today's cycle stats
        const [todayStats] = await db.query(`
            SELECT COUNT(*) as today_total
            FROM sterilization_cycles 
            WHERE DATE(created_at) = CURDATE()
        `);

        // Maintenance stats
        const [maintenanceStats] = await db.query(`
            SELECT 
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
                SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress
            FROM maintenance_records
        `);

        // Compliance %
        const total = Number(cycleStats[0].total) || 0;
        const passed = Number(cycleStats[0].passed) || 0;
        const compliance_percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        // Unread notifications count
        const [notifCount] = await db.query(`SELECT COUNT(*) as unread FROM notifications WHERE is_read = FALSE`);

        res.json({
            success: true,
            equipment: {
                total: Number(equipmentCount[0].total) || 0,
                active: Number(equipmentCount[0].active) || 0,
                under_maintenance: Number(equipmentCount[0].under_maintenance) || 0,
                out_of_service: Number(equipmentCount[0].out_of_service) || 0,
                inactive: Number(equipmentCount[0].under_maintenance) + Number(equipmentCount[0].out_of_service) || 0
            },
            cycles: {
                total: Number(cycleStats[0].total) || 0,
                today: Number(todayStats[0].today_total) || 0,
                passed: Number(cycleStats[0].passed) || 0,
                failed: Number(cycleStats[0].failed) || 0,
                warning: Number(cycleStats[0].warning) || 0,
                // Legacy keys for backwards compatibility
                successful: Number(cycleStats[0].passed) || 0
            },
            maintenance: {
                scheduled: Number(maintenanceStats[0].scheduled) || 0,
                overdue: Number(maintenanceStats[0].overdue) || 0,
                in_progress: Number(maintenanceStats[0].in_progress) || 0,
                // Legacy key
                due: Number(maintenanceStats[0].scheduled) || 0
            },
            compliance_percentage: Number(compliance_percentage),
            unread_notifications: Number(notifCount[0].unread) || 0
        });
    } catch (error) {
        console.error('getDashboardSummary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/cycles
 * Recent 10 cycles with equipment and operator names
 */
const getRecentCycles = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT c.id, c.batch_number, c.cycle_type, c.start_time, c.end_time,
                   c.temperature, c.pressure, c.duration, c.result, c.failure_reason,
                   c.created_at, e.name as equipment_name, u.name as operator_name
            FROM sterilization_cycles c
            JOIN equipment e ON c.equipment_id = e.id
            JOIN users u ON c.operator_id = u.id
            ORDER BY c.created_at DESC
            LIMIT 10
        `);
        if (result === null) {
            return res.json(demo.cycles.slice(0, 10).reverse());
        }
        res.json(result[0]);
    } catch (error) {
        console.error('getRecentCycles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/compliance-trend
 * Daily compliance % over last 30 days
 */
const getComplianceChart = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
                ROUND(SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as compliance_pct
            FROM sterilization_cycles
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        if (result === null) {
            // Build demo trend from cycle data
            const grouped = {};
            demo.cycles.forEach(c => {
                const date = c.created_at.split('T')[0];
                if (!grouped[date]) grouped[date] = { total: 0, passed: 0 };
                grouped[date].total++;
                if (c.result === 'PASS') grouped[date].passed++;
            });
            const data = Object.entries(grouped).map(([date, v]) => ({
                date, total: v.total, passed: v.passed, compliance_pct: ((v.passed / v.total) * 100).toFixed(1)
            })).sort((a, b) => a.date.localeCompare(b.date));
            return res.json({ success: true, data });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getComplianceChart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/monthly-stats
 * Sterilization cycles by month (last 6 months) — for bar/area chart
 */
const getMonthlyStats = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT 
                DATE_FORMAT(created_at, '%b') as month,
                DATE_FORMAT(created_at, '%Y-%m') as month_key,
                COUNT(*) as total_cycles,
                SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed,
                ROUND(SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as compliance
            FROM sterilization_cycles
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
            ORDER BY month_key ASC
        `);
        if (result === null) {
            const total = demo.cycles.length;
            const passed = demo.cycles.filter(c => c.result === 'PASS').length;
            const failed = demo.cycles.filter(c => c.result === 'FAIL').length;
            return res.json({ success: true, data: [
                { month: 'Sep', month_key: '2026-09', total_cycles: total, passed, failed, compliance: ((passed / total) * 100).toFixed(1) }
            ]});
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getMonthlyStats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/equipment-status
 * Equipment status breakdown for pie chart
 */
const getEquipmentStatusChart = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT status, COUNT(*) as count
            FROM equipment
            GROUP BY status
        `);
        if (result === null) {
            const statusMap = {};
            demo.equipment.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
            return res.json({ success: true, data: Object.entries(statusMap).map(([status, count]) => ({ status, count })) });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getEquipmentStatusChart error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/equipment-usage
 * Top equipment by cycle count
 */
const getEquipmentUsage = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT e.name, COUNT(sc.id) as cycle_count
            FROM equipment e
            LEFT JOIN sterilization_cycles sc ON e.id = sc.equipment_id
            GROUP BY e.id, e.name
            ORDER BY cycle_count DESC
            LIMIT 8
        `);
        if (result === null) {
            const usageMap = {};
            demo.equipment.forEach(e => { usageMap[e.name] = 0; });
            demo.cycles.forEach(c => { if (usageMap[c.equipment_name] !== undefined) usageMap[c.equipment_name]++; });
            return res.json({ success: true, data: Object.entries(usageMap).map(([name, cycle_count]) => ({ name, cycle_count })).sort((a, b) => b.cycle_count - a.cycle_count) });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getEquipmentUsage error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /dashboard/recent-notifications
 * Recent 5 unread notifications for dashboard alert panel
 */
const getRecentNotifications = async (req, res) => {
    try {
        const result = await safeQuery(`
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 5
        `);
        if (result === null) {
            return res.json({ success: true, data: demo.notifications.filter(n => !n.is_read).slice(0, 5) });
        }
        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('getRecentNotifications error:', error);
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
