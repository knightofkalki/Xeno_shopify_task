'use client';

import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:3005';

export default function TopCustomersTable({ tenantId }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopCustomers() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BACKEND_URL}/api/analytics/top-customers?tenantId=${tenantId}`);
        const json = await res.json();

        if (json.success) {
          setCustomers(json.data.slice(0, 5)); // Ensure only top 5 shown, even if API returns more
        } else {
          setError('Failed to load top customers');
        }
      } catch (err) {
        setError('Server error fetching top customers');
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      fetchTopCustomers();
    }
  }, [tenantId]);

  if (loading) return <p>Loading top customers...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!customers || customers.length === 0) return <p>No customers data available</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-left">Top 5 Customers by Spend</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-5 py-2 text-left font-semibold text-lg">Customer Name</th>
            <th className="border border-gray-300 px-5 py-2 text-right font-semibold text-lg">Total Spent&nbsp;($)</th>
            <th className="border border-gray-300 px-5 py-2 text-right font-semibold text-lg">Orders</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => (
            <tr key={idx} className="hover:bg-blue-50">
              <td className="border border-gray-200 px-5 py-2 text-md font-medium">{c.name || 'N/A'}</td>
              <td className="border border-gray-200 px-5 py-2 text-right text-md">₹{c.totalSpent.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              <td className="border border-gray-200 px-5 py-2 text-right text-md">{c.ordersCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
