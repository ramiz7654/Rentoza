import { api } from '../../services/api';
import { act, Badge, fmtDate, Msg, Page, useLoad } from '../../components/ui';

export default function AdminReviews() {
  const { data, err, reload } = useLoad('/admin/reviews');
  const set = (id, status) => act(() => api(`/admin/reviews/${id}/status`, { method: 'PATCH', body: { status } }), reload);
  return (
    <Page title="Reviews" sub="Hide inappropriate reviews from customers">
      <Msg>{err}</Msg>
      <div className="table-wrap"><table>
        <thead><tr><th>Customer</th><th>Vehicle</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>{(data?.reviews || []).map((r) => (
          <tr key={r._id}><td>{r.customer?.name}</td><td>{r.vehicle?.name}</td><td>{r.rating} / 5</td><td className="wrap">{r.comment || '-'}</td><td>{fmtDate(r.createdAt)}</td>
            <td><Badge s={r.status} /></td>
            <td><button className="btn ghost sm" onClick={() => set(r._id, r.status === 'visible' ? 'hidden' : 'visible')}>{r.status === 'visible' ? 'Hide' : 'Show'}</button></td></tr>))}</tbody>
      </table></div>
    </Page>
  );
}
