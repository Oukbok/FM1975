// =============================================================================
// Länder-Register der Weltdaten (Wunsch Pascal: alle Europapokal-Länder spielbar)
// -----------------------------------------------------------------------------
// Je Land: Code (= Dateiname `clubs/<cc>.ts`/`seasons/<cc>.ts`), deutscher Name,
// Existenz von–bis, Vorgänger/Nachfolger, Herkunft für Spielernamen (data/origins.ts),
// Schlüssel der Hintergrund-Simulation (data/worldSeed.ts `CountrySeed.name`, zugleich
// Flaggen-Schlüssel in data/countryFlags.ts), Ligagrößen als Rückfall, Einführung der
// 3-Punkte-Regel (Saison-Startjahr). Werte ohne sichere Quelle: grob plausibel,
// Rückfall auf 1995 (Deutschland) bzw. die Größen aus worldSeed.ts.
// Daten (Vereine/Saisons) liegen in data/world/index.ts – fehlt ein Land dort, läuft
// es wie bisher mit erfundenen Städtevereinen (data/worldSeed.ts).
// =============================================================================

export interface WorldCountryDef {
  cc: string;
  /** Deutscher Anzeigename. */
  name: string;
  /** Schlüssel der Hintergrund-Simulation/Flagge (worldSeed `CountrySeed.name`). */
  key: string;
  /** Erste Saison (Startjahr), in der das Land eigene Ligen/Europapokal-Starter hat. */
  from: number;
  /** Letzte Saison (Startjahr), danach Nachfolgestaaten. */
  to?: number;
  /** Nachfolgestaaten (Codes), z. B. UdSSR → Russland, Ukraine … */
  successors?: string[];
  /** Vorgängerstaat (Code). */
  successorOf?: string;
  /** Herkunft der Spielernamen (data/origins.ts). */
  origin: string;
  /** Top-8-Land: 1. und 2. Liga in den Daten (Entscheidung Pascal). */
  top8?: boolean;
  /** Rückfall-Ligagrößen, wenn keine Saisondaten vorliegen. */
  t1: number;
  t2?: number;
  /** 3-Punkte-Regel ab Saison (Startjahr). */
  points3From: number;
  /** Winterpause üblich (grob): England/Schottland/Irland/Spanien/Portugal/Italien kaum. */
  winterBreak?: boolean;
}

