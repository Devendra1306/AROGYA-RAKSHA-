import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  // Firebase Auth configuration is handled in firebase.js config
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // No Google authentication fallback states needed with production Firebase

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      let msg = err.message || 'An error occurred during login.';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            msg = 'Invalid email address format.';
            break;
          case 'auth/user-disabled':
            msg = 'This account has been disabled.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            msg = 'Invalid email or password.';
            break;
          case 'auth/network-request-failed':
            msg = 'Network error. Please check your internet connection.';
            break;
        }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Starting Firebase Google Auth Popup...");
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = result.user;
      const idToken = await userObj.getIdToken();
      
      console.log("Firebase Google Auth success! Sending ID token to backend...");
      const data = await googleLogin({
        token: idToken,
        email: userObj.email,
        firstName: userObj.displayName?.split(' ')[0] || 'GoogleUser',
        lastName: userObj.displayName?.split(' ').slice(1).join(' ') || 'Account'
      });
      console.log("Authentication SUCCESS!", data.user);
      if (data.user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      console.error("Firebase Google Auth error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google login popup was closed before completion.');
      } else {
        setError(err.response?.data?.error || err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface dark:bg-slate-900 p-margin-mobile">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 dark:border-slate-700 shadow-xl transition-all">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary dark:text-secondary">Welcome Back</h2>
          <p className="text-on-surface-variant dark:text-slate-300 mt-2">Log in to manage your health insights and assistant.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-label-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-md font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-label-md font-medium mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-label-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-0" />
              <span>Remember Me</span>
            </label>
            <Link to="/forgot-password" className="text-primary hover:underline font-bold">Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90 font-bold transition-all shadow-md flex items-center justify-center text-sm"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-outline-variant/30"></div>
          <span className="flex-shrink mx-4 text-outline text-label-sm">or</span>
          <div className="flex-grow border-t border-outline-variant/30"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-outline-variant py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-label-md text-on-surface-variant dark:text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline font-bold">Sign Up</Link>
        </p>
      </div>


    </div>
  );
}
