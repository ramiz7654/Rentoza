import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { act, Badge, fmtDate, MapButton, money, Msg, Page, StarPicker, useLoad } from '../../components/ui';

export default function BookingDetail() {
  const { id } = useParams();
  const { data, err, loading, reload } = useLoad(`/bookings/${id}`);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [e2, setE2] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [e3, setE3] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="center-note">Loading...</div>;
  if (err) return <Page title="Booking"><Msg>{err}</Msg></Page>;
  const b = data.booking;

  // ---- extend (customer, no owner approval) ----
  const ymd = (d) => new Date(d).toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const ended = Date.now() >= new Date(b.endDate).getTime() + 18.5 * 3600 * 1000; // end of the end date, India time
  const canExtend = ['pending', 'confirmed'].includes(b.status) && !ended;
  const minEnd = addDays(b.endDate, 1);
  const maxEnd = b.extendMaxDate ? ymd(b.extendMaxDate) : null;
  const blocked = maxEnd && maxEnd < minEnd;
  const extra = newEnd ? Math.round((new Date(newEnd) - new Date(ymd(b.endDate))) / 86400000) : 0;
  const extraAmount = extra > 0 ? Math.round((b.dailyRate || 0) * extra) : 0;
  const extend = async (e) => {
    e.preventDefault(); setE3('');
    if (extra < 1) return setE3('Choose a new end date after the current one');
    if (!window.confirm(`Extend by ${extra} day(s) for ${money(extraAmount)} more?`)) return;
    setBusy(true);
    try { await api(`/bookings/${id}/extend`, { method: 'PATCH', body: { endDate: newEnd } }); setNewEnd(''); reload(); } catch (x) { setE3(x.message); } finally { setBusy(false); }
  };

  const review = async (e) => {
    e.preventDefault(); setE2('');
    try { await api('/reviews', { method: 'POST', body: { bookingId: id, rating, comment } }); reload(); } catch (x) { setE2(x.message); }
  };
  return (
    <Page title="Booking details" actions={<Badge s={b.status} />}>
      <div className="card">
        <h3>{b.vehicle?.name}</h3>
        <p className="muted">{b.rental?.shopName}, {b.rental?.address}, {b.rental?.city}. Contact {b.rental?.mobile}</p>
        <MapButton lat={b.rental?.location?.coordinates?.[1]} lng={b.rental?.location?.coordinates?.[0]} className="btn dark sm" >Open pick-up location in map</MapButton>
        <p>{fmtDate(b.startDate)} to {fmtDate(b.endDate)} ({b.days} days). Total <b>{money(b.totalAmount)}</b></p>
        {b.extendedDays > 0 && <Msg type="info">Extended by {b.extendedDays} day(s). Original end date was {fmtDate(b.originalEndDate)}.</Msg>}
        {b.status === 'expired' && <Msg type="info">This request expired because the owner did not confirm it before the start date. You can book again.</Msg>}
        {b.customerNote && <p><b>Your note:</b> {b.customerNote}</p>}
        {b.ownerNote && <p><b>Owner note:</b> {b.ownerNote}</p>}
        {b.rejectionReason && <Msg>Rejected: {b.rejectionReason}</Msg>}
        {['pending', 'confirmed'].includes(b.status) && <button className="btn danger" onClick={() => window.confirm('Cancel this booking?') && act(() => api(`/bookings/${id}/cancel`, { method: 'PATCH' }), reload)}>Cancel booking</button>}
      </div>
      {canExtend && (
        <form className="card" style={{ marginTop: 16, maxWidth: 520 }} onSubmit={extend}>
          <h3>Need the vehicle for longer?</h3>
          {blocked
            ? <p className="muted">Someone else has booked this vehicle from {fmtDate(b.extendMaxDate)}, so this booking cannot be extended.</p>
            : <>
              <p className="muted" style={{ marginTop: 0 }}>Pick a new end date. The extra days are charged at the same daily rate{maxEnd ? `, and you can extend up to ${fmtDate(b.extendMaxDate)}` : ''}.</p>
              <label className="fld"><span>New end date</span><input type="date" min={minEnd} max={maxEnd || undefined} value={newEnd} onChange={(e) => setNewEnd(e.target.value)} /></label>
              {extra > 0 && <p><b>+{extra} day(s)</b> = {money(extraAmount)} more. New total <b>{money(b.totalAmount + extraAmount)}</b>.</p>}
              <Msg>{e3}</Msg>
              <button className="btn primary" disabled={busy || extra < 1}>{busy ? 'Extending...' : 'Extend booking'}</button>
            </>}
        </form>
      )}
      {b.status === 'completed' && !b.reviewed && (
        <form className="card" style={{ marginTop: 16, maxWidth: 520 }} onSubmit={review}>
          <h3>Rate this ride</h3>
          <StarPicker value={rating} onChange={setRating} />
          <label className="fld"><span>Comment</span><textarea maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
          <Msg>{e2}</Msg><button className="btn primary">Submit review</button>
        </form>
      )}
      {b.reviewed && <Msg type="ok">Thanks, your review is submitted.</Msg>}
    </Page>
  );
}
