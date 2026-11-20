// =============================================================================
// LÄNDERPROFIL (Wunsch Pascal: Klick auf eine Flagge öffnet eine Übersicht des Landes)
// -----------------------------------------------------------------------------
// Nur Anzeigedaten, nichts wird gespeichert. Ein Land wird über den Flaggen-Schlüssel
// aus data/countryFlags.ts angesprochen („Deutschland“, „Oesterreich“, „Brasilien“ …).
// Daraus ergeben sich:
//   - Weltdaten-Land (data/world/countries.ts: Code, Bestehen, Nachfolger),
//   - Nationalmannschaft (data/nationalTeams.ts über das Kürzel GER/AUT/BRA …),
//   - Ligen im Spiel: Heimatland (volle Daten), DDR (Heimat Deutschland, volle Daten)
//     oder Hintergrund-Land (engine/world.ts + game/worldLeagues.ts), sonst keine.
// Oberfläche: components/country/ (CountryModal.tsx + Reiter).
// =============================================================================
import { leagueName } from '../data/leagueNames';
import { countryInfo } from '../data/countryFlags';
import { CT_BY_KEY } from '../data/world/continents';
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, countryExists, type WorldCountryDef } from '../data/world/countries';
import { worldSeason, worldYears } from '../data/world/index';
import { seasonLabelOf } from '../data/world/countries';
import { NATION_BY_CODE, baseStrength, confOf, nationExists, type Conf, type NationDef } from '../data/nationalTeams';
import { repTargetAt } from '../data/leagueReputation';
import { accessSlots, euroCompName } from '../data/euroFormats';
import { seasonStartYear } from '../data/timeline';
import { coefSum, countryRanking, germanRank } from '../engine/world';
import { leagueArchive } from './leagueArchive';
import { leagueRepInfo, leagueRepLabel } from './leagueRepGame';
import { homeCountryOf, type Game } from './state';
import { countryOptions, countrySeasons, countrySnapshot, pickSeason, statsCountries, type StatsCountry } from './competitionCountry';
import type { CompSnapshot } from './competitionView';
import { candidatesByNation, allStrengths, nationFor, type Cand } from './national/pool';
import { currentSquad, nationalState } from './national/nationalGame';
import { worldEntry, WP_FIELD } from './worldPool';
import type { PyrClub, PyrSystem, PyramidData } from './leaguePyramid';

/** `continent` = Land der Hintergrund-Kontinente (game/continents.ts): nur Meister/Kontinentalpokal je Saison. */
export type CountryKind = 'home' | 'ddr' | 'world' | 'continent' | 'none';

export interface CountryRef {
  /** Flaggen-Schlüssel (data/countryFlags.ts). */
  key: string;
  name: string;
  /** Nationalitäts-/Verbandskürzel (GER, AUT …). */
  code: string;
  cc?: string;
  def?: WorldCountryDef;
  nation?: NationDef;
  kind: CountryKind;
}

const CONF_LABEL: Record<Conf, string> = {
  UEFA: 'Europa', CONMEBOL: 'Südamerika', CAF: 'Afrika', AFC: 'Asien', CONCACAF: 'Nord- und Mittelamerika', OFC: 'Ozeanien',
};
export const confLabel = (c: Conf) => CONF_LABEL[c];

const yearOf = (g: Game) => seasonStartYear(g.season);

/** Land zum Flaggen-Schlüssel (unbekannte Schlüssel: nur Name/Kürzel). */
export function countryRef(g: Game, key: string): CountryRef {
  const info = countryInfo(key);
  const def = COUNTRY_BY_KEY[key];
  const home = homeCountryOf(g);
  const nation = NATION_BY_CODE[info.code];
  let kind: CountryKind = 'none';
  if (def?.cc === home) kind = 'home';
  else if (def?.cc === 'gdr' && home === 'ger') kind = 'ddr';
  else if (g.world?.countries[key]) kind = 'world';
  else if (CT_BY_KEY[key]) kind = 'continent';
  return { key, name: def?.name ?? info.name, code: info.code, cc: def?.cc, def, nation, kind };
}

/** Eintrag der Länderwahl unter Statistiken › Liga (für Tabellen und den Sprung dorthin). */
export function statsCountryOf(g: Game, ref: CountryRef): StatsCountry | null {
  if (ref.kind === 'none') return null;
  return statsCountries(g).find((c) => (ref.kind === 'world' ? c.worldKey === ref.key : c.cc === ref.cc)) ?? null;
}

// -----------------------------------------------------------------------------
// Steckbrief
// -----------------------------------------------------------------------------
export interface CountryFacts { conf: string | null; exists: string; ligen: string; predecessor?: string; successors?: string[] }

