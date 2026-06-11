import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsGoogleAccount(false);
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage('A password reset link has been sent to your email address.');
      setEmail('');
    } catch (err) {
      let errMsg = err.message || 'Failed to request password reset link. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            errMsg = 'Invalid email address format.';
            break;
          case 'auth/user-not-found':
            errMsg = 'No registered user was found with this email address.';
            break;
          case 'auth/network-request-failed':
            errMsg = 'Network error. Please check your internet connection.';
            break;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface dark:bg-slate-900 p-margin-mobile">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 dark:border-slate-700 shadow-xl transition-all">
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary dark:text-secondary">Forgot Password</h2>
          <p className="text-on-surface-variant dark:text-slate-300 mt-2">
            Enter your registered email address and we will send you a password reset link.
          </p>
        </div>

        {/* Success Alert */}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-label-md border border-emerald-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-lg">mail</span>
            <div>
              <p className="font-semibold">Reset Link Sent</p>
              <p className="text-xs mt-0.5">{message}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-xl text-label-md border border-red-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-650 text-lg">warning</span>
            <div>
              <p className="font-semibold">Reset Request Failed</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Google Managed Account Alert */}
        {isGoogleAccount && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 rounded-xl text-label-md border border-blue-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-lg">key</span>
            <div>
              <p className="font-semibold">Google Account Detected</p>
              <p className="text-xs mt-1 leading-relaxed">
                This account is managed through Google Sign-In. Please use your Google account to access Arogya Raksha.
              </p>
              <Link to="/login" className="inline-block mt-3 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {!isGoogleAccount && (
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90 font-bold transition-all shadow-md flex items-center justify-center text-sm"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-primary hover:underline font-bold text-label-md">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
