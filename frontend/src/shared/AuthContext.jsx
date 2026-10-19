import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ra_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await authApi.getSession();
      if (res.data) {
        setUser(res.data);
      }
    } catch {
      // If session check fails, clear stale user
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ra_token');
    if (token) {
      refreshSession();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, requiredRole = null) => {
    const res = await authApi.login(email, password, requiredRole);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const customerLogin = async (email, password) => {
    const res = await authApi.customerLogin(email, password);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const vendorLogin = async (email, password) => {
    const res = await authApi.vendorLogin(email, password);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const adminLogin = async (email, password) => {
    const res = await authApi.adminLogin(email, password);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const register = async (fullName, email, password, confirmPassword, role = 'Customer') => {
    const res = await authApi.register(fullName, email, password, confirmPassword, role);
    return res;
  };

  const googleLogin = async (idToken, role = 'Customer') => {
    const res = await authApi.googleLogin(idToken, role);
    if (res.data) {
      setUser(res.data);
    }
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        customerLogin,
        vendorLogin,
        adminLogin,
        register,
        googleLogin,
        logout,
        refreshSession,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'Admin',
        isVendor: user?.role === 'Vendor',
        isCustomer: user?.role === 'Customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
