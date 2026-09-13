const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const initMongo = async () => {
    try {
        console.log('Initializing MongoDB collections...');
        
        // Dynamically load all models
        const modelsDir = path.join(__dirname, '../models');
        const files = fs.readdirSync(modelsDir);
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const Model = require(path.join(modelsDir, file));
                
                // createCollection explicitly creates the collection in MongoDB
                // if it doesn't already exist, making it visible immediately.
                await Model.createCollection().catch(e => {
                    // Ignore "Namespace exists" error
                    if (e.code !== 48) {
                        console.error(`Error creating collection for ${Model.modelName}:`, e);
                    }
                });
            }
        }
        
        console.log('All collections initialized successfully.');

        // Seed a default admin user if no users exist
        const User = require('../models/User');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('No users found. Creating default admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await User.create({
                name: 'System Admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'Admin',
                status: 'active'
            });
            console.log('Default admin created: admin@example.com / admin123');
        }

    } catch (error) {
        console.error('Failed to initialize MongoDB:', error);
    }
};

module.exports = initMongo;
