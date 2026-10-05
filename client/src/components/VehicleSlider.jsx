import { useEffect, useRef, useState } from 'react';
import VehicleCard from './VehicleCard';
import '../home-extras.css';

const GAP = 16;
const MIN_CARD = 260; // a card is never narrower than this, so the number of cards that fit is always whole

// Dashboard only: ONE row of vehicle cards. As many cards as the screen fits; the rest slide in automatically
// from the right, one card at a time, while the left card leaves. If everything already fits, nothing moves.
export default function VehicleSlider({ vehicles }) {
  const track = useRef(null);
  const [paused, setPaused] = useState(false);
  const [loopable, setLoopable] = useState(false);
  const [cardW, setCardW] = useState(null);
  const n = vehicles.length;

  const step = () => { const c = track.current?.children[0]; return c ? c.getBoundingClientRect().width + GAP : 0; };

  // Fit a whole number of cards in the row (never a half card): 1 on phones, 2-4 on wider screens. Cards stretch a little to fill the row.
  useEffect(() => {
    const t = track.current;
    if (!t) return undefined;
    const measure = () => {
      const w = t.clientWidth;
      if (!w) return;
      const visible = Math.max(1, Math.floor((w + GAP) / (MIN_CARD + GAP)));
      const next = Math.floor((w - GAP * (visible - 1)) / visible);
      setCardW((old) => { if (old !== next) t.scrollLeft = 0; return next; });
      setLoopable(n > visible);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(t);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, [n]);

  const move = (dir) => {
    const t = track.current; const s = step();
    if (!t || !s) return;
    const setW = n * s;
    if (dir > 0 && t.scrollLeft >= setW - 2) t.scrollLeft -= setW;      // jump back one full set (unnoticeable), then keep sliding
    if (dir < 0 && t.scrollLeft <= 2) t.scrollLeft += setW;
    t.scrollTo({ left: t.scrollLeft + dir * s, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loopable || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => move(1), 3200);
    return () => clearInterval(id);
  });

  const items = loopable ? [...vehicles, ...vehicles] : vehicles;
  return (
    <div className="vs" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}>
      <div className="vs-track" ref={track}>
        {items.map((v, i) => <div className="vs-item" style={cardW ? { width: cardW } : undefined} key={`${v._id}-${i >= n ? 'b' : 'a'}`} aria-hidden={i >= n ? 'true' : undefined}><VehicleCard v={v} /></div>)}
      </div>
      {loopable && <>
        <button type="button" className="rs-nav prev" aria-label="Previous vehicles" onClick={() => move(-1)}>‹</button>
        <button type="button" className="rs-nav next" aria-label="Next vehicles" onClick={() => move(1)}>›</button>
      </>}
    </div>
  );
}