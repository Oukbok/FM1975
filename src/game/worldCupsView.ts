// =============================================================================
// Statistiken › International › Welt – Anzeigedaten (nur gelesen, nichts gespeichert):
// Weltpokal / Klub-WM / Interkontinentalpokal (game/intercontinental.ts) und die
// Kontinentalpokale der anderen Kontinente (game/continents.ts) im Format der
// Wettbewerbsseiten (`RoundLite` für RoundsBracket, `GroupTable` für GroupTables).
// =============================================================================
import type { Game } from './state';
import type { RoundLite, TieLite } from './competitionView';
import type { GroupTable } from '../components/competition/GroupTables';
import { seasonLabel } from '../engine/calendar';
import { CONTINENTS, CONTINENT_KEYS, cupEraOf, type ContinentKey } from '../data/world/continents';
import { IC_FORMAT_DE, IC_NAMES, icPlansFor, type IcFormat, type IcKey } from '../data/world/continents/intercontinental';
import { continentalRecord, continentalWinners, continentsState } from './continents';
import { icStateOf, type IcArcMatch, type IcArchive, type IcEvent } from './intercontinental';
import { groupTable, IC_STAGE_DE, type IcMatch, type IcStage } from './intercontinentalPlay';

export type WorldCompKey = 'wp' | 'cwc' | 'icup' | ContinentKey;
export interface WorldCompOption { key: WorldCompKey; label: string; section: string }

export const WORLD_COMP_OPTIONS: WorldCompOption[] = [
  { key: 'wp', label: 'Weltpokal', section: 'Welt' },
  { key: 'cwc', label: 'Klub-Weltmeisterschaft', section: 'Welt' },
  { key: 'icup', label: 'Interkontinentalpokal', section: 'Welt' },
  ...CONTINENT_KEYS.map((k) => ({ key: k, label: CONTINENTS[k].name, section: 'Kontinente' })),
];
const isIc = (k: WorldCompKey): k is 'wp' | 'cwc' | 'icup' => k === 'wp' || k === 'cwc' || k === 'icup';
const matchesKey = (k: WorldCompKey, ic: IcKey) => k === ic || (k === 'cwc' && ic === 'big');

export interface WorldSnapshot {
  title: string; season: string; mode: string;
  rounds: RoundLite[]; groups?: GroupTable[];
  winner?: string; runnerUp?: string; score?: string; note?: string;
  teams: string[]; live: boolean;
  /** Saison-Text für die Vereinsnamen (Kontinente: Kalenderjahr → Saison). */
  nameSeason: string;
}

/** Saisons mit Daten (neueste zuerst). Kontinente: Jahre als „1976“. */
export function worldCompSeasons(g: Game, key: WorldCompKey): string[] {
  if (isIc(key)) {
    const st = icStateOf(g);
    const s = new Set<string>();
    for (const e of st?.events ?? []) if (matchesKey(key, e.key)) s.add(e.season);
    for (const a of st?.archive ?? []) if (matchesKey(key, a.key)) s.add(a.season);
    return [...s].sort().reverse();
  }
  return Object.keys(continentsState(g)?.cups ?? {}).filter((y) => continentsState(g)!.cups[Number(y)][key]).sort().reverse();
}

const dec = (d: number): TieLite['dec'] => (d === 1 ? 1 : d >= 2 ? 2 : 0);

