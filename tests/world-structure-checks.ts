// Prüfungen der historischen Ligastruktur im Ausland (data/world/structure.ts):
//  1. Struktur-Funktion: gerade Größen, Auf-/Abstieg ≥ 0, Aufsteiger − Absteiger = Größenänderung,
//     Stichproben gegen die Geschichte (England 1995/96 20, Italien 1988/89 18, Spanien 1995/96 22 …).
//  2. Hintergrund-Welt 1975 + n Saisons mit Spieltag-Simulation: je Land und Saison Größe = Struktur,
//     keine Doppelten (1./2. Liga/Unterbau), keine leeren Ligen, gerade Größen, Spieltage = 2 × (n − 1).
//  3. Heimatland England 1994/95 → 1995/96 (22 → 20) und Frankreich 1992/93 → 1993/94 (zwei Staffeln → eine).
//   node scripts/run-ts.mjs tests/world-structure-checks.ts [saisons] [ohne-heimat]
import { allEuroClubs } from '../src/data/europe';
import { COUNTRY_BY_KEY } from '../src/data/world/countries';
import { backgroundSecondSize, worldStructureFor } from '../src/data/world/structure';
import { advanceWorldSeason, initWorld } from '../src/engine/world';
import { worldOverlay } from '../src/engine/worldData';
import { ensureWorldLive, leanMatchdays, worldLiveResults } from '../src/game/worldLeagues';

const seasons = Number(process.argv[2] ?? 50);
const skipHome = process.argv[3] === 'ohne-heimat';
let fails = 0;
const check = (ok: boolean, msg: string) => { if (!ok) { fails++; if (fails <= 40) console.log('  FEHLER', msg); } };

// --- 1) Struktur-Funktion ------------------------------------------------------
const CCS = ['eng', 'ita', 'esp', 'fra', 'ned', 'por', 'ger', 'sco', 'bel', 'tur', 'urs', 'aut', 'gre'];
for (const cc of CCS) {
  for (let y = 1975; y <= 2030; y++) {
    const s = worldStructureFor(cc, y), p = worldStructureFor(cc, y - 1);
    if (!s) continue;
    check(s.t1 % 2 === 0 && s.t1 >= 4, `${cc} ${y}: 1. Liga ${s.t1}`);
    check(s.t2 == null || s.t2 % 2 === 0, `${cc} ${y}: 2. Ebene ${s.t2}`);
    check(s.up >= 0 && s.down >= 0, `${cc} ${y}: Auf ${s.up} Ab ${s.down}`);
    if (p && s.src === 'data') check(s.up - s.down === s.t1 - p.t1, `${cc} ${y}: Auf−Ab ${s.up - s.down} ≠ ${s.t1 - p.t1}`);
  }
}
const SAMPLES: [string, number, number, number | null][] = [
  // Land, Saison, 1. Liga, 2. Ebene (gesamt) – Quellen: docs/recherche/ligastruktur-ausland.md
  ['eng', 1986, 22, 22], ['eng', 1987, 20, 22], ['eng', 1988, 20, 24], ['eng', 1991, 22, 24], ['eng', 1995, 20, 24],
  ['ita', 1987, 16, 20], ['ita', 1988, 18, 20], ['ita', 2004, 20, 22],
  ['esp', 1986, 18, 18], ['esp', 1987, 20, 20], ['esp', 1995, 22, 20], ['esp', 1997, 20, 22],
  ['fra', 1992, 20, 36], ['fra', 1993, 20, 22], ['fra', 1997, 18, 22], ['fra', 2002, 20, 20], ['fra', 2023, 18, 20],
  ['ned', 1990, 18, 20], ['ned', 2019, 18, 16],
  ['por', 1986, 16, null], ['por', 1987, 20, null], ['por', 1989, 18, 54], ['por', 1990, 20, 20], ['por', 1991, 18, 18],
  ['ger', 1994, 18, 18], ['ger', 1993, 18, 20],
];
for (const [cc, y, t1, t2] of SAMPLES) {
  const s = worldStructureFor(cc, y)!;
  check(s.t1 === t1 && s.t2 === t2, `${cc} ${y}: ${s.t1}/${s.t2} statt ${t1}/${t2}`);
}
const e95 = worldStructureFor('eng', 1995)!;
check(e95.up === 2 && e95.down === 4, `eng 1995: Auf ${e95.up}/Ab ${e95.down} statt 2/4`);
const i88 = worldStructureFor('ita', 1988)!;
check(i88.up === 4 && i88.down === 2, `ita 1988: Auf ${i88.up}/Ab ${i88.down} statt 4/2`);
const n19 = worldStructureFor('ned', 2020)!;
check(n19.up === 0 && n19.down === 0, `ned 2020 (Saison 2019/20 ohne Abstieg): ${n19.up}/${n19.down}`);
const late = worldStructureFor('eng', 2040)!;
check(late.t1 === 20 && late.src === 'carry' && late.up === late.down, `eng 2040 fortgeschrieben: ${JSON.stringify(late)}`);
console.log(`1) Struktur-Funktion: ${fails ? fails + ' Fehler' : 'ok'}`);

