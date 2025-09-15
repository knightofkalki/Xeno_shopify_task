const axios = require('axios');
const { prisma } = require('../config/database');
const TenantService = require('./tenantService');

// Why: Modern Shopify integration with dynamic multi-tenant support
// What: Auto-tenant creation + Shopify sync for unlimited stores
class ShopifyService {
  // Get store config with dynamic tenant creation
  async getStoreConfig(tenantId) {
    try {
      // Ensure tenant exists (create if needed)
      const tenant = await TenantService.ensureTenantExists(tenantId);
      
      return {
        storeUrl: tenant.shopDomain,
        accessToken: tenant.accessToken,
        storeName: tenant.name
      };
    } catch (error) {
      console.error(`❌ Tenant ${tenantId} not found, falling back to env config`);
      
      // Fallback to environment variables for initial setup
      const storeConfigs = {
        '1': {
          storeUrl: process.env.SHOPIFY_STORE_URL_1,
          accessToken: process.env.SHOPIFY_ACCESS_TOKEN_1,
          storeName: process.env.TENANT_1_NAME || 'techmart-dev-store'
        },
        '2': {
          storeUrl: process.env.SHOPIFY_STORE_URL_2,
          accessToken: process.env.SHOPIFY_ACCESS_TOKEN_2,
          storeName: process.env.TENANT_2_NAME || 'techmart-dev-store2'
        }
      };
      return storeConfigs[tenantId] || storeConfigs['1'];
    }
  }

