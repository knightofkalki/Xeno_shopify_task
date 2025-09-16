import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const BYPASS_TOKEN = 'xe_3a4f9b2c8d1e7f6g9h0i2j3k4l5m6n7o8p9q1r2s';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'x-vercel-protection-bypass': BYPASS_TOKEN,
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('xeno_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
