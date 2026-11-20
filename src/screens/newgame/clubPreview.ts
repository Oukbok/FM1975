import { historicTiers } from '../../data/leagueTiers';
// =============================================================================
// Vorschau-Daten für die Vereinswahl (vor dem Erzeugen des Spiels)
// -----------------------------------------------------------------------------
// Alles wird aus den Stammdaten (Seeds) abgeleitet – genau so, wie das Spiel
// die Vereine beim Start aufbaut (generate.ts / buildProClub). Kaderstärke ist
// eine Einschätzung aus Ansehen bzw. Stärke, die echten Kader entstehen erst
// beim Start.
// =============================================================================
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../../data/generate';
import { lowerTierLevel } from '../../data/lowerTiers';
import { lowerTierPlan, type LowerDivPlan } from '../../game/lowerTierStart';
import type { SimClub } from '../../engine/leagues';
import { activeDatasetId, datasetKits } from '../../data/dataset/apply';
import { composeHome, type ComposedHome } from '../../game/worldCompose';
import { ddrStartSeeds } from '../../game/ddrHome';
import { DDR_LIGA_ID, DDR_OBERLIGA_ID } from '../../data/ddr';
import { regionOf, sameRegion, seasonExpectation } from '../../engine/environment';
import { Club } from '../../types';
import { structureForSeason } from '../../data/reforms';
import { seasonLabelOf } from '../../data/world/countries';

/** Liga im Assistenten: 1./2. Liga oder die ID einer unteren Liga (z. B. „tier3“, „tier4-nord“). */
export type LeagueKey = 'tier1' | 'nord' | 'sued' | 'tier2' | (string & {});

export const LEAGUES: { key: LeagueKey; name: string; tier: number; note: string }[] = [
  { key: 'tier1', name: '1. Liga', tier: 1, note: 'Die höchste Spielklasse. Klassischer Start mit großen Erwartungen.' },
  { key: 'nord', name: '2. Liga Nord', tier: 2, note: 'Der lange Weg nach oben: kleines Budget, kleine Stadien.' },
  { key: 'sued', name: '2. Liga Süd', tier: 2, note: 'Der lange Weg nach oben: kleines Budget, kleine Stadien.' },
];

export interface ClubPreview {
  id: string; name: string; shortName: string; city: string; founded?: number;
  primary: string; secondary: string;
  stadium: string; capacity: number;
  /** Ansehen 0–100 (wie im Spiel). */
  reputation: number;
  /** Stärke-Einschätzung (für Rang/Meter). */
  strength: number;
  rank: number; size: number; tier: number;
  expectation: string;
  role: 'Favorit' | 'Spitzengruppe' | 'Mittelfeld' | 'Abstiegskampf';
  /** Finanzkraft in halben Sternen 0,5–5, im Vergleich mit allen Vereinen des Landes (alle Ligen). */
  finance: number;
  region: string;
  rivals: string[];
  /** Pseudo-Verein für Wappen/Trikot-Anzeige. */
  club: Club;
}

function pseudoClub(id: string, name: string, shortName: string, city: string, primary: string, secondary: string, reputation: number): Club {
  const kits = datasetKits(id);
  return {
    id, name, shortName, city, colors: { primary, secondary }, reputation,
    ...(kits?.home && kits?.away ? { kits: { home: kits.home, away: kits.away } } : {}),
  } as unknown as Club;
}

type Raw = Omit<ClubPreview, 'rank' | 'size' | 'expectation' | 'role' | 'finance' | 'rivals'>;

const compCache = new Map<string, ComposedHome | null>();
/** Zusammensetzung des Landes im Jahr (null = Deutschland 1975 aus den Seeds). */
function compOf(cc: string, year: number): ComposedHome | null {
  const k = `${activeDatasetId()}|${cc}|${year}`;
  if (!compCache.has(k)) compCache.set(k, composeHome(cc, year));
  return compCache.get(k) ?? null;
}

const planCache = new Map<string, LowerDivPlan[]>();
/** Besetzung der Ligen ab der 3. Ebene beim Start (game/lowerTierStart.ts) – gleiche Rechnung wie im Spiel. */
function planOf(cc: string, year: number): LowerDivPlan[] {
  const k = `${activeDatasetId()}|${cc}|${year}`;
  if (!planCache.has(k)) planCache.set(k, lowerTierPlan(cc, year));
  return planCache.get(k)!;
}

/** Wählbare Ligen eines Landes im Startjahr (Weltdaten; sonst die drei Ligen von 1975) –
 *  in Deutschland auch die Ligen ab der 3. Ebene (3. Liga, Regionalligen, NOFV-Oberliga), in den
 *  stärksten Auslandsligen die 3./4. Ebene (game/homeDeep.ts, Tiefe nach Länderrang). */
