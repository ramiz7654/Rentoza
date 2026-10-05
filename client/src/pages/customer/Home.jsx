import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getLoc, setLoc } from '../../services/api';
import { askLocationDetailed, locationPermission } from '../../services/location';
import { Msg, Empty } from '../../components/ui';
import { CATEGORY_INFO, CategoryArt } from '../../components/VehicleImage';
import ReviewSlider from '../../components/ReviewSlider';
import VehicleCard from '../../components/VehicleCard';
import VehicleSlider from '../../components/VehicleSlider';
import LocationPrompt from '../../components/LocationPrompt';
import Footer from '../../components/Footer';
import '../../home-extras.css';

export default function Home() {
  const nav = useNavigate();
  const [text, setText] = useState(''); // what is typed
  const [q, setQ] = useState('');       // what is actually searched (after tapping Search)
  const [sort, setSort] = useState('nearest');
  const [loc, setLocState] = useState(getLoc());
  const [radius, setRadius] = useState(25);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [locMsg, setLocMsg] = useState('');
  const [askLoc, setAskLoc] = useState(false); // shows the Allow location pop-up
  const resultsRef = useRef(null);
  const scrollNext = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ category: 'all', sort });
      if (q.trim()) p.set('q', q.trim());
      if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng); p.set('radius', radius); }
      setLoading(true);
      api('/vehicles?' + p).then((d) => { setList(d.vehicles); setErr(''); }).catch((e) => setErr(e.message)).finally(() => { setLoading(false); if (scrollNext.current) { scrollNext.current = false; resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    }, 250);
    return () => clearTimeout(t);
  }, [q, sort, loc, radius]);

  // after login: ask for location once per login. If the browser already allowed it we use it silently,
  // if it is blocked we show how to unblock, otherwise we show our own "Allow location" pop-up first.
  useEffect(() => {
    const tok = sessionStorage.getItem('token') || '1';
    if (getLoc() || sessionStorage.getItem('rentoza_loc_asked') === tok) return;
    sessionStorage.setItem('rentoza_loc_asked', tok);
    locationPermission().then(async (st) => {
      if (st === 'denied') return setLocMsg('Location is blocked for this site, so vehicles from all shops are shown. To see nearby shops: click the lock icon next to the web address, set Location to Allow, then press Find near me.');
      if (st === 'granted') { try { gotLoc(await askLocationDetailed()); } catch (e) { setLocMsg(e.message); } return; }
      setAskLoc(true);
    });
  }, []);

  useEffect(() => { api('/reviews/featured').then((d) => setReviews(d.reviews)).catch(() => {}); }, []);

  const gotLoc = (l) => { setLoc(l); setLocState(l); setSort('nearest'); setLocMsg(''); setAskLoc(false); };
  const useLoc = async () => {
    try { gotLoc(await askLocationDetailed()); } catch (e) { setLocMsg(e.message); }
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
            <button key={key} className="catcard" onClick={() => nav(`/category/${key}`)}>
              <div className="catart"><CategoryArt category={key} /></div>
              <div className="catshade" />
              <div className="catbody"><b>{c.title}</b><span>{c.desc}</span></div>
            </button>
          ))}
        </div>
        <div className="hx-results-head" ref={resultsRef} style={{ scrollMarginTop: 76 }}>
          <h2>{q ? `Results for "${q}"` : loc ? 'Vehicles near you' : 'Available vehicles'}<small>{loading ? 'Loading...' : `${list.length} found`}</small>
            {q && <button type="button" className="btn ghost sm" style={{ marginLeft: 10 }} onClick={() => { setQ(''); setText(''); }}>Clear search</button>}</h2>
          <div className="row">
            {loc && <select value={radius} onChange={(e) => setRadius(e.target.value)} aria-label="Radius">{[5, 10, 25, 50, 100].map((r) => <option key={r} value={r}>Within {r} km</option>)}</select>}
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="nearest">Nearest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
              <option value="name">Vehicle name</option><option value="shop">Shop name</option>
            </select>
          </div>
        </div>
        <Msg type="info">{locMsg}</Msg>
        <Msg>{err}</Msg>
        {!loading && !list.length && <Empty>{q ? `No vehicles found for "${q}". Search another city, state or area (use Clear search to go back).` : 'No vehicles found. Try another category, a larger radius or a different search.'}</Empty>}
        {q
          ? <div className="grid">{list.map((v) => <VehicleCard v={v} key={v._id} />)}</div>
          : <VehicleSlider vehicles={list} />}

        <ReviewSlider reviews={reviews} />

        <section className="hx-sec">
          <div className="hx-head"><h2>How Rentoza works</h2></div>
          <div className="hx-steps">
            <div className="hx-step"><div className="num">1</div><h3>Find a vehicle</h3><p>Search by city or shop, or tap Find near me to see the closest rental shops first.</p></div>
            <div className="hx-step"><div className="num">2</div><h3>Send a booking request</h3><p>Pick your dates. The shop owner confirms your booking and you can track it in My Bookings.</p></div>
            <div className="hx-step"><div className="num">3</div><h3>Pick up and ride</h3><p>Open the shop on the map, collect your vehicle, enjoy the ride and leave a review afterwards.</p></div>
          </div>
        </section>

        <section className="hx-sec">
          <div className="hx-head"><h2>Why Rentoza</h2></div>
          <div className="hx-why">
            <div><b>Verified shops</b><span>Every rental shop is checked and approved by our team before it is listed.</span></div>
            <div><b>Clear daily prices</b><span>See the price per day up front, with the total shown before you book.</span></div>
            <div><b>Nearest first</b><span>Sort by distance and open the exact shop location in Google Maps.</span></div>
            <div><b>Honest reviews</b><span>Only riders who completed a booking can leave a review.</span></div>
          </div>
        </section>
      </main>
      {askLoc && <LocationPrompt onGot={gotLoc} onClose={() => setAskLoc(false)} />}
      <Footer />
    </>
  );
}
