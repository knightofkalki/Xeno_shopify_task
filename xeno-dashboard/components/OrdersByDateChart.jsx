'use client';

import React, { useEffect, useState } from 'react';
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

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export default function OrdersByDateChart({ apiData, startDate, endDate, setStartDate, setEndDate }) {
  const [filteredData, setFilteredData] = useState(apiData);

  // Calculate total orders in filtered range
  const totalOrders = filteredData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = filteredData.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const averageOrdersPerDay = filteredData.length > 0 ? (totalOrders / filteredData.length).toFixed(1) : 0;

  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredData(apiData);
      return;
    }
    const filtered = apiData.filter(({ date }) => {
      const itemDate = new Date(date);
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      return itemDate >= fromDate && itemDate <= toDate;
    });
    setFilteredData(filtered);
  }, [apiData, startDate, endDate]);

  const chartData = {
    labels: filteredData.map(item => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'Daily Orders',
        data: filteredData.map(item => item.orders),
        backgroundColor: '#06b6d4', // Tailwind cyan-500
        borderColor: '#0891b2',     // Tailwind cyan-600
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.8,
        hoverBackgroundColor: '#0284c7', // Tailwind sky-600
        hoverBorderColor: '#0369a1',     // Tailwind sky-700
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    animation: { duration: 1200, easing: 'easeOutQuint' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#0e7490', // Tailwind cyan-700
          font: { weight: 'bold', size: 15 }
        }
      },
      tooltip: {
        enabled: true,
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        callbacks: {
          label: ctx => `Orders: ${ctx.parsed.y}`,
          afterLabel: ctx => filteredData[ctx.dataIndex]?.revenue ? 
            `Revenue: $${filteredData[ctx.dataIndex].revenue.toFixed(2)}` : ''
        }
      },
      title: {
        display: true,
        text: 'Daily Order Trends - Business Performance Analysis',
        color: '#0891b2',
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 15 }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date Range',
          color: '#4b5563',
          font: { weight: 'bold', size: 15 }
        },
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 30,
          font: { size: 12, weight: 'bold' }
        },
        grid: { 
          color: '#e0f2fe',
          borderColor: '#0891b2' 
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Orders',
          color: '#4b5563',
          font: { weight: 'bold', size: 15 }
        },
        ticks: { 
          color: '#0891b2', 
          stepSize: 1, 
          font: { size: 12, weight: 'bold' } 
        },
        grid: { 
          color: '#e0f2fe',
          borderColor: '#0891b2' 
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-2xl mb-12 border-t-8 border-cyan-400">
      {/* Header with Key Metrics */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-cyan-700 uppercase tracking-wide text-center mb-4">
          📊 Orders Analysis Dashboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-cyan-500">
            <h3 className="text-sm font-bold text-cyan-600 uppercase">Total Orders</h3>
            <p className="text-2xl font-extrabold text-cyan-700">{totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm font-bold text-blue-600 uppercase">Avg Per Day</h3>
            <p className="text-2xl font-extrabold text-blue-700">{averageOrdersPerDay}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-teal-500">
            <h3 className="text-sm font-bold text-teal-600 uppercase">Total Revenue</h3>
            <p className="text-2xl font-extrabold text-teal-700">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        <div className="bg-white p-3 rounded-lg shadow-md">
          <label className="block mb-2 text-cyan-700 font-bold text-sm uppercase">Start Date</label>
          <input
            type="date"
            className="border-2 border-cyan-300 rounded-lg px-4 py-2 w-44 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-semibold"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="bg-white p-3 rounded-lg shadow-md">
          <label className="block mb-2 text-cyan-700 font-bold text-sm uppercase">End Date</label>
          <input
            type="date"
            className="border-2 border-cyan-300 rounded-lg px-4 py-2 w-44 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-semibold"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div style={{ height: '350px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* Explanatory Text */}
      <p className="mt-6 text-center text-gray-700 italic text-sm bg-white p-3 rounded-lg shadow-sm">
        📈 <strong>Business Insight:</strong> This chart visualizes daily order volume trends to identify peak sales periods, 
        seasonal patterns, and business growth opportunities. Use date filters to analyze specific time periods.
      </p>
    </div>
  );
}
