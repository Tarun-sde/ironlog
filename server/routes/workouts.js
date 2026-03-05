const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const PR = require('../models/PR');
const { protect } = require('../middleware/auth');
const { calc1RM } = require('../utils/helpers');

// Helper: update PR for a given workout entry
async function updatePR(userId, exerciseId, exerciseName, category, weight, reps, date) {
  const e1rm = calc1RM(weight, reps);
  const bestSet = weight * reps;
  const repKey = `rep_${reps}`;

  let pr = await PR.findOne({ user: userId, exercise: exerciseId });
  let isNewPR = false;
  const prMessages = [];

  if (!pr) {
    pr = new PR({ user: userId, exercise: exerciseId, exerciseName, category });
  }

  if (weight > pr.heaviestWeight) {
    pr.heaviestWeight = weight;
    prMessages.push(`Heaviest: ${weight}kg`);
    isNewPR = true;
  }
  if (bestSet > pr.bestSet) {
    pr.bestSet = bestSet;
    prMessages.push(`Best Set: ${weight}kg × ${reps}`);
    isNewPR = true;
  }
  if (e1rm > pr.e1rm) {
    pr.e1rm = e1rm;
    prMessages.push(`Est. 1RM: ${e1rm}kg`);
    isNewPR = true;
  }

  const existingRepPR = pr.repPRs.get(repKey);
  if (!existingRepPR || weight > existingRepPR.weight) {
    pr.repPRs.set(repKey, { weight, reps, date });
    if (reps >= 2) {
      prMessages.push(`${reps}-Rep PR: ${weight}kg`);
      isNewPR = true;
    }
  }

  pr.lastSetDate = date;
  pr.exerciseName = exerciseName;
  pr.category = category;
  await pr.save();

  return { isNewPR, prMessages };
}

// GET /api/workouts
router.get('/', protect, async (req, res) => {
  try {
    const { exercise, search, sort = 'date-desc', limit = 100, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (exercise) filter.exerciseName = { $regex: exercise, $options: 'i' };
    if (search) filter.$or = [
      { exerciseName: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];

    const sortMap = {
      'date-desc': { date: -1, createdAt: -1 },
      'date-asc': { date: 1, createdAt: 1 },
      'weight-desc': { weight: -1 },
      'exercise-asc': { exerciseName: 1 },
    };
    const sortObj = sortMap[sort] || sortMap['date-desc'];
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [workouts, total] = await Promise.all([
      Workout.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
      Workout.countDocuments(filter),
    ]);

    res.json({ workouts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workouts
router.post('/', protect, async (req, res) => {
  try {
    const { exerciseId, sets, reps, weight, date, notes } = req.body;
    if (!exerciseId || !sets || !reps || weight === undefined || !date) {
      return res.status(400).json({ message: 'exerciseId, sets, reps, weight, and date are required' });
    }

    const exercise = await Exercise.findOne({ _id: exerciseId, user: req.user._id });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    const e1rm = calc1RM(parseFloat(weight), parseInt(reps));

    // Check PR
    const { isNewPR, prMessages } = await updatePR(
      req.user._id, exerciseId, exercise.name, exercise.category,
      parseFloat(weight), parseInt(reps), date
    );

    const workout = await Workout.create({
      user: req.user._id,
      exercise: exerciseId,
      exerciseName: exercise.name,
      category: exercise.category,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: parseFloat(weight),
      date,
      notes: notes || '',
      e1rm,
      isPR: isNewPR,
    });

    res.status(201).json({ workout, isNewPR, prMessages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/workouts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const { sets, reps, weight, date, notes } = req.body;
    if (sets !== undefined) workout.sets = parseInt(sets);
    if (reps !== undefined) workout.reps = parseInt(reps);
    if (weight !== undefined) workout.weight = parseFloat(weight);
    if (date !== undefined) workout.date = date;
    if (notes !== undefined) workout.notes = notes;
    workout.e1rm = calc1RM(workout.weight, workout.reps);
    await workout.save();

    // Rebuild PR for this exercise
    await rebuildPR(req.user._id, workout.exercise);

    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    const exerciseId = workout.exercise;
    await Workout.deleteOne({ _id: req.params.id });
    await rebuildPR(req.user._id, exerciseId);
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rebuild PR from scratch after edit/delete
async function rebuildPR(userId, exerciseId) {
  const workouts = await Workout.find({ user: userId, exercise: exerciseId }).sort({ date: 1 });
  if (workouts.length === 0) {
    await PR.deleteOne({ user: userId, exercise: exerciseId });
    return;
  }

  let pr = await PR.findOne({ user: userId, exercise: exerciseId });
  if (!pr) return;

  pr.heaviestWeight = 0;
  pr.bestSet = 0;
  pr.e1rm = 0;
  pr.repPRs = new Map();

  for (const w of workouts) {
    const e1rm = calc1RM(w.weight, w.reps);
    if (w.weight > pr.heaviestWeight) pr.heaviestWeight = w.weight;
    if (w.weight * w.reps > pr.bestSet) pr.bestSet = w.weight * w.reps;
    if (e1rm > pr.e1rm) pr.e1rm = e1rm;
    const key = `rep_${w.reps}`;
    const existing = pr.repPRs.get(key);
    if (!existing || w.weight > existing.weight) pr.repPRs.set(key, { weight: w.weight, reps: w.reps, date: w.date });
    pr.lastSetDate = w.date;
  }
  await pr.save();
}

// GET /api/workouts/stats/:exerciseName  — progress data for charts
router.get('/stats/:exerciseName', protect, async (req, res) => {
  try {
    const workouts = await Workout.find({
      user: req.user._id,
      exerciseName: { $regex: `^${req.params.exerciseName}$`, $options: 'i' },
    }).sort({ date: 1 });

    // Group by date, pick best per day
    const byDate = {};
    workouts.forEach((w) => {
      if (!byDate[w.date]) {
        byDate[w.date] = { maxWeight: 0, volume: 0, maxE1RM: 0 };
      }
      if (w.weight > byDate[w.date].maxWeight) byDate[w.date].maxWeight = w.weight;
      byDate[w.date].volume += w.sets * w.reps * w.weight;
      if (w.e1rm > byDate[w.date].maxE1RM) byDate[w.date].maxE1RM = w.e1rm;
    });

    const dates = Object.keys(byDate).sort();
    const data = dates.map((d) => ({ date: d, ...byDate[d] }));

    res.json({ data, total: workouts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
