const mongoose = require('mongoose');

const healthAssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  healthScore: { type: Number, required: true },
  activityScore: { type: Number, required: true },
  nutritionScore: { type: Number, required: true },
  sleepScore: { type: Number, required: true },
  hydrationScore: { type: Number, required: true },
  stressScore: { type: Number, required: true },
  riskFactors: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['Low', 'Moderate', 'High'], required: true },
    description: { type: String },
    advice: { type: String }
  }],
  recommendations: [{ type: String }],
  generatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthAssessment', healthAssessmentSchema);
