// =============================================================================
// VEREINS-HISTORIE für das Vereinsprofil (components/ClubModal.tsx, Reiter „Historie“)
// -----------------------------------------------------------------------------
// Beim Saisonwechsel (game/season.ts → startNextSeason) wird festgehalten:
//   • Endplatz jedes Vereins in seiner Liga (alle Ebenen, auch DDR),
//   • Titel (Meister, Landespokal, Europapokal),
//   • direkter Vergleich jedes Gegners mit deinem Verein (Liga + Pokal).
// Kompakt als Tupel gespeichert (Spielstandgröße). Das Feld `clubRecords` hängt
// optional am Spielstand und wird über einen lokalen, schmalen Zugriff gelesen –
// fehlt es (Altstände), beginnt die Historie einfach mit der nächsten Saison.
// =============================================================================
import type { CurrentDivision } from '../data/reforms';
import { divisionLabel } from '../engine/leagues';
import { Game } from './state';

/** [Saison, Ebene, Platz, Ligagröße, Liga-Index in `divs`] */
export type SeasonTuple = [string, number, number, number, number];
export type TitleKind = 'meister' | 'ddr' | 'pokal' | 'ec' | 'cwc' | 'uefa' | 'halle' | 'jugendA' | 'jugendB' | 'jugendPokal' | 'jugendDdr' | 'uyl'
  /** C- bis F-Jugend: Staffelsieg (nur eigener Verein, game/youthComps/lower.ts). */
  | 'jugendC' | 'jugendD' | 'jugendE' | 'jugendF'
  /** E-/F-Jugend: Endrunde der Kreismeister im Landesverband (Wunsch Pascal). */
  | 'jugendEReg' | 'jugendFReg';
/** Ein Spiel deines Vereins gegen diesen Gegner: [Saison, Datum, Wettbewerb, Heim (1/0), Tore dein Verein, Tore Gegner] */
export type H2HTuple = [string, string, 'L' | 'P' | 'E', number, number, number];

export interface ClubRecordBook {
  v: 1;
  /** Liga-Bezeichnungen (Index-Tabelle, spart Platz). */
  divs: string[];
  seasons: Record<string, SeasonTuple[]>;
  titles: Record<string, [TitleKind, string][]>;
  /** Für welchen eigenen Verein der direkte Vergleich geführt wird. */
  h2hClub: string;
  h2h: Record<string, H2HTuple[]>;
}

const MAX_SEASONS = 80;
const MAX_H2H = 60;

type GameWithRecords = Game & { clubRecords?: ClubRecordBook };

export function recordBook(g: Game): ClubRecordBook | undefined {
  return (g as GameWithRecords).clubRecords;
}

function ensureBook(g: Game): ClubRecordBook {
  const gr = g as GameWithRecords;
  if (!gr.clubRecords) gr.clubRecords = { v: 1, divs: [], seasons: {}, titles: {}, h2hClub: g.managedClubId, h2h: {} };
  return gr.clubRecords;
}

export const TITLE_DE: Record<TitleKind, string> = {
  meister: 'Deutscher Meister', ddr: 'DDR-Meister', pokal: 'Landespokal',
  ec: 'Europapokal der Landesmeister', cwc: 'Europapokal der Pokalsieger', uefa: 'UEFA-Pokal',
  halle: 'DFB-Hallenpokal (Masters)',
  jugendA: 'Deutscher A-Jugend-Meister', jugendB: 'Deutscher B-Jugend-Meister', jugendPokal: 'DFB-Junioren-Pokal',
  jugendDdr: 'DDR-Juniorenmeister', uyl: 'UEFA Youth League',
  jugendC: 'Staffelsieg C-Jugend', jugendD: 'Staffelsieg D-Jugend', jugendE: 'Staffelsieg E-Jugend', jugendF: 'Staffelsieg F-Jugend',
  jugendEReg: 'Meister der E-Jugend (Landesverband)', jugendFReg: 'Meister der F-Jugend (Landesverband)',
};

/** Titel außerhalb des Saisonabschlusses eintragen (z. B. Hallen-Masters, game/indoorGame.ts). */
export function addTitleRecord(g: Game, clubId: string, kind: TitleKind, season: string): void {
  if (!g.clubs[clubId] && !g.simClubs[clubId]) return;
  const list = (ensureBook(g).titles[clubId] ??= []);
  if (!list.some(([k, s]) => k === kind && s === season)) list.push([kind, season]);
}

/**
 * Historie vor Spielbeginn eintragen (game/clubPool.ts → seedHistoricRecords): Endplätze
 * einer Liga-Saison und Titel. Idempotent, chronologisch einsortiert (vor den gespielten Saisons).
 */
export function addHistoricSeason(g: Game, season: string, label: string, tier: number, orderedIds: string[]): void {
  const book = ensureBook(g);
  let di = book.divs.indexOf(label);
  if (di < 0) { book.divs.push(label); di = book.divs.length - 1; }
  orderedIds.forEach((id, i) => {
    const list = (book.seasons[id] ??= []);
    if (list.some((s) => s[0] === season)) return;
    list.push([season, tier, i + 1, orderedIds.length, di]);
    list.sort((a, b) => a[0].localeCompare(b[0]));
    if (list.length > MAX_SEASONS) list.shift();
  });
}
export function addHistoricTitle(g: Game, clubId: string, kind: TitleKind, season: string): void {
  const list = (ensureBook(g).titles[clubId] ??= []);
  if (list.some(([k, s]) => k === kind && s === season)) return;
  list.push([kind, season]);
  list.sort((a, b) => a[1].localeCompare(b[1]));
}

