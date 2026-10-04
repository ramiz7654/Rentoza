import { Link } from 'react-router-dom';
import { Badge, Bars, catLabel, Columns, fmtDate, Msg, money, Page, Stars, useLoad } from '../../components/ui';
import { CategoryArt } from '../../components/VehicleImage';

export default function OwnerDashboard() {
  const { data, err, loading } = useLoad('/owner/dashboard');
  if (loading) return <div className="center-note">Loading...</div>;
  if (err) return <Page title="Dashboard" back={false}><Msg>{err}</Msg></Page>;
  const s = data.stats;
  const items = [
    ['Vehicles', s.vehicles, '/owner/vehicles'],
    ['Live vehicles', s.approvedVehicles, '/owner/vehicles?status=approved'],
    ['Booking requests', s.pendingBookings, '/owner/bookings?status=pending'],
    ['Confirmed bookings', s.confirmedBookings, '/owner/bookings?status=confirmed'],
    ['Completed bookings', s.completedBookings, '/owner/bookings?status=completed'],
  ];
  const catRows = Object.entries(data.byCategory).map(([k, v]) => ({ label: catLabel(k), value: v }));
  return (
    <Page back={false} title={data.shopName} sub={`Rental dashboard${data.city ? ' | ' + data.city : ''}`} actions={<span>Rental status <Badge s={data.rentalStatus} /></span>}>
      {data.rentalStatus !== 'approved' && <Msg type="info">{data.rentalStatus === 'rejected' ? `Your rental was rejected: ${data.rejectionReason}. Update the profile to resubmit.` : 'Your login is approved, but your rental shop still needs admin approval (Admin > Rentals). Until then customers cannot see it and you cannot add vehicles.'}</Msg>}

      <div className="stats">{items.map(([l, n, to]) => <Link to={to} className={`stat ${l === 'Booking requests' && n ? 'warn' : ''}`} key={l}><b>{n}</b><span>{l}</span></Link>)}</div>

      <div className="stats">
        <div className="stat teal"><b>{money(s.revenue)}</b><span>Earned (completed rides)</span></div>
        <div className="stat teal"><b>{money(s.upcomingRevenue)}</b><span>Upcoming (confirmed)</span></div>
        <div className="stat teal"><b>{s.availableVehicles}</b><span>Available right now</span></div>
        <div className="stat teal"><b>{s.avgRating ?? '-'}{s.avgRating ? ' ★' : ''}</b><span>{s.reviews} customer review{s.reviews === 1 ? '' : 's'}</span></div>
      </div>

      <div className="dgrid">
        <section className="card">
          <h3>Bookings, last 6 months</h3>
          <p className="muted small">Requests received each month</p>
          <Columns rows={data.months.map((m) => ({ label: m.label, value: m.bookings }))} />
        </section>
        <section className="card">
          <h3>Earnings, last 6 months</h3>
          <p className="muted small">Confirmed and completed bookings</p>
          <Columns rows={data.months.map((m) => ({ label: m.label, value: m.amount }))} format={(v) => '₹' + (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v)} color="var(--road)" />
        </section>
        <section className="card">
          <h3>Most booked vehicles</h3>
          <p className="muted small">Confirmed and completed rides</p>
          <Bars rows={data.topVehicles.map((v) => ({ label: v.name, value: v.count }))} />
        </section>
        <section className="card">
          <h3>Fleet by category</h3>
          <p className="muted small">Vehicles you have added</p>
          <Bars rows={catRows} color="var(--teal)" />
        </section>
      </div>

      <div className="dgrid wide">
        <section className="card">
          <div className="row between"><h3>Your vehicles</h3><Link to="/owner/vehicles" className="small">Manage all</Link></div>
          {!data.vehicles.length && <p className="muted">No vehicles yet. <Link to="/owner/vehicles/add">Add your first vehicle</Link>.</p>}
          <div className="mini-list">{data.vehicles.map((v) => (
            <div className="mini" key={v._id}>
              <div className="thumb"><CategoryArt category={v.category} /></div>
              <div className="mini-t"><b>{v.name}</b><span className="muted small">{catLabel(v.category)} | {money(v.pricePerDay)} / day</span></div>
              <div className="mini-r"><Badge s={v.approvalStatus} /><span className={`small ${v.available ? 'okc' : 'muted'}`}>{v.available ? 'Available' : 'Unavailable'}</span></div>
            </div>
          ))}</div>
        </section>

        <section className="card">
          <div className="row between"><h3>Recent bookings</h3><Link to="/owner/bookings" className="small">View all</Link></div>
          {!data.recentBookings.length && <p className="muted">No bookings yet.</p>}
          <div className="mini-list">{data.recentBookings.map((b) => (
            <div className="mini" key={b._id}>
              <div className="mini-t"><b>{b.vehicle}</b><span className="muted small">{b.customer} | {fmtDate(b.startDate)} to {fmtDate(b.endDate)} ({b.days}d)</span></div>
              <div className="mini-r"><Badge s={b.status} /><b className="small">{money(b.totalAmount)}</b></div>
            </div>
          ))}</div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3>Latest customer reviews</h3>
        {!data.recentReviews.length && <p className="muted">No reviews yet. Reviews appear here after customers finish their rides.</p>}
        <div className="rev-grid">{data.recentReviews.map((r) => (
          <div className="rev" key={r._id}>
            <Stars value={r.rating} />
            <p>{r.comment || <span className="muted">No comment</span>}</p>
            <span className="muted small">{r.customer} on {r.vehicle} | {fmtDate(r.createdAt)}</span>
          </div>
        ))}</div>
      </section>
    </Page>
  );
}
