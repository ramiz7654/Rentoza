import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { act, Badge, catLabel, Empty, money, Msg, Page, useLoad } from '../../components/ui';
import { CategoryArt } from '../../components/VehicleImage';

// Manage Vehicles: list only (filter, edit, delete, availability). Adding is on the Add Vehicle page.
export default function OwnerVehicles() {
  const nav = useNavigate();
  const { data, err, reload } = useLoad('/owner/vehicles');
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('status') || 'all';
  const vehicles = data?.vehicles || [];
  const shown = filter === 'all' ? vehicles : vehicles.filter((v) => v.approvalStatus === filter);
  const count = (s) => (s === 'all' ? vehicles : vehicles.filter((v) => v.approvalStatus === s)).length;
  return (
    <Page title="Manage Vehicles" sub="Edit, delete or switch availability of your vehicles.">
      <Msg>{err}</Msg>
      {!!vehicles.length && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {['all', 'approved', 'rejected'].map((s) => (
            <button key={s} className={`chip ${filter === s ? 'on' : ''}`} onClick={() => setSp(s === 'all' ? {} : { status: s }, { replace: true })} style={{ textTransform: 'capitalize' }}>{s === 'approved' ? 'live' : s === 'rejected' ? 'removed' : s} ({count(s)})</button>
          ))}
        </div>
      )}
      {data && !vehicles.length && <Empty>No vehicles yet.</Empty>}
      {!!vehicles.length && !shown.length && <Empty>No {filter} vehicles.</Empty>}
      <div className="table-wrap" style={{ display: shown.length ? 'block' : 'none' }}>
        <table>
          <thead><tr><th>Vehicle</th><th>Category</th><th>Number</th><th>Price</th><th>Status</th><th>Available</th><th></th></tr></thead>
          <tbody>{shown.map((v) => (
            <tr key={v._id}>
              <td><div className="row" style={{ flexWrap: 'nowrap' }}><div className="thumb"><CategoryArt category={v.category} /></div>{v.name}</div></td><td>{catLabel(v.category)}</td><td>{v.vehicleNumber}</td><td>{money(v.pricePerDay)}</td>
              <td><Badge s={v.approvalStatus} /><span className="small"> {v.approvalStatus === 'approved' ? 'Live' : 'Removed by admin'}</span>{v.approvalStatus === 'rejected' && v.rejectionReason && <div className="muted small wrap">Reason: {v.rejectionReason}</div>}</td>
              <td><input type="checkbox" style={{ width: 'auto' }} checked={v.available} onChange={(e) => act(() => api(`/owner/vehicles/${v._id}/availability`, { method: 'PATCH', body: { available: e.target.checked } }), reload)} /></td>
              <td className="row"><button className="btn ghost sm" onClick={() => nav(`/owner/vehicles/add?edit=${v._id}`)}>Edit</button>
                <button className="btn danger sm" onClick={() => window.confirm('Delete this vehicle?') && act(() => api(`/owner/vehicles/${v._id}`, { method: 'DELETE' }), reload)}>Delete</button></td>
            </tr>))}</tbody>
        </table>
      </div>
    </Page>
  );
}
