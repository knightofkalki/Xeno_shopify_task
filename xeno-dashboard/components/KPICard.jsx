'use client';
import { useState, useEffect } from 'react';

export default function KPICard({ title, value, icon, color, trend, description, loading }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    if (loading || !value) return;
    
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-600',
    green: 'border-green-500 bg-green-50 text-green-600', 
    orange: 'border-orange-500 bg-orange-50 text-orange-600',
    purple: 'border-purple-500 bg-purple-50 text-purple-600',
    red: 'border-red-500 bg-red-50 text-red-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${colorClasses[color]} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <p className={`text-3xl font-extrabold ${colorClasses[color]}`}>
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          ) : (
            typeof value === 'number' && value > 1000 
              ? displayValue.toLocaleString() 
              : displayValue
          )}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'orange' ? 'bg-orange-500' : color === 'purple' ? 'bg-purple-500' : 'bg-red-500'} transition-all duration-1000`}
            style={{ width: loading ? '0%' : '85%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
