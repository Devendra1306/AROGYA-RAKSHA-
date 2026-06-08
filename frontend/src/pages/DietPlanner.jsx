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

const getGroceryPrice = (index) => {
  return ['12.50', '8.00', '22.00', '4.20', '6.50', '15.00'][index % 6];
};

export default function DietPlanner() {
  const { profile } = useAuth();
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown states
  const [dietPreference, setDietPreference] = useState(profile?.dietPreference || 'Vegetarian');
  const [budgetPreference, setBudgetPreference] = useState(profile?.budgetPreference || 'Medium Budget');

  // Trackers local state
  const [waterIntake, setWaterIntake] = useState(2.1);
  const [currentWeight, setCurrentWeight] = useState(profile?.weight || 100);
  const [weightInput, setWeightInput] = useState('');

  // Consumed meals (matching index from mealPlan)
  const [consumedMeals, setConsumedMeals] = useState([1]); // default lunch (index 1) checked

  // Grocery checked items
  const [checkedGroceries, setCheckedGroceries] = useState([]);

  // Extra food log items (User logs apart from the diet plan)
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
      setExtraFoods([]); // clear extra foods on regeneration
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

  // Search recipe nutrition details (doesn't log it directly yet)
  const handleSearchFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    setFoodLoading(true);
    setSearchResult(null);
    try {
      const res = await api.post('/diet/analyze-food', { query: foodQuery });
      if (res.data._isError) {
        alert('⚠️ AI analysis temporarily unavailable. Please try again in a moment. The AI is processing your request.');
        return;
      }
      setSearchResult(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 503) {
        alert('⚠️ AI service is temporarily unavailable. Please try again in a moment.');
      } else {
        alert('Failed to analyze recipe details. Make sure to specify quantity (e.g. "Chicken 500g", "2 rotis", "1 cup rice").');
      }
    } finally {
      setFoodLoading(false);
    }
  };


  // Add the analyzed recipe directly to user's daily diet plan in database
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
      alert('Failed to add food to your active diet plan.');
    }
  };

  // Clear persistent extra food logs from database
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

  // Dynamic swap meal calling the backend API to generate alternatives on the fly
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
        // Swap directly in existing user plan
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
        // Fallback or custom update
        alert(`Alternative generated: ${res.data.foodItems}`);
      }
    } catch (err) {
      alert('Failed to generate dynamic alternative meal option.');
    } finally {
      setLoading(false);
    }
  };

  // Helper values / local fallback plan
  const activePlan = dietPlan || {
    dailyCalories: 2200,
    protein: 150,
    carbs: 220,
    fats: 65,
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

  // Calorie Progress calculations
  const targetCals = activePlan.dailyCalories;
  const baseCals = activePlan.mealPlan.reduce((acc, meal, idx) => {
    return acc + (consumedMeals.includes(idx) ? meal.calories : 0);
  }, 0);
  const extraCals = extraFoods.reduce((acc, food) => acc + food.calories, 0);
  const consumedCals = baseCals + extraCals;
  const progressPercent = Math.min(1, consumedCals / targetCals);
  const strokeOffset = 440 * (1 - progressPercent);

  // Macro Progress calculations including extra logged foods
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

  // Weight goal remaining metrics
  const targetWeight = profile?.weight ? profile.weight - 15 : 85;
  const weightToGo = Math.max(0, currentWeight - targetWeight);

  return (
    <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md text-slate-800 dark:text-slate-100 transition-colors animate-fadeIn">
      
      {/* Header */}
      <header className="mb-stack-md flex flex-col md:flex-row justify-between items-start md:items-end gap-base border-b border-outline-variant/20 pb-6">
        <div>
          <h1 className="text-3xl font-headline-lg font-bold text-primary dark:text-secondary flex items-center gap-2">
            🥗 Diet Planner
          </h1>
          <p className="text-on-surface-variant dark:text-slate-300 text-body-md mt-1">
            Your clinically personalized nutrition journey for a healthier tomorrow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <select 
            value={dietPreference}
            onChange={(e) => setDietPreference(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-outline-variant rounded-xl px-4 py-2.5 text-label-md font-medium text-on-surface-variant dark:text-slate-200 focus:border-primary outline-none shadow-sm cursor-pointer"
          >
            <option value="Vegetarian">Vegetarian</option>
            <option value="Non-Veg">Non-Veg</option>
            <option value="Vegan">Vegan</option>
            <option value="Keto">Keto</option>
          </select>
          <select 
            value={budgetPreference}
            onChange={(e) => setBudgetPreference(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-outline-variant rounded-xl px-4 py-2.5 text-label-md font-medium text-on-surface-variant dark:text-slate-200 focus:border-primary outline-none shadow-sm cursor-pointer"
          >
            <option value="Medium Budget">Medium Budget</option>
            <option value="Low Budget">Low Budget</option>
            <option value="Premium">Premium</option>
          </select>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:opacity-95 dark:bg-secondary dark:text-slate-900 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            {loading ? 'Generating...' : 'Regenerate Plan'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-2xl">
          {error}
        </div>
      )}

      {loading && !dietPlan ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-gutter">
          
          {/* Top Row: Goal Progress & Daily Target Ring */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Weight Loss Journey */}
            <section className="lg:col-span-8 glass-card rounded-3xl p-6 bg-white/80 dark:bg-slate-800/80 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-xl text-on-surface dark:text-slate-100">Weight Loss Journey</h2>
                    <p className="text-xs text-outline">Estimated 6-month transformation timeline</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 rounded-full text-xs font-bold">
                    On Track
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center my-4">
                  <div className="text-center">
                    <p className="text-[10px] text-outline uppercase font-bold">Current</p>
                    <p className="text-3xl font-extrabold text-primary dark:text-secondary">{currentWeight}<span className="text-xs font-normal text-outline">kg</span></p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.max(10, Math.min(100, (currentWeight - targetWeight) * 4))}%` }}></div>
                    </div>
                    <p className="text-[10px] text-outline mt-1.5 font-bold">{weightToGo}kg to go</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-outline uppercase font-bold">Target</p>
                    <p className="text-3xl font-extrabold text-secondary">{targetWeight}<span className="text-xs font-normal text-outline">kg</span></p>
                  </div>
                </div>
              </div>

              {/* simulated weight graph bar */}
              <div className="h-28 w-full flex items-end gap-1.5 mt-4">
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[90%] transition-all hover:bg-primary/20 flex flex-col justify-end items-center pb-1 text-[9px] text-outline font-bold" title="Month 1: 100kg">100</div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[85%] transition-all hover:bg-primary/20 flex flex-col justify-end items-center pb-1 text-[9px] text-outline font-bold" title="Month 2: 96kg">96</div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[75%] transition-all hover:bg-primary/20 flex flex-col justify-end items-center pb-1 text-[9px] text-outline font-bold" title="Month 3: 92kg">92</div>
                <div className="flex-1 bg-primary/10 rounded-t-lg h-[68%] transition-all hover:bg-primary/20 flex flex-col justify-end items-center pb-1 text-[9px] text-outline font-bold" title="Month 4: 89kg">89</div>
                <div className="flex-1 bg-primary/30 dark:bg-primary/50 rounded-t-lg h-[60%] border-t-2 border-primary flex flex-col justify-end items-center pb-1 text-[9px] text-primary dark:text-secondary font-extrabold" title="Today">{currentWeight}</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-t-lg h-[55%] border-t-2 border-outline-variant border-dashed flex flex-col justify-end items-center pb-1 text-[9px] text-outline" title="Month 6">85</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-t-lg h-[50%] border-t-2 border-outline-variant border-dashed flex flex-col justify-end items-center pb-1 text-[9px] text-outline" title="Target">85</div>
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-outline font-bold">
                <span>Month 1</span>
                <span>Month 2</span>
                <span>Month 3</span>
                <span>Month 4</span>
                <span className="text-primary dark:text-secondary font-extrabold">Today</span>
                <span>Month 6</span>
                <span>Target</span>
              </div>

              {/* Inline weight logs form */}
              <form onSubmit={handleWeightSubmit} className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-2">
                <span className="text-xs text-outline font-medium">Log weight today:</span>
                <input 
                  type="number" 
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-24 p-1.5 rounded-lg border border-outline-variant bg-slate-50 dark:bg-slate-900 outline-none text-xs text-center" 
                  placeholder="Weight (kg)"
                />
                <button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow-sm">
                  Log
                </button>
              </form>
            </section>

            {/* Daily Targets Rings */}
            <section className="lg:col-span-4 glass-card rounded-3xl p-6 bg-white/80 dark:bg-slate-800/80 shadow-md flex flex-col justify-between">
              <h2 className="font-bold text-lg mb-4 text-on-surface dark:text-slate-100">Daily Macro Targets</h2>
              <div className="flex flex-col items-center gap-4">
                
                {/* SVG Calorie Circle Ring */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" fill="transparent" r="62" stroke="#eff4ff" strokeWidth="10" className="dark:stroke-slate-700"></circle>
                    <circle 
                      cx="72" 
                      cy="72" 
                      fill="transparent" 
                      r="62" 
                      stroke="#003d9b" 
                      strokeDasharray="390" 
                      strokeDashoffset={390 * (1 - progressPercent)} 
                      strokeWidth="10" 
                      className="transition-all duration-700 ease-out"
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-3xl font-extrabold text-primary dark:text-secondary">{consumedCals}</p>
                    <p className="text-[10px] text-outline font-bold">of {targetCals} kcal</p>
                  </div>
                </div>

                {/* Macromolecules progress bars */}
                <div className="w-full space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-0.5">
                      <span>Protein</span>
                      <span className="text-outline">{consumedProtein}g / {activePlan.protein}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${proteinPercent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-0.5">
                      <span>Carbs</span>
                      <span className="text-outline">{consumedCarbs}g / {activePlan.carbs}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: `${carbsPercent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-0.5">
                      <span>Fats</span>
                      <span className="text-outline">{consumedFats}g / {activePlan.fats}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: `${fatsPercent}%` }}></div>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </div>

          {/* Middle Row: Meal Plan & Water Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Personalized Meal Plan */}
            <section className="lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-xl text-on-surface dark:text-slate-100">Today's Meal Plan</h2>
                  <p className="text-xs text-outline">Click meal cards to check them as consumed and update daily calories</p>
                </div>
                <button 
                  onClick={handleGenerate}
                  className="text-primary hover:underline text-label-md font-bold flex items-center gap-1"
                >
                  🔄 Regenerate Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlan.mealPlan.map((meal, idx) => {
                  const isChecked = consumedMeals.includes(idx);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleMealConsumed(idx)}
                      className={`glass-card p-4 rounded-2xl flex gap-4 items-center group cursor-pointer hover:border-primary/45 transition-all relative border-l-4 ${isChecked ? 'border-l-primary bg-blue-50/15 dark:bg-slate-900/50' : 'border-l-transparent'}`}
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        <img 
                          alt={meal.mealType} 
                          src={getMealImage(meal.mealType)}
                          className="w-full h-full object-cover transition-all group-hover:scale-105"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-secondary uppercase font-extrabold">{meal.mealType}</span>
                          <span className="text-[10px] text-outline font-bold">{meal.time || 'Meal Time'}</span>
                        </div>
                        <h4 className="font-bold text-label-md mt-0.5 leading-snug">{meal.foodItems}</h4>
                        <div className="flex gap-2.5 text-[10px] text-outline mt-1 font-bold">
                          <span>{meal.calories} kcal</span>
                          <span>•</span>
                          <span>{meal.protein}g Protein</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between h-full gap-2">
                        {isChecked ? (
                          <span className="text-primary text-xl select-none" title="Consumed">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xl group-hover:text-primary transition-all select-none">○</span>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapMeal(meal.mealType);
                          }}
                          className="text-[10px] font-bold text-primary hover:underline hover:text-opacity-80 py-1"
                          title="Swap alternative foods"
                        >
                          Swap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Water Tracker Cylinder glass */}
            <section className="lg:col-span-3 glass-card rounded-3xl p-6 bg-white/80 dark:bg-slate-800/80 shadow-md flex flex-col justify-between relative overflow-hidden">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="text-xl">💧</span> Water Tracker
              </h3>
              
              <div className="flex-grow flex flex-col justify-center items-center gap-4">
                
                {/* Cylinder filling visual animations */}
                <div className="relative w-24 h-40 border-4 border-slate-300 dark:border-slate-600 rounded-b-3xl overflow-hidden bg-slate-100/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-inner flex items-end justify-center">
                  
                  {/* reset water button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleResetWater(); }}
                    className="absolute top-2 left-2 text-[9px] font-bold text-blue-500 hover:text-blue-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-700 z-20 shadow-sm transition-all"
                  >
                    Reset
                  </button>

                  <div 
                    style={{ height: `${Math.min(100, Math.round((waterIntake / (activePlan.waterGoal || 3.5)) * 100))}%` }}
                    className="absolute bottom-0 left-0 w-full bg-blue-500/80 dark:bg-blue-600/80 transition-all duration-1000 ease-out flex items-center justify-center animate-pulse"
                  >
                    {/* Underlay Wave */}
                    <svg 
                      className="absolute left-0 w-[200%] h-4 -top-3.5 fill-blue-500/80 dark:fill-blue-600/80"
                      style={{ animation: 'wave 6s linear infinite' }}
                      viewBox="0 0 120 28"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 15 Q 30 5, 60 15 T 120 15 T 180 15 T 240 15 L 240 28 L 0 28 Z" opacity="0.4" />
                    </svg>
                    {/* Overlay Wave */}
                    <svg 
                      className="absolute left-0 w-[200%] h-3.5 -top-3 fill-blue-500 dark:fill-blue-600"
                      style={{ animation: 'wave 3s linear infinite' }}
                      viewBox="0 0 120 28"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 15 Q 35 10, 70 15 T 140 15 T 210 15 T 280 15 L 280 28 L 0 28 Z" />
                    </svg>

                    {Math.round((waterIntake / (activePlan.waterGoal || 3.5)) * 100) > 10 && (
                      <span className="text-white text-[10px] font-bold drop-shadow-md z-10">
                        {Math.round((waterIntake / (activePlan.waterGoal || 3.5)) * 100)}%
                      </span>
                    )}
                  </div>

                  {waterIntake === 0 && (
                    <span className="absolute bottom-2 text-slate-400 text-[10px] font-bold">Empty</span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{waterIntake}<span className="text-sm font-bold">L</span></p>
                  <p className="text-[10px] text-outline">Goal: {activePlan.waterGoal} Liters</p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button 
                    onClick={() => handleLogWater(0.25)} 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
                  >
                    +250ml
                  </button>
                  <button 
                    onClick={() => handleLogWater(0.5)} 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
                  >
                    +500ml
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Row: Shopping List & Custom Food Log Search */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Weekly Shopping List */}
            <section className="lg:col-span-6 glass-card rounded-3xl p-6 bg-white/80 dark:bg-slate-800/80 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-on-surface dark:text-slate-100">Weekly Shopping List</h3>
                <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">
                  {activePlan.groceryList.length} Items
                </span>
              </div>
              
              <div className="space-y-2.5">
                {activePlan.groceryList.map((grocery, idx) => {
                  const isChecked = checkedGroceries.includes(idx);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleGroceryCheck(idx)}
                      className={`p-3 rounded-xl border border-outline-variant/35 cursor-pointer flex items-center gap-3 transition-all ${isChecked ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800'}`}
                    >
                      <span className={`w-5 h-5 rounded border flex items-center justify-center font-bold text-xs ${isChecked ? 'bg-primary text-white border-primary' : 'border-outline-variant'}`}>
                        {isChecked ? '✓' : ''}
                      </span>
                      <div className="flex-grow">
                        <p className={`font-bold text-label-md ${isChecked ? 'line-through' : ''}`}>{grocery.item}</p>
                        <p className="text-[10px] text-outline">{grocery.quantity} • {grocery.category}</p>
                      </div>
                      <span className="font-bold text-secondary dark:text-emerald-400 text-xs">₹{grocery.price || Math.round(50 + (idx * 30))}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Custom Extra Food / Recipe Log Card */}
            <section className="lg:col-span-6 bg-primary text-on-primary dark:bg-slate-900 border border-primary/20 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden text-white">
              
              <div className="z-10 w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider inline-block">Recipe Search</span>
                  {extraFoods.length > 0 && (
                    <button 
                      onClick={handleClearExtraFoods}
                      className="text-white/80 hover:text-white text-xs underline font-bold"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-xl mb-1 text-white dark:text-secondary">Log Extra Food & Recipes</h3>
                <p className="text-xs text-white/90 dark:text-slate-300 mb-4">
                  Search recipe nutrition details (e.g. "Chicken 500g", "2 rotis", "1 cup oatmeal") to add them to your target.
                </p>

                <form onSubmit={handleSearchFoodSubmit} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                    placeholder="Type food item (e.g. Chicken 500g)..."
                    className="flex-grow p-2.5 rounded-xl border-none outline-none text-slate-800 bg-white text-xs shadow-inner"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={foodLoading}
                    className="bg-secondary text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-opacity-95 transition-all shadow"
                  >
                    {foodLoading ? 'Analyzing...' : 'Search'}
                  </button>
                </form>

                {/* Search result preview card with Add option */}
                {searchResult && (
                  <div className="bg-white/15 dark:bg-slate-800/60 border border-white/20 p-4 rounded-2xl text-xs mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-extrabold text-white text-sm dark:text-secondary">{searchResult.foodName}</span>
                        <span className="text-[10px] text-white/80 ml-1.5 font-bold">({searchResult.quantity})</span>
                        <p className="text-[10px] text-white/70 mt-0.5">{searchResult.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-secondary">{searchResult.calories} kcal</span>
                        <p className="text-[9px] text-white/80 font-bold">{searchResult.protein}g P • {searchResult.carbs}g C • {searchResult.fats}g F</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3.5 border-t border-white/10">
                      <button 
                        onClick={handleAddToDiet}
                        className="flex-1 bg-secondary text-white font-bold py-2 rounded-xl text-center hover:bg-opacity-95 transition-all shadow flex items-center justify-center gap-1"
                      >
                        ➕ Add to Diet
                      </button>
                      <button 
                        onClick={() => setSearchResult(null)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-2 px-4 rounded-xl text-center transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Logged extra foods container */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {extraFoods.map((food, idx) => (
                    <div key={idx} className="bg-white/10 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs flex justify-between items-center border border-white/5">
                      <div>
                        <span className="font-bold text-white dark:text-secondary">{food.foodName}</span> ({food.quantity})
                        <p className="text-[10px] opacity-80 mt-0.5">{food.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4 font-bold text-secondary-container dark:text-emerald-400">
                        <span>{food.calories} kcal</span>
                        <p className="text-[9px] opacity-90">{food.protein}g P • {food.carbs}g C • {food.fats}g F</p>
                      </div>
                    </div>
                  ))}
                  {extraFoods.length === 0 && (
                    <div className="text-center py-6 text-xs text-white/60 dark:text-slate-400 italic">
                      No extra foods added to diet today. Try searching above!
                    </div>
                  )}
                </div>

              </div>

            </section>
            
          </div>

        </div>
      )}

    </div>
  );
}
