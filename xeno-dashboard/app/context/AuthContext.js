'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('xeno_token');
    const storedUser = localStorage.getItem('xeno_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Send OTP to email
  const sendOTP = async (email, tenantId = '1') => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Failed to send OTP' };
    }
  };

  // Verify OTP and login
  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        
        localStorage.setItem('xeno_token', data.token);
        localStorage.setItem('xeno_user', JSON.stringify(data.user));
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'OTP verification failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('xeno_token');
    localStorage.removeItem('xeno_user');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      sendOTP,
      verifyOTP,
      logout,
      isAuthenticated,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};
