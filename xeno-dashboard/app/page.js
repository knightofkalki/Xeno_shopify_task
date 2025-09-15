'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import OrdersByDateChart from '../components/OrdersByDateChart';
import BusinessMetricsCharts from '../components/BusinessMetricsCharts';
import SettingsPage from '../components/SettingsPage';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;


export default function Dashboard() {
  const { isAuthenticated, loading: authLoading, user, logout, getAuthHeaders } = useAuth();
  
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [ordersData, setOrdersData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [customEvents, setCustomEvents] = useState({
    totalAbandoned: 0,
    checkoutsStarted: 0,
    checkoutsCompleted: 0,
    abandonmentRate: 0,
    conversionRate: 0,
    lostRevenue: 0
  });
  const [businessMetrics, setBusinessMetrics] = useState({
    sales: [],
    customers: [],
    products: []
  });
  const [customerListModal, setCustomerListModal] = useState({
    isOpen: false,
    customers: [],
    loading: false,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    search: ''
  });
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
  const tenantId = user?.tenantId || '1';

  const fetchBusinessMetrics = async () => {
    try {
      const urls = [
        `${BACKEND_URL}/api/analytics/sales-performance?tenantId=${tenantId}`,
        `${BACKEND_URL}/api/analytics/customer-behavior?tenantId=${tenantId}`, 
        `${BACKEND_URL}/api/analytics/product-performance?tenantId=${tenantId}`
      ];
      
      const [salesResult, customerResult, productResult] = await Promise.allSettled([
        fetch(urls[0]).then(res => res.ok ? res.json() : { success: false }),
        fetch(urls[1]).then(res => res.ok ? res.json() : { success: false }),
        fetch(urls[2]).then(res => res.ok ? res.json() : { success: false })
      ]);
      
      const salesData = salesResult.status === 'fulfilled' && salesResult.value?.success ? salesResult.value.data : [];
      const customerData = customerResult.status === 'fulfilled' && customerResult.value?.success ? customerResult.value.data : [];
      const productData = productResult.status === 'fulfilled' && productResult.value?.success ? productResult.value.data : [];

      setBusinessMetrics({
        sales: Array.isArray(salesData) ? salesData : [],
        customers: Array.isArray(customerData) ? customerData : [],
        products: Array.isArray(productData) ? productData : []
      });
    } catch (error) {
      setBusinessMetrics({ sales: [], customers: [], products: [] });
    }
  };

  const fetchCustomerList = async (page = 1, search = '') => {
    setCustomerListModal(prev => ({ ...prev, loading: true }));
    try {
      const url = `${BACKEND_URL}/api/customers/list?tenantId=${tenantId}&page=${page}&limit=20&search=${encodeURIComponent(search)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCustomerListModal(prev => ({
          ...prev,
          customers: data.data,
          pagination: data.pagination,
          search: search,
          loading: false
        }));
      } else {
        setCustomerListModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setCustomerListModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openCustomerListModal = () => {
    setCustomerListModal(prev => ({ ...prev, isOpen: true }));
    fetchCustomerList(1, '');
  };

  const closeCustomerListModal = () => {
    setCustomerListModal(prev => ({
      ...prev,
      isOpen: false,
      customers: [],
      search: '',
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    }));
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        loadDashboard(),
        fetchOrdersByDate(),
        fetchTopCustomers(),
        fetchCustomEvents(),
        fetchBusinessMetrics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/${tenantId}`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setStats({ totalCustomers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
      }
    } catch (error) {
      setStats({ totalCustomers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    }
  };

  const fetchOrdersByDate = async () => {
    try {
      let url = `${BACKEND_URL}/api/analytics/orders-by-date?tenantId=${tenantId}`;
      if (dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setOrdersData(data.data || []);
      }
    } catch (error) {
      setOrdersData([]);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/top-customers?tenantId=${tenantId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTopCustomers(data.data);
      } else {
        setTopCustomers([]);
      }
    } catch (error) {
      setTopCustomers([]);
    }
  };

  const fetchCustomEvents = async () => {
    try {
      let url = `${BACKEND_URL}/api/analytics/cart-abandonment?tenantId=${tenantId}`;
      if (dateRange.start && dateRange.end) {
        url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        let summary = data.summary || {
          total_abandoned: 0,
          total_completed: 0,
          total_started: 0,
          abandonment_rate: 0,
          abandoned_value: 0
        };
        
        const conversionRate = summary.total_started > 0 ? Math.round(((summary.total_completed / summary.total_started) * 100) * 100) / 100 : 0;

        setCustomEvents({
          totalAbandoned: summary.total_abandoned || 0,
          checkoutsStarted: summary.total_started || 0,
          checkoutsCompleted: summary.total_completed || 0,
          abandonmentRate: summary.abandonment_rate || 0,
          conversionRate: conversionRate,
          lostRevenue: summary.abandoned_value || 0
        });
      } else {
        setCustomEvents({
          totalAbandoned: 0,
          checkoutsStarted: 0,
          checkoutsCompleted: 0,
          abandonmentRate: 0,
          conversionRate: 0,
          lostRevenue: 0
        });
      }
    } catch (error) {
      setCustomEvents({
        totalAbandoned: 0,
        checkoutsStarted: 0,
        checkoutsCompleted: 0,
        abandonmentRate: 0,
        conversionRate: 0,
        lostRevenue: 0
      });
    }
  };

  const syncData = async (endpoint, type) => {
    setSyncStatus(`🔄 Syncing ${type}...`);
    try {
      const response = await fetch(`${BACKEND_URL}/api/sync/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ tenantId })
      });
      const result = await response.json();
      if (result.success) {
        setSyncStatus(`✅ ${type} synced successfully!`);
        setTimeout(() => {
          loadAllData();
          setTimeout(() => setSyncStatus(''), 3000);
        }, 1000);
      } else {
        setSyncStatus(`❌ ${type} sync failed`);
      }
    } catch (error) {
      setSyncStatus(`❌ ${type} sync failed`);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (isAuthenticated()) {
      loadAllData();
    }
  }, [authLoading, isAuthenticated, tenantId]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchOrdersByDate();
      fetchCustomEvents();
    }
  }, [dateRange, tenantId]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h1 style={{ fontSize: '1.5rem', opacity: 0.8 }}>Loading Xeno Analytics...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#2563eb', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', color: '#2563eb' }}>🛒</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Xeno Analytics</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem' }}>
            Store: {user?.tenant?.name || `techmart-dev-store${tenantId === '1' ? '' : tenantId}`}
          </span>
          <div style={{ width: '2rem', height: '2rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
            🚪
          </button>
        </div>
      </nav>

      {/* Settings Page Display */}
      {showSettings && (
        <div style={{ marginBottom: '2rem' }}>
          <SettingsPage />
        </div>
      )}

      {/* Main Content */}
      {!showSettings && (
        <div style={{ display: 'flex' }}>
          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', width: '4rem', background: 'white', borderRight: '1px solid #e5e7eb', padding: '2rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
              {['📊', '👥', '🎯', '⚙️'].map((icon, i) => (
                <div key={i} 
                  onClick={() => { if (i === 3) setShowSettings(true); }}
                  style={{ width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: i === 0 ? '#e0f2fe' : 'transparent', color: i === 0 ? '#0284c7' : '#6b7280', cursor: 'pointer', fontSize: '1.25rem' }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Content */}
          <div style={{ flex: 1, padding: '2rem' }}>
            {/* Core Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Total Customers */}
              <div onClick={openCustomerListModal} style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                <h3 style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1rem 0', fontWeight: '500' }}>
                  Total Customers <span style={{ fontSize: '0.75rem', color: '#3b82f6', marginLeft: '0.5rem', fontWeight: 'bold' }}>(Click to view list)</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', background: '#3b82f6', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem' }}>👥</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {isLoading ? '...' : (stats?.totalCustomers || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.875rem', color: '#3b82f6' }}>👆</div>
              </div>

              {/* Cart Events */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1rem', color: '#1f2937', margin: '0 0 1rem 0', fontWeight: '600' }}>🛒 Cart Events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Started</span><span>{customEvents.checkoutsStarted}</span>
                  </div>
                  <div style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Abandoned</span><span>{customEvents.totalAbandoned}</span>
                  </div>
                  <div style={{ background: '#10b981', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Completed</span><span>{customEvents.checkoutsCompleted}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ color: '#dc2626', fontWeight: 'bold' }}>Abandonment: {customEvents.abandonmentRate}%</div>
                    <div style={{ color: '#16a34a', fontWeight: 'bold' }}>Conversion: {customEvents.conversionRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Chart */}
            <div style={{ marginBottom: '2rem' }}>
              <OrdersByDateChart 
                apiData={ordersData}
                startDate={dateRange.start}
                endDate={dateRange.end}
                setStartDate={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                setEndDate={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                isLoading={isLoading}
              />
            </div>

            {/* Business Metrics Charts */}
            <BusinessMetricsCharts 
              salesData={businessMetrics.sales}
              customerData={businessMetrics.customers}
              productData={businessMetrics.products}
              isLoading={isLoading}
            />

            {/* Secondary Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1rem 0', fontWeight: '500' }}>Total Orders</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', background: '#10b981', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem' }}>📦</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {isLoading ? '...' : (stats?.totalOrders || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 1rem 0', fontWeight: '500' }}>Total Revenue</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', background: '#8b5cf6', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem' }}>💰</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                    ₹{isLoading ? '...' : (stats?.totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', color: '#1f2937', margin: '0 0 1.5rem 0', fontWeight: '600' }}>🏆 Top 5 Customers by Spend</h3>
              
              {topCustomers && Array.isArray(topCustomers) && topCustomers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer?.id || index} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7c2f' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: index < 3 ? 'white' : '#6b7280' }}>
                          {index + 1}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>
                          {customer?.name || customer?.email || 'Unknown Customer'}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                        ${(customer?.totalSpent || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {customer?.ordersCount || 0} orders
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>👥</div>
                  <p>No customer data available.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {isLoading ? 'Loading customers...' : 'Click sync to load data.'}
                  </p>
                </div>
              )}
            </div>

            {/* Sync Controls */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowSettings(!showSettings)} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.75rem', background: '#6b7280', color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚙️</span>SETTINGS
              </button>

              {[
                { endpoint: 'customers', label: 'SYNC CUSTOMERS', icon: '👥' },
                { endpoint: 'products', label: 'SYNC PRODUCTS', icon: '📦' },
                { endpoint: 'orders', label: 'SYNC ORDERS', icon: '🛍️' },
                { endpoint: 'all', label: 'SYNC ALL', icon: '⚡' }
              ].map((item) => (
                <button
                  key={item.endpoint}
                  onClick={() => syncData(item.endpoint, item.label.split(' ')[1])}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.75rem', background: '#3b82f6', color: 'white', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>

            {/* Status Message */}
            {syncStatus && (
              <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '1rem', fontWeight: '600' }}>
                {syncStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer List Modal */}
      {customerListModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '1000px', maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                👥 Customer List ({customerListModal.pagination.total} customers)
              </h2>
              <button onClick={closeCustomerListModal} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="🔍 Search customers by name or email..."
                value={customerListModal.search}
                onChange={(e) => {
                  const searchValue = e.target.value;
                  setCustomerListModal(prev => ({ ...prev, search: searchValue }));
                  setTimeout(() => {
                    if (customerListModal.search === searchValue) {
                      fetchCustomerList(1, searchValue);
                    }
                  }, 500);
                }}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              {customerListModal.loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Loading customers...</p>
                  </div>
                </div>
              ) : customerListModal.customers.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Total Spent</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerListModal.customers.map((customer) => (
                      <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600' }}>{customer.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{customer.email}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>
                          {customer.ordersCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <p style={{ color: '#6b7280' }}>No customers found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
