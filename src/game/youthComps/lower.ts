// =============================================================================
// JUGENDWETTBEWERBE — C- bis G-Jugend: Staffel des eigenen Vereins bzw. Spielfeste
// -----------------------------------------------------------------------------
// Je Altersklasse genau eine Staffel: die, in der die Mannschaft des eigenen Vereins
// spielt (Formate/Quellen: data/youthLowerLeagues.ts). Gegner = Jugendteams echter
// Vereine aus Region/Landesverband/Stadt, aufgefüllt mit erzeugten Ortsvereinen
// (game/youthComps/localClubs.ts). Andere Staffeln werden nicht simuliert.
// Stärke leichtgewichtig: Bezugswert ist die echte Mannschaft des eigenen Vereins,
// die Gegner liegen nach Ausbildungsqualität/Ruf darüber oder darunter.
// Auf-/Abstieg nur für den eigenen Verein (zwei Spielklassen je Altersklasse).
// =============================================================================
import { E_F_CHAMPIONSHIP, E_F_FINAL_TEAMS, LV_NAME, LOW_CLS, LOW_KEYS, efFinalName, efFinalTitle, lowFormat, lowLeagueName, lowTitle, type LowFormat, type YcLowKey } from '../../data/youthLowerLeagues';
import { isoAdd, sectionLabel, weekdayOnOrAfter } from '../../data/youthCompetitions';
import type { YcCls } from '../../data/youthCompetitions';
import { youthAgeClass } from '../../types';
import type { Game } from '../state';
import { localClubId, localClubName, localClubQuality, isLocalClub, setLocalCity } from './localClubs';
import { breakWindow, fixturesFor } from './schedule';
import { cityOf, germanPool, hash32, isDdr, lvOf, regionOf, rng32, tierOfClub } from './sim';
import { leagueTable } from './table';
import type { YcComp, YouthCompsState } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Spreizung der Stärke je Klasse (je jünger, desto größer der Abstand NLZ ↔ Ortsverein). */
const SPREAD: Record<string, number> = { C: 1, D: 1.15, E: 1.3, F: 1.4, G: 1.4 };
/** Torerwartung je Team und Spiel (Kinder- und Jugendspiele torreicher). */
export const GOAL_BASE: Record<string, number> = { C: 1.8, D: 2.0, E: 2.3, F: 2.5, G: 2.5 };
/** Karten je Klasse (E/F: praktisch keine). */
export const CARD_RATE: Record<string, number> = { C: 0.9, D: 0.4, E: 0, F: 0, G: 0 };
/** Typische Stärke einer Jugendmannschaft, falls keine echte Mannschaft vorhanden ist. */
const DEFAULT_STR: Record<string, number> = { C: 40, D: 33, E: 26, F: 20, G: 15 };

function qualRep(g: Game, id: string): [number, number] {
  if (isLocalClub(id)) { const q = localClubQuality(id); return [q, 32 + q]; }
  const c = g.clubs[id];
  const s = g.simClubs[id];
  const q = c?.youthInvest?.quality ?? clamp(((s?.strength ?? 50) - 48) * 1.6, 5, 55);
  const rep = c?.reputation ?? (s?.strength ?? 50);
  return [q, rep];
}
const rel = (g: Game, id: string, cls: YcCls) => SPREAD[cls] * (0.12 * (qualRep(g, id)[0] - 35) + 0.08 * (qualRep(g, id)[1] - 70));

/** Schnitt der besten n echten Spieler des eigenen Vereins in der Klasse (oder null). */
function ownMean(g: Game, cls: YcCls, n: number): number | null {
  const c = g.clubs[g.managedClubId];
  if (!c) return null;
  const ovr = c.youthPlayerIds.map((id) => g.youthPlayers[id]).filter((p) => p && youthAgeClass(p.age) === cls).map((p) => p.overall).sort((a, b) => b - a);
  if (ovr.length < n) return null;
  return ovr.slice(0, n).reduce((a, b) => a + b, 0) / n;
}

/** Saisonstärken aller Teams der Staffel (st.str). */
function setStrengths(g: Game, st: YouthCompsState, cls: YcCls, clubs: string[], n: number, season: string): void {
  const mid = g.managedClubId;
  const own = ownMean(g, cls, n);
  const base = own != null ? own - rel(g, mid, cls) : DEFAULT_STR[cls];
  for (const id of clubs) {
    const noise = (rng32(hash32(`${season}|${id}|${cls}`))() - 0.5) * 4;
    st.str[`${id}|${cls}`] = Math.round((base + rel(g, id, cls) + noise) * 10) / 10;
  }
}

/** Samstage im Fenster ohne Winterpause, gleichmäßig verteilt. */
function saturdays(y0: number, rounds: number, from: string, to: string, ddr: boolean): string[] {
  const [b0, b1] = breakWindow(y0, ddr);
  const pool: string[] = [];
  for (let d = weekdayOnOrAfter(from, 6); d <= to; d = isoAdd(d, 7)) if (d < b0 || d > b1) pool.push(d);
  while (pool.length < rounds) pool.push(isoAdd(pool[pool.length - 1] ?? from, 3));
  if (pool.length === rounds) return pool;
  return Array.from({ length: rounds }, (_, i) => pool[Math.round((i * (pool.length - 1)) / Math.max(1, rounds - 1))]);
}

