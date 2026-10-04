import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { act, askReason, Badge, Empty, FilterChips, Msg, Page, useLoad } from '../../components/ui';

// Rental shops + their owner accounts (owner approval lives here, not in Users).
export default function AdminRentals() {
  const { data, err, reload } = useLoad('/admin/rentals');
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('status') || 'all';
  const all = data?.rentals || [];
  const match = (r, s) => s === 'all' || (s === 'owner-pending' ? r.owner?.ownerApprovalStatus === 'pending' : r.status === s);
  const [q, setQ] = useState('');
  const hit = (r) => `${r.shopName} ${r.city} ${r.state} ${r.address} ${r.owner?.name} ${r.owner?.email} ${r.owner?.mobile}`.toLowerCase().includes(q.trim().toLowerCase());
  const list = all.filter((r) => match(r, filter) && hit(r));
  const set = (id, status, reason) => act(() => api(`/admin/rentals/${id}/status`, { method: 'PATCH', body: { status, reason } }), reload);
  const owner = (id, status, reason) => act(() => api(`/admin/users/${id}/approval`, { method: 'PATCH', body: { status, reason } }), reload);
  const block = (id, isActive) => act(() => api(`/admin/users/${id}/active`, { method: 'PATCH', body: { isActive } }), reload);
  return (
    <Page title="Rentals" sub="Approve the owner first, then the rental shop.">
      <Msg>{err}</Msg>
      <div className="row" style={{ marginBottom: 12 }}>
        <input style={{ maxWidth: 340 }} placeholder="Search shop, owner, city, email or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted small">{list.length} of {all.length} rental(s)</span>
        {q && <button className="btn ghost sm" onClick={() => setQ('')}>Clear</button>}
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <input style={{ maxWidth: 360 }} placeholder="Search shop, owner, mobile, city or state" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted small">{list.length} of {all.length} rental(s)</span>
      </div>
      <FilterChips options={['all', 'owner-pending', 'pending', 'approved', 'rejected']} value={filter} counts={(s) => all.filter((r) => match(r, s) && hit(r)).length}
        onPick={(s) => setSp(s === 'all' ? {} : { status: s }, { replace: true })} />
      {data && !list.length && <Empty>No rentals in this view.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}><table>
        <thead><tr><th>Shop</th><th>Owner</th><th>Owner status</th><th>City</th><th>Rental status</th><th></th></tr></thead>
        <tbody>{list.map((r) => (
          <tr key={r._id}>
            <td>{r.shopName}<div className="muted small">{r.address}</div></td>
            <td>{r.owner?.name}<div className="muted small">{r.owner?.email} | {r.owner?.mobile}</div></td>
            <td><Badge s={r.owner?.ownerApprovalStatus} /></td><td>{r.city}, {r.state}</td>
            <td><Badge s={r.status} />{r.rejectionReason && <div className="muted small wrap">{r.rejectionReason}</div>}</td>
            <td className="row">
              {r.owner?.ownerApprovalStatus !== 'approved' && <button className="btn dark sm" onClick={() => owner(r.owner._id, 'approved')}>Approve owner</button>}
              {r.owner?.ownerApprovalStatus === 'approved' && <button className="btn ghost sm" onClick={() => { const x = askReason(); x && owner(r.owner._id, 'rejected', x); }}>Reject owner</button>}
              {r.status !== 'approved' && <button className="btn primary sm" onClick={() => set(r._id, 'approved')}>Approve shop</button>}
              {r.status !== 'rejected' && <button className="btn danger sm" onClick={() => { const x = askReason(); x && set(r._id, 'rejected', x); }}>Reject shop</button>}
              {r.owner && <button className="btn ghost sm" onClick={() => block(r.owner._id, r.owner.isActive === false)}>{r.owner.isActive === false ? 'Unblock owner' : 'Block owner'}</button>}
            </td>
          </tr>))}</tbody>
      </table></div>
    </Page>
  );
}
