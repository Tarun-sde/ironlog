const express = require('express');
const router = express.Router();
const PR = require('../models/PR');
const { protect } = require('../middleware/auth');

// GET /api/prs — all PRs for user
router.get('/', protect, async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (search) filter.exerciseName = { $regex: search, $options: 'i' };
    const prs = await PR.find(filter).sort({ exerciseName: 1 });
    res.json(prs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prs/:exerciseId — PR for a specific exercise
router.get('/:exerciseId', protect, async (req, res) => {
  try {
    const pr = await PR.findOne({ user: req.user._id, exercise: req.params.exerciseId });
    if (!pr) return res.status(404).json({ message: 'No PR found for this exercise' });
    res.json(pr);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
