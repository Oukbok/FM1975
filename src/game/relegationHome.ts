// =============================================================================
// RELEGATION IM HEIMATLAND (Wunsch Pascal) – optionales `game.relegation`
// -----------------------------------------------------------------------------
// Achtung, Namensgleichheit: game/relegationGame.ts behandelt das ENDE DER AMTSZEIT
// nach dem Abstieg aus der untersten Liga. Hier geht es um Relegations-, Play-off-
// und Entscheidungsspiele zwischen zwei Ligen (Formate data/relegationRules.ts).
//  • Saisonstart (`setupHomeRelegation`, newGame.ts/season.ts): je Format der Saison
//    Termine nach dem letzten Spieltag der beteiligten Ligen (Hinspiel + 4 Tage,
//    Rückspiel 3 Tage später, nächste Runde eine Woche danach), Kalender-Ereignisse
//    'super_cup' mit `matchId` „rl_…“ – damit laufen Kalender, Vorschau „Nächstes
//    Spiel“, Textmodus und Spielbericht über die vorhandenen Wege (ownMatch.ts,
//    euroFixture.ts, superCupGame.ts).
//  • Nach dem letzten Spieltag (`relegationHomeDaily`): Teilnehmer aus den
//    Endtabellen, Nachrichten (eigener Verein: Vorstand).
//  • Spieltag (`relMatchday`): volle Vereine über die Match-Engine (Hin-/Rückspiel
//    mit K.-o.-Regel, Auswärtstore je Saison), sonst das Schnellmodell der Sim-Ligen
//    (`simMatchGoals`). Eigener Verein gegen einen Sim-Verein: Gastverein aus seinen
//    Weltspielern (game/worldSquad.ts).
//  • Saisonwechsel: `finishHomeRelegation` spielt Offenes nach, `homeRelOutcomes`
//    liefert die Sieger für den Platztausch (game/relegationCore.ts `relSwap`),
//    `archiveHomeRelegation` hält die Ergebnisse (zehn Saisons) für die Statistik.
// Alte Spielstände ohne `game.relegation`: die laufende Saison ohne Relegation,
// ab der nächsten Saison aktiv (keine Migration nötig).
// =============================================================================
import type { Match } from '../types';
import type { Game } from './state';
import { hashSeed, homeCountryOf } from './state';
import { relegationFormats, type RelBracket, type RelFormat } from '../data/relegationRules';
import { structureForSeason } from '../data/reforms';
import { groupOrder } from '../data/regionGeo';
import { seasonStartYear } from '../data/timeline';
import { leagueName } from '../data/leagueNames';
import {
  awayGoalsIn, finishQuick, isEnt, resolveBracket, roundOf, seedOf, slotId, tieWinner,
  type RelOutcome, type RelRecord, type RelTables, type RelTie,
} from './relegationCore';
import { CalendarEngine } from '../engine/calendar';
import { MatchEngine, type KoRule } from '../engine/match';
import { flushDivision, hashStr, mulberry32, simMatchGoals, type LeagueDivision } from '../engine/leagues';
import { makeMessage, pushMessage } from '../engine/messages';
import { bookCupHomeMatch } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { economyScale, yearOf } from '../engine/economy';
import { ensureGuestClub } from './worldSquad';
import { clubStrength, drawClubName } from './cupDraw';

/** Klammer der laufenden Saison im Heimatland (mit eigener Definition – bei gelosten Paaren erst nach der Auslosung). */
export interface RelHomeRec extends RelRecord {
  /** Index des Formats in `relegationFormats(cc, Jahr)`. */
  fi: number;
  def: RelBracket;
  /** Teilnehmer stehen fest (Endtabellen gelesen). */
  res?: 1;
  /** Match-Objekte der mit der Engine gespielten Spiele (Spielbericht), Schlüssel = Spiel-ID. */
  mt?: Record<string, Match>;
}
export interface RelArchive { season: string; cc: string; recs: RelRecord[] }
export interface RelHomeState { v: 1; season: string; cc: string; recs: RelHomeRec[]; arch: RelArchive[] }
type G = Game & { relegation?: RelHomeState };

