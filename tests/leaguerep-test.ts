// Test „Entwicklung der Ligen“ (Ligaruf je Land) ohne UI – npm run test:leaguerep [saisons]
//   1. Zielkurven gültig (Jahre aufsteigend, 0–100, alle Länder der Weltdaten abgedeckt), Interpolation.
//   2. Anlegen ändert das Landesniveau im Startjahr nicht; ohne Option kein Ligaruf (alte Spielstände).
//   3. Historisch: 20 über der Kurve trotz Dauererfolg → mindestens −5; 20 darunter → mindestens +5.
//      Frei: kein Abzug, Erfolg hebt den Ruf.
//   4. Spielstart mit Option (Deutschland 1975, England 2000) und Saisonwechsel über startNextSeason-Hook.
//   5. Langlauf (Standard 50 Saisons) der Hintergrund-Welt mit vereinfachtem Europapokal, beide Modi:
//      Top 5 je Jahrzehnt nach Ligaruf und nach Fünfjahreswertung; Historisch bleibt nah an der Kurve,
//      Frei darf abweichen. Wirkung: Landesniveau folgt dem Ruf, Vereinsstärken folgen dem Niveau.
import { allEuroClubs, type EuroClub, type EuroCompId } from '../src/data/europe';
import { accessSlots, euroFormat } from '../src/data/euroFormats';
import { LEAGUE_REP_CURVES, repTargetAt } from '../src/data/leagueReputation';
import { WORLD_COUNTRIES } from '../src/data/world/countries';
import { advanceWorldSeason, coefSum, countryLevel, euroParticipants, germanRank, initWorld, legacyCountryLevel, type WorldState } from '../src/engine/world';
import { initLeagueRep, seasonLeagueRep, type LeagueRepMode } from '../src/engine/leagueRep';
import { createNewGame } from '../src/game/newGame';
import { composeHome } from '../src/game/worldCompose';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; }, clear: () => store.clear(),
};
let mseed = 1975;
Math.random = () => { mseed = (mseed * 16807) % 2147483647; return mseed / 2147483647; };

function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const ok = (msg: string) => console.log('ok  ', msg);
const SEASONS = Number(process.argv[2] ?? 50);

// 1) Kurven ------------------------------------------------------------------------------------
for (const [k, cv] of Object.entries(LEAGUE_REP_CURVES)) {
  cv.forEach(([y, v], i) => {
    if (v < 0 || v > 100) fail(`${k}: Ruf ${v} außerhalb 0–100`);
    if (i && y <= cv[i - 1][0]) fail(`${k}: Jahre nicht aufsteigend`);
  });
}
for (const def of WORLD_COUNTRIES) if (!LEAGUE_REP_CURVES[def.key]) fail(`keine Zielkurve für ${def.key}`);
if (Math.abs(repTargetAt('Italien', 1993) - (92 + (100 - 92) * 3 / 5)) > 1e-9) fail('Interpolation falsch');
if (repTargetAt('England', 1900) !== 88 || repTargetAt('England', 2100) !== 100) fail('Kurve außen nicht konstant');
ok(`Zielkurven: ${Object.keys(LEAGUE_REP_CURVES).length} Länder, alle ${WORLD_COUNTRIES.length} Länder der Weltdaten abgedeckt`);

// 2) Anlegen ändert das Niveau nicht ------------------------------------------------------------
{
  const w = initWorld(allEuroClubs(), 1975);
  const before = Object.fromEntries(Object.values(w.countries).map((c) => [c.name, countryLevel(c, 1975)]));
  initLeagueRep(w, 1975);
  for (const c of Object.values(w.countries)) {
    if (c.rep == null) fail(`${c.name} ohne Ligaruf`);
    if (Math.abs(countryLevel(c, 1975) - before[c.name]) > 0.05) fail(`${c.name}: Niveau ${before[c.name]} → ${countryLevel(c, 1975)}`);
  }
  ok('Anlegen: Ligaruf für alle Länder, Landesniveau im Startjahr unverändert');
}

