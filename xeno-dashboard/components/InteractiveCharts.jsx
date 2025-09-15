'use client';
import { useEffect, useRef } from 'react';

export default function InteractiveCharts({ ordersData, customerGrowth, topCustomers }) {
  const ordersChartRef = useRef(null);
  const customersChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const ordersChartInstance = useRef(null);
  const customersChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      createOrdersChart();
      createCustomersChart();
      createRevenueChart();
    }

    return () => {
      // Cleanup charts on unmount
      if (ordersChartInstance.current) ordersChartInstance.current.destroy();
      if (customersChartInstance.current) customersChartInstance.current.destroy();
      if (revenueChartInstance.current) revenueChartInstance.current.destroy();
    };
  }, [ordersData, customerGrowth, topCustomers]);

  const createOrdersChart = () => {
    if (!ordersChartRef.current) return;
    
    // Destroy existing chart
    if (ordersChartInstance.current) {
      ordersChartInstance.current.destroy();
    }

    const ctx = ordersChartRef.current.getContext('2d');
    
    const labels = ordersData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    ordersChartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Orders',
          data: ordersData.map(item => item.orders || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return `Date: ${context[0].label}`;
              },
              label: function(context) {
                return `Orders: ${context.parsed.y}`;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                weight: 'bold'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            },
            ticks: {
              color: '#6b7280',
              stepSize: 1
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    });
  };

  const createCustomersChart = () => {
    if (!customersChartRef.current) return;
    
    if (customersChartInstance.current) {
      customersChartInstance.current.destroy();
    }

    const ctx = customersChartRef.current.getContext('2d');
    
    const labels = customerGrowth.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    customersChartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Customers',
          data: customerGrowth.map(item => item.newCustomers || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function(context) {
                return `Date: ${context[0].label}`;
              },
              label: function(context) {
                return `New Customers: ${context.parsed.y}`;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                weight: 'bold'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            },
            ticks: {
              color: '#6b7280',
              stepSize: 1
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutBounce'
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    });
  };

  const createRevenueChart = () => {
    if (!revenueChartRef.current) return;
    
    if (revenueChartInstance.current) {
      revenueChartInstance.current.destroy();
    }

    const ctx = revenueChartRef.current.getContext('2d');
    
    const topCustomerNames = topCustomers.slice(0, 5).map(customer => 
      customer.name || customer.email?.split('@')[0] || 'Customer'
    );
    const topCustomerSpending = topCustomers.slice(0, 5).map(customer => customer.totalSpent || 0);

    revenueChartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: topCustomerNames,
        datasets: [{
          label: 'Total Spent',
          data: topCustomerSpending,
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(139, 92, 246, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(context) {
                return `Customer: ${context[0].label}`;
              },
              label: function(context) {
                return `Total Spent: $${context.parsed.y.toFixed(2)}`;
              }
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                weight: 'bold'
              },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(229, 231, 235, 0.5)'
            },
            ticks: {
              color: '#6b7280',
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutElastic'
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    });
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem', textAlign: 'center' }}>
        📊 Interactive Business Analytics
      </h2>

      {/* Charts Grid - Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Orders Chart */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e5e7eb',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📈 Daily Orders Trend
          </h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas ref={ordersChartRef} style={{ width: '100%', height: '100%' }}></canvas>
          </div>
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Hover over bars for detailed information
          </div>
        </div>

        {/* Customer Growth Chart */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e5e7eb',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👥 Customer Growth
          </h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <canvas ref={customersChartRef} style={{ width: '100%', height: '100%' }}></canvas>
          </div>
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            New customer acquisitions over time
          </div>
        </div>
      </div>

      {/* Top Customers Revenue Chart - Full Width */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '2px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '700', 
          color: '#1f2937', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 Top 5 Customers by Revenue
        </h3>
        <div style={{ height: '400px', position: 'relative' }}>
          <canvas ref={revenueChartRef} style={{ width: '100%', height: '100%' }}></canvas>
        </div>
        <div style={{ 
          marginTop: '1rem', 
          fontSize: '0.875rem', 
          color: '#6b7280',
          textAlign: 'center'
        }}>
          Click and hover for customer spending details
        </div>
      </div>
    </div>
  );
}
