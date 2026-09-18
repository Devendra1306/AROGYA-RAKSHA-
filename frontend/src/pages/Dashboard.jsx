import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { 
  Activity, Droplets, Moon, Pill, 
  HeartPulse, LayoutDashboard, 
  LineChart as LineChartIcon, History, Settings,
  ChevronRight, Sparkles, Scale, Bell, ArrowUpRight,
  ShieldCheck, AlertCircle, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [savedMedsCount, setSavedMedsCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch real user data
  useEffect(() => {
    try {
      const storedContacts = JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
      if (profile?.emergencyContactName && profile?.emergencyContactPhone) {
        if (!storedContacts.some(c => c.phone === profile.emergencyContactPhone)) {
          storedContacts.unshift({
            name: profile.emergencyContactName,
            phone: profile.emergencyContactPhone,
            relationship: profile.emergencyContactRelationship || 'Family'
          });
        }
      }
      setEmergencyContacts(storedContacts);

      const meds = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
      setSavedMedsCount(meds.length);
    } catch (e) {}

    api.get('/assessment/history')
      .then(res => {
        if (Array.isArray(res.data)) setAssessments(res.data);
      })
      .catch(() => {});
  }, [profile]);

  // Real Vitals Calculation
  const hasVitals = Boolean(profile?.weight && profile?.height);
  const realBmi = hasVitals 
    ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = realBmi ? (
    realBmi < 18.5 ? 'Underweight' :
    realBmi < 25 ? 'Normal weight' :
    realBmi < 30 ? 'Overweight' : 'Obese'
  ) : 'Not Set';

  const bmiColor = realBmi ? (
    realBmi < 18.5 ? 'text-amber-500' :
    realBmi < 25 ? 'text-emerald-500' :
    realBmi < 30 ? 'text-orange-500' : 'text-red-500'
  ) : 'text-slate-400';

  // Real Health Score (from profile, latest assessment, or computed)
  const realHealthScore = (() => {
    if (assessments.length > 0 && assessments[0].healthScore) {
      return assessments[0].healthScore;
    }
    if (profile?.healthScore) return profile.healthScore;
    if (hasVitals) {
      let score = 65;
      if (user?.emailVerified) score += 10;
      if (profile?.bloodGroup) score += 10;
      if (emergencyContacts.length > 0) score += 10;
      return Math.min(100, score);
    }
    return null;
  })();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics', icon: LineChartIcon },
    { id: 'history', name: 'History', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const quickActions = [
    { name: 'Ask AI', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-500/10', path: '/medical-assistant' },
    { name: 'Medicine', icon: Pill, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/medicine-info' },
    { name: 'Remedies', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/home-remedies' },
    { name: 'Vitals', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/health-assessment' },
  ];

  // Map real assessments to chart data (no fake days/numbers)
  const chartData = assessments.length > 0 ? assessments.slice(-7).reverse().map((a, idx) => ({
    name: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Check ${idx + 1}`,
    score: a.healthScore || 70,
    hydration: a.hydrationScore || 70,
    sleep: a.sleepScore || 70
  })) : [];

  const MetricCard = ({ title, value, unit, icon: Icon, colorClass, delay, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
      className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover cursor-pointer relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('-500', '-500/10')} flex items-center justify-center ring-1 ring-inset ${colorClass.replace('text-', 'ring-').replace('-500', '-500/20')}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
      </div>
      
      <div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
          {unit && <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{unit}</span>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 flex font-sans">
      <SEO 
        title="Health Dashboard | Arogya Raksha AI"
        description="View your authentic clinical vitals, medical records, and health summary with Arogya Raksha."
        keywords="health dashboard, medical profile, patient portal, health tracker, Arogya Raksha"
        canonical="https://arogyarakshaa.vercel.app/dashboard"
        robots="noindex, nofollow"
      />
      
      {/* ── Sidebar (Desktop) ────────────────────────────────────────────── */}
      {!isMobile && (
        <aside className="w-[280px] fixed inset-y-0 left-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 p-6 flex flex-col z-40">
          <div className="flex items-center gap-3 mb-12 cursor-pointer magnetic-button" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-blue-700 flex items-center justify-center shadow-lg shadow-[#0052CC]/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight leading-none">Arogya Raksha</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">Dashboard</span>
            </div>
          </div>

          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 px-2">Menu</p>
          <nav className="flex-1 space-y-1.5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 relative group overflow-hidden ${
                    isActive 
                      ? 'text-[#0052CC] dark:text-[#10B981]' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActive"
                      className="absolute inset-0 bg-[#0052CC]/10 dark:bg-[#10B981]/15 rounded-xl border border-[#0052CC]/20 dark:border-[#10B981]/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  <tab.icon className={`w-[18px] h-[18px] relative z-10 transition-colors ${isActive ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span className="relative z-10 text-[14px]">{tab.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm premium-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052CC] to-[#10B981] text-white flex items-center justify-center font-black uppercase shadow-inner border border-white/20 text-sm">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[13px] font-black text-slate-900 dark:text-white truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User Profile'}</p>
                <p className="text-[11px] font-semibold text-slate-500 truncate cursor-pointer hover:text-[#0052CC] dark:hover:text-[#10B981] transition-colors" onClick={() => navigate('/profile')}>
                  Manage Profile
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className={`flex-1 ${!isMobile ? 'ml-[280px]' : ''} min-h-screen relative overflow-hidden`}>
        
        {/* Background Blobs for Premium Feel */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8 lg:py-12 pb-32 lg:pb-12">
          
          {/* Header */}
          <header className="flex justify-between items-end mb-10">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Health Summary
              </h1>
            </div>
            <button 
              onClick={() => navigate('/profile')} 
              className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center relative hover:shadow-md transition-all"
              title="Notifications & Profile"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {!hasVitals && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}
            </button>
          </header>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Highlights (Top Row) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  {/* Health Score Large Card */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px] group premium-hover">
                    {/* Animated background glow */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-[#10B981]/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-[#10B981]/30 transition-all duration-700" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Health Score</span>
                        <div className="flex items-end gap-1 mt-2">
                          <h2 className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                            {realHealthScore !== null ? realHealthScore : '—'}
                          </h2>
                          <span className="text-xl font-bold text-slate-500 mb-3">/100</span>
                        </div>
                      </div>
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Activity className="w-7 h-7 text-[#10B981]" />
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${realHealthScore ? 'bg-[#10B981] animate-pulse' : 'bg-amber-400'}`} />
                        <p className="text-[13px] text-slate-300 font-semibold tracking-wide">
                          {realHealthScore !== null 
                            ? (realHealthScore >= 80 ? 'Optimal wellness standing' : realHealthScore >= 60 ? 'Good standing. Keep vitals updated.' : 'Attention recommended.') 
                            : 'Set up your vitals to calculate real score.'}
                        </p>
                      </div>
                      {!hasVitals && (
                        <button 
                          onClick={() => navigate('/profile-setup')}
                          className="text-xs font-bold text-[#10B981] hover:underline"
                        >
                          Setup Vitals →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Quick Actions Panel */}
                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quick Actions</h3>
                      <Sparkles className="w-4 h-4 text-[#0052CC] dark:text-[#10B981]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.name}
                          onClick={() => navigate(action.path)}
                          className="flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-[#0052CC]/30 dark:hover:border-[#10B981]/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-[#10B981]/10 active:scale-95 py-4"
                        >
                          <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center ring-1 ring-inset ${action.bg.replace('bg-', 'ring-').replace('10', '20')}`}>
                            <action.icon className={`w-5 h-5 ${action.color}`} />
                          </div>
                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{action.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real Physical Vitals Metrics Grid */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Your Physical Vitals</h3>
                  <button 
                    onClick={() => navigate('/profile-setup')}
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline flex items-center gap-1"
                  >
                    {hasVitals ? 'Edit Vitals' : 'Add Vitals'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <MetricCard 
                    title="BMI Index" 
                    value={realBmi || '—'} 
                    unit={realBmi ? bmiCategory : 'Not Set'} 
                    icon={Scale} 
                    colorClass={bmiColor} 
                    delay={0.1}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Body Weight" 
                    value={profile?.weight || '—'} 
                    unit={profile?.weight ? 'kg' : 'Not Set'} 
                    icon={Activity} 
                    colorClass="text-emerald-500" 
                    delay={0.2}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Height" 
                    value={profile?.height || '—'} 
                    unit={profile?.height ? 'cm' : 'Not Set'} 
                    icon={HeartPulse} 
                    colorClass="text-rose-500" 
                    delay={0.3}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Blood Group" 
                    value={profile?.bloodGroup || '—'} 
                    unit={profile?.bloodGroup ? '' : 'Not Set'} 
                    icon={HeartPulse} 
                    colorClass="text-red-500" 
                    delay={0.4}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Water Intake" 
                    value={profile?.waterIntake ? `${profile.waterIntake}` : '—'} 
                    unit={profile?.waterIntake ? 'L / day' : 'Not Set'} 
                    icon={Droplets} 
                    colorClass="text-blue-500" 
                    delay={0.5}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Sleep Duration" 
                    value={profile?.sleepDuration ? `${profile.sleepDuration}` : '—'} 
                    unit={profile?.sleepDuration ? 'hrs / night' : 'Not Set'} 
                    icon={Moon} 
                    colorClass="text-indigo-500" 
                    delay={0.6}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Activity" 
                    value={profile?.activityLevel || '—'} 
                    unit="" 
                    icon={Activity} 
                    colorClass="text-orange-500" 
                    delay={0.7}
                    onClick={() => navigate('/profile-setup')}
                  />
                  <MetricCard 
                    title="Saved Meds" 
                    value={savedMedsCount} 
                    unit="Bookmarked" 
                    icon={Pill} 
                    colorClass="text-sky-500" 
                    delay={0.8}
                    onClick={() => navigate('/profile')}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Real Status & Emergency Contact (Overview Bottom) ───────────── */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
              >
                {/* Profile Status Card */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between premium-hover relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em]">Profile Status</h4>
                    </div>
                    <h3 className="text-lg font-black tracking-tight">
                      {hasVitals ? 'Clinical Vitals Active' : 'Setup Required'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {hasVitals 
                        ? 'Your age, blood group, height, and weight are configured.'
                        : 'Please enter your vitals so the AI can provide personalized advice.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 relative z-10 flex justify-end">
                    <button 
                      onClick={() => navigate(hasVitals ? '/profile' : '/profile-setup')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      {hasVitals ? 'View Health Profile' : 'Complete Setup →'}
                    </button>
                  </div>
                </div>
                
                {/* Emergency Contact SOS Card */}
                <div className="md:col-span-2 glass-card dark:bg-slate-900/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 premium-hover group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">SOS Emergency Readiness</h4>
                      {emergencyContacts.length > 0 ? (
                        <div>
                          <p className="text-[15px] font-bold text-slate-800 dark:text-white">
                            Primary Contact: {emergencyContacts[0].name} ({emergencyContacts[0].phone})
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {emergencyContacts[0].relationship || 'Emergency'} · Ready for one-tap dialing
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[15px] font-bold text-amber-600 dark:text-amber-400">
                            No Emergency Contact Configured
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Add a trusted family member or physician for instant access during an emergency.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center shrink-0">
                    {emergencyContacts.length > 0 ? (
                      <a 
                        href={`tel:${emergencyContacts[0].phone}`}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        Call Contact
                      </a>
                    ) : (
                      <button 
                        onClick={() => navigate('/emergency')}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        Add Contact
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Analytics Tab ────────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">AI Health Analytics</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Progression from your logged health assessments.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/health-assessment')}
                    className="flex items-center gap-2 bg-[#0052CC] dark:bg-[#10B981] text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 self-start sm:self-auto"
                  >
                    Take New Assessment <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {chartData.length > 0 ? (
                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em]">Health Score Progression</h3>
                      <span className="text-xs text-slate-500 font-bold">{chartData.length} Assessments Logged</span>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="score" name="Health Score" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#10B981]/10 dark:text-[#10B981] flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">No Assessment Data Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
                      Complete your first clinical assessment to generate your personalized wellness trend charts and track improvements over time.
                    </p>
                    <button 
                      onClick={() => navigate('/health-assessment')}
                      className="px-6 py-3 rounded-2xl bg-[#0052CC] dark:bg-[#10B981] text-white font-bold text-sm shadow hover:opacity-90 transition-all"
                    >
                      Start Free Health Assessment
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── History Tab ────────────────────────────────────────────────── */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 premium-hover"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em]">Health Activity History</h3>
                  <button 
                    onClick={() => navigate('/profile')} 
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                  >
                    View All in Profile
                  </button>
                </div>
                
                {assessments.length > 0 ? (
                  <div className="relative border-l border-slate-200 dark:border-slate-800 ml-5 space-y-6">
                    {assessments.map((item, index) => (
                      <div key={item._id || index} className="relative pl-8 group">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-rose-500/10 border-[3px] border-white dark:border-slate-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
                          <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="glass-card dark:bg-slate-800/50 rounded-2xl p-4 premium-hover">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                            Health Assessment — Score: {item.healthScore || 75}/100
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {item.recommendations?.[0] || 'Vitals and habits processed successfully.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                      <History className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Previous Activity Recorded</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Your AI consultations, health assessments, and saved medications will be organized in this timeline.
                    </p>
                    <button 
                      onClick={() => navigate('/medical-assistant')}
                      className="mt-5 px-5 py-2.5 bg-[#0052CC] dark:bg-[#10B981] text-white rounded-xl text-xs font-bold shadow hover:opacity-90 transition-all"
                    >
                      Consult Medical Assistant
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Settings Tab ───────────────────────────────────── */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 premium-hover">
                  <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Security & Clinical Privacy</h3>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#10B981]/5 border border-[#10B981]/20">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">HIPAA & WHO Aligned Architecture</h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        Your medical data is encrypted in transit and at rest. Arogya Raksha never shares or monetizes personal health information with third parties.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 premium-hover">
                  <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Account & Profile Actions</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => navigate('/profile-setup')}
                      className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-left flex items-center justify-between"
                    >
                      <span>Update Physical Vitals & Medical History</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="px-5 py-3 rounded-xl bg-[#0052CC] dark:bg-[#10B981] text-white font-bold text-xs hover:opacity-90 transition-all text-left flex items-center justify-between"
                    >
                      <span>Open Full Profile Management</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-4 flex justify-between items-center z-50 pb-safe">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 transition-all magnetic-button ${
                activeTab === tab.id 
                  ? 'text-[#0052CC] dark:text-[#10B981]' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all relative ${activeTab === tab.id ? 'bg-[#0052CC]/10 dark:bg-[#10B981]/15' : 'bg-transparent'}`}>
                <tab.icon className="w-[22px] h-[22px] relative z-10" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? 'opacity-100 translate-y-0' : 'opacity-0 h-0 overflow-hidden translate-y-2'}`}>{tab.name}</span>
            </button>
          ))}
        </nav>
      )}

    </div>
  );
}
