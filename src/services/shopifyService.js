const axios = require('axios');
const { Client } = require('pg');

// Database config
// Database config - HARDCODED FIX
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'xeno_db',
  user: 'postgres',
  password: 'Ujjwal,agg1499@'  // Direct string without env
};


class ShopifyService {
  
  // Get store config by tenantId
  getStoreConfig(tenantId) {
  const storeConfigs = {
    '1': {
      storeUrl: 'techmart-dev-store.myshopify.com',
      accessToken: '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',
      storeName: 'techmart-dev-store'
    },
    '2': {
      storeUrl: 'techmart-dev-store2.myshopify.com',
      accessToken: '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',
      storeName: 'techmart-dev-store2'
    }
  };
  
  console.log(`🔍 Store config for tenant ${tenantId}:`, storeConfigs[tenantId]);
  return storeConfigs[tenantId];
}


  // Create axios instance for specific tenant
  createAxiosInstance(tenantId) {
  const config = this.getStoreConfig(tenantId);
  
  if (!config) {
    throw new Error(`No store configuration found for tenant ${tenantId}`);
  }

  console.log(`🚀 Creating axios for tenant ${tenantId}:`, {
    storeUrl: config.storeUrl,
    hasAccessToken: !!config.accessToken
  });

  return axios.create({
    baseURL: `https://${config.storeUrl}/admin/api/2024-01/`,
    headers: {
      'X-Shopify-Access-Token': config.accessToken,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });
}


  // Test connection for specific tenant
  async testConnection(tenantId = '1') {
    try {
      const config = this.getStoreConfig(tenantId);
      const shopify = this.createAxiosInstance(tenantId);
      
      const response = await shopify.get('shop.json');
      
      return {
        success: true,
        message: `Connected to ${config.storeName} successfully`,
        shop: response.data.shop.name,
        domain: response.data.shop.domain,
        email: response.data.shop.email,
        tenantId: tenantId
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to store (tenant ${tenantId})`,
        error: error.response?.data || error.message
      };
    }
  }

  // Get customers for specific tenant
  async getCustomers(tenantId = '1', limit = 250) {
    try {
      const shopify = this.createAxiosInstance(tenantId);
      const response = await shopify.get(`customers.json?limit=${limit}`);
      return response.data.customers;
    } catch (error) {
      console.error(`Error fetching customers for tenant ${tenantId}:`, error.message);
      throw error;
    }
  }

  // Get products for specific tenant
  async getProducts(tenantId = '1', limit = 250) {
    try {
      const shopify = this.createAxiosInstance(tenantId);
      const response = await shopify.get(`products.json?limit=${limit}`);
      return response.data.products;
    } catch (error) {
      console.error(`Error fetching products for tenant ${tenantId}:`, error.message);
      throw error;
    }
  }

  // Get orders for specific tenant
  async getOrders(tenantId = '1', limit = 250) {
    try {
      const shopify = this.createAxiosInstance(tenantId);
      const response = await shopify.get(`orders.json?limit=${limit}&status=any`);
      return response.data.orders;
    } catch (error) {
      console.error(`Error fetching orders for tenant ${tenantId}:`, error.message);
      throw error;
    }
  }

  // Sync customers for specific tenant
  async syncCustomers(tenantId = '1') {
    const client = new Client(dbConfig);
    
    try {
      console.log(`🔄 Syncing customers for tenant ${tenantId}...`);
      const customers = await this.getCustomers(tenantId);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const customer of customers) {
        await client.query(`
          INSERT INTO customers (
            "shopifyId", "tenantId", email, "firstName", "lastName", 
            "totalSpent", "ordersCount", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT ("shopifyId", "tenantId") 
          DO UPDATE SET
            email = EXCLUDED.email,
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            "totalSpent" = EXCLUDED."totalSpent",
            "ordersCount" = EXCLUDED."ordersCount",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          customer.id,
          tenantId,
          customer.email,
          customer.first_name,
          customer.last_name,
          parseFloat(customer.total_spent || 0),
          parseInt(customer.orders_count || 0),
          new Date(customer.created_at),
          new Date(customer.updated_at)
        ]);
        syncedCount++;
      }
      
      await client.end();
      
      return {
        success: true,
        message: `Synced ${syncedCount} customers for tenant ${tenantId}`,
        count: syncedCount
      };
      
    } catch (error) {
      await client.end();
      console.error(`❌ Customer sync error for tenant ${tenantId}:`, error);
      return {
        success: false,
        message: `Failed to sync customers for tenant ${tenantId}`,
        error: error.message
      };
    }
  }

