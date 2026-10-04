import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, askLocation } from '../../services/api';
import { Msg, Page } from '../../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile);
  const [label, setLabel] = useState('');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const run = async (fn, ok) => { setErr(''); setMsg(''); try { const d = await fn(); setUser(d.user); setMsg(ok); } catch (e) { setErr(e.message); } };

  return (
    <Page title="Profile">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api('/auth/me', { method: 'PATCH', body: { name, mobile } }), 'Profile saved'); }}>
          <h3 style={{ marginBottom: 12 }}>Your details</h3>
          <label className="fld"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="fld"><span>Mobile</span><input value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} /></label>
          <label className="fld"><span>Email</span><input value={user.email} disabled /></label>
          <button className="btn primary">Save changes</button>
        </form>
        <div className="card">
          <h3>Saved locations</h3>
          <p className="muted small">Your live location is never stored. A place is saved only when you tap Save current location.</p>
          {(user.savedLocations || []).map((l) => (
            <div className="row" key={l._id} style={{ justifyContent: 'space-between', margin: '8px 0' }}>
              <span>{l.label}</span><button className="btn danger sm" onClick={() => run(() => api(`/auth/me/locations/${l._id}`, { method: 'DELETE' }), 'Location removed')}>Remove</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 12 }}>
            <input style={{ flex: 1 }} placeholder="Label, e.g. Home" value={label} onChange={(e) => setLabel(e.target.value)} />
            <button className="btn dark" disabled={!label} onClick={() => run(async () => { const p = await askLocation(); return api('/auth/me/locations', { method: 'POST', body: { label, latitude: p.lat, longitude: p.lng } }); }, 'Location saved')}>Save current location</button>
          </div>
        </div>
      </div>
      <Msg>{err}</Msg><Msg type="ok">{msg}</Msg>
    </Page>
  );
}
