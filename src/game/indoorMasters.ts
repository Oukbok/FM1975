// =============================================================================
// HALLE – Masters-Wertung (Wunsch Pascal: Tabelle mit den Punkten für das Hallen-Masters)
// -----------------------------------------------------------------------------
// Masters-Winter (1988–2001): Tour-Wertung wie die echte Qualifikation (Ø Punkte je Spiel,
// dann Tordifferenz je Spiel, dann Tore – engine/indoor.ts `tourRanking`), nur Vereine der
// beiden oberen Ligen sind startberechtigt (Gäste/Amateure laufen außer Konkurrenz mit).
// Vor dem ersten Turnier: alle gemeldeten Teams mit 0 Punkten. Nach dem Aufstellen des
// Feldes: dabei / Nachrücker / verzichtet / verhindert (Pflichtspiel); nach dem Masters
// die Endplatzierung. Andere Winter: Wertung der Hallensaison (Turniersiege, dann Punkte).
// Archiv: `IndoorHistoryEntry.board` (optional, ab dieser Fassung; alte Spielstände ohne).
// Option (Wunsch Pascal, Einstellung `indoorScoring`): statt des historischen Schnitts
// zählen Platzierungspunkte je Turnier (PLACE_POINTS, Gleichstand nach Ø Punkten je
// Spiel) – gilt für die Anzeige UND die Auswahl des Masters-Feldes (`mastersRanking`).
// Gesetzt von shell/GameShell.tsx über `setMastersScoring`; Sims/Tests: Schnitt.
// =============================================================================
import { INDOOR_FIRST_WINTER, INDOOR_LAST_WINTER, indoorPhase, MASTERS_FIRST_WINTER, MASTERS_LAST_WINTER, MASTERS_TEAMS } from '../data/indoorHistory';
import { CalendarEngine } from '../engine/calendar';
import { addResultToTour, tourRanking, type TourStat } from '../engine/indoor';
import { isForeignId } from '../engine/world';
import type { Game } from './state';
import type { IndoorWinter } from './winterShared';

// -----------------------------------------------------------------------------
// Wertung: Schnitt (historisch, Standard) oder Platzierungspunkte (Option)
// -----------------------------------------------------------------------------
export type MastersScoring = 'avg' | 'place';
let scoring: MastersScoring = 'avg';
/** Einstellung „Masters-Qualifikation“ (AppSettings.indoorScoring: 'platz' = Platzierungspunkte). */
export function setMastersScoring(v: string | undefined): void { scoring = v === 'platz' ? 'place' : 'avg'; }
export function mastersScoring(): MastersScoring { return scoring; }

/** Platzierungspunkte je Turnier: Sieger 10, Zweiter 7, Dritter 5, Vierter 4, Gruppendritte 3/2, dahinter 1. */
export const PLACE_POINTS = [10, 7, 5, 4, 3, 2, 1, 1];
export const placePoints = (rank: number): number => PLACE_POINTS[rank] ?? 1;

/** Platzierungspunkte je Verein aus den gespielten Qualifikationsturnieren des Winters. */
export function placementPoints(cur: IndoorWinter): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of cur.tournaments) {
    if (!t.done || !t.result || t.kind !== 'qualifier') continue;
    t.result.ranking.forEach((id, i) => m.set(id, (m.get(id) ?? 0) + placePoints(i)));
  }
  return m;
}

export type RankedStat = TourStat & { pp: number };
/** Reihenfolge der Tour-Wertung nach der gewählten Wertung (Masters-Feld und Anzeige). */
export function mastersRanking(cur: IndoorWinter, mode: MastersScoring = scoring): RankedStat[] {
  const pp = placementPoints(cur);
  const ranked = tourRanking(cur.tour ?? []).map((s) => ({ ...s, pp: pp.get(s.id) ?? 0 }));
  if (mode === 'avg') return ranked;
  // Stabil sortieren: Platzierungspunkte, bei Gleichstand bleibt die Schnitt-Reihenfolge.
  return ranked.map((s, i) => ({ s, i })).sort((a, b) => b.s.pp - a.s.pp || a.i - b.i).map((x) => x.s);
}

