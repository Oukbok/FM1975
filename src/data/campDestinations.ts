// =============================================================================
// TRAININGSLAGER – Ziele mit historischer Freischaltung (Rechnung in
// engine/trainingCamp.ts, Spielablauf in game/trainingCampGame.ts).
//
// Quellen (Stand Oktober 2026):
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
//       Asienreise 2017 (12 Tage, ~10 Mio. € Erlös), Hoeneß: „grenzwertig“, USA-Touren
//       (International Champions Cup), Fan-Kritik an Ticketpreisen.
//  [C7] sport1.de, „Winterfahrplan der Bundesligisten 2020“: 2020 v. a. Spanien
//       (Marbella, La Manga, Mallorca, Jerez), Portugal (Algarve), Malta, Florida, Doha.
// Annahmen sind als „Annahme“ markiert. Preise in 1975-Basis (Buchung × economyScale),
// kalkuliert für einen Tross von ~30 Personen auf dem Zielniveau (Erstligist 1975 ≈ 4,5 Mio. DM Umsatz).
// =============================================================================
import type { CampSeason } from '../game/winterShared';

export type CampRegion = 'inland' | 'alpen' | 'sueden' | 'fern';
export type CampOpp = 'amateur' | 'regional' | 'international' | 'top';

export interface CampDestination {
  id: string;
  name: string;
  place: string;
  country: string;
  region: CampRegion;
  seasons: CampSeason[];
  /** Zugang je Epoche: ab Jahr X für Vereine ab Ansehen Y (letzter passender Eintrag gilt). */
  access: { from: number; minRep: number }[];
  /** Nicht verfügbar in diesen Jahren (z. B. Corona-Reisebeschränkungen). */
  closed?: number[];
  /** Kosten je Tag (Hotel, Verpflegung, Platzmiete) und Reise je Lager, 1975-Basis. */
  costDay: number;
  travel: number;
  flightH: number;
  /** Zeitverschiebung zu Deutschland (Stunden). */
  tz: number;
  /** Platzqualität 0–1 [Sommer, Winter]. */
  pitch: [number, number];
  /** Wetterrisiko 0–1 [Sommer, Winter] (Schnee, Frost, Regen, Hitze). */
  weather: [number, number];
  /** Erlös je Testspiel (1975-Basis, Durchschnittsverein). */
  testIncome: number;
  opp: CampOpp;
  /** Marketingwirkung (internationale Marke, Sponsoring) 0–1. */
  marketing: number;
  /** Fan-/Medienkritik ab Jahr X (Abzug Fan-Stimmung). */
  criticism?: { from: number; fan: number; text: string }[];
  note: string;
}

