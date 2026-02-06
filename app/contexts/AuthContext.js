'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage on mount
    loadAuthData();
  }, []);

  const loadAuthData = () => {
    try {
      const storedUser = localStorage.getItem('assetflow_user');
      const storedToken = localStorage.getItem('assetflow_token');
      const storedRole = localStorage.getItem('assetflow_role');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setRole(storedRole);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const saveAuthData = (userData, tokenData) => {
    try {
      localStorage.setItem('assetflow_user', JSON.stringify(userData));
      localStorage.setItem('assetflow_token', tokenData);
         localStorage.setItem('assetflow_role', userData.role);
      setUser(userData);
      setToken(tokenData);
        setRole(userData.role);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('assetflow_user');
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_role');
    setRole(null);
    setUser(null);
    setToken(null);
  };

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const result = await response.json();

      if (result.success) {
        saveAuthData(result.data.user, result.data.token);
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    }
  };

  const logout = () => {
    clearAuthData();
    router.push('/');
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: isAuthenticated(),
      isAdmin: hasRole('admin'),
      isManager: hasRole('manager'),
      isStaff: hasRole('staff'),
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}