function roundsFromIc(list: { st: IcStage; home: string; away: string; hg?: number; ag?: number; d: number; played: boolean; id: string; date?: string; matchId?: string; pens?: [number, number] }[], mid: string): RoundLite[] {
  const order: IcStage[] = ['R1', 'PO', 'AP', 'DA', 'R16', 'QF', 'CH', 'SF', 'P3', 'F', 'L1', 'L2'];
  const ko = list.filter((m) => !m.st.startsWith('G'));
  // Hin- und Rückspiel als eine Begegnung.
  const l1 = ko.find((m) => m.st === 'L1'), l2 = ko.find((m) => m.st === 'L2');
  if (l1) {
    const done = !!l2?.played;
    const hg = done ? (l1.ag ?? 0) + (l2!.hg ?? 0) : null, ag = done ? (l1.hg ?? 0) + (l2!.ag ?? 0) : null;
    const t: TieLite = {
      id: l1.id, home: l1.away, away: l1.home, hg, ag, dec: done ? dec(l2!.d) : 0, winner: null, agg: true, mine: l1.home === mid || l1.away === mid,
      legs: [[l1.ag ?? 0, l1.hg ?? 0], ...(l2?.played ? [[l2.hg ?? 0, l2.ag ?? 0] as [number, number]] : [])],
    };
    if (done) t.winner = l2!.d >= 2 ? (l2!.d === 2 ? l2!.home : l2!.away) : hg! > ag! ? t.home : hg! < ag! ? t.away : (l1.ag ?? 0) > (l2!.ag ?? 0) ? t.home : t.away;
    return [{ index: 0, name: 'Hin- und Rückspiel', drawn: true, ties: [t], legs: 2 }];
  }
  const out: RoundLite[] = [];
  for (const st of order) {
    const ms = ko.filter((m) => m.st === st);
    if (!ms.length) continue;
    out.push({
      index: out.length, name: IC_STAGE_DE[st], drawn: true, legs: 1,
      ties: ms.map((m) => ({
        id: m.id, home: m.home, away: m.away, hg: m.played ? m.hg ?? 0 : null, ag: m.played ? m.ag ?? 0 : null, dec: dec(m.d), date: m.date, matchId: m.matchId, pen: m.pens,
        winner: !m.played ? null : m.d === 2 ? m.home : m.d === 3 ? m.away : (m.hg ?? 0) >= (m.ag ?? 0) ? m.home : m.away, mine: m.home === mid || m.away === mid,
      })),
    });
  }
  return out;
}

function groupsOf(groups: { name: string; ids: string[] }[] | undefined, ms: IcMatch[]): GroupTable[] | undefined {
  if (!groups?.length) return undefined;
  return groups.map((gr) => ({ name: `Gruppe ${gr.name}`, rows: groupTable(ms, gr).map((r) => ({ id: r.id, played: r.p, won: r.w, drawn: r.d, lost: r.l, gf: r.gf, ga: r.ga, pts: r.pts })) }));
}

const fromArc = (a: IcArchive): IcMatch[] => (a.m ?? []).map((x: IcArcMatch, i) => ({
  id: `${a.season}_${i}`, date: '', st: x[0], home: x[1], away: x[2], hg: x[3], ag: x[4], played: true,
  pens: x[5] === 2 ? [5, 4] : x[5] === 3 ? [4, 5] : undefined, aet: x[5] === 1, grp: x[6],
}));
const dOf = (m: IcMatch) => (m.pens ? (m.pens[0] > m.pens[1] ? 2 : 3) : m.aet ? 1 : 0);

