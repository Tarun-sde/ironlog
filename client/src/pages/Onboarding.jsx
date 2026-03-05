import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Design tokens ───────────────────────────────────────────────────────────
const ACCENT   = '#4f8ef7';
const GOLD     = '#f5c842';
const GREEN    = '#22d3a0';
const ORANGE   = '#f97316';

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 3;
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const LIFT_CONFIG = {
  bench:    { label: 'Bench Press', icon: '🏋️', color: ACCENT,  placeholder: '80',  desc: 'Flat barbell bench press' },
  squat:    { label: 'Squat',       icon: '🦵', color: GREEN,  placeholder: '100', desc: 'Back squat' },
  deadlift: { label: 'Deadlift',    icon: '💀', color: GOLD,   placeholder: '120', desc: 'Conventional deadlift' },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const calc1RM = (w, r) => {
  if (!w) return null;
  const reps = parseInt(r) || 1;
  if (reps === 1) return +w;
  return Math.round(parseFloat(w) * (1 + reps / 30) * 10) / 10;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Profile' },
    { n: 2, label: 'Strength' },
    { n: 3, label: 'Summary' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'unset' }}>
            {/* Circle */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14,
              background: done ? GREEN : active ? ACCENT : 'var(--bg-input)',
              color: done || active ? '#fff' : 'var(--text-muted)',
              border: `2px solid ${done ? GREEN : active ? ACCENT : 'var(--border-input)'}`,
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: active ? `0 0 0 4px ${ACCENT}30` : 'none',
            }}>
              {done ? '✓' : s.n}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 12, fontWeight: 600, marginLeft: 7,
              color: active ? ACCENT : done ? GREEN : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>{s.label}</span>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 10px',
                background: done ? GREEN : 'var(--border)',
                transition: 'background 0.35s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
      {children}
      {optional && <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 6, textTransform: 'none', fontSize: 11 }}>(optional)</span>}
    </label>
  );
}

