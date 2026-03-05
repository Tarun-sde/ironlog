import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDate, CATEGORIES } from '../utils/helpers';

export default function PersonalRecords() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await api.get(`/prs?${params}`);
      setPrs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPRs(); }, [category, search]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Personal Records</h1>
        <p className="page-sub">Your all-time bests for every exercise</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-lbl">Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group filter-flex">
          <label className="filter-lbl">Search</label>
          <input className="form-input" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : prs.length === 0 ? (
        <p className="empty">No personal records found. Start logging workouts!</p>
      ) : (
        <div className="pr-grid">
          {prs.map(pr => {
            const repPRs = [...(pr.repPRs?.entries?.() || Object.entries(pr.repPRs || {}))].map(([k, v]) => v).sort((a, b) => b.reps - a.reps).slice(0, 3);
            return (
              <div key={pr._id} className="pr-card">
                <div className="pr-card-header">
                  <div className="pr-ex-name">{pr.exerciseName}</div>
                  <span className={`cat-badge cat-${pr.category}`}>{pr.category}</span>
                </div>
                <div className="pr-stats-grid">
                  <div className="pr-stat">
                    <div className="pr-stat-val">{pr.heaviestWeight}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span></div>
                    <div className="pr-stat-lbl">Heaviest Weight</div>
                  </div>
                  <div className="pr-stat">
                    <div className="pr-stat-val">{pr.e1rm}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span></div>
                    <div className="pr-stat-lbl">Est. 1 Rep Max</div>
                  </div>
                  <div className="pr-stat">
                    <div className="pr-stat-val">{pr.bestSet}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span></div>
                    <div className="pr-stat-lbl">Best Set (Wt×Reps)</div>
                  </div>
                  <div className="pr-stat">
                    {repPRs.length > 0 ? (
                      <>
                        <div className="pr-stat-val">{repPRs[0].weight}kg</div>
                        <div className="pr-stat-lbl">{repPRs[0].reps}-Rep PR</div>
                      </>
                    ) : (
                      <div className="pr-stat-lbl" style={{ paddingTop: 4 }}>No rep PRs</div>
                    )}
                  </div>
                </div>
                {repPRs.length > 1 && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {repPRs.slice(1).map(r => <span key={r.reps} style={{ marginRight: 10 }}><strong style={{ color: 'var(--text-primary)' }}>{r.weight}kg × {r.reps}</strong></span>)}
                  </div>
                )}
                <div className="pr-date">Last logged: {formatDate(pr.lastSetDate)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
