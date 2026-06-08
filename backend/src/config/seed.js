const mongoose = require('mongoose');
const localDb = require('../utils/localDb');

const emergencyGuidesData = [
  {
    title: 'Heart Attack',
    category: 'Heart Attack',
    severity: 'Critical',
    symptoms: ['Chest pain or pressure', 'Shortness of breath', 'Sweating', 'Pain in jaw, neck, or arm'],
    steps: [
      'Call emergency services immediately.',
      'Help the person sit comfortably and stay calm.',
      'Loosen any tight clothing.',
      'Monitor their breathing and consciousness closely.',
      'Prepare to perform CPR if they become unconscious and stop breathing.'
    ],
    warnings: ['Do NOT ignore symptoms.', 'Do NOT allow excessive movement or walking.', 'Do NOT delay calling medical help.']
  },
  {
    title: 'Stroke',
    category: 'Stroke',
    severity: 'Critical',
    symptoms: ['Face drooping on one side', 'Arm weakness or numbness', 'Speech difficulty or slurring'],
    steps: [
      'Call emergency services immediately.',
      'Note the time when symptoms first started.',
      'Help the person lie down on their side (recovery position).',
      'Keep their airway clear and monitor breathing.',
      'Do not give them food, drink, or medication.'
    ],
    warnings: ['Do NOT ignore symptoms even if they go away.', 'Do NOT give aspirin or other blood thinners.']
  },
  {
    title: 'Choking',
    category: 'Choking',
    severity: 'Critical',
    symptoms: ['Inability to speak or breathe', 'Clutching the throat', 'Turning blue'],
    steps: [
      'Stand behind the person and wrap arms around their waist.',
      'Make a fist with one hand and place it slightly above the navel.',
      'Grasp your fist with the other hand and perform quick upward thrusts.',
      'Repeat until the object is expelled or they lose consciousness.',
      'If unconscious, perform CPR and check mouth for visible objects.'
    ],
    warnings: ['Do NOT perform thrusts if the person is coughing strongly.', 'Do NOT stick fingers down throat blindly.']
  },
  {
    title: 'Burns',
    category: 'Burns',
    severity: 'High',
    symptoms: ['Redness', 'Blisters', 'Swelling', 'Charred skin'],
    steps: [
      'Cool the burn immediately under cool running tap water for 10-20 minutes.',
      'Remove jewelry or tight clothing before swelling starts.',
      'Cover the burn loosely with sterile non-stick bandage or clean plastic wrap.',
      'Seek medical attention for severe or widespread burns.'
    ],
    warnings: ['Do NOT apply ice directly to the burn.', 'Do NOT break blisters.', 'Do NOT use butter, oil, or toothpaste on burns.']
  },
  {
    title: 'Severe Bleeding',
    category: 'Severe Bleeding',
    severity: 'Critical',
    symptoms: ['Rapid heavy blood loss', 'Open wound', 'Weakness or dizziness'],
    steps: [
      'Apply direct pressure to the wound using a clean cloth or bandage.',
      'Keep pressure applied continuously for at least 5-10 minutes.',
      'Elevate the injured limb above heart level if possible.',
      'Help the person lie down and keep them warm to prevent shock.',
      'If blood leaks through, add more layers without removing the base cloth.'
    ],
    warnings: ['Do NOT remove original bandages as it disrupts clotting.', 'Do NOT use a tourniquet unless trained and bleeding is uncontrolled.']
  },
  {
    title: 'Poisoning',
    category: 'Poisoning',
    severity: 'Critical',
    symptoms: ['Nausea or vomiting', 'Difficulty breathing', 'Confusion or drowsiness', 'Chemical odor on breath'],
    steps: [
      'Call emergency services or poison control immediately.',
      'Identify what was swallowed, inhaled, or touched, and the amount.',
      'If the poison is on the skin, flush with running water for 15 minutes.',
      'If inhaled, move the person to fresh air immediately.',
      'Monitor breathing and keep the substance container for medical analysis.'
    ],
    warnings: ['Do NOT induce vomiting unless instructed by medical professionals.', 'Do NOT give anything by mouth to an unconscious person.']
  }
];

