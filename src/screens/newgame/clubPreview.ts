// =============================================================================
// Vorschau-Daten für die Vereinswahl (vor dem Erzeugen des Spiels)
// -----------------------------------------------------------------------------
// Alles wird aus den Stammdaten (Seeds) abgeleitet – genau so, wie das Spiel
// die Vereine beim Start aufbaut (generate.ts / buildProClub). Kaderstärke ist
// eine Einschätzung aus Ansehen bzw. Stärke, die echten Kader entstehen erst
// beim Start.
// =============================================================================
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../../data/generate';
import { datasetKits } from '../../data/dataset/apply';
import { regionOf, sameRegion, seasonExpectation } from '../../engine/environment';
import { Club } from '../../types';

export type LeagueKey = 'tier1' | 'nord' | 'sued';

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
  finance: 1 | 2 | 3 | 4 | 5;
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

/** Alle Vereine aller wählbaren Ligen (für Rivalen über Ligagrenzen hinweg). */
function rawLeague(key: LeagueKey): Omit<ClubPreview, 'rank' | 'size' | 'expectation' | 'role' | 'finance' | 'rivals'>[] {
  if (key === 'tier1') {
    return CLUB_SEEDS.map((s) => ({
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, founded: s.founded, primary: s.primary, secondary: s.secondary,
      stadium: s.stadium, capacity: s.capacity, reputation: s.reputation, strength: s.reputation, tier: 1, region: regionOf(s.city),
      club: pseudoClub(s.id, s.name, s.shortName, s.city, s.primary, s.secondary, s.reputation),
    }));
  }
  const list = key === 'nord' ? SECOND_LIGA_NORD_SEEDS : SECOND_LIGA_SUED_SEEDS;
  return list.map((s) => {
    const rep = Math.max(40, Math.min(80, Math.round(s.strength - 6)));
    return {
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, primary: s.primary, secondary: s.secondary,
      stadium: `Stadion ${s.city}`, capacity: 12000 + Math.max(0, Math.round((s.strength - 50) * 1100)),
      reputation: rep, strength: s.strength, tier: 2, region: regionOf(s.city),
      club: pseudoClub(s.id, s.name, s.shortName, s.city, s.primary, s.secondary, rep),
    };
  });
}

export function leaguePreview(key: LeagueKey): ClubPreview[] {
  const base = rawLeague(key);
  const everyone = [...rawLeague('tier1'), ...rawLeague('nord'), ...rawLeague('sued')];
  const sorted = [...base].sort((a, b) => b.strength - a.strength);
  const size = base.length;
  const caps = base.map((c) => c.capacity).sort((a, b) => a - b);
  return base.map((c) => {
    const rank = sorted.findIndex((x) => x.id === c.id) + 1;
    const share = rank / size;
    const role: ClubPreview['role'] = rank <= 2 ? 'Favorit' : share <= 0.3 ? 'Spitzengruppe' : share <= 0.75 ? 'Mittelfeld' : 'Abstiegskampf';
    // Finanzkraft: Ansehen und Stadiongröße im Ligavergleich (1–5).
    const capPct = caps.indexOf(c.capacity) / Math.max(1, caps.length - 1);
    const fin = Math.round(1 + 4 * (0.6 * (1 - share) + 0.4 * capPct));
    const rivals = everyone
      .filter((o) => o.id !== c.id && sameRegion(o.city, c.city))
      .sort((a, b) => Number(b.city === c.city) - Number(a.city === c.city) || b.reputation - a.reputation)
      .slice(0, 3).map((o) => o.name);
    return {
      ...c, rank, size,
      expectation: seasonExpectation(rank, size, c.tier),
      role, finance: Math.max(1, Math.min(5, fin)) as ClubPreview['finance'], rivals,
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
