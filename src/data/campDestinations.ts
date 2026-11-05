// =============================================================================
// TRAININGSLAGER – Ziele mit historischer Freischaltung (Unterkünfte/Anlagen in
// data/campLodgings.ts, Rechnung in engine/trainingCamp.ts, Spielablauf in
// game/trainingCampGame.ts).
//
// Quellen (Stand Oktober/November 2026):
//  [C1] fcbayern.com/museum, „Trainingslager“ (01/2016): Trainingslager seit den 1970ern,
//       Rottach-Egern am Tegernsee klassisches Ziel bis ins neue Jahrtausend, VAE in den
//       1980ern gelegentlich, unter Klinsmann Dubai, zuletzt mehrfach Doha (Katar).
//  [C2] bayer04.de, „30 years ago: first winter training camp in the USA“: Winterlager der
//       80er meist auf den Kanaren, vorher Training auf gefrorenem Boden (Timmendorfer
//       Strand, −10 °C); Januar 1992 erstes Winterlager in Florida (Orlando).
//  [C3] weser-kurier.de, „Treffpunkt Türkei“ (01/2015): Schalke 04 eröffnete 1992 die
//       Türkei-Touren; 2015 bereitet sich ein Drittel der Bundesliga in Belek vor.
//  [C4] abendzeitung-muenchen.de, „FC Bayern plant wieder Winter-Trainingslager in Katar“:
//       Katar seit 2011, Corona-Ausfall zwei Jahre, Kritik (Menschenrechte, Qatar Airways,
//       Mitgliederversammlung 2021).
//  [C5] abendzeitung-muenchen.de, „Die Bayern in Dubai“ (01/2009): Bayern in Dubai.
//  [C6] web.de, „Fußballklubs: Sommertour …“ (2018): Bayern-Engagement China ab 2014,
//       Asienreise 2017 (12 Tage, ~10 Mio. € Erlös), Hoeneß: „grenzwertig“, USA-Touren.
//  [C7] sport1.de, „Winterfahrplan der Bundesligisten 2020“: 2020 v. a. Spanien
//       (Marbella, La Manga, Mallorca, Jerez), Portugal (Algarve), Malta, Florida, Doha.
//  [C8] sportschule-hennef.de „Geschichte“ + kuladig.de (Objekt Sportschule Hennef):
//       eröffnet 10.9.1950 (Fußball-Verband Mittelrhein), Mehrzweckhalle mit Kunstrasen
//       1965, Hallenbad 1968, Bettenhaus 1971, Modernisierung 1980, Hallenkomplex 2000,
//       Kunstrasenplatz 2005, Haus Schleiden 2006; DFB-Lehrgänge 1954, 1989, 1995.
//  [C9] sportschule-wedau.de „International guest“: Sportschule Wedau (Fußballverband
//       Niederrhein, Duisburg) „größte Sportschule Deutschlands“, ~400 Betten, Wald,
//       Regattabahn.
// [C10] sportcentrum-kamenkaiserau.de („SportHotel und SportSchule eng verzahnt“, „Von
//       Beckenbauer bis Ronaldo“) + en.wikipedia „SportCentrum Kaiserau“ (Sitz des
//       FLVW; EM-Quartier Albaniens 2024).
// [C11] sport1.de (07/2024) „An diesem Ort erlebten Hoeneß & Co. …“: Sportschule Malente,
//       DFB-Quartier zur WM 1974 (ab 29.5., 19 Tage) – spartanisch, abgeschieden, viel
//       Freizeit, „belagerte Festung“.
// [C12] bayer04.de „From the archives – 50 years ago: a pre-season debacle“: Juli 1976
//       Lager in Quickborn (Schleswig-Holstein), Testsiege 5:0/6:0 gegen Amateure, danach
//       0:7 – das harte Konditionslager „zehrt noch“ (Trainer Kremer).
// [C13] volksstimme.de (1. FC Magdeburg, Trainingslager früher): Steigerungsläufe im Harz.
// [C14] schwarzwald-tourismus.info „Welche Teams wo im Schwarzwald residierten“:
//       Brasilien 1974 im Leistungszentrum Herzogenhorn (≈1.350 m), DFB 1982 am Schluchsee
//       (Lager mit „Vorkommnissen“), Niederlande 2006 in Hinterzarten.
// [C15] outdoor-magazin.com (07/2023) „Die Trainingslager der Bundesligisten“: Tegernsee/
//       Rottach-Egern, Bruneck, Saalfelden, Maria Alm, Seefeld, Kitzbühel, Schladming,
//       Zell-Gerlos (Zillertal), Montafon, Windischgarsten.
// [C16] meinbezirk.at (07/2026): Werder Bremen seit ~15 Jahren im Zillertal (Zell-Gerlos).
// [C17] swissinfo.ch (2010) „Football teams head to Alps before World Cup“: Crans-Montana,
//       Bad Ragaz, Saas-Fee (~1.800 m) zur Höhenvorbereitung.
// [C18] horizont.net: St. Moritz offizielles Höhentrainingszentrum von Swiss Olympic.
// [C19] sport1.de (05/2018) „Darum zieht es Löw immer wieder nach Südtirol“: DFB 1990
//       Kaltern, 2010/2018 Eppan, 2014 Passeiertal – Infrastruktur, Klima, Teamgeist.
// [C20] lamangaclub.com: La Manga Club mit acht Fußballplätzen; Winter 2020 über 60
//       Mannschaften aus 20 Ländern. [C21] hsv.de / bayer04.de: HSV und Leverkusen im
//       Winterlager La Manga.
// [C22] bundesliga.com, Winter-Liveticker 12.–14.01.2015: VfL Wolfsburg in Kapstadt (4:1 gegen
//       Ajax Cape Town), TSG Hoffenheim in Südafrika (Test gegen University of Pretoria).
// [C23] t-online.de (02.01.2019) „Werder Bremen: Abflug nach Südafrika“: zehn Tage Johannesburg
//       (3.–12.1.), Training auf der Anlage des FC Randburg; pressreader/Daily News (11.01.2019):
//       Bremen wählt Südafrika auch, um Fans zu gewinnen.
// Lage der Orte (geo): Breiten-/Längengrad des erstgenannten Ortes (gerundet, Ortsmitte).
// Annahmen sind als „Annahme“ markiert. Preise in 1975-Basis (Buchung × economyScale),
// kalkuliert für einen Tross von ~30 Personen (Erstligist 1975 ≈ 4,5 Mio. DM Umsatz).
// Reise = An- und Abreise des Trosses; Tagessätze stehen bei den Unterkünften.
// =============================================================================
import type { CampSeason } from '../game/winterShared';

