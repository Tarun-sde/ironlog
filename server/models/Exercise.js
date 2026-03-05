const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'],
    default: 'Other',
  },
  notes: { type: String, trim: true, default: '' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index: one exercise name per user
exerciseSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Exercise', exerciseSchema);
