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
async function callGemini(systemInstruction, userPrompt, temperature = 0.2) {
  const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
          temperature: temperature
        }
      });
      // Call with timeout
      const result = await promiseWithTimeout(model.generateContent(userPrompt), 12000);
      const text = result.response.text();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[AI Gateway] Gemini model "${modelName}" failed:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All configured Gemini models failed to generate content.');
}

// Helper to call Groq API
async function callGroq(systemInstruction, userPrompt, temperature = 0.2) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API Key is not configured in environment.');
  }

  console.log('[AI Gateway] Attempting Groq (llama-3.1-8b-instant)...');
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: temperature
    })
  }, 8000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Groq response contains empty choices.');
  }
  return text;
}

// Helper to call OpenRouter API
async function callOpenRouter(systemInstruction, userPrompt, temperature = 0.2) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API Key is not configured in environment.');
  }

  console.log('[AI Gateway] Attempting OpenRouter (google/gemma-4-31b-it:free)....');
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Arogya Raksha'
    },
    body: JSON.stringify({
      model: 'google/gemma-4-31b-it:free',
      messages,
      temperature: temperature
    })
  }, 8000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API returned error status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter response contains empty choices.');
  }
  return text;
}

// Core multi-provider fallback orchestrator with retries
async function generateContentWithFallback(systemInstruction, userPrompt, temperature = 0.2) {
  const providers = [
    { name: 'Groq', fn: callGroq },
    { name: 'Gemini', fn: callGemini },
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
        const text = await provider.fn(systemInstruction, userPrompt, temperature);
        if (text) {
          console.log(`[AI Gateway] Success using provider: ${provider.name} (Attempt ${attempt})`);
          return text;
        }
      } catch (err) {
        console.warn(`[AI Gateway] Provider ${provider.name} attempt ${attempt} failed: ${err.message}`);
        lastError = err;
        // Wait briefly on retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
    console.log('🛡️  Arogya Raksha AI Gateway Startup Check');
    console.log(`Gemini (Primary): ${process.env.GEMINI_API_KEY ? '✅ ENABLED' : '⚠️  WARNING (Missing key in environment, will fall back)'}`);
    console.log(`Groq (Secondary): ${process.env.GROQ_API_KEY ? '✅ ENABLED' : '❌ DISABLED (Key Missing)'}`);
    console.log(`OpenRouter (Tertiary): ${process.env.OPENROUTER_API_KEY ? '✅ ENABLED' : '❌ DISABLED (Key Missing)'}`);
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
        response: '⚠️ CRITICAL EMERGENCY DETECTED: Your symptoms suggest a potential life-threatening emergency. Please contact emergency services immediately or visit the nearest hospital emergency room. Do NOT delay medical attention.',
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
    let systemPrompt = `You are the Arogya Raksha AI Healthcare Assistant, a professional, empathetic, and medically responsible AI companion.
Your goal is to provide fast, short, practical, and easy-to-read medical assistant responses.

CRITICAL RULES:
- Keep responses under 150 words whenever possible. Avoid lengthy medical explanations because detailed information already exists in specialized modules (Medicine Info, Emergency Help, Home Remedies).
- You MUST output exactly six numbered sections formatted EXACTLY with standard markdown headers ###. If a section is not applicable (like Doctor Visit or Emergency Alert for minor symptoms), output "N/A" under it. Do NOT omit any section header.
- The sections are:

### 1. POSSIBLE CONDITION
Brief explanation in 1-2 lines. Use language like "Possible Condition: Your symptoms may be related to..." and NEVER give a definitive diagnosis.

### 2. SEVERITY LEVEL
🟢 Mild
(Choose only one from: 🟢 Mild, 🟡 Moderate, 🔴 High Risk)

### 3. SUGGESTED MEDICINES
Provide 1-2 suggestions. Format EXACTLY as:
💊 [Medicine Name]
Used for:
[Brief Purpose]

### 4. QUICK CARE TIPS
Show 3-4 points starting with ✓. Example:
✓ Drink plenty of water
✓ Get enough rest
✓ Eat light meals
✓ Monitor symptoms

### 5. DOCTOR VISIT INDICATOR
Show only when necessary (e.g. if symptoms persist or worsen). Otherwise write "N/A".

### 6. EMERGENCY ALERT
Show only if dangerous/high-risk symptoms are detected. Otherwise write "N/A".

DIRECTIONS:
- Prioritize: Condition, Severity, Medicine, Quick Tips.
- Guide users to the appropriate module (Medicine Info, Emergency Help, Home Remedies) when needed.
- Do NOT prescribe prescription-only medications or recommend unsafe dosages.
- ALWAYS consider the user's Health Profile context if provided. For example, if the user is diabetic, highlight glycemic precautions. If they are hypertensive, caution against high-sodium suggestions.
- Do NOT add a lengthy medical disclaimer within the response text, as the app renders one automatically at the bottom. Keep the response clean.
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
      const textResponse = await generateContentWithFallback(systemPrompt, prompt, temperature);

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
    const cacheKey = `med_${medicineName}_${retrievedContext}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('[AI Gateway] Returning cached structured medicine.');
      return cached;
    }

    const systemPrompt = `You are a clinical pharmacologist. Analyze the medicine name: "${medicineName}".
Use the retrieved trusted context below if relevant to extract specific guidelines, local precautions, or dosage details.
Produce a detailed clinical profile for this medicine.

YOU MUST RETURN A VALID JSON BLOCK ONLY. DO NOT INCLUDE ANY MARKDOWN WRAPPERS OR TRIPLE BACKTICKS. DO NOT INCLUDE ANY TEXT OTHER THAN THE JSON OBJECT.

JSON schema:
{
  "medicineName": "Exact name capitalization",
  "genericName": "Generic active chemical name",
  "brandNames": ["Common Brand 1", "Common Brand 2"],
  "category": "Therapeutic class or category (e.g., Analgesic, Antibiotic, Antihistamine)",
  "uses": ["Detailed Use 1", "Detailed Use 2"],
  "dosage": "Standard adult dosage and instructions",
  "sideEffects": ["Side effect 1", "Side effect 2"],
  "precautions": ["Precaution 1", "Precaution 2"],
  "interactions": ["Interaction 1", "Interaction 2"],
  "contraindications": ["Contraindication 1", "Contraindication 2"],
  "storageInfo": "Storage temperature and instructions"
}

Retrieved context:
${retrievedContext}
`;
    try {
      let text = await generateContentWithFallback(null, systemPrompt, temperature);
      text = text.trim();
      
      // Strip markdown JSON delimiters if present
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3).trim();
      }
      
      const data = JSON.parse(text);
      setCachedResponse(cacheKey, data);
      return data;
    } catch (err) {
      console.error('[AI Gateway] Error generating structured medicine:', err.message);
      // Fallback object to not break the app
      return {
        medicineName: medicineName,
        genericName: 'Unknown Active Ingredient',
        brandNames: [],
        category: 'General Therapeutics',
        uses: ['General health management'],
        dosage: 'Consult physician for exact dosage details.',
        sideEffects: ['Possible stomach discomfort', 'Nausea'],
        precautions: ['Always consult a physician before starting new medication.'],
        interactions: ['Seek medical advice if taking multiple treatments.'],
        contraindications: ['Known health conditions or hypersensitivity.'],
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
      let text = await generateContentWithFallback(null, systemPrompt, temperature);
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
    const prompt = `You are a clinical pharmacologist. Compare the following two medications:
    
    Medication 1:
    - Name: ${med1.medicineName}
    - Generic Name: ${med1.genericName}
    - Category: ${med1.category}
    - Uses: ${med1.uses ? med1.uses.join(', ') : 'N/A'}
    - Dosage: ${med1.dosage || 'N/A'}
    - Side Effects: ${med1.sideEffects ? med1.sideEffects.join(', ') : 'N/A'}
    - Precautions: ${med1.precautions ? med1.precautions.join(', ') : 'N/A'}
    
    Medication 2:
    - Name: ${med2.medicineName}
    - Generic Name: ${med2.genericName}
    - Category: ${med2.category}
    - Uses: ${med2.uses ? med2.uses.join(', ') : 'N/A'}
    - Dosage: ${med2.dosage || 'N/A'}
    - Side Effects: ${med2.sideEffects ? med2.sideEffects.join(', ') : 'N/A'}
    - Precautions: ${med2.precautions ? med2.precautions.join(', ') : 'N/A'}
    
    Analyze and output a clean, patient-friendly markdown comparison summary that answers:
    1. Which medicine is stronger or more powerful/potent (including their speed of action and typical clinical efficacy differences)?
    2. Which one is better suited for specific indications or patient scenarios (e.g. chronic vs acute pain, mild vs severe symptoms, etc.)?
    3. Are there any critical differences in side effects, precautions, or contraindications?
    
    Output rules:
    - Provide a short, structured, and easy-to-read comparison.
    - Keep it under 150 words.
    - Return plain Markdown (do not use markdown json code block wrapper, just standard headings like ### and lists).
    `;
    try {
      return await generateContentWithFallback(null, prompt, temperature);
    } catch (err) {
      console.error('[AI Gateway] Error comparing medicines:', err.message);
      return 'AI Potency Comparison: Not available at this time. Please consult your physician or pharmacist.';
    }
  },

  generateRaw: async (systemInstruction, userPrompt, temperature = 0.2) => {
    return await generateContentWithFallback(systemInstruction, userPrompt, temperature);
  }
};

module.exports = aiGateway;

