'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../app/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    storeName: '',
    shopDomain: '',
    accessToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setUserInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        storeName: user.tenant?.name || '',
        shopDomain: user.tenant?.domain || '',
        accessToken: ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    console.log('🔧 Update button clicked!'); // DEBUG
    setIsLoading(true);
    setMessage('🔄 Updating store settings...');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('🔧 Token found:', token ? 'Yes' : 'No'); // DEBUG
      
      if (!token) {
        setMessage('❌ Authentication token not found. Please login again.');
        setIsLoading(false);
        return;
      }

      if (!userInfo.shopDomain || !userInfo.accessToken) {
        setMessage('❌ Please fill in both store domain and access token');
        setIsLoading(false);
        return;
      }

      console.log('🔧 Making API call with data:', {
        shopDomain: userInfo.shopDomain,
        accessToken: userInfo.accessToken ? 'Present' : 'Missing'
      }); // DEBUG
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://xeno-shopify-task-pra7-git-main-boardlys-projects.vercel.app';
      const response = await fetch(`${apiBase}/api/user/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shopDomain: userInfo.shopDomain,
          accessToken: userInfo.accessToken
        })
      });
      
      console.log('🔧 API Response status:', response.status); // DEBUG
      
      const data = await response.json();
      console.log('🔧 API Response data:', data); // DEBUG
      
      if (response.ok) {
        setMessage('✅ Store settings updated successfully!');
      } else {
        setMessage(`❌ Failed to update settings: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🔧 API Error:', error); // DEBUG
      setMessage(`❌ Error updating settings: ${error.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Back to Dashboard Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          ⚙️ Account Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Your account information and store configuration
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: message.includes('✅') ? '#d1fae5' : message.includes('🔄') ? '#fef3c7' : '#fee2e2',
          color: message.includes('✅') ? '#065f46' : message.includes('🔄') ? '#92400e' : '#dc2626',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        
        {/* Personal Information - READ ONLY */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            👤 Personal Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                First Name
              </label>
              <input
                type="text"
                value={userInfo.firstName}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: '#f9fafb',
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Last Name
              </label>
              <input
                type="text"
                value={userInfo.lastName}
                readOnly
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: '#f9fafb',
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={userInfo.email}
              readOnly
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Store Name
            </label>
            <input
              type="text"
              value={userInfo.storeName}
              readOnly
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>

        {/* Store Configuration - EDITABLE */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
            🏪 Store Configuration
          </h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Shopify Store Domain <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={userInfo.shopDomain}
              onChange={(e) => {
                console.log('🔧 Store domain changed:', e.target.value); // DEBUG
                setUserInfo({...userInfo, shopDomain: e.target.value});
              }}
              placeholder="mystore.myshopify.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Your Shopify store domain (e.g., mystore.myshopify.com)
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Admin API Access Token <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              value={userInfo.accessToken}
              onChange={(e) => {
                console.log('🔧 Access token changed'); // DEBUG
                setUserInfo({...userInfo, accessToken: e.target.value});
              }}
              placeholder="shpat_..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Your Shopify Admin API access token (starts with shpat_)
            </p>
          </div>

          {/* Save Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSave}
              disabled={isLoading}
              style={{
                background: isLoading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.background = '#10b981';
              }}
            >
              {isLoading ? '⏳ Updating...' : '💾 Update Store Settings'}
            </button>
          </div>

          {/* Debug Info */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <strong>Debug Info:</strong><br/>
            Store Domain: {userInfo.shopDomain || 'Not set'}<br/>
            Access Token: {userInfo.accessToken ? 'Set (Hidden)' : 'Not set'}<br/>
            User Email: {userInfo.email || 'Not loaded'}
          </div>
        </div>
      </div>
    </div>
  );
}
