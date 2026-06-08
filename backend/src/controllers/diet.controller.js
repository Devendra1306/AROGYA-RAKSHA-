const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');

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

      // Assemble prompt for AI Gateway with strong variety seeds and weekly rupee pricing
      const randomSeedWord = ['spicy', 'herbal', 'savory', 'crunchy', 'zesty', 'mild', 'tangy', 'fragrant'][Math.floor(Math.random() * 8)];
      const prompt = `You are a clinical nutritionist designing a daily diet plan for a user.
Target Calories: ${needs.dailyCalories} kcal.
Target Macros: Protein: ${needs.protein}g, Carbohydrates: ${needs.carbs}g, Fats: ${needs.fats}g.
Dietary Preference: ${profile.dietPreference}.
Affordability Budget Level: ${profile.budgetPreference}.
Health Goal: ${profile.healthGoal}.
Existing Medical Conditions (if any, restrict foods accordingly): ${profile.medicalConditions?.join(', ') || 'None'}.
Allergies / Restrictions: ${profile.allergies?.join(', ') || 'None'} / ${profile.foodRestrictions?.join(', ') || 'None'}.

RULES FOR VARIETY:
- Ensure the meal plan is highly varied and different on every generation. Do NOT repeat the exact same dishes or items in consecutive runs. Use unique ingredients and menu designs.
- Dynamic variety theme: ${randomSeedWord}
- Dynamic seed tracker: ${Date.now()}_${Math.random()}

Please generate a JSON block containing two fields:
1. "mealPlan": An array of 5 meal objects. Each meal object must have: "mealType" (must be one of: "Breakfast", "Morning Snack", "Lunch", "Evening Snack", "Dinner"), "foodItems" (string description of foods, e.g. "2 Idlis with coconut chutney"), "calories" (number), "protein" (number of grams), "carbs" (number of grams), "fats" (number of grams). Include Indian food options appropriate for the preference. Keep budget items realistic (e.g. eggs/rice/peanuts for low budget; salmon/greek yogurt/almonds for premium).
2. "groceryList": An array of objects. Since the user wants shopping ingredients for the WHOLE WEEK (7 days), compile the weekly ingredients with approximate quantities needed to prepare the meals. Each item object MUST have: "item" (name), "quantity" (weekly quantity, e.g. "2kg" or "5 liters"), "category" (e.g. "Produce", "Dairy", "Grains", "Protein"), and "price" (estimated retail cost in Indian Rupees (INR / ₹) as an integer number, e.g. 150).

Response Format MUST be ONLY valid JSON:
{
  "mealPlan": [...],
  "groceryList": [...]
}`;

      // Call gateway with high temperature for variety
      const aiResponse = await aiGateway.generateRaw(null, prompt, 0.85);
      let data = null;
      
      try {
        data = extractJSON(aiResponse);
      } catch (err) {
        console.error('Failed to parse AI diet plan response as JSON:', err.message);
      }

      if (!data || !data.mealPlan) {
        // Load fallback meal plan with weekly rupee estimates
        data = {
          mealPlan: [
            { mealType: 'Breakfast', foodItems: 'Oatmeal with sliced banana and skimmed milk', calories: 350, protein: 12, carbs: 55, fats: 6 },
            { mealType: 'Morning Snack', foodItems: 'A handful of peanuts or a green apple', calories: 150, protein: 4, carbs: 22, fats: 5 },
            { mealType: 'Lunch', foodItems: '2 Rotis with dal tadka and cucumber salad', calories: 500, protein: 18, carbs: 75, fats: 12 },
            { mealType: 'Evening Snack', foodItems: 'Boiled chana salad (chickpeas)', calories: 180, protein: 8, carbs: 28, fats: 3 },
            { mealType: 'Dinner', foodItems: 'Grilled paneer/tofu with sautéed vegetables', calories: 420, protein: 22, carbs: 18, fats: 25 }
          ],
          groceryList: [
            { item: 'Oats', quantity: '1.5kg', category: 'Grains', price: 180 },
            { item: 'Bananas', quantity: '2 Dozen', category: 'Fruits', price: 120 },
            { item: 'Skimmed Milk', quantity: '7 Liters', category: 'Dairy', price: 420 },
            { item: 'Peanuts', quantity: '1kg', category: 'Nuts', price: 200 },
            { item: 'Wheat Flour', quantity: '5kg', category: 'Grains', price: 250 },
            { item: 'Dal (Lentils)', quantity: '2kg', category: 'Grains', price: 300 },
            { item: 'Paneer / Tofu', quantity: '1.5kg', category: 'Protein', price: 450 }
          ]
        };
      }

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
        extraFoods: []
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
      const prompt = `You are a clinical dietitian AI with expert knowledge in food nutrition and Indian cuisine.
      
      The user has logged the following food item or recipe:
      "${query}"
      
      Analyze the EXACT quantity mentioned in the query. If the query includes quantity like "500g", "2 cups", "1 bowl", use that exact amount.
      If no quantity is given, assume a standard serving size for that food.
      
      CRITICAL: Your response MUST exactly reflect the calories and macros for the SPECIFIC quantity mentioned.
      For example:
      - "Chicken 100g" → ~165 calories
      - "Chicken 500g" → ~825 calories  
      - "Rice 1 cup cooked" → ~206 calories
      - "2 rotis" → ~160 calories (80 each)
      
      Return ONLY a valid JSON object with NO markdown wrappers or backticks:
      {
        "foodName": "Clear food name including quantity",
        "quantity": "Exact amount with units (e.g. 500g, 2 cups, 1 bowl)",
        "calories": <calculated integer based on exact quantity>,
        "protein": <grams as integer>,
        "carbs": <grams as integer>,
        "fats": <grams as integer>,
        "description": "One sentence about this food and its key nutritional benefit."
      }`;

      const aiResponse = await aiGateway.generateRaw(null, prompt);
      const parsed = extractJSON(aiResponse);
      if (!parsed) {
        throw new Error('Failed to parse AI response as JSON');
      }
      res.json(parsed);
    } catch (err) {
      console.error('Error analyzing extra food:', err.message);
      res.status(503).json({
        error: 'AI analysis temporarily unavailable. Please try again in a moment.',
        _isError: true
      });
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
    const { foodName, quantity, calories, protein, carbs, fats, description } = req.body;
    if (!foodName || !calories) {
      return res.status(400).json({ error: 'Food name and calories are required.' });
    }

    try {
      const isMock = global.isMockDB;
      let plan;
      
      const newFood = {
        foodName,
        quantity: quantity || 'Unspecified',
        calories: Number(calories),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fats: Number(fats || 0),
        description: description || ''
      };

      if (isMock) {
        plan = localDb.findOne('dietPlans', { userId: req.user._id });
        if (!plan) {
          // Auto-create plan
          const profile = localDb.findOne('healthProfiles', { userId: req.user._id });
          const needs = profile ? calculateCalorieNeeds(profile) : { dailyCalories: 2000, protein: 100, carbs: 250, fats: 65 };
          const dietPlanData = {
            userId: req.user._id,
            goal: profile ? profile.healthGoal : 'Maintenance',
            currentWeight: profile ? profile.weight : 70,
            targetWeight: profile ? (profile.healthGoal === 'Weight Loss' ? profile.weight - 5 : profile.healthGoal === 'Weight Gain' ? profile.weight + 5 : profile.weight) : 70,
            dailyCalories: needs.dailyCalories,
            protein: needs.protein,
            carbs: needs.carbs,
            fats: needs.fats,
            waterGoal: profile ? (profile.waterIntake || 3.5) : 3,
            mealPlan: [
              { mealType: 'Breakfast', foodItems: 'Oatmeal with sliced banana and skimmed milk', calories: 350, protein: 12, carbs: 55, fats: 6 },
              { mealType: 'Morning Snack', foodItems: 'A handful of peanuts or a green apple', calories: 150, protein: 4, carbs: 22, fats: 5 },
              { mealType: 'Lunch', foodItems: '2 Rotis with dal tadka and cucumber salad', calories: 500, protein: 18, carbs: 75, fats: 12 },
              { mealType: 'Evening Snack', foodItems: 'Boiled chana salad (chickpeas)', calories: 180, protein: 8, carbs: 28, fats: 3 },
              { mealType: 'Dinner', foodItems: 'Grilled paneer/tofu with sautéed vegetables', calories: 420, protein: 22, carbs: 18, fats: 25 }
            ],
            groceryList: [
              { item: 'Oats', quantity: '1.5kg', category: 'Grains', price: 180 },
              { item: 'Bananas', quantity: '2 Dozen', category: 'Fruits', price: 120 },
              { item: 'Skimmed Milk', quantity: '7 Liters', category: 'Dairy', price: 420 },
              { item: 'Peanuts', quantity: '1kg', category: 'Nuts', price: 200 },
              { item: 'Wheat Flour', quantity: '5kg', category: 'Grains', price: 250 },
              { item: 'Dal (Lentils)', quantity: '2kg', category: 'Grains', price: 300 },
              { item: 'Paneer / Tofu', quantity: '1.5kg', category: 'Protein', price: 450 }
            ],
            extraFoods: [newFood]
          };
          plan = localDb.create('dietPlans', dietPlanData);
        } else {
          const extraFoods = plan.extraFoods || [];
          extraFoods.push(newFood);
          plan = localDb.findByIdAndUpdate('dietPlans', plan._id, { extraFoods });
        }
      } else {
        plan = await DietPlan.findOne({ userId: req.user._id });
        if (!plan) {
          // Auto-create plan
          const profile = await HealthProfile.findOne({ userId: req.user._id });
          const needs = profile ? calculateCalorieNeeds(profile) : { dailyCalories: 2000, protein: 100, carbs: 250, fats: 65 };
          const dietPlanData = {
            userId: req.user._id,
            goal: profile ? profile.healthGoal : 'Maintenance',
            currentWeight: profile ? profile.weight : 70,
            targetWeight: profile ? (profile.healthGoal === 'Weight Loss' ? profile.weight - 5 : profile.healthGoal === 'Weight Gain' ? profile.weight + 5 : profile.weight) : 70,
            dailyCalories: needs.dailyCalories,
            protein: needs.protein,
            carbs: needs.carbs,
            fats: needs.fats,
            waterGoal: profile ? (profile.waterIntake || 3.5) : 3,
            mealPlan: [
              { mealType: 'Breakfast', foodItems: 'Oatmeal with sliced banana and skimmed milk', calories: 350, protein: 12, carbs: 55, fats: 6 },
              { mealType: 'Morning Snack', foodItems: 'A handful of peanuts or a green apple', calories: 150, protein: 4, carbs: 22, fats: 5 },
              { mealType: 'Lunch', foodItems: '2 Rotis with dal tadka and cucumber salad', calories: 500, protein: 18, carbs: 75, fats: 12 },
              { mealType: 'Evening Snack', foodItems: 'Boiled chana salad (chickpeas)', calories: 180, protein: 8, carbs: 28, fats: 3 },
              { mealType: 'Dinner', foodItems: 'Grilled paneer/tofu with sautéed vegetables', calories: 420, protein: 22, carbs: 18, fats: 25 }
            ],
            groceryList: [
              { item: 'Oats', quantity: '1.5kg', category: 'Grains', price: 180 },
              { item: 'Bananas', quantity: '2 Dozen', category: 'Fruits', price: 120 },
              { item: 'Skimmed Milk', quantity: '7 Liters', category: 'Dairy', price: 420 },
              { item: 'Peanuts', quantity: '1kg', category: 'Nuts', price: 200 },
              { item: 'Wheat Flour', quantity: '5kg', category: 'Grains', price: 250 },
              { item: 'Dal (Lentils)', quantity: '2kg', category: 'Grains', price: 300 },
              { item: 'Paneer / Tofu', quantity: '1.5kg', category: 'Protein', price: 450 }
            ],
            extraFoods: [newFood]
          };
          plan = await DietPlan.create(dietPlanData);
        } else {
          plan = await DietPlan.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { extraFoods: newFood } },
            { new: true }
          );
        }
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
