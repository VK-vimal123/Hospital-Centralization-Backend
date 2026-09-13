const mysql = require('mysql2/promise');
async function fix() {
    const conn = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'sterilization_db'});
    await conn.query("UPDATE users SET status = 'Active' WHERE status = 'active'");
    const [users] = await conn.query('SELECT id, name, role, status FROM users');
    console.log('Users:', JSON.stringify(users, null, 2));
    await conn.end();
}
fix().catch(console.error);
