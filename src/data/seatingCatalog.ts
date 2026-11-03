// =============================================================================
// PLATZKATEGORIEN IM STADION — Stammdaten (Freischaltjahre, Preis-Anker, Nachfrage)
// -----------------------------------------------------------------------------
// Rechenlogik: engine/seating.ts. Spielablauf: game/seatingGame.ts.
//
// Recherche (Nov. 2026) – belegte Werte:
//   • Allianz Arena: 75.000 Plätze, 106 Logen mit 1.374 Plätzen, 2.200 Business-
//     und Presseplätze, 227 Plätze für Menschen mit Behinderung (fcbayern.com,
//     „Allianz Arena – Fakten“).
//   • Westfalenstadion 1974: 54.000 Plätze, nur 17.000 Sitzplätze (≈ 69 % Steh);
//     1992 Nordtribüne bestuhlt; 2003 3.450 Hospitality-Plätze (bvb.de, Stadion-
//     Historie).
//   • Eintracht Frankfurt 2026/27: Loge ab 640 € netto je Platz und Spiel (Logen
//     für 8–34 Personen, 1.005 Logenplätze), Business-Seat ab ≈ 360 € je Spiel
//     (americanexpress.com, Hospitality Eintracht Frankfurt).
//   • FC Bayern: teuerste Loge der Liga ≈ 304.000 € je Saison, Business-Seat ab
//     7.500 € je Saison (Bericht Juli 2023).
//   • Stehplatz-Dauerkarte 2024/25: 150–272 €, Schnitt 213 € (≈ 12,5 € je Spiel;
//     Tageskarte 15–20 €) (diefalsche9.de, Preisvergleich Juli 2024).
//   • Spieltagserlöse 2023: FC Bayern ≈ 121 Mio. € (≈ 5,2 Mio. € je Heimspiel,
//     ≈ 70 € je Zuschauer), BVB ≈ 2,1 Mio. € je Heimspiel (UEFA-Finanzbericht,
//     zitiert bei 90min.de).
//   • UEFA: Gästekontingent im Europapokal ≈ 5 % der Kapazität (bvb.de).
//   • Ab 1998/99 nur Sitzplätze im Europapokal (schon im Spiel, stadiumBlocks.ts).
//   • 1969 bis zu 20 Mark Eintritt; Mischung aus günstigen Steh- und teureren
//     Sitzplätzen (Dissertation Durham, Bundesliga-Zuschauer 1963–1977).
// Annahmen ohne Einzelbeleg (plausibel, in der Wiki genannt):
//   • VIP-Bereich 1980, Logen 1985, Business-Seats als ganzer Rang 1992 (wie
//     bisher im Spiel; Logen setzten sich in Deutschland erst in den 1990ern breit
//     durch, die WM-Stadien 2006 machten Hospitality zur Säule).
//   • Komfort-/Premiumsitze 1988 (gepolsterte Mittelplätze der Haupttribüne).
//   • Fest abgetrennter Gästeblock mit Pflichtkontingent (10 % der Kapazität) ab
//     1984 – Fantrennung nach der Hooligan-Welle der frühen 1980er.
//   • Rollstuhlplätze als Pflicht ab 2002 (Muster-Versammlungsstättenverordnung:
//     1 % der Besucherplätze); nur Anzeige, kein eigener Markt.
// =============================================================================
import type { BlockId, SeatCat, StandId } from '../types';

export interface SeatCatDef {
  key: SeatCat;
  name: string;
  short: string;
  /** Ab diesem Jahr gibt es die Kategorie. */
  unlock: number;
  /** Preis-Elastizität (Nachfrage-Rückgang je 100 % Aufschlag auf den Richtpreis). */
  elasticity: number;
  /** Grundunschärfe der Nachfrage-Schätzung (Anteil). */
  fog: number;
  /** Einheit der Kapazität: Plätze oder Logen. */
  unit: 'Plätze' | 'Logen';
  desc: string;
}

