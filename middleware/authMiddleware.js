const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        
        if (!token || token === 'undefined' || token === 'null' || token === 'demo_token_123') {
            return res.status(401).json({ message: 'Not authorized, token missing or invalid format' });
        }

        // Step 1: Verify JWT — if this fails, it's a real auth error
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_dev_key');
        } catch (jwtError) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        // Step 2: Try to fetch user from DB, fall back to demo user if DB is unavailable
        try {
            const [users] = await db.query(
                'SELECT id, name, email, role, status FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = users[0];
        } catch (dbError) {
            // Database unavailable — construct demo user from JWT so app keeps working
            const demoRoles = { 1: 'Admin', 2: 'Sterilization Staff', 3: 'Maintenance Staff' };
            req.user = {
                id: decoded.id,
                name: demoRoles[decoded.id] ? demoRoles[decoded.id] : 'Demo User',
                email: 'demo@hospital.com',
                role: demoRoles[decoded.id] || 'Sterilization Staff',
                status: 'active'
            };
        }

        next();
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};


const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user?.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
