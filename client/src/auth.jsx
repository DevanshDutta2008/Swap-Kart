import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken()); // nothing to check if no token

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const finish = ({ token, user }) => { setToken(token); setUser(user); };
  const value = {
    user, ready,
    login: async (b) => finish(await api('/auth/login', { method: 'POST', body: b })),
    register: async (b) => finish(await api('/auth/register', { method: 'POST', body: b })),
    logout: () => { setToken(null); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Sends logged-out visitors to the login page, then back to where they were headed.
export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <p className="state">Loading…</p>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}
