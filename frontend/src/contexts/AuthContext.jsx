import { useState } from 'react';
import apiService from '../services/api';
import AuthContext from './auth-context';

const getStoredUser = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch {
    localStorage.removeItem('user');
    apiService.removeToken();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = async (email, password, userType) => {
    const response = await apiService.login(email, password, userType);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  };

  const register = async (userData) => {
    const response = await apiService.register(userData);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  };

  const logout = () => {
    setUser(null);
    apiService.removeToken();
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading: false,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
