// =============================================================================
// INTERKONTINENTALE WETTBEWERBE (Wunsch Pascal): Weltpokal 1960–2004, Klub-WM
// (Januar 2000, ab 2005 im Dezember, ab 2025 erweitert mit 32 Teams im Juli),
// Interkontinentalpokal ab 2024. Formate/Namen: data/world/continents/intercontinental.ts.
// -----------------------------------------------------------------------------
// • Aufbau beim Saisonwechsel (`setupIntercontinental` aus setupSuperCups): Europas
//   Teilnehmer aus der abgelaufenen Saison (Landesmeister-/Meisterliga-Sieger,
//   Finalist, frühere Sieger), die übrigen Kontinente aus game/continents.ts.
// • Ohne deinen Verein: sofort schlank ausgespielt → Archiv (Statistiken ›
//   International › Welt). Mit deinem Verein: Termine im Kalender als Ereignis
//   'super_cup' mit `matchId` „ic_…“ – damit laufen Vorschau, Textmodus, Spielbericht
//   und Kalender über den bestehenden Supercup-Weg (findOwnMatchDue, ownFixtureOn,
//   findMatch). Gegner werden erst für dein Spiel voll angelegt (intercontinentalPlay.ts).
// • Titel 'weltpokal' / 'klubwm' / 'intercup' (clubRecords, Vitrine), Prämien.
// Optionales Feld `game.icCups`; fehlt es, legt der nächste Saisonwechsel es an.
// =============================================================================
import type { Match } from '../types';
import type { Game } from './state';
import { homeCountryKey } from './state';
import { CalendarEngine, seasonLabel } from '../engine/calendar';
import { book } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { hashStr, mulberry32 } from '../engine/leagues';
import { makeMessage, pushMessage } from '../engine/messages';
import type { KoRule } from '../engine/match';
import { CONTINENTS, ctClub, ctClubActive, CT_BY_CC, CT_COUNTRIES, ctConfOf, isContinentalId, type ContinentKey } from '../data/world/continents';
import { IC_NAMES, IC_PRIZE, WP_DECLINE, cwcHost, icPlansFor, icVenue, type IcFormat, type IcKey, type IcPlan } from '../data/world/continents/intercontinental';
import { continentalWinner, ctStrengthAt, nationalRanking } from './continents';
import { addTitleRecord, type TitleKind } from './clubRecords';
import { clubStrength, drawClubName } from './cupDraw';
import { IC_STAGE_DE, icKoRule, playIc, resolveIc, type IcGroup, type IcMatch, type IcStage } from './intercontinentalPlay';

export interface IcEvent {
  key: IcKey; name: string; season: string; format: IcFormat;
  teams: string[]; groups?: IcGroup[]; matches: IcMatch[];
  winner?: string; runnerUp?: string; note?: string;
}
/** Archiv: Spiele kompakt [Runde, Heim, Gast, Tore, Tore, Entscheidung 0/1 n.V./2 i.E. Heim/3 i.E. Gast, Gruppe]. */
export type IcArcMatch = [IcStage, string, string, number, number, number, string?];
export interface IcArchive { season: string; key: IcKey; name: string; format: IcFormat; winner: string; runnerUp: string; score: string; note?: string; m?: IcArcMatch[]; groups?: IcGroup[] }
export interface IcState { v: 1; season: string; events: IcEvent[]; archive: IcArchive[]; /** Landesmeister-/Meisterliga-Sieger je Saison (für Klub-WM 2000/2025). */ ecw: Record<string, string> }
type G = Game & { icCups?: IcState };

/** Archiv-Einträge mit allen Spielen (Turnierbaum) je Wettbewerb; ältere nur Sieger/Finale. */
const DETAIL_KEEP = 12;

export function icState(g: Game): IcState {
  const gg = g as G;
  if (!gg.icCups) gg.icCups = { v: 1, season: '', events: [], archive: [], ecw: {} };
  return gg.icCups;
}
export const icStateOf = (g: Game): IcState | undefined => (g as G).icCups;
export const isIcMatchId = (id: string | undefined): boolean => !!id && id.startsWith('ic_');

