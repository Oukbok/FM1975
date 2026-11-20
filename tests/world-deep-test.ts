// Tiefere Auslandsligen (Wunsch Pascal): Ebene 3/4 nach Länderrang, Hintergrund über viele Saisons,
// Spieltag-Simulation, Start im Ausland in der 3./4. Ebene, Saisonwechsel, Speichern/Laden.
// Aufruf: node scripts/run-ts.mjs tests/world-deep-test.ts [saisons] [teil]   (teil = welt | start | alle)
import { allEuroClubs } from '../src/data/europe';
import { advanceWorldSeason, initWorld, type WorldState } from '../src/engine/world';
import { worldOverlay } from '../src/engine/worldData';
import { deepGroupsOf, deepIdsOf, updateWorldDepths } from '../src/engine/worldDeep';
import { deepLevelsFor } from '../src/data/world/deepStructure';
import { COUNTRY_BY_KEY, countryExists, seasonLabelOf } from '../src/data/world/countries';
import { secondGroups } from '../src/engine/worldSecond';
import { worldPlacesOf } from '../src/engine/worldPlaces';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const N = Number(process.argv[2] ?? 30);
const PART = process.argv[3] ?? 'alle';
let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log('  FEHLER', msg); } };

/** Jede Ebene hat die Größe der Struktur, kein Verein doppelt, alle Vereine existieren. */
function checkWorld(w: WorldState, euro: Record<string, unknown>, year: number, tag: string): void {
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const all = [...c.tiers[0], ...c.tiers[1], ...deepIdsOf(c), ...(c.pool ?? [])];
    const set = new Set(all);
    ok(set.size === all.length, `${tag} ${c.name}: Verein doppelt (${all.length - set.size})`);
    ok(all.every((id) => euro[id]), `${tag} ${c.name}: Verein fehlt in euroClubs`);
    if (!c.deep?.length) continue;
    const want = deepLevelsFor(COUNTRY_BY_KEY[c.name]?.cc, year, c.depth ?? 2);
    ok(want.length === c.deep.length, `${tag} ${c.name}: Ebenen ${c.deep.length} statt ${want.length}`);
    c.deep.forEach((d, k) => {
      const sizes = deepGroupsOf(c, k).map((g) => g.length);
      const exp = want[k]?.groups ?? [];
      ok(sizes.length === exp.length && Math.abs(sizes.reduce((a, b) => a + b, 0) - exp.reduce((a, b) => a + b, 0)) <= 2, `${tag} ${c.name} Ebene ${k + 3}: ${sizes.join('/')} statt ${exp.join('/')}`);
      ok(sizes.every((n) => n >= 6), `${tag} ${c.name} Ebene ${k + 3}: zu kleine Staffel ${sizes.join('/')}`);
    });
  }
}

if (PART === 'welt' || PART === 'alle') {
  console.log(`== Hintergrund ${N} Saisons (Heimat Deutschland, Start 1975 und 1995) ==`);
  for (const start of [1975, 1995]) {
    const euro = { ...allEuroClubs() };
    const w = initWorld(euro, start, { overlay: worldOverlay({ home: 'ger' }) });
    updateWorldDepths(w, euro, start);
    checkWorld(w, euro, start, `${start}`);
    const depthLog: string[] = [];
    const moves = { up32: 0, down23: 0, up43: 0, down34: 0, upPool: 0 };
    const tierOf = (id: string) => {
      for (const c of Object.values(w.countries)) {
        if (c.tiers[0].includes(id)) return 1;
        if (c.tiers[1].includes(id)) return 2;
        const k = (c.deep ?? []).findIndex((d) => d.ids.includes(id));
        if (k >= 0) return k + 3;
        if (c.pool?.includes(id)) return 9;
      }
      return 0;
    };
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      const y = start + i;
      const depthBefore = new Map(Object.values(w.countries).map((c) => [c.name, c.deep?.length ?? 0]));
      const before = new Map<string, number>();
      for (const c of Object.values(w.countries)) if (c.deep?.length) for (const id of [...c.tiers[1], ...deepIdsOf(c), ...(c.pool ?? [])]) before.set(id, tierOf(id));
      advanceWorldSeason(w, euro, seasonLabelOf(y), y + 1, y >= 1995 ? 3 : 2, undefined, () => false);
      updateWorldDepths(w, euro, y + 1);
      checkWorld(w, euro, y + 1, `${y + 1}`);
      // Wunsch Pascal: keine Liga verschwindet während eines Spiels (außer das Land zerfällt).
      for (const c of Object.values(w.countries)) {
        const was = depthBefore.get(c.name);
        const def = COUNTRY_BY_KEY[c.name];
        if (def && !countryExists(def, y + 1)) continue;
        if (was != null && (c.deep?.length ?? 0) < was) ok(false, `${y + 1}: ${c.name} verliert eine tiefere Ebene (${was} → ${c.deep?.length ?? 0})`);
      }
      for (const [id, t] of before) {
        const n = tierOf(id);
        if (t === 3 && n === 2) moves.up32++;
        if (t === 2 && n === 3) moves.down23++;
        if (t === 4 && n === 3) moves.up43++;
        if (t === 3 && n === 4) moves.down34++;
        if (t === 9 && n >= 3 && n <= 4) moves.upPool++;
      }
      if ((y + 1) % 5 === 0) depthLog.push(`${y + 1}: ` + Object.values(w.countries).filter((c) => c.deep?.length).map((c) => `${c.name} ${c.depth}`).join(', '));
    }
    console.log(`  Start ${start}: ${Date.now() - t0} ms, Bewegungen`, JSON.stringify(moves));
    for (const l of depthLog) console.log('   ', l);
    ok(moves.up32 > 0 && moves.down23 > 0 && moves.up43 > 0 && moves.down34 > 0 && moves.upPool > 0, `Start ${start}: Auf-/Abstieg zwischen allen Ebenen`);
    const eng = w.countries.England;
    const sample = eng?.deep?.[0]?.ids[0];
    if (sample) {
      const pl = worldPlacesOf(w, sample);
      console.log(`  Platzierungen ${euro[sample]?.name}:`, pl.slice(-6).map((p) => `${p.year} E${p.tier} ${p.pos}/${p.size}`).join(' · '));
      ok(pl.some((p) => p.tier >= 3), 'Platzierungs-Historie kennt die 3./4. Ebene');
    }
    console.log("  Unterbau", Object.values(w.countries).filter((c) => c.active && (c.pool?.length ?? 0) > 12).map((c) => `${c.name} ${c.pool!.length}`).join(", "));
    const meta = Object.keys(w.meta).length, eu = Object.keys(euro).length;
    console.log(`  Vereine euroClubs ${eu}, meta ${meta}, JSON Welt ${(JSON.stringify(w).length / 1024).toFixed(0)} KB`);
    ok(Object.values(w.countries).some((c) => (secondGroups(c).length ?? 0) > 0), 'Länder mit 2. Ebene');
  }
}

if (PART === 'start' || PART === 'alle') {
  const { runStartChecks } = await import('./world-deep-start');
  fails += await runStartChecks();
}

console.log(fails ? `\n${fails} FEHLER` : '\nAlles in Ordnung.');
process.exit(fails ? 1 : 0);
