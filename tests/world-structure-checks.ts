// Prüfungen der historischen Ligastruktur im Ausland (data/world/structure.ts):
//  1. Struktur-Funktion: gerade Größen, Auf-/Abstieg ≥ 0, Aufsteiger − Absteiger = Größenänderung,
//     Stichproben gegen die Geschichte (England 1995/96 20, Italien 1988/89 18, Spanien 1995/96 22 …).
//  2. Hintergrund-Welt 1975 + n Saisons mit Spieltag-Simulation: je Land und Saison Größe = Struktur,
//     keine Doppelten (1./2. Liga/Unterbau), keine leeren Ligen, gerade Größen, Spieltage = 2 × (n − 1).
//     Mehrere Staffeln der 2. Ebene (Frankreich, Portugal): jede Staffel eine eigene Liga in historischer Größe.
//  2b. Deutschland im Hintergrund (Heimat Frankreich): Nord/Süd 1975–1980, eingleisig 1981, zwei Staffeln 1991/92.
//  2c. Heimatland Aufteilen einer eingleisigen 2. Liga in drei Staffeln nach Zone (älterer Spielstand Portugal).
//  4. Älterer Spielstand (Vorlage Test 10 Jahre): eingleisige 2. Ligen teilen sich zum nächsten Saisonwechsel auf.
//  3. Heimatland England 1994/95 → 1995/96 (22 → 20), Frankreich 1992/93 → 1993/94 (zwei Staffeln → eine),
//     Frankreich 1985/86 → 1986/87 (zwei bleiben zwei), Portugal 1987/88 → 1988/89 (drei Staffeln), 1989/90 → 1990/91 (drei → eine).
//   node scripts/run-ts.mjs tests/world-structure-checks.ts [saisons] [ohne-heimat]
import { allEuroClubs } from '../src/data/europe';
import { COUNTRY_BY_KEY } from '../src/data/world/countries';
import { worldStructureFor } from '../src/data/world/structure';
import { secondGroups } from '../src/engine/worldSecond';
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
  // Land, Saison, 1. Liga, 2. Ebene (gesamt) – Quellen: docs/research/ligastruktur-ausland.md
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
const multi: Record<string, string[]> = {};
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
      if (s.t2 != null && b.length >= 8) check(b.length === s.t2, `${c.name} ${y} ${when}: 2. Ebene ${b.length} statt ${s.t2}`);
      // Mehrere Staffeln (engine/worldSecond.ts): jede Staffel eine Liga in historischer Größe.
      const gs = secondGroups(c);
      if (s.groups && b.length >= 8) check(gs.map((x) => x.length).join('/') === s.groups.join('/'), `${c.name} ${y} ${when}: Staffeln ${gs.map((x) => x.length).join('/')} statt ${s.groups.join('/')}`);
      check(gs.every((x) => x.length >= 4 && x.length % 2 === 0), `${c.name} ${y} ${when}: Staffel leer/ungerade ${gs.map((x) => x.length).join('/')}`);
      if (gs.length > 1) (multi[`${c.name}`] ??= []).push(`${y}:${gs.map((x) => x.length).join('+')}`);
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
for (const [k, v] of Object.entries(multi)) console.log(`   mehrgleisig ${k}: ${v.join(' ')}`);
console.log(`2) Hintergrund-Welt ${seasons} Saisons (${Date.now() - t0} ms): ${fails - f0 ? fails - f0 + ' Fehler' : 'ok'}`);
for (const name of ['England', 'Italien', 'Spanien', 'Frankreich', 'Niederlande', 'Portugal', 'Belgien', 'Türkei']) {
  if (decade[name]) console.log(`   ${name.padEnd(12)} ${Object.entries(decade[name]).map(([y, v]) => `${y}: ${v}`).join('  ')}`);
}

