const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('id name email role createdAt status');
        // Map _id to id for frontend compatibility
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.createdAt
        }));
        res.json(formattedUsers);
    } catch (error) {
        console.error('getUsers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, full_name, role } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name: name || full_name,
            email,
            password: hashedPassword,
            role: role || 'Sterilization Staff'
        });
        
        res.status(201).json({ success: true, message: 'User created', user: newUser });
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUsers,
    createUser
};
