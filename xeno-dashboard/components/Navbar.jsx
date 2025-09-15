'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-600">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-3xl">🛒</div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">Xeno Analytics</h1>
                <p className="text-xs text-gray-500">Multi-Store Dashboard</p>
              </div>
            </div>
          </div>

          {/* Center - Navigation Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#overview" className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600">
                📊 Overview
              </a>
              <a href="#analytics" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:border-b-2 hover:border-blue-300">
                📈 Analytics  
              </a>
              <a href="#events" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:border-b-2 hover:border-blue-300">
                🎯 Events
              </a>
              <a href="#sync" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:border-b-2 hover:border-blue-300">
                🔄 Sync
              </a>
            </div>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Store Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-sm font-medium">Store Connected</span>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-800">{user?.email}</div>
                  <div className="text-xs text-blue-600 font-semibold">Tenant {user?.tenantId}</div>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="font-medium text-gray-800">{user?.email}</div>
                    <div className="text-sm text-gray-500">Tenant {user?.tenantId} • {user?.tenantName}</div>
                    <div className="text-xs text-gray-400 mt-1">{user?.tenantDomain}</div>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                      ⚙️ Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                      📊 Switch Store
                    </button>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