const ARCH_KEEP = 10;
export const REL_PREFIX = 'rl_';
export const isRelMatchId = (id: string | undefined): id is string => !!id && id.startsWith(REL_PREFIX);
export const relState = (g: Game): RelHomeState | undefined => (g as G).relegation;
const addDays = (d: string, n: number) => CalendarEngine.addDays(d, n);

/** Formate der Saison im Heimatland (DDR-Ligen ausgenommen). */
export function homeFormats(g: Game): RelFormat[] {
  return relegationFormats(homeCountryOf(g), seasonStartYear(g.season));
}

// -----------------------------------------------------------------------------
// Ligen einer Ebene
// -----------------------------------------------------------------------------
interface DivRef { id: string; tier: number; group: string | null; player: boolean; div?: LeagueDivision }
function divsAt(g: Game, tier: number): DivRef[] {
  const pd = g.leagues.playerDivision;
  const out: DivRef[] = [];
  if (pd.tier === tier && !pd.id.startsWith('ddr-')) out.push({ id: pd.id, tier, group: pd.group ?? null, player: true });
  for (const d of g.leagues.otherDivisions) if (d.tier === tier && !d.id.startsWith('ddr-')) out.push({ id: d.id, tier, group: d.group ?? null, player: false, div: d });
  return out.sort((a, b) => groupOrder(a.group as never) - groupOrder(b.group as never) || a.id.localeCompare(b.id));
}
const lastDate = (g: Game, d: DivRef): string => (d.player ? g.fixtures : d.div!.fixtures).reduce((a, m) => (m.date > a ? m.date : a), '');
const divDone = (g: Game, d: DivRef): boolean => (d.player
  ? g.fixtures.every((m) => m.status !== 'scheduled')
  : !d.div!.fixtures.some((m) => m.matchday === d.div!.nextMatchday));
function standing(g: Game, d: DivRef): { ids: string[]; pts: Record<string, number> } {
  const rows = d.player ? g.table.rows : d.div!.table.rows;
  const ids = rows.map((r) => r.clubId);
  return { ids, pts: Object.fromEntries(rows.map((r) => [r.clubId, r.points])) };
}

// -----------------------------------------------------------------------------
// Aufbau zum Saisonstart
// -----------------------------------------------------------------------------
/** Termine aller Spiele einer Klammer: Runde r → erstes Spiel `base + 7r`, Rückspiel drei Tage später. */
function bracketDates(def: RelBracket, base: string, end: string, busy: Set<string>): string[][] {
  const out: string[][] = [];
  const free = (d: string) => { let x = d; for (let k = 0; k < 3 && busy.has(x) && x < end; k++) x = addDays(x, 1); return x < end ? x : end; };
  for (let mi = 0; mi < def.m.length; mi++) {
    const r = roundOf(def, mi);
    const d0 = free(addDays(base, 7 * r));
    out.push(def.m[mi].legs === 2 ? [d0, free(addDays(d0, 3))] : [d0]);
  }
  return out;
}

