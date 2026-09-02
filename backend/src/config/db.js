const mongoose = require('mongoose');

let isMockDB = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  const mongoURI = process.env.MONGO_URI;
  const isServer = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');

  if (!mongoURI || mongoURI.includes('<db_password>')) {
    if (isServer) {
      throw new Error('MongoDB Atlas Connection Error: MONGO_URI environment variable is missing or unconfigured.');
    }
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
    console.warn('⚠️  Falling back to a persistent JSON-based database fallback for high-availability.\n');
    isMockDB = true;
    global.isMockDB = true;
    global.dbError = err.message;
  }
}

module.exports = { connectDB, getIsMockDB: () => isMockDB };
