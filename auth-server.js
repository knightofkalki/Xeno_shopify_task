const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ADD PRISMA CONNECTION
const { prisma } = require('./src/config/database');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'xeno-shopify-secret-key';

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Auth Server Working', timestamp: new Date() });
});

// Registration endpoint - ADD DATABASE SAVE
app.post('/api/auth/register-tenant', async (req, res) => {
  console.log('📝 Registration endpoint hit');
  console.log('📝 Body:', req.body);
  
  try {
    const { ownerEmail, ownerPassword, storeName, shopDomain, accessToken, ownerFirstName, ownerLastName } = req.body;
    
    if (!ownerEmail || !ownerPassword || !storeName || !shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // CHECK IF USER ALREADY EXISTS
    const existingTenant = await prisma.tenant.findFirst({
      where: { shopDomain }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Store already registered'
      });
    }

    // HASH PASSWORD
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    // CREATE TENANT IN DATABASE
    const newTenant = await prisma.tenant.create({
      data: {
        name: storeName,
        shopDomain,
        accessToken,
        isActive: true
      }
    });

    // CREATE USER IN DATABASE
    const newUser = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: hashedPassword,
        firstName: ownerFirstName || '',
        lastName: ownerLastName || '',
        role: 'ADMIN',
        tenantId: newTenant.id,
        isActive: true
      }
    });

    console.log('✅ Registration successful in database');
    
    res.json({
      success: true,
      message: 'Registration successful!',
      tenant: { id: newTenant.id, name: storeName },
      user: { id: newUser.id, email: ownerEmail }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login endpoint - ADD DATABASE VERIFICATION
app.post('/api/auth/login-tenant', async (req, res) => {
  console.log('🔑 Login endpoint hit');
  console.log('🔑 Body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    // FIND USER IN DATABASE
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // VERIFY PASSWORD
    const bcrypt = require('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // GENERATE JWT TOKEN
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful from database');
    
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.shopDomain
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// Add these endpoints to auth-server.js

// Dashboard endpoint
app.get('/api/dashboard/:tenantId', async (req, res) => {
  console.log('📊 Dashboard request for tenant:', req.params.tenantId);
  
  // Mock data for now
  res.json({
    success: true,
    tenantId: req.params.tenantId,
    stats: {
      totalCustomers: 25,
      totalOrders: 50,
      totalRevenue: 5000,
      recentOrders: []
    },
    timestamp: new Date().toISOString()
  });
});

// Analytics endpoints
app.get('/api/analytics/orders-by-date', (req, res) => {
  console.log('📈 Orders by date request');
  
  res.json({
    success: true,
    data: [
      { date: '2025-09-15', orders: 5, revenue: 500 },
      { date: '2025-09-14', orders: 8, revenue: 800 },
      { date: '2025-09-13', orders: 3, revenue: 300 }
    ]
  });
});

app.get('/api/analytics/top-customers', (req, res) => {
  console.log('🏆 Top customers request');
  
  res.json({
    success: true,
    data: [
      { name: 'John Doe', email: 'john@example.com', totalSpent: 1200 },
      { name: 'Jane Smith', email: 'jane@example.com', totalSpent: 950 }
    ]
  });
});


app.listen(PORT, () => {
  console.log('✅ AUTH SERVER WITH DATABASE STARTED!');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log('🗄️ Database: Connected via Prisma');
});
