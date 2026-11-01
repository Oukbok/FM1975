// =============================================================================
// JUGENDWETTBEWERBE — Saison aufsetzen: Teilnehmer, Staffeln, Spielpläne
// -----------------------------------------------------------------------------
// Formate und Quellen: data/youthCompetitions.ts. Mitglieder von Regionalliga/
// Bundesliga bleiben über die Saisons erhalten (je 3 Absteiger, Aufsteiger = stärkste
// Jugend der Region); die Nachwuchsliga ab 2024 übernimmt die Bundesliga-Vereine.
// =============================================================================
import {
  BL_SIZE, BL_STAFFELN, LV_CLUSTERS_UNITED, LV_CLUSTERS_WEST, LV_MAX, NWL_GROUPS, NWL_GROUP_SIZE, RL_LEAGUES, RL_SIZE,
  LV_REGION, compLabel, isoAdd, pokalFormat, sectionLabel, u17Format, u19Format, uylFormat,
  type LvCluster, type YcCls, type YcFormat, type YcKey, type YcRegion,
} from '../../data/youthCompetitions';
import { seasonStartYear } from '../../data/timeline';
import type { Game } from '../state';
import { fixturesFor, koRounds, koStart, leagueDates, uylGroupDates } from './schedule';
import { ycOpts, germanPool, hash32, lvOf, modelStrength, refStrength, regionOf, rng32, tierOfClub } from './sim';
import { buildLowerComps } from './lower';
import { leagueTable } from './table';
import type { YcComp, YcLeague, YouthCompsState } from './types';

const REGION_ORDER: YcRegion[] = ['nord', 'nordost', 'west', 'suedwest', 'sued'];

function strOf(st: YouthCompsState, id: string, cls: YcCls): number { return st.str[`${id}|${cls}`] ?? 40; }
const byStr = (st: YouthCompsState, cls: YcCls) => (a: string, b: string) => strOf(st, b, cls) - strOf(st, a, cls) || a.localeCompare(b);

function league(id: string, name: string, clubs: string[], slots: number, extra: Partial<YcLeague> = {}): YcLeague {
  return { id, name, stage: 0, clubs, fx: [], slots, ...extra };
}

// -----------------------------------------------------------------------------
// Verbandsligen (bis 1995/96 bzw. 1999/2000)
// -----------------------------------------------------------------------------
function lvLeagues(g: Game, st: YouthCompsState, cls: YcCls, y0: number, pool: string[]): YcLeague[] {
  const clusters: (LvCluster & { clubs: string[] })[] = (y0 >= 1991 ? LV_CLUSTERS_UNITED : LV_CLUSTERS_WEST).map((c) => ({ ...c, clubs: [] }));
  for (const id of pool) {
    const lv = lvOf(g, id);
    const c = clusters.find((x) => x.lvs.includes(lv)) ?? clusters.find((x) => x.lvs.some((l) => LV_REGION[l] === LV_REGION[lv])) ?? clusters[0];
    c.clubs.push(id);
  }
  // Zu kleine Verbandsligen gehen in der größten Liga derselben Region (sonst der größten) auf.
  for (const c of clusters) {
    if (c.clubs.length >= 3 || !c.clubs.length && !c.slots) continue;
    const region = LV_REGION[c.lvs[0]];
    const others = clusters.filter((x) => x !== c && x.clubs.length >= 3);
    const target = others.filter((x) => LV_REGION[x.lvs[0]] === region).sort((a, b) => b.clubs.length - a.clubs.length)[0]
      ?? others.sort((a, b) => b.clubs.length - a.clubs.length)[0];
    if (!target) continue;
    target.clubs.push(...c.clubs); target.slots += c.slots;
    c.clubs = []; c.slots = 0;
  }
  const live = clusters.filter((c) => c.clubs.length >= 2);
  for (const c of live) { c.clubs.sort(byStr(st, cls)); c.clubs = c.clubs.slice(0, LV_MAX); }
  // Plätze: genau 16 (bzw. so viele wie möglich), höchstens halbe Liga.
  const want = Math.min(16, live.reduce((a, c) => a + Math.floor(c.clubs.length / 2), 0));
  for (const c of live) c.slots = Math.min(c.slots, Math.floor(c.clubs.length / 2));
  let total = live.reduce((a, c) => a + c.slots, 0);
  while (total < want) {
    const c = [...live].filter((x) => x.slots < Math.floor(x.clubs.length / 2)).sort((a, b) => b.clubs.length / (b.slots + 1) - a.clubs.length / (a.slots + 1))[0];
    if (!c) break;
    c.slots++; total++;
  }
  return live.map((c) => league(`lv-${c.id}`, `Verbandsliga ${c.name}`, c.clubs, c.slots));
}

