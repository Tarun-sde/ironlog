import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts';
import api from '../api/axios';
import { formatDate } from '../utils/helpers';

// ─── Constants ───────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Unclassified: { color: '#3d4d6a', bg: 'rgba(61,77,106,0.15)',    icon: '❔', next: 'Start lifting to get classified!' },
  Beginner:     { color: '#6ba3ff', bg: 'rgba(107,163,255,0.12)',  icon: '🌱', next: 'Keep building the foundation.' },
  Novice:       { color: '#22d3a0', bg: 'rgba(34,211,160,0.12)',   icon: '💪', next: "You're making solid progress." },
  Intermediate: { color: '#f5c842', bg: 'rgba(245,200,66,0.12)',   icon: '🏋️', next: "You're stronger than most!" },
  Advanced:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)',   icon: '🔥', next: 'Top 10% of lifters. Impressive!' },
  Elite:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '👑', next: 'Elite lifter status achieved!' },
};

const LEVEL_ORDER = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

const THRESHOLDS = [
  { label: 'Beginner',     bench: 0.5,  squat: 0.75, deadlift: 1.0  },
  { label: 'Novice',       bench: 0.75, squat: 1.0,  deadlift: 1.25 },
  { label: 'Intermediate', bench: 1.0,  squat: 1.25, deadlift: 1.5  },
  { label: 'Advanced',     bench: 1.25, squat: 1.5,  deadlift: 2.0  },
  { label: 'Elite',        bench: 1.5,  squat: 2.0,  deadlift: 2.5  },
];

// ─── Responsive hook ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBig = (n) => {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
};

// ─── Shared style builders ────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '22px',
  ...extra,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 13, fontWeight: 800, letterSpacing: 0.8,
      textTransform: 'uppercase', color: 'var(--text-secondary)',
      marginBottom: 14, marginTop: 0,
    }}>
      {children}
    </h2>
  );
}

