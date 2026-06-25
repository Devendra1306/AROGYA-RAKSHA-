import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HealthAssessment() {
  const { profile, updateProfile } = useAuth();
  
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Media Query Check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      await updateProfile(profileData);
      const resAss = await api.post('/assessment/generate');
      setLatestAssessment(resAss.data);
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

  // Convert scores to percentage for circular gauge stroke (Desktop radius 70)
  const radius = 70;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = latestAssessment 
    ? strokeDasharray - (latestAssessment.healthScore / 100) * strokeDasharray 
    : strokeDasharray;

  const chartData = history.map(h => ({
    date: new Date(h.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: h.healthScore
  }));

  if (isMobile) {
    // Mobile Assessment view (Multi-step wizard and results)
    return (
      <div className="max-w-[1280px] mx-auto px-margin-mobile py-6 text-slate-800 dark:text-slate-100 font-body-md">
        <SEO 
          title="AI Health Assessment | BMI | Wellness Analysis | Arogya Raksha"
          description="Calculate your BMI, track daily vitals, and get an AI health assessment to monitor your overall wellness with Arogya Raksha."
          keywords="Health Assessment, BMI Calculator, Wellness Analysis, Track Vitals, Health Score, Daily Health Tracker, AI Healthcare"
          canonical="https://arogyaraksha.com/health-assessment"
          schema={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Health Assessment & Daily Vitals",
            "url": "https://arogyaraksha.com/health-assessment"
          }}
        />
        
        {wizardStep !== null ? (
          // Mobile Wizard Form
          <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border border-slate-200 dark:border-slate-850 shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div>
                <h2 className="text-base font-extrabold text-primary dark:text-secondary">Health Wizard</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Step {wizardStep} of 3</p>
              </div>
              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${wizardStep * 33.3}%` }}></div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Calibrating Vitals...</p>
              </div>
            ) : (
              <form onSubmit={handleWizardSubmit} className="space-y-4">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-500">Step 1: Personal Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Age</label>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" required />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs">
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Height (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" required />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Weight (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" required />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Blood Group</label>
                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs">
                          <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                          <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-500">Step 2: Lifestyle Habits</h3>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">Activity Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map((lvl) => (
                          <button key={lvl} type="button" onClick={() => setActivityLevel(lvl)} className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${activityLevel === lvl ? 'bg-primary text-white border-primary shadow' : 'border-slate-200'}`}>{lvl}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Water (L/day)</label>
                        <input type="number" step="0.5" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Sleep (Hours)</label>
                        <input type="number" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">Stress Level</label>
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
                        {['Low', 'Moderate', 'High'].map((lvl) => (
                          <button key={lvl} type="button" onClick={() => setStressLevel(lvl)} className={`flex-grow text-center py-2 rounded-lg font-bold text-xs ${stressLevel === lvl ? 'bg-white text-primary dark:bg-slate-800 dark:text-secondary shadow' : 'text-slate-500'}`}>{lvl}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-500">Step 3: Medical History</h3>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-2">Existing Conditions</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'Heart Disease', 'None'].map((cond) => (
                          <button key={cond} type="button" onClick={() => toggleCondition(cond)} className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${medicalConditions.includes(cond) ? 'bg-primary text-white border-primary shadow' : 'border-slate-200'}`}>{cond}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Allergies</label>
                      <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" placeholder="Aspirin, Peanuts" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Medications</label>
                      <input type="text" value={medications} onChange={(e) => setMedications(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs" placeholder="Metformin 500mg" />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  {wizardStep > 1 ? (
                    <button type="button" onClick={handlePrevStep} className="px-5 py-2.5 border rounded-xl text-xs font-bold">Back</button>
                  ) : (
                    <button type="button" onClick={() => setWizardStep(null)} className="px-5 py-2.5 text-slate-400 text-xs font-bold">Cancel</button>
                  )}
                  {wizardStep < 3 ? (
                    <button type="button" onClick={handleNextStep} className="ml-auto bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm">Next Step</button>
                  ) : (
                    <button type="submit" className="ml-auto bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm">Generate Score</button>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          // Mobile Results Scorecard styled as health_assessment/code.html from mobile.zip
          <div className="space-y-6">
            <header className="flex justify-between items-center border-b pb-4 border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-primary dark:text-secondary">Health Profile Details</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Vitals Analysis</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={handleDownloadReport} className="border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">Export</button>
                <button onClick={startAssessmentWizard} className="bg-primary text-white font-bold px-3 py-1.5 rounded-lg text-xs">Retake</button>
              </div>
            </header>

            {latestAssessment ? (
              <div className="space-y-5">
                
                {/* Score card ring */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-150 shadow-xs flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide self-start">CURRENT WELLNESS SCORE</span>
                  <div className="relative w-36 h-36 flex items-center justify-center mt-3">
                    <div 
                      className="w-full h-full absolute rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, #002045 0% ${latestAssessment.healthScore}%, #e2e8f0 ${latestAssessment.healthScore}% 100%)`
                      }}
                    ></div>
                    <div className="absolute w-[86%] h-[86%] bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-primary dark:text-secondary">{latestAssessment.healthScore}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Score History Recharts Line Chart */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs">
                  <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mb-2.5">Score history</h3>
                  <div className="h-32 w-full text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#002045" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Text Advice */}
                {latestAssessment.analysisText && (
                  <div className="bg-slate-900 text-white p-4.5 rounded-xl text-xs space-y-1">
                    <span className="bg-secondary text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase">Gemini opinion</span>
                    <p className="mt-1 leading-relaxed text-slate-200 italic font-semibold">"{latestAssessment.analysisText}"</p>
                  </div>
                )}

                {/* Breakdown grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { name: 'Phys', val: latestAssessment.activityScore || 0, color: 'text-primary' },
                    { name: 'Nutr', val: latestAssessment.nutritionScore || 0, color: 'text-emerald-500' },
                    { name: 'Sleep', val: latestAssessment.sleepScore || 0, color: 'text-indigo-500' },
                    { name: 'Hydr', val: latestAssessment.hydrationScore || 0, color: 'text-blue-500' },
                    { name: 'Stres', val: latestAssessment.stressScore || 0, color: 'text-orange-500' }
                  ].map(f => (
                    <div key={f.name} className="bg-white dark:bg-slate-800 border p-2 rounded-xl text-center shadow-xs">
                      <span className="text-[8px] text-slate-400 font-bold block">{f.name}</span>
                      <p className={`text-sm font-black mt-0.5 ${f.color}`}>{f.val}%</p>
                    </div>
                  ))}
                </div>

                {/* Risk factors list */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-150 shadow-xs space-y-3">
                  <h3 className="font-extrabold text-xs text-slate-650">Active Vitals Risks</h3>
                  <div className="space-y-2">
                    {latestAssessment.riskFactors?.length > 0 ? (
                      latestAssessment.riskFactors.map((risk, idx) => (
                        <div key={idx} className="p-3 bg-red-50 text-xs rounded-lg space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-red-700">{risk.name}</span>
                            <span className="bg-red-200 text-red-900 px-1.5 py-0.5 rounded text-[7px]">{risk.level}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-snug">{risk.description}</p>
                          <p className="text-[9px] text-red-650 font-bold">Advice: {risk.advice}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No warnings active. Keep up the good habits!</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-slate-800 border rounded-xl p-5 shadow-xs flex flex-col items-center">
                <span className="material-symbols-outlined text-3xl text-primary mb-2">assessment</span>
                <h3 className="font-bold text-sm mt-1">Start Vitals Assessment</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">Update habits and generate scores in real-time.</p>
                <button onClick={startAssessmentWizard} className="bg-primary text-white font-bold px-5 py-2 rounded-lg text-xs">Start Wizard</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop View (Original health assessment details)
  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors">
      <SEO 
        title="AI Health Assessment | BMI | Wellness Analysis | Arogya Raksha"
        description="Calculate your BMI, track daily vitals, and get an AI health assessment to monitor your overall wellness with Arogya Raksha."
        keywords="Health Assessment, BMI Calculator, Wellness Analysis, Track Vitals, Health Score, Daily Health Tracker, AI Healthcare"
        canonical="https://arogyaraksha.com/health-assessment"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Health Assessment & Daily Vitals",
          "url": "https://arogyaraksha.com/health-assessment"
        }}
      />
      
      {/* Header */}
      <header className="mb-stack-md flex flex-col md:flex-row justify-between items-start md:items-end gap-base">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-3xl text-primary">analytics</span> Health Assessment
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300">Understand your overall wellness metrics and risks.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadReport}
            className="border border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-label-md font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">download</span> Export report
          </button>
          <button 
            onClick={startAssessmentWizard}
            disabled={loading}
            className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-md"
          >
            {loading ? 'Analyzing...' : 'Retake Assessment'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-2xl">
          {error}
        </div>
      )}

      {loading && !latestAssessment ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : latestAssessment ? (
        <div className="space-y-gutter">
          
          {/* Top Row: Score circle & Line Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Score Ring Card */}
            <div className="lg:col-span-4 glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-lg mb-6">Current Health Score</h3>
              
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" fill="transparent" r={radius} stroke="#eff4ff" strokeWidth="12"></circle>
                  <circle 
                    cx="80" 
                    cy="80" 
                    fill="transparent" 
                    r={radius} 
                    stroke="#0052cc" 
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700"
                  ></circle>
                </svg>
                <div className="absolute text-center">
                  <p className="text-4xl font-extrabold text-primary dark:text-secondary">{latestAssessment.healthScore}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Score</p>
                </div>
              </div>

              <div className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 px-4 py-1.5 rounded-full font-bold text-label-md">
                {latestAssessment.healthScore >= 90 ? 'Excellent' : latestAssessment.healthScore >= 75 ? 'Good' : 'Moderate'}
              </div>
            </div>

            {/* Recharts Trends */}
            <div className="lg:col-span-8 glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="font-bold text-lg mb-4">Health Score Trend History</h3>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-outline">
                    Perform assessments periodically to view historical score trends.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* AI Health Analysis Narrative */}
          {latestAssessment.analysisText && (
            <div className="glass-card rounded-2xl p-6 bg-white/80 dark:bg-slate-800/80 border-l-4 border-l-secondary shadow-sm">
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold">AI Clinical Analysis</span>
              <p className="mt-3 text-label-md leading-relaxed whitespace-pre-line font-medium text-slate-700 dark:text-slate-300">
                "{latestAssessment.analysisText}"
              </p>
            </div>
          )}

          {/* Breakdown cards */}
          <div>
            <h3 className="text-xl font-bold mb-4">Wellness Factors Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-base">
              {[
                { name: 'Physical', icon: 'directions_run', val: latestAssessment.activityScore || 0, color: 'text-primary' },
                { name: 'Nutrition', icon: 'restaurant', val: latestAssessment.nutritionScore || 0, color: 'text-emerald-500' },
                { name: 'Sleep', icon: 'bedtime', val: latestAssessment.sleepScore || 0, color: 'text-indigo-500' },
                { name: 'Hydration', icon: 'water_drop', val: latestAssessment.hydrationScore || 0, color: 'text-blue-500' },
                { name: 'Stress', icon: 'psychology', val: latestAssessment.stressScore || 0, color: 'text-orange-500' }
              ].map(f => (
                <div key={f.name} className="glass-card rounded-xl p-4 bg-white dark:bg-slate-800 text-center shadow-sm">
                  <span className="text-label-sm text-outline flex items-center justify-center gap-1">
                    <span className={`material-symbols-outlined text-xs ${f.color}`}>{f.icon}</span> {f.name}
                  </span>
                  <p className={`text-2xl font-extrabold mt-2 ${f.color}`}>{f.val}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            
            {/* Risk Factors */}
            <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="text-lg font-bold mb-4">Active Risk Flags</h3>
              <div className="space-y-4">
                {latestAssessment.riskFactors?.length > 0 ? (
                  latestAssessment.riskFactors.map((risk, idx) => (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-red-700 dark:text-red-300">{risk.name}</h4>
                        <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-[8px] font-bold uppercase">{risk.level}</span>
                      </div>
                      <p className="text-label-sm text-on-surface-variant dark:text-slate-300">{risk.description}</p>
                      <p className="text-[10px] text-red-650 dark:text-red-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-red-500">check_circle</span> Advice: {risk.advice}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant dark:text-slate-400 italic text-label-md">No risk factors identified. Maintain your habits!</p>
                )}
              </div>
            </div>

            {/* Improvement Roadmap */}
            <div className="glass-card rounded-2xl p-6 bg-white/70 dark:bg-slate-800/70 shadow-md">
              <h3 className="text-lg font-bold mb-4">Health Improvement Roadmap</h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="font-bold text-label-md">Next 7 Days (Hydration focus)</h4>
                    <p className="text-label-sm text-on-surface-variant dark:text-slate-400">Increase pure water intake to 3L daily. Log items in Tracker.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="font-bold text-label-md">Next 30 Days (Activity focus)</h4>
                    <p className="text-label-sm text-on-surface-variant dark:text-slate-400">Maintain exercise frequency of at least 3 days a week. Complete assessments weekly.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 bg-white/70 dark:bg-slate-800/70 shadow-md text-center max-w-md mx-auto mt-12">
          <p className="text-3xl flex justify-center"><span className="material-symbols-outlined text-4xl text-primary">analytics</span></p>
          <h3 className="font-bold text-xl mt-4">Generate Your Health Report</h3>
          <p className="text-on-surface-variant dark:text-slate-300 text-label-md mt-2 mb-6">
            Arogya Raksha can evaluate your habits, conditions, and vitals to calibrate a detailed health scorecard.
          </p>
          <button 
            onClick={startAssessmentWizard}
            className="bg-primary hover:opacity-90 dark:bg-secondary dark:text-slate-900 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md"
          >
            Start Assessment
          </button>
        </div>
      )}
    </div>
  );
}
