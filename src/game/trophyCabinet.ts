// =============================================================================
// TROPHÄENSCHRANK (Verein › Erfolge › Vereinspokale, Vereinsprofil › Erfolge)
// -----------------------------------------------------------------------------
// Liest nur vorhandene Daten – nichts Neues im Spielstand:
//   • Titel aus game/clubRecords.ts (Meister, DDR, Landespokal, Europapokale,
//     Halle, Jugend; inkl. Historie 1963/64–1974/75 aus game/clubPool.ts),
//   • Staffelsiege 2. Liga und tiefer + Aufstiege aus den Endplätzen,
//   • Einzelheiten der Saison aus Liga-Archiv (game/leagueArchive.ts), Historie
//     (data/history/) und Hallen-Archiv (game/winterShared.ts).
// Zeichnung der Trophäen: views/verein/trophies/TrophyArt.tsx, Foto-Slots
// data/trophyImages.ts.
// =============================================================================
import type { EuroCompId } from '../data/europe';
import { euroCompName } from '../data/euroFormats';
import { HIST_TOP_SCORERS, historicDivisions, historicFinal, type HistFinal } from '../data/history/seasons';
import { seasonStartYear } from '../data/timeline';
import { seasonsOf, titlesOf, TITLE_DE, type SeasonPlacement, type TitleKind } from './clubRecords';
import { compClubName } from './competitionView';
import { archivedSeason, type ArchRow, type CupKey } from './leagueArchive';
import type { Game } from './state';
import { homeCountryKey } from './state';
import { superCupArchiveFor } from './superCupGame';
import { indoorState } from './winterShared';

export type TrophyCat = 'liga' | 'pokal' | 'kontinental' | 'jugend' | 'andere';
export const TROPHY_CATS: { key: TrophyCat; label: string }[] = [
  { key: 'liga', label: 'Liga' }, { key: 'pokal', label: 'Pokal' }, { key: 'kontinental', label: 'Kontinental' },
  { key: 'jugend', label: 'Jugend' }, { key: 'andere', label: 'Andere' },
];

/** Form der gezeichneten Trophäe = Name des Foto-Slots (`bilder/trophies/<shape>.webp`). */
export type TrophyShape =
  | 'schale' | 'ddr' | 'teller' | 'pokal' | 'henkel' | 'cwc' | 'konferenz' | 'uefa'
  | 'halle' | 'jugend' | 'uyl' | 'aufstieg';

export interface TrophyEntry {
  id: string;
  cat: TrophyCat;
  shape: TrophyShape;
  season: string;
  /** Name des Titels zur Saison (z. B. „Pokal der Landesmeister“ bzw. ab 1992 „Meisterliga“). */
  title: string;
  /** Zusatz (Liga/Staffel). */
  sub?: string;
  kind: TitleKind | 'staffel' | 'aufstieg';
  /** Saison vor Spielbeginn (Historie 1963/64–1974/75). */
  historic: boolean;
  /** Ebene (Liga-Titel, Aufstieg). */
  tier?: number;
}

export interface TrophyFact { k: string; v: string; club?: string }

/** Pool-Ebenen (Amateurligen ohne echte Tabelle) zählen nicht als Staffelsieg. */
const POOL_TIERS = new Set([9, 109]);
const isHistoric = (s: string) => seasonStartYear(s) < 1975 && !!historicDivisions(s).length;

function shapeOf(kind: TitleKind, year: number): TrophyShape {
  switch (kind) {
    case 'meister': return 'schale';
    case 'ddr': return 'ddr';
    case 'pokal': return 'pokal';
    case 'ec': return 'henkel';
    case 'cwc': return year >= 2021 ? 'konferenz' : 'cwc';
    case 'uefa': return 'uefa';
    case 'halle': return 'halle';
    case 'uyl': return 'uyl';
    case 'super': case 'ligapokal': case 'uefasuper': return 'pokal';
    default: return 'jugend';
  }
}
function catOf(kind: TitleKind): TrophyCat {
  if (kind === 'meister' || kind === 'ddr') return 'liga';
  if (kind === 'pokal' || kind === 'super' || kind === 'ligapokal') return 'pokal';
  if (kind === 'uefasuper') return 'kontinental';
  if (kind === 'ec' || kind === 'cwc' || kind === 'uefa') return 'kontinental';
  if (kind === 'halle') return 'andere';
  return 'jugend';
}
function titleName(kind: TitleKind, season: string): string {
  const y = seasonStartYear(season);
  if (kind === 'meister') return 'Deutsche Meisterschaft';
  if (kind === 'ddr') return 'DDR-Meisterschaft';
  if (kind === 'halle') return 'Hallen-Masters';
  if (kind === 'ec' || kind === 'cwc' || kind === 'uefa') return euroCompName(kind as EuroCompId, y);
  return TITLE_DE[kind];
}

