import React from 'react';
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

// Global Layout containing navbar, sidebar, and floating SOS button
const GlobalLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const activeClass = (path) => 
    location.pathname === path 
      ? "text-primary dark:text-secondary font-semibold border-b-2 border-primary dark:border-secondary pb-1" 
      : "text-on-surface-variant hover:text-primary dark:text-slate-300 dark:hover:text-secondary transition-colors";

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 flex flex-col">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2.5 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
          <img src="/logo.jpg" alt="Arogya Raksha Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary dark:ring-secondary ring-offset-1 ring-offset-white dark:ring-offset-slate-900 shadow-md transition-all duration-300 hover:scale-105" />
          <span className="text-xl font-bold text-primary dark:text-secondary tracking-wide">Arogya Raksha</span>
        </div>

        {/* Center Nav Link */}
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
        <div className="flex items-center gap-stack-sm">
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-all"
            title="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="relative flex items-center">
              {/* User Selector Row */}
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-all select-none"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.firstName} 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 dark:ring-secondary/20"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = ''; // Clear image to fallback to initials
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary dark:bg-secondary/15 dark:text-secondary font-bold flex items-center justify-center text-xs ring-2 ring-primary/10 dark:ring-secondary/10">
                    {(user.firstName ? user.firstName[0].toUpperCase() : '') + (user.lastName ? user.lastName[0].toUpperCase() : '')}
                  </div>
                )}
                <span className="hidden md:inline text-label-md font-semibold text-on-surface dark:text-slate-200 ml-1">
                  {user.firstName}
                </span>
                <span className="text-[10px] text-on-surface-variant dark:text-slate-400 ml-0.5">▼</span>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  {/* Overlay to close on click outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  
                  {/* Dropdown Card */}
                  <div className="absolute right-0 top-11 z-50 w-64 glass-card rounded-2xl p-4 bg-white dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 shadow-2xl animate-scale-up text-slate-800 dark:text-slate-200">
                    <div className="pb-3 border-b border-outline-variant/30 dark:border-slate-700/65 mb-2">
                      <h4 className="font-bold text-sm text-on-surface dark:text-slate-100">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary/5 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2"
                      >
                        📊 Dashboard
                      </button>
                      
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/profile-setup');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary/5 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2"
                      >
                        👤 Profile Setup
                      </button>
                      
                      {user.role === 'Admin' && (
                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-secondary/5 dark:hover:bg-slate-700/60 transition-all flex items-center gap-2"
                        >
                          🛡️ Admin Dashboard
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/20 dark:border-slate-700/40"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-stack-sm">
              <Link to="/login" className="text-on-surface-variant dark:text-slate-300 hover:text-primary transition-colors text-label-md px-2">Login</Link>
              <Link to="/signup" className="bg-primary text-white hover:opacity-90 dark:bg-secondary dark:text-slate-900 px-4 py-2 rounded-xl text-label-md font-bold transition-all shadow-sm">Sign Up</Link>
            </div>
          )}

          {/* Hamburger Icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-2xl p-1 text-on-surface-variant dark:text-slate-300"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 w-full z-40 bg-surface dark:bg-slate-900 border-b border-outline-variant/30 shadow-lg flex flex-col p-6 gap-4 lg:hidden animate-fade-in">
          <Link className="font-medium text-lg" to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link className="font-medium text-lg text-red-500" to="/emergency" onClick={() => setMobileMenuOpen(false)}>🚨 Emergency Help</Link>
          <Link className="font-medium text-lg" to="/medical-assistant" onClick={() => setMobileMenuOpen(false)}>🩺 Medical Assistant</Link>
          <Link className="font-medium text-lg" to="/health-assessment" onClick={() => setMobileMenuOpen(false)}>📊 Health Assessment</Link>
          <Link className="font-medium text-lg" to="/diet-planner" onClick={() => setMobileMenuOpen(false)}>🥗 Diet Planner</Link>
          <Link className="font-medium text-lg" to="/medicine-info" onClick={() => setMobileMenuOpen(false)}>💊 Medicine Info</Link>
          <Link className="font-medium text-lg" to="/home-remedies" onClick={() => setMobileMenuOpen(false)}>🏠 Home Remedies</Link>
          {user && (
            <>
              <hr className="border-outline-variant/30" />
              <Link className="font-medium text-lg text-primary" to="/dashboard" onClick={() => setMobileMenuOpen(false)}>My Dashboard</Link>
              {user.role === 'Admin' && (
                <Link className="font-medium text-lg text-secondary" to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-grow pt-16">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-margin-desktop border-t border-slate-800 transition-colors">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-gutter text-center md:text-left">
          
          {/* Logo & Tagline */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <img 
              src="/logo.jpg" 
              alt="Arogya Raksha Logo" 
              className="h-16 w-16 rounded-full object-cover ring-2 ring-primary dark:ring-secondary ring-offset-2 ring-offset-slate-900 shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-3" 
            />
            <div>
              <h3 className="text-white font-bold text-xl tracking-wide">Arogya Raksha</h3>
              <p className="text-xs opacity-75 mt-1">PROTECTING YOUR HEALTH. SECURING YOUR FUTURE.</p>
            </div>
          </div>

          {/* Social Links / neat cool hover adaptive icons */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Developer</span>
            <div className="flex gap-4">
              
              {/* Email */}
              <a 
                href="mailto:devendrasagar0988@gmail.com" 
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-300 shadow-md hover:-translate-y-0.5"
                title="Email Developer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/ibba-devendra-sagar-22917b353/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-[#0077b5] hover:text-white flex items-center justify-center transition-all duration-300 shadow-md hover:-translate-y-0.5"
                title="LinkedIn Profile"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a 
                href="https://github.com/Devendra1306" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all duration-300 shadow-md hover:-translate-y-0.5"
                title="GitHub Repository"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>

            </div>
          </div>

        </div>
      </footer>

      {/* Floating SOS Emergency Help Button on every page */}
      <button 
        onClick={() => navigate('/emergency')}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all animate-bounce"
        title="SOS EMERGENCY HELP"
      >
        🚨
      </button>
    </div>
  );
};

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173236579751-t2aa0hq2d83eo0939a37qbed74351np5.apps.googleusercontent.com';
  
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
