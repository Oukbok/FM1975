// =============================================================================
// JUGENDWETTBEWERBE — Tagesablauf (Aufruf aus game/day.ts) + Saisonwechsel
// -----------------------------------------------------------------------------
// • Saisonwechsel: alte Saison ins Archiv (Tabellen, K.-o.-Runden, Top-N der
//   Bestenlisten), neue Saison aufsetzen.
// • Täglich: Spiele des Tages, Auslosung fälliger K.-o.-Runden, Titel.
// • Alte Spielstände / neues Spiel: Wettbewerbe starten sofort, vergangene Spieltage
//   der laufenden Saison werden beim ersten Aufruf nachsimuliert.
// Wirkungen (dezent): Titel/Finale heben den Ruf der Akademie; Siege geben eigenen
// Jugendspielern etwas Entwicklungsfortschritt, Titel zusätzlich Moral.
// =============================================================================
import { TITLE_OF, isoAdd, type YcKey } from '../../data/youthCompetitions';
import { seasonStartYear } from '../../data/timeline';
import { makeMessage, pushMessage } from '../../engine/messages';
import { addTitleRecord, type TitleKind } from '../clubRecords';
import { bumpMorale, type Game } from '../state';
import { archiveSeason } from './archive';
import { buildNwlMainRound, setupSeason } from './setup';
import { CARD_RATE, GOAL_BASE, buildLowerComps } from './lower';
import { isLocalClub, localClubName, setLocalCity } from './localClubs';
import { youthAgeClass } from '../../types';
import { cityOf, hash32, lineupOf, pruneStats, recordSide, rng32, shootout, simGoals, tierOfClub } from './sim';
import { leagueDone, leagueTable } from './table';
import type { YcComp, YcRound, YcTie, YouthCompsState } from './types';

type GameYc = Game & { youthComps?: YouthCompsState };
export const youthCompsOf = (g: Game): YouthCompsState | undefined => (g as GameYc).youthComps;

export const TITLE_KIND: Partial<Record<YcKey, TitleKind>> = {
  u19: 'jugendA', u17: 'jugendB', pokal: 'jugendPokal', ddr: 'jugendDdr', uyl: 'uyl', u15: 'jugendC', u13: 'jugendD', u11: 'jugendE', u9: 'jugendF',
};

// -----------------------------------------------------------------------------
// Einstieg
// -----------------------------------------------------------------------------
/** Legt die Wettbewerbe an (neues Spiel, alter Spielstand) und holt vergangene Tage nach. */
export function ensureYouthComps(g: Game, today: string): YouthCompsState {
  const gg = g as GameYc;
  if (!gg.youthComps) {
    gg.youthComps = { v: 1, season: g.season, comps: [], members: {}, str: {}, stats: {}, people: {}, archive: [] };
    setupSeason(g, gg.youthComps);
    catchUp(g, gg.youthComps, today);
  }
  return gg.youthComps;
}

/** Idempotente Nachrüstung beim Laden (App.tsx). */
export function migrateYouthComps(g: Game): void {
  const st = youthCompsOf(g);
  setLocalCity(cityOf(g, g.managedClubId));
  if (!st) { ensureYouthComps(g, g.calendar.currentDate); return; }
  slimPeople(st);
  // C- bis G-Jugend (ab Version mit allen Klassen): sofort in der laufenden Saison starten,
  // vergangene Spieltage nur dieser Wettbewerbe nachholen.
  if (!st.low && st.season === g.season) {
    const low = buildLowerComps(g, st, seasonStartYear(g.season));
    st.comps.push(...low);
    const keys = new Set(low.map((c) => c.key));
    const y0 = seasonStartYear(g.season);
    for (let d = `${y0}-07-01`; d < g.calendar.currentDate; d = isoAdd(d, 1)) playDay(g, st, d, true, keys);
    st.low = 1;
  }
}

/** Nur schlanke Einträge [Name, Verein, Position]: falls ein Spielstand ganze Spielerobjekte enthält, kürzen. */
export function slimPeople(st: YouthCompsState): number {
  let n = 0;
  const fix = (m: Record<string, unknown> | undefined) => {
    if (!m) return;
    for (const [id, v] of Object.entries(m)) {
      if (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'string')) continue;
      const o = (v ?? {}) as { fullName?: string; firstName?: string; lastName?: string; clubId?: string; naturalPosition?: string };
      m[id] = [o.fullName ?? (`${o.firstName ?? ''} ${o.lastName ?? ''}`.trim() || id), o.clubId ?? '', o.naturalPosition ?? ''];
      n++;
    }
  };
  fix(st.people as Record<string, unknown>);
  for (const a of st.archive) fix(a.people as Record<string, unknown>);
  // Statistik: nur Zahlentupel.
  for (const m of Object.values(st.stats)) for (const [id, t] of Object.entries(m ?? {})) {
    if (!Array.isArray(t) || t.length !== 7 || t.some((x) => typeof x !== 'number')) { delete m![id]; n++; }
  }
  return n;
}

