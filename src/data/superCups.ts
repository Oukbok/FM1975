// =============================================================================
// SUPERCUPS & KLEINE POKALE (Wunsch Pascal, #46) – Stammdaten je Land.
// -----------------------------------------------------------------------------
// Je Land die Epochen eines nationalen Supercups (Meister gegen Pokalsieger vor
// Saisonbeginn) bzw. des deutschen Ligapokals. Formate:
//   final  = ein Spiel                       legs2 = Hin- und Rückspiel
//   four   = vier Teams (Halbfinale + Finale) six   = Ligapokal mit 6 Teams
// `double`: Gegner, wenn der Meister auch den Pokal gewann (Pokalfinalist bzw.
// Vizemeister). `host`: wer das Heimrecht hat (Meister / Gegner / neutral = Meister
// mit halbem Heimvorteil). `month`: Spielmonat (8 = vor dem Ligastart, 1 = Januar).
// Quellen (Überblick): DFB-Supercup 1987–1996 und DFL-Supercup ab 2010 (2008/09
// inoffiziell, nicht gezählt), DFB-Ligapokal 1997–2007 (sechs Teilnehmer im Juli),
// DFV-Supercup der DDR 1989, Charity/Community Shield (England, bis 1992/93 bei
// Remis geteilter Titel), Supercoppa Italiana ab 1988, Supercopa de España ab 1982
// (bis 2018 Hin/Rück, ab 2019/20 vier Teams im Januar), Trophée des Champions ab
// 1995, Johan-Cruijff-Schaal ab 1991, Supertaça Portugal ab 1979 (bis 2000 Hin/Rück),
// Belgischer Supercup ab 1980, Österreichischer Supercup 1986–2004, Türkischer
// Supercup ab 1966, Griechischer Supercup 1987–2007, Rumänischer Supercup ab 1994,
// Russischer Supercup ab 2003, Ukrainischer Supercup ab 2004, Zyprischer Supercup.
// UEFA-Supercup (Landesmeister/Meisterliga-Sieger gegen Pokalsieger- bzw. ab 2000
// Europa-Pokal-Sieger) ab 1975; vereinfacht: ein Spiel Ende August (historisch bis
// 1997 Hin/Rück zu wechselnden Terminen).
// Namen im Spiel neutral („Supercup“, „Ligapokal“), keine Sponsorennamen.
// =============================================================================

export type SuperFormat = 'final' | 'legs2' | 'four' | 'six';
export interface SuperEra {
  from: number;
  to: number;
  name: string;
  format: SuperFormat;
  double: 'cupFinalist' | 'runnerUp';
  host: 'champion' | 'other' | 'neutral';
  month: number;
  /** Remis nach 90 Minuten: direkt Elfmeterschießen (ohne Verlängerung). */
  directPens?: boolean;
  /** Remis = geteilter Titel (Charity Shield bis 1992). */
  shared?: boolean;
}

/** Schlüssel = Länder-Schlüssel wie in data/world/countries.ts (`key`, ohne Umlaute) bzw. homeCountryKey. */
export const SUPER_CUPS: Record<string, SuperEra[]> = {
  Deutschland: [
    { from: 1987, to: 1996, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'neutral', month: 7 },
    { from: 1997, to: 2007, name: 'Ligapokal', format: 'six', double: 'runnerUp', host: 'neutral', month: 7 },
    { from: 2010, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'other', month: 8, directPens: true },
  ],
  DDR: [{ from: 1989, to: 1989, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'neutral', month: 7 }],
  England: [
    { from: 1975, to: 1992, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8, shared: true },
    { from: 1993, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8, directPens: true },
  ],
  Italien: [{ from: 1988, to: 9999, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'champion', month: 8 }],
  Spanien: [
    { from: 1982, to: 2018, name: 'Supercup', format: 'legs2', double: 'runnerUp', host: 'champion', month: 8 },
    { from: 2019, to: 9999, name: 'Supercup', format: 'four', double: 'runnerUp', host: 'neutral', month: 1 },
  ],
  Frankreich: [{ from: 1995, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8, directPens: true }],
  Niederlande: [{ from: 1991, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8 }],
  Portugal: [
    { from: 1979, to: 2000, name: 'Supercup', format: 'legs2', double: 'cupFinalist', host: 'champion', month: 8 },
    { from: 2001, to: 9999, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'neutral', month: 8 },
  ],
  Belgien: [{ from: 1980, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'champion', month: 7 }],
  Oesterreich: [{ from: 1986, to: 2004, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'champion', month: 7 }],
  Tuerkei: [{ from: 1975, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8 }],
  Griechenland: [{ from: 1987, to: 2007, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'neutral', month: 8 }],
  Rumaenien: [{ from: 1994, to: 9999, name: 'Supercup', format: 'final', double: 'cupFinalist', host: 'neutral', month: 7 }],
  Russland: [{ from: 2003, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 7 }],
  Ukraine: [{ from: 2004, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 7 }],
  Zypern: [{ from: 1975, to: 9999, name: 'Supercup', format: 'final', double: 'runnerUp', host: 'neutral', month: 8 }],
};

/** Epoche des Supercups eines Landes in der Saison (Startjahr); null = keiner. */
export function superEra(country: string, startYear: number): SuperEra | null {
  return SUPER_CUPS[country]?.find((e) => startYear >= e.from && startYear <= e.to) ?? null;
}

/** UEFA-Supercup (vereinfacht: ein Spiel Ende August). */
export const UEFA_SUPER = { from: 1975, name: 'Europäischer Supercup' };

/** Prämien (1975-Basis, × economyScale): Teilnahme / Sieg; Ligapokal je Runde. */
export const SUPER_PRIZE = { start: 15000, win: 25000, ligapokal: 40000, uefa: 60000 };
