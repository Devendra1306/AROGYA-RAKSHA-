const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: false, default: 'N/A' },
  authProvider: { type: String, default: 'firebase' }, // 'firebase', etc.
  profilePicture: { type: String, required: false },
  role: { type: String, enum: ['User', 'Admin', 'SuperAdmin'], default: 'User' },
  emailVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  uid: { type: String, required: false, unique: true, sparse: true },
  accountStatus: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  lastLogin: { type: Date, required: false },
  deletedAt: { type: Date, required: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
