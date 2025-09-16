import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const BYPASS_TOKEN = 'xenoshopifybypass2025secret12345';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'x-vercel-protection-bypass': BYPASS_TOKEN,
  },
});

export const shopifyAPI = {
  testConnection: () => api.get('/api/shopify/test'),
  syncCustomers: (tenantId = '1') => api.post('/api/sync/customers', { tenantId }),
  syncProducts: (tenantId = '1') => api.post('/api/sync/products', { tenantId }),
  syncOrders: (tenantId = '1') => api.post('/api/sync/orders', { tenantId }),
  syncAll: (tenantId = '1') => api.post('/api/sync/all', { tenantId }),
  getDashboard: (tenantId = '1') => api.get(`/api/dashboard/${tenantId}`),
  getHealth: () => api.get('/health'),
};

export default api;
