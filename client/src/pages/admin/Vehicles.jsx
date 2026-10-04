import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { act, askReason, Badge, CATS, catLabel, Empty, money, Msg, Page } from '../../components/ui';

// Vehicles go live as soon as an owner adds them. Admin filters and removes / restores them.
export default function AdminVehicles() {
  const [sp, setSp] = useSearchParams();
  const [f, setF] = useState({ q: '', number: '', shop: '' });
  const category = sp.get('category') || 'all';
  const status = sp.get('status') || 'all';
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ category, status });
      Object.entries(f).forEach(([k, v]) => v.trim() && p.set(k, v.trim()));
      setLoading(true);
      api('/admin/vehicles?' + p).then((d) => { setData(d.vehicles); setErr(''); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [f, category, status, tick]);

  const reload = () => setTick((x) => x + 1);
  const pick = (k, v) => { const n = new URLSearchParams(sp); v === 'all' ? n.delete(k) : n.set(k, v); setSp(n, { replace: true }); };
  const set = (id, st, reason) => act(() => api(`/admin/vehicles/${id}/status`, { method: 'PATCH', body: { status: st, reason } }), reload);
  const remove = (v) => { const x = askReason(); x && window.confirm(`Remove ${v.name} (${v.vehicleNumber}) from the platform? Customers will no longer see it.`) && set(v._id, 'rejected', x); };
  const hasFilter = f.q || f.number || f.shop || category !== 'all' || status !== 'all';
  const clear = () => { setF({ q: '', number: '', shop: '' }); setSp({}, { replace: true }); };
  const list = data || [];

  return (
    <Page title="Vehicles" sub="Vehicles go live when owners add them. Remove any vehicle that gets repeated complaints.">
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="vfilters">
          <label className="fld"><span>Vehicle number</span><input placeholder="e.g. MH12AB1234" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></label>
          <label className="fld"><span>Rental shop or city</span><input placeholder="Shop name" value={f.shop} onChange={(e) => setF({ ...f, shop: e.target.value })} /></label>
          <label className="fld"><span>Vehicle name</span><input placeholder="e.g. Activa" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></label>
          <label className="fld"><span>Category</span>
            <select value={category} onChange={(e) => pick('category', e.target.value)}>{CATS.map(([v, l]) => <option key={v} value={v}>{v === 'all' ? 'All categories' : l}</option>)}</select></label>
          <label className="fld"><span>Status</span>
            <select value={status} onChange={(e) => pick('status', e.target.value)}>
              <option value="all">All</option><option value="live">Live</option><option value="available">Live and available</option><option value="removed">Removed by admin</option>
            </select></label>
        </div>
        <div className="row between">
          <span className="muted small">{loading ? 'Loading...' : `${list.length} vehicle(s)`}{list.length === 300 ? ' (showing first 300, refine the filters)' : ''}</span>
          {hasFilter && <button className="btn ghost sm" onClick={clear}>Clear filters</button>}
        </div>
      </div>
      <Msg>{err}</Msg>
      {data && !list.length && <Empty>No vehicles match these filters.</Empty>}
      <div className="table-wrap" style={{ display: list.length ? 'block' : 'none' }}><table>
        <thead><tr><th>Vehicle</th><th>Category</th><th>Price</th><th>Rental shop</th><th>Bookings</th><th>Feedback</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map((v) => (
          <tr key={v._id}>
            <td>{v.name}<div className="muted small">{v.vehicleNumber}</div></td><td>{catLabel(v.category)}</td><td>{money(v.pricePerDay)}</td>
            <td>{v.rental?.shopName}<div className="muted small">{v.rental?.city} | <Badge s={v.rental?.status} /></div></td>
            <td>{v.bookingCount}</td>
            <td>{v.reviewCount ? <>{v.avgRating} ★ <span className="muted small">({v.reviewCount})</span>{v.lowRatings > 0 && <div className="small" style={{ color: 'var(--bad)' }}>{v.lowRatings} low rating(s)</div>}</> : <span className="muted small">No reviews</span>}</td>
            <td><Badge s={v.approvalStatus} /><span className="small"> {v.approvalStatus === 'approved' ? 'Live' : 'Removed'}</span>{v.approvalStatus === 'rejected' && v.rejectionReason && <div className="muted small wrap">Reason: {v.rejectionReason}</div>}</td>
            <td>{v.approvalStatus === 'approved'
              ? <button className="btn danger sm" onClick={() => remove(v)}>Remove</button>
              : <button className="btn primary sm" onClick={() => set(v._id, 'approved')}>Restore</button>}</td>
          </tr>))}</tbody>
      </table></div>
    </Page>
  );
}
