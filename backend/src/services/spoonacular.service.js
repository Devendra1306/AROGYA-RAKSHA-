const axios = require('axios');

const API_KEY = process.env.SPOONACULAR_API_KEY || '1692016fba5c4177af39f79e6d95ca8f';
const BASE_URL = 'https://api.spoonacular.com';

const spoonacularService = {
  // Search food nutrition directly
  searchFoodNutrition: async (query) => {
    try {
      const res = await axios.get(`${BASE_URL}/recipes/guessNutrition`, {
        params: { apiKey: API_KEY, title: query },
        timeout: 5000
      });
      const data = res.data;
      
      if (!data || !data.calories) {
        return null;
      }
      
      return {
        foodName: query,
        quantity: 'Analyzed Serving',
        calories: Math.round(data.calories.value || 0),
        protein: Math.round(data.protein.value || 0),
        carbs: Math.round(data.carbs.value || 0),
        fats: Math.round(data.fat.value || 0),
        description: `AI Estimated Nutrition`
      };
    } catch (err) {
      console.error('Spoonacular Search Error:', err);
      return null;
    }
  },

  // Get customized Indian diet plan
  generateIndianMealPlan: async (targetCalories, dietPref) => {
    try {
      // Build meal plan manually by searching Indian recipes for different types
      const types = [
        { type: 'breakfast', mealName: 'Breakfast' },
        { type: 'snack', mealName: 'Morning Snack' },
        { type: 'main course', mealName: 'Lunch' },
        { type: 'snack', mealName: 'Evening Snack' },
        { type: 'main course', mealName: 'Dinner' }
      ];

      const meals = [];
      const groceryMap = new Map();

      // Divide calories roughly: 25% breakfast, 10% snack, 30% lunch, 10% snack, 25% dinner
      const calDistribution = [0.25, 0.10, 0.30, 0.10, 0.25];

      for (let i = 0; i < types.length; i++) {
        const targetCal = Math.round(targetCalories * calDistribution[i]);
        let url = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&cuisine=Indian&type=${types[i].type}&addRecipeNutrition=true&number=1&sort=random`;
        
        if (dietPref && dietPref.toLowerCase().includes('veg')) {
          url += '&diet=vegetarian';
        }

        const res = await axios.get(url, { timeout: 8000 });
        if (res.status === 200) {
          const data = res.data;
          if (data.results && data.results.length > 0) {
            const recipe = data.results[0];
            const nutrients = recipe.nutrition?.nutrients || [];
            const getMacro = (name) => {
              const n = nutrients.find(n => n.name === name);
              return n ? Math.round(n.amount) : 0;
            };

            meals.push({
              mealType: types[i].mealName,
              foodItems: recipe.title,
              calories: getMacro('Calories'),
              protein: getMacro('Protein'),
              carbs: getMacro('Carbohydrates'),
              fats: getMacro('Fat')
            });

            // Extract ingredients for grocery list
            if (recipe.nutrition?.ingredients) {
              recipe.nutrition.ingredients.forEach(ing => {
                if (!groceryMap.has(ing.name)) {
                  groceryMap.set(ing.name, {
                    item: ing.name,
                    quantity: `${ing.amount} ${ing.unit}`,
                    category: 'Ingredients',
                    price: Math.floor(Math.random() * 100) + 20 // Estimate
                  });
                }
              });
            }
          } else {
            // Fallback for missing meal type from Spoonacular
            meals.push({
              mealType: types[i].mealName,
              foodItems: `Healthy Indian ${types[i].mealName}`,
              calories: targetCal,
              protein: Math.round(targetCal * 0.15 / 4),
              carbs: Math.round(targetCal * 0.55 / 4),
              fats: Math.round(targetCal * 0.30 / 9)
            });
          }
        } else {
          // Fallback on network error for this specific meal
          meals.push({
            mealType: types[i].mealName,
            foodItems: `Healthy Indian ${types[i].mealName}`,
            calories: targetCal,
            protein: Math.round(targetCal * 0.15 / 4),
            carbs: Math.round(targetCal * 0.55 / 4),
            fats: Math.round(targetCal * 0.30 / 9)
          });
        }
      }

      return {
        mealPlan: meals.length > 0 ? meals : null,
        groceryList: Array.from(groceryMap.values()).slice(0, 15) // Keep it concise
      };
    } catch (err) {
      console.error('Spoonacular Generation Error:', err);
      return { mealPlan: null, groceryList: [] };
    }
  },

  getSmartRecipes: async (goal) => {
    try {
      const isWeightLoss = goal && goal.toLowerCase().includes('loss');
      const sort = isWeightLoss ? 'calories' : 'protein';
      const sortDirection = isWeightLoss ? 'asc' : 'desc';
      
      const url = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&query=indian&cuisine=Indian&type=main course&addRecipeInformation=true&addRecipeNutrition=true&number=4&sort=${sort}&sortDirection=${sortDirection}`;
      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;
      
      if (!data.results) return [];

      return data.results.map(r => ({
        id: r.id,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        instructions: r.instructions || 'Instructions not provided.',
        calories: r.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
        protein: r.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
        carbs: r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
        fats: r.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
        ingredients: (r.nutrition?.ingredients || []).map(i => `${i.amount} ${i.unit} ${i.name}`)
      }));
    } catch (err) {
      console.error('Spoonacular Recipes Error:', err);
      return [];
    }
  },

  // Get Alternative Meal (Swap)
  getAlternativeMeal: async (mealType, dietPref) => {
    try {
      // Map frontend mealType to Spoonacular type
      let typeMap = 'main course';
      if (mealType.toLowerCase().includes('breakfast')) typeMap = 'breakfast';
      if (mealType.toLowerCase().includes('snack')) typeMap = 'snack';
      if (mealType.toLowerCase().includes('soup')) typeMap = 'soup';

      let url = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&cuisine=Indian&type=${typeMap}&addRecipeNutrition=true&number=1&offset=${Math.floor(Math.random() * 20)}`;
      
      if (dietPref && dietPref.toLowerCase().includes('veg')) {
        url += '&diet=vegetarian';
      }

      const res = await axios.get(url, { timeout: 8000 });
      if (res.status === 200 && res.data.results && res.data.results.length > 0) {
        const recipe = res.data.results[0];
        const nutrients = recipe.nutrition?.nutrients || [];
        const getMacro = (name) => {
          const n = nutrients.find(n => n.name === name);
          return n ? Math.round(n.amount) : 0;
        };

        return {
          mealType: mealType,
          foodItems: recipe.title,
          calories: getMacro('Calories'),
          protein: getMacro('Protein'),
          carbs: getMacro('Carbohydrates'),
          fats: getMacro('Fat')
        };
      }
      return null;
    } catch (err) {
      console.error('Spoonacular Alternative Meal Error:', err);
      return null;
    }
  }
};

module.exports = spoonacularService;