/**
 * Endrunde (zwei Tage, Sa/So): historisch Mitte Januar (1988 Frankfurt, 2001 Dortmund
 * am 13./14.1., taz 15.01.2001) – Wochenende um den 13. Januar, ins Winterfenster
 * geklemmt und an Pflichtspielen vorbei.
 */
export function mastersWeekend(win: { from: string; to: string }, winterYear: number, busy: Set<string>): string[] {
  const lastStart = CalendarEngine.addDays(win.to, -1);
  const clamp = (d: string) => (d < win.from ? win.from : d > lastStart ? lastStart : d);
  const fwd = (6 - new Date(`${winterYear}-01-13T00:00:00Z`).getUTCDay() + 7) % 7;
  const sat = CalendarEngine.addDays(`${winterYear}-01-13`, fwd > 3 ? fwd - 7 : fwd);
  for (const shift of [0, -7, 7, -14, 14]) {
    const d = clamp(CalendarEngine.addDays(sat, shift));
    const pair = [d, CalendarEngine.addDays(d, 1)];
    if (!pair.some((x) => busy.has(x))) return pair;
  }
  return [lastStart, win.to];
}


export type MastersStatus = 'in' | 'q' | 'sub' | 'declined' | 'blocked' | 'out' | 'guest';
export interface MastersRow {
  id: string; t: number; sp: number; pts: number; gf: number; ga: number;
  /** Turniersiege in diesem Winter. */
  wins: number;
  status?: MastersStatus;
  /** Endplatz beim Masters (1 = Sieger). */
  place?: number;
  /** Platzierungspunkte (nur Wertung „Platzierungspunkte“). */
  pp?: number;
}
export interface MastersBoard {
  mode: 'masters' | 'season' | 'none';
  year: number;
  rows: MastersRow[];
  /** Trennlinie nach so vielen Zeilen (Masters-Plätze); 0 = keine. */
  cut: number;
  /** Erklärung über der Tabelle (Stand, Wertung, Hinweis auf das Masters). */
  hint: string;
  stage: 'before' | 'tour' | 'field' | 'done';
  /** Gültige Wertung (Masters-Winter). */
  scoring: MastersScoring;
}

/** Kompakte Archiv-Zeile: [id, Turniere, Spiele, Punkte, Tore, Gegentore, Siege, Status, Masters-Platz, Platzierungspunkte?]. */
export type BoardRow = [string, number, number, number, number, number, number, string, number, number?];
/** `sc` = 'place': Winter mit Platzierungspunkten gewertet (fehlt = Schnitt). */
export interface BoardArchive { mode: 'masters' | 'season'; rows: BoardRow[]; cut: number; sc?: 'place' }

const BOARD_KEEP = 24;

/** Startberechtigt für das Masters: Vereine der beiden oberen Ligen (keine Gäste/Amateure). */
export function mastersEligible(id: string): boolean {
  return !isForeignId(id) && !id.startsWith('am') && !id.startsWith('ph-');
}

export function mastersHintOff(wy: number): string {
  if (wy < INDOOR_FIRST_WINTER) return `Hallenturniere mit Profis gibt es ab dem Winter ${INDOOR_FIRST_WINTER - 1}/${String(INDOOR_FIRST_WINTER % 100).padStart(2, '0')}, das Hallenfinale von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}.`;
  if (wy > INDOOR_LAST_WINTER) return `Seit ${INDOOR_LAST_WINTER + 1} gibt es keine Hallenturniere mit Profis mehr; das Hallenfinale lief von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}.`;
  if (wy < MASTERS_FIRST_WINTER) return `Ein Hallenfinale gibt es erst ab Januar ${MASTERS_FIRST_WINTER} (Winter ${MASTERS_FIRST_WINTER - 1}/${String(MASTERS_FIRST_WINTER % 100).padStart(2, '0')}). Bis dahin zählt hier die Wertung der Einladungsturniere: Turniersiege, dann Punkte.`;
  return `Das Hallenfinale lief von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}. Jetzt gibt es nur noch regionale Turniere – Wertung nach Turniersiegen, dann Punkten.`;
}