export function worldCompSnapshot(g: Game, key: WorldCompKey, season: string): WorldSnapshot | null {
  const mid = g.managedClubId;
  if (isIc(key)) {
    const st = icStateOf(g);
    const ev: IcEvent | undefined = st?.events.find((e) => e.season === season && matchesKey(key, e.key));
    const arc = st?.archive.filter((a) => a.season === season && matchesKey(key, a.key)).pop();
    const fmt: IcFormat | undefined = ev?.format ?? arc?.format;
    if (!fmt) return null;
    const ms: IcMatch[] = ev ? ev.matches : arc ? fromArc(arc) : [];
    const list = ms.map((m) => ({ ...m, d: dOf(m), played: !!m.played, matchId: m.match?.id, pens: m.pens }));
    return {
      title: `${(ev ?? arc)!.name} ${season}`, season, mode: IC_FORMAT_DE[fmt], nameSeason: season,
      rounds: roundsFromIc(list, mid), groups: groupsOf(ev?.groups ?? arc?.groups, ms),
      winner: ev?.winner ?? (arc?.winner || undefined), runnerUp: ev?.runnerUp ?? (arc?.runnerUp || undefined), score: arc?.score, note: ev?.note ?? arc?.note,
      teams: ev?.teams ?? [...new Set(ms.flatMap((m) => [m.home, m.away]))], live: !!ev && !ev.winner,
    };
  }
  const y = Number(season);
  const rec = continentalRecord(g, key, y);
  const era = cupEraOf(key, y);
  if (!rec || !era) return null;
  const rounds: RoundLite[] = [];
  const t = rec.t ?? [];
  const names = (n: number) => (n === 2 ? 'Finale' : n === 4 ? 'Halbfinale' : n === 8 ? 'Viertelfinale' : n === 16 ? 'Achtelfinale' : `Runde der letzten ${n}`);
  let size = 1; while (size < t.length) size *= 2;
  (rec.r ?? []).forEach((r, i) => {
    const final = i === (rec.r!.length - 1);
    rounds.push({
      index: i, name: names(size >> i), drawn: true, legs: final ? era.finalLegs : era.legs,
      ties: r.split(',').filter(Boolean).map((s, j) => {
        const [a, b, ga, gb, e = 0] = s.split('.').map(Number);
        return { id: `${y}_${i}_${j}`, home: t[a], away: t[b], hg: ga, ag: gb, dec: dec(e), agg: (final ? era.finalLegs : era.legs) === 2,
          winner: e === 2 ? t[a] : e === 3 ? t[b] : ga > gb ? t[a] : t[b] } as TieLite;
      }),
    });
  });
  if (!rounds.length) rounds.push({ index: 0, name: 'Finale', drawn: true, ties: [{ id: `${y}_f`, home: rec.w, away: rec.ru, hg: null, ag: null, dec: 0, winner: rec.w, scoreText: rec.sc }] });
  return {
    title: `${era.name} ${y}`, season, nameSeason: seasonLabel(y),
    mode: `${era.size} Teams im K.-o.-System${era.legs === 2 ? ', Hin- und Rückspiel' : ''}, Finale ${era.finalLegs === 2 ? 'mit Hin- und Rückspiel' : 'in einem Spiel'} (vereinfacht: Meister und Platzierte der Länder, keine Gruppenphase)`,
    rounds, winner: rec.w, runnerUp: rec.ru, score: rec.sc, teams: t, live: false,
  };
}

export interface WorldWinnerRow { season: string; winner: string; runnerUp?: string; score?: string; pre?: boolean; note?: string; name?: string }
export function worldCompWinners(g: Game, key: WorldCompKey): WorldWinnerRow[] {
  if (isIc(key)) {
    return (icStateOf(g)?.archive ?? []).filter((a) => matchesKey(key, a.key)).reverse()
      .map((a) => ({ season: a.season, winner: a.winner, runnerUp: a.runnerUp, score: a.score, note: a.winner ? undefined : a.note, name: a.key === 'big' ? '32 Teams' : undefined }));
  }
  return continentalWinners(g, key).map((x) => ({ season: String(x.year), winner: x.w, runnerUp: x.ru, score: x.sc, pre: x.pre }));
}

const ABOUT: Record<'wp' | 'cwc' | 'icup', string> = {
  wp: 'Der Weltpokal wurde von 1960 bis 2004 ausgespielt (danach Klub-WM).',
  cwc: 'Die Klub-WM gibt es im Januar 2000, von 2005 bis 2023 jeden Dezember und ab 2025 alle vier Jahre mit 32 Teams.',
  icup: 'Den Interkontinentalpokal gibt es ab Dezember 2024.',
};
/** Hinweis für einen Wettbewerb ohne Daten seit deinem Start. */
export function worldCompAbout(key: WorldCompKey): string {
  return isIc(key) ? `${ABOUT[key]} Seit deinem Start noch nicht ausgespielt – die Siegerliste beginnt mit deinem Spiel.` : 'Noch nicht ausgespielt.';
}

/** Was steht in dieser Saison an (Hinweis für Saisons ohne Daten)? */
export function worldPlanText(year: number): string {
  const plans = icPlansFor(year);
  return plans.length ? plans.map((p) => `${IC_NAMES[p.key]}: ${IC_FORMAT_DE[p.format]}`).join(' · ') : 'In dieser Saison gibt es keinen interkontinentalen Wettbewerb.';
}
export const IC_STAGE_LABEL = IC_STAGE_DE;