/** Klammern der Saison anlegen + Kalender (idempotent je Saison). Ohne passende Ligen: nichts. */
export function setupHomeRelegation(g: Game): void {
  if (!g.leagues || !g.calendar) return;
  const gg = g as G;
  const cc = homeCountryOf(g);
  const y = seasonStartYear(g.season);
  const st: RelHomeState = gg.relegation ?? { v: 1, season: '', cc, recs: [], arch: [] };
  if (st.season === g.season) return;
  st.season = g.season; st.cc = cc; st.recs = [];
  gg.relegation = st;
  const end = addDays(g.calendar.seasonEndDate, -2);
  const busy = new Set(g.calendar.events.filter((e) => e.type === 'cup_matchday' || e.type === 'euro_matchday' || e.type === 'super_cup').map((e) => e.date));
  relegationFormats(cc, y).forEach((f, fi) => {
    const up = divsAt(g, f.lv), low = divsAt(g, f.lv + 1);
    const needLow = f.brackets === 'champs' || f.brackets.some((b) => b.m.some((m) => [m.a, m.b].some((s) => isEnt(s) && s.s === 'l')));
    if (up.length !== 1 || (needLow && !low.length)) return;
    let defs: RelBracket[];
    if (f.brackets === 'champs') {
      const tg = structureForSeason(g.season).find((t) => t.tier === f.lv);
      const slots = tg?.upSlots ?? low.length;
      if (low.length < 2 || slots >= low.length) return;
      defs = Array.from({ length: slots }, () => ({ m: [{ a: { s: 'l', p: 1, g: 0 }, b: { s: 'l', p: 1, g: 1 }, legs: 2 }] } as RelBracket));
    } else defs = f.brackets;
    const base = addDays([...up, ...low].map((d) => lastDate(g, d)).reduce((a, b) => (b > a ? b : a), `${y + 1}-05-01`), 4);
    defs.forEach((def, b) => {
      const dates = bracketDates(def, base, end, busy);
      const rec: RelHomeRec = { lv: f.lv, b, fi, def, ent: [], ties: [] };
      def.m.forEach((m, mi) => {
        rec.ties.push({ m: mi, legs: dates[mi].map((d, k) => ({ d, h: '', a: '', id: `${REL_PREFIX}${y}_${f.lv}_${b}_${mi}_${k}` })) });
      });
      st.recs.push(rec);
      for (const t of rec.ties) for (const [k, l] of t.legs.entries()) {
        g.calendar.events.push({
          id: `rlev_${l.id}`, date: l.d, type: 'super_cup', title: `${relTitle(g, rec)}: ${legName(rec, t.m, k)}`,
          description: `${relTitle(g, rec)} ${g.season}`, matchId: l.id, processed: false, requiresAction: false,
        });
      }
    });
  });
  g.calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

/** Name der Klammer für Kalender/Nachrichten, z. B. „Relegation 1. Liga/2. Liga“. */
export function relTitle(g: Game, rec: { lv: number; fi: number }): string {
  const f = homeFormats(g)[rec.fi];
  const kind = f ? ({ relegation: 'Relegation', barrage: 'Barrage', playoff: 'Play-offs', playout: 'Play-out', decider: 'Entscheidungsspiel', promocion: 'Promoción', nacomp: 'Nacompetitie', final: 'Endrunde', qual: 'Kvalifikation' } as const)[f.kind] : 'Relegation';
  const cc = homeCountryOf(g);
  return f?.kind === 'playout' ? `${kind} ${leagueName(cc, rec.lv + 1)}` : `${kind} ${leagueName(cc, rec.lv)}/${leagueName(cc, rec.lv + 1)}`;
}

/** „Hinspiel“, „Rückspiel“, „Halbfinale · Rückspiel“, „Finale“ … */
export function legName(rec: { def?: RelBracket; ties: RelTie[] }, mi: number, k: number): string {
  const def = rec.def;
  const legs = rec.ties.find((t) => t.m === mi)?.legs.length ?? 1;
  const rounds = def ? Math.max(...def.m.map((_, i) => roundOf(def, i))) + 1 : 1;
  const r = def ? roundOf(def, mi) : 0;
  const stage = rounds <= 1 ? '' : r === rounds - 1 ? 'Finale' : r === rounds - 2 ? 'Halbfinale' : `${r + 1}. Runde`;
  const leg = legs === 2 ? (k ? 'Rückspiel' : 'Hinspiel') : '';
  return [stage, leg].filter(Boolean).join(' · ') || 'Spiel';
}

// -----------------------------------------------------------------------------
// Teilnehmer nach dem letzten Spieltag
// -----------------------------------------------------------------------------
function tablesFor(g: Game, lv: number): RelTables {
  const up = divsAt(g, lv), low = divsAt(g, lv + 1);
  return { upper: up.length === 1 ? standing(g, up[0]) : null, lower: low.map((d) => standing(g, d)) };
}

/** Geloste Aufstiegsspiele der Meister (data/reforms.ts: Meister + Vizemeister markierter Staffeln). */
function drawChamps(g: Game, rec: RelHomeRec, all: RelHomeRec[]): void {
  const lowDivs = divsAt(g, rec.lv + 1);
  const targets = structureForSeason(g.season);
  const ents: { s: 'l'; p: number; g: number }[] = [];
  lowDivs.forEach((d, gi) => {
    ents.push({ s: 'l', p: 1, g: gi });
    if (targets.find((t) => t.tier === d.tier && t.group === d.group)?.playoffRunnerUp) ents.push({ s: 'l', p: 2, g: gi });
  });
  const r = mulberry32(hashStr(`relchamps:${g.season}`));
  for (let i = ents.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ents[i], ents[j]] = [ents[j], ents[i]]; }
  const mine = all.filter((x) => x.lv === rec.lv);
  mine.forEach((x, k) => { if (ents[2 * k + 1]) x.def = { m: [{ a: ents[2 * k], b: ents[2 * k + 1], legs: 2 }] }; });
}