/** Kandidaten für die Staffel (ohne den eigenen Verein), beste zuerst. */
function candidates(g: Game, f: LowFormat, cls: YcCls, ddrPool: boolean, season: string): string[] {
  const mid = g.managedClubId;
  const region = regionOf(g, mid), city = cityOf(g, mid), lv = lvOf(g, mid);
  const pool = germanPool(g, ddrPool).filter((id) => id !== mid);
  const strOf = (id: string) => rel(g, id, cls);
  let real: string[];
  if (f.area === 'region') real = pool.filter((id) => regionOf(g, id) === region).sort((a, b) => strOf(b) - strOf(a));
  else if (f.area === 'lv') real = pool.filter((id) => lvOf(g, id) === lv).sort((a, b) => strOf(b) - strOf(a));
  else {
    // Bezirk/Kreis: Vereine aus der Stadt, im Bezirk zusätzlich wenige aus dem Landesverband.
    const same = pool.filter((id) => cityOf(g, id) === city);
    const r = rng32(hash32(`${season}|${cls}|bz`));
    const lvMates = f.area === 'bezirk' ? pool.filter((id) => lvOf(g, id) === lv && !same.includes(id) && tierOfClub(g, id) >= 3).sort(() => r() - 0.5).slice(0, 2) : [];
    real = [...same.slice(0, f.area === 'bezirk' ? 3 : 2), ...lvMates];
  }
  const locals: string[] = [];
  const names = new Set(real.map((id) => g.clubs[id]?.name ?? g.simClubs[id]?.name));
  for (let i = 0; locals.length < f.size + 6 && i < 80; i++) {
    // Landes-/Regionalebene: Dorfvereine aus der Region; Bezirk/Kreis: auch Stadtteilvereine.
    const id = localClubId(region, f.area === 'bezirk' || f.area === 'kreis', i);
    const nm = localClubName(id);
    if (names.has(nm)) continue;
    names.add(nm); locals.push(id);
  }
  return [...real, ...locals];
}

/** Startklasse des eigenen Vereins: Profi-/ambitionierte Vereine oben. */
function initialLevel(g: Game): 0 | 1 {
  const mid = g.managedClubId;
  const q = g.clubs[mid]?.youthInvest?.quality ?? 0;
  return tierOfClub(g, mid) <= 2 || q >= 35 ? 0 : 1;
}

/** Auf-/Abstieg aus der Vorsaison. */
function nextLevel(g: Game, st: YouthCompsState, key: YcLowKey, prev?: YcComp): 0 | 1 {
  const lvl = st.lvl?.[key] ?? prev?.lvl ?? initialLevel(g);
  const l = prev?.leagues[0];
  if (!prev || !l || !l.fx.length) return lvl;
  const t = leagueTable(l, prev.pts);
  const pos = t.find((r) => r.clubId === g.managedClubId)?.pos ?? 0;
  if (lvl === 1 && pos === 1) return 0;
  if (lvl === 0 && (l.down ?? 0) > 0 && pos > t.length - (l.down ?? 0)) return 1;
  return lvl;
}

/** Spielfeste: etwa alle drei bis vier Wochen samstags (außer Winter), Gastgeber reihum. */
function festComp(g: Game, key: YcLowKey, cls: YcCls, f: LowFormat, y0: number, name: string, cands: string[]): YcComp {
  const mid = g.managedClubId;
  const [b0, b1] = breakWindow(y0, false);
  const d: string[] = [];
  const end = isoAdd(g.calendar.seasonEndDate, -2) < `${y0 + 1}-06-14` ? isoAdd(g.calendar.seasonEndDate, -2) : `${y0 + 1}-06-14`;
  for (let x = weekdayOnOrAfter(`${y0}-09-06`, 6); x < end; x = isoAdd(x, 28)) if (x < b0 || x > b1) d.push(x);
  const hosts = [mid, ...cands.slice(0, 7)];
  return {
    key, fmt: 'fest', cls, label: name, section: sectionLabel(key, y0), pts: 3, leagues: [], ko: [],
    play: f.play, n: f.n, fest: { d, h: d.map((_, i) => hosts[i % hosts.length]), note: f.fest ?? '' },
  };
}

/**
 * E-/F-Jugend (Wunsch Pascal): Endrunde der Kreismeister im Landesverband an einem Wochenende nach der
 * Staffel – Viertel- und Halbfinale samstags, Endspiel sonntags. Teilnehmer: Meister der eigenen Staffel
 * (nur aus der oberen Klasse) und die Meister der anderen Kreise. Diese stellen echte Vereine des
 * Landesverbands (Jugendteams) und erzeugte Ortsvereine, die nur in den unteren Klassen spielen.
 */
