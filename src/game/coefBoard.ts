// =============================================================================
// FÜNFJAHRESWERTUNG MIT LAUFENDER SAISON (Statistiken › International › Fünfjahreswertung,
// Wunsch Pascal: Detailtiefe zwischen 5-jahres-wertung.de und kicker) – nur Anzeige, keine
// zweite Rechnung des Spiels:
//   • abgeschlossene Saisons = `WorldCountry.coef`/`germanCoef` über game/coefficients.ts,
//   • laufende Saison „live“ = dieselbe Formel wie der Saisonwechsel (engine/worldEuro.ts
//     `seasonEuroPoints` auf `g.euroCups`, Ø je Starter des Landes, Heimatland wie
//     `advanceWorldSeason`: voller Verein oder deutscher Sim-Verein),
//   • Fenster wie 5-jahres-wertung.de: vier abgeschlossene + laufende Saison; „Platz“ = Reihung
//     nach diesem Fenster, „Vorjahr“ = amtliche Reihung nach der letzten abgeschlossenen Saison
//     (coefTable – nach ihr richten sich die Startplätze dieser Saison und die festen Plätze deines
//     Landes für die Folgesaison),
//   • Startplätze der Folgesaison: Heimatland fest (coefTable), andere Länder Prognose nach dem
//     Live-Platz (so reiht der Saisonwechsel die übrigen Länder neu, `accessSlots`).
// Aufschlüsselung je Verein: laufende Saison immer; abgeschlossene Saisons nur, wenn das
// Liga-Archiv (game/leagueArchive.ts) die Europapokale der Saison enthält UND die daraus
// nachgerechneten Punkte dem gespeicherten Wert des Landes entsprechen – sonst keine.
// =============================================================================
import { accessSlots, euroCompName } from '../data/euroFormats';
import type { EuroCompId } from '../data/europe';
import { seasonStartYear } from '../data/timeline';
import { isForeignId, seasonEuroPoints } from '../engine/world';
import type { CupState } from '../types';
import { coefTable, type CoefComp, type CoefTable } from './coefficients';
import { compClubName } from './competitionView';
import { archivedSeason, type ArchCup } from './leagueArchive';
import type { Game } from './state';

const COMPS: CoefComp[] = ['ec', 'cwc', 'uefa'];
const round2 = (v: number) => Math.round(v * 100) / 100;

export type ClubState = 'in' | 'out' | 'won';
export interface CoefClub { id: string; name: string; comps: CoefComp[]; pts: number; state?: ClubState }
export interface CoefBreakdown { season: string; live: boolean; clubs: CoefClub[]; sum: number; avg: number }

export interface BoardRow {
  key: string; name: string; home: boolean;
  /** Platz nach dem Fenster vier abgeschlossene + laufende Saison. */
  rank: number;
  /** Amtlicher Platz nach der letzten abgeschlossenen Saison (null = damals nicht gewertet). */
  prev: number | null;
  /** Punkte je Spalte von `CoefBoard.seasons` (null = keine Wertung). */
  seasons: (number | null)[];
  total: number;
  /** Laufende Saison: Starter gesamt / noch dabei / je Wettbewerb; null = keine Europapokale. */
  teams: { total: number; alive: number; byComp: Record<CoefComp, number> } | null;
  /** Summe der Vereinspunkte der laufenden Saison (Teampunkte). */
  teamPts: number | null;
  /** Rückstand auf den Platz davor (Gesamt). */
  gap: number | null;
  slots: Record<CoefComp, number>;
  /** Startplätze stehen fest (Heimatland). */
  fixed: boolean;
  /** Zone = Gruppe gleicher Startplätze (0 = vorderste). */
  band: number;
}
export interface CoefBand { from: number; to: number; slots: Record<CoefComp, number> }
export interface CoefBoard {
  /** Spalten: vier abgeschlossene Saisons + laufende (älteste zuerst). */
  seasons: string[];
  /** Index der laufenden Saison in `seasons` (immer die letzte). */
  live: number;
  /** Letzte abgeschlossene Saison (Bezug „Vorjahr“). */
  lastDone: string;
  next: string;
  comps: CoefTable['comps'];
  cupTo: CoefComp;
  rows: BoardRow[];
  bands: CoefBand[];
}

/** Vereine des Heimatlandes wie in season.ts (`advanceWorldSeason`, isGerman) – dort sind die voll
 *  angelegten Europapokal-Gegner (`eu_`/`w_`) schon aus `g.clubs` entfernt, hier noch nicht. */
const isHomeClub = (g: Game, id: string) => !isForeignId(id) && (!!g.clubs[id] || (!!g.simClubs?.[id] && g.simClubs[id].tier < 200));
function countryOfClub(g: Game, id: string, homeKey: string): string | null {
  if (isHomeClub(g, id)) return homeKey;
  return g.euroClubs?.[id]?.country ?? null;
}

