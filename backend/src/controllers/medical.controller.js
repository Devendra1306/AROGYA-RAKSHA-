const ChatHistory = require('../models/ChatHistory');
const HealthProfile = require('../models/HealthProfile');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');
const ragService = require('../services/rag.service');

const medicalController = {
  chat: async (req, res) => {
    const { query, conversationId } = req.body;
    if (!query) return res.status(400).json({ error: 'Please enter a message or description of symptoms.' });

    try {
      const isMock = global.isMockDB;

      // 1. Retrieve user's health profile if authenticated
      let healthProfile = null;
      if (req.user) {
        if (isMock) {
          healthProfile = localDb.findOne('healthProfiles', { userId: req.user._id });
        } else {
          healthProfile = await HealthProfile.findOne({ userId: req.user._id });
        }
      }

      // 2. Query RAG context
      const context = await ragService.retrieveContext(query);

      // 3. Call AI Gateway (Gemini)
      const aiResult = await aiGateway.generateResponse(query, healthProfile, context);

      // 4. Save/Append chat history if authenticated
      let currentConvoId = conversationId;
      if (req.user) {
        let convo = null;
        const msgUser = { role: 'user', content: query, timestamp: new Date() };
        const msgAssistant = { role: 'assistant', content: aiResult.response, timestamp: new Date() };

        if (currentConvoId) {
          if (isMock) {
            convo = localDb.findOne('chatHistory', { _id: currentConvoId, userId: req.user._id });
            if (convo) {
              convo.messages.push(msgUser, msgAssistant);
              localDb.findByIdAndUpdate('chatHistory', convo._id, { messages: convo.messages });
            }
          } else {
            convo = await ChatHistory.findOneAndUpdate(
              { _id: currentConvoId, userId: req.user._id },
              { $push: { messages: { $each: [msgUser, msgAssistant] } } },
              { new: true }
            );
          }
        }

        if (!convo) {
          // Create new conversation
          const convoData = {
            userId: req.user._id,
            conversationTitle: query.length > 30 ? query.substring(0, 30) + '...' : query,
            module: 'MedicalAssistant',
            messages: [msgUser, msgAssistant]
          };

          if (isMock) {
            convo = localDb.create('chatHistory', convoData);
            currentConvoId = convo._id;
          } else {
            convo = await ChatHistory.create(convoData);
            currentConvoId = convo._id;
          }
        }
      }

      res.json({
        ...aiResult,
        conversationId: currentConvoId
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let history = [];
      if (isMock) {
        history = localDb.find('chatHistory', { userId: req.user._id, module: 'MedicalAssistant' });
      } else {
        history = await ChatHistory.find({ userId: req.user._id, module: 'MedicalAssistant' }).sort({ updatedAt: -1 });
      }
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getHistoryDetails: async (req, res) => {
    const { id } = req.params;
    try {
      const isMock = global.isMockDB;
      let convo = null;
      if (isMock) {
        convo = localDb.findOne('chatHistory', { _id: id, userId: req.user._id });
      } else {
        convo = await ChatHistory.findOne({ _id: id, userId: req.user._id });
      }

      if (!convo) return res.status(404).json({ error: 'Conversation history not found.' });
      res.json(convo);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteHistory: async (req, res) => {
    const { id } = req.params;
    try {
      const isMock = global.isMockDB;
      let deleted = null;
      if (isMock) {
        deleted = localDb.findByIdAndDelete('chatHistory', id);
      } else {
        deleted = await ChatHistory.findOneAndDelete({ _id: id, userId: req.user._id });
      }

      if (!deleted) return res.status(404).json({ error: 'Conversation not found.' });
      res.json({ message: 'Conversation deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = medicalController;
