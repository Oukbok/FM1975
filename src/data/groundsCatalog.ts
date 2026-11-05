// =============================================================================
// STADIONUMFELD — Katalog (Preise, Freischaltjahre, Wirkungen je Stufe)
// -----------------------------------------------------------------------------
// Alle Geldwerte sind PREISSCHILDER in 1975-DM (Zielniveau: Erstligist 1975 ≈
// 4,5 Mio. DM Umsatz, Ø ≈ 23.000 Zuschauer). Gebucht wird nominal × Skala:
//   • Bau, Unterhalt, Spieltagsposten  × revenueScale('matchday')  (1975 = 1, 2025 ≈ 27)
//   • Handel (Megastore, Onlineshop)   × revenueScale('commercial') × Marke
//   • Strafen, Polizeigebühren          × economyScale               (2025 ≈ 108)
// Begründung: Ein Bauwerk wächst mit dem Geschäft, für das es gebaut wird;
// Spieltagserlöse wuchsen seit 1975 nur etwa 27-fach, der Gesamtmarkt ~100-fach.
//
// Freischaltjahre (Recherche, Okt. 2026):
//   • Fanprojekt: erstes deutsches Fanprojekt 1981 in Bremen; Nationales Konzept
//     Sport und Sicherheit (NKSS) 1993 → Drittelfinanzierung Kommune/Land/DFB
//     (KOS-Sachbericht 2005, kos-fanprojekte.de).
//   • Kombiticket: SC Freiburg + Freiburger Verkehrs-AG ab 1993/94 als Vorreiter
//     (signalarchiv.de, Dok. 10002657).
//   • Fanartikel-Boom Mitte der 1990er, Einbruch 1997/98 (Überangebot), 2002 alle
//     18 Erstligisten zusammen ≈ 70 Mio. €, FC Bayern ≈ 24 Mio. € (Tagesspiegel 2003).
//   • Vereinsmuseum: HSV-Museum im Volksparkstadion 2004 (hsv.de).
//   • Fan-Zone/Public Viewing: Fanmeilen der WM 2006.
//   • Flutlicht-Lizenz: DFL verlangt 1.400 lx (1. Liga) bzw. 1.200 lx (2. Liga),
//     ab 01.07.2019 1.600 lx in der 1. Liga (Ratsvorlage Braunschweig 2017).
//     Frühere Stufen (TV-Tauglichkeit 1988, 1.200 lx ab 2000) sind Annahmen.
//   • Polizeikosten: Bremen verschärft 2014 sein Gebührengesetz, erster Bescheid
//     ≈ 425.000 € für Werder–HSV (April 2015), bestätigt vom BVerwG 2019 und vom
//     BVerfG im Januar 2025 (lto.de, zdfheute.de).
//   • Annahmen ohne Einzelbeleg: Familienblock 1990 (Eventisierung), Ultra-Fanräume
//     1998 (Ultra-Bewegung ab 1997), VIP-Zelt 1985 (wie die ersten Logen im Spiel).
// =============================================================================
import type { IconName } from '../components/iconPaths';
import type { GroundsLocation, GroundsModuleKey } from '../types/grounds';

export type GroundsCategory = 'anreise' | 'handel' | 'fans' | 'medien';

export const GROUNDS_CATEGORIES: { key: GroundsCategory; name: string; icon: IconName }[] = [
  { key: 'anreise', name: 'Anbindung & Anreise', icon: 'transit' },
  { key: 'handel', name: 'Gastronomie & Handel', icon: 'catering' },
  { key: 'fans', name: 'Fanbereich & Sicherheit', icon: 'shield' },
  { key: 'medien', name: 'Hospitality & Medien', icon: 'presse' },
];