function catchUp(g: Game, st: YouthCompsState, until: string): void {
  const y0 = seasonStartYear(g.season);
  for (let d = `${y0}-07-01`; d < until; d = isoAdd(d, 1)) playDay(g, st, d, true);
}

export function youthCompsDaily(g: Game, today: string): void {
  const st = ensureYouthComps(g, today);
  if (st.season !== g.season) {
    // Was bis zum Saisonende nicht gespielt wurde (z. B. alte Spielstände), wird nachgeholt.
    const y1 = seasonStartYear(st.season) + 1;
    for (let d = st.day ? isoAdd(st.day, 1) : `${y1}-06-01`; d <= `${y1}-08-31` && st.comps.some((c) => !c.done); d = isoAdd(d, 1)) playDay(g, st, d, true);
    const prev = st.comps;
    archiveSeason(g, st);
    setupSeason(g, st, prev);
    catchUp(g, st, today);
  }
  if (st.day && st.day >= today) return;
  playDay(g, st, today, false);
}

// -----------------------------------------------------------------------------
// Ein Tag
// -----------------------------------------------------------------------------
function playDay(g: Game, st: YouthCompsState, d: string, quiet: boolean, only?: Set<YcKey>): void {
  const y0 = seasonStartYear(st.season);
  const r = Math.random;
  for (const comp of st.comps) {
    if (comp.done || (only && !only.has(comp.key))) continue;
    if (comp.fest) { festDay(g, st, comp, d); continue; }
    for (const l of comp.leagues) {
      for (const f of l.fx) {
        if (f[0] !== d || f[3] >= 0) continue;
        const [hg, ag] = playMatch(g, st, comp, f[1], f[2], false, y0, r);
        f[3] = hg; f[4] = ag;
      }
    }
    if (comp.fmt === 'nwl' && !comp.leagues.some((l) => l.stage === 1) && comp.leagues.every(leagueDone) && comp.leagues.length) {
      buildNwlMainRound(comp, y0, rng32(hash32(`nwl|${st.season}|${comp.key}`)));
    }
    comp.ko.forEach((rd, ri) => {
      // Auslosung, sobald die Teilnehmer feststehen (spätestens am Spieltag).
      if (!rd.drawn && (ri === 0 ? rd.dates[0] <= isoAdd(d, 21) : true)) drawRound(g, comp, ri, rng32(hash32(`${st.season}|${comp.key}|${ri}`)), quiet);
      if (!rd.drawn) return;
      rd.dates.forEach((date, leg) => { if (date === d) for (const t of rd.ties) playLeg(g, st, comp, rd, t, leg, y0, r); });
    });
    // Abschluss
    if (!comp.ko.length && comp.leagues.length && comp.leagues.every(leagueDone)) {
      finish(g, st, comp, leagueTable(comp.leagues[0], comp.pts)[0]?.clubId ?? null, null, d, quiet);
    } else if (comp.ko.length) {
      // E-/F-Jugend: Staffeltitel, sobald die Staffel fertig ist – die Endrunde folgt danach.
      if (comp.fmt === 'stf' && !comp.stfDone && comp.leagues.length && comp.leagues.every(leagueDone)) {
        comp.stfDone = 1;
        const sw = leagueTable(comp.leagues[0], comp.pts)[0]?.clubId;
        if (sw) finishLower(g, st, comp, sw, d, quiet);
      }
      const fin = comp.ko[comp.ko.length - 1];
      const t = fin.ties[0];
      if (fin.drawn && t?.w) finish(g, st, comp, t.w, t.w === t.h ? t.a : t.h, d, quiet);
    }
  }
  if (d.endsWith('-01')) pruneStats(st);
  if (!only) st.day = d;
}

