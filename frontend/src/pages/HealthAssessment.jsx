import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HealthAssessment() {
  const { profile, updateProfile } = useAuth();
  
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Wizard State (null = dashboard/landing, 1 = Personal Details, 2 = Lifestyle, 3 = Medical History)
  const [wizardStep, setWizardStep] = useState(null);

  // Form state preloaded from profile context
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [activityLevel, setActivityLevel] = useState('Sedentary');
  const [waterIntake, setWaterIntake] = useState(2);
  const [sleepDuration, setSleepDuration] = useState(7);
  const [stressLevel, setStressLevel] = useState('Moderate');
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');

  useEffect(() => {
    fetchLatestAssessment();
    fetchHistory();
  }, []);

  // Initialize form fields when profile context becomes available
  useEffect(() => {
    if (profile) {
      setAge(profile.age || '');
      setGender(profile.gender || 'Male');
      setHeight(profile.height || '');
      setWeight(profile.weight || '');
      setBloodGroup(profile.bloodGroup || 'O+');
      setActivityLevel(profile.activityLevel || 'Sedentary');
      setWaterIntake(profile.waterIntake || 2);
      setSleepDuration(profile.sleepDuration || 7);
      setStressLevel(profile.stressLevel || 'Moderate');
      setMedicalConditions(profile.medicalConditions || []);
      setAllergies(profile.allergies?.join(', ') || '');
      setMedications(profile.medications?.join(', ') || '');
    }
  }, [profile]);

  const fetchLatestAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessment/latest');
      setLatestAssessment(res.data);
    } catch (err) {
      console.warn('No health assessment generated yet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/assessment/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load assessment history:', err.message);
    }
  };

  const startAssessmentWizard = () => {
    setError('');
    setWizardStep(1);
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!age || !height || !weight) {
        setError('Please fill out age, height, and weight to proceed.');
        return;
      }
    }
    setError('');
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setWizardStep(prev => prev - 1);
  };

  const handleWizardSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Package profile data and sync to backend
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
        medicalConditions: medicalConditions.length === 0 ? ['None'] : medicalConditions,
        allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
        medications: medications.split(',').map(s => s.trim()).filter(Boolean),
      };

      // Call context updater (posts to /auth/profile/setup internally)
      await updateProfile(profileData);

      // 2. Trigger fresh health assessment scorecard generation
      const resAss = await api.post('/assessment/generate');
      setLatestAssessment(resAss.data);
      
      // 3. Reload historical trends and reset wizard
      await fetchHistory();
      setWizardStep(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit health assessment details. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setMedicalConditions(['None']);
    } else {
      const filtered = medicalConditions.filter(c => c !== 'None');
      if (filtered.includes(cond)) {
        setMedicalConditions(filtered.filter(c => c !== cond));
      } else {
        setMedicalConditions([...filtered, cond]);
      }
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await api.get('/auth/profile/export-pdf');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "Arogya_Raksha_Health_Report.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export report.');
    }
  };

  // Convert scores to percentage for circular gauge stroke
  const radius = 68;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = latestAssessment 
    ? strokeDasharray - (latestAssessment.healthScore / 100) * strokeDasharray 
    : strokeDasharray;

  // Chart data formatting
  const chartData = history.map(h => ({
    date: new Date(h.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: h.healthScore
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-6 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Wizard Form Layout (Steps 1, 2, 3) */}
      {wizardStep !== null ? (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 animate-fade-in">
          
          {/* Header & Step progress bar */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-primary dark:text-secondary">Health Assessment Setup</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Step {wizardStep} of 3</p>
            </div>
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-750 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${wizardStep * 33.3}%` }}></div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-355 rounded-xl text-xs border border-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-2">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calibrating Vitals Scorecard...</p>
            </div>
          ) : (
            <form onSubmit={handleWizardSubmit} className="space-y-4">
              
              {/* Step 1: Personal vitals details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-500">Personal details & Vitals</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Age</label>
                      <input 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                        placeholder="e.g. 28" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Gender</label>
                      <select 
                        value={gender} 
                        onChange={(e) => setGender(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs cursor-pointer"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                        placeholder="175" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                        placeholder="72" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Blood Group</label>
                      <select 
                        value={bloodGroup} 
                        onChange={(e) => setBloodGroup(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs cursor-pointer"
                      >
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Lifestyle Habits details */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-500">Lifestyle Habits</h3>
                  
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1.5">Activity Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setActivityLevel(lvl)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${activityLevel === lvl ? 'bg-primary text-white border-primary shadow' : 'border-slate-200 dark:border-slate-800'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Water Intake (Liters/day)</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        value={waterIntake} 
                        onChange={(e) => setWaterIntake(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Sleep Duration (Hours/night)</label>
                      <input 
                        type="number" 
                        value={sleepDuration} 
                        onChange={(e) => setSleepDuration(e.target.value)} 
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1.5">Stress Level</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
                      {['Low', 'Moderate', 'High'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setStressLevel(lvl)}
                          className={`flex-grow text-center py-2 rounded-lg font-bold text-xs transition-all ${stressLevel === lvl ? 'bg-white text-primary dark:bg-slate-800 dark:text-secondary shadow' : 'text-slate-500'}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Medical History details */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-500">Medical History</h3>
                  
                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase font-bold mb-2">Existing Medical Conditions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'Heart Disease', 'None'].map((cond) => {
                        const active = medicalConditions.includes(cond);
                        return (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => toggleCondition(cond)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${active ? 'bg-primary text-white border-primary shadow' : 'border-slate-200 dark:border-slate-800'}`}
                          >
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Allergies (comma-separated)</label>
                    <input 
                      type="text" 
                      value={allergies} 
                      onChange={(e) => setAllergies(e.target.value)} 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                      placeholder="e.g. Peanuts, Penicillin" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-450 uppercase font-bold mb-1">Current Medications (comma-separated)</label>
                    <input 
                      type="text" 
                      value={medications} 
                      onChange={(e) => setMedications(e.target.value)} 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" 
                      placeholder="e.g. Metformin 500mg" 
                    />
                  </div>
                </div>
              )}

              {/* Wizard controls footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-xs font-bold"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWizardStep(null)}
                    className="px-5 py-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ml-auto bg-primary hover:opacity-95 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ml-auto bg-primary hover:opacity-95 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm"
                  >
                    Submit & Generate
                  </button>
                )}
              </div>

            </form>
          )}

        </div>
      ) : (
        /* Results / Landing score dashboard view */
        <div className="space-y-6">
          
          {/* Main Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-primary dark:text-secondary flex items-center gap-2">
                📊 Health Assessment
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Understand physical risks, clinical scores, and recommendations.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadReport}
                className="border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-xl text-xs font-bold"
              >
                📥 Export Report
              </button>
              <button 
                onClick={startAssessmentWizard}
                className="bg-primary hover:opacity-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
              >
                {latestAssessment ? 'Retake Wizard' : 'Start Assessment'}
              </button>
            </div>
          </header>

          {latestAssessment ? (
            <div className="space-y-6">
              
              {/* Score ring and trends graph panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Health Score circle Gauge */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
                  <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wide mb-5">Current Health Score</h3>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center mb-5">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" fill="transparent" r={radius} stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800"></circle>
                      <circle 
                        cx="72" 
                        cy="72" 
                        fill="transparent" 
                        r={radius} 
                        stroke="#0052cc" 
                        strokeWidth="10"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700"
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-3xl font-black text-primary dark:text-secondary">{latestAssessment.healthScore}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Score</p>
                    </div>
                  </div>

                  <span className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4.5 py-1.5 rounded-full font-bold text-xs shadow-sm">
                    {latestAssessment.healthScore >= 90 ? 'Excellent' : latestAssessment.healthScore >= 75 ? 'Good' : 'Moderate'}
                  </span>
                </div>

                {/* Score Trend History Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wide mb-3">Score History Trends</h3>
                  <div className="h-48 w-full text-xs">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                          <XAxis dataKey="date" stroke="#94a3b8" />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 italic">
                        No history logs recorded yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* AI clinical narrative analysis */}
              {latestAssessment.analysisText && (
                <section className="bg-slate-900 text-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow relative overflow-hidden">
                  <span className="bg-secondary text-slate-900 px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Gemini Medical Opinion</span>
                  <p className="mt-3 text-xs leading-relaxed font-semibold italic text-slate-200">
                    "{latestAssessment.analysisText}"
                  </p>
                </section>
              )}

              {/* Wellness Factors Breakdown */}
              <section className="space-y-3">
                <h3 className="font-extrabold text-sm">Wellness Factors Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { name: '🏃 Physical', val: latestAssessment.activityScore || 0, color: 'text-primary' },
                    { name: '🥗 Nutrition', val: latestAssessment.nutritionScore || 0, color: 'text-emerald-500' },
                    { name: '😴 Sleep', val: latestAssessment.sleepScore || 0, color: 'text-indigo-500' },
                    { name: '💧 Hydration', val: latestAssessment.hydrationScore || 0, color: 'text-blue-500' },
                    { name: '🧠 Stress', val: latestAssessment.stressScore || 0, color: 'text-orange-500' }
                  ].map(f => (
                    <div key={f.name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl p-3 text-center shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{f.name}</span>
                      <p className={`text-xl font-black mt-1 ${f.color}`}>{f.val}%</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Risk Factors and Roadmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Active risk flags */}
                <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Active Risk Flags</h3>
                  <div className="space-y-3">
                    {latestAssessment.riskFactors?.length > 0 ? (
                      latestAssessment.riskFactors.map((risk, idx) => (
                        <div key={idx} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 rounded-xl text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-red-750 dark:text-red-300">{risk.name}</h4>
                            <span className="bg-red-200 text-red-900 px-2 py-0.5 rounded text-[8px] font-black uppercase">{risk.level}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{risk.description}</p>
                          <p className="text-[10px] text-red-650 font-bold">✓ Advice: {risk.advice}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No primary risks flags activated. Good work!</p>
                    )}
                  </div>
                </div>

                {/* Improvement Roadmap */}
                <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Improvement Roadmap</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start text-xs">
                      <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5">1</span>
                      <div>
                        <h4 className="font-bold">Next 7 Days (Hydration focus)</h4>
                        <p className="text-[11px] text-slate-400">Increase water intake logs to hit 3L target. Toggle alerts in menu.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start text-xs">
                      <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5">2</span>
                      <div>
                        <h4 className="font-bold">Next 30 Days (Habits frequency)</h4>
                        <p className="text-[11px] text-slate-400">Work out at least 3 days a week. Keep weekly check-in scores steady.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Empty state placeholder */
            <div className="max-w-md mx-auto text-center py-12 bg-white dark:bg-slate-850 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <span className="text-4xl">📊</span>
              <h3 className="font-extrabold text-lg mt-3">Generate Your Scorecard</h3>
              <p className="text-xs text-slate-400 mt-1.5 mb-5 leading-relaxed">
                Arogya Raksha can analyze BMI, conditions, sleep logs, and activities to calibrate an interactive wellness rating.
              </p>
              <button 
                onClick={startAssessmentWizard}
                className="bg-primary hover:opacity-95 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
              >
                Start Assessment Wizard
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
