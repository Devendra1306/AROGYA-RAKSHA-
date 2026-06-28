import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

import Breadcrumbs from './components/Breadcrumbs';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmergencyHelp = lazy(() => import('./pages/EmergencyHelp'));
const MedicalAssistant = lazy(() => import('./pages/MedicalAssistant'));
const HealthAssessment = lazy(() => import('./pages/HealthAssessment'));
const DietPlanner = lazy(() => import('./pages/DietPlanner'));
const MedicineInfo = lazy(() => import('./pages/MedicineInfo'));
const HomeRemedies = lazy(() => import('./pages/HomeRemedies'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const HealthcareDirectory = lazy(() => import('./pages/HealthcareDirectory'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const License = lazy(() => import('./pages/License'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import { startNotificationScheduler } from './utils/notificationManager';

// ─── Scroll To Top on every route change ─────────────────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};


// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0052CC] dark:border-[#10B981]"></div>
      </div>
    );
  }
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'Admin' && user.role !== 'SuperAdmin') return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── Global Layout ────────────────────────────────────────────────────────────
const GlobalLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen]     = React.useState(false);
  const [sosOpen, setSosOpen]               = React.useState(false);
  const [scrolled, setScrolled]             = React.useState(false);

  // Reminder toggles (for drawer)
  const [waterActive,  setWaterActive]  = React.useState(() => localStorage.getItem('remind_water')  === 'true');
  const [dietActive,   setDietActive]   = React.useState(() => localStorage.getItem('remind_diet')   === 'true');
  const [healthActive, setHealthActive] = React.useState(() => localStorage.getItem('remind_health') === 'true');

  // Scroll-aware navbar shadow
  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (path) => location.pathname === path;

  const activeMobileClass = (path) =>
    isActive(path)
      ? 'text-[#0052CC] dark:text-[#10B981] font-extrabold flex flex-col items-center justify-center text-[10px] gap-0.5'
      : 'text-slate-400 dark:text-slate-500 hover:text-[#0052CC] dark:hover:text-[#10B981] flex flex-col items-center justify-center text-[10px] gap-0.5 transition-colors';

  const toggleReminder = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val.toString());
    if (val && 'Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
  };

  const NAV_LINKS = [
    { path: '/',                  label: 'Home',         icon: 'home'        },
    { path: '/emergency',         label: 'Emergency',    icon: 'emergency'   },
    { path: '/medical-assistant', label: 'AI Assistant', icon: 'smart_toy'   },
    { path: '/medicine-info',     label: 'Medicines',    icon: 'pill'        },
    { path: '/nearby',            label: 'Nearby',       icon: 'location_on' },
  ];

  const DRAWER_LINKS = [
    { path: '/dashboard',        label: 'Dashboard',        icon: 'dashboard'       },
    { path: '/emergency',        label: 'Emergency Help',   icon: 'emergency'       },
    { path: '/medical-assistant',label: 'AI Assistant',     icon: 'smart_toy'       },
    { path: '/medicine-info',    label: 'Medicines',        icon: 'pill'            },
    { path: '/home-remedies',    label: 'Home Remedies',    icon: 'eco'             },
    { path: '/diet-planner',     label: 'Diet Planner',     icon: 'nutrition'       },
    { path: '/health-assessment',label: 'Health Assessment',icon: 'monitor_heart'   },
    { path: '/nearby',           label: 'Nearby Healthcare',icon: 'location_on'     },
    { path: '/profile',          label: 'My Profile',       icon: 'manage_accounts' },
  ];

  const userInitials =
    (user?.firstName ? user.firstName[0].toUpperCase() : '') +
    (user?.lastName  ? user.lastName[0].toUpperCase()  : '');

  // ── Close dropdown on route change
  React.useEffect(() => { setDropdownOpen(false); setMobileMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 flex flex-col transition-colors duration-300">

      {/* ════════════════════════════════════════════════════════════════════
          PREMIUM NAVBAR
          ════════════════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_8px_32px_-4px_rgba(0,82,204,0.13)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.55)]' : ''
        }`}
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* Top tri-colour accent */}
        <div className="h-[3px] bg-gradient-to-r from-[#0052CC] via-[#10B981] to-[#6366F1]" />

        <div className={`flex items-center justify-between h-16 px-4 lg:px-8 xl:px-14 transition-all duration-300 ${
          scrolled
            ? 'bg-white/92 dark:bg-slate-900/96 border-b border-slate-200 dark:border-slate-800'
            : 'bg-white/72 dark:bg-slate-900/78 border-b border-slate-200/40 dark:border-slate-800/40'
        }`}>

          {/* ── BRAND ─────────────────────────────────────────────────────── */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group focus:outline-none shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0052CC]/30 to-[#10B981]/20 blur-md scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-[#0052CC]/25 dark:ring-[#10B981]/25 shadow-md group-hover:ring-[#0052CC]/60 dark:group-hover:ring-[#10B981]/50 transition-all duration-300">
                <img src="/logo.jpg" alt="Arogya Raksha" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-left leading-none">
              <span className="block text-[15px] font-black tracking-tight bg-gradient-to-r from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#34d399] bg-clip-text text-transparent">
                Arogya Raksha
              </span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">
                Health · Safety · Care
              </span>
            </div>
          </button>

          {/* ── PILL NAV (desktop) ─────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl px-1.5 py-1.5 gap-1 border border-slate-200/50 dark:border-slate-700/40 shadow-sm relative">
            {NAV_LINKS.map(({ path, label, icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-300 select-none z-10 ${
                    active
                      ? 'text-[#0052CC] dark:text-[#10B981]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-md shadow-slate-200/60 dark:shadow-slate-900/60 z-[-1]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span
                    className={`material-symbols-outlined text-[15px] transition-colors duration-300 ${active ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`}
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {icon}
                  </span>
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT CONTROLS ────────────────────────────────────────────── */}
          <div className="flex items-center gap-1">

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Light mode' : 'Dark mode'}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0052CC] dark:hover:text-[#10B981] transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* ── LOGGED-IN USER ──── */}
            {user ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all duration-200 ${
                    dropdownOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.firstName} className="w-7 h-7 rounded-lg object-cover ring-2 ring-[#0052CC]/20 dark:ring-[#10B981]/25" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white bg-gradient-to-br from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#059669] shadow-sm">
                      {userInitials}
                    </div>
                  )}
                  <div className="text-left leading-none">
                    <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{user.firstName}</p>
                    <p className="text-[9px] text-slate-400">Member</p>
                  </div>
                  <span
                    className="material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200"
                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >keyboard_arrow_down</span>
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: 272 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-50 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/50 shadow-2xl shadow-slate-300/30 dark:shadow-slate-950/70"
                      >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-br from-[#0052CC]/8 to-[#10B981]/4 dark:from-[#0052CC]/15 dark:to-[#10B981]/8 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt={user.firstName} className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#0052CC]/20 shadow" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white bg-gradient-to-br from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#059669] shadow-md">
                                {userInitials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[13px] text-slate-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                              <span className="inline-flex items-center gap-1 mt-1 bg-[#0052CC]/10 dark:bg-[#10B981]/15 text-[#0052CC] dark:text-[#10B981] text-[8.5px] font-bold px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                Active Member
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-1.5 space-y-0.5">
                          {[
                            { icon: 'dashboard',      label: 'Dashboard',    sub: 'Your health overview',  path: '/dashboard'    },
                            { icon: 'manage_accounts',label: 'My Profile',   sub: 'View & edit account',   path: '/profile'      },
                            { icon: 'settings',       label: 'Profile Setup',sub: 'Update health info',    path: '/profile-setup'},
                          ].map(({ icon, label, sub, path }) => (
                            <button key={path} onClick={() => { setDropdownOpen(false); navigate(path); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group/item hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover/item:bg-[#0052CC]/10 dark:group-hover/item:bg-[#10B981]/15 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined text-[15px] text-slate-500 dark:text-slate-400 group-hover/item:text-[#0052CC] dark:group-hover/item:text-[#10B981] transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover/item:text-[#0052CC] dark:group-hover/item:text-[#10B981] transition-colors">{label}</p>
                                <p className="text-[9px] text-slate-400 truncate">{sub}</p>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="p-1.5 pt-0 mx-1.5 mb-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 group/logout mt-1">
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[15px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                            </div>
                            <div className="text-left">
                              <p className="text-[12px] font-bold text-red-500">Log Out</p>
                              <p className="text-[9px] text-red-400/70">Sign out of your account</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0052CC] dark:hover:text-[#10B981] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200">
                  Log In
                </Link>
                <Link to="/signup" className="px-4 py-2 text-[13px] font-bold text-white bg-gradient-to-r from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#059669] rounded-xl shadow-md hover:shadow-lg hover:shadow-[#0052CC]/25 dark:hover:shadow-[#10B981]/25 hover:scale-[1.03] active:scale-95 transition-all duration-200">
                  Get Started
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className={`w-9 h-9 ml-0.5 rounded-xl flex items-center justify-center transition-all duration-200 ${
                mobileMenuOpen
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? 'close' : 'menu'}
                  initial={{ rotate: -80, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0,   opacity: 1, scale: 1   }}
                  exit={{    rotate:  80, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {mobileMenuOpen ? 'close' : 'menu'}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Slide-out Mobile/Desktop Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-[#0052CC]/20 dark:ring-[#10B981]/20">
                    <img src="/logo.jpg" alt="Arogya Raksha" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-black text-[14px] bg-gradient-to-r from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#34d399] bg-clip-text text-transparent">Arogya Raksha</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">close</span>
                </button>
              </div>

              {/* User card in drawer */}
              {user && (
                <div
                  onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                  className="mx-3 mt-4 p-3 bg-gradient-to-br from-[#0052CC]/8 to-[#10B981]/5 dark:from-[#0052CC]/15 dark:to-[#10B981]/10 rounded-2xl border border-[#0052CC]/10 dark:border-[#10B981]/15 cursor-pointer hover:border-[#0052CC]/25 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#0052CC]/20" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm bg-gradient-to-br from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#059669] shadow">
                        {userInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[13px] text-slate-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-300 ml-auto shrink-0">chevron_right</span>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="flex-1 p-3 pt-3 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 px-3 py-2">Navigation</p>
                {DRAWER_LINKS.map(({ path, label, icon }) => {
                  const active = isActive(path);
                  return (
                    <button
                      key={path}
                      onClick={() => { setMobileMenuOpen(false); navigate(path); }}
                      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 text-left overflow-hidden group ${
                        active
                          ? 'text-[#0052CC] dark:text-[#10B981]'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {/* Active Background Glow */}
                      {active && (
                        <motion.div
                          layoutId="drawerActiveBg"
                          className="absolute inset-0 bg-[#0052CC]/10 dark:bg-[#10B981]/15 rounded-xl border border-[#0052CC]/20 dark:border-[#10B981]/20"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {/* Hover Indicator */}
                      {!active && (
                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}

                      <span className={`material-symbols-outlined text-[20px] relative z-10 transition-colors duration-300 ${active ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400 group-hover:text-[#0052CC] dark:group-hover:text-[#10B981]'}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                      <span className="relative z-10">{label}</span>
                      {active && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0052CC] dark:bg-[#10B981] relative z-10 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reminders section */}
              <div className="mx-3 mb-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-3">Health Reminders</p>
                {[
                  { label: 'Water Tracker',    icon: 'water_drop',  val: waterActive,  key: 'remind_water',  setter: setWaterActive,  color: 'text-blue-500'   },
                  { label: 'Diet Log Check',   icon: 'restaurant',  val: dietActive,   key: 'remind_diet',   setter: setDietActive,   color: 'text-emerald-500'},
                  { label: 'Health Check-in',  icon: 'analytics',   val: healthActive, key: 'remind_health', setter: setHealthActive, color: 'text-violet-500' },
                ].map(({ label, icon, val, key, setter, color }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={val} onChange={e => toggleReminder(key, e.target.checked, setter)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-[#0052CC] dark:peer-checked:bg-[#10B981]
                          after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Drawer footer */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-1.5">
                {!user ? (
                  <>
                    <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      className="w-full py-2.5 text-[13px] font-semibold text-[#0052CC] dark:text-[#10B981] border border-[#0052CC]/25 dark:border-[#10B981]/25 hover:bg-[#0052CC]/5 dark:hover:bg-[#10B981]/10 rounded-xl transition-all">
                      Log In
                    </button>
                    <button onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                      className="w-full py-2.5 text-[13px] font-bold text-white bg-gradient-to-r from-[#0052CC] to-[#1a6fe8] dark:from-[#10B981] dark:to-[#059669] rounded-xl shadow-md transition-all">
                      Get Started
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[13px] transition-all">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                    Log Out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-grow pt-[67px] pb-28 lg:pb-0">
        <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop">
          <Breadcrumbs />
        </div>
        {children}
      </main>


      {/* ── Bottom Mobile Nav ────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/80 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { path: '/',                  label: 'Home',      icon: 'home'       },
            { path: '/medical-assistant', label: 'AI',        icon: 'smart_toy'  },
            { path: '/medicine-info',     label: 'Medicines', icon: 'pill'       },
            { path: '/nearby',            label: 'Nearby',    icon: 'location_on'},
            { path: '/profile',           label: 'Profile',   icon: 'person'     },
          ].map(({ path, label, icon }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path} className={activeMobileClass(path)}>
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${active ? 'scale-110' : ''}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Emergency SOS FAB ──────────────────────────────────────────────── */}
      <motion.div 
        drag
        dragConstraints={{ left: -window.innerWidth + 100, right: 100, top: -window.innerHeight + 100, bottom: 0 }}
        dragElastic={0.1}
        className="fixed bottom-32 right-4 lg:bottom-36 lg:left-12 z-40 flex flex-col items-end lg:items-start pointer-events-none"
      >
        <div className="pointer-events-auto flex flex-col items-end lg:items-start">
        <AnimatePresence>
          {sosOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className={`mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 min-w-[180px] origin-bottom ${sosOpen ? 'cursor-default' : 'cursor-grab'}`}
            >
              {[
                { label: 'Call Ambulance',     icon: 'ambulance',   href: 'tel:108',     color: 'text-red-600 bg-red-50 dark:bg-red-950/30'     },
                { label: 'Call Police',        icon: 'local_police',href: 'tel:100',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'   },
                { label: 'Emergency Guide',    icon: 'emergency',   href: '/emergency',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
              ].map(({ label, icon, href, color }) => (
                <a key={label} href={href}
                  onClick={() => setSosOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[12px] transition-all hover:opacity-80 ${color}`}>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  {label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setSosOpen(v => !v)}
          whileTap={{ scale: 0.93 }}
          className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center font-black text-white text-[13px] tracking-wider transition-all duration-300 cursor-pointer ${
            sosOpen
              ? 'bg-slate-700 dark:bg-slate-800 shadow-slate-400/30 ring-4 ring-slate-500/30'
              : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 ring-4 ring-red-500/20'
          }`}
          title="Emergency SOS (Drag to move)"
        >
          {sosOpen ? (
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
          ) : (
            <span className="text-[11px] font-black tracking-widest">SOS</span>
          )}
        </motion.button>
        </div>
      </motion.div>

      {/* ── Global Footer (desktop & mobile) ──────────────────────────────────── */}
      {location.pathname === '/' && (
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-24 lg:pb-12 px-6 lg:px-14 border-t border-slate-800 relative z-50 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#10B981]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1280px] mx-auto relative z-10 grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-12">
          
          {/* Brand & Newsletter */}
          <div className="col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-[#0052CC]/40">
                <img src="/logo.jpg" alt="Arogya Raksha" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-white text-[16px]">Arogya Raksha</p>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase">Health · Safety · Care</p>
              </div>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed max-w-sm">
              The intelligent healthcare platform designed to empower your well-being. AI-driven insights, emergency support, and comprehensive medical knowledge.
            </p>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Subscribe to Newsletter</p>
              <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700/50 max-w-sm focus-within:border-[#10B981]/50 focus-within:ring-2 focus-within:ring-[#10B981]/20 transition-all">
                <input type="email" placeholder="Enter your email" className="bg-transparent border-none focus:outline-none text-[12px] px-3 w-full text-white placeholder:text-slate-500" />
                <button className="bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-[11px] px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-[#10B981]/20 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Links 1: Platform */}
          <div className="col-span-1 flex flex-col gap-3">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3 text-[#0052CC] dark:text-[#10B981]">Platform</h4>
            <Link to="/medical-assistant" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">AI Assistant</Link>
            <Link to="/dashboard" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Dashboard</Link>
            <Link to="/health-assessment" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Health Assessment</Link>
            <Link to="/diet-planner" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Diet Planner</Link>
            <Link to="/emergency" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Emergency Center</Link>
            <Link to="/nearby" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Nearby Hospitals</Link>
          </div>

          {/* Links 2: Resources */}
          <div className="col-span-1 flex flex-col gap-3">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3 text-[#0052CC] dark:text-[#10B981]">Resources</h4>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Blog</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Developers & API</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">System Status</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">OpenFDA Data</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Medical Schema</a>
          </div>

          {/* Links 3: Company */}
          <div className="col-span-1 flex flex-col gap-3">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3 text-[#0052CC] dark:text-[#10B981]">Company</h4>
            <a href="https://denami.vercel.app/" target="_blank" rel="noreferrer" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">About Us</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Careers</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Press</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Contact</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Support</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Links 4: Legal */}
          <div className="col-span-1 flex flex-col gap-3">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3 text-[#0052CC] dark:text-[#10B981]">Legal</h4>
            <Link to="/policy" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            <Link to="/license" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">License</Link>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Cookies</a>
            <a href="#" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1280px] mx-auto relative z-10 mt-16 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[12px] text-slate-500 font-medium text-center md:text-left">
            © {new Date().getFullYear()} Arogya Raksha. All rights reserved.<br className="md:hidden" />
            <span className="hidden md:inline"> · </span>Not a substitute for professional medical advice.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com/Devendra1306" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#10B981] hover:text-white transition-all hover:scale-110">
              <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" className="w-5 h-5 invert" />
            </a>
            <a href="https://www.linkedin.com/in/ibba-devendra-sagar-22917b353/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#0052CC] hover:text-white transition-all hover:scale-110">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" className="w-4 h-4" />
            </a>
            <a href="mailto:devendrasagar0988@gmail.com" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all hover:scale-110">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </a>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
function AppWithRouter() {
  const { isAuthenticated, loading, user } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated && user) startNotificationScheduler(user);
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-[#0052CC]/20 shadow-xl animate-pulse">
            <img src="/logo.jpg" alt="Arogya Raksha" className="w-full h-full object-cover" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0052CC] dark:border-[#10B981]"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <GlobalLayout>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            <Route path="/"                  element={<LandingPage />} />
            <Route path="/login"             element={<LoginPage />} />
            <Route path="/signup"            element={<SignupPage />} />
            <Route path="/forgot-password"   element={<ForgotPasswordPage />} />
            <Route path="/reset-password"    element={<ResetPasswordPage />} />
            <Route path="/policy"            element={<PrivacyPolicy />} />
            <Route path="/license"           element={<License />} />
            <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile-setup"     element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/emergency"         element={<EmergencyHelp />} />
            <Route path="/medical-assistant" element={<ProtectedRoute><MedicalAssistant /></ProtectedRoute>} />
            <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
            <Route path="/diet-planner"      element={<ProtectedRoute><DietPlanner /></ProtectedRoute>} />
            <Route path="/medicine-info"     element={<MedicineInfo />} />
            <Route path="/home-remedies"     element={<HomeRemedies />} />
            <Route path="/nearby"            element={<HealthcareDirectory />} />
            <Route path="/admin"             element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*"                  element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </GlobalLayout>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWithRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
