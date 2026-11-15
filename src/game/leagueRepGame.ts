// =============================================================================
// ENTWICKLUNG DER LIGEN — Spielstand-Anbindung des Ligarufs (engine/leagueRep.ts)
// -----------------------------------------------------------------------------
// Beim Spielstart wählbar (optionales Feld `game.leagueRepMode`):
//   historic – Ligen folgen grob der echten Geschichte (Zielkurve data/leagueReputation.ts)
//   free     – Ligen entwickeln sich nur aus den eigenen Europapokal-Ergebnissen
// Fehlt das Feld (alte Spielstände), bleibt alles wie bisher: Landesniveau aus
// COUNTRY_TRENDS (data/worldSeed.ts), kein Ligaruf.
// =============================================================================
import type { Game } from './state';
import { homeCountryKey } from './state';
import { initLeagueRep, seasonLeagueRep, type LeagueRepMode } from '../engine/leagueRep';
import { repTargetAt } from '../data/leagueReputation';

export type { LeagueRepMode };

export const LEAGUE_REP_MODES: { id: LeagueRepMode; label: string; desc: string }[] = [
  {
    id: 'historic', label: 'Historisch',
    desc: 'Die Ligen folgen grob der echten Geschichte. Liegt ein Land am Saisonende über seinem historischen Ruf, verliert es mindestens ein Viertel des Vorsprungs (20 Punkte darüber = mindestens 5 weniger) – liegt es darunter, holt es genauso auf. Erfolge zählen, aber nur auf Zeit.',
  },
  {
    id: 'free', label: 'Frei',
    desc: 'Kein Eingriff von außen: Der Ruf entsteht nur aus den Europapokal-Ergebnissen. Wer in der Fünfjahreswertung steigt, wird stärker, bekommt mehr Startplätze und kann oben bleiben – 2026 können ganz andere Länder zu den Top 5 gehören.',
  },
];

export const leagueRepModeOf = (g: Pick<Game, 'leagueRepMode'>): LeagueRepMode | null => g.leagueRepMode ?? null;
export const leagueRepLabel = (m: LeagueRepMode | undefined | null) => LEAGUE_REP_MODES.find((x) => x.id === m)?.label ?? 'Aus';

/** Spielstart: Ligaruf aller Hintergrund-Länder anlegen (nur mit gewählter Option). */
export function startLeagueRep(g: Game, year: number): void {
  if (!g.leagueRepMode || !g.world) return;
  initLeagueRep(g.world, year);
}

/** Rückruf für advanceWorldSeason (game/season.ts); ohne Option undefined = bisheriges Verhalten. */
export function leagueRepHook(g: Game): ((endYear: number) => void) | undefined {
  const mode = g.leagueRepMode;
  if (!mode) return undefined;
  return (endYear) => { if (g.world) seasonLeagueRep(g.world, endYear, mode, homeCountryKey(g)); };
}

/** Anzeige: Ligaruf, historischer Wert und Veränderung zur Vorsaison eines Hintergrund-Landes. */
export function leagueRepInfo(g: Game, key: string, year: number): { rep: number; hist: number; delta: number | null } | null {
  const c = g.world?.countries[key];
  if (!g.leagueRepMode || c?.rep == null) return null;
  const h = c.repHist ?? [];
  const prev = h.length >= 2 ? h[h.length - 2] : h.length === 1 ? c.repStart ?? null : null;
  return { rep: c.rep, hist: repTargetAt(key, year), delta: prev == null ? null : c.rep - prev };
}

/** Alte Spielstände: unbekannter Wert → Feld entfernen (= bisheriges Verhalten). */
export function migrateLeagueRep(g: Game): void {
  if (g.leagueRepMode && g.leagueRepMode !== 'free' && g.leagueRepMode !== 'historic') delete g.leagueRepMode;
}
