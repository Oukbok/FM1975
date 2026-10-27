import { DDR_LIGA_ID, DDR_LIGA_SEEDS, DDR_OBERLIGA_ID, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../data/generate';
import { LeagueDivision, LeagueSystem, SimClub, buildDivision } from '../engine/leagues';
import { PointSystem } from '../types';

// -----------------------------------------------------------------------------
// LIGASYSTEM-AUFBAU (Ebenen oberhalb/neben der Spielerliga)
// -----------------------------------------------------------------------------
// Erzeugt die aggregierten 2.-Liga-Vereine (Nord/Süd) als SimClubs. Die
// eigentliche Spielerliga (Tier 1) lebt weiter in game.clubs/game.table.
export function buildSecondLigaSimClubs(): Record<string, SimClub> {
  const out: Record<string, SimClub> = {};
  for (const s of SECOND_LIGA_NORD_SEEDS) {
    out[s.id] = {
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: s.strength,
      colors: { primary: s.primary, secondary: s.secondary }, tier: 2, group: 'nord',
    };
  }
  for (const s of SECOND_LIGA_SUED_SEEDS) {
    out[s.id] = {
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: s.strength,
      colors: { primary: s.primary, secondary: s.secondary }, tier: 2, group: 'sued',
    };
  }
  return out;
}

// Baut das komplette Ligasystem für einen Saisonstart: Spielerliga (Tier 1) als
// Meta + die beiden simulierten 2.-Liga-Staffeln. seasonStart = ISO-Datum des
// ersten Ligaspieltags (für die Sim-Fixtures).
export function buildLeagueSystem(
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
  seasonStart: string,
): LeagueSystem {
  const nordIds = Object.values(simClubs).filter((s) => s.tier === 2 && s.group === 'nord').map((s) => s.id);
  const suedIds = Object.values(simClubs).filter((s) => s.tier === 2 && s.group === 'sued').map((s) => s.id);
  const nord = buildDivision(
    { id: 'tier2-nord', name: '2. Liga Nord', tier: 2, group: 'nord' },
    nordIds, pointSystem, season, seasonStart,
  );
  const sued = buildDivision(
    { id: 'tier2-sued', name: '2. Liga Süd', tier: 2, group: 'sued' },
    suedIds, pointSystem, season, seasonStart,
  );
  return {
    playerDivision: { id: 'tier1', name: '1. Liga', tier: 1, group: null },
    otherDivisions: [nord, sued],
    season,
  };
}

// Baut die parallele DDR-Ligapyramide (bis zur Wiedervereinigung 1991/92):
// DDR-Oberliga (tier 101) + DDR-Liga (tier 102), beide Staffel 'nordost'. Die
// DDR-Sim-Vereine werden in `simClubs` aufgenommen und als zusätzliche
// simulierte Divisionen zurückgegeben (Aufnahme in leagues.otherDivisions).
// Die hohen tier-Werte halten die DDR-Ligen aus dem West-Auf-/Abstieg heraus.
export function buildDdrDivisions(
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
  seasonStart: string,
): LeagueDivision[] {
  for (const s of DDR_OBERLIGA_SEEDS) simClubs[s.id] = { ...s };
  for (const s of DDR_LIGA_SEEDS) simClubs[s.id] = { ...s };
  const ober = buildDivision(
    { id: DDR_OBERLIGA_ID, name: 'DDR-Oberliga', tier: 101, group: 'nordost' },
    DDR_OBERLIGA_SEEDS.map((s) => s.id), pointSystem, season, seasonStart,
  );
  const liga = buildDivision(
    { id: DDR_LIGA_ID, name: 'DDR-Liga', tier: 102, group: 'nordost' },
    DDR_LIGA_SEEDS.map((s) => s.id), pointSystem, season, seasonStart,
  );
  return [ober, liga];
}

/**
 * Historisch korrektes Punktesystem, abgeleitet aus dem Start-Jahr der Saison.
 * Bis Saison 1994/95 gilt die 2-Punkte-Regel, ab Saison 1995/96 automatisch die
 * 3-Punkte-Regel. NICHT mehr vom Nutzer wählbar – die Umstellung während eines
 * laufenden Spiels erfolgt automatisch über den Timeline-Meilenstein „3-Punkte-Regel".
 */
export function historicPointSystem(season: string): PointSystem {
  const startYear = parseInt((season ?? '').slice(0, 4), 10);
  return Number.isFinite(startYear) && startYear >= 1995 ? '3-point' : '2-point';
}
