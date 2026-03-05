const mongoose = require('mongoose');

const prSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseName: { type: String, required: true },
  category: { type: String, default: 'Other' },
  heaviestWeight: { type: Number, default: 0 },
  bestSet: { type: Number, default: 0 },   // weight × reps
  e1rm: { type: Number, default: 0 },       // Estimated 1RM
  repPRs: {
    type: Map,
    of: new mongoose.Schema({
      weight: Number,
      reps: Number,
      date: String,
    }, { _id: false }),
    default: {},
  },
  lastSetDate: { type: String, default: '' },
}, { timestamps: true });

prSchema.index({ user: 1, exercise: 1 }, { unique: true });

module.exports = mongoose.model('PR', prSchema);