function StatCard({ icon, value, unit, label, accent }) {
  return (
    <div style={{
      ...card({ padding: '16px 18px', borderRadius: 14 }),
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: `${accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: accent }}>
          {value}
          {unit && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 3 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function Big3Card({ label, weight, date, ratio, accent, icon }) {
  return (
    <div style={{
      ...card({ padding: '20px', borderRadius: 16, position: 'relative', overflow: 'hidden' }),
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, color: accent, lineHeight: 1 }}>
            {weight > 0 ? weight : '—'}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4 }}>kg</span>
          </div>
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {ratio !== null && (
          <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: '9px 10px' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>{ratio}×</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>BW Ratio</div>
          </div>
        )}
        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: '9px 10px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            {date ? formatDate(date) : '—'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>Date Achieved</div>
        </div>
      </div>
    </div>
  );
}

function StrengthMeter({ label, ratio, threshold, accent }) {
  const pct = threshold > 0 ? Math.min((ratio / threshold) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{ratio}× / {threshold}×</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 100,
          background: pct >= 100
            ? `linear-gradient(90deg, ${accent}, var(--green))`
            : `linear-gradient(90deg, ${accent}88, ${accent})`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: pct >= 100 ? `0 0 8px ${accent}66` : 'none',
        }} />
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, unit = 'kg' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141820', border: '1px solid #28334d', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#7a8aab', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#eef2ff', fontWeight: 700, fontSize: 13 }}>
          {p.name}: {typeof p.value === 'number' ? fmtBig(Math.round(p.value)) : p.value} {unit}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StrengthLevel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const width = useWindowWidth();

  // Breakpoints
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1100;
  const isDesktop = width >= 1100;

  useEffect(() => {
    api.get('/stats/lifetime')
      .then(r  => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--border-hover)', borderTopColor: 'var(--accent)', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Calculating your lifetime stats…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page">
        <div style={{ background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '20px 24px', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const { big3, lifetime, bodyweight, classification, charts } = data;
  const cfg       = LEVEL_CONFIG[classification.label] || LEVEL_CONFIG.Unclassified;
  const levelIdx  = LEVEL_ORDER.indexOf(classification.label);
  const nextLevel = LEVEL_ORDER[levelIdx + 1];
  const nextThresholds = nextLevel ? THRESHOLDS.find(t => t.label === nextLevel) : null;
  const ratios    = classification.ratios || {};

  // ── Grid column helpers ────────────────────────────────────────────────────
  const big3Cols       = isMobile ? '1fr' : 'repeat(3, 1fr)';
  const statsGridCols  = isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)';
  const twoColGrid     = isMobile || isTablet ? '1fr' : '1fr 1fr';
  const chartsGrid     = isMobile || isTablet ? '1fr' : '1fr 1fr';
  const chartHeight    = isMobile ? 170 : 220;

  // Hero padding / font size
  const heroPad   = isMobile ? '18px 16px' : '28px 32px';
  const levelFont = isMobile ? 32 : 44;

  return (
    <div className="page">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 22 }}>
        <h1>Strength Level</h1>
        <p className="page-sub">Your lifetime lifting career summary</p>
      </div>

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${cfg.bg}, rgba(8,11,16,0.3))`,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 18, padding: heroPad, marginBottom: 22,
        display: 'flex', alignItems: 'center',
        gap: isMobile ? 14 : 24,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG glow blob */}
        <div style={{
          position: 'absolute', top: -50, right: -50,
          width: 200, height: 200, borderRadius: '50%',
          background: `${cfg.color}15`, filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        {/* Icon */}
        <div style={{ fontSize: isMobile ? 48 : 60, flexShrink: 0 }}>{cfg.icon}</div>

        {/* Classification text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            Current Strength Level
          </div>
          <div style={{ fontSize: levelFont, fontWeight: 900, letterSpacing: -2, color: cfg.color, lineHeight: 1, marginBottom: 8 }}>
            {classification.label}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{cfg.next}</p>
        </div>

        {/* Level ladder — only on non-mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
            {LEVEL_ORDER.slice().reverse().map(lvl => {
              const lc      = LEVEL_CONFIG[lvl];
              const isActive = lvl === classification.label;
              const isPast   = LEVEL_ORDER.indexOf(lvl) <= levelIdx;
              return (
                <div key={lvl} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px', borderRadius: 8,
                  background: isActive ? `${lc.color}22` : 'transparent',
                  border: isActive ? `1px solid ${lc.color}44` : '1px solid transparent',
                  opacity: !isPast ? 0.4 : 1,
                }}>
                  <span style={{ fontSize: 14 }}>{lc.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? lc.color : 'var(--text-secondary)' }}>{lvl}</span>
                  {isActive && <span style={{ fontSize: 10, background: lc.color, color: '#000', borderRadius: 100, padding: '1px 6px', fontWeight: 800 }}>YOU</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Big 3 PRs ─────────────────────────────────────────────────── */}
      <SectionTitle>Big 3 Personal Records</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: big3Cols, gap: 12, marginBottom: 20 }}>
        <Big3Card label="Bench Press PR" weight={big3.bench.weight}    date={big3.bench.date}    ratio={ratios.bench    ?? null} accent="#4f8ef7" icon="🏋️" />
        <Big3Card label="Squat PR"       weight={big3.squat.weight}    date={big3.squat.date}    ratio={ratios.squat    ?? null} accent="#22d3a0" icon="🦵" />
        <Big3Card label="Deadlift PR"    weight={big3.deadlift.weight} date={big3.deadlift.date} ratio={ratios.deadlift ?? null} accent="#f5c842" icon="💀" />
      </div>

      {/* ── Powerlifting Total ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.08))',
        border: '1px solid rgba(79,142,247,0.2)', borderRadius: 14,
        padding: isMobile ? '16px' : '20px 28px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Powerlifting Total (Bench + Squat + Deadlift)
        </div>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, letterSpacing: -2, color: 'var(--accent-light)', lineHeight: 1 }}>
            {big3.total > 0 ? big3.total : '—'}
            {big3.total > 0 && <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 6 }}>kg</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { v: big3.bench.weight,    l: 'Bench',    c: '#4f8ef7' },
              { v: '+', l: '', c: 'var(--text-muted)' },
              { v: big3.squat.weight,    l: 'Squat',    c: '#22d3a0' },
              { v: '+', l: '', c: 'var(--text-muted)' },
              { v: big3.deadlift.weight, l: 'Deadlift', c: '#f5c842' },
            ].map((item, i) => (
              item.v === '+' ? (
                <span key={i} style={{ fontSize: 18, fontWeight: 900, color: item.c }}>+</span>
              ) : (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: item.c }}>{item.v > 0 ? item.v : '—'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.l}</div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* ── Lifetime Training Stats ───────────────────────────────────── */}
      <SectionTitle>Lifetime Training Stats</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: statsGridCols, gap: 10, marginBottom: 20 }}>
        <StatCard icon="🗓️" value={lifetime.totalWorkouts}           label="Workouts Completed"  accent="#4f8ef7" />
        <StatCard icon="📋" value={fmtBig(lifetime.totalSets)}       label="Total Sets"           accent="#a78bfa" />
        <StatCard icon="🔁" value={fmtBig(lifetime.totalReps)}       label="Total Reps"           accent="#22d3a0" />
        <StatCard icon="⚖️" value={fmtBig(lifetime.totalVolume)} unit="kg" label="Total Volume"   accent="#f5c842" />
      </div>

      {/* ── Body Weight ───────────────────────────────────────────────── */}
      {bodyweight && (
        <div style={{ ...card({ padding: '16px 20px', borderRadius: 12, marginBottom: 20 }), display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26 }}>⚖️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Body Weight</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>
              {bodyweight}<span style={{ fontSize: 13, marginLeft: 3, color: 'var(--text-secondary)' }}>kg</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Level Progress + BW Ratios ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: 14, marginBottom: 20 }}>

        {/* Progress to next level */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>
              {nextLevel ? `Progress to ${nextLevel}` : '🏆 Maximum Level Reached'}
            </h3>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 100,
              background: cfg.bg, border: `1px solid ${cfg.color}44`,
              color: cfg.color, fontWeight: 700, fontSize: 12,
            }}>
              {cfg.icon} {classification.label}
            </div>
          </div>

          {!bodyweight ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>Log your body weight to see strength level progression.</p>
          ) : nextThresholds ? (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 14 }}>Based on your body weight of {bodyweight}kg</p>
              <StrengthMeter label="Bench Press" ratio={ratios.bench    || 0} threshold={nextThresholds.bench}    accent="#4f8ef7" />
              <StrengthMeter label="Squat"       ratio={ratios.squat    || 0} threshold={nextThresholds.squat}    accent="#22d3a0" />
              <StrengthMeter label="Deadlift"    ratio={ratios.deadlift || 0} threshold={nextThresholds.deadlift} accent="#f5c842" />
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Next targets: </strong>
                Bench {(nextThresholds.bench    * bodyweight).toFixed(1)}kg ·{' '}
                Squat {(nextThresholds.squat    * bodyweight).toFixed(1)}kg ·{' '}
                Deadlift {(nextThresholds.deadlift * bodyweight).toFixed(1)}kg
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 44 }}>👑</div>
              <p style={{ color: cfg.color, fontWeight: 700, marginTop: 10 }}>Elite level achieved!</p>
            </div>
          )}
        </div>

        {/* Bodyweight Ratios */}
        <div style={card()}>
          <h3 style={{ fontWeight: 800, fontSize: 14, margin: '0 0 16px' }}>Bodyweight Strength Ratios</h3>
          {!bodyweight ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>Log your body weight to see bodyweight-relative strength ratios.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Bench Press', val: big3.bench.weight,    ratio: ratios.bench,    accent: '#4f8ef7', icon: '🏋️' },
                { label: 'Squat',       val: big3.squat.weight,    ratio: ratios.squat,    accent: '#22d3a0', icon: '🦵' },
                { label: 'Deadlift',    val: big3.deadlift.weight, ratio: ratios.deadlift, accent: '#f5c842', icon: '💀' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10,
                  borderLeft: `3px solid ${item.accent}`,
                }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{item.val}kg ÷ {bodyweight}kg BW</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: item.accent }}>{item.ratio ? item.ratio + '×' : '—'}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>ratio</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <SectionTitle>Visual Progress</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: chartsGrid, gap: 14, marginBottom: 20 }}>

        {/* Sessions Per Month */}
        <div style={card()}>
          <h3 style={{ fontWeight: 800, fontSize: 13.5, margin: '0 0 14px' }}>Sessions Per Month</h3>
          {charts.monthly.length === 0 ? (
            <p className="chart-empty">No workout data yet.</p>
          ) : (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                  <XAxis dataKey="month" stroke="#3d4d6a" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis stroke="#3d4d6a" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit="" />} />
                  <Bar dataKey="sessions" name="Sessions" fill="#4f8ef7" radius={[4,4,0,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Cumulative Volume */}
        <div style={card()}>
          <h3 style={{ fontWeight: 800, fontSize: 13.5, margin: '0 0 14px' }}>Cumulative Volume (6 Months)</h3>
          {charts.cumulativeVol.length === 0 ? (
            <p className="chart-empty">No volume data yet.</p>
          ) : (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.cumulativeVol} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3a0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                  <XAxis dataKey="date" stroke="#3d4d6a" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis stroke="#3d4d6a" tick={{ fontSize: 10 }} tickFormatter={v => fmtBig(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="vol" name="Volume" stroke="#22d3a0" strokeWidth={2.5} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Volume */}
        <div style={card()}>
          <h3 style={{ fontWeight: 800, fontSize: 13.5, margin: '0 0 14px' }}>Monthly Volume</h3>
          {charts.monthly.length === 0 ? (
            <p className="chart-empty">No data yet.</p>
          ) : (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2235" />
                  <XAxis dataKey="month" stroke="#3d4d6a" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis stroke="#3d4d6a" tick={{ fontSize: 10 }} tickFormatter={v => fmtBig(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="volume" name="Volume" fill="#f5c842" radius={[4,4,0,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* PR Milestones */}
        <div style={card()}>
          <h3 style={{ fontWeight: 800, fontSize: 13.5, margin: '0 0 12px' }}>PR Milestones</h3>
          {charts.prTimeline.length === 0 ? (
            <p className="chart-empty">Log workouts to start setting PRs.</p>
          ) : (
            <div style={{ maxHeight: chartHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[...charts.prTimeline].reverse().map((pr, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8,
                  borderLeft: '2px solid var(--gold)',
                }}>
                  <span style={{ fontSize: 13 }}>🏆</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{formatDate(pr.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--gold)' }}>{pr.weight}kg</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>1RM: {pr.e1rm}kg</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Classification Standards Table ───────────────────────────── */}
      <div style={card({ marginBottom: 24 })}>
        <h3 style={{ fontWeight: 800, fontSize: 14, margin: '0 0 10px' }}>Strength Classification Standards</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginBottom: 14 }}>
          Ratios are multiples of bodyweight. All three lifts must meet the threshold.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 12 : 13, minWidth: 320 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Level', 'Bench', 'Squat', 'Deadlift'].map(h => (
                  <th key={h} style={{
                    padding: isMobile ? '8px 8px' : '9px 14px',
                    textAlign: h === 'Level' ? 'left' : 'center',
                    color: 'var(--text-secondary)', fontWeight: 700,
                    fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {THRESHOLDS.map(row => {
                const isActive = row.label === classification.label;
                const rc = LEVEL_CONFIG[row.label];
                return (
                  <tr key={row.label} style={{
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? `${rc.color}10` : 'transparent',
                  }}>
                    <td style={{ padding: isMobile ? '9px 8px' : '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{rc.icon}</span>
                        <span style={{ fontWeight: 700, color: isActive ? rc.color : 'var(--text-primary)' }}>{row.label}</span>
                        {isActive && (
                          <span style={{ fontSize: 9, background: rc.color, color: '#000', borderRadius: 100, padding: '1px 6px', fontWeight: 800 }}>YOU</span>
                        )}
                      </div>
                    </td>
                    {['bench', 'squat', 'deadlift'].map(lift => {
                      const userRatio = ratios[lift] || 0;
                      const met = userRatio >= row[lift];
                      return (
                        <td key={lift} style={{ padding: isMobile ? '9px 8px' : '11px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: met ? 'var(--green)' : isActive && userRatio > 0 ? 'var(--orange)' : 'var(--text-secondary)' }}>
                            {row[lift]}×
                            {!isMobile && bodyweight && ` (${(row[lift] * bodyweight).toFixed(0)}kg)`}
                            {met && <span style={{ marginLeft: 3 }}>✓</span>}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