const medicinesData = [
  {
    medicineName: 'Paracetamol',
    genericName: 'Acetaminophen',
    brandNames: ['Crocin', 'Dolo 650', 'Calpol', 'Tylenol'],
    category: 'Pain Relief / Antipyretic',
    uses: ['Mild to moderate pain relief', 'Fever reduction', 'Headache', 'Muscle ache'],
    dosage: 'Adults: 500mg to 650mg every 4-6 hours as needed. Maximum daily limit: 4000mg (4g) to prevent liver damage.',
    sideEffects: ['Nausea', 'Allergic skin rash', 'Liver toxicity (in case of overdose)'],
    precautions: ['Avoid taking with alcohol.', 'Check other medications to prevent duplicate dosing.', 'Consult doctor if pain persists for >5 days.'],
    interactions: ['Alcohol (increases liver damage risk)', 'Warfarin (blood thinner interaction)'],
    contraindications: ['Severe liver impairment', 'Known allergy to acetaminophen'],
    storageInfo: 'Store below 30°C in a dry place away from direct sunlight.'
  },
  {
    medicineName: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['Glycomet', 'Obimet', 'Glucophage'],
    category: 'Anti-diabetic',
    uses: ['Type 2 Diabetes mellitus management', 'Improves insulin sensitivity'],
    dosage: 'Usually starts with 500mg once or twice daily with meals. Maximum daily limit: 2000mg.',
    sideEffects: ['Diarrhea', 'Nausea or bloating', 'Metallic taste', 'Lactic acidosis (very rare but serious)'],
    precautions: ['Take with meals to reduce stomach upset.', 'Monitor kidney function regularly.', 'Stay hydrated to prevent lactic acidosis.'],
    interactions: ['Contrast dyes used in medical scans', 'Alcohol', 'Diuretics'],
    contraindications: ['Severe kidney failure', 'Diabetic ketoacidosis', 'Severe liver disease'],
    storageInfo: 'Store at room temperature (15°C to 30°C) away from moisture.'
  },
  {
    medicineName: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    brandNames: ['Okacet', 'Alerid', 'Zyrtec'],
    category: 'Antihistamine / Allergy',
    uses: ['Allergic rhinitis', 'Sneezing and runny nose', 'Hives or skin allergies', 'Watery eyes'],
    dosage: 'Adults: 10mg once daily, preferably in the evening.',
    sideEffects: ['Drowsiness or sleepiness', 'Dry mouth', 'Fatigue', 'Dizziness'],
    precautions: ['Avoid driving or operating heavy machinery if drowsy.', 'Avoid combining with alcohol or sedatives.'],
    interactions: ['Alcohol', 'Central nervous system depressants'],
    contraindications: ['Severe kidney disease', 'Known allergy to cetirizine'],
    storageInfo: 'Store in a cool, dry place away from heat and moisture.'
  }
];

