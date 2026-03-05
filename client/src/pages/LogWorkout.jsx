import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { todayStr, calc1RM } from '../utils/helpers';

export default function LogWorkout() {
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState({ date: todayStr(), exerciseName: '', exerciseId: '', sets: '', reps: '', weight: '', notes: '' });
  const [session, setSession] = useState([]);
  const [acOpen, setAcOpen] = useState(false);
  const [acHighlight, setAcHighlight] = useState(-1);
  const [filtered, setFiltered] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [prAlert, setPrAlert] = useState(null);
  const acRef = useRef(null);

  useEffect(() => {
    api.get('/exercises').then(r => setExercises(r.data)).catch(() => {});
  }, []);

  const handleExInput = (val) => {
    setForm(f => ({ ...f, exerciseName: val, exerciseId: '' }));
    const q = val.toLowerCase().trim();
    if (!q) { setFiltered([]); setAcOpen(false); return; }
    const matches = exercises.filter(e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)).slice(0, 10);
    setFiltered(matches);
    setAcOpen(true);
    setAcHighlight(-1);
  };

  const selectExercise = (ex) => {
    setForm(f => ({ ...f, exerciseName: ex.name, exerciseId: ex._id }));
    setAcOpen(false);
    setFiltered([]);
  };

  const handleKeyDown = (e) => {
    if (!acOpen) return;
    if (e.key === 'ArrowDown') { setAcHighlight(h => Math.min(h + 1, filtered.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp') { setAcHighlight(h => Math.max(h - 1, -1)); e.preventDefault(); }
    if (e.key === 'Enter' && acHighlight >= 0) { selectExercise(filtered[acHighlight]); e.preventDefault(); }
    if (e.key === 'Escape') setAcOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exerciseName.trim()) { toast.error('Please enter an exercise'); return; }

    let exerciseId = form.exerciseId;
    if (!exerciseId) {
      const existing = exercises.find(ex => ex.name.toLowerCase() === form.exerciseName.toLowerCase().trim());
      if (existing) {
        exerciseId = existing._id;
      } else {
        try {
          const { data } = await api.post('/exercises', { name: form.exerciseName.trim(), category: 'Other' });
          exerciseId = data._id;
          setExercises(prev => [...prev, data]);
        } catch {
          toast.error('Could not create exercise'); return;
        }
      }
    }

    setSubmitting(true);
    setPrAlert(null);
    try {
      const { data } = await api.post('/workouts', {
        exerciseId,
        sets: parseInt(form.sets),
        reps: parseInt(form.reps),
        weight: parseFloat(form.weight),
        date: form.date,
        notes: form.notes,
      });

      const entry = { ...data.workout, isNewPR: data.isNewPR, prMessages: data.prMessages };
      setSession(s => [...s, entry]);

      if (data.isNewPR && data.prMessages?.length > 0) {
        setPrAlert(data.prMessages.join(' · '));
        toast.success(`🏆 New PR! ${data.prMessages[0]}`, { duration: 5000, style: { background: '#141820', color: '#f5c842', border: '1px solid rgba(245,200,66,0.3)' } });
      } else {
        toast.success(`Logged: ${form.exerciseName} ${form.sets}×${form.reps} @ ${form.weight}kg`);
      }

      setForm(f => ({ ...f, notes: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log workout');
    } finally {
      setSubmitting(false);
    }
  };

  const removeEntry = (id) => setSession(s => s.filter(e => e._id !== id));
  const clearSession = () => setSession([]);
  const totalSets = session.reduce((s, e) => s + e.sets, 0);
  const totalVolume = session.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Log Workout</h1>
        <p className="page-sub">Record your training entries</p>
      </div>
      <div className="log-layout">
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Exercise</label>
                <div className="autocomplete-wrap" ref={acRef}>
                  <input className="form-input" value={form.exerciseName} placeholder="Search or type exercise..."
                    onChange={e => handleExInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setTimeout(() => setAcOpen(false), 150)} required />
                  <div className={`ac-dropdown${acOpen && filtered.length > 0 ? ' open' : ''}`}>
                    {filtered.map((ex, i) => (
                      <div key={ex._id} className={`ac-item${i === acHighlight ? ' highlighted' : ''}`}
                        onMouseDown={() => selectExercise(ex)}>
                        <span>{ex.name}</span>
                        <span className={`cat-badge cat-${ex.category}`}>{ex.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">Sets</label>
                <input type="number" className="form-input" min="1" max="100" placeholder="3"
                  value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reps</label>
                <input type="number" className="form-input" min="1" max="999" placeholder="10"
                  value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-input" min="0" step="0.5" placeholder="60"
                  value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} required />
              </div>
            </div>

            {form.sets && form.reps && form.weight && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Est. 1RM: <strong style={{ color: 'var(--accent-light)' }}>{calc1RM(parseFloat(form.weight), parseInt(form.reps))} kg</strong>
              </p>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" rows={2} placeholder="How did it feel?"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="spinner" /> : '+ Log Set'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setForm({ date: todayStr(), exerciseName: '', exerciseId: '', sets: '', reps: '', weight: '', notes: '' })}>
                Clear
              </button>
            </div>

            {prAlert && (
              <div className="pr-alert">
                <span className="pr-badge">🏆 NEW PR!</span>
                <span className="pr-alert-text">{prAlert}</span>
              </div>
            )}
          </form>
        </div>

        {/* Session Preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Session</span>
            {session.length > 0 && <button className="btn-link" onClick={clearSession}>Clear</button>}
          </div>
          <div className="session-entries">
            {session.length === 0 ? (
              <p className="empty">Add exercises above to build your session.</p>
            ) : (
              session.map(e => (
                <div key={e._id} className={`session-entry${e.isPR ? ' is-pr' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div className="se-name">{e.exerciseName}{e.isPR && <span className="pr-tag">🏆 PR</span>}</div>
                    <div className="se-detail">{e.sets}×{e.reps} @ {e.weight}kg · 1RM: {e.e1rm}kg</div>
                  </div>
                  <button className="btn-icon" onClick={() => removeEntry(e._id)}>×</button>
                </div>
              ))
            )}
          </div>
          {session.length > 0 && (
            <div className="session-summary">
              <div className="summary-row"><span>Total Sets:</span><strong>{totalSets}</strong></div>
              <div className="summary-row"><span>Total Volume:</span><strong>{totalVolume.toLocaleString()} kg</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
