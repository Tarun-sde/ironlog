import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { formatDateShort, daysAgo } from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#141820', border: '1px solid #28334d', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#7a8aab', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#eef2ff', fontWeight: 700 }}>{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ workouts: [], prs: [], bodyweight: [] });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [wRes, prRes, bwRes] = await Promise.all([
          api.get('/workouts?limit=5&sort=date-desc'),
          api.get('/prs'),
          api.get('/bodyweight'),
        ]);
        setData({ workouts: wRes.data.workouts || [], prs: prRes.data || [], bodyweight: bwRes.data || [] });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const { workouts, prs, bodyweight } = data;
  const bwCurrent = bodyweight.length > 0 ? bodyweight[bodyweight.length - 1].value : null;
  const now = new Date(); now.setHours(0,0,0,0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const thisWeek = workouts.filter(w => new Date(w.date + 'T00:00:00') >= weekStart).length;
  const topLifts = [...prs].sort((a, b) => b.e1rm - a.e1rm).slice(0, 5);
  const recentPRs = [...prs].sort((a, b) => b.lastSetDate?.localeCompare(a.lastSetDate)).slice(0, 4);
  const bwChartData = bodyweight.slice(-20).map(b => ({ date: formatDateShort(b.date), value: b.value }));

  if (loading) return <div className="page-loader"><span className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-sub">Your fitness overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon si-blue">🏋️</div>
          <div><div className="stat-val">{workouts.length}</div><div className="stat-lbl">Total Workouts</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-gold">⭐</div>
          <div><div className="stat-val">{prs.length}</div><div className="stat-lbl">Personal Records</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">⚖️</div>
          <div><div className="stat-val">{bwCurrent ?? '—'}</div><div className="stat-lbl">Current Weight (kg)</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">🔥</div>
          <div><div className="stat-val">{thisWeek}</div><div className="stat-lbl">Sessions This Week</div></div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Recent Workouts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Workouts</span>
            <button className="btn-link" onClick={() => navigate('/log')}>+ Log</button>
          </div>
          {workouts.length === 0 ? <p className="empty">No workouts yet. Log your first!</p> :
            workouts.map(w => (
              <div key={w._id} className="list-item">
                <div>
                  <div className="li-main">{w.exerciseName}</div>
                  <div className="li-sub">{w.sets}×{w.reps} @ {w.weight}kg</div>
                </div>
                <div className="li-meta">{daysAgo(w.date)}</div>
              </div>
            ))
          }
        </div>

        {/* Recent PRs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent PRs 🏆</span>
            <button className="btn-link" onClick={() => navigate('/prs')}>View all</button>
          </div>
          {recentPRs.length === 0 ? <p className="empty">No PRs yet. Start lifting!</p> :
            recentPRs.map(pr => (
              <div key={pr._id} className={`list-item pr-stripe`}>
                <div>
                  <div className="li-main">{pr.exerciseName}</div>
                  <div className="li-sub" style={{ color: '#f5c842' }}>{pr.heaviestWeight}kg · Est. 1RM: {pr.e1rm}kg</div>
                </div>
                <div className="li-meta">{formatDateShort(pr.lastSetDate)}</div>
              </div>
            ))
          }
        </div>

        {/* Weight Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weight Trend</span>
            <button className="btn-link" onClick={() => navigate('/bodyweight')}>Log</button>
          </div>
          {bwChartData.length < 2 ? (
            <p className="empty">Log at least 2 weight entries to see the chart.</p>
          ) : (
            <div className="chart-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bwChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                  <XAxis dataKey="date" stroke="#3d4d6a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#3d4d6a" tick={{ fontSize: 11 }} domain={['auto','auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#22d3a0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Lifts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Lifts by Est. 1RM</span>
          </div>
          {topLifts.length === 0 ? <p className="empty">Log workouts to see your best lifts.</p> :
            topLifts.map((pr, i) => (
              <div key={pr._id} className="list-item" style={{ borderLeft: '2px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-muted)', width: 22 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="li-main">{pr.exerciseName}</div>
                  <div className="li-sub">{pr.heaviestWeight}kg top set</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--accent-light)' }}>{pr.e1rm}<span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 2 }}>kg 1RM</span></div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
