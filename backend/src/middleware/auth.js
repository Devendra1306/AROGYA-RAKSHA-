const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localDb = require('../utils/localDb');
const { getAuth } = require('../config/firebase');

// User cache to reduce DB load on frequent/concurrent API calls
const userCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds TTL

function clearUserCache(uid) {
  if (uid) {
    userCache.delete(uid);
  }
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
    const decoded = await getAuth().verifyIdToken(token);

    const uid = decoded.uid;
    const email = decoded.email;
    const isMock = global.isMockDB;
    let user;

    // Check memory cache first
    const cachedEntry = userCache.get(uid);
    if (cachedEntry && cachedEntry.expiry > Date.now()) {
      user = cachedEntry.user;
    } else {
      if (isMock) {
        user = localDb.findOne('users', { uid }) || (email ? localDb.findOne('users', { email }) : null);
      } else {
        user = await User.findOne({ uid });
        if (!user && email) {
          user = await User.findOne({ email });
          if (user) {
            user.uid = uid;
            await user.save();
          }
        }
      }

      // Auto-create user in MongoDB if not found (sync Firebase user state)
      if (!user) {
        const nameParts = (decoded.name || '').split(' ');
        const firstName = nameParts[0] || 'FirebaseUser';
        const lastName = nameParts.slice(1).join(' ') || 'Account';

        const userData = {
          firstName,
          lastName,
          email: email || `${uid}@placeholder.email.com`,
          mobile: decoded.phone_number || 'N/A',
          authProvider: 'firebase',
          profilePicture: decoded.picture || '',
          role: 'User',
          emailVerified: decoded.email_verified || false,
          profileCompleted: false,
          uid: uid,
          accountStatus: 'active',
          lastLogin: new Date()
        };

        if (isMock) {
          user = localDb.create('users', userData);
        } else {
          user = await User.create(userData);
        }
      }

      // Store in memory cache
      userCache.set(uid, {
        user,
        expiry: Date.now() + CACHE_TTL_MS
      });
    }

    if (user && user.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    if (user && user.accountStatus === 'deleted') {
      return res.status(403).json({ error: 'Your account has been deleted.' });
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

module.exports = { protect, authorize, clearUserCache };