function playMatch(g: Game, st: YouthCompsState, comp: YcComp, h: string, a: string, neutral: boolean, y0: number, r: () => number): [number, number] {
  const n = comp.n ?? 11;
  const lh = lineupOf(g, st, h, comp.cls, y0, n), la = lineupOf(g, st, a, comp.cls, y0, n);
  const [hg, ag] = simGoals(lh.strength, la.strength, neutral, r, GOAL_BASE[comp.cls] ?? 1.65);
  const year = y0 + 1;
  const cards = CARD_RATE[comp.cls] ?? 1;
  recordSide(g, st, comp.key, h, lh.slots, hg, ag, year, r, false, cards);
  recordSide(g, st, comp.key, a, la.slots, ag, hg, year, r, false, cards);
  // Eigene Jugendspieler: Siege geben etwas Entwicklungsschub (dezent).
  const mid = g.managedClubId;
  if (h === mid || a === mid) {
    const mine = h === mid ? lh.slots : la.slots;
    const won = h === mid ? hg > ag : ag > hg;
    const drawn = hg === ag;
    for (const s of mine) {
      const p = s.real ? g.youthPlayers[s.id] : undefined;
      if (p) p.development.ovrProgress = (p.development.ovrProgress ?? 0) + (won ? 0.02 : drawn ? 0.008 : 0) * (comp.fmt === 'stf' ? 0.6 : 1);
    }
  }
  return [hg, ag];
}

// -----------------------------------------------------------------------------
// K.-o.-Runden
// -----------------------------------------------------------------------------
const winnersOf = (rd: YcRound) => rd.ties.map((t) => t.w).filter((x): x is string => !!x);
const roundDone = (rd: YcRound | undefined) => !!rd && rd.drawn && rd.ties.every((t) => !!t.w);

function shuffled<T>(a: T[], r: () => number): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Endrunden-Teilnehmer aus der letzten Ligaphase (Plätze je Staffel). */
function qualifiers(comp: YcComp): string[][] | null {
  const stage = Math.max(...comp.leagues.map((l) => l.stage));
  const ls = comp.leagues.filter((l) => l.stage === stage);
  if (!ls.length || !ls.every(leagueDone)) return null;
  return ls.map((l) => leagueTable(l, comp.pts).slice(0, l.slots).map((x) => x.clubId));
}

/** Paarungen einer Runde (oder null, wenn die Teilnehmer noch nicht feststehen). */
function pairings(g: Game, comp: YcComp, ri: number, r: () => number): [string, string][] | null {
  const rd = comp.ko[ri];
  const prev = comp.ko[ri - 1];
  const pairUp = (ids: string[]): [string, string][] => {
    const s = shuffled(ids, r);
    const out: [string, string][] = [];
    for (let i = 0; i + 1 < s.length; i += 2) out.push([s[i], s[i + 1]]);
    return out;
  };
  // Erste Endrundenrunde der Meisterschaften: möglichst keine Paarung aus derselben Staffel.
  if (ri === 0 && ['lv16', 'rl8', 'bl4', 'nwl'].includes(comp.fmt)) {
    const q = qualifiers(comp);
    if (!q) return null;
    const ids = q.flat();
    let best = pairUp(ids), bestBad = 99;
    for (let k = 0; k < 30 && bestBad > 0; k++) {
      const p = k ? pairUp(ids) : best;
      const bad = p.filter(([a, b]) => q.findIndex((x) => x.includes(a)) === q.findIndex((x) => x.includes(b))).length;
      if (bad < bestBad) { best = p; bestBad = bad; }
    }
    return best;
  }
  // E-/F-Jugend: Meister der eigenen Staffel (obere Klasse) + Kreismeister der anderen Kreise.
  if (comp.fmt === 'stf' && ri === 0) {
    const q = comp.lvl === 0 ? qualifiers(comp) : [];
    if (!q) return null;
    return pairUp([...q.flat(), ...(rd.entrants ?? [])]);
  }
  if (rd.entrants && comp.fmt === 'cup21' && ri === 0) return pairUp(shuffled(rd.entrants, r).slice(0, Math.max(0, rd.entrants.length - 16) * 2));
  if (rd.entrants) return pairUp(rd.entrants);
  if (comp.fmt.startsWith('cup')) {
    if (!roundDone(prev)) return null;
    let ids = winnersOf(prev);
    if (comp.fmt === 'cup21' && ri === 1) ids = [...ids, ...(prev.entrants ?? []).filter((x) => !prev.ties.some((t) => t.h === x || t.a === x))];
    return pairUp(ids);
  }
  if (comp.fmt.startsWith('uyl')) {
    const groups = comp.leagues;
    const groupsDone = groups.every(leagueDone);
    const rank = (pos: number) => groups.map((l) => leagueTable(l, comp.pts)[pos]?.clubId).filter(Boolean) as string[];
    const cross = (home: string[], away: string[]): [string, string][] => { const a = shuffled(away, r); return shuffled(home, r).map((h, i) => [h, a[i]] as [string, string]).filter(([, x]) => !!x); };
    if (comp.fmt === 'uyl1' && ri === 0) return groupsDone ? cross(rank(0), rank(1)) : null;
    if (comp.fmt === 'uyl2' && ri === 1) return groupsDone && roundDone(prev) ? cross(winnersOf(prev), rank(1)) : null;
    if (comp.fmt === 'uyl2' && ri === 2) return roundDone(prev) ? cross(rank(0), winnersOf(prev)) : null;
    if (comp.fmt === 'uyl3' && ri === 1) {
      if (!groupsDone || !roundDone(prev)) return null;
      const t = leagueTable(groups[0], comp.pts).map((x) => x.clubId);
      const top = t.slice(0, 6), low = t.slice(16, 22).reverse(), mid = t.slice(6, 16);
      return [...top.map((h, i) => [h, low[i]] as [string, string]), ...cross(mid, winnersOf(prev))];
    }
  }
  return roundDone(prev) ? pairUp(winnersOf(prev)) : null;
}

