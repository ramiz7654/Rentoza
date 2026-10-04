import { api } from '../../services/api';
import { act, Badge, fmtDate, Msg, Page, useLoad } from '../../components/ui';

export default function AdminSupport() {
  const { data, err, reload } = useLoad('/admin/support');
  const upd = (id, body) => act(() => api(`/admin/support/${id}`, { method: 'PATCH', body }), reload);
  const reply = (t) => { const r = window.prompt('Reply to customer:', t.adminResponse || ''); if (r !== null) upd(t._id, { adminResponse: r, status: 'resolved' }); };
  return (
    <Page title="Support tickets">
      <Msg>{err}</Msg>
      {(data?.tickets || []).map((t) => (
        <div className="card" key={t._id} style={{ marginBottom: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><b>{t.subject}</b><Badge s={t.status} /></div>
          <div className="muted small">{t.customer?.name} ({t.customer?.email}) on {fmtDate(t.createdAt)}</div>
          <p>{t.message}</p>
          {t.adminResponse && <Msg type="info">Reply: {t.adminResponse}</Msg>}
          <div className="row">
            <button className="btn primary sm" onClick={() => reply(t)}>Reply and resolve</button>
            {t.status === 'open' && <button className="btn ghost sm" onClick={() => upd(t._id, { status: 'in-progress' })}>Mark in progress</button>}
            {t.status === 'resolved' && <button className="btn ghost sm" onClick={() => upd(t._id, { status: 'open' })}>Reopen</button>}
          </div>
        </div>))}
    </Page>
  );
}