export function countryFacts(g: Game, ref: CountryRef): CountryFacts {
  const y = yearOf(g);
  const d = ref.def;
  const n = ref.nation;
  let exists = 'besteht';
  const from = d?.successorOf ? d.from : n?.from;
  const to = d?.to ?? n?.to;
  if (to != null && y > to) exists = `bis ${to + 1}`;
  else if (from != null && y < from) exists = `erst ab ${from}`;
  else if (from != null) exists = `seit ${from}`;
  else if (to != null) exists = `bis ${to + 1}`;
  const ligen = ref.kind === 'home' ? 'Heimatland – alle Ligen mit vollen Kadern'
    : ref.kind === 'ddr' ? (g.leagues?.otherDivisions.some((x) => x.id.startsWith('ddr-')) ? 'Oberliga und Liga laufen mit deinem Spielstand' : 'aufgegangen in der gesamtdeutschen Pyramide')
      : ref.kind === 'world' ? (g.world?.countries[ref.key]?.active ? `${leagueName(ref.cc, 1)} und ${leagueName(ref.cc, 2)} Spieltag für Spieltag` : 'keine Ligen mehr (Archiv)')
        : ref.kind === 'continent' ? 'Hintergrund: Meister und Kontinentalpokal je Saison (nicht spielbar)'
        : 'keine Liga im Spiel – nur Nationalmannschaft';
  return {
    conf: n ? CONF_LABEL[confOf(n, y)] : d ? 'Europa' : null,
    exists, ligen,
    predecessor: d?.successorOf ? COUNTRY_BY_CC[d.successorOf]?.name : undefined,
    successors: d?.successors?.map((cc) => COUNTRY_BY_CC[cc]?.name ?? cc),
  };
}

/** Gibt es das Land in der laufenden Saison? */
export function countryAlive(g: Game, ref: CountryRef): boolean {
  const y = yearOf(g);
  if (ref.def) return countryExists(ref.def, y);
  return ref.nation ? nationExists(ref.nation, y) : true;
}

// -----------------------------------------------------------------------------
// Ligaruf international
// -----------------------------------------------------------------------------
export interface CountryRep {
  /** Ligaruf 0–100 (Option „Entwicklung der Ligen“) bzw. historischer Richtwert. */
  rep: number;
  /** Historischer Wert um diese Zeit. */
  hist: number;
  delta: number | null;
  /** true = Ruf wird gesteuert (Hintergrund-Land mit Option), false = Richtwert. */
  live: boolean;
  mode: string;
  rank: number | null;
  of: number;
  coef: number | null;
  slots: { label: string; n: number }[];
}

export function countryRep(g: Game, ref: CountryRef): CountryRep | null {
  if (ref.kind === 'none' || ref.kind === 'continent' || !countryAlive(g, ref)) return null;
  const y = yearOf(g);
  const w = g.world;
  const info = ref.kind === 'world' ? leagueRepInfo(g, ref.key, y) : null;
  const hist = repTargetAt(ref.key, y);
  let rank: number | null = null, coef: number | null = null, of = 0;
  if (w) {
    const list = countryRanking(w, y);
    of = list.length + (w.countries[ref.key] ? 0 : 1);
    if (ref.kind === 'home') { rank = germanRank(w, y); coef = coefSum(w.germanCoef); }
    else if (ref.kind === 'world') {
      const i = list.findIndex((c) => c.name === ref.key);
      if (i >= 0) {
        coef = coefSum(list[i].coef);
        rank = 1 + list.filter((c) => coefSum(c.coef) > coef!).length + (coefSum(w.germanCoef) > coef ? 1 : 0);
        of = list.length + 1;
      }
    }
  }
  const slots: CountryRep['slots'] = [];
  if (rank != null) {
    const s = accessSlots(y, rank);
    slots.push({ label: euroCompName('ec', y), n: s.ec });
    slots.push({ label: euroCompName('uefa', y), n: s.uefa });
    if (s.cwc) slots.push({ label: euroCompName('cwc', y), n: s.cwc });
  }
  return {
    rep: info?.rep ?? hist, hist, delta: info?.delta ?? null, live: !!info,
    mode: leagueRepLabel(g.leagueRepMode), rank, of, coef: coef == null ? null : Math.round(coef * 10) / 10, slots,
  };
}

// -----------------------------------------------------------------------------
// Nationalmannschaft
// -----------------------------------------------------------------------------
export interface NationInfo {
  code: string;
  exists: boolean;
  strength: number | null;
  rank: number | null;
  of: number;
  decades: { year: number; v: number; now: boolean }[];
  titles: { wm: number[]; em: number[]; wmFinals: number[]; emFinals: number[] };
  /** Ergebnis beim laufenden/letzten Turnier („Halbfinale“ …). */
  current?: { label: string; result: string };
}

