const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['User', 'Admin', 'SuperAdmin'], default: 'User' },
  emailVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
