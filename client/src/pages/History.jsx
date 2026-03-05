import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatDate, CAT_EMOJI } from '../utils/helpers';

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ exercise: '', search: '', sort: 'date-desc' });
  const [exercises, setExercises] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { api.get('/exercises').then(r => setExercises(r.data)).catch(() => {}); }, []);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: filters.sort, limit: 100 });
      if (filters.exercise) params.set('exercise', filters.exercise);
      if (filters.search) params.set('search', filters.search);
      const { data } = await api.get(`/workouts?${params}`);
      setWorkouts(data.workouts || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/workouts/${deleteId}`);
      toast.success('Workout deleted');
      setDeleteId(null);
      fetchWorkouts();
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (w) => { setEditItem(w); setEditForm({ sets: w.sets, reps: w.reps, weight: w.weight, date: w.date, notes: w.notes }); };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/workouts/${editItem._id}`, editForm);
      toast.success('Workout updated');
      setEditItem(null);
      fetchWorkouts();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Workout History</h1>
        <p className="page-sub">{total} total entries</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-lbl">Exercise</label>
          <select className="form-select" value={filters.exercise} onChange={e => setFilters(f => ({ ...f, exercise: e.target.value }))}>
            <option value="">All Exercises</option>
            {[...new Set(exercises.map(e => e.name))].sort().map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-lbl">Sort</label>
          <select className="form-select" value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="weight-desc">Weight (Heaviest)</option>
            <option value="exercise-asc">Exercise (A-Z)</option>
          </select>
        </div>
        <div className="filter-group filter-flex">
          <label className="filter-lbl">Search</label>
          <input className="form-input" placeholder="Search..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : workouts.length === 0 ? (
        <p className="empty">No workouts match your filters.</p>
      ) : (
        <div className="workout-list">
          {workouts.map(w => (
            <div key={w._id} className={`workout-item${w.isPR ? ' is-pr' : ''}`}>
              <div className="wi-icon">{CAT_EMOJI[w.category] || '⚡'}</div>
              <div className="wi-content">
                <div className="wi-name">{w.exerciseName}{w.isPR && <span className="pr-tag">🏆 PR</span>}</div>
                <div className="wi-details">{w.sets} sets × {w.reps} reps · Vol: {(w.sets * w.reps * w.weight).toLocaleString()}kg · Est. 1RM: {w.e1rm}kg</div>
                {w.notes && <div className="wi-notes">"{w.notes}"</div>}
              </div>
              <div className="wi-meta">
                <div className="wi-weight">{w.weight}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>kg</span></div>
                <div className="wi-date">{formatDate(w.date)}</div>
              </div>
              <div className="wi-actions">
                <button className="btn-icon" onClick={() => openEdit(w)} title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button className="btn-icon danger" onClick={() => setDeleteId(w._id)} title="Delete">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Workout</h2>
              <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{editItem.exerciseName}</p>
            <form onSubmit={handleEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Sets</label>
                  <input type="number" className="form-input" min="1" value={editForm.sets}
                    onChange={e => setEditForm(f => ({...f, sets: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">Reps</label>
                  <input type="number" className="form-input" min="1" value={editForm.reps}
                    onChange={e => setEditForm(f => ({...f, reps: e.target.value}))} /></div>
                <div className="form-group"><label className="form-label">Weight (kg)</label>
                  <input type="number" className="form-input" min="0" step="0.5" value={editForm.weight}
                    onChange={e => setEditForm(f => ({...f, weight: e.target.value}))} /></div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={editForm.notes}
                  onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditItem(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Delete Workout</h2><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <p className="modal-body-text">Are you sure you want to delete this workout entry? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