/** Alle Titel und Erfolge eines Vereins, neueste zuerst. */
export function trophiesOf(g: Game, clubId: string): TrophyEntry[] {
  const out: TrophyEntry[] = [];
  for (const t of titlesOf(g, clubId)) {
    const y = seasonStartYear(t.season);
    out.push({
      id: `${t.kind}:${t.season}`, cat: catOf(t.kind), shape: shapeOf(t.kind, y), season: t.season,
      title: titleName(t.kind, t.season), kind: t.kind, historic: isHistoric(t.season),
      tier: t.kind === 'meister' ? 1 : t.kind === 'ddr' ? 101 : undefined,
    });
  }
  // Staffelsiege unterhalb der höchsten Ebene + Aufstiege aus den Endplätzen.
  const seasons = seasonsOf(g, clubId);
  seasons.forEach((s, i) => {
    const top = s.tier === 1 || s.tier === 101;
    if (!top && !POOL_TIERS.has(s.tier) && s.pos === 1) {
      out.push({ id: `staffel:${s.season}`, cat: 'liga', shape: 'teller', season: s.season, title: `Meister ${s.league}`, kind: 'staffel', historic: isHistoric(s.season), tier: s.tier });
    }
    const next = seasons[i + 1];
    if (next && promoted(s, next) && s.pos !== 1) {
      out.push({ id: `aufstieg:${s.season}`, cat: 'andere', shape: 'aufstieg', season: s.season, title: `Aufstieg in die ${next.league}`, sub: `${s.pos}. Platz ${s.league}`, kind: 'aufstieg', historic: isHistoric(s.season), tier: s.tier });
    }
  });
  return out.sort((a, b) => b.season.localeCompare(a.season) || catRank(a) - catRank(b));
}

function promoted(a: SeasonPlacement, b: SeasonPlacement): boolean {
  if ((a.tier >= 100) !== (b.tier >= 100)) return false; // Wechsel DDR ↔ West (1991) ist kein Aufstieg
  if (POOL_TIERS.has(a.tier)) return false;
  return b.tier < a.tier && seasonStartYear(b.season) === seasonStartYear(a.season) + 1;
}
const CAT_RANK: Record<TrophyCat, number> = { liga: 0, pokal: 1, kontinental: 2, jugend: 3, andere: 4 };
/** Innerhalb einer Saison: große Titel vor Staffelsiegen (v. a. Jugend). */
const KIND_RANK: Partial<Record<TrophyEntry['kind'], number>> = {
  meister: 0, ddr: 0, staffel: 1, ec: 0, cwc: 1, uefa: 2,
  uyl: 0, jugendA: 1, jugendB: 2, jugendPokal: 3, jugendDdr: 4, jugendC: 5, jugendD: 6, jugendEReg: 7, jugendFReg: 7, jugendE: 8, jugendF: 9,
  halle: 0, aufstieg: 1, pokal: 0, ligapokal: 1, super: 2, uefasuper: 3,
};
const catRank = (e: TrophyEntry) => CAT_RANK[e.cat] * 10 + (KIND_RANK[e.kind] ?? 0);

/** Kurzbilanz je Titelname: „3× Deutsche Meisterschaft“. */
export function trophyTally(list: TrophyEntry[]): { title: string; n: number; shape: TrophyShape }[] {
  const m = new Map<string, { title: string; n: number; shape: TrophyShape; rank: number }>();
  for (const e of list) {
    const key = e.kind === 'staffel' || e.kind === 'aufstieg' ? e.kind : e.title;
    const label = e.kind === 'staffel' ? 'Staffelsieg' : e.kind === 'aufstieg' ? 'Aufstieg' : e.title;
    const x = m.get(key) ?? { title: label, n: 0, shape: e.shape, rank: catRank(e) };
    x.n++; m.set(key, x);
  }
  return [...m.values()].sort((a, b) => a.rank - b.rank || b.n - a.n).map(({ title, n, shape }) => ({ title, n, shape }));
}

