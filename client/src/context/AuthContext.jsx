import { createContext, useContext, useEffect, useState } from 'react';
import { api, setLoc } from '../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (role) => ({ customer: '/home', owner: '/owner', admin: '/admin' }[role] || '/login');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!sessionStorage.getItem('token'));

  useEffect(() => {
    if (!sessionStorage.getItem('token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => sessionStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password, role } });
    sessionStorage.setItem('token', d.token);
    setUser(d.user);
    return d.user;
  };
  const logout = () => { sessionStorage.removeItem('token'); setLoc(null); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, login, logout }}>{children}</Ctx.Provider>;
}