function drawRound(g: Game, comp: YcComp, ri: number, r: () => number, quiet: boolean): void {
  const p = pairings(g, comp, ri, r);
  if (!p) return;
  const rd = comp.ko[ri];
  rd.ties = p.map(([h, a]) => {
    // Pokal: Amateure haben bis einschließlich Halbfinale Heimrecht gegen höherklassige Vereine.
    if (comp.fmt.startsWith('cup') && ri < comp.ko.length - 1 && tierOfClub(g, a) > tierOfClub(g, h) && tierOfClub(g, a) >= 3) return { h: a, a: h, g: [] };
    return { h, a, g: [] };
  });
  rd.drawn = true;
  // Eigene Mannschaft erreicht die Endrunde der Meisterschaft.
  const mid = g.managedClubId;
  if (!quiet && ri === 0 && ['lv16', 'rl8', 'bl4', 'nwl'].includes(comp.fmt) && rd.ties.some((t) => t.h === mid || t.a === mid)) {
    pushMessage(g.messages, makeMessage({
      date: rd.dates[0], category: 'training', from: 'Leiter Jugendakademie',
      subject: `${comp.cls}-Jugend in der Endrunde`,
      shortText: `${comp.label}: Deine ${comp.cls}-Jugend spielt um die Deutsche Meisterschaft.`,
      bodyText: `Deine ${comp.cls}-Jugend hat sich für die Endrunde (${rd.name}) qualifiziert. Die Paarungen findest du unter Jugend › Jugendwettbewerbe.`,
    }));
  }
}

function playLeg(g: Game, st: YouthCompsState, comp: YcComp, rd: YcRound, t: YcTie, leg: number, y0: number, r: () => number): void {
  if (t.g.length > leg || t.w) return;
  const isFinal = rd === comp.ko[comp.ko.length - 1];
  const neutral = isFinal || (comp.fmt.startsWith('uyl') && rd.name === 'Halbfinale');
  const home = leg === 0 ? t.h : t.a, away = leg === 0 ? t.a : t.h;
  const [hg, ag] = playMatch(g, st, comp, home, away, neutral, y0, r);
  t.g.push(leg === 0 ? [hg, ag] : [ag, hg]);
  if (t.g.length < rd.legs) return;
  const sh = t.g.reduce((s, x) => s + x[0], 0), sa = t.g.reduce((s, x) => s + x[1], 0);
  if (sh !== sa) { t.w = sh > sa ? t.h : t.a; t.dec = 0; return; }
  const lh = lineupOf(g, st, t.h, comp.cls, y0).strength, la = lineupOf(g, st, t.a, comp.cls, y0).strength;
  if (rd.legs === 1) {
    // Verlängerung (2 × 15 bzw. im Endspiel der Meisterschaft 2 × 10), dann Elfmeterschießen.
    const [eh, ea] = simGoals(lh, la, neutral, r).map((x) => Math.round(x / 3)) as [number, number];
    if (eh || ea) {
      recordSide(g, st, comp.key, t.h, lineupOf(g, st, t.h, comp.cls, y0).slots, eh, 1, y0 + 1, r, true);
      recordSide(g, st, comp.key, t.a, lineupOf(g, st, t.a, comp.cls, y0).slots, ea, 1, y0 + 1, r, true);
      t.g[0] = [t.g[0][0] + eh, t.g[0][1] + ea];
      t.dec = 1;
    }
    if (eh !== ea) { t.w = eh > ea ? t.h : t.a; t.dec = 1; return; }
  }
  const [ph, pa] = shootout(lh, la, r);
  t.pen = [ph, pa]; t.w = ph > pa ? t.h : t.a; t.dec = 2;
}

