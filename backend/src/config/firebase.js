const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

let app;
if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../../../firebase.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully with local firebase.json.');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully with environment variable.');
    } else {
      // Fallback to Application Default Credentials
      app = initializeApp();
      console.log('Firebase Admin SDK initialized successfully with Application Default Credentials.');
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  app = getApps()[0];
}

module.exports = { app, getAuth };
