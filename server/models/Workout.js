const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseName: { type: String, required: true }, // denormalized for fast queries
  category: { type: String, default: 'Other' },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  notes: { type: String, default: '' },
  e1rm: { type: Number, default: 0 }, // Estimated 1RM (Epley)
  isPR: { type: Boolean, default: false },
}, { timestamps: true });

workoutSchema.index({ user: 1, date: -1 });
workoutSchema.index({ user: 1, exercise: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
