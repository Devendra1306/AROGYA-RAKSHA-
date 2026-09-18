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

const isBadCache = (m) => {
  if (!m) return true;
  if (m.genericName === 'Unknown Active Ingredient') return true;
  if (m.category === 'General Therapeutics') return true;
  if (Array.isArray(m.uses) && m.uses[0] === 'General health management') return true;
  return false;
};

const fetchOpenFDADetailsAndCache = async (fdaId, fallbackName) => {
  const isMock = global.isMockDB;
  
  let label = null;
  const cleanName = (fallbackName || '').trim();

  // 1. Try fetching by OpenFDA ID
  if (fdaId) {
    const labelUrl = `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=id:${fdaId}`;
    const response = await fetchWithTimeout(labelUrl, { timeout: 4000 }).catch(() => ({ ok: false }));
    if (response.ok) {
      const data = await response.json();
      label = data.results?.[0];
    }
  }
  
  // 2. If not found by ID, search OpenFDA by both brand_name and generic_name
  if (!label && cleanName) {
    const searchQueries = [
      `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:"${encodeURIComponent(cleanName)}"+openfda.brand_name:"${encodeURIComponent(cleanName)}"+openfda.substance_name:"${encodeURIComponent(cleanName)}")&limit=1`,
      `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:${encodeURIComponent(cleanName)}*+openfda.brand_name:${encodeURIComponent(cleanName)}*)&limit=1`
    ];

    for (const url of searchQueries) {
      const response = await fetchWithTimeout(url, { timeout: 4000 }).catch(() => ({ ok: false }));
      if (response.ok) {
        const data = await response.json();
        if (data.results?.[0]) {
          label = data.results[0];
          break;
        }
      }
    }
  }

  // 3. Extract OpenFDA label sections
  const brandName = label?.openfda?.brand_name?.[0] || fallbackName || 'Unknown Medication';
  const genericName = label?.openfda?.generic_name?.[0] || label?.openfda?.substance_name?.[0] || fallbackName;
  const manufacturer = label?.openfda?.manufacturer_name?.[0] || '';
  const pharmClass = label?.openfda?.pharm_class_epc?.[0] || label?.openfda?.pharm_class_cs?.[0] || '';
  
  const indications = label?.indications_and_usage?.[0] || label?.purpose?.[0] || label?.description?.[0] || '';
  const dosage = label?.dosage_and_administration?.[0] || '';
  const sideEffects = label?.adverse_reactions?.[0] || '';
  const warnings = label?.warnings?.[0] || label?.warnings_and_cautions?.[0] || label?.boxed_warning?.[0] || '';
  const interactions = label?.drug_interactions?.[0] || '';
  const contraindications = label?.contraindications?.[0] || '';
  const storage = label?.how_supplied?.[0] || label?.storage_and_handling?.[0] || '';

  // Prepare clinical context from OpenFDA to feed into Gemini
  let rawFDAContext = `
- Official Medicine Name: ${brandName}
- Generic Active Ingredient: ${genericName}
- Manufacturer: ${manufacturer || 'FDA Registered Facility'}
${pharmClass ? `- Pharmacological Class: ${pharmClass}` : ''}
${indications ? `- Indications & Usage: ${indications.slice(0, 1200)}` : ''}
${dosage ? `- Dosage & Administration: ${dosage.slice(0, 800)}` : ''}
${sideEffects ? `- Adverse Reactions & Side Effects: ${sideEffects.slice(0, 800)}` : ''}
${warnings ? `- Warnings & Precautions: ${warnings.slice(0, 800)}` : ''}
${interactions ? `- Drug Interactions: ${interactions.slice(0, 600)}` : ''}
${contraindications ? `- Contraindications: ${contraindications.slice(0, 600)}` : ''}
${storage ? `- Storage & Handling: ${storage.slice(0, 400)}` : ''}
`.trim();

  // 4. Refine OpenFDA label data with Gemini API
  console.log(`[Medicine Service] Refining OpenFDA details with Gemini API for: ${brandName}`);
  const aiResult = await aiGateway.generateStructuredMedicine(brandName, rawFDAContext);
  
  const route = label?.openfda?.route?.[0] || 'Oral';
  const productType = label?.openfda?.product_type?.[0] || '';
  const prescriptionStatus = productType.includes('OTC') 
    ? 'Over-The-Counter (OTC)' 
    : (productType.includes('PRESCRIPTION') ? 'Prescription Required (Rx)' : 'Prescription (Rx)');
  const source = 'U.S. FDA Drug Label Database (OpenFDA)';
  const lastUpdated = label?.effective_time 
    ? label.effective_time.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') 
    : new Date().toISOString().split('T')[0];

  if (aiResult) {
    aiResult.route = route;
    aiResult.prescriptionStatus = prescriptionStatus;
    aiResult.source = source;
    aiResult.lastUpdated = lastUpdated;

    if (manufacturer && !aiResult.storageInfo?.includes(manufacturer)) {
      aiResult.storageInfo = `${aiResult.storageInfo || 'Store in a cool, dry place.'} Manufactured by ${manufacturer}.`.trim();
    }
    if (!aiResult.brandNames) aiResult.brandNames = [];
    if (fallbackName && !aiResult.brandNames.some(b => b.toLowerCase() === fallbackName.toLowerCase())) {
      aiResult.brandNames.unshift(fallbackName);
    }
    if (label?.id && !aiResult.fdaId) {
      aiResult.fdaId = label.id;
    }
  }

  // 5. Cache or update in DB (overwriting any previous bad cache)
  let cached = null;
  const targetId = fdaId ? `fda_cache_${fdaId}` : (label?.id ? `fda_cache_${label.id}` : `med_${cleanName.toLowerCase()}`);

  if (isMock) {
    aiResult._id = targetId;
    const existing = localDb.findOne('medicines', { _id: targetId }) || localDb.findOne('medicines', { medicineName: aiResult.medicineName });
    if (existing) {
      cached = localDb.findByIdAndUpdate('medicines', existing._id, aiResult);
    } else {
      cached = localDb.create('medicines', aiResult);
    }
  } else {
    try {
      cached = await Medicine.findOneAndUpdate(
        { $or: [{ medicineName: aiResult.medicineName }, { medicineName: fallbackName }] },
        { $set: aiResult },
        { new: true, upsert: true }
      );
    } catch (err) {
      console.warn('[Medicine Service] DB upsert notice:', err.message);
      cached = aiResult;
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

        if (med && !isBadCache(med)) {
          console.log(`Cache hit for cached OpenFDA medicine: ${med.medicineName}`);
          return res.json(med);
        }

        // Fetch label from OpenFDA, format via Gemini, cache in database, and return
        console.log(`Cache miss or bad cache. Fetching details from OpenFDA for ID: ${fdaId}`);
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

      // If cached data contains placeholder/corrupted data, invalidate and refetch
      if (med && isBadCache(med)) {
        console.log(`Cached medicine "${med.medicineName}" contains placeholder data. Invalidate & refetching...`);
        med = null;
      }

      // 3. Fallback: If not found locally (or was bad cache), query OpenFDA by name
      if (!med) {
        console.log(`Medicine not found in local DB or invalidated. Querying OpenFDA by name: ${id}`);
        const searchQueries = [
          `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:"${encodeURIComponent(id)}"+openfda.brand_name:"${encodeURIComponent(id)}"+openfda.substance_name:"${encodeURIComponent(id)}")&limit=1`,
          `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:${encodeURIComponent(id)}*+openfda.brand_name:${encodeURIComponent(id)}*)&limit=1`
        ];

        for (const searchUrl of searchQueries) {
          const searchRes = await fetchWithTimeout(searchUrl, { timeout: 4000 }).catch(() => ({ ok: false }));
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const fdaId = searchData.results?.[0]?.id;
            if (fdaId) {
              const newMed = await fetchOpenFDADetailsAndCache(fdaId, id);
              return res.json(newMed);
            }
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
          const existing = localDb.findOne('medicines', { medicineName: generatedData.medicineName });
          if (existing) {
            cached = localDb.findByIdAndUpdate('medicines', existing._id, generatedData);
          } else {
            cached = localDb.create('medicines', generatedData);
          }
        } else {
          try {
            cached = await Medicine.findOneAndUpdate(
              { medicineName: generatedData.medicineName },
              { $set: generatedData },
              { new: true, upsert: true }
            );
          } catch (err) {
            console.warn('[Medicine Service] DB upsert notice:', err.message);
            cached = generatedData;
          }
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

        if (med && isBadCache(med)) {
          med = null;
        }

        if (!med) {
          console.log(`Compare lookup: Dynamic resolving and caching "${name}"`);
          const searchQueries = [
            `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:"${encodeURIComponent(name)}"+openfda.brand_name:"${encodeURIComponent(name)}"+openfda.substance_name:"${encodeURIComponent(name)}")&limit=1`,
            `https://api.fda.gov/drug/label.json?api_key=aniNQ7FQNxVgReQg4kQexCzmeqzqDb3mvKnLd5d7&search=(openfda.generic_name:${encodeURIComponent(name)}*+openfda.brand_name:${encodeURIComponent(name)}*)&limit=1`
          ];

          for (const searchUrl of searchQueries) {
            const searchRes = await fetchWithTimeout(searchUrl, { timeout: 3000 }).catch(() => ({ ok: false }));
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              const fdaId = searchData.results?.[0]?.id;
              if (fdaId) {
                med = await fetchOpenFDADetailsAndCache(fdaId, name);
                break;
              }
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
              try {
                med = await Medicine.findOneAndUpdate(
                  { medicineName: generatedData.medicineName },
                  { $set: generatedData },
                  { new: true, upsert: true }
                );
              } catch (err) {
                med = generatedData;
              }
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
        const isMock = global.isMockDB;
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
      // Screen for life-threatening emergency symptoms
      const emergencyKeywords = [
        'chest pain', 'shortness of breath', 'cannot breathe', "can't breathe", 'trouble breathing',
        'difficulty breathing', 'swelling of throat', 'swelling of tongue', 'swelling of face',
        'anaphylaxis', 'overdose', 'took too much', 'unconscious', 'passed out', 'seizure',
        'severe bleeding', 'coughing blood'
      ];
      const lowerQ = question.toLowerCase();
      const isEmergency = emergencyKeywords.some(kw => lowerQ.includes(kw));

      // Retrieve medicine context if available
      let medContext = '';
      if (global.isMockDB) {
        const found = localDb.findOne('medicines', { medicineName });
        if (found) {
          medContext = `Active Generic: ${found.genericName}, Class: ${found.category}, Known Side Effects: ${found.sideEffects?.join(', ')}, Warnings: ${found.precautions?.join(', ')}`;
        }
      } else {
        const found = await Medicine.findOne({ medicineName });
        if (found) {
          medContext = `Active Generic: ${found.genericName}, Class: ${found.category}, Known Side Effects: ${found.sideEffects?.join(', ')}, Warnings: ${found.precautions?.join(', ')}`;
        }
      }

      const prompt = `You are a clinical AI medical educator for Arogya Raksha.
Medicine: "${medicineName}"
${medContext ? `Verified Drug Profile: ${medContext}` : ''}
Patient Question: "${question}"

STRICT SAFETY & REGULATORY RULES:
1. Provide a direct, empathetic, and clear response in 2-4 sentences (under 90 words).
2. DO NOT formulate a medical diagnosis or prescribe personalized treatment.
3. DO NOT alter, compute, or invent custom dosages.
4. Distinguish established pharmacological facts from educational guidance.
5. If the user asks about symptoms that could be an allergic reaction or side effect, clarify that immediate professional evaluation is required.
6. Always remind the user to confirm with their attending physician or licensed pharmacist.
${isEmergency ? '7. CRITICAL: The user has mentioned potentially life-threatening emergency symptoms. Lead with an URGENT notice to call emergency services (108 / 112) or go to the nearest emergency facility immediately.' : ''}`;

      let aiResponseText = await aiGateway.generateRaw(null, prompt, 0.2, 220);

      if (isEmergency) {
        aiResponseText = `🚨 **EMERGENCY WARNING**: The symptoms described may indicate an acute medical emergency. Please seek immediate emergency medical evaluation (Dial 108 / 112 or visit the nearest emergency department) right away.\n\n${aiResponseText}`;
      }

      res.json({
        medicineName,
        question,
        answer: aiResponseText,
        isEmergency,
        disclaimer: "AI-generated educational explanation based on available drug data. Does not substitute for professional medical diagnosis or personalized treatment."
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  checkInteractions: async (req, res) => {
    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({ error: 'Please provide at least two medicine names to check for interactions.' });
    }

    try {
      const cleanMeds = medicines.map(m => String(m).trim()).filter(Boolean);
      const result = await aiGateway.checkInteractions(cleanMeds);
      res.json(result);
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
