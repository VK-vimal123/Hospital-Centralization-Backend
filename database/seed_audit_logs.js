const db = require('../config/db');

async function seedAuditLogs() {
    try {
        console.log('Seeding mock audit logs...');
        
        // Ensure there is at least one user to reference
        const [users] = await db.query('SELECT id FROM users LIMIT 1');
        let userId = 1; // Default
        
        if (users.length === 0) {
            console.log('No users found. Creating a dummy admin user...');
            const [result] = await db.query(
                `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)`,
                ['Admin User', 'admin@example.com', 'hashedpassword', 'Admin', 'Active']
            );
            userId = result.insertId;
        } else {
            userId = users[0].id;
        }

        // Insert mock audit logs
        await db.query(`
            INSERT INTO audit_logs (user_id, module, action, record_id, created_at) VALUES 
            (?, 'SYSTEM', 'System started and initialized', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
            (?, 'EQUIPMENT', 'Added Autoclave A-1', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
            (?, 'CYCLE', 'Cycle #1024 Started', 1024, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
            (?, 'COMPLIANCE', 'Verified cycle #1024', 1024, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
            (?, 'EQUIPMENT', 'Updated status for Washer W-1 to Maintenance', 2, NOW())
        `, [userId, userId, userId, userId, userId]);
        
        console.log('Successfully seeded audit logs!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed audit logs:', error);
        process.exit(1);
    }
}

seedAuditLogs();
