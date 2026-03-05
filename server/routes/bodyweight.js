const express = require('express');
const router = express.Router();
const BodyWeight = require('../models/BodyWeight');
const { protect } = require('../middleware/auth');

// GET /api/bodyweight
router.get('/', protect, async (req, res) => {
  try {
    const entries = await BodyWeight.find({ user: req.user._id }).sort({ date: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bodyweight
router.post('/', protect, async (req, res) => {
  try {
    const { date, value, notes } = req.body;
    if (!date || value === undefined) return res.status(400).json({ message: 'Date and value are required' });

    // Upsert — one entry per day
    const entry = await BodyWeight.findOneAndUpdate(
      { user: req.user._id, date },
      { value: parseFloat(value), notes: notes || '' },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/bodyweight/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await BodyWeight.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    await BodyWeight.deleteOne({ _id: req.params.id });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
