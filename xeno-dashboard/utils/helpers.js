export const helpers = {
  aggregateDataByDate: (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    const grouped = {};
    apiData.forEach(item => {
      const date = item.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          orderCount: 0,
          totalRevenue: 0
        };
      }
      grouped[date].orderCount += (item.orderCount || 0);
      grouped[date].totalRevenue += (item.totalRevenue || 0);
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  
  calculateGrowthRate: (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};