// -----------------------------------------------------------------------------
// Staffeln mit Auf-/Abstieg (Regionalliga, Bundesliga)
// -----------------------------------------------------------------------------
function staffelClubs(
  st: YouthCompsState, cls: YcCls, prev: string[] | undefined, prevLeague: YcLeague | undefined, pts: number, candidates: string[], size: number,
): string[] {
  const cand = new Set(candidates);
  let keep = (prev ?? []).filter((id) => cand.has(id));
  if (prevLeague && prevLeague.fx.length) {
    const down = new Set(leagueTable(prevLeague, pts).slice(-(prevLeague.down ?? 3)).map((r) => r.clubId));
    keep = keep.filter((id) => !down.has(id));
  }
  const fill = candidates.filter((id) => !keep.includes(id)).sort(byStr(st, cls));
  return [...keep, ...fill].slice(0, Math.min(size, candidates.length));
}

function prevLeagueOf(prevComps: YcComp[] | undefined, key: YcKey, id: string): YcLeague | undefined {
  return prevComps?.find((c) => c.key === key)?.leagues.find((l) => l.id === id);
}

// -----------------------------------------------------------------------------
// Meisterschaft (U19/U17)
// -----------------------------------------------------------------------------
function buildChampionship(g: Game, st: YouthCompsState, key: 'u19' | 'u17', fmt: YcFormat, y0: number, r: () => number, prevComps?: YcComp[]): YcComp {
  const cls: YcCls = key === 'u19' ? 'A' : 'B';
  const pts = g.pointSystem === '3-point' ? 3 : 2;
  const pool = germanPool(g, false);
  const prevMembers = st.members[key] ?? {};
  let leagues: YcLeague[] = [];
  if (fmt === 'lv16') leagues = lvLeagues(g, st, cls, y0, pool);
  else if (fmt === 'rl8') {
    const mem: Record<string, string[]> = {};
    for (const rl of RL_LEAGUES) {
      const id = `rl-${rl.region}`;
      const clubs = staffelClubs(st, cls, prevMembers[id], prevLeagueOf(prevComps, key, id), pts, pool.filter((c) => regionOf(g, c) === rl.region), RL_SIZE);
      if (clubs.length < 4) continue;
      mem[id] = clubs;
      leagues.push(league(id, rl.name, clubs, Math.min(rl.slots, 2), { down: 3 }));
    }
    st.members[key] = mem;
  } else if (fmt === 'bl4') {
    const mem: Record<string, string[]> = {};
    const prevAll = new Set(Object.values(prevMembers).flat());
    for (const s of BL_STAFFELN) {
      const id = `bl-${s.id}`;
      const cands = pool.filter((c) => s.regions.includes(regionOf(g, c)));
      // Erste Bundesliga-Saison: frühere Regionalliga-Vereine haben Vorrang.
      const prev = prevMembers[id] ?? cands.filter((c) => prevAll.has(c)).sort(byStr(st, cls));
      const clubs = staffelClubs(st, cls, prev, prevLeagueOf(prevComps, key, id), pts, cands, BL_SIZE);
      mem[id] = clubs;
      leagues.push(league(id, `Staffel ${s.name}`, clubs, s.slots, { down: 3 }));
    }
    st.members[key] = mem;
  } else if (fmt === 'nwl') {
    const prevAll = Object.values(prevMembers).flat();
    const prevNwl = prevMembers.nwl;
    let clubs: string[];
    const total = NWL_GROUPS * NWL_GROUP_SIZE;
    if (prevNwl && prevComps) {
      // Je Gruppe steigt der Letzte der Vorrunde ab.
      const pc = prevComps.find((c) => c.key === key);
      const down = new Set((pc?.leagues ?? []).filter((l) => l.stage === 0).map((l) => leagueTable(l, pts).slice(-1)[0]?.clubId));
      const keep = prevNwl.filter((c) => pool.includes(c) && !down.has(c));
      clubs = [...keep, ...pool.filter((c) => !keep.includes(c)).sort(byStr(st, cls))].slice(0, total);
    } else {
      clubs = [...prevAll.filter((c) => pool.includes(c)), ...pool.filter((c) => !prevAll.includes(c)).sort(byStr(st, cls))].slice(0, total);
    }
    st.members[key] = { nwl: clubs };
    const sorted = [...clubs].sort((a, b) => REGION_ORDER.indexOf(regionOf(g, a)) - REGION_ORDER.indexOf(regionOf(g, b)) || strOf(st, b, cls) - strOf(st, a, cls));
    const ng = Math.max(1, Math.round(sorted.length / NWL_GROUP_SIZE));
    for (let i = 0; i < ng; i++) {
      const grp = sorted.slice(Math.round((i * sorted.length) / ng), Math.round(((i + 1) * sorted.length) / ng));
      leagues.push(league(`nwl-v${i + 1}`, `Vorrunde Gruppe ${String.fromCharCode(65 + i)}`, grp, 3, { group: true }));
    }
  }
  const ko = koRounds(fmt, y0, g.calendar.seasonEndDate);
  const cap = isoAdd(koStart(ko) ?? g.calendar.seasonEndDate, -4);
  for (const l of leagues) {
    const rounds = 2 * (l.clubs.length - (l.clubs.length % 2 ? 0 : 1));
    const win = fmt === 'nwl' ? 'nwl1' : fmt === 'lv16' ? 'lv16' : fmt === 'rl8' ? 'rl8' : 'bl4';
    l.fx = fixturesFor(l.clubs, leagueDates(y0, rounds, win, false, cap), r);
  }
  return { key, fmt, cls, label: compLabel(key, y0), section: sectionLabel(key, y0), pts, leagues, ko };
}

