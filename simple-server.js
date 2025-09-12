const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const shopifyService = require('./src/services/shopifyService');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'xeno-shopify-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'xeno_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ujjwal,agg1499@'
};

// ROOT ROUTE - Fix "Cannot GET /"
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Xeno Shopify Service API',
    version: '1.0.0',
    status: 'Server running successfully',
    endpoints: {
      health: '/health',
      database: '/test-db',
      auth: '/api/auth/login',
      dashboard: '/api/dashboard/:tenantId',
      shopify: '/api/shopify/test',
      sync: {
        customers: 'POST /api/sync/customers',
        products: 'POST /api/sync/products',
        orders: 'POST /api/sync/orders',
        all: 'POST /api/sync/all'
      },
      analytics: {
        ordersByDate: '/api/analytics/orders-by-date',
        topCustomers: '/api/analytics/top-customers',
        customerGrowth: '/api/analytics/customer-growth'
      }
    }
  });
});

// Environment debug
app.get('/debug/env', (req, res) => {
  res.json({
    SHOPIFY_STORE_URL: process.env.SHOPIFY_STORE_URL,
    SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
    hasStoreUrl: !!process.env.SHOPIFY_STORE_URL,
    storeUrlLength: process.env.SHOPIFY_STORE_URL?.length || 0
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Xeno Shopify Service'
  });
});

// Database test endpoint
app.get('/test-db', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as timestamp');
    await client.end();
    
    res.json({ 
      status: 'Database Connected Successfully',
      timestamp: result.rows[0].timestamp
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database Connection Failed',
      error: error.message 
    });
  }
});

// AUTHENTICATION ENDPOINTS
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Demo users for authentication
  const validUsers = {
    'admin@xeno.com': 'admin123',
    'ujjwal@techmart.com': 'password123',
    'demo@shopify.com': 'demo123'
  };
  
  try {
    if (validUsers[email] && validUsers[email] === password) {
      const token = jwt.sign(
        { email, userId: email.split('@')[0] },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: { email, name: email.split('@')[0] },
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Test Shopify connection
app.get('/api/shopify/test', async (req, res) => {
  try {
    const result = await shopifyService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Shopify connection failed',
      message: error.message
    });
  }
});

// FIXED Dashboard endpoint - Remove backslashes
app.get('/api/dashboard/:tenantId', async (req, res) => {
  console.log('📊 Dashboard request for tenant:', req.params.tenantId);
  
  try {
    const { tenantId } = req.params;
    const client = new Client(dbConfig);
    await client.connect();
    
    const [customers, products, orders] = await Promise.all([
      client.query('SELECT COUNT(*) FROM customers WHERE "tenantId" = $1', [tenantId]),
      client.query('SELECT COUNT(*) FROM products WHERE "tenantId" = $1', [tenantId]),
      client.query('SELECT COUNT(*), SUM("totalPrice") FROM orders WHERE "tenantId" = $1', [tenantId])
    ]);
    
    await client.end();
    
    const stats = {
      totalCustomers: parseInt(customers.rows[0].count) || 0,
      totalProducts: parseInt(products.rows[0].count) || 0,
      totalOrders: parseInt(orders.rows[0].count) || 0,
      totalRevenue: parseFloat(orders.rows[0].sum || 0)
    };
    
    console.log('📊 Dashboard stats:', stats);
    
    res.json({
      success: true,
      tenantId,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

// ANALYTICS ENDPOINTS
app.get('/api/analytics/orders-by-date', async (req, res) => {
  const { tenantId = 1, startDate, endDate } = req.query;
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    let query = `
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as orders,
        SUM("totalPrice") as revenue
      FROM orders 
      WHERE "tenantId" = $1
    `;
    
    const params = [tenantId];
    
    if (startDate && endDate) {
      query += ` AND "createdAt" BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }
    
    query += ` GROUP BY DATE("createdAt") ORDER BY date DESC LIMIT 30`;
    
    const result = await client.query(query, params);
    await client.end();
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: row.date,
        orders: parseInt(row.orders),
        revenue: parseFloat(row.revenue || 0)
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders by date',
      error: error.message
    });
  }
});

app.get('/api/analytics/top-customers', async (req, res) => {
  const { tenantId = 1 } = req.query;
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        c.email,
        c."firstName",
        c."lastName",
        c."totalSpent",
        c."ordersCount"
      FROM customers c
      WHERE c."tenantId" = $1
      ORDER BY c."totalSpent" DESC
      LIMIT 5
    `, [tenantId]);
    
    await client.end();
    
    res.json({
      success: true,
      data: result.rows.map(customer => ({
        email: customer.email,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        totalSpent: parseFloat(customer.totalSpent || 0),
        ordersCount: parseInt(customer.ordersCount || 0)
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top customers',
      error: error.message
    });
  }
});

// SYNC ENDPOINTS
app.post('/api/sync/customers', async (req, res) => {
  const { tenantId = 1 } = req.body;
  
  try {
    const result = await shopifyService.syncCustomers(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync customers',
      message: error.message
    });
  }
});

app.post('/api/sync/products', async (req, res) => {
  const { tenantId = 1 } = req.body;
  
  try {
    const result = await shopifyService.syncProducts(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync products',
      message: error.message
    });
  }
});

app.post('/api/sync/orders', async (req, res) => {
  const { tenantId = 1 } = req.body;
  
  try {
    const result = await shopifyService.syncOrders(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync orders',
      message: error.message
    });
  }
});

app.post('/api/sync/all', async (req, res) => {
  const { tenantId = 1 } = req.body;
  
  try {
    const result = await shopifyService.syncAll(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync all data',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 XENO SHOPIFY PRIVATE APP SERVICE!');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🗄️ Database: http://localhost:${PORT}/test-db`);
  console.log(`🛒 Shopify Test: http://localhost:${PORT}/api/shopify/test`);
  console.log(`🔐 Login: POST /api/auth/login`);
  console.log('📊 Data Sync APIs:');
  console.log(`   POST /api/sync/customers`);
  console.log(`   POST /api/sync/products`);  
  console.log(`   POST /api/sync/orders`);
  console.log(`   POST /api/sync/all`);
  console.log(`   GET  /api/dashboard/:tenantId`);
  console.log('📈 Analytics APIs:');
  console.log(`   GET  /api/analytics/orders-by-date`);
  console.log(`   GET  /api/analytics/top-customers`);
});