export const SEAT_CATS: SeatCatDef[] = [
  { key: 'steh', name: 'Stehplätze', short: 'Steh', unlock: 1975, elasticity: 0.6, fog: 0.16, unit: 'Plätze',
    desc: 'Die Kurve: günstig, laut, Massenware der 1970er und 80er. Fans reagieren empfindlich auf Preiserhöhungen.' },
  { key: 'sitz', name: 'Sitzplätze (offen)', short: 'Sitz', unlock: 1975, elasticity: 0.75, fog: 0.2, unit: 'Plätze',
    desc: 'Sitzplätze ohne Dach. Bei Regen und im Winter bleiben viele leer.' },
  { key: 'dach', name: 'Sitzplätze (überdacht)', short: 'Tribüne', unlock: 1975, elasticity: 0.8, fog: 0.2, unit: 'Plätze',
    desc: 'Tribünenplätze unter Dach – ab den 1990ern die gefragteste Kategorie.' },
  { key: 'premium', name: 'Premium-Sitze', short: 'Premium', unlock: 1988, elasticity: 0.95, fog: 0.28, unit: 'Plätze',
    desc: 'Gepolsterte Komfortsitze in der Mitte der Haupttribüne. Kleiner, zahlungskräftiger Markt.' },
  { key: 'business', name: 'Business-Seats', short: 'Business', unlock: 1980, elasticity: 1.05, fog: 0.34, unit: 'Plätze',
    desc: 'Plätze mit Business-Club und Essen. Die Nachfrage hängt an Vereinsgröße und Wirtschaftskraft der Region – sie ist begrenzt.' },
  { key: 'loge', name: 'Logen', short: 'Logen', unlock: 1985, elasticity: 1.15, fog: 0.4, unit: 'Logen',
    desc: 'Geschlossene Räume für 10 bis 12 Gäste, meist an Firmen vermietet. Wenige, aber sehr wertvolle Kunden.' },
  { key: 'gast', name: 'Gästeblock', short: 'Gäste', unlock: 1984, elasticity: 0.5, fog: 0.3, unit: 'Plätze',
    desc: 'Abgetrenntes Kontingent für Auswärtsfans (10 % der Kapazität, im Europapokal 5 %). Die Nachfrage hängt am Gegner.' },
];
export const SEAT_CAT: Record<SeatCat, SeatCatDef> = Object.fromEntries(SEAT_CATS.map((d) => [d.key, d])) as Record<SeatCat, SeatCatDef>;
export const CAT_KEYS: SeatCat[] = SEAT_CATS.map((d) => d.key);
/** Fan-Kategorien (bestimmen die Fanstimmung über den Preis). */
export const FAN_CATS: SeatCat[] = ['steh', 'sitz', 'dach', 'gast'];

/** Gästeblock: Anteil der Kapazität (Liga) und im Europapokal (UEFA ≈ 5 %). */
export const GUEST_SHARE = 0.1;
export const GUEST_SHARE_EURO = 0.05;
/** Personen je Loge. */
export const LOGE_GUESTS = 11;
/** Business-Plätze eines VIP-Bereichs je Block-Länge (Gerade ≈ 200 Plätze). */
export const VIP_AREA_SEATS_PER_LENGTH = 600;
/** Rollstuhlplätze: Pflichtanteil ab 2002 (Anzeige). */
export const WHEELCHAIR_YEAR = 2002;
export const WHEELCHAIR_SHARE = 0.01;

// -----------------------------------------------------------------------------
// Richtpreise (nominal, DM bzw. EUR × 1,95583) eines Erstligisten mit Ruf 70.
// business = je Platz und Spiel, loge = je Loge und Spiel (netto nach Catering).
// -----------------------------------------------------------------------------
const E = 1.95583;
export const PRICE_ANCHORS: { year: number; p: Record<SeatCat, number> }[] = [
  { year: 1975, p: { steh: 5.6, sitz: 10.5, dach: 15, premium: 24, business: 45, loge: 1200, gast: 6.5 } },
  { year: 1980, p: { steh: 7, sitz: 13, dach: 19, premium: 30, business: 60, loge: 1600, gast: 8.5 } },
  { year: 1985, p: { steh: 9, sitz: 16, dach: 24, premium: 36, business: 90, loge: 2500, gast: 10 } },
  { year: 1990, p: { steh: 11, sitz: 20, dach: 30, premium: 45, business: 140, loge: 3500, gast: 13 } },
  { year: 1995, p: { steh: 14, sitz: 25, dach: 38, premium: 60, business: 220, loge: 5500, gast: 17 } },
  { year: 2000, p: { steh: 17, sitz: 30, dach: 46, premium: 75, business: 300, loge: 8000, gast: 21 } },
  { year: 2005, p: { steh: 11 * E, sitz: 20 * E, dach: 30 * E, premium: 50 * E, business: 200 * E, loge: 5000 * E, gast: 14 * E } },
  { year: 2015, p: { steh: 13 * E, sitz: 26 * E, dach: 40 * E, premium: 70 * E, business: 280 * E, loge: 7500 * E, gast: 17 * E } },
  { year: 2024, p: { steh: 15 * E, sitz: 30 * E, dach: 50 * E, premium: 90 * E, business: 360 * E, loge: 9000 * E, gast: 20 * E } },
];