/** Teilnehmer aller Klammern lesen, sobald die Ligen fertig sind (`force` = auch mit offenen Spielen). */
export function resolveHomeRel(g: Game, force = false): boolean {
  const st = relState(g);
  if (!st || st.season !== g.season) return false;
  let changed = false;
  for (const rec of st.recs) {
    if (rec.res) continue;
    const divs = [...divsAt(g, rec.lv), ...divsAt(g, rec.lv + 1)];
    if (!force && !divs.every((d) => divDone(g, d))) continue;
    if (force) for (const d of divs) if (!d.player && d.div) flushDivision(d.div, g.simClubs, g.pointSystem, g.season);
    const f = homeFormats(g)[rec.fi];
    if (f?.brackets === 'champs' && rec.b === 0) drawChamps(g, rec, st.recs);
    const out = resolveBracket(rec.def, tablesFor(g, rec.lv));
    rec.res = 1;
    changed = true;
    if (!out) { rec.skip = 1; continue; }
    rec.ent = out.ent;
    if (out.up.length) rec.up = out.up;
    if (out.skip) rec.skip = 1;
  }
  if (changed) for (const rec of st.recs) if (rec.skip) for (const t of rec.ties) for (const l of t.legs) {
    const ev = g.calendar.events.find((e) => e.matchId === l.id);
    if (ev) ev.processed = true;
  }
  return changed;
}