export const CAMP_DESTINATIONS: CampDestination[] = [
  {
    id: 'sportschule', name: 'Sportschule (Inland)', place: 'Kaiserau / Hennef / Grünberg', country: 'Deutschland', region: 'inland',
    seasons: ['summer', 'winter'], access: [{ from: 1975, minRep: 0 }],
    costDay: 1800, travel: 1200, flightH: 0, tz: 0, pitch: [0.7, 0.3], weather: [0.15, 0.6],
    testIncome: 2500, opp: 'amateur', marketing: 0,
    note: 'Günstig und nah. Im Winter oft gefrorene Plätze – so trainierte Leverkusen noch Anfang der 90er bei −10 °C an der Ostsee [C2].',
  },
  {
    id: 'tegernsee', name: 'Voralpen', place: 'Tegernsee / Allgäu', country: 'Deutschland', region: 'alpen',
    seasons: ['summer'], access: [{ from: 1975, minRep: 0 }],
    costDay: 2200, travel: 1800, flightH: 0, tz: 0, pitch: [0.8, 0.3], weather: [0.15, 0.6],
    testIncome: 4000, opp: 'regional', marketing: 0.02,
    note: 'Klassiker der Sommervorbereitung seit den 70ern (Rottach-Egern beim FC Bayern bis ins neue Jahrtausend [C1]). Testspiele vor Urlaubern.',
  },
  {
    id: 'tirol', name: 'Österreichische Alpen', place: 'Tirol / Kärnten', country: 'Österreich', region: 'alpen',
    seasons: ['summer'], access: [{ from: 1977, minRep: 0 }], // Annahme: ab Ende der 70er üblich
    costDay: 2400, travel: 2600, flightH: 0, tz: 0, pitch: [0.85, 0.3], weather: [0.15, 0.6],
    testIncome: 5000, opp: 'regional', marketing: 0.04,
    note: 'Höhenluft, gute Plätze, Testspiele gegen österreichische Klubs und viele Urlauber als Zuschauer.',
  },
  {
    id: 'schweiz', name: 'Schweizer Alpen', place: 'Graubünden / Wallis', country: 'Schweiz', region: 'alpen',
    seasons: ['summer'], access: [{ from: 1980, minRep: 0 }], // Annahme
    costDay: 3200, travel: 3000, flightH: 0, tz: 0, pitch: [0.9, 0.3], weather: [0.1, 0.6],
    testIncome: 5000, opp: 'international', marketing: 0.05,
    note: 'Teurer als Österreich, dafür ruhiger und mit Testspielen gegen Schweizer Erstligisten.',
  },
  {
    id: 'kanaren', name: 'Kanarische Inseln', place: 'Gran Canaria / Teneriffa', country: 'Spanien', region: 'sueden',
    seasons: ['winter'], access: [{ from: 1980, minRep: 0 }],
    costDay: 2600, travel: 9000, flightH: 4.5, tz: -1, pitch: [0.7, 0.7], weather: [0.1, 0.08],
    testIncome: 3000, opp: 'regional', marketing: 0.03,
    note: 'In den 80ern das typische Winterziel – Leverkusen fuhr fast jedes Jahr hin [C2]. Mildes Klima, Plätze noch nicht überall gut.',
  },
  {
    id: 'spanien', name: 'Spanisches Festland & Mallorca', place: 'Marbella / La Manga / Mallorca', country: 'Spanien', region: 'sueden',
    seasons: ['winter'], access: [{ from: 1982, minRep: 0 }], // Annahme analog zu den Kanaren [C2]; 2020 meistgewähltes Ziel [C7]
    costDay: 2400, travel: 7000, flightH: 2.5, tz: 0, pitch: [0.8, 0.8], weather: [0.1, 0.15],
    testIncome: 4000, opp: 'international', marketing: 0.04,
    note: 'Seit den 80ern im Kommen, heute das häufigste Winterziel der Bundesliga (2020: elf Vereine in Spanien [C7]).',
  },
  {
    id: 'algarve', name: 'Algarve', place: 'Almancil / Lagos', country: 'Portugal', region: 'sueden',
    seasons: ['winter'], access: [{ from: 1990, minRep: 0 }], // Annahme; Wolfsburg 2020 [C7]
    costDay: 2300, travel: 7500, flightH: 3, tz: -1, pitch: [0.85, 0.85], weather: [0.1, 0.12],
    testIncome: 3500, opp: 'international', marketing: 0.03,
    note: 'Golfhotels mit gepflegten Rasenplätzen, ruhiger als Spanien.',
  },
  {
    id: 'malta', name: 'Malta', place: 'St. Julian’s', country: 'Malta', region: 'sueden',
    seasons: ['winter'], access: [{ from: 1995, minRep: 0 }], // Annahme; Augsburg 2020 [C7]
    costDay: 2000, travel: 7000, flightH: 3, tz: 0, pitch: [0.65, 0.65], weather: [0.1, 0.18],
    testIncome: 2500, opp: 'regional', marketing: 0.02,
    note: 'Günstige Alternative im Mittelmeer, wenige gute Plätze und schwache Testgegner.',
  },
  {
    id: 'tuerkei', name: 'Türkische Riviera', place: 'Belek / Antalya', country: 'Türkei', region: 'sueden',
    seasons: ['winter'], access: [{ from: 1992, minRep: 70 }, { from: 1996, minRep: 0 }],
    costDay: 1500, travel: 6500, flightH: 3.5, tz: 1, pitch: [0.85, 0.9], weather: [0.1, 0.15],
    testIncome: 5000, opp: 'international', marketing: 0.03,
    note: 'Schalke 04 eröffnete 1992 die Türkei-Touren [C3]; ab Ende der 90er Massenziel, 2015 ein Drittel der Liga in Belek. Viele Testgegner aus ganz Europa – aber auch viele Berater.',
  },
  {
    id: 'florida', name: 'Florida', place: 'Orlando / Bradenton', country: 'USA', region: 'fern',
    seasons: ['winter'], access: [{ from: 1992, minRep: 72 }, { from: 2010, minRep: 60 }],
    costDay: 3200, travel: 24000, flightH: 10, tz: -6, pitch: [0.85, 0.85], weather: [0.25, 0.12],
    testIncome: 7000, opp: 'international', marketing: 0.25,
    closed: [2021, 2022],
    note: 'Leverkusen fuhr im Januar 1992 als erster Bundesligist nach Orlando [C2]; 2020 u. a. Frankfurt und Hertha [C7]. Lange Anreise, sechs Stunden Zeitverschiebung.',
  },
  {
    id: 'dubai', name: 'Vereinigte Arabische Emirate', place: 'Dubai / Abu Dhabi', country: 'VAE', region: 'fern',
    seasons: ['winter'], access: [{ from: 1984, minRep: 85 }, { from: 2003, minRep: 70 }, { from: 2008, minRep: 60 }],
    costDay: 3800, travel: 18000, flightH: 6, tz: 3, pitch: [0.9, 0.95], weather: [0.6, 0.03],
    testIncome: 6000, opp: 'international', marketing: 0.3,
    closed: [2021, 2022],
    criticism: [{ from: 2015, fan: 0.6, text: 'Fans fragen, warum es zum Training an den Golf gehen muss.' }],
    note: 'In den 80ern nur gelegentlich für die ganz Großen [C1]; im Januar 2009 trainierten die Bayern unter Klinsmann in Dubai [C5]. Perfekte Plätze, viel Luxus.',
  },
  {
    id: 'katar', name: 'Katar', place: 'Doha (Aspire Academy)', country: 'Katar', region: 'fern',
    seasons: ['winter'], access: [{ from: 2011, minRep: 82 }],
    costDay: 4200, travel: 20000, flightH: 6, tz: 2, pitch: [0.9, 1], weather: [0.7, 0.02],
    testIncome: 9000, opp: 'international', marketing: 0.45,
    closed: [2021, 2022],
    criticism: [
      { from: 2014, fan: 1.5, text: 'Menschenrechtsorganisationen kritisieren das Lager in Katar.' },
      { from: 2020, fan: 4, text: 'Mitglieder und Kurve protestieren massiv gegen Katar (vgl. Mitgliederversammlung 2021).' },
    ],
    note: 'Seit 2011 Winterquartier des FC Bayern – als einziger Bundesligist [C3][C4]. Beste Bedingungen, gute Kontakte zu Sponsoren – und wachsende Kritik.',
  },
  {
    id: 'asien', name: 'Asien-Reise', place: 'China / Japan / Singapur', country: 'Asien', region: 'fern',
    seasons: ['summer'], access: [{ from: 2015, minRep: 82 }, { from: 2017, minRep: 76 }],
    costDay: 3500, travel: 40000, flightH: 12, tz: 7, pitch: [0.75, 0.75], weather: [0.4, 0.4],
    testIncome: 60000, opp: 'top', marketing: 1,
    closed: [2020, 2021, 2022],
    criticism: [{ from: 2017, fan: 0.8, text: 'Hoeneß nannte vier Spiele in zwölf Tagen „grenzwertig“; Fans ärgern sich über Ticketpreise [C6].' }],
    note: 'Marketingreise statt Trainingslager: Bayern 2017 in China, zwölf Tage, rund 10 Mio. € Erlös [C6]. Viel Geld und Bekanntheit, kaum Training, schwerer Jetlag.',
  },
  {
    id: 'usatour', name: 'USA-Sommertour', place: 'New York / Miami / Los Angeles', country: 'USA', region: 'fern',
    seasons: ['summer'], access: [{ from: 2014, minRep: 80 }, { from: 2018, minRep: 75 }],
    costDay: 3500, travel: 35000, flightH: 10, tz: -6, pitch: [0.8, 0.8], weather: [0.3, 0.3],
    testIncome: 45000, opp: 'top', marketing: 0.85,
    closed: [2020, 2021],
    criticism: [{ from: 2018, fan: 0.5, text: 'Fans vermissen die Vorbereitung vor der eigenen Haustür.' }],
    note: 'International Champions Cup gegen Topklubs aus Europa [C6]. Lukrativ, aber anstrengend.',
  },
];

export const CAMP_REGION_LABEL: Record<CampRegion, string> = {
  inland: 'Inland', alpen: 'Alpen', sueden: 'Süden', fern: 'Fernreise',
};
export const CAMP_OPP_LABEL: Record<CampOpp, string> = {
  amateur: 'Amateurvereine', regional: 'regionale Gegner', international: 'internationale Gegner', top: 'europäische Spitzenklubs',
};

export function campDestination(id: string): CampDestination | undefined {
  return CAMP_DESTINATIONS.find((d) => d.id === id);
}