/** Nachwuchsliga: Hauptrunde Liga A aus den Vorrunden-Ersten bis -Dritten (4 Gruppen à 6). */
export function buildNwlMainRound(comp: YcComp, y0: number, r: () => number): void {
  const cap = isoAdd(koStart(comp.ko) ?? `${y0 + 1}-05-01`, -4);
  const pre = comp.leagues.filter((l) => l.stage === 0);
  const pots: string[][] = [[], [], []];
  for (const l of pre) leagueTable(l, comp.pts).slice(0, 3).forEach((row, i) => pots[i].push(row.clubId));
  const groups: string[][] = [[], [], [], []];
  let k = 0;
  for (const pot of pots) for (const id of pot.sort(() => r() - 0.5)) groups[k++ % 4].push(id);
  groups.forEach((clubs, i) => {
    if (clubs.length < 2) return;
    const l = league(`nwl-a${i + 1}`, `Liga A Gruppe ${String.fromCharCode(65 + i)}`, clubs, 4, { stage: 1, group: true });
    l.fx = fixturesFor(clubs, leagueDates(y0, 2 * (clubs.length - (clubs.length % 2 ? 0 : 1)), 'nwl2', false, cap), r);
    comp.leagues.push(l);
  });
}

// -----------------------------------------------------------------------------
// DDR, Pokal, UEFA Youth League
// -----------------------------------------------------------------------------
function buildDdr(g: Game, st: YouthCompsState, y0: number, r: () => number): YcComp | null {
  const clubs = germanPool(g, true).filter((id) => tierOfClub(g, id) === 101).sort(byStr(st, 'A'));
  if (clubs.length < 4) return null;
  const l = league('ddr', compLabel('ddr', y0), clubs, 1);
  l.fx = fixturesFor(clubs, leagueDates(y0, 2 * (clubs.length - (clubs.length % 2 ? 0 : 1)), 'ddr', true, isoAdd(g.calendar.seasonEndDate, -1)), r);
  return { key: 'ddr', fmt: 'ddr', cls: 'A', label: l.name, section: sectionLabel('ddr', y0), pts: 2, leagues: [l], ko: [] };
}

