'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xeno-shopify-task-pra7-git-main-boardlys-projects.vercel.app';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export default function CustomEventsChart({ tenantId }) {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    async function fetchEvents() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/cart-abandonment?tenantId=${tenantId}`);
        const json = await res.json();
        
        if (json.success) {
          setEventsData(json.data);
        } else {
          setError('Failed to load custom events');
        }
      } catch (e) {
        setError('Error fetching custom events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [tenantId]);

  // Generate demo events function
  const generateDemoEvents = async () => {
    const { trackEvent, EVENTS } = await import('../utils/eventTracker');
    
    try {
      // Generate some demo events for current tenant
      await trackEvent(EVENTS.CART_ABANDONMENT, { cartValue: 150.00, products: 3 }, tenantId);
      await trackEvent(EVENTS.CHECKOUT_STARTED, { cartValue: 200.00, products: 2 }, tenantId);
      await trackEvent(EVENTS.CHECKOUT_COMPLETED, { orderValue: 180.00, products: 2 }, tenantId);
      await trackEvent(EVENTS.CART_ABANDONMENT, { cartValue: 75.50, products: 1 }, tenantId);
      await trackEvent(EVENTS.CHECKOUT_STARTED, { cartValue: 320.00, products: 4 }, tenantId);
      
      alert('Demo events generated! Refresh to see updated data.');
      
      // Refresh data after generating events
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      alert('Failed to generate demo events');
    }
  };

  if (loading) return <p>Loading custom events...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  // Calculate totals
  const totalAbandoned = eventsData.reduce((sum, d) => sum + (d.abandoned_carts || 0), 0);
  const totalStarted = eventsData.reduce((sum, d) => sum + (d.checkouts_started || 0), 0);
  const totalCompleted = eventsData.reduce((sum, d) => sum + (d.checkouts_completed || 0), 0);
  const averageAbandonmentRate = totalStarted > 0 ? ((totalAbandoned / totalStarted) * 100).toFixed(1) : 0;

  const chartData = {
    labels: eventsData.map(item => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'Cart Abandonment',
        data: eventsData.map(item => item.abandoned_carts || 0),
        backgroundColor: '#ef4444', // red-500
        borderRadius: 6,
      },
      {
        label: 'Checkouts Started',
        data: eventsData.map(item => item.checkouts_started || 0),
        backgroundColor: '#f59e0b', // amber-500
        borderRadius: 6,
      },
      {
        label: 'Checkouts Completed',
        data: eventsData.map(item => item.checkouts_completed || 0),
        backgroundColor: '#10b981', // emerald-500
        borderRadius: 6,
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    animation: { duration: 1000 },
    plugins: {
      legend: { 
        display: true, 
        position: 'top',
        labels: { font: { weight: 'bold', size: 13 } }
      },
      title: {
        display: true,
        text: 'E-commerce Funnel Analysis - Cart & Checkout Events',
        font: { size: 16, weight: 'bold' },
        color: '#374151'
      }
    },
    scales: {
      x: { 
        title: { display: true, text: 'Date', font: { weight: 'bold' } },
        ticks: { font: { weight: 'bold' } }
      },
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Event Count', font: { weight: 'bold' } },
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg mb-8 border-t-8 border-red-400">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-red-700 uppercase tracking-wide">
          🛒 Custom Events Analytics
        </h2>
        <button
          onClick={generateDemoEvents}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          🎲 Generate Demo Events
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
          <h3 className="text-sm font-bold text-red-600 uppercase">Total Abandoned</h3>
          <p className="text-2xl font-bold text-red-700">{totalAbandoned}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
          <h3 className="text-sm font-bold text-amber-600 uppercase">Checkouts Started</h3>
          <p className="text-2xl font-bold text-amber-700">{totalStarted}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
          <h3 className="text-sm font-bold text-emerald-600 uppercase">Completed</h3>
          <p className="text-2xl font-bold text-emerald-700">{totalCompleted}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-blue-600 uppercase">Abandonment Rate</h3>
          <p className="text-2xl font-bold text-blue-700">{averageAbandonmentRate}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div style={{ height: '350px' }}>
          {eventsData.length > 0 ? (
            <Bar data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-lg font-semibold mb-2">No Custom Events Data</p>
                <p className="text-sm mb-4">Click &quot;Generate Demo Events&quot; to create sample data</p>
                <button
                  onClick={generateDemoEvents}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  🎲 Generate Demo Events
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-blue-800 mb-2">📈 Business Insights:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Cart Abandonment:</strong> Customers who added items but didn&apos;t proceed to checkout</p>
          <p>• <strong>Checkout Started:</strong> Customers who initiated the checkout process</p>
          <p>• <strong>Checkout Completed:</strong> Successful order completions</p>
          <p>• <strong>Conversion Funnel:</strong> Track user behavior from cart to purchase</p>
        </div>
      </div>
    </div>
  );
}
