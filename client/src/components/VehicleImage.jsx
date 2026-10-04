import { useState } from 'react';

export const CATEGORY_INFO = {
  all: { title: 'All vehicles', desc: 'Everything available near you, in one place.' },
  scooty: { title: 'Scooty', desc: 'Easy city rides. Light, simple and perfect for daily errands and short trips.' },
  bike: { title: 'Bike', desc: 'Everyday freedom. Comfortable rides for work, college and weekend getaways.' },
  'sport-heavy-bike': { title: 'Sport / Heavy Bike', desc: 'Feel the open road. Powerful machines for riders who love speed and thrill.' },
  car: { title: 'Car - 5 Seater', desc: 'Comfort for the whole family. Smooth drives and relaxed trips with five seats.' },
  suv: { title: 'SUV - 7 Seater', desc: 'Room for every adventure. Seven seats and space for luggage and good company.' },
};

const Wheel = ({ x, y = 104, r = 16 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#0B141B" stroke="#D5DADD" strokeWidth="3" />
    <circle cx={x} cy={y} r={r / 3} fill="#D5DADD" />
  </g>
);

const ART = {
  scooty: (c) => (
    <>
      <Wheel x={62} r={15} /><Wheel x={180} r={15} />
      <path d="M72 98Q66 68 94 68H114V98Z" fill={c} />
      <rect x="92" y="60" width="52" height="10" rx="5" fill="#0B141B" />
      <path d="M112 98H150Q158 98 162 88L170 58H156L146 84H112Z" fill={c} />
      <path d="M170 58L178 36M168 36H190" stroke="#D5DADD" strokeWidth="4" strokeLinecap="round" />
      <path d="M170 58L180 104" stroke="#D5DADD" strokeWidth="4" />
    </>
  ),
  bike: (c) => (
    <>
      <Wheel x={58} r={18} /><Wheel x={184} r={18} />
      <path d="M100 58Q122 44 148 56L142 72H100Z" fill={c} />
      <path d="M62 62H104V70H58Z" fill="#0B141B" />
      <rect x="102" y="72" width="40" height="24" rx="4" fill="#3A4F5F" />
      <path d="M58 104L102 88M142 80L184 104M158 54L184 104M154 50H174" stroke="#D5DADD" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 92H96" stroke="#8A9AA5" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  'sport-heavy-bike': (c) => (
    <>
      <Wheel x={56} r={19} /><Wheel x={186} r={19} />
      <path d="M98 92L120 52L172 62L196 92Z" fill={c} />
      <path d="M150 62L164 36L176 64Z" fill="#9FD3F5" opacity=".85" />
      <path d="M56 70L108 60L114 80L66 86Z" fill={c} />
      <path d="M108 60L130 52" stroke="#0B141B" strokeWidth="6" strokeLinecap="round" />
      <rect x="112" y="90" width="44" height="12" rx="4" fill="#3A4F5F" />
      <path d="M56 104L100 92M172 62L186 104" stroke="#D5DADD" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  car: (c) => (
    <>
      <path d="M24 98V82Q24 74 34 72L66 66L88 44Q92 40 98 40H150Q158 40 162 46L182 68L212 74Q220 76 220 84V98Z" fill={c} />
      <path d="M96 48H122V66H78ZM130 48H152Q155 48 157 51L170 66H130Z" fill="#12202B" opacity=".88" />
      <rect x="24" y="90" width="196" height="8" fill="#0B141B" opacity=".25" />
      <rect x="206" y="78" width="12" height="6" rx="3" fill="#FFF3C4" />
      <Wheel x={70} y={100} /><Wheel x={178} y={100} />
    </>
  ),
  suv: (c) => (
    <>
      <path d="M20 98V64Q20 56 28 54H150Q160 54 166 62L186 78L214 82Q222 84 222 92V98Z" fill={c} />
      <path d="M30 40H150" stroke="#D5DADD" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 40V54M142 40V54" stroke="#D5DADD" strokeWidth="3" />
      <path d="M34 60H66V78H34ZM72 60H108V78H72ZM114 60H148Q151 60 153 63L164 78H114Z" fill="#12202B" opacity=".88" />
      <rect x="208" y="84" width="12" height="6" rx="3" fill="#FFF3C4" />
      <Wheel x={68} y={100} r={18} /><Wheel x={178} y={100} r={18} />
    </>
  ),
};
const COLORS = { scooty: '#2DD4BF', bike: '#F2B705', 'sport-heavy-bike': '#F25C54', car: '#60A5FA', suv: '#34D399' };

// Category photo from client/public/images/<category>.jpg
// (scooty.jpg, bike.jpg, sport-heavy-bike.jpg, car.jpg, suv.jpg).
// If the photo is missing, the old SVG drawing is shown instead.
export function CategoryArt({ category }) {
  const [noPhoto, setNoPhoto] = useState(false);
  const draw = ART[category];
  if (category === 'all') return noPhoto ? <span className="allmark">All</span> : <img src="/images/all.jpg" alt="All vehicles" loading="lazy" onError={() => setNoPhoto(true)} />;
  if (!draw) return <span>{CATEGORY_INFO[category]?.title || 'Vehicle'}</span>;
  if (!noPhoto) {
    return <img src={`/images/${category}.jpg`} alt={CATEGORY_INFO[category].title} loading="lazy" onError={() => setNoPhoto(true)} />;
  }
  return (
    <svg viewBox="0 0 240 140" role="img" aria-label={CATEGORY_INFO[category].title}>
      <ellipse cx="120" cy="124" rx="96" ry="6" fill="#000" opacity=".25" />
      {draw(COLORS[category])}
    </svg>
  );
}

// Owner's image if it loads, otherwise the category photo (or drawing)
export function VehicleImage({ category, src, alt }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) return <img src={src} alt={alt || ''} loading="lazy" onError={() => setBad(true)} />;
  return <CategoryArt category={category} />;
}