const remediesData = [
  {
    condition: 'Cold & Cough',
    causes: ['Viral infections', 'Allergies', 'Change in weather', 'Weak immunity'],
    remedies: [
      {
        name: 'Ginger Turmeric Tea',
        ingredients: ['Ginger root (sliced)', 'Turmeric powder (1/2 tsp)', 'Water (2 cups)', 'Honey (1 tbsp)'],
        steps: [
          'Boil 2 cups of water in a saucepan.',
          'Add sliced ginger and half a teaspoon of turmeric powder.',
          'Simmer on low heat for 10 minutes.',
          'Strain into a cup, add honey, and drink warm.'
        ],
        usageInstructions: 'Drink 2-3 times daily for soothing throat relief.',
        reliefTime: 'Within 20-30 minutes'
      },
      {
        name: 'Honey and Black Pepper Syrup',
        ingredients: ['Raw Honey (1 tbsp)', 'Crushed Black Pepper (1/4 tsp)'],
        steps: [
          'Mix 1 tablespoon of raw honey with a pinch of freshly crushed black pepper.',
          'Consume the mixture directly without water.'
        ],
        usageInstructions: 'Take once in the morning and once before bedtime.',
        reliefTime: 'Improves dry cough within 15 minutes'
      }
    ],
    warnings: ['Do NOT give raw honey to infants under 1 year of age.', 'If cough persists for more than 7 days, consult a physician.']
  },
  {
    condition: 'Headache',
    causes: ['Dehydration', 'Stress or eye strain', 'Lack of sleep', 'Sinus pressure'],
    remedies: [
      {
        name: 'Cold/Warm Compress',
        ingredients: ['Ice pack or clean washcloth', 'Warm water pack'],
        steps: [
          'For tension headaches, place a warm compress on the neck or forehead.',
          'For migraine or throbbing headaches, place an ice pack wrapped in a cloth on your forehead or temples for 15 minutes.'
        ],
        usageInstructions: 'Apply compress while resting in a quiet, dark room.',
        reliefTime: '15-20 minutes'
      },
      {
        name: 'Peppermint Essential Oil Massage',
        ingredients: ['Peppermint oil (2-3 drops)', 'Coconut oil (1 tsp)'],
        steps: [
          'Mix 2-3 drops of peppermint oil with a teaspoon of coconut oil.',
          'Gently massage onto temples, forehead, and back of the neck.'
        ],
        usageInstructions: 'Avoid contact with eyes. Wash hands after massage.',
        reliefTime: 'Relieves stress-related headaches within 10-15 minutes'
      }
    ],
    warnings: ['If headache is sudden, severe, or accompanied by slurred speech, seek emergency care immediately.']
  }
];

async function seedDatabase() {
  const isMock = global.isMockDB;

  if (isMock) {
    console.log('Seeding Local JSON Database Fallback...');
    
    // Seed emergencyGuides
    const currentEmergencyGuides = localDb.find('emergencyGuides');
    if (currentEmergencyGuides.length === 0) {
      emergencyGuidesData.forEach(item => localDb.create('emergencyGuides', item));
      console.log('Seeded local emergencyGuides.');
    }

    // Seed medicines
    const currentMedicines = localDb.find('medicines');
    if (currentMedicines.length === 0) {
      medicinesData.forEach(item => localDb.create('medicines', item));
      console.log('Seeded local medicines.');
    }

    // Seed remedies
    const currentRemedies = localDb.find('remedies');
    if (currentRemedies.length === 0) {
      remediesData.forEach(item => localDb.create('remedies', item));
      console.log('Seeded local remedies.');
    }

    console.log('✅ Local Database Fallback seeded successfully.');
    return;
  }

  // Real MongoDB Seeding
  try {
    const EmergencyGuide = require('../models/EmergencyGuide');
    const Medicine = require('../models/Medicine');
    const Remedy = require('../models/Remedy');

    console.log('Checking MongoDB database for seeding...');

    const countEmergency = await EmergencyGuide.countDocuments();
    if (countEmergency === 0) {
      await EmergencyGuide.insertMany(emergencyGuidesData);
      console.log('Seeded MongoDB Emergency Guides.');
    }

    const countMedicine = await Medicine.countDocuments();
    if (countMedicine === 0) {
      await Medicine.insertMany(medicinesData);
      console.log('Seeded MongoDB Medicines.');
    }

    const countRemedies = await Remedy.countDocuments();
    if (countRemedies === 0) {
      await Remedy.insertMany(remediesData);
      console.log('Seeded MongoDB Home Remedies.');
    }

    console.log('✅ MongoDB Database seeded successfully.');
  } catch (err) {
    console.error('❌ MongoDB Database seeding error:', err.message);
  }
}

module.exports = { seedDatabase };