  // Sync products for specific tenant  
  async syncProducts(tenantId = '1') {
    const client = new Client(dbConfig);
    
    try {
      console.log(`🔄 Syncing products for tenant ${tenantId}...`);
      const products = await this.getProducts(tenantId);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const product of products) {
        await client.query(`
          INSERT INTO products (
            "shopifyId", "tenantId", title, "bodyHtml", vendor, 
            "productType", price, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT ("shopifyId", "tenantId") 
          DO UPDATE SET
            title = EXCLUDED.title,
            "bodyHtml" = EXCLUDED."bodyHtml",
            vendor = EXCLUDED.vendor,
            "productType" = EXCLUDED."productType", 
            price = EXCLUDED.price,
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          product.id,
          tenantId,
          product.title,
          product.body_html,
          product.vendor,
          product.product_type,
          parseFloat(product.variants?.[0]?.price || 0),
          new Date(product.created_at),
          new Date(product.updated_at)
        ]);
        syncedCount++;
      }
      
      await client.end();
      
      return {
        success: true,
        message: `Synced ${syncedCount} products for tenant ${tenantId}`,
        count: syncedCount
      };
      
    } catch (error) {
      await client.end();
      console.error(`❌ Product sync error for tenant ${tenantId}:`, error);
      return {
        success: false,
        message: `Failed to sync products for tenant ${tenantId}`,
        error: error.message
      };
    }
  }

  // Sync orders for specific tenant
  async syncOrders(tenantId = '1') {
    const client = new Client(dbConfig);
    
    try {
      console.log(`🔄 Syncing orders for tenant ${tenantId}...`);
      const orders = await this.getOrders(tenantId);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const order of orders) {
        await client.query(`
          INSERT INTO orders (
            "shopifyId", "tenantId", "customerId", "totalPrice", 
            "financialStatus", "fulfillmentStatus", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT ("shopifyId", "tenantId") 
          DO UPDATE SET
            "customerId" = EXCLUDED."customerId",
            "totalPrice" = EXCLUDED."totalPrice",
            "financialStatus" = EXCLUDED."financialStatus",
            "fulfillmentStatus" = EXCLUDED."fulfillmentStatus",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          order.id,
          tenantId,
          order.customer?.id || null,
          parseFloat(order.total_price || 0),
          order.financial_status,
          order.fulfillment_status,
          new Date(order.created_at),
          new Date(order.updated_at)
        ]);
        syncedCount++;
      }
      
      await client.end();
      
      return {
        success: true,
        message: `Synced ${syncedCount} orders for tenant ${tenantId}`,
        count: syncedCount
      };
      
    } catch (error) {
      await client.end();
      console.error(`❌ Order sync error for tenant ${tenantId}:`, error);
      return {
        success: false,
        message: `Failed to sync orders for tenant ${tenantId}`,
        error: error.message
      };
    }
  }

  // Sync all data for specific tenant
  async syncAll(tenantId = '1') {
    try {
      console.log(`🚀 Starting full sync for tenant ${tenantId}...`);
      
      const [customers, products, orders] = await Promise.all([
        this.syncCustomers(tenantId),
        this.syncProducts(tenantId), 
        this.syncOrders(tenantId)
      ]);
      
      return {
        success: true,
        message: `Full sync completed for tenant ${tenantId}`,
        results: { customers, products, orders }
      };
      
    } catch (error) {
      console.error(`❌ Full sync error for tenant ${tenantId}:`, error);
      return {
        success: false,
        message: `Failed to sync all data for tenant ${tenantId}`,
        error: error.message
      };
    }
  }
}

module.exports = new ShopifyService();
