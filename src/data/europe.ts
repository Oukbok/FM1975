// =============================================================================
// EUROPAPOKAL-DATEN (Vorbild Saison 1975/76)
// -----------------------------------------------------------------------------
// Basis-Datensatz fuer die drei europaeischen Wettbewerbe, die es 1975 gab:
//   - Europapokal der Landesmeister  (European Cup)      -> comp 'ec'
//   - Europapokal der Pokalsieger    (Cup Winners' Cup)  -> comp 'cwc'
//   - Europa-Pokal                     (Europa-Verband Cup)          -> comp 'uefa'
//
// Die auslaendischen Vereine werden NICHT als volle `Club`-Objekte gefuehrt,
// sondern als leichte `EuroClub`-Eintraege (nur Name/Stadt/Land/Staerke/Farben).
// Sie werden rein per Staerke simuliert; nur wenn der Spielerverein gegen einen
// von ihnen antritt, wird zur Laufzeit ein voller Kader generiert (siehe Engine).
//
// Die deutschen Teilnehmer sind KEINE Eintraege hier – sie werden dynamisch aus
// dem Spielstand ermittelt (Meister -> EC, Landespokalsieger -> CWC, Liga-Plaetze
// 2..n -> Europa-Verband). Siehe EURO_SPEC.md fuer die exakten Qualifikationsregeln.
//
// Alle genannten Vereine existierten 1975 real. Die Staerken sind plausible
// Spielwerte (Skala ~55–82, vergleichbar mit clubStrengthFor), KEINE exakten
// historischen Tabellenplaetze.
// =============================================================================

export type EuroCompId = 'ec' | 'cwc' | 'uefa';

export interface EuroClub {
  /** Eindeutige ID (Praefix "eu_"), kollidiert nicht mit Club-/SimClub-IDs. */
  id: string;
  name: string;
  shortName: string;
  city: string;
  /** Land (deutscher Anzeigename). */
  country: string;
  /** Spielstaerke (Skala ~55–82). */
  strength: number;
  colors: { primary: string; secondary: string };
  /** Wettbewerb, in dem der Verein 1975/76 antritt. */
  comp: EuroCompId;
}

