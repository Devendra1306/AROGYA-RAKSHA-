const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  height: { type: Number, required: true }, // in cm
  weight: { type: Number, required: true }, // in kg
  bloodGroup: { type: String, required: true },
  
  activityLevel: { type: String, enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'], default: 'Sedentary' },
  exerciseFrequency: { type: String, enum: ['Never', '1–2 Days', '3–5 Days', 'Daily'], default: 'Never' },
  waterIntake: { type: Number, default: 2 }, // in liters
  sleepDuration: { type: Number, default: 7 }, // in hours
  stressLevel: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
  
  medicalConditions: [{ type: String }],
  allergies: [{ type: String }],
  medications: [{ type: String }],
  familyHistory: [{ type: String }],
  
  dietPreference: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'], default: 'Vegetarian' },
  foodRestrictions: [{ type: String }],
  favoriteFoods: [{ type: String }],
  dislikedFoods: [{ type: String }],
  budgetPreference: { type: String, enum: ['Low Budget', 'Medium Budget', 'Premium'], default: 'Medium Budget' },
  
  healthGoal: { type: String, enum: ['Weight Loss', 'Weight Gain', 'Muscle Gain', 'Healthy Lifestyle', 'Disease Management'], default: 'Healthy Lifestyle' },
  targetDuration: { type: String, enum: ['1 Month', '3 Months', '6 Months', '12 Months'], default: '3 Months' },
  
  healthScore: { type: Number, default: 70 }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