// 3) Korrektur Historisch / Frei -----------------------------------------------------------------
function probe(mode: LeagueRepMode, off: number): { before: number; after: number; target: number } {
  const w = initWorld(allEuroClubs(), 1975);
  initLeagueRep(w, 1975);
  const p = w.countries.Portugal;
  const target = repTargetAt('Portugal', 1980);
  p.rep = target + off;
  // Dauererfolg: fünfmal hintereinander klar beste Wertung Europas
  p.coef = [30, 30, 30, 30, 30];
  const before = p.rep;
  seasonLeagueRep(w, 1980, mode, 'Deutschland');
  return { before, after: p.rep, target };
}
{
  const a = probe('historic', 20);
  if (a.after > a.before - 5 + 1e-9) fail(`Historisch: 20 über der Kurve, trotz Erfolg nur ${(a.after - a.before).toFixed(1)}`);
  const b = probe('historic', -20);
  if (b.after < b.before + 5 - 1e-9) fail(`Historisch: 20 unter der Kurve nur +${(b.after - b.before).toFixed(1)}`);
  const f = probe('free', 20);
  if (f.after <= f.before - 2) fail(`Frei: Abzug ${(f.after - f.before).toFixed(1)} trotz Erfolg`);
  const f2 = probe('free', -20);
  if (f2.after <= f2.before) fail('Frei: Erfolg hebt den Ruf nicht');
  ok(`Portugal mit Dauererfolg: Historisch +20 → ${(a.after - a.before).toFixed(1)}, −20 → +${(b.after - b.before).toFixed(1)}; Frei +20 → ${(f.after - f.before).toFixed(1)}, −20 → +${(f2.after - f2.before).toFixed(1)}`);
}

// 4) Spielstart + Hook ---------------------------------------------------------------------------
{
  const base = {
    manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'rookie' } as any,
    difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  };
  const g0 = createNewGame({ ...base, managedClubId: 'mgl' });
  if (g0.leagueRepMode || Object.values(g0.world!.countries).some((c) => c.rep != null)) fail('ohne Option darf es keinen Ligaruf geben');
  const g1 = createNewGame({ ...base, managedClubId: 'mgl', leagueRepMode: 'historic' });
  if (g1.leagueRepMode !== 'historic') fail('Option fehlt am Spielstand');
  const act = Object.values(g1.world!.countries).filter((c) => c.active);
  if (act.some((c) => c.rep == null)) fail('Spielstart: Land ohne Ligaruf');
  if (g1.world!.countries.Deutschland) fail('Heimatland darf kein Hintergrund-Land sein');
  ok(`Spielstart 1975 Deutschland: ${act.length} Hintergrund-Länder mit Ligaruf, Heimatland ausgenommen`);
  const eng = createNewGame({ ...base, managedClubId: composeHome('eng', 2000)?.tier1[2]?.id ?? 'fra', startYear: 2000, country: 'eng', leagueRepMode: 'free' } as any);
  const de = eng.world!.countries.Deutschland;
  if (eng.world!.countries.England) fail('England als Heimatland im Hintergrund');
  if (!de || de.rep == null) fail('Deutschland im Hintergrund ohne Ligaruf');
  if (Math.abs(countryLevel(de, 2000) - legacyCountryLevel(de, 2000)) > 0.05) fail('Deutschland 2000: Niveau verändert');
  ok(`Spielstart 2000 England: Deutschland im Hintergrund mit Ruf ${de.rep}`);
}

// 5) Langlauf ------------------------------------------------------------------------------------
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Vereinfachter Europapokal: K.-o. mit Hin- und Rückspiel als Wahrscheinlichkeit aus der Stärke. */
function knockout(ids: string[], str: (id: string) => number, r: () => number): any {
  let field = [...ids].sort(() => r() - 0.5);
  const rounds: any[] = [];
  while (field.length > 1) {
    const ties: any[] = [], next: string[] = [];
    for (let i = 0; i < field.length; i += 2) {
      const a = field[i], b = field[i + 1];
      if (!b) { next.push(a); continue; }
      const p = 1 / (1 + Math.exp(-(str(a) - str(b)) / 4));
      const win = r() < p ? a : b;
      ties.push({ winnerClubId: win }); next.push(win);
    }
    rounds.push({ ties }); field = next;
  }
  return { participantIds: ids, rounds, winnerClubId: field[0] };
}

