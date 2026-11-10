// =============================================================================
// AUSLÄNDER-, EIGENGEWÄCHS- UND MELDEREGELN JE SAISON (Wunsch Pascal, #35)
// -----------------------------------------------------------------------------
// Quellen (Näherungen, gerundet): Wikipedia „Ausländerregelung“ (Fußball-Bundesliga:
// zunächst zwei Ausländer, 1992 drei, nach dem Bosman-Urteil keine Beschränkung für
// Europäer, 2004/05 fünf und 2005/06 vier Nicht-Europäer, 2006/07 Aufhebung und
// zwölf deutsche Lizenzspieler); DFL-Local-Player-Regel 2006/07 4, 2007/08 6, ab
// 2008/09 8 lokal ausgebildete Spieler, davon die Hälfte im eigenen Verein; UEFA:
// 3+2-Regel 1991/92–1995/96 (drei Ausländer + zwei „assimilierte“ Spieler mit fünf
// Jahren im Land, davon drei in der Jugend), Bosman-Urteil 15.12.1995, A-Liste mit
// höchstens 25 Spielern und Homegrown-Quote 4/6/8 (2006/07–2008/09), B-Liste für U21-
// Spieler mit zwei Jahren im Verein, Nachmeldung von bis zu drei Spielern im Winter.
// Vereinfachungen im Spiel: Die Grenzen gelten für den Spielberichtsbogen (Startelf
// + Bank), damit auch Einwechslungen sie einhalten; „Fußball-Deutscher“ = seit fünf
// Saisons bei Vereinen des Heimatlandes oder dort in der Jugend ausgebildet.
// =============================================================================

export interface DomesticRules {
  /** Gültig ab Saison-Startjahr. */
  from: number;
  /** Höchstens so viele Ausländer im Spielberichtsbogen; null = unbegrenzt. */
  matchForeign: number | null;
  /** Wer zählt als Ausländer: alle Nicht-Einheimischen oder nur Nicht-Europäer. */
  scope: 'all' | 'nonEurope';
  /** „Fußball-Deutsche“ (fünf Jahre im Land, davon drei in der Jugend) zählen nicht. */
  assimilated: boolean;
  /** Höchstens so viele Nicht-Europäer unter Vertrag. */
  contractNonEurope?: number;
  /** Mindestens so viele einheimische Lizenzspieler unter Vertrag (Deutschland: 12). */
  minNational?: number;
  /** Local Player: [lokal ausgebildet gesamt, davon im eigenen Verein]. */
  local?: [number, number];
  text: string;
}

export const DOMESTIC_RULES: DomesticRules[] = [
  { from: 1963, matchForeign: 2, scope: 'all', assimilated: false, text: 'Höchstens zwei Ausländer dürfen in einem Pflichtspiel auf dem Spielberichtsbogen stehen.' },
  { from: 1992, matchForeign: 3, scope: 'all', assimilated: true, text: 'Drei Ausländer pro Spiel; wer seit fünf Jahren im Land spielt (davon drei in der Jugend), gilt als „Fußball-Deutscher“ und zählt nicht mit.' },
  { from: 1996, matchForeign: 3, scope: 'nonEurope', assimilated: false, text: 'Nach dem Bosman-Urteil zählen Europäer nicht mehr als Ausländer. Für Spieler von außerhalb Europas gilt: höchstens drei pro Spiel.' },
  { from: 2004, matchForeign: 3, scope: 'nonEurope', assimilated: false, contractNonEurope: 5, text: 'Europäer frei; höchstens fünf Nicht-Europäer unter Vertrag, drei pro Spiel.' },
  { from: 2005, matchForeign: 3, scope: 'nonEurope', assimilated: false, contractNonEurope: 4, text: 'Europäer frei; höchstens vier Nicht-Europäer unter Vertrag, drei pro Spiel.' },
  { from: 2006, matchForeign: null, scope: 'nonEurope', assimilated: false, minNational: 12, local: [4, 2], text: 'Ausländerbeschränkung aufgehoben. Pflicht: zwölf einheimische Lizenzspieler unter Vertrag und vier lokal ausgebildete Spieler (zwei davon aus dem eigenen Verein).' },
  { from: 2007, matchForeign: null, scope: 'nonEurope', assimilated: false, minNational: 12, local: [6, 3], text: 'Zwölf einheimische Lizenzspieler, sechs lokal ausgebildete Spieler (drei aus dem eigenen Verein).' },
  { from: 2008, matchForeign: null, scope: 'nonEurope', assimilated: false, minNational: 12, local: [8, 4], text: 'Zwölf einheimische Lizenzspieler, acht lokal ausgebildete Spieler (vier aus dem eigenen Verein).' },
];

