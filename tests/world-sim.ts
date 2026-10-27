// Schnelltest der Europa-Simulation ohne restliches Spiel: Dominanz je Land über N Saisons.
import { allEuroClubs } from '../src/data/europe';
import { advanceWorldSeason, initWorld } from '../src/engine/world';

const seasons = Number(process.argv[2] ?? 50);
const euro = allEuroClubs();
const w = initWorld(euro);
const t0 = Date.now();
for (let y = 1975; y < 1975 + seasons; y++) {
  advanceWorldSeason(w, euro, `${y}/${String((y + 1) % 100).padStart(2, '0')}`, y + 1, y >= 1995 ? 3 : 2, undefined, () => false);
}
console.log(`${seasons} Saisons in ${Date.now() - t0} ms, Vereine ${Object.keys(w.meta).length}`);
for (const c of Object.values(w.countries)) {
  if (!c.active) continue;
  const t = Object.entries(c.titles).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => `${euro[id].name} ${n}`).join(', ');
  const top = c.tiers[0].map((id) => euro[id].strength).sort((a, b) => b - a);
  console.log(c.name.padEnd(16), `Top ${top.slice(0, 3).join('/')} Ende ${top[top.length - 1]} | ${t}`);
}
const sizeKB = JSON.stringify(w).length / 1024;
console.log(`Welt-JSON ${sizeKB.toFixed(0)} KB`);
