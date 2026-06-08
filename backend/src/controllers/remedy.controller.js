const Remedy = require('../models/Remedy');
const HealthProfile = require('../models/HealthProfile');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');

const remedyController = {
  search: async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Please enter a symptom or condition.' });

    try {
      const isMock = global.isMockDB;
      let list = [];
      if (isMock) {
        list = localDb.find('remedies');
      } else {
        list = await Remedy.find({});
      }

      // Filter remedies matching query
      const queryLower = query.toLowerCase();
      let matched = list.find(r => r.condition.toLowerCase().includes(queryLower));

      if (matched) {
        return res.json(matched);
      }

      let healthProfile = null;
      if (req.user) {
        if (isMock) {
          healthProfile = localDb.findOne('healthProfiles', { userId: req.user._id });
        } else {
          healthProfile = await HealthProfile.findOne({ userId: req.user._id });
        }
      }

      const structuredRemedy = await aiGateway.generateStructuredRemedy(query, healthProfile);
      res.json(structuredRemedy);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  matchKitchenIngredients: async (req, res) => {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide a list of kitchen ingredients.' });
    }

    try {
      const prompt = `I have the following ingredients in my kitchen: ${ingredients.join(', ')}.
Can you suggest 1 or 2 natural home remedies I can prepare using these ingredients for minor ailments (like cough, acidity, headache)?
Specify the remedy name, ingredients utilized, preparation steps, and what it cures.`;

      const isMock = global.isMockDB;
      let healthProfile = null;
      if (req.user) {
        if (isMock) {
          healthProfile = localDb.findOne('healthProfiles', { userId: req.user._id });
        } else {
          healthProfile = await HealthProfile.findOne({ userId: req.user._id });
        }
      }

      const aiResponse = await aiGateway.generateResponse(prompt, healthProfile);
      res.json({
        ingredients,
        suggestions: aiResponse.response,
        disclaimer: aiResponse.disclaimer
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getPopular: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let list = [];
      if (isMock) {
        list = localDb.find('remedies');
      } else {
        list = await Remedy.find({});
      }
      res.json(list.map(r => ({ _id: r._id, condition: r.condition })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = remedyController;
