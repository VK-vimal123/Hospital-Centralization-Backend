/**
 * Database Setup Script - Run from backend/ directory
 * node scripts/setup-db.js
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        console.log('✅ Connected to MySQL');

        await conn.query('CREATE DATABASE IF NOT EXISTS sterilization_db');
        console.log('✅ Database sterilization_db created/confirmed');
        await conn.query('USE sterilization_db');

        // Apply schema
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 5);
            for (const stmt of statements) {
                try { await conn.query(stmt); } catch (e) {
                    if (!e.message.includes('already exists')) console.warn('Schema:', e.message.substring(0, 80));
                }
            }
            console.log('✅ Schema applied');
        }

        // Apply migration + seed
        const migratePath = path.join(__dirname, '../../database/migrate.sql');
        if (fs.existsSync(migratePath)) {
            const migrate = fs.readFileSync(migratePath, 'utf8');
            const statements = migrate
                .replace(/USE sterilization_db;/g, '')
                .split(';').map(s => s.trim())
                .filter(s => s.length > 5 && !s.startsWith('--') && !s.startsWith('/*'));
            for (const stmt of statements) {
                try { await conn.query(stmt); } catch (e) {
                    if (!e.message.includes('Duplicate entry') && !e.message.includes('already exists')) {
                        console.warn('Migration:', e.message.substring(0, 100));
                    }
                }
            }
            console.log('✅ Migration + seed data applied');
        }

        const [tables] = await conn.query('SHOW TABLES');
        console.log('\n📋 Tables:', tables.map(t => Object.values(t)[0]).join(', '));

        const [users] = await conn.query('SELECT COUNT(*) as c FROM users');
        const [eq] = await conn.query('SELECT COUNT(*) as c FROM equipment');
        const [cyc] = await conn.query('SELECT COUNT(*) as c FROM sterilization_cycles');
        console.log(`📊 Records: ${users[0].c} users, ${eq[0].c} equipment, ${cyc[0].c} cycles`);
        console.log('\n🎉 Setup complete!');
        console.log('   Admin login: admin@hospital.com / Admin@123');
        console.log('   Staff login: staff@hospital.com / Admin@123');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
    } finally {
        if (conn) await conn.end();
        process.exit(0);
    }
}
setup();