export const IC_TITLE: Record<IcKey, TitleKind> = { wp: 'weltpokal', cwc: 'klubwm', big: 'klubwm', icup: 'intercup' };

// -----------------------------------------------------------------------------
// Teilnehmer
// -----------------------------------------------------------------------------
export interface IcSeeds { ec: string | null; ecRu: string | null }

const winnerOf = (g: Game, k: ContinentKey, y: number): string | undefined => {
  const w = continentalWinner(g, k, y) ?? CONTINENTS[k].winners[y];
  return w && ctClub(w) && ctClubActive(ctClub(w)!.club, y) ? w : undefined;
};
const confOfId = (id: string, y: number): ContinentKey | 'eu' => { const c = ctClub(id); return c ? ctConfOf(c.country, y) : 'eu'; };
const countryOfId = (g: Game, id: string): string => ctClub(id)?.country.key ?? g.euroClubs?.[id]?.country ?? homeCountryKey(g);

/** Beste Vereine eines Kontinents nach Stärke (ohne `skip`). */
function bestOf(k: ContinentKey, y: number, skip: Set<string>, n: number, perCountry = 99): string[] {
  const all: { id: string; s: number; cc: string }[] = [];
  for (const c of CT_COUNTRIES) {
    if (ctConfOf(c, y) !== k) continue;
    for (const cl of c.clubs) { const id = `w_ct_${c.cc}_${cl.key}`; if (ctClubActive(cl, y) && !skip.has(id)) all.push({ id, s: ctStrengthAt(id, y), cc: c.cc }); }
  }
  all.sort((a, b) => b.s - a.s);
  const per = new Map<string, number>();
  for (const id of skip) { const cc = ctClub(id)?.cc; if (cc) per.set(cc, (per.get(cc) ?? 0) + 1); }
  const out: string[] = [];
  for (const x of all) { if (out.length >= n) break; if ((per.get(x.cc) ?? 0) >= perCountry) continue; out.push(x.id); per.set(x.cc, (per.get(x.cc) ?? 0) + 1); }
  return out;
}
/** Sieger eines Kontinents, sonst der stärkste Verein. */
const champOr = (g: Game, k: ContinentKey, y: number, skip: Set<string>): string | undefined => {
  const w = winnerOf(g, k, y);
  return w && !skip.has(w) ? w : bestOf(k, y, skip, 1)[0];
};

/** Europas beste Vereine (Hintergrund-Welt + volle Vereine der Heimat) nach Stärke. */
function europeBest(g: Game, skip: Set<string>, n: number): string[] {
  const per = new Map<string, number>();
  for (const id of skip) { const c = countryOfId(g, id); per.set(c, (per.get(c) ?? 0) + 1); }
  const cand: { id: string; s: number; c: string }[] = [];
  for (const e of Object.values(g.euroClubs ?? {})) if (!skip.has(e.id) && !isContinentalId(e.id)) cand.push({ id: e.id, s: clubStrength(g, e.id), c: e.country });
  const home = homeCountryKey(g);
  for (const r of g.table?.rows ?? []) if (!skip.has(r.clubId) && !g.euroClubs?.[r.clubId]) cand.push({ id: r.clubId, s: clubStrength(g, r.clubId), c: home });
  cand.sort((a, b) => b.s - a.s || a.id.localeCompare(b.id));
  const out: string[] = [];
  for (const x of cand) { if (out.length >= n) break; if ((per.get(x.c) ?? 0) >= 2) continue; out.push(x.id); per.set(x.c, (per.get(x.c) ?? 0) + 1); }
  return out;
}