// -----------------------------------------------------------------------------
// Einzelheiten der Saison
// -----------------------------------------------------------------------------
const fmtPts = (r: ArchRow) => `${r[6]} Punkte`;

function leagueRows(g: Game, season: string, clubId: string, tier: number | undefined): ArchRow[] | null {
  const a = archivedSeason(g, season);
  if (a) {
    const d = a.divisions.find((x) => x.rows.some((r) => r[0] === clubId) && (tier == null || x.tier === tier));
    if (d) return d.rows;
  }
  const h = historicDivisions(season).find((x) => x.rows.some((r) => r[0] === clubId) && (tier == null || x.tier === tier));
  return h ? h.rows : null;
}

function leagueFacts(g: Game, e: TrophyEntry, clubId: string): TrophyFact[] {
  const rows = leagueRows(g, e.season, clubId, e.tier);
  if (!rows) return [];
  const i = rows.findIndex((r) => r[0] === clubId);
  const r = rows[i];
  const facts: TrophyFact[] = [];
  facts.push({ k: 'Endstand', v: `${i + 1}. von ${rows.length} · ${fmtPts(r)}` });
  facts.push({ k: 'Bilanz', v: `${r[1]} S · ${r[2]} U · ${r[3]} N · ${r[4]}:${r[5]} Tore` });
  if (i === 0 && rows[1]) {
    const gap = r[6] - rows[1][6];
    facts.push({ k: 'Vorsprung', v: gap > 0 ? `${gap} Punkt${gap === 1 ? '' : 'e'} vor ${compClubName(g, rows[1][0], e.season)}` : `punktgleich vor ${compClubName(g, rows[1][0], e.season)}`, club: rows[1][0] });
  } else if (i > 0) {
    facts.push({ k: 'Meister', v: compClubName(g, rows[0][0], e.season), club: rows[0][0] });
  }
  return facts;
}

function finalFromArchive(g: Game, season: string, key: CupKey, clubId: string): TrophyFact[] {
  const cup = archivedSeason(g, season)?.cups[key];
  const last = cup?.rounds[cup.rounds.length - 1];
  if (!cup || !last) return [];
  const idx = last.t.findIndex((t) => t[0] === clubId || t[1] === clubId);
  if (idx < 0) return [];
  const t = last.t[idx];
  const home = t[0] === clubId;
  const opp = home ? t[1] : t[0];
  const my = home ? t[2] : t[3], their = home ? t[3] : t[2];
  const legs = last.l?.[idx];
  let score = `${my}:${their}`;
  if (t[4] === 1) score += ' n. V.';
  if (t[4] === 2 && t[6] != null) score += ` i. E. (${home ? t[6] : t[7]}:${home ? t[7] : t[6]})`;
  const facts: TrophyFact[] = [];
  if (legs && legs[2] !== 2) {
    const h1 = home ? legs[0] : legs[1], a1 = home ? legs[1] : legs[0];
    facts.push({ k: 'Finale', v: `${score} gesamt gegen ${compClubName(g, opp, season)}`, club: opp });
    facts.push({ k: 'Hin- und Rückspiel', v: `${h1}:${a1} und ${my - h1}:${their - a1}${legs[2] === 1 ? ' · Auswärtstore' : ''}` });
  } else {
    facts.push({ k: 'Finale', v: `${score} gegen ${compClubName(g, opp, season)}`, club: opp });
  }
  const wins = cup.rounds.reduce((n, rd) => n + (rd.t.some((x) => (x[0] === clubId || x[1] === clubId) && x[5] === clubId) ? 1 : 0), 0);
  if (wins > 1) facts.push({ k: 'Weg zum Titel', v: `${wins} K.-o.-Runden gewonnen` });
  return facts;
}

function finalFromHistory(g: Game, f: HistFinal, season: string): TrophyFact[] {
  const facts: TrophyFact[] = [{ k: 'Finale', v: `${f.score} gegen ${compClubName(g, f.runnerUp, season)}`, club: f.runnerUp }];
  if (f.venue) facts.push({ k: 'Spielort', v: f.venue });
  if (f.note) facts.push({ k: 'Hinweis', v: f.note });
  return facts;
}

