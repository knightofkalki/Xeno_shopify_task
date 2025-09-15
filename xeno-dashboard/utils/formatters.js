export const formatters = {
  currency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  },
  
  date: (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  },
  
  number: (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  },
  
  percentage: (value) => {
    return `${((value || 0) * 100).toFixed(1)}%`;
  }
};
