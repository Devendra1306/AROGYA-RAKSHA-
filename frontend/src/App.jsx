import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

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

  const activeClass = (path) => 
    location.pathname === path 
      ? "text-primary dark:text-secondary font-bold border-b-2 border-primary dark:border-secondary pb-1" 
      : "text-on-surface-variant hover:text-primary dark:text-slate-300 dark:hover:text-secondary transition-colors";

  const activeMobileClass = (path) => 
    location.pathname === path 
      ? "text-primary dark:text-secondary font-extrabold flex flex-col items-center justify-center text-xs" 
      : "text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-secondary flex flex-col items-center justify-center text-xs transition-colors";

  const toggleReminder = (type, currentVal, setter) => {
    const newVal = !currentVal;
    setter(newVal);
    localStorage.setItem(type, newVal.toString());
    if (newVal && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 flex flex-col">
      {/* Sticky Top Navbar */}
      <nav className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-margin-mobile lg:px-margin-desktop h-16 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="Arogya Raksha Logo" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary dark:ring-secondary" />
          <span className="text-lg font-extrabold text-primary dark:text-secondary tracking-wide">Arogya Raksha</span>
        </div>

        {/* Center Nav Links - hidden on mobile/tablet */}
        <div className="hidden lg:flex items-center gap-gutter">
          <Link className={activeClass('/')} to="/">Home</Link>
          <Link className={activeClass('/emergency')} to="/emergency">Emergency</Link>
          <Link className={activeClass('/medical-assistant')} to="/medical-assistant">AI Assistant</Link>
          <Link className={activeClass('/health-assessment')} to="/health-assessment">Assessment</Link>
          <Link className={activeClass('/diet-planner')} to="/diet-planner">Diet Planner</Link>
          <Link className={activeClass('/medicine-info')} to="/medicine-info">Medicines</Link>
          <Link className={activeClass('/home-remedies')} to="/home-remedies">Remedies</Link>
          <Link className={activeClass('/nearby')} to="/nearby">Nearby</Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-on-surface-variant dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            title="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="relative hidden lg:flex items-center">
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-all select-none"
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.firstName} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/25" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary dark:bg-secondary/15 dark:text-secondary font-bold flex items-center justify-center text-xs">
                    {(user.firstName ? user.firstName[0].toUpperCase() : '') + (user.lastName ? user.lastName[0].toUpperCase() : '')}
                  </div>
                )}
                <span className="text-label-md font-semibold ml-1">{user.firstName}</span>
                <span className="text-[9px] text-slate-400 ml-0.5">▼</span>
              </div>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 top-11 z-50 w-60 glass-card rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl animate-scale-up">
                    <div className="pb-2.5 border-b border-slate-100 dark:border-slate-700 mb-2">
                      <h4 className="font-bold text-sm">{user.firstName} {user.lastName}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <button onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2">📊 Dashboard</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2">👤 View Profile</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/profile-setup'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2">⚙️ Profile Setup</button>
                      <button onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-2 pt-2">🚪 Logout</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors text-label-md px-2">Login</Link>
              <Link to="/signup" className="bg-primary text-white hover:opacity-90 px-4 py-2 rounded-xl text-label-md font-bold transition-all shadow-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-2xl text-on-surface-variant dark:text-slate-300"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Slide-out Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-all" 
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl p-6 flex flex-col justify-between animate-slide-in text-slate-800 dark:text-slate-100">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                <span className="font-extrabold text-base text-primary dark:text-secondary">App Options</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold">✕</button>
              </div>

              {/* Reminder Settings Toggles */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Reminders</span>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">💧 Water Tracker</span>
                  <input 
                    type="checkbox" 
                    checked={waterActive} 
                    onChange={() => toggleReminder('remind_water', waterActive, setWaterActive)}
                    className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">🥗 Diet Log Checks</span>
                  <input 
                    type="checkbox" 
                    checked={dietActive} 
                    onChange={() => toggleReminder('remind_diet', dietActive, setDietActive)}
                    className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">📊 Weekly Vitals</span>
                  <input 
                    type="checkbox" 
                    checked={healthActive} 
                    onChange={() => toggleReminder('remind_health', healthActive, setHealthActive)}
                    className="w-8 h-4 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all outline-none"
                  />
                </div>
              </div>

              {/* App links */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Information</span>
                <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>ℹ️ About Arogya</Link>
                <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>🔒 Privacy Policy</Link>
                <Link className="block text-xs font-semibold hover:text-primary transition-all" to="/" onClick={() => setMobileMenuOpen(false)}>📄 Terms of Service</Link>
              </div>
            </div>

            {/* Logout/Account */}
            {user ? (
              <button 
                onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}
                className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold py-3 rounded-2xl hover:bg-red-100 transition-all text-xs"
              >
                🚪 Log Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="border border-slate-250 py-3 rounded-2xl font-bold text-center text-xs">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-white py-3 rounded-2xl font-bold text-center text-xs">Sign Up</Link>
              </div>
            )}
          </div>
        </>
      )}

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
    <GoogleOAuthProvider clientId={clientId}>
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
    </GoogleOAuthProvider>
  );
}
