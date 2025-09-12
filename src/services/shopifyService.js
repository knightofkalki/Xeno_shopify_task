const axios = require('axios');
const { Client } = require('pg');

// Database config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'xeno_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ujjwal,agg1499@'
};

class ShopifyService {
  constructor() {
    console.log('🔍 ShopifyService Constructor Debug:');
    console.log('process.env.SHOPIFY_STORE_URL:', process.env.SHOPIFY_STORE_URL);
    console.log('process.env.SHOPIFY_ACCESS_TOKEN:', process.env.SHOPIFY_ACCESS_TOKEN ? 'SET' : 'NOT_SET');
    
    this.storeUrl = process.env.SHOPIFY_STORE_URL;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    console.log('this.storeUrl:', this.storeUrl);
    console.log('this.accessToken:', this.accessToken ? 'SET' : 'NOT_SET');
    
    if (!this.storeUrl) {
      console.error('❌ Store URL is undefined in constructor!');
    }
    
    this.baseUrl = `https://${this.storeUrl}/admin/api/2024-01`;
    console.log('this.baseUrl:', this.baseUrl);
  }

  // Make API request to Shopify
  async apiRequest(endpoint, method = 'GET') {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log('🌐 Making request to:', fullUrl);
    
    try {
      const response = await axios({
        method,
        url: fullUrl,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Request failed for URL: ${fullUrl}`);
      console.error('Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors || error.message);
    }
  }

  // Test connection - ENHANCED VERSION
  async testConnection() {
    console.log('🔍 Testing Shopify connection...');
    
    try {
      const shopData = await this.apiRequest('/shop.json');
      
      console.log('✅ Shopify connection successful:', shopData.shop.name);
      
      return {
        success: true,
        shop: shopData.shop.name,
        domain: shopData.shop.domain,
        email: shopData.shop.email,
        currency: shopData.shop.currency,
        message: `Connected to ${shopData.shop.name}`
      };
    } catch (error) {
      console.error('❌ Shopify connection failed:', error.message);
      
      return {
        success: false,
        error: 'Shopify connection failed',
        message: error.message,
        details: {
          storeUrl: this.storeUrl,
          hasToken: !!this.accessToken,
          baseUrl: this.baseUrl
        }
      };
    }
  }

  // Fetch customers with error handling
  async getCustomers() {
    try {
      const data = await this.apiRequest('/customers.json?limit=250');
      return data.customers || [];
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error.message);
      throw error;
    }
  }

  // Fetch products with error handling
  async getProducts() {
    try {
      const data = await this.apiRequest('/products.json?limit=250');
      return data.products || [];
    } catch (error) {
      console.error('❌ Failed to fetch products:', error.message);
      throw error;
    }
  }

  // Fetch orders with error handling
  async getOrders() {
    try {
      const data = await this.apiRequest('/orders.json?status=any&limit=250');
      return data.orders || [];
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error.message);
      throw error;
    }
  }

  // Sync products with improved error handling
  async syncProducts(tenantId = "1") {
    console.log('🔄 Syncing products for tenant:', tenantId);
    
    const client = new Client(dbConfig);
    
    try {
      const products = await this.getProducts();
      console.log(`📦 Retrieved ${products.length} products from Shopify`);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const product of products) {
        const variant = product.variants[0] || {};
        
        try {
          // Check if product exists first
          const existingProduct = await client.query(
            'SELECT id FROM products WHERE "shopifyProductId" = $1', 
            [product.id.toString()]
          );
          
          if (existingProduct.rows.length > 0) {
            // Update existing product
            await client.query(`
              UPDATE products SET
                title = $1,
                handle = $2,
                price = $3,
                inventory = $4,
                status = $5,
                "updatedAt" = NOW()
              WHERE "shopifyProductId" = $6
            `, [
              product.title,
              product.handle,
              parseFloat(variant.price || 0),
              parseInt(variant.inventory_quantity || 0),
              product.status || 'active',
              product.id.toString()
            ]);
          } else {
            // Insert new product
            await client.query(`
              INSERT INTO products (
                id, "tenantId", "shopifyProductId", title, handle,
                price, inventory, status, "createdAt", "updatedAt"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              `prod_${product.id}_${tenantId}`,
              tenantId.toString(),
              product.id.toString(),
              product.title,
              product.handle,
              parseFloat(variant.price || 0),
              parseInt(variant.inventory_quantity || 0),
              product.status || 'active',
              new Date(product.created_at),
              new Date()
            ]);
          }
          
          syncedCount++;
        } catch (productError) {
          console.error(`❌ Failed to sync product ${product.id}:`, productError.message);
        }
      }
      
      await client.end();
      console.log(`✅ Successfully synced ${syncedCount}/${products.length} products`);
      
