'use client';
import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:3001';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  // Load dashboard stats
  // Update this function to force refresh
const loadDashboard = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await fetch(`${BACKEND_URL}/api/dashboard/1?t=${timestamp}`);
    const data = await response.json();
    
    console.log('Dashboard data received:', data); // Debug log
    
    if (data.success) {
      setStats(data.stats);
    } else {
      setError(data.message || 'Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    setError('Failed to connect to server');
  } finally {
    setIsLoading(false);
  }
};


  // Sync function
  const syncData = async (endpoint, type) => {
    setSyncStatus(`Syncing ${type}...`);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: '1' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(`✅ ${type} synced successfully`);
        // Reload dashboard after successful sync
        setTimeout(loadDashboard, 1000);
      } else {
        setSyncStatus(`❌ ${type} sync failed: ${result.message}`);
        setError(result.message);
      }
    } catch (error) {
      console.error(`${type} sync error:`, error);
      setSyncStatus(`❌ ${type} sync failed`);
      setError(`Failed to sync ${type}`);
    }
  };

  // Test connections
  const testShopify = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/shopify/test`);
      const data = await response.json();
      setSyncStatus(data.success ? '✅ Shopify connected' : '❌ Shopify connection failed');
    } catch (error) {
      setSyncStatus('❌ Shopify test failed');
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/test-db`);
      const data = await response.json();
      setSyncStatus(data.status === 'Database Connected Successfully' ? '✅ Database connected' : '❌ Database connection failed');
    } catch (error) {
      setSyncStatus('❌ Database test failed');
    }
  };

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      setSyncStatus(data.status === 'OK' ? '✅ Server healthy' : '❌ Server unhealthy');
    } catch (error) {
      setSyncStatus('❌ Server health check failed');
    }
  };

  // Auto-load dashboard on component mount
  useEffect(() => {
    loadDashboard();
    testShopify(); // Auto-test Shopify connection
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🛒</span>
            <h1 className="text-3xl font-bold text-gray-800">Xeno Shopify Dashboard</h1>
          </div>
          
          {/* Connection Status */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Shopify: connected
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">👥 Total Customers</h3>
            <p className="text-3xl font-bold text-blue-600">
              {isLoading ? '...' : stats.totalCustomers.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📦 Total Products</h3>
            <p className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : stats.totalProducts.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">🛍️ Total Orders</h3>
            <p className="text-3xl font-bold text-orange-600">
              {isLoading ? '...' : stats.totalOrders.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">
              {isLoading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔄</span>
            <h2 className="text-xl font-semibold text-gray-800">Data Sync Controls</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => syncData('customers', 'Customers')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              👥 SYNC CUSTOMERS
            </button>
            
            <button
              onClick={() => syncData('products', 'Products')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              📦 SYNC PRODUCTS
            </button>
            
            <button
              onClick={() => syncData('orders', 'Orders')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              🛍️ SYNC ORDERS
            </button>
            
            <button
              onClick={() => syncData('all', 'All Data')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              ⚡ SYNC ALL
            </button>
          </div>
          
          {/* Status Display */}
          {(syncStatus || error) && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              {error && (
                <div className="flex items-center gap-2 text-red-700">
                  <span>❌</span>
                  <span>Error: {error}</span>
                </div>
              )}
              {syncStatus && (
                <div className="text-gray-700 mt-1">{syncStatus}</div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚡</span>
            <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testShopify}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border"
            >
              🔗 TEST CONNECTION
            </button>
            
            <button
              onClick={loadDashboard}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border"
            >
              📊 REFRESH STATS
            </button>
            
            <button
              onClick={checkServerHealth}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border"
            >
              ❤️ SERVER HEALTH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