interface Snap { y: number; rep: Record<string, number>; coef: [string, number][]; level: Record<string, number>; str: Record<string, number> }

function run(mode: LeagueRepMode, seed: number): Snap[] {
  const euro: Record<string, EuroClub> = allEuroClubs();
  const w: WorldState = initWorld(euro, 1975);
  initLeagueRep(w, 1975);
  w.participants = euroParticipants(w, euro, 1975);
  const r = rng(seed);
  // Heimatland Deutschland: 18 feste Vereine wie die Bundesliga (Stärke 80 … 60, kleiner Zufall).
  const de = Array.from({ length: 18 }, (_, i) => ({ id: `de_${i}`, s: 80 - i * 1.2 }));
  const snaps: Snap[] = [];
  for (let y = 1975; y < 1975 + SEASONS; y++) {
    const season = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
    for (const d of de) d.s = Math.max(55, Math.min(84, 80 - Number(d.id.slice(3)) * 1.2 + (r() - 0.5) * 6));
    const slots = accessSlots(y, germanRank(w, y));
    const deIds = de.map((d) => d.id);
    const deStr = Object.fromEntries(de.map((d) => [d.id, d.s]));
    const str = (id: string) => deStr[id] ?? euro[id]?.strength ?? 60;
    const cups: Record<EuroCompId, any> = { ec: null, cwc: null, uefa: null };
    let k = 0;
    for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
      const n = comp === 'ec' ? slots.ec : comp === 'cwc' ? slots.cwc : slots.uefa;
      const mine = deIds.slice(k, k + n); k += n;
      const field = [...(w.participants?.[comp] ?? []), ...mine];
      const cap = euroFormat(comp, y)?.field;
      if (field.length >= 2 && cap !== 0) cups[comp] = knockout(field, str, r);
    }
    advanceWorldSeason(w, euro, season, y + 1, y >= 1995 ? 3 : 2, cups, (id) => id.startsWith('de_'), undefined,
      (endYear) => seasonLeagueRep(w, endYear, mode, 'Deutschland'));
    const act = Object.values(w.countries).filter((c) => c.active);
    const coef: [string, number][] = [...act.map((c) => [c.name, coefSum(c.coef)] as [string, number]), ['Deutschland*', coefSum(w.germanCoef)]];
    coef.sort((a, b) => b[1] - a[1]);
    const strOf = (ids: string[]) => { const s = ids.map((id) => euro[id].strength); return s.reduce((a, b) => a + b, 0) / Math.max(1, s.length); };
    snaps.push({
      y: y + 1, coef,
      rep: Object.fromEntries(act.map((c) => [c.name, c.rep ?? 0])),
      level: Object.fromEntries(act.map((c) => [c.name, countryLevel(c, y + 1)])),
      str: Object.fromEntries(act.map((c) => [c.name, strOf(c.tiers[0])])),
    });
  }
  return snaps;
}