export function leaguesFor(cc = 'ger', year = 1975): { key: LeagueKey; name: string; tier: number; note: string }[] {
  if (cc === 'gdr') return [
    { key: DDR_OBERLIGA_ID, name: 'DDR-Oberliga', tier: 1, note: 'Die höchste Spielklasse der DDR. Bis 1991 eigener Weg – danach geht es in den gesamtdeutschen Fußball.' },
    { key: DDR_LIGA_ID, name: 'DDR-Liga', tier: 2, note: 'Unterbau der Oberliga (im Spiel eine Staffel der Stärksten). Zwei Aufsteiger je Saison.' },
  ];
  const comp = compOf(cc, year);
  if (!comp) return LEAGUES;
  const note2 = 'Der lange Weg nach oben: kleines Budget, kleine Stadien.';
  const note3 = 'Ganz unten im Profifußball: winzige Stadien, kaum Geld – und ein weiter Weg in die 1. Liga.';
  return [
    LEAGUES[0],
    ...comp.second.map((s) => ({ key: (s.group ?? 'tier2') as LeagueKey, name: s.name, tier: 2, note: note2 })),
    ...planOf(cc, year).filter((d) => d.clubs.length).map((d) => ({ key: d.meta.id as LeagueKey, name: d.meta.name, tier: d.meta.tier, note: note3 })),
  ];
}

/**
 * Ebenen unterhalb der wählbaren Ligen (nur Anzeige im Assistenten): die Amateurligen (Vereins-Pool
 * ohne Spielbetrieb). Die Ligen ab der 3. Ebene laut Ligastruktur des Startjahres (data/reforms.ts)
 * sind wählbar (leaguesFor) – der gewählte Verein und seine Liga bekommen beim Start volle Kader.
 */
export interface BackgroundLevel { tier: number; name: string; staffeln: number; clubs: number | null; teams?: number | null }
export function backgroundLevels(cc = 'ger', year = 1975): BackgroundLevel[] {
  if (cc === 'gdr') return [{ tier: 3, name: 'Bezirksligen', staffeln: 15, clubs: null }];
  // Ausland (Wunsch Pascal): Ebene 3/4 der stärksten Ligen sind wählbar (game/homeDeep.ts); darunter nur Anzeige –
  // die historischen Ebenen ohne Spielbetrieb im Spiel (data/leagueTiers.ts) und der Unterbau.
  if (cc !== 'ger') {
    const deepest = planOf(cc, year).reduce((a, d) => Math.max(a, d.meta.tier), 2);
    const rows = (historicTiers(cc, year) ?? []).slice(deepest, 4).map((r, i) => ({ tier: deepest + i + 1, name: r.name, staffeln: r.groups, clubs: null, teams: r.teams }));
    return [...rows, { tier: deepest + rows.length + 1, name: 'Unterbau', staffeln: 0, clubs: null }];
  }
  const lower = structureForSeason(seasonLabelOf(year)).filter((t) => t.tier >= 3);
  const deepest = lower.reduce((a, t) => Math.max(a, t.tier), 2);
  return [{ tier: deepest + 1, name: 'Amateurligen', staffeln: 0, clubs: null }];
}

function seedRaw(s: { id: string; name: string; shortName: string; city: string; founded?: number; primary: string; secondary: string; stadium: string; capacity: number; reputation: number }): Raw {
  return {
    id: s.id, name: s.name, shortName: s.shortName, city: s.city, founded: s.founded, primary: s.primary, secondary: s.secondary,
    stadium: s.stadium, capacity: s.capacity, reputation: s.reputation, strength: s.reputation, tier: 1, region: regionOf(s.city),
    club: pseudoClub(s.id, s.name, s.shortName, s.city, s.primary, s.secondary, s.reputation),
  };
}
function secondRaw(s: { id: string; name: string; shortName: string; city: string; primary: string; secondary: string; strength: number }): Raw {
  const rep = Math.max(40, Math.min(80, Math.round(s.strength - 6)));
  return {
    id: s.id, name: s.name, shortName: s.shortName, city: s.city, primary: s.primary, secondary: s.secondary,
    stadium: `Stadion ${s.city}`, capacity: 12000 + Math.max(0, Math.round((s.strength - 50) * 1100)),
    reputation: rep, strength: s.strength, tier: 2, region: regionOf(s.city),
    club: pseudoClub(s.id, s.name, s.shortName, s.city, s.primary, s.secondary, rep),
  };
}

