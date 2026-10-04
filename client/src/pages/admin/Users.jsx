import { useState } from 'react';
import { api } from '../../services/api';
import { act, Badge, Empty, fmtDate, money, Msg, Page, useLoad } from '../../components/ui';

// Customers only. Rental owners (and their shops) are managed under Admin > Rentals.
export default function AdminUsers() {
  const { data, err, reload } = useLoad('/admin/users');
  const [q, setQ] = useState('');
  const active = (id, isActive) => act(() => api(`/admin/users/${id}/active`, { method: 'PATCH', body: { isActive } }), reload);
  const all = data?.users || [];
  const list = all.filter((u) => `${u.name} ${u.email} ${u.mobile}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Page title="Users" sub="Customer accounts. Rental owners are managed in Rentals.">
      <Msg>{err}</Msg>
      <div className="row" style={{ marginBottom: 12 }}>
        <input style={{ maxWidth: 320 }} placeholder="Search name, email or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted small">{list.length} of {all.length} customer(s)</span>
      </div>
      {data && !list.length && <Empty>No customers found.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}><table>
        <thead><tr><th>Name</th><th>Contact</th><th>Bookings</th><th>Spent</th><th>Account</th><th>Joined</th><th></th></tr></thead>
        <tbody>{list.map((u) => (
          <tr key={u._id}>
            <td>{u.name}</td><td>{u.email}<div className="muted small">{u.mobile}</div></td>
            <td>{u.bookings}</td><td>{money(u.spent)}</td>
            <td><Badge s={u.isActive ? 'approved' : 'rejected'} /> <span className="small">{u.isActive ? 'Active' : 'Blocked'}</span></td><td>{fmtDate(u.createdAt)}</td>
            <td><button className="btn ghost sm" onClick={() => active(u._id, !u.isActive)}>{u.isActive ? 'Block' : 'Activate'}</button></td>
          </tr>))}</tbody>
      </table></div>
    </Page>
  );
}