const top = (rec: Record<string, number>, n = 5) => Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);
const short = (k: string) => k.replace('Deutschland*', 'DE*').slice(0, 11);
function report(mode: LeagueRepMode, snaps: Snap[]): { dev: number; hits: number } {
  console.log(`\n=== ${mode === 'historic' ? 'HISTORISCH' : 'FREI'} (${SEASONS} Saisons) ===`);
  let dev = 0, n = 0, hits = 0, checks = 0;
  for (const s of snaps) {
    // Abweichung der acht historisch stärksten Ligen im Jahr
    const hist: Record<string, number> = Object.fromEntries(Object.keys(s.rep).map((k) => [k, repTargetAt(k, s.y)]));
    for (const [k] of top(hist, 8)) { dev += Math.abs(s.rep[k] - hist[k]); n++; }
    if (s.y % 10 !== 5) continue;
    const ht = top(hist).map(([k]) => k), rt = top(s.rep).map(([k]) => k);
    hits += rt.filter((k) => ht.includes(k)).length; checks += 5;
    console.log(`${s.y}  Ruf:  ${top(s.rep).map(([k, v]) => `${short(k)} ${v.toFixed(0)}`).join(' · ')}`);
    console.log(`      Soll: ${top(hist).map(([k, v]) => `${short(k)} ${v.toFixed(0)}`).join(' · ')}`);
    console.log(`      5J:   ${s.coef.slice(0, 5).map(([k, v]) => `${short(k)} ${v.toFixed(1)}`).join(' · ')}`);
  }
  const d = dev / Math.max(1, n);
  console.log(`Ø Abweichung der Top-8-Ligen von der Kurve: ${d.toFixed(1)} Ruf-Punkte · Top 5 nach Ruf = historische Top 5: ${hits}/${checks}`);
  return { dev: d, hits: hits / Math.max(1, checks) };
}

const hist = run('historic', 1975), free = run('free', 1975);
const h = report('historic', hist), f = report('free', free);
const seeds = [11, 22, 33].map((sd) => report('free', run('free', sd)).dev);
console.log(`Frei mit weiteren Saaten: Ø Abweichung ${seeds.map((x) => x.toFixed(1)).join(' / ')}`);

if (h.dev > 6) fail(`Historisch weicht im Schnitt ${h.dev.toFixed(1)} Punkte ab (Ziel ≤ 6)`);
if (h.hits < 0.7) fail(`Historisch: nur ${(h.hits * 100).toFixed(0)} % der Top 5 historisch`);
if (f.dev <= h.dev) fail('Frei weicht nicht stärker ab als Historisch');
ok(`Historisch nah an der Kurve (Ø ${h.dev.toFixed(1)}), Frei weicht ab (Ø ${f.dev.toFixed(1)})`);

// Wirkung: Ruf → Landesniveau → Vereinsstärke (Frei, letzte Saison: höchster gegen niedrigsten Ruf der Top 8)
{
  const s = free[free.length - 1];
  const t8 = top(s.rep, 8);
  const hi = t8[0][0], lo = t8[t8.length - 1][0];
  console.log(`Wirkung ${s.y}: ${hi} Ruf ${s.rep[hi].toFixed(0)} → Niveau ${s.level[hi].toFixed(1)}, Ø Stärke 1. Liga ${s.str[hi].toFixed(1)} · ${lo} Ruf ${s.rep[lo].toFixed(0)} → Niveau ${s.level[lo].toFixed(1)}, Ø Stärke 1. Liga ${s.str[lo].toFixed(1)}`);
  // Gleiche Saat, gleiche Welt: Wo Frei den Ruf über Historisch hebt, sind auch die Vereine stärker.
  const h = hist[hist.length - 1];
  const ks = Object.keys(s.rep).filter((k) => h.rep[k] != null);
  const dr = ks.map((k) => s.rep[k] - h.rep[k]), ds = ks.map((k) => s.str[k] - h.str[k]);
  for (const k of ks) if (Math.abs((s.level[k] - h.level[k]) - (s.rep[k] - h.rep[k]) * 0.25) > 0.01) fail(`${k}: Niveau folgt dem Ruf nicht`);
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const mr = mean(dr), ms = mean(ds);
  const corr = ks.reduce((a, _, i) => a + (dr[i] - mr) * (ds[i] - ms), 0) / Math.sqrt(dr.reduce((a, x) => a + (x - mr) ** 2, 0) * ds.reduce((a, x) => a + (x - ms) ** 2, 0) || 1);
  console.log(`Ruf-Unterschied Frei − Historisch gegen Unterschied der Ø-Stärke 1. Liga: Korrelation ${corr.toFixed(2)}`);
  if (corr < 0.4) fail('Vereinsstärken folgen dem Ligaruf nicht');
  ok('Landesniveau folgt dem Ligaruf (20 Ruf = 5 Stärkepunkte), Vereinsstärken folgen dem Niveau');
}
console.log('\nAlle Prüfungen bestanden.');
