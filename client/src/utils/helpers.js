export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const todayStr = () => new Date().toISOString().split('T')[0];

export const daysAgo = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const date = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today - date) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
};

export const calc1RM = (weight, reps) => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export const CAT_EMOJI = {
  Chest: '💪', Back: '🔙', Legs: '🦵', Shoulders: '🏋️',
  Arms: '💪', Core: '🎯', Cardio: '🏃', Other: '⚡',
};

export const CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];
