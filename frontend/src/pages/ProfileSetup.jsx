import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Thyroid',
  'Heart Disease',
  'Kidney Disease',
  'Arthritis',
  'Migraine',
  'None'
];

const ACTIVITY_LEVELS = [
  { id: 'Sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk work' },
  { id: 'Lightly Active', label: 'Lightly Active', desc: 'Light workouts 1-3 days/week' },
  { id: 'Moderately Active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { id: 'Very Active', label: 'Very Active', desc: 'Hard physical exercise daily' }
];

export default function ProfileSetup() {
  const { updateProfile, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Vitals
  const [age, setAge] = useState(profile?.age || '');
  const [gender, setGender] = useState(profile?.gender || 'Male');
  const [height, setHeight] = useState(profile?.height || '');
  const [weight, setWeight] = useState(profile?.weight || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O+');

  // Step 2: Medical History
  const [medicalConditions, setMedicalConditions] = useState(profile?.medicalConditions || ['None']);
  const [allergies, setAllergies] = useState(Array.isArray(profile?.allergies) ? profile.allergies.join(', ') : (profile?.allergies || ''));
  const [medications, setMedications] = useState(Array.isArray(profile?.medications) ? profile.medications.join(', ') : (profile?.medications || ''));

  // Step 3: Habits & Emergency Contact
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel || 'Lightly Active');
  const [waterIntake, setWaterIntake] = useState(profile?.waterIntake || 2.5);
  const [sleepDuration, setSleepDuration] = useState(profile?.sleepDuration || 7);
  const [stressLevel, setStressLevel] = useState(profile?.stressLevel || 'Moderate');

  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone || '');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(profile?.emergencyContactRelationship || 'Family');

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const heightM = h / 100;
    const bmiVal = (w / (heightM * heightM)).toFixed(1);
    const val = parseFloat(bmiVal);

    let category = 'Normal';
    let color = 'text-emerald-500 dark:text-emerald-400';
    let bg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40';

    if (val < 18.5) {
      category = 'Underweight';
      color = 'text-amber-500';
      bg = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40';
    } else if (val >= 25 && val < 30) {
      category = 'Overweight';
      color = 'text-orange-500';
      bg = 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40';
    } else if (val >= 30) {
      category = 'Obese';
      color = 'text-red-500';
      bg = 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40';
    }
    return { val, category, color, bg };
  }, [height, weight]);

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setMedicalConditions(['None']);
      return;
    }
    const filtered = medicalConditions.filter(c => c !== 'None');
    if (filtered.includes(cond)) {
      const next = filtered.filter(c => c !== cond);
      setMedicalConditions(next.length === 0 ? ['None'] : next);
    } else {
      setMedicalConditions([...filtered, cond]);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!age || Number(age) <= 0 || Number(age) > 120) return setError('Please enter a valid age.');
      if (!height || Number(height) < 40 || Number(height) > 250) return setError('Please enter a valid height in cm (e.g. 175).');
      if (!weight || Number(weight) < 20 || Number(weight) > 300) return setError('Please enter a valid weight in kg (e.g. 70).');
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const profileData = {
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        bloodGroup,
        activityLevel,
        waterIntake: Number(waterIntake),
        sleepDuration: Number(sleepDuration),
        stressLevel,
        medicalConditions,
        allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medications: medications ? medications.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyContactRelationship,
        healthGoal: 'Healthy Lifestyle',
        targetDuration: '3 Months'
      };

      await updateProfile(profileData);

      // Sync emergency contact with local emergency center storage
      if (emergencyContactName && emergencyContactPhone) {
        const existingContacts = JSON.parse(localStorage.getItem('emergency_contacts') || '[]');
        const updated = [
          { name: emergencyContactName, phone: emergencyContactPhone, relationship: emergencyContactRelationship },
          ...existingContacts.filter(c => c.phone !== emergencyContactPhone)
        ];
        localStorage.setItem('emergency_contacts', JSON.stringify(updated));
      }

      navigate('/profile');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save health profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-[#f8f9fc] dark:bg-slate-950 font-sans transition-colors">
      <SEO 
        title="Health Profile Setup | Arogya Raksha"
        description="Set up your verified clinical vitals and personal medical profile for personalized health guidance."
      />

      <div className="w-full max-w-xl">
        {/* Header indicator */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#10B981]/10 dark:text-[#10B981] mb-2">
            <span className="material-symbols-outlined text-sm">badge</span> Verified Health Identity
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personal Health Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Complete your vitals for tailored AI medical analysis & emergency readiness.</p>
        </div>

        {/* Step progress bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className={step >= 1 ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400'}>1. Physical Vitals</span>
            <span className={step >= 2 ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400'}>2. Medical History</span>
            <span className={step >= 3 ? 'text-[#0052CC] dark:text-[#10B981]' : 'text-slate-400'}>3. Safety & Emergency</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#0052CC] to-[#10B981]" 
              initial={false}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900/40 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* STEP 1: PHYSICAL VITALS */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0052CC] dark:text-[#10B981]">monitor_heart</span>
                      Physical Vitals & Body Metrics
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Used to calculate your real BMI and accurate medicine dosages.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Age</label>
                      <input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all" 
                        placeholder="e.g. 28" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Height (cm)</label>
                      <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all" 
                        placeholder="175" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all" 
                        placeholder="70" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                      <select 
                        value={bloodGroup} 
                        onChange={(e) => setBloodGroup(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all"
                      >
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Live BMI indicator badge */}
                  {bmiInfo && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${bmiInfo.bg}`}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">speed</span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Calculated BMI</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {bmiInfo.val} <span className={`text-xs font-bold ${bmiInfo.color}`}>({bmiInfo.category})</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        WHO Standard
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-4 rounded-2xl bg-[#0052CC] dark:bg-[#10B981] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      Continue to Medical History
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: MEDICAL HISTORY */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0052CC] dark:text-[#10B981]">medical_services</span>
                      Medical Conditions & Safety Alert
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">The AI uses these to flag contraindications and drug interactions.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Existing Diagnosed Conditions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_CONDITIONS.map(cond => {
                        const active = medicalConditions.includes(cond);
                        return (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => toggleCondition(cond)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                              active
                                ? 'bg-[#0052CC] dark:bg-[#10B981] text-white border-transparent shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Known Drug / Food Allergies
                    </label>
                    <input 
                      type="text" 
                      value={allergies} 
                      onChange={(e) => setAllergies(e.target.value)} 
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all" 
                      placeholder="e.g. Penicillin, Peanuts, Sulfa Drugs (comma-separated)" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Current Daily Medications
                    </label>
                    <input 
                      type="text" 
                      value={medications} 
                      onChange={(e) => setMedications(e.target.value)} 
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981] transition-all" 
                      placeholder="e.g. Metformin 500mg, Cetirizine 10mg (comma-separated)" 
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-[2] py-4 rounded-2xl bg-[#0052CC] dark:bg-[#10B981] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      Next: Safety & Habits
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: HABITS & EMERGENCY CONTACT */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500">emergency</span>
                      Habits & Primary Emergency Contact
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Stored safely so you can notify loved ones in a medical emergency.</p>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Physical Activity Level
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm focus:border-[#0052CC] dark:focus:border-[#10B981]"
                    >
                      {ACTIVITY_LEVELS.map(a => (
                        <option key={a.id} value={a.id}>{a.label} — {a.desc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Water & Sleep */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Water (Liters/day)
                      </label>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={waterIntake} 
                        onChange={(e) => setWaterIntake(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Sleep (Hours/night)
                      </label>
                      <input 
                        type="number" 
                        value={sleepDuration} 
                        onChange={(e) => setSleepDuration(e.target.value)} 
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none font-semibold text-sm" 
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-500 text-sm">contact_phone</span>
                      <h4 className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                        Primary SOS Contact
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input 
                          type="text" 
                          value={emergencyContactName} 
                          onChange={(e) => setEmergencyContactName(e.target.value)} 
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-semibold text-xs" 
                          placeholder="Contact Name (e.g. Priya)" 
                        />
                      </div>
                      <div>
                        <input 
                          type="tel" 
                          value={emergencyContactPhone} 
                          onChange={(e) => setEmergencyContactPhone(e.target.value)} 
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-semibold text-xs" 
                          placeholder="Phone (e.g. +91 98765 43210)" 
                        />
                      </div>
                    </div>
                    <div>
                      <select 
                        value={emergencyContactRelationship} 
                        onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none font-medium text-xs"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Family Doctor">Family Doctor</option>
                        <option value="Family">Family</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#0052CC] to-[#10B981] text-white font-bold text-sm shadow-lg hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving Profile...
                        </>
                      ) : (
                        <>
                          Save & Complete Setup
                          <span className="material-symbols-outlined text-sm">check</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
}
