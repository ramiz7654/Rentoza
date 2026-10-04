import { Link } from 'react-router-dom';
import { Bars, catLabel, Columns, Msg, money, Page, useLoad } from '../../components/ui';

// every card opens the matching page (already filtered)
const PENDING = [
  ['pendingOwners', 'Pending owners', '/admin/rentals?status=owner-pending'],
  ['pendingRentals', 'Pending rentals', '/admin/rentals?status=pending'],
  ['pendingBookings', 'Pending bookings (owners decide)', '/admin/bookings?status=pending'],
  ['openTickets', 'Open support tickets', '/admin/support'],
];
const STATS = [
  ['customers', 'Customers', '/admin/users'],
  ['owners', 'Rental owners', '/admin/rentals'],
  ['totalRentals', 'Total rentals', '/admin/rentals'],
  ['approvedRentals', 'Approved rentals', '/admin/rentals?status=approved'],
  ['totalVehicles', 'Total vehicles', '/admin/vehicles'],
  ['approvedVehicles', 'Live vehicles', '/admin/vehicles?status=live'],
  ['availableVehicles', 'Available vehicles', '/admin/vehicles?status=available'],
  ['totalBookings', 'Total bookings', '/admin/bookings'],
  ['activeBookings', 'Active bookings', '/admin/bookings?status=confirmed'],
  ['completedBookings', 'Completed bookings', '/admin/bookings?status=completed'],
  ['totalReviews', 'Total reviews', '/admin/reviews'],
];

export default function AdminDashboard() {
  const { data, err, reload } = useLoad('/admin/dashboard');
  const s = data?.stats;
  const bs = data?.bookingsByStatus || {};
  return (
    <Page back={false} title="Admin dashboard" sub="Platform overview" actions={<button className="btn ghost sm" onClick={reload}>Refresh</button>}>
      <Msg>{err}</Msg>
      {s && <>
        <h3 style={{ marginBottom: 10 }}>Needs attention</h3>
        <div className="stats">{PENDING.map(([k, l, to]) => <Link key={k} to={to} className={`stat ${s[k] ? 'warn' : ''}`}><b>{s[k]}</b><span>{l}</span></Link>)}</div>

        <h3 style={{ margin: '24px 0 10px' }}>Platform statistics</h3>
        <div className="stats">
          <div className="stat teal"><b>{money(s.revenue)}</b><span>Total booking value (completed)</span></div>
          {STATS.map(([k, l, to]) => <Link key={k} to={to} className="stat"><b>{s[k]}</b><span>{l}</span></Link>)}
        </div>

        <div className="dgrid">
          <section className="card"><h3>Bookings, last 6 months</h3><p className="muted small">Requests created each month</p>
            <Columns rows={data.months.map((m) => ({ label: m.label, value: m.bookings }))} /></section>
          <section className="card"><h3>Bookings by status</h3><p className="muted small">Tap a status on the Bookings page</p>
            <Bars rows={['pending', 'confirmed', 'completed', 'rejected', 'cancelled'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: bs[k] || 0 }))} /></section>
          <section className="card"><h3>Vehicles by category</h3><p className="muted small">All vehicles on the platform</p>
            <Bars rows={Object.entries(data.vehiclesByCategory).map(([k, v]) => ({ label: catLabel(k), value: v }))} color="var(--teal)" /></section>
          <section className="card"><h3>Rentals and vehicles</h3><p className="muted small">Approved vs total</p>
            <Bars rows={[{ label: 'Rentals approved', value: s.approvedRentals }, { label: 'Rentals total', value: s.totalRentals }, { label: 'Vehicles live', value: s.approvedVehicles }, { label: 'Vehicles total', value: s.totalVehicles }]} color="#7c93a5" /></section>
        </div>
      </>}
    </Page>
  );
}