/** Stand eines Vereins in einem Wettbewerb (wie game/euroFixture.ts euroStatus; noch nicht angetreten = dabei). */
function clubState(cup: CupState, id: string): ClubState {
  if (cup.winnerClubId === id) return 'won';
  for (let i = cup.rounds.length - 1; i >= 0; i--) {
    const r = cup.rounds[i];
    const inRound = r.entrants?.includes(id) || r.ties.some((t) => t.homeClubId === id || t.awayClubId === id) || r.groups?.some((gr) => gr.ids.includes(id));
    if (!inRound) continue;
    const tie = r.ties.find((t) => t.homeClubId === id || t.awayClubId === id);
    if (tie?.played && tie.winnerClubId && tie.winnerClubId !== id) return 'out';
    const gr = r.groups?.find((x) => x.ids.includes(id));
    if (gr?.final && !cup.rounds.slice(i + 1).some((x) => x.entrants?.includes(id) || x.ties.some((t) => t.homeClubId === id || t.awayClubId === id))) return 'out';
    return cup.winnerClubId ? 'out' : 'in';
  }
  return cup.winnerClubId ? 'out' : 'in';
}

/** Laufende Saison: Vereine je Land mit Punkten, Wettbewerben und Stand. */
function liveClubs(g: Game, homeKey: string): Map<string, CoefClub[]> {
  const out = new Map<string, CoefClub[]>();
  const cups = g.euroCups;
  if (!cups) return out;
  const pts = seasonEuroPoints(cups as Record<EuroCompId, CupState | null>);
  const seen = new Map<string, CoefClub>();
  for (const comp of COMPS) {
    const cup = cups[comp];
    if (!cup) continue;
    const ids = new Set([...cup.participantIds, ...cup.rounds.flatMap((r) => r.entrants ?? [])]);
    for (const id of ids) {
      const land = countryOfClub(g, id, homeKey);
      if (!land) continue;
      let c = seen.get(id);
      if (!c) {
        c = { id, name: compClubName(g, id, g.season), comps: [], pts: pts[id] ?? 0, state: 'out' };
        seen.set(id, c);
        const list = out.get(land) ?? [];
        list.push(c); out.set(land, list);
      }
      c.comps.push(comp);
      const st = clubState(cup, id);
      if (st === 'won' || (st === 'in' && c.state !== 'won')) c.state = st;
    }
  }
  return out;
}

/** Abgeschlossene Saison aus dem Liga-Archiv nachgerechnet (gleiche Punkte wie seasonEuroPoints). */
function archivedClubs(g: Game, season: string, homeKey: string): Map<string, CoefClub[]> | null {
  const a = archivedSeason(g, season);
  if (!a || !COMPS.some((c) => a.cups[c])) return null;
  const pts: Record<string, number> = {};
  const comps: Record<string, CoefComp[]> = {};
  const add = (id: string, v: number) => { pts[id] = (pts[id] ?? 0) + v; };
  for (const comp of COMPS) {
    const cup: ArchCup | undefined = a.cups[comp];
    if (!cup) continue;
    const ids = new Set<string>();
    for (const r of cup.rounds) {
      for (const t of r.t) { ids.add(t[0]); ids.add(t[1]); if (t[5]) add(t[5], 2); }
      for (const gr of r.g ?? []) for (const row of gr.r) { ids.add(row[0]); add(row[0], row[2] + row[3] * 0.5); }
    }
    for (const id of ids) { add(id, 1); (comps[id] ??= []).push(comp); }
    if (cup.winner) add(cup.winner, 2);
  }
  const out = new Map<string, CoefClub[]>();
  for (const id of Object.keys(comps)) {
    const land = countryOfClub(g, id, homeKey);
    if (!land) continue;
    const list = out.get(land) ?? [];
    list.push({ id, name: a.names[id] ?? compClubName(g, id, season), comps: comps[id], pts: pts[id] ?? 0 });
    out.set(land, list);
  }
  return out;
}

const avgOf = (list: CoefClub[] | undefined) => (list?.length ? round2(list.reduce((s, c) => s + c.pts, 0) / list.length) : 0);

