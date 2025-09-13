'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('xeno_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    const userInfo = {
      email: userData.email,
      tenantId: userData.tenantId,
      tenantName: userData.tenantName,
      tenantDomain: userData.tenantDomain,
      loginTime: new Date().toISOString()
    };
    
    setUser(userInfo);
    localStorage.setItem('xeno_user', JSON.stringify(userInfo));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('xeno_user');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
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
