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
// =============================================================================
import { INDOOR_FIRST_WINTER, INDOOR_LAST_WINTER, indoorPhase, MASTERS_FIRST_WINTER, MASTERS_LAST_WINTER, MASTERS_TEAMS } from '../data/indoorHistory';
import { addResultToTour, tourRanking, type TourStat } from '../engine/indoor';
import { isForeignId } from '../engine/world';
import type { Game } from './state';
import type { IndoorWinter } from './winterShared';

export type MastersStatus = 'in' | 'q' | 'sub' | 'declined' | 'blocked' | 'out' | 'guest';
export interface MastersRow {
  id: string; t: number; sp: number; pts: number; gf: number; ga: number;
  /** Turniersiege in diesem Winter. */
  wins: number;
  status?: MastersStatus;
  /** Endplatz beim Masters (1 = Sieger). */
  place?: number;
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
}

/** Kompakte Archiv-Zeile: [id, Turniere, Spiele, Punkte, Tore, Gegentore, Siege, Status, Masters-Platz]. */
export type BoardRow = [string, number, number, number, number, number, number, string, number];
export interface BoardArchive { mode: 'masters' | 'season'; rows: BoardRow[]; cut: number }

const BOARD_KEEP = 24;

/** Startberechtigt für das Masters: Vereine der beiden oberen Ligen (keine Gäste/Amateure). */
export function mastersEligible(id: string): boolean {
  return !isForeignId(id) && !id.startsWith('am') && !id.startsWith('ph-');
}

export function mastersHintOff(wy: number): string {
  if (wy < INDOOR_FIRST_WINTER) return `Hallenturniere mit Profis gibt es ab dem Winter ${INDOOR_FIRST_WINTER - 1}/${String(INDOOR_FIRST_WINTER % 100).padStart(2, '0')}, das Hallen-Masters von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}.`;
  if (wy > INDOOR_LAST_WINTER) return `Seit ${INDOOR_LAST_WINTER + 1} gibt es keine Hallenturniere mit Profis mehr; das Hallen-Masters lief von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}.`;
  if (wy < MASTERS_FIRST_WINTER) return `Ein Hallen-Masters gibt es erst ab Januar ${MASTERS_FIRST_WINTER} (Winter ${MASTERS_FIRST_WINTER - 1}/${String(MASTERS_FIRST_WINTER % 100).padStart(2, '0')}). Bis dahin zählt hier die Wertung der Einladungsturniere: Turniersiege, dann Punkte.`;
  return `Das Hallen-Masters lief von ${MASTERS_FIRST_WINTER} bis ${MASTERS_LAST_WINTER}. Jetzt gibt es nur noch regionale Turniere – Wertung nach Turniersiegen, dann Punkten.`;
}

const blank = (id: string): MastersRow => ({ id, t: 0, sp: 0, pts: 0, gf: 0, ga: 0, wins: 0 });
const ofStat = (s: TourStat, wins: number): MastersRow => ({ id: s.id, t: s.tournaments, sp: s.games, pts: s.pts, gf: s.gf, ga: s.ga, wins });

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
    if (ph === 'none') return { mode: 'none', year: wy, rows: [], cut: 0, hint: mastersHintOff(wy), stage: 'before' };
    const pre = 'Die Hallensaison beginnt mit den Einladungen Anfang November.';
    return { mode: ph === 'masters' ? 'masters' : 'season', year: wy, rows: [], cut: 0, stage: 'before', hint: ph === 'masters' ? `${pre} Danach zählt jedes Spiel der Qualifikationsturniere für das Masters.` : `${pre} ${mastersHintOff(wy)}` };
  }
  if (cur.phase === 'none') return { mode: 'none', year: wy, rows: [], cut: 0, hint: mastersHintOff(wy), stage: 'before' };
  const wins = winsOf(cur);
  const byName = (a: string, b: string) => name(a).localeCompare(name(b), 'de');

  if (cur.phase !== 'masters') {
    const map = new Map<string, TourStat>();
    for (const t of cur.tournaments) if (t.done && t.result) addResultToTour(map, t.result, g.pointSystem === '3-point' ? 3 : 2);
    const rows = [...map.values()].map((s) => ofStat(s, wins.get(s.id) ?? 0))
      .sort((x, y) => y.wins - x.wins || y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
    const rest = waiting(cur, new Set(rows.map((r) => r.id))).sort(byName).map(blank);
    const stage = rows.length ? 'tour' : 'before';
    return { mode: 'season', year: wy, rows: [...rows, ...rest], cut: 0, hint: mastersHintOff(wy), stage };
  }

  const ranked = tourRanking(cur.tour ?? []).map((s) => ofStat(s, wins.get(s.id) ?? 0));
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
  const hint = stage === 'before'
    ? `Noch kein Qualifikationsturnier gespielt – alle gemeldeten Teams stehen bei 0 Punkten. Die ${MASTERS_TEAMS} Besten nach Ø Punkten je Spiel fahren zum Masters.`
    : stage === 'tour' ? `Stand der Qualifikation: Die ${MASTERS_TEAMS} Besten nach Ø Punkten je Spiel fahren zum Masters (Gleichstand: Tordifferenz je Spiel, dann Tore).`
    : stage === 'field' ? 'Das Teilnehmerfeld steht. Wer verzichtet oder an den Masters-Tagen noch ein Pflichtspiel hat, macht Platz für Nachrücker.'
    : 'Endwertung der Qualifikation mit dem Abschneiden beim Masters.';
  return { mode: 'masters', year: wy, rows: [...elig, ...guests], cut: Math.min(MASTERS_TEAMS, elig.length), hint, stage };
}

/** Für das Archiv am Winterende (game/indoorGame.ts `finishWinter`). */
export function packBoard(b: MastersBoard): BoardArchive | undefined {
  if (b.mode === 'none' || !b.rows.length) return undefined;
  const rows = b.rows.filter((r) => r.sp > 0 || r.status === 'q' || r.status === 'sub').slice(0, BOARD_KEEP)
    .map((r): BoardRow => [r.id, r.t, r.sp, r.pts, r.gf, r.ga, r.wins, r.status ?? '', r.place ?? 0]);
  return { mode: b.mode, rows, cut: b.cut };
}

export function unpackBoard(a: BoardArchive, year: number): MastersBoard {
  return {
    mode: a.mode, year, cut: a.cut, stage: 'done',
    rows: a.rows.map(([id, t, sp, pts, gf, ga, wins, st, place]) => ({ id, t, sp, pts, gf, ga, wins, status: (st || undefined) as MastersStatus | undefined, place: place || undefined })),
    hint: a.mode === 'masters' ? `Endwertung der Qualifikation ${year - 1}/${String(year % 100).padStart(2, '0')} mit dem Abschneiden beim Masters.` : mastersHintOff(year),
  };
}
