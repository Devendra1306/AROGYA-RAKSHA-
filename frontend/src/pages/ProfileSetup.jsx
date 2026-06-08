import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileSetup() {
  const { updateProfile, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [age, setAge] = useState(profile?.age || '');
  const [gender, setGender] = useState(profile?.gender || 'Male');
  const [height, setHeight] = useState(profile?.height || '');
  const [weight, setWeight] = useState(profile?.weight || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O+');

  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel || 'Sedentary');
  const [exerciseFrequency, setExerciseFrequency] = useState(profile?.exerciseFrequency || 'Never');
  const [waterIntake, setWaterIntake] = useState(profile?.waterIntake || 2);
  const [sleepDuration, setSleepDuration] = useState(profile?.sleepDuration || 7);
  const [stressLevel, setStressLevel] = useState(profile?.stressLevel || 'Moderate');

  const [medicalConditions, setMedicalConditions] = useState(profile?.medicalConditions || []);
  const [allergies, setAllergies] = useState(profile?.allergies || '');
  const [medications, setMedications] = useState(profile?.medications || '');
  const [familyHistory, setFamilyHistory] = useState(profile?.familyHistory || []);

  const [dietPreference, setDietPreference] = useState(profile?.dietPreference || 'Vegetarian');
  const [foodRestrictions, setFoodRestrictions] = useState(profile?.foodRestrictions || []);
  const [favoriteFoods, setFavoriteFoods] = useState(profile?.favoriteFoods || '');
  const [dislikedFoods, setDislikedFoods] = useState(profile?.dislikedFoods || '');
  const [budgetPreference, setBudgetPreference] = useState(profile?.budgetPreference || 'Medium Budget');

  const [healthGoal, setHealthGoal] = useState(profile?.healthGoal || 'Healthy Lifestyle');
  const [targetDuration, setTargetDuration] = useState(profile?.targetDuration || '3 Months');

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

  const toggleRestriction = (rest) => {
    if (foodRestrictions.includes(rest)) {
      setFoodRestrictions(foodRestrictions.filter(r => r !== rest));
    } else {
      setFoodRestrictions([...foodRestrictions, rest]);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!age || !height || !weight)) {
      return setError('Please fill in age, height, and weight.');
    }
    setError('');
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
        age, gender, height, weight, bloodGroup,
        activityLevel, exerciseFrequency, waterIntake, sleepDuration, stressLevel,
        medicalConditions: medicalConditions.length === 0 ? ['None'] : medicalConditions,
        allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
        medications: medications.split(',').map(s => s.trim()).filter(Boolean),
        familyHistory,
        dietPreference,
        foodRestrictions,
        favoriteFoods: favoriteFoods.split(',').map(s => s.trim()).filter(Boolean),
        dislikedFoods: dislikedFoods.split(',').map(s => s.trim()).filter(Boolean),
        budgetPreference,
        healthGoal,
        targetDuration
      };

      await updateProfile(profileData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save health profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-margin-mobile flex items-center justify-center bg-surface dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-2xl glass-card rounded-2xl p-8 bg-white/80 dark:bg-slate-800/80 border border-outline-variant/30 dark:border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-secondary">Health Profile Setup</h1>
            <p className="text-on-surface-variant dark:text-slate-300 text-label-md">Step {step} of 5</p>
          </div>
          <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${step * 20}%` }}></div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-label-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal vitals */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-2">Vitals & Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-medium mb-1">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" placeholder="25" />
                </div>
                <div>
                  <label className="block text-label-md font-medium mb-1">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-label-md font-medium mb-1">Height (cm)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" placeholder="175" />
                </div>
                <div>
                  <label className="block text-label-md font-medium mb-1">Weight (kg)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" placeholder="70" />
                </div>
                <div>
                  <label className="block text-label-md font-medium mb-1">Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Lifestyle Habits */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-2">Lifestyle Information</h3>
              <div>
                <label className="block text-label-md font-medium mb-1">Activity Level</label>
                <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                  <option>Sedentary</option>
                  <option>Lightly Active</option>
                  <option>Moderately Active</option>
                  <option>Very Active</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-medium mb-1">Water Intake (Liters/day)</label>
                  <input type="number" step="0.5" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-label-md font-medium mb-1">Sleep Duration (Hours/night)</label>
                  <input type="number" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-label-md font-medium mb-1">Stress Level</label>
                <select value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>High</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Medical Information */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-2">Medical History & Conditions</h3>
              <div>
                <label className="block text-label-md font-medium mb-2">Existing Conditions</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Diabetes', 'Hypertension', 'Asthma', 'Thyroid', 'Heart Disease', 'Kidney Disease', 'None'].map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        medicalConditions.includes(cond)
                          ? 'border-primary bg-primary/10 text-primary dark:text-secondary dark:border-secondary dark:bg-secondary/10 font-bold'
                          : 'border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-label-md font-medium mb-1">Allergies (comma separated)</label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" placeholder="Aspirin, Peanuts, Gluten" />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-1">Current Medications (comma separated)</label>
                <input type="text" value={medications} onChange={(e) => setMedications(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900" placeholder="Metformin 500mg, Cetirizine 10mg" />
              </div>
            </div>
          )}

          {/* Step 4: Diet Preferences */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-2">Diet & Budget Preference</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md font-medium mb-1">Food Preference</label>
                  <select value={dietPreference} onChange={(e) => setDietPreference(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                    <option>Vegetarian</option>
                    <option>Non-Vegetarian</option>
                    <option>Vegan</option>
                    <option>Eggetarian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-md font-medium mb-1">Monthly Meal Budget</label>
                  <select value={budgetPreference} onChange={(e) => setBudgetPreference(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                    <option>Low Budget</option>
                    <option>Medium Budget</option>
                    <option>Premium</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">Dietary Restrictions</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Lactose Intolerant', 'Gluten-Free', 'Diabetic Diet', 'Low Sodium'].map(rest => (
                    <button
                      key={rest}
                      type="button"
                      onClick={() => toggleRestriction(rest)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        foodRestrictions.includes(rest)
                          ? 'border-primary bg-primary/10 text-primary dark:text-secondary dark:border-secondary dark:bg-secondary/10 font-bold'
                          : 'border-outline-variant hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {rest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Health Goals */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b border-outline-variant/30 pb-2">Health Goals</h3>
              <div>
                <label className="block text-label-md font-medium mb-1">Primary Health Goal</label>
                <select value={healthGoal} onChange={(e) => setHealthGoal(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                  <option>Weight Loss</option>
                  <option>Weight Gain</option>
                  <option>Muscle Gain</option>
                  <option>Healthy Lifestyle</option>
                  <option>Disease Management</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md font-medium mb-1">Target Timeline</label>
                <select value={targetDuration} onChange={(e) => setTargetDuration(e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-slate-50 dark:bg-slate-900">
                  <option>1 Month</option>
                  <option>3 Months</option>
                  <option>6 Months</option>
                  <option>12 Months</option>
                </select>
              </div>
            </div>
          )}

          {/* Controls buttons */}
          <div className="mt-8 flex justify-between gap-4 border-t border-outline-variant/30 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-6 py-3 border border-outline-variant rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 font-bold"
              >
                Previous
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-bold shadow-md"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-8 py-3 bg-primary text-white rounded-xl hover:opacity-90 font-bold shadow-md"
              >
                {loading ? 'Submitting...' : 'Save & Complete'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
