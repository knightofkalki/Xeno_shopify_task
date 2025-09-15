// hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useDashboardData = (tenantId) => {
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    if (!tenantId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎯 Hook: Fetching dashboard stats for tenant:', tenantId);
      const response = await api.getDashboardStats(tenantId);
      
      if (response.success) {
        setDashboardStats(response.stats);
        console.log('✅ Hook: Dashboard stats loaded:', response.stats);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('❌ Hook: Dashboard stats error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [tenantId]);

  return {
    dashboardStats,
    isLoading,
    error,
    refetch: fetchDashboardStats
  };
};
