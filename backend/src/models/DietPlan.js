const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, required: true },
  currentWeight: { type: Number },
  targetWeight: { type: Number },
  dailyCalories: { type: Number, required: true },
  protein: { type: Number, required: true }, // in grams
  carbs: { type: Number, required: true }, // in grams
  fats: { type: Number, required: true }, // in grams
  waterGoal: { type: Number, required: true }, // in liters
  mealPlan: [{
    mealType: { type: String, enum: ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'], required: true },
    foodItems: { type: String, required: true },
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number }
  }],
  groceryList: [{
    item: { type: String, required: true },
    quantity: { type: String },
    category: { type: String },
    price: { type: Number } // Estimated price in Indian Rupees (₹)
  }],
  extraFoods: [{
    foodName: { type: String, required: true },
    quantity: { type: String },
    calories: { type: Number, required: true },
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number },
    description: { type: String }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);

