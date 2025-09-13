'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import OrdersByDateChart from '../components/OrdersByDateChart';
import TopCustomersTable from '../components/TopCustomersTable';
import CustomerGrowthChart from '../components/CustomerGrowthChart';

const BACKEND_URL = 'http://localhost:3001';

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading, user, logout, getAuthHeaders } = useAuth();
  const [ordersData, setOrdersData] = useState([]);
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const tenantId = user?.tenantId || '1';

  const router = useRouter();
  
  // All your existing state variables remain the same
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
  async function fetchOrders() {
    let url = `${BACKEND_URL}/api/analytics/orders-by-date?tenantId=${tenantId}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      setOrdersData(json.data);
    }
  }
  fetchOrders();
}, [tenantId, startDate, endDate]);



  // Add auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (isAuthenticated()) {
      loadDashboard();
      testShopify();
    }
  }, [authLoading, isAuthenticated]);

  // Update loadDashboard to use user's tenantId
  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = new Date().getTime();
      const tenantId = user?.tenantId || '1';
      const response = await fetch(`${BACKEND_URL}/api/dashboard/${tenantId}?t=${timestamp}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      console.log('Dashboard data received:', data);
      
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

  // Update syncData to use user's tenantId
  const syncData = async (endpoint, type) => {
    setSyncStatus(`Syncing ${type}...`);
    setError(null);
    
    try {
      const tenantId = user?.tenantId || '1';
      const response = await fetch(`${BACKEND_URL}/api/sync/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ tenantId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(`✅ ${type} synced successfully`);
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

  // All other functions remain exactly the same (testShopify, testDatabase, checkServerHealth)
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

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with user info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🛒</span>
            <h1 className="text-3xl font-bold text-gray-800">Xeno Shopify Dashboard</h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Shopify: connected
            </div>
            
            {user && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                <span>👤</span>
                <span>{user.email}</span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded">Tenant {user.tenantId}</span>
              </div>
            )}
            
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Rest of your existing dashboard JSX remains exactly the same */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">👥 Total Customers</h3>
            <p className="text-3xl font-bold text-blue-600">
              {isLoading ? '...' : stats.totalCustomers.toLocaleString()}
            </p>
          </div>
          <TopCustomersTable tenantId={tenantId} />

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📦 Total Products</h3>
            <p className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : stats.totalProducts.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h1 className="text-3xl font-extrabold text-blue-700 mb-4">
  Total Orders: {ordersData.reduce((sum, d) => sum + d.orders, 0)}
</h1>


            <p className="text-3xl font-bold text-orange-600">
              {isLoading ? '...' : stats.totalOrders.toLocaleString()}
            </p>
          </div>
          <CustomerGrowthChart tenantId={tenantId} />

         <OrdersByDateChart
  apiData={ordersData}
  startDate={startDate}
  endDate={endDate}
  setStartDate={setStartDate}
  setEndDate={setEndDate}
/>


          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">💰 Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">
              {isLoading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}
            </p>
          </div>
          
        </div>

        {/* All your existing sync controls and quick actions remain exactly the same */}
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
