const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');
const spoonacularService = require('../services/spoonacular.service');

function calculateCalorieNeeds(profile) {
  const { weight, height, age, gender, activityLevel, healthGoal } = profile;

  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male' || gender === 'Male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity Factor
  let activityFactor = 1.2;
  if (activityLevel === 'Lightly Active') activityFactor = 1.375;
  if (activityLevel === 'Moderately Active') activityFactor = 1.55;
  if (activityLevel === 'Very Active') activityFactor = 1.725;

  const tdee = Math.round(bmr * activityFactor);

  // Goal adjustment
  let dailyCalories = tdee;
  if (healthGoal === 'Weight Loss') dailyCalories -= 500;
  if (healthGoal === 'Weight Gain') dailyCalories += 500;
  if (healthGoal === 'Muscle Gain') dailyCalories += 300;

  dailyCalories = Math.max(1200, dailyCalories); // Floor limit

  // Macros: Protein (30% for muscle/gain, 20% others), Fat (25%), Carbs (remaining)
  const isMuscleGoal = healthGoal === 'Muscle Gain' || healthGoal === 'Weight Gain';
  const proteinPercent = isMuscleGoal ? 0.30 : 0.20;
  const fatPercent = 0.25;
  const carbPercent = 1 - proteinPercent - fatPercent;

  const proteinGrams = Math.round((dailyCalories * proteinPercent) / 4);
  const fatGrams = Math.round((dailyCalories * fatPercent) / 9);
  const carbGrams = Math.round((dailyCalories * carbPercent) / 4);

  return { bmr, tdee, dailyCalories, protein: proteinGrams, carbs: carbGrams, fats: fatGrams };
}

