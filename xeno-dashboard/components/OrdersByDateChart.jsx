'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function OrdersByDateChart({ 
  apiData = [], 
  startDate, 
  endDate, 
  setStartDate, 
  setEndDate, 
  isLoading = false 
}) {
  const [chartType, setChartType] = useState('line');
  const [aggregatedData, setAggregatedData] = useState([]);

  console.log('🔧 Raw API Data:', apiData); // DEBUG

  // ✅ FIXED: Aggregate data by date to prevent multiple bars
  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const aggregated = aggregateDataByDate(apiData);
      setAggregatedData(aggregated);
      console.log('🔧 Aggregated Data:', aggregated); // DEBUG
    } else {
      setAggregatedData([]);
    }
  }, [apiData]);

  // ✅ NEW: Data aggregation function
  const aggregateDataByDate = (rawData) => {
    const groupedData = {};
    
    rawData.forEach(item => {
      const date = item.date;
      
      if (!groupedData[date]) {
        groupedData[date] = {
          date: date,
          orderCount: 0,
          totalRevenue: 0
        };
      }
      
      // Sum up orders and revenue for the same date
      groupedData[date].orderCount += parseInt(item.orderCount || 0);
      groupedData[date].totalRevenue += parseFloat(item.totalRevenue || 0);
    });
    
    // Convert to array and sort by date
    return Object.values(groupedData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Calculate totals using aggregated data
  const totalOrders = aggregatedData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
  const totalRevenue = aggregatedData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const hasData = aggregatedData && aggregatedData.length > 0;
  console.log('🔧 Chart has aggregated data:', hasData, 'Length:', aggregatedData.length); // DEBUG

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '1rem', 
      padding: '2rem', 
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      marginBottom: '2rem',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            margin: '0 0 0.5rem 0' 
          }}>
            📈 Orders Analytics
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Track your store's order trends and revenue performance
          </p>
        </div>
        
        {/* Chart Type Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setChartType('line')}
            disabled={!hasData}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: chartType === 'line' ? '#3b82f6' : '#e5e7eb',
              color: chartType === 'line' ? 'white' : '#6b7280',
              cursor: hasData ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: hasData ? 1 : 0.5
            }}
          >
            📈 Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            disabled={!hasData}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: chartType === 'bar' ? '#3b82f6' : '#e5e7eb',
              color: chartType === 'bar' ? 'white' : '#6b7280',
              cursor: hasData ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: hasData ? 1 : 0.5
            }}
          >
            📊 Bar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            {hasData ? totalOrders.toLocaleString() : '0'}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
            {hasData ? formatCurrency(totalRevenue) : '$0.00'}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Avg Order Value
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {hasData ? formatCurrency(avgOrderValue) : '$0.00'}
          </div>
        </div>
        
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #e5e7eb' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Days with Data
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {hasData ? aggregatedData.length : '0'}
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.25rem' 
          }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate || '2025-08-01'}
            onChange={(e) => setStartDate && setStartDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.25rem' 
          }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate || '2025-09-15'}
            onChange={(e) => setEndDate && setEndDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        {/* Quick Date Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <button
            onClick={() => {
              const today = new Date();
              const lastWeek = new Date(today);
              lastWeek.setDate(today.getDate() - 7);
              setStartDate && setStartDate(lastWeek.toISOString().split('T')[0]);
              setEndDate && setEndDate(today.toISOString().split('T')[0]);
            }}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(today);
              lastMonth.setDate(today.getDate() - 30);
              setStartDate && setStartDate(lastMonth.toISOString().split('T')[0]);
              setEndDate && setEndDate(today.toISOString().split('T')[0]);
            }}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Chart Area - Using aggregated data */}
      <div style={{ 
        height: '400px', 
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <p>Loading orders data...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>No Orders Data Available</h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Try adjusting your date range or sync your orders data.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        ) : (
          // ✅ FIXED: Using aggregated data instead of raw API data
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart 
                data={aggregatedData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="left"
                  stroke="#3b82f6"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'orderCount' ? value : formatCurrency(value),
                    name === 'orderCount' ? 'Orders' : 'Revenue'
                  ]}
                  labelFormatter={(date) => `Date: ${formatDate(date)}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="orders"
                  type="monotone" 
                  dataKey="orderCount" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Orders"
                />
                <Line 
                  yAxisId="revenue"
                  type="monotone" 
                  dataKey="totalRevenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Revenue"
                />
              </LineChart>
            ) : (
              <BarChart 
                data={aggregatedData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="left"
                  stroke="#3b82f6"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'orderCount' ? value : formatCurrency(value),
                    name === 'orderCount' ? 'Orders' : 'Revenue'
                  ]}
                  labelFormatter={(date) => `Date: ${formatDate(date)}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="orders"
                  dataKey="orderCount" 
                  fill="#3b82f6" 
                  name="Orders"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="revenue"
                  dataKey="totalRevenue" 
                  fill="#10b981" 
                  name="Revenue"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Debug Info */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        background: '#f3f4f6', 
        borderRadius: '0.25rem', 
        fontSize: '0.75rem',
        color: '#6b7280'
      }}>
        <strong>🔧 Debug:</strong> Raw data: {apiData.length}, Aggregated: {aggregatedData.length}, Loading: {isLoading ? 'Yes' : 'No'}
      </div>

      {/* Data Source Info */}
      {hasData && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#d1fae5', 
          borderRadius: '0.5rem', 
          fontSize: '0.875rem',
          color: '#065f46'
        }}>
          <strong>📊 Real Data:</strong> Showing {aggregatedData.length} days of aggregated order data from your Shopify store (combined from {apiData.length} raw entries)
        </div>
      )}
    </div>
  );
}
