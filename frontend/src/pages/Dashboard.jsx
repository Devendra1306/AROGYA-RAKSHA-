import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

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

  useEffect(() => {
    if (profile) {
      const heightM = profile.height / 100;
      const bmi = Number((profile.weight / (heightM * heightM)).toFixed(1));
      setKpis({
        healthScore: profile.healthScore || 78,
        bmi,
        dietGoal: profile.healthGoal || 'Healthy Lifestyle',
        waterGoal: profile.waterIntake || 3,
        sleepGoal: profile.sleepDuration || 7.5,
        heartRate: 72,
        bloodPressure: '118/76',
        steps: 8432
      });
    }
  }, [profile]);

  const quickActions = [
    { name: 'Medical Assistant', desc: 'Symptom checker & chat', icon: '🩺', path: '/medical-assistant', color: 'border-l-primary' },
    { name: 'Health Assessment', desc: 'Wellness check & report', icon: '📊', path: '/health-assessment', color: 'border-l-secondary' },
    { name: 'Diet Planner', desc: 'Daily calories & grocery', icon: '🥗', path: '/diet-planner', color: 'border-l-emerald-500' },
    { name: 'Search Medicine', desc: 'Interactions & warnings', icon: '💊', path: '/medicine-info', color: 'border-l-indigo-500' },
    { name: 'Home Remedies', desc: 'Kitchen remedies finder', icon: '🏠', path: '/home-remedies', color: 'border-l-orange-500' }
  ];

  if (isMobile) {
    // Mobile View following mobile.zip (health_assessment/code.html)
    return (
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen pb-12 font-body-md animate-fade-in">
        
        {/* Welcome Section */}
        <section className="px-4 pt-6 pb-4">
          <h2 className="text-xl font-extrabold text-primary dark:text-secondary">Hello, {user?.firstName}</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Welcome to your health dashboard</p>
        </section>

        {/* Start Assessment CTA */}
        <div className="px-4 mb-5">
          <button 
            onClick={() => navigate('/health-assessment')}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-98 transition-transform"
          >
            <span>▶</span> Start Assessment
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="px-4 space-y-4">
          
          {/* Daily Health Score Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-150 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider self-start">DAILY HEALTH SCORE</h3>
            
            <div className="relative w-36 h-36 flex items-center justify-center mt-3">
              {/* Conic Gradient Circle */}
              <div 
                className="w-full h-full absolute rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, #002045 0% ${kpis.healthScore}%, #e2e8f0 ${kpis.healthScore}% 100%)`
                }}
              ></div>
              <div className="absolute w-[86%] h-[86%] bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-primary dark:text-secondary">{kpis.healthScore}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Optimal</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 w-full text-xs">
              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg text-center">
                <p className="text-slate-400 font-bold text-[9px] uppercase">Yesterday</p>
                <p className="text-primary dark:text-secondary font-extrabold mt-0.5">72</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg text-center border-l-2 border-primary">
                <p className="text-slate-400 font-bold text-[9px] uppercase">Goal</p>
                <p className="text-primary dark:text-secondary font-extrabold mt-0.5">85</p>
              </div>
            </div>
          </div>

          {/* Quick Health Actions Slider */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider pl-1">Quick Actions</h3>
            <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-thin hide-scrollbar">
              {quickActions.map((act) => (
                <div 
                  key={act.name}
                  onClick={() => navigate(act.path)}
                  className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-150 shadow-xs flex items-center gap-3 shrink-0 w-44 cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{act.icon}</span>
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-white truncate">{act.name}</h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Heart Rate */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Heart Rate</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-primary dark:text-secondary">{kpis.heartRate}</span>
                  <span className="text-[9px] text-slate-400 font-bold">BPM</span>
                </div>
              </div>
              <div className="mt-3 h-10 w-full">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,30 Q10,10 20,25 T40,15 T60,35 T80,20 T100,28" fill="none" stroke="#e53e3e" strokeWidth="2"></path>
                </svg>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Blood Pressure</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-primary dark:text-secondary">{kpis.bloodPressure}</span>
                  <span className="text-[9px] text-slate-400 font-bold">mmHg</span>
                </div>
              </div>
              <div className="mt-3 h-10 w-full">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0,20 L15,22 L30,18 L45,21 L60,19 L75,20 L90,17 L100,18" fill="none" stroke="#002045" strokeWidth="2"></path>
                </svg>
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Sleep Quality</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-primary dark:text-secondary">{kpis.sleepGoal}</span>
                  <span className="text-[9px] text-slate-400 font-bold">Hours</span>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5 h-6 items-end">
                <div className="flex-1 bg-primary h-[40%] rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-[60%] rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-[80%] rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-[30%] rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-[90%] rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-[100%] rounded-t-sm"></div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Daily Steps</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-primary dark:text-secondary">8,432</span>
                  <span className="text-[9px] text-slate-400 font-bold">Steps</span>
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[84%] rounded-full"></div>
              </div>
            </div>

          </div>

          {/* Weekly Vital Trends */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Vital Trends</h3>
            <div className="h-32 w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                <path d="M0,150 L100,130 L200,160 L300,110 L400,90 L500,120 L600,80 L700,100 L800,70" fill="none" stroke="#1a365d" strokeLinecap="round" strokeWidth="4"></path>
                <path d="M0,150 L100,130 L200,160 L300,110 L400,90 L500,120 L600,80 L700,100 L800,70 V200 H0 Z" fill="#1a365d" opacity="0.05"></path>
              </svg>
              <div className="flex justify-between mt-2 text-[9px] text-slate-400 font-bold">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          {/* Health Recommendation Card */}
          <div className="bg-slate-100/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-150/40 flex gap-4 items-center">
            <div className="w-14 h-14 bg-secondary-container rounded-lg flex items-center justify-center shrink-0 text-xl shadow-xs">
              🧘
            </div>
            <div className="overflow-hidden">
              <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/15 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">Activity Advice</span>
              <h4 className="font-extrabold text-[11px] text-primary dark:text-secondary mt-1.5">Evening Stretching Session</h4>
              <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-350 mt-0.5">Based on elevated tension markers today, a 15-minute stretching routine is suggested.</p>
            </div>
          </div>

          {/* Sync Status Card */}
          <div className="bg-primary text-white p-5 rounded-xl relative overflow-hidden shadow">
            <div className="relative z-10 text-xs">
              <h3 className="font-extrabold text-sm mb-0.5">Device Connected</h3>
              <p className="opacity-75 text-[10px]">Last synced: 4 minutes ago</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-lg">⌚</span>
                <span className="font-bold text-[9px] uppercase tracking-wider">Garmin Wearable Active</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
          </div>

        </div>
      </div>
    );
  }

  // Desktop View (Original rich Dashboard)
  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="mb-stack-md flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-secondary">Hello, {user?.firstName}</h1>
          <p className="text-on-surface-variant dark:text-slate-300">Welcome to your personal health dashboard.</p>
        </div>
        <button 
          onClick={() => navigate('/profile-setup')}
          className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-label-md font-bold transition-all"
        >
          ✏️ Edit Profile
        </button>
      </header>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        {/* Health Score */}
        <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-label-sm uppercase tracking-wider text-outline">Health Score</span>
            <h2 className="text-4xl font-bold text-primary dark:text-secondary mt-2">{kpis.healthScore}/100</h2>
          </div>
          <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${kpis.healthScore}%` }}></div>
          </div>
        </div>

        {/* BMI */}
        <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm">
          <span className="text-label-sm uppercase tracking-wider text-outline">Body Mass Index (BMI)</span>
          <h2 className="text-4xl font-bold mt-2">{kpis.bmi}</h2>
          <span className="text-label-sm text-secondary font-semibold mt-2 inline-block">
            {kpis.bmi < 18.5 ? 'Underweight' : kpis.bmi > 25 ? 'Overweight' : 'Healthy Range'}
          </span>
        </div>

        {/* Diet & Goals */}
        <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm">
          <span className="text-label-sm uppercase tracking-wider text-outline">Primary Health Goal</span>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">{kpis.dietGoal}</h2>
          <span className="text-label-sm text-outline mt-2 block">Target active: {profile?.targetDuration || '3 Months'}</span>
        </div>

        {/* SOS Emergency Help */}
        <div className="glass-card rounded-2xl p-6 bg-red-50 dark:bg-red-950/30 border border-red-200/50 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/emergency')}>
          <div>
            <span className="text-label-sm uppercase tracking-wider text-red-600 dark:text-red-400 font-bold">SOS Emergency Access</span>
            <p className="text-label-md text-red-700 dark:text-red-300 mt-2">Get immediate first-aid instructions and share live coordinates.</p>
          </div>
          <span className="text-red-600 font-bold text-label-md mt-4 inline-flex items-center gap-1 hover:underline">
            Launch SOS Guides 🚨
          </span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h3 className="text-xl font-bold mb-4">Quick Health Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base mb-stack-md">
        {quickActions.map((act) => (
          <div 
            key={act.name} 
            onClick={() => navigate(act.path)}
            className={`glass-card rounded-2xl p-5 bg-white/80 dark:bg-slate-800/80 border-l-4 ${act.color} cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-between`}
          >
            <div>
              <h4 className="font-bold text-lg">{act.name}</h4>
              <p className="text-label-md text-on-surface-variant dark:text-slate-400 mt-1">{act.desc}</p>
            </div>
            <span className="text-3xl">{act.icon}</span>
          </div>
        ))}
      </div>

      {/* Health Vitals Summary Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Hydration & Sleep info */}
        <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Daily Wellness Log</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>💧 Water Intake Target</span>
              <span className="font-bold">{kpis.waterGoal} Liters</span>
            </div>
            <div className="flex justify-between items-center">
              <span>😴 Sleep Target</span>
              <span className="font-bold">{kpis.sleepGoal} Hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span>🧠 Stress Profile</span>
              <span className="font-bold">{profile?.stressLevel || 'Moderate'}</span>
            </div>
          </div>
        </div>

        {/* Existing condition card info */}
        <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Medical Profile Summary</h3>
            <p className="text-label-sm text-outline mb-4">Automatically synced to the AI assistant for customized guidance.</p>
            
            <div className="flex flex-wrap gap-2">
              {profile?.medicalConditions?.length > 0 && profile.medicalConditions[0] !== 'None' ? (
                profile.medicalConditions.map(c => (
                  <span key={c} className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-3 py-1 rounded-full text-label-sm font-bold">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-on-surface-variant dark:text-slate-400 text-label-md italic">No existing chronic conditions logged.</span>
              )}
            </div>
          </div>
          <span 
            onClick={() => navigate('/profile-setup')}
            className="text-primary hover:underline text-label-sm font-bold cursor-pointer mt-4 block"
          >
            Update conditions list →
          </span>
        </div>
      </div>
    </div>
  );
}
