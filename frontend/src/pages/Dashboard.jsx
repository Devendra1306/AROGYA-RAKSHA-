import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

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

  useEffect(() => {
    if (profile) {
      const heightM = profile.height / 100;
      const bmi = Number((profile.weight / (heightM * heightM)).toFixed(1));
      setKpis({
        healthScore: profile.healthScore || 70,
        bmi,
        dietGoal: profile.healthGoal || 'Healthy Lifestyle',
        waterGoal: profile.waterIntake || 3,
        sleepGoal: profile.sleepDuration || 7
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

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md">
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
