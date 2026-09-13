require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB Connection
const db = require('./config/db');
db.query('SELECT 1')
  .then(() => {
      console.log('Database connected successfully');
  })
  .catch(err => console.error('Database connection failed:', err.message));

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
