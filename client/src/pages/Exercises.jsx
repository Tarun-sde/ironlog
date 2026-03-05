import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { CATEGORIES } from '../utils/helpers';

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | exercise object
  const [form, setForm] = useState({ name: '', category: 'Other', notes: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await api.get(`/exercises?${params}`);
      setExercises(data);
    } catch { toast.error('Failed to load exercises'); }
    finally { setLoading(false); }
  }, [category, search]);

  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const openAdd = () => { setForm({ name: '', category: 'Other', notes: '' }); setModal('add'); };
  const openEdit = (ex) => { setForm({ name: ex.name, category: ex.category, notes: ex.notes || '' }); setModal(ex); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/exercises', form);
        toast.success(`"${form.name}" added`);
      } else {
        await api.put(`/exercises/${modal._id}`, form);
        toast.success(`"${form.name}" updated`);
      }
      setModal(null);
      fetchExercises();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/exercises/${deleteId}`);
      toast.success('Exercise deleted');
      setDeleteId(null);
      fetchExercises();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>Exercise Library</h1><p className="page-sub">Manage your exercise catalogue</p></div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Exercise
        </button>
        <select className="form-select" style={{ minWidth: 155 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="form-input" style={{ flex: 1 }} placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : exercises.length === 0 ? (
        <p className="empty">No exercises found.</p>
      ) : (
        <div className="exercises-grid">
          {exercises.map(ex => (
            <div key={ex._id} className="ex-card">
              <div className="ex-body">
                <div className="ex-name">{ex.name}</div>
                <span className={`cat-badge cat-${ex.category}`}>{ex.category}</span>
                {ex.notes && <div className="ex-notes">{ex.notes}</div>}
                {!ex.isDefault && <div className="ex-custom">Custom</div>}
              </div>
              <div className="ex-actions">
                <button className="btn-icon" onClick={() => openEdit(ex)} title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button className="btn-icon danger" onClick={() => setDeleteId(ex._id)} title="Delete">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add Exercise' : 'Edit Exercise'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="e.g. Barbell Bench Press" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Equipment, muscles targeted..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : modal === 'add' ? 'Add Exercise' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Delete Exercise</h2><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <p className="modal-body-text">Are you sure? Logged workouts for this exercise will be kept in history.</p>
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