// -----------------------------------------------------------------------------
// Aufbau je Format
// -----------------------------------------------------------------------------
const D = (y: number, md: string) => `${y}-${md}`;
type Build = { teams: string[]; matches: Omit<IcMatch, 'id'>[]; groups?: IcGroup[]; note?: string } | null;
const mk = (st: IcStage, date: string, home: string, away: string, more: Partial<IcMatch> = {}): Omit<IcMatch, 'id'> => ({ st, date, home, away, ...more });
const fr = (st: IcStage, date: string, a: string, b: string, more: Partial<IcMatch> = {}): Omit<IcMatch, 'id'> => ({ st, date, home: '', away: '', from: [a, b], neutral: true, ...more });

function groupMatches(gr: IcGroup, dates: string[]): Omit<IcMatch, 'id'>[] {
  const [a, b, c, d] = gr.ids;
  const p: [string, string, number][] = [[a, b, 0], [c, d, 0], [a, c, 1], [b, d, 1], [d, a, 2], [b, c, 2]];
  return p.map(([h, w, md]) => mk((['G1', 'G2', 'G3'] as IcStage[])[md], dates[md], h, w, { grp: gr.name, neutral: true }));
}

function buildWp(g: Game, s: IcSeeds, y: number, plan: IcPlan): Build {
  let eu = s.ec;
  const sa = winnerOf(g, 'sa', y);
  if (!eu || !sa) return null;
  let note: string | undefined;
  const mid = g.managedClubId;
  // 1970er: Europas Meister verzichtet oft – der Finalist springt ein, sonst fällt der Weltpokal aus.
  if (y >= WP_DECLINE.from && y <= WP_DECLINE.to && eu !== mid && mulberry32(hashStr(`wpd|${y}`))() < WP_DECLINE.chance) {
    const ru = s.ecRu;
    note = `${drawClubName(g, eu)} verzichtet auf den Transatlantik-Pokal`;
    if (ru && (ru === mid || mulberry32(hashStr(`wpd2|${y}`))() >= 0.5)) { eu = ru; note += ` – Finalist ${drawClubName(g, ru)} springt ein`; }
    else return { teams: [], matches: [], note: `${note}; der Transatlantik-Pokal ${y} fällt aus` };
  }
  if (plan.format === 'legs2') return { teams: [eu, sa], note, matches: [mk('L1', D(y, '11-19'), sa, eu), mk('L2', D(y, '12-10'), eu, sa)] };
  const [h, a] = y % 2 === 0 ? [eu, sa] : [sa, eu];
  return { teams: [eu, sa], note, matches: [mk('F', D(y, '12-12'), h, a, { neutral: true })] };
}