export interface GroundsLevelDef {
  name: string;
  /** Ab diesem Jahr baubar. */
  unlock: number;
  /** Baukosten (1975-DM, × Spieltagsskala). Bei Verhandlungen: Vereinsanteil. */
  cost: number;
  /** Unterhalt je Monat (1975-DM, × Spieltagsskala). */
  upkeep: number;
  /** Belegte Fläche (Parzellen) auf dieser Stufe. */
  area: number;
  /** Bauzeit in Tagen. */
  days: number;
  /** Braucht eine Baugenehmigung. */
  permit: boolean;
  /** Ab diesem Ruf baut die KI diese Stufe. */
  aiRep: number;
  // --- Wirkungen (alle optional) ---
  /** Parkplätze (Pkw). */
  spaces?: number;
  /** Zusätzliche Anreisekapazität (Personen je Spiel). */
  transitCap?: number;
  /** Auslastungs-Bonus (Anteil, z. B. 0.02 = +2 Prozentpunkte). */
  att?: number;
  /** Beitrag zur Fan-Stimmung (Zielwert, Punkte). */
  mood?: number;
  /** Senkt das Risiko von Ausschreitungen (Anteil). */
  risk?: number;
  /** Je Zuschauer und Heimspiel (1975-DM): + Erlös, − Kosten. */
  perHead?: number;
  /** Fester Betrag je Heimspiel (1975-DM): + Erlös, − Kosten. */
  perMatch?: number;
  /** Erlös je Monat (1975-DM). */
  monthly?: number;
  /** Business-Plätze (alt, nicht mehr verwendet – Business-Seats und Logen liegen im Stadion). */
  seats?: number;
  /** Hospitality: Aufschlag auf Nachfrage und Preisbereitschaft für Business-Seats und Logen im Stadion (Anteil). */
  vipMult?: number;
  /** Beleuchtungsstärke (Lux). */
  lux?: number;
  /** Marken-Zuwachs je Saison. */
  brand?: { regional?: number; national?: number; international?: number };
}

export interface GroundsModuleDef {
  key: GroundsModuleKey;
  name: string;
  category: GroundsCategory;
  desc: string;
  /** Stufen 1..n (Index 0 = Stufe 1). */
  levels: GroundsLevelDef[];
  /** Lärm/Belastung für Anwohner (0–1) → Protestrisiko. */
  noise: number;
  /** Abnutzung in Zustandspunkten je Monat. */
  wear: number;
  /** Nach so vielen Jahren gilt die Anlage als veraltet (doppelte Abnutzung). */
  lifespan: number;
  /** Ausbau über eine Verhandlung mit der Stadt (ÖPNV). */
  negotiated?: boolean;
  /** Monatliche Erlöse laufen über die Vermarktungsskala × Marke (Handel). */
  commercial?: boolean;
  /** Voraussetzung (Einrichtung in `infrastructure`). */
  requires?: { facility: 'merchandising' | 'catering'; level: number };
  /** Kurzer Quellenhinweis für die Anzeige. */
  source?: string;
}

const L = (d: Partial<GroundsLevelDef> & Pick<GroundsLevelDef, 'name' | 'unlock' | 'cost'>): GroundsLevelDef =>
  ({ upkeep: 0, area: 0, days: 30, permit: false, aiRep: 0, ...d });

