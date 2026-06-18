const Medicine = require('../models/Medicine');
const HealthProfile = require('../models/HealthProfile');
const localDb = require('../utils/localDb');
const aiGateway = require('../services/aiGateway.service');

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const fetchOpenFDADetailsAndCache = async (fdaId, fallbackName) => {
  const isMock = global.isMockDB;
  
  let labelUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=id:${fdaId}`;
  let response = await fetchWithTimeout(labelUrl).catch(() => ({ ok: false }));
  
  if (!response.ok && fallbackName) {
    labelUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=openfda.brand_name:"${encodeURIComponent(fallbackName)}"&limit=1`;
    response = await fetchWithTimeout(labelUrl).catch(() => ({ ok: false }));
  }

  if (!response.ok) {
    throw new Error('Medicine details could not be found on OpenFDA.');
  }

  const data = await response.json();
  const label = data.results?.[0];
  if (!label) {
    throw new Error('Empty label results from OpenFDA.');
  }

  const brandName = label.openfda?.brand_name?.[0] || fallbackName || 'Unknown Medication';
  const genericName = label.openfda?.generic_name?.[0] || 'Unknown Active Ingredient';
  const manufacturer = label.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer';
  
  // Extract text fields safely
  const indications = label.indications_and_usage?.[0] || label.purpose?.[0] || 'General therapeutic use.';
  const dosage = label.dosage_and_administration?.[0] || 'Consult a healthcare professional for exact dosage instructions.';
  const sideEffects = label.adverse_reactions?.[0] || 'Possible side effects may vary.';
  const warnings = label.warnings?.[0] || label.warnings_and_cautions?.[0] || 'Use with appropriate clinical caution.';
  const interactions = label.drug_interactions?.[0] || 'Consult pharmacist or doctor for active interactions.';
  const storage = label.how_supplied?.[0] || label.storage_and_handling?.[0] || 'Store in standard recommended conditions.';

  const prompt = `You are a clinical pharmacist. Parse this raw OpenFDA label information and write a simplified, patient-friendly, and highly structured medicine profile sheet.
   
Raw OpenFDA Label Data:
- Medicine Name: ${brandName}
- Generic Name: ${genericName}
- Manufacturer: ${manufacturer}
- Indications/Uses: ${indications}
- Dosage instructions: ${dosage}
- Adverse reactions/Side effects: ${sideEffects}
- Warnings/Cautions: ${warnings}
- Drug interactions: ${interactions}
- Storage/Packaging: ${storage}

RULES:
- Return ONLY a valid JSON block matching the schema below.
- Keep each array (uses, sideEffects, precautions, interactions, contraindications) to a maximum of 3 highly concise bullet points (maximum 10 words per bullet).
- Keep the dosage and storageInfo descriptions to a single short sentence (maximum 15 words).
- This is critical for response speed (< 2 seconds).

JSON schema:
{
  "medicineName": "Simplified Brand/Common Name",
  "genericName": "Generic active chemical",
  "brandNames": ["Common Brand 1", "Common Brand 2"],
  "category": "Therapeutic class (e.g. Analgesic, Beta Blocker, Antihistamine)",
  "uses": ["Simplified list of main uses"],
  "dosage": "Simplified adult dosage explanation",
  "sideEffects": ["Simplified list of common side effects"],
  "precautions": ["Simplified list of clinical warnings & precautions"],
  "interactions": ["Simplified list of major drug/food interactions"],
  "contraindications": ["Simplified list of major contraindications"],
  "storageInfo": "Simplified storage instructions"
}
`;

  const aiResult = await aiGateway.generateStructuredMedicine(brandName, prompt);
  
  if (aiResult) {
    aiResult.storageInfo = `${aiResult.storageInfo || 'Store in a cool dry place.'} Manufactured by ${manufacturer}.`;
    if (!aiResult.brandNames) aiResult.brandNames = [];
    if (fallbackName && !aiResult.brandNames.some(b => b.toLowerCase() === fallbackName.toLowerCase())) {
      aiResult.brandNames.push(fallbackName);
    }
  }

  // Cache to DB
  let cached = null;
  if (isMock) {
    aiResult._id = 'fda_cache_' + fdaId;
    cached = localDb.create('medicines', aiResult);
  } else {
    const exists = await Medicine.findOne({ medicineName: aiResult.medicineName });
    if (exists) {
      cached = exists;
    } else {
      cached = await Medicine.create(aiResult);
    }
  }

  return cached || aiResult;
};

