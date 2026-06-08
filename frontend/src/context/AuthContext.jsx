import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a configured axios instance
export const api = axios.create({
  baseURL: API_URL
});

// Configure Axios request interceptor to dynamically attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Configure sync profile
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setProfile(res.data.profile);
        } catch (err) {
          console.error('Failed to fetch user profile:', err.message);
          logout();
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    
    // Save to localStorage immediately
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Update state immediately
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    
    try {
      const profileRes = await api.get('/auth/profile');
      setProfile(profileRes.data.profile);
    } catch (e) {
      console.error('Failed to fetch profile during login:', e.message);
    }
    
    return res.data;
  };

  const googleLogin = async (googleData) => {
    const res = await api.post('/auth/google', googleData);
    const { token: newToken, user: newUser } = res.data;
    
    // Save to localStorage immediately
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Update state immediately
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);

    // Debugging logs as requested
    console.log("Google Login Response:", res.data);
    console.log("Token Saved:", localStorage.getItem("token"));
    console.log("Current User:", localStorage.getItem("user"));
    console.log("Is Authenticated:", true);
    
    try {
      const profileRes = await api.get('/auth/profile');
      setProfile(profileRes.data.profile);
    } catch (e) {
      console.error('Failed to fetch profile during Google login:', e.message);
    }
    
    return res.data;
  };

  const register = async (firstName, lastName, email, mobile, password) => {
    const res = await api.post('/auth/register', { firstName, lastName, email, mobile, password });
    const { token: newToken, user: newUser } = res.data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    const res = await api.post('/auth/profile/setup', profileData);
    setProfile(res.data.profile);
    if (token) {
      try {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data.user);
        localStorage.setItem('user', JSON.stringify(profileRes.data.user));
      } catch (e) {
        console.error('Failed to refresh profile details:', e.message);
      }
    }
    return res.data;
  };

  const deleteAccount = async () => {
    await api.delete('/auth/profile/delete');
    logout();
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    profile,
    login,
    googleLogin,
    register,
    logout,
    updateProfile,
    deleteAccount,
    refreshProfile: async () => {
      if (token) {
        try {
          const profileRes = await api.get('/auth/profile');
          setUser(profileRes.data.user);
          localStorage.setItem('user', JSON.stringify(profileRes.data.user));
          setProfile(profileRes.data.profile);
        } catch (e) {
          console.error('Failed to refresh profile details:', e.message);
        }
      }
    }
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
