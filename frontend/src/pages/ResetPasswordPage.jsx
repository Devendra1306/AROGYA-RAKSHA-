import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Password rules validation states
  const [rules, setRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    // Dynamic rule validation as password changes
    setRules({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      return setError('Please make sure your password meets all requirements.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, token, password);

      setSuccess('Password updated successfully!');
      
      // Start countdown redirect
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          navigate('/login');
        }
      }, 1000);

    } catch (err) {
      let errMsg = err.message || 'Failed to update password. Try again.';
      if (err.code === 'auth/invalid-action-code') {
        errMsg = 'The password reset link is invalid or has expired.';
      } else if (err.code === 'auth/expired-action-code') {
        errMsg = 'The password reset link has expired.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'The password is too weak.';
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
          <h2 className="text-3xl font-bold text-primary dark:text-secondary">Reset Password</h2>
          <p className="text-on-surface-variant dark:text-slate-300 mt-2">
            Create a secure new password for your account.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-label-md border border-emerald-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-lg">task_alt</span>
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-xs mt-0.5">{success}</p>
              <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                Redirecting to Login page in {countdown} seconds...
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-xl text-label-md border border-red-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-650 text-lg">warning</span>
            <div>
              <p className="font-semibold">Reset Failed</p>
              <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
              {error.includes('expired') && (
                <Link to="/forgot-password" className="inline-block mt-3 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-95 transition-all">
                  Request New Reset Link
                </Link>
              )}
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md font-medium mb-1">New Password</label>
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
                >
                  {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label-md font-medium mb-1">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                >
                  {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Dynamic password validation checklist */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-outline-variant/30 text-xs space-y-2">
              <p className="font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-[10px]">Password Strength Rules</p>
              
              <div className="flex items-center gap-2">
                {rules.length ? <FaCheck className="text-emerald-500 w-3.5 h-3.5" /> : <FaTimes className="text-slate-300 dark:text-slate-600 w-3.5 h-3.5" />}
                <span className={rules.length ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}>At least 8 characters long</span>
              </div>

              <div className="flex items-center gap-2">
                {rules.uppercase ? <FaCheck className="text-emerald-500 w-3.5 h-3.5" /> : <FaTimes className="text-slate-300 dark:text-slate-600 w-3.5 h-3.5" />}
                <span className={rules.uppercase ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}>Contains an uppercase letter (A-Z)</span>
              </div>

              <div className="flex items-center gap-2">
                {rules.lowercase ? <FaCheck className="text-emerald-500 w-3.5 h-3.5" /> : <FaTimes className="text-slate-300 dark:text-slate-600 w-3.5 h-3.5" />}
                <span className={rules.lowercase ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}>Contains a lowercase letter (a-z)</span>
              </div>

              <div className="flex items-center gap-2">
                {rules.number ? <FaCheck className="text-emerald-500 w-3.5 h-3.5" /> : <FaTimes className="text-slate-300 dark:text-slate-600 w-3.5 h-3.5" />}
                <span className={rules.number ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"}>Contains at least one number (0-9)</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !isPasswordValid || password !== confirmPassword}
              className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90 font-bold transition-all shadow-md flex items-center justify-center text-sm disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
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