function buildCwc(g: Game, s: IcSeeds, y: number, plan: IcPlan): Build {
  const eu = s.ec;
  if (!eu) return null;
  const used = new Set<string>([eu]);
  const take = (k: ContinentKey) => { const id = champOr(g, k, y, used); if (id) used.add(id); return id; };
  if (plan.format === 'cwc2000') {
    const eu2 = [icState(g).ecw[seasonLabel(y - 2)], s.ecRu].find((x): x is string => !!x && x !== eu) ?? europeBest(g, used, 1)[0];
    if (eu2) used.add(eu2);
    const sa = take('sa');
    const host = nationalRanking(g, 'bra', y - 1).find((id) => !used.has(id)) ?? bestOf('sa', y, used, 1)[0];
    if (host) used.add(host);
    const [na, af, as, oc] = (['na', 'af', 'as', 'oc'] as ContinentKey[]).map(take);
    const ids = [eu, host, af, as, eu2, sa, na, oc];
    if (ids.some((x) => !x)) return null;
    const groups: IcGroup[] = [{ name: 'A', ids: ids.slice(0, 4) as string[] }, { name: 'B', ids: ids.slice(4) as string[] }];
    const dates = [D(y + 1, '01-05'), D(y + 1, '01-07'), D(y + 1, '01-10')];
    const ms = [...groupMatches(groups[0], dates), ...groupMatches(groups[1], dates)];
    ms.push(fr('P3', D(y + 1, '01-14'), 'G:A:2', 'G:B:2'), fr('F', D(y + 1, '01-14'), 'G:A:1', 'G:B:1'));
    return { teams: ids as string[], groups, matches: ms };
  }
  const sa = take('sa'), na = take('na'), af = take('af'), as = take('as'), oc = take('oc');
  if (!sa || !na || !af || !as || !oc) return null;
  if (plan.format === 'six') {
    return {
      teams: [eu, sa, na, af, as, oc], matches: [
        mk('QF', D(y, '12-11'), af, as, { neutral: true }), mk('QF', D(y, '12-11'), na, oc, { neutral: true }),
        fr('SF', D(y, '12-14'), sa, 'W:0'), fr('SF', D(y, '12-14'), eu, 'W:1'),
        fr('P3', D(y, '12-18'), 'L:2', 'L:3'), fr('F', D(y, '12-18'), 'W:2', 'W:3'),
      ],
    };
  }
  const hostCc = cwcHost(y);
  const host = nationalRanking(g, hostCc, y - 1).find((id) => !used.has(id)) ?? bestOf(ctConfOf(CT_BY_CC[hostCc], y), y, used, 1)[0];
  if (!host) return null;
  return {
    teams: [eu, sa, na, af, as, oc, host], matches: [
      mk('PO', D(y, '12-06'), host, oc, { neutral: true }),
      fr('QF', D(y, '12-09'), 'W:0', af), mk('QF', D(y, '12-09'), na, as, { neutral: true }),
      fr('SF', D(y, '12-13'), sa, 'W:1'), fr('SF', D(y, '12-13'), eu, 'W:2'),
      fr('P3', D(y, '12-17'), 'L:3', 'L:4'), fr('F', D(y, '12-17'), 'W:3', 'W:4'),
    ],
  };
}

function buildIcup(g: Game, s: IcSeeds, y: number): Build {
  const eu = s.ec;
  if (!eu) return null;
  const used = new Set<string>([eu]);
  const take = (k: ContinentKey) => { const id = champOr(g, k, y, used); if (id) used.add(id); return id; };
  const sa = take('sa'), na = take('na'), af = take('af'), as = take('as'), oc = take('oc');
  if (!sa || !na || !af || !as || !oc) return null;
  return {
    teams: [eu, sa, na, af, as, oc], matches: [
      mk('R1', D(y, '09-23'), as, oc, { neutral: true }), fr('AP', D(y, '10-28'), af, 'W:0'),
      mk('DA', D(y, '12-10'), na, sa, { neutral: true }), fr('CH', D(y, '12-14'), 'W:2', 'W:1'), fr('F', D(y, '12-18'), eu, 'W:3'),
    ],
  };
}

