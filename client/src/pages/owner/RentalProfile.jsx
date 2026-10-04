import { useEffect, useState } from 'react';
import { api, askLocation } from '../../services/api';
import { Badge, Msg, Page } from '../../components/ui';

export default function RentalProfile() {
  const [f, setF] = useState(null); const [status, setStatus] = useState('');
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => {
    api('/owner/rental').then(({ rental: r }) => {
      setStatus(r.status);
      setF({ shopName: r.shopName, mobile: r.mobile, address: r.address, city: r.city, state: r.state, pincode: r.pincode, latitude: r.location.coordinates[1], longitude: r.location.coordinates[0] });
    }).catch((e) => setErr(e.message));
  }, []);
  if (!f) return <Page title="Rental Profile"><Msg>{err}</Msg></Page>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try { const d = await api('/owner/rental', { method: 'PUT', body: f }); setStatus(d.rental.status); setOk(d.message); } catch (x) { setErr(x.message); }
  };
  const loc = async () => { try { const p = await askLocation(); setF({ ...f, latitude: p.lat.toFixed(6), longitude: p.lng.toFixed(6) }); } catch (x) { setErr(x.message); } };
  return (
    <Page title="Rental Profile" actions={<span>Status <Badge s={status} /></span>}>
      <form className="card" style={{ maxWidth: 640 }} onSubmit={save}>
        <p className="muted small">Saving changes sends the rental back to admin for review.</p>
        <label className="fld"><span>Shop name</span><input value={f.shopName} onChange={set('shopName')} /></label>
        <label className="fld"><span>Mobile</span><input value={f.mobile} onChange={set('mobile')} maxLength={10} /></label>
        <label className="fld"><span>Address</span><input value={f.address} onChange={set('address')} /></label>
        <div className="two"><label className="fld"><span>City</span><input value={f.city} onChange={set('city')} /></label><label className="fld"><span>State</span><input value={f.state} onChange={set('state')} /></label></div>
        <label className="fld"><span>Pincode</span><input value={f.pincode} onChange={set('pincode')} maxLength={6} /></label>
        <div className="two"><label className="fld"><span>Latitude</span><input value={f.latitude} onChange={set('latitude')} /></label><label className="fld"><span>Longitude</span><input value={f.longitude} onChange={set('longitude')} /></label></div>
        <button type="button" className="btn ghost sm" onClick={loc}>Use my current location</button>
        <Msg>{err}</Msg><Msg type="ok">{ok}</Msg>
        <div style={{ marginTop: 12 }}><button className="btn primary">Save and submit for review</button></div>
      </form>
    </Page>
  );
}