// -----------------------------------------------------------------------------
// EUROPAPOKAL DER LANDESMEISTER (European Cup) – 15 auslaendische Vereine.
// Zusammen mit dem deutschen Meister ergibt das ein 16er-Feld.
// -----------------------------------------------------------------------------
export const EC_CLUBS: EuroClub[] = [
  { id: 'eu_rma', name: 'Madrid Weiß', shortName: 'MAW', city: 'Madrid', country: 'Spanien', strength: 82, colors: { primary: '#FFFFFF', secondary: '#FEBE10' }, comp: 'ec' },
  { id: 'eu_liv', name: 'Liverpool Rot', shortName: 'LVR', city: 'Liverpool', country: 'England', strength: 82, colors: { primary: '#C8102E', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_ajx', name: 'Amsterdam', shortName: 'AMS', city: 'Amsterdam', country: 'Niederlande', strength: 80, colors: { primary: '#D2122E', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_juv', name: 'Turin Schwarz-Weiß', shortName: 'TSW', city: 'Turin', country: 'Italien', strength: 80, colors: { primary: '#000000', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_ste', name: 'Saint-Étienne', shortName: 'STE', city: 'Saint-Etienne', country: 'Frankreich', strength: 79, colors: { primary: '#009639', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_kyi', name: 'Kiew', shortName: 'KIE', city: 'Kiew', country: 'Sowjetunion', strength: 79, colors: { primary: '#0057B7', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_ben', name: 'Lissabon Rot', shortName: 'LSR', city: 'Lissabon', country: 'Portugal', strength: 78, colors: { primary: '#C8102E', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_psv', name: 'Eindhoven', shortName: 'EIN', city: 'Eindhoven', country: 'Niederlande', strength: 76, colors: { primary: '#ED1C24', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_der', name: 'Derby', shortName: 'DER', city: 'Derby', country: 'England', strength: 76, colors: { primary: '#FFFFFF', secondary: '#000000' }, comp: 'ec' },
  { id: 'eu_ran', name: 'Glasgow Blau', shortName: 'GLB', city: 'Glasgow', country: 'Schottland', strength: 74, colors: { primary: '#1B458F', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_haj', name: 'Split', shortName: 'SPL', city: 'Split', country: 'Jugoslawien', strength: 73, colors: { primary: '#FFFFFF', secondary: '#005DAA' }, comp: 'ec' },
  { id: 'eu_bru', name: 'Brügge', shortName: 'BRG', city: 'Bruegge', country: 'Belgien', strength: 72, colors: { primary: '#005BAC', secondary: '#000000' }, comp: 'ec' },
  { id: 'eu_fer', name: 'Budapest Grün', shortName: 'BPG', city: 'Budapest', country: 'Ungarn', strength: 71, colors: { primary: '#12854A', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_rap', name: 'Wien Grün', shortName: 'WIG', city: 'Wien', country: 'Oesterreich', strength: 68, colors: { primary: '#006A44', secondary: '#FFFFFF' }, comp: 'ec' },
  { id: 'eu_ruc', name: 'Chorzów', shortName: 'CHO', city: 'Chorzow', country: 'Polen', strength: 66, colors: { primary: '#005BAC', secondary: '#FFFFFF' }, comp: 'ec' },
];

// -----------------------------------------------------------------------------
// EUROPAPOKAL DER POKALSIEGER (Cup Winners' Cup) – 15 auslaendische Vereine.
// Zusammen mit dem deutschen Landespokalsieger ergibt das ein 16er-Feld.
// -----------------------------------------------------------------------------
export const CWC_CLUBS: EuroClub[] = [
  { id: 'eu_atm', name: 'Madrid Rot-Weiß', shortName: 'MRW', city: 'Madrid', country: 'Spanien', strength: 76, colors: { primary: '#CB3524', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_and', name: 'Brüssel Lila', shortName: 'BRL', city: 'Bruessel', country: 'Belgien', strength: 76, colors: { primary: '#4C1F2E', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_whu', name: 'London Ost', shortName: 'LOO', city: 'London', country: 'England', strength: 74, colors: { primary: '#7A263A', secondary: '#1BB1E7' }, comp: 'cwc' },
  { id: 'eu_cel', name: 'Glasgow Grün', shortName: 'GLG', city: 'Glasgow', country: 'Schottland', strength: 74, colors: { primary: '#018749', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_rsb', name: 'Belgrad Rot', shortName: 'BGR', city: 'Belgrad', country: 'Jugoslawien', strength: 74, colors: { primary: '#DA291C', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_fio', name: 'Florenz', shortName: 'FLO', city: 'Florenz', country: 'Italien', strength: 72, colors: { primary: '#582C83', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_spo', name: 'Lissabon Grün', shortName: 'LSG', city: 'Lissabon', country: 'Portugal', strength: 72, colors: { primary: '#008057', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_dmo', name: 'Moskau Blau', shortName: 'MOB', city: 'Moskau', country: 'Sowjetunion', strength: 72, colors: { primary: '#0057B7', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_twe', name: 'Enschede', shortName: 'ENS', city: 'Enschede', country: 'Niederlande', strength: 71, colors: { primary: '#E1091B', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_slo', name: 'Bratislava', shortName: 'BRT', city: 'Bratislava', country: 'Tschechoslowakei', strength: 70, colors: { primary: '#0068B4', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_mar', name: 'Marseille', shortName: 'MAR', city: 'Marseille', country: 'Frankreich', strength: 70, colors: { primary: '#2FAEE0', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_pan', name: 'Athen Grün', shortName: 'ATG', city: 'Athen', country: 'Griechenland', strength: 68, colors: { primary: '#0B6E3A', secondary: '#FFFFFF' }, comp: 'cwc' },
  { id: 'eu_fen', name: 'Istanbul Gelb-Blau', shortName: 'IGB', city: 'Istanbul', country: 'Tuerkei', strength: 66, colors: { primary: '#123E7B', secondary: '#FFED00' }, comp: 'cwc' },
  { id: 'eu_sta', name: 'Bukarest Rot-Blau', shortName: 'BUK', city: 'Bukarest', country: 'Rumaenien', strength: 66, colors: { primary: '#CE1126', secondary: '#004A99' }, comp: 'cwc' },
  { id: 'eu_mal', name: 'Malmö', shortName: 'MLM', city: 'Malmoe', country: 'Schweden', strength: 65, colors: { primary: '#6CACE4', secondary: '#FFFFFF' }, comp: 'cwc' },
];

// -----------------------------------------------------------------------------
// EUROPA-POKAL (Europa-Verband Cup) – 29 auslaendische Vereine.
// Zusammen mit 3 deutschen Vereinen (Liga-Plaetze 2..4, mit Kaskade) ergibt das
// ein 32er-Feld.
// -----------------------------------------------------------------------------
export const UEFA_CLUBS: EuroClub[] = [
  { id: 'eu_bar', name: 'Barcelona', shortName: 'BAR', city: 'Barcelona', country: 'Spanien', strength: 80, colors: { primary: '#004D98', secondary: '#A50044' }, comp: 'uefa' },
  { id: 'eu_lee', name: 'Leeds', shortName: 'LEE', city: 'Leeds', country: 'England', strength: 78, colors: { primary: '#FFFFFF', secondary: '#1D428A' }, comp: 'uefa' },
  { id: 'eu_int', name: 'Mailand Blau-Schwarz', shortName: 'MBS', city: 'Mailand', country: 'Italien', strength: 76, colors: { primary: '#0068A8', secondary: '#000000' }, comp: 'uefa' },
  { id: 'eu_acm', name: 'Mailand Rot-Schwarz', shortName: 'MRS', city: 'Mailand', country: 'Italien', strength: 76, colors: { primary: '#FB090B', secondary: '#000000' }, comp: 'uefa' },
  { id: 'eu_fey', name: 'Rotterdam', shortName: 'ROT', city: 'Rotterdam', country: 'Niederlande', strength: 76, colors: { primary: '#E30613', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_ips', name: 'Ipswich', shortName: 'IPS', city: 'Ipswich', country: 'England', strength: 74, colors: { primary: '#0033A0', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_eve', name: 'Liverpool Blau', shortName: 'LVB', city: 'Liverpool', country: 'England', strength: 72, colors: { primary: '#003399', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_tor', name: 'Turin Granat', shortName: 'TGR', city: 'Turin', country: 'Italien', strength: 72, colors: { primary: '#8A1538', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_nap', name: 'Neapel', shortName: 'NEA', city: 'Neapel', country: 'Italien', strength: 71, colors: { primary: '#12A0D7', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_tot', name: 'London Nord', shortName: 'LON', city: 'London', country: 'England', strength: 71, colors: { primary: '#FFFFFF', secondary: '#132257' }, comp: 'uefa' },
  { id: 'eu_por', name: 'Porto', shortName: 'POR', city: 'Porto', country: 'Portugal', strength: 71, colors: { primary: '#00428C', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_ath', name: 'Bilbao', shortName: 'BIL', city: 'Bilbao', country: 'Spanien', strength: 70, colors: { primary: '#EE2523', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_upe', name: 'Budapest Lila', shortName: 'BPL', city: 'Budapest', country: 'Ungarn', strength: 70, colors: { primary: '#5C2D91', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_tbi', name: 'Tiflis', shortName: 'TIF', city: 'Tiflis', country: 'Sowjetunion', strength: 70, colors: { primary: '#0057B7', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_diz', name: 'Zagreb', shortName: 'ZAG', city: 'Zagreb', country: 'Jugoslawien', strength: 70, colors: { primary: '#0057B7', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_gor', name: 'Zabrze', shortName: 'ZAB', city: 'Zabrze', country: 'Polen', strength: 68, colors: { primary: '#003DA5', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_sto', name: 'Stoke', shortName: 'STO', city: 'Stoke-on-Trent', country: 'England', strength: 68, colors: { primary: '#E03A3E', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_std', name: 'Lüttich', shortName: 'LÜT', city: 'Luettich', country: 'Belgien', strength: 68, colors: { primary: '#E30613', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_zar', name: 'Saragossa', shortName: 'SAR', city: 'Saragossa', country: 'Spanien', strength: 68, colors: { primary: '#FFFFFF', secondary: '#0033A0' }, comp: 'uefa' },
  { id: 'eu_oly', name: 'Piräus', shortName: 'PRS', city: 'Piraeus', country: 'Griechenland', strength: 68, colors: { primary: '#E30613', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_ban', name: 'Ostrava', shortName: 'OST', city: 'Ostrava', country: 'Tschechoslowakei', strength: 66, colors: { primary: '#0068B4', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_aus', name: 'Wien Violett', shortName: 'WIV', city: 'Wien', country: 'Oesterreich', strength: 66, colors: { primary: '#520E36', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_nic', name: 'Nizza', shortName: 'NIZ', city: 'Nizza', country: 'Frankreich', strength: 66, colors: { primary: '#E30613', secondary: '#000000' }, comp: 'uefa' },
  { id: 'eu_lyo', name: 'Lyon', shortName: 'LYO', city: 'Lyon', country: 'Frankreich', strength: 66, colors: { primary: '#FFFFFF', secondary: '#E30613' }, comp: 'uefa' },
  { id: 'eu_hib', name: 'Edinburgh Grün', shortName: 'EDG', city: 'Edinburgh', country: 'Schottland', strength: 66, colors: { primary: '#005E2E', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_zur', name: 'Zürich', shortName: 'ZÜR', city: 'Zuerich', country: 'Schweiz', strength: 64, colors: { primary: '#FFFFFF', secondary: '#0033A0' }, comp: 'uefa' },
  { id: 'eu_dun', name: 'Dundee', shortName: 'DUN', city: 'Dundee', country: 'Schottland', strength: 64, colors: { primary: '#FF6600', secondary: '#000000' }, comp: 'uefa' },
  { id: 'eu_pao', name: 'Saloniki', shortName: 'SAL', city: 'Saloniki', country: 'Griechenland', strength: 63, colors: { primary: '#000000', secondary: '#FFFFFF' }, comp: 'uefa' },
  { id: 'eu_nim', name: 'Nîmes', shortName: 'NÎM', city: 'Nimes', country: 'Frankreich', strength: 62, colors: { primary: '#E30613', secondary: '#FFFFFF' }, comp: 'uefa' },
];

/** Alle auslaendischen Europapokal-Vereine als ein Datensatz (Map id -> EuroClub). */
export function allEuroClubs(): Record<string, EuroClub> {
  const out: Record<string, EuroClub> = {};
  for (const c of [...EC_CLUBS, ...CWC_CLUBS, ...UEFA_CLUBS]) out[c.id] = c;
  return out;
}

/** Anzahl auslaendischer Startplaetze je Wettbewerb (Rest fuellen deutsche Klubs). */
export const EURO_FOREIGN_COUNT: Record<EuroCompId, number> = {
  ec: EC_CLUBS.length,     // 15  -> +1 dt. Meister      = 16
  cwc: CWC_CLUBS.length,   // 15  -> +1 dt. Pokalsieger  = 16
  uefa: UEFA_CLUBS.length, // 29  -> +3 dt. (Liga 2..4)  = 32
};

/** Anzahl deutscher Startplaetze je Wettbewerb. */
export const EURO_GERMAN_SLOTS: Record<EuroCompId, number> = { ec: 1, cwc: 1, uefa: 3 };

/** Anzeigenamen der Wettbewerbe. */
export const EURO_COMP_NAMES: Record<EuroCompId, string> = {
  ec: 'Pokal der Landesmeister',
  cwc: 'Pokal der Pokalsieger',
  uefa: 'Europa-Pokal',
};

/** Kurznamen der Wettbewerbe (fuer enge UI / Tabellen-Legende). */
export const EURO_COMP_SHORT: Record<EuroCompId, string> = {
  ec: 'Landesmeister-Pokal',
  cwc: 'Pokalsieger-Pokal',
  uefa: 'Europa-Pokal',
};

// -----------------------------------------------------------------------------
// HISTORISCHER SAAT-SATZ FUER DIE ERSTE SAISON 1975/76
// -----------------------------------------------------------------------------
// Ab 1976/77 werden die deutschen Teilnehmer dynamisch aus dem Spielstand
// ermittelt. Fuer die ALLERERSTE Saison gibt es noch keine gespielte Vorsaison,
// darum werden die realen deutschen Europapokal-Starter 1975/76 fest gesetzt
// (basierend auf der Saison 1974/75): Club-IDs aus CLUB_SEEDS (src/data/generate.ts).
//   Meister 1974/75            = Moenchengladbach -> 'mgl'  (EC)
//   Landespokalsieger 1974/75    = Frankfurt Rot            -> 'fra'  (CWC)
//   Europa-Pokal (Liga 2..4)     = Berlin Blau / Offenbach / Duisburg
//                                -> 'ber', 'off', 'dui'
// -----------------------------------------------------------------------------
export const EURO_FIRST_SEASON_GERMAN: Record<EuroCompId, string[]> = {
  ec: ['mgl'],
  cwc: ['fra'],
  uefa: ['ber', 'off', 'dui'],
};