// -----------------------------------------------------------------------------
// Abschluss: Titel, Ruf, Nachrichten
// -----------------------------------------------------------------------------
function finish(g: Game, st: YouthCompsState, comp: YcComp, winner: string | null, runnerUp: string | null, d: string, quiet: boolean): void {
  comp.done = true;
  comp.winner = winner;
  if (!winner) return;
  if (comp.fmt === 'stf') { if (comp.rg) finishRegional(g, st, comp, winner, runnerUp, d, quiet); else finishLower(g, st, comp, winner, d, quiet); return; }
  const kind = TITLE_KIND[comp.key];
  if (kind) addTitleRecord(g, winner, kind, st.season);
  const bump: Partial<Record<YcKey, number>> = { u19: 2, u17: 1.5, pokal: 1, ddr: 1.5, uyl: 3 };
  rep(g, winner, bump[comp.key] ?? 0);
  rep(g, runnerUp, (bump[comp.key] ?? 0) * 0.35);
  const mid = g.managedClubId;
  const name = (id: string) => g.clubs[id]?.name ?? g.simClubs[id]?.name ?? g.euroClubs?.[id]?.name ?? id;
  if (winner === mid) titleBoost(g, st, comp, 6, 0.25);
  if (quiet) return;
  const mine = winner === mid || runnerUp === mid;
  if (!mine && !['u19', 'u17', 'ddr', 'uyl'].includes(comp.key)) return;
  if (comp.key === 'uyl' && !mine && !g.clubs[winner] && !g.simClubs[winner]) return;
  pushMessage(g.messages, makeMessage({
    date: d, category: mine ? 'training' : 'general', from: mine ? 'Leiter Jugendakademie' : 'Jugend-Nachrichten',
    subject: winner === mid ? `${TITLE_OF[comp.key]} ${st.season}!` : `${comp.label}: ${name(winner)} gewinnt`,
    shortText: winner === mid ? `Deine ${comp.cls}-Jugend holt den Titel.` : runnerUp === mid ? `Deine ${comp.cls}-Jugend verliert das Endspiel.` : `${name(winner)} ist ${TITLE_OF[comp.key]} ${st.season}.`,
    bodyText: winner === mid
      ? `Großer Tag für die Akademie: Deine ${comp.cls}-Jugend ist ${TITLE_OF[comp.key]} ${st.season}${runnerUp ? ` (im Endspiel gegen ${name(runnerUp)})` : ''}. Der Ruf der Jugendarbeit steigt, die Spieler gehen mit breiter Brust in die nächste Saison. (Jugend › Jugendwettbewerbe)`
      : runnerUp === mid
        ? `Deine ${comp.cls}-Jugend unterliegt im Endspiel ${name(winner)}. Trotzdem: Das Erreichen des Finales spricht sich herum. (Jugend › Jugendwettbewerbe)`
        : `${name(winner)} gewinnt ${comp.label} ${st.season}${runnerUp ? ` gegen ${name(runnerUp)}` : ''}. (Jugend › Jugendwettbewerbe)`,
  }));
}

const rep = (g: Game, id: string | null, v: number) => {
  const inv = id && v ? g.clubs[id]?.youthInvest : undefined;
  if (inv) inv.reputation = Math.min(100, Math.round((inv.reputation + v) * 10) / 10);
};

/** Titel: Moral und ein kleiner Entwicklungsschub für die eigenen Spieler mit Einsätzen. */
function titleBoost(g: Game, st: YouthCompsState, comp: YcComp, morale: number, dev: number): void {
  const mid = g.managedClubId;
  for (const [pid, tu] of Object.entries(st.stats[comp.key] ?? {})) {
    const p = g.youthPlayers[pid];
    if (!p || p.clubId !== mid || tu[0] < 1) continue;
    p.morale = bumpMorale(p.morale, 1);
    if (p.moraleScore != null) p.moraleScore = Math.min(100, p.moraleScore + morale);
    p.development.ovrProgress = (p.development.ovrProgress ?? 0) + dev;
  }
}

