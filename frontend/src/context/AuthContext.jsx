import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a configured axios instance
export const api = axios.create({
  baseURL: API_URL
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Configure auth token interceptor
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch (err) {
      console.error('Failed to fetch user profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    return res.data;
  };

  const googleLogin = async (googleData) => {
    const res = await api.post('/auth/google-login', googleData);
    setToken(res.data.token);
    return res.data;
  };

  const register = async (firstName, lastName, email, mobile, password) => {
    const res = await api.post('/auth/register', { firstName, lastName, email, mobile, password });
    setToken(res.data.token);
    return res.data;
  };

  const logout = () => {
    setToken(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.post('/auth/profile/setup', profileData);
    setProfile(res.data.profile);
    // Refresh user state to update profileCompleted tag
    await fetchUserProfile();
    return res.data;
  };

  const deleteAccount = async () => {
    await api.delete('/auth/profile/delete');
    logout();
  };

  const value = {
    user,
    token,
    loading,
    profile,
    login,
    googleLogin,
    register,
    logout,
    updateProfile,
    deleteAccount,
    refreshProfile: fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
