import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import SEO from '../components/SEO';

export default function LoginPage() {
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

  useEffect(() => {
    // GSAP slow animation for background ambient glow circles
    gsap.to(".ambient-circle-1", {
      x: "random(-80, 80)",
      y: "random(-80, 80)",
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    gsap.to(".ambient-circle-2", {
      x: "random(-80, 80)",
      y: "random(-80, 80)",
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, []);

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
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = result.user;
      const idToken = await userObj.getIdToken();
      
      const data = await googleLogin({
        token: idToken,
        email: userObj.email,
        firstName: userObj.displayName?.split(' ')[0] || 'GoogleUser',
        lastName: userObj.displayName?.split(' ').slice(1).join(' ') || 'Account'
      });
      if (data.user.profileCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/profile-setup');
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google login popup was closed before completion.');
      } else {
        setError(err.response?.data?.error || err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-margin-mobile relative overflow-hidden">
      <SEO 
        title="Login | Arogya Raksha"
        description="Login to your Arogya Raksha account to access your personal health dashboard, medical records, and AI healthcare tools."
        keywords="login, sign in, Arogya Raksha login, health account, patient portal"
        canonical="https://arogyarakshaa.vercel.app/login"
      />
      
      {/* Ambient background glow elements */}
      <div className="ambient-circle-1 absolute top-[20%] left-[25%] w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="ambient-circle-2 absolute bottom-[25%] right-[25%] w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md glass-card rounded-3xl p-8 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 shadow-2xl relative z-10 backdrop-blur-xl"
      >
        <motion.div variants={itemVariants} className="text-center mb-7">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">Log in to sync your clinical health metrics and assistant.</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-xs font-semibold border border-red-200/50"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5 pl-0.5">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm dark:text-white"
              placeholder="name@example.com"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5 pl-0.5">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 pr-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-between text-xs py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="rounded text-primary focus:ring-0 w-4 h-4 border-slate-200" />
              <span className="text-slate-500 dark:text-slate-400">Remember Me</span>
            </label>
            <Link to="/forgot-password" className="text-primary dark:text-secondary hover:underline font-bold">Forgot Password?</Link>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800"></div>
        </motion.div>

        <motion.button 
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-slate-200 dark:border-slate-850 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 disabled:opacity-50"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </motion.button>

        <motion.p variants={itemVariants} className="text-center text-xs text-slate-500 dark:text-slate-450 mt-6 font-semibold">
          Don't have an account? <Link to="/signup" className="text-primary dark:text-secondary hover:underline font-extrabold">Sign Up</Link>
        </motion.p>
      </motion.div>

    </div>
  );
}