export type CampRegion = 'inland' | 'kueste' | 'mittelgebirge' | 'alpen' | 'sueden' | 'fern';
export type CampOpp = 'amateur' | 'regional' | 'international' | 'top';
export type CampTransport = 'bus' | 'bahn' | 'flug';
export type CampClimate =
  | 'flachland' | 'kueste' | 'mittelgebirge' | 'alpen' | 'hochalpen'
  | 'mittelmeer' | 'atlantik' | 'golf' | 'florida' | 'asien' | 'usa' | 'kap';

export interface CampDestination {
  id: string;
  name: string;
  /** Lage für die Karte im Planer: [Breitengrad, Längengrad] des erstgenannten Ortes. */
  geo: [number, number];
  place: string;
  country: string;
  region: CampRegion;
  seasons: CampSeason[];
  /** Zugang je Epoche: ab Jahr X für Vereine ab Ansehen Y (letzter passender Eintrag gilt). */
  access: { from: number; minRep: number }[];
  /** Nicht verfügbar in diesen Jahren (z. B. Corona-Reisebeschränkungen). */
  closed?: number[];
  climate: CampClimate;
  /** Höhe des Ortes (m); Unterkünfte können abweichen. */
  altitude: number;
  transport: CampTransport;
  /** Reisestunden je Richtung (Bus/Bahn) bzw. Flugstunden. */
  travelH: number;
  /** Zeitverschiebung zu Deutschland (Stunden). */
  tz: number;
  /** An-/Abreise des Trosses (1975-Basis). */
  travel: number;
  /** Testgegner vor Ort und Erlös je Testspiel (1975-Basis, Durchschnittsverein). */
  opp: CampOpp;
  testIncome: number;
  /** Marketingwirkung (internationale Marke, Sponsoring) 0–1. */
  marketing: number;
  /** Fan-/Medienrummel vor Ort 0–1 (Zaungäste, Presse, Berater, Touristen). */
  buzz: number;
  /** Fan-/Medienkritik ab Jahr X (Abzug Fan-Stimmung). */
  criticism?: { from: number; fan: number; text: string }[];
  note: string;
}

const both: CampSeason[] = ['summer', 'winter'];
const S: CampSeason[] = ['summer'];
const W: CampSeason[] = ['winter'];
const from = (y: number, rep = 0) => [{ from: y, minRep: rep }];

