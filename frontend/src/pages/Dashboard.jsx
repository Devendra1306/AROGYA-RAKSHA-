import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({
    healthScore: profile?.healthScore || 70,
    bmi: 22.4,
    dietGoal: profile?.healthGoal || 'Healthy Lifestyle',
    waterGoal: profile?.waterIntake || 3,
    sleepGoal: profile?.sleepDuration || 7
  });

  const [activeTip, setActiveTip] = useState(0);

  const healthTips = [
    { title: "💧 Hydrate Early", body: "Drinking a glass of water immediately after waking up helps activate internal organs and boosts metabolism." },
    { title: "🧘 Stress Release", body: "Take a 2-minute box breathing break: inhale for 4s, hold for 4s, exhale for 4s, hold for 4s." },
    { title: "🥗 Eat Clean", body: "Focus on adding one extra serving of fiber or green leafy vegetables to your lunch plate today." },
    { title: "🚶 Stretch Often", body: "If you have a desk job, stand up and stretch for 3 minutes for every hour of continuous sitting." }
  ];

  useEffect(() => {
    if (profile) {
      const heightM = profile.height / 100;
      const bmi = heightM > 0 ? Number((profile.weight / (heightM * heightM)).toFixed(1)) : 22.4;
      setKpis({
        healthScore: profile.healthScore || 70,
        bmi,
        dietGoal: profile.healthGoal || 'Healthy Lifestyle',
        waterGoal: profile.waterIntake || 3,
        sleepGoal: profile.sleepDuration || 7
      });
    }
  }, [profile]);

  useEffect(() => {
    // Automatically rotate health tips every 8 seconds
    const interval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % healthTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { name: 'Symptom Checker', desc: 'AI Guideline check', icon: '🩺', path: '/medical-assistant', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { name: 'Wellness Quiz', desc: 'Recalculate score', icon: '📊', path: '/health-assessment', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { name: 'Diet Planner', desc: 'Macros tracker', icon: '🥗', path: '/diet-planner', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { name: 'Medicine Info', desc: 'Interactions log', icon: '💊', path: '/medicine-info', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { name: 'Home Remedies', desc: 'Kitchen remedies', icon: '🏠', path: '/home-remedies', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    { name: 'Nearby Help', desc: 'Clinics finder', icon: '🏥', path: '/nearby', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
  ];

  const recentActivities = [
    { title: "Logged Vitals Profile", time: "Today, 10:24 AM", icon: "📊", color: "bg-amber-100 text-amber-600" },
    { title: "Water Intake Synced", time: "Yesterday, 6:15 PM", icon: "💧", color: "bg-blue-100 text-blue-600" },
    { title: "AI Chat Assistant Query", time: "June 7, 3:42 PM", icon: "🤖", color: "bg-purple-100 text-purple-600" }
  ];

  const healthScore = kpis.healthScore;
  const healthScoreColor = healthScore >= 80 ? 'text-emerald-500 stroke-emerald-500' : healthScore >= 60 ? 'text-amber-500 stroke-amber-500' : 'text-red-500 stroke-red-500';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[600px] mx-auto px-4 pt-20 pb-28 text-slate-800 dark:text-slate-100"
    >
      {/* App Header / Welcome User */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hello, {user?.firstName}!</span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">My Health App</h1>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {(user?.firstName ? user.firstName[0].toUpperCase() : '') + (user?.lastName ? user.lastName[0].toUpperCase() : '')}
        </button>
      </header>

      {/* Health Score Card */}
      <section className="glass-card rounded-3xl p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-indigo-950/20 border border-slate-200/50 dark:border-slate-700/50 mb-6 flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
            Health Index
          </span>
          <h2 className="text-xl font-black mt-2">Score: {healthScore}/100</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            Your score is calculated based on stress vitals, sleep duration, and active diet logs.
          </p>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-700" />
            <circle 
              cx="18" 
              cy="18" 
              r="15.915" 
              fill="none" 
              strokeWidth="3" 
              strokeDasharray={`${healthScore} 100`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className={`transition-all duration-700 ${healthScoreColor}`}
            />
          </svg>
          <span className="absolute text-lg font-black">{healthScore}%</span>
        </div>
      </section>

      {/* SOS Button Callout */}
      <section 
        onClick={() => navigate('/emergency')}
        className="glass-card rounded-3xl p-4 bg-red-500/10 border border-red-500/30 shadow-sm mb-6 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <h4 className="font-extrabold text-sm text-red-600 dark:text-red-400">SOS Emergency Center</h4>
            <p className="text-[10px] text-red-700/80 dark:text-red-300/80 mt-0.5">Quick guides, first-aid, & live coordination share</p>
          </div>
        </div>
        <span className="text-red-500 text-sm font-extrabold">Open →</span>
      </section>

      {/* Quick Actions Grid */}
      <section className="mb-6">
        <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-3.5">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((act) => (
            <div 
              key={act.name}
              onClick={() => navigate(act.path)}
              className="glass-card rounded-2xl p-3.5 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className={`w-10 h-10 rounded-2xl ${act.bg} flex items-center justify-center text-xl mb-2.5`}>
                {act.icon}
              </div>
              <span className="text-[11px] font-bold leading-tight">{act.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Health Tip (Animated Carousel) */}
      <section className="glass-card rounded-3xl p-5 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6 relative overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Health Tip</span>
        <div className="h-16 mt-2 relative">
          {healthTips.map((tip, idx) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: activeTip === idx ? 1 : 0, x: activeTip === idx ? 0 : -20 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 ${activeTip === idx ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <h4 className="font-black text-xs text-primary dark:text-secondary">{tip.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{tip.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="glass-card rounded-3xl p-5 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
        <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider mb-4">Recent Health Log Activity</h3>
        <div className="space-y-4">
          {recentActivities.map((act, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${act.color} flex items-center justify-center text-sm font-bold`}>
                  {act.icon}
                </div>
                <div>
                  <h4 className="font-bold">{act.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">Synced ✓</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
