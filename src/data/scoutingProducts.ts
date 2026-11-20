// =============================================================================
// SCOUTING-SOFTWARE & ABOS (Wunsch Pascal): Datenträger kaufen, in der Neuzeit
// abonnieren – fiktive Produkte je Epoche, Regionen der Welt, Preise.
// -----------------------------------------------------------------------------
// Epochen (grob nach der Geschichte der Spielerbeobachtung):
//   1975–1995  Karteikarten-Archive eines Sportverlags (nur Heimat, Ligen 1–3).
//   1983–2005  Videokassetten-Archive (VHS) mit Spielaufzeichnungen der ersten
//              Ligen West-, Süd- und Nordeuropas – Ostblock vor der Wende kaum.
//   1993–2012  Spielerdatenbanken auf CD-ROM / später DVD: Stand zum Kaufzeit-
//              punkt, jede Saison spürbar veraltet – Neuauflage kaufen.
//   ab 2005    Online-Datenbanken im Abo (laufend aktuell), ab 2009 Video-
//              plattformen mit Spielszenen aller Ligen, ab 2015 Daten- und
//              Leistungsanalyse (Ereignisdaten, Kennzahlen).
// Wirkung: Bekanntheit (game/playerPool.ts `knowledge`) steigt für Spieler der
//   abgedeckten Regionen und Ligaebenen; Kauf altert (`ageRate` je Jahr), Abo
//   wird mit Laufzeit und Epoche genauer (game/scoutSoftware.ts).
// PREISE (grob recherchiert, Wunsch Pascal: realistisch je Epoche): Werte in
//   „1975-DM“ (Kaufkraft 1975) = nominaler Preis ÷ Verbraucherpreisindex des
//   Bezugsjahres (MERCH_CPI); gebucht wird × Verbraucherpreise des Jahres, nicht
//   × Fußballgeld. Bezugspunkte (nominal):
//   - Karteikarten-Archiv 1975 ≈ 2.400 DM je Ausgabe (Verlagsarchiv, Schätzung)
//   - VHS-Archiv 1983 ≈ 9.000 DM je Region (Aufzeichnungen von Agenturen, Schätzung)
//   - CD-ROM-Datenbank 1994 ≈ 18.000 DM je Region; Profi-Ausgabe 1999 ≈ 45.000 DM
//   - Online-Datenbank 2005 ≈ 800 €/Monat; Videoplattform 2009 ≈ 1.700 €/Monat;
//     Leistungsanalyse 2015 ≈ 4.000 €/Monat. Heutige Club-Lizenzen großer
//     Scouting-Plattformen liegen bei rund 15.000–25.000 € im Jahr, Daten-
//     anbieter für Profiklubs bei 30.000–80.000 € (Branchenvergleich
//     footballanalytics.ai, 2025, unbestätigte Schätzungen).
// Namen frei erfunden (keine echten Firmen/Produkte, Wunsch Pascal).
// =============================================================================

export type ScoutRegion = 'heimat' | 'west' | 'sued' | 'nord' | 'ost';

export const SCOUT_REGIONS: ScoutRegion[] = ['heimat', 'west', 'sued', 'nord', 'ost'];

export const REGION_LABEL: Record<ScoutRegion, string> = {
  heimat: 'Heimatland',
  west: 'Westeuropa',
  sued: 'Südeuropa',
  nord: 'Nordeuropa',
  ost: 'Osteuropa',
};

/** Region je Land der Hintergrund-Welt (Schlüssel aus data/world/countries.ts). Heimatland → 'heimat'. */
const REGION_OF: Record<string, ScoutRegion> = {
  Deutschland: 'west', England: 'west', Schottland: 'west', Wales: 'west', Nordirland: 'west', Irland: 'west',
  Frankreich: 'west', Niederlande: 'west', Belgien: 'west', Luxemburg: 'west', Oesterreich: 'west', Schweiz: 'west',
  Italien: 'sued', Spanien: 'sued', Portugal: 'sued', Griechenland: 'sued', Tuerkei: 'sued', Zypern: 'sued', Malta: 'sued', Israel: 'sued',
  Schweden: 'nord', Norwegen: 'nord', Daenemark: 'nord', Finnland: 'nord', Island: 'nord',
  DDR: 'ost', Sowjetunion: 'ost', Russland: 'ost', Ukraine: 'ost', Jugoslawien: 'ost', Serbien: 'ost', Kroatien: 'ost',
  Tschechoslowakei: 'ost', Tschechien: 'ost', Slowakei: 'ost', Polen: 'ost', Ungarn: 'ost', Rumaenien: 'ost', Bulgarien: 'ost', Albanien: 'ost',
};

/** Region eines Landes aus Sicht des Heimatlandes (`homeKey`, DDR zählt bei Heimat Deutschland mit). */
export function regionOfCountry(country: string, homeKey: string): ScoutRegion {
  if (country === homeKey || (homeKey === 'Deutschland' && country === 'DDR')) return 'heimat';
  return REGION_OF[country] ?? 'west';
}