function extractJSON(text) {
  if (!text) return null;
  let cleanText = text.trim();
  
  // Clean markdown wrappers if present
  cleanText = cleanText.replace(/^```json\s*/i, '')
                       .replace(/^```\s*/, '')
                       .replace(/\s*```$/, '')
                       .trim();
                       
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Ignore direct parse failure and try extracting
  }

  // Find first { or [ and last } or ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let start = -1;
  let end = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = text.lastIndexOf(']');
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = text.substring(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      // Try resolving trailing commas or minor syntax issues
      try {
        const cleaned = jsonStr
          .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
          .replace(/\\n/g, ' ');
        return JSON.parse(cleaned);
      } catch (err2) {
        console.error('Failed to parse cleaned JSON substring:', err2.message);
      }
    }
  }
  
  return null;
}

const dietController = {
  generate: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let profile;
      if (isMock) {
        profile = localDb.findOne('healthProfiles', { userId: req.user._id });
      } else {
        profile = await HealthProfile.findOne({ userId: req.user._id });
      }

      if (!profile) {
        return res.status(404).json({ error: 'Please set up your health profile first to generate a diet plan.' });
      }

      // Calculate base caloric requirements
      const needs = calculateCalorieNeeds(profile);

      // 2. Spoonacular Data Fetching
      // 2. Try Spoonacular First for dynamic high-quality Indian recipes
      let spoonacularPlan = null;
      try {
        const dietPref = profile.allergies?.join(' ') + ' ' + (profile.medicalConditions?.join(' ') || '');
        spoonacularPlan = await spoonacularService.generateIndianMealPlan(needs.dailyCalories, dietPref);
      } catch (err) {
        console.warn('Spoonacular Meal Plan generation failed, falling back to Gemini:', err.message);
      }  // Fallback to Gemini AI if Spoonacular fails or hits limits
      let data = spoonacularPlan && spoonacularPlan.mealPlan ? spoonacularPlan : null;

      if (!data) {
        const randomSeedWord = ['spicy', 'herbal', 'savory', 'crunchy', 'zesty', 'mild', 'tangy', 'fragrant'][Math.floor(Math.random() * 8)];
        const prompt = `You are a clinical nutritionist designing an Indian diet plan for a user.
Target Calories: ${needs.dailyCalories} kcal.
Target Macros: Protein: ${needs.protein}g, Carbohydrates: ${needs.carbs}g, Fats: ${needs.fats}g.
Dietary Preference: ${profile.dietPreference}.

Please generate a JSON block containing two fields:
1. "mealPlan": Array of 5 meal objects ("Breakfast", "Morning Snack", "Lunch", "Evening Snack", "Dinner") with "foodItems", "calories", "protein", "carbs", "fats".
2. "groceryList": Array of weekly ingredients with "item", "quantity", "category", "price" (in Rupees).
Return ONLY JSON.`;

        const aiResponse = await aiGateway.generateRaw(null, prompt, 0.85);
        try {
          data = extractJSON(aiResponse);
        } catch (err) {
          console.error('AI Fallback parsing failed.');
        }

        if (!data || !data.mealPlan) {
          data = {
            mealPlan: [
              { mealType: 'Breakfast', foodItems: 'Poha with peanuts', calories: 350, protein: 12, carbs: 55, fats: 6 },
              { mealType: 'Lunch', foodItems: '2 Rotis with dal tadka', calories: 500, protein: 18, carbs: 75, fats: 12 },
              { mealType: 'Dinner', foodItems: 'Grilled paneer/tofu with veggies', calories: 420, protein: 22, carbs: 18, fats: 25 }
            ],
            groceryList: [{ item: 'Poha', quantity: '1kg', category: 'Grains', price: 80 }]
          };
        }
      }

      // Fetch smart recipes from Spoonacular
      const smartRecipes = await spoonacularService.getSmartRecipes(profile.healthGoal);

      const dietPlanData = {
        userId: req.user._id,
        goal: profile.healthGoal,
        currentWeight: profile.weight,
        targetWeight: profile.healthGoal === 'Weight Loss' ? profile.weight - 5 : profile.healthGoal === 'Weight Gain' ? profile.weight + 5 : profile.weight,
        dailyCalories: needs.dailyCalories,
        protein: needs.protein,
        carbs: needs.carbs,
        fats: needs.fats,
        waterGoal: profile.waterIntake || 3.5,
        mealPlan: data.mealPlan,
        groceryList: data.groceryList,
        extraFoods: [],
        foodLogs: [],
        smartRecipes: smartRecipes
      };

      let newPlan;
      if (isMock) {
        const existing = localDb.findOne('dietPlans', { userId: req.user._id });
        if (existing) localDb.findByIdAndDelete('dietPlans', existing._id);
        newPlan = localDb.create('dietPlans', dietPlanData);
      } else {
        await DietPlan.findOneAndDelete({ userId: req.user._id });
        newPlan = await DietPlan.create(dietPlanData);
      }

      res.status(201).json(newPlan);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getCurrent: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let plan = null;
      if (isMock) {
        plan = localDb.findOne('dietPlans', { userId: req.user._id });
      } else {
        plan = await DietPlan.findOne({ userId: req.user._id });
      }

      if (!plan) return res.status(404).json({ error: 'No active diet plans found. Please generate one.' });
      res.json(plan);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateWeight: async (req, res) => {
    const { weight } = req.body;
    if (!weight) return res.status(400).json({ error: 'Please enter a weight measurement.' });

    try {
      const isMock = global.isMockDB;
      let profile;
      if (isMock) {
        profile = localDb.findOne('healthProfiles', { userId: req.user._id });
        if (profile) {
          localDb.findByIdAndUpdate('healthProfiles', profile._id, { weight: Number(weight) });
        }
      } else {
        profile = await HealthProfile.findOneAndUpdate({ userId: req.user._id }, { weight: Number(weight) }, { new: true });
      }

      res.json({ message: 'Weight updated successfully.', weight: Number(weight) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  analyzeFood: async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Please enter a food query to analyze.' });

    try {
      // 1. Primary: Use Spoonacular for accurate database lookup
      const spoonData = await spoonacularService.searchFoodNutrition(query);
      if (spoonData) {
        return res.json(spoonData);
      }

      // 2. Fallback: Use Gemini if Spoonacular fails or has no results
      const prompt = `You are a clinical dietitian AI. The user logged: "${query}". Estimate the nutrition.
      Return ONLY valid JSON: {"foodName": "...", "quantity": "...", "calories": 100, "protein": 5, "carbs": 20, "fats": 2, "description": "..."}`;

      const aiResponse = await aiGateway.generateRaw(null, prompt);
      const parsed = extractJSON(aiResponse);
      if (!parsed) throw new Error('Failed parsing AI fallback');
      res.json(parsed);
    } catch (err) {
      console.error('Error analyzing food:', err.message);
      res.status(503).json({ error: 'Analysis unavailable. Try again.' });
    }
  },

  swapMeal: async (req, res) => {
    const { mealType, currentFood, dietPreference } = req.body;
    if (!mealType) return res.status(400).json({ error: 'Meal type is required.' });

    try {
      const prompt = `You are a clinical nutritionist. Swap this specific meal:
      - Meal Category: ${mealType}
      - Current Food: ${currentFood || 'Any'}
      - Diet Preference: ${dietPreference || 'Vegetarian'}
      
      Generate a healthy, delicious, and culturally appropriate alternative recipe option.
      Return ONLY a valid JSON object matching the schema below. Do not include markdown code block wrappers or backticks.
      
      JSON schema:
      {
        "mealType": "${mealType}",
        "foodItems": "Alternative food description (e.g., 2 Rava Idlis with green coconut chutney)",
        "calories": 320,
        "protein": 12,
        "carbs": 45,
        "fats": 6
      }`;

      const aiResponse = await aiGateway.generateRaw(null, prompt);
      const parsed = extractJSON(aiResponse);
      if (!parsed) {
        throw new Error('Failed to parse AI response as JSON');
      }
      res.json(parsed);
    } catch (err) {
      console.error('Error swapping meal:', err.message);
      res.json({
        mealType,
        foodItems: mealType === 'Breakfast' ? 'Oatmeal with almonds' : mealType === 'Lunch' ? 'Quinoa salad with chickpeas' : mealType === 'Dinner' ? 'Baked tofu with steamed broccoli' : 'Mixed dry fruits',
        calories: 250,
        protein: 10,
        carbs: 35,
        fats: 5
      });
    }
  },

  addExtraFood: async (req, res) => {
    // This logs food to the foodLogs array for calorie tracking
    const { foodName, quantity, calories, protein, carbs, fats, fiber, description } = req.body;
    if (!foodName || calories === undefined) {
      return res.status(400).json({ error: 'Food name and calories are required.' });
    }

    try {
      const isMock = global.isMockDB;
      let plan;
      
      const newLog = {
        foodName,
        quantity: quantity || '1 serving',
        calories: Number(calories),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fats: Number(fats || 0),
        fiber: Number(fiber || 0),
        loggedAt: new Date()
      };

      if (isMock) {
        plan = localDb.findOne('dietPlans', { userId: req.user._id });
        if (plan) {
          const foodLogs = plan.foodLogs || [];
          foodLogs.push(newLog);
          plan = localDb.findByIdAndUpdate('dietPlans', plan._id, { foodLogs, extraFoods: [...(plan.extraFoods||[]), newLog] });
        }
      } else {
        plan = await DietPlan.findOneAndUpdate(
          { userId: req.user._id },
          { $push: { foodLogs: newLog, extraFoods: newLog } },
          { new: true }
        );
      }

      res.status(201).json(plan);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  clearExtraFoods: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let plan;

      if (isMock) {
        plan = localDb.findOne('dietPlans', { userId: req.user._id });
        if (!plan) return res.status(404).json({ error: 'No active diet plan found.' });
        plan = localDb.findByIdAndUpdate('dietPlans', plan._id, { extraFoods: [] });
      } else {
        plan = await DietPlan.findOneAndUpdate(
          { userId: req.user._id },
          { $set: { extraFoods: [] } },
          { new: true }
        );
        if (!plan) return res.status(404).json({ error: 'No active diet plan found.' });
      }

      res.json(plan);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = dietController;
