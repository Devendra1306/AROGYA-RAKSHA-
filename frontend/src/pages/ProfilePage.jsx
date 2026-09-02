import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

// ─── Animated SVG Health Ring ───────────────────────────────────────────────
const HealthRing = ({ score, color }) => (
  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-slate-800" />
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
      after:transition-all peer-checked:bg-[#0052CC] dark:peer-checked:bg-[#10B981]" />
  </label>
);

// ─── Section Card ────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// ─── Stat Pill ───────────────────────────────────────────────────────────────
const StatPill = ({ label, value, sub, color = 'text-[#0052CC] dark:text-[#10B981]' }) => (
  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-150 dark:border-slate-800 flex flex-col gap-0.5">
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black truncate ${color}`}>{value || '—'}</span>
    {sub && <span className="text-[9px] text-slate-400">{sub}</span>}
  </div>
);

export default function ProfilePage() {
  const { user, profile, logout, sendVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview'); // overview | health | saved | settings
  const [resendStatus, setResendStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('idle');

  // Real Stored Data
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [savedRemedies, setSavedRemedies] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Modals
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRel, setContactRel] = useState('Family');

  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [rxTitle, setRxTitle] = useState('');
  const [rxDoctor, setRxDoctor] = useState('');
  const [rxNotes, setRxNotes] = useState('');

  // Reminders
  const [waterReminder, setWaterReminder] = useState(() => localStorage.getItem('remind_water') === 'true');
  const [healthReminder, setHealthReminder] = useState(() => localStorage.getItem('remind_health') === 'true');

  // ── Load Real Data on Mount ────────────────────────────────────────────────
  useEffect(() => {
    // 1. Saved Medicines
    try {
      const meds = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
      setSavedMedicines(meds);
    } catch (e) {}

    // 2. Saved Remedies
    try {
      const rems = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
      setSavedRemedies(rems);
    } catch (e) {}

    // 3. Emergency Contacts (Merge profile contact + local emergency contacts)
    try {
      const stored = JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
      let combined = [...stored];
      if (profile?.emergencyContactName && profile?.emergencyContactPhone) {
        if (!combined.some(c => c.phone === profile.emergencyContactPhone)) {
          combined.unshift({
            name: profile.emergencyContactName,
            phone: profile.emergencyContactPhone,
            relationship: profile.emergencyContactRelationship || 'Family'
          });
        }
      }
      setEmergencyContacts(combined);
    } catch (e) {}

    // 4. Prescriptions
    try {
      const rxs = JSON.parse(localStorage.getItem('user_prescriptions') || '[]');
      setPrescriptions(rxs);
    } catch (e) {}

    // 5. Assessments History from backend
    api.get('/assessment/history')
      .then(res => {
        if (Array.isArray(res.data)) setAssessments(res.data);
      })
      .catch(() => {});
  }, [profile]);

  // ── Live Calculated BMI ────────────────────────────────────────────────────
  const bmiData = (() => {
    const h = parseFloat(profile?.height);
    const w = parseFloat(profile?.weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const heightM = h / 100;
    const val = parseFloat((w / (heightM * heightM)).toFixed(1));

    let cat = 'Normal weight';
    let color = 'text-emerald-500';
    if (val < 18.5) { cat = 'Underweight'; color = 'text-amber-500'; }
    else if (val >= 25 && val < 30) { cat = 'Overweight'; color = 'text-orange-500'; }
    else if (val >= 30) { cat = 'Obese'; color = 'text-red-500'; }

    return { val, cat, color };
  })();

  // ── Dynamic Real Health Score ──────────────────────────────────────────────
  const healthScore = (() => {
    if (profile?.healthScore) return profile.healthScore;
    let score = 55;
    if (profile?.weight && profile?.height) score += 15;
    if (profile?.age) score += 5;
    if (profile?.bloodGroup) score += 5;
    if (user?.emailVerified) score += 10;
    if (emergencyContacts.length > 0) score += 10;
    return Math.min(100, Math.max(0, score));
  })();

  const healthScoreColor =
    healthScore >= 80 ? 'stroke-emerald-500' :
    healthScore >= 60 ? 'stroke-amber-400' : 'stroke-red-500';

  const healthScoreLabel =
    healthScore >= 80 ? 'Optimal Wellness' :
    healthScore >= 60 ? 'Good Standing' : 'Needs Vitals';

  const healthScoreTextColor =
    healthScore >= 80 ? 'text-emerald-500' :
    healthScore >= 60 ? 'text-amber-400' : 'text-red-500';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddContact = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    const newContact = { name: contactName.trim(), phone: contactPhone.trim(), relationship: contactRel };
    const updated = [newContact, ...emergencyContacts.filter(c => c.phone !== newContact.phone)];
    setEmergencyContacts(updated);
    localStorage.setItem('emergency_contacts', JSON.stringify(updated));
    setContactName('');
    setContactPhone('');
    setShowAddContactModal(false);
  };

  const handleRemoveContact = (phone) => {
    const updated = emergencyContacts.filter(c => c.phone !== phone);
    setEmergencyContacts(updated);
    localStorage.setItem('emergency_contacts', JSON.stringify(updated));
  };

  const handleAddRx = (e) => {
    e.preventDefault();
    if (!rxTitle.trim()) return;
    const newRx = {
      id: Date.now().toString(),
      title: rxTitle.trim(),
      doctor: rxDoctor.trim() || 'Attending Physician',
      notes: rxNotes.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updated = [newRx, ...prescriptions];
    setPrescriptions(updated);
    localStorage.setItem('user_prescriptions', JSON.stringify(updated));
    setRxTitle('');
    setRxDoctor('');
    setRxNotes('');
    setShowAddRxModal(false);
  };

  const handleRemoveRx = (id) => {
    const updated = prescriptions.filter(p => p.id !== id);
    setPrescriptions(updated);
    localStorage.setItem('user_prescriptions', JSON.stringify(updated));
  };

  const removeSavedMedicine = (medName) => {
    const updated = savedMedicines.filter(m => (m.medicineName || m.name) !== medName);
    setSavedMedicines(updated);
    localStorage.setItem('saved_medicines', JSON.stringify(updated));
  };

  const removeSavedRemedy = (condition) => {
    const updated = savedRemedies.filter(r => (r.condition || r.title) !== condition);
    setSavedRemedies(updated);
    localStorage.setItem('saved_remedies', JSON.stringify(updated));
  };

  const toggleReminder = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val.toString());
    if (val && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      await sendVerification();
      setResendStatus('success');
    } catch (err) {
      setResendStatus('error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteStatus('deleting');
    try {
      await api.delete('/auth/profile/delete');
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete account.');
      setDeleteStatus('idle');
      setShowDeleteConfirm(false);
    }
  };

  const userInitials =
    (user?.firstName ? user.firstName[0].toUpperCase() : '') +
    (user?.lastName ? user.lastName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U'));

  const userFullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Arogya User';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'person' },
    { id: 'health', label: 'Vitals & Medical', icon: 'monitor_heart' },
    { id: 'saved', label: 'Saved Center', icon: 'bookmark' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-[#f8f9fc] dark:bg-slate-950 font-sans transition-colors">
      <SEO 
        title={`${userFullName} | Health Profile | Arogya Raksha`}
        description="View and manage your personal clinical health profile, verified vitals, saved medicines, and emergency contacts."
      />

      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Email Verification Notice (if unverified) ───────────────────────── */}
        {user && !user.emailVerified && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">mark_email_unread</span>
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Email Verification Pending</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">Verify {user.email} to enable automated cloud backups.</p>
                {resendStatus === 'success' && <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Verification link sent!</p>}
              </div>
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending'}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 self-start sm:self-auto"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Resend Link'}
            </button>
          </div>
        )}

        {/* ── Main Profile Header Card ────────────────────────────────────────── */}
        <Card className="relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Avatar with gradient ring */}
              <div className="relative shrink-0">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0052CC] to-[#10B981] flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg ring-4 ring-[#0052CC]/10 dark:ring-[#10B981]/10">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={userFullName} className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <button 
                  onClick={() => navigate('/profile-setup')}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                  title="Edit Vitals & Profile"
                >
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                </button>
              </div>

              {/* User credentials */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {userFullName}
                  </h1>
                  {user?.emailVerified && (
                    <span className="material-symbols-outlined text-emerald-500 text-base" title="Verified Member">verified</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#10B981]/10 dark:text-[#10B981]">
                    AROGYA ID: {user?.id ? user.id.slice(-6).toUpperCase() : 'MEMBER'}
                  </span>
                  {profile?.bloodGroup && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                      Blood: {profile.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Score Ring */}
            <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent rounded-2xl sm:rounded-none">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-1">
                <div className="relative w-14 sm:w-16 h-14 sm:h-16 shrink-0">
                  <HealthRing score={healthScore} color={healthScoreColor} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm sm:text-base font-black ${healthScoreTextColor}`}>{healthScore}</span>
                  </div>
                </div>
                <div className="sm:text-center">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{healthScoreLabel}</p>
                  <p className="text-[9px] text-slate-400">Health Index</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/profile-setup')}
                className="px-3 py-1.5 bg-[#0052CC] dark:bg-[#10B981] text-white rounded-xl text-xs font-bold shadow hover:opacity-90 transition-all sm:mt-2"
              >
                Update Vitals
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <StatPill label="Age" value={profile?.age ? `${profile.age} Years` : 'Not Set'} sub={profile?.gender || '—'} />
            <StatPill label="Blood Group" value={profile?.bloodGroup || 'Not Set'} color="text-red-500" />
            <StatPill label="Height & Weight" value={profile?.height && profile?.weight ? `${profile.height} cm / ${profile.weight} kg` : 'Not Set'} />
            <StatPill 
              label="Live BMI" 
              value={bmiData ? `${bmiData.val}` : 'Not Set'} 
              sub={bmiData ? bmiData.cat : 'Fill vitals'}
              color={bmiData ? bmiData.color : 'text-slate-400'} 
            />
          </div>
        </Card>

        {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
        <div className="flex bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-1.5 gap-1.5 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === t.id
                  ? 'bg-[#0052CC] dark:bg-[#10B981] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ─────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* ════ TAB: OVERVIEW ════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              
              {/* Emergency Contact SOS Card */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">emergency</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Emergency Contacts</h3>
                      <p className="text-[11px] text-slate-400">Integrated with your Emergency SOS Center.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddContactModal(true)}
                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Add Contact
                  </button>
                </div>

                {emergencyContacts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emergencyContacts.map((c, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500 text-white font-black flex items-center justify-center text-xs">
                            {c.name ? c.name[0].toUpperCase() : 'E'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{c.relationship || 'Emergency'} · {c.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${c.phone}`}
                            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm"
                            title="Call Now"
                          >
                            <span className="material-symbols-outlined text-sm">call</span>
                          </a>
                          <button 
                            onClick={() => handleRemoveContact(c.phone)}
                            className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all"
                            title="Remove"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">contact_phone</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">No emergency contacts configured</p>
                    <p className="text-[11px] text-slate-400">Add a family member or doctor for one-tap emergency access.</p>
                    <button 
                      onClick={() => setShowAddContactModal(true)}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow hover:bg-red-700 transition-all"
                    >
                      Set Up Primary Contact
                    </button>
                  </div>
                )}
              </Card>

              {/* Verified Health Assessment & Clinical Summary */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#10B981]/10 dark:text-[#10B981] flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">fact_check</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">AI Health Assessments</h3>
                      <p className="text-[11px] text-slate-400">Real clinical assessments conducted on your account.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/health-assessment')}
                    className="px-3 py-1.5 bg-[#0052CC]/10 dark:bg-[#10B981]/10 text-[#0052CC] dark:text-[#10B981] rounded-xl text-xs font-bold hover:opacity-80 transition-all"
                  >
                    Take Assessment
                  </button>
                </div>

                {assessments.length > 0 ? (
                  <div className="space-y-2.5">
                    {assessments.slice(0, 3).map((a, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Health Score: {a.healthScore || '75'}/100
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {a.recommendations?.[0] || 'Vitals within normal expected range.'}
                          </p>
                        </div>
                        <button 
                          onClick={() => navigate('/health-assessment')}
                          className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">health_and_safety</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">No assessments recorded yet</p>
                    <p className="text-[11px] text-slate-400">Complete an AI health assessment to receive personalized guidance.</p>
                    <button 
                      onClick={() => navigate('/health-assessment')}
                      className="mt-3 px-4 py-2 bg-[#0052CC] dark:bg-[#10B981] text-white rounded-xl text-xs font-bold shadow transition-all hover:opacity-90"
                    >
                      Start Free Assessment
                    </button>
                  </div>
                )}
              </Card>

              {/* Prescriptions & Doctor Directives */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">prescriptions</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Active Prescriptions & Doctor Notes</h3>
                      <p className="text-[11px] text-slate-400">Track current prescriptions and instructions.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddRxModal(true)}
                    className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40 rounded-xl text-xs font-bold hover:bg-violet-100 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Add Record
                  </button>
                </div>

                {prescriptions.length > 0 ? (
                  <div className="space-y-2.5">
                    {prescriptions.map(p => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">· Dr. {p.doctor} ({p.date})</span>
                          </div>
                          {p.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{p.notes}</p>}
                        </div>
                        <button 
                          onClick={() => handleRemoveRx(p.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-all"
                          title="Delete Record"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">receipt_long</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">No prescriptions logged</p>
                    <p className="text-[11px] text-slate-400">Keep your physician directives, dosages, and notes organized here.</p>
                    <button 
                      onClick={() => setShowAddRxModal(true)}
                      className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow hover:bg-violet-700 transition-all"
                    >
                      Log First Prescription
                    </button>
                  </div>
                )}
              </Card>

            </motion.div>
          )}

          {/* ════ TAB: VITALS & MEDICAL ════ */}
          {activeTab === 'health' && (
            <motion.div key="health" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0052CC] dark:text-[#10B981]">medical_services</span>
                    Clinical Diagnoses & Allergies
                  </h3>
                  <button 
                    onClick={() => navigate('/profile-setup')}
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Diagnosed Conditions</label>
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.medicalConditions && profile.medicalConditions.length > 0 && profile.medicalConditions[0] !== 'None' ? (
                        profile.medicalConditions.map(c => (
                          <span key={c} className="px-3 py-1 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No existing chronic conditions indicated.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Known Allergies</label>
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.allergies && profile.allergies.length > 0 ? (
                        profile.allergies.map(a => (
                          <span key={a} className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No known drug or food allergies recorded.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Current Daily Medications</label>
                    <div className="flex flex-wrap gap-1.5">
                      {profile?.medications && profile.medications.length > 0 ? (
                        profile.medications.map(m => (
                          <span key={m} className="px-3 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No daily maintenance medications recorded.</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Lifestyle Habits */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0052CC] dark:text-[#10B981]">self_improvement</span>
                    Daily Wellness Targets
                  </h3>
                  <button 
                    onClick={() => navigate('/profile-setup')}
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatPill label="Activity Level" value={profile?.activityLevel || 'Sedentary'} />
                  <StatPill label="Target Water" value={profile?.waterIntake ? `${profile.waterIntake} L/day` : '2.5 L/day'} color="text-sky-500" />
                  <StatPill label="Target Sleep" value={profile?.sleepDuration ? `${profile.sleepDuration} Hours` : '7 Hours'} color="text-indigo-500" />
                  <StatPill label="Stress Level" value={profile?.stressLevel || 'Moderate'} color="text-amber-500" />
                </div>
              </Card>
            </motion.div>
          )}

          {/* ════ TAB: SAVED CENTER ════ */}
          {activeTab === 'saved' && (
            <motion.div key="saved" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              
              {/* Saved Medicines */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">pill</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        Bookmarked Medicines ({savedMedicines.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">Fast access to drug dosages and precautions.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/medicine-info')}
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                  >
                    Search More
                  </button>
                </div>

                {savedMedicines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedMedicines.map((m, i) => {
                      const name = m.medicineName || m.name;
                      return (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{name}</h4>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{m.genericName || m.category || 'General Therapeutic'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => navigate('/medicine-info')}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => removeSavedMedicine(name)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">pill</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">No medicines bookmarked</p>
                    <p className="text-[11px] text-slate-400">Search for medicines and click the bookmark icon to save them here.</p>
                    <button 
                      onClick={() => navigate('/medicine-info')}
                      className="mt-3 px-4 py-2 bg-[#0052CC] dark:bg-[#10B981] text-white rounded-xl text-xs font-bold shadow hover:opacity-90 transition-all"
                    >
                      Browse Medicines
                    </button>
                  </div>
                )}
              </Card>

              {/* Saved Home Remedies */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">eco</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        Saved Natural Remedies ({savedRemedies.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">Quick household recipes and natural care.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/home-remedies')}
                    className="text-xs font-bold text-[#0052CC] dark:text-[#10B981] hover:underline"
                  >
                    Find Remedies
                  </button>
                </div>

                {savedRemedies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedRemedies.map((r, i) => {
                      const title = r.title || r.condition;
                      return (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title}</h4>
                            <p className="text-[10px] text-slate-400">{r.reliefTime || 'Within 30-60 mins'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => navigate('/home-remedies')}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                            >
                              Open
                            </button>
                            <button 
                              onClick={() => removeSavedRemedy(title)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">eco</span>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">No remedies saved yet</p>
                    <p className="text-[11px] text-slate-400">Discover evidence-backed traditional remedies and save them for fast relief.</p>
                    <button 
                      onClick={() => navigate('/home-remedies')}
                      className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition-all"
                    >
                      Explore Home Remedies
                    </button>
                  </div>
                )}
              </Card>

            </motion.div>
          )}

          {/* ════ TAB: SETTINGS & ACCOUNT ════ */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
              <Card>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Notification Reminders</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Hydration Reminder</p>
                      <p className="text-[11px] text-slate-400">Receive periodic prompts to drink water.</p>
                    </div>
                    <Toggle checked={waterReminder} onChange={(e) => toggleReminder('remind_water', e.target.checked, setWaterReminder)} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Weekly Health Checkup</p>
                      <p className="text-[11px] text-slate-400">Gentle reminder to review your clinical vitals.</p>
                    </div>
                    <Toggle checked={healthReminder} onChange={(e) => toggleReminder('remind_health', e.target.checked, setHealthReminder)} />
                  </div>
                </div>
              </Card>

              {/* Data Export & Account Actions */}
              <Card>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Data & Security</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.print()}
                    className="w-full py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-800 dark:text-white flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#0052CC] dark:text-[#10B981]">print</span>
                      Print / Export Clinical Health Sheet
                    </span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>

                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3.5 px-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-between hover:bg-red-100/50 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">delete_forever</span>
                      Permanently Delete Health Account
                    </span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Add Emergency Contact Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Add Emergency Contact</h3>
              <p className="text-xs text-slate-400 mb-4">This number can be dialed instantly in a crisis.</p>
              <form onSubmit={handleAddContact} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                  <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Dr. Ramesh / Brother" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Relationship</label>
                  <select value={contactRel} onChange={(e) => setContactRel(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold">
                    <option value="Family">Family Member</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Doctor">Doctor / Physician</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddContactModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-xs shadow hover:bg-red-700">Save Contact</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Prescription Record Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showAddRxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Log Prescription Record</h3>
              <p className="text-xs text-slate-400 mb-4">Record instructions from your doctor or clinic.</p>
              <form onSubmit={handleAddRx} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prescription Title</label>
                  <input type="text" required value={rxTitle} onChange={(e) => setRxTitle(e.target.value)} placeholder="e.g. Hypertension Care / Antibiotics" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prescribing Doctor / Clinic</label>
                  <input type="text" value={rxDoctor} onChange={(e) => setRxDoctor(e.target.value)} placeholder="e.g. Dr. Verma" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dosage Directives & Notes</label>
                  <textarea rows="3" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} placeholder="e.g. Take 1 tablet daily after breakfast for 14 days." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-semibold" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddRxModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-xs shadow hover:bg-violet-700">Save Record</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-200 dark:border-red-900/40">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-base font-extrabold text-center text-slate-900 dark:text-white mb-1">Delete Account Permanently?</h3>
              <p className="text-xs text-slate-400 text-center mb-5 leading-relaxed">
                This will delete your health profile, saved medicines, and assessment history. This action cannot be reversed.
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deleteStatus === 'deleting'}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs shadow hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteStatus === 'deleting' ? 'Deleting Data...' : 'Yes, Delete Permanently'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  disabled={deleteStatus === 'deleting'}
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
