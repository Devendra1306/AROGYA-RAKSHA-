const localDb = require('../utils/localDb');
const Medicine = require('../models/Medicine');
const Remedy = require('../models/Remedy');
const EmergencyGuide = require('../models/EmergencyGuide');

const ragService = {
  /**
   * Performs retrieval from database collections based on keywords present in user query
   * @param {string} query - The user query text
   * @returns {Promise<string>} Compiled context string from matched documents
   */
  retrieveContext: async (query) => {
    const queryLower = query.toLowerCase();
    let matchedDocs = [];

    const isMock = global.isMockDB;

    // 1. Search Medicines
    let medicines = [];
    if (isMock) {
      medicines = localDb.find('medicines');
    } else {
      try {
        medicines = await Medicine.find({});
      } catch (err) {
        console.error('Error fetching medicines for RAG:', err.message);
      }
    }

    medicines.forEach(med => {
      const matchName = queryLower.includes(med.medicineName.toLowerCase());
      const matchGeneric = queryLower.includes(med.genericName.toLowerCase());
      const matchCategory = queryLower.includes(med.category.toLowerCase());
      const matchUse = med.uses?.some(u => queryLower.includes(u.toLowerCase()));
      
      if (matchName || matchGeneric || matchCategory || matchUse) {
        matchedDocs.push(`[MEDICINE DOCUMENT]
Name: ${med.medicineName} (${med.genericName})
Category: ${med.category}
Uses: ${med.uses?.join(', ') || 'N/A'}
Dosage: ${med.dosage || 'N/A'}
Side Effects: ${med.sideEffects?.join(', ') || 'N/A'}
Precautions: ${med.precautions?.join(', ') || 'N/A'}
Interactions: ${med.interactions?.join(', ') || 'N/A'}`);
      }
    });

    // 2. Search Home Remedies
    let remedies = [];
    if (isMock) {
      remedies = localDb.find('remedies');
    } else {
      try {
        remedies = await Remedy.find({});
      } catch (err) {
        console.error('Error fetching remedies for RAG:', err.message);
      }
    }

    remedies.forEach(rem => {
      const matchCondition = queryLower.includes(rem.condition.toLowerCase());
      const matchCause = rem.causes?.some(c => queryLower.includes(c.toLowerCase()));
      const matchRemedyName = rem.remedies?.some(r => queryLower.includes(r.name.toLowerCase()));
      
      if (matchCondition || matchCause || matchRemedyName) {
        let text = `[HOME REMEDY DOCUMENT]
Condition: ${rem.condition}
Causes: ${rem.causes?.join(', ') || 'N/A'}
Remedies:`;
        rem.remedies.forEach(r => {
          text += `\n- Remedy Name: ${r.name}\n  Ingredients: ${r.ingredients?.join(', ') || 'N/A'}\n  Steps: ${r.steps?.join(' -> ') || 'N/A'}\n  Instructions: ${r.usageInstructions || 'N/A'}`;
        });
        text += `\nWarnings: ${rem.warnings?.join(', ') || 'N/A'}`;
        matchedDocs.push(text);
      }
    });

    // 3. Search Emergency Guides
    let emergencyGuides = [];
    if (isMock) {
      emergencyGuides = localDb.find('emergencyGuides');
    } else {
      try {
        emergencyGuides = await EmergencyGuide.find({});
      } catch (err) {
        console.error('Error fetching emergency guides for RAG:', err.message);
      }
    }

    emergencyGuides.forEach(guide => {
      const matchTitle = queryLower.includes(guide.title.toLowerCase());
      const matchCategory = queryLower.includes(guide.category.toLowerCase());
      const matchSymptom = guide.symptoms?.some(s => queryLower.includes(s.toLowerCase()));

      if (matchTitle || matchCategory || matchSymptom) {
        matchedDocs.push(`[EMERGENCY GUIDE DOCUMENT]
Title: ${guide.title}
Severity: ${guide.severity}
Symptoms: ${guide.symptoms?.join(', ') || 'N/A'}
Immediate Steps: ${guide.steps?.join(' -> ') || 'N/A'}
Do NOT do: ${guide.warnings?.join(', ') || 'N/A'}`);
      }
    });

    // 4. Combine and return context
    if (matchedDocs.length === 0) {
      return '';
    }

    console.log(`RAG: Retrieved ${matchedDocs.length} relevant document context(s).`);
    return matchedDocs.slice(0, 4).join('\n\n---\n\n');
  }
};

module.exports = ragService;
