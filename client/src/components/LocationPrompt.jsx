import { useState } from 'react';
import { askLocationDetailed } from '../services/location';
import { Msg } from './ui';

// Friendly pop-up shown on the dashboard after login. The browser's own permission box opens when the user taps "Allow location".
export default function LocationPrompt({ onGot, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const allow = async () => {
    setBusy(true); setErr('');
    try { onGot(await askLocationDetailed()); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="modal-scrim" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lp-t">
        <div className="lp-icon" aria-hidden="true">📍</div>
        <h3 id="lp-t">Find rentals near you</h3>
        <p style={{ marginBottom: 14 }}>Allow your location to see the closest rental shops first. We only use it to sort and filter vehicles, and we do not save it.</p>
        <Msg>{err}</Msg>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Not now</button>
          <button className="btn primary" onClick={allow} disabled={busy}>{busy ? 'Finding...' : err ? 'Try again' : 'Allow location'}</button>
        </div>
      </div>
    </div>
  );
}
