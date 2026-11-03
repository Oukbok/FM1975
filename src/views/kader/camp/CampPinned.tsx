// =============================================================================
// TRAININGSLAGER-PLANER – „aufgeklebte“ Zettel auf dem Ortsbild (Vorbild EA FM):
// Länderkarte als Polaroid mit Markierung (Natural Earth aus data/campWorldMap.ts,
// Heimatort als kleines Quadrat) und Skizze der Anlage (Plätze, Halle, Kunstrasen,
// Unterkunft, Laufstrecke) nach data/campLodgings.ts. Farben: Tokens `--paper-*`.
// =============================================================================
import type { CampDestination } from '../../../data/campDestinations';
import type { CampLodging } from '../../../data/campLodgings';
import { WORLD_BORDERS, WORLD_LAND } from '../../../data/campWorldMap';
import { hasHall, hasTurf } from '../../../engine/trainingCamp';

type LatLon = [number, number];

/** Ausschnitt der Länderkarte: Deutschland, Alpenraum oder rund um das Ziel. */
function insetBox(d: CampDestination, home: LatLon | null): { lon: [number, number]; lat: [number, number] } {
  if (d.region === 'inland' || d.region === 'kueste' || d.region === 'mittelgebirge') return { lon: [5.6, 15.2], lat: [47.2, 55.1] };
  if (d.region === 'alpen') return { lon: [5.8, 17], lat: [45.6, 54.6] };
  const [lat, lon] = d.geo;
  const near = home && Math.abs(home[0] - lat) < 22 && Math.abs(home[1] - lon) < 30;
  if (d.region === 'sueden' && near) {
    // Heimat und Ziel zusammen zeigen (Reiseweg)
    const lo = [Math.min(home![1], lon) - 3, Math.max(home![1], lon) + 3], la = [Math.min(home![0], lat) - 2.5, Math.max(home![0], lat) + 2.5];
    return { lon: lo as [number, number], lat: la as [number, number] };
  }
  const r = d.region === 'fern' ? 16 : 9;
  return { lon: [lon - r, lon + r], lat: [lat - r * 0.75, lat + r * 0.75] };
}

export function CountryInset({ d, home }: { d: CampDestination; home: LatLon | null }) {
  const W = 220, H = 220;
  const b = insetBox(d, home);
  const phi = ((b.lat[0] + b.lat[1]) / 2) * Math.PI / 180;
  const c = Math.cos(phi);
  const vw = (b.lon[1] - b.lon[0]) * c, vh = b.lat[1] - b.lat[0];
  const k = Math.min(W / vw, H / vh);
  const ox = (W - vw * k) / 2 - b.lon[0] * c * k, oy = (H - vh * k) / 2 + b.lat[1] * k;
  const P = (lat: number, lon: number) => ({ x: ox + lon * c * k, y: oy - lat * k });
  const p = P(d.geo[0], d.geo[1]);
  const h = home ? P(home[0], home[1]) : null;
  const inside = (q: { x: number; y: number }) => q.x > 4 && q.x < W - 4 && q.y > 4 && q.y < H - 4;
  return (
    <svg className="pin-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Lage: ${d.place}`}>
      <rect width={W} height={H} className="pin-sea" />
      <g transform={`translate(${ox} ${oy}) scale(${c * k} ${k})`}>
        <path d={WORLD_LAND} className="pin-land" vectorEffect="non-scaling-stroke" />
        <path d={WORLD_BORDERS} className="pin-border" vectorEffect="non-scaling-stroke" />
      </g>
      {h && inside(h) && Math.hypot(h.x - p.x, h.y - p.y) > 14 && (
        <g className="pin-home">
          <line x1={h.x} y1={h.y} x2={p.x} y2={p.y} className="pin-route" />
          <rect x={h.x - 3} y={h.y - 3} width={6} height={6} />
        </g>
      )}
      <circle cx={p.x} cy={p.y} r={9} className="pin-ring" />
      <circle cx={p.x} cy={p.y} r={2.4} className="pin-dot" />
    </svg>
  );
}

