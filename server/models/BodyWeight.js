const mongoose = require('mongoose');

const bodyWeightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  value: { type: Number, required: true, min: 20, max: 500 },
  notes: { type: String, default: '' },
}, { timestamps: true });

// One entry per day per user
bodyWeightSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BodyWeight', bodyWeightSchema);
