const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Client } = require('pg');

// Load environment variables
dotenv.config();

const app = express();

// Database config (same as db-test.js)
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'xeno_db',
  user: 'postgres',
  password: 'Ujjwal,agg1499@'  // Put real password here
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Xeno Shopify Service'
  });
});

// Test database connection endpoint (WORKING VERSION)
app.get('/test-db', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as timestamp, version()');
    await client.end();
    
    res.status(200).json({ 
      status: 'Database Connected Successfully',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version.split(' ')[1]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database Connection Failed',
      error: error.message 
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app;