function Input({ ...props }) {
  return (
    <input
      style={{
        background: 'var(--bg-input)', border: '1px solid var(--border-input)',
        borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'inherit',
        fontSize: 14, padding: '9px 12px', width: '100%', outline: 'none', boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border-input)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
  );
}

function LiftCard({ liftKey, value, onChange }) {
  const cfg = LIFT_CONFIG[liftKey];
  const e1rm = calc1RM(value.weight, value.reps);

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: `1px solid var(--border)`,
      borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Colored left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{cfg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cfg.desc}</div>
        </div>
        {e1rm && (
          <div style={{
            marginLeft: 'auto', background: `${cfg.color}18`,
            border: `1px solid ${cfg.color}30`, borderRadius: 8, padding: '4px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: cfg.color }}>{e1rm}kg</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>est. 1RM</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 2 }}>
          <FieldLabel>Weight (kg)</FieldLabel>
          <Input
            type="number" min="0" step="0.5"
            placeholder={cfg.placeholder}
            value={value.weight}
            onChange={e => onChange({ ...value, weight: e.target.value })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel optional>Reps</FieldLabel>
          <Input
            type="number" min="1" max="50"
            placeholder="1"
            value={value.reps}
            onChange={e => onChange({ ...value, reps: e.target.value })}
          />
        </div>
        <div style={{ flex: 2 }}>
          <FieldLabel optional>Date</FieldLabel>
          <Input
            type="date"
            value={value.date}
            max={todayStr()}
            onChange={e => onChange({ ...value, date: e.target.value })}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryLiftRow({ cfg, liftKey, value, bodyWeight }) {
  const w = parseFloat(value.weight);
  if (!w) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 8, opacity: 0.5 }}>
      <span>{cfg.icon}</span>
      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{cfg.label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>Not entered</span>
    </div>
  );
  const e1rm = calc1RM(w, value.reps);
  const ratio = bodyWeight ? (w / parseFloat(bodyWeight)).toFixed(2) : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 8, borderLeft: `3px solid ${cfg.color}` }}>
      <span style={{ fontSize: 22 }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{cfg.label}</div>
        {value.reps && parseInt(value.reps) > 1 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {parseInt(value.reps)} reps → est. 1RM: {e1rm}kg
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: cfg.color }}>
          {w}<span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 2 }}>kg</span>
        </div>
        {ratio && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ratio}× BW</div>}
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────
export default function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]       = useState(1);
  const [saving, setSaving]   = useState(false);
  const [skipLifts, setSkipLifts] = useState(false);

  // Step 1 — Profile
  const [profile, setProfile] = useState({ height: '', bodyWeight: '', age: '', gender: '' });

  // Step 2 — Lifts
  const [lifts, setLifts] = useState({
    bench:    { weight: '', reps: '1', date: todayStr() },
    squat:    { weight: '', reps: '1', date: todayStr() },
    deadlift: { weight: '', reps: '1', date: todayStr() },
  });

  // ── Computed ─────────────────────────────────────────────────────────────
  const bwNum = parseFloat(profile.bodyWeight) || null;
  const powerliftingTotal = Object.values(lifts).reduce((sum, l) => sum + (parseFloat(l.weight) || 0), 0);
  const anyLiftEntered = Object.values(lifts).some(l => parseFloat(l.weight) > 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    setSaving(true);
    const payload = {
      height:    profile.height     || undefined,
      age:       profile.age        || undefined,
      gender:    profile.gender     || undefined,
      bodyWeight: profile.bodyWeight || undefined,
      lifts: skipLifts ? {} : Object.fromEntries(
        Object.entries(lifts).filter(([, v]) => parseFloat(v.weight) > 0)
      ),
    };

    const result = await completeOnboarding(payload);
    if (result.success) {
      toast.success('🎉 Welcome to IronLog! Let\'s start tracking.', { duration: 5000 });
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.05) 0%, transparent 50%)',
    }}>
      <div style={{
        width: '100%', maxWidth: 620,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 24, padding: '38px 42px',
        boxShadow: '0 32px 100px rgba(0,0,0,0.65)',
      }}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, #2d6eea)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            boxShadow: `0 4px 16px ${ACCENT}44`,
          }}>🏋️</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text-primary)' }}>
              Welcome, {user?.name?.split(' ')[0]}!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Step {step} of {TOTAL_STEPS} — let's set up your profile
            </div>
          </div>
        </div>

        {/* ── Step Indicator ───────────────────────────────────────── */}
        <StepIndicator current={step} />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Profile                                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Basic Profile</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 24 }}>
              Help us personalise your experience. All fields are optional except bodyweight.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel optional>Height (cm)</FieldLabel>
                <Input
                  type="number" min="100" max="250" placeholder="175"
                  value={profile.height}
                  onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>Body Weight (kg)</FieldLabel>
                <Input
                  type="number" min="30" max="400" step="0.1" placeholder="75.0"
                  value={profile.bodyWeight}
                  onChange={e => setProfile(p => ({ ...p, bodyWeight: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel optional>Age</FieldLabel>
                <Input
                  type="number" min="13" max="120" placeholder="25"
                  value={profile.age}
                  onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                />
              </div>
              <div>
                <FieldLabel optional>Gender</FieldLabel>
                <select
                  style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                    borderRadius: 8, color: profile.gender ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: 'inherit', fontSize: 14, padding: '9px 12px', width: '100%', outline: 'none',
                    appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a8aab' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
                  }}
                  value={profile.gender}
                  onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {profile.bodyWeight && (
              <div style={{
                marginTop: 18, padding: '11px 15px', background: 'rgba(34,211,160,0.08)',
                border: '1px solid rgba(34,211,160,0.25)', borderRadius: 10, fontSize: 13, color: GREEN,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ✓ We'll save {profile.bodyWeight}kg as your starting body weight.
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Big 3                                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Starting Strength Records</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 20 }}>
              Enter your current best lifts. These become your baseline PRs. Leave blank if you haven't trained that lift.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(LIFT_CONFIG).map(([key, cfg]) => (
                <LiftCard
                  key={key}
                  liftKey={key}
                  value={lifts[key]}
                  onChange={val => setLifts(l => ({ ...l, [key]: val }))}
                />
              ))}
            </div>

            {!anyLiftEntered && (
              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(79,142,247,0.06)',
                border: '1px solid rgba(79,142,247,0.18)',
                borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
              }}>
                💡 You can skip this step and add PRs later from the Log Workout page.
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 3 — Summary                                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎯</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>You're all set!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                Here's a summary of your starting profile. You can update everything later.
              </p>
            </div>

            {/* Profile row */}
            {(profile.bodyWeight || profile.height || profile.age) && (
              <div style={{
                display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
              }}>
                {profile.bodyWeight && (
                  <div style={{ flex: 1, minWidth: 100, background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GREEN }}>{profile.bodyWeight}<span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 2 }}>kg</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Body Weight</div>
                  </div>
                )}
                {profile.height && (
                  <div style={{ flex: 1, minWidth: 100, background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{profile.height}<span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 2 }}>cm</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Height</div>
                  </div>
                )}
                {profile.age && (
                  <div style={{ flex: 1, minWidth: 100, background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>{profile.age}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Age</div>
                  </div>
                )}
              </div>
            )}

            {/* Big 3 summary */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                Big 3 Lifts
              </div>
              {Object.entries(LIFT_CONFIG).map(([key, cfg]) => (
                <SummaryLiftRow key={key} liftKey={key} cfg={cfg} value={lifts[key]} bodyWeight={profile.bodyWeight} />
              ))}
            </div>

            {/* Powerlifting total */}
            {powerliftingTotal > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(167,139,250,0.08))',
                border: '1px solid rgba(79,142,247,0.2)', borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                    Starting Total (Bench + Squat + Deadlift)
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, color: 'var(--accent-light)' }}>
                    {powerliftingTotal}
                    <span style={{ fontSize: 16, color: 'var(--text-secondary)', marginLeft: 4, fontWeight: 600 }}>kg</span>
                  </div>
                </div>
                <div style={{ fontSize: 40 }}>⚡</div>
              </div>
            )}

            <div style={{
              padding: '12px 16px', background: 'rgba(34,211,160,0.07)',
              border: '1px solid rgba(34,211,160,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              🚀 Your data is saved. Start logging workouts to track progress and the app will automatically detect new PRs!
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ───────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)',
        }}>
          {step > 1 ? (
            <button
              onClick={back}
              disabled={saving}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                borderRadius: 9, color: 'var(--text-secondary)', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 600, padding: '10px 22px', cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          ) : (
            <div /> /* spacer */
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{
                  width: n === step ? 22 : 7, height: 7, borderRadius: 100,
                  background: n === step ? ACCENT : n < step ? GREEN : 'var(--border)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }} />
              ))}
            </div>

            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #2d6eea)`,
                  border: 'none', borderRadius: 9, color: '#fff',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  padding: '10px 26px', cursor: 'pointer',
                  boxShadow: `0 4px 16px ${ACCENT}40`,
                  transition: 'filter 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.target.style.filter = 'brightness(1.1)'; e.target.style.boxShadow = `0 6px 22px ${ACCENT}55`; }}
                onMouseLeave={e => { e.target.style.filter = 'brightness(1)'; e.target.style.boxShadow = `0 4px 16px ${ACCENT}40`; }}
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{
                  background: saving ? 'var(--bg-input)' : `linear-gradient(135deg, ${GREEN}, #16a37e)`,
                  border: 'none', borderRadius: 9, color: '#fff',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  padding: '11px 28px', cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : `0 4px 16px rgba(34,211,160,0.4)`,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'filter 0.2s',
                }}
              >
                {saving ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Saving…
                  </>
                ) : (
                  '🚀 Start Tracking Workouts'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
