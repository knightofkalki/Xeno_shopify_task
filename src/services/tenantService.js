const { prisma } = require('../config/database');

// Why: Dynamic tenant creation and management
// What: Auto-create tenants when needed, support unlimited stores
class TenantService {
  // Get or create tenant dynamically
  static async getOrCreateTenant(tenantData) {
    const { id, name, shopDomain, accessToken } = tenantData;
    
    try {
      // Try to find existing tenant
      let tenant = await prisma.tenant.findUnique({
        where: { id: id }
      });

      if (tenant) {
        console.log(`✅ Found existing tenant: ${tenant.name}`);
        return tenant;
      }

      // Create new tenant dynamically
      tenant = await prisma.tenant.create({
        data: {
          id: id,
          name: name,
          shopDomain: shopDomain,
          accessToken: accessToken,
          isActive: true,
          settings: {
            autoSync: true,
            cacheEnabled: true,
            created: new Date().toISOString()
          }
        }
      });

      console.log(`🎉 Created new tenant dynamically: ${tenant.name}`);
      return tenant;

    } catch (error) {
      console.error('❌ Tenant creation error:', error);
      throw new Error(`Failed to create/get tenant: ${error.message}`);
    }
  }

  // Get tenant by domain (for webhook handling)
  static async getTenantByDomain(shopDomain) {
    return await prisma.tenant.findUnique({
      where: { shopDomain: shopDomain }
    });
  }

  // List all active tenants
  static async getActiveTenants() {
    return await prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  // Auto-discover tenants from Shopify Partners API (future feature)
  static async autoDiscoverTenants() {
    // This will integrate with Shopify Partners API to find all stores
    // For now, return configured tenants from environment
    const configuredTenants = [
      {
        id: '1',
        name: process.env.TENANT_1_NAME || 'techmart-dev-store',
        shopDomain: process.env.SHOPIFY_STORE_URL_1 || 'techmart-dev-store.myshopify.com',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN_1
      },
      {
        id: '2', 
        name: process.env.TENANT_2_NAME || 'techmart-dev-store2',
        shopDomain: process.env.SHOPIFY_STORE_URL_2 || 'techmart-dev-store2.myshopify.com',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN_2
      }
    ];

    const tenants = [];
    for (const config of configuredTenants) {
      if (config.shopDomain && config.accessToken) {
        const tenant = await this.getOrCreateTenant(config);
        tenants.push(tenant);
      }
    }

    return tenants;
  }

  // Initialize system with auto-discovered tenants
  static async initializeSystem() {
    console.log('🚀 Initializing dynamic multi-tenant system...');
    
    try {
      const tenants = await this.autoDiscoverTenants();
      console.log(`✅ Initialized ${tenants.length} tenants dynamically`);
      return {
        success: true,
        tenants,
        message: `Dynamic multi-tenant system initialized with ${tenants.length} tenants`
      };
    } catch (error) {
      console.error('❌ System initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add new tenant at runtime (for future stores)
  static async addTenant(tenantData) {
    const { shopDomain, accessToken, name } = tenantData;
    
    // Generate tenant ID dynamically
    const tenantId = `tenant_${Date.now()}`;
    
    return await this.getOrCreateTenant({
      id: tenantId,
      name: name || shopDomain,
      shopDomain,
      accessToken
    });
  }

  // Validate tenant exists before operations
  static async ensureTenantExists(tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found. Initialize system first.`);
    }

    return tenant;
  }
}

module.exports = TenantService;
