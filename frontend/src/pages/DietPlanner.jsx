import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const MEAL_IMAGES = {
  breakfast: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApKnP_JT0b4p0sD2cpbCJ7w8EYy8sodpLksPhe1U2hoKXKge-Lbw7P_QSEKL1QnwuCz_T6KqEfP-WYbeI1ZRlhDNll605bMuP5RbEzcAaqSc-GWMitfqct056IlDXCcYn-8P53Lcj05h1YB_dFAnoucPG4mLp6r4eMW65BzFGvKh3P9EciWUPJskWMdjY2OYvV6MOogNXJSp-BcEkf3Ksuzk8646RZIHQNrV8OuT56Sm2tSf8WZG4n0gQ5bRmTmwOyNcqT8Y43NNo',
  lunch: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6grMX8BCDp_sfOgTislvQD9SlXqovzCQcskyzf90mlJhL6ooOIpztUX2PAQ7NaBU6NqKl1BS8TagPjIguZcjVmhMInVxBSgMxHdY5RbcmYIOIIYHXc_K--iFOZoHr1h6W4DT6UlM6KXrCTSfe-ftd27A63UGJJMOkippx_PzcgUlxkEty_-d-GX3kscyWCujv9MLkGUMgtAWvxdAtgS6mKRN7v_58gAPI61JOQnKIT593pL0SRI-0PBwY4_jTG1_wLS6F8Qy3L2g',
  snack: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7vaAMZubXsKK0lDLchllQRLIdO86dGJWahcFdUh-A5CPbLQTCHoPRgvKNDZ_2BOXSckFnxZ6zNqJJtq7d-Tk9xcWXdNrcOvqF-nlAACdELMm8TfkYSbsR4Do0yCqBjXBfgGspFeoTuUPj3ZzgHG71LGMHfXKukxczQSsZqxXwQvcGy0LMzwg_wol907VjkJadza2oNZS4i5rr1dblhnD8rBFFBIpDExUjnbYZyHo1KiFZO2CQlzE-VgH19f5vqFzO-GCdzVdOPN0',
  dinner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm9ZA0dbcnU-cGi8nl5x8gg6YA8RJmykWCEu6Swqi5PVemjPgKSNM7HsUorFTjuC3fWb6g0-c-jJaXNcc039Tmhhuv9ug-pZelNISjC-tNWrIUB0WmaNaE4_JrKAldOi1B0kFpbJKts_dK6F2xvOQ_pMXwj76brcsqE4CqTphLAY22ns9ew2GOEjYbyaM3eO9fGd_VCc-F00a5dCDQtgEVKSYIMM_Wp9x_Q2HaUlvxvlk2mG-Bmhx0AzcW6-zS7XrS7wkrWj1Qfxg'
};

const getMealImage = (mealType) => {
  const type = mealType.toLowerCase();
  if (type.includes('breakfast')) return MEAL_IMAGES.breakfast;
  if (type.includes('lunch')) return MEAL_IMAGES.lunch;
  if (type.includes('dinner')) return MEAL_IMAGES.dinner;
  return MEAL_IMAGES.snack;
};

