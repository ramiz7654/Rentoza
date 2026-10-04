import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth, homeFor } from '../context/AuthContext';

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const CATS = [['all', 'All'], ['scooty', 'Scooty'], ['bike', 'Bike'], ['sport-heavy-bike', 'Sport / Heavy Bike'], ['car', 'Car - 5 Seater'], ['suv', 'SUV - 7 Seater']];
export const catLabel = (c) => (CATS.find((x) => x[0] === c) || [0, c])[1];

export const Badge = ({ s }) => <span className={`badge b-${s}`}>{s}</span>;
export const Msg = ({ type = 'err', children }) => (children ? <div className={`msg ${type}`}>{children}</div> : null);

export function useLoad(path, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    api(path).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [path]);
  useEffect(reload, [reload, ...deps]);
  return { data, err, loading, reload };
}

// run an action, alert on failure, then refresh
export async function act(fn, reload) {
  try { await fn(); reload && reload(); } catch (e) { alert(e.message); }
}
export const askReason = () => { const r = window.prompt('Reason for rejection:'); return r && r.trim() ? r.trim() : null; };

export function Back() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const home = homeFor(user?.role);
  // Owner/Admin: Back always lands straight on the dashboard (no step-by-step history walking).
  // Customer: normal back, falling back to Home when opened directly.
  const go = () => {
    if (user?.role === 'owner' || user?.role === 'admin') return nav(home, { replace: true });
    return loc.key === 'default' ? nav(home) : nav(-1);
  };
  return (
    <button type="button" className="back" onClick={go} aria-label="Go back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      Back
    </button>
  );
}

export const Stars = ({ value = 0, size = 16 }) => (
  <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ fontSize: size, color: n <= Math.round(value) ? '#F2B705' : '#d5dadd' }}>★</span>)}</span>
);

export function StarPicker({ value, onChange }) {
  return (
    <div className="starpick" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={`${n} star`} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>★</button>
      ))}
    </div>
  );
}

// simple CSS bar chart: rows = [{label, value, hint?}]
export function Bars({ rows, format = (v) => v, color = 'var(--road)' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length || rows.every((r) => !r.value)) return <p className="muted small" style={{ margin: 0 }}>No data yet.</p>;
  return (
    <div className="hbars">{rows.map((r) => (
      <div className="hbar" key={r.label}><span className="hl">{r.label}</span><div className="ht"><i style={{ width: `${(r.value / max) * 100}%`, background: color }} /></div><b>{format(r.value)}</b></div>
    ))}</div>
  );
}

// vertical column chart for months
export function Columns({ rows, format = (v) => v, color = 'var(--teal)' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="cols">{rows.map((r) => (
      <div className="col" key={r.label} title={`${r.label}: ${format(r.value)}`}>
        <span className="cv">{r.value ? format(r.value) : ''}</span>
        <div className="cb"><i style={{ height: `${(r.value / max) * 100}%`, background: color }} /></div>
        <span className="cl">{r.label}</span>
      </div>
    ))}</div>
  );
}

// filter chips that do NOT pile up history entries (replace: true), so Back is one tap
export function FilterChips({ options, value, counts, onPick }) {
  return (
    <div className="chips" style={{ marginBottom: 12 }}>
      {options.map((s) => <button key={s} className={`chip ${value === s ? 'on' : ''}`} onClick={() => onPick(s)} style={{ textTransform: 'capitalize' }}>{s}{counts ? ` (${counts(s)})` : ''}</button>)}
    </div>
  );
}

export function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.9 9.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22M14.1 14.1a3 3 0 1 1-4.2-4.2" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}

export const Page = ({ title, sub, children, actions, back = true }) => (
  <main className="page">
    {back && <Back />}
    <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{actions}</div>
    {children}
  </main>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

// Opens Google Maps on the rental's saved pin. Safe to use inside a clickable card.
export const mapUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
export function MapButton({ lat, lng, className = 'btn ghost sm', children = 'Open in map' }) {
  if (lat == null || lng == null) return null;
  return (
    <button type="button" className={className} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(mapUrl(lat, lng), '_blank', 'noopener'); }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: '-2px' }}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
      {children}
    </button>
  );
}
