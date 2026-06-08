const mongoose = require('mongoose');

const remedySchema = new mongoose.Schema({
  condition: { type: String, required: true, unique: true },
  causes: [{ type: String }],
  remedies: [{
    name: { type: String, required: true },
    ingredients: [{ type: String }],
    steps: [{ type: String }],
    usageInstructions: { type: String },
    reliefTime: { type: String }
  }],
  warnings: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Remedy', remedySchema);