// --- 2b) Deutschland im Hintergrund (Heimat Frankreich): 2. Liga Nord/Süd 1975–1981, 1991/92 zwei Staffeln ---
{
  const f2 = fails;
  const euro2 = allEuroClubs();
  const w2 = initWorld(euro2, 1975, { overlay: worldOverlay({ home: 'fra' }) });
  const seen: string[] = [];
  for (let y = 1975; y < 1995; y++) {
    const de = w2.countries['Deutschland'];
    const s = worldStructureFor('ger', y)!;
    const gs = secondGroups(de);
    const all = [...de.tiers[0], ...de.tiers[1], ...(de.pool ?? [])];
    check(new Set(all).size === all.length, `Deutschland ${y}: doppelte Vereine`);
    if (s.groups) check(gs.map((x) => x.length).join('/') === s.groups.join('/'), `Deutschland ${y}: Staffeln ${gs.map((x) => x.length).join('/')} statt ${s.groups.join('/')}`);
    if (y === 1975 || y === 1980 || y === 1981 || y === 1991 || y === 1992) seen.push(`${y}: ${gs.map((x) => x.length).join('+')}`);
    const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
    const g: any = { world: w2, euroClubs: euro2, season, homeCountry: 'fra', calendar: { currentDate: `${y}-07-01` } };
    const live = ensureWorldLive(g)!;
    const nDe = Object.keys(live.divs).filter((k) => k.startsWith('Deutschland|')).length;
    check(nDe === 1 + gs.length, `Deutschland ${season}: ${nDe} Ligen statt ${1 + gs.length}`);
    const lr = worldLiveResults(g);
    if (gs.length > 1) check((lr.divs['Deutschland'] ?? []).length === 1 + gs.length && (lr.fixed['Deutschland']?.t2g?.length ?? 0) === gs.length, `Deutschland ${season}: Endtabellen je Staffel fehlen`);
    advanceWorldSeason(w2, euro2, season, y + 1, y >= 1995 ? 3 : 2, undefined, () => false, lr.fixed);
    w2.live = undefined;
  }
  console.log(`2b) Deutschland im Hintergrund: ${seen.join('  ')} – ${fails - f2 ? fails - f2 + ' Fehler' : 'ok'}`);
}

