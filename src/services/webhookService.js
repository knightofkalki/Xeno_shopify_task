const { prisma } = require('../config/database');
const analyticsService = require('./analyticsService');

// Why: Real-time data sync from Shopify webhooks
// What: Auto-update database when Shopify data changes
class WebhookService {
  
  // Handle customer create/update webhook
  async handleCustomerUpdate(customerData, shopDomain) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { shopDomain: shopDomain }
      });

      if (!tenant) {
        throw new Error(`Tenant not found for domain: ${shopDomain}`);
      }

      const customer = await prisma.customer.upsert({
        where: {
          tenantId_shopifyCustomerId: {
            tenantId: tenant.id,
            shopifyCustomerId: customerData.id.toString()
          }
        },
        update: {
          email: customerData.email,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          totalSpent: parseFloat(customerData.total_spent || 0),
          ordersCount: customerData.orders_count || 0,
          phone: customerData.phone,
          acceptsMarketing: customerData.accepts_marketing || false,
          updatedAt: new Date()
        },
        create: {
          tenantId: tenant.id,
          shopifyCustomerId: customerData.id.toString(),
          email: customerData.email,
          firstName: customerData.first_name,
          lastName: customerData.last_name,
          totalSpent: parseFloat(customerData.total_spent || 0),
          ordersCount: customerData.orders_count || 0,
          phone: customerData.phone,
          acceptsMarketing: customerData.accepts_marketing || false
        }
      });

      // Clear cache
      await analyticsService.clearCache(tenant.id);
      console.log(`🔄 Real-time customer update: ${customerData.email} for tenant ${tenant.id}`);
      
      return { success: true, customer };
    } catch (error) {
      console.error('❌ Webhook customer error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle product create/update webhook
  async handleProductUpdate(productData, shopDomain) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { shopDomain: shopDomain }
      });

      if (!tenant) {
        throw new Error(`Tenant not found for domain: ${shopDomain}`);
      }

      const variant = productData.variants[0] || {};
      
      const product = await prisma.product.upsert({
        where: {
          tenantId_shopifyProductId: {
            tenantId: tenant.id,
            shopifyProductId: productData.id.toString()
          }
        },
        update: {
          title: productData.title,
          handle: productData.handle,
          description: productData.body_html,
          vendor: productData.vendor,
          productType: productData.product_type,
          price: parseFloat(variant.price || 0),
          inventory: variant.inventory_quantity || 0,
          status: productData.status === 'active' ? 'ACTIVE' : 'DRAFT',
          updatedAt: new Date()
        },
        create: {
          tenantId: tenant.id,
          shopifyProductId: productData.id.toString(),
          title: productData.title,
          handle: productData.handle,
          description: productData.body_html,
          vendor: productData.vendor,
          productType: productData.product_type,
          price: parseFloat(variant.price || 0),
          inventory: variant.inventory_quantity || 0,
          status: productData.status === 'active' ? 'ACTIVE' : 'DRAFT'
        }
      });

      // Clear cache
      await analyticsService.clearCache(tenant.id);
      console.log(`🔄 Real-time product update: ${productData.title} for tenant ${tenant.id}`);
      
      return { success: true, product };
    } catch (error) {
      console.error('❌ Webhook product error:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle order create/update webhook
  async handleOrderUpdate(orderData, shopDomain) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { shopDomain: shopDomain }
      });

      if (!tenant) {
        throw new Error(`Tenant not found for domain: ${shopDomain}`);
      }

      // Find customer
      const customer = await prisma.customer.findFirst({
        where: {
          tenantId: tenant.id,
          shopifyCustomerId: orderData.customer?.id?.toString()
        }
      });

      const order = await prisma.order.upsert({
        where: {
          tenantId_shopifyOrderId: {
            tenantId: tenant.id,
            shopifyOrderId: orderData.id.toString()
          }
        },
        update: {
          customerId: customer?.id || null,
          orderNumber: orderData.order_number?.toString() || orderData.name,
          totalPrice: parseFloat(orderData.total_price || 0),
          subtotalPrice: parseFloat(orderData.subtotal_price || 0),
          taxAmount: parseFloat(orderData.total_tax || 0),
          currency: orderData.currency || 'USD',
          financialStatus: orderData.financial_status || 'pending',
          fulfillmentStatus: orderData.fulfillment_status || null,
          orderStatus: orderData.cancelled_at ? 'CANCELLED' : 'OPEN',
          processedAt: orderData.processed_at ? new Date(orderData.processed_at) : null,
          updatedAt: new Date()
        },
        create: {
          tenantId: tenant.id,
          shopifyOrderId: orderData.id.toString(),
          customerId: customer?.id || null,
          orderNumber: orderData.order_number?.toString() || orderData.name,
          totalPrice: parseFloat(orderData.total_price || 0),
          subtotalPrice: parseFloat(orderData.subtotal_price || 0),
          taxAmount: parseFloat(orderData.total_tax || 0),
          currency: orderData.currency || 'USD',
          financialStatus: orderData.financial_status || 'pending',
          fulfillmentStatus: orderData.fulfillment_status || null,
          orderStatus: orderData.cancelled_at ? 'CANCELLED' : 'OPEN',
          processedAt: orderData.processed_at ? new Date(orderData.processed_at) : null
        }
      });

      // Clear cache
      await analyticsService.clearCache(tenant.id);
      console.log(`🔄 Real-time order update: ${orderData.name} for tenant ${tenant.id}`);
      
      return { success: true, order };
    } catch (error) {
      console.error('❌ Webhook order error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify webhook authenticity (Shopify security) - disabled for now
  verifyWebhook(data, hmacHeader) {
    return true; // Skip verification for development
  }
}

module.exports = new WebhookService();
