const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localDb = require('../utils/localDb');
const { getAuth } = require('../config/firebase');

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
      decoded = await getAuth().verifyIdToken(token);
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