function buildBig(g: Game, s: IcSeeds, y: number): Build {
  const st = icState(g);
  const used = new Set<string>();
  // Europa 12: Sieger der letzten vier Spielzeiten + Beste (höchstens 2 je Land).
  for (let k = 1; k <= 4; k++) { const w = st.ecw[seasonLabel(y - k)]; if (w) used.add(w); }
  if (s.ec) used.add(s.ec);
  const eu = [...used, ...europeBest(g, used, Math.max(0, 12 - used.size))].slice(0, 12);
  for (const id of eu) used.add(id);
  const conf = (k: ContinentKey, n: number): string[] => {
    const ids: string[] = [];
    for (let k2 = 1; k2 <= 4 && ids.length < n; k2++) { const w = winnerOf(g, k, y - k2); if (w && !used.has(w) && !ids.includes(w)) ids.push(w); }
    for (const id of ids) used.add(id);
    const more = bestOf(k, y, used, n - ids.length, 2);
    for (const id of more) used.add(id);
    return [...ids, ...more];
  };
  const sa = conf('sa', 6), af = conf('af', 4), as = conf('as', 4), na = conf('na', 4), oc = conf('oc', 1);
  const hostId = nationalRanking(g, 'usa', y - 1).find((id) => !used.has(id)) ?? bestOf('na', y, used, 1)[0];
  const teams = [...eu, ...sa, ...af, ...as, ...na, ...oc, ...(hostId ? [hostId] : [])];
  if (teams.length < 32) return null;
  // Gruppen: vier Töpfe nach Stärke, kein zweiter Verein desselben Kontinents (Europa höchstens zwei).
  const r = mulberry32(hashStr(`icbig|${y}`));
  const sorted = [...teams].sort((a, b) => clubStrength(g, b) - clubStrength(g, a));
  const groups: IcGroup[] = 'ABCDEFGH'.split('').map((name) => ({ name, ids: [] }));
  for (let p = 0; p < 4; p++) {
    const pot = sorted.slice(p * 8, p * 8 + 8);
    for (let i = pot.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pot[i], pot[j]] = [pot[j], pot[i]]; }
    for (const id of pot) {
      const c = confOfId(id, y);
      const open = groups.filter((gr) => gr.ids.length === p);
      const okG = open.find((gr) => gr.ids.filter((x) => confOfId(x, y) === c).length < (c === 'eu' ? 2 : 1)) ?? open[0];
      okG.ids.push(id);
    }
  }
  const dates = [D(y, '07-03'), D(y, '07-07'), D(y, '07-11')];
  const ms: Omit<IcMatch, 'id'>[] = groups.flatMap((gr) => groupMatches(gr, dates));
  const pairs = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['B', 'A'], ['D', 'C'], ['F', 'E'], ['H', 'G']];
  const r16 = ms.length;
  for (const [a, b] of pairs) ms.push(fr('R16', D(y, '07-15'), `G:${a}:1`, `G:${b}:2`));
  for (let i = 0; i < 4; i++) ms.push(fr('QF', D(y, '07-19'), `W:${r16 + i * 2}`, `W:${r16 + i * 2 + 1}`));
  ms.push(fr('SF', D(y, '07-23'), `W:${r16 + 8}`, `W:${r16 + 9}`), fr('SF', D(y, '07-23'), `W:${r16 + 10}`, `W:${r16 + 11}`));
  ms.push(fr('F', D(y, '07-27'), `W:${r16 + 12}`, `W:${r16 + 13}`));
  return { teams, groups, matches: ms };
}

// -----------------------------------------------------------------------------
// Termine (eigener Verein): freie Tage mit Abstand zu deinen Pflichtspielen
// -----------------------------------------------------------------------------
function busyDates(g: Game): Set<string> {
  const mid = g.managedClubId;
  const s = new Set<string>();
  for (const m of g.fixtures) if (m.homeClubId === mid || m.awayClubId === mid) s.add(m.date);
  for (const e of g.calendar.events) if (e.type === 'cup_matchday' || e.type === 'euro_matchday' || e.type === 'super_cup') s.add(e.date);
  return s;
}
function shiftDates(g: Game, ev: IcEvent): void {
  const busy = busyDates(g);
  const order = [...new Set(ev.matches.map((m) => m.date))].sort();
  const map = new Map<string, string>();
  let prev = '';
  for (const d0 of order) {
    let d = prev && d0 <= CalendarEngine.addDays(prev, 2) ? CalendarEngine.addDays(prev, 3) : d0;
    for (let k = 0; k < 25 && [-1, 0, 1].some((o) => busy.has(CalendarEngine.addDays(d, o))); k++) d = CalendarEngine.addDays(d, 1);
    map.set(d0, d); prev = d;
  }
  for (const m of ev.matches) m.date = map.get(m.date) ?? m.date;
}

