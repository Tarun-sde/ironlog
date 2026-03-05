import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import History from './pages/History';
import PersonalRecords from './pages/PersonalRecords';
import Progress from './pages/Progress';
import BodyWeight from './pages/BodyWeight';
import Exercises from './pages/Exercises';
import StrengthLevel from './pages/StrengthLevel';

// ── Route Guards ─────────────────────────────────────────────────────────────

/** Not logged in → /login */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Logged in → /dashboard (or /onboarding if first time) */
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
}

/**
 * Wraps all protected app pages.
 * If logged in but hasn't done onboarding → redirect to /onboarding.
 * If not logged in → /login.
 */
function AppRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

/** Onboarding is only for logged-in users who haven't completed it yet */
function OnboardingRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Router ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public — redirect away if already authed */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Onboarding — logged in but onboarding not done */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Protected app — must be logged in AND onboarding done */}
      <Route element={<AppRoute><Layout /></AppRoute>}>
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/log"        element={<LogWorkout />} />
        <Route path="/history"    element={<History />} />
        <Route path="/prs"        element={<PersonalRecords />} />
        <Route path="/strength"   element={<StrengthLevel />} />
        <Route path="/progress"   element={<Progress />} />
        <Route path="/bodyweight" element={<BodyWeight />} />
        <Route path="/exercises"  element={<Exercises />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141820',
              color: '#eef2ff',
              border: '1px solid #28334d',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#22d3a0', secondary: '#141820' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#141820' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
