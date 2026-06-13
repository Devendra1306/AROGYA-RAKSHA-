import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [kpis, setKpis] = useState({
    healthScore: profile?.healthScore || 78,
    bmi: 22.4,
    dietGoal: profile?.healthGoal || 'Healthy Lifestyle',
    waterGoal: profile?.waterIntake || 3,
    sleepGoal: profile?.sleepDuration || 7.5,
    heartRate: 72,
    bloodPressure: '118/76',
    steps: 8432
  });

  const healthScoreRef = useRef(null);
  const stepsRef = useRef(null);

  useEffect(() => {
    if (profile) {
      const heightM = profile.height / 100;
      const bmi = Number((profile.weight / (heightM * heightM)).toFixed(1));
      const score = profile.healthScore || 78;
      
      setKpis(prev => ({
        ...prev,
        healthScore: score,
        bmi,
        dietGoal: profile.healthGoal || 'Healthy Lifestyle',
        waterGoal: profile.waterIntake || 3,
        sleepGoal: profile.sleepDuration || 7.5
      }));
    }
  }, [profile]);

  useEffect(() => {
    // GSAP count up for health score
    const scoreVal = { score: 0 };
    gsap.to(scoreVal, {
      score: kpis.healthScore,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (healthScoreRef.current) {
          healthScoreRef.current.innerText = Math.round(scoreVal.score);
        }
      }
    });

    // GSAP count up for steps
    const stepsVal = { steps: 0 };
    gsap.to(stepsVal, {
      steps: kpis.steps,
      duration: 2,
      ease: "power3.out",
      onUpdate: () => {
        if (stepsRef.current) {
          stepsRef.current.innerText = Math.round(stepsVal.steps).toLocaleString();
        }
      }
    });
  }, [kpis.healthScore, kpis.steps]);

  const quickActions = [
    { name: 'Medical Assistant', desc: 'AI Symptom checker & chat', icon: 'smart_toy', path: '/medical-assistant', color: 'border-l-primary', iconColor: 'text-primary', bg: 'bg-primary/5 hover:bg-primary/10' },
    { name: 'Health Assessment', desc: 'Wellness check & reports', icon: 'analytics', path: '/health-assessment', color: 'border-l-secondary', iconColor: 'text-secondary', bg: 'bg-secondary/5 hover:bg-secondary/10' },
    { name: 'Diet Planner', desc: 'Daily calories & meals', icon: 'restaurant', path: '/diet-planner', color: 'border-l-emerald-500', iconColor: 'text-emerald-500', bg: 'bg-emerald-500/5 hover:bg-emerald-500/10' },
    { name: 'Search Medicine', desc: 'Interactions & warnings', icon: 'pill', path: '/medicine-info', color: 'border-l-indigo-500', iconColor: 'text-indigo-500', bg: 'bg-indigo-500/5 hover:bg-indigo-500/10' },
    { name: 'Home Remedies', desc: 'Kitchen remedies finder', icon: 'eco', path: '/home-remedies', color: 'border-l-orange-500', iconColor: 'text-orange-500', bg: 'bg-orange-500/5 hover:bg-orange-500/10' }
  ];

  if (isMobile) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen pb-16 font-body-md relative overflow-x-hidden">
        
        {/* Decorative background gradients */}
        <div className="absolute top-[-5%] left-[-15%] w-72 h-72 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-[30%] right-[-15%] w-72 h-72 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Welcome Section */}
        <section className="px-4 pt-6 pb-2 relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">Hello, {user?.firstName} 👋</h2>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">YOUR HEALTH ROADMAP</p>
          </div>
          <button
            onClick={() => navigate('/profile-setup')}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs active:scale-95 transition-all"
            title="Edit Profile"
          >
            <span className="material-symbols-outlined text-lg text-slate-550 dark:text-slate-350">settings</span>
          </button>
        </section>

        {/* Start Assessment CTA */}
        <div className="px-4 mb-6 relative z-10">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/health-assessment')}
            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-650 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 transition-all uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span> Start Daily Vitals Check
          </motion.button>
        </div>

        {/* Content Layout */}
        <div className="px-4 space-y-6 relative z-10">
          
          {/* Daily Health Score Card */}
          <div className="glass-card rounded-[2rem] bg-white/80 dark:bg-slate-900/80 p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
            <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider self-start">DAILY HEALTH SCORE</h3>
            
            <div className="relative w-36 h-36 flex items-center justify-center mt-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="62" stroke="#e2e8f0" strokeWidth="8" fill="transparent" className="dark:stroke-slate-800" />
                <circle cx="72" cy="72" r="62" stroke="url(#dashHealthScoreGrad)" strokeWidth="8" fill="transparent" strokeDasharray={389} strokeDashoffset={389 - (389 * kpis.healthScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                <defs>
                  <linearGradient id="dashHealthScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0052cc" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span ref={healthScoreRef} className="text-4xl font-black text-slate-800 dark:text-white">0</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Optimal</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 w-full text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-bold text-[9px] uppercase">Yesterday</p>
                <p className="text-primary dark:text-secondary font-extrabold mt-0.5">72</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl text-center border border-l-2 border-primary border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-bold text-[9px] uppercase">Goal</p>
                <p className="text-primary dark:text-secondary font-extrabold mt-0.5">85</p>
              </div>
            </div>
          </div>

          {/* Quick Health Actions Slider */}
          <section className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Quick Actions</h3>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin hide-scrollbar -mx-4 px-4">
              {quickActions.map((act) => (
                <div 
                  key={act.name}
                  onClick={() => navigate(act.path)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xs flex items-center gap-3 shrink-0 w-48 cursor-pointer active:scale-95 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.bg} ${act.iconColor}`}>
                    <span className="material-symbols-outlined text-lg">{act.icon}</span>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-white truncate">{act.name}</h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Heart Rate */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Heart Rate</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-rose-500">{kpis.heartRate}</span>
                  <span className="text-[9px] text-slate-400 font-bold">BPM</span>
                </div>
              </div>
              <div className="mt-3 h-10 w-full opacity-85">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,30 L10,30 L18,30 L22,10 L27,38 L32,25 L35,30 L40,30 L48,30 L52,5 L57,35 L62,20 L65,30 L75,30 L85,30 L100,30" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Blood Pressure</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-blue-500">{kpis.bloodPressure}</span>
                  <span className="text-[9px] text-slate-400 font-bold">mmHg</span>
                </div>
              </div>
              <div className="mt-3 h-10 w-full opacity-85">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,20 L15,22 L30,17 L45,21 L60,18 L75,22 L90,16 L100,19" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"></path>
                </svg>
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Sleep Quality</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-indigo-500">{kpis.sleepGoal}</span>
                  <span className="text-[9px] text-slate-400 font-bold">Hours</span>
                </div>
              </div>
              <div className="mt-4 flex gap-1 h-6 items-end">
                <div className="flex-1 bg-indigo-500/40 h-[40%] rounded-sm"></div>
                <div className="flex-1 bg-indigo-500/60 h-[60%] rounded-sm"></div>
                <div className="flex-1 bg-indigo-500/80 h-[80%] rounded-sm"></div>
                <div className="flex-1 bg-indigo-500/50 h-[30%] rounded-sm"></div>
                <div className="flex-1 bg-indigo-500/90 h-[95%] rounded-sm"></div>
                <div className="flex-1 bg-indigo-500 h-[100%] rounded-sm"></div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Daily Steps</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span ref={stepsRef} className="text-2xl font-black text-emerald-500">0</span>
                  <span className="text-[9px] text-slate-400 font-bold">Steps</span>
                </div>
              </div>
              <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full w-[84%] rounded-full"></div>
              </div>
            </div>

          </div>

          {/* Weekly Vital Trends */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Weekly Vital Trends</h3>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold">Stable</span>
            </div>
            <div className="h-32 w-full relative pt-2">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="50" y2="50" className="dark:stroke-slate-800" />
                <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="100" y2="100" className="dark:stroke-slate-800" />
                <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="150" y2="150" className="dark:stroke-slate-800" />
                <path d="M0,150 L114,130 L228,160 L342,110 L456,85 L570,120 L684,75 L800,60" fill="none" stroke="url(#dashGraphGrad)" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M0,150 L114,130 L228,160 L342,110 L456,85 L570,120 L684,75 L800,60 V200 H0 Z" fill="url(#dashGraphAreaGrad)" opacity="0.15"></path>
                <defs>
                  <linearGradient id="dashGraphGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0052cc" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="dashGraphAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0052cc" />
                    <stop offset="100%" stopColor="#0052cc" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          {/* Health Recommendation Card */}
          <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5 p-4 rounded-3xl border border-violet-500/20 flex gap-4 items-center">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-xs">
              <span className="material-symbols-outlined">self_improvement</span>
            </div>
            <div className="overflow-hidden">
              <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest">Active Advice</span>
              <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-white mt-1.5">Evening Stretching Session</h4>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 mt-0.5">Stretching relieves tension spikes observed in your profiles today.</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="max-w-[1400px] mx-auto px-margin-mobile lg:px-margin-desktop py-10 text-slate-800 dark:text-slate-100 transition-colors relative">
      
      {/* Background blobs */}
      <div className="absolute top-[-5%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[90px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-secondary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Hello, {user?.firstName} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome to your unified clinical health command center.</p>
        </div>
        <button 
          onClick={() => navigate('/profile-setup')}
          className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs bg-white dark:bg-slate-900 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">edit</span> Setup Health Profile
        </button>
      </header>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
        {/* Health Score */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Health Score</span>
              <h2 className="text-4xl font-black text-primary dark:text-secondary mt-2">
                <span ref={healthScoreRef}>0</span>/100
              </h2>
            </div>
            <span className="material-symbols-outlined text-primary text-2xl">insights</span>
          </div>
          <div className="mt-5 w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${kpis.healthScore}%` }}></div>
          </div>
        </div>

        {/* BMI */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Body Mass Index</span>
              <h2 className="text-4xl font-black mt-2">{kpis.bmi}</h2>
            </div>
            <span className="material-symbols-outlined text-emerald-500 text-2xl">scale</span>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 mt-4 block">
            {kpis.bmi < 18.5 ? 'Underweight Range' : kpis.bmi > 25 ? 'Overweight Range' : 'Optimal Weight Range'}
          </span>
        </div>

        {/* Diet & Goals */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Primary Goal</span>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2 truncate max-w-[180px]">{kpis.dietGoal}</h2>
            </div>
            <span className="material-symbols-outlined text-violet-500 text-2xl">emoji_events</span>
          </div>
          <span className="text-xs text-slate-400 mt-4 block">Duration: {profile?.targetDuration || '3 Months Active'}</span>
        </div>

        {/* SOS Emergency Help */}
        <div 
          onClick={() => navigate('/emergency')}
          className="glass-card rounded-3xl p-6 bg-red-500/5 dark:bg-red-950/10 border border-red-500/20 hover:border-red-500 shadow-sm hover:shadow-red-500/5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-extrabold">SOS Access</span>
              <p className="text-xs text-slate-500 dark:text-red-300/85 mt-2 leading-relaxed">Immediate emergency guide procedures and coordinate tracker.</p>
            </div>
            <span className="material-symbols-outlined text-red-500 text-2xl animate-pulse">emergency</span>
          </div>
          <span className="text-red-500 font-extrabold text-xs uppercase tracking-wider mt-4 flex items-center gap-1.5">
            Launch SOS Dashboard
            <span className="material-symbols-outlined text-xs select-none">arrow_forward</span>
          </span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="relative z-10 mb-10">
        <h3 className="text-lg font-black mb-5 uppercase tracking-widest text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {quickActions.map((act) => (
            <motion.div 
              whileHover={{ y: -5, shadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
              key={act.name} 
              onClick={() => navigate(act.path)}
              className={`glass-card rounded-2xl p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 border-l-4 ${act.color} cursor-pointer transition-all flex flex-col justify-between min-h-[140px]`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`material-symbols-outlined text-2xl ${act.iconColor}`}>{act.icon}</span>
              </div>
              <div className="mt-4">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{act.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{act.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Health Vitals Summary Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Hydration & Sleep info */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black mb-4 uppercase tracking-widest text-slate-400">Daily Wellness Log</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center text-xs"><span className="material-symbols-outlined text-base text-blue-500 mr-2">water_drop</span> Water Intake Target</span>
                <span className="font-extrabold text-sm">{kpis.waterGoal} Liters</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center text-xs"><span className="material-symbols-outlined text-base text-indigo-500 mr-2">bedtime</span> Sleep Target</span>
                <span className="font-extrabold text-sm">{kpis.sleepGoal} Hours</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center text-xs"><span className="material-symbols-outlined text-base text-orange-500 mr-2">psychology</span> Stress Profile</span>
                <span className="font-extrabold text-sm">{profile?.stressLevel || 'Moderate'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/health-assessment')}
            className="w-full mt-6 py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl border border-slate-150 dark:border-slate-800/80 transition-all text-primary dark:text-secondary uppercase tracking-wider"
          >
            Update Logs
          </button>
        </div>

        {/* Existing condition card info */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black mb-1.5 uppercase tracking-widest text-slate-400">Medical Summary</h3>
            <p className="text-[10px] text-slate-400 mb-5">Automatically synced with the AI Assistant for guidance.</p>
            
            <div className="flex flex-wrap gap-2.5 max-h-[120px] overflow-y-auto pr-1">
              {profile?.medicalConditions?.length > 0 && profile.medicalConditions[0] !== 'None' ? (
                profile.medicalConditions.map(c => (
                  <span key={c} className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold border border-primary/10">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-slate-450 dark:text-slate-400 text-xs italic">No pre-existing chronic conditions logged.</span>
              )}
            </div>
          </div>
          
          <span 
            onClick={() => navigate('/profile-setup')}
            className="text-primary hover:underline text-xs font-bold cursor-pointer mt-6 inline-flex items-center gap-1"
          >
            Configure Clinical History
            <span className="material-symbols-outlined text-xs select-none">arrow_forward</span>
          </span>
        </div>

        {/* SVG Graph Card */}
        <div className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-black uppercase tracking-widest text-slate-400">Vitals History</h3>
            <span className="text-[10px] text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Optimal</span>
          </div>
          <div className="h-32 w-full relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
              <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="50" y2="50" className="dark:stroke-slate-800" />
              <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="100" y2="100" className="dark:stroke-slate-800" />
              <line stroke="#f1f5f9" strokeWidth="1.5" x1="0" x2="800" y1="150" y2="150" className="dark:stroke-slate-800" />
              <path d="M0,150 L114,130 L228,160 L342,110 L456,85 L570,120 L684,75 L800,60" fill="none" stroke="url(#dashDGraphGrad)" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M0,150 L114,130 L228,160 L342,110 L456,85 L570,120 L684,75 L800,60 V200 H0 Z" fill="url(#dashDGraphAreaGrad)" opacity="0.15"></path>
              <defs>
                <linearGradient id="dashDGraphGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0052cc" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="dashDGraphAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0052cc" />
                  <stop offset="100%" stopColor="#0052cc" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>

    </div>
  );
}
