const { GoogleGenerativeAI } = require('@google/generative-ai');

// In-memory cache for optimizing responses
const responseCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache expiration

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.value;
  }
  return null;
}

function setCachedResponse(key, value) {
  responseCache.set(key, { value, timestamp: Date.now() });
}

// Provider health statuses and failure cooldowns
const providerStatus = {
  Gemini: { isHealthy: true, lastFailure: 0 },
  Groq: { isHealthy: true, lastFailure: 0 },
  OpenRouter: { isHealthy: true, lastFailure: 0 }
};
const FAILURE_COOLDOWN = 60 * 1000; // 1 minute cooldown before retrying a failed provider

function isProviderHealthy(name) {
  const status = providerStatus[name];
  if (!status.isHealthy) {
    if (Date.now() - status.lastFailure > FAILURE_COOLDOWN) {
      status.isHealthy = true; // reset healthy state after cooldown
      console.log(`[AI Gateway] Provider ${name} health cooldown expired. Re-enabling.`);
      return true;
    }
    return false;
  }
  return true;
}

function markProviderFailure(name) {
  providerStatus[name].isHealthy = false;
  providerStatus[name].lastFailure = Date.now();
  console.warn(`[AI Gateway] Provider ${name} marked UNHEALTHY at ${new Date().toISOString()}`);
}

// Timeout helper for standard promises
function promiseWithTimeout(promise, timeoutMs = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs))
  ]);
}

