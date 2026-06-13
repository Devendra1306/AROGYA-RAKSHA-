const fs = require('fs');
const path = require('path');

const isServerless = !!process.env.VERCEL;

// Statically require all seed data files so Vercel bundles them
const bundledSeeds = {
  chatHistory: require('../../seeds/chatHistory.json'),
  dietPlans: require('../../seeds/dietPlans.json'),
  emergencyContacts: require('../../seeds/emergencyContacts.json'),
  emergencyGuides: require('../../seeds/emergencyGuides.json'),
  healthAssessments: require('../../seeds/healthAssessments.json'),
  healthProfiles: require('../../seeds/healthProfiles.json'),
  medicines: require('../../seeds/medicines.json'),
  remedies: require('../../seeds/remedies.json'),
  users: require('../../seeds/users.json')
};

const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, '..', '..', 'data');

if (!isServerless && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collectionName) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readCollection(collectionName) {
  const filePath = getFilePath(collectionName);
  
  if (!fs.existsSync(filePath)) {
    try {
      const initialData = bundledSeeds[collectionName] || [];
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
      return initialData;
    } catch (err) {
      console.error(`Error writing initial collection ${collectionName}:`, err.message);
      return bundledSeeds[collectionName] || [];
    }
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collectionName}:`, err.message);
    return bundledSeeds[collectionName] || [];
  }
}

function writeCollection(collectionName, data) {
  const filePath = getFilePath(collectionName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing collection ${collectionName}:`, err.message);
  }
}

const localDb = {
  find: (collectionName, query = {}) => {
    const records = readCollection(collectionName);
    return records.filter(record => {
      for (const key in query) {
        if (query[key] !== record[key]) return false;
      }
      return true;
    });
  },

  findOne: (collectionName, query = {}) => {
    const records = readCollection(collectionName);
    return records.find(record => {
      for (const key in query) {
        if (query[key] !== record[key]) return false;
      }
      return true;
    }) || null;
  },

  create: (collectionName, docData) => {
    const records = readCollection(collectionName);
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...docData
    };
    records.push(newDoc);
    writeCollection(collectionName, records);
    return newDoc;
  },

  findByIdAndUpdate: (collectionName, id, updateData) => {
    const records = readCollection(collectionName);
    const index = records.findIndex(record => record._id === id);
    if (index === -1) return null;
    records[index] = {
      ...records[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeCollection(collectionName, records);
    return records[index];
  },

  findByIdAndDelete: (collectionName, id) => {
    let records = readCollection(collectionName);
    const record = records.find(r => r._id === id);
    if (!record) return null;
    records = records.filter(r => r._id !== id);
    writeCollection(collectionName, records);
    return record;
  }
};

module.exports = localDb;