export const GROUNDS_MODULES: GroundsModuleDef[] = [
  // ---------------------------------------------------------------- Anreise
  {
    key: 'parking', name: 'Parkplätze', category: 'anreise', noise: 0.6, wear: 0.5, lifespan: 30,
    desc: 'Eigene Stellplätze bringen Parkgebühren und entlasten die Anreise. Ein Parkhaus ist teuer, braucht aber weniger Fläche als ein großer Platz.',
    levels: [
      L({ name: 'Schotterparkplatz', unlock: 1975, cost: 40000, upkeep: 250, area: 3, days: 30, spaces: 900, aiRep: 0 }),
      L({ name: 'Asphaltierter Parkplatz', unlock: 1975, cost: 140000, upkeep: 600, area: 4, days: 75, permit: true, spaces: 1800, aiRep: 60 }),
      L({ name: 'Parkhaus', unlock: 1985, cost: 1100000, upkeep: 2600, area: 2, days: 270, permit: true, spaces: 3500, aiRep: 74 }),
      L({ name: 'Parkhaus mit Leitsystem', unlock: 2000, cost: 1600000, upkeep: 4000, area: 3, days: 300, permit: true, spaces: 6000, aiRep: 82 }),
    ],
  },
  {
    key: 'transit', name: 'ÖPNV-Anbindung', category: 'anreise', noise: 0.5, wear: 0.15, lifespan: 40, negotiated: true,
    desc: 'Busse und Bahnen bringen die Zuschauer ohne Stau. Ab Stufe 2 verhandelst du mit der Stadt – sie zahlt mit, entscheidet aber selbst.',
    source: 'Kombiticket: Freiburg 1993/94 (Zeitungsarchiv)',
    levels: [
      L({ name: 'Sonderbusse (Shuttle)', unlock: 1975, cost: 0, perMatch: -1200, transitCap: 5000, aiRep: 66 }),
      L({ name: 'Sonderzüge & Straßenbahn-Takt', unlock: 1975, cost: 50000, perMatch: -800, transitCap: 11000, att: 0.01, aiRep: 72 }),
      L({ name: 'Kombiticket', unlock: 1993, cost: 0, perHead: -0.05, transitCap: 16000, att: 0.03, aiRep: 64 }),
      L({ name: 'Eigener Stadion-Bahnhof', unlock: 2000, cost: 1000000, upkeep: 600, area: 1, days: 365, permit: true, transitCap: 30000, att: 0.05, aiRep: 84 }),
    ],
  },
  // ---------------------------------------------------------------- Gastronomie & Handel
  {
    key: 'vereinsheim', name: 'Vereinsheim', category: 'handel', noise: 0.3, wear: 0.35, lifespan: 30,
    desc: 'Treffpunkt für Mitglieder und Fans. Die Gaststätte ist verpachtet und bringt monatlich Pacht – auch ohne Spiel.',
    levels: [
      L({ name: 'Vereinsheim', unlock: 1975, cost: 50000, upkeep: 300, area: 1, days: 90, monthly: 1000, mood: 0.5, aiRep: 0 }),
      L({ name: 'Clubhaus mit Gaststätte', unlock: 1975, cost: 160000, upkeep: 700, area: 1, days: 150, permit: true, monthly: 2400, mood: 1, aiRep: 66 }),
      L({ name: 'Clubrestaurant & Eventräume', unlock: 1990, cost: 450000, upkeep: 1500, area: 2, days: 240, permit: true, monthly: 5200, mood: 1.2, aiRep: 78 }),
    ],
  },
  {
    key: 'megastore', name: 'Megastore', category: 'handel', noise: 0.4, wear: 0.4, lifespan: 20, commercial: true,
    requires: { facility: 'merchandising', level: 3 },
    desc: 'Fanartikel auch an spielfreien Tagen. Läuft mit der Marke – und leidet unter Flauten wie dem Einbruch 1997/98.',
    source: 'Fanartikel-Boom Mitte 90er, Einbruch 1997/98 (Tagesspiegel 2003)',
    levels: [
      L({ name: 'Fanshop-Filiale in der City', unlock: 1990, cost: 120000, upkeep: 1000, area: 0, days: 60, monthly: 1200, aiRep: 70 }),
      L({ name: 'Megastore am Stadion', unlock: 1995, cost: 600000, upkeep: 4000, area: 2, days: 210, permit: true, monthly: 3500, brand: { regional: 0.3 }, aiRep: 76 }),
      L({ name: 'Erlebnis-Megastore', unlock: 2008, cost: 1300000, upkeep: 9000, area: 2, days: 240, permit: true, monthly: 6000, brand: { regional: 0.5, national: 0.2 }, aiRep: 84 }),
    ],
  },
  {
    key: 'onlineShop', name: 'Versand & Onlineshop', category: 'handel', noise: 0, wear: 0.6, lifespan: 10, commercial: true,
    desc: 'Vom Katalog zum weltweiten Onlineshop. Je bekannter der Verein, desto mehr Bestellungen – Technik veraltet schnell.',
    levels: [
      L({ name: 'Katalog & Versand', unlock: 1985, cost: 30000, upkeep: 600, days: 45, monthly: 700, aiRep: 72 }),
      L({ name: 'Onlineshop', unlock: 1998, cost: 150000, upkeep: 2500, days: 90, monthly: 2200, brand: { national: 0.2 }, aiRep: 64 }),
      L({ name: 'Onlineshop international', unlock: 2010, cost: 450000, upkeep: 6000, area: 1, days: 150, monthly: 5000, brand: { international: 0.5 }, aiRep: 78 }),
    ],
  },
  {
    key: 'museum', name: 'Vereinsmuseum', category: 'handel', noise: 0.2, wear: 0.2, lifespan: 25,
    desc: 'Pokale, Trikots, Geschichte: Das Museum zieht Besucher an, stärkt die Tradition und die regionale Marke.',
    source: 'Vereinsmuseum in Hamburg 2004 (Vereinsseite)',
    levels: [
      L({ name: 'Vereinsmuseum', unlock: 2004, cost: 450000, upkeep: 1800, area: 1, days: 240, permit: true, monthly: 2400, mood: 1, brand: { regional: 0.6 }, aiRep: 72 }),
      L({ name: 'Erlebnismuseum', unlock: 2012, cost: 1100000, upkeep: 3800, area: 1, days: 300, permit: true, monthly: 5500, mood: 1.5, brand: { regional: 1, national: 0.3 }, aiRep: 82 }),
    ],
  },
  {
    key: 'tours', name: 'Stadionführungen', category: 'handel', noise: 0.1, wear: 0.2, lifespan: 20,
    desc: 'Führungen durch Kabinen, Spielertunnel und Pressebereich. Mit Museum und Dach deutlich gefragter.',
    levels: [
      L({ name: 'Stadionführungen', unlock: 1998, cost: 25000, upkeep: 300, days: 30, monthly: 900, aiRep: 70 }),
      L({ name: 'Arena-Tour mit Kabinen', unlock: 2006, cost: 80000, upkeep: 700, days: 60, monthly: 2200, brand: { national: 0.1 }, aiRep: 78 }),
    ],
  },
  // ---------------------------------------------------------------- Fans & Sicherheit
  {
    key: 'stewards', name: 'Ordnungsdienst', category: 'fans', noise: 0, wear: 0.3, lifespan: 15,
    desc: 'Ordner, Einlasskontrollen und Videoüberwachung senken Ausschreitungen, Strafen und Polizeigebühren. Kosten je Zuschauer.',
    levels: [
      L({ name: 'Vereinsordner', unlock: 1975, cost: 0, aiRep: 0 }),
      L({ name: 'Professioneller Ordnungsdienst', unlock: 1978, cost: 20000, days: 30, perHead: -0.05, risk: 0.25, aiRep: 60 }),
      L({ name: 'Sicherheitsfirma & Videoüberwachung', unlock: 1990, cost: 150000, upkeep: 400, days: 90, perHead: -0.1, risk: 0.4, aiRep: 66 }),
      L({ name: 'Sicherheitszentrale & Stadionverbote', unlock: 2000, cost: 450000, upkeep: 900, area: 1, days: 150, permit: true, perHead: -0.16, risk: 0.55, aiRep: 74 }),
      L({ name: 'Personalisierte Einlasskontrolle', unlock: 2012, cost: 800000, upkeep: 1500, area: 1, days: 180, perHead: -0.22, risk: 0.65, mood: -0.5, aiRep: 84 }),
    ],
  },
  {
    key: 'fanProject', name: 'Fanprojekt', category: 'fans', noise: 0.2, wear: 0.3, lifespan: 25,
    desc: 'Sozialarbeiter begleiten die Fanszene. Wirkt erst nach etwa einem Jahr voll. Ab 1993 (NKSS) tragen Stadt, Land und DFB den Großteil der Kosten.',
    source: 'Bremen 1981, NKSS 1993 (KOS)',
    levels: [
      L({ name: 'Sozialpädagogisches Fanprojekt', unlock: 1981, cost: 15000, upkeep: 1800, days: 60, risk: 0.2, mood: 1.5, aiRep: 70 }),
      L({ name: 'Fanprojekt mit Fanhaus', unlock: 1995, cost: 120000, upkeep: 2200, area: 1, days: 180, permit: true, risk: 0.3, mood: 2.5, aiRep: 74 }),
    ],
  },
  {
    key: 'familyBlock', name: 'Familienblock', category: 'fans', noise: 0.1, wear: 0.3, lifespan: 20,
    desc: 'Ermäßigte Plätze für Familien: mehr Zuschauer und weniger Krawall – aber Rabatte kosten Ticketerlös und die Kurve verliert Stehplätze.',
    levels: [
      L({ name: 'Familienblock', unlock: 1990, cost: 50000, days: 30, perHead: -0.04, att: 0.02, risk: 0.1, aiRep: 62 }),
      L({ name: 'Familienbereich mit Kinderland', unlock: 2000, cost: 220000, upkeep: 600, area: 1, days: 120, perHead: 0.03, att: 0.035, risk: 0.15, mood: 0.5, aiRep: 72 }),
    ],
  },
  {
    key: 'fanZone', name: 'Fan-Zone', category: 'fans', noise: 1, wear: 0.4, lifespan: 15,
    desc: 'Vor dem Spiel feiern, Essen, Großbildleinwand: mehr Umsatz je Zuschauer und bessere Stimmung, aber laut für die Nachbarn.',
    source: 'Fanmeilen der WM 2006',
    levels: [
      L({ name: 'Fan-Zone mit Großbildleinwand', unlock: 2006, cost: 300000, upkeep: 800, area: 2, days: 90, permit: true, perHead: 0.12, perMatch: -2500, mood: 1.5, aiRep: 70 }),
      L({ name: 'Fan-Zone mit Bühne & Public Viewing', unlock: 2010, cost: 700000, upkeep: 1600, area: 2, days: 150, permit: true, perHead: 0.2, perMatch: -4000, mood: 2, aiRep: 80 }),
    ],
  },
  {
    key: 'choreoRoom', name: 'Fanräume & Choreo-Lager', category: 'fans', noise: 0.3, wear: 0.4, lifespan: 20,
    desc: 'Platz für Fahnen, Doppelhalter und Choreos. Die aktive Fanszene dankt es mit Stimmung, der Dialog senkt das Konfliktrisiko.',
    levels: [
      L({ name: 'Fanräume & Choreo-Lager', unlock: 1998, cost: 40000, upkeep: 300, area: 1, days: 45, mood: 1.5, risk: 0.08, aiRep: 66 }),
      L({ name: 'Fanhaus der Kurve', unlock: 2008, cost: 150000, upkeep: 800, area: 1, days: 120, permit: true, mood: 2.5, risk: 0.12, aiRep: 76 }),
    ],
  },
  // ---------------------------------------------------------------- Hospitality & Medien
  {
    key: 'hospitality', name: 'Hospitality', category: 'medien', noise: 0.4, wear: 0.5, lifespan: 20,
    desc: 'Räume, Küche und Service für die Gäste der Business-Seats und Logen im Stadion. Mehr Gäste buchen, und sie zahlen mehr. Ohne Business-Seats oder Logen im Stadion bringt das nichts.',
    levels: [
      L({ name: 'VIP-Zelt', unlock: 1985, cost: 150000, upkeep: 1500, area: 2, days: 60, vipMult: 0.06, aiRep: 72 }),
      L({ name: 'Business-Club', unlock: 1995, cost: 500000, upkeep: 4000, area: 2, days: 240, permit: true, vipMult: 0.15, brand: { national: 0.2 }, aiRep: 74 }),
      L({ name: 'Premium-Hospitality', unlock: 2005, cost: 1200000, upkeep: 7500, area: 3, days: 300, permit: true, vipMult: 0.25, brand: { national: 0.4 }, aiRep: 80 }),
    ],
  },
  {
    key: 'press', name: 'Presse & TV', category: 'medien', noise: 0.2, wear: 0.4, lifespan: 15,
    desc: 'Arbeitsplätze für Presse und Fernsehen. Ab 1992 verlangt die Lizenz in der 1. Liga einen TV-Compound, sonst drohen Auflagen.',
    levels: [
      L({ name: 'Pressetribüne', unlock: 1975, cost: 0, aiRep: 0 }),
      L({ name: 'Pressezentrum', unlock: 1988, cost: 120000, upkeep: 500, area: 1, days: 120, brand: { national: 0.3 }, aiRep: 66 }),
      L({ name: 'TV-Compound', unlock: 1992, cost: 350000, upkeep: 1200, area: 1, days: 150, brand: { national: 0.5 }, aiRep: 70 }),
      L({ name: 'Medienzentrum', unlock: 2008, cost: 800000, upkeep: 2500, area: 1, days: 240, permit: true, brand: { national: 0.6, international: 0.3 }, aiRep: 80 }),
    ],
  },
  {
    key: 'floodlight', name: 'Flutlicht', category: 'medien', noise: 0.8, wear: 0.35, lifespan: 25,
    desc: 'Erlaubt Abendspiele (mehr Zuschauer) und ist TV-Pflicht: Die Lizenz verlangt je Epoche eine Mindest-Beleuchtungsstärke.',
    source: 'DFL: 1.200 lx (2. Liga), 1.400 lx, ab 2019 1.600 lx (1. Liga)',
    levels: [
      L({ name: 'Flutlichtmasten (300 lx)', unlock: 1975, cost: 0, lux: 300, aiRep: 0 }),
      L({ name: 'TV-taugliches Flutlicht (800 lx)', unlock: 1985, cost: 400000, upkeep: 900, days: 120, permit: true, lux: 800, att: 0.005, aiRep: 0 }),
      L({ name: 'Flutlicht 1.200 lx', unlock: 1995, cost: 300000, upkeep: 1200, days: 120, permit: true, lux: 1200, att: 0.01, aiRep: 0 }),
      L({ name: 'Flutlicht 1.400 lx', unlock: 2005, cost: 300000, upkeep: 1400, days: 120, lux: 1400, att: 0.012, aiRep: 0 }),
      L({ name: 'LED-Flutlicht 1.600 lx', unlock: 2014, cost: 250000, upkeep: 700, days: 90, lux: 1600, att: 0.015, aiRep: 0 }),
    ],
  },
];

