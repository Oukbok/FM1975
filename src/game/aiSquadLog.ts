// =============================================================================
// Zähler der KI-Kaderplanung je Saison (für Sim-Berichte und das Wiki):
// vorzeitige Verlängerungen, auslaufende Altstars, Bosman-Verkäufe, Vorverträge,
// ablösefreie Abgänge, Leihen. Optionales Feld `game.aiSquadLog` (klein, ≤ 80 Saisons).
// Ohne weitere Abhängigkeiten, damit contracts.ts/aiClubs.ts es ohne Kreis nutzen.
// =============================================================================
import type { Game } from './state';

export interface AiSquadLogEntry {
  season: string;
  /** Vorzeitig verlängert (KI, Leistungsträger). */
  early: number;
  /** Verlängerung abgelehnt (Spieler). */
  refused: number;
  /** Altstars, deren Vertrag bewusst ausläuft. */
  letGo: number;
  /** Verkauf im letzten Vertragsjahr (ab Bosman). */
  bosmanSales: number;
  /** Vorverträge zwischen KI-Vereinen. */
  pre: number;
  /** Ablösefreie Abgänge zum Vertragsende (KI-Vereine). */
  freeLeaves: number;
  /** Abgänge zum Vertragsende gegen Ablöse (vor Bosman). */
  paidLeaves: number;
  /** Neue Leihen (KI ↔ KI). */
  loans: number;
  /** Kaufoption gezogen. */
  loanBuys: number;
  /** Leihen deiner Spieler an KI-Vereine. */
  loansFromYou: number;
  /** Jobangebote an dich. */
  jobOffers: number;
}

export type AiSquadKey = Exclude<keyof AiSquadLogEntry, 'season'>;
const MAX = 80;

function blank(season: string): AiSquadLogEntry {
  return { season, early: 0, refused: 0, letGo: 0, bosmanSales: 0, pre: 0, freeLeaves: 0, paidLeaves: 0, loans: 0, loanBuys: 0, loansFromYou: 0, jobOffers: 0 };
}

/** Zähler der laufenden Saison (legt sie bei Bedarf an). */
export function squadLogNow(g: Game, season = g.season): AiSquadLogEntry {
  const log = (g.aiSquadLog ??= []);
  let e = log.find((x) => x.season === season);
  if (!e) {
    e = blank(season);
    log.push(e);
    if (log.length > MAX) log.splice(0, log.length - MAX);
  }
  for (const k of Object.keys(blank('')) as (keyof AiSquadLogEntry)[]) if (k !== 'season' && typeof e[k] !== 'number') (e as any)[k] = 0;
  return e;
}

export function noteSquad(g: Game, key: AiSquadKey, n = 1, season?: string): void {
  if (!g.season) return;
  squadLogNow(g, season)[key] += n;
}
