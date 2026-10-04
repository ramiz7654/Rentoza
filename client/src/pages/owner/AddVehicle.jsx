import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { compressImage } from '../../services/image';
import { CATS, Msg, Page } from '../../components/ui';

const blank = { category: 'bike', name: '', vehicleNumber: '', description: '', pricePerDay: '', photo: '' };

// Add a new vehicle. Opened with ?edit=<id> (from Manage Vehicles) it edits that vehicle instead.
export default function OwnerAddVehicle() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const editId = sp.get('edit');
  const [err, setErr] = useState('');
  const [missing, setMissing] = useState(false);
  const [f, setF] = useState(blank);
  const [e2, setE2] = useState('');
  const [busy, setBusy] = useState(false);

  // switching from edit mode to "Add Vehicle" gives a fresh form
  useEffect(() => { if (!editId) setF(blank); }, [editId]);

  // edit mode: load the selected vehicle (including its photo)
  useEffect(() => {
    if (!editId) return;
    api(`/owner/vehicles/${editId}`).then(({ vehicle: v }) => setF({ category: v.category, name: v.name, vehicleNumber: v.vehicleNumber, description: v.description || '', pricePerDay: v.pricePerDay, photo: v.photo || '' }))
      .catch((e) => { setMissing(true); setErr(e.message); });
  }, [editId]);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setE2('');
    try { setF((x) => ({ ...x, photo: '' })); const d = await compressImage(file); if (d.length > 450000) throw new Error('Photo is too large, please choose a smaller one'); setF((x) => ({ ...x, photo: d })); }
    catch (x) { setE2(x.message); }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setE2(''); setBusy(true);
    try {
      await api(editId ? `/owner/vehicles/${editId}` : '/owner/vehicles', { method: editId ? 'PUT' : 'POST', body: f });
      nav('/owner/vehicles');
    } catch (x) { setE2(x.message); setBusy(false); }
  };

  return (
    <Page title={editId ? 'Edit Vehicle' : 'Add Vehicle'} sub="New vehicles go live for customers right away. Changes are saved instantly.">
      <Msg>{err}</Msg>
            <form className="card" style={{ maxWidth: 720 }} onSubmit={submit}>
        <div className="two">
          <label className="fld"><span>Category</span><select value={f.category} onChange={set('category')}>{CATS.slice(1).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="fld"><span>Vehicle name</span><input value={f.name} onChange={set('name')} /></label>
          <label className="fld"><span>Vehicle number</span><input value={f.vehicleNumber} onChange={set('vehicleNumber')} /></label>
          <label className="fld"><span>Price per day (INR)</span><input type="number" min="1" value={f.pricePerDay} onChange={set('pricePerDay')} /></label>
        </div>
        <div className="fld"><span>Vehicle photo (optional)</span>
          <p className="muted small" style={{ margin: '0 0 8px' }}>Customers see this photo when they open your vehicle. Lists show the standard category photo. No photo? The category photo is used.</p>
          {f.photo && <div className="photo-prev"><img src={f.photo} alt="Vehicle preview" /></div>}
          <div className="row">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} />
            {f.photo && <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, photo: '' })}>Remove photo</button>}
          </div>
        </div>
        <label className="fld"><span>Description</span><textarea value={f.description} onChange={set('description')} /></label>
        {editId && <p className="muted small">Changes are saved instantly. A vehicle removed by admin stays hidden from customers until admin restores it.</p>}
        <Msg>{e2}</Msg>
        <div className="row">
          <button className="btn primary" disabled={busy}>{editId ? 'Save changes' : 'Add vehicle'}</button>
          {editId && <button type="button" className="btn ghost" onClick={() => nav('/owner/vehicles')}>Cancel</button>}
        </div>
      </form>
    </Page>
  );
}
