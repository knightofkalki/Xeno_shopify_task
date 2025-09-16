const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xenoshopifytask-production.up.railway.app';

export const apiClient = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }
};

export const api = {
  // Dashboard
  getDashboardStats: (tenantId) => apiClient.get(`/api/dashboard/${tenantId}`),
  getTopCustomers: (tenantId) => apiClient.get(`/api/analytics/top-customers?tenantId=${tenantId}`),
  getOrdersByDate: (tenantId, startDate, endDate) => apiClient.get(`/api/analytics/orders-by-date?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`),
  
  // Business Metrics  
  getSalesPerformance: (tenantId) => apiClient.get(`/api/analytics/sales-performance?tenantId=${tenantId}`),
  getCustomerBehavior: (tenantId) => apiClient.get(`/api/analytics/customer-behavior?tenantId=${tenantId}`),
  getProductPerformance: (tenantId) => apiClient.get(`/api/analytics/product-performance?tenantId=${tenantId}`),
  
  // Sync
  syncAll: (tenantId) => apiClient.post('/api/sync/all', { tenantId }),
  syncCustomers: (tenantId) => apiClient.post('/api/sync/customers', { tenantId }),
  syncProducts: (tenantId) => apiClient.post('/api/sync/products', { tenantId }),
  syncOrders: (tenantId) => apiClient.post('/api/sync/orders', { tenantId })
};
