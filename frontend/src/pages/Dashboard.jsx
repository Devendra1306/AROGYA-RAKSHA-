import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { 
  Activity, Droplets, Moon, Flame, Pill, 
  Utensils, HeartPulse, LayoutDashboard, 
  LineChart as LineChartIcon, History, Settings, Menu, X, 
  ChevronRight, Sparkles, Scale, Bell, Target, Award, ArrowUpRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Health Data Defaults
  const healthData = {
    healthScore: profile?.healthScore || 85,
    bmi: profile?.weight && profile?.height ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : 22.4,
    calories: 1850,
    water: profile?.waterIntake || 3.5, // Liters
    sleep: profile?.sleepDuration || 7.2, // Hours
    activity: 8432, // Steps
    reminders: 2
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics', icon: LineChart },
    { id: 'history', name: 'History', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const quickActions = [
    { name: 'Ask AI', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-500/10', path: '/medical-assistant' },
    { name: 'Medicine', icon: Pill, color: 'text-sky-500', bg: 'bg-sky-500/10', path: '/medicine-info' },
    { name: 'Diet Plan', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/diet-planner' },
    { name: 'Vitals', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/health-assessment' },
  ];

  const chartData = [
    { name: 'Mon', score: 82, water: 2.5, sleep: 6.5, steps: 6000 },
    { name: 'Tue', score: 84, water: 3.0, sleep: 7.0, steps: 7200 },
    { name: 'Wed', score: 83, water: 2.8, sleep: 6.8, steps: 6800 },
    { name: 'Thu', score: 86, water: 3.2, sleep: 7.5, steps: 8100 },
    { name: 'Fri', score: 85, water: 3.5, sleep: 7.2, steps: 8432 },
    { name: 'Sat', score: 88, water: 3.8, sleep: 8.0, steps: 10200 },
    { name: 'Sun', score: 89, water: 3.5, sleep: 7.8, steps: 9500 },
  ];

  const timelineData = [
    { id: 1, date: 'Today, 9:00 AM', title: 'Daily Health Assessment', desc: 'Score improved to 85. Keep hydrating.', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 2, date: 'Yesterday, 8:30 PM', title: 'Diet Plan Updated', desc: 'Switched to High Protein, Low Carb.', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 3, date: 'Yesterday, 2:15 PM', title: 'AI Consultation', desc: 'Asked about persistent headaches. Recommended hydration.', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 4, date: 'Oct 12, 10:00 AM', title: 'Medicine Reminder Set', desc: 'Added Vitamin D (1x Daily).', icon: Pill, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  ];

  const MetricCard = ({ title, value, unit, icon: Icon, colorClass, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover cursor-pointer relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass.split('text-')[1] ? `from-${colorClass.split('text-')[1].split('-')[0]}-500/10 to-transparent` : 'from-slate-500/5'} rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-125`} />
      
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
          <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 flex font-sans">
      <SEO 
        title="Health Dashboard | Arogya Raksha"
        description="View your personalized health dashboard, vitals, daily goals, and medical history with Arogya Raksha."
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black uppercase shadow-inner border border-white/20">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[13px] font-black text-slate-900 dark:text-white truncate">{user?.firstName || 'User Profile'}</p>
                <p className="text-[11px] font-semibold text-slate-500 truncate cursor-pointer hover:text-[#0052CC] dark:hover:text-[#10B981] transition-colors" onClick={() => navigate('/profile-setup')}>Manage Account</p>
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
                Summary
              </h1>
            </div>
            <button className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center relative hover:shadow-md transition-all">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {healthData.reminders > 0 && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
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
                          <h2 className="text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{healthData.healthScore}</h2>
                          <span className="text-xl font-bold text-slate-500 mb-3">/100</span>
                        </div>
                      </div>
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Activity className="w-7 h-7 text-[#10B981]" />
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                      <p className="text-[13px] text-slate-300 font-semibold tracking-wide">Trending Upward. Keep hydrating!</p>
                    </div>
                  </div>

                  {/* AI Quick Actions Panel */}
                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Quick Actions</h3>
                      <Sparkles className="w-4 h-4 text-[#0052CC] dark:text-[#10B981]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {quickActions.map((action) => (
                        <button
                          key={action.name}
                          onClick={() => navigate(action.path)}
                          className="flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-[#0052CC]/30 dark:hover:border-[#10B981]/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-[#10B981]/10 active:scale-95"
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

                {/* Metrics Grid */}
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 tracking-tight">Today's Metrics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <MetricCard title="Activity" value={healthData.activity} unit="steps" icon={Flame} colorClass="text-orange-500" delay={0.1} />
                  <MetricCard title="Calories" value={healthData.calories} unit="kcal" icon={Utensils} colorClass="text-emerald-500" delay={0.2} />
                  <MetricCard title="Water" value={healthData.water} unit="L" icon={Droplets} colorClass="text-blue-500" delay={0.3} />
                  <MetricCard title="Sleep" value={healthData.sleep} unit="hrs" icon={Moon} colorClass="text-indigo-500" delay={0.4} />
                  <MetricCard title="BMI" value={healthData.bmi} unit="" icon={Scale} colorClass="text-violet-500" delay={0.5} />
                </div>
              </motion.div>
            )}

            {/* ── Gamification & Goals (Overview) ───────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
              >
                {/* Streaks */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl flex items-center justify-between premium-hover relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20" />
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em] mb-1">Current Streak</h4>
                    <div className="flex items-end gap-1.5">
                      <span className="text-5xl font-black tracking-tighter">14</span>
                      <span className="text-[13px] font-bold text-slate-400 mb-1.5">Days</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] relative z-10">
                    <Flame className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                {/* Badges/Goals */}
                <div className="md:col-span-2 glass-card dark:bg-slate-900/80 rounded-3xl p-6 flex items-center justify-between premium-hover group">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Active Goals</h4>
                    <p className="text-[15px] font-bold text-slate-800 dark:text-white group-hover:text-[#0052CC] dark:group-hover:text-[#10B981] transition-colors">Maintain optimal hydration & sleep</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 transition-transform hover:scale-110 cursor-help" title="Hydration Master">
                      <Droplets className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 transition-transform hover:scale-110 cursor-help" title="Sleep Champion">
                      <Moon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110 cursor-help" title="More Badges">
                      <Target className="w-5 h-5 text-slate-400" />
                    </div>
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
                <div className="flex justify-between items-center glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">AI Health Report</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Comprehensive analysis of your vitals, diet, and AI insights.</p>
                  </div>
                  <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold magnetic-button shadow-lg shadow-slate-900/20 dark:shadow-white/20">
                    Download PDF <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em]">Health Score Trend</h3>
                    <select className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none hover:border-[#0052CC]/30 dark:hover:border-[#10B981]/30 transition-colors">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
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
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                    <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Daily Activity</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                          <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Bar dataKey="steps" fill="#0052CC" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 premium-hover">
                    <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Hydration & Sleep</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <Line yAxisId="left" type="monotone" dataKey="water" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10B981' }} />
                          <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#0052CC" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#0052CC' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
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
                <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-8">AI Health Timeline</h3>
                
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-5 space-y-8">
                  {timelineData.map((item, index) => (
                    <div key={item.id} className="relative pl-8 group">
                      <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full ${item.bg} border-[3px] border-white dark:border-slate-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-125`}>
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <div className="glass-card dark:bg-slate-800/50 rounded-2xl p-4 premium-hover">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.date}</span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">Security & Privacy</h3>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#10B981]/5 border border-[#10B981]/20">
                    <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-[#10B981]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">HIPAA Compliant Infrastructure</h4>
                      <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">Your health data is encrypted end-to-end. Arogya Raksha utilizes secure authentication and never shares personal medical information with third parties.</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 premium-hover">
                  <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6">AI Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:border-[#0052CC]/30 transition-all cursor-pointer group">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">Smart Notifications</h4>
                        <p className="text-[12px] text-slate-500 mt-0.5">Receive AI-driven alerts for water, sleep, and medicine.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#0052CC] rounded-full relative shadow-inner">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-[2px] shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:border-[#0052CC]/30 transition-all cursor-pointer group">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[14px]">AI Doctor Memory</h4>
                        <p className="text-[12px] text-slate-500 mt-0.5">Allow AI to remember past consultations for better context.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#0052CC] rounded-full relative shadow-inner">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-[2px] shadow-sm"></div>
                      </div>
                    </div>
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
