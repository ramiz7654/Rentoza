import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { act, Badge, Empty, fmtDate, money, Msg, Page, useLoad } from '../../components/ui';

export default function MyBookings() {
  const { data, err, loading, reload } = useLoad('/bookings/mine');
  const cancel = (id) => window.confirm('Cancel this booking?') && act(() => api(`/bookings/${id}/cancel`, { method: 'PATCH' }), reload);
  const list = data?.bookings || [];
  return (
    <Page title="My Bookings" sub="Your booking history and requests">
      <Msg>{err}</Msg>
      {!loading && !list.length && <Empty>No bookings yet. Find a vehicle on the Home page.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}>
        <table>
          <thead><tr><th>Vehicle</th><th>Rental shop</th><th>Dates</th><th>Days</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b._id}>
                <td>{b.vehicle?.name}</td><td>{b.rental?.shopName}</td>
                <td>{fmtDate(b.startDate)} to {fmtDate(b.endDate)}</td><td>{b.days}</td><td>{money(b.totalAmount)}</td><td><Badge s={b.status} /></td>
                <td className="row">
                  <Link className="btn ghost sm" to={`/bookings/${b._id}`}>Details</Link>
                  {b.status === 'completed' && !b.reviewed && <Link className="btn primary sm" to={`/bookings/${b._id}`}>Rate ride</Link>}
                  {['pending', 'confirmed'].includes(b.status) && <button className="btn danger sm" onClick={() => cancel(b._id)}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