// -----------------------------------------------------------------------------
// C- bis G-Jugend: Staffelsieg, Auf-/Abstieg, Spielfeste
// -----------------------------------------------------------------------------
function finishLower(g: Game, st: YouthCompsState, comp: YcComp, winner: string, d: string, quiet: boolean): void {
  const mid = g.managedClubId;
  const l = comp.leagues[0];
  const t = leagueTable(l, comp.pts);
  const pos = t.find((r) => r.clubId === mid)?.pos ?? 0;
  const cls = `${comp.cls}-Jugend`;
  const kind = TITLE_KIND[comp.key];
  let subject = '', text = '';
  if (winner === mid) {
    if (kind) addTitleRecord(g, mid, kind, st.season);
    rep(g, mid, comp.key === 'u15' ? 0.4 : comp.key === 'u13' ? 0.2 : 0.1);
    titleBoost(g, st, comp, 4, comp.key === 'u15' ? 0.15 : 0.1);
    subject = `${comp.title ?? cls} ${st.season}`;
    text = `Deine ${cls} gewinnt die ${l.name}${comp.lvl === 1 ? ' und steigt auf' : ''}.`;
  } else if (comp.lvl === 0 && l.down && pos > t.length - l.down) {
    subject = `${cls} steigt ab`; text = `Deine ${cls} wird ${pos}. in der ${l.name} und muss absteigen.`;
  }
  if (quiet || !subject) return;
  pushMessage(g.messages, makeMessage({
    date: d, category: 'training', from: 'Leiter Jugendakademie', subject, shortText: text,
    bodyText: `${text} Tabelle und Bestenlisten findest du unter Jugend › Jugendwettbewerbe.`,
  }));
}

/** E-/F-Jugend: Endrunde der Kreismeister entschieden. */
function finishRegional(g: Game, st: YouthCompsState, comp: YcComp, winner: string, runnerUp: string | null, d: string, quiet: boolean): void {
  const mid = g.managedClubId;
  const kind: TitleKind = comp.cls === 'E' ? 'jugendEReg' : 'jugendFReg';
  if (!isLocalClub(winner)) addTitleRecord(g, winner, kind, st.season);
  if (winner === mid) { rep(g, mid, 0.3); titleBoost(g, st, comp, 5, 0.12); }
  const inFinal = winner === mid || runnerUp === mid;
  const inRound = comp.ko[0]?.ties.some((t) => t.h === mid || t.a === mid);
  if (quiet || !inRound) return;
  const nm = (id: string) => (isLocalClub(id) ? localClubName(id) : g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id);
  const text = winner === mid ? `Deine ${comp.cls}-Jugend gewinnt die ${comp.rg!.name}!`
    : inFinal ? `Deine ${comp.cls}-Jugend verliert das Endspiel der ${comp.rg!.name} gegen ${nm(winner)}.`
    : `Deine ${comp.cls}-Jugend scheidet in der ${comp.rg!.name} aus. Meister wird ${nm(winner)}.`;
  pushMessage(g.messages, makeMessage({
    date: d, category: 'training', from: 'Leiter Jugendakademie', subject: winner === mid ? `${comp.rg!.title} ${st.season}` : comp.rg!.name,
    shortText: text, bodyText: `${text} Die Endrunde findest du unter Jugend › Jugendwettbewerbe.`,
  }));
}

/** Spielfest: alle Kinder der Klasse spielen mit (nur Einsätze, keine Ergebnisse). */
function festDay(g: Game, st: YouthCompsState, comp: YcComp, d: string): void {
  const f = comp.fest!;
  if (f.d.includes(d)) {
    const c = g.clubs[g.managedClubId];
    const m = (st.stats[comp.key] ??= {});
    for (const id of c?.youthPlayerIds ?? []) {
      const p = g.youthPlayers[id];
      if (!p || youthAgeClass(p.age) !== comp.cls) continue;
      (m[id] ??= [0, 0, 0, 0, 0, 0, 0])[0]++;
      st.people[id] ??= [p.fullName, p.clubId, p.naturalPosition];
      p.development.ovrProgress = (p.development.ovrProgress ?? 0) + 0.006;
      if (p.moraleScore != null) p.moraleScore = Math.min(100, p.moraleScore + 1);
    }
  }
  if (d >= f.d[f.d.length - 1] || !f.d.length) { comp.done = true; comp.winner = null; }
}
