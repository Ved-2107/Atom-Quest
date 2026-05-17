const express = require('express');
const mongoose = require('mongoose');
const cors    = require('cors');
const morgan  = require('morgan');
require('dotenv').config();

const authRoutes       = require('./src/routes/auth');
const goalRoutes       = require('./src/routes/goals');
const userRoutes       = require('./src/routes/users');
const checkInRoutes    = require('./src/routes/checkIns');
const auditRoutes      = require('./src/routes/audit');
const analyticsRoutes  = require('./src/routes/analytics');
const sharedGoalRoutes = require('./src/routes/sharedGoals');
const notifRoutes      = require('./src/routes/notifications');
const { cycleRouter }  = require('./src/routes/cycles');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',         authRoutes);
app.use('/api/goals',        goalRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/check-ins',    checkInRoutes);
app.use('/api/audit',        auditRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/shared-goals', sharedGoalRoutes);
app.use('/api/cycles',       cycleRouter);
app.use('/api/notifications', notifRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracker';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📋 Health check  → http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
