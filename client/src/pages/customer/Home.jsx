import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, askLocation, getLoc, setLoc } from '../../services/api';
import { money, Msg, Empty, MapButton } from '../../components/ui';
import { CATEGORY_INFO, CategoryArt } from '../../components/VehicleImage';

export default function Home() {
  const nav = useNavigate();
  const [text, setText] = useState(''); // what is typed
  const [q, setQ] = useState('');       // what is actually searched (after tapping Search)
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('nearest');
  const [loc, setLocState] = useState(getLoc());
  const [radius, setRadius] = useState(25);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef(null);
  const scrollNext = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ category: q ? 'all' : category, sort });
      if (q.trim()) p.set('q', q.trim());
      if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng); p.set('radius', radius); }
      setLoading(true);
      api('/vehicles?' + p).then((d) => { setList(d.vehicles); setErr(''); }).catch((e) => setErr(e.message)).finally(() => { setLoading(false); if (scrollNext.current) { scrollNext.current = false; resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    }, 250);
    return () => clearTimeout(t);
  }, [q, category, sort, loc, radius]);

  const useLoc = async () => {
    try { const l = await askLocation(); setLoc(l); setLocState(l); setSort('nearest'); } catch (e) { setErr(e.message); }
  };
  const clearLoc = () => { setLoc(null); setLocState(null); };

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <h1>Rent. Ride. Explore.</h1>
          <p>Scooters, bikes and cars from verified rental shops around you.</p>
          <form className="search" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); scrollNext.current = t !== q; setQ(t); resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (!t) setText(''); }}>
            <input placeholder="Search vehicle, shop, city or state" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" className="btn primary">Search</button>
            {loc ? <button type="button" className="btn light" onClick={clearLoc}>Clear location</button> : <button type="button" className="btn light" onClick={useLoc}>Find near me</button>}
          </form>
        </div>
      </section>
      <main className="page">
        <div className="catcards">
          {Object.entries(CATEGORY_INFO).map(([key, c]) => (
            <button key={key} className={`catcard ${category === key ? 'on' : ''}`} onClick={() => (key === 'all' ? setCategory('all') : nav(`/category/${key}`))} aria-pressed={category === key}>
              <div className="catart"><CategoryArt category={key} /></div>
              <div className="catshade" />
              <div className="catbody"><b>{c.title}</b><span>{c.desc}</span></div>
            </button>
          ))}
        </div>
        <div className="toolbar" ref={resultsRef} style={{ scrollMarginTop: 76 }}>
          <h2 style={{ fontSize: 20 }}>{q ? `Results for "${q}"` : CATEGORY_INFO[category].title}{q && <button type="button" className="btn ghost sm" style={{ marginLeft: 10 }} onClick={() => { setQ(''); setText(''); }}>Clear search</button>}</h2>
          <div className="row">
            {loc && <select value={radius} onChange={(e) => setRadius(e.target.value)} aria-label="Radius">{[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>Within {r} km</option>)}</select>}
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="nearest">Nearest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
              <option value="name">Vehicle name</option><option value="shop">Shop name</option>
            </select>
          </div>
        </div>
        <Msg>{err}</Msg>
        {!loading && !list.length && <Empty>{q ? `No vehicles found for "${q}". Search another city, state or area (use Clear search to go back).` : 'No vehicles found. Try another category, a larger radius or a different search.'}</Empty>}
        <div className="grid">
          {list.map((v) => (
            <Link to={`/vehicles/${v._id}`} className="vcard" key={v._id}>
              <div className="vimg"><CategoryArt category={v.category} /></div>
              <div className="vbody">
                <h3>{v.name}</h3>
                <span className="muted small">{v.rental.shopName}, {v.rental.city}</span>
                <span className="muted small">{CATEGORY_INFO[v.category]?.title}{v.rental.distanceKm != null && ` | ${v.rental.distanceKm} km away`}</span>
                <span className="price">{money(v.pricePerDay)} <small>/ day</small></span>
                <MapButton lat={v.rental.lat} lng={v.rental.lng} className="btn ghost sm mapbtn" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
