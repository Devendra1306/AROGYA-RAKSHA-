const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { seedDatabase } = require('./config/seed');

const app = express();

app.set('trust proxy', 1);

const { connectDB } = require('./config/db');

// Singleton database connection initialization (ensures connection & seed run once per process, not on every request)
let dbInitPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbInitPromise) {
      dbInitPromise = (async () => {
        await connectDB();
        seedDatabase().catch(err => {
          console.error('Failed to run background database seeding:', err.message);
        });
      })();
    }
    await dbInitPromise;
    next();
  } catch (err) {
    console.error('DB initialization middleware notice:', err.message);
    next();
  }
});

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Log HTTP requests
app.use(morgan('dev'));

// Rate limiting for API requests (scalable production tier)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Generous limit: 600 requests per IP per window to prevent throttling active users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Health check endpoint
const mongoose = require('mongoose');

app.use('/api/health', async (req, res) => {
  if (mongoose.connection.readyState === 2) {
    try {
      await mongoose.connection.asPromise();
    } catch (e) {
      // Catch connection errors, reported in dbError
    }
  }
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    isMockDB: global.isMockDB,
    dbError: global.dbError
  });
});

// Route imports
const authRoutes = require('./routes/auth.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const medicalRoutes = require('./routes/medical.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const dietRoutes = require('./routes/diet.routes');
const medicineRoutes = require('./routes/medicine.routes');
const remedyRoutes = require('./routes/remedy.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const adminRoutes = require('./routes/admin.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/remedies', remedyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

module.exports = app;
