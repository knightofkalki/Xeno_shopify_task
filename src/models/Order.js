const { prisma } = require('../config/database');

// Why: Order analytics and reporting with optimized queries
// What: Order model with date-based analytics and revenue tracking
class OrderModel {
  // Orders by date with revenue analytics
  static async getOrdersByDate(tenantId, startDate, endDate) {
    return await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        ...(startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {})
      },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Dashboard statistics
  static async getDashboardStats(tenantId) {
    const [orderCount, revenueSum] = await Promise.all([
      prisma.order.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalPrice: true }
      })
    ]);

    return {
      totalOrders: orderCount,
      totalRevenue: revenueSum._sum.totalPrice || 0
    };
  }

  // Bulk upsert orders from Shopify
  static async bulkUpsert(tenantId, orders) {
    const operations = orders.map(order => 
      prisma.order.upsert({
        where: {
          tenantId_shopifyOrderId: {
            tenantId,
            shopifyOrderId: order.shopifyOrderId
          }
        },
        update: {
          totalPrice: order.totalPrice,
          financialStatus: order.financialStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          updatedAt: new Date()
        },
        create: {
          tenantId,
          ...order
        }
      })
    );

    return await prisma.$transaction(operations);
  }
}

module.exports = OrderModel;
