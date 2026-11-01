// Erzeugt src/data/campWorldMap.ts aus Natural Earth 1:50m (world-atlas 2.0.2, gemeinfrei).
// Aufruf: node scripts/build-camp-map.mjs <countries-50m.json> src/data/campWorldMap.ts
// (countries-50m.json aus dem npm-Paket world-atlas@2.0.2, z. B. via `npm pack world-atlas@2.0.2`)
import { readFileSync, writeFileSync } from 'node:fs';

const topo = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

// Bögen dekodieren (Delta + Quantisierung) → [lon, lat]
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});

const inEurope = ([lon, lat]) => lon > -30 && lon < 50 && lat > 24 && lat < 72;
function tol(arc) {
  const m = arc[Math.floor(arc.length / 2)];
  return inEurope(m) ? 0.04 : 0.22;
}
function dp(pts, eps) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-9;
    let md = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function dpArc(a, eps) {
  const [x0, y0] = a[0], [xn, yn] = a[a.length - 1];
  if (a.length > 3 && Math.hypot(xn - x0, yn - y0) < 1e-9) {
    let far = 1, fd = -1;
    for (let i = 1; i < a.length - 1; i++) { const d = Math.hypot(a[i][0] - x0, a[i][1] - y0); if (d > fd) { fd = d; far = i; } }
    return [...dp(a.slice(0, far + 1), eps), ...dp(a.slice(far), eps).slice(1)];
  }
  return dp(a, eps);
}
const simple = arcs.map((a) => dpArc(a, tol(a)));
const arcPts = (i) => (i >= 0 ? simple[i] : [...simple[~i]].reverse());

const r2 = (v) => Math.round(v * 100) / 100;
function ringPath(pts, closed) {
  let s = '', px = 0, py = 0;
  pts.forEach(([lon, lat], k) => {
    const x = r2(lon), y = r2(-lat);
    if (k === 0) s += `M${x} ${y}`;
    else { const dx = r2(x - px), dy = r2(y - py); if (dx === 0 && dy === 0) return; s += `l${dx} ${dy}`; }
    px = x; py = y;
  });
  return s + (closed ? 'z' : '');
}
function unwrap(pts) {
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i][0] - pts[i - 1][0];
    if (d > 180) pts[i] = [pts[i][0] - 360, pts[i][1]];
    else if (d < -180) pts[i] = [pts[i][0] + 360, pts[i][1]];
  }
}
function area(pts) { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); }

// Land
let land = '';
const landGeo = topo.objects.land.geometries ?? [topo.objects.land];
for (const geo of landGeo) {
  const polys = geo.type === 'Polygon' ? [geo.arcs] : geo.arcs;
  for (const poly of polys) for (const ring of poly) {
    const pts = ring.flatMap((i, k) => (k ? arcPts(i).slice(1) : arcPts(i)));
    if (pts.every(([, lat]) => lat < -58)) continue; // Antarktis weg
    unwrap(pts);
    const a = area(pts);
    const eu = pts.some(inEurope);
    if (a < (eu ? 0.02 : 1.2)) continue; // Kleinstinseln weg
    if (pts.length < 4) continue;
    land += ringPath(pts, true);
  }
}
// Grenzen: Bögen, die zwei Länder teilen
const use = new Map();
for (const geo of topo.objects.countries.geometries) {
  const polys = geo.type === 'Polygon' ? [geo.arcs] : geo.type === 'MultiPolygon' ? geo.arcs : [];
  const seen = new Set();
  for (const poly of polys) for (const ring of poly) for (const i of ring) { const k = i >= 0 ? i : ~i; if (!seen.has(k)) { seen.add(k); use.set(k, (use.get(k) ?? 0) + 1); } }
}
let borders = '';
for (const [k, n] of use) {
  if (n < 2) continue;
  const pts = simple[k];
  if (pts.every(([, lat]) => lat < -58)) continue;
  borders += ringPath(pts, false);
}
const src = `// =============================================================================
// WELTKARTE für den Trainingslager-Planer (views/kader/camp/CampMap.tsx).
// Umrisse und Staatsgrenzen aus Natural Earth 1:50m (gemeinfrei, naturalearthdata.com),
// bezogen über das npm-Paket world-atlas 2.0.2 (ISC, M. Bostock); vereinfacht
// (Douglas-Peucker: Europa 0,04°, Rest 0,22°), Antarktis und Kleinstinseln entfernt.
// Koordinaten: x = Längengrad, y = −Breitengrad (Grad, 2 Nachkommastellen).
// Erzeugt per Skript – nicht von Hand bearbeiten.
// =============================================================================
export const WORLD_LAND = '${land}';
export const WORLD_BORDERS = '${borders}';
`;
writeFileSync(out, src);
console.log("land", land.length, 'borders', borders.length, 'gesamt', src.length);
