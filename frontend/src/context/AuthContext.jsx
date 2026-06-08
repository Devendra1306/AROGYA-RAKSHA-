import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Resolve the API URL dynamically, defaulting to local backend
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  
  // If we are testing locally on a mobile device (connected to the same Wi-Fi)
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  
  // If we are on localhost/127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // If in production on Vercel or other platforms, and envUrl is set to a non-localhost endpoint
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Fallback for production: relative path
  return '/api';
};

export const API_URL = getApiUrl();

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

// Configure Axios response interceptor to globally intercept and customize network connection errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Call Error Details:", error);
    // Custom friendly message for network/connection failures
    if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
      error.message = "Unable to connect to server. Please check your internet connection or try again.";
    } else if (error.response && error.response.status === 405) {
      error.message = "Request failed with status code 405 (Method Not Allowed). This indicates the API request went to Vercel's static server instead of the backend. Please check VITE_API_URL or run/test using local IP.";
    }
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
          if (res.data && typeof res.data === 'object' && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setProfile(res.data.profile);
          } else {
            console.error('Failed to fetch user profile: Invalid response structure.');
            logout();
          }
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
