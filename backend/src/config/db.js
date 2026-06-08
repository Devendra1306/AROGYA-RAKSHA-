const mongoose = require('mongoose');

let isMockDB = false;

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI || mongoURI.includes('<db_password>')) {
    console.warn('\n⚠️  WARNING: MongoDB Atlas URI is unconfigured or contains <db_password> placeholder.');
    console.warn('⚠️  The backend will run using a local JSON-based persistent file fallback database for development.\n');
    isMockDB = true;
    global.isMockDB = true;
    return;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB Atlas successfully.');
    isMockDB = false;
    global.isMockDB = false;
  } catch (err) {
    console.error(`\n❌ MongoDB connection failed: ${err.message}`);
    console.warn('⚠️  Falling back to a local JSON-based persistent file database.\n');
    isMockDB = true;
    global.isMockDB = true;
  }
}

module.exports = { connectDB, getIsMockDB: () => isMockDB };
