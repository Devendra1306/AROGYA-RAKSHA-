import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173236579751-t2aa0hq2d83eo0939a37qbed74351np5.apps.googleusercontent.com';
  const hasRealClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'mock';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Google authentication fallback states
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

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
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    // Fallback handler for simulated authentication when no client ID is set
    setShowGoogleChooser(true);
  };

  const handleSimulatedGoogleLogin = async (simulatedEmail, firstName, lastName) => {
    setShowGoogleChooser(false);
    setError('');
    setLoading(true);
    try {
      const data = await googleLogin({
        token: 'simulated_oauth_token',
        email: simulatedEmail,
        firstName,
        lastName
      });
      if (data.user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed.');
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
            <span className="text-primary hover:underline cursor-pointer">Forgot Password?</span>
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

        {hasRealClientId ? (
          <div className="w-full flex justify-center min-h-[44px]">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setLoading(true);
                setError('');
                try {
                  const jwtToken = credentialResponse.credential;
                  // Decode token payload
                  const payload = JSON.parse(atob(jwtToken.split('.')[1]));
                  console.log("Google OAuth flow success! Sending token to backend for verification...", payload);
                  const data = await googleLogin({
                    token: jwtToken,
                    email: payload.email,
                    firstName: payload.given_name,
                    lastName: payload.family_name
                  });
                  console.log("Google Authentication SUCCESS! Profile details:", data.user);
                  if (data.user.profileCompleted) {
                    navigate('/dashboard');
                  } else {
                    navigate('/profile-setup');
                  }
                } catch (err) {
                  const errMsg = err.response?.data?.error || err.message || 'Google login failed.';
                  console.error("Google Authentication FAILED on backend verify:", errMsg);
                  setError(errMsg);
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                console.error("Google Authentication FAILED: OAuth popup flow cancelled or origin not registered.");
                setError('Google authentication cancelled or failed.');
              }}
              theme="outline"
              shape="pill"
              size="large"
              width="382"
            />
          </div>
        ) : (
          <button 
            onClick={handleGoogleClick}
            className="w-full border border-outline-variant py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm text-slate-800 dark:text-slate-200"
          >
            🔑 Continue with Google
          </button>
        )}

        <p className="text-center text-label-md text-on-surface-variant dark:text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline font-bold">Sign Up</Link>
        </p>
      </div>

      {/* Simulated Google Account Chooser Dialog */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            
            {/* Google Header */}
            <div className="flex flex-col items-center space-y-2 pb-3 border-b border-slate-100">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="font-bold text-lg text-slate-800">Sign in with Google</h3>
              <p className="text-xs text-slate-500 text-center">Select an account to log in to Arogya Raksha</p>
            </div>

            {/* Account List */}
            <div className="space-y-2">
              <button 
                onClick={() => handleSimulatedGoogleLogin('devendrasagar0988@gmail.com', 'Devendra', 'Sagar')}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  DS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Devendra Sagar</h4>
                  <p className="text-xs text-slate-500">devendrasagar0988@gmail.com</p>
                </div>
              </button>

              <button 
                onClick={() => handleSimulatedGoogleLogin('arogyaraksha.demo@gmail.com', 'Guest', 'User')}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm">
                  GU
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Guest User</h4>
                  <p className="text-xs text-slate-500">arogyaraksha.demo@gmail.com</p>
                </div>
              </button>
            </div>

            {/* Custom Input */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Or enter a custom email</span>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="name@gmail.com" 
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="flex-grow p-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white"
                />
                <button 
                  onClick={() => {
                    if (customGoogleEmail.trim()) {
                      const name = customGoogleEmail.split('@')[0];
                      handleSimulatedGoogleLogin(customGoogleEmail.trim(), name, 'GoogleAccount');
                    }
                  }}
                  disabled={!customGoogleEmail.includes('@')}
                  className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowGoogleChooser(false)}
              className="w-full text-center text-xs text-slate-500 hover:underline pt-2"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