export const CAMP_DESTINATIONS: CampDestination[] = [
  // --- Sportschulen der Landesverbände: günstig, viele Plätze, im Winter Hallen -------
  {
    id: 'sportschule', name: 'Sportschule Kaiserau', geo: [51.59, 7.66], place: 'Kamen (Westfalen)', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'flachland', altitude: 70, transport: 'bus', travelH: 2, tz: 0, travel: 1200,
    opp: 'amateur', testIncome: 2500, marketing: 0, buzz: 0.25,
    note: 'Sportschule des Westfälischen Verbands, SportHotel und Schule eng verzahnt; Gäste von Weltmeistern bis zu brasilianischen Weltstars [C10]. Nah an den Revierklubs.',
  },
  {
    id: 'hennef', name: 'Sportschule Hennef', geo: [50.78, 7.28], place: 'Hennef (Sieg)', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'flachland', altitude: 70, transport: 'bus', travelH: 3, tz: 0, travel: 1300,
    opp: 'amateur', testIncome: 2500, marketing: 0, buzz: 0.15,
    note: 'Seit 1950 Schule des Mittelrhein-Verbands; schon 1965 eine Halle mit Kunstrasen, 1968 ein Hallenbad – im Winter ein echter Vorteil [C8].',
  },
  {
    id: 'wedau', name: 'Sportschule Wedau', geo: [51.4, 6.78], place: 'Duisburg', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'flachland', altitude: 30, transport: 'bus', travelH: 2, tz: 0, travel: 1200,
    opp: 'amateur', testIncome: 2500, marketing: 0, buzz: 0.3,
    note: 'Die größte Sportschule Deutschlands: rund 400 Betten, viele Plätze, Wald und Regattabahn für Läufe [C9]. Mitten in der Großstadt.',
  },
  {
    id: 'gruenberg', name: 'Sportschule Grünberg', geo: [50.59, 8.96], place: 'Grünberg (Mittelhessen)', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'flachland', altitude: 270, transport: 'bus', travelH: 3, tz: 0, travel: 1300,
    opp: 'amateur', testIncome: 2200, marketing: 0, buzz: 0.1,
    note: 'Sportschule des Hessischen Verbands am Rand des Vogelsbergs: ruhig, waldreich, wenig Ablenkung (Annahme: Betrieb seit den 50ern).',
  },
  {
    id: 'barsinghausen', name: 'Sportschule Barsinghausen', geo: [52.3, 9.46], place: 'Barsinghausen (Deister)', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'flachland', altitude: 120, transport: 'bus', travelH: 3, tz: 0, travel: 1300,
    opp: 'amateur', testIncome: 2200, marketing: 0, buzz: 0.1,
    note: 'Niedersachsens Verbandssportschule am Deister – Waldläufe am Berg direkt vor der Tür (Annahme: Betrieb seit den 50ern; Sporthotel später).',
  },
  {
    id: 'malente', name: 'Sportschule Malente', geo: [54.17, 10.56], place: 'Malente (Holsteinische Schweiz)', country: 'Deutschland', region: 'inland',
    seasons: both, access: from(1975), climate: 'kueste', altitude: 30, transport: 'bus', travelH: 5, tz: 0, travel: 1600,
    opp: 'amateur', testIncome: 2200, marketing: 0, buzz: 0.1,
    note: 'Das WM-Quartier von 1974: spartanisch, abgeschieden zwischen Seen, viel Zeit miteinander – der „Geist von Malente“ [C11].',
  },
  // --- Küste: Dünenläufe der 70er, Seeluft, im Sommer Urlauber ----------------------------
  {
    id: 'norderney', name: 'Norderney', geo: [53.71, 7.15], place: 'Norderney (Nordsee)', country: 'Deutschland', region: 'kueste',
    seasons: S, access: from(1975), climate: 'kueste', altitude: 5, transport: 'bahn', travelH: 6, tz: 0, travel: 2200,
    opp: 'amateur', testIncome: 3000, marketing: 0.01, buzz: 0.35,
    note: 'Dünenläufe und Seeluft – der Klassiker der harten Sommervorbereitung (Annahme). Mit Fähre, Plätze eher mäßig, Testspiele vor Urlaubern.',
  },
  {
    id: 'sylt', name: 'Sylt', geo: [54.91, 8.31], place: 'Westerland / Rantum', country: 'Deutschland', region: 'kueste',
    seasons: S, access: from(1975), climate: 'kueste', altitude: 5, transport: 'bahn', travelH: 7, tz: 0, travel: 2600,
    opp: 'amateur', testIncome: 3500, marketing: 0.02, buzz: 0.5,
    note: 'Dünen, Strand – und das Nachtleben von Westerland. Wer in Rantum wohnt, hat Ruhe; wer im Zentrum wohnt, hat Gesellschaft (Annahme).',
  },
  {
    id: 'timmendorf', name: 'Timmendorfer Strand', geo: [53.99, 10.78], place: 'Timmendorfer Strand (Ostsee)', country: 'Deutschland', region: 'kueste',
    seasons: both, access: from(1975), climate: 'kueste', altitude: 5, transport: 'bus', travelH: 5, tz: 0, travel: 1600,
    opp: 'amateur', testIncome: 2800, marketing: 0.01, buzz: 0.3,
    note: 'Im Sommer Strandläufe, im Winter Training auf gefrorenem Boden – so bei Leverkusen noch Anfang der 90er bei −10 °C [C2]. Testgegner aus dem Amateurlager wie 1976 in Quickborn [C12].',
  },
  // --- Mittelgebirge: Bergläufe, Wald, günstige Gasthöfe -----------------------------------
  {
    id: 'harz', name: 'Harz', geo: [51.73, 10.61], place: 'Braunlage / Bad Lauterberg', country: 'Deutschland', region: 'mittelgebirge',
    seasons: both, access: from(1975), climate: 'mittelgebirge', altitude: 600, transport: 'bus', travelH: 4, tz: 0, travel: 1400,
    opp: 'amateur', testIncome: 2200, marketing: 0, buzz: 0.1,
    note: 'Steigerungsläufe am Berg wie bei Magdeburg im Harz [C13]. Im Winter Schnee – dann bleiben Halle und Waldwege.',
  },
  {
    id: 'schwarzwald', name: 'Schwarzwald', geo: [47.9, 8.1], place: 'Hinterzarten / Schluchsee / Feldberg', country: 'Deutschland', region: 'mittelgebirge',
    seasons: both, access: from(1975), climate: 'mittelgebirge', altitude: 900, transport: 'bus', travelH: 5, tz: 0, travel: 1600,
    opp: 'regional', testIncome: 3000, marketing: 0.01, buzz: 0.15,
    note: 'Brasilien bereitete sich 1974 im Leistungszentrum Herzogenhorn auf rund 1.350 m vor, der DFB 1982 am Schluchsee – mit bekannten „Vorkommnissen“ [C14].',
  },
  {
    id: 'sauerland', name: 'Sauerland', geo: [51.19, 8.53], place: 'Winterberg / Schmallenberg', country: 'Deutschland', region: 'mittelgebirge',
    seasons: both, access: from(1975), climate: 'mittelgebirge', altitude: 700, transport: 'bus', travelH: 3, tz: 0, travel: 1300,
    opp: 'amateur', testIncome: 2200, marketing: 0, buzz: 0.15,
    note: 'Kurz vor der Haustür der Westklubs: Waldläufe, Höhenwege, im Winter Schnee (Annahme). Günstig – und Fans fahren mal eben hin.',
  },
  // --- Alpen (Sommer): Höhenluft, Testspiele vor Urlaubern --------------------------------
  {
    id: 'tegernsee', name: 'Tegernsee', geo: [47.69, 11.77], place: 'Rottach-Egern / Kreuth', country: 'Deutschland', region: 'alpen',
    seasons: S, access: from(1975), climate: 'alpen', altitude: 750, transport: 'bus', travelH: 6, tz: 0, travel: 1800,
    opp: 'regional', testIncome: 4000, marketing: 0.02, buzz: 0.45,
    note: 'Klassiker seit den 70ern – Rottach-Egern bei München Rot bis ins neue Jahrtausend [C1], 2023 wieder München Rot und Mönchengladbach [C15]. Viele Zaungäste.',
  },
  {
    id: 'tirol', name: 'Tirol', geo: [47.33, 11.19], place: 'Seefeld / Kitzbühel', country: 'Österreich', region: 'alpen',
    seasons: S, access: from(1977), // Annahme: ab Ende der 70er üblich
    climate: 'alpen', altitude: 1180, transport: 'bus', travelH: 8, tz: 0, travel: 2600,
    opp: 'regional', testIncome: 5000, marketing: 0.04, buzz: 0.35,
    note: 'Höhenluft auf knapp 1.200 m, gute Plätze, Testspiele gegen österreichische Klubs; 2023 Wolfsburg in Seefeld, Hoffenheim in Kitzbühel [C15].',
  },
  {
    id: 'zillertal', name: 'Zillertal', geo: [47.23, 11.88], place: 'Zell am Ziller / Gerlos', country: 'Österreich', region: 'alpen',
    seasons: S, access: from(1977), climate: 'alpen', altitude: 600, transport: 'bus', travelH: 8, tz: 0, travel: 2600,
    opp: 'regional', testIncome: 4500, marketing: 0.03, buzz: 0.3,
    note: 'Tal mit Tradition: Ein Bundesligist aus dem Norden kommt seit rund 15 Jahren nach Zell-Gerlos [C16]. Gasthöfe im Talschluss oder Sporthotels im Ort.',
  },
  {
    id: 'salzburgerland', name: 'Salzburger Land', geo: [47.43, 12.85], place: 'Saalfelden / Maria Alm / Leogang', country: 'Österreich', region: 'alpen',
    seasons: S, access: from(1977), climate: 'alpen', altitude: 750, transport: 'bus', travelH: 7, tz: 0, travel: 2500,
    opp: 'regional', testIncome: 4500, marketing: 0.03, buzz: 0.25,
    note: 'Pinzgau unter dem Steinernen Meer – 2023 Leverkusen in Saalfelden, Köln in Maria Alm [C15]. Später Gutshöfe mit eigenen Plätzen.',
  },
  {
    id: 'steiermark', name: 'Steiermark', geo: [47.39, 13.69], place: 'Schladming / Bad Waltersdorf', country: 'Österreich', region: 'alpen',
    seasons: S, access: from(1980), // Annahme
    climate: 'alpen', altitude: 750, transport: 'bus', travelH: 9, tz: 0, travel: 2700,
    opp: 'regional', testIncome: 4000, marketing: 0.03, buzz: 0.2,
    note: 'Schladming am Dachstein (2023 Augsburg und Mainz [C15]) oder Thermenhotels in der Oststeiermark (Annahme) – gute Regeneration.',
  },
  {
    id: 'kaernten', name: 'Kärnten', geo: [46.61, 14.04], place: 'Velden / Wörthersee', country: 'Österreich', region: 'alpen',
    seasons: S, access: from(1977), // Annahme
    climate: 'alpen', altitude: 450, transport: 'bus', travelH: 10, tz: 0, travel: 2800,
    opp: 'regional', testIncome: 4500, marketing: 0.04, buzz: 0.5,
    note: 'Wörthersee: warmes Wasser, Seepromenade, Kasino – angenehm für die Stimmung, schwierig für die Disziplin (Annahme).',
  },
  {
    id: 'schweiz', name: 'Schweizer Alpen', geo: [46.31, 7.48], place: 'Crans-Montana / Bad Ragaz', country: 'Schweiz', region: 'alpen',
    seasons: S, access: from(1980), // Annahme
    climate: 'alpen', altitude: 1500, transport: 'bus', travelH: 8, tz: 0, travel: 3000,
    opp: 'international', testIncome: 5000, marketing: 0.05, buzz: 0.2,
    note: 'Teurer als Österreich, dafür ruhiger; WM-Teams 2010 in Crans-Montana und Bad Ragaz [C17]. Testspiele gegen Schweizer Erstligisten.',
  },
  {
    id: 'engadin', name: 'Höhentraining Engadin/Wallis', geo: [46.5, 9.84], place: 'St. Moritz / Saas-Fee', country: 'Schweiz', region: 'alpen',
    seasons: S, access: [{ from: 1980, minRep: 65 }, { from: 1992, minRep: 0 }], // Annahme: Höhentraining im Fußball zunächst bei Ambitionierten
    climate: 'hochalpen', altitude: 1850, transport: 'bus', travelH: 9, tz: 0, travel: 3200,
    opp: 'regional', testIncome: 3500, marketing: 0.04, buzz: 0.15,
    note: 'Höhentraining auf rund 1.800 m: St. Moritz ist Höhentrainingszentrum von Swiss Olympic [C18], Japan bereitete sich 2010 in Saas-Fee vor [C17]. Die Wirkung kommt verzögert.',
  },
  {
    id: 'suedtirol', name: 'Südtirol', geo: [46.47, 11.26], place: 'Eppan / Passeiertal / Bruneck', country: 'Italien', region: 'alpen',
    seasons: S, access: from(1980), // Annahme
    climate: 'alpen', altitude: 600, transport: 'bus', travelH: 9, tz: 0, travel: 2800,
    opp: 'regional', testIncome: 4000, marketing: 0.03, buzz: 0.25,
    note: 'Gute Küche, Wein, Klima: der DFB 1990 in Kaltern, 2010/2018 in Eppan, 2014 im Passeiertal [C19]; 2023 Leipzig und Bochum in Bruneck [C15].',
  },
  // --- Süden (Winter) ---------------------------------------------------------------------
  {
    id: 'kanaren', name: 'Kanarische Inseln', geo: [27.76, -15.59], place: 'Gran Canaria / Teneriffa', country: 'Spanien', region: 'sueden',
    seasons: W, access: from(1980), climate: 'atlantik', altitude: 50, transport: 'flug', travelH: 4.5, tz: -1, travel: 9000,
    opp: 'regional', testIncome: 3000, marketing: 0.03, buzz: 0.3,
    note: 'In den 80ern das typische Winterziel – Leverkusen fuhr fast jedes Jahr hin [C2]. Mildes Klima, Plätze lange nicht überall gut.',
  },
  {
    id: 'spanien', name: 'Andalusien', geo: [36.51, -4.88], place: 'Marbella / Jerez', country: 'Spanien', region: 'sueden',
    seasons: W, access: from(1982), // Annahme analog zu den Kanaren [C2]; 2020 Marbella/Jerez [C7]
    climate: 'mittelmeer', altitude: 50, transport: 'flug', travelH: 3, tz: 0, travel: 7500,
    opp: 'international', testIncome: 4000, marketing: 0.04, buzz: 0.35,
    note: 'Seit den 80ern im Kommen, heute das häufigste Winterziel der Bundesliga (2020: elf Vereine in Spanien [C7]). Marbella glänzt, Jerez ist ruhiger.',
  },
  {
    id: 'mallorca', name: 'Mallorca', geo: [39.57, 2.65], place: 'Palma / Inselinneres', country: 'Spanien', region: 'sueden',
    seasons: W, access: from(1985), // Annahme; Mallorca 2020 [C7]
    climate: 'mittelmeer', altitude: 50, transport: 'flug', travelH: 2.5, tz: 0, travel: 6500,
    opp: 'regional', testIncome: 3000, marketing: 0.03, buzz: 0.4,
    note: 'Kurzer Flug, im Winter mild. An der Playa wartet die Ablenkung, im Inselinneren die Ruhe.',
  },
  {
    id: 'lamanga', name: 'La Manga', geo: [37.6, -0.8], place: 'La Manga Club (Murcia)', country: 'Spanien', region: 'sueden',
    seasons: W, access: from(1990), // Annahme; acht Plätze [C20], HSV/Leverkusen [C21]
    climate: 'mittelmeer', altitude: 30, transport: 'flug', travelH: 3, tz: 0, travel: 7500,
    opp: 'international', testIncome: 4500, marketing: 0.04, buzz: 0.3,
    note: 'Eine Anlage mit acht Fußballplätzen, im Winter 2020 über 60 Mannschaften aus 20 Ländern [C20]; Hamburg Blau und Leverkusen waren da [C21]. Testgegner gibt es reichlich.',
  },
  {
    id: 'algarve', name: 'Algarve', geo: [37.08, -8.03], place: 'Almancil / Albufeira', country: 'Portugal', region: 'sueden',
    seasons: W, access: from(1990), // Annahme; Wolfsburg 2020 [C7]
    climate: 'mittelmeer', altitude: 30, transport: 'flug', travelH: 3, tz: -1, travel: 7500,
    opp: 'international', testIncome: 3500, marketing: 0.03, buzz: 0.25,
    note: 'Golfhotels mit gepflegten Rasenplätzen, ruhiger als Spanien.',
  },
  {
    id: 'malta', name: 'Malta', geo: [35.92, 14.49], place: 'St. Julian’s', country: 'Malta', region: 'sueden',
    seasons: W, access: from(1995), // Annahme; Augsburg 2020 [C7]
    climate: 'mittelmeer', altitude: 30, transport: 'flug', travelH: 3, tz: 0, travel: 7000,
    opp: 'regional', testIncome: 2500, marketing: 0.02, buzz: 0.2,
    note: 'Günstige Alternative im Mittelmeer, wenige gute Plätze und schwache Testgegner.',
  },
  {
    id: 'tuerkei', name: 'Türkische Riviera', geo: [36.86, 31.05], place: 'Belek / Antalya', country: 'Türkei', region: 'sueden',
    seasons: W, access: [{ from: 1992, minRep: 70 }, { from: 1996, minRep: 0 }],
    climate: 'mittelmeer', altitude: 30, transport: 'flug', travelH: 3.5, tz: 1, travel: 6500,
    opp: 'international', testIncome: 5000, marketing: 0.03, buzz: 0.45,
    note: 'Gelsenkirchen eröffnete 1992 die Türkei-Touren [C3]; ab Ende der 90er Massenziel, 2015 ein Drittel der Liga in Belek. Viele Testgegner aus ganz Europa – aber auch viele Berater.',
  },
  {
    id: 'zypern', name: 'Zypern', geo: [34.68, 33.04], place: 'Limassol / Paphos', country: 'Zypern', region: 'sueden',
    seasons: W, access: from(1995), // Annahme
    climate: 'mittelmeer', altitude: 30, transport: 'flug', travelH: 4, tz: 1, travel: 8000,
    opp: 'regional', testIncome: 3000, marketing: 0.02, buzz: 0.2,
    note: 'Mild und ruhig, wenig andere Mannschaften vor Ort – gute Bedingungen, schwächere Testgegner (Annahme).',
  },
  // --- Fernreisen -------------------------------------------------------------------------
  {
    id: 'florida', name: 'Florida', geo: [28.54, -81.38], place: 'Orlando / Bradenton', country: 'USA', region: 'fern',
    seasons: W, access: [{ from: 1992, minRep: 72 }, { from: 2010, minRep: 60 }], closed: [2021, 2022],
    climate: 'florida', altitude: 30, transport: 'flug', travelH: 10, tz: -6, travel: 24000,
    opp: 'international', testIncome: 7000, marketing: 0.25, buzz: 0.35,
    note: 'Leverkusen fuhr im Januar 1992 als erster Bundesligist nach Orlando [C2]; 2020 u. a. Frankfurt Rot und Berlin Blau [C7]. Lange Anreise, sechs Stunden Zeitverschiebung.',
  },
  {
    id: 'dubai', name: 'Vereinigte Arabische Emirate', geo: [25.2, 55.27], place: 'Dubai / Abu Dhabi', country: 'VAE', region: 'fern',
    seasons: W, access: [{ from: 1984, minRep: 85 }, { from: 2003, minRep: 70 }, { from: 2008, minRep: 60 }], closed: [2021, 2022],
    climate: 'golf', altitude: 10, transport: 'flug', travelH: 6, tz: 3, travel: 18000,
    opp: 'international', testIncome: 6000, marketing: 0.3, buzz: 0.4,
    criticism: [{ from: 2015, fan: 0.6, text: 'Fans fragen, warum es zum Training an den Golf gehen muss.' }],
    note: 'In den 80ern nur gelegentlich für die ganz Großen [C1]; im Januar 2009 trainierte München Rot unter seinem neuen Trainer in Dubai [C5]. Perfekte Plätze, viel Luxus.',
  },
  {
    id: 'katar', name: 'Katar', geo: [25.29, 51.53], place: 'Doha (Sportakademie)', country: 'Katar', region: 'fern',
    seasons: W, access: [{ from: 2011, minRep: 82 }], closed: [2021, 2022],
    climate: 'golf', altitude: 10, transport: 'flug', travelH: 6, tz: 2, travel: 20000,
    opp: 'international', testIncome: 9000, marketing: 0.45, buzz: 0.4,
    criticism: [
      { from: 2014, fan: 1.5, text: 'Menschenrechtsorganisationen kritisieren das Lager in Katar.' },
      { from: 2020, fan: 4, text: 'Mitglieder und Kurve protestieren massiv gegen Katar (vgl. Mitgliederversammlung 2021).' },
    ],
    note: 'Seit 2011 Winterquartier von München Rot – als einziger Bundesligist [C3][C4]. Beste Bedingungen, gute Kontakte zu Sponsoren – und wachsende Kritik.',
  },
  {
    id: 'suedafrika', name: 'Südafrika', geo: [-33.92, 18.42], place: 'Kapstadt / Johannesburg', country: 'Südafrika', region: 'fern',
    seasons: W, access: [{ from: 2015, minRep: 62 }], closed: [2021, 2022], // erstmals belegt Januar 2015 [C22], Werder 2019 [C23]
    climate: 'kap', altitude: 30, transport: 'flug', travelH: 11.5, tz: 1, travel: 26000,
    opp: 'regional', testIncome: 4000, marketing: 0.12, buzz: 0.25,
    note: 'Hochsommer statt Winter: Wolfsburg trainierte im Januar 2015 in Kapstadt, Hoffenheim bei Pretoria [C22], Bremen 2019 zehn Tage in Johannesburg [C23]. Langer Flug, aber kaum Zeitverschiebung – und auf dem Highveld (1.600 m) ein Höhenreiz.',
  },
  {
    id: 'asien', name: 'Asien-Reise', geo: [31.23, 121.47], place: 'China / Japan / Singapur', country: 'Asien', region: 'fern',
    seasons: S, access: [{ from: 2015, minRep: 82 }, { from: 2017, minRep: 76 }], closed: [2020, 2021, 2022],
    climate: 'asien', altitude: 50, transport: 'flug', travelH: 12, tz: 7, travel: 40000,
    opp: 'top', testIncome: 60000, marketing: 1, buzz: 1,
    criticism: [{ from: 2017, fan: 0.8, text: 'Der Präsident eines Spitzenklubs nannte vier Spiele in zwölf Tagen „grenzwertig“; Fans ärgern sich über Ticketpreise [C6].' }],
    note: 'Marketingreise statt Trainingslager: Bayern 2017 in China, zwölf Tage, rund 10 Mio. € Erlös [C6]. Viel Geld und Bekanntheit, kaum Training, schwerer Jetlag.',
  },
  {
    id: 'usatour', name: 'USA-Sommertour', geo: [40.71, -74.01], place: 'New York / Miami / Los Angeles', country: 'USA', region: 'fern',
    seasons: S, access: [{ from: 2014, minRep: 80 }, { from: 2018, minRep: 75 }], closed: [2020, 2021],
    climate: 'usa', altitude: 50, transport: 'flug', travelH: 10, tz: -6, travel: 35000,
    opp: 'top', testIncome: 45000, marketing: 0.85, buzz: 0.9,
    criticism: [{ from: 2018, fan: 0.5, text: 'Fans vermissen die Vorbereitung vor der eigenen Haustür.' }],
    note: 'Sommerturniere gegen Topklubs aus Europa [C6]. Lukrativ, aber anstrengend.',
  },
];

