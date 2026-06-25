import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

// Resolve the API URL dynamically, defaulting to local backend
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  
  return '/api';
};

export const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL
});

// Axios request interceptor to dynamically attach token
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

// Axios response interceptor for network and CORS blocks customization
api.interceptors.response.use(
  (response) => {
    // Detect HTML response pages served by Vercel static routing (SPA fallback) instead of backend JSON
    if (response.data && typeof response.data === 'string' && (response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html') || response.data.trim().startsWith('<head'))) {
      const htmlError = new Error("API request returned HTML instead of JSON. The VITE_API_URL may be missing/misconfigured on Vercel, causing requests to be routed to static index.html.");
      htmlError.status = 405;
      htmlError.response = response;
      return Promise.reject(htmlError);
    }
    return response;
  },
  (error) => {
    console.error("API Call Error Details:", error);
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = "Request timeout: The server took too long to respond. Please try again.";
    } 
    else if (!error.response) {
      const isHttps = window.location.protocol === 'https:';
      const isLocalBackend = API_URL.startsWith('http://localhost') || 
                            API_URL.startsWith('http://127.0.0.1') || 
                            API_URL.startsWith('http://192.168.') || 
                            API_URL.startsWith('http://10.') ||
                            API_URL.startsWith('http://172.16.');
      
      if (isHttps && isLocalBackend) {
        error.message = "CORS / Mixed Content blocked: Secure HTTPS frontend cannot call insecure HTTP backend. Please use local dev network URL or deploy backend to HTTPS.";
      } else if (!window.navigator.onLine) {
        error.message = "Network Error: You appear to be offline. Please check your internet connection.";
      } else {
        error.message = "Server unavailable: Could not connect to the backend API server. Ensure it is running and accessible.";
      }
    } 
    else {
      const status = error.response.status;
      if (status === 405) {
        error.message = "API URL missing (405 Method Not Allowed): Request sent to static Vercel host instead of API backend. Ensure VITE_API_URL is configured on Vercel.";
      } else if (status === 404) {
        error.message = "API endpoint not found (404). Please verify backend route configuration.";
      } else if (status === 401 || status === 403) {
        if (!error.response.data?.error) {
          error.message = "Invalid credentials: Access denied.";
        }
      } else if (status >= 500) {
        error.message = `Server error (${status}): The backend server encountered an error. Please try again later.`;
      }
    }
    
    return Promise.reject(error);
  }
);

