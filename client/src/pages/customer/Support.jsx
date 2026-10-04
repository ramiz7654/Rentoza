import { useState } from 'react';
import { api } from '../../services/api';
import { Badge, fmtDate, Msg, Page, useLoad } from '../../components/ui';

const FAQ = [
  ['How do I book a vehicle?', 'Open a vehicle, choose start and end dates, check availability and send a booking request. The rental owner confirms or rejects it.'],
  ['When is my booking confirmed?', 'A booking is confirmed only after the rental owner approves it. Until then it stays pending.'],
  ['Can I cancel a booking?', 'Yes, pending and confirmed bookings can be cancelled from My Bookings. Completed bookings cannot be cancelled.'],
  ['Is my location stored?', 'No. Your location is used only in your browser session to find nearby vehicles, unless you choose to save a place in Profile.'],
  ['How do I review a ride?', 'After the owner marks your booking completed, open the booking details and submit a rating and comment.'],
];

export default function Support() {
  const { data, reload } = useLoad('/support/tickets');
  const [chat, setChat] = useState([{ me: false, t: 'Hi, pick a question below and I will answer it.' }]);
  const [subject, setSubject] = useState(''); const [message, setMessage] = useState('');
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const ask = ([q, a]) => setChat((c) => [...c, { me: true, t: q }, { me: false, t: a }]);
  const send = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try { await api('/support/tickets', { method: 'POST', body: { subject, message } }); setSubject(''); setMessage(''); setOk('Ticket created'); reload(); } catch (x) { setErr(x.message); }
  };
  return (
    <Page title="Help & Support">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="card faq"><h3>FAQ</h3>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>)}</div>
        <div className="card bot">
          <h3>Ask Rentoza</h3>
          {chat.map((m, i) => <div key={i} className={`bubble ${m.me ? 'me' : ''}`}>{m.t}</div>)}
          <div className="row">{FAQ.map((f) => <button key={f[0]} className="chip" onClick={() => ask(f)}>{f[0]}</button>)}</div>
        </div>
        <form className="card" onSubmit={send}>
          <h3 style={{ marginBottom: 12 }}>Create a support ticket</h3>
          <label className="fld"><span>Subject</span><input maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
          <label className="fld"><span>Message</span><textarea maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <Msg>{err}</Msg><Msg type="ok">{ok}</Msg><button className="btn primary">Submit ticket</button>
        </form>
      </div>
      <h3 style={{ margin: '28px 0 12px' }}>Your tickets</h3>
      {!(data?.tickets || []).length && <p className="muted">No tickets yet.</p>}
      {(data?.tickets || []).map((t) => (
        <div className="card" key={t._id} style={{ marginBottom: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><b>{t.subject}</b><Badge s={t.status} /></div>
          <p style={{ margin: '6px 0' }}>{t.message}</p><span className="muted small">{fmtDate(t.createdAt)}</span>
          {t.adminResponse && <Msg type="info">Support reply: {t.adminResponse}</Msg>}
        </div>
      ))}
    </Page>
  );
}
