const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationTitle: { type: String, default: 'New Conversation' },
  module: { type: String, enum: ['MedicalAssistant', 'DietPlanner', 'Remedy'], required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
