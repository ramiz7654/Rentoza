import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { act, askReason, Badge, Empty, fmtDate, money, Msg, Page, useLoad } from '../../components/ui';

export default function OwnerBookings() {
  const { data, err, reload } = useLoad('/owner/bookings');
  const set = (id, body) => act(() => api(`/owner/bookings/${id}/status`, { method: 'PATCH', body }), reload);
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('status') || 'all';
  const all = data?.bookings || [];
  const list = filter === 'all' ? all : all.filter((b) => b.status === filter);
  const count = (s) => (s === 'all' ? all : all.filter((b) => b.status === s)).length;
  return (
    <Page title="Bookings" sub="Approve or reject customer requests">
      <Msg>{err}</Msg>
      {!!all.length && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'expired'].map((s) => (
            <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setSp(s === 'all' ? {} : { status: s }, { replace: true })} style={{ textTransform: 'capitalize' }}>{s} ({count(s)})</button>
          ))}
        </div>
      )}
      {data && !all.length && <Empty>No booking requests yet.</Empty>}
      {!!all.length && !list.length && <Empty>No {filter} bookings.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}>
        <table>
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Note</th><th>Status</th><th></th></tr></thead>
          <tbody>{list.map((b) => (
            <tr key={b._id}>
              <td>{b.customer?.name}<div className="muted small">{b.customer?.mobile}</div></td>
              <td>{b.vehicle?.name}<div className="muted small">{b.vehicle?.vehicleNumber}</div></td>
              <td>{fmtDate(b.startDate)} to {fmtDate(b.endDate)} ({b.days}d){b.extendedDays > 0 && <div className="small" style={{ color: 'var(--ok)', fontWeight: 600 }}>Extended +{b.extendedDays}d (was till {fmtDate(b.originalEndDate)})</div>}</td><td>{money(b.totalAmount)}</td>
              <td className="wrap">{b.customerNote || '-'}</td><td><Badge s={b.status} /></td>
              <td className="row">
                {b.status === 'pending' && <><button className="btn primary sm" onClick={() => set(b._id, { status: 'confirmed' })}>Approve</button>
                  <button className="btn danger sm" onClick={() => { const r = askReason(); r && set(b._id, { status: 'rejected', rejectionReason: r }); }}>Reject</button></>}
                {b.status === 'confirmed' && <button className="btn dark sm" onClick={() => set(b._id, { status: 'completed' })}>Mark completed</button>}
              </td>
            </tr>))}</tbody>
        </table>
      </div>
    </Page>
  );
}
