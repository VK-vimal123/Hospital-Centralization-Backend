require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
const connectDB = require('./config/db');
const initMongo = require('./utils/initMongo');
connectDB().then(() => {
    initMongo();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/cycles', require('./routes/cycleRoutes'));
app.use('/api/compliance', require('./routes/complianceRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
    res.send('<h1>Hospital Sterilization API Backend</h1><p>The backend is running successfully on Vercel. Please access the API via /api/* routes.</p>');
});

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'Hospital Sterilization API is active. Access specific endpoints via /api/[resource]' });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Initialize Cron Jobs
const initCronJobs = require('./cronJobs');
initCronJobs();

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
// trigger restart
// trigger restart 2
// trigger restart 3