/** Skizze der Anlage (Draufsicht), deterministisch aus der Unterkunft. */
export function FacilitySketch({ d, l, year }: { d: CampDestination; l: CampLodging; year: number }) {
  const W = 300, H = 210;
  const n = Math.max(1, Math.min(6, l.pitches));
  const turf = hasTurf(l, year), hall = hasHall(l, year);
  const water = d.region === 'kueste' || d.region === 'sueden' || d.id === 'tegernsee' || d.id === 'kaernten' || l.runs === 'strand' || l.runs === 'duenen';
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const pw = cols === 3 ? 50 : 56, ph = 36, gx = 8, gy = 10;
  const x0 = 120, y0 = 30;
  const pitches = Array.from({ length: n }, (_, i) => ({ x: x0 + (i % cols) * (pw + gx), y: y0 + Math.floor(i / cols) * (ph + gy), turf: turf && i === n - 1 }));
  const hotelW = l.kind === 'resort' ? 70 : l.kind === 'pension' ? 34 : 52;
  const hotelLabel = l.kind === 'sportschule' ? 'Schule' : l.kind === 'pension' ? 'Pension' : l.kind === 'zentrum' ? 'Zentrum' : 'Hotel';
  return (
    <svg className="pin-sketch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Skizze: ${l.name}`}>
      <rect width={W} height={H} className="sk-paper" />
      {water && <path d={`M0 ${H - 34} Q80 ${H - 52} 160 ${H - 38} T${W} ${H - 46} L${W} ${H} L0 ${H} Z`} className="sk-water" />}
      {l.runs === 'berg' && [0, 1, 2].map((i) => <path key={i} d={`M${-10 + i * 8} ${H - 10 - i * 16} Q60 ${H - 60 - i * 14} 110 ${H - 20 - i * 18}`} className="sk-contour" />)}
      <path d={`M0 ${y0 + rows * (ph + gy) + 8} Q${W / 2} ${y0 + rows * (ph + gy) - 6} ${W} ${y0 + rows * (ph + gy) + 12}`} className="sk-road" />
      <path d="M100 0 Q96 60 108 120 T104 210" className="sk-road minor" />
      {l.runs && (
        <path d={`M24 ${H - 18} Q14 120 40 80 T80 22 Q110 8 112 30`} className="sk-trail" />
      )}
      {(l.runs === 'wald' || l.runs === 'berg') && Array.from({ length: 12 }, (_, i) => <circle key={i} cx={14 + (i * 37) % 80} cy={20 + ((i * 53) % 150)} r={5} className="sk-tree" />)}
      {pitches.map((q, i) => (
        <g key={i} className={`sk-pitch ${q.turf ? 'turf' : ''}`}>
          <rect x={q.x} y={q.y} width={pw} height={ph} />
          <path d={`M${q.x + pw / 2} ${q.y} L${q.x + pw / 2} ${q.y + ph} M${q.x} ${q.y + ph / 2 - 7} h6 v14 h-6 M${q.x + pw} ${q.y + ph / 2 - 7} h-6 v14 h6`} className="sk-line" />
          <circle cx={q.x + pw / 2} cy={q.y + ph / 2} r={5} className="sk-line" />
        </g>
      ))}
      <g className="sk-building">
        <rect x={20} y={22} width={hotelW} height={30} />
        <text x={20 + hotelW / 2} y={41} textAnchor="middle">{hotelLabel}</text>
      </g>
      {hall && (
        <g className="sk-building hall">
          <rect x={22} y={62} width={44} height={26} />
          <text x={44} y={79} textAnchor="middle">Halle</text>
        </g>
      )}
      <text x={W - 8} y={H - 8} textAnchor="end" className="sk-note">
        {n} {n === 1 ? 'Platz' : 'Plätze'}{turf ? ' · Kunstrasen' : ''}{l.runs ? ' · Laufstrecke' : ''}
      </text>
    </svg>
  );
}
