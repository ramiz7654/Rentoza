import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, askLocation, getLoc, setLoc } from '../../services/api';
import { money, Msg, Empty, Page, MapButton } from '../../components/ui';
import { CATEGORY_INFO, CategoryArt } from '../../components/VehicleImage';
import '../../home-extras.css';

export default function CategoryPage() {
  const { category } = useParams();
  const nav = useNavigate();
  const info = CATEGORY_INFO[category];
  const [text, setText] = useState(''); // what is typed
  const [q, setQ] = useState('');       // what is actually searched (after tapping Search)
  const [sort, setSort] = useState('nearest');
  const [loc, setLocState] = useState(getLoc());
  const [radius, setRadius] = useState(25);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [locMsg, setLocMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState('');

  // location is asked once on the dashboard after login; here we only reuse it (the Find near me button is still available)

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams({ category, sort });
      if (q.trim()) p.set('q', q.trim());
      if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng); p.set('radius', radius); }
      setLoading(true); setShop('');
      api('/vehicles?' + p).then((d) => { setList(d.vehicles); setErr(''); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [category, q, sort, loc, radius, info]);

  if (!info) return <Page title="Category not found"><Empty>This category does not exist.</Empty></Page>;

  // rental shops that have this category (nearest first when location is on)
  const shops = [...new Map(list.map((v) => [v.rental._id, v.rental])).values()];
  const shown = shop ? list.filter((v) => v.rental._id === shop) : list;

  const useLoc = async () => {
    try { const l = await askLocation(); setLoc(l); setLocState(l); setSort('nearest'); setLocMsg(''); } catch (e) { setLocMsg(e.message); }
  };
  const clearLoc = () => { setLoc(null); setLocState(null); };

  // switching category replaces this history entry, so the Back arrow goes straight to the dashboard
  const switchCat = (k) => {
    if (k === category) return;
    nav(`/category/${k}`, { replace: true });
  };

  return (
    <Page title={info.title} sub={info.desc}>
      <div className="row" style={{ marginBottom: 14 }}>
        {Object.entries(CATEGORY_INFO).map(([k, c]) => (
          <button key={k} className={`btn sm ${k === category ? 'dark' : 'ghost'}`} onClick={() => switchCat(k)}>{c.title}</button>
        ))}
      </div>

      <div className="cbar">
        <form className="cbar-search" onSubmit={(e) => { e.preventDefault(); setQ(text.trim()); }}>
          <input placeholder={`Search ${info.title.toLowerCase()}, shop, city or state`} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn dark">Search</button>
          {q && <button type="button" className="btn ghost" onClick={() => { setText(''); setQ(''); }}>Clear</button>}
        </form>
        <div className="cbar-ctrl">
          {loc && <select value={radius} onChange={(e) => setRadius(e.target.value)} aria-label="Radius">{[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>Within {r} km</option>)}</select>}
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="nearest">Nearest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
            <option value="name">Vehicle name</option><option value="shop">Shop name</option>
          </select>
          {loc ? <button type="button" className="btn light" onClick={clearLoc}>Clear location</button> : <button type="button" className="btn primary" onClick={useLoc}>Find near me</button>}
        </div>
      </div>

      <p className="muted small">{loc ? `Showing rental shops within ${radius} km of you` : 'Showing all rental shops'} | {loading ? 'Loading...' : `${shown.length} vehicle(s) found`}</p>
      <Msg type="info">{locMsg}</Msg>
      <Msg>{err}</Msg>
      {shops.length > 1 && (
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={`chip ${shop === '' ? 'on' : ''}`} onClick={() => setShop('')}>All shops ({shops.length})</button>
          {shops.map((r) => (
            <button key={r._id} className={`chip ${shop === r._id ? 'on' : ''}`} onClick={() => setShop(r._id)}>
              {r.shopName}{r.distanceKm != null ? ` | ${r.distanceKm} km` : ''}
            </button>
          ))}
        </div>
      )}
      {!loading && !list.length && <Empty>No {info.title} found{loc ? ' nearby. Try a larger radius or clear location' : ''}.</Empty>}

      <div className="grid">
        {shown.map((v) => (
          <div className="vcard" key={v._id}>
            <Link to={`/vehicles/${v._id}`} className="vimg"><CategoryArt category={v.category} /></Link>
            <div className="vbody">
              <h3>{v.name}</h3>
              <span className="muted small">{v.rental.shopName}, {v.rental.city}, {v.rental.state}</span>
              {v.rental.distanceKm != null && <span className="muted small">{v.rental.distanceKm} km away</span>}
              {v.vehicleNumber && <span className="muted small">Vehicle no. {v.vehicleNumber}</span>}
              {v.description && <span className="muted small wrap" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.description}</span>}
              <span className="price">{money(v.pricePerDay)} <small>/ day</small></span>
              <MapButton lat={v.rental.lat} lng={v.rental.lng} className="btn ghost sm mapbtn" />
              <Link className="btn primary sm" style={{ marginTop: 8, textAlign: 'center' }} to={`/vehicles/${v._id}`}>View details & Book</Link>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
