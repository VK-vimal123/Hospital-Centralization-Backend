const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../database/sterilization.db');
const schemaPath = path.resolve(__dirname, '../../database/schema.sqlite.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening DB:", err);
        process.exit(1);
    }
});

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema, (err) => {
    if (err) {
        console.error("Error executing schema:", err);
        process.exit(1);
    }
    console.log("Database initialized successfully!");
    db.close();
});
