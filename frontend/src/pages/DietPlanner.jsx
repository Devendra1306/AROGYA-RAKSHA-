import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Utensils, 
  Droplet, 
  Activity, 
  Target, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Plus,
  Flame,
  Clock,
  ArrowRightLeft
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

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

  // Tab State
  const [activeMealTab, setActiveMealTab] = useState('Breakfast');

  // Preferences
  const [dietPreference, setDietPreference] = useState(profile?.dietPreference || 'Vegetarian');
  const [budgetPreference, setBudgetPreference] = useState(profile?.budgetPreference || 'Medium Budget');

  // Trackers
  const [waterIntake, setWaterIntake] = useState(2.1);
  const [currentWeight, setCurrentWeight] = useState(profile?.weight || 75);
  const [weightInput, setWeightInput] = useState('');
  const [consumedMeals, setConsumedMeals] = useState([1]); 
  const [checkedGroceries, setCheckedGroceries] = useState([]);
  
  // AI Logs
  const [foodLogs, setFoodLogs] = useState([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodLoading, setFoodLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const recipeContainerRef = useRef(null);

  useEffect(() => {
    fetchDietPlan();
  }, []);

  useEffect(() => {
    if (dietPlan?.smartRecipes?.length > 0) {
      gsap.fromTo('.smart-recipe-card', 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: recipeContainerRef.current,
            start: 'top 85%'
          }
        }
      );
    }
  }, [dietPlan?.smartRecipes]);

  const fetchDietPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diet/current');
      setDietPlan(res.data);
      setWaterIntake(res.data.waterGoal - 1.4);
      setFoodLogs(res.data.foodLogs || []);
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
      setConsumedMeals([1]); 
      setFoodLogs([]); 
      setSearchResult(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate meal plan. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogWater = (amount) => setWaterIntake(prev => Number((prev + amount).toFixed(2)));
  const handleResetWater = () => setWaterIntake(0);

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weightInput) return;
    try {
      await api.post('/diet/update-weight', { weight: Number(weightInput) });
      setCurrentWeight(Number(weightInput));
      setWeightInput('');
    } catch (err) {
      alert('Failed to update weight.');
    }
  };

  const toggleGroceryCheck = (idx) => {
    setCheckedGroceries(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleMealConsumed = (idx) => {
    setConsumedMeals(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSearchFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    setFoodLoading(true);
    setSearchResult(null);
    try {
      const res = await api.post('/diet/analyze-food', { query: foodQuery });
      if (res.data._isError) {
        alert('AI analysis temporarily unavailable. Please try again.');
        return;
      }
      setSearchResult(res.data);
    } catch (err) {
      alert('Failed to analyze recipe details. Specifying quantity helps! (e.g., "1 bowl of Dal").');
    } finally {
      setFoodLoading(false);
    }
  };

  const handleAddToDiet = async () => {
    if (!searchResult) return;
    try {
      const res = await api.post('/diet/add-extra-food', searchResult);
      setFoodLogs(res.data.foodLogs || []);
      setDietPlan(res.data);
      setSearchResult(null);
      setFoodQuery('');
    } catch (err) {
      alert('Failed to add food to your diet plan.');
    }
  };

  const handleClearExtraFoods = async () => {
    try {
      const res = await api.post('/diet/clear-extra-foods');
      setFoodLogs([]);
      setDietPlan(res.data);
      setSearchResult(null);
    } catch (err) {
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
        setDietPlan(prev => ({
          ...prev, 
          mealPlan: prev.mealPlan.map(m => m.mealType === mealType ? { ...m, ...res.data } : m)
        }));
      }
    } catch (err) {
      alert('Failed to generate dynamic alternative meal option.');
    } finally {
      setLoading(false);
    }
  };

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
    ],
    smartRecipes: []
  };

  const targetCals = activePlan.dailyCalories;
  const baseCals = activePlan.mealPlan.reduce((acc, meal, idx) => acc + (consumedMeals.includes(idx) ? meal.calories : 0), 0);
  const extraCals = foodLogs.reduce((acc, food) => acc + food.calories, 0);
  const consumedCals = baseCals + extraCals;
  const progressPercent = Math.min(1, consumedCals / targetCals);

  const consumedProtein = activePlan.mealPlan.reduce((acc, m, i) => acc + (consumedMeals.includes(i) ? m.protein : 0), 0) + foodLogs.reduce((a, f) => a + f.protein, 0);
  const consumedCarbs = activePlan.mealPlan.reduce((acc, m, i) => acc + (consumedMeals.includes(i) ? m.carbs : 0), 0) + foodLogs.reduce((a, f) => a + f.carbs, 0);
  const consumedFats = activePlan.mealPlan.reduce((acc, m, i) => acc + (consumedMeals.includes(i) ? m.fats : 0), 0) + foodLogs.reduce((a, f) => a + f.fats, 0);

  const proteinPercent = Math.min(100, Math.round((consumedProtein / activePlan.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((consumedCarbs / activePlan.carbs) * 100));
  const fatsPercent = Math.min(100, Math.round((consumedFats / activePlan.fats) * 100));

  const targetWeight = profile?.weight ? profile.weight - 5 : 70;
  const weightToGo = Math.max(0, currentWeight - targetWeight);

  const activeMealIndex = activePlan.mealPlan.findIndex(m => m.mealType.toLowerCase() === activeMealTab.toLowerCase());
  const activeMealObj = activeMealIndex !== -1 ? activePlan.mealPlan[activeMealIndex] : null;
  const isActiveMealChecked = activeMealIndex !== -1 && consumedMeals.includes(activeMealIndex);

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-8 text-slate-800 dark:text-slate-100 transition-colors">
      <SEO 
        title="AI Diet Planner & Nutrition Tracker | Arogya Raksha"
        description="Experience a premium, AI-driven diet and nutrition tracker."
      />
      
      {/* Header Panel */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6"
      >
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <Utensils className="w-8 h-8 text-primary" /> Diet Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Smart macronutrient tracking and precision recipes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={dietPreference}
              onChange={(e) => setDietPreference(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-8 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Veg">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Keto">Keto</option>
            </select>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            {loading ? 'Compiling...' : 'Regenerate Plan'}
          </motion.button>
        </div>
      </motion.header>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/50 rounded-2xl text-sm font-medium">
          {error}
        </motion.div>
      )}

      {loading && !dietPlan ? (
        <div className="flex flex-col justify-center items-center py-32 gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
          />
          <p className="text-xs text-primary font-black uppercase tracking-widest">Compiling Precision Macros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-8 space-y-8"
          >
            
            {/* Meal Planner Cards */}
            <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <h3 className="font-black text-xl text-slate-800 dark:text-white">Daily Regiment</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Curated AI Plan</p>
                </div>
                
                {/* Floating Tabs */}
                <div className="flex bg-slate-100/80 dark:bg-slate-950/80 p-1.5 rounded-2xl w-full md:w-auto">
                  {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((mealName) => (
                    <button
                      key={mealName}
                      onClick={() => setActiveMealTab(mealName)}
                      className={`relative flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-colors z-10 ${activeMealTab === mealName ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      {activeMealTab === mealName && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-md shadow-primary/30"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      {mealName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Tab Details */}
              <AnimatePresence mode="wait">
                {activeMealObj ? (
                  <motion.div 
                    key={activeMealObj.mealType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => toggleMealConsumed(activeMealIndex)}
                    className={`mt-6 rounded-2xl p-5 border-2 flex flex-col md:flex-row gap-6 cursor-pointer transition-all hover:shadow-xl ${
                      isActiveMealChecked 
                        ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-primary/10' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 shadow-slate-200/20 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full md:w-32 h-40 md:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 shadow-inner">
                      <motion.img 
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        alt={activeMealObj.mealType} 
                        src={getMealImage(activeMealObj.mealType)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">{activeMealObj.mealType}</span>
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {activeMealObj.time || 'Schedule'}</span>
                      </div>
                      
                      <h4 className="font-extrabold text-xl text-slate-800 dark:text-white leading-tight mb-3">{activeMealObj.foodItems}</h4>
                      
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg">{activeMealObj.calories} kcal</span>
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg">{activeMealObj.protein}g Protein</span>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg">{activeMealObj.carbs}g Carbs</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pl-0 md:pl-4 md:border-l border-slate-200 dark:border-slate-700">
                      {isActiveMealChecked ? (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-primary text-white rounded-full p-2"
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-primary transition-colors">
                          <Plus className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwapMeal(activeMealObj.mealType);
                        }}
                        className="text-xs font-black text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Swap
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-sm italic text-center py-10 text-slate-400">Meal specifics unavailable.</p>
                )}
              </AnimatePresence>
            </section>

            {/* Weight Tracker Redesign */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              {/* Decorative abstract elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                <div className="flex-grow w-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-black text-xl flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Body Transformation</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">Progress Map</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="bg-white/5 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Current</p>
                      <p className="text-2xl font-black text-white">{currentWeight} <span className="text-xs text-slate-500">kg</span></p>
                    </div>
                    
                    <div className="text-center px-2">
                      <p className="text-xs font-bold text-primary mb-2">{weightToGo.toFixed(1)}kg to go</p>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(10, Math.min(100, (currentWeight - targetWeight) * 8))}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-blue-500 relative"
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10 border-r-primary border-b-primary">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Goal</p>
                      <p className="text-2xl font-black text-primary">{targetWeight} <span className="text-xs text-slate-500">kg</span></p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-3 block">Update Weight</span>
                  <form onSubmit={handleWeightSubmit} className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="w-24 px-3 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white font-bold text-sm text-center outline-none focus:border-primary focus:bg-black/40 transition-all" 
                      placeholder="e.g. 74.5"
                    />
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit" 
                      className="bg-primary hover:bg-primary/90 text-white font-bold px-4 rounded-xl flex justify-center items-center"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.button>
                  </form>
                </div>
              </div>
            </section>
          </motion.div>

          {/* Sidebar Area */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            
            {/* GSAP / SVG Calorie Gauge */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              
              <h3 className="font-black text-lg w-full text-left mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Daily Macros</h3>
              
              <div className="relative w-48 h-48 mb-8">
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md">
                  <circle cx="96" cy="96" fill="transparent" r="84" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800"></circle>
                  <motion.circle 
                    initial={{ strokeDashoffset: 528 }}
                    animate={{ strokeDashoffset: 528 * (1 - progressPercent) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    cx="96" cy="96" fill="transparent" r="84" 
                    stroke="url(#gradient)" 
                    strokeDasharray="528" 
                    strokeWidth="12" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C28A" />
                      <stop offset="100%" stopColor="#0052cc" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent">{consumedCals}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ {targetCals} kcal</p>
                </div>
              </div>

              {/* Macro Pills */}
              <div className="w-full space-y-3">
                {[
                  { label: 'Protein', consumed: consumedProtein, target: activePlan.protein, percent: proteinPercent, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Carbs', consumed: consumedCarbs, target: activePlan.carbs, percent: carbsPercent, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Fats', consumed: consumedFats, target: activePlan.fats, percent: fatsPercent, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                ].map((macro) => (
                  <div key={macro.label} className="w-full relative">
                    <div className="flex justify-between items-end mb-1 px-1">
                      <span className={`text-xs font-black ${macro.color}`}>{macro.label}</span>
                      <span className="text-[10px] font-bold text-slate-500">{macro.consumed}g / {macro.target}g</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${macro.bg}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${macro.percent}%` }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className={`h-full rounded-full bg-current ${macro.color}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Log Engine Redesign */}
            <section className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <Search className="w-40 h-40 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> AI Nutrition Engine
                  </h3>
                  {foodLogs.length > 0 && (
                    <button onClick={handleClearExtraFoods} className="text-[9px] text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-wider">
                      Clear All
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Type any food or meal (e.g. "1 bowl of Dal Makhani with 2 rotis"). Our AI parses the exact nutrition.
                </p>

                <form onSubmit={handleSearchFoodSubmit} className="relative mb-5">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                    placeholder="Enter meal details..."
                    className="w-full pl-10 pr-24 py-3.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:bg-white/20 focus:border-primary transition-all backdrop-blur-sm"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={foodLoading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary hover:bg-primary/90 text-white font-bold px-4 rounded-lg text-xs transition-colors"
                  >
                    {foodLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Analyze'}
                  </button>
                </form>

                <AnimatePresence>
                  {searchResult && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-xl p-4 text-slate-900 mb-4 shadow-lg shadow-black/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-black text-sm block leading-tight">{searchResult.foodName}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{searchResult.quantity}</span>
                        </div>
                        <span className="bg-primary/10 text-primary font-black px-2 py-1 rounded-md text-xs">{searchResult.calories} kcal</span>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToDiet}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add to Tracker
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logged Foods List */}
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {foodLogs.map((food, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center backdrop-blur-sm"
                    >
                      <div className="w-2/3 pr-2">
                        <span className="font-bold text-white text-xs block truncate">{food.foodName}</span> 
                        <span className="text-[9px] text-slate-400 font-medium">{food.quantity}</span>
                      </div>
                      <span className="text-primary font-black text-xs whitespace-nowrap">{food.calories} kcal</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

          </motion.div>

          {/* GSAP Smart Recipes Carousel Area */}
          {activePlan.smartRecipes && activePlan.smartRecipes.length > 0 && (
            <div className="lg:col-span-12 mt-8" ref={recipeContainerRef}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-3">
                  <Flame className="w-6 h-6 text-orange-500" /> Smart Spoonacular Recipes
                </h3>
                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Indian Cuisine Mode
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {activePlan.smartRecipes.map((recipe, idx) => (
                  <div key={idx} className="smart-recipe-card group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col hover:-translate-y-2 transition-transform duration-300">
                    <div className="relative h-48 overflow-hidden">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                          <Utensils className="w-10 h-10 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black shadow-lg">
                        <Flame className="w-3 h-3 text-orange-400" /> {recipe.calories}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <h4 className="font-black text-base leading-tight mb-3 text-slate-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2">{recipe.title}</h4>
                      
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"><Clock className="w-3 h-3" /> {recipe.readyInMinutes}m</span>
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"><Utensils className="w-3 h-3" /> {recipe.servings} Servings</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                        <div className="text-center">
                          <span className="block text-[9px] text-slate-400 uppercase font-black">Protein</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{recipe.protein}g</span>
                        </div>
                        <div className="text-center border-l border-r border-slate-100 dark:border-slate-800">
                          <span className="block text-[9px] text-slate-400 uppercase font-black">Carbs</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{recipe.carbs}g</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] text-slate-400 uppercase font-black">Fats</span>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{recipe.fats}g</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: recipe.instructions }}></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