export const CAMP_REGION_LABEL: Record<CampRegion, string> = {
  inland: 'Sportschulen', kueste: 'Nord- und Ostsee', mittelgebirge: 'Mittelgebirge', alpen: 'Alpen', sueden: 'Süden', fern: 'Fernreise',
};
export const CAMP_REGION_ORDER: CampRegion[] = ['inland', 'kueste', 'mittelgebirge', 'alpen', 'sueden', 'fern'];
export const CAMP_OPP_LABEL: Record<CampOpp, string> = {
  amateur: 'Amateurvereine', regional: 'regionale Gegner', international: 'internationale Gegner', top: 'europäische Spitzenklubs',
};
/** Typische Stärke der Testgegner (Gesamtwert-Skala). */
export const CAMP_OPP_STRENGTH: Record<CampOpp, number> = { amateur: 40, regional: 58, international: 70, top: 84 };
export const CAMP_TRANSPORT_LABEL: Record<CampTransport, string> = { bus: 'Bus', bahn: 'Bahn/Fähre', flug: 'Flug' };

/**
 * Wetter je Monat (Index 0 = Januar): Risiko ausfallender Einheiten 0–1 und Zustand
 * natürlicher Plätze 0–1 (Frost, Schnee, Regen, Hitze). Grobe Klimawerte (Annahme
 * nach üblichen Klimatabellen): Mitteleuropa im Januar Frost/Schnee, Mittelmeer und
 * Kanaren mild, Golfstaaten im Winter ideal und im Sommer zu heiß. `temp` = übliche
 * Tageshöchsttemperatur in °C (Annahme nach Klimatabellen typischer Orte; nur Anzeige).
 */