export default function DietPlanner() {
  const { profile } = useAuth();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab State: Breakfast, Lunch, Snack, Dinner
  const [activeMealTab, setActiveMealTab] = useState('Breakfast');

  // Preferences
  const [dietPreference, setDietPreference] = useState(profile?.dietPreference || 'Vegetarian');
  const [budgetPreference, setBudgetPreference] = useState(profile?.budgetPreference || 'Medium Budget');

  // Trackers local state
  const [waterIntake, setWaterIntake] = useState(2.1);
  const [currentWeight, setCurrentWeight] = useState(profile?.weight || 75);
  const [weightInput, setWeightInput] = useState('');

  // Consumed meals (indices of mealPlan)
  const [consumedMeals, setConsumedMeals] = useState([1]); // default lunch checked

  // Grocery checked items
  const [checkedGroceries, setCheckedGroceries] = useState([]);

  // Extra food log items
  const [extraFoods, setExtraFoods] = useState([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodLoading, setFoodLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    fetchDietPlan();
  }, []);

  const fetchDietPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diet/current');
      setDietPlan(res.data);
      setWaterIntake(res.data.waterGoal - 1.4);
      setExtraFoods(res.data.extraFoods || []);
    } catch (err) {
      console.warn('No active diet plan found.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/diet/generate');
      setDietPlan(res.data);
      setWaterIntake(res.data.waterGoal - 1.4);
      setConsumedMeals([1]); // default checked lunch
      setExtraFoods([]); 
      setSearchResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate meal plan. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogWater = (amount) => {
    setWaterIntake(prev => Number((prev + amount).toFixed(2)));
  };

  const handleResetWater = () => {
    setWaterIntake(0);
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weightInput) return;
    try {
      await api.post('/diet/update-weight', { weight: Number(weightInput) });
      setCurrentWeight(Number(weightInput));
      setWeightInput('');
      alert('Weight progress logged successfully.');
    } catch (err) {
      alert('Failed to update weight.');
    }
  };

  const toggleGroceryCheck = (idx) => {
    if (checkedGroceries.includes(idx)) {
      setCheckedGroceries(checkedGroceries.filter(i => i !== idx));
    } else {
      setCheckedGroceries([...checkedGroceries, idx]);
    }
  };

  const toggleMealConsumed = (idx) => {
    if (consumedMeals.includes(idx)) {
      setConsumedMeals(consumedMeals.filter(i => i !== idx));
    } else {
      setConsumedMeals([...consumedMeals, idx]);
    }
  };

  const handleSearchFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    setFoodLoading(true);
    setSearchResult(null);
    try {
      const res = await api.post('/diet/analyze-food', { query: foodQuery });
      if (res.data._isError) {
        alert('⚠️ AI analysis temporarily unavailable. Please try again.');
        return;
      }
      setSearchResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze recipe details. Make sure to specify quantity (e.g. "Chicken 500g", "2 rotis").');
    } finally {
      setFoodLoading(false);
    }
  };

  const handleAddToDiet = async () => {
    if (!searchResult) return;
    try {
      const res = await api.post('/diet/add-extra-food', searchResult);
      setExtraFoods(res.data.extraFoods || []);
      setDietPlan(res.data);
      setSearchResult(null);
      setFoodQuery('');
    } catch (err) {
      console.error(err);
      alert('Failed to add food to your diet plan.');
    }
  };

  const handleClearExtraFoods = async () => {
    try {
      const res = await api.post('/diet/clear-extra-foods');
      setExtraFoods([]);
      setDietPlan(res.data);
      setSearchResult(null);
    } catch (err) {
      console.error(err);
      alert('Failed to clear extra food logs.');
    }
  };

  const handleSwapMeal = async (mealType) => {
    if (!activePlan) return;
    const currentMeal = activePlan.mealPlan.find(m => m.mealType === mealType);
    const currentFood = currentMeal ? currentMeal.foodItems : '';

    setLoading(true);
    try {
      const res = await api.post('/diet/swap-meal', {
        mealType,
        currentFood,
        dietPreference
      });

      if (dietPlan) {
        setDietPlan(prev => {
          const updatedPlan = prev.mealPlan.map(m => {
            if (m.mealType === mealType) {
              return {
                ...m,
                foodItems: res.data.foodItems,
                calories: res.data.calories,
                protein: res.data.protein,
                carbs: res.data.carbs,
                fats: res.data.fats
              };
            }
            return m;
          });
          return { ...prev, mealPlan: updatedPlan };
        });
      } else {
        alert(`Alternative generated: ${res.data.foodItems}`);
      }
    } catch (err) {
      alert('Failed to generate dynamic alternative meal option.');
    } finally {
      setLoading(false);
    }
  };

  // Default values
  const activePlan = dietPlan || {
    dailyCalories: 2000,
    protein: 140,
    carbs: 210,
    fats: 60,
    waterGoal: 3.5,
    mealPlan: [
      { mealType: 'Breakfast', foodItems: 'Greek Yogurt & Berry Medley', calories: 350, protein: 25, carbs: 40, fats: 5, time: '08:30 AM' },
      { mealType: 'Lunch', foodItems: 'Quinoa & Grilled Chicken Bowl', calories: 580, protein: 45, carbs: 65, fats: 10, time: '01:30 PM' },
      { mealType: 'Snack', foodItems: 'Almonds & Green Apple', calories: 210, protein: 6, carbs: 30, fats: 8, time: '04:30 PM' },
      { mealType: 'Dinner', foodItems: 'Steamed Fish with Asparagus', calories: 420, protein: 38, carbs: 20, fats: 12, time: '08:00 PM' }
    ],
    groceryList: [
      { item: 'Organic Greek Yogurt', quantity: '2 Large Tubs', category: 'Dairy' },
      { item: 'Quinoa - Tri-color', quantity: '1kg Pack', category: 'Grains' },
      { item: 'Fresh Atlantic Salmon', quantity: '500g', category: 'Protein' }
    ]
  };

  // Macro progress variables
  const targetCals = activePlan.dailyCalories;
  const baseCals = activePlan.mealPlan.reduce((acc, meal, idx) => {
    return acc + (consumedMeals.includes(idx) ? meal.calories : 0);
  }, 0);
  const extraCals = extraFoods.reduce((acc, food) => acc + food.calories, 0);
  const consumedCals = baseCals + extraCals;
  const progressPercent = Math.min(1, consumedCals / targetCals);

  const consumedProtein = activePlan.mealPlan.reduce((acc, meal, idx) => {
    return acc + (consumedMeals.includes(idx) ? meal.protein : 0);
  }, 0) + extraFoods.reduce((acc, f) => acc + f.protein, 0);

  const consumedCarbs = activePlan.mealPlan.reduce((acc, meal, idx) => {
    return acc + (consumedMeals.includes(idx) ? meal.carbs : 0);
  }, 0) + extraFoods.reduce((acc, f) => acc + f.carbs, 0);

  const consumedFats = activePlan.mealPlan.reduce((acc, meal, idx) => {
    return acc + (consumedMeals.includes(idx) ? meal.fats : 0);
  }, 0) + extraFoods.reduce((acc, f) => acc + f.fats, 0);

  const proteinPercent = Math.min(100, Math.round((consumedProtein / activePlan.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((consumedCarbs / activePlan.carbs) * 100));
  const fatsPercent = Math.min(100, Math.round((consumedFats / activePlan.fats) * 100));

  const targetWeight = profile?.weight ? profile.weight - 5 : 70;
  const weightToGo = Math.max(0, currentWeight - targetWeight);

  // Find index of the currently active tab inside activePlan.mealPlan
  const activeMealIndex = activePlan.mealPlan.findIndex(
    m => m.mealType.toLowerCase() === activeMealTab.toLowerCase()
  );
  const activeMealObj = activeMealIndex !== -1 ? activePlan.mealPlan[activeMealIndex] : null;
  const isActiveMealChecked = activeMealIndex !== -1 && consumedMeals.includes(activeMealIndex);

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-6 text-slate-800 dark:text-slate-100 transition-colors animate-fade-in">
      
      {/* Header Panel */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-primary dark:text-secondary flex items-center gap-2">
            🥗 Diet Planner
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage weight goals, calorie rings, and personalized recipes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={dietPreference}
            onChange={(e) => setDietPreference(e.target.value)}
            className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-primary outline-none cursor-pointer"
          >
            <option value="Vegetarian">Veg</option>
            <option value="Non-Veg">Non-Veg</option>
            <option value="Vegan">Vegan</option>
            <option value="Keto">Keto</option>
          </select>
          <select 
            value={budgetPreference}
            onChange={(e) => setBudgetPreference(e.target.value)}
            className="bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:border-primary outline-none cursor-pointer"
          >
            <option value="Medium Budget">Mid-Budget</option>
            <option value="Low Budget">Low-Budget</option>
            <option value="Premium">Premium</option>
          </select>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:opacity-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
          >
            {loading ? 'Wait...' : 'Regenerate'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-350 border border-red-100/40 rounded-xl text-xs">
          {error}
        </div>
      )}

      {loading && !dietPlan ? (
        <div className="flex flex-col justify-center items-center py-20 gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compiling Daily Macros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Content Area: Meal Planner & Vitals Logs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Horizontal Swipe Tabs for Meals */}
            <section className="glass-card rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-extrabold text-sm">Today's Meal Tabs</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Tap to log macros</span>
              </div>
              
              {/* Tab Selector Buttons */}
              <div className="flex justify-between bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1 overflow-x-auto">
                {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((mealName) => (
                  <button
                    key={mealName}
                    onClick={() => setActiveMealTab(mealName)}
                    className={`flex-1 text-center py-2 rounded-lg font-bold text-xs transition-all ${activeMealTab === mealName ? 'bg-primary text-white dark:bg-secondary dark:text-slate-900 shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50'}`}
                  >
                    {mealName}
                  </button>
                ))}
              </div>

              {/* Active Tab Meal Card Details */}
              {activeMealObj ? (
                <div 
                  onClick={() => toggleMealConsumed(activeMealIndex)}
                  className={`border rounded-2xl p-4 flex gap-4 items-center cursor-pointer transition-all hover:border-primary/30 relative border-l-4 ${isActiveMealChecked ? 'border-l-primary bg-blue-50/10' : 'border-l-transparent bg-slate-50/30 dark:bg-slate-900/40'}`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img 
                      alt={activeMealObj.mealType} 
                      src={getMealImage(activeMealObj.mealType)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-secondary font-bold uppercase tracking-wider">{activeMealObj.mealType}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{activeMealObj.time || 'Schedule'}</span>
                    </div>
                    <h4 className="font-extrabold text-xs mt-0.5 leading-snug">{activeMealObj.foodItems}</h4>
                    <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-bold">
                      <span>{activeMealObj.calories} kcal</span>
                      <span>•</span>
                      <span>{activeMealObj.protein}g Protein</span>
                      <span>•</span>
                      <span>{activeMealObj.carbs}g Carbs</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 justify-between">
                    {isActiveMealChecked ? (
                      <span className="text-primary text-lg font-bold">✓ Logged</span>
                    ) : (
                      <span className="text-slate-350 text-xs font-semibold">Log Meal</span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwapMeal(activeMealObj.mealType);
                      }}
                      className="text-[9px] font-bold text-primary dark:text-secondary hover:underline"
                    >
                      🔄 Swap Option
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-center py-4 text-slate-450">No meal details defined for this tab.</p>
              )}
            </section>

            {/* Weight Loss Journey */}
            <section className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm">Weight Tracker</h3>
                  <p className="text-[9px] text-slate-450 uppercase font-semibold">Transform roadmap</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                  Active Goal
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center items-center py-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Current</p>
                  <p className="text-xl font-black text-primary dark:text-secondary">{currentWeight} <span className="text-[10px] font-normal text-slate-400">kg</span></p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-450 font-bold">{weightToGo}kg Remaining</p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(10, Math.min(100, (currentWeight - targetWeight) * 8))}%` }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Target</p>
                  <p className="text-xl font-black text-secondary">{targetWeight} <span className="text-[10px] font-normal text-slate-400">kg</span></p>
                </div>
              </div>

              {/* Log Weight Form */}
              <form onSubmit={handleWeightSubmit} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-750">
                <span className="text-xs text-slate-500 font-medium">Log Today's Weight:</span>
                <input 
                  type="number" 
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-20 p-1.5 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs text-center font-bold" 
                  placeholder="kg"
                />
                <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs">
                  Save
                </button>
              </form>
            </section>

          </div>

          {/* Right Side: Calorie Ring, Water Log, Groceries & AI search */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Calorie Ring Summary */}
            <section className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <h3 className="font-extrabold text-sm mb-4 self-start">Macro Balance</h3>
              
              {/* SVG Gauge */}
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" fill="transparent" r="54" stroke="#f1f5f9" strokeWidth="8" className="dark:stroke-slate-800"></circle>
                  <circle 
                    cx="64" 
                    cy="64" 
                    fill="transparent" 
                    r="54" 
                    stroke="#0052cc" 
                    strokeDasharray="340" 
                    strokeDashoffset={340 * (1 - progressPercent)} 
                    strokeWidth="8" 
                    className="transition-all duration-500"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute text-center">
                  <p className="text-2xl font-black text-primary dark:text-secondary">{consumedCals}</p>
                  <p className="text-[8px] text-slate-400 font-bold">of {targetCals} kcal</p>
                </div>
              </div>

              {/* Macros breakdown pills */}
              <div className="w-full space-y-2 text-xs">
                <div className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="font-semibold text-slate-500">Protein</span>
                  <span className="font-bold">{consumedProtein}g / {activePlan.protein}g ({proteinPercent}%)</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="font-semibold text-slate-500">Carbs</span>
                  <span className="font-bold text-secondary">{consumedCarbs}g / {activePlan.carbs}g ({carbsPercent}%)</span>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="font-semibold text-slate-500">Fats</span>
                  <span className="font-bold text-orange-500">{consumedFats}g / {activePlan.fats}g ({fatsPercent}%)</span>
                </div>
              </div>
            </section>

            {/* Water Tracker */}
            <section className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm flex items-center gap-1">💧 Water Log</h3>
                <button 
                  onClick={handleResetWater}
                  className="text-[9px] text-slate-400 hover:underline font-bold"
                >
                  Reset
                </button>
              </div>

              <div className="text-center py-2">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{waterIntake} <span className="text-xs font-bold">Liters</span></p>
                <p className="text-[8px] text-slate-450 uppercase font-bold mt-0.5">Goal: {activePlan.waterGoal || 3.5} Liters</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleLogWater(0.25)} 
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 py-2 rounded-xl font-bold text-xs"
                >
                  +250ml
                </button>
                <button 
                  onClick={() => handleLogWater(0.5)} 
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 py-2 rounded-xl font-bold text-xs"
                >
                  +500ml
                </button>
              </div>
            </section>

            {/* Custom Extra Food Log Search */}
            <section className="glass-card rounded-2xl p-5 bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-secondary text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">AI Recipe log</span>
                {extraFoods.length > 0 && (
                  <button onClick={handleClearExtraFoods} className="text-[10px] text-slate-300 underline">
                    Clear All
                  </button>
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-secondary">Log custom dishes & meals</h4>
                <p className="text-[10px] text-slate-300 mt-1">Specify amount: (e.g. "2 boiled eggs", "1 cup oatmeal")</p>
              </div>

              <form onSubmit={handleSearchFoodSubmit} className="flex gap-1.5">
                <input 
                  type="text" 
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="e.g. 1 bowl salad..."
                  className="flex-grow p-2 rounded-lg text-xs bg-white text-slate-800 outline-none"
                  required
                />
                <button 
                  type="submit" 
                  disabled={foodLoading}
                  className="bg-secondary text-slate-900 font-bold px-3 rounded-lg text-xs"
                >
                  {foodLoading ? 'Analyzing' : 'Check'}
                </button>
              </form>

              {searchResult && (
                <div className="bg-white/10 p-3 rounded-xl text-xs space-y-2.5">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{searchResult.foodName}</span>
                      <span className="text-[9px] block text-slate-350">{searchResult.quantity}</span>
                    </div>
                    <span className="text-secondary font-black">{searchResult.calories} kcal</span>
                  </div>
                  <button 
                    onClick={handleAddToDiet}
                    className="w-full bg-secondary text-slate-900 font-bold py-1.5 rounded-lg text-center text-xs"
                  >
                    ➕ Log to My Diet
                  </button>
                </div>
              )}

              {/* Display custom logs */}
              {extraFoods.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {extraFoods.map((food, idx) => (
                    <div key={idx} className="bg-white/5 p-2 rounded-lg text-[10px] flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-white">{food.foodName}</span> ({food.quantity})
                      </div>
                      <span className="text-secondary font-bold">{food.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Shopping List */}
            <section className="glass-card rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm">Grocery Shopping Checklist</h3>
              <div className="space-y-2">
                {activePlan.groceryList.map((grocery, idx) => {
                  const isChecked = checkedGroceries.includes(idx);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleGroceryCheck(idx)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 text-xs transition-all ${isChecked ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-150'}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${isChecked ? 'bg-primary text-white border-primary' : 'border-slate-300'}`}>
                        {isChecked ? '✓' : ''}
                      </span>
                      <div className="flex-grow">
                        <p className={`font-semibold ${isChecked ? 'line-through' : ''}`}>{grocery.item}</p>
                        <p className="text-[9px] text-slate-400">{grocery.quantity} • {grocery.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

        </div>
      )}

    </div>
  );
}
