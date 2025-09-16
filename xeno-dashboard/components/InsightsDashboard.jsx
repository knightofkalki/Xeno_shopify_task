'use client';
import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:3005';

export default function InsightsDashboard({ tenantId }) {
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    ordersByDate: [],
    topCustomers: [],
    customerGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [stats, orders, customers, growth] = await Promise.all([
        fetch(`${BACKEND_URL}/api/dashboard/${tenantId}`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/analytics/orders-by-date?tenantId=${tenantId}${dateRange.start ? `&startDate=${dateRange.start}&endDate=${dateRange.end}` : ''}`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/analytics/top-customers?tenantId=${tenantId}`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/analytics/customer-growth?tenantId=${tenantId}`).then(r => r.json())
      ]);

      setDashboardData({
        totalCustomers: stats.success ? stats.stats.totalCustomers : 0,
        totalOrders: stats.success ? stats.stats.totalOrders : 0,
        totalRevenue: stats.success ? stats.stats.totalRevenue : 0,
        ordersByDate: orders.success ? orders.data : [],
        topCustomers: customers.success ? customers.data : [],
        customerGrowth: growth.success ? growth.data : []
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stock-style KPI Card Component
  const StockCard = ({ title, value, trend, icon, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '1.5rem',
      border: `2px solid ${color}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100px',
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: '50%',
        transform: 'translate(30px, -30px)'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#6b7280', 
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {title}
            </h3>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: '0.5rem 0'
            }}>
              {loading ? '...' : value}
            </div>
            {subtitle && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ 
            fontSize: '2rem', 
            color: color,
            background: `${color}20`,
            padding: '0.75rem',
            borderRadius: '0.75rem'
          }}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: trend > 0 ? '#f0fdf4' : '#fef2f2',
            borderRadius: '0.5rem',
            border: `1px solid ${trend > 0 ? '#bbf7d0' : '#fecaca'}`
          }}>
            <span style={{ color: trend > 0 ? '#16a34a' : '#dc2626' }}>
              {trend > 0 ? '📈' : '📉'}
            </span>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: trend > 0 ? '#16a34a' : '#dc2626'
            }}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              vs last month
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Stock-style Line Chart Component
  const LineChart = ({ data, title, color = '#3b82f6' }) => {
    if (!data || data.length === 0) return <div>No data available</div>;

    const maxValue = Math.max(...data.map(d => d.orders || d.newCustomers || 0));
    const minValue = Math.min(...data.map(d => d.orders || d.newCustomers || 0));
    const range = maxValue - minValue || 1;

    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '1.5rem'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {title}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
        
        <div style={{ position: 'relative', height: '300px', background: '#f9fafb', borderRadius: '0.5rem', padding: '1rem' }}>
          <svg width="100%" height="100%" style={{ overflow: "visible" }}>
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Chart Line */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="3"
              points={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100;
                const value = point.orders || point.newCustomers || 0;
                const y = 100 - ((value - minValue) / range) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
            
            {/* Data Points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const value = point.orders || point.newCustomers || 0;
              const y = 100 - ((value - minValue) / range) * 100;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* Tooltip on hover effect would go here */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem'
          }}>
            Latest: {data[data.length - 1]?.orders || data[data.length - 1]?.newCustomers || 0}
          </div>
        </div>
      </div>
    );
  };

  // Top Customers Table Component
  const TopCustomersTable = ({ customers }) => (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      padding: '1.5rem'
    }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
        🏆 Top 5 Customers by Spend
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                Rank
              </th>
              <th style={{ textAlign: 'left', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                Customer
              </th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                Total Spent
              </th>
              <th style={{ textAlign: 'right', padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                Orders
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.slice(0, 5).map((customer, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem 0' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7c2f' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: index < 3 ? 'white' : '#6b7280'
                  }}>
                    {index + 1}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 0' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {customer.name || customer.email}
                    </div>
                    {customer.name && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {customer.email}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#16a34a' }}>
                    ${customer.totalSpent?.toFixed(2) || '0.00'}
                  </div>
                </td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                  <div style={{
                    background: '#f3f4f6',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'inline-block'
                  }}>
                    {customer.ordersCount || 0}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          📊 Business Insights Dashboard
        </h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
          Real-time analytics and performance metrics for Tenant {tenantId}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <StockCard
          title="Total Customers"
          value={dashboardData.totalCustomers.toLocaleString()}
          trend={8.2}
          icon="👥"
          color="#3b82f6"
          subtitle="Active customer base"
        />
        <StockCard
          title="Total Orders"
          value={dashboardData.totalOrders.toLocaleString()}
          trend={12.5}
          icon="📦"
          color="#10b981"
          subtitle="Orders processed"
        />
        <StockCard
          title="Total Revenue"
          value={`$${dashboardData.totalRevenue.toFixed(2)}`}
          trend={15.3}
          icon="💰"
          color="#f59e0b"
          subtitle="Revenue generated"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <LineChart
          data={dashboardData.ordersByDate}
          title="📈 Orders by Date (with Date Range Filtering)"
          color="#3b82f6"
        />
        <LineChart
          data={dashboardData.customerGrowth}
          title="👥 Customer Growth Trend"
          color="#10b981"
        />
      </div>

      {/* Top Customers Table */}
      <TopCustomersTable customers={dashboardData.topCustomers} />
    </div>
  );
}