const blank = (id: string): MastersRow => ({ id, t: 0, sp: 0, pts: 0, gf: 0, ga: 0, wins: 0 });
const ofStat = (s: TourStat & { pp?: number }, wins: number): MastersRow => ({ id: s.id, t: s.tournaments, sp: s.games, pts: s.pts, gf: s.gf, ga: s.ga, wins, pp: s.pp });

/** Turniersiege je Verein im Winter (ohne Masters). */
function winsOf(cur: IndoorWinter): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of cur.tournaments) if (t.done && t.result) m.set(t.result.ranking[0], (m.get(t.result.ranking[0]) ?? 0) + 1);
  return m;
}

/** Gemeldete Teams kommender Turniere, die noch ohne Spiel sind. */
function waiting(cur: IndoorWinter, have: Set<string>): string[] {
  const out: string[] = [];
  for (const t of cur.tournaments) if (!t.done) for (const id of t.clubIds) if (!have.has(id) && !out.includes(id)) out.push(id);
  return out;
}

export function mastersBoard(g: Game, cur: IndoorWinter | undefined, wy: number, name: (id: string) => string): MastersBoard {
  if (!cur) {
    const ph = indoorPhase(wy);
    if (ph === 'none') return { mode: 'none', year: wy, rows: [], cut: 0, hint: mastersHintOff(wy), stage: 'before', scoring };
    const pre = 'Die Hallensaison beginnt mit den Einladungen Anfang November.';
    return { mode: ph === 'masters' ? 'masters' : 'season', year: wy, rows: [], cut: 0, stage: 'before', scoring, hint: ph === 'masters' ? `${pre} ${scoring === 'place' ? 'Danach bringt jedes Qualifikationsturnier Platzierungspunkte für das Hallenfinale.' : 'Danach zählt jedes Spiel der Qualifikationsturniere für das Hallenfinale.'}` : `${pre} ${mastersHintOff(wy)}` };
  }
  if (cur.phase === 'none') return { mode: 'none', year: wy, rows: [], cut: 0, hint: mastersHintOff(wy), stage: 'before', scoring };
  const wins = winsOf(cur);
  const byName = (a: string, b: string) => name(a).localeCompare(name(b), 'de');

  if (cur.phase !== 'masters') {
    const map = new Map<string, TourStat>();
    for (const t of cur.tournaments) if (t.done && t.result) addResultToTour(map, t.result, g.pointSystem === '3-point' ? 3 : 2);
    const rows = [...map.values()].map((s) => ofStat(s, wins.get(s.id) ?? 0))
      .sort((x, y) => y.wins - x.wins || y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
    const rest = waiting(cur, new Set(rows.map((r) => r.id))).sort(byName).map(blank);
    const stage = rows.length ? 'tour' : 'before';
    return { mode: 'season', year: wy, rows: [...rows, ...rest], cut: 0, hint: mastersHintOff(wy), stage, scoring };
  }

  const ranked = mastersRanking(cur).map((s) => ofStat(s, wins.get(s.id) ?? 0));
  const have = new Set(ranked.map((r) => r.id));
  const all = [...ranked, ...waiting(cur, have).sort(byName).map(blank)];
  const m = cur.masters;
  const field = new Set(m?.clubIds ?? []);
  const declined = new Set(cur.mastersDeclined ?? []);
  const elig = all.filter((r) => mastersEligible(r.id));
  for (const id of field) if (!elig.some((r) => r.id === id)) elig.push(blank(id)); // aufgefüllt ohne Tour-Punkte
  const guests = all.filter((r) => !mastersEligible(r.id)).map((r) => ({ ...r, status: 'guest' as MastersStatus }));
  const built = field.size > 0;
  elig.forEach((r, i) => {
    if (!built) r.status = i < MASTERS_TEAMS && r.sp > 0 ? 'in' : 'out';
    else if (field.has(r.id)) r.status = i < MASTERS_TEAMS ? 'q' : 'sub';
    else if (declined.has(r.id)) r.status = 'declined';
    else r.status = i < MASTERS_TEAMS ? 'blocked' : 'out';
    if (m?.done && m.result) { const p = m.result.ranking.indexOf(r.id); if (p >= 0) r.place = p + 1; }
  });
  const stage = m?.done ? 'done' : built ? 'field' : ranked.length ? 'tour' : 'before';
  const crit = scoring === 'place'
    ? `nach Platzierungspunkten (Sieger ${PLACE_POINTS[0]}, Zweiter ${PLACE_POINTS[1]}, Dritter ${PLACE_POINTS[2]}, Vierter ${PLACE_POINTS[3]}, dahinter ${PLACE_POINTS[4]}–${PLACE_POINTS[7]}; Gleichstand: Ø Punkte je Spiel)`
    : 'nach Ø Punkten je Spiel (Gleichstand: Tordifferenz je Spiel, dann Tore)';
  const hint = stage === 'before'
    ? `Noch kein Qualifikationsturnier gespielt – alle gemeldeten Teams stehen bei 0 Punkten. Die ${MASTERS_TEAMS} Besten ${crit} fahren zum Hallenfinale.`
    : stage === 'tour' ? `Stand der Qualifikation: Die ${MASTERS_TEAMS} Besten ${crit} fahren zum Hallenfinale.`
    : stage === 'field' ? 'Das Teilnehmerfeld steht. Wer verzichtet oder an den Hallenfinal-Tagen noch ein Pflichtspiel hat, macht Platz für Nachrücker.'
    : 'Endwertung der Qualifikation mit dem Abschneiden beim Hallenfinale.';
  return { mode: 'masters', year: wy, rows: [...elig, ...guests], cut: Math.min(MASTERS_TEAMS, elig.length), hint, stage, scoring };
}

/** Für das Archiv am Winterende (game/indoorGame.ts `finishWinter`). */
export function packBoard(b: MastersBoard): BoardArchive | undefined {
  if (b.mode === 'none' || !b.rows.length) return undefined;
  const rows = b.rows.filter((r) => r.sp > 0 || r.status === 'q' || r.status === 'sub').slice(0, BOARD_KEEP)
    .map((r): BoardRow => {
      const row: BoardRow = [r.id, r.t, r.sp, r.pts, r.gf, r.ga, r.wins, r.status ?? '', r.place ?? 0];
      if (b.scoring === 'place' && b.mode === 'masters') row.push(r.pp ?? 0);
      return row;
    });
  const out: BoardArchive = { mode: b.mode, rows, cut: b.cut };
  if (b.scoring === 'place' && b.mode === 'masters') out.sc = 'place';
  return out;
}

export function unpackBoard(a: BoardArchive, year: number): MastersBoard {
  const sc: MastersScoring = a.sc === 'place' ? 'place' : 'avg';
  return {
    mode: a.mode, year, cut: a.cut, stage: 'done', scoring: sc,
    rows: a.rows.map(([id, t, sp, pts, gf, ga, wins, st, place, pp]) => ({ id, t, sp, pts, gf, ga, wins, status: (st || undefined) as MastersStatus | undefined, place: place || undefined, pp })),
    hint: a.mode === 'masters' ? `Endwertung der Qualifikation ${year - 1}/${String(year % 100).padStart(2, '0')} ${sc === 'place' ? 'nach Platzierungspunkten' : 'nach Ø Punkten je Spiel'} mit dem Abschneiden beim Hallenfinale.` : mastersHintOff(year),
  };
}
