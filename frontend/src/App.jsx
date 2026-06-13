import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Stubs imports (we will populate them with high-fidelity UIs)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import EmergencyHelp from './pages/EmergencyHelp';
import MedicalAssistant from './pages/MedicalAssistant';
import HealthAssessment from './pages/HealthAssessment';
import DietPlanner from './pages/DietPlanner';
import MedicineInfo from './pages/MedicineInfo';
import HomeRemedies from './pages/HomeRemedies';
import AdminDashboard from './pages/AdminDashboard';
import HealthcareDirectory from './pages/HealthcareDirectory';
import ProfilePage from './pages/ProfilePage';
import { startNotificationScheduler } from './utils/notificationManager';



const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.role !== 'Admin' && user.role !== 'SuperAdmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Global Layout containing navbar, bottom navigation, drawer, and floating SOS speed dial
const GlobalLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [sosOpen, setSosOpen] = React.useState(false);

  // Reminders status
  const [waterActive, setWaterActive] = React.useState(() => localStorage.getItem('remind_water') === 'true');
  const [dietActive, setDietActive] = React.useState(() => localStorage.getItem('remind_diet') === 'true');
  const [healthActive, setHealthActive] = React.useState(() => localStorage.getItem('remind_health') === 'true');

  // Premium pill-style active class
  const activeClass = (path) =>
    location.pathname === path
      ? 'relative text-primary dark:text-secondary font-bold text-sm px-4 py-2 rounded-full bg-primary/8 dark:bg-secondary/10 transition-all duration-200 nav-link-active'
      : 'relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium text-sm px-4 py-2 rounded-full hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-200';

  const activeMobileClass = (path) =>
    location.pathname === path
      ? 'text-primary dark:text-secondary font-extrabold flex flex-col items-center justify-center text-xs'
      : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-secondary flex flex-col items-center justify-center text-xs transition-colors';

  const toggleReminder = (type, currentVal, setter) => {
    const newVal = !currentVal;
    setter(newVal);
    localStorage.setItem(type, newVal.toString());
    if (newVal && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const NAV_LINKS = [
    { path: '/',                 label: 'Home',         icon: 'home'        },
    { path: '/emergency',        label: 'Emergency',    icon: 'emergency'   },
    { path: '/medical-assistant',label: 'AI Assistant', icon: 'smart_toy'   },
    { path: '/medicine-info',    label: 'Medicines',    icon: 'pill'        },
    { path: '/nearby',           label: 'Nearby',       icon: 'location_on' },
  ];

  const userInitials =
    (user?.firstName ? user.firstName[0].toUpperCase() : '') +
    (user?.lastName  ? user.lastName[0].toUpperCase()  : '');

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 flex flex-col transition-colors duration-350">

      {/* ─── Premium Sticky Navbar ────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-40 transition-all duration-300"
           style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

        {/* Subtle top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/50 dark:via-secondary/40 to-transparent" />

        <div className="flex justify-between items-center h-[68px] px-4 lg:px-10
                        bg-white/75 dark:bg-slate-900/80
                        border-b border-slate-200/60 dark:border-slate-800/70
                        shadow-[0_2px_24px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_24px_-4px_rgba(0,0,0,0.35)]">

          {/* ── Brand ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 dark:bg-secondary/20 blur-sm group-hover:blur-md transition-all" />
              <img src="/logo.jpg" alt="Arogya Raksha"
                className="relative h-10 w-10 rounded-full object-cover ring-2 ring-primary/40 dark:ring-secondary/40
                           shadow-md group-hover:ring-primary dark:group-hover:ring-secondary transition-all duration-300" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-black tracking-tight
                               bg-gradient-to-r from-primary to-primary/70 dark:from-secondary dark:to-secondary/70
                               bg-clip-text text-transparent">
                Arogya Raksha
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase hidden sm:block">
                Health · Safety · Care
              </span>
            </div>
          </div>

          {/* ── Centre Nav Links ───────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50/80 dark:bg-slate-800/50 rounded-full px-2 py-1.5
                          border border-slate-200/60 dark:border-slate-700/40 shadow-inner">
            {NAV_LINKS.map(({ path, label }) => (
              <Link key={path} className={activeClass(path)} to={path}>{label}</Link>
            ))}
          </div>

          {/* ── Right Controls ─────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5">

            {/* Dark mode toggle */}
            <button onClick={toggleDarkMode} title="Toggle Theme"
              className="w-9 h-9 flex items-center justify-center rounded-full
                         text-slate-500 dark:text-slate-400
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                         transition-all duration-200">
              {darkMode
                ? <span className="material-symbols-outlined text-[18px] select-none">light_mode</span>
                : <span className="material-symbols-outlined text-[18px] select-none">dark_mode</span>}
            </button>

            {/* ── User area ─────────────────────────────────────────── */}
            {user ? (
              <div className="relative hidden lg:flex items-center">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 cursor-pointer pl-1 pr-3 py-1 rounded-full
                             hover:bg-slate-100 dark:hover:bg-slate-800
                             border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                             transition-all duration-200 select-none">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30 dark:ring-secondary/30 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm
                                    bg-gradient-to-br from-primary to-primary/70 dark:from-secondary dark:to-secondary/70">
                      {userInitials}
                    </div>
                  )}
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.firstName}</span>
                    <span className="text-[9px] text-slate-400">Member</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-slate-400"
                        style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    keyboard_arrow_down
                  </span>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-64
                                 bg-white dark:bg-slate-900
                                 border border-slate-200/80 dark:border-slate-700/60
                                 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60
                                 overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-transparent dark:from-secondary/5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.firstName}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white
                                            bg-gradient-to-br from-primary to-primary/70 dark:from-secondary dark:to-secondary/70">
                              {userInitials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      {/* Links */}
                      <div className="p-2">
                        {[
                          { icon: 'dashboard', label: 'Dashboard',    path: '/dashboard'    },
                          { icon: 'person',    label: 'View Profile', path: '/profile'       },
                          { icon: 'settings',  label: 'Profile Setup', path: '/profile-setup' },
                        ].map(({ icon, label, path }) => (
                          <button key={path}
                            onClick={() => { setDropdownOpen(false); navigate(path); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                       text-slate-600 dark:text-slate-300
                                       hover:bg-slate-50 dark:hover:bg-slate-800
                                       hover:text-primary dark:hover:text-secondary
                                       transition-all duration-150">
                            <span className="material-symbols-outlined text-base">{icon}</span>
                            {label}
                          </button>
                        ))}
                        <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                        <button
                          onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
                                     text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150">
                          <span className="material-symbols-outlined text-base">logout</span>
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/login"
                  className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-secondary
                             font-semibold text-sm px-3 py-2 rounded-full
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">Login</Link>
                <Link to="/signup"
                  className="bg-gradient-to-r from-primary to-primary/85 dark:from-secondary dark:to-secondary/85
                             text-white font-bold text-sm px-4 py-2 rounded-full shadow-md
                             hover:shadow-primary/30 hover:scale-105 active:scale-95
                             transition-all duration-200">Sign Up</Link>
              </div>
            )}

            {/* Hamburger / More */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="More Navigation"
              className="w-9 h-9 flex items-center justify-center rounded-full
                         text-slate-500 dark:text-slate-400
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                         transition-all duration-200">
              <span className="material-symbols-outlined text-[20px] select-none">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-out Mobile/Desktop Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs cursor-pointer" 
              onClick={() => setMobileMenuOpen(false)}
            ></motion.div>

            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between text-slate-800 dark:text-slate-100 overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-extrabold text-base text-primary dark:text-secondary">App Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold flex items-center hover:opacity-80 transition-opacity">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Profile card if authenticated */}
                {user && (
                  <div 
                    onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-2xl border border-slate-150/40 dark:border-slate-800/85 transition-all group"
                  >
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.firstName} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/25" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary font-bold flex items-center justify-center text-xs">
                        {(user.firstName ? user.firstName[0].toUpperCase() : '') + (user.lastName ? user.lastName[0].toUpperCase() : '')}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate group-hover:text-primary dark:group-hover:text-secondary transition-colors">{user.firstName} {user.lastName}</h4>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">View Profile Page →</p>
                    </div>
                  </div>
                )}

                {/* Additional navigation features */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">More Features</span>
                  
                  <Link 
                    to="/health-assessment" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs border border-transparent hover:border-slate-150 dark:hover:border-slate-800"
                  >
                    <span className="material-symbols-outlined text-base text-violet-500">analytics</span>
                    Health Assessment
                  </Link>

                  <Link 
                    to="/diet-planner" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs border border-transparent hover:border-slate-150 dark:hover:border-slate-800"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-500">restaurant</span>
                    Diet Planner
                  </Link>

                  <Link 
                    to="/home-remedies" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs border border-transparent hover:border-slate-150 dark:hover:border-slate-800"
                  >
                    <span className="material-symbols-outlined text-base text-orange-500">eco</span>
                    Home Remedies
                  </Link>

                  {user && (
                    <Link 
                      to="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs border border-transparent hover:border-slate-150 dark:hover:border-slate-800"
                    >
                      <span className="material-symbols-outlined text-base text-primary dark:text-secondary">person</span>
                      My Profile
                    </Link>
                  )}
                </div>

                {/* Reminder Settings Toggles */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Reminders</span>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-blue-500">water_drop</span> Water Tracker
                    </span>
                    <input 
                      type="checkbox" 
                      checked={waterActive} 
                      onChange={() => toggleReminder('remind_water', waterActive, setWaterActive)}
                      className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-emerald-500">restaurant</span> Diet Log Checks
                    </span>
                    <input 
                      type="checkbox" 
                      checked={dietActive} 
                      onChange={() => toggleReminder('remind_diet', dietActive, setDietActive)}
                      className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-indigo-500">analytics</span> Weekly Vitals
                    </span>
                    <input 
                      type="checkbox" 
                      checked={healthActive} 
                      onChange={() => toggleReminder('remind_health', healthActive, setHealthActive)}
                      className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* App links */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Information</span>
                  <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>About Arogya</Link>
                  <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</Link>
                  <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>Terms of Service</Link>
                </div>
              </div>

              {/* Logout/Account */}
              <div className="mt-8">
                {user ? (
                  <button 
                    onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}
                    className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-xs uppercase tracking-wider"
                  >
                    Log Out
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="border border-slate-250 py-3 rounded-2xl font-bold text-center text-xs uppercase tracking-wider">Login</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-white py-3 rounded-2xl font-bold text-center text-xs uppercase tracking-wider shadow-sm">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Body - padding bottom added to clear mobile nav */}
      <main className="flex-grow pt-16 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Global Footer - hidden on mobile screens to feel like an App */}
      <footer className="hidden lg:block bg-slate-900 text-slate-300 py-12 px-margin-desktop border-t border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center gap-gutter">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="Arogya Raksha Logo" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <h3 className="text-white font-bold text-lg">Arogya Raksha</h3>
              <p className="text-[10px] opacity-75 mt-0.5">PROTECTING YOUR HEALTH. SECURING YOUR FUTURE.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="mailto:devendrasagar0988@gmail.com" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600"><span className="material-symbols-outlined text-sm text-white">mail</span></a>
            <a href="https://www.linkedin.com/in/ibba-devendra-sagar-22917b353/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#0077b5]"><span className="text-white text-sm">in</span></a>
            <a href="https://github.com/Devendra1306" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-900"><span className="text-white text-sm">git</span></a>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Navigation Bar for Mobile and Tablet viewports */}
      <div className="fixed bottom-0 left-0 w-full z-45 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-xl h-16 grid grid-cols-5 items-center px-2 lg:hidden transition-colors">
        <Link className={activeMobileClass(user ? '/dashboard' : '/')} to={user ? '/dashboard' : '/'}>
          <span className="material-symbols-outlined text-xl mb-0.5">home</span>
          <span>Home</span>
        </Link>
        
        <Link className={activeMobileClass('/emergency')} to="/emergency">
          <span className="material-symbols-outlined text-xl mb-0.5">emergency</span>
          <span>SOS</span>
        </Link>
        
        <Link className={activeMobileClass('/medical-assistant')} to="/medical-assistant">
          <span className="material-symbols-outlined text-xl mb-0.5">smart_toy</span>
          <span>Assistant</span>
        </Link>
        
        <Link className={activeMobileClass('/medicine-info')} to="/medicine-info">
          <span className="material-symbols-outlined text-xl mb-0.5">pill</span>
          <span>Medicines</span>
        </Link>
        
        <Link className={activeMobileClass(user ? '/profile' : '/login')} to={user ? '/profile' : '/login'}>
          <span className="material-symbols-outlined text-xl mb-0.5">person</span>
          <span>Profile</span>
        </Link>
      </div>

      {/* Floating SOS Emergency Speed Dial Widget */}
      <div className="fixed bottom-20 right-6 z-40 lg:bottom-8 lg:right-8 flex flex-col items-center">
        {sosOpen && (
          <div className="flex flex-col gap-2.5 mb-3 animate-scale-up">
            {/* Call 112 */}
            <a 
              href="tel:112"
              className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              title="Call Emergency 112"
            >
              <span className="material-symbols-outlined text-xl text-white">call</span>
            </a>

            {/* Find Nearby Help */}
            <button 
              onClick={() => { setSosOpen(false); navigate('/nearby'); }}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              title="Find Nearby Healthcare"
            >
              <span className="material-symbols-outlined text-xl text-white">local_hospital</span>
            </button>

            {/* First-Aid Instructions */}
            <button 
              onClick={() => { setSosOpen(false); navigate('/emergency'); }}
              className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              title="Emergency First-Aid Guides"
            >
              <span className="material-symbols-outlined text-xl text-white">medical_services</span>
            </button>
          </div>
        )}
        <button 
          onClick={() => setSosOpen(!sosOpen)}
          className={`w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all select-none ${!sosOpen ? 'animate-pulse' : 'bg-slate-700 hover:bg-slate-800'}`}
          title="SOS DIAL"
        >
          {sosOpen ? (
            <span className="material-symbols-outlined text-2xl text-white">close</span>
          ) : (
            <span className="material-symbols-outlined text-2xl text-white">emergency</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173236579751-t2aa0hq2d83eo0939a37qbed74351np5.apps.googleusercontent.com';
  
  // Initialize PWA scheduler alert reminders
  useEffect(() => {
    startNotificationScheduler();
  }, []);

  // Detailed Google OAuth Initialization Logs
  console.log("=== Google OAuth Audit Logs ===");
  console.log("Active Client ID:", clientId);
  console.log("Active Origin:", window.location.origin);
  console.log("OAuth Provider Initialization: SUCCESS (Wrapped in GoogleOAuthProvider)");
  console.log("===============================");

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <GlobalLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/emergency" element={<EmergencyHelp />} />
              <Route path="/medical-assistant" element={<MedicalAssistant />} />
              <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
              <Route path="/diet-planner" element={<ProtectedRoute><DietPlanner /></ProtectedRoute>} />
              <Route path="/medicine-info" element={<MedicineInfo />} />
              <Route path="/home-remedies" element={<HomeRemedies />} />
              <Route path="/nearby" element={<HealthcareDirectory />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </GlobalLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
