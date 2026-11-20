// =============================================================================
// HALLENTURNIERE IM AUSLAND – Stammdaten (Wunsch Pascal: „Füge Hallenturniere anderer
// Vereine hinzu“). Turniernamen verfremdet, Hallen und Jahre nach den Quellen.
// Spielablauf: game/indoorAbroad.ts · Simulation wie die deutschen Turniere (engine/indoor.ts).
//
// Quellen (Recherche November 2026):
//  [A1] de.wikipedia.org/wiki/Wiener_Stadthallenturnier: 1959–2009 in der Wiener Stadthalle (1969
//       Donauparkhalle), Kern Rapid/Austria/Vienna/Sport-Club/FavAC/Admira-Wacker, Gäste u. a. aus
//       München (Sieg 1971), 1998/99 zur Vorrunde des Österreichischen Hallencups umgebaut (danach
//       Teams aus ganz Österreich), nicht ausgetragen 1970, 2006, 2008; Ende 2009 wegen sinkender
//       Zuschauerzahlen, Verlusten und dem Wunsch der Spieler nach längerer Winterpause.
//  [A2] rsssf.org, „Indoor Tournament – Coupe des Rois (Genève)“: 1982–1993, 1998–2003, 2006–2009 in der
//       Patinoire des Vernets, Gastgeber der Genfer Spitzenverein; Sieger aus München (1983, 1986) und
//       Köln (1984), Gäste aus Frankreich, Jugoslawien, Sowjetunion, Portugal, Brasilien …; ab 2006 nur
//       Vereine der Westschweiz.
//  [A3] en.wikipedia.org/wiki/Tournoi_Indoor_de_Paris-Bercy: 1984–1991 in Bercy, Gastgeber der Pariser
//       Spitzenverein, je sechs Teams (zwei Gruppen), zwei Abende; 48 Teilnahmen: 17 Frankreich, 6
//       Deutschland (Sieger Hamburg 1984, Köln 1988), 4 Brasilien, sonst Europa/Nordafrika.
//  [A4] blick.ch, „Einst lief noch Kaiser Franz für GC auf“: offizielle Schweizer Hallenmeisterschaft
//       1997–1999 (Vierjahresvertrag der Liga, 50.000 Franken Startgeld je Verein, jeder Verein zwei
//       Qualifikationsturniere, Finale in Basel, Sieger 1997 Lausanne; nach drei Jahren beendet).
//       Vorrunden-Orte St. Gallen/Zürich/Lausanne und Finale der besten acht: Recherche Pascal (Annahme).
//  [A5] en.wikipedia.org/wiki/National_Five-a-Sides_(England): 1968–1986 jeweils im November in der
//       Wembley Arena (8.000–10.000 Zuschauer), Football-League-Vereine, gelegentlich Schotten;
//       Fernsehen 1972–1983, letzte Austragung November 1986.
//  [A6] en.wikipedia.org/wiki/Soccer_Six: Six-a-side jeden Dezember 1982–1991 (Birmingham, ab 1986
//       Manchester), Erstligisten, Fernsehen; 1991 eingestellt.
//  [A7] Graz: Turnier als Vorrunde des Österreichischen Hallencups ab 1998/99 – nicht belegt (Annahme
//       nach [A1] „Teams aus ganz Österreich“ und Pascals Recherche).
// Winter = Jahr des Januars (1991 = Saison 1990/91). Turniere im November/Dezember gehören zum
// Winter der laufenden Saison.
// =============================================================================

export interface AbroadVenue { from: number; city: string; hall: string }

export interface AbroadDef {
  id: string;
  /** Gastgeberland (Schlüssel der Weltdaten, data/world/countries.ts `key`). */
  country: string;
  name: string;
  venues: AbroadVenue[];
  /** Erster/letzter Winter, ausgelassene Winter. */
  from: number;
  until: number;
  skip?: number[];
  /** Terminfenster MM-TT (Juli–Dezember = Herbst der Saison, Januar–Juni = nach Neujahr). */
  window: [string, string];
  days: 1 | 2;
  teams: number;
  /** Gastgeber: Vereine dieser Städte aus der 1. Liga (stärkste zuerst). */
  hostCities: string[];
  hosts: number;
  /** Deutsche Gäste je Turnier (Erwartungswert, bis `domesticFrom`). */
  german: number;
  /** Weitere Gäste aus diesen Ländern (bis `domesticFrom`); übrige Plätze = Vereine des Landes. */
  guestFrom: string[];
  guests: number;
  /** Ab diesem Winter nur noch Vereine des Gastgeberlandes. */
  domesticFrom?: number;
  /** Serie (Schweizer Meisterschaft): Vorrunde bzw. Finale der Besten aus den Vorrunden. */
  series?: string;
  stage?: 'q' | 'f';
  /** Antrittsgeld-Faktor gegen ein deutsches Einladungsturnier (Annahme). */
  fee: number;
  src: string;
}

const EAST = ['Tschechoslowakei', 'Tschechien', 'Ungarn', 'Jugoslawien', 'Kroatien', 'Polen', 'Sowjetunion', 'Russland', 'Ukraine'];

