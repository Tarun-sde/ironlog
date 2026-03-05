import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import api from '../api/axios';
import { todayStr, formatDate, formatDateShort } from '../utils/helpers';

export default function BodyWeight() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date: todayStr(), value: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try { const { data } = await api.get('/bodyweight'); setEntries(data); }
    catch { toast.error('Failed to load weight data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.value) return;
    try {
      await api.post('/bodyweight', form);
      toast.success(`Weight logged: ${form.value}kg on ${formatDate(form.date)}`);
      setForm(f => ({ ...f, value: '', notes: '' }));
      fetchEntries();
    } catch { toast.error('Failed to log weight'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/bodyweight/${deleteId}`);
      toast.success('Entry deleted');
      setDeleteId(null);
      fetchEntries();
    } catch { toast.error('Delete failed'); }
  };

  const nums = entries.map(e => e.value);
  const current = nums.length > 0 ? nums[nums.length - 1] : null;
  const lowest = nums.length > 0 ? Math.min(...nums).toFixed(1) : null;
  const highest = nums.length > 0 ? Math.max(...nums).toFixed(1) : null;
  const average = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null;
  const chartData = entries.slice(-30).map(e => ({ date: formatDateShort(e.date), value: e.value }));

  return (
    <div className="page">
      <div className="page-header"><h1>Body Weight</h1><p className="page-sub">Track your weight changes over time</p></div>

      <div className="bw-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Log Weight</span></div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" className="form-input" step="0.1" min="20" max="500" placeholder="75.5"
                    value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" rows={2} placeholder="Morning weight, post-meal..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary">Log Weight</button>
            </form>
          </div>

          <div className="bw-stats">
            {[
              { label: 'Current (kg)', val: current, icon: '📊', cls: 'si-blue' },
              { label: 'Lowest (kg)', val: lowest, icon: '📉', cls: 'si-green' },
              { label: 'Highest (kg)', val: highest, icon: '📈', cls: 'si-orange' },
              { label: 'Average (kg)', val: average, icon: '⚖️', cls: 'si-gold' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div><div className="stat-val" style={{ fontSize: 20 }}>{s.val ?? '—'}</div><div className="stat-lbl">{s.label}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Weight Over Time</span></div>
            {chartData.length < 2 ? (
              <p className="empty">Log at least 2 entries to see the chart.</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                    <XAxis dataKey="date" stroke="#3d4d6a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#3d4d6a" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#141820', border: '1px solid #28334d', borderRadius: 8 }}
                      labelStyle={{ color: '#7a8aab', fontSize: 12 }}
                      itemStyle={{ color: '#eef2ff', fontWeight: 700 }}
                    />
                    {average && <ReferenceLine y={parseFloat(average)} stroke="rgba(245,200,66,0.4)" strokeDasharray="4 4" label={{ value: `Avg ${average}kg`, fill: '#f5c842', fontSize: 11 }} />}
                    <Line type="monotone" dataKey="value" stroke="#22d3a0" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3a0', strokeWidth: 0 }} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">History</span></div>
            <div className="bw-history" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {loading ? (
                <p className="empty">Loading...</p>
              ) : entries.length === 0 ? (
                <p className="empty">No entries yet.</p>
              ) : (
                [...entries].reverse().map((e, i, arr) => {
                  const prev = arr[i + 1];
                  let trendEl = <span className="bw-trend trend-neutral">—</span>;
                  if (prev) {
                    const diff = (e.value - prev.value).toFixed(1);
                    if (diff > 0) trendEl = <span className="bw-trend trend-up">▲ +{diff}kg</span>;
                    else if (diff < 0) trendEl = <span className="bw-trend trend-down">▼ {diff}kg</span>;
                  }
                  return (
                    <div key={e._id} className="bw-row">
                      <div>
                        <div className="bw-date">{formatDate(e.date)}</div>
                        {e.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{e.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {trendEl}
                        <span className="bw-val">{e.value}kg</span>
                        <button className="btn-icon danger" onClick={() => setDeleteId(e._id)} title="Delete">×</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal modal-sm">
            <div className="modal-header"><h2>Delete Entry</h2><button className="modal-close" onClick={() => setDeleteId(null)}>×</button></div>
            <p className="modal-body-text">Are you sure you want to delete this weight entry?</p>
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
