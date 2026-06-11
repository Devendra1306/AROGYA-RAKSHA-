import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, profile, logout, sendVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [resendStatus, setResendStatus] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    setResendStatus('sending');
    setResendError('');
    try {
      await sendVerification();
      setResendStatus('success');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      setResendStatus('');
    }
  };

  const [savedMedicines, setSavedMedicines] = useState([]);
  const [savedRemedies, setSavedRemedies] = useState([]);

  // Local reminders toggles
  const [waterReminder, setWaterReminder] = useState(() => localStorage.getItem('remind_water') === 'true');
  const [dietReminder, setDietReminder] = useState(() => localStorage.getItem('remind_diet') === 'true');
  const [healthReminder, setHealthReminder] = useState(() => localStorage.getItem('remind_health') === 'true');

  // Mobile layout state variables
  const [isMobile, setIsMobile] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // 'idle' | 'generating' | 'ready'
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    // Read saved items from localStorage
    const meds = JSON.parse(localStorage.getItem('saved_medicines') || '[]');
    const rems = JSON.parse(localStorage.getItem('saved_remedies') || '[]');
    setSavedMedicines(meds);
    setSavedRemedies(rems);

    // Screen width detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Fetch emergency contacts
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

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
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

  const handleDownloadReport = () => {
    setDownloadStatus('generating');
    setTimeout(() => {
      setDownloadStatus('ready');
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
    }, 1500);
  };

  if (isMobile) {
    const displayContacts = contacts.length > 0 ? contacts : [
      { name: 'Priya Sharma', phone: '+91 98765 43210', relationship: 'Spouse' },
      { name: 'Dr. Ramesh Verma', phone: '+91 98234 56789', relationship: 'Family Physician' }
    ];

    return (
      <div className="bg-background text-on-surface px-margin-mobile pb-28 font-body-md">
        {/* Verification Warning Banner */}
        {user && !user.emailVerified && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-350 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/50 flex flex-col gap-3 animate-fade-in shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">mark_email_unread</span>
              <div>
                <p className="font-extrabold text-sm">Verify Your Email Address</p>
                <p className="opacity-90 mt-0.5">Please verify your email address to secure your account and unlock all features.</p>
                {resendStatus === 'success' && <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">Verification email sent! Check your inbox.</p>}
                {resendStatus === 'error' && <p className="text-red-655 dark:text-red-400 font-bold mt-1">{resendError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end shrink-0">
              <button 
                onClick={handleResendVerification}
                disabled={resendStatus === 'sending'}
                className="bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all text-[11px]"
              >
                {resendStatus === 'sending' ? 'Sending...' : 'Resend Email'}
              </button>
              <button 
                onClick={handleRefreshVerification}
                className="border border-amber-400 dark:border-amber-800 font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all text-[11px]"
              >
                Check Status
              </button>
            </div>
          </div>
        )}

        {/* Bento Grid Layout */}
        <div className="flex flex-col gap-6 mt-4">
          
          {/* Profile Header Card */}
          <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-6 shadow-sm border border-border-grey bg-white/80 dark:bg-slate-800/80">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-md">
                {user?.profilePicture ? (
                  <img 
                    className="w-full h-full object-cover" 
                    src={user.profilePicture} 
                    alt={user.firstName} 
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary font-extrabold flex items-center justify-center text-3xl">
                    {(user?.firstName ? user.firstName[0].toUpperCase() : '') + (user?.lastName ? user.lastName[0].toUpperCase() : '')}
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/profile-setup')}
                className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-lg shadow-lg active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            <div className="w-full text-center">
              <h2 className="text-xl font-bold text-primary dark:text-secondary">{user?.firstName} {user?.lastName}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Health ID: {profile?.healthId || `AR-${user?.email?.split('@')[0]?.toUpperCase() || '9844'}-2026`}</p>
              
              <button 
                onClick={handleDownloadReport}
                className={`mt-4 inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 w-full ${
                  downloadStatus === 'ready' ? 'bg-green-600' : 'bg-primary'
                }`}
              >
                {downloadStatus === 'generating' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    Generating...
                  </>
                ) : downloadStatus === 'ready' ? (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Ready for Download
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download Health Report
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-border-grey/50">
                  <span className="text-[10px] text-slate-400 block">Age</span>
                  <span className="text-xs font-semibold text-primary dark:text-secondary">{profile?.age ? `${profile.age} Years` : '34 Years'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-border-grey/50">
                  <span className="text-[10px] text-slate-400 block">Blood Group</span>
                  <span className="text-xs font-semibold text-red-500">{profile?.bloodGroup || 'O+ Positive'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-border-grey/50">
                  <span className="text-[10px] text-slate-400 block">Weight</span>
                  <span className="text-xs font-semibold text-primary dark:text-secondary">{profile?.weight ? `${profile.weight} kg` : '78 kg'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-border-grey/50">
                  <span className="text-[10px] text-slate-400 block">Height</span>
                  <span className="text-xs font-semibold text-primary dark:text-secondary">{profile?.height ? `${profile.height} cm` : '178 cm'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Card */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/40 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <span className="material-symbols-outlined text-xl">emergency</span>
              <h3 className="font-bold text-sm">Emergency Contacts</h3>
            </div>
            
            <div className="space-y-3">
              {displayContacts.map((contact, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-xs">
                  <div>
                    <p className="font-bold text-xs text-primary dark:text-secondary">{contact.name}</p>
                    <p className="text-[10px] text-slate-400">{contact.relationship} • {contact.phone}</p>
                  </div>
                  <a 
                    href={`tel:${contact.phone}`} 
                    className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                  </a>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => navigate('/emergency')}
              className="mt-4 w-full py-2.5 border border-red-500 text-red-500 rounded-lg font-semibold text-xs hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Manage Contacts
            </button>
          </div>

          {/* My Medical History */}
          <div className="glass-card rounded-xl p-5 shadow-sm border border-border-grey bg-white/80 dark:bg-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-primary dark:text-secondary">My Medical History</h3>
              <button className="text-primary dark:text-secondary font-bold text-xs hover:underline">View All</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors border border-transparent hover:border-border-grey/30 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-primary-container shrink-0">
                  <span className="material-symbols-outlined text-xl">history_edu</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-primary dark:text-secondary truncate">Annual Health Checkup</h4>
                    <span className="text-[9px] text-slate-400 shrink-0">Oct 12, 2023</span>
                  </div>
                  <p className="text-[10px] text-slate-550 dark:text-slate-350 mt-1 leading-tight line-clamp-2">Normal cardiovascular screening, Vitamin D deficiency noted.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors border border-transparent hover:border-border-grey/30 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <span className="material-symbols-outlined text-xl">vaccines</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-primary dark:text-secondary truncate">Influenza Vaccination</h4>
                    <span className="text-[9px] text-slate-400 shrink-0">Sep 05, 2023</span>
                  </div>
                  <p className="text-[10px] text-slate-550 dark:text-slate-350 mt-1 leading-tight line-clamp-2">Quadrivalent vaccine administered at City Clinic.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors border border-transparent hover:border-border-grey/30 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="material-symbols-outlined text-xl">heart_check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-primary dark:text-secondary truncate">Hypertension Follow-up</h4>
                    <span className="text-[9px] text-slate-400 shrink-0">Jun 22, 2023</span>
                  </div>
                  <p className="text-[10px] text-slate-550 dark:text-slate-350 mt-1 leading-tight line-clamp-2">BP reading: 128/82. Medication dosage adjusted.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stored Prescriptions */}
          <div className="glass-card rounded-xl p-5 shadow-sm border border-border-grey bg-white/80 dark:bg-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-primary dark:text-secondary">Stored Prescriptions</h3>
              <button 
                onClick={() => alert("Upload feature is coming soon!")}
                className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-border-grey bg-slate-100 dark:bg-slate-700 cursor-pointer">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAv8T7recQCqseffAtgi4W3U1icMA8qPYv9D7ohyVoule2UWXw7cq1WZSw-2k2Eh8DH0tAqsycucN749--ktAfhWucQJD6LtJJgADPfwcQFY2Xv2OjAD3o9CJt1SJi9vM4F4jV4uik7Gmd5jHKNredJUEyalcQ-w7l-WnOhd0ddx-OuA8Pz0lI1tLRFYPBQoDEUM5-pNNI4i2J_gtK8u80YxChDtfgvh-fxMZxUrXa3-EtD4PmqdYZvRbSSkbm-Nnn73EGccT6fBcSf" 
                  alt="Chronic HTN prescription" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-2.5">
                  <p className="text-white text-xs font-semibold">Chronic HTN</p>
                  <p className="text-slate-300 text-[9px]">Dr. Verma • Jan 2024</p>
                </div>
              </div>
              
              <div className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-border-grey bg-slate-100 dark:bg-slate-700 cursor-pointer">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvprBo1O5l-roKVrVf94Qupw5LZmb9M6QFE6-eyj--MxsM9EZ2_Naz270oh7YKHyWGC19b9fVTDz85AH5QUwAuUfXtUdaiQ6XNJht_mml-U6XppZvUnfbWg7ASNKdHEsSiMMfh8DjTDKvUq7JwS0rsnhpV3D1Y-hv8v14mcbFGSKctO0sm25jayquskI9ssRUecVitdqvdKGn0hm2-AzHVDKIlc-bQZay2A_PFVcO0Cz3qS5yecYCJHC7mMFq24iDjev3G6jWZZUkq" 
                  alt="Seasonal Allergy prescription" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-2.5">
                  <p className="text-white text-xs font-semibold">Seasonal Allergy</p>
                  <p className="text-slate-300 text-[9px]">City Care • Sep 2023</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => alert("Upload feature is coming soon!")}
              className="mt-4 w-full py-2.5 bg-slate-50 dark:bg-slate-900 text-primary dark:text-secondary font-bold rounded-lg border border-border-grey hover:bg-slate-100 transition-colors text-xs"
            >
              Upload New
            </button>
          </div>

          {/* App Settings */}
          <div className="glass-card rounded-xl p-5 shadow-sm border border-border-grey bg-white/80 dark:bg-slate-800/80">
            <h3 className="font-bold text-base text-primary dark:text-secondary mb-4">App Settings</h3>
            
            <div className="space-y-5">
              {/* Privacy & Security */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Privacy &amp; Security</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">fingerprint</span>
                    <span className="text-xs text-slate-800 dark:text-slate-100">Biometric Login</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={biometricLogin} 
                      onChange={(e) => setBiometricLogin(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                    <span className="text-xs text-slate-800 dark:text-slate-100">Two-Factor Auth</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
                </div>
              </div>

              {/* Data Management */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Data Management</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">cloud_sync</span>
                    <span className="text-xs text-slate-800 dark:text-slate-100">Auto-Sync Records</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoSync} 
                      onChange={(e) => setAutoSync(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">share</span>
                    <span className="text-xs text-slate-800 dark:text-slate-100">Hospital Data Sharing</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
                </div>
              </div>

              {/* Reminders integration */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reminders Toggles</h4>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">water_drop</span>
                    <div>
                      <span className="text-xs text-slate-800 dark:text-slate-100 font-semibold block">Water Reminder</span>
                      <span className="text-[8px] text-slate-400 block">Every 2 hours</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={waterReminder} 
                      onChange={handleToggleWater} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">restaurant</span>
                    <div>
                      <span className="text-xs text-slate-800 dark:text-slate-100 font-semibold block">Diet Log Check</span>
                      <span className="text-[8px] text-slate-400 block">Log daily meals</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={dietReminder} 
                      onChange={handleToggleDiet} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">analytics</span>
                    <div>
                      <span className="text-xs text-slate-800 dark:text-slate-100 font-semibold block">Wellness Checkup Logs</span>
                      <span className="text-[8px] text-slate-400 block">Weekly assessments</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={healthReminder} 
                      onChange={handleToggleHealth} 
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Preferences & Log Out */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Preferences</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">translate</span>
                    <span className="text-xs text-slate-800 dark:text-slate-100">Language</span>
                  </div>
                  <span className="text-xs font-semibold text-primary dark:text-secondary">English (US)</span>
                </div>
                
                <button 
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full text-left py-2.5 text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Log Out Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="max-w-[600px] mx-auto px-4 pt-20 pb-28 text-slate-800 dark:text-slate-100"
    >
      {/* Verification Warning Banner */}
      {user && !user.emailVerified && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 rounded-2xl text-xs border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">mark_email_unread</span>
            <div>
              <p className="font-extrabold text-sm">Verify Your Email Address</p>
              <p className="opacity-90 mt-0.5">Please verify your email address to secure your account and unlock all features.</p>
              {resendStatus === 'success' && <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">Verification email sent! Check your inbox.</p>}
              {resendStatus === 'error' && <p className="text-red-655 dark:text-red-400 font-bold mt-1">{resendError}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button 
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending'}
              className="bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all text-[11px]"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Resend Email'}
            </button>
            <button 
              onClick={handleRefreshVerification}
              className="border border-amber-400 dark:border-amber-800 font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all text-[11px]"
            >
              Check Status
            </button>
          </div>
        </div>
      )}

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
            <span className="material-symbols-outlined text-[10px] text-primary align-middle mr-1">verified_user</span> Active Member
          </span>
        </div>
        <button 
          onClick={() => navigate('/profile-setup')}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 p-2.5 rounded-2xl transition-all flex items-center justify-center"
          title="Edit Profile Settings"
        >
          <span className="material-symbols-outlined text-xs">edit</span>
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
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">stethoscope</span> Medical Summary</h3>
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
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">pill</span> Saved Medicines ({savedMedicines.length})</h3>
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
                  className="text-xs hover:text-red-500 p-1 ml-2 text-slate-400 flex items-center justify-center"
                  title="Remove bookmark"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
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
        <h3 className="font-bold text-base mb-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">local_hospital</span> Saved Remedies ({savedRemedies.length})</h3>
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
                  className="text-xs hover:text-red-500 p-1 ml-2 text-slate-400 flex items-center justify-center"
                  title="Remove bookmark"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
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
        <h3 className="font-bold text-base mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">settings</span> Health Alert Reminders</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-bold block flex items-center gap-1"><span className="material-symbols-outlined text-xs text-blue-500">water_drop</span> Water Intakes alert</span>
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
              <span className="text-sm font-bold block flex items-center gap-1"><span className="material-symbols-outlined text-xs text-emerald-500">restaurant</span> Diet Intake Check</span>
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
              <span className="text-sm font-bold block flex items-center gap-1"><span className="material-symbols-outlined text-xs text-indigo-500">analytics</span> Wellness Checkup Logs</span>
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
        <span className="material-symbols-outlined text-sm">logout</span> Log Out Account
      </button>
    </motion.div>
  );
}
