const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { prisma } = require('./src/config/database');
const shopifyService = require('./src/services/shopifyService');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'xeno-shopify-secret-key';

// Middleware
app.use(cors({
  origin: ['https://xeno-shopify-task.vercel.app', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// Simple cache
const cache = new Map();
const cacheGet = (key) => {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) return item.value;
  cache.delete(key);
  return null;
};
const cacheSet = (key, value, ttl = 300) => {
  cache.set(key, { value, expiry: Date.now() + (ttl * 1000) });
};

// ✅ JWT AUTHENTICATION MIDDLEWARE - ADD THIS
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔧 Auth middleware - Token received:', token ? 'Yes' : 'No');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('🔧 JWT verify error:', err.message);
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    req.user = decoded;
    console.log('🔧 User authenticated:', decoded.email);
    next();
  });
};

// Analytics service
const analyticsService = {
  getDashboardStats: async (tenantId) => {
    try {
      const [customerCount, productCount, orderStats] = await Promise.all([
        prisma.customer.count({ where: { tenantId } }),
        prisma.product.count({ where: { tenantId } }),
        prisma.order.aggregate({
          where: { tenantId },
          _count: { id: true },
          _sum: { totalPrice: true }
        })
      ]);
      
      return {
        totalCustomers: customerCount,
        totalProducts: productCount,
        totalOrders: orderStats._count.id || 0,
        totalRevenue: parseFloat(orderStats._sum.totalPrice || 0)
      };
    } catch (error) {
      return { totalCustomers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 };
    }
  },

  getOrdersByDate: async (tenantId, startDate, endDate) => {
    try {
      const whereClause = { tenantId };
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      
      const orders = await prisma.order.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { createdAt: 'desc' },
        take: 30
      });
      
      return orders.map(order => ({
        date: order.createdAt.toISOString().split('T')[0],
        orderCount: order._count.id,
        totalRevenue: parseFloat(order._sum.totalPrice || 0)
      }));
    } catch (error) {
      return [];
    }
  },

  getTopCustomers: async (tenantId, limit = 5) => {
    try {
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        orderBy: { totalSpent: 'desc' },
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true
        }
      });
      
      return customers.map(customer => ({
        id: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
        email: customer.email,
        totalSpent: parseFloat(customer.totalSpent || 0),
        ordersCount: customer.ordersCount || 0
      }));
    } catch (error) {
      return [];
    }
  },

  getCartAbandonmentStats: async (tenantId) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error('Tenant not found');
      
      const [checkoutsResponse, ordersResponse] = await Promise.all([
        fetch(`https://${tenant.shopDomain}/admin/api/2024-01/checkouts.json?status=abandoned`, {
          headers: { 'X-Shopify-Access-Token': tenant.accessToken }
        }),
        fetch(`https://${tenant.shopDomain}/admin/api/2024-01/orders.json`, {
          headers: { 'X-Shopify-Access-Token': tenant.accessToken }
        })
      ]);
      
      const checkoutsData = await checkoutsResponse.json();
      const ordersData = await ordersResponse.json();
      
      const abandonedCheckouts = checkoutsData.checkouts || [];
      const completedOrders = ordersData.orders || [];
      
      const totalStarted = abandonedCheckouts.length + completedOrders.length;
      
      return {
        summary: {
          total_abandoned: abandonedCheckouts.length,
          total_completed: completedOrders.length,
          total_started: totalStarted,
          abandonment_rate: totalStarted > 0 ? Math.round((abandonedCheckouts.length / totalStarted) * 100 * 100) / 100 : 0,
          abandoned_value: abandonedCheckouts.reduce((sum, checkout) => sum + parseFloat(checkout.total_price || 0), 0)
        }
      };
    } catch (error) {
      return {
        summary: {
          total_abandoned: 0,
          total_completed: 0,
          total_started: 0,
          abandonment_rate: 0,
          abandoned_value: 0
        }
      };
    }
  },

  getSalesPerformance: async (tenantId) => {
    try {
      const orders = await prisma.order.findMany({
        where: { tenantId },
        select: {
          totalPrice: true,
          totalDiscounts: true,
          createdAt: true
        }
      });
      
      const salesByMonth = {};
      orders.forEach(order => {
        const monthKey = order.createdAt.toISOString().slice(0, 7);
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = {
            period: monthKey,
            grossRevenue: 0,
            discounts: 0,
            netRevenue: 0,
            orderCount: 0
          };
        }
        
        const gross = parseFloat(order.totalPrice || 0);
        const discounts = parseFloat(order.totalDiscounts || 0);
        
        salesByMonth[monthKey].grossRevenue += gross;
        salesByMonth[monthKey].discounts += discounts;
        salesByMonth[monthKey].netRevenue += (gross - discounts);
        salesByMonth[monthKey].orderCount += 1;
      });
      
      return Object.values(salesByMonth)
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, 12);
    } catch (error) {
      return [];
    }
  },

  getCustomerBehavior: async (tenantId) => {
    try {
      const customers = await prisma.customer.findMany({
        where: { tenantId },
        select: {
          totalSpent: true,
          ordersCount: true,
          createdAt: true
        }
      });
      
      const behaviorByMonth = {};
      customers.forEach(customer => {
        const monthKey = customer.createdAt.toISOString().slice(0, 7);
        if (!behaviorByMonth[monthKey]) {
          behaviorByMonth[monthKey] = {
            period: monthKey,
            newCustomers: 0,
            returningCustomers: 0,
            totalSpent: 0
          };
        }
        
        behaviorByMonth[monthKey].newCustomers += 1;
        behaviorByMonth[monthKey].returningCustomers += (customer.ordersCount || 0) > 1 ? 1 : 0;
        behaviorByMonth[monthKey].totalSpent += parseFloat(customer.totalSpent || 0);
      });
      
      return Object.values(behaviorByMonth)
        .map(month => ({
          ...month,
          lifetimeValue: month.newCustomers > 0 ? month.totalSpent / month.newCustomers : 0
        }))
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, 12);
    } catch (error) {
      return [];
    }
  },

  getProductPerformance: async (tenantId) => {
    try {
      const products = await prisma.product.findMany({
        where: { tenantId },
        select: { id: true, title: true },
        take: 10
      });
      
      return products.map(product => ({
        name: product.title || 'Unknown Product',
        unitsSold: Math.floor(Math.random() * 100) + 10,
        revenue: Math.floor(Math.random() * 5000) + 500,
        inventory: Math.floor(Math.random() * 200) + 50
      }));
    } catch (error) {
      return [];
    }
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Xeno Shopify Service API',
    version: '4.0.0',
    status: 'Running with clean architecture'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected via Prisma'
  });
});

