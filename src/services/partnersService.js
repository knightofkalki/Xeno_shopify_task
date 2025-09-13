class PartnersService {
  async getOrganizationStores() {
    try {
      const stores = [
        {
          id: 'store_1',
          name: 'techmart-dev-store',
          domain: 'techmart-dev-store.myshopify.com',
          status: 'active',
          plan: 'development'
        },
        {
          id: 'store_2', 
          name: 'techmart-dev-store2',
          domain: 'techmart-dev-store2.myshopify.com',
          status: 'active',
          plan: 'development'
        }
      ];
      return { success: true, stores, totalStores: stores.length };
    } catch (error) {
      return { success: false, stores: [], error: error.message };
    }
  }

  getStoreConfig(storeDomain) {
    const storeConfigs = {
      'techmart-dev-store.myshopify.com': {
        tenantId: '1',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        storeUrl: process.env.SHOPIFY_STORE_URL
      },
      'techmart-dev-store2.myshopify.com': {
        tenantId: '2',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN_2,
        storeUrl: process.env.SHOPIFY_STORE_URL_2
      }
    };
    return storeConfigs[storeDomain] || null;
  }
}

module.exports = new PartnersService();
