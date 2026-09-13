const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { safeQuery } = require('../utils/safeQuery');
const demo = require('../utils/demoData');

const getUsers = async (req, res) => {
    try {
        const result = await safeQuery('SELECT id, name, email, role, created_at FROM users');
        if (result === null) {
            return res.json(demo.users);
        }
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, full_name, role } = req.body;
        
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name || full_name, email, hashedPassword, role || 'Sterilization Staff']
        );
        
        res.status(201).json({ success: true, message: 'User created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUsers,
    createUser
};
