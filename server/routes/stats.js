const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const BodyWeight = require('../models/BodyWeight');
const PR = require('../models/PR');
const { protect } = require('../middleware/auth');

// ─── Strength classification thresholds (ratios to bodyweight) ────────────────
// Based on widely used strength standards (similar to Symmetric Strength)
const LEVELS = [
  { label: 'Beginner',     min: 0,    bench: 0.5, squat: 0.75, deadlift: 1.0  },
  { label: 'Novice',       min: 1,    bench: 0.75,squat: 1.0,  deadlift: 1.25 },
  { label: 'Intermediate', min: 2,    bench: 1.0, squat: 1.25, deadlift: 1.5  },
  { label: 'Advanced',     min: 3,    bench: 1.25,squat: 1.5,  deadlift: 2.0  },
  { label: 'Elite',        min: 4,    bench: 1.5, squat: 2.0,  deadlift: 2.5  },
];

function classifyStrength(bench, squat, deadlift, bw) {
  if (!bw || bw <= 0) return { label: 'Unclassified', score: 0 };
  const bRatio = bench / bw;
  const sRatio = squat / bw;
  const dRatio = deadlift / bw;
  const avgRatio = (bRatio + sRatio + dRatio) / 3;

  // Score based on how many thresholds the user passes
  let score = 0;
  for (const lvl of LEVELS) {
    if (bRatio >= lvl.bench && sRatio >= lvl.squat && dRatio >= lvl.deadlift) {
      score = lvl.min + 1;
    }
  }

  const labels = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
  const label = labels[Math.min(score, labels.length - 1)];

  return {
    label,
    score,
    ratios: { bench: +bRatio.toFixed(2), squat: +sRatio.toFixed(2), deadlift: +dRatio.toFixed(2) },
    thresholds: LEVELS,
  };
}

// Fuzzy match exercise name to canonical big 3
function matchLift(name) {
  const n = name.toLowerCase();
  if (/bench|chest press/.test(n) && !/incline|decline|dumbbell|db /.test(n)) return 'bench';
  if (/squat/.test(n) && !/hack|goblet|front/.test(n)) return 'squat';
  if (/deadlift/.test(n) && !/romanian|rdl|sumo/.test(n)) return 'deadlift';
  return null;
}

// GET /api/stats/lifetime
router.get('/lifetime', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // ── Raw aggregation over all workouts ──────────────────────────────────
    const [aggResult] = await Workout.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalWorkoutDocs: { $sum: 1 },
          totalSets:   { $sum: '$sets' },
          totalReps:   { $sum: { $multiply: ['$sets', '$reps'] } },
          totalVolume: { $sum: { $multiply: ['$sets', '$reps', '$weight'] } },
          maxBench:    { $max: { $cond: [{ $eq: ['$category', 'Chest'] }, '$weight', 0] } },
        },
      },
    ]);

    // ── Count unique workout days ──────────────────────────────────────────
    const uniqueDays = await Workout.distinct('date', { user: userId });
    const totalWorkouts = uniqueDays.length;

    // ── Big 3 PRs from workout history (by fuzzy name match) ──────────────
    const allWorkouts = await Workout.find({ user: userId }, 'exerciseName weight reps sets date');
    const big3 = { bench: 0, squat: 0, deadlift: 0 };
    const big3Date = { bench: null, squat: null, deadlift: null };

    for (const w of allWorkouts) {
      const lift = matchLift(w.exerciseName);
      if (lift && w.weight > big3[lift]) {
        big3[lift] = w.weight;
        big3Date[lift] = w.date;
      }
    }

    // ── Also check stored PRs table for accuracy ───────────────────────────
    const allPRs = await PR.find({ user: userId });
    for (const pr of allPRs) {
      const lift = matchLift(pr.exerciseName);
      if (lift && pr.heaviestWeight > big3[lift]) {
        big3[lift] = pr.heaviestWeight;
        big3Date[lift] = pr.lastSetDate;
      }
    }

    const powerliftingTotal = big3.bench + big3.squat + big3.deadlift;

    // ── Latest bodyweight ──────────────────────────────────────────────────
    const latestBW = await BodyWeight.findOne({ user: userId }).sort({ date: -1 });
    const bodyweight = latestBW ? latestBW.value : null;

    // ── Strength classification ────────────────────────────────────────────
    const classification = classifyStrength(big3.bench, big3.squat, big3.deadlift, bodyweight);

    // ── Workouts per month (last 12 months) for chart ─────────────────────
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await Workout.aggregate([
      { $match: { user: userId, date: { $gte: twelveMonthsAgo.toISOString().split('T')[0] } } },
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] }, // YYYY-MM
          sessions: { $addToSet: '$date' },
          volume: { $sum: { $multiply: ['$sets', '$reps', '$weight'] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          sessions: { $size: '$sessions' },
          volume: 1,
          _id: 0,
        },
      },
    ]);

    // ── PR timeline (all PRs sorted by date) ──────────────────────────────
    const prTimeline = allPRs
      .filter(p => p.lastSetDate)
      .map(p => ({ name: p.exerciseName, weight: p.heaviestWeight, date: p.lastSetDate, e1rm: p.e1rm }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20);

    // ── Cumulative volume over time (last 6 months daily) ─────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const dailyVolume = await Workout.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo.toISOString().split('T')[0] } } },
      {
        $group: {
          _id: '$date',
          vol: { $sum: { $multiply: ['$sets', '$reps', '$weight'] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', vol: 1, _id: 0 } },
    ]);

    // Cumulative sum
    let cumVol = 0;
    const cumulativeVol = dailyVolume.map(d => {
      cumVol += d.vol;
      return { date: d.date, vol: Math.round(cumVol) };
    });

    res.json({
      big3: {
        bench:    { weight: big3.bench,    date: big3Date.bench },
        squat:    { weight: big3.squat,    date: big3Date.squat },
        deadlift: { weight: big3.deadlift, date: big3Date.deadlift },
        total:    powerliftingTotal,
      },
      lifetime: {
        totalWorkouts,
        totalSets:   aggResult?.totalSets   || 0,
        totalReps:   aggResult?.totalReps   || 0,
        totalVolume: Math.round(aggResult?.totalVolume || 0),
      },
      bodyweight,
      classification,
      charts: {
        monthly: monthlyData,
        prTimeline,
        cumulativeVol,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