      return {
        success: true,
        synced: syncedCount,
        total: products.length,
        message: `Synced ${syncedCount} products successfully`
      };
      
    } catch (error) {
      console.error('❌ Error syncing products:', error.message);
      await client.end();
      throw error;
    }
  }

  // Sync customers with improved error handling
  async syncCustomers(tenantId = "1") {
    console.log('🔄 Syncing customers for tenant:', tenantId);
    
    const client = new Client(dbConfig);
    
    try {
      const customers = await this.getCustomers();
      console.log(`👥 Retrieved ${customers.length} customers from Shopify`);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const customer of customers) {
        try {
          await client.query(`
            INSERT INTO customers (
              id, "tenantId", "shopifyCustomerId", email, "firstName", 
              "lastName", phone, "totalSpent", "ordersCount", 
              "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT ("shopifyCustomerId") 
            DO UPDATE SET
              email = EXCLUDED.email,
              "firstName" = EXCLUDED."firstName",
              "lastName" = EXCLUDED."lastName",
              phone = EXCLUDED.phone,
              "totalSpent" = EXCLUDED."totalSpent",
              "ordersCount" = EXCLUDED."ordersCount",
              "updatedAt" = NOW()
          `, [
            `cust_${customer.id}_${tenantId}`,
            tenantId.toString(),
            customer.id.toString(),
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.phone,
            parseFloat(customer.total_spent || 0),
            customer.orders_count || 0,
            new Date(customer.created_at),
            new Date()
          ]);
          
          syncedCount++;
        } catch (customerError) {
          console.error(`❌ Failed to sync customer ${customer.id}:`, customerError.message);
        }
      }
      
      await client.end();
      console.log(`✅ Successfully synced ${syncedCount}/${customers.length} customers`);
      
      return {
        success: true,
        synced: syncedCount,
        total: customers.length,
        message: `Synced ${syncedCount} customers successfully`
      };
      
    } catch (error) {
      console.error('❌ Error syncing customers:', error.message);
      await client.end();
      throw error;
    }
  }

  // Sync orders with improved error handling
  async syncOrders(tenantId = "1") {
    console.log('🔄 Syncing orders for tenant:', tenantId);
    
    const client = new Client(dbConfig);
    
    try {
      const orders = await this.getOrders();
      console.log(`🛍️ Retrieved ${orders.length} orders from Shopify`);
      
      await client.connect();
      
      let syncedCount = 0;
      
      for (const order of orders) {
        try {
          await client.query(`
            INSERT INTO orders (
              id, "tenantId", "shopifyOrderId", "customerId", "orderNumber",
              "totalPrice", currency, status, "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT ("shopifyOrderId") 
            DO UPDATE SET
              "totalPrice" = EXCLUDED."totalPrice",
              status = EXCLUDED.status,
              "updatedAt" = NOW()
          `, [
            `ord_${order.id}_${tenantId}`,
            tenantId.toString(),
            order.id.toString(),
            order.customer?.id?.toString() || null,
            order.order_number,
            parseFloat(order.total_price),
            order.currency,
            order.fulfillment_status || 'pending',
            new Date(order.created_at),
            new Date()
          ]);
          
          syncedCount++;
        } catch (orderError) {
          console.error(`❌ Failed to sync order ${order.id}:`, orderError.message);
        }
      }
      
      await client.end();
      console.log(`✅ Successfully synced ${syncedCount}/${orders.length} orders`);
      
      return {
        success: true,
        synced: syncedCount,
        total: orders.length,
        message: `Synced ${syncedCount} orders successfully`
      };
      
    } catch (error) {
      console.error('❌ Error syncing orders:', error.message);
      await client.end();
      throw error;
    }
  }

  // Sync all data with comprehensive error handling
  async syncAll(tenantId = "1") {
    console.log('🔄 Starting full sync for tenant:', tenantId);
    
    try {
      const results = {
        customers: { success: false, synced: 0, error: null },
        products: { success: false, synced: 0, error: null },
        orders: { success: false, synced: 0, error: null }
      };
      
      // Sync customers
      try {
        const customerResult = await this.syncCustomers(tenantId);
        results.customers = customerResult;
      } catch (error) {
        results.customers.error = error.message;
      }
      
      // Sync products  
      try {
        const productResult = await this.syncProducts(tenantId);
        results.products = productResult;
      } catch (error) {
        results.products.error = error.message;
      }
      
      // Sync orders
      try {
        const orderResult = await this.syncOrders(tenantId);
        results.orders = orderResult;
      } catch (error) {
        results.orders.error = error.message;
      }
      
      const totalSynced = results.customers.synced + results.products.synced + results.orders.synced;
      const hasErrors = results.customers.error || results.products.error || results.orders.error;
      
      return {
        success: !hasErrors,
        message: hasErrors ? 'Sync completed with some errors' : 'All data synced successfully',
        totalSynced,
        results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Critical error in syncAll:', error.message);
      throw error;
    }
  }
}

// Export a single instance
module.exports = new ShopifyService();
