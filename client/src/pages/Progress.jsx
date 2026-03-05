import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { formatDateShort } from '../utils/helpers';

const ChartTooltip = ({ active, payload, label, unit = 'kg' }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#141820', border: '1px solid #28334d', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#7a8aab', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#eef2ff', fontWeight: 700 }}>{payload[0].value} {unit}</p>
      </div>
    );
  }
  return null;
};

export default function Progress() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState('');
  const [metric, setMetric] = useState('weight');
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/workouts?limit=999').then(r => {
      const names = [...new Set((r.data.workouts || []).map(w => w.exerciseName))].sort();
      setExercises(names);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) { setStatsData(null); return; }
    setLoading(true);
    api.get(`/workouts/stats/${encodeURIComponent(selected)}`).then(r => {
      setStatsData(r.data);
    }).catch(() => setStatsData(null)).finally(() => setLoading(false));
  }, [selected]);

  const chartData = statsData?.data?.map(d => ({
    date: formatDateShort(d.date),
    value: metric === 'weight' ? d.maxWeight : metric === 'volume' ? d.volume : d.maxE1RM,
    volume: d.volume,
  })) || [];

  const maxWeight = statsData ? Math.max(...statsData.data.map(d => d.maxWeight)) : 0;
  const maxE1RM = statsData ? Math.max(...statsData.data.map(d => d.maxE1RM)) : 0;
  const totalVolume = statsData ? statsData.data.reduce((s, d) => s + d.volume, 0) : 0;
  const sessions = statsData?.data?.length || 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Progress</h1>
        <p className="page-sub">Visualize your strength gains over time</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Exercise</label>
            <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">— Select an exercise —</option>
              {exercises.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Metric</label>
            <select className="form-select" value={metric} onChange={e => setMetric(e.target.value)}>
              <option value="weight">Max Weight Lifted</option>
              <option value="volume">Total Volume</option>
              <option value="e1rm">Est. 1 Rep Max</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner" style={{ width: 36, height: 36 }} /></div>
      ) : !selected ? (
        <p className="empty">Select an exercise above to see your progress charts.</p>
      ) : !statsData || statsData.data.length === 0 ? (
        <p className="empty">No data for this exercise yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">{selected} — {metric === 'weight' ? 'Max Weight' : metric === 'volume' ? 'Volume' : 'Est. 1RM'}</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                    <XAxis dataKey="date" stroke="#3d4d6a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#3d4d6a" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#4f8ef7" strokeWidth={2.5} dot={{ r: 4, fill: '#4f8ef7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Volume per Session</span></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                    <XAxis dataKey="date" stroke="#3d4d6a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#3d4d6a" tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="volume" fill="#22d3a0" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Stats for {selected}</span></div>
            <div className="prog-stats">
              <div className="prog-stat"><div className="prog-stat-val">{statsData.total}</div><div className="prog-stat-lbl">Total Logged Sets</div></div>
              <div className="prog-stat"><div className="prog-stat-val">{maxWeight}kg</div><div className="prog-stat-lbl">Max Weight</div></div>
              <div className="prog-stat"><div className="prog-stat-val">{maxE1RM}kg</div><div className="prog-stat-lbl">Best Est. 1RM</div></div>
              <div className="prog-stat"><div className="prog-stat-val">{totalVolume.toLocaleString()}kg</div><div className="prog-stat-lbl">Total Volume</div></div>
              <div className="prog-stat"><div className="prog-stat-val">{sessions}</div><div className="prog-stat-lbl">Sessions Logged</div></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
