// =============================================================================
// LÄNDER: Anzeigename, Kürzel und vereinfachte Flagge (Streifen/Kreuz)
// -----------------------------------------------------------------------------
// Für Listen im Assistenten „Neues Spiel“ und die Übersicht Ligensystem. Die
// Flaggen sind bewusst vereinfacht (Streifen, Kreuze, ohne Wappen/Embleme) und
// in gedämpften Tönen gezeichnet. Schlüssel = Ländername wie in data/worldSeed.ts
// (z. B. „Oesterreich“), dazu Deutschland/DDR.
// =============================================================================

export type FlagSpec =
  | { kind: 'h'; c: string[] }              // waagrechte Streifen (oben → unten)
  | { kind: 'v'; c: string[] }              // senkrechte Streifen (links → rechts)
  | { kind: 'nordic'; bg: string; cross: string; inner?: string }
  | { kind: 'cross'; bg: string; cross: string }   // mittiges Kreuz (England, Schweiz)
  | { kind: 'saltire'; bg: string; cross: string } // Andreaskreuz (Schottland)
  | { kind: 'crescent'; bg: string; fg: string }   // Halbmond (Türkei)
  | { kind: 'plain'; bg: string; dot?: string; center?: boolean };   // einfarbig, optional Zeichen (Sowjetunion, DDR; mittig: Japan)

export interface CountryInfo { name: string; code: string; flag: FlagSpec }

const R = '#c8323c', W = '#eef0f2', B = '#2c4f9e', G = '#2f8a4e', Y = '#e6bf3a', K = '#1d1f24';

export const COUNTRY_INFO: Record<string, CountryInfo> = {
  Deutschland: { name: 'Deutschland', code: 'GER', flag: { kind: 'h', c: [K, R, Y] } },
  DDR: { name: 'DDR', code: 'GDR', flag: { kind: 'plain', bg: R, dot: Y } },
  England: { name: 'England', code: 'ENG', flag: { kind: 'cross', bg: W, cross: R } },
  Schottland: { name: 'Schottland', code: 'SCO', flag: { kind: 'saltire', bg: '#2b5ea8', cross: W } },
  Italien: { name: 'Italien', code: 'ITA', flag: { kind: 'v', c: [G, W, R] } },
  Spanien: { name: 'Spanien', code: 'ESP', flag: { kind: 'h', c: [R, Y, Y, R] } },
  Frankreich: { name: 'Frankreich', code: 'FRA', flag: { kind: 'v', c: [B, W, R] } },
  Niederlande: { name: 'Niederlande', code: 'NED', flag: { kind: 'h', c: [R, W, B] } },
  Belgien: { name: 'Belgien', code: 'BEL', flag: { kind: 'v', c: [K, Y, R] } },
  Portugal: { name: 'Portugal', code: 'POR', flag: { kind: 'v', c: [G, R, R] } },
  Oesterreich: { name: 'Österreich', code: 'AUT', flag: { kind: 'h', c: [R, W, R] } },
  Schweiz: { name: 'Schweiz', code: 'SUI', flag: { kind: 'cross', bg: R, cross: W } },
  Schweden: { name: 'Schweden', code: 'SWE', flag: { kind: 'nordic', bg: '#2d6db0', cross: Y } },
  Daenemark: { name: 'Dänemark', code: 'DEN', flag: { kind: 'nordic', bg: R, cross: W } },
  Jugoslawien: { name: 'Jugoslawien', code: 'YUG', flag: { kind: 'h', c: [B, W, R] } },
  Ungarn: { name: 'Ungarn', code: 'HUN', flag: { kind: 'h', c: [R, W, G] } },
  Tschechoslowakei: { name: 'Tschechoslowakei', code: 'TCH', flag: { kind: 'h', c: [W, R] } },
  Polen: { name: 'Polen', code: 'POL', flag: { kind: 'h', c: [W, R] } },
  Sowjetunion: { name: 'Sowjetunion', code: 'URS', flag: { kind: 'plain', bg: R, dot: Y } },
  Griechenland: { name: 'Griechenland', code: 'GRE', flag: { kind: 'h', c: ['#3b6fb6', W, '#3b6fb6', W, '#3b6fb6'] } },
  Tuerkei: { name: 'Türkei', code: 'TUR', flag: { kind: 'crescent', bg: R, fg: W } },
  Rumaenien: { name: 'Rumänien', code: 'ROU', flag: { kind: 'v', c: [B, Y, R] } },
  // Nach den Staatsteilungen (data/worldSeed.ts COUNTRY_SPLITS)
  Russland: { name: 'Russland', code: 'RUS', flag: { kind: 'h', c: [W, B, R] } },
  Ukraine: { name: 'Ukraine', code: 'UKR', flag: { kind: 'h', c: ['#2d6db0', Y] } },
  Serbien: { name: 'Serbien', code: 'SRB', flag: { kind: 'h', c: [R, B, W] } },
  Kroatien: { name: 'Kroatien', code: 'CRO', flag: { kind: 'h', c: [R, W, B] } },
  Tschechien: { name: 'Tschechien', code: 'CZE', flag: { kind: 'h', c: [W, R] } },
  Slowakei: { name: 'Slowakei', code: 'SVK', flag: { kind: 'h', c: [W, B, R] } },
  // Weitere Europapokal-Länder (Weltdaten), vereinfacht
  Norwegen: { name: 'Norwegen', code: 'NOR', flag: { kind: 'nordic', bg: R, cross: W, inner: '#24407e' } },
  Finnland: { name: 'Finnland', code: 'FIN', flag: { kind: 'nordic', bg: W, cross: '#24407e' } },
  Island: { name: 'Island', code: 'ISL', flag: { kind: 'nordic', bg: '#2c4f9e', cross: W, inner: R } },
  Irland: { name: 'Irland', code: 'IRL', flag: { kind: 'v', c: [G, W, '#e08a3c'] } },
  Nordirland: { name: 'Nordirland', code: 'NIR', flag: { kind: 'cross', bg: W, cross: R } },
  Wales: { name: 'Wales', code: 'WAL', flag: { kind: 'h', c: [W, G] } },
  Luxemburg: { name: 'Luxemburg', code: 'LUX', flag: { kind: 'h', c: [R, W, '#5aa6dc'] } },
  Bulgarien: { name: 'Bulgarien', code: 'BUL', flag: { kind: 'h', c: [W, G, R] } },
  Albanien: { name: 'Albanien', code: 'ALB', flag: { kind: 'plain', bg: R, dot: K } },
  Zypern: { name: 'Zypern', code: 'CYP', flag: { kind: 'plain', bg: W, dot: '#d48a3a' } },
  Malta: { name: 'Malta', code: 'MLT', flag: { kind: 'v', c: [W, R] } },
  // Nationalitäten außerhalb Europas (Spielerlisten, Wunsch Pascal)
  Brasilien: { name: 'Brasilien', code: 'BRA', flag: { kind: 'plain', bg: G, dot: Y, center: true } },
  Argentinien: { name: 'Argentinien', code: 'ARG', flag: { kind: 'h', c: ['#7fb4e0', W, '#7fb4e0'] } },
  Uruguay: { name: 'Uruguay', code: 'URU', flag: { kind: 'h', c: [W, '#5a86c8', W, '#5a86c8', W] } },
  USA: { name: 'USA', code: 'USA', flag: { kind: 'h', c: [R, W, R, W, R, W, R] } },
  Japan: { name: 'Japan', code: 'JPN', flag: { kind: 'plain', bg: W, dot: R, center: true } },
  Suedkorea: { name: 'Südkorea', code: 'KOR', flag: { kind: 'plain', bg: W, dot: B, center: true } },
  Ghana: { name: 'Ghana', code: 'GHA', flag: { kind: 'h', c: [R, Y, G] } },
  Nigeria: { name: 'Nigeria', code: 'NGA', flag: { kind: 'v', c: [G, W, G] } },
  Kamerun: { name: 'Kamerun', code: 'CMR', flag: { kind: 'v', c: [G, R, Y] } },
  Marokko: { name: 'Marokko', code: 'MAR', flag: { kind: 'plain', bg: R, dot: G, center: true } },
  Aegypten: { name: 'Ägypten', code: 'EGY', flag: { kind: 'h', c: [R, W, K] } },
  Liberia: { name: 'Liberia', code: 'LBR', flag: { kind: 'h', c: [R, W, R, W, R] } },
  Elfenbeinkueste: { name: 'Elfenbeinküste', code: 'CIV', flag: { kind: 'v', c: ['#e08a3c', W, G] } },
  Israel: { name: 'Israel', code: 'ISR', flag: { kind: 'h', c: [W, B, W, W, W, B, W] } },
};

