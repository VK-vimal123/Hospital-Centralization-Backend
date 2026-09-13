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
        
        // Seed default cycle profiles if none exist
        const CycleProfile = require('../models/CycleProfile');
        const profileCount = await CycleProfile.countDocuments();
        if (profileCount === 0) {
            console.log('No cycle profiles found. Creating default profiles...');
            await CycleProfile.insertMany([
                { name: '134°C Pre-Vac 4 min', cycle_type: 'Steam', minimum_temperature: 134, pressure_min: 30, minimum_duration: 4, active: true },
                { name: '121°C Gravity 30 min', cycle_type: 'Steam', minimum_temperature: 121, pressure_min: 15, minimum_duration: 30, active: true },
                { name: 'Standard H2O2 Plasma 45 min', cycle_type: 'Plasma', minimum_temperature: 50, pressure_min: 0, minimum_duration: 45, active: true },
                { name: 'Standard EtO 12 hours', cycle_type: 'EtO', minimum_temperature: 55, pressure_min: 0, minimum_duration: 720, active: true },
                { name: 'Standard Wash & Disinfect 45 min', cycle_type: 'Washer', minimum_temperature: 90, pressure_min: 0, minimum_duration: 45, active: true },
                { name: '160°C Dry Heat 2 hours', cycle_type: 'Dry Heat', minimum_temperature: 160, pressure_min: 0, minimum_duration: 120, active: true }
            ]);
            console.log('Default cycle profiles created.');
        }

    } catch (error) {
        console.error('Failed to initialize MongoDB:', error);
    }
};

module.exports = initMongo;