export const CAMP_CLIMATE: Record<CampClimate, { risk: number[]; ground: number[]; label: string; temp: number[] }> = {
  flachland:     { label: 'Mitteleuropa',     risk: [.65, .6, .4, .25, .15, .15, .15, .15, .2, .3, .5, .6],   ground: [.3, .35, .5, .7, .8, .85, .85, .85, .85, .75, .5, .35], temp: [3, 4, 9, 14, 19, 22, 24, 24, 20, 14, 8, 4] },
  kueste:        { label: 'Küstenklima',      risk: [.7, .65, .45, .3, .2, .2, .2, .2, .25, .4, .6, .65],    ground: [.3, .3, .45, .6, .75, .8, .8, .8, .75, .6, .45, .35], temp: [3, 3, 7, 11, 16, 19, 21, 21, 18, 13, 8, 4] },
  mittelgebirge: { label: 'Mittelgebirge',    risk: [.8, .75, .55, .35, .2, .2, .2, .2, .25, .4, .6, .75],   ground: [.15, .2, .35, .6, .75, .85, .85, .85, .8, .6, .35, .2], temp: [0, 1, 5, 10, 15, 18, 20, 20, 16, 11, 5, 1] },
  alpen:         { label: 'Alpen',            risk: [.85, .8, .6, .4, .25, .2, .2, .2, .2, .35, .6, .8],     ground: [.1, .1, .3, .5, .7, .85, .9, .9, .85, .6, .3, .1], temp: [1, 3, 8, 12, 17, 20, 23, 22, 18, 13, 6, 2] },
  hochalpen:     { label: 'Hochgebirge',      risk: [.9, .9, .8, .6, .4, .25, .25, .25, .3, .5, .8, .9],     ground: [.05, .05, .1, .3, .55, .8, .85, .85, .75, .45, .1, .05], temp: [-3, -2, 2, 6, 11, 15, 18, 17, 13, 8, 1, -2] },
  mittelmeer:    { label: 'Mittelmeer',       risk: [.18, .15, .12, .1, .1, .2, .3, .3, .15, .12, .15, .2],  ground: [.75, .8, .85, .85, .8, .65, .55, .55, .7, .8, .8, .7], temp: [16, 17, 19, 21, 25, 29, 32, 32, 28, 24, 19, 16] },
  atlantik:      { label: 'Kanaren-Klima',    risk: [.08, .08, .08, .08, .1, .12, .15, .15, .12, .1, .08, .08], ground: [.7, .7, .7, .7, .65, .6, .55, .55, .6, .65, .7, .7], temp: [21, 21, 22, 22, 23, 25, 27, 28, 27, 26, 24, 22] },
  golf:          { label: 'Golfklima',        risk: [.03, .05, .1, .3, .6, .8, .85, .85, .7, .35, .1, .04],  ground: [.95, .95, .9, .8, .6, .5, .5, .5, .55, .8, .9, .95], temp: [24, 25, 29, 34, 39, 41, 42, 42, 40, 36, 30, 26] },
  florida:       { label: 'Subtropen',        risk: [.12, .12, .12, .15, .25, .45, .5, .5, .45, .25, .15, .12], ground: [.85, .85, .85, .85, .8, .7, .65, .65, .7, .8, .85, .85], temp: [22, 23, 26, 28, 31, 32, 33, 33, 32, 29, 26, 23] },
  asien:         { label: 'Sommer in Ostasien', risk: [.3, .3, .3, .3, .35, .45, .45, .45, .4, .3, .3, .3], ground: [.7, .7, .7, .7, .7, .7, .7, .7, .7, .7, .7, .7], temp: [8, 10, 15, 21, 26, 29, 32, 32, 28, 23, 17, 11] },
  kap:           { label: 'Südsommer',        risk: [.08, .08, .1, .15, .25, .3, .3, .3, .25, .15, .1, .08], ground: [.8, .8, .8, .75, .7, .65, .65, .65, .7, .75, .8, .8], temp: [26, 27, 25, 23, 20, 18, 18, 18, 19, 21, 23, 25] },
  usa:           { label: 'Sommer in den USA', risk: [.2, .2, .2, .2, .25, .3, .3, .3, .25, .2, .2, .2],     ground: [.8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8, .8], temp: [5, 7, 12, 18, 23, 28, 30, 29, 25, 19, 12, 6] },
};

export function campDestination(id: string): CampDestination | undefined {
  return CAMP_DESTINATIONS.find((d) => d.id === id);
}

/** Ziele eines Landes (Schnittstelle für Sponsoren-Klauseln „Lager im Herkunftsland“). */
export function campDestinationsInCountry(country: string, season?: CampSeason): CampDestination[] {
  return CAMP_DESTINATIONS.filter((d) => d.country === country && (!season || d.seasons.includes(season)));
}