/** Täglich (day.ts): Teilnehmer nach dem letzten Spieltag festhalten und melden. */
export function relegationHomeDaily(g: Game, today: string): void {
  const st = relState(g);
  if (!st || st.season !== g.season || st.recs.every((r) => r.res)) return;
  const before = new Set(st.recs.filter((r) => r.res).map((r) => r));
  if (!resolveHomeRel(g)) return;
  const fresh = st.recs.filter((r) => r.res && !before.has(r) && !r.skip);
  if (!fresh.length) return;
  const mid = g.managedClubId;
  const tables = new Map<number, RelTables>();
  const lines = fresh.map((rec) => {
    const t = tables.get(rec.lv) ?? tablesFor(g, rec.lv);
    tables.set(rec.lv, t);
    const first = rec.ties[0];
    const a = slotId(rec.def.m[0].a, rec.def, rec), b = slotId(rec.def.m[0].b, rec.def, rec);
    return `${relTitle(g, rec)}: ${rec.ent.map((id) => drawClubName(g, id)).join(', ')} – erstes Spiel ${drawClubName(g, a)} gegen ${drawClubName(g, b)} am ${CalendarEngine.formatDate(first.legs[0].d)}.`;
  });
  pushMessage(g.messages, makeMessage({
    date: today, category: 'media', from: 'Sportredaktion',
    subject: `Relegation ${g.season}: Die Paarungen stehen`,
    shortText: `${fresh.length === 1 ? 'Ein Duell entscheidet' : `${fresh.length} Duelle entscheiden`} über Auf- und Abstieg.`,
    bodyText: `${lines.join('\n')}\n\nDie Termine stehen im Kalender, die Ergebnisse unter Statistiken › Liga.`,
  }));
  const own = fresh.find((r) => r.ent.includes(mid));
  if (own) {
    const t = tables.get(own.lv)!;
    const upper = t.upper?.ids.includes(mid);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Vorstand',
      subject: upper ? 'Relegation: Es geht um die Klasse' : 'Relegation: Die Chance auf den Aufstieg',
      shortText: `${relTitle(g, own)} – erstes Spiel am ${CalendarEngine.formatDate(own.ties[0].legs[0].d)}.`,
      bodyText: upper
        ? `Die Saison ist noch nicht vorbei: Über den Verbleib in der ${leagueName(homeCountryOf(g), own.lv)} entscheidet die Relegation. Der Vorstand erwartet volle Konzentration – ein Abstieg träfe Etat und Kader hart.`
        : `Platz ${t.lower.find((x) => x.ids.includes(mid))!.ids.indexOf(mid) + 1} reicht für die Relegation. Gewinnt die Mannschaft, spielt der Verein in der nächsten Saison eine Klasse höher.`,
    }));
  }
}

// -----------------------------------------------------------------------------
// Spieltag
// -----------------------------------------------------------------------------
function koRule(g: Game, rec: RelHomeRec, tie: RelTie, k: number): KoRule | undefined {
  const def = rec.def.m[tie.m];
  if (k !== def.legs - 1) return undefined;
  const f = homeFormats(g)[rec.fi];
  const y = seasonStartYear(g.season);
  const l0 = k === 1 ? tie.legs[0] : null;
  return {
    prev: l0 ? [l0.ag ?? 0, l0.hg ?? 0] : undefined,
    awayGoals: !!l0 && !!f && awayGoalsIn(f, y),
    extraTime: true, shootout: !f?.tieBetter,
  };
}

function better(g: Game, rec: RelHomeRec) {
  const t = tablesFor(g, rec.lv);
  return (a: string, b: string) => (seedOf(a, t) <= seedOf(b, t) ? a : b);
}

/** Paarung eines Spiels festlegen (Teilnehmer/Sieger früherer Duelle); false = noch offen. */
function pair(g: Game, rec: RelHomeRec, tie: RelTie): boolean {
  if (tie.legs[0].h) return true;
  const def = rec.def.m[tie.m];
  const a = slotId(def.a, rec.def, rec), b = slotId(def.b, rec.def, rec);
  if (!a || !b) return false;
  tie.legs.forEach((l, k) => { l.h = k ? b : a; l.a = k ? a : b; });
  return true;
}