// Check if a JWT token is expired locally
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (isTokenExpired(savedToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      return null;
    }
    return savedToken;
  });

  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (isTokenExpired(savedToken)) {
      return null;
    }
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return !!savedToken && !isTokenExpired(savedToken);
  });

  // Start as false immediately — guests see the page instantly.
  // Only set to true when Firebase confirms there IS a session to sync.
  const [loading, setLoading] = useState(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser  = localStorage.getItem('user');
    // If we already have both a valid token AND cached user in localStorage,
    // we can render immediately without waiting for backend.
    if (savedToken && savedUser && !isTokenExpired(savedToken)) return false;
    // If no token at all, user is definitely a guest — show page immediately.
    if (!savedToken) return false;
    // Token exists but user data missing — needs backend sync (rare)
    return true;
  });

  const [profile, setProfile] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (isTokenExpired(savedToken)) {
      return null;
    }
    const savedProfile = localStorage.getItem('profile');
    try {
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch (e) {
      return null;
    }
  });

  // Listen to Firebase Auth state change to persist sessions across page refreshes
  useEffect(() => {
    // Hard timeout: never block the UI for more than 2 seconds
    const loadingTimeout = setTimeout(() => setLoading(false), 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('token', idToken);
          setToken(idToken);

          // Race backend call against a 3-second timeout
          const fetchProfile = api.get('/auth/profile', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          );

          const res = await Promise.race([fetchProfile, timeoutPromise]);

          if (res.data && typeof res.data === 'object' && res.data.user) {
            const syncedUser = {
              ...res.data.user,
              emailVerified: firebaseUser.emailVerified
            };
            setUser(syncedUser);
            localStorage.setItem('user', JSON.stringify(syncedUser));
            setProfile(res.data.profile);
            if (res.data.profile) {
              localStorage.setItem('profile', JSON.stringify(res.data.profile));
            } else {
              localStorage.removeItem('profile');
            }
            setIsAuthenticated(true);
          } else {
            console.error('Failed to sync auth session: Invalid response structure from backend.');
            handleForceLogout();
          }
        } catch (err) {
          console.error('Error syncing auth session with backend on refresh:', err.message);
          // Load local user details as a temporary fallback if backend is unreachable
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
              setIsAuthenticated(true);
            } catch (e) {
              handleForceLogout();
            }
          } else {
            handleForceLogout();
          }
        }
      } else {
        handleForceLogout();
      }
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleForceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const login = async (email, password) => {
    // 1. Authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 2. Obtain ID token
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('token', idToken);
    
    // 3. Sync and fetch user profile details from backend MongoDB
    const res = await api.get('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const syncedUser = {
      ...res.data.user,
      emailVerified: firebaseUser.emailVerified
    };
    
    setToken(idToken);
    setUser(syncedUser);
    localStorage.setItem('user', JSON.stringify(syncedUser));
    setIsAuthenticated(true);
    setProfile(res.data.profile);
    if (res.data.profile) {
      localStorage.setItem('profile', JSON.stringify(res.data.profile));
    } else {
      localStorage.removeItem('profile');
    }
    
    return { token: idToken, user: syncedUser };
  };

  const googleLogin = async (googleData) => {
    localStorage.setItem('token', googleData.token);
    setToken(googleData.token);

    // Sync with backend by getting profile (middleware auto-creates user if needed)
    const res = await api.get('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${googleData.token}`
      }
    });
    
    const newUser = res.data.user;
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    setProfile(res.data.profile);
    if (res.data.profile) {
      localStorage.setItem('profile', JSON.stringify(res.data.profile));
    } else {
      localStorage.removeItem('profile');
    }
    
    // Store user data in Firestore for profile completion checks
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Could not store Google login details in Firestore:', firestoreErr.message);
      }
    }
    
    return { token: googleData.token, user: newUser };
  };

  const register = async (firstName, lastName, email, mobile, password) => {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Set user's name in Firebase Auth
    await updateFirebaseProfile(firebaseUser, {
      displayName: `${firstName} ${lastName}`
    });

    // 3. Store additional user info in Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      name: `${firstName} ${lastName}`,
      email: firebaseUser.email,
      createdAt: new Date().toISOString()
    });

    // 4. Send email verification request
    await sendEmailVerification(firebaseUser);

    // 5. Get ID Token
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('token', idToken);

    // 6. Sync register with backend MongoDB
    const res = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      mobile
    }, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    const syncedUser = {
      ...res.data.user,
      emailVerified: firebaseUser.emailVerified
    };

    setToken(idToken);
    setUser(syncedUser);
    localStorage.setItem('user', JSON.stringify(syncedUser));
    setIsAuthenticated(true);
    
    return { token: idToken, user: syncedUser };
  };

  const logout = async () => {
    await signOut(auth);
    handleForceLogout();
  };

  const forgotPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.post('/auth/profile/setup', profileData);
    setProfile(res.data.profile);
    if (res.data.profile) {
      localStorage.setItem('profile', JSON.stringify(res.data.profile));
    } else {
      localStorage.removeItem('profile');
    }
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
    forgotPassword,
    sendVerification,
    updateProfile,
    deleteAccount,
    refreshProfile: async () => {
      if (token) {
        try {
          const profileRes = await api.get('/auth/profile');
          setUser(profileRes.data.user);
          localStorage.setItem('user', JSON.stringify(profileRes.data.user));
          setProfile(profileRes.data.profile);
          if (profileRes.data.profile) {
            localStorage.setItem('profile', JSON.stringify(profileRes.data.profile));
          } else {
            localStorage.removeItem('profile');
          }
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
