import { useEffect, useRef, useState } from 'react';
import { Stars, fmtDate } from './ui';
import '../home-extras.css';

// Auto-sliding customer reviews. Pauses on hover/touch, has arrows + dots, no autoplay if the user prefers reduced motion.
export default function ReviewSlider({ reviews }) {
  const track = useRef(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = reviews.length;

  const step = () => { const t = track.current; const c = t?.children[0]; return c ? c.getBoundingClientRect().width + 16 : 0; };
  const go = (i) => { const t = track.current; if (!t) return; const k = (i + n) % n; t.scrollTo({ left: k * step(), behavior: 'smooth' }); setIdx(k); };

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => go(idx + 1), 4500);
    return () => clearInterval(id);
  });

  const onScroll = () => { const s = step(); if (s) setIdx(Math.round(track.current.scrollLeft / s)); };

  if (!n) return null;
  return (
    <section className="hx-sec" aria-label="Customer reviews">
      <div className="hx-head"><h2>What riders say</h2><p className="muted">Real reviews from completed rides</p></div>
      <div className="rs" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
        <div className="rs-track" ref={track} onScroll={onScroll}>
          {reviews.map((r) => (
            <article className="rs-card" key={r._id}>
              <Stars value={r.rating} size={18} />
              <p className="rs-text">“{r.comment}”</p>
              <div className="rs-by"><span className="rs-av">{r.customer[0]}</span><div><b>{r.customer}</b><span className="muted small">{r.vehicle}{r.shop ? ` | ${r.shop}` : ''}{r.city ? `, ${r.city}` : ''}</span></div></div>
            </article>
          ))}
        </div>
        {n > 1 && <>
          <button type="button" className="rs-nav prev" aria-label="Previous review" onClick={() => go(idx - 1)}>‹</button>
          <button type="button" className="rs-nav next" aria-label="Next review" onClick={() => go(idx + 1)}>›</button>
          <div className="rs-dots">{reviews.map((r, i) => <button type="button" key={r._id} className={i === idx ? 'on' : ''} aria-label={`Review ${i + 1}`} onClick={() => go(i)} />)}</div>
        </>}
      </div>
    </section>
  );
}
