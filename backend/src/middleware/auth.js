const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localDb = require('../utils/localDb');
const https = require('https');

let publicKeyCache = {
  keys: null,
  expiresAt: 0
};

function fetchFirebasePublicKeys() {
  return new Promise((resolve, reject) => {
    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to fetch certificates: ${res.statusCode}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (publicKeyCache.keys && publicKeyCache.expiresAt > now) {
    return publicKeyCache.keys;
  }
  try {
    const keys = await fetchFirebasePublicKeys();
    publicKeyCache = {
      keys,
      expiresAt: now + (3600 * 1000) // Cache certificates for 1 hour
    };
    return keys;
  } catch (err) {
    console.error('Error fetching Firebase public keys in middleware:', err.message);
    throw err;
  }
}

async function verifyFirebaseToken(idToken, projectId) {
  const decodedToken = jwt.decode(idToken, { complete: true });
  if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
    throw new Error('Invalid Firebase token structure');
  }

  const kid = decodedToken.header.kid;
  const keys = await getFirebasePublicKeys();
  const certificate = keys[kid];
  if (!certificate) {
    throw new Error('Public key not found for kid: ' + kid);
  }

  return new Promise((resolve, reject) => {
    jwt.verify(idToken, certificate, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`
    }, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
}

async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this resource. No token provided.' });
  }

  try {
    let decoded;
    // Local testing / simulated token fallback
    if (token === 'simulated_oauth_token' && req.headers['x-simulated-email']) {
      decoded = {
        email: req.headers['x-simulated-email'],
        name: req.headers['x-simulated-name'] || 'Simulated User',
        sub: 'simulated_google_id_' + req.headers['x-simulated-email'],
        picture: ''
      };
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'arogya-raksha-4af7e';
      decoded = await verifyFirebaseToken(token, projectId);
    }

    const email = decoded.email;
    const isMock = global.isMockDB;
    let user;

    if (isMock) {
      user = localDb.findOne('users', { email });
    } else {
      user = await User.findOne({ email });
    }

    if (user && user.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    if (user && user.accountStatus === 'deleted') {
      return res.status(403).json({ error: 'Your account has been deleted.' });
    }

    // Auto-create user in MongoDB if not found (sync Firebase user state)
    if (!user) {
      const nameParts = (decoded.name || '').split(' ');
      const firstName = nameParts[0] || 'FirebaseUser';
      const lastName = nameParts.slice(1).join(' ') || 'Account';

      const userData = {
        firstName,
        lastName,
        email,
        mobile: 'N/A',
        passwordHash: 'oauth_managed',
        googleId: decoded.sub,
        authProvider: 'google',
        profilePicture: decoded.picture || '',
        role: 'User',
        emailVerified: true,
        profileCompleted: false,
        uid: decoded.sub,
        accountStatus: 'active',
        lastLogin: new Date()
      };

      if (isMock) {
        user = localDb.create('users', userData);
      } else {
        user = await User.create(userData);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication protect middleware verification failed:', err.message);
    return res.status(401).json({ error: 'Not authorized. Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }
    next();
  };
}

module.exports = { protect, authorize };
