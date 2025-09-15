'use client';
import { useState } from 'react';

export default function Sidebar({ activeSection, setActiveSection }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊', description: 'Dashboard Summary' },
    { id: 'analytics', label: 'Analytics', icon: '📈', description: 'Charts & Reports' },
    { id: 'events', label: 'Custom Events', icon: '🎯', description: 'Cart & Checkout' },
    { id: 'customers', label: 'Customers', icon: '👥', description: 'Customer Data' },
    { id: 'sync', label: 'Data Sync', icon: '🔄', description: 'Shopify Sync' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Configuration' }
  ];

  return (
    <div className={`bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen fixed left-0 top-16 z-40`}>
      {/* Collapse Toggle */}
      <div className="p-4 border-b border-blue-700">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
          {!isCollapsed && <span className="ml-2 text-sm">Collapse Menu</span>}
        </button>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center p-3 mb-2 rounded-lg transition-all duration-200 ${
              activeSection === item.id 
                ? 'bg-blue-600 shadow-lg scale-105' 
                : 'hover:bg-blue-700 hover:scale-102'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && (
              <div className="ml-3 text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-blue-200">{item.description}</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Info */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-800 rounded-lg p-3 border border-blue-600">
            <div className="text-sm font-medium">🚀 Pro Tip</div>
            <div className="text-xs text-blue-200 mt-1">
              Use sync controls to update data from Shopify
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