export const GROUNDS_BY_KEY = Object.fromEntries(GROUNDS_MODULES.map((m) => [m.key, m])) as Record<GroundsModuleKey, GroundsModuleDef>;

// -----------------------------------------------------------------------------
// Lage, Fläche, Grundstück
// -----------------------------------------------------------------------------
export interface LocationDef {
  name: string;
  desc: string;
  /** Grundfläche (Parzellen). */
  area: number;
  /** Anteil der Zuschauer, die zu Fuß kommen. */
  walk: number;
  /** Grund-Anbindung durch Linienverkehr (Personen je Spiel). */
  baseTransit: number;
  /** Wildparken in den Straßen (Personen je Spiel). */
  street: number;
  /** Preis je Parzellen-Paket (1975-DM). */
  landPrice: number;
  /** Höchstzahl an Zukäufen. */
  maxLand: number;
  /** Protestneigung der Anwohner (0–1). */
  protest: number;
  /** Auslastungs-Effekt der Lage. */
  att: number;
}

export const LOCATIONS: Record<GroundsLocation, LocationDef> = {
  innenstadt: { name: 'Innenstadt', desc: 'Kurze Wege, gute Bahnanbindung, viele Fans kommen zu Fuß – aber kaum Platz und empfindliche Nachbarn.', area: 12, walk: 0.32, baseTransit: 14000, street: 4000, landPrice: 400000, maxLand: 1, protest: 0.45, att: 0.02 },
  stadtteil: { name: 'Stadtteil', desc: 'Gewachsenes Wohnviertel: Straßenbahn in der Nähe, etwas Platz, Anwohner nah dran.', area: 18, walk: 0.2, baseTransit: 9000, street: 8000, landPrice: 180000, maxLand: 3, protest: 0.28, att: 0 },
  stadtrand: { name: 'Stadtrand', desc: 'Viel Fläche und günstiges Land, wenige Nachbarn – aber fast alle kommen mit dem Auto.', area: 26, walk: 0.06, baseTransit: 4000, street: 9500, landPrice: 70000, maxLand: 5, protest: 0.12, att: -0.02 },
};