function regionalFinal(g: Game, st: YouthCompsState, comp: YcComp, f: LowFormat, y0: number, staffelEnd: string, staffel: string[], ddr: boolean): void {
  const mid = g.managedClubId, cls = comp.cls;
  const region = regionOf(g, mid), lv = lvOf(g, mid);
  const need = E_F_FINAL_TEAMS - (comp.lvl === 0 ? 1 : 0);
  const taken = new Set(staffel);
  const real = germanPool(g, ddr).filter((id) => !taken.has(id) && lvOf(g, id) === lv).sort((a, b) => rel(g, b, cls) - rel(g, a, cls)).slice(0, Math.min(3, need));
  const others: string[] = [...real];
  const names = new Set([...staffel, ...real].map((id) => (isLocalClub(id) ? localClubName(id) : g.clubs[id]?.name ?? g.simClubs[id]?.name)));
  for (let i = 0; others.length < need && i < 200; i++) {
    const id = localClubId(region, false, 200 + i); // eigener Nummernkreis: Kreismeister anderer Kreise
    const nm = localClubName(id);
    if (taken.has(id) || names.has(nm)) continue;
    names.add(nm); others.push(id);
  }
  setStrengths(g, st, cls, others, f.n, g.season);
  const sat = weekdayOnOrAfter(isoAdd(staffelEnd, 1), 6), sun = isoAdd(sat, 1);
  comp.rg = { name: efFinalName(cls, lv), title: efFinalTitle(cls, lv) };
  comp.ko = [
    { name: 'Viertelfinale', legs: 1, dates: [sat], ties: [], drawn: false, entrants: others },
    { name: 'Halbfinale', legs: 1, dates: [sat], ties: [], drawn: false },
    { name: 'Endspiel', legs: 1, dates: [sun], ties: [], drawn: false },
  ];
}

/** Baut die Wettbewerbe der C- bis G-Jugend für die Saison (nur eigener Verein). */
export function buildLowerComps(g: Game, st: YouthCompsState, y0: number, prevComps?: YcComp[]): YcComp[] {
  const mid = g.managedClubId;
  if (!g.clubs[mid]) return [];
  const region = regionOf(g, mid), lv = lvOf(g, mid), city = cityOf(g, mid) || LV_NAME[lv];
  setLocalCity(cityOf(g, mid));
  const ddr = isDdr(g, mid) && y0 < 1991;
  const pts = g.pointSystem === '3-point' ? 3 : 2;
  const out: YcComp[] = [];
  st.lvl ??= {};
  for (const key of LOW_KEYS) {
    const cls = LOW_CLS[key];
    const prev = prevComps?.find((c) => c.key === key);
    const level = nextLevel(g, st, key, prev);
    st.lvl[key] = level;
    const f = lowFormat(key, y0, region, lv, level, ddr);
    const name = lowLeagueName(f, region, lv, city);
    const cands = candidates(g, f, cls, ddr, g.season);
    if (f.kind === 'fest') { out.push(festComp(g, key, cls, f, y0, name, cands)); continue; }
    // Staffel: Vorjahresgegner bleiben (außer Ab-/Aufsteiger), Rest aus den Kandidaten.
    const pl = prev?.leagues[0];
    let keep: string[] = [];
    if (pl && prev?.lvl === level && pl.name === name && pl.fx.length) {
      const t = leagueTable(pl, prev.pts).map((r) => r.clubId).filter((id) => id !== mid);
      const drop = new Set([...(level === 1 ? t.slice(0, 1) : []), ...t.slice(t.length - (level === 0 ? f.down : 2))]);
      keep = t.filter((id) => !drop.has(id) && (isLocalClub(id) || g.clubs[id] || g.simClubs[id]));
    }
    const fill = cands.filter((id) => !keep.includes(id));
    const clubs = [mid, ...keep, ...fill].slice(0, f.size);
    setStrengths(g, st, cls, clubs, f.n, g.season);
    const from = key === 'u15' ? `${y0}-08-29` : `${y0}-09-05`;
    const to = isoAdd(g.calendar.seasonEndDate, -3) < `${y0 + 1}-06-13` ? isoAdd(g.calendar.seasonEndDate, -3) : `${y0 + 1}-06-13`;
    const r = rng32(hash32(`yl|${g.season}|${key}`));
    // E-/F-Jugend: Staffel endet gut eine Woche früher, danach das Endrunden-Wochenende.
    const ef = E_F_CHAMPIONSHIP && (key === 'u11' || key === 'u9');
    const stfTo = ef ? isoAdd(to, -9) : to;
    const fx = fixturesFor(clubs, saturdays(y0, 2 * (clubs.length - (clubs.length % 2 ? 0 : 1)), from, stfTo, ddr), r);
    const comp: YcComp = {
      key, fmt: 'stf', cls, label: name, section: sectionLabel(key, y0), pts, ko: [],
      leagues: [{ id: `low-${key}`, name, stage: 0, clubs, fx, slots: 1, down: f.down || undefined }],
      lvl: level, title: lowTitle(key, f), play: f.play, n: f.n,
    };
    if (ef) regionalFinal(g, st, comp, f, y0, stfTo, clubs, ddr);
    out.push(comp);
  }
  return out;
}
