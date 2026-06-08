import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Stubs imports (we will populate them with high-fidelity UIs)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import EmergencyHelp from './pages/EmergencyHelp';
import MedicalAssistant from './pages/MedicalAssistant';
import HealthAssessment from './pages/HealthAssessment';
import DietPlanner from './pages/DietPlanner';
import MedicineInfo from './pages/MedicineInfo';
import HomeRemedies from './pages/HomeRemedies';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!user) {
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

  const activeClass = (path) => 
    location.pathname === path 
      ? "text-primary dark:text-secondary font-semibold border-b-2 border-primary dark:border-secondary pb-1" 
      : "text-on-surface-variant hover:text-primary dark:text-slate-300 dark:hover:text-secondary transition-colors";

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900 text-on-surface dark:text-slate-100 flex flex-col">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-base cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-bold text-primary dark:text-secondary">🚨 Arogya Raksha</span>
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
            <div className="flex items-center gap-base">
              <span 
                className="hidden md:inline text-label-md font-medium text-primary cursor-pointer hover:underline"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </span>
              {user.role === 'Admin' && (
                <span 
                  className="hidden md:inline text-label-md text-secondary font-bold cursor-pointer hover:underline"
                  onClick={() => navigate('/admin')}
                >
                  Admin
                </span>
              )}
              <button 
                onClick={logout}
                className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-secondary dark:bg-secondary/10 dark:hover:bg-secondary/20 px-4 py-2 rounded-xl text-label-md transition-all"
              >
                Logout
              </button>
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <GlobalLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/emergency" element={<EmergencyHelp />} />
              <Route path="/medical-assistant" element={<MedicalAssistant />} />
              <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
              <Route path="/diet-planner" element={<ProtectedRoute><DietPlanner /></ProtectedRoute>} />
              <Route path="/medicine-info" element={<MedicineInfo />} />
              <Route path="/home-remedies" element={<HomeRemedies />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </GlobalLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
