// Schnelltest der Auslandsligen ohne restliches Spiel: Dominanz je Land über N Saisons –
// alte Rechnung (Saison in einem Zug, engine/world.ts `playLeague`) gegen die Spieltag-Simulation
// (game/worldLeagues.ts). Beide nutzen dasselbe Tor-Modell; die Werte sollen nah beieinander liegen.
//   node scripts/run-ts.mjs tests/world-sim.ts [saisons]
import { allEuroClubs } from '../src/data/europe';
import { advanceWorldSeason, initWorld } from '../src/engine/world';
import { leanTable, worldLiveResults } from '../src/game/worldLeagues';

const seasons = Number(process.argv[2] ?? 50);
for (const lean of [false, true]) {
  const euro = allEuroClubs();
  const w = initWorld(euro);
  const t0 = Date.now();
  let favWins = 0, n = 0;
  const ptsTop: number[] = [], ptsLast: number[] = [], gpg: number[] = [];
  for (let y = 1975; y < 1975 + seasons; y++) {
    const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
    const g: any = { world: w, euroClubs: euro, season, homeCountry: 'ger' };
    const fav: Record<string, string> = {};
    for (const c of Object.values(w.countries)) if (c.active) fav[c.name] = [...c.tiers[0]].sort((a, b) => euro[b].strength - euro[a].strength)[0];
    const lr = lean ? worldLiveResults(g) : null;
    const d = lr?.divs['England']?.[0];
    if (d) {
      const t = leanTable(d, 'England', season);
      ptsTop.push(t[0].pts / t[0].p); ptsLast.push(t[t.length - 1].pts / t[t.length - 1].p);
      gpg.push(t.reduce((a, r) => a + r.gf, 0) / (t.reduce((a, r) => a + r.p, 0) / 2));
    }
    advanceWorldSeason(w, euro, season, y + 1, y >= 1995 ? 3 : 2, undefined, () => false, lr?.fixed);
    w.live = undefined;
    const rec = w.history.at(-1)!;
    if (lr) rec.divs = lr.divs;
    for (const [k, id] of Object.entries(rec.champions)) { n++; if (fav[k] === id) favWins++; }
  }
  const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);
  console.log(`\n${lean ? 'SPIELTAGE (game/worldLeagues.ts)' : 'IN EINEM ZUG (alt)'}: ${seasons} Saisons in ${Date.now() - t0} ms · stärkster Verein wird Meister: ${(100 * favWins / n).toFixed(0)} % · Welt-JSON ${(JSON.stringify(w).length / 1024).toFixed(0)} KB`);
  if (ptsTop.length) console.log(`England: Punkte/Spiel Meister ${avg(ptsTop)}, Letzter ${avg(ptsLast)}, Tore/Spiel ${avg(gpg)}`);
  for (const name of ['England', 'Italien', 'Spanien', 'Frankreich', 'Niederlande', 'Schottland', 'Portugal']) {
    const c = w.countries[name];
    if (!c) continue;
    const e = Object.entries(c.titles).sort((a, b) => b[1] - a[1]);
    console.log(name.padEnd(12), `${String(e.length).padStart(2)} Meister | ` + e.slice(0, 5).map(([id, k]) => `${euro[id].name} ${k}`).join(', '));
  }
}
