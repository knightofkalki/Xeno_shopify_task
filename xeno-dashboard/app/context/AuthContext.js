'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth and validate token with backend on mount
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('xeno_user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${apiBase}/api/auth/validate-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
            localStorage.removeItem('xeno_user');
            localStorage.removeItem('token');
          }
        } catch (err) {
          setUser(null);
          localStorage.removeItem('xeno_user');
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (userData) => {
    const userInfo = {
      email: userData.email,
      tenantId: userData.tenantId,
      tenantName: userData.tenantName,
      tenantDomain: userData.tenantDomain,
      loginTime: new Date().toISOString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      tenant: {
        id: userData.tenantId,
        name: userData.tenantName,
        domain: userData.tenantDomain
      }
    };
    setUser(userInfo);
    localStorage.setItem('xeno_user', JSON.stringify(userInfo));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('xeno_user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'x-vercel-protection-bypass': 'xe_3a4f9b2c8d1e7f6g9h0i2j3k4l5m6n7o8p9q1r2s',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-User-Email': user?.email || '',
      'X-Tenant-ID': user?.tenantId || '1'
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