/** Parzellen je Zukauf. */
export const LAND_PARCEL = 2;

/** Belegte Fläche der Einrichtungen aus `infrastructure` (Index = Stufe). */
export const INFRA_AREA: Record<string, number[]> = {
  trainingCenter: [0, 2, 3, 4, 5, 6],
  youthAcademy: [0, 1, 2, 2, 3, 3],
  medical: [0, 0, 0, 1, 1, 1],
  merchandising: [0, 0, 0, 1, 1, 1],
  catering: [0, 0, 0, 0, 1, 1],
  rehaCenter: [0, 0, 1, 1, 1, 1],
  nlz: [0, 0, 2, 2, 2, 3],
  performanceCenter: [0, 0, 1, 1, 1, 1],
};

// -----------------------------------------------------------------------------
// Sicherheit: Grundrisiko je Epoche, Strafen, Polizeigebühren
// -----------------------------------------------------------------------------
/** Wahrscheinlichkeit von Ausschreitungen je Heimspiel ohne Gegenmaßnahmen. */
export function incidentBaseRate(year: number): number {
  if (year < 1980) return 0.04;   // Kuttenzeit
  if (year < 1993) return 0.12;   // Hooligan-Phase der 80er
  if (year < 2005) return 0.06;   // NKSS, Stadionverbote
  if (year < 2015) return 0.09;   // Pyrotechnik der Ultra-Kultur
  return 0.08;
}

