const mongoose = require('mongoose');

const emergencyGuideSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'High', 'Moderate'], default: 'High' },
  symptoms: [{ type: String }],
  steps: [{ type: String }],
  warnings: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyGuide', emergencyGuideSchema);
