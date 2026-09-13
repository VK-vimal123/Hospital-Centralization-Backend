const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function runSeed() {
    console.log('Seeding database...');
    
    try {
        // Clear existing data
        await db.query('DELETE FROM compliance_records');
        await db.query('DELETE FROM sterilization_cycles');
        await db.query('DELETE FROM compliance_rules');
        await db.query('DELETE FROM equipment');
        await db.query('DELETE FROM users');
        
        // 1. Technicians
        console.log('Inserting technicians...');
        const passwordHash = await bcrypt.hash('password123', 10);
        await db.query(
            `INSERT INTO users (username, password_hash, full_name, role) VALUES 
            ('tech1', $1, 'Alice Smith', 'sterilization_staff'),
            ('tech2', $2, 'Bob Jones', 'sterilization_staff'),
            ('admin', $3, 'Admin User', 'admin')`,
            [passwordHash, passwordHash, passwordHash]
        );
        const { rows: users } = await db.query('SELECT id, username FROM users');
        const tech1Id = users.find(u => u.username === 'tech1').id;
        const tech2Id = users.find(u => u.username === 'tech2').id;

        // 2. Autoclaves
        console.log('Inserting autoclaves...');
        await db.query(
            `INSERT INTO equipment (equipment_code, name, type, manufacturer, model, status, cycle_count, maintenance_cycle_threshold) VALUES
            ('AC-001', 'Steam Sterilizer Alpha', 'Autoclave', 'Steris', 'Model-X', 'Active', 120, 500),
            ('AC-002', 'Steam Sterilizer Beta', 'Autoclave', 'Steris', 'Model-Y', 'Calibration Due', 505, 500),
            ('AC-003', 'Steam Sterilizer Gamma', 'Autoclave', 'Getinge', 'Model-Z', 'In Progress', 45, 500)`
        );
        const { rows: equipments } = await db.query('SELECT id, equipment_code FROM equipment');
        const eq1 = equipments.find(e => e.equipment_code === 'AC-001').id;
        const eq2 = equipments.find(e => e.equipment_code === 'AC-002').id;
        const eq3 = equipments.find(e => e.equipment_code === 'AC-003').id;

        // 3. Compliance Rules
        console.log('Inserting compliance rules...');
        await db.query(
            `INSERT INTO compliance_rules (cycle_type, equipment_type, min_temperature, max_temperature, min_pressure, max_pressure, min_exposure_time, max_exposure_time) VALUES
            ('Standard (121C)', 'Autoclave', 121.0, 124.0, 1.0, 1.5, 15, 30),
            ('Flash (132C)', 'Autoclave', 132.0, 135.0, 1.8, 2.2, 3, 10)`
        );

        // 4. 10 Historical Cycles
        console.log('Inserting 10 historical cycles...');
        const oneDay = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Passed cycles
        for (let i = 1; i <= 6; i++) {
            const st = new Date(now - i * oneDay).toISOString();
            const et = new Date(now - i * oneDay + 30 * 60000).toISOString();
            await db.query(
                `INSERT INTO sterilization_cycles (cycle_number, equipment_id, operator_id, cycle_type, start_time, end_time, temperature, pressure, exposure_time, overall_result)
                 VALUES ($1, $2, $3, 'Standard (121C)', $4, $5, 122.5, 1.2, 20, 'Passed')`,
                [`CYC-100${i}`, eq1, tech1Id, st, et]
            );
        }

        // Failed cycles
        for (let i = 7; i <= 8; i++) {
            const st = new Date(now - i * oneDay).toISOString();
            const et = new Date(now - i * oneDay + 30 * 60000).toISOString();
            await db.query(
                `INSERT INTO sterilization_cycles (cycle_number, equipment_id, operator_id, cycle_type, start_time, end_time, temperature, pressure, exposure_time, overall_result, remarks)
                 VALUES ($1, $2, $3, 'Standard (121C)', $4, $5, 119.0, 1.2, 20, 'Failed', 'Temperature dropped below minimum')`,
                [`CYC-100${i}`, eq2, tech2Id, st, et]
            );
        }

        // In-progress cycles
        for (let i = 9; i <= 10; i++) {
            const st = new Date(now - (i - 8) * 3600000).toISOString(); // 1-2 hours ago
            await db.query(
                `INSERT INTO sterilization_cycles (cycle_number, equipment_id, operator_id, cycle_type, start_time, overall_result)
                 VALUES ($1, $2, $3, 'Standard (121C)', $4, 'In Progress')`,
                [`CYC-100${i}`, eq3, tech1Id, st]
            );
        }

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

runSeed();