function buildPokal(g: Game, st: YouthCompsState, fmt: YcFormat, y0: number, r: () => number, prevComps?: YcComp[]): YcComp {
  const pool = germanPool(g, false);
  const byLv = new Map<string, string[]>();
  for (const id of pool) { const lv = lvOf(g, id); if (y0 < 1991 && LV_REGION[lv] === 'nordost' && lv !== 'BE') continue; (byLv.get(lv) ?? byLv.set(lv, []).get(lv)!).push(id); }
  // Verbandspokalsieger: Zufall, gewichtet nach Stärke der A-Jugend.
  const winners: string[] = [];
  for (const ids of byLv.values()) {
    const w = ids.map((id) => Math.pow(Math.max(1, strOf(st, id, 'A') - 30), 3));
    let x = r() * w.reduce((a, b) => a + b, 0);
    winners.push(ids.find((_, i) => (x -= w[i]) <= 0) ?? ids[0]);
  }
  const size = fmt === 'cup16' ? 16 : fmt === 'cup21' ? 21 : fmt === 'cup32' ? 32 : 64;
  const field = new Set(winners);
  if (fmt === 'cup32' || fmt === 'cup64') {
    for (const k of ['pokal', 'u19'] as const) { const w = st.lastWinners?.[k]; if (w && pool.includes(w)) field.add(w); }
    const prev = prevComps?.find((c) => c.key === 'u19');
    for (const l of prev?.leagues.filter((x) => x.stage === 0) ?? []) for (const row of leagueTable(l, prev!.pts).slice(0, 3)) if (pool.includes(row.clubId)) field.add(row.clubId);
  }
  for (const id of [...pool].sort(byStr(st, 'A'))) { if (field.size >= size) break; field.add(id); }
  const teams = [...field].slice(0, size);
  return {
    key: 'pokal', fmt, cls: 'A', label: compLabel('pokal', y0), section: sectionLabel('pokal', y0), pts: 2, leagues: [],
    ko: koRounds(fmt, y0, g.calendar.seasonEndDate).map((rd, i) => (i === 0 ? { ...rd, entrants: teams } : rd)),
  };
}