// -----------------------------------------------------------------------------
// Aufbau zum Saisonstart (aus setupSuperCups)
// -----------------------------------------------------------------------------
export function setupIntercontinental(g: Game, s: IcSeeds): void {
  const st = icState(g);
  const y = parseInt(g.season.slice(0, 4), 10);
  if (s.ec) st.ecw[seasonLabel(y - 1)] = s.ec;
  st.season = g.season;
  st.events = [];
  const mid = g.managedClubId;
  for (const plan of icPlansFor(y)) {
    const b = plan.key === 'wp' ? buildWp(g, s, y, plan) : plan.key === 'icup' ? buildIcup(g, s, y) : plan.key === 'big' ? buildBig(g, s, y) : buildCwc(g, s, y, plan);
    if (!b) continue;
    const name = IC_NAMES[plan.key];
    if (!b.teams.length) { st.archive.push({ season: g.season, key: plan.key, name, format: plan.format, winner: '', runnerUp: '', score: '–', note: b.note }); continue; }
    const tag = `ic_${y}_${plan.key}`;
    const ev: IcEvent = { key: plan.key, name, season: g.season, format: plan.format, teams: b.teams, groups: b.groups, note: b.note, matches: b.matches.map((m, i) => ({ ...m, id: `${tag}_${i}` })) };
    if (!ev.teams.includes(mid)) { playAll(g, ev); continue; }
    shiftDates(g, ev);
    st.events.push(ev);
    const firstOfDate = new Map<string, IcMatch>();
    for (const m of ev.matches) if (!firstOfDate.has(m.date) || m.home === mid || m.away === mid) firstOfDate.set(m.date, m);
    for (const m of firstOfDate.values()) {
      g.calendar.events.push({ id: `icev_${m.id}`, date: m.date, type: 'super_cup', title: `${name}: ${IC_STAGE_DE[m.st]}`, description: `${name} ${g.season}`, matchId: m.id, processed: false, requiresAction: false });
    }
    const first = ev.matches.find((m) => m.home === mid || m.away === mid) ?? ev.matches[0];
    pushMessage(g.messages, makeMessage({
      date: g.calendar.currentDate, category: 'cup', from: 'Weltverband', subject: `${name} ${g.season}: Du bist dabei`,
      shortText: `${IC_STAGE_DE[first.st]} am ${CalendarEngine.formatDate(first.date)}`,
      bodyText: `${b.note ? `${b.note}.\n\n` : ''}${s.ec === mid || s.ecRu === mid ? 'Als Europapokalsieger' : 'Als einer der besten Vereine Europas (Rangliste der letzten Jahre)'} spielst du ${plan.key === 'wp' ? 'den' : plan.key === 'icup' ? 'den' : 'die'} ${name} ${g.season}. Teilnehmer: ${ev.teams.map((id) => drawClubName(g, id)).join(', ')}.\n\nDie Termine stehen im Kalender – Statistiken › International › Welt zeigt Modus und Turnierbaum.`,
    }));
  }
  g.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  trimArchive(st);
}

/** Ganzes Turnier ohne deinen Verein sofort ausspielen (Termine egal). */
function playAll(g: Game, ev: IcEvent): void {
  for (const m of ev.matches) playIc(g, ev.matches, ev.groups, m, ev.season);
  finish(g, ev, g.calendar.currentDate);
}

function trimArchive(st: IcState): void {
  const n: Record<string, number> = {};
  for (let i = st.archive.length - 1; i >= 0; i--) {
    const a = st.archive[i];
    if (a.m && (n[a.key] = (n[a.key] ?? 0) + 1) > DETAIL_KEEP) { delete a.m; delete a.groups; }
  }
  if (st.archive.length > 400) st.archive.splice(0, st.archive.length - 400);
}

const finalOf = (ev: IcEvent) => ev.matches.find((m) => m.st === 'F') ?? ev.matches.find((m) => m.st === 'L2');