function playLeg(g: Game, rec: RelHomeRec, tie: RelTie, k: number): void {
  const leg = tie.legs[k];
  const mid = g.managedClubId;
  const f = homeFormats(g)[rec.fi];
  const y = seasonStartYear(g.season);
  const ko = koRule(g, rec, tie, k);
  if (leg.h === mid || leg.a === mid) for (const id of [leg.h, leg.a]) if (!g.clubs[id]) ensureGuestClub(g, id);
  if (g.clubs[leg.h] && g.clubs[leg.a]) {
    const engine = new MatchEngine(g.clubs[leg.h], g.clubs[leg.a], g.players, g.pointSystem, {
      seed: hashSeed(`rl:${leg.id}`), date: leg.d, competition: 'Pokal', logClubIds: [mid], applyInjuries: g.injuriesEnabled, ko,
    });
    const o = ko ? engine.simulateCup() : { ...engine.simulate(), decision: 'regular' as const, penalties: null };
    leg.hg = o.result.homeGoals; leg.ag = o.result.awayGoals;
    if (o.decision !== 'regular') leg.et = 1;
    if (o.penalties) leg.p = [o.penalties.home, o.penalties.away];
    (rec.mt ??= {})[leg.id!] = { id: leg.id!, matchday: 0, date: leg.d, homeClubId: leg.h, awayClubId: leg.a, status: 'finished', result: o.result, events: o.events, involvesPlayerClub: leg.h === mid || leg.a === mid };
    bookCupHomeMatch(g.clubs[leg.h], o.result, leg.d, leg.h === mid, economyScale(yearOf(leg.d)));
    const d = leg.hg === leg.ag ? 'D' : leg.hg! > leg.ag! ? 'H' : 'A';
    applyMatchEffects(g.clubs[leg.h], g.players, d === 'D' ? 'D' : d === 'H' ? 'W' : 'L');
    applyMatchEffects(g.clubs[leg.a], g.players, d === 'D' ? 'D' : d === 'A' ? 'W' : 'L');
  } else {
    const r = mulberry32(hashSeed(`rl:${leg.id}`));
    const neutral = !!rec.def.m[tie.m].neutral;
    const x = simMatchGoals(clubStrength(g, leg.h), clubStrength(g, leg.a) + (neutral ? 3 : 0), r);
    leg.hg = x.home; leg.ag = x.away;
    if (ko) finishQuick(tie, leg, {
      goals: (h, a, _n, rr) => { const z = simMatchGoals(clubStrength(g, h), clubStrength(g, a) + 3, rr); return [z.home, z.away]; },
      strength: (id) => clubStrength(g, id), awayGoals: !!f && awayGoalsIn(f, y), tieBetter: !!f?.tieBetter, better: better(g, rec),
    }, r);
  }
  if (k === tie.legs.length - 1) tie.w = tieWinner(tie, !!f && awayGoalsIn(f, y), better(g, rec)) ?? leg.h;
}

function finishRec(g: Game, rec: RelHomeRec, today: string): void {
  const last = rec.ties[rec.ties.length - 1];
  if (!last?.w || rec.w) return;
  rec.w = last.w;
  const mid = g.managedClubId;
  const t = tablesFor(g, rec.lv);
  const upEnt = rec.ent.find((id) => t.upper?.ids.includes(id));
  const winUpper = !!upEnt && upEnt === rec.w;
  const cc = homeCountryOf(g);
  const score = last.legs.map((l) => `${l.hg}:${l.ag}${l.p ? ` (${l.p[0]}:${l.p[1]} i.E.)` : l.et ? ' n.V.' : ''}`).join(', ');
  const f = homeFormats(g)[rec.fi];
  const text = f?.kind === 'playout' ? `${drawClubName(g, rec.w)} bleibt in der ${leagueName(cc, rec.lv)}.`
    : winUpper ? `${drawClubName(g, rec.w)} bleibt in der ${leagueName(cc, rec.lv)}.`
      : `${drawClubName(g, rec.w)} steigt in die ${leagueName(cc, rec.lv)} auf${upEnt ? `, ${drawClubName(g, upEnt)} steigt ab` : ''}.`;
  const mine = rec.ent.includes(mid);
  pushMessage(g.messages, makeMessage({
    date: today, category: mine ? 'board' : 'media', from: mine ? 'Vorstand' : 'Sportredaktion',
    relatedId: rec.mt?.[last.legs[last.legs.length - 1].id!]?.id,
    subject: mine ? (rec.w === mid ? `${relTitle(g, rec)}: Geschafft!` : `${relTitle(g, rec)}: Verloren`) : `${relTitle(g, rec)}: ${text}`,
    shortText: `${drawClubName(g, last.legs[0].h)} – ${drawClubName(g, last.legs[0].a)}: ${score}`,
    bodyText: `${text}\n\nErgebnisse: ${score}.${mine ? (rec.w === mid ? '\n\nDer Vorstand gratuliert – die Planungen für die neue Saison laufen.' : '\n\nEine bittere Saison – der Vorstand erwartet eine schnelle Antwort.') : ''}`,
  }));
}

