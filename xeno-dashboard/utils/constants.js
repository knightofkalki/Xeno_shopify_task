export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xeno-shopify-task-pra7-git-main-boardlys-projects.vercel.app';

export const ENDPOINTS = {
  DASHBOARD: '/api/dashboard',
  ANALYTICS: {
    TOP_CUSTOMERS: '/api/analytics/top-customers',
    ORDERS_BY_DATE: '/api/analytics/orders-by-date',
    SALES_PERFORMANCE: '/api/analytics/sales-performance',
    CUSTOMER_BEHAVIOR: '/api/analytics/customer-behavior',
    PRODUCT_PERFORMANCE: '/api/analytics/product-performance'
  },
  SYNC: {
    ALL: '/api/sync/all',
    CUSTOMERS: '/api/sync/customers', 
    PRODUCTS: '/api/sync/products',
    ORDERS: '/api/sync/orders'
  }
};

export const UI_CONSTANTS = {
  ITEMS_PER_PAGE: 20,
  CACHE_TTL: 30,
  SYNC_INTERVAL: 30000
};
