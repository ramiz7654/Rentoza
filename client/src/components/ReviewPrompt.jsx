import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Msg, StarPicker } from './ui';

// After login a customer sees a popup for every completed ride that is still not reviewed.
// Submit = save review. Remove = never ask again for that ride. Later = ask again next login.
export default function ReviewPrompt() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const uid = user?.role === 'customer' ? user.id : null;

  useEffect(() => {
    setQueue([]);
    if (!uid) return;
    api('/bookings/pending-reviews').then((d) => setQueue(d.bookings)).catch(() => {});
  }, [uid]);

  const cur = queue[0];
  if (!uid || !cur) return null;
  const next = () => { setQueue((q) => q.slice(1)); setRating(5); setComment(''); setErr(''); };

  const submit = async () => {
    setBusy(true); setErr('');
    try { await api('/reviews', { method: 'POST', body: { bookingId: cur._id, rating, comment } }); next(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api(`/bookings/${cur._id}/dismiss-review`, { method: 'PATCH' }); } catch { /* ignore */ }
    setBusy(false); next();
  };

  return (
    <div className="modal-scrim" role="presentation">
      <div className="modal review-modal" role="dialog" aria-modal="true" aria-labelledby="rv-t">
        <h3 id="rv-t">How was your ride?</h3>
        <p style={{ marginBottom: 12 }}><b>{cur.vehicle?.name}</b> from {cur.rental?.shopName}{cur.rental?.city ? `, ${cur.rental.city}` : ''}{queue.length > 1 ? ` (${queue.length} rides waiting for feedback)` : ''}</p>
        <StarPicker value={rating} onChange={setRating} />
        <label className="fld" style={{ marginTop: 12 }}><span>Your feedback (optional)</span>
          <textarea maxLength={600} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Vehicle condition, owner behaviour, pickup experience..." /></label>
        <Msg>{err}</Msg>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <button className="btn ghost" disabled={busy} onClick={remove}>Remove</button>
          <div className="row">
            <button className="btn ghost" disabled={busy} onClick={next}>Later</button>
            <button className="btn primary" disabled={busy} onClick={submit}>Submit review</button>
          </div>
        </div>
      </div>
    </div>
  );
}
