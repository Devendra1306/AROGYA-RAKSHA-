const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localDb = require('../utils/localDb');

const JWT_SECRET = process.env.JWT_SECRET || 'arogya_raksha_secret_key_123';

async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this resource. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (global.isMockDB) {
      const user = localDb.findOne('users', { _id: decoded.id });
      if (!user) return res.status(401).json({ error: 'User no longer exists.' });
      req.user = user;
    } else {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return res.status(401).json({ error: 'User no longer exists.' });
      req.user = user;
    }
    next();
  } catch (err) {
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

module.exports = { protect, authorize, JWT_SECRET };
