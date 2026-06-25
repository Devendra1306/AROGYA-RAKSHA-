import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

// ─── Animated SVG Health Ring ───────────────────────────────────────────────
const HealthRing = ({ score, color }) => (
  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-slate-700" />
    <circle
      cx="18" cy="18" r="15.915"
      fill="none"
      strokeWidth="2.5"
      strokeDasharray={`${score} 100`}
      strokeDashoffset="0"
      strokeLinecap="round"
      className={`transition-all duration-1000 ${color}`}
    />
  </svg>
);

// ─── Toggle Switch ───────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer
      peer-checked:after:translate-x-full peer-checked:after:border-white
      after:content-[''] after:absolute after:top-[2px] after:start-[2px]
      after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4
      after:transition-all peer-checked:bg-primary dark:peer-checked:bg-secondary" />
  </label>
);

// ─── Section Card ────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

// ─── Stat Pill ───────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color = 'text-primary dark:text-secondary' }) => (
  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/40 flex flex-col gap-0.5">
    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{value || '—'}</span>
  </div>
);

// ─── Reminder Row ────────────────────────────────────────────────────────────
const ReminderRow = ({ icon, iconColor, label, subtitle, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

export default function ProfilePage() {
  const { user, profile, logout, sendVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [resendStatus, setResendStatus]     = useState('');
  const [resendError, setResendError]       = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus]     = useState('idle');
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [savedRemedies, setSavedRemedies]   = useState([]);
  const [contacts, setContacts]             = useState([]);
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [activeTab, setActiveTab]           = useState('overview'); // overview | health | saved | settings

  // Reminder toggles
  const [waterReminder, setWaterReminder]   = useState(() => localStorage.getItem('remind_water')  === 'true');
  const [dietReminder, setDietReminder]     = useState(() => localStorage.getItem('remind_diet')   === 'true');
  const [healthReminder, setHealthReminder] = useState(() => localStorage.getItem('remind_health') === 'true');
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [autoSync, setAutoSync]             = useState(true);

  // ── Computed health score ──────────────────────────────────────────────────
  const healthScore = (() => {
    let score = 50;
    if (profile?.weight && profile?.height) score += 10;
    if (profile?.age)                        score += 5;
    if (profile?.bloodGroup)                 score += 5;
    if (profile?.medicalConditions?.length > 0 && profile.medicalConditions[0] !== 'None') score -= 5;
    if (user?.emailVerified)                 score += 15;
    if (waterReminder)                       score += 5;
    if (dietReminder)                        score += 5;
    return Math.min(100, Math.max(0, score));
  })();

  const healthScoreColor =
    healthScore >= 80 ? 'stroke-emerald-500' :
    healthScore >= 60 ? 'stroke-amber-400'   : 'stroke-red-500';

  const healthScoreLabel =
    healthScore >= 80 ? 'Excellent' :
    healthScore >= 60 ? 'Good'      : 'Needs Attention';

  const healthScoreTextColor =
    healthScore >= 80 ? 'text-emerald-500' :
    healthScore >= 60 ? 'text-amber-400'   : 'text-red-500';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleReminder = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val.toString());
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

  const handleDownloadReport = () => {
    setDownloadStatus('generating');
    setTimeout(() => {
      setDownloadStatus('ready');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    setDeleteStatus('deleting');
    try {
      await api.delete('/auth/profile/delete');
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Delete account failed', err);
      setDeleteStatus('error');
      alert('Failed to delete account. Please try again later.');
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    setResendError('');
    try {
      await sendVerification();
      setResendStatus('success');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (err) {
      setResendError(err.message || 'Failed to resend verification email.');
      setResendStatus('error');
    }
  };

  const handleRefreshVerification = async () => {
    setResendStatus('refreshing');
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        await refreshProfile();
      }
      setResendStatus('');
    } catch { setResendStatus(''); }
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const meds = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
    const rems = JSON.parse(localStorage.getItem('saved_remedies')  || '[]');
    setSavedMedicines(meds);
    setSavedRemedies(rems);

    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.get('/emergency/emergency-contact');
          setContacts(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch emergency contacts:', err.message);
      }
    };
    fetchContacts();
  }, []);

  // ── Shared data ────────────────────────────────────────────────────────────
  const displayContacts = contacts.length > 0 ? contacts : [
    { name: 'Priya Sharma',     phone: '+91 98765 43210', relationship: 'Spouse'           },
    { name: 'Dr. Ramesh Verma', phone: '+91 98234 56789', relationship: 'Family Physician' },
  ];

  const userInitials =
    (user?.firstName ? user.firstName[0].toUpperCase() : '') +
    (user?.lastName  ? user.lastName[0].toUpperCase()  : '');

  const healthId = profile?.healthId || `AR-${user?.email?.split('@')[0]?.toUpperCase() || '9844'}-2026`;

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: 'person'    },
    { id: 'health',    label: 'Health',    icon: 'favorite'  },
    { id: 'saved',     label: 'Saved',     icon: 'bookmark'  },
    { id: 'settings',  label: 'Settings',  icon: 'settings'  },
  ];

  // ── Delete Confirm Modal ───────────────────────────────────────────────────
  const DeleteModal = () => (
    <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-100 dark:border-red-900/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-slate-800 dark:text-white">Delete Account?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
              This action will permanently remove your account and all associated data. This cannot be undone.
            </p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleDeleteAccount} disabled={deleteStatus === 'deleting'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all">
                {deleteStatus === 'deleting' ? 'Deleting…' : 'Yes, Delete My Account'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteStatus === 'deleting'}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl transition-all">
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Verification Banner ────────────────────────────────────────────────────
  const VerificationBanner = () => user && !user.emailVerified ? (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">mark_email_unread</span>
        <div>
          <p className="font-extrabold text-sm">Verify Your Email Address</p>
          <p className="opacity-90 mt-0.5">Please verify your email to unlock all features.</p>
          {resendStatus === 'success' && <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">Verification email sent!</p>}
          {resendStatus === 'error'   && <p className="text-red-500 font-bold mt-1">{resendError}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button onClick={handleResendVerification} disabled={resendStatus === 'sending'}
          className="bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all text-[11px]">
          {resendStatus === 'sending' ? 'Sending…' : 'Resend Email'}
        </button>
        <button onClick={handleRefreshVerification}
          className="border border-amber-400 dark:border-amber-800 font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all text-[11px]">
          Check Status
        </button>
      </div>
    </motion.div>
  ) : null;

  // ── Profile Header Card ────────────────────────────────────────────────────
  const ProfileHeader = () => (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary/15 dark:ring-secondary/15 shadow-md">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 text-white font-extrabold flex items-center justify-center text-2xl">
                {userInitials}
              </div>
            )}
          </div>
          <button onClick={() => navigate('/profile-setup')}
            className="absolute -bottom-1.5 -right-1.5 bg-primary text-white p-1.5 rounded-lg shadow-lg hover:bg-primary/90 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">{user?.firstName} {user?.lastName}</h2>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{healthId}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="material-symbols-outlined text-[10px]">verified_user</span> Active Member
            </span>
            {user?.emailVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <span className="material-symbols-outlined text-[10px]">check_circle</span> Verified
              </span>
            )}
          </div>
        </div>

        {/* Health score mini ring */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <div className="relative w-14 h-14">
            <HealthRing score={healthScore} color={healthScoreColor} />
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${healthScoreTextColor}`}>{healthScore}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">{healthScoreLabel}</span>
        </div>
      </div>

      {/* Quick vitals row */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/40">
        <StatPill label="Age"    value={profile?.age    ? `${profile.age} yrs`    : '—'} />
        <StatPill label="Blood"  value={profile?.bloodGroup || '—'} color="text-red-500" />
        <StatPill label="Weight" value={profile?.weight ? `${profile.weight} kg`  : '—'} />
        <StatPill label="Height" value={profile?.height ? `${profile.height} cm`  : '—'} />
      </div>
    </Card>
  );

  // ── Tab Navigation ─────────────────────────────────────────────────────────
  const TabNav = () => (
    <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1 mb-4 gap-1">
      {TABS.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[10px] font-bold transition-all gap-0.5
            ${activeTab === t.id
              ? 'bg-white dark:bg-slate-700 text-primary dark:text-secondary shadow-sm'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <span className="material-symbols-outlined text-base">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );

  // ── TAB: Overview ──────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div className="space-y-4">
      {/* Emergency Contacts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-red-500">emergency</span>
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Emergency Contacts</h3>
          </div>
          <button onClick={() => navigate('/emergency')}
            className="text-[10px] font-bold text-primary dark:text-secondary hover:underline">Manage</button>
        </div>
        <div className="space-y-2.5">
          {displayContacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-bold flex items-center justify-center text-sm">
                  {c.name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-800 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.relationship} · {c.phone}</p>
                </div>
              </div>
              <a href={`tel:${c.phone}`}
                className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-90 transition-all shadow-sm">
                <span className="material-symbols-outlined text-sm">call</span>
              </a>
            </div>
          ))}
        </div>
      </Card>

      {/* Medical History */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-violet-500">history_edu</span>
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Medical History</h3>
          </div>
          <button className="text-[10px] font-bold text-primary dark:text-secondary hover:underline">View All</button>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: 'history_edu',  bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-500', title: 'Annual Health Checkup',    date: 'Oct 12, 2023', desc: 'Normal cardiovascular screening, Vitamin D deficiency noted.' },
            { icon: 'vaccines',     bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-500',    title: 'Influenza Vaccination',      date: 'Sep 05, 2023', desc: 'Quadrivalent vaccine administered at City Clinic.' },
            { icon: 'heart_check',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500', title: 'Hypertension Follow-up',    date: 'Jun 22, 2023', desc: 'BP reading: 128/82. Medication dosage adjusted.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700/40">
              <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.text} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.title}</h4>
                  <span className="text-[9px] text-slate-400 shrink-0">{item.date}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Download Report */}
      <button onClick={handleDownloadReport}
        className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm
          ${downloadStatus === 'ready' ? 'bg-emerald-600 text-white' : 'bg-primary text-white hover:bg-primary/90 active:scale-98'}`}>
        <span className={`material-symbols-outlined text-lg ${downloadStatus === 'generating' ? 'animate-spin' : ''}`}>
          {downloadStatus === 'generating' ? 'sync' : downloadStatus === 'ready' ? 'check_circle' : 'download'}
        </span>
        {downloadStatus === 'generating' ? 'Generating Report…' : downloadStatus === 'ready' ? 'Ready — Download Now' : 'Download Health Report'}
      </button>
    </div>
  );

  // ── TAB: Health ────────────────────────────────────────────────────────────
  const HealthTab = () => (
    <div className="space-y-4">
      {/* Health score full card */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-emerald-500">favorite</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Overall Wellness Score</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 shrink-0">
            <HealthRing score={healthScore} color={healthScoreColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black ${healthScoreTextColor}`}>{healthScore}</span>
              <span className="text-[9px] text-slate-400 font-semibold">/ 100</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className={`text-lg font-black ${healthScoreTextColor}`}>{healthScoreLabel}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {healthScore >= 80 ? 'Excellent! Your health profile looks great. Keep it up!' :
                 healthScore >= 60 ? 'Good progress. Complete your vitals profile to improve.' :
                 'Please fill your vitals and enable reminders to boost your score.'}
              </p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Vitals Complete',    done: !!(profile?.weight && profile?.height) },
                { label: 'Email Verified',      done: !!user?.emailVerified },
                { label: 'Reminders Active',    done: waterReminder || dietReminder || healthReminder },
                { label: 'Blood Group Set',     done: !!profile?.bloodGroup },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${item.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {item.done ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className={`text-xs ${item.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Medical Summary */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-primary">stethoscope</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Medical Summary</h3>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Target Duration',    value: profile?.targetDuration || '3 Months' },
            { label: 'Weight / Height',    value: `${profile?.weight || '—'} kg / ${profile?.height || '—'} cm` },
            { label: 'Age',                value: profile?.age ? `${profile.age} years` : '—' },
            { label: 'Blood Group',        value: profile?.bloodGroup || '—' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
              <span className="text-xs text-slate-500">{row.label}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{row.value}</span>
            </div>
          ))}
        </div>
        {/* Conditions */}
        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/30">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Conditions & Allergies</p>
          <div className="flex flex-wrap gap-1.5">
            {profile?.medicalConditions?.length > 0 && profile.medicalConditions[0] !== 'None' ? (
              profile.medicalConditions.map(c => (
                <span key={c} className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{c}</span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No logged conditions.</span>
            )}
          </div>
        </div>
      </Card>

      {/* Stored Prescriptions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-blue-500">description</span>
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">Stored Prescriptions</h3>
          </div>
          <button onClick={() => alert('Upload feature coming soon!')}
            className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Chronic HTN',     sub: 'Dr. Verma · Jan 2024',    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv8T7recQCqseffAtgi4W3U1icMA8qPYv9D7ohyVoule2UWXw7cq1WZSw-2k2Eh8DH0tAqsycucN749--ktAfhWucQJD6LtJJgADPfwcQFY2Xv2OjAD3o9CJt1SJi9vM4F4jV4uik7Gmd5jHKNredJUEyalcQ-w7l-WnOhd0ddx-OuA8Pz0lI1tLRFYPBQoDEUM5-pNNI4i2J_gtK8u80YxChDtfgvh-fxMZxUrXa3-EtD4PmqdYZvRbSSkbm-Nnn73EGccT6fBcSf' },
            { label: 'Seasonal Allergy', sub: 'City Care · Sep 2023',   src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvprBo1O5l-roKVrVf94Qupw5LZmb9M6QFE6-eyj--MxsM9EZ2_Naz270oh7YKHyWGC19b9fVTDz85AH5QUwAuUfXtUdaiQ6XNJht_mml-U6XppZvUnfbWg7ASNKdHEsSiMMfh8DjTDKvUq7JwS0rsnhpV3D1Y-hv8v14mcbFGSKctO0sm25jayquskI9ssRUecVitdqvdKGn0hm2-AzHVDKIlc-bQZay2A_PFVcO0Cz3qS5yecYCJHC7mMFq24iDjev3G6jWZZUkq' },
          ].map((p, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/40 cursor-pointer group">
              <img src={p.src} alt={p.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex flex-col justify-end p-3">
                <p className="text-white text-xs font-bold">{p.label}</p>
                <p className="text-slate-300 text-[9px]">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => alert('Upload feature coming soon!')}
          className="mt-4 w-full py-3 bg-slate-50 dark:bg-slate-900/60 text-primary dark:text-secondary font-bold rounded-2xl border border-slate-100 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs">
          Upload New Prescription
        </button>
      </Card>
    </div>
  );

  // ── TAB: Saved ─────────────────────────────────────────────────────────────
  const SavedTab = () => (
    <div className="space-y-4">
      {/* Saved Medicines */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-primary">pill</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Saved Medicines ({savedMedicines.length})</h3>
        </div>
        {savedMedicines.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {savedMedicines.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/30 rounded-2xl">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate text-slate-800 dark:text-white">{m.name}</h4>
                  <p className="text-[10px] text-slate-400">{m.category || 'General'}</p>
                </div>
                <button onClick={() => removeMedicine(m.id)}
                  className="text-slate-300 hover:text-red-500 ml-2 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">pill</span>
            <p className="text-sm text-slate-400 font-semibold">No saved medicines</p>
            <p className="text-xs text-slate-400">Search and bookmark them in the Medicines page.</p>
            <button onClick={() => navigate('/medicine-info')}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
              Browse Medicines
            </button>
          </div>
        )}
      </Card>

      {/* Saved Remedies */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-emerald-500">eco</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Saved Remedies ({savedRemedies.length})</h3>
        </div>
        {savedRemedies.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {savedRemedies.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/30 rounded-2xl">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate text-slate-800 dark:text-white">{r.title}</h4>
                  <p className="text-[10px] text-slate-400">For: {r.condition || 'General'}</p>
                </div>
                <button onClick={() => removeRemedy(r.id)}
                  className="text-slate-300 hover:text-red-500 ml-2 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">eco</span>
            <p className="text-sm text-slate-400 font-semibold">No saved remedies</p>
            <p className="text-xs text-slate-400">Browse and save them in the Home Remedies page.</p>
            <button onClick={() => navigate('/home-remedies')}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
              Browse Remedies
            </button>
          </div>
        )}
      </Card>
    </div>
  );

  // ── TAB: Settings ──────────────────────────────────────────────────────────
  const SettingsTab = () => (
    <div className="space-y-4">
      {/* Health Reminders */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-indigo-500">notifications</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Health Reminders</h3>
        </div>
        <ReminderRow icon="water_drop" iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-500"
          label="Water Tracker" subtitle="Remind me every 2 hours"
          checked={waterReminder} onChange={e => toggleReminder('remind_water', e.target.checked, setWaterReminder)} />
        <ReminderRow icon="restaurant" iconColor="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"
          label="Diet Log Check" subtitle="Log meals at breakfast, lunch & dinner"
          checked={dietReminder} onChange={e => toggleReminder('remind_diet', e.target.checked, setDietReminder)} />
        <ReminderRow icon="analytics" iconColor="bg-violet-50 dark:bg-violet-900/20 text-violet-500"
          label="Wellness Assessment" subtitle="Weekly health check-ins"
          checked={healthReminder} onChange={e => toggleReminder('remind_health', e.target.checked, setHealthReminder)} />
      </Card>

      {/* Privacy & Security */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-slate-500">security</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Privacy & Security</h3>
        </div>
        <ReminderRow icon="fingerprint" iconColor="bg-slate-50 dark:bg-slate-800 text-slate-500"
          label="Biometric Login" subtitle="Use fingerprint or face ID"
          checked={biometricLogin} onChange={e => setBiometricLogin(e.target.checked)} />
        <ReminderRow icon="cloud_sync" iconColor="bg-slate-50 dark:bg-slate-800 text-slate-500"
          label="Auto-Sync Records" subtitle="Keep data synced across devices"
          checked={autoSync} onChange={e => setAutoSync(e.target.checked)} />
        <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">lock</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Two-Factor Auth</p>
              <p className="text-[10px] text-slate-400">Add an extra layer of security</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-lg">chevron_right</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">translate</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Language</p>
              <p className="text-[10px] text-slate-400">Display & content language</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary dark:text-secondary">English (US)</span>
        </div>
      </Card>

      {/* Profile Actions */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-slate-500">manage_accounts</span>
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">Account</h3>
        </div>
        <div className="space-y-2.5">
          <button onClick={() => navigate('/profile-setup')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base text-slate-400">edit</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Edit Profile Setup</span>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
          </button>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <span className="material-symbols-outlined text-base text-slate-500">logout</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Log Out</span>
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 border border-red-100 dark:border-red-900/30 transition-all">
            <span className="material-symbols-outlined text-base text-red-500">delete_forever</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</span>
          </button>
        </div>
      </Card>
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <SEO 
        title="User Profile | Arogya Raksha"
        description="Manage your medical profile and health records."
        robots="noindex, nofollow"
        canonical="https://arogyaraksha.com/profile"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-2xl mx-auto px-4 pt-20 pb-28 text-slate-800 dark:text-slate-100"
      >
        {/* Page heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">My Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your health identity and preferences</p>
        </div>

        <VerificationBanner />
        <ProfileHeader />
        <TabNav />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview'  && <OverviewTab  />}
            {activeTab === 'health'    && <HealthTab    />}
            {activeTab === 'saved'     && <SavedTab     />}
            {activeTab === 'settings'  && <SettingsTab  />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <DeleteModal />
    </>
  );
}
