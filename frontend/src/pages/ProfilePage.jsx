import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [savedMedicines, setSavedMedicines] = useState([]);
  const [savedRemedies, setSavedRemedies] = useState([]);

  // Local reminders toggles
  const [waterReminder, setWaterReminder] = useState(() => localStorage.getItem('remind_water') === 'true');
  const [dietReminder, setDietReminder] = useState(() => localStorage.getItem('remind_diet') === 'true');
  const [healthReminder, setHealthReminder] = useState(() => localStorage.getItem('remind_health') === 'true');

  useEffect(() => {
    // Read saved items from localStorage
    const meds = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
    const rems = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
    setSavedMedicines(meds);
    setSavedRemedies(rems);
  }, []);

  const handleToggleWater = (e) => {
    const val = e.target.checked;
    setWaterReminder(val);
    localStorage.setItem('remind_water', val);
    if (val && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const handleToggleDiet = (e) => {
    const val = e.target.checked;
    setDietReminder(val);
    localStorage.setItem('remind_diet', val);
    if (val && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const handleToggleHealth = (e) => {
    const val = e.target.checked;
    setHealthReminder(val);
    localStorage.setItem('remind_health', val);
    if (val && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const removeMedicine = (id) => {
    const updated = savedMedicines.filter(m => m.id !== id);
    setSavedMedicines(updated);
    localStorage.setItem('saved_medicines', JSON.stringify(updated));
  };

  const removeRemedy = (id) => {
    const updated = savedRemedies.filter(r => r.id !== id);
    setSavedRemedies(updated);
    localStorage.setItem('saved_remedies', JSON.stringify(updated));
  };

  const healthScore = profile?.healthScore || 70;
  const healthScoreColor = healthScore >= 80 ? 'text-emerald-500 stroke-emerald-500' : healthScore >= 60 ? 'text-amber-500 stroke-amber-500' : 'text-red-500 stroke-red-500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-[600px] mx-auto px-4 pt-20 pb-28 text-slate-800 dark:text-slate-100"
    >
      {/* Profile Header */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6 flex items-center gap-4">
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.firstName} 
            className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20 dark:ring-secondary/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary font-extrabold flex items-center justify-center text-xl ring-4 ring-primary/10 dark:ring-secondary/10">
            {(user?.firstName ? user.firstName[0].toUpperCase() : '') + (user?.lastName ? user.lastName[0].toUpperCase() : '')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{user?.firstName} {user?.lastName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
          <span className="inline-block bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2">
            👤 Active Member
          </span>
        </div>
        <button 
          onClick={() => navigate('/profile-setup')}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 p-2.5 rounded-2xl transition-all"
          title="Edit Profile Settings"
        >
          ✏️
        </button>
      </section>

      {/* Health Score Ring Card */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Health Score</h3>
          <p className="text-2xl font-black">Overall Wellness</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            {healthScore >= 80 ? 'Excellent! Keep maintaining your good habits.' : healthScore >= 60 ? 'Good progress. Try checking in on your sleep logs.' : 'Attention needed. Fill your vitals assessment.'}
          </p>
        </div>
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-slate-700" />
            <circle 
              cx="18" 
              cy="18" 
              r="15.915" 
              fill="none" 
              strokeWidth="2.5" 
              strokeDasharray={`${healthScore} 100`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className={`transition-all duration-700 ${healthScoreColor}`}
            />
          </svg>
          <span className="absolute text-lg font-black">{healthScore}%</span>
        </div>
      </section>

      {/* Medical Profile Summary */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6">
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5">🩺 Medical Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500">Target Duration</span>
            <span className="font-semibold">{profile?.targetDuration || '3 Months'}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500">Weight & Height</span>
            <span className="font-semibold">{profile?.weight || 'N/A'} kg / {profile?.height || 'N/A'} cm</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-2 mt-1">Medical Conditions & Allergies</span>
            <div className="flex flex-wrap gap-1.5">
              {profile?.medicalConditions?.length > 0 && profile.medicalConditions[0] !== 'None' ? (
                profile.medicalConditions.map(c => (
                  <span key={c} className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No logged conditions.</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Saved Medicines */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6">
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5">💊 Saved Medicines ({savedMedicines.length})</h3>
        {savedMedicines.length > 0 ? (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {savedMedicines.map(m => (
              <div key={m.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">{m.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{m.category || 'General'}</p>
                </div>
                <button 
                  onClick={() => removeMedicine(m.id)}
                  className="text-xs hover:text-red-500 p-1 ml-2 text-slate-400"
                  title="Remove bookmark"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No saved medicines. Search and save them in the Medicines page.</p>
        )}
      </section>

      {/* Saved Remedies */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6">
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5">🏠 Saved Remedies ({savedRemedies.length})</h3>
        {savedRemedies.length > 0 ? (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {savedRemedies.map(r => (
              <div key={r.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">{r.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">For: {r.condition || 'General'}</p>
                </div>
                <button 
                  onClick={() => removeRemedy(r.id)}
                  className="text-xs hover:text-red-500 p-1 ml-2 text-slate-400"
                  title="Remove bookmark"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No saved remedies. Browse and save them in the Remedies page.</p>
        )}
      </section>

      {/* Settings & Reminder Notifications */}
      <section className="glass-card rounded-3xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-sm border border-slate-200/50 dark:border-slate-700/50 mb-6">
        <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">⚙️ Health Alert Reminders</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-bold block">💧 Water Intakes alert</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Remind me to log hydration every 2 hours</span>
            </div>
            <input 
              type="checkbox" 
              checked={waterReminder}
              onChange={handleToggleWater}
              className="w-10 h-5 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all outline-none"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-bold block">🥗 Diet Intake Check</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Remind me to log meals during breakfast, lunch, and dinner</span>
            </div>
            <input 
              type="checkbox" 
              checked={dietReminder}
              onChange={handleToggleDiet}
              className="w-10 h-5 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all outline-none"
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-bold block">📊 Wellness Checkup Logs</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Remind me to take assessment weekly</span>
            </div>
            <input 
              type="checkbox" 
              checked={healthReminder}
              onChange={handleToggleHealth}
              className="w-10 h-5 bg-slate-200 checked:bg-primary rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-5 transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* Log Out */}
      <button 
        onClick={() => {
          logout();
          navigate('/');
        }}
        className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/40 py-3.5 rounded-2xl hover:bg-red-100 dark:hover:bg-red-950/45 transition-all text-sm flex items-center justify-center gap-2"
      >
        🚪 Log Out Account
      </button>
    </motion.div>
  );
}
