const localDb = require('../utils/localDb');
const EmergencyGuide = require('../models/EmergencyGuide');
const aiGateway = require('../services/aiGateway.service');
const ragService = require('../services/rag.service');

const emergencyController = {
  analyze: async (req, res) => {
    const { query, healthProfile } = req.body;
    if (!query) return res.status(400).json({ error: 'Please enter a symptom description.' });

    try {
      // 1. Fetch RAG Context
      const context = await ragService.retrieveContext(query);
      
      // 2. Query Gemini through AI Gateway
      const result = await aiGateway.generateResponse(query, healthProfile, context);
      
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let list = [];
      if (isMock) {
        list = localDb.find('emergencyGuides');
      } else {
        list = await EmergencyGuide.find({});
      }
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getDetails: async (req, res) => {
    const { id } = req.params;
    try {
      const isMock = global.isMockDB;
      let guide = null;
      if (isMock) {
        guide = localDb.findOne('emergencyGuides', { _id: id }) || localDb.findOne('emergencyGuides', { category: id });
      } else {
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          guide = await EmergencyGuide.findById(id);
        } else {
          guide = await EmergencyGuide.findOne({ category: id });
        }
      }

      if (!guide) return res.status(404).json({ error: 'Emergency instructions not found.' });
      res.json(guide);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getContacts: async (req, res) => {
    try {
      const isMock = global.isMockDB;
      let contacts = [];
      if (isMock) {
        contacts = localDb.find('emergencyContacts', { userId: req.user._id });
      } else {
        const EmergencyContactModel = require('../models/User'); // Reuse or simple mock contacts schema
        // Just store them in a simple collections
        const mongoose = require('mongoose');
        const Contact = mongoose.models.EmergencyContact || mongoose.model('EmergencyContact', new mongoose.Schema({
          userId: mongoose.Schema.Types.ObjectId,
          name: String,
          phone: String,
          relationship: String
        }));
        contacts = await Contact.find({ userId: req.user._id });
      }
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  saveContact: async (req, res) => {
    const { name, phone, relationship } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone number are required.' });

    try {
      const isMock = global.isMockDB;
      let newContact;

      if (isMock) {
        newContact = localDb.create('emergencyContacts', {
          userId: req.user._id,
          name,
          phone,
          relationship
        });
      } else {
        const mongoose = require('mongoose');
        const Contact = mongoose.models.EmergencyContact || mongoose.model('EmergencyContact', new mongoose.Schema({
          userId: mongoose.Schema.Types.ObjectId,
          name: String,
          phone: String,
          relationship: String
        }));
        newContact = await Contact.create({
          userId: req.user._id,
          name,
          phone,
          relationship
        });
      }

      res.status(201).json({ message: 'Emergency contact saved successfully.', contact: newContact });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  shareLocation: async (req, res) => {
    const { latitude, longitude, emergencyType } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'GPS Coordinates are required.' });

    try {
      const isMock = global.isMockDB;
      let log;

      const logData = {
        userId: req.user._id,
        latitude,
        longitude,
        emergencyType: emergencyType || 'General Emergency Alert',
        timestamp: new Date().toISOString()
      };

      if (isMock) {
        log = localDb.create('emergencyLogs', logData);
      } else {
        const mongoose = require('mongoose');
        const EmergencyLog = mongoose.models.EmergencyLog || mongoose.model('EmergencyLog', new mongoose.Schema({
          userId: mongoose.Schema.Types.ObjectId,
          latitude: Number,
          longitude: Number,
          emergencyType: String,
          timestamp: { type: Date, default: Date.now }
        }));
        log = await EmergencyLog.create(logData);
      }

      res.json({
        message: '🚨 Location and emergency details broadcasted to your emergency circle successfully.',
        log
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = emergencyController;
