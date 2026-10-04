import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import { api, askLocation } from '../../services/api';
import { PasswordInput } from '../../components/ui';

const LOGIN_ROLES = [['customer', 'Customer'], ['owner', 'Rental Owner'], ['admin', 'Admin']];
const SIGNUP_ROLES = [['customer', 'Customer'], ['owner', 'Rental Owner']]; // Admin is never offered at signup

function Car() {
  return (
    <svg className="car" viewBox="0 0 250 100" aria-hidden="true">
      <path d="M8 72V56q0-8 11-10l40-6 24-22q5-5 13-5h58q9 0 15 6l24 21 28 6q10 3 10 13v13z" fill="#F2B705" />
      <path d="M92 23h30v17H72zM130 23h30q4 0 7 3l15 14h-52z" fill="#12202B" opacity=".88" />
      <rect x="8" y="64" width="234" height="8" fill="#C98F00" />
      <rect x="226" y="52" width="14" height="6" rx="3" fill="#FFF3C4" />
      {[62, 188].map((x) => (
        <g key={x}>
          <circle cx={x} cy="74" r="18" fill="#0B141B" />
          <g className="wheel" style={{ transformOrigin: `${x}px 74px` }}>
            <circle cx={x} cy="74" r="9" fill="#D5DADD" />
            <path d={`M${x - 9} 74h18M${x} 65v18`} stroke="#0B141B" strokeWidth="2.5" />
          </g>
        </g>
      ))}
    </svg>
  );
}

const empty = { name: '', email: '', mobile: '', password: '', confirmPassword: '', shopName: '', address: '', city: '', state: '', pincode: '', latitude: '', longitude: '' };

export default function AuthPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [f, setF] = useState(empty);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const isLogin = mode === 'login';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchMode = (m) => { if (m === mode) return; setMode(m); setRole('customer'); setErr(''); setOk(''); };

  const useMyLocation = async () => {
    try { const p = await askLocation(); setF((x) => ({ ...x, latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6) })); setErr(''); }
    catch (e) { setErr(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setOk(''); setBusy(true);
    try {
      if (isLogin) {
        const u = await login(f.email, f.password, role);
        nav(homeFor(u.role), { replace: true });
      } else if (role === 'customer') {
        const d = await api('/auth/register', { method: 'POST', body: { ...f, role: 'customer' } });
        setOk(d.message); setMode('login'); setF({ ...empty, email: f.email });
      } else {
        const d = await api('/owner/register', { method: 'POST', body: f });
        setOk(d.message); setMode('login'); setF(empty); // owners never auto-login
      }
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const roles = isLogin ? LOGIN_ROLES : SIGNUP_ROLES;
  const owner = !isLogin && role === 'owner';

  return (
    <div className="auth-wrap">
      <div className={`auth-card ${isLogin ? 'is-login' : 'is-signup'}`}>
        {/* FORM PANEL (slides left/right and flips) */}
        <section className="panel panel-form">
          <div className="form-flip" key={mode}>
            <div className="form-scroll">
              <div className="brand-row"><span className="brand dark">Rentoza</span></div>
              <div className="seg" role="tablist">
                <button type="button" className={isLogin ? 'on' : ''} onClick={() => switchMode('login')}>Login</button>
                <button type="button" className={!isLogin ? 'on' : ''} onClick={() => switchMode('signup')}>Sign up</button>
              </div>
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p className="muted small">{isLogin ? 'Login to book, manage or monitor rentals.' : 'Rent a vehicle or list your own rental shop.'}</p>

              <form onSubmit={submit} noValidate>
                <fieldset className="roles">
                  <legend>{isLogin ? 'Login as' : 'Sign up as'}</legend>
                  {roles.map(([v, l]) => (
                    <label key={v} className={role === v ? 'on' : ''}>
                      <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} /> {l}
                    </label>
                  ))}
                </fieldset>

                {!isLogin && <label className="fld"><span>{owner ? 'Owner name' : 'Full name'}</span><input value={f.name} onChange={set('name')} autoComplete="name" /></label>}
                <label className="fld"><span>Email</span><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
                {!isLogin && <label className="fld"><span>Mobile</span><input inputMode="numeric" maxLength={10} value={f.mobile} onChange={set('mobile')} autoComplete="tel" /></label>}
                <label className="fld"><span>Password</span><PasswordInput value={f.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
                {!isLogin && <label className="fld"><span>Confirm password</span><PasswordInput value={f.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" /></label>}

                {owner && (
                  <>
                    <h3 className="sub-h">Rental shop details</h3>
                    <label className="fld"><span>Shop name</span><input value={f.shopName} onChange={set('shopName')} /></label>
                    <label className="fld"><span>Address</span><input value={f.address} onChange={set('address')} /></label>
                    <div className="two">
                      <label className="fld"><span>City</span><input value={f.city} onChange={set('city')} /></label>
                      <label className="fld"><span>State</span><input value={f.state} onChange={set('state')} /></label>
                    </div>
                    <label className="fld"><span>Pincode</span><input inputMode="numeric" maxLength={6} value={f.pincode} onChange={set('pincode')} /></label>
                    <div className="two">
                      <label className="fld"><span>Latitude</span><input value={f.latitude} onChange={set('latitude')} /></label>
                      <label className="fld"><span>Longitude</span><input value={f.longitude} onChange={set('longitude')} /></label>
                    </div>
                    <button type="button" className="btn ghost sm" onClick={useMyLocation}>Use my current location for the shop</button>
                  </>
                )}

                {err && <div className="msg err">{err}</div>}
                {ok && <div className="msg ok">{ok}</div>}

                <button className="btn primary full" disabled={busy}>{busy ? 'Please wait...' : isLogin ? 'Login' : owner ? 'Submit for approval' : 'Create account'}</button>
                {isLogin && role !== 'admin' && <Link className="link-s" to="/forgot-password">Forgot password?</Link>}
              </form>
            </div>
          </div>
        </section>

        {/* ANIMATED PANEL */}
        <section className="panel panel-art" aria-hidden={false}>
          <div className="scene">
            <div className="sun" />
            <div className="cloud c1" /><div className="cloud c2" />
            <svg className="skyline" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 120V70l30-8v-20h26v30l24-6v-24h30v40l30-10v-34h28v44l32-8v-22h30v32l30-12v-26h28v38l30-6v-18h30v28l30-10v-30h26v40l30-8v-14h28v40z" fill="#1F3545" />
            </svg>
            <div className="road"><div className="dashes" /></div>
            <Car />
          </div>
          <div className="art-copy">
            <p className="tag">Rent. Ride. Explore.</p>
            <h2>{isLogin ? 'Your next ride is a few taps away.' : 'Start renting or list your fleet.'}</h2>
            <p>{isLogin ? 'Scooters, bikes and cars from rental shops near you.' : 'Customers book instantly. Owners join after admin approval.'}</p>
            <button type="button" className="btn light" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Create an account' : 'I already have an account'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
