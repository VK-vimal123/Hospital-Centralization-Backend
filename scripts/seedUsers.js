require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
    let connection;
    try {
        // Connect without database first to ensure it exists
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            multipleStatements: true
        });

        console.log('Connected to MySQL. Setting up database...');
        
        // Ensure Database Exists
        await connection.query('CREATE DATABASE IF NOT EXISTS sterilization_db');
        await connection.query('USE sterilization_db');

        // Read and Execute schema.sql to ensure table structures are correct
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(schemaSql);
            console.log('Schema executed successfully.');
        } else {
            console.warn('schema.sql not found at', schemaPath, 'skipping schema execution.');
        }

        // Demo users to insert
        const users = [
            { username: 'admin_demo', password: 'password123', full_name: 'Admin User', role: 'admin', status: 'active' },
            { username: 'staff_demo1', password: 'password123', full_name: 'John Operator', role: 'sterilization_staff', status: 'active' },
            { username: 'super_demo', password: 'password123', full_name: 'Dr. Smith', role: 'supervisor', status: 'active' },
            { username: 'maint_demo', password: 'password123', full_name: 'Mike Wrench', role: 'maintenance', status: 'active' }
        ];

        console.log('Seeding users...');
        for (const user of users) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(user.password, salt);

            await connection.query(`
                INSERT INTO users (username, password_hash, full_name, role, status) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    password_hash = VALUES(password_hash),
                    role = VALUES(role),
                    full_name = VALUES(full_name),
                    status = VALUES(status)
            `, [user.username, hash, user.full_name, user.role, user.status]);
            
            console.log(`Upserted user: ${user.username} with role ${user.role}`);
        }

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

seed();
