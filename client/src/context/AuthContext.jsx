import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ironlog_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const _persist = (data) => {
    localStorage.setItem('ironlog_token', data.token);
    localStorage.setItem('ironlog_user', JSON.stringify(data));
    setUser(data);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      _persist(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      _persist(data);
      return { success: true };
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? errors.map((e) => e.msg).join(', ')
        : err.response?.data?.message || 'Registration failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Called when the user completes onboarding — updates local state so the app
  // immediately stops redirecting to /onboarding on the next render.
  const completeOnboarding = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/onboarding', payload);
      _persist(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to save onboarding data' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ironlog_token');
    localStorage.removeItem('ironlog_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
