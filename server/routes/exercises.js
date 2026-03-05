const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');
const PR = require('../models/PR');
const { protect } = require('../middleware/auth');

// GET /api/exercises  — list user's exercises with optional search/category
router.get('/', protect, async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const exercises = await Exercise.find(filter).sort({ category: 1, name: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/exercises
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const existing = await Exercise.findOne({ user: req.user._id, name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) return res.status(400).json({ message: 'Exercise already exists' });
    const exercise = await Exercise.create({ user: req.user._id, name, category: category || 'Other', notes: notes || '' });
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/exercises/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ _id: req.params.id, user: req.user._id });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    const { name, category, notes } = req.body;
    if (name) exercise.name = name;
    if (category) exercise.category = category;
    if (notes !== undefined) exercise.notes = notes;
    await exercise.save();
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/exercises/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ _id: req.params.id, user: req.user._id });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    await Exercise.deleteOne({ _id: req.params.id });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