function buildUyl(g: Game, st: YouthCompsState, fmt: YcFormat, y0: number, r: () => number): YcComp | null {
  const eu = g.euroClubs ?? {};
  const want = fmt === 'uyl3' ? 36 : 32;
  const cl = (g.euroCups?.ec?.participantIds ?? []).filter((id) => g.clubs[id] || g.simClubs[id] || eu[id]);
  const str = (id: string) => strOf(st, id, 'A');
  let path = [...new Set(cl)].sort((a, b) => str(b) - str(a)).slice(0, want);
  const foreignFree = Object.keys(eu).filter((id) => !path.includes(id)).sort((a, b) => eu[b].strength - eu[a].strength);
  while (path.length < want && foreignFree.length) path.push(foreignFree.shift()!);
  if (path.length < 8) return null;
  const comp: YcComp = { key: 'uyl', fmt, cls: 'A', label: compLabel('uyl', y0), section: sectionLabel('uyl', y0), pts: 3, leagues: [], ko: koRounds(fmt, y0, g.calendar.seasonEndDate) };
  if (fmt === 'uyl3') {
    const l = league('uyl-lp', 'Ligaphase', path, 22);
    // 6 Spieltage aus einer Doppelrunde aller 36: jeder hat 6 verschiedene Gegner.
    const all = fixturesFor(path, Array.from({ length: 2 * (path.length - 1) }, (_, i) => String(i)), r);
    const pickRounds = Array.from({ length: path.length - 1 }, (_, i) => i).sort(() => r() - 0.5).slice(0, 6);
    const dates = uylGroupDates(y0, 6);
    l.fx = all.filter((f) => pickRounds.includes(Number(f[0]))).map((f) => [dates[pickRounds.indexOf(Number(f[0]))], f[1], f[2], -1, -1]);
    comp.leagues.push(l);
  } else {
    const pots = [0, 1, 2, 3].map((p) => path.slice(p * 8, p * 8 + 8).sort(() => r() - 0.5));
    for (let gi = 0; gi < 8; gi++) {
      const clubs = pots.map((p) => p[gi]).filter(Boolean);
      const l = league(`uyl-g${gi + 1}`, `Gruppe ${String.fromCharCode(65 + gi)}`, clubs, 2, { group: true });
      const rr = fixturesFor(clubs, Array.from({ length: 6 }, (_, i) => String(i)), r);
      const dates = uylGroupDates(y0, 6);
      l.fx = rr.map((f) => [dates[Number(f[0])], f[1], f[2], -1, -1]);
      comp.leagues.push(l);
    }
  }
  if (fmt !== 'uyl1') {
    // Meisterweg: deutscher A-Jugend-Meister des Vorjahres + Jugendmeister anderer Länder (im Spiel verkleinert).
    const n = fmt === 'uyl3' ? 20 : 16;
    const dcp: string[] = [];
    const ger = st.lastWinners?.u19;
    if (ger && !path.includes(ger) && (g.clubs[ger] || g.simClubs[ger])) dcp.push(ger);
    const seenCountry = new Set<string>();
    for (const id of foreignFree) { if (dcp.length >= n) break; if (!seenCountry.has(eu[id].country)) { seenCountry.add(eu[id].country); dcp.push(id); } }
    for (const id of foreignFree) { if (dcp.length >= n) break; if (!dcp.includes(id)) dcp.push(id); }
    comp.ko[0].entrants = dcp.slice(0, n - (n % 2));
  }
  return comp;
}

// -----------------------------------------------------------------------------
// Saison aufsetzen
// -----------------------------------------------------------------------------
export function setupSeason(g: Game, st: YouthCompsState, prevComps?: YcComp[]): void {
  const y0 = seasonStartYear(g.season);
  const r = rng32(hash32(`yc|${g.season}|${g.managedClubId}`));
  // Stärken der Saison (KI/simuliert; echte volle Mannschaften rechnen im Spiel selbst).
  st.str = {};
  const refA = refStrength(g, 'A'), refB = refStrength(g, 'B');
  const all = [...germanPool(g, false), ...germanPool(g, true), ...Object.keys(g.euroClubs ?? {})];
  for (const id of all) {
    st.str[`${id}|A`] = modelStrength(g, id, 'A', refA, g.season);
    st.str[`${id}|B`] = modelStrength(g, id, 'B', refB, g.season);
  }
  st.season = g.season;
  st.stats = {};
  st.people = {};
  st.day = undefined;
  const comps: YcComp[] = [];
  comps.push(buildChampionship(g, st, 'u19', u19Format(y0), y0, r, prevComps));
  const f17 = u17Format(y0);
  if (f17) comps.push(buildChampionship(g, st, 'u17', f17, y0, r, prevComps));
  const fp = pokalFormat(y0);
  if (fp) comps.push(buildPokal(g, st, fp, y0, r, prevComps));
  const ddr = buildDdr(g, st, y0, r);
  if (ddr) comps.push(ddr);
  const fu = uylFormat(y0);
  if (fu) { const u = buildUyl(g, st, fu, y0, r); if (u) comps.push(u); }
  // C- bis G-Jugend: nur die Staffel des eigenen Vereins (game/youthComps/lower.ts).
  if (ycOpts.lower) comps.push(...buildLowerComps(g, st, y0, prevComps));
  st.low = 1;
  st.comps = comps;
}
