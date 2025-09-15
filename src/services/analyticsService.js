const { prisma } = require('../config/database');
const cacheService = require('./cacheService');

// Why: Analytics queries with intelligent caching for performance
// What: Dashboard analytics with automatic cache management + Real Shopify Cart Abandonment
class AnalyticsService {
  // Dashboard statistics with caching
  static async getDashboardStats(tenantId) {
    const cacheKey = 'dashboard-stats';
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey);
    if (cached) return cached;

    // Fetch from database
    const [customerCount, productCount, orderStats] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId },
        _count: { id: true },
        _sum: { totalPrice: true }
      })
    ]);

    const stats = {
      totalCustomers: customerCount,
      totalProducts: productCount,
      totalOrders: orderStats._count.id || 0,
      totalRevenue: parseFloat(orderStats._sum.totalPrice || 0)
    };

    // Cache for 5 minutes
    await cacheService.set(tenantId, cacheKey, stats);
    return stats;
  }

  // Orders by date with caching
  static async getOrdersByDate(tenantId, startDate, endDate) {
    const cacheKey = 'orders-by-date';
    const params = { startDate, endDate };
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey, params);
    if (cached) return cached;

    // Build query
    const whereClause = { tenantId };
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch from database
    const orders = await prisma.order.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const result = orders.map(order => ({
      date: order.createdAt.toISOString().split('T')[0],
      orders: order._count.id,
      revenue: parseFloat(order._sum.totalPrice || 0)
    }));

    // Cache for 10 minutes
    await cacheService.set(tenantId, cacheKey, result, params);
    return result;
  }

  // Top customers with caching
  static async getTopCustomers(tenantId, limit = 5) {
    const cacheKey = 'top-customers';
    const params = { limit };
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey, params);
    if (cached) return cached;

    // Fetch from database
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

    const result = customers.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      totalSpent: parseFloat(customer.totalSpent),
      ordersCount: customer.ordersCount
    }));

    // Cache for 15 minutes
    await cacheService.set(tenantId, cacheKey, result, params);
    return result;
  }

  // Customer growth with caching
  static async getCustomerGrowth(tenantId, startDate, endDate) {
    const cacheKey = 'customer-growth';
    const params = { startDate, endDate };
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey, params);
    if (cached) return cached;

    // Build query
    const whereClause = { tenantId };
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch from database
    const growth = await prisma.customer.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 30
    });

    const result = growth.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      newCustomers: item._count.id
    }));

    // Cache for 20 minutes
    await cacheService.set(tenantId, cacheKey, result, params);
    return result;
  }

  // 🛒 TASK 1: Real Cart Abandonment from Shopify API
  static async getCartAbandonmentStats(tenantId, startDate, endDate) {
    const cacheKey = 'cart-abandonment';
    const params = { startDate, endDate };
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey, params);
    if (cached) return cached;

    try {
      console.log('🛒 Fetching real cart abandonment data from Shopify...');
      
      // Get tenant config for Shopify API calls
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Build date filter
      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = `&created_at_min=${startDate}&created_at_max=${endDate}`;
      } else {
        // Default to last 30 days if no date range provided
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter = `&created_at_min=${thirtyDaysAgo.toISOString()}`;
      }

      console.log('🔗 Shopify API calls starting...');

      // Fetch abandoned checkouts from Shopify
      const abandonedResponse = await fetch(
        `https://${tenant.shopDomain}/admin/api/2024-01/checkouts.json?status=open${dateFilter}`,
        {
          headers: {
            'X-Shopify-Access-Token': tenant.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!abandonedResponse.ok) {
        throw new Error(`Shopify checkouts API failed: ${abandonedResponse.status}`);
      }

      const abandonedData = await abandonedResponse.json();
      const abandonedCheckouts = abandonedData.checkouts || [];

      // Fetch completed orders from Shopify  
      const ordersResponse = await fetch(
        `https://${tenant.shopDomain}/admin/api/2024-01/orders.json?status=any${dateFilter}`,
        {
          headers: {
            'X-Shopify-Access-Token': tenant.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!ordersResponse.ok) {
        throw new Error(`Shopify orders API failed: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      const completedOrders = ordersData.orders || [];

      console.log(`📊 Found ${abandonedCheckouts.length} abandoned checkouts, ${completedOrders.length} completed orders`);

      // Calculate metrics
      const abandonedCarts = abandonedCheckouts.length;
      const checkoutsCompleted = completedOrders.length;
      const totalCheckouts = abandonedCarts + checkoutsCompleted;
      const abandonmentRate = totalCheckouts > 0 ? (abandonedCarts / totalCheckouts * 100) : 0;

      // Group by date for trending
      const dailyStats = {};

      // Process abandoned checkouts
      abandonedCheckouts.forEach(checkout => {
        const date = new Date(checkout.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            abandoned_carts: 0,
            checkouts_started: 0,
            checkouts_completed: 0,
            abandonment_rate: 0,
            total_value_abandoned: 0
          };
        }
        dailyStats[date].abandoned_carts++;
        dailyStats[date].checkouts_started++;
        dailyStats[date].total_value_abandoned += parseFloat(checkout.total_price || 0);
      });

      // Process completed orders
      completedOrders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            abandoned_carts: 0,
            checkouts_started: 0,
            checkouts_completed: 0,
            abandonment_rate: 0,
            total_value_abandoned: 0
          };
        }
        dailyStats[date].checkouts_completed++;
        dailyStats[date].checkouts_started++;
      });

      // Calculate daily abandonment rates
      Object.keys(dailyStats).forEach(date => {
        const stats = dailyStats[date];
        stats.abandonment_rate = stats.checkouts_started > 0 
          ? Math.round((stats.abandoned_carts / stats.checkouts_started * 100) * 100) / 100
          : 0;
      });

      // Calculate total abandoned value
      const totalAbandonedValue = abandonedCheckouts.reduce((sum, checkout) => {
        return sum + parseFloat(checkout.total_price || 0);
      }, 0);

      const result = {
        summary: {
          total_abandoned: abandonedCarts,
          total_completed: checkoutsCompleted,
          total_started: totalCheckouts,
          abandonment_rate: Math.round(abandonmentRate * 100) / 100,
          abandoned_value: Math.round(totalAbandonedValue * 100) / 100
        },
        daily: Object.values(dailyStats)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 30) // Last 30 days max
      };

      console.log('✅ Cart abandonment data processed successfully');

      // Cache for 10 minutes
      await cacheService.set(tenantId, cacheKey, result, params);
      return result;

    } catch (error) {
      console.error('❌ Cart abandonment fetch error:', error);
      
      // Return fallback data on error
      const fallbackResult = {
        summary: {
          total_abandoned: 0,
          total_completed: 0,
          total_started: 0,
          abandonment_rate: 0,
          abandoned_value: 0
        },
        daily: [{
          date: new Date().toISOString().split('T')[0],
          abandoned_carts: 0,
          checkouts_started: 0,
          checkouts_completed: 0,
          abandonment_rate: 0,
          total_value_abandoned: 0
        }],
        error: error.message
      };

      // Cache error result briefly (1 minute) to avoid repeated API failures
      await cacheService.set(tenantId, cacheKey, fallbackResult, params, 60);
      return fallbackResult;
    }
  }

  // 📊 TASK 1: Real Checkout Events Tracking
  static async getCheckoutEvents(tenantId, startDate, endDate) {
    const cacheKey = 'checkout-events';
    const params = { startDate, endDate };
    
    // Try cache first
    const cached = await cacheService.get(tenantId, cacheKey, params);
    if (cached) return cached;

    try {
      const cartStats = await this.getCartAbandonmentStats(tenantId, startDate, endDate);
      
      const result = {
        checkout_started: cartStats.summary.total_started,
        checkout_completed: cartStats.summary.total_completed,
        checkout_abandoned: cartStats.summary.total_abandoned,
        conversion_rate: cartStats.summary.total_started > 0 
          ? Math.round(((cartStats.summary.total_completed / cartStats.summary.total_started) * 100) * 100) / 100
          : 0,
        abandonment_rate: cartStats.summary.abandonment_rate,
        lost_revenue: cartStats.summary.abandoned_value
      };

      // Cache for 5 minutes
      await cacheService.set(tenantId, cacheKey, result, params);
      return result;

    } catch (error) {
      console.error('❌ Checkout events error:', error);
      return {
        checkout_started: 0,
        checkout_completed: 0,
        checkout_abandoned: 0,
        conversion_rate: 0,
        abandonment_rate: 0,
        lost_revenue: 0
      };
    }
  }

  // Clear cache when data changes
  static async clearCache(tenantId) {
    await cacheService.clearTenant(tenantId);
  }

  // Clear specific cache key
  static async clearSpecificCache(tenantId, cacheKey) {
    await cacheService.delete(tenantId, cacheKey);
  }
}

module.exports = AnalyticsService;