/** Kalender-Ereignis 'super_cup' mit „rl_…“ (superCupGame.ts): alle Spiele des Tages. Rückgabe: Match-ID des eigenen Spiels. */
export function relMatchday(g: Game, matchId: string, today: string): string | null {
  const st = relState(g);
  if (!st || st.season !== g.season) return null;
  resolveHomeRel(g, true);
  const date = st.recs.flatMap((r) => r.ties.flatMap((t) => t.legs)).find((l) => l.id === matchId)?.d ?? today;
  let own: string | null = null;
  for (const rec of st.recs) {
    if (rec.skip || rec.w) continue;
    for (const tie of rec.ties) {
      tie.legs.forEach((l, k) => {
        if (l.d !== date || l.hg != null || (k === 1 && tie.legs[0].hg == null) || !pair(g, rec, tie)) return;
        playLeg(g, rec, tie, k);
        if (l.h === g.managedClubId || l.a === g.managedClubId) own = l.id!;
      });
    }
    finishRec(g, rec, today);
  }
  return own;
}

/** Eigenes, noch offenes Spiel an diesem Termin (findOwnMatchDue). */
export function ownRelDue(g: Game, matchId: string): {
  id: string; date: string; home: string; away: string; label: string; ko?: KoRule; stageNote?: string;
  firstLeg?: { home: string; away: string; hg: number; ag: number; awayGoals: boolean }; venue?: string;
} | null {
  const st = relState(g);
  if (!st || st.season !== g.season) return null;
  const date = st.recs.flatMap((r) => r.ties.flatMap((t) => t.legs)).find((l) => l.id === matchId)?.d;
  if (!date) return null;
  resolveHomeRel(g, true);
  const mid = g.managedClubId;
  for (const rec of st.recs) {
    if (rec.skip || rec.w || !rec.ent.length) continue;
    for (const tie of rec.ties) for (const [k, l] of tie.legs.entries()) {
      if (l.d !== date || l.hg != null || (k === 1 && tie.legs[0].hg == null) || !pair(g, rec, tie)) continue;
      if (l.h !== mid && l.a !== mid) continue;
      const ko = koRule(g, rec, tie, k);
      const l0 = k === 1 ? tie.legs[0] : null;
      return {
        id: l.id!, date, home: l.h, away: l.a, ko, label: `${relTitle(g, rec)} · ${legName(rec, tie.m, k)}`,
        firstLeg: l0 ? { home: l0.h, away: l0.a, hg: l0.hg ?? 0, ag: l0.ag ?? 0, awayGoals: !!ko?.awayGoals } : undefined,
        stageNote: !ko ? 'Hinspiel – entschieden wird im Rückspiel' : ko.shootout === false ? 'Bei Gleichstand nach Verlängerung kommt der Besserplatzierte weiter' : undefined,
        venue: rec.def.m[tie.m].neutral ? 'Neutraler Platz' : undefined,
      };
    }
  }
  return null;
}

/** Eigenes Spiel an einem Kalendertermin (game/euroFixture.ts `ownFixtureOn`). */
export function relFixtureOn(g: Game, matchId: string, me: string): { opp: string; home: boolean; match: Match | null; comp: string } | null {
  const st = relState(g);
  if (!st || st.season !== g.season) return null;
  for (const rec of st.recs) for (const tie of rec.ties) for (const [k, l] of tie.legs.entries()) {
    if (l.id !== matchId) continue;
    // Alle Spiele dieses Tages: das eigene suchen.
    for (const r2 of st.recs) for (const t2 of r2.ties) for (const [k2, l2] of t2.legs.entries()) {
      if (l2.d !== l.d || r2.skip || !r2.res) continue;
      if (!l2.h) pair(g, r2, t2); // Paarung steht fest, sobald Teilnehmer bzw. Sieger der Vorrunde bekannt sind
      if (l2.h !== me && l2.a !== me) continue;
      return { opp: l2.h === me ? l2.a : l2.h, home: l2.h === me, match: r2.mt?.[l2.id!] ?? null, comp: `${relTitle(g, r2)} · ${legName(r2, t2.m, k2)}` };
    }
    void k;
    return null;
  }
  return null;
}

