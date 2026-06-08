const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: false, default: 'N/A' },
  passwordHash: { type: String, required: false },
  googleId: { type: String, required: false },
  authProvider: { type: String, default: 'local' }, // 'local', 'google'
  profilePicture: { type: String, required: false },
  role: { type: String, enum: ['User', 'Admin', 'SuperAdmin'], default: 'User' },
  emailVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
