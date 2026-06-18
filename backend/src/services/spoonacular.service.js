const axios = require('axios');

const API_KEY = process.env.SPOONACULAR_API_KEY || '1692016fba5c4177af39f79e6d95ca8f';
const BASE_URL = 'https://api.spoonacular.com';

const spoonacularService = {
  // Search food nutrition directly
  searchFoodNutrition: async (query) => {
    try {
      // 1. Search for ingredient
      const searchRes = await axios.get(`${BASE_URL}/food/ingredients/search`, {
        params: { apiKey: API_KEY, query: query, number: 1 },
        timeout: 5000
      });
      const searchData = searchRes.data;
      
      if (!searchData.results || searchData.results.length === 0) {
        return null;
      }
      
      const ingredientId = searchData.results[0].id;
      
      // 2. Get nutrition info
      const infoRes = await axios.get(`${BASE_URL}/food/ingredients/${ingredientId}/information`, {
        params: { apiKey: API_KEY, amount: 100, unit: 'grams' },
        timeout: 5000
      });
      const infoData = infoRes.data;
      
      const nutrition = infoData.nutrition?.nutrients || [];
      const getMacro = (name) => {
        const n = nutrition.find(n => n.name === name);
        return n ? Math.round(n.amount) : 0;
      };

      return {
        foodName: infoData.name || query,
        quantity: '100g',
        calories: getMacro('Calories'),
        protein: getMacro('Protein'),
        carbs: getMacro('Carbohydrates'),
        fats: getMacro('Fat'),
        fiber: getMacro('Fiber'),
        description: `100g serving of ${infoData.name}`
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
        let url = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&cuisine=Indian&type=${types[i].type}&addRecipeNutrition=true&number=1&offset=${Math.floor(Math.random() * 5)}`;
        
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
          }
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
      
      const url = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&cuisine=Indian&addRecipeInformation=true&addRecipeNutrition=true&number=4&sort=${sort}&sortDirection=${sortDirection}`;
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
  }
};

module.exports = spoonacularService;