/** Anzeigedaten eines Landes (unbekannte Länder: neutrale Flagge, Kürzel aus dem Namen). */
export function countryInfo(name: string): CountryInfo {
  return COUNTRY_INFO[name] ?? { name, code: name.slice(0, 3).toUpperCase(), flag: { kind: 'plain', bg: '#5a636f' } };
}

/** Land (Schlüssel) zu einem Nationalitätskürzel (GER, ENG, BRA …); null = unbekannt. */
let byCode: Record<string, string> | null = null;
export function countryOfNat(code: string): string | null {
  if (!byCode) {
    byCode = {};
    for (const [k, v] of Object.entries(COUNTRY_INFO)) if (!byCode[v.code]) byCode[v.code] = k;
    byCode.GDR = 'DDR';
  }
  return byCode[code] ?? null;
}

/** Nationalitäten zur Auswahl im Managerprofil (Anzeigenamen, Deutschland zuerst). */
export const NATIONALITIES: string[] = [
  'Deutschland', 'Österreich', 'Schweiz', 'Niederlande', 'Belgien', 'Dänemark', 'Schweden', 'Norwegen', 'Finnland',
  'England', 'Schottland', 'Wales', 'Irland', 'Nordirland', 'Frankreich', 'Luxemburg', 'Italien', 'Spanien', 'Portugal',
  'Polen', 'Tschechoslowakei', 'Ungarn', 'Jugoslawien', 'Rumänien', 'Bulgarien', 'Griechenland', 'Türkei', 'Sowjetunion',
  'Brasilien', 'Argentinien', 'Uruguay', 'Chile', 'USA', 'Kanada', 'Australien', 'Japan', 'Südkorea', 'Ghana', 'Nigeria',
  'Kamerun', 'Marokko', 'Tunesien', 'Ägypten', 'Iran',
];
