const cron = require('node-cron');
const db = require('./config/db');
const { createSystemNotification } = require('./services/notificationService');

const initCronJobs = () => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily maintenance check cron job...');
        try {
            // 1. Overdue Maintenance Alert
            const [overdueRecords] = await db.query(`
                SELECT m.id, m.equipment_id, e.name as equipment_name 
                FROM maintenance_records m
                JOIN equipment e ON m.equipment_id = e.id
                WHERE m.status IN ('Scheduled', 'In Progress') 
                AND m.next_due_date < CURRENT_DATE()
            `);
            
            if (overdueRecords.length > 0) {
                const overdueIds = overdueRecords.map(r => r.id);
                await db.query(`UPDATE maintenance_records SET status = 'Overdue' WHERE id IN (?)`, [overdueIds]);
                
                for (const record of overdueRecords) {
                    await createSystemNotification('Maintenance Overdue', `${record.equipment_name} maintenance is overdue.`, 'critical');
                }
            }

            // 2. Upcoming Maintenance Reminder (e.g., due in next 7 days)
            const [upcomingRecords] = await db.query(`
                SELECT m.id, m.equipment_id, m.next_due_date, e.name as equipment_name 
                FROM maintenance_records m
                JOIN equipment e ON m.equipment_id = e.id
                WHERE m.status = 'Scheduled' 
                AND m.next_due_date >= CURRENT_DATE() 
                AND m.next_due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
            `);
            
            for (const record of upcomingRecords) {
                await createSystemNotification('Maintenance Reminder', `${record.equipment_name} maintenance is due soon.`, 'warning');
            }
            
        } catch (error) {
            console.error('Error running daily maintenance cron job:', error);
        }
    });
};

module.exports = initCronJobs;
