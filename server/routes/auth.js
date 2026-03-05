const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');
const PR = require('../models/PR');
const BodyWeight = require('../models/BodyWeight');
const { DEFAULT_EXERCISES, calc1RM } = require('../utils/helpers');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Helper: build a consistent user response object
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  height: user.height,
  age: user.age,
  gender: user.gender,
  onboardingCompleted: user.onboardingCompleted,
  token: generateToken(user._id),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const user = await User.create({ name, email, password });

      // Seed default exercises for new user
      const defaultExercises = DEFAULT_EXERCISES.map((ex) => ({ ...ex, user: user._id }));
      await Exercise.insertMany(defaultExercises);

      res.status(201).json(userResponse(user));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.json(userResponse(user));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── POST /api/auth/onboarding ────────────────────────────────────────────────
// Atomically saves: user profile fields, optional body weight, and Big 3 PRs.
// Sets onboardingCompleted = true. Returns a fresh user response token.
router.post('/onboarding', protect, async (req, res) => {
  const { height, age, gender, bodyWeight, lifts } = req.body;
  // lifts: { bench: {weight, reps, date}, squat: {...}, deadlift: {...} }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ── 1. Update profile fields ──────────────────────────────────────────
    if (height)  user.height = parseFloat(height);
    if (age)     user.age    = parseInt(age);
    if (gender)  user.gender = gender;
    user.onboardingCompleted = true;
    await user.save();

    // ── 2. Body weight entry ──────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    if (bodyWeight && parseFloat(bodyWeight) > 0) {
      await BodyWeight.findOneAndUpdate(
        { user: user._id, date: today },
        { value: parseFloat(bodyWeight) },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    // ── 3. Create initial PRs and seed workouts for Big 3 ────────────────
    const BIG3_MAP = {
      bench:    { name: 'Barbell Bench Press', category: 'Chest' },
      squat:    { name: 'Barbell Squat',        category: 'Legs'  },
      deadlift: { name: 'Deadlift',             category: 'Back'  },
    };

    if (lifts && typeof lifts === 'object') {
      for (const [key, lift] of Object.entries(lifts)) {
        const weight = parseFloat(lift?.weight);
        if (!weight || weight <= 0) continue;

        const reps   = parseInt(lift?.reps) || 1;
        const date   = lift?.date || today;
        const meta   = BIG3_MAP[key];
        if (!meta) continue;

        // Find the exercise in this user's library (seeded at registration)
        let exercise = await Exercise.findOne({ user: user._id, name: meta.name });
        if (!exercise) {
          exercise = await Exercise.create({ user: user._id, name: meta.name, category: meta.category });
        }

        const e1rm = calc1RM(weight, reps);

        // Create a seed workout entry
        await Workout.create({
          user: user._id,
          exercise: exercise._id,
          exerciseName: meta.name,
          category: meta.category,
          sets: 1,
          reps,
          weight,
          date,
          notes: 'Opening PR — entered during onboarding',
          e1rm,
          isPR: true,
        });

        // Create / overwrite the PR record
        const repKey = `rep_${reps}`;
        const repPRs = new Map();
        repPRs.set(repKey, { weight, reps, date });

        await PR.findOneAndUpdate(
          { user: user._id, exercise: exercise._id },
          {
            exerciseName: meta.name,
            category: meta.category,
            heaviestWeight: weight,
            bestSet: weight * reps,
            e1rm,
            repPRs,
            lastSetDate: date,
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      }
    }

    res.json(userResponse(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
