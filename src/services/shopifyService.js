const axios = require('axios');
const { prisma } = require('../config/database');

// Vercel Serverless Optimized Shopify Service
class ShopifyService {
  constructor() {
    // Set axios timeout for serverless
    this.axiosConfig = {
      timeout: 25000, // 25 seconds for Vercel
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Xeno-Shopify-Service/1.0'
      }
    };
  }

  // Get store config with fallback
  async getStoreConfig(tenantId) {
    try {
      // Try to get from database first
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          shopDomain: true,
          accessToken: true,
          name: true,
          isActive: true
        }
      });

      if (tenant && tenant.isActive) {
        return {
          storeUrl: tenant.shopDomain,
          accessToken: tenant.accessToken,
          storeName: tenant.name
        };
      }

      // Fallback to environment variables
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

      const config = storeConfigs[tenantId] || storeConfigs['1'];
      console.log(`🔧 Using env config for tenant ${tenantId}: ${config.storeName}`);
      
      return config;

    } catch (error) {
      console.error(`❌ Error getting store config for tenant ${tenantId}:`, error.message);
      throw new Error(`Store configuration not found for tenant ${tenantId}`);
    }
  }

  // Test Shopify connection with enhanced error handling
  async testConnection(tenantId = '1') {
    try {
      const config = await this.getStoreConfig(tenantId);
      
      if (!config.storeUrl || !config.accessToken) {
        return {
          success: false,
          error: 'Store configuration incomplete'
        };
      }

      console.log(`🔧 Testing connection to ${config.storeUrl}...`);

      const response = await axios.get(
        `https://${config.storeUrl}/admin/api/2024-01/shop.json`,
        {
          headers: { 
            'X-Shopify-Access-Token': config.accessToken,
            ...this.axiosConfig.headers
          },
          timeout: this.axiosConfig.timeout
        }
      );

      return {
        success: true,
        shop: response.data.shop.name,
        domain: response.data.shop.myshopify_domain,
        email: response.data.shop.email,
        tenantId: tenantId
      };

    } catch (error) {
      console.error(`❌ Connection test failed for tenant ${tenantId}:`, error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message,
        tenantId: tenantId
      };
    }
  }

  // Sync customers with batch processing
  async syncCustomers(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing customers for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(
        `https://${config.storeUrl}/admin/api/2024-01/customers.json?limit=250`,
        {
          headers: { 
            'X-Shopify-Access-Token': config.accessToken,
            ...this.axiosConfig.headers
          },
          timeout: this.axiosConfig.timeout
        }
      );

      const customers = response.data.customers;
      let syncCount = 0;
      const batchSize = 10; // Process in smaller batches for serverless

      // Process customers in batches
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (customer) => {
          try {
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
                tags: customer.tags ? customer.tags.split(',').map(tag => tag.trim()) : [],
                state: customer.state || 'enabled',
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
                acceptsMarketing: customer.accepts_marketing || false,
                tags: customer.tags ? customer.tags.split(',').map(tag => tag.trim()) : [],
                state: customer.state || 'enabled'
              }
            });
            return true;
          } catch (error) {
            console.error(`Failed to sync customer ${customer.id}:`, error.message);
            return false;
          }
        });

        const results = await Promise.allSettled(batchPromises);
        syncCount += results.filter(result => result.status === 'fulfilled' && result.value).length;
      }

      console.log(`✅ Synced ${syncCount}/${customers.length} customers for tenant ${tenantId}`);
      return { 
        success: true, 
        synced: syncCount, 
        total: customers.length,
        tenantId: tenantId
      };

    } catch (error) {
      console.error(`❌ Customer sync error for tenant ${tenantId}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        tenantId: tenantId
      };
    }
  }

  // Sync products with enhanced error handling
  async syncProducts(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing products for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(
        `https://${config.storeUrl}/admin/api/2024-01/products.json?limit=250`,
        {
          headers: { 
            'X-Shopify-Access-Token': config.accessToken,
            ...this.axiosConfig.headers
          },
          timeout: this.axiosConfig.timeout
        }
      );

      const products = response.data.products;
      let syncCount = 0;
      const batchSize = 10;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (product) => {
          try {
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
                compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                inventory: variant.inventory_quantity || 0,
                status: product.status === 'active' ? 'ACTIVE' : 'DRAFT',
                images: product.images ? JSON.stringify(product.images) : null,
                tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
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
                compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                inventory: variant.inventory_quantity || 0,
                status: product.status === 'active' ? 'ACTIVE' : 'DRAFT',
                images: product.images ? JSON.stringify(product.images) : null,
                tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : []
              }
            });
            return true;
          } catch (error) {
            console.error(`Failed to sync product ${product.id}:`, error.message);
            return false;
          }
        });

        const results = await Promise.allSettled(batchPromises);
        syncCount += results.filter(result => result.status === 'fulfilled' && result.value).length;
      }

      console.log(`✅ Synced ${syncCount}/${products.length} products for tenant ${tenantId}`);
      return { 
        success: true, 
        synced: syncCount, 
        total: products.length,
        tenantId: tenantId
      };

    } catch (error) {
      console.error(`❌ Product sync error for tenant ${tenantId}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        tenantId: tenantId
      };
    }
  }

  // Sync orders with customer linking
  async syncOrders(tenantId) {
    try {
      const config = await this.getStoreConfig(tenantId);
      console.log(`🔄 Syncing orders for tenant ${tenantId} (${config.storeName})...`);

      const response = await axios.get(
        `https://${config.storeUrl}/admin/api/2024-01/orders.json?limit=250`,
        {
          headers: { 
            'X-Shopify-Access-Token': config.accessToken,
            ...this.axiosConfig.headers
          },
          timeout: this.axiosConfig.timeout
        }
      );

      const orders = response.data.orders;
      let syncCount = 0;
      const batchSize = 5; // Smaller batch for orders due to customer lookups

      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (order) => {
          try {
            // Find customer by Shopify ID
            let customer = null;
            if (order.customer?.id) {
              customer = await prisma.customer.findFirst({
                where: {
                  tenantId: tenantId,
                  shopifyCustomerId: order.customer.id.toString()
                },
                select: { id: true }
              });
            }

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
                shippingAmount: parseFloat(order.total_shipping_price_set?.shop_money?.amount || 0),
                discountAmount: parseFloat(order.total_discounts || 0),
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
                shippingAmount: parseFloat(order.total_shipping_price_set?.shop_money?.amount || 0),
                discountAmount: parseFloat(order.total_discounts || 0),
                currency: order.currency || 'USD',
                financialStatus: order.financial_status || 'pending',
                fulfillmentStatus: order.fulfillment_status || null,
                orderStatus: order.cancelled_at ? 'CANCELLED' : 'OPEN',
                processedAt: order.processed_at ? new Date(order.processed_at) : null
              }
            });
            return true;
          } catch (error) {
            console.error(`Failed to sync order ${order.id}:`, error.message);
            return false;
          }
        });

        const results = await Promise.allSettled(batchPromises);
        syncCount += results.filter(result => result.status === 'fulfilled' && result.value).length;
      }

      console.log(`✅ Synced ${syncCount}/${orders.length} orders for tenant ${tenantId}`);
      return { 
        success: true, 
        synced: syncCount, 
        total: orders.length,
        tenantId: tenantId
      };

    } catch (error) {
      console.error(`❌ Order sync error for tenant ${tenantId}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        tenantId: tenantId
      };
    }
  }

  // Sync all data with timeout protection
  async syncAll(tenantId) {
    const startTime = Date.now();
    console.log(`🚀 Starting full sync for tenant ${tenantId}...`);
    
    try {
      // Test connection first
      const connectionTest = await this.testConnection(tenantId);
      if (!connectionTest.success) {
        return {
          success: false,
          error: `Connection failed: ${connectionTest.error}`,
          tenantId: tenantId
        };
      }

      // Run sync operations sequentially to avoid overwhelming the system
      console.log(`📊 Starting customers sync...`);
      const customersResult = await this.syncCustomers(tenantId);
      
      console.log(`📦 Starting products sync...`);
      const productsResult = await this.syncProducts(tenantId);
      
      console.log(`🛒 Starting orders sync...`);
      const ordersResult = await this.syncOrders(tenantId);

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      return {
        success: true,
        tenantId: tenantId,
        duration: `${duration}s`,
        results: {
          customers: customersResult,
          products: productsResult,
          orders: ordersResult
        },
        summary: {
          totalSynced: (customersResult.synced || 0) + (productsResult.synced || 0) + (ordersResult.synced || 0),
          customersCount: customersResult.synced || 0,
          productsCount: productsResult.synced || 0,
          ordersCount: ordersResult.synced || 0
        },
        message: `Full sync completed for tenant ${tenantId} in ${duration}s`
      };

    } catch (error) {
      console.error(`❌ Full sync error for tenant ${tenantId}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        tenantId: tenantId
      };
    }
  }

  // Get customers for validation (with pagination)
  async getCustomers(tenantId = '1', limit = 50) {
    try {
      const config = await this.getStoreConfig(tenantId);
      
      const response = await axios.get(
        `https://${config.storeUrl}/admin/api/2024-01/customers.json?limit=${limit}`,
        {
          headers: { 
            'X-Shopify-Access-Token': config.accessToken,
            ...this.axiosConfig.headers
          },
          timeout: this.axiosConfig.timeout
        }
      );

      return response.data.customers;
    } catch (error) {
      console.error(`❌ Get customers error for tenant ${tenantId}:`, error.message);
      return [];
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const tenant1Test = await this.testConnection('1');
      const tenant2Test = await this.testConnection('2');
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        tenants: {
          '1': tenant1Test,
          '2': tenant2Test
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new ShopifyService();