export type ProductKind = 'buy' | 'sub';

export interface ScoutProduct {
  id: string;
  name: string;
  kind: ProductKind;
  /** Träger, wie er in der Liste steht. */
  media: string;
  from: number;
  /** letztes Jahr im Angebot (fehlt = bis heute) */
  until?: number;
  /** Kauf: wählbare Regionen (je Region ein Kauf). Abo: abgedeckte Regionen. */
  regions: ScoutRegion[];
  /** tiefste abgedeckte Ligaebene (1 = nur erste Ligen) */
  maxLevel: number;
  /** Anteil der Wirkung bei Jugendspielern (0 = keine) */
  youth: number;
  /** Zugewinn an Bekanntheit (Anteil der Lücke bis „genau bekannt“) */
  boost: number;
  /** Kauf: Preis je Region; Abo: Monatspreis – beides in 1975-DM (Kaufkraft), siehe oben. */
  price: number;
  /** Kauf: Verlust an Wirkung je Jahr seit dem Stand der Ausgabe */
  ageRate?: number;
  desc: string;
}

export const SCOUT_PRODUCTS: ScoutProduct[] = [
  { id: 'kartei', name: 'Spielerkartei Sportarchiv', kind: 'buy', media: 'Karteikarten', from: 1975, until: 1995,
    regions: ['heimat'], maxLevel: 3, youth: 0, boost: 0.1, price: 2400, ageRate: 0.25,
    desc: 'Ein Schrank voller Karteikarten aus einem Sportverlag: Steckbrief, Einsätze, Tore, ein paar Zeilen der Lokalreporter. Nur Heimatland, keine Jugend.' },
  { id: 'band', name: 'Bandarchiv Europa', kind: 'buy', media: 'Videokassetten', from: 1983, until: 2005,
    regions: ['heimat', 'west', 'sued', 'nord'], maxLevel: 1, youth: 0, boost: 0.13, price: 6500, ageRate: 0.22,
    desc: 'Aufzeichnungen der Erstligaspiele einer Region auf Videokassetten. Hinter den Eisernen Vorhang reicht das Archiv nicht.' },
  { id: 'cd', name: 'Fußballdatei auf CD-ROM', kind: 'buy', media: 'CD-ROM', from: 1993, until: 2012,
    regions: ['heimat', 'west', 'sued', 'nord', 'ost'], maxLevel: 2, youth: 0.3, boost: 0.18, price: 9900, ageRate: 0.2,
    desc: 'Spielerdatenbank einer Region mit Werten der letzten Saison, ein paar Jugendnationalspielern und Fotos. Stand zum Kauf – jede Saison veraltet sie spürbar.' },
  { id: 'cdpro', name: 'Datenkiste Profi', kind: 'buy', media: 'CD-ROM + Video', from: 1998, until: 2012,
    regions: ['heimat', 'west', 'sued', 'nord', 'ost'], maxLevel: 3, youth: 0.5, boost: 0.24, price: 22800, ageRate: 0.2,
    desc: 'Profi-Ausgabe auf mehreren Datenträgern mit Spielszenen, dritten Ligen und Jugendauswahlen. Teuer, nach zwei, drei Jahren überholt.' },
  { id: 'lupe', name: 'Ligalupe Online-Datenbank', kind: 'sub', media: 'Online-Datenbank', from: 2005,
    regions: ['heimat', 'west', 'sued', 'nord', 'ost'], maxLevel: 3, youth: 0.4, boost: 0.2, price: 720,
    desc: 'Laufend aktualisierte Datenbank aller Ligen Europas bis zur dritten Ebene. Monatlich kündbar.' },
  { id: 'vista', name: 'Kickvista Videoplattform', kind: 'sub', media: 'Videoplattform', from: 2009,
    regions: ['heimat', 'west', 'sued', 'nord', 'ost'], maxLevel: 4, youth: 0.7, boost: 0.26, price: 1450,
    desc: 'Spielszenen jedes Spielers bis zur vierten Liga und in den Jugendligen, nach Position durchsuchbar. Monatlich kündbar.' },
  { id: 'werk', name: 'Datenwerk Leistungsanalyse', kind: 'sub', media: 'Datenanalyse', from: 2015,
    regions: ['heimat', 'west', 'sued', 'nord', 'ost'], maxLevel: 2, youth: 0.5, boost: 0.32, price: 3150,
    desc: 'Ereignisdaten und Kennzahlen jeder Aktion in den ersten beiden Ligen – Laufwege, Pressing, erwartete Tore. Monatlich kündbar.' },
];

export const PRODUCT_BY_ID: Record<string, ScoutProduct> = Object.fromEntries(SCOUT_PRODUCTS.map((p) => [p.id, p]));

/** Im Jahr erhältlich? */
export function productOnSale(p: ScoutProduct, year: number): boolean {
  return year >= p.from && (p.until == null || year <= p.until);
}