// --- 2c) Heimatland: Aufteilen einer eingleisigen 2. Liga in drei Staffeln (älterer Spielstand Portugal) ---
{
  const f3 = fails;
  const { homeSeasonPlan, applyHomePlan, homeZoneOf } = await import('../src/game/homeStructure');
  const { worldSeason } = await import('../src/data/world/index');
  const { realClub } = await import('../src/data/world/index');
  const row = worldSeason('por', 1988)!;
  const t2all = [...(row.t2 ?? []), ...(row.t2b ?? [])];
  const current = [
    { id: 'tier1', tier: 1, group: null, name: '1. Liga', orderedIds: row.t1.slice(0, 18) },
    { id: 'tier2', tier: 2, group: null, name: '2. Liga', orderedIds: t2all.slice(0, 52) },
  ] as any[];
  const plan = homeSeasonPlan('por', current, '1988/89');
  check(!!plan.regroup && plan.regroup.into.length === 3, `Portugal 1 → 3 Staffeln: kein Aufteilen geplant`);
  const res: any = { divisions: current.map((d: any) => ({ meta: { id: d.id, name: d.name, tier: d.tier, group: d.group }, ids: [...d.orderedIds] })), placeholders: [], dropped: [], reform: null, promotedTop: [], relegatedTop: [] };
  applyHomePlan(res, plan, current, '1988/89', undefined, (id, n) => homeZoneOf('por', id, realClub('por', id)?.city, n, 1988));
  const t2 = res.divisions.filter((d: any) => d.meta.tier === 2);
  check(t2.length === 3 && t2.every((d: any) => d.ids.length === 18), `Portugal 1 → 3: ${t2.map((d: any) => `${d.meta.id} ${d.ids.length}`).join(', ')}`);
  const ids = t2.flatMap((d: any) => d.ids);
  check(new Set(ids).size === ids.length, 'Portugal 1 → 3: doppelte Vereine');
  // Zonen: die Mehrheit jeder Staffel spielte laut Daten 1988/89 in genau dieser Zone.
  const zone = (k: number) => new Set(k === 0 ? row.t2 : row.t2b!.slice((k - 1) * 18, k * 18));
  t2.forEach((d: any, k: number) => { const hit = d.ids.filter((id: string) => zone(k).has(id)).length; check(hit >= 14, `Portugal 1 → 3: ${d.meta.id} nur ${hit} von 18 aus der Zone`); });
  console.log(`2c) Heimat aufteilen (Portugal 1 → 3): ${t2.map((d: any) => `${d.meta.name} ${d.ids.length}`).join(', ')} – ${fails - f3 ? fails - f3 + ' Fehler' : 'ok'}`);
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
  for (const [cc, y, want1, want2] of [['eng', 1994, 20, [24]], ['fra', 1992, 20, [22]], ['fra', 1985, 20, [18, 18]], ['por', 1987, 20, [18, 18, 18]], ['por', 1989, 20, [20]]] as [string, number, number, number[]][]) {
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
    check(sz.every((d) => d.n >= 4 && d.n % 2 === 0), `${cc} ${y + 1}: leere/ungerade Staffel ${sz.map((d) => d.n)}`);
    for (const d of [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((x: any) => x.tier < 100)) {
      const ids = d.id === g.leagues.playerDivision.id ? g.table.rows.map((r: any) => r.clubId) : d.clubIds;
      for (const id of ids) { const sc = g.simClubs[id]; if (sc) check(sc.tier === d.tier && sc.group === d.group, `${cc} ${y + 1}: ${id} Ebene/Staffel ${sc.tier}/${sc.group} statt ${d.tier}/${d.group}`); }
    }
    check(g.fixtures.length === g.table.rows.length * (g.table.rows.length - 1), `${cc} ${y + 1}: Spielplan ${g.fixtures.length} Spiele für ${g.table.rows.length} Vereine`);
    console.log(`   Heimat ${cc} ${y + 1}/${String((y + 2) % 100).padStart(2, '0')}: ${sz.map((d) => `${d.id} ${d.n}`).join(', ')}`);
  }
  console.log(`3) Heimatland: ${fails - f1 ? fails - f1 + ' Fehler' : 'ok'}`);
}
// --- 4) Älterer Spielstand (Vorlage „Test 10 Jahre“, 1985/86, 2. Ligen im Hintergrund noch eingleisig):
//        läuft weiter, die Staffeln entstehen zum nächsten Saisonwechsel (Frankreich 2 × 18, Portugal 3 × 16).
if (!skipHome) {
  const f4 = fails;
  const lz = (await import('lz-string')).default;
  const { readFileSync } = await import('node:fs');
  const { prepareLoadedGame } = await import('../src/game/loadMigrations');
  const { processDay } = await import('../src/game/day');
  const { HEADLESS_UI } = await import('../src/game/dayUi');
  const { findOwnMatchDue, quickSimOwnMatch } = await import('../src/game/ownMatch');
  const { startNextSeason } = await import('../src/game/season');
  const raw = readFileSync('public/saves/test-10-jahre.txt', 'utf8');
  const g: any = JSON.parse(raw.startsWith('LZ1:') ? lz.decompressFromUTF16(raw.slice(4)) : raw).game;
  prepareLoadedGame(g); g.simAutoManage = true;
  const sizes = (k: string) => secondGroups(g.world.countries[k]).map((x: string[]) => x.length).join('+');
  const before = `Frankreich ${sizes('Frankreich')}, Portugal ${sizes('Portugal')}`;
  // Die Vorlage wurde inzwischen mit Staffeln neu erzeugt – dann nur Hinweis (die Prüfung danach gilt weiter).
  if (!(sizes('Frankreich') === '18' && sizes('Portugal') === '16')) console.log(`   Hinweis: Vorlage hat schon Staffeln (${before})`);
  const end = `${Number(g.season.slice(0, 4)) + 1}-06-29`;
  let guard = 0;
  while (g.calendar.currentDate < end && guard++ < 400) { if (!processDay(g, HEADLESS_UI)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, HEADLESS_UI); } } }
  startNextSeason(g);
  for (let i = 0; i < 30; i++) processDay(g, HEADLESS_UI);
  check(sizes('Frankreich') === '18+18', `alter Stand → ${g.season}: Frankreich ${sizes('Frankreich')} statt 18+18`);
  check(sizes('Portugal') === '16+16+16', `alter Stand → ${g.season}: Portugal ${sizes('Portugal')} statt 16+16+16`);
  for (const k of ['Frankreich', 'Portugal']) {
    const c = g.world.countries[k]; const all = [...c.tiers[0], ...c.tiers[1], ...(c.pool ?? [])];
    check(new Set(all).size === all.length, `alter Stand → ${g.season}: ${k} doppelte Vereine`);
    const n = Object.keys(g.world.live?.divs ?? {}).filter((x: string) => x.startsWith(`${k}|`) && Number(x.split('|')[1]) < 100).length; // ohne tiefere Ebenen (Index ≥ 100)
    check(n === 1 + secondGroups(c).length, `alter Stand → ${g.season}: ${k} ${n} laufende Ligen`);
  }
  console.log(`4) Alter Spielstand ${before} → ${g.season}: Frankreich ${sizes('Frankreich')}, Portugal ${sizes('Portugal')} – ${fails - f4 ? fails - f4 + ' Fehler' : 'ok'}`);
}
console.log(fails ? `STRUKTUR AUSLAND: ${fails} Fehler` : 'STRUKTUR AUSLAND: alles ok');
if (fails) process.exitCode = 1;