export interface EuroRules {
  from: number;
  /** Obergrenze der Meldeliste (A-Liste); null = ganzer Kader gemeldet. */
  listMax: number | null;
  /** Homegrown-Quote auf der A-Liste: [gesamt, davon im eigenen Verein]. */
  homegrown?: [number, number];
  /** B-Liste für U21-Spieler aus dem eigenen Verein (zwei Jahre dort). */
  bList: boolean;
  /** Nachmeldungen in der Winterpause. */
  winterChanges: number;
  /** Ausländer im Spielberichtsbogen (3+2-Regel: drei + zwei assimilierte). */
  matchForeign: number | null;
  text: string;
}

export const EURO_RULES: EuroRules[] = [
  { from: 1955, listMax: null, bList: false, winterChanges: 0, matchForeign: 2, text: 'Gemeldet ist der Kader des Vereins; es gilt die Ausländerregel des eigenen Verbands.' },
  { from: 1991, listMax: null, bList: false, winterChanges: 0, matchForeign: 3, text: '3+2-Regel: drei Ausländer plus zwei „assimilierte“ Spieler (fünf Jahre im Land, davon drei in der Jugend).' },
  { from: 1996, listMax: null, bList: false, winterChanges: 0, matchForeign: null, text: 'Nach dem Bosman-Urteil keine Ausländerbeschränkung mehr in den Europapokalen.' },
  { from: 1999, listMax: 25, bList: false, winterChanges: 3, matchForeign: null, text: 'Meldeliste mit höchstens 25 Spielern; in der Winterpause dürfen bis zu drei Spieler nachgemeldet werden.' },
  { from: 2006, listMax: 25, homegrown: [4, 2], bList: true, winterChanges: 3, matchForeign: null, text: 'A-Liste mit 25 Spielern, davon mindestens vier lokal ausgebildet (zwei im eigenen Verein); U21-Eigengewächse zusätzlich auf der B-Liste.' },
  { from: 2007, listMax: 25, homegrown: [6, 3], bList: true, winterChanges: 3, matchForeign: null, text: 'A-Liste mit 25 Spielern, davon mindestens sechs lokal ausgebildet (drei im eigenen Verein), B-Liste für U21-Eigengewächse.' },
  { from: 2008, listMax: 25, homegrown: [8, 4], bList: true, winterChanges: 3, matchForeign: null, text: 'A-Liste mit 25 Spielern, davon mindestens acht lokal ausgebildet (vier im eigenen Verein), B-Liste für U21-Eigengewächse.' },
];

export function domesticRulesFor(year: number): DomesticRules {
  return [...DOMESTIC_RULES].reverse().find((r) => year >= r.from) ?? DOMESTIC_RULES[0];
}
export function euroRulesFor(year: number): EuroRules {
  return [...EURO_RULES].reverse().find((r) => year >= r.from) ?? EURO_RULES[0];
}

/** Nationalitäten-Kürzel europäischer (UEFA-)Verbände. */
export const EUROPE_NATS = new Set([
  'GER', 'GDR', 'AUT', 'SUI', 'NED', 'BEL', 'LUX', 'FRA', 'ITA', 'ESP', 'POR', 'ENG', 'SCO', 'WAL', 'NIR', 'IRL', 'DEN', 'SWE', 'NOR',
  'FIN', 'ISL', 'POL', 'TCH', 'CZE', 'SVK', 'HUN', 'ROU', 'BUL', 'YUG', 'SRB', 'CRO', 'SVN', 'BIH', 'MKD', 'MNE', 'ALB', 'GRE', 'TUR',
  'CYP', 'MLT', 'URS', 'RUS', 'UKR', 'BLR', 'ISR', 'GEO', 'ARM', 'AZE', 'KAZ', 'LTU', 'LVA', 'EST', 'MDA', 'AND', 'SMR', 'LIE', 'FRO', 'GIB', 'KOS',
]);
