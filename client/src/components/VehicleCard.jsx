import { Link } from 'react-router-dom';
import { money, MapButton } from './ui';
import { CATEGORY_INFO, CategoryArt } from './VehicleImage';

export default function VehicleCard({ v }) {
  return (
    <Link to={`/vehicles/${v._id}`} className="vcard">
      <div className="vimg"><CategoryArt category={v.category} /></div>
      <div className="vbody">
        <h3>{v.name}</h3>
        <span className="muted small">{v.rental.shopName}, {v.rental.city}</span>
        <span className="muted small">{CATEGORY_INFO[v.category]?.title}{v.rental.distanceKm != null && ` | ${v.rental.distanceKm} km away`}</span>
        <span className="price">{money(v.pricePerDay)} <small>/ day</small></span>
        <MapButton lat={v.rental.lat} lng={v.rental.lng} className="btn ghost sm mapbtn" />
      </div>
    </Link>
  );
}