/** Spiele deines Vereins der laufenden Saison gegen einen Gegner (Liga + Landespokal). */
export function currentH2H(g: Game, oppId: string): H2HTuple[] {
  const mid = g.managedClubId;
  const out: H2HTuple[] = [];
  for (const m of g.fixtures) {
    if (m.status !== 'finished' || !m.result) continue;
    const home = m.homeClubId === mid && m.awayClubId === oppId;
    const away = m.awayClubId === mid && m.homeClubId === oppId;
    if (!home && !away) continue;
    const gf = home ? m.result.homeGoals : m.result.awayGoals;
    const ga = home ? m.result.awayGoals : m.result.homeGoals;
    out.push([g.season, m.date, 'L', home ? 1 : 0, gf, ga]);
  }
  const cups = [g.cup, g.euroCups?.ec, g.euroCups?.cwc, g.euroCups?.uefa];
  cups.forEach((cup, i) => {
    for (const rd of cup?.rounds ?? []) for (const t of rd.ties) {
      if (!t.played || t.homeGoals == null || t.awayGoals == null) continue;
      const home = t.homeClubId === mid && t.awayClubId === oppId;
      const away = t.awayClubId === mid && t.homeClubId === oppId;
      if (!home && !away) continue;
      out.push([g.season, t.date, i === 0 ? 'P' : 'E', home ? 1 : 0, home ? t.homeGoals : t.awayGoals, home ? t.awayGoals : t.homeGoals]);
    }
  });
  return out.sort((a, b) => a[1].localeCompare(b[1]));
}

/**
 * Saisonende festhalten. Aufruf in startNextSeason, NACHDEM alle Ligen zu Ende
 * simuliert sind und BEVOR Tabellen, Pokal und Europapokal überschrieben werden.
 */
export function recordSeasonEnd(g: Game, season: string, divisions: CurrentDivision[]): void {
  const book = ensureBook(g);
  if (book.h2hClub !== g.managedClubId) { book.h2hClub = g.managedClubId; book.h2h = {}; }
  const divIdx = (label: string) => {
    let i = book.divs.indexOf(label);
    if (i < 0) { book.divs.push(label); i = book.divs.length - 1; }
    return i;
  };
  const addTitle = (id: string | null | undefined, kind: TitleKind) => {
    if (!id || (!g.clubs[id] && !g.simClubs[id])) return;
    (book.titles[id] ??= []).push([kind, season]);
  };

  for (const d of divisions) {
    const ddr = d.id.startsWith('ddr-');
    const label = ddr ? d.name : divisionLabel(d.tier, d.group);
    const di = divIdx(label);
    d.orderedIds.forEach((id, i) => {
      const list = (book.seasons[id] ??= []);
      if (list.some((s) => s[0] === season)) return;
      list.push([season, d.tier, i + 1, d.orderedIds.length, di]);
      if (list.length > MAX_SEASONS) list.shift();
    });
    if (d.tier === 1 && !ddr) addTitle(d.orderedIds[0], 'meister');
    if (ddr && d.tier === 101) addTitle(d.orderedIds[0], 'ddr');
  }
  addTitle(g.cup?.winnerClubId, 'pokal');
  addTitle(g.euroCups?.ec?.winnerClubId, 'ec');
  addTitle(g.euroCups?.cwc?.winnerClubId, 'cwc');
  addTitle(g.euroCups?.uefa?.winnerClubId, 'uefa');

  // Direkter Vergleich: alle Gegner der abgelaufenen Saison.
  const opps = new Set<string>();
  for (const m of g.fixtures) if (m.involvesPlayerClub) opps.add(m.homeClubId === g.managedClubId ? m.awayClubId : m.homeClubId);
  for (const cup of [g.cup, g.euroCups?.ec, g.euroCups?.cwc, g.euroCups?.uefa]) {
    for (const rd of cup?.rounds ?? []) for (const t of rd.ties) {
      if (t.homeClubId === g.managedClubId) opps.add(t.awayClubId);
      else if (t.awayClubId === g.managedClubId) opps.add(t.homeClubId);
    }
  }
  for (const id of opps) {
    const games = currentH2H(g, id);
    if (!games.length) continue;
    const list = (book.h2h[id] ??= []);
    list.push(...games);
    if (list.length > MAX_H2H) list.splice(0, list.length - MAX_H2H);
  }
}

// -----------------------------------------------------------------------------
// Lesen (für das Vereinsprofil)
// -----------------------------------------------------------------------------
export interface SeasonPlacement { season: string; tier: number; pos: number; size: number; league: string; live?: boolean }

export function seasonsOf(g: Game, clubId: string): SeasonPlacement[] {
  const book = recordBook(g);
  return (book?.seasons[clubId] ?? []).map(([season, tier, pos, size, di]) => ({ season, tier, pos, size, league: book!.divs[di] ?? '' }));
}

export function titlesOf(g: Game, clubId: string): { kind: TitleKind; season: string }[] {
  return (recordBook(g)?.titles[clubId] ?? []).map(([kind, season]) => ({ kind, season }));
}

/** Alle Spiele gegen deinen Verein: gespeicherte Vorsaisons + laufende Saison. */
export function h2hOf(g: Game, oppId: string): H2HTuple[] {
  const book = recordBook(g);
  const past = book && book.h2hClub === g.managedClubId ? book.h2h[oppId] ?? [] : [];
  return [...past, ...currentH2H(g, oppId)];
}
