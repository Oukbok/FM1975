// =============================================================================
// Vorschau „Nächstes Spiel“ – Karte mit beiden Vereinsorten und Luftlinie.
// Umrisse/Grenzen: Natural Earth aus data/campWorldMap.ts (wie der Trainingslager-Planer),
// Lage der Orte aus data/prematch/cityGeo.ts. Ausschnitt Deutschland oder – sobald ein
// Ort im Ausland liegt – passend um beide Orte (mindestens ein Stück Europa).
// =============================================================================
import { WORLD_BORDERS, WORLD_LAND } from '../../data/campWorldMap';
import type { LatLon } from '../../data/prematch/cityGeo';
import type { PrematchData, PrematchSide } from '../../game/prematch';

const W = 520, H = 440;
const DE_BOX = { lon: [5.4, 15.6], lat: [47.1, 55.2] } as const;

function boxFor(d: PrematchData): { lon: [number, number]; lat: [number, number] } {
  if (d.mapKind === 'de' || !d.home.geo || !d.away.geo) return { lon: [...DE_BOX.lon], lat: [...DE_BOX.lat] };
  const pts = [d.home.geo, d.away.geo];
  let lat0 = Math.min(...pts.map((p) => p[0])), lat1 = Math.max(...pts.map((p) => p[0]));
  let lon0 = Math.min(...pts.map((p) => p[1])), lon1 = Math.max(...pts.map((p) => p[1]));
  // Rand + Mindestgröße (sonst wirkt ein Nachbarland wie ein Stadtplan)
  const padLat = Math.max(2.5, (lat1 - lat0) * 0.25), padLon = Math.max(3.5, (lon1 - lon0) * 0.2);
  lat0 -= padLat; lat1 += padLat; lon0 -= padLon; lon1 += padLon;
  const minLat = 11, minLon = 14;
  if (lat1 - lat0 < minLat) { const m = (lat0 + lat1) / 2; lat0 = m - minLat / 2; lat1 = m + minLat / 2; }
  if (lon1 - lon0 < minLon) { const m = (lon0 + lon1) / 2; lon0 = m - minLon / 2; lon1 = m + minLon / 2; }
  return { lon: [lon0, lon1], lat: [lat0, lat1] };
}

export function PrematchMap({ d }: { d: PrematchData }) {
  const b = boxFor(d);
  const phi = ((b.lat[0] + b.lat[1]) / 2) * (Math.PI / 180);
  const c = Math.cos(phi);
  const vw = (b.lon[1] - b.lon[0]) * c, vh = b.lat[1] - b.lat[0];
  const k = Math.min(W / vw, H / vh);
  const ox = (W - vw * k) / 2 - b.lon[0] * c * k;
  const oy = (H - vh * k) / 2 + b.lat[1] * k;
  const proj = (p: LatLon) => ({ x: ox + p[1] * c * k, y: oy - p[0] * k });
  const sides: PrematchSide[] = [d.home, d.away].filter((s) => s.geo);
  const pts = sides.map((s) => ({ s, p: proj(s.geo!) }));
  const same = pts.length === 2 && Math.hypot(pts[0].p.x - pts[1].p.x, pts[0].p.y - pts[1].p.y) < 4;
  return (
    <div className="pm-map">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img"
        aria-label={`Karte: ${d.home.city} und ${d.away.city}`}>
        <rect width={W} height={H} className="pm-sea" />
        <g transform={`matrix(${c * k} 0 0 ${k} ${ox} ${oy})`}>
          <path d={WORLD_LAND} className="pm-land" vectorEffect="non-scaling-stroke" />
          <path d={WORLD_BORDERS} className="pm-border" vectorEffect="non-scaling-stroke" />
        </g>
        {pts.length === 2 && !same && (
          <line className="pm-route" x1={pts[0].p.x} y1={pts[0].p.y} x2={pts[1].p.x} y2={pts[1].p.y} />
        )}
        {pts.map(({ s, p }, i) => {
          const leftLabel = p.x > W * 0.62;
          const dy = same ? (i === 0 ? -12 : 14) : 5;
          return (
            <g key={s.id} className={`pm-pin ${s.mine ? 'mine' : ''}`}>
              <circle cx={p.x} cy={p.y} r={9} className="pm-pin-ring" />
              <circle cx={p.x} cy={p.y} r={4.5} className="pm-pin-dot" />
              <text x={leftLabel ? p.x - 14 : p.x + 14} y={p.y + dy} textAnchor={leftLabel ? 'end' : 'start'} className="pm-pin-label">{s.city}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