/** Fünfjahreswertung mit laufender Saison; null = keine Hintergrund-Welt. */
export function coefBoard(g: Game): CoefBoard | null {
  const t = coefTable(g);
  if (!t) return null;
  const homeKey = t.rows.find((r) => r.home)?.key ?? '';
  const live = liveClubs(g, homeKey);
  const hasLive = !!g.euroCups && COMPS.some((c) => g.euroCups?.[c]);
  const seasons = [...t.seasons.slice(1), g.season];
  const base = t.rows.map((r) => {
    const clubs = live.get(r.key);
    const lv = hasLive ? avgOf(clubs) : null;
    const cols = [...r.seasons.slice(1), lv];
    const byComp = { ec: 0, cwc: 0, uefa: 0 } as Record<CoefComp, number>;
    for (const c of clubs ?? []) for (const k of c.comps) byComp[k]++;
    return {
      key: r.key, name: r.name, home: r.home, prev: r.seasons.some((v) => v != null) ? r.rank : null, official: r.rank,
      seasons: cols, total: round2(cols.reduce<number>((s, v) => s + (v ?? 0), 0)),
      teams: hasLive ? { total: clubs?.length ?? 0, alive: (clubs ?? []).filter((c) => c.state !== 'out').length, byComp } : null,
      teamPts: hasLive ? round2((clubs ?? []).reduce((s, c) => s + c.pts, 0)) : null,
      fixedSlots: r.home ? r.slots : null,
    };
  });
  base.sort((a, b) => b.total - a.total || a.official - b.official);
  const nextY = seasonStartYear(t.next);
  const rows: BoardRow[] = base.map((r, i) => {
    const s = accessSlots(nextY, i + 1);
    return {
      key: r.key, name: r.name, home: r.home, rank: i + 1, prev: r.prev, seasons: r.seasons, total: r.total,
      teams: r.teams, teamPts: r.teamPts, gap: i ? round2(base[i - 1].total - r.total) : null,
      slots: r.fixedSlots ?? { ec: s.ec, cwc: s.cwc, uefa: s.uefa }, fixed: !!r.fixedSlots, band: 0,
    };
  });
  // Zonen nach Rang: gleiche Startplätze laut Format der Folgesaison.
  const comps = t.comps.map((c) => c.id);
  const bands: CoefBand[] = [];
  for (let r = 1; r <= rows.length; r++) {
    const s = accessSlots(nextY, r);
    const slots = { ec: s.ec, cwc: s.cwc, uefa: s.uefa };
    const last = bands[bands.length - 1];
    if (last && comps.every((c) => last.slots[c] === slots[c])) last.to = r;
    else bands.push({ from: r, to: r, slots });
  }
  for (const row of rows) row.band = Math.max(0, bands.findIndex((b) => row.rank >= b.from && row.rank <= b.to));
  return { seasons, live: seasons.length - 1, lastDone: t.seasons[t.seasons.length - 1], next: t.next, comps: t.comps, cupTo: t.cupTo, rows, bands };
}

/**
 * Vereine eines Landes in einer Spalte der Wertung. Laufende Saison immer; abgeschlossene nur
 * aus dem Liga-Archiv und nur, wenn die Nachrechnung den gespeicherten Wert trifft (sonst null).
 */
export function coefBreakdown(g: Game, b: CoefBoard, key: string, col: number): CoefBreakdown | null {
  const row = b.rows.find((r) => r.key === key);
  const season = b.seasons[col];
  if (!row || !season) return null;
  const homeKey = b.rows.find((r) => r.home)?.key ?? '';
  const isLive = col === b.live;
  const clubs = isLive ? liveClubs(g, homeKey).get(key) : archivedClubs(g, season, homeKey)?.get(key);
  if (!clubs?.length) return null;
  const sum = round2(clubs.reduce((s, c) => s + c.pts, 0));
  const avg = round2(sum / clubs.length);
  if (!isLive && (row.seasons[col] == null || Math.abs(avg - row.seasons[col]!) > 0.011)) return null;
  return { season, live: isLive, clubs: [...clubs].sort((x, y) => y.pts - x.pts || x.name.localeCompare(y.name)), sum, avg };
}

/** Kürzel der Wettbewerbe für Spaltenköpfe (Epochen-Name, Anfangsbuchstaben). */
export function compShort(id: CoefComp, y: number): string {
  const name = euroCompName(id, y);
  const words = name.replace(/-/g, ' ').split(/\s+/).filter((w) => /^[A-ZÄÖÜ]/.test(w) && !/^(der|des)$/i.test(w));
  return words.map((w) => w[0]).join('').slice(0, 3) || name.slice(0, 3);
}

/** Zellen „Land|Spalte“, für die es eine Aufschlüsselung je Verein gibt (für klickbare Zellen). */
export function breakdownCells(g: Game, b: CoefBoard): Set<string> {
  const out = new Set<string>();
  const homeKey = b.rows.find((r) => r.home)?.key ?? '';
  b.seasons.forEach((season, col) => {
    const map = col === b.live ? liveClubs(g, homeKey) : archivedClubs(g, season, homeKey);
    if (!map) return;
    for (const row of b.rows) {
      const clubs = map.get(row.key);
      if (!clubs?.length) continue;
      const avg = round2(clubs.reduce((s, c) => s + c.pts, 0) / clubs.length);
      if (col === b.live || (row.seasons[col] != null && Math.abs(avg - row.seasons[col]!) <= 0.011)) out.add(`${row.key}|${col}`);
    }
  });
  return out;
}