/** Alle Europapokal-Länder 1975–2025 (Nachfolgestaaten ab ihrer ersten Saison). */
export const WORLD_COUNTRIES: WorldCountryDef[] = [
  { cc: 'ger', name: 'Deutschland', key: 'Deutschland', from: 1975, origin: 'ger', top8: true, t1: 18, t2: 20, points3From: 1995, winterBreak: true },
  { cc: 'gdr', name: 'DDR', key: 'DDR', from: 1975, to: 1990, successors: ['ger'], origin: 'ger_ost', t1: 14, t2: 30, points3From: 2100, winterBreak: true },
  { cc: 'eng', name: 'England', key: 'England', from: 1975, origin: 'eng', top8: true, t1: 22, t2: 22, points3From: 1981 },
  { cc: 'ita', name: 'Italien', key: 'Italien', from: 1975, origin: 'ita', top8: true, t1: 16, t2: 20, points3From: 1994, winterBreak: true },
  { cc: 'esp', name: 'Spanien', key: 'Spanien', from: 1975, origin: 'esp', top8: true, t1: 18, t2: 20, points3From: 1995 },
  { cc: 'fra', name: 'Frankreich', key: 'Frankreich', from: 1975, origin: 'fra', top8: true, t1: 20, t2: 18, points3From: 1994, winterBreak: true },
  { cc: 'ned', name: 'Niederlande', key: 'Niederlande', from: 1975, origin: 'ned', top8: true, t1: 18, t2: 18, points3From: 1995, winterBreak: true },
  { cc: 'por', name: 'Portugal', key: 'Portugal', from: 1975, origin: 'por', top8: true, t1: 16, t2: 18, points3From: 1995 },
  { cc: 'bel', name: 'Belgien', key: 'Belgien', from: 1975, origin: 'bel', top8: true, t1: 18, t2: 16, points3From: 1995, winterBreak: true },
  { cc: 'sco', name: 'Schottland', key: 'Schottland', from: 1975, origin: 'sco', t1: 10, t2: 14, points3From: 1994 },
  { cc: 'wal', name: 'Wales', key: 'Wales', from: 1975, origin: 'eng', t1: 16, points3From: 1992 },
  { cc: 'nir', name: 'Nordirland', key: 'Nordirland', from: 1975, origin: 'eng', t1: 12, points3From: 1990 },
  { cc: 'irl', name: 'Irland', key: 'Irland', from: 1975, origin: 'eng', t1: 14, points3From: 1993 },
  { cc: 'aut', name: 'Österreich', key: 'Oesterreich', from: 1975, origin: 'aut', t1: 10, t2: 16, points3From: 1995, winterBreak: true },
  { cc: 'sui', name: 'Schweiz', key: 'Schweiz', from: 1975, origin: 'sui', t1: 14, t2: 16, points3From: 1995, winterBreak: true },
  { cc: 'lux', name: 'Luxemburg', key: 'Luxemburg', from: 1975, origin: 'fra', t1: 12, points3From: 1995, winterBreak: true },
  { cc: 'swe', name: 'Schweden', key: 'Schweden', from: 1975, origin: 'swe', t1: 14, t2: 14, points3From: 1990, winterBreak: true },
  { cc: 'nor', name: 'Norwegen', key: 'Norwegen', from: 1975, origin: 'nor', t1: 12, points3From: 1987, winterBreak: true },
  { cc: 'den', name: 'Dänemark', key: 'Daenemark', from: 1975, origin: 'den', t1: 16, t2: 16, points3From: 1995, winterBreak: true },
  { cc: 'fin', name: 'Finnland', key: 'Finnland', from: 1975, origin: 'swe', t1: 12, points3From: 1990, winterBreak: true },
  { cc: 'isl', name: 'Island', key: 'Island', from: 1975, origin: 'nor', t1: 10, points3From: 1984, winterBreak: true },
  { cc: 'urs', name: 'Sowjetunion', key: 'Sowjetunion', from: 1975, to: 1991, successors: ['rus', 'ukr'], origin: 'rus', t1: 16, t2: 22, points3From: 2100, winterBreak: true },
  { cc: 'rus', name: 'Russland', key: 'Russland', from: 1992, successorOf: 'urs', origin: 'rus', t1: 16, points3From: 1995, winterBreak: true },
  { cc: 'ukr', name: 'Ukraine', key: 'Ukraine', from: 1992, successorOf: 'urs', origin: 'rus', t1: 16, points3From: 1995, winterBreak: true },
  { cc: 'yug', name: 'Jugoslawien', key: 'Jugoslawien', from: 1975, to: 1991, successors: ['srb', 'cro'], origin: 'yug', t1: 18, t2: 18, points3From: 2100, winterBreak: true },
  { cc: 'srb', name: 'Serbien', key: 'Serbien', from: 1992, successorOf: 'yug', origin: 'srb', t1: 16, points3From: 1995, winterBreak: true },
  { cc: 'cro', name: 'Kroatien', key: 'Kroatien', from: 1992, successorOf: 'yug', origin: 'cro', t1: 16, points3From: 1995, winterBreak: true },
  { cc: 'tch', name: 'Tschechoslowakei', key: 'Tschechoslowakei', from: 1975, to: 1992, successors: ['cze', 'svk'], origin: 'cze', t1: 16, t2: 16, points3From: 2100, winterBreak: true },
  { cc: 'cze', name: 'Tschechien', key: 'Tschechien', from: 1993, successorOf: 'tch', origin: 'cze', t1: 16, points3From: 1993, winterBreak: true },
  { cc: 'svk', name: 'Slowakei', key: 'Slowakei', from: 1993, successorOf: 'tch', origin: 'cze', t1: 12, points3From: 1993, winterBreak: true },
  { cc: 'pol', name: 'Polen', key: 'Polen', from: 1975, origin: 'pol', t1: 16, t2: 18, points3From: 1995, winterBreak: true },
  { cc: 'hun', name: 'Ungarn', key: 'Ungarn', from: 1975, origin: 'hun', t1: 16, t2: 18, points3From: 1995, winterBreak: true },
  { cc: 'rou', name: 'Rumänien', key: 'Rumaenien', from: 1975, origin: 'hun', t1: 18, t2: 18, points3From: 1994, winterBreak: true },
  { cc: 'bul', name: 'Bulgarien', key: 'Bulgarien', from: 1975, origin: 'srb', t1: 16, points3From: 1995, winterBreak: true },
  { cc: 'alb', name: 'Albanien', key: 'Albanien', from: 1975, origin: 'yug', t1: 14, points3From: 1995 },
  { cc: 'gre', name: 'Griechenland', key: 'Griechenland', from: 1975, origin: 'gre', t1: 18, t2: 20, points3From: 1992 },
  { cc: 'tur', name: 'Türkei', key: 'Tuerkei', from: 1975, origin: 'tur', t1: 16, t2: 18, points3From: 1987 },
  { cc: 'cyp', name: 'Zypern', key: 'Zypern', from: 1975, origin: 'gre', t1: 14, points3From: 1991 },
  { cc: 'mlt', name: 'Malta', key: 'Malta', from: 1975, origin: 'ita', t1: 10, points3From: 1995 },
  { cc: 'isr', name: 'Israel', key: 'Israel', from: 1992, origin: 'gre', t1: 12, points3From: 1992 },
];

export const COUNTRY_BY_CC: Record<string, WorldCountryDef> = Object.fromEntries(WORLD_COUNTRIES.map((c) => [c.cc, c]));
export const COUNTRY_BY_KEY: Record<string, WorldCountryDef> = Object.fromEntries(WORLD_COUNTRIES.map((c) => [c.key, c]));

/** Land existiert in der Saison mit Startjahr `year`. */
export function countryExists(c: WorldCountryDef, year: number): boolean {
  return year >= c.from && (c.to == null || year <= c.to);
}

/** 3-Punkte-Regel des Landes in der Saison (Startjahr). Unbekanntes Land: Deutschland. */
export function countryPointSystem(cc: string, year: number): '2-point' | '3-point' {
  const c = COUNTRY_BY_CC[cc] ?? COUNTRY_BY_CC.ger;
  return year >= c.points3From ? '3-point' : '2-point';
}

/** Herkunfts-ID der Spielernamen für ein Land. */
export function countryOrigin(cc: string): string {
  return COUNTRY_BY_CC[cc]?.origin ?? 'ger';
}

/** Saison-Label „1985/86“ aus dem Startjahr. */
export function seasonLabelOf(year: number): string {
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}
