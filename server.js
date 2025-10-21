const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
require('dotenv').config();

const drawsRoutes = require('./routes/draws');
const tokensRoutes = require('./routes/tokens');
const scanService = require('./services/scanService');
const { pool } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'On Chain Lotto API'
  });
});

// API Routes
app.use('/api/draws', drawsRoutes);
app.use('/api/tokens', tokensRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎰 On Chain Lotto API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      draws: '/api/draws',
      createDraw: 'POST /api/draws',
      getDraw: 'GET /api/draws/:id',
      scanDraw: 'POST /api/draws/:id/scan'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Scheduled job to scan active draws every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  console.log('\n⏰ Running scheduled scan of active draws...');
  try {
    await scanService.scanAllActiveDraws();
  } catch (error) {
    console.error('Error in scheduled scan:', error);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log('\n🚀 On Chain Lotto API Server Starting...\n');
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️  Please check your DATABASE_URL in .env file');
  }

  console.log(`\n🎰 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔄 Auto-scan enabled: Every 2 minutes\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

