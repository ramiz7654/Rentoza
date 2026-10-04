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
  if (loading) return <div className="center-note">Loading...</div>;
  if (err) return <Page title="Booking"><Msg>{err}</Msg></Page>;
  const b = data.booking;

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
        {b.customerNote && <p><b>Your note:</b> {b.customerNote}</p>}
        {b.ownerNote && <p><b>Owner note:</b> {b.ownerNote}</p>}
        {b.rejectionReason && <Msg>Rejected: {b.rejectionReason}</Msg>}
        {['pending', 'confirmed'].includes(b.status) && <button className="btn danger" onClick={() => window.confirm('Cancel this booking?') && act(() => api(`/bookings/${id}/cancel`, { method: 'PATCH' }), reload)}>Cancel booking</button>}
      </div>
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