// --- 2) Hintergrund-Welt ---------------------------------------------------------
const f0 = fails;
const t0 = Date.now();
const euro = allEuroClubs();
const w = initWorld(euro, 1975, { overlay: worldOverlay({ home: 'ger' }) });
const decade: Record<string, Record<number, string>> = {};
const verify = (y: number, when: string) => {
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const [a, b] = c.tiers;
    const all = [...a, ...b, ...(c.pool ?? [])];
    check(new Set(all).size === all.length, `${c.name} ${y} ${when}: doppelte Vereine`);
    check(a.length >= 4, `${c.name} ${y} ${when}: 1. Liga leer/zu klein (${a.length})`);
    check(a.length % 2 === 0 && b.length % 2 === 0, `${c.name} ${y} ${when}: ungerade ${a.length}/${b.length}`);
    check(all.every((id) => euro[id] && w.meta[id]), `${c.name} ${y} ${when}: unbekannter Verein`);
    const cc = COUNTRY_BY_KEY[c.name]?.cc;
    const s = cc ? worldStructureFor(cc, y) : null;
    if (s) {
      check(a.length === s.t1, `${c.name} ${y} ${when}: 1. Liga ${a.length} statt ${s.t1}`);
      const t2 = backgroundSecondSize(s);
      if (t2 != null && b.length >= 8) check(b.length === t2, `${c.name} ${y} ${when}: 2. Liga ${b.length} statt ${t2}`);
    }
    if (y % 10 === 5 || y === 1975) (decade[c.name] ??= {})[y] = `${a.length}/${b.length}`;
  }
};
verify(1975, 'Start');
for (let y = 1975; y < 1975 + seasons; y++) {
  const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  const g: any = { world: w, euroClubs: euro, season, homeCountry: 'ger', calendar: { currentDate: `${y}-07-01` } };
  const live = ensureWorldLive(g)!;
  for (const [k, d] of Object.entries(live.divs)) check(d.n === leanMatchdays(d.ids.length) && d.ids.length % 2 === 0, `${k} ${season}: ${d.ids.length} Vereine, ${d.n} Spieltage`);
  const lr = worldLiveResults(g);
  advanceWorldSeason(w, euro, season, y + 1, y >= 1995 ? 3 : 2, undefined, () => false, lr.fixed);
  w.live = undefined;
  verify(y + 1, 'nach Wechsel');
}
console.log(`2) Hintergrund-Welt ${seasons} Saisons (${Date.now() - t0} ms): ${fails - f0 ? fails - f0 + ' Fehler' : 'ok'}`);
for (const name of ['England', 'Italien', 'Spanien', 'Frankreich', 'Niederlande', 'Portugal', 'Belgien', 'Türkei']) {
  if (decade[name]) console.log(`   ${name.padEnd(12)} ${Object.entries(decade[name]).map(([y, v]) => `${y}: ${v}`).join('  ')}`);
}

// --- 3) Heimatland --------------------------------------------------------------
if (!skipHome) {
  const f1 = fails;
  const store = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
  const { createNewGame } = await import('../src/game/newGame');
  const { processDay } = await import('../src/game/day');
  const { HEADLESS_UI } = await import('../src/game/dayUi');
  const { findOwnMatchDue, quickSimOwnMatch } = await import('../src/game/ownMatch');
  const { startNextSeason } = await import('../src/game/season');
  const { composeHome } = await import('../src/game/worldCompose');
  const tick = (g: any) => { if (!processDay(g, HEADLESS_UI)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); } } };
  const sizes = (g: any) => {
    const divs = [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((d: any) => d.tier < 100);
    return divs.map((d: any) => ({ id: d.id, tier: d.tier, n: d.id === g.leagues.playerDivision.id ? g.table.rows.length : d.clubIds.length, ids: d.id === g.leagues.playerDivision.id ? g.table.rows.map((r: any) => r.clubId) : d.clubIds }));
  };
  for (const [cc, y, want1, want2] of [['eng', 1994, 20, [24]], ['fra', 1992, 20, [22]]] as [string, number, number, number[]][]) {
    const pick = composeHome(cc, y)!.tier1[4].id;
    const g: any = createNewGame({ managedClubId: pick, manager: { name: 'T', nationality: 'GER', birthYear: 1950, style: 'balanced', background: 'rookie' }, difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: y, country: cc } as any);
    g.simAutoManage = true;
    let guard = 0;
    while (g.calendar.currentDate < `${y + 1}-06-29` && guard++ < 400) tick(g);
    startNextSeason(g);
    const sz = sizes(g);
    const t1 = sz.filter((d) => d.tier === 1), t2 = sz.filter((d) => d.tier === 2);
    check(t1.length === 1 && t1[0].n === want1, `${cc} ${y + 1}: 1. Liga ${t1.map((d) => d.n)} statt ${want1}`);
    check(t2.map((d) => d.n).join() === want2.join(), `${cc} ${y + 1}: 2. Ebene ${t2.map((d) => d.n)} statt ${want2}`);
    const all = sz.flatMap((d) => d.ids);
    check(new Set(all).size === all.length, `${cc} ${y + 1}: doppelte Vereine`);
    check(all.every((id: string) => g.clubs[id] || g.simClubs[id]), `${cc} ${y + 1}: unbekannte Vereine`);
    check(!all.some((id: string) => id.startsWith('pool-')), `${cc} ${y + 1}: deutscher Amateurverein im Ausland`);
    check(g.fixtures.length === g.table.rows.length * (g.table.rows.length - 1), `${cc} ${y + 1}: Spielplan ${g.fixtures.length} Spiele für ${g.table.rows.length} Vereine`);
    console.log(`   Heimat ${cc} ${y + 1}/${String((y + 2) % 100).padStart(2, '0')}: ${sz.map((d) => `${d.id} ${d.n}`).join(', ')}`);
  }
  console.log(`3) Heimatland: ${fails - f1 ? fails - f1 + ' Fehler' : 'ok'}`);
}
console.log(fails ? `STRUKTUR AUSLAND: ${fails} Fehler` : 'STRUKTUR AUSLAND: alles ok');
if (fails) process.exitCode = 1;