// -----------------------------------------------------------------------------
// Nachfrage-Struktur je Epoche
// -----------------------------------------------------------------------------
/** Anteil der Fans, die einen Stehplatz wollen (Rest: Sitz). Sitzplatz-Boom ab den 1990ern. */
export const STEH_SHARE: [number, number][] = [[1975, 0.7], [1985, 0.64], [1992, 0.52], [1998, 0.42], [2006, 0.36], [2015, 0.33], [2030, 0.32]];
/** Anteil der Sitzplatz-Fans, die ein Dach bevorzugen (der Rest nimmt auch offene Plätze). */
export const ROOF_PREF: [number, number][] = [[1975, 0.5], [1990, 0.6], [2000, 0.72], [2010, 0.8], [2030, 0.82]];
/** Premium-Anteil der Fans (zahlungskräftig). */
export const PREMIUM_SHARE: [number, number][] = [[1987, 0], [1988, 0.01], [1995, 0.03], [2005, 0.05], [2020, 0.06], [2030, 0.065]];
/** Reife des Hospitality-Markts (0–1): Business-Seats und Logen. */
export const BUSINESS_ERA: [number, number][] = [[1979, 0], [1980, 0.08], [1985, 0.15], [1990, 0.3], [1995, 0.5], [2000, 0.7], [2006, 0.92], [2012, 1], [2030, 1.06]];
export const LOGE_ERA: [number, number][] = [[1984, 0], [1985, 0.15], [1990, 0.3], [1995, 0.5], [2000, 0.72], [2006, 0.92], [2012, 1], [2030, 1.06]];

/** Wirtschaftskraft der Region (Business-Nachfrage). Standard 1,0. */
export const BUSINESS_REGION: [string, number][] = [
  ['München', 1.3], ['Frankfurt', 1.25], ['Stuttgart', 1.2], ['Hamburg', 1.15], ['Düsseldorf', 1.15], ['Köln', 1.1],
  ['Berlin', 1.08], ['Wolfsburg', 1.1], ['Leverkusen', 1.1], ['Sinsheim', 1.1], ['Hannover', 1.05], ['Bremen', 1.0],
  ['Gelsenkirchen', 0.92], ['Bochum', 0.9], ['Duisburg', 0.9], ['Dortmund', 0.98], ['Kaiserslautern', 0.85],
];
/** Ostdeutsche Standorte: nach 1990 lange schwächere Wirtschaftskraft. */
export const EAST_CITIES = ['Dresden', 'Magdeburg', 'Jena', 'Rostock', 'Erfurt', 'Halle', 'Chemnitz', 'Karl-Marx-Stadt', 'Leipzig', 'Brandenburg', 'Cottbus', 'Zwickau', 'Aue', 'Frankfurt (Oder)', 'Ost'];

/** Stückweise linear interpolieren. */
export function lerpTable(t: [number, number][], year: number): number {
  if (year <= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) {
    const [y0, v0] = t[i], [y1, v1] = t[i + 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return t[t.length - 1][1];
}

// -----------------------------------------------------------------------------
// Tribünen des Kartenverkaufs (Gruppierung der 14 Blöcke wie im Vorbild EA FM):
// Haupttribüne (West), Gegentribüne (Ost), Hinter dem Tor 1/2 (Nord/Süd), vier
// Ecken im Uhrzeigersinn ab Nordwest. Reine Gruppierung – keine Spielstand-Daten.
// -----------------------------------------------------------------------------
export interface StandDef { id: StandId; name: string; sub: string; blocks: BlockId[] }
export const STANDS: StandDef[] = [
  { id: 'haupt', name: 'Haupttribüne', sub: 'West', blocks: ['main_n', 'main_m', 'main_s'] },
  { id: 'ecke1', name: 'Ecke 1', sub: 'Nordwest', blocks: ['curve_nw'] },
  { id: 'tor1', name: 'Hinter dem Tor 1', sub: 'Nord', blocks: ['north_w', 'north_e'] },
  { id: 'ecke2', name: 'Ecke 2', sub: 'Nordost', blocks: ['curve_ne'] },
  { id: 'gegen', name: 'Gegentribüne', sub: 'Ost', blocks: ['opp_n', 'opp_m', 'opp_s'] },
  { id: 'ecke3', name: 'Ecke 3', sub: 'Südost', blocks: ['curve_se'] },
  { id: 'tor2', name: 'Hinter dem Tor 2', sub: 'Süd', blocks: ['south_w', 'south_e'] },
  { id: 'ecke4', name: 'Ecke 4', sub: 'Südwest', blocks: ['curve_sw'] },
];
export const STAND: Record<StandId, StandDef> = Object.fromEntries(STANDS.map((d) => [d.id, d])) as Record<StandId, StandDef>;
/** Kategorien mit Tribünenpreis (Gästeblock = eigenes Kontingent, eine Preisstufe). */
export const STAND_CATS: SeatCat[] = ['steh', 'sitz', 'dach', 'premium', 'business', 'loge'];
/** Kategorien, für die Topzuschlag/Rabatt eines Spiels gelten (Business/Logen = Saisonverträge). */
export const MATCH_PRICE_CATS: SeatCat[] = ['steh', 'sitz', 'dach', 'premium', 'gast'];