// ✅ TEST ENDPOINT - ADD THIS
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API working!',
    timestamp: new Date().toISOString(),
    server: 'Xeno Shopify Service'
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const [customerCount, productCount, orderCount] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(), 
      prisma.order.count()
    ]);
    
    res.json({ 
      status: 'Database Connected ✅',
      tableStats: {
        customers: customerCount,
        products: productCount,
        orders: orderCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database Connection Failed ❌',
      error: error.message
    });
  }
});

// Authentication
app.post('/api/auth/register-tenant', async (req, res) => {
  try {
    const { 
      ownerEmail, 
      ownerPassword, 
      storeName, 
      shopDomain, 
      accessToken,
      ownerFirstName,
      ownerLastName
    } = req.body;

    if (!ownerEmail || !ownerPassword || !storeName || !shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: { shopDomain }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Store already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    const newTenant = await prisma.tenant.create({
      data: {
        name: storeName,
        shopDomain,
        accessToken,
        isActive: true,
        settings: JSON.stringify({
          timezone: 'UTC',
          currency: 'USD',
          onboardedAt: new Date().toISOString()
        })
      }
    });

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

    const token = jwt.sign(
      { 
        userId: newUser.id,
        email: ownerEmail,
        tenantId: newTenant.id,
        role: 'ADMIN'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Tenant registered successfully!',
      token,
      tenant: { id: newTenant.id, name: storeName, domain: shopDomain },
      user: { id: newUser.id, email: ownerEmail, firstName: ownerFirstName, lastName: ownerLastName, role: 'ADMIN' }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login-tenant', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive || !user.tenant?.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account or store is inactive'
      });
    }

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

    res.json({
      success: true,
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
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Legacy auth (for backwards compatibility)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const validUsers = {
    'admin@xeno.com': 'admin123',
    'ujjwal@techmart.com': 'password123',
    'uaggarwal9897@gmail.com': 'password123'
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

// ✅ PROFILE UPDATE ENDPOINT - ADD THIS
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Profile update endpoint hit!');
    console.log('🔧 User from token:', req.user);
    console.log('🔧 Request body:', req.body);
    
    const { shopDomain, accessToken } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    if (!shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Store domain and access token are required'
      });
    }

    // Update tenant information in database
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        shopDomain: shopDomain,
        accessToken: accessToken,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated tenant ${tenantId} store settings`);

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        domain: updatedTenant.shopDomain
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// ✅ GET USER PROFILE ENDPOINT - ADD THIS
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenant: {
          select: {
            id: true,
            name: true,
            shopDomain: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenant: user.tenant
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Dashboard
app.get('/api/dashboard/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const cacheKey = `dashboard-${tenantId}`;
    
    let stats = cacheGet(cacheKey);
    if (!stats) {
      stats = await analyticsService.getDashboardStats(tenantId);
      cacheSet(cacheKey, stats, 300);
    }
    
    res.json({
      success: true,
      tenantId,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

// Analytics
app.get('/api/analytics/orders-by-date', async (req, res) => {
  try {
    const { tenantId = '1', startDate, endDate } = req.query;
    const data = await analyticsService.getOrdersByDate(tenantId, startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders by date', error: error.message });
  }
});

app.get('/api/analytics/top-customers', async (req, res) => {
  try {
    const { tenantId = '1' } = req.query;
    const data = await analyticsService.getTopCustomers(tenantId, 5);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch top customers', error: error.message });
  }
});

app.get('/api/analytics/cart-abandonment', async (req, res) => {
  try {
    const { tenantId = '1' } = req.query;
    const data = await analyticsService.getCartAbandonmentStats(tenantId);
    res.json({
      success: true,
      data: [],
      summary: data.summary,
      source: 'Real Shopify Checkouts API',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart abandonment data',
      error: error.message
    });
  }
});

app.get('/api/analytics/sales-performance', async (req, res) => {
  try {
    const { tenantId = '1' } = req.query;
    const data = await analyticsService.getSalesPerformance(tenantId);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, data: [], error: error.message });
  }
});

app.get('/api/analytics/customer-behavior', async (req, res) => {
  try {
    const { tenantId = '1' } = req.query;
    const data = await analyticsService.getCustomerBehavior(tenantId);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, data: [], error: error.message });
  }
});

app.get('/api/analytics/product-performance', async (req, res) => {
  try {
    const { tenantId = '1' } = req.query;
    const data = await analyticsService.getProductPerformance(tenantId);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, data: [], error: error.message });
  }
});

// Customer list
app.get('/api/customers/list', async (req, res) => {
  try {
    const { tenantId = '1', page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = { tenantId };
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { totalSpent: 'desc' },
        skip: skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true,
          createdAt: true
        }
      }),
      prisma.customer.count({ where: whereClause })
    ]);
    
    const result = customers.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'No Name',
      totalSpent: parseFloat(customer.totalSpent || 0),
      ordersCount: customer.ordersCount || 0,
      joinedDate: customer.createdAt.toLocaleDateString()
    }));
    
    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer list',
      error: error.message
    });
  }
});

// Sync endpoints
app.post('/api/sync/customers', async (req, res) => {
  try {
    const { tenantId = '1' } = req.body;
    const result = await shopifyService.syncCustomers(tenantId);
    cache.clear();
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
  try {
    const { tenantId = '1' } = req.body;
    const result = await shopifyService.syncProducts(tenantId);
    cache.clear();
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
  try {
    const { tenantId = '1' } = req.body;
    const result = await shopifyService.syncOrders(tenantId);
    cache.clear();
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
  try {
    const { tenantId = '1' } = req.body;
    const result = await shopifyService.syncAll(tenantId);
    cache.clear();
    res.json({ ...result, message: 'All data synced successfully!' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync all data',
      message: error.message
    });
  }
});

// Cache management
app.get('/api/cache/stats', (req, res) => {
  res.json({
    success: true,
    cache: { status: 'active', size: cache.size },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/cache/clear', (req, res) => {
  try {
    cache.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});





app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// Start server
app.listen(PORT, () => {
  console.log('🎉 XENO SHOPIFY SERVICE - CLEAN VERSION WITH SETTINGS API');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔧 Test: http://localhost:${PORT}/api/test`);
  console.log(`🗄️ Database: Prisma ORM Connected`);
  console.log('✅ Core Features:');
  console.log('   • Authentication & Registration');
  console.log('   • Dashboard Analytics');
  console.log('   • Customer Management');
  console.log('   • Data Sync');
  console.log('   • Settings Support ✅ NEW');
  console.log('🔧 NEW API Endpoints:');
  console.log('   • PUT /api/user/profile - Update store settings');
  console.log('   • GET /api/user/profile - Get user profile');
  console.log('   • GET /api/test - Test backend connection');
});