/** DDR-Verein (game/ddrHome.ts): Ansehen/Stadion wie beim Spielstart über buildProClub (Stärke − 6). */
function ddrRaw(s: SimClub): Raw {
  return secondRaw({ id: s.id, name: s.name, shortName: s.shortName, city: s.city, primary: s.colors.primary, secondary: s.colors.secondary, strength: s.strength });
}

function lowerRaw(s: SimClub, tier: number): Raw {
  const lv = lowerTierLevel(s.strength, tier);
  return {
    id: s.id, name: s.name, shortName: s.shortName, city: s.city, primary: s.colors.primary, secondary: s.colors.secondary,
    stadium: `Stadion ${s.city}`, capacity: lv.capacity, reputation: lv.reputation, strength: s.strength, tier, region: regionOf(s.city),
    club: pseudoClub(s.id, s.name, s.shortName, s.city, s.colors.primary, s.colors.secondary, lv.reputation),
  };
}

/** Alle Vereine einer wählbaren Liga. */
function rawLeague(key: LeagueKey, cc = 'ger', year = 1975): Raw[] {
  if (cc === 'gdr') {
    const s = ddrStartSeeds(year);
    const ober = key === DDR_OBERLIGA_ID;
    return (ober ? s.ober : key === DDR_LIGA_ID ? s.liga : []).map((c) => ({ ...ddrRaw(c), tier: ober ? 1 : 2 }));
  }
  const comp = compOf(cc, year);
  const low = comp ? planOf(cc, year).find((d) => d.meta.id === key) : undefined;
  if (low) return low.clubs.map((c) => lowerRaw(c, low.meta.tier));
  if (comp) {
    if (key === 'tier1') return comp.tier1.map(seedRaw);
    const grp = key === 'tier2' ? null : key;
    return (comp.second.find((x) => x.group === grp)?.clubs ?? []).map(secondRaw);
  }
  if (key === 'tier1') return CLUB_SEEDS.map(seedRaw);
  if (key === 'tier2') return [];
  return (key === 'nord' ? SECOND_LIGA_NORD_SEEDS : SECOND_LIGA_SUED_SEEDS).map(secondRaw);
}

export function leaguePreview(key: LeagueKey, cc = 'ger', year = 1975): ClubPreview[] {
  const base = rawLeague(key, cc, year);
  const everyone = leaguesFor(cc, year).flatMap((l) => rawLeague(l.key, cc, year));
  const sorted = [...base].sort((a, b) => b.strength - a.strength);
  const size = base.length;
  const allReps = everyone.map((c) => c.reputation), allCaps = everyone.map((c) => c.capacity);
  return base.map((c) => {
    const rank = sorted.findIndex((x) => x.id === c.id) + 1;
    const share = rank / size;
    const role: ClubPreview['role'] = rank <= 2 ? 'Favorit' : share <= 0.3 ? 'Spitzengruppe' : share <= 0.75 ? 'Mittelfeld' : 'Abstiegskampf';
    // Finanzkraft (Wunsch Pascal: kein Zweitligist mit fünf Sternen): Ansehen und Stadiongröße im Vergleich
    // mit ALLEN Vereinen des Landes, dazu ein Abschlag je Ligaebene; halbe Sterne.
    const repPct = allReps.filter((r) => r < c.reputation).length / Math.max(1, allReps.length - 1);
    const capPct = allCaps.filter((x) => x < c.capacity).length / Math.max(1, allCaps.length - 1);
    const fin = Math.round(2 * (0.5 + 4.5 * (0.6 * repPct + 0.4 * capPct) - 0.5 * Math.max(0, (c.tier ?? 1) - 1))) / 2;
    const rivals = everyone
      .filter((o) => o.id !== c.id && (cc === 'ger' || cc === 'gdr' ? sameRegion(o.city, c.city) : o.city === c.city))
      .sort((a, b) => Number(b.city === c.city) - Number(a.city === c.city) || b.reputation - a.reputation)
      .slice(0, 3).map((o) => o.name);
    return {
      ...c, rank, size,
      ...(cc === 'ger' || cc === 'gdr' ? {} : { region: c.city }),
      expectation: seasonExpectation(rank, size, c.tier),
      role, finance: Math.max(0.5, Math.min(5, fin)), rivals,
    };
  });
}

export type SortKey = 'reputation' | 'name' | 'region';
export function sortClubs(list: ClubPreview[], by: SortKey): ClubPreview[] {
  const l = [...list];
  if (by === 'name') l.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  else if (by === 'region') l.sort((a, b) => a.region.localeCompare(b.region, 'de') || b.strength - a.strength);
  else l.sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name, 'de'));
  return l;
}
