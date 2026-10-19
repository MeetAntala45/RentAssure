import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Session bootstrap: runs on mount (page load / refresh)
  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const result = await authService.getSession();
        if (result.isSuccess) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch {
        // 401 → interceptor tries refresh → if that also fails, user stays null
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrapSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    if (result.isSuccess) {
      setUser(result.data);
    }
    return result;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const result = await authService.googleLogin(idToken);
    if (result.isSuccess) {
      setUser(result.data);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    isInitializing,
    login,
    googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