/** DFB-Geldstrafe je Schweregrad-Punkt (1975-DM × economyScale). 2025 ≈ 220.000 € bei Schwere 1. */
export const FINE_BASE = 4000;
/** Polizeigebühr eines Hochrisikospiels (1975-DM × economyScale); Bremen 2015 ≈ 425.000 €. */
export const POLICE_FEE_BASE = 18000;

/** Anteil der Länder, die Polizeigebühren erheben (Bremen 2015, BVerfG 2025). */
export function policeFeeShare(year: number): number {
  if (year < 2015) return 0;
  if (year < 2025) return 0.35;
  return 0.7;
}

/** Genehmigungsdauer in Monaten je Epoche (Annahme: Verfahren werden länger). */
export function permitMonths(year: number): number {
  const a: [number, number][] = [[1975, 1.5], [1990, 2.5], [2005, 4], [2020, 6], [2060, 6]];
  for (let i = 0; i < a.length - 1; i++) {
    const [y0, v0] = a[i], [y1, v1] = a[i + 1];
    if (year <= y0) return v0;
    if (year < y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return a[a.length - 1][1];
}

/** Lizenzauflagen (Mindeststufe) je Liga-Ebene und Jahr. */
export function licenseMin(key: 'floodlight' | 'press', tier: number, year: number): number {
  if (tier > 2) return 1;
  if (key === 'floodlight') {
    if (tier === 1) return year >= 2019 ? 5 : year >= 2008 ? 4 : year >= 2000 ? 3 : year >= 1988 ? 2 : 1;
    return year >= 2019 ? 4 : year >= 2008 ? 3 : year >= 1995 ? 2 : 1;
  }
  if (tier === 1) return year >= 1992 ? 3 : year >= 1988 ? 2 : 1;
  return year >= 2000 ? 2 : 1;
}

/** Lizenz-Geldstrafe je Saison und Auflage (1975-DM × economyScale). */
export const LICENSE_FINE = 12000;