function finish(g: Game, ev: IcEvent, date: string): void {
  const f = finalOf(ev);
  if (!f?.played || ev.winner) return;
  ev.winner = f.winner;
  ev.runnerUp = f.winner === f.home ? f.away : f.home;
  const l1 = ev.matches.find((m) => m.st === 'L1');
  // Ergebnis aus Sicht des Siegers („2:1 gegen …“); Hin-/Rückspiel: Gesamtstand + beide Spiele.
  const flip = ev.winner !== f.home;
  const sc = (h: number, a: number) => (flip ? `${a}:${h}` : `${h}:${a}`);
  const score = f.st === 'L2' && l1 ? `${sc((f.hg ?? 0) + (l1.ag ?? 0), (f.ag ?? 0) + (l1.hg ?? 0))}${f.pens ? ' i.E.' : ''} (${l1.hg}:${l1.ag}, ${f.hg}:${f.ag})`
    : `${sc(f.hg ?? 0, f.ag ?? 0)}${f.pens ? ` (${sc(f.pens[0], f.pens[1])} i.E.)` : f.aet ? ' n.V.' : ''}`;
  addTitleRecord(g, ev.winner!, IC_TITLE[ev.key], ev.season);
  const st = icState(g);
  st.archive.push({
    season: ev.season, key: ev.key, name: ev.name, format: ev.format, winner: ev.winner!, runnerUp: ev.runnerUp!, score, note: ev.note, groups: ev.groups,
    m: ev.matches.filter((m) => m.played).map((m) => [m.st, m.home, m.away, m.hg ?? 0, m.ag ?? 0, m.pens ? (m.pens[0] > m.pens[1] ? 2 : 3) : m.aet ? 1 : 0, ...(m.grp ? [m.grp] : [])] as IcArcMatch),
  });
  // Prämien (volle Vereine): Antritt, je Sieg, Titel.
  const pz = IC_PRIZE[ev.format];
  const k = economyScale(yearOf(date));
  for (const id of ev.teams) {
    const c = g.clubs[id];
    if (!c || id.startsWith('w_') || id.startsWith('eu_')) continue;
    const wins = ev.matches.filter((m) => m.played && (m.winner === id || (!m.winner && m.st.startsWith('G') && ((m.home === id && m.hg! > m.ag!) || (m.away === id && m.ag! > m.hg!))))).length;
    const amt = pz.start + pz.round * wins + (id === ev.winner ? pz.win : 0);
    book(c.finances, date, Math.round(amt * k), 'prize_money', `Prämie ${ev.name}`, id === g.managedClubId);
  }
  const mid = g.managedClubId;
  const home = homeCountryKey(g);
  const local = ev.teams.filter((id) => g.clubs[id] && !id.startsWith('w_') && !id.startsWith('eu_') && countryOfId(g, id) === home);
  if (!local.length) return;
  const mine = ev.teams.includes(mid);
  pushMessage(g.messages, makeMessage({
    date, category: 'cup', from: 'Weltverband', relatedId: mine ? f.match?.id : undefined,
    subject: ev.winner === mid ? `${ev.name} gewonnen!` : `${ev.name} ${ev.season}: ${drawClubName(g, ev.winner!)}`,
    shortText: `${drawClubName(g, ev.winner!)} – ${drawClubName(g, ev.runnerUp!)} ${score}`,
    bodyText: ev.winner === mid ? `Dein Verein ist der beste der Welt: ${ev.name} ${ev.season}. Prämie und Ansehen sind dir sicher.`
      : mine ? `${drawClubName(g, ev.winner!)} gewinnt ${/Weltturnier/.test(ev.name) ? 'das' : 'den'} ${ev.name}. Dein Verein scheidet aus – die Reise bleibt eine Erfahrung.`
        : `${drawClubName(g, ev.winner!)} gewinnt ${/Weltturnier/.test(ev.name) ? 'das' : 'den'} ${ev.name} ${ev.season}.`,
  }));
}

// -----------------------------------------------------------------------------
// Spieltag & eigenes Spiel (über den Supercup-Weg)
// -----------------------------------------------------------------------------
function eventOf(g: Game, matchId: string | undefined): IcEvent | undefined {
  return icStateOf(g)?.events.find((e) => e.matches.some((m) => m.id === matchId));
}

