// Epley formula for estimated 1RM
const calc1RM = (weight, reps) => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

// Seed default exercises for a new user
const DEFAULT_EXERCISES = [
  { name: 'Barbell Bench Press', category: 'Chest', notes: 'Flat bench', isDefault: true },
  { name: 'Incline Dumbbell Press', category: 'Chest', notes: 'Incline bench', isDefault: true },
  { name: 'Cable Fly', category: 'Chest', notes: 'Cable machine', isDefault: true },
  { name: 'Pull-Up', category: 'Back', notes: 'Bodyweight', isDefault: true },
  { name: 'Barbell Row', category: 'Back', notes: 'Bent-over row', isDefault: true },
  { name: 'Lat Pulldown', category: 'Back', notes: 'Cable machine', isDefault: true },
  { name: 'Deadlift', category: 'Back', notes: 'Conventional barbell', isDefault: true },
  { name: 'Barbell Squat', category: 'Legs', notes: 'Back squat', isDefault: true },
  { name: 'Leg Press', category: 'Legs', notes: 'Machine', isDefault: true },
  { name: 'Romanian Deadlift', category: 'Legs', notes: 'Barbell', isDefault: true },
  { name: 'Leg Curl', category: 'Legs', notes: 'Hamstrings machine', isDefault: true },
  { name: 'Overhead Press', category: 'Shoulders', notes: 'Standing barbell', isDefault: true },
  { name: 'Lateral Raise', category: 'Shoulders', notes: 'Dumbbells', isDefault: true },
  { name: 'Face Pull', category: 'Shoulders', notes: 'Cable, rear delts', isDefault: true },
  { name: 'Barbell Curl', category: 'Arms', notes: 'Biceps', isDefault: true },
  { name: 'Dumbbell Curl', category: 'Arms', notes: 'Alternating', isDefault: true },
  { name: 'Tricep Pushdown', category: 'Arms', notes: 'Cable', isDefault: true },
  { name: 'Skull Crusher', category: 'Arms', notes: 'EZ-bar', isDefault: true },
  { name: 'Plank', category: 'Core', notes: 'Bodyweight', isDefault: true },
  { name: 'Cable Crunch', category: 'Core', notes: 'Cable machine', isDefault: true },
  { name: 'Treadmill', category: 'Cardio', notes: '', isDefault: true },
  { name: 'Cycling', category: 'Cardio', notes: 'Stationary bike', isDefault: true },
];

module.exports = { calc1RM, DEFAULT_EXERCISES };
