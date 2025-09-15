const { prisma } = require('../config/database');

// Why: Centralized customer operations with caching and tenant isolation
// What: Customer model with Shopify sync and analytics methods
class CustomerModel {
  // Get customers by tenant with pagination and caching
  static async getByTenant(tenantId, options = {}) {
    const { page = 1, limit = 50, orderBy = 'totalSpent', orderDirection = 'desc' } = options;
    
    return await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        orders: {
          select: { id: true, totalPrice: true, createdAt: true }
        }
      }
    });
  }

  // Get top customers by spending
  static async getTopBySpending(tenantId, limit = 5) {
    return await prisma.customer.findMany({
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
  }

  // Bulk upsert customers from Shopify
  static async bulkUpsert(tenantId, customers) {
    const operations = customers.map(customer => 
      prisma.customer.upsert({
        where: {
          tenantId_shopifyCustomerId: {
            tenantId,
            shopifyCustomerId: customer.shopifyCustomerId
          }
        },
        update: {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          totalSpent: customer.totalSpent,
          ordersCount: customer.ordersCount,
          updatedAt: new Date()
        },
        create: {
          tenantId,
          ...customer
        }
      })
    );

    return await prisma.$transaction(operations);
  }

  // Customer growth analytics
  static async getGrowthData(tenantId, startDate, endDate) {
    return await prisma.customer.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}

module.exports = CustomerModel;