/** Kalender-Ereignis 'super_cup' mit „ic_…“ (superCupMatchday). Rückgabe: Match-ID des eigenen Spiels. */
export function icMatchday(g: Game, matchId: string | undefined, today: string): string | null {
  const ev = eventOf(g, matchId);
  const m0 = ev?.matches.find((m) => m.id === matchId);
  if (!ev || !m0) return null;
  let own: string | null = null;
  for (const m of ev.matches.filter((x) => x.date === m0.date && !x.played)) {
    playIc(g, ev.matches, ev.groups, m, ev.season);
    if (m.match && (m.home === g.managedClubId || m.away === g.managedClubId)) own = m.match.id;
  }
  if (finalOf(ev)?.played) finish(g, ev, today);
  return own;
}

/** Eigenes, noch offenes Spiel am Termin des Ereignisses (findOwnMatchDue). */
export function ownIcDue(g: Game, matchId: string | undefined): { ev: IcEvent; m: IcMatch; ko?: KoRule; label: string; venue?: string; firstLeg?: { home: string; away: string; hg: number; ag: number; awayGoals: boolean }; stageNote?: string } | null {
  const ev = eventOf(g, matchId);
  const m0 = ev?.matches.find((m) => m.id === matchId);
  if (!ev || !m0) return null;
  const mid = g.managedClubId;
  const m = ev.matches.find((x) => x.date === m0.date && !x.played && (resolveIc(ev.matches, ev.groups, x), x.home === mid || x.away === mid));
  if (!m) return null;
  const ok = (id: string) => !!g.clubs[id] || !!g.euroClubs?.[id] || isContinentalId(id);
  if (!ok(m.home) || !ok(m.away)) return null;
  const l1 = m.st === 'L2' ? ev.matches.find((x) => x.st === 'L1') : undefined;
  return {
    ev, m, ko: icKoRule(ev.matches, m), label: `${ev.name} · ${IC_STAGE_DE[m.st]}${m.grp ? ` (Gruppe ${m.grp})` : ''}`,
    venue: m.neutral ? icVenue(ev.format, parseInt(ev.season.slice(0, 4), 10)) : undefined,
    firstLeg: l1 ? { home: l1.home, away: l1.away, hg: l1.hg ?? 0, ag: l1.ag ?? 0, awayGoals: true } : undefined,
    stageNote: m.st === 'L1' ? 'Hinspiel' : m.st.startsWith('G') ? 'Gruppenspiel – Remis möglich' : m.neutral ? 'Neutraler Platz – bei Remis Verlängerung und Elfmeterschießen' : undefined,
  };
}

/** Eigenes Spiel an einem Kalendertermin (game/euroFixture.ts `ownFixtureOn`). */
export function icFixtureOn(g: Game, matchId: string | undefined, me: string): { opp: string; home: boolean; match: Match | null; comp: string } | null {
  const ev = eventOf(g, matchId);
  const m0 = ev?.matches.find((m) => m.id === matchId);
  if (!ev || !m0) return null;
  const mm = ev.matches.find((x) => x.date === m0.date && (resolveIc(ev.matches, ev.groups, x), x.home === me || x.away === me));
  if (!mm) return null;
  return { opp: mm.home === me ? mm.away : mm.home, home: mm.home === me, match: mm.match ?? null, comp: `${ev.name} · ${IC_STAGE_DE[mm.st]}` };
}

/** Match-Objekt für den Spielbericht. */
export function findIcMatch(g: Game, id: string): { match: Match; label: string } | null {
  for (const ev of icStateOf(g)?.events ?? []) for (const m of ev.matches) if (m.match?.id === id) return { match: m.match, label: `${ev.name} · ${IC_STAGE_DE[m.st]}` };
  return null;
}

/** Archiv-Eintrag (Vitrine). */
export function icArchiveFor(g: Game, season: string, kind: TitleKind, clubId: string): IcArchive | undefined {
  return icStateOf(g)?.archive.find((a) => a.season === season && IC_TITLE[a.key] === kind && (a.winner === clubId || a.runnerUp === clubId));
}
