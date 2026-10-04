import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { catLabel, fmtDate, MapButton, money, Msg, Page, useLoad } from '../../components/ui';
import { VehicleImage } from '../../components/VehicleImage';

export default function VehicleDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, err, loading } = useLoad(`/vehicles/${id}`);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [avail, setAvail] = useState(null);
  const [e2, setE2] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  if (loading) return <div className="center-note">Loading...</div>;
  if (err) return <Page title="Vehicle"><Msg>{err}</Msg></Page>;
  const { vehicle: v, reviews, averageRating } = data;
  const days = start && end && end > start ? Math.ceil((new Date(end) - new Date(start)) / 864e5) : 0;

  const check = async () => {
    setE2(''); setAvail(null);
    try { setAvail(await api(`/vehicles/${id}/availability?start=${start}&end=${end}`)); } catch (e) { setE2(e.message); }
  };
  const book = async () => {
    setE2('');
    try { const d = await api('/bookings', { method: 'POST', body: { vehicleId: id, startDate: start, endDate: end, customerNote: note } }); nav(`/bookings/${d.booking._id}`); }
    catch (e) { setE2(e.message); }
  };

  return (
    <Page title={v.name} sub={`${catLabel(v.category)} | ${v.rental.shopName}, ${v.rental.city}`}>
      <div className="detail">
        <div>
          <div className="vimg"><VehicleImage category={v.category} src={v.photo || v.image} alt={v.name} /></div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>About this vehicle</h3>
            <p>{v.description || 'No description provided.'}</p>
            <p className="muted small">Vehicle number {v.vehicleNumber}. Pick-up at {v.rental.address}, {v.rental.city}, {v.rental.state}. Shop contact {v.rental.mobile}.</p>
            <MapButton lat={v.rental.lat} lng={v.rental.lng} className="btn dark sm">Open pick-up location in map</MapButton>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Reviews {averageRating && <span className="muted small">({averageRating} / 5 average)</span>}</h3>
            {!reviews.length && <p className="muted">No reviews yet.</p>}
            {reviews.map((r) => <div className="review" key={r._id}><b>{r.rating} / 5</b> <span className="muted small">{r.customerName} on {fmtDate(r.createdAt)}</span><p style={{ margin: '4px 0 0' }}>{r.comment}</p></div>)}
          </div>
        </div>
        <aside className="card" style={{ alignSelf: 'start' }}>
          <div className="price" style={{ marginBottom: 12 }}>{money(v.pricePerDay)} <small>/ day</small></div>
          <label className="fld"><span>Start date</span><input type="date" min={today} value={start} onChange={(e) => { setStart(e.target.value); setAvail(null); }} /></label>
          <label className="fld"><span>End date</span><input type="date" min={start || today} value={end} onChange={(e) => { setEnd(e.target.value); setAvail(null); }} /></label>
          {days > 0 && <p className="muted small">{days} day(s). Estimated total {money(days * v.pricePerDay)}. Final amount is confirmed by the server.</p>}
          <button className="btn ghost full" disabled={!days} onClick={check}>Check availability</button>
          {avail && <Msg type={avail.available ? 'ok' : 'err'}>{avail.available ? 'Available for these dates.' : 'Not available for these dates.'}</Msg>}
          {avail?.available && (
            <>
              <label className="fld" style={{ marginTop: 12 }}><span>Note for the owner (optional)</span><textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
              <button className="btn primary full" onClick={book}>Send booking request</button>
            </>
          )}
          <Msg>{e2}</Msg>
          <p className="muted small">The rental owner will confirm or reject your request.</p>
        </aside>
      </div>
    </Page>
  );
}