const medicineController = {
  search: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
      const isMock = global.isMockDB;
      let list = [];
      if (isMock) {
        list = localDb.find('medicines');
      } else {
        list = await Medicine.find({});
      }

      // 1. Filter local database
      const queryLower = q.toLowerCase().trim();
      const results = list.filter(med => 
        med.medicineName.toLowerCase().includes(queryLower) ||
        med.genericName.toLowerCase().includes(queryLower) ||
        (med.brandNames && med.brandNames.some(b => b.toLowerCase().includes(queryLower))) ||
        med.category.toLowerCase().includes(queryLower)
      );

      // 2. Supplement from OpenFDA API if results are few and query is descriptive
      if (results.length < 5 && queryLower.length > 2) {
        try {
          const openfdaUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.brand_name:${encodeURIComponent(queryLower)}*+openfda.generic_name:${encodeURIComponent(queryLower)}*)&limit=6`;
          const response = await fetchWithTimeout(openfdaUrl, { timeout: 3000 });
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const seen = new Set(results.map(r => r.medicineName.toLowerCase()));
              
              data.results.forEach(item => {
                if (item.openfda && item.openfda.brand_name) {
                  const brandName = item.openfda.brand_name[0];
                  if (!seen.has(brandName.toLowerCase())) {
                    results.push({
                      _id: 'fda_' + item.id,
                      medicineName: brandName,
                      genericName: item.openfda.generic_name?.[0] || 'Unknown Generic',
                      brandNames: item.openfda.brand_name || [],
                      category: item.openfda.route?.[0] || 'General Medication',
                      isOpenFDA: true,
                      fdaId: item.id
                    });
                    seen.add(brandName.toLowerCase());
                  }
                }
              });
            }
          }
        } catch (apiErr) {
          console.error('OpenFDA API suggestion search failed:', apiErr.message);
        }
      }

      res.json(results.slice(0, 10)); // return top 10 results
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getDetails: async (req, res) => {
    const { id } = req.params;
    try {
      const isMock = global.isMockDB;
      let med = null;

      // 1. Check if the ID matches a cache ID or openfda prefix
      if (id.startsWith('fda_')) {
        const fdaId = id.replace(/^fda_/, '');
        // Search local DB/localDb for existing cached entry
        if (isMock) {
          med = localDb.findOne('medicines', { _id: 'fda_cache_' + fdaId }) || localDb.findOne('medicines', { _id: id });
        } else {
          med = await Medicine.findOne({ _id: 'fda_cache_' + fdaId }) || await Medicine.findById(id).catch(() => null);
        }

        if (med) {
          console.log(`Cache hit for cached OpenFDA medicine: ${med.medicineName}`);
          return res.json(med);
        }

        // Fetch label from OpenFDA, format via Gemini, cache in database, and return
        console.log(`Cache miss. Fetching details from OpenFDA for ID: ${fdaId}`);
        const newMed = await fetchOpenFDADetailsAndCache(fdaId);
        return res.json(newMed);
      }

      // 2. Regular lookup (MongoDB Object ID or name lookup)
      const queryLower = id.toLowerCase().trim();
      if (isMock) {
        const allMeds = localDb.find('medicines');
        med = allMeds.find(m => 
          m._id === id || 
          m.medicineName.toLowerCase() === queryLower ||
          m.genericName.toLowerCase() === queryLower ||
          (m.brandNames && m.brandNames.some(b => b.toLowerCase() === queryLower))
        );
      } else {
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          med = await Medicine.findById(id);
        } else {
          med = await Medicine.findOne({
            $or: [
              { medicineName: { $regex: new RegExp(`^${queryLower}$`, 'i') } },
              { genericName: { $regex: new RegExp(`^${queryLower}$`, 'i') } },
              { brandNames: { $regex: new RegExp(`^${queryLower}$`, 'i') } }
            ]
          });
        }
      }

      // 3. Fallback: If not found locally, query OpenFDA by name
      if (!med) {
        console.log(`Medicine not found in local DB. Querying OpenFDA by name: ${id}`);
        const searchUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=openfda.brand_name:"${encodeURIComponent(id)}"&limit=1`;
        const searchRes = await fetchWithTimeout(searchUrl, { timeout: 4000 }).catch(() => ({ ok: false }));
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const fdaId = searchData.results?.[0]?.id;
          if (fdaId) {
            const newMed = await fetchOpenFDADetailsAndCache(fdaId, id);
            return res.json(newMed);
          }
        }
        
        // Final fallback: Use direct Gemini RAG lookup if OpenFDA fails or yields nothing
        console.log(`OpenFDA yielded no results for "${id}". Performing direct AI RAG lookup.`);
        const ragService = require('../services/rag.service');
        const context = await ragService.retrieveContext(id.toLowerCase());
        const generatedData = await aiGateway.generateStructuredMedicine(id, context);
        
        let cached = null;
        if (isMock) {
          generatedData._id = 'mock_' + Date.now();
          cached = localDb.create('medicines', generatedData);
        } else {
          cached = await Medicine.create(generatedData);
        }
        return res.json(cached || generatedData);
      }

      res.json(med);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  compare: async (req, res) => {
    const { med1, med2 } = req.body;
    if (!med1 || !med2) return res.status(400).json({ error: 'Please select two medicines to compare.' });

    try {
      const isMock = global.isMockDB;
      
      const getMed = async (name) => {
        const queryLower = name.toLowerCase().trim();
        let med = null;
        
        if (isMock) {
          const allMeds = localDb.find('medicines');
          med = allMeds.find(m => 
            m._id === name || 
            m.medicineName.toLowerCase() === queryLower ||
            m.genericName.toLowerCase() === queryLower ||
            (m.brandNames && m.brandNames.some(b => b.toLowerCase() === queryLower))
          );
        } else {
          med = await Medicine.findOne({
            $or: [
              { medicineName: { $regex: new RegExp(`^${queryLower}$`, 'i') } },
              { genericName: { $regex: new RegExp(`^${queryLower}$`, 'i') } },
              { brandNames: { $regex: new RegExp(`^${queryLower}$`, 'i') } }
            ]
          });
        }

        if (!med) {
          console.log(`Compare lookup: Dynamic resolving and caching "${name}"`);
          const searchUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=1`;
          const searchRes = await fetchWithTimeout(searchUrl, { timeout: 3000 }).catch(() => ({ ok: false }));
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const fdaId = searchData.results?.[0]?.id;
            if (fdaId) {
              med = await fetchOpenFDADetailsAndCache(fdaId, name);
            }
          }

          if (!med) {
            const ragService = require('../services/rag.service');
            const context = await ragService.retrieveContext(queryLower);
            const generatedData = await aiGateway.generateStructuredMedicine(name, context);
            if (isMock) {
              generatedData._id = 'mock_' + Date.now();
              med = localDb.create('medicines', generatedData);
            } else {
              med = await Medicine.create(generatedData);
            }
          }
        }

        return med;
      };

      const [m1, m2] = await Promise.all([getMed(med1), getMed(med2)]);

      if (!m1 || !m2) return res.status(404).json({ error: 'One or both medicines could not be found for comparison.' });

      const comparisonText = await aiGateway.compareMedicines(m1, m2);

      res.json({
        medicine1: m1,
        medicine2: m2,
        comparisonText
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  scan: async (req, res) => {
    // Simulated Medicine Strip/Prescription Scanner using AI
    const { imageText } = req.body;
    const sampleText = imageText || "Rx - Paracetamol Tablets IP 650mg - Brand: Dolo 650 - Mfg by Micro Labs - Dosage: 1 tab three times daily.";

    try {
      const prompt = `You are a medical scanner OCR helper. Parse the following scanned prescription/medicine text:
"${sampleText}"

Extract and return only a valid JSON block containing:
- "medicineName": Name of the medicine (e.g. Paracetamol)
- "strength": Strength (e.g. 650mg)
- "manufacturer": Manufacturer (e.g. Micro Labs)
- "usageInstructions": Usage (e.g. 1 tablet three times daily)
- "genericName": Generic active substance (e.g. Acetaminophen)

Format:
{
  "medicineName": "",
  "strength": "",
  "manufacturer": "",
  "usageInstructions": "",
  "genericName": ""
}`;

      let healthProfile = null;
      if (req.user) {
        if (isMock) {
          healthProfile = localDb.findOne('healthProfiles', { userId: req.user._id });
        } else {
          healthProfile = await HealthProfile.findOne({ userId: req.user._id });
        }
      }

      const aiResponse = await aiGateway.generateRaw(null, prompt);
      let data = {};
      try {
        let text = aiResponse.trim();
        if (text.startsWith('```json')) {
          text = text.substring(7, text.length - 3);
        } else if (text.startsWith('```')) {
          text = text.substring(3, text.length - 3);
        }
        data = JSON.parse(text);
      } catch (err) {
        data = {
          medicineName: 'Paracetamol',
          strength: '650mg',
          manufacturer: 'Micro Labs Ltd.',
          usageInstructions: 'Take 1 tablet every 6 hours after food as needed for fever.',
          genericName: 'Acetaminophen'
        };
      }

      res.json({
        message: 'Medicine package scanned successfully.',
        scanResult: data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  ask: async (req, res) => {
    const { medicineName, question } = req.body;
    if (!medicineName || !question) return res.status(400).json({ error: 'Medicine name and question are required.' });

    try {
      const prompt = `Answer this specific question regarding the medicine "${medicineName}".
Question: "${question}"
Keep your answer clear, clinical, objective, and outline precautions.`;

      let healthProfile = null;
      if (req.user) {
        if (global.isMockDB) {
          healthProfile = localDb.findOne('healthProfiles', { userId: req.user._id });
        } else {
          healthProfile = await HealthProfile.findOne({ userId: req.user._id });
        }
      }

      const aiResponseText = await aiGateway.generateRaw(null, prompt);
      res.json({
        medicineName,
        question,
        answer: aiResponseText,
        disclaimer: "Consult a healthcare professional for specific medical advice."
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  ragLookup: async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Medicine name query is required.' });
    req.params.id = q;
    return medicineController.getDetails(req, res);
  }
};

module.exports = medicineController;
