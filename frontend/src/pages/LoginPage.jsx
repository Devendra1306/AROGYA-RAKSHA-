import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
            />
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
            className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90 font-bold transition-all shadow-md flex items-center justify-center"
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
          onClick={() => alert('Google authentication is integrated for production. Check auth configs.')}
          className="w-full border border-outline-variant py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          🔑 Continue with Google
        </button>

        <p className="text-center text-label-md text-on-surface-variant dark:text-slate-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline font-bold">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