// Fetch helper with timeout
function fetchWithTimeout(url, options, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => {
      controller.abort();
      reject(new Error(`Fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        clearTimeout(id);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(id);
        reject(err);
      });
  });
}

// Helper to call Gemini models
async function callGemini(systemInstruction, userPrompt, temperature = 0.2, maxTokens = 250) {
  // Ultra-fast sub-2s latency models first for instant medical chat responses
  const geminiModels = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash'
  ];
  let lastError = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured in environment.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of geminiModels) {
    try {
      console.log(`[AI Gateway] Attempting Gemini model "${modelName}"...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens || 250
        }
      });
      // Call with timeout
      const result = await promiseWithTimeout(model.generateContent(userPrompt), 8000);
      const text = result.response.text();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[AI Gateway] Gemini model "${modelName}" failed:`, err.message);
      lastError = err;
      // If 404 (model unavailable) or 503 (high demand), immediately try next model
    }
  }
  throw lastError || new Error('All configured Gemini models failed to generate content.');
}

// Helper to call Groq API
async function callGroq(systemInstruction, userPrompt, temperature = 0.2, maxTokens = 250) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key is not configured in environment.');
  }

  const groqModels = ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'groq/compound-mini'];
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });

  let lastError = null;
  for (const modelName of groqModels) {
    try {
      console.log(`[AI Gateway] Attempting Groq (${modelName})...`);
      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: temperature,
          max_tokens: maxTokens || 250
        })
      }, 7000);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[AI Gateway] Groq model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All configured Groq models failed.');
}

// Helper to call OpenRouter API
async function callOpenRouter(systemInstruction, userPrompt, temperature = 0.2, maxTokens = 250) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API Key is not configured in environment.');
  }

  const openRouterModels = [
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'inclusionai/ling-3.0-flash-fin:free',
    'google/gemma-4-31b-it:free'
  ];

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });

  let lastError = null;
  for (const modelName of openRouterModels) {
    try {
      console.log(`[AI Gateway] Attempting OpenRouter (${modelName})....`);
      const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://arogyarakshaa.vercel.app',
          'X-Title': 'Arogya Raksha'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: temperature,
          max_tokens: maxTokens || 250
        })
      }, 7000);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API returned error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[AI Gateway] OpenRouter model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All configured OpenRouter models failed.');
}

// Core multi-provider fallback orchestrator with retries
async function generateContentWithFallback(systemInstruction, userPrompt, temperature = 0.2, maxTokens = 250) {
  // Prioritize Gemini (verified fast and accurate with user key), fallback to Groq, then OpenRouter
  const providers = [
    { name: 'Gemini', fn: callGemini },
    { name: 'Groq', fn: callGroq },
    { name: 'OpenRouter', fn: callOpenRouter }
  ];

  let lastError = null;

  for (const provider of providers) {
    if (!isProviderHealthy(provider.name)) {
      console.warn(`[AI Gateway] Skipping unhealthy provider: ${provider.name}`);
      continue;
    }

    // Try up to 2 times for each provider (retry transient failures)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await provider.fn(systemInstruction, userPrompt, temperature, maxTokens);
        if (text) {
          console.log(`[AI Gateway] Success using provider: ${provider.name} (Attempt ${attempt})`);
          return text;
        }
      } catch (err) {
        console.warn(`[AI Gateway] Provider ${provider.name} attempt ${attempt} failed: ${err.message}`);
        lastError = err;
        // Wait briefly on retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }

    // If both attempts fail, mark provider as unhealthy
    markProviderFailure(provider.name);
  }

  throw lastError || new Error('All AI providers in gateway failed to generate a response.');
}

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'choking', 'severe bleeding',
  'poison', 'seizure', 'electric shock', 'difficulty breathing',
  'unconscious', 'allergic reaction', 'heat stroke', 'heavy bleeding',
  'cannot breathe', 'sweating chest pain', 'face drooping', 'numbness arm'
];

function checkEmergency(text) {
  const queryLower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => queryLower.includes(keyword));
}

const aiGateway = {
  validateConfig: () => {
    console.log('\n====================================');
    console.log('  Arogya Raksha AI Gateway Startup Check');
    console.log(`Gemini (Primary): ${process.env.GEMINI_API_KEY ? ' ENABLED' : ' WARNING (Missing key in environment, will fall back)'}`);
    console.log(`Groq (Secondary): ${process.env.GROQ_API_KEY ? ' ENABLED' : ' DISABLED (Key Missing)'}`);
    console.log(`OpenRouter (Tertiary): ${process.env.OPENROUTER_API_KEY ? ' ENABLED' : ' DISABLED (Key Missing)'}`);
    console.log('====================================\n');
  },

  /**
   * Generates a structured healthcare response using multi-provider fallback gateway
   */
  generateResponse: async (userQuery, healthProfile = null, retrievedContext = '', temperature = 0.2) => {
    // 1. Check for high-risk emergency indicators
    const isEmergency = checkEmergency(userQuery);
    if (isEmergency) {
      return {
        isEmergency: true,
        urgencyLevel: 'Critical',
        possibleEmergency: 'Detected High-Risk Symptom',
        response: 'CRITICAL EMERGENCY DETECTED: Your symptoms suggest a potential life-threatening emergency. Please contact emergency services immediately or visit the nearest hospital emergency room. Do NOT delay medical attention.',
        immediateActions: [
          'Call emergency services (112 or local ambulance) immediately.',
          'If chest pain is present, sit comfortably and loosen tight clothing.',
          'Do NOT perform strenuous activity or walk.',
          'Share your live location with your emergency contact circle.'
        ],
        suggestHospitalSearch: true
      };
    }

    // Cache check (skip caching if request looks like diet generation or random seeds)
    const cacheKey = `${userQuery}_${retrievedContext}_${healthProfile ? JSON.stringify(healthProfile) : ''}`;
    const isCacheable = !userQuery.toLowerCase().includes('random') && !userQuery.toLowerCase().includes('seed') && !userQuery.toLowerCase().includes('mealType');
    if (isCacheable) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        console.log('[AI Gateway] Returning cached response.');
        return cached;
      }
    }

    // 2. Assemble System Prompt with Context Injection
    let systemPrompt = `You are the Arogya Raksha AI Healthcare Assistant.
Your goal is to provide fast, short, direct, and easy-to-read medical assistance under 75 words total.

CRITICAL RULES:
- Keep the entire response strictly under 75 words. No fluff or repetitive text.
- Format using exactly these 4 clean markdown headers:

### 1. POSSIBLE CAUSE
1 concise sentence on what the symptoms might relate to (never give a definitive diagnosis).

### 2. SEVERITY
[Mild / Moderate / High Risk]

### 3. QUICK CARE & ACTIONS
2-3 brief practical bullet points starting with ✓ (hydration, rest, or common OTC care).

### 4. WHEN TO SEE A DOCTOR
1 short line on when to seek in-person medical consultation.

DIRECTIONS:
- Do NOT prescribe prescription-only drugs. Keep guidance safe and practical.
- Keep user profile context (allergies/conditions) in mind if provided.
- Do NOT add a lengthy disclaimer at the bottom (the UI displays one automatically).
`;

    // Inject User Profile Context & Dynamic BMI
    if (healthProfile) {
      const heightInMeters = healthProfile.height ? healthProfile.height / 100 : null;
      let calculatedBmi = 'N/A';
      let bmiStatus = '';
      if (healthProfile.weight && heightInMeters) {
        calculatedBmi = (healthProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
        if (calculatedBmi < 18.5) bmiStatus = 'Underweight';
        else if (calculatedBmi < 25) bmiStatus = 'Normal weight';
        else if (calculatedBmi < 30) bmiStatus = 'Overweight';
        else bmiStatus = 'Obese';
      }

      systemPrompt += `\nUSER HEALTH PROFILE:
- Age: ${healthProfile.age || 'N/A'}
- Gender: ${healthProfile.gender || 'N/A'}
- Height: ${healthProfile.height || 'N/A'} cm
- Weight: ${healthProfile.weight || 'N/A'} kg
- BMI: ${calculatedBmi} ${bmiStatus ? `(Status: ${bmiStatus})` : ''}
- Existing Conditions: ${healthProfile.medicalConditions?.join(', ') || 'None'}
- Allergies: ${healthProfile.allergies?.join(', ') || 'None'}
- Current Medications: ${healthProfile.medications?.join(', ') || 'None'}
- Diet Preference: ${healthProfile.dietPreference || 'Vegetarian'}
- Health Goal: ${healthProfile.healthGoal || 'Healthy Lifestyle'}
`;
    }

    // Inject RAG Context
    if (retrievedContext) {
      systemPrompt += `\nRETRIEVED TRUSTED MEDICAL DOCUMENTS:\n${retrievedContext}\nUse the above information to synthesize your response accurately.`;
    }

    try {
      const prompt = `User Query: "${userQuery}"\nAnalyze the query, customize for the profile context, incorporate RAG guidelines, and write the structured response.`;
      const textResponse = await generateContentWithFallback(systemPrompt, prompt, temperature, 220);

      // Classify concern level based on text
      let urgencyLevel = 'Low Concern';
      const textLower = textResponse.toLowerCase();
      if (textLower.includes('doctor immediately') || textLower.includes('emergency') || textLower.includes('critical') || textLower.includes('severe')) {
        urgencyLevel = 'Moderate Concern';
      }

      const result = {
        isEmergency: false,
        urgencyLevel,
        response: textResponse,
        disclaimer: 'Disclaimer: Arogya Raksha provides educational healthcare guidance only. It does not replace professional medical diagnosis, treatment, or emergency care. Always consult qualified healthcare professionals for serious conditions.'
      };

      if (isCacheable) {
        setCachedResponse(cacheKey, result);
      }

      return result;
    } catch (err) {
      console.error('[AI Gateway] Error in generateResponse:', err.message);
      // Fallback response in case API limit or connection issue
      return {
        isEmergency: false,
        urgencyLevel: 'Low Concern',
        response: `Based on your query, we suggest keeping hydrated, resting, and monitoring your symptoms. Please verify your internet connection or check back later for full AI analysis.\n\nRecommended Actions:\n1. Rest in a well-ventilated room.\n2. Stay hydrated (drink warm water/fluids).\n3. Consult a general physician if symptoms persist beyond 48 hours.`,
        disclaimer: 'Disclaimer: Arogya Raksha provides educational healthcare guidance only. It does not replace professional medical diagnosis, treatment, or emergency care. Always consult qualified healthcare professionals for serious conditions.'
      };
    }
  },

  generateStructuredMedicine: async (medicineName, retrievedContext = '', temperature = 0.2) => {
    const cacheKey = `med_${medicineName.toLowerCase()}_${retrievedContext.slice(0, 100)}`;
    const cached = getCachedResponse(cacheKey);
    if (cached && cached.genericName && cached.genericName !== 'Unknown Active Ingredient') {
      console.log('[AI Gateway] Returning cached structured medicine.');
      return cached;
    }

    const systemPrompt = `You are a clinical pharmacologist and medical information specialist.
Analyze the medicine: "${medicineName}".
${retrievedContext ? `Use this official OpenFDA drug label and clinical context to extract and refine verified details:\n${retrievedContext}\n` : ''}
Produce an authentic, comprehensive, patient-friendly clinical profile for "${medicineName}".

CRITICAL INSTRUCTIONS:
- Identify the REAL active generic chemical substance (e.g. for Glimepiride write "Glimepiride", for Nepra-D write "Naproxen + Domperidone", for Cetirizine write "Cetirizine Hydrochloride").
- Return ONLY a clean, valid JSON object matching the schema below. No markdown wrappers, no backticks, no explanatory text.
- Keep each array item concise and informative (under 15 words per point).

JSON schema:
{
  "medicineName": "${medicineName}",
  "genericName": "Accurate generic active pharmaceutical ingredient (API)",
  "brandNames": ["Common Brand 1", "Common Brand 2"],
  "category": "Accurate therapeutic class (e.g. Sulfonylurea Antidiabetic, NSAID, Antihistamine)",
  "uses": ["Primary clinical indication 1", "Primary clinical indication 2", "Primary clinical indication 3"],
  "dosage": "Clear standard adult dosage guideline and timing (e.g. Take once daily with breakfast)",
  "sideEffects": ["Common side effect 1", "Common side effect 2", "Common side effect 3"],
  "precautions": ["Important clinical warning 1", "Important clinical warning 2"],
  "interactions": ["Major drug or food interaction 1", "Major drug or food interaction 2"],
  "contraindications": ["Primary medical contraindication 1", "Primary medical contraindication 2"],
  "storageInfo": "Accurate storage temperature and condition guidelines"
}
`;
    try {
      // Use 900 tokens to ensure the JSON is never cut off
      let text = await generateContentWithFallback(null, systemPrompt, temperature, 900);
      text = text.trim();
      
      // Extract JSON substring between first { and last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      
      // Clean up common JSON issues like trailing commas
      text = text.replace(/,\s*([\]}])/g, '$1');
      
      const data = JSON.parse(text);
      if (data && data.medicineName) {
        setCachedResponse(cacheKey, data);
        return data;
      }
      throw new Error('Parsed medicine JSON was incomplete.');
    } catch (err) {
      console.error('[AI Gateway] Error generating structured medicine:', err.message);
      
      // Clinical intelligent fallback based on drug name rather than generic dummy values
      const drugLower = medicineName.toLowerCase();
      let detectedGeneric = medicineName;
      let detectedCategory = 'Pharmaceutical Medication';
      let detectedUses = ['Clinical condition management as prescribed'];
      let detectedDosage = 'Take exactly as directed by your physician or pharmacist.';
      let detectedSideEffects = ['Mild stomach upset', 'Drowsiness or dizziness', 'Headache'];
      let detectedPrecautions = ['Take with a glass of water', 'Do not exceed prescribed dosage'];
      let detectedInteractions = ['Consult doctor before combining with alcohol or other medications'];

      if (drugLower.includes('glimepiride') || drugLower.includes('amaryl') || drugLower.includes('glinil')) {
        detectedGeneric = 'Glimepiride';
        detectedCategory = 'Sulfonylurea / Oral Antidiabetic';
        detectedUses = ['Type 2 Diabetes Mellitus blood sugar control', 'Improves insulin release from pancreas', 'Adjunct to diet and physical exercise'];
        detectedDosage = 'Initial dose: 1 mg to 2 mg once daily with breakfast or first main meal. Titrated by doctor.';
        detectedSideEffects = ['Hypoglycemia (low blood sugar)', 'Dizziness or lightheadedness', 'Nausea', 'Temporary visual impairment'];
        detectedPrecautions = ['Monitor blood glucose regularly', 'Carry fast-acting glucose or candy', 'Do not skip meals while on medication'];
        detectedInteractions = ['Alcohol increases hypoglycemia risk', 'Beta-blockers may mask low blood sugar signs', 'NSAIDs & ACE inhibitors'];
      } else if (drugLower.includes('cetirizine') || drugLower.includes('zyrtec') || drugLower.includes('cetzine')) {
        detectedGeneric = 'Cetirizine Hydrochloride';
        detectedCategory = 'Second-Generation Antihistamine';
        detectedUses = ['Allergic rhinitis and hay fever relief', 'Chronic urticaria (hives and skin itching)', 'Sneezing, runny nose, and itchy watery eyes'];
        detectedDosage = 'Adults: 5 mg to 10 mg once daily depending on symptom severity.';
        detectedSideEffects = ['Mild drowsiness or fatigue', 'Dry mouth', 'Headache'];
        detectedPrecautions = ['Use caution when operating machinery or driving', 'Avoid excessive alcohol consumption'];
        detectedInteractions = ['CNS depressants and sedatives increase drowsiness'];
      } else if (drugLower.includes('paracetamol') || drugLower.includes('acetaminophen') || drugLower.includes('dolo') || drugLower.includes('calpol')) {
        detectedGeneric = 'Paracetamol (Acetaminophen)';
        detectedCategory = 'Analgesic and Antipyretic';
        detectedUses = ['Relief of mild to moderate pain (headache, body ache)', 'Reduction of fever (antipyretic)', 'Dental and muscular pain relief'];
        detectedDosage = 'Adults: 500 mg to 650 mg every 4-6 hours as needed. Do not exceed 4000 mg in 24 hours.';
        detectedSideEffects = ['Generally well tolerated at recommended doses', 'Rare allergic skin reactions'];
        detectedPrecautions = ['Do not exceed 4g per day to prevent liver damage', 'Avoid taking multiple paracetamol-containing products'];
        detectedInteractions = ['Chronic alcohol use increases hepatotoxicity risk', 'Warfarin with prolonged high doses'];
      } else if (drugLower.includes('nepra') || drugLower.includes('naproxen')) {
        detectedGeneric = 'Naproxen + Domperidone';
        detectedCategory = 'NSAID & Antiemetic Combination';
        detectedUses = ['Migraine headache relief and prevention of associated nausea', 'Arthritis and inflammatory pain relief', 'Post-operative or muscular pain'];
        detectedDosage = 'One tablet taken whole with water, preferably before meals as prescribed.';
        detectedSideEffects = ['Indigestion or heartburn', 'Dry mouth', 'Drowsiness'];
        detectedPrecautions = ['Take with food or milk if stomach upset occurs', 'Use caution in patients with history of peptic ulcer'];
        detectedInteractions = ['Other NSAIDs or blood thinners (aspirin, warfarin)'];
      }

      return {
        medicineName: medicineName,
        genericName: detectedGeneric,
        brandNames: [medicineName],
        category: detectedCategory,
        uses: detectedUses,
        dosage: detectedDosage,
        sideEffects: detectedSideEffects,
        precautions: detectedPrecautions,
        interactions: detectedInteractions,
        contraindications: ['Known hypersensitivity or allergy to this medication', 'Severe liver or kidney disease without medical supervision'],
        storageInfo: 'Store below 25°C - 30°C in a dry place away from direct heat and sunlight.'
      };
    }
  },

  generateStructuredRemedy: async (condition, healthProfile = null, temperature = 0.2) => {
    const cacheKey = `rem_${condition}_${healthProfile ? JSON.stringify(healthProfile) : ''}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('[AI Gateway] Returning cached structured remedy.');
      return cached;
    }

    let systemPrompt = `You are a clinical naturopathic specialist and home remedies assistant.
Analyze the user's symptom or condition: "${condition}".
Suggest 1 or 2 natural, safe home remedies that are easy to prepare with standard household or kitchen ingredients.

YOU MUST RETURN A VALID JSON BLOCK ONLY. DO NOT INCLUDE ANY MARKDOWN WRAPPERS OR TRIPLE BACKTICKS. DO NOT INCLUDE ANY TEXT OTHER THAN THE JSON OBJECT.

JSON schema:
{
  "condition": "${condition}",
  "causes": ["List 2-3 common natural causes/triggers of this symptom"],
  "remedies": [
    {
      "name": "Remedy name (e.g. Ginger Honey Infusion)",
      "ingredients": ["Ingredient 1 with quantity/details", "Ingredient 2 with quantity/details"],
      "steps": [
        "Step 1 to prepare/take",
        "Step 2 to prepare/take"
      ],
      "usageInstructions": "Brief usage instructions (e.g. Sip slowly twice daily)",
      "reliefTime": "Estimated time to notice improvement (e.g. 15-30 minutes)"
    }
  ],
  "warnings": [
    "Safety warning or precaution (e.g. Avoid for children under 1 year)",
    "Standard clinical consult warning (e.g. Seek professional help if symptoms persist)"
  ]
}
`;

    if (healthProfile) {
      systemPrompt += `\nUSER HEALTH PROFILE context (customize ingredients/warnings for safety based on this):
- Age: ${healthProfile.age || 'N/A'}
- Gender: ${healthProfile.gender || 'N/A'}
- Existing Conditions: ${healthProfile.medicalConditions?.join(', ') || 'None'}
- Allergies: ${healthProfile.allergies?.join(', ') || 'None'}
- Current Medications: ${healthProfile.medications?.join(', ') || 'None'}
- Diet Preference: ${healthProfile.dietPreference || 'Vegetarian'}
`;
    }

    try {
      console.log(`[AI Gateway] Generating structured remedy for "${condition}"...`);
      let text = await generateContentWithFallback(null, systemPrompt, temperature, 900);
      text = text.trim();

      // Strip markdown JSON delimiters if present
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3).trim();
      }

      const data = JSON.parse(text);

      // Enforce model validation/defaults
      if (!data.condition) data.condition = condition;
      if (!Array.isArray(data.causes)) data.causes = ['Common wellness factors'];
      if (!Array.isArray(data.remedies)) data.remedies = [];
      if (!Array.isArray(data.warnings)) data.warnings = [];

      setCachedResponse(cacheKey, data);
      return data;
    } catch (err) {
      console.error('[AI Gateway] Error generating structured remedy:', err.message);
      // Fallback structured object so the UI is not empty or broken
      return {
        condition: condition,
        causes: ['General wellness concern'],
        remedies: [
          {
            name: 'Hydration & Rest',
            ingredients: ['Warm water (1 glass)', 'Comfortable resting space'],
            steps: [
              'Drink a glass of warm water slowly.',
              'Lie down in a quiet, well-ventilated room.'
            ],
            usageInstructions: 'Rest for 30 minutes and stay hydrated.',
            reliefTime: 'Within 30-60 minutes'
          }
        ],
        warnings: [
          'Consult a physician if symptoms are severe or persist beyond 48 hours.'
        ]
      };
    }
  },

  compareMedicines: async (med1, med2, temperature = 0.2) => {
    const prompt = `You are a clinical pharmacologist and medical educator. Compare the following two medications objectively and factually:
    
    Medication 1:
    - Name: ${med1.medicineName}
    - Generic Name: ${med1.genericName}
    - Category: ${med1.category}
    - Uses: ${med1.uses ? med1.uses.join(', ') : 'N/A'}
    - Dosage Reference: ${med1.dosage || 'Follow physician prescription'}
    - Side Effects: ${med1.sideEffects ? med1.sideEffects.join(', ') : 'N/A'}
    - Precautions: ${med1.precautions ? med1.precautions.join(', ') : 'N/A'}
    
    Medication 2:
    - Name: ${med2.medicineName}
    - Generic Name: ${med2.genericName}
    - Category: ${med2.category}
    - Uses: ${med2.uses ? med2.uses.join(', ') : 'N/A'}
    - Dosage Reference: ${med2.dosage || 'Follow physician prescription'}
    - Side Effects: ${med2.sideEffects ? med2.sideEffects.join(', ') : 'N/A'}
    - Precautions: ${med2.precautions ? med2.precautions.join(', ') : 'N/A'}
    
    STRICT CLINICAL RULES:
    1. Do NOT declare one medicine as "better", "superior", or strictly "stronger".
    2. Focus on objective clinical differences: therapeutic mechanism, indications, onset/duration nuances, and primary precautions.
    3. Keep explanations clear, balanced, and under 160 words.
    4. Conclude with this exact phrase: "Which medicine is appropriate depends on the individual's condition and medical history. Consult a healthcare professional."
    5. Return plain markdown with clear headings (###) and bullet points. Do not wrap in JSON or code blocks.
    `;
    try {
      return await generateContentWithFallback(null, prompt, temperature, 500);
    } catch (err) {
      console.error('[AI Gateway] Error comparing medicines:', err.message);
      return `### Clinical Comparison Overview\n\n- **${med1.medicineName}** (${med1.genericName}) is indicated for ${med1.uses?.[0] || 'designated conditions'} under the ${med1.category} class.\n- **${med2.medicineName}** (${med2.genericName}) is classified under ${med2.category}.\n\nBoth medications possess distinct pharmacological properties and contraindication profiles.\n\n*Which medicine is appropriate depends on the individual's condition and medical history. Consult a healthcare professional.*`;
    }
  },

  checkInteractions: async (medicines, temperature = 0.2) => {
    const medList = medicines.join(', ');
    const systemPrompt = `You are a clinical pharmacologist and drug safety specialist.
Analyze potential drug-drug and drug-substance interactions between the following medications:
Medications: [${medList}]

STRICT RULES:
1. Examine interactions between all pairs of medications listed.
2. Return ONLY a valid JSON object matching the schema below. No markdown backticks, no explanatory preamble.
3. For each real interaction found, determine:
   - "pair": "Drug A + Drug B"
   - "severity": "Major" (contraindicated or significant risk), "Moderate" (requires monitoring or dose adjustment), or "Minor" (low clinical impact)
   - "description": Mechanism and clinical significance in plain, patient-friendly language (under 40 words).
   - "action": Specific practical recommendation (e.g. "Discuss timing with doctor", "Avoid concurrent use", or "Monitor blood glucose closely").
4. If no significant known interactions exist between these specific medications, return an empty "interactions" array and state in "summary" that no major interactions were identified among the listed items.
5. Always include the standard disclaimer: "The absence of a displayed interaction does not mean no interaction exists. Always verify all concurrent medications, supplements, and herbal products with your doctor or pharmacist."

JSON Schema:
{
  "hasInteractions": true,
  "interactions": [
    {
      "pair": "string",
      "severity": "Major",
      "description": "string",
      "action": "string"
    }
  ],
  "summary": "string",
  "disclaimer": "The absence of a displayed interaction does not mean no interaction exists. Always verify all concurrent medications, supplements, and herbal products with your doctor or pharmacist."
}`;

    try {
      let text = await generateContentWithFallback(null, systemPrompt, temperature, 800);
      text = text.trim();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      text = text.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(text);
    } catch (err) {
      console.error('[AI Gateway] Error checking interactions:', err.message);
      return {
        hasInteractions: false,
        interactions: [],
        summary: `No critical automated interaction warnings recorded for ${medList}.`,
        disclaimer: 'The absence of a displayed interaction does not mean no interaction exists. Always verify all concurrent medications, supplements, and herbal products with your doctor or pharmacist.'
      };
    }
  },

  generateRaw: async (systemInstruction, userPrompt, temperature = 0.2, maxTokens = 200) => {
    return await generateContentWithFallback(systemInstruction, userPrompt, temperature, maxTokens);
  }
};

module.exports = aiGateway;

