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

const BACKEND_URL = 'http://localhost:3001';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export default function CustomerGrowthBarChart({ tenantId }) {
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Total customers count
  const totalNewCustomers = growthData.reduce((sum, d) => sum + d.newCustomers, 0);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    async function fetchGrowth() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/customer-growth?tenantId=${tenantId}`);
        const json = await res.json();
        if (json.success) {
          setGrowthData(json.data);
        } else {
          setError('Failed to load customer growth data');
        }
      } catch (e) {
        setError('Error while fetching customer growth');
      } finally {
        setLoading(false);
      }
    }

    fetchGrowth();
  }, [tenantId]);

  if (loading) return <p>Loading customer growth data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!growthData || growthData.length === 0) return <p>No customer growth data available.</p>;

  const chartData = {
    labels: growthData.map(item => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'New Customers',
        data: growthData.map(item => item.newCustomers),
        backgroundColor: '#22c55e', // Tailwind green-500
        borderRadius: 6,
        barPercentage: 0.7,
        hoverBackgroundColor: '#16a34a',
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    animation: { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#166534',
          font: { weight: 'bold', size: 14 }
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => `New Customers: ${ctx.parsed.y}`
        }
      },
      title: {
        display: true,
        text: 'Customer Growth Over Time',
        color: '#15803d',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 10 }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#4b5563',
          font: { weight: 'bold', size: 14 }
        },
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 30,
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: '#e5e7eb' }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'New Customers',
          color: '#4b5563',
          font: { weight: 'bold', size: 14 }
        },
        ticks: { color: '#6b7280', stepSize: 1, font: { size: 12 } },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mb-8 border-t-8 border-green-400">
      <div className="mb-4 text-green-700 font-extrabold text-lg text-center">
        Total New Customers in Selected Period: {totalNewCustomers}
      </div>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
      <p className="mt-3 text-center text-gray-600 italic text-sm">
        This bar chart shows daily new customer acquisition trends to help assess your business growth.
      </p>
    </div>
  );
}
