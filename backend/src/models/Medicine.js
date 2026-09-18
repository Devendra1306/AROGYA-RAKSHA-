const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, unique: true },
  genericName: { type: String, required: true },
  brandNames: [{ type: String }],
  category: { type: String, required: true },
  uses: [{ type: String }],
  dosage: { type: String },
  sideEffects: [{ type: String }],
  precautions: [{ type: String }],
  interactions: [{ type: String }],
  contraindications: [{ type: String }],
  storageInfo: { type: String },
  route: { type: String },
  prescriptionStatus: { type: String },
  source: { type: String, default: 'U.S. FDA Drug Label Database (OpenFDA)' },
  lastUpdated: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);
