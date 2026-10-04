import { useSearchParams } from 'react-router-dom';
import { Badge, Empty, FilterChips, fmtDate, money, Msg, Page, useLoad } from '../../components/ui';

// Monitoring only. Booking approval belongs to rental owners.
export default function AdminBookings() {
  const { data, err } = useLoad('/admin/bookings');
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('status') || 'all';
  const all = data?.bookings || [];
  const list = filter === 'all' ? all : all.filter((b) => b.status === filter);
  return (
    <Page title="Bookings" sub="Monitoring only. Owners approve or reject individual bookings.">
      <Msg>{err}</Msg>
      <FilterChips options={['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled']} value={filter} counts={(s) => (s === 'all' ? all : all.filter((b) => b.status === s)).length}
        onPick={(s) => setSp(s === 'all' ? {} : { status: s }, { replace: true })} />
      {data && !list.length && <Empty>No bookings in this view.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}><table>
        <thead><tr><th>Customer</th><th>Vehicle</th><th>Rental</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{list.map((b) => (
          <tr key={b._id}><td>{b.customer?.name}</td><td>{b.vehicle?.name}</td><td>{b.rental?.shopName}</td>
            <td>{fmtDate(b.startDate)} to {fmtDate(b.endDate)}</td><td>{money(b.totalAmount)}</td><td><Badge s={b.status} /></td></tr>))}</tbody>
      </table></div>
    </Page>
  );
}