export function nationInfo(g: Game, ref: CountryRef): NationInfo | null {
  const n = ref.nation;
  if (!n) return null;
  const y = yearOf(g);
  const code = ref.code;
  const all = allStrengths(g);
  const sorted = [...all.entries()].sort((a, b) => b[1] - a[1]);
  const i = sorted.findIndex(([c]) => c === code);
  // Nur Jahrzehnte, in denen es die Nation gab (DDR bis 1990, Kroatien ab 1992 …).
  const decades = [1975, 1985, 1995, 2005, 2015, 2025]
    .filter((yy) => (n.to == null || n.to >= yy - 5) && (n.from == null || n.from <= yy + 4))
    .map((yy) => ({ year: yy, v: Math.round(baseStrength(n, yy)), now: y >= yy - 5 && y < yy + 5 }));
  const st = nationalState(g);
  const titles = { wm: [] as number[], em: [] as number[], wmFinals: [] as number[], emFinals: [] as number[] };
  for (const a of st.archive) {
    if (a.winner === code) (a.kind === 'WM' ? titles.wm : titles.em).push(a.year);
    else if (a.runnerUp === code) (a.kind === 'WM' ? titles.wmFinals : titles.emFinals).push(a.year);
  }
  const t = st.tourn;
  const current = t && g.calendar.currentDate >= t.nominate && t.teams.includes(code)
    ? { label: `${t.kind} ${t.year}`, result: g.calendar.currentDate > t.end ? t.result[code] ?? 'Teilnehmer' : 'qualifiziert' } : undefined;
  return {
    code, exists: nationExists(n, y), strength: i >= 0 ? sorted[i][1] : null, rank: i >= 0 ? i + 1 : null, of: sorted.length,
    decades, titles, current,
  };
}

/** Spieler (voll oder Weltspieler) mit Gesicht/Alter/Länderspielen für Listen. */
export interface NatPlayer extends Cand { face?: string; born?: number; caps: number | null; goals: number | null }

function enrich(g: Game, c: Cand): NatPlayer {
  const p = g.players[c.id];
  if (p) return { ...c, face: p.face, born: parseInt(p.dateOfBirth.slice(0, 4), 10), caps: p.intl?.caps ?? 0, goals: p.intl?.goals ?? 0 };
  const w = worldEntry(g, c.id);
  return { ...c, face: w?.[WP_FIELD.face], born: w?.[WP_FIELD.born], caps: null, goals: null };
}

/** Beste Spieler des Landes nach Nationalität (volle Spieler + Weltspieler). */
export function bestPlayers(g: Game, ref: CountryRef, n = 8): NatPlayer[] {
  const code = nationFor(ref.code, yearOf(g));
  if (!code || code !== ref.code) return [];
  return (candidatesByNation(g).get(code) ?? []).slice(0, n).map((c) => enrich(g, c));
}

/** Aktuelles Aufgebot (bzw. Vorschlag) mit Gesichtern und Länderspielen; Torhüter zuerst. */
export function nationSquad(g: Game, ref: CountryRef): NatPlayer[] {
  const code = nationFor(ref.code, yearOf(g));
  if (!code || code !== ref.code || !ref.nation) return [];
  const byId = new Map((candidatesByNation(g).get(code) ?? []).map((c) => [c.id, c]));
  return currentSquad(g, code).map((s) => enrich(g, byId.get(s.id) ?? { ...s, nat: code, pos: s.pos as Cand['pos'], age: 0 }))
    .map((p) => (p.age ? p : { ...p, age: p.born ? yearOf(g) - p.born : 0 }))
    .sort((a, b) => (a.pos === 'TW' ? 0 : 1) - (b.pos === 'TW' ? 0 : 1) || b.ov - a.ov);
}

/** Nächste Kandidaten außerhalb des Aufgebots. */
export function nextCandidates(g: Game, ref: CountryRef, squad: NatPlayer[], n = 10): NatPlayer[] {
  const code = nationFor(ref.code, yearOf(g));
  if (!code || code !== ref.code) return [];
  const inSq = new Set(squad.map((s) => s.id));
  return (candidatesByNation(g).get(code) ?? []).filter((c) => !inSq.has(c.id)).slice(0, n).map((c) => enrich(g, c));
}

// -----------------------------------------------------------------------------
// Meister & Pokalsieger
// -----------------------------------------------------------------------------
export interface Holder { season: string; champ?: string; cup?: string; before?: boolean }

const mapId = (g: Game, id: string) => (g.clubs[id] || g.simClubs[id] ? id : `w_${id}`);