function topScorer(g: Game, season: string, statKey: string | 'league', clubId: string): TrophyFact | null {
  const a = archivedSeason(g, season);
  if (a) {
    const key = statKey === 'league' ? a.playerDiv : statKey;
    const list = a.stats[key]?.goals ?? [];
    const best = list.find(([pid]) => a.people[pid]?.[1] === clubId);
    if (best && best[1] > 0) return { k: 'Torjäger', v: `${a.people[best[0]][0]} · ${best[1]} Tor${best[1] === 1 ? '' : 'e'}` };
    return null;
  }
  if (statKey === 'league') {
    const ts = HIST_TOP_SCORERS[season];
    if (ts && ts.clubs.includes(clubId)) return { k: 'Torschützenkönig', v: `aus den eigenen Reihen · ${ts.goals} Tore` };
  }
  return null;
}

/** Trainer zur Saison: du beim eigenen Verein (gespielte Saisons), sonst Trainerhistorie der KI. */
function coachAt(g: Game, season: string, clubId: string): string | null {
  if (!archivedSeason(g, season) && season !== g.season) return null;
  if (clubId === g.managedClubId) return g.manager?.name ?? null;
  const club = g.clubs[clubId];
  if (!club) return null;
  const end = `${seasonStartYear(season) + 1}-05-31`;
  const past = (club.coachHistory ?? []).find((h) => h.from <= end && h.to >= end);
  if (past) return past.name;
  if (club.coach && club.coach.since <= end) return club.coach.name;
  return null;
}

function hallFacts(g: Game, season: string, clubId: string): TrophyFact[] {
  const year = seasonStartYear(season) + 1;
  const h = indoorState(g).history.find((x) => x.year === year && x.mastersWinner === clubId);
  if (!h) return [];
  const facts: TrophyFact[] = [];
  if (h.mastersRunnerUp) facts.push({ k: 'Finale', v: `${h.mastersScore ?? ''} gegen ${compClubName(g, h.mastersRunnerUp, season)}`.trim(), club: h.mastersRunnerUp });
  if (h.city) facts.push({ k: 'Austragungsort', v: h.city });
  facts.push({ k: 'Winter', v: `Januar ${year}` });
  return facts;
}

const CUP_KEY: Partial<Record<TitleKind, CupKey>> = { pokal: 'cup', ec: 'ec', cwc: 'cwc', uefa: 'uefa' };

/** Eckdaten zur gewählten Trophäe (nur, was gespeichert ist). */
export function trophyFacts(g: Game, e: TrophyEntry, clubId: string): TrophyFact[] {
  const facts: TrophyFact[] = [];
  if (e.kind === 'meister' || e.kind === 'ddr' || e.kind === 'staffel' || e.kind === 'aufstieg') {
    facts.push(...leagueFacts(g, e, clubId));
    const ts = topScorer(g, e.season, 'league', clubId);
    if (ts) facts.push(ts);
  } else if (CUP_KEY[e.kind]) {
    const key = CUP_KEY[e.kind]!;
    if (archivedSeason(g, e.season)) facts.push(...finalFromArchive(g, e.season, key, clubId));
    else {
      const f = historicFinal(e.season, key);
      if (f && f.winner === clubId) facts.push(...finalFromHistory(g, f, e.season));
    }
    const ts = topScorer(g, e.season, key, clubId);
    if (ts) facts.push(ts);
  } else if (e.kind === 'halle') {
    facts.push(...hallFacts(g, e.season, clubId));
  } else if (e.kind === 'super' || e.kind === 'ligapokal' || e.kind === 'uefasuper') {
    const a = superCupArchiveFor(g, e.season, e.kind === 'uefasuper' ? 'Europa' : homeCountryKey(g), clubId);
    if (a) facts.push({ k: 'Finale', v: `${a.score} gegen ${compClubName(g, a.winner === clubId ? a.runnerUp : a.winner, e.season)}${a.shared ? ' (geteilt)' : ''}` });
  }
  const coach = coachAt(g, e.season, clubId);
  if (coach) facts.push({ k: 'Trainer', v: coach });
  return facts;
}