export const ABROAD_TOURNAMENTS: AbroadDef[] = [
  {
    id: 'wien', country: 'Oesterreich', name: 'Wiener Hallenturnier', venues: [{ from: 0, city: 'Wien', hall: 'Stadthalle' }],
    from: 1976, until: 2009, skip: [2006, 2008], window: ['01-03', '01-20'], days: 1, teams: 6,
    hostCities: ['Wien'], hosts: 4, german: 0.5, guestFrom: ['Ungarn', 'Tschechoslowakei', 'Tschechien', 'Jugoslawien', 'Kroatien', 'Schweiz'], guests: 1,
    domesticFrom: 1999, fee: 1.1, src: 'A1',
  },
  {
    id: 'graz', country: 'Oesterreich', name: 'Grazer Hallen-Cup', venues: [{ from: 0, city: 'Graz', hall: 'Eishalle Liebenau' }],
    from: 1999, until: 2005, window: ['01-08', '01-25'], days: 1, teams: 6,
    hostCities: ['Graz'], hosts: 2, german: 0, guestFrom: [], guests: 0, fee: 0.9, src: 'A7',
  },
  {
    id: 'genf', country: 'Schweiz', name: 'Genfer Hallen-Cup', venues: [{ from: 0, city: 'Genf', hall: 'Patinoire des Vernets' }],
    from: 1982, until: 2009, skip: [1994, 1995, 1996, 1997, 2004, 2005], window: ['01-04', '01-24'], days: 1, teams: 6,
    hostCities: ['Genf'], hosts: 1, german: 0.6, guestFrom: ['Frankreich', 'Portugal', 'Spanien', 'Italien', 'Belgien', ...EAST], guests: 2,
    domesticFrom: 2006, fee: 1.2, src: 'A2',
  },
  {
    id: 'paris', country: 'Frankreich', name: 'Pariser Hallenturnier', venues: [{ from: 0, city: 'Paris', hall: 'Palais omnisports de Bercy' }],
    from: 1984, until: 1991, window: ['01-08', '02-05'], days: 2, teams: 6,
    hostCities: ['Paris'], hosts: 1, german: 0.75, guestFrom: ['Portugal', 'Spanien', 'Belgien', 'Niederlande', 'Schweden', 'England', 'Jugoslawien', 'Sowjetunion'], guests: 2,
    fee: 1.4, src: 'A3',
  },
  ...(['St. Gallen', 'Zürich', 'Lausanne'] as const).map((city, i): AbroadDef => ({
    id: `sui-q${i + 1}`, country: 'Schweiz', name: `Schweizer Hallenmeisterschaft, Vorrunde ${city}`,
    venues: [{ from: 0, city, hall: city === 'Zürich' ? 'Saalsporthalle' : city === 'Lausanne' ? 'Salle omnisport' : 'Sporthalle Kreuzbleiche' }],
    from: 1997, until: 1999, window: ['01-04', '01-17'], days: 1, teams: 8, hostCities: [city], hosts: 1,
    german: 0, guestFrom: [], guests: 0, series: 'sui', stage: 'q', fee: 1.6, src: 'A4',
  })),
  {
    id: 'sui-f', country: 'Schweiz', name: 'Schweizer Hallenmeisterschaft, Finale', venues: [{ from: 0, city: 'Basel', hall: 'St. Jakobshalle' }],
    from: 1997, until: 1999, window: ['01-22', '02-01'], days: 2, teams: 8, hostCities: [], hosts: 0,
    german: 0, guestFrom: [], guests: 0, series: 'sui', stage: 'f', fee: 1.6, src: 'A4',
  },
  {
    id: 'eng-five', country: 'England', name: 'Londoner Five-a-Side', venues: [{ from: 0, city: 'London', hall: 'Wembley Arena' }],
    from: 1976, until: 1987, window: ['11-08', '11-30'], days: 1, teams: 8, hostCities: ['London'], hosts: 2,
    german: 0, guestFrom: ['Schottland'], guests: 0.4, fee: 0.8, src: 'A5',
  },
  {
    id: 'eng-six', country: 'England', name: 'Englisches Six-a-side-Turnier',
    venues: [{ from: 0, city: 'Birmingham', hall: 'Messehalle' }, { from: 1987, city: 'Manchester', hall: 'Ausstellungshalle' }],
    from: 1983, until: 1992, window: ['12-01', '12-20'], days: 2, teams: 8, hostCities: [], hosts: 0,
    german: 0, guestFrom: [], guests: 0, fee: 1, src: 'A6',
  },
];

export const ABROAD_BY_ID: Record<string, AbroadDef> = Object.fromEntries(ABROAD_TOURNAMENTS.map((d) => [d.id, d]));

/** Findet das Turnier in diesem Winter statt? */
export function abroadActive(d: AbroadDef, winterYear: number): boolean {
  return winterYear >= d.from && winterYear <= d.until && !(d.skip ?? []).includes(winterYear);
}

export function abroadVenue(d: AbroadDef, winterYear: number): AbroadVenue {
  return [...d.venues].reverse().find((v) => v.from <= winterYear) ?? d.venues[0];
}

/** Alle Auslandsturniere eines Winters (feste Reihenfolge: Vorrunden vor dem Finale). */
export function abroadFor(winterYear: number): AbroadDef[] {
  return ABROAD_TOURNAMENTS.filter((d) => abroadActive(d, winterYear));
}

/** Erster und letzter Winter mit irgendeinem Auslandsturnier (Anzeige, Tests). */
export const ABROAD_FIRST_WINTER = Math.min(...ABROAD_TOURNAMENTS.map((d) => d.from));
export const ABROAD_LAST_WINTER = Math.max(...ABROAD_TOURNAMENTS.map((d) => d.until));

/** Turniere einer Serie zusammenfassen (Statistik-Auswahl): Schweizer Vorrunden zählen zur Meisterschaft. */
export function abroadGroupOf(id: string): string {
  return ABROAD_BY_ID[id]?.series ?? id;
}
export function abroadGroupName(group: string): string {
  if (group === 'sui') return 'Schweizer Hallenmeisterschaft';
  return ABROAD_BY_ID[group]?.name ?? group;
}