  // Test Shopify connection with tenant validation
  async testConnection(tenantId = '1') {
    try {
      const config = await this.getStoreConfig(tenantId);
      const response = await axios.get(`https://${config.storeUrl}/admin/api/2023-07/shop.json`, {
        headers: { 'X-Shopify-Access-Token': config.accessToken }
      });

      return {
        success: true,
        shop: response.data.shop.name,
        domain: response.data.shop.myshopify_domain,
        email: response.data.shop.email
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sync customers with dynamic tenant support
  async syncCustomers(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing customers for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(`https://${config.storeUrl}/admin/api/2023-07/customers.json`, {
        headers: { 'X-Shopify-Access-Token': config.accessToken }
      });

      const customers = response.data.customers;
      let syncCount = 0;

      for (const customer of customers) {
        await prisma.customer.upsert({
          where: {
            tenantId_shopifyCustomerId: {
              tenantId: tenantId,
              shopifyCustomerId: customer.id.toString()
            }
          },
          update: {
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            totalSpent: parseFloat(customer.total_spent || 0),
            ordersCount: customer.orders_count || 0,
            phone: customer.phone,
            acceptsMarketing: customer.accepts_marketing || false,
            updatedAt: new Date()
          },
          create: {
            tenantId: tenantId,
            shopifyCustomerId: customer.id.toString(),
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            totalSpent: parseFloat(customer.total_spent || 0),
            ordersCount: customer.orders_count || 0,
            phone: customer.phone,
            acceptsMarketing: customer.accepts_marketing || false
          }
        });
        syncCount++;
      }

      console.log(`✅ Synced ${syncCount} customers for tenant ${tenantId}`);
      return { success: true, synced: syncCount, total: customers.length };

    } catch (error) {
      console.error('Customer sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync products with dynamic tenant support
  async syncProducts(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing products for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(`https://${config.storeUrl}/admin/api/2023-07/products.json`, {
        headers: { 'X-Shopify-Access-Token': config.accessToken }
      });

      const products = response.data.products;
      let syncCount = 0;

      for (const product of products) {
        const variant = product.variants[0] || {};
        
        await prisma.product.upsert({
          where: {
            tenantId_shopifyProductId: {
              tenantId: tenantId,
              shopifyProductId: product.id.toString()
            }
          },
          update: {
            title: product.title,
            handle: product.handle,
            description: product.body_html,
            vendor: product.vendor,
            productType: product.product_type,
            price: parseFloat(variant.price || 0),
            inventory: variant.inventory_quantity || 0,
            status: product.status === 'active' ? 'ACTIVE' : 'DRAFT',
            updatedAt: new Date()
          },
          create: {
            tenantId: tenantId,
            shopifyProductId: product.id.toString(),
            title: product.title,
            handle: product.handle,
            description: product.body_html,
            vendor: product.vendor,
            productType: product.product_type,
            price: parseFloat(variant.price || 0),
            inventory: variant.inventory_quantity || 0,
            status: product.status === 'active' ? 'ACTIVE' : 'DRAFT'
          }
        });
        syncCount++;
      }

      console.log(`✅ Synced ${syncCount} products for tenant ${tenantId}`);
      return { success: true, synced: syncCount, total: products.length };

    } catch (error) {
      console.error('Product sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync orders with dynamic tenant support
  async syncOrders(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing orders for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(`https://${config.storeUrl}/admin/api/2023-07/orders.json`, {
        headers: { 'X-Shopify-Access-Token': config.accessToken }
      });

      const orders = response.data.orders;
      let syncCount = 0;

      for (const order of orders) {
        // Find customer by Shopify ID
        const customer = await prisma.customer.findFirst({
          where: {
            tenantId: tenantId,
            shopifyCustomerId: order.customer?.id?.toString()
          }
        });

        await prisma.order.upsert({
          where: {
            tenantId_shopifyOrderId: {
              tenantId: tenantId,
              shopifyOrderId: order.id.toString()
            }
          },
          update: {
            customerId: customer?.id || null,
            orderNumber: order.order_number?.toString() || order.name,
            totalPrice: parseFloat(order.total_price || 0),
            subtotalPrice: parseFloat(order.subtotal_price || 0),
            taxAmount: parseFloat(order.total_tax || 0),
            currency: order.currency || 'USD',
            financialStatus: order.financial_status || 'pending',
            fulfillmentStatus: order.fulfillment_status || null,
            orderStatus: order.cancelled_at ? 'CANCELLED' : 'OPEN',
            processedAt: order.processed_at ? new Date(order.processed_at) : null,
            updatedAt: new Date()
          },
          create: {
            tenantId: tenantId,
            shopifyOrderId: order.id.toString(),
            customerId: customer?.id || null,
            orderNumber: order.order_number?.toString() || order.name,
            totalPrice: parseFloat(order.total_price || 0),
            subtotalPrice: parseFloat(order.subtotal_price || 0),
            taxAmount: parseFloat(order.total_tax || 0),
            currency: order.currency || 'USD',
            financialStatus: order.financial_status || 'pending',
            fulfillmentStatus: order.fulfillment_status || null,
            orderStatus: order.cancelled_at ? 'CANCELLED' : 'OPEN',
            processedAt: order.processed_at ? new Date(order.processed_at) : null
          }
        });
        syncCount++;
      }

      console.log(`✅ Synced ${syncCount} orders for tenant ${tenantId}`);
      return { success: true, synced: syncCount, total: orders.length };

    } catch (error) {
      console.error('Order sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync all data with dynamic tenant support
  async syncAll(tenantId) {
    try {
      console.log(`🚀 Starting full sync for tenant ${tenantId}...`);
      
      const [customersResult, productsResult, ordersResult] = await Promise.all([
        this.syncCustomers(tenantId),
        this.syncProducts(tenantId),
        this.syncOrders(tenantId)
      ]);

      return {
        success: true,
        customers: customersResult,
        products: productsResult,
        orders: ordersResult,
        message: `Full sync completed for tenant ${tenantId}`
      };
    } catch (error) {
      console.error('Full sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get customers for validation
  async getCustomers(tenantId = '1') {
    try {
      const config = await this.getStoreConfig(tenantId);
      const response = await axios.get(`https://${config.storeUrl}/admin/api/2023-07/customers.json`, {
        headers: { 'X-Shopify-Access-Token': config.accessToken }
      });
      return response.data.customers;
    } catch (error) {
      console.error('Get customers error:', error.message);
      return [];
    }
  }
}

module.exports = new ShopifyService();