/** Match-Objekt für den Spielbericht. */
export function findRelMatch(g: Game, id: string): { match: Match; label: string } | null {
  const st = relState(g);
  for (const rec of st?.recs ?? []) {
    const m = rec.mt?.[id];
    if (!m) continue;
    for (const tie of rec.ties) for (const [k, l] of tie.legs.entries()) if (l.id === id) return { match: m, label: `${relTitle(g, rec)} · ${legName(rec, tie.m, k)}` };
  }
  return null;
}

/** Hat der eigene Verein noch ein offenes Relegationsspiel (Stichtag Amtszeit, game/relegationGame.ts)? */
export function ownRelOpen(g: Game): boolean {
  const st = relState(g);
  if (!st || st.season !== g.season) return false;
  const mid = g.managedClubId;
  return st.recs.some((r) => !r.skip && !r.w && (!r.res || r.ent.includes(mid)));
}

// -----------------------------------------------------------------------------
// Saisonwechsel
// -----------------------------------------------------------------------------
/** Offene Spiele nachholen (Saisonwechsel ohne Tagesablauf, z. B. in Tests/Simulationen). */
export function finishHomeRelegation(g: Game): void {
  const st = relState(g);
  if (!st || st.season !== g.season) return;
  resolveHomeRel(g, true);
  for (const rec of st.recs) {
    if (rec.skip || rec.w) continue;
    for (const tie of rec.ties) {
      if (!pair(g, rec, tie)) break;
      for (let k = 0; k < tie.legs.length; k++) if (tie.legs[k].hg == null) playLeg(g, rec, tie, k);
    }
    finishRec(g, rec, g.calendar.currentDate);
  }
}

/** Sieger aller Klammern für den Platztausch (game/relegationCore.ts `relSwap`). */
export function homeRelOutcomes(g: Game): RelOutcome[] {
  const st = relState(g);
  if (!st || st.season !== g.season) return [];
  const champs = (rec: RelHomeRec) => homeFormats(g)[rec.fi]?.brackets === 'champs';
  return st.recs.filter((r) => r.w && !r.skip).map((r) => ({ lv: r.lv, ent: r.ent, w: r.w!, pool: champs(r) || undefined, upper: r.up }));
}

/** Ergebnisse ins Archiv (zehn Saisons), Match-Objekte und Definitionen entfallen. */
export function archiveHomeRelegation(g: Game): void {
  const st = relState(g);
  if (!st || st.season !== g.season || !st.recs.length) return;
  st.arch = st.arch.filter((a) => a.season !== st.season);
  st.arch.push({
    season: st.season, cc: st.cc,
    recs: st.recs.filter((r) => r.ent.length).map((r) => ({
      lv: r.lv, b: r.b, ent: r.ent, w: r.w, ...(r.skip ? { skip: 1 as const } : {}), ...(r.up ? { up: r.up } : {}),
      ties: r.ties.filter((t) => t.legs[0].h).map((t) => ({ m: t.m, w: t.w, legs: t.legs.map((l) => ({ d: l.d, h: l.h, a: l.a, hg: l.hg, ag: l.ag, ...(l.et ? { et: 1 as const } : {}), ...(l.p ? { p: l.p } : {}) })) })),
    })),
  });
  if (st.arch.length > ARCH_KEEP) st.arch.splice(0, st.arch.length - ARCH_KEEP);
}

/** Sind alle Teilnehmer schon Teilnehmer einer Klammer (Anzeige: Platzhalter vor dem letzten Spieltag)? */
export const relEntrantsKnown = (rec: RelHomeRec): boolean => !!rec.res;
export { isEnt };