/** Meister und Pokalsieger je Saison, neueste zuerst (Weltdaten vor dem Start, danach Archiv/Welt-Historie). */
export function countryHolders(g: Game, ref: CountryRef): Holder[] {
  const out = new Map<string, Holder>();
  const put = (season: string, h: Partial<Holder>) => out.set(season, { ...out.get(season), season, ...Object.fromEntries(Object.entries(h).filter(([, v]) => v != null)) });
  const sy = g.startYear ?? 1975;
  if (ref.cc) for (const y of worldYears(ref.cc)) {
    if (y >= sy) continue;
    const row = worldSeason(ref.cc, y);
    if (row) put(seasonLabelOf(y), { champ: row.t1[0] ? mapId(g, row.t1[0]) : undefined, cup: row.cup ? mapId(g, row.cup) : undefined, before: true });
  }
  if (ref.kind === 'home' || ref.kind === 'ddr') {
    const tier = ref.kind === 'home' ? 1 : 101;
    for (const a of leagueArchive(g)?.seasons ?? []) {
      const d = a.divisions.find((x) => x.tier === tier);
      put(a.season, { champ: d?.rows[0]?.[0], cup: ref.kind === 'home' ? a.cups.cup?.winner ?? undefined : undefined, before: false });
    }
  }
  for (const rec of g.world?.history ?? []) {
    const c = rec.champions[ref.key], p = rec.cupWinners[ref.key];
    if (c || p) put(rec.season, { champ: c, cup: p, before: false });
  }
  return [...out.values()].filter((h) => h.champ || h.cup).sort((a, b) => b.season.localeCompare(a.season));
}

/** Meistertitel je Verein (aus den Meisterlisten), meiste zuerst. */
export function titleCounts(list: Holder[]): { clubId: string; champ: number; cup: number }[] {
  const m = new Map<string, { clubId: string; champ: number; cup: number }>();
  for (const h of list) {
    if (h.champ) { const e = m.get(h.champ) ?? { clubId: h.champ, champ: 0, cup: 0 }; e.champ++; m.set(h.champ, e); }
    if (h.cup) { const e = m.get(h.cup) ?? { clubId: h.cup, champ: 0, cup: 0 }; e.cup++; m.set(h.cup, e); }
  }
  return [...m.values()].sort((a, b) => b.champ - a.champ || b.cup - a.cup || a.clubId.localeCompare(b.clubId));
}

// -----------------------------------------------------------------------------
// Ligen (Tabellen der laufenden bzw. letzten Saison)
// -----------------------------------------------------------------------------
export interface CountryLeagues { country: StatsCountry; season: string; snaps: CompSnapshot[]; preset: string; /** Weitere Staffeln der 2. Ebene (nicht als Tabelle gezeigt), z. B. „2. Liga Süd“. */ moreGroups: string[] }

export function countryLeagues(g: Game, ref: CountryRef): CountryLeagues | null {
  const c = statsCountryOf(g, ref);
  if (!c) return null;
  const seasons = countrySeasons(g, c);
  if (!seasons.length) return null;
  const season = pickSeason(seasons, g.season);
  const src = seasons.find((s) => s.season === season)?.source ?? 'live';
  const leagues = countryOptions(g, c, season, src).filter((o) => o.kind === 'league' && o.section !== 'Europa');
  // Heimatland: 1. Liga und die Liga des eigenen Vereins (falls tiefer), sonst die ersten beiden.
  let pick = leagues.slice(0, 2);
  if (c.mode === 'home') {
    const own = leagues.find((o) => o.key === g.leagues.playerDivision.id);
    if (own && !pick.includes(own)) pick = [leagues[0], own];
  }
  const snaps = pick.map((o) => countrySnapshot(g, c, season, src, o.key)).filter((s): s is CompSnapshot => !!s && !!s.table?.length);
  const preset = c.mode === 'world' ? `w:${c.worldKey}` : pick[0]?.key ?? '';
  const shown = new Set(pick.map((o) => o.key));
  const moreGroups = leagues.filter((o) => o.tier === 2 && !shown.has(o.key) && c.mode === 'world').map((o) => o.label);
  return { country: c, season, snaps, preset, moreGroups };
}

// -----------------------------------------------------------------------------
// Ligensystem (Pyramide) und beste Vereine
// -----------------------------------------------------------------------------
export function countrySystem(ref: CountryRef, data: PyramidData): { side: 'west' | 'ddr' | 'abroad'; sys: PyrSystem } | null {
  if (ref.kind === 'home') return { side: 'west', sys: data.west };
  if (ref.kind === 'ddr') return { side: 'ddr', sys: data.ddr };
  const a = data.abroad.find((x) => x.key === ref.key);
  return a ? { side: 'abroad', sys: a } : null;
}

/** Stärkste Vereine der obersten Liga (aus der Pyramide, ohne Unterbau). */
export function bestClubs(sys: PyrSystem | undefined, n = 8): PyrClub[] {
  const top = sys?.levels[0]?.flatMap((d) => (d.pool ? [] : d.clubs)) ?? [];
  return [...top].sort((a, b) => b.strength - a.strength).slice(0, n);
}
