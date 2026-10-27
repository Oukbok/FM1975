// =============================================================================
// FOOTBALL MANAGER 1980 — Zentrale Typ-Definitionen
// Bundesliga Saison 1980/81
// =============================================================================
// Dieses Modul enthält ALLE TypeScript-Interfaces und Types des Spiels.
// Gruppen: Spieler, Verein, Match, Liga, Kalender, Training, Transfer, GameState.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. POSITIONS-SYSTEM
// -----------------------------------------------------------------------------

/**
 * Spielpositionen im 1980er-Stil (Libero-System).
 * TW  = Torwart
 * LIB = Libero (letzter Mann)
 * VS  = Vorstopper (zentraler Manndecker)
 * AV  = Außenverteidiger
 * DM  = Defensives Mittelfeld
 * ZM  = Zentrales Mittelfeld
 * OM  = Offensives Mittelfeld / Spielmacher
 * FL  = Flügelstürmer
 * MS  = Mittelstürmer
 * HS  = Hängende Spitze / zweiter Stürmer
 */
export type Position =
  | 'TW'
  | 'LIB'
  | 'VS'
  | 'AV'
  | 'DM'
  | 'ZM'
  | 'OM'
  | 'FL'
  | 'MS'
  | 'HS';

/** Grobe Positionsgruppen für Taktik & Match-Engine. */
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'ATT';

/** Bevorzugter Fuß eines Spielers. */
export type PreferredFoot = 'left' | 'right' | 'both';

/** Zuordnung Position -> Positionsgruppe. */
export const POSITION_GROUPS: Record<Position, PositionGroup> = {
  TW: 'GK',
  LIB: 'DEF',
  VS: 'DEF',
  AV: 'DEF',
  DM: 'MID',
  ZM: 'MID',
  OM: 'MID',
  FL: 'ATT',
  MS: 'ATT',
  HS: 'ATT',
};

/** Alle Positionen als Array (für Iteration / Auswahl). */
export const ALL_POSITIONS: Position[] = [
  'TW', 'LIB', 'VS', 'AV', 'DM', 'ZM', 'OM', 'FL', 'MS', 'HS',
];

// -----------------------------------------------------------------------------
// 2. SPIELER-ATTRIBUTE
// -----------------------------------------------------------------------------

/**
 * Vollständiger Attribut-Satz eines Spielers.
 * Alle Werte auf einer Skala von 1–99 (sofern nicht anders vermerkt).
 */
export interface PlayerAttributes {
  // --- Physisch ---
  /** Aktuelle Fitness / Frische (0–100, dynamisch, sinkt durch Spiele/Training). */
  fitness: number;
  /** Ausdauer / Kondition (maximale Belastbarkeit). */
  stamina: number;
  /** Schnelligkeit / Antritt. */
  speed: number;
  /** Beschleunigung. */
  acceleration: number;
  /** Körperliche Stärke / Zweikampfwucht. */
  strength: number;
  /** Sprungkraft. */
  jumping: number;
  /** Beweglichkeit / Agilität. */
  agility: number;
  /** Balance / Standfestigkeit. */
  balance: number;

  // --- Technisch ---
  /** Allgemeine Technik / Ballkontrolle. */
  technique: number;
  /** Erste Ballannahme. */
  firstTouch: number;
  /** Abschluss / Torschuss. */
  shooting: number;
  /** Schusskraft. */
  shotPower: number;
  /** Distanzschuss. */
  longShots: number;
  /** Passspiel (kurz). */
  passing: number;
  /** Langer Ball / Flanken. */
  longPassing: number;
  /** Crossing / Flankengenauigkeit. */
  crossing: number;
  /** Dribbling. */
  dribbling: number;
  /** Ballkontrolle unter Druck. */
  ballControl: number;
  /** Kopfball. */
  heading: number;

  // --- Defensiv ---
  /** Tackling / Zweikampf defensiv. */
  tackling: number;
  /** Zweikampfverhalten (Marking / Manndeckung). */
  marking: number;
  /** Stellungsspiel defensiv. */
  positioning: number;
  /** Abfangen von Pässen (Interceptions). */
  interceptions: number;

  // --- Mental ---
  /** Erfahrung (0–100, wächst mit Einsätzen/Alter). */
  experience: number;
  /** Spielübersicht / Vision. */
  vision: number;
  /** Nervenstärke / Ruhe am Ball. */
  composure: number;
  /** Konzentration. */
  concentration: number;
  /** Entscheidungsfindung. */
  decisions: number;
  /** Führungsqualität / Leadership. */
  leadership: number;
  /** Arbeitseinsatz / Work Rate. */
  workRate: number;
  /** Aggressivität. */
  aggression: number;
  /** Teamwork / Mannschaftsdienlichkeit. */
  teamwork: number;
  /** Kreativität / Flair. */
  flair: number;

  // --- Torwart-spezifisch ---
  /** Reflexe (nur relevant für TW). */
  reflexes: number;
  /** Fangsicherheit / Handling (TW). */
  handling: number;
  /** Abschlag / Abwurf (TW). */
  kicking: number;
  /** Strafraumbeherrschung (TW). */
  aerialReach: number;
  /** Eins-gegen-Eins (TW). */
  oneOnOnes: number;
  /** Kommandostärke / Organisation der Abwehr (TW). */
  communication: number;

  // --- Standardsituationen ---
  /** Elfmeter. */
  penalties: number;
  /** Freistöße. */
  freeKicks: number;
  /** Eckbälle. */
  corners: number;
}

/** Namen aller Attribut-Schlüssel (für dynamischen Zugriff / Training). */
export type AttributeKey = keyof PlayerAttributes;

// -----------------------------------------------------------------------------
// 3. VERLETZUNGS-SYSTEM
// -----------------------------------------------------------------------------

/** Schweregrad einer Verletzung. */
export type InjurySeverity = 'minor' | 'moderate' | 'severe' | 'critical';

/** Art der Verletzung. */
export type InjuryType =
  | 'muscle'      // Muskelverletzung / Zerrung
  | 'ligament'    // Bänderverletzung
  | 'bone'        // Knochenbruch
  | 'bruise'      // Prellung
  | 'concussion'  // Gehirnerschütterung
  | 'fatigue'     // Überlastung / Erschöpfung
  | 'illness';    // Krankheit

/** Eine einzelne Verletzung eines Spielers. */
export interface Injury {
  id: string;
  type: InjuryType;
  severity: InjurySeverity;
  /** Menschlich lesbare Bezeichnung (z.B. "Muskelfaserriss Oberschenkel"). */
  description: string;
  /** ISO-Datum, an dem die Verletzung eintrat. */
  startDate: string;
  /** ISO-Datum der voraussichtlichen Rückkehr. */
  expectedReturnDate: string;
  /** Verbleibende Ausfalltage (dynamisch heruntergezählt). */
  daysRemaining: number;
  /** Gesamtdauer in Tagen. */
  totalDays: number;
  /** Ob die Verletzung im Training (true) oder Spiel (false) entstand. */
  fromTraining: boolean;
  /** Optionaler dauerhafter Attribut-Malus nach Genesung (z.B. Speed -2). */
  permanentImpact?: Partial<Record<AttributeKey, number>>;
}

// -----------------------------------------------------------------------------
// 4. SPIELER-STATISTIKEN
// -----------------------------------------------------------------------------

/** Saison-/Karriere-Statistiken eines Spielers. */
export interface PlayerStats {
  /** Einsätze (Spiele mit mind. einer Minute). */
  appearances: number;
  /** Einsätze in der Startelf. */
  starts: number;
  /** Einwechslungen. */
  substituteAppearances: number;
  /** Gespielte Minuten insgesamt. */
  minutesPlayed: number;
  /** Tore. */
  goals: number;
  /** Vorlagen / Assists. */
  assists: number;
  /** Gelbe Karten. */
  yellowCards: number;
  /** Gelb-Rote Karten. */
  yellowRedCards: number;
  /** Rote Karten. */
  redCards: number;
  /** Zu Null gespielte Spiele (relevant für TW/Abwehr). */
  cleanSheets: number;
  /** Gehaltene Elfmeter (TW). */
  penaltiesSaved: number;
  /** Verschossene Elfmeter. */
  penaltiesMissed: number;
  /** Durchschnittsnote (1.0 sehr gut ... 6.0 ungenügend, dt. Notensystem). */
  averageRating: number;
  /** Summe aller Einzelnoten (zur Neuberechnung des Durchschnitts). */
  ratingSum: number;
  /** Anzahl bewerteter Spiele. */
  ratedMatches: number;
}

/** Erzeugt eine leere Statistik. */
export function createEmptyStats(): PlayerStats {
  return {
    appearances: 0,
    starts: 0,
    substituteAppearances: 0,
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    yellowRedCards: 0,
    redCards: 0,
    cleanSheets: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    averageRating: 0,
    ratingSum: 0,
    ratedMatches: 0,
  };
}

// -----------------------------------------------------------------------------
// 5. VERTRAGS-SYSTEM
// -----------------------------------------------------------------------------

/** Vertrag eines Spielers bei einem Verein. */
export interface Contract {
  /** Wochengehalt in DM. */
  weeklyWage: number;
  /** ISO-Datum des Vertragsendes. */
  expiryDate: string;
  /** Ablösesumme / geschätzter Marktwert in DM. */
  transferValue: number;
  /** Optionale Ausstiegsklausel in DM. */
  releaseClause?: number;
  /** Tor-Prämie pro Tor in DM. */
  goalBonus?: number;
  /** Zufriedenheit des Spielers mit dem Vertrag (0–100). */
  satisfaction: number;
}

// -----------------------------------------------------------------------------
// 6. SPIELER-ENTWICKLUNG
// -----------------------------------------------------------------------------

/** Entwicklungsdaten & Potenzial eines Spielers. */
export interface PlayerDevelopment {
  /** Aktuelle Gesamtstärke (Current Ability, 1–100). */
  currentAbility: number;
  /** Potenzielle Gesamtstärke (Potential Ability, 1–100). */
  potentialAbility: number;
  /**
   * Entwicklungstempo-Faktor (0.5 langsam ... 2.0 schnell).
   * Beeinflusst wie schnell Attribute durch Training/Spiele wachsen.
   */
  growthRate: number;
  /** Verletzungsanfälligkeit (0–100, höher = anfälliger). */
  injuryProneness: number;
  /** Konstanz / Consistency (0–100). */
  consistency: number;
  /** Wichtige Spiele / Big-Match-Temperament (0–100). */
  bigMatchTemperament: number;
  /** Attribut-Veränderung der letzten Bewertungsperiode (für UI-Pfeile). */
  lastRatingChange: number;
  /** Historie der Gesamtstärke (für Entwicklungsdiagramme). */
  abilityHistory: { date: string; ability: number }[];
  /**
   * Summe der in der laufenden Saison bereits gutgeschriebenen Potenzial-Sterne
   * (nur Zuwächse). Dient dazu, den Anstieg auf max. +0.5 Sterne pro Saison zu
   * begrenzen. Wird bei der großen Saison-Bewertung zurückgesetzt.
   */
  seasonStarChange?: number;
  /**
   * VERSTECKTER Entwicklungs-Akkumulator je Attribut (in 0.1-Schritten).
   * Training füllt diese Werte kontinuierlich auf. Ein sichtbarer +1 auf das
   * Attribut erfolgt ERST, wenn der Akkumulator 1.0 erreicht (danach −1.0).
   * Der sichtbare Attributwert bleibt bis dahin unverändert.
   */
  attributeProgress?: Partial<Record<AttributeKey, number>>;
  /**
   * Versteckter OVR-Akkumulator. Jeder sichtbare Attribut-Zuwachs speist diesen
   * Wert (~0.34 je Attribut-Punkt); erreicht er 1.0, steigt der sichtbare OVR
   * um +1 (danach −1.0). Macht OVR-Aufwertungen an das Training gekoppelt.
   */
  ovrProgress?: number;
}

// -----------------------------------------------------------------------------
// 7. SPIELER
// -----------------------------------------------------------------------------

/** Moral-/Formzustand eines Spielers. */
export type PlayerMorale =
  | 'very_low'
  | 'low'
  | 'okay'
  | 'good'
  | 'excellent';

/** Verfügbarkeitsstatus eines Spielers. */
export type PlayerAvailability =
  | 'available'   // einsatzbereit
  | 'injured'     // verletzt
  | 'suspended'   // gesperrt
  | 'ill'         // krank
  | 'international'; // abgestellt (Nationalmannschaft)

/**
 * Ein Spieler mit allen Attributen, Positionen, Verträgen, Stats & Entwicklung.
 */
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  /** Vollständiger Anzeigename. */
  fullName: string;
  /** Rückennummer im Verein. */
  shirtNumber: number;
  /** Nationalität (ISO-Ländercode oder Klartext, z.B. "GER"). */
  nationality: string;
  /** ISO-Geburtsdatum. */
  dateOfBirth: string;
  /** Alter in Jahren (abgeleitet vom aktuellen Spieldatum). */
  age: number;
  /** Körpergröße in cm. */
  height: number;
  /** Gewicht in kg. */
  weight: number;
  /** Bevorzugter Fuß. */
  preferredFoot: PreferredFoot;

  /** Natürliche Hauptposition. */
  naturalPosition: Position;
  /** Weitere Positionen, auf denen der Spieler eingesetzt werden kann. */
  secondaryPositions: Position[];
  /**
   * Positionsbasierte Ratings: Eignung/Stärke je Position (0–100).
   * Auf der Naturposition am höchsten, auf fremden Positionen reduziert.
   */
  positionRatings: Partial<Record<Position, number>>;

  /** Vollständiger Attribut-Satz. */
  attributes: PlayerAttributes;
  /** Gesamt-Overall-Rating (0–100, abgeleitet aus Attributen & Position). */
  overall: number;

  /** Aktuelle Form (0–100, kurzfristig). */
  form: number;
  /**
   * Frische / aktuell verfügbare Kraft (0–100). Unabhängig von der Fitness
   * (= Ausdauer/Durchhaltevermögen in `attributes.fitness`): Die Frische sinkt
   * nach Spielen STARK und erholt sich über mehrere Tage. Niedrige Frische
   * senkt die physische Leistung im Spiel. Startwert 100.
   */
  frische: number;
  /** Moral. */
  morale: PlayerMorale;
  /** Verfügbarkeit. */
  availability: PlayerAvailability;
  /** Aktuelle Verletzung (falls vorhanden). */
  injury: Injury | null;
  /** Restliche Spielsperren (Anzahl Spiele). */
  suspensionMatches: number;
  /** Gesammelte Gelbe Karten in der Saison (für Sperren-Logik). */
  yellowCardCount: number;

  /** ID des aktuellen Vereins. */
  clubId: string;
  /** Vertrag. */
  contract: Contract;
  /** Entwicklungsdaten. */
  development: PlayerDevelopment;

  /**
   * Potenzial-Sterne (1.0–5.0 in 0.25-Schritten).
   * Bestimmen über {@link starsToPotential} die maximal erreichbare Gesamtstärke
   * (Softcap). Grobe Einordnung:
   *  - 1.0–1.75 ★  → 3.-Liga-Niveau (max. ~60–65 OVR)
   *  - 2.0–2.75 ★  → 2.-Liga-Niveau (max. ~66–72 OVR)
   *  - 3.0–3.75 ★  → Bundesliga (max. ~73–82 OVR)
   *  - 4.0–4.75 ★  → Top-Bundesliga (max. ~83–89 OVR)
   *  - 5.0 ★       → absolutes Ausnahmetalent (max. ~90–99 OVR)
   */
  potentialStars: number;

  /** Statistiken der aktuellen Saison. */
  seasonStats: PlayerStats;
  /** Kumulierte Karriere-Statistiken. */
  careerStats: PlayerStats;

  /** Kumulierte Trainingsbelastung (für Überbelastungs-Logik). */
  trainingLoad: number;
  /** Markierung: im aktuellen Transferfenster gelistet / gewünscht. */
  transferListed: boolean;

  // --- Jugendsystem (nur bei Jugendspielern gesetzt) ---
  /** Markierung: Spieler gehört der Jugendakademie an (noch kein A-Kader). */
  isYouth?: boolean;
  /**
   * Scouting-Einschätzung des Potenzials als Sterne-RANGE (Minimum).
   * Solange der Spieler jung/unerfahren ist, liefert das Scouting nur einen
   * Bereich [min…max] statt des exakten {@link potentialStars}. Der Bereich
   * verengt sich mit der Entwicklung, bis er (bei Beförderung/Reife) exakt wird.
   */
  scoutedPotentialMin?: number;
  /** Scouting-Einschätzung des Potenzials als Sterne-RANGE (Maximum). */
  scoutedPotentialMax?: number;
}

// -----------------------------------------------------------------------------
// 7b. JUGEND-ALTERSKLASSEN (deutsche Jugendfußball-Systematik)
// -----------------------------------------------------------------------------

/**
 * Deutsche Jugend-Altersklassen von der jüngsten (G/Bambini) bis zur ältesten (A).
 * Kinder treten mit 7 Jahren in die G-Jugend (Bambini) ein und rücken jedes Jahr
 * bzw. alle zwei Jahre eine Klasse auf, bis sie am Ende der A-Jugend (mit 20) den
 * Sprung in den Profikader schaffen oder den Verein verlassen.
 *
 * Reale deutsche Systematik (Saison-Altersklassen):
 *   G-Jugend/Bambini = U7 (bis 7 J.) · F = U9 (8–9 J.) · E = U11 (10–11 J.)
 *   D = U13 (12–13 J.) · C = U15 (14–15 J.) · B = U17 (16–17 J.) · A = U19 (18–19 J.)
 */
export type YouthAgeClass = 'G' | 'F' | 'E' | 'D' | 'C' | 'B' | 'A';

/** Reihenfolge der Altersklassen von jung → alt. */
export const YOUTH_AGE_CLASS_ORDER: YouthAgeClass[] = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];

/** Eintrittsalter in die Jugendakademie (G-Jugend/Bambini, U7). */
export const YOUTH_ENTRY_AGE = 7;

/** Alter, ab dem ein Talent die Jugend verlässt (Ende A-Jugend + 1). */
export const YOUTH_GRADUATE_AGE = 20;

/**
 * Leitet aus dem Alter die Jugend-Altersklasse ab (Ableitung, nicht gespeichert).
 * Zuordnung nach deutscher Jugendfußball-Systematik:
 *   G/Bambini = ≤7 (U7) · F = 8–9 (U9) · E = 10–11 (U11) · D = 12–13 (U13)
 *   C = 14–15 (U15) · B = 16–17 (U17) · A = 18–19 (U19).
 * Ab 20 Jahren (`null`) gehört der Spieler nicht mehr in die Jugend.
 */
export function youthAgeClass(age: number): YouthAgeClass | null {
  if (age <= 7) return 'G';
  if (age <= 9) return 'F';
  if (age <= 11) return 'E';
  if (age <= 13) return 'D';
  if (age <= 15) return 'C';
  if (age <= 17) return 'B';
  if (age <= 19) return 'A';
  return null;
}

/** Deutscher Anzeigename je Altersklasse. */
export const YOUTH_AGE_CLASS_LABEL: Record<YouthAgeClass, string> = {
  G: 'G-Jugend (Bambini)', F: 'F-Jugend', E: 'E-Jugend', D: 'D-Jugend', C: 'C-Jugend', B: 'B-Jugend', A: 'A-Jugend',
};

/** Kurzbeschreibung der Altersspanne je Klasse (für die UI). */
export const YOUTH_AGE_CLASS_RANGE: Record<YouthAgeClass, string> = {
  G: 'U7 · bis 7 Jahre',
  F: 'U9 · 8–9 Jahre',
  E: 'U11 · 10–11 Jahre',
  D: 'U13 · 12–13 Jahre',
  C: 'U15 · 14–15 Jahre',
  B: 'U17 · 16–17 Jahre',
  A: 'U19 · 18–19 Jahre',
};

// -----------------------------------------------------------------------------
// 8. STADION
// -----------------------------------------------------------------------------

/** Stadion eines Vereins. */
export interface Stadium {
  name: string;
  /** Zuschauerkapazität. */
  capacity: number;
  /** Durchschnittliche Auslastung diese Saison (0–1). */
  averageAttendanceRate: number;
  /** Standard-Ticketpreis in DM. */
  ticketPrice: number;
  /** Zustand / Ausbaustufe (0–100). */
  condition: number;
}

// -----------------------------------------------------------------------------
// 9. VEREINS-FINANZEN
// -----------------------------------------------------------------------------

/** Ein einzelner Finanz-Buchungssatz (für Historie). */
export interface FinanceTransaction {
  id: string;
  /** ISO-Datum. */
  date: string;
  /** Positiv = Einnahme, negativ = Ausgabe (in DM). */
  amount: number;
  category: FinanceCategory;
  description: string;
}

/** Kategorien für Einnahmen/Ausgaben. */
export type FinanceCategory =
  | 'ticket_sales'
  | 'tv_money'
  | 'sponsorship'
  | 'merchandise'
  | 'transfer_income'
  | 'prize_money'
  | 'wages'
  | 'transfer_expense'
  | 'stadium_maintenance'
  | 'training_facilities'
  | 'staff_wages'
  | 'catering'
  | 'advertising'
  | 'membership'
  | 'matchday'
  | 'facilities'
  | 'other';

/** Finanzielle Situation eines Vereins. */
export interface ClubFinances {
  /** Aktueller Kontostand in DM. */
  balance: number;
  /** Verfügbares Transferbudget in DM. */
  transferBudget: number;
  /** Wöchentliches Gehaltsbudget in DM. */
  wageBudget: number;
  /** Aktuell verwendete Gehaltssumme pro Woche in DM. */
  currentWageBill: number;

  // --- Einnahmen (Saison bislang, in DM) ---
  income: {
    ticketSales: number;
    tvMoney: number;
    /** Trikotsponsoring (ab dem tiefen Finanzsystem NUR noch Trikot). */
    sponsorship: number;
    merchandise: number;
    transferIncome: number;
    prizeMoney: number;
    /** Catering/Wuerstchenbuden (Heimspiel-Pro-Kopf + evtl. Monatspacht). */
    catering: number;
    /** Bandenwerbung (monatliche Vertragsrate). */
    advertising: number;
    /** Mitgliedsbeitraege (monatlich). */
    membership: number;
    /** Programmhefte & sonstige Spieltagserloese (pro Heimspiel). */
    matchday: number;
    other: number;
  };

  // --- Ausgaben (Saison bislang, in DM) ---
  expenses: {
    wages: number;
    transferExpense: number;
    stadiumMaintenance: number;
    trainingFacilities: number;
    staffWages: number;
    /** Monatliche Gebaeude-Fixkosten aller Einrichtungen (inkl. Catering). */
    facilities: number;
    other: number;
  };

  /** Buchungshistorie. */
  transactions: FinanceTransaction[];

  /**
   * Monats-Stützpunkte des Kontostands (für den Verlaufs-Graphen).
   * Wird zu jedem Monatsabschluss ergänzt. Nur für den Manager-Verein geführt.
   */
  balanceHistory?: { date: string; balance: number }[];
  /** ISO-Monat (YYYY-MM) des letzten gebuchten Monatsabschlusses. */
  lastMonthlyBooking?: string;
}

// -----------------------------------------------------------------------------
// 9b. VEREINSGELÄNDE / INFRASTRUKTUR
// -----------------------------------------------------------------------------

/** Ausbaubare Einrichtungen des Vereinsgeländes. */
export type FacilityKey =
  | 'stadium'        // Stadion (Kapazität → Stadioneinnahmen)
  | 'trainingCenter' // Trainingszentrum (Entwicklungs-/Lernrate)
  | 'youthAcademy'   // Jugendakademie (Anzahl/Qualität der Talente)
  | 'medical'        // Medizinische Abteilung (Regeneration/Reha)
  | 'merchandising'  // Fanshop / Merchandising (Fanartikel-Einnahmen)
  | 'catering'       // Catering / Wuerstchenbuden (Spieltags-Erloese)
  // --- Zukunfts-Einrichtungen (epochengerecht freigeschaltet) ---
  | 'rehaCenter'       // Reha-Zentrum (ab 1990): zusätzl. Reha & Regeneration
  | 'nlz'              // Nachwuchsleistungszentrum (ab 1998): schnelleres Jugendwachstum
  | 'performanceCenter'// Leistungszentrum (ab 2003): höhere Trainingsqualität
  | 'dataCenter';      // Datenanalyse-Zentrum (ab 2013): präziseres Scouting

/**
 * Infrastruktur eines Vereins: je Einrichtung eine Ausbaustufe (1–5).
 * Stufe 1 = Grundausstattung, Stufe 5 = Spitzenniveau. Die Effekte wirken real
 * in den jeweiligen Engines (siehe engine/infrastructure.ts).
 */
export interface ClubInfrastructure {
  stadium: number;
  trainingCenter: number;
  youthAcademy: number;
  medical: number;
  merchandising: number;
  /** Catering / Wuerstchenbuden (Stufe 1–5; ab 1975 verfuegbar). */
  catering?: number;
  /** Zukunfts-Einrichtungen (Stufe 1 = Grundausbau ohne Effekt; optional/nachrüstbar). */
  rehaCenter?: number;
  nlz?: number;
  performanceCenter?: number;
  dataCenter?: number;
  /** Jahr (UTC) der letzten Jugend-Nachwuchsrunde (für den jährlichen Rhythmus). */
  lastYouthIntakeYear?: number;
}

// -----------------------------------------------------------------------------
// 10. VEREIN
// -----------------------------------------------------------------------------

/** Grundausrichtung / Taktik eines Vereins. */
export type TacticStyle = 'defensive' | 'balanced' | 'attacking' | 'counter';

/** Taktische Aufstellung (Formation im Libero-System). */
export interface Tactics {
  /** Formationsbezeichnung, z.B. "1-3-3-3" oder "Libero-4-4-2". */
  formation: string;
  style: TacticStyle;
  /** Mannschaftsteil-Ausrichtung: Pressinghöhe (0–100). */
  pressing: number;
  /** Tempo / Spielgeschwindigkeit (0–100). */
  tempo: number;
  /** Defensive Linie (0–100, tief bis hoch). */
  defensiveLine: number;
  /** Zugewiesene Startelf (Spieler-IDs, positionsgeordnet). */
  startingXI: string[];
  /** Ersatzbank (Spieler-IDs). */
  substitutes: string[];
  /** Kapitän (Spieler-ID). */
  captainId: string | null;
  /** Elfmeterschütze (Spieler-ID). */
  penaltyTakerId: string | null;
  /** Freistoßschütze (Spieler-ID). */
  freeKickTakerId: string | null;
  /** Eckenschütze (Spieler-ID). */
  cornerTakerId: string | null;

  // --- Erweiterte Aufstellung & Taktik (optional; alte Spielstände ohne) ---
  /** Zuordnung Formations-Slot-ID → Spieler-ID (maßgeblich für die Startelf). */
  lineupMap?: Record<string, string>;
  /** Zuordnung Spieler-ID → tatsächlich gespielte Position (für die Engine). */
  assignedPositions?: Record<string, Position>;
  /** Zweikampfhärte (0=zurückhaltend … 100=kompromisslos). */
  tackleHardness?: number;
  /** Abseitsfalle aktiv? */
  offsideTrap?: boolean;
  /** Fokus der Breite: 0=über die Mitte … 100=über die Flügel. */
  widthFocus?: number;
  /** Aufbauspiel: kurz (Ballbesitz) oder lang (direkt). */
  buildup?: 'short' | 'long';
}

/** Muster-Typ für ein parametrisches Trikot (deckungsgleich mit JerseySVG). */
export type KitPattern =
  | 'solid'
  | 'stripes'
  | 'hoops'
  | 'sash'
  | 'mittelstreifen'
  | 'halves';

/** Kosmetisches Trikot-Design (Grundfarbe + Zweitfarbe + Muster). */
export interface Kit {
  primary: string;
  secondary: string;
  pattern: KitPattern;
}

// -----------------------------------------------------------------------------
// 10b. KOMMERZ / VERTRAEGE (Trikotsponsoring, Banden, Catering)
// -----------------------------------------------------------------------------

/** Betriebsform der Catering-/Wuerstchenbuden. */
export type CateringMode = 'eigenbetrieb' | 'umsatz' | 'verpachtung';

/**
 * Ein laufender Vermarktungs-Vertrag (Trikot oder Banden). `annualValue` wird in
 * 1975-DM-Basis gespeichert und bei jeder Buchung mit `economyScale(year)`
 * skaliert, damit ein Mehrjahresvertrag real konstant bleibt (nominal mitwaechst).
 */
export interface SponsorContract {
  /** Sponsor-/Vermarkter-Name. */
  name: string;
  /** NOMINAL DM/Jahr in 1975-Basis. */
  annualValue: number;
  /** Laufzeit gesamt (Saisons). */
  yearsTotal: number;
  /** Restlaufzeit (Saisons). */
  yearsLeft: number;
}

/** Ein Vertragsangebot (je Saison neu erzeugt). */
export interface SponsorOffer {
  name: string;
  /** NOMINAL DM/Jahr in 1975-Basis. */
  annualValue: number;
  /** Laufzeit (Saisons). */
  years: number;
}

/** Kommerz-Zustand eines Vereins (Vertraege, Angebote, Catering-Modus). */
export interface ClubCommerce {
  /** Aktiver Trikotsponsor (optional). */
  shirtSponsor?: SponsorContract;
  /** Aktiver Bandenwerbe-Partner (optional). */
  banden?: SponsorContract;
  /** Betriebsform der Wuerstchenbuden (Default 'verpachtung'). */
  cateringMode: CateringMode;
  /** Aktuelle Trikot-Angebote (je Saison neu). */
  shirtOffers?: SponsorOffer[];
  /** Aktuelle Banden-Angebote (je Saison neu). */
  bandenOffers?: SponsorOffer[];
}

/** Ein Bundesliga-Verein. */
export interface Club {
  id: string;
  name: string;
  /** Kurzname / Abkürzung (z.B. "FCB"). */
  shortName: string;
  /** Stadt. */
  city: string;
  /** Gründungsjahr. */
  founded: number;
  /** Vereinsfarben (Hex-Codes). */
  colors: {
    primary: string;
    secondary: string;
  };
  /**
   * Optionales benutzerdefiniertes Wappen als Data-URL (base64, PNG).
   * Wenn gesetzt, zeigt <ClubCrest> dieses Bild statt des generierten Wappens.
   * Rein kosmetisch; fehlt in Altständen → generiertes Wappen (abwärtskompatibel).
   */
  customCrest?: string;
  /**
   * Optionale benutzerdefinierte Trikots (Heim/Auswärts). Rein kosmetisch.
   * Fehlt in Altständen → aus `colors` abgeleitet (abwärtskompatibel).
   */
  kits?: {
    home: Kit;
    away: Kit;
  };
  /** Ansehen / Reputation (0–100). */
  reputation: number;

  /** Spieler-IDs im Kader. */
  playerIds: string[];
  /** Spieler-IDs in der Jugendakademie (nicht im A-Kader). */
  youthPlayerIds: string[];
  /** Ausbaustufen des Vereinsgeländes. */
  infrastructure: ClubInfrastructure;
  /** Stadion. */
  stadium: Stadium;
  /** Finanzen. */
  finances: ClubFinances;
  /** Taktik & Aufstellung. */
  tactics: Tactics;
  /** Trainingsplan-ID / eingebetteter Trainingsplan. */
  trainingSchedule: TrainingSchedule;

  /** Ob dies der vom Nutzer verwaltete Verein ist. */
  isPlayerControlled: boolean;
  /** KI-Stärke bei Management-Entscheidungen (0–100), nur für KI-Vereine. */
  aiManagerSkill: number;

  /** Saison-Ziel (Erwartung des Vorstands). */
  boardExpectation: string;
  /** Vorstandsvertrauen in den Trainer (0–100). */
  boardConfidence: number;

  /** Kommerz/Vertraege (Trikot, Banden, Catering). Optional → Migration. */
  commerce?: ClubCommerce;
}

// -----------------------------------------------------------------------------
// 11. MATCH-SYSTEM
// -----------------------------------------------------------------------------

/** Typ eines Match-Events. */
export type MatchEventType =
  | 'kickoff'
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_missed'
  | 'penalty_saved'
  | 'yellow_card'
  | 'yellow_red_card'
  | 'red_card'
  | 'substitution'
  | 'injury'
  | 'chance'          // Torchance ohne Tor
  | 'save'            // Torwartparade
  | 'corner'
  | 'free_kick'
  | 'offside'
  | 'foul'
  | 'half_time'
  | 'full_time'
  | 'extra_time_start' // Beginn der Verlängerung (Pokal)
  | 'extra_time_half'  // Seitenwechsel in der Verlängerung
  | 'extra_time_end'   // Ende der Verlängerung
  | 'shootout_start'   // Beginn des Elfmeterschießens
  | 'shootout_goal'    // verwandelter Elfmeter im Schießen
  | 'shootout_miss'    // verschossener/gehaltener Elfmeter im Schießen
  | 'shootout_end'     // Ende des Elfmeterschießens
  | 'commentary';     // reiner Kommentar-Text

/** Ein Ereignis innerhalb eines Spiels (Text-Event für den Live-Ticker). */
export interface MatchEvent {
  id: string;
  /** Spielminute (0–90+). */
  minute: number;
  type: MatchEventType;
  /** Betroffener Verein (ID). */
  clubId: string;
  /** Hauptbeteiligter Spieler (ID), z.B. Torschütze. */
  playerId?: string;
  /** Sekundär beteiligter Spieler (ID), z.B. Vorlagengeber / eingewechselt. */
  secondaryPlayerId?: string;
  /** Ausformulierter Kommentar-Text. */
  commentary: string;
  /** Zwischenstand nach diesem Event (Heim:Auswärts). */
  scoreAfter?: { home: number; away: number };
}

/** Endergebnis / Zusammenfassung eines Spiels. */
export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  /** Ballbesitz Heim in Prozent (0–100). */
  homePossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  /** Zuschauerzahl. */
  attendance: number;
  /** Spieler des Spiels (ID). */
  manOfTheMatchId?: string;
}

/** Status eines Spiels. */
export type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

/** Ein einzelnes Spiel (Begegnung). */
export interface Match {
  id: string;
  /** Spieltag (1–34). */
  matchday: number;
  /** ISO-Datum des Spiels. */
  date: string;
  /** Heimverein (ID). */
  homeClubId: string;
  /** Auswärtsverein (ID). */
  awayClubId: string;
  status: MatchStatus;
  /** Ergebnis (null bis gespielt). */
  result: MatchResult | null;
  /** Chronologische Liste der Text-Events (null bis gespielt/simuliert). */
  events: MatchEvent[];
  /** Ob am Spiel ein vom Nutzer kontrollierter Verein beteiligt ist. */
  involvesPlayerClub: boolean;
}

// -----------------------------------------------------------------------------
// 12. LIGA-SYSTEM
// -----------------------------------------------------------------------------

/** Punktesystem: 2-Punkte-Regel (historisch bis 1994/95) oder 3-Punkte-Regel. */
export type PointSystem = '2-point' | '3-point';

/** Eine Zeile in der Ligatabelle. */
export interface LeagueTableRow {
  clubId: string;
  /** Aktueller Tabellenplatz (1–18). */
  position: number;
  /** Vorheriger Platz (für Auf-/Abstiegs-Pfeile). */
  previousPosition: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Tordifferenz (goalsFor - goalsAgainst). */
  goalDifference: number;
  points: number;
  /** Letzte 5 Ergebnisse (neueste zuletzt). */
  form: ('W' | 'D' | 'L')[];
}

/** Die komplette Ligatabelle. */
export interface LeagueTable {
  season: string;
  pointSystem: PointSystem;
  rows: LeagueTableRow[];
  /** ISO-Datum der letzten Aktualisierung. */
  lastUpdated: string;
}

/** Der komplette Spielplan der Liga. */
export interface Fixtures {
  /** Alle Spiele der Saison. */
  matches: Match[];
  /** Aktueller/nächster Spieltag. */
  currentMatchday: number;
  /** Gesamtzahl der Spieltage (34). */
  totalMatchdays: number;
}

// -----------------------------------------------------------------------------
// 13. KALENDER-SYSTEM
// -----------------------------------------------------------------------------

/** Typ eines Kalender-Events. */
export type EventType =
  | 'matchday'          // Spieltag
  | 'training'          // Trainingstag
  | 'transfer_window_open'
  | 'transfer_window_close'
  | 'transfer_deadline'
  | 'rating_update'     // periodische Neubewertung der Spieler
  | 'contract_expiry'   // Vertragsende
  | 'board_review'      // Vorstandssitzung / Zielüberprüfung
  | 'injury_return'     // Rückkehr eines Spielers
  | 'season_start'
  | 'season_end'
  | 'winter_break'      // Winterpause
  | 'press_conference'
  | 'cup_matchday'      // DFB-Pokal-Runde
  | 'euro_matchday'     // Europapokal-Runde (ec/cwc/uefa)
  | 'custom';

/** Ein Ereignis im Spielkalender. */
export interface CalendarEvent {
  id: string;
  /** ISO-Datum, an dem das Event stattfindet. */
  date: string;
  type: EventType;
  title: string;
  description: string;
  /** Optional zugehörige Match-ID (bei Spieltagen). */
  matchId?: string;
  /** Optional: Index der Pokalrunde (bei type 'cup_matchday' / 'euro_matchday'). */
  cupRoundIndex?: number;
  /** Optional: Europapokal-Wettbewerb (bei type 'euro_matchday'). */
  euroComp?: 'ec' | 'cwc' | 'uefa';
  /** Optional zugehörige Club-ID. */
  clubId?: string;
  /** Optional zugehörige Player-ID. */
  playerId?: string;
  /** Ob das Event bereits verarbeitet wurde. */
  processed: boolean;
  /** Ob das Event Aufmerksamkeit des Nutzers erfordert (z.B. Aufstellung). */
  requiresAction: boolean;
}

/**
 * Der Spielkalender mit Auto-Advance.
 * 1 Tag pro Sekunde, Start/Stop per Leertaste (isRunning).
 */
export interface GameCalendar {
  /** Aktuelles Spieldatum (ISO). */
  currentDate: string;
  /** Saison-Startdatum (ISO), z.B. 1980-08-15. */
  seasonStartDate: string;
  /** Saison-Enddatum (ISO), z.B. 1981-06-13. */
  seasonEndDate: string;
  /** Ob der Auto-Advance-Timer läuft (gesteuert per Leertaste). */
  isRunning: boolean;
  /** Geschwindigkeit in Millisekunden pro Tag (Default 1000 = 1 Tag/Sek). */
  speedMs: number;
  /** Alle Kalender-Events (chronologisch). */
  events: CalendarEvent[];
  /** Datum, bis zu dem der Nutzer vorspulen möchte (optional). */
  advanceUntil?: string;
  /**
   * Merker: Der Vorlauf wurde für eine Aktion (Spieltag, große Bewertung,
   * Saisonende …) angehalten, OHNE das Datum weiterzuschalten. So bleibt die
   * Zentrale auf dem korrekten Tag (z.B. AM Spieltag) stehen. Der Tageswechsel
   * wird beim Fortsetzen des Vorlaufs nachgeholt, damit jeder Tag genau einmal
   * verarbeitet wird.
   */
  pendingAdvance?: boolean;
}

// -----------------------------------------------------------------------------
// 14. TRAINING-SYSTEM
// -----------------------------------------------------------------------------

/** Schwerpunkt einer Trainingseinheit. */
export type TrainingFocus =
  | 'fitness'
  | 'technique'
  | 'tactics'
  | 'strength'
  | 'standards'   // Standardsituationen (Ecken, Freistöße, Elfmeter)
  | 'shooting'
  | 'defending'
  | 'passing'
  | 'recovery'    // Regeneration (niedrige Belastung)
  | 'rest';       // Ruhetag

/** Intensität einer Trainingseinheit. */
export type TrainingIntensity = 'low' | 'medium' | 'high' | 'very_high';

/** Eine einzelne Trainingseinheit (typischerweise pro Tag). */
export interface TrainingSession {
  id: string;
  /** Wochentag (0 = Montag ... 6 = Sonntag). */
  dayOfWeek: number;
  focus: TrainingFocus;
  intensity: TrainingIntensity;
  /** Belastungswert dieser Einheit (beeinflusst Fitness/Überlastung). */
  loadValue: number;
  /** Optionaler Attribut-Fokus für gezieltes Training. */
  targetAttributes?: AttributeKey[];
}

/** Der Wochen-Trainingsplan eines Vereins. */
export interface TrainingSchedule {
  /** 7 Einheiten (Mo–So). */
  sessions: TrainingSession[];
  /** Gesamt-Wochenintensität (abgeleitet). */
  weeklyIntensity: number;
  /**
   * Überbelastungs-Warnung: true, wenn kumulierte Last einen Grenzwert
   * überschreitet und Verletzungsrisiko steigt.
   */
  overloadWarning: boolean;
  /** Qualität der Trainingsanlagen (0–100), beeinflusst Effektivität. */
  facilitiesQuality: number;
}

/** Ergebnis eines Trainingsdurchlaufs für einen Spieler (für Rückmeldungen). */
export interface TrainingReport {
  playerId: string;
  date: string;
  /** Attribut-Veränderungen dieser Einheit/Periode. */
  attributeChanges: Partial<Record<AttributeKey, number>>;
  /** Veränderung der Fitness. */
  fitnessChange: number;
  /** Ob durch das Training eine Verletzung entstand. */
  injuryOccurred: boolean;
  /** Kurze Textnotiz. */
  note: string;
}

// -----------------------------------------------------------------------------
// 14b. WOCHEN-TRAININGSPLANER (vorgefertigte Trainingsblöcke, 7×3 Slots)
// -----------------------------------------------------------------------------

/** Thematische Kategorie eines vorgefertigten Trainingsblocks. */
export type TrainingBlockCategory =
  | 'conditioning'  // Ausdauer / Kondition
  | 'speed'         // Schnelligkeit / Antritt
  | 'strength'      // Kraft / Athletik
  | 'technique'     // Technik / Ballkontrolle
  | 'passing'       // Passspiel / Spielaufbau
  | 'shooting'      // Torschuss / Abschluss
  | 'defending'     // Verteidigung / Zweikampf
  | 'tactics'       // Taktik / Positionsspiel
  | 'goalkeeping'   // Torwarttraining
  | 'setpieces'     // Standardsituationen
  | 'heading'       // Kopfball
  | 'mental'        // Mentaltraining
  | 'matchplay'     // Spielformen / Match Practice
  | 'recovery';     // Regeneration

/** Intensität eines Trainingsblocks (bestimmt Fitness-Kosten & Lerntempo). */
export type BlockIntensity = 'low' | 'medium' | 'high';

/**
 * Ein vorgefertigter Trainingsblock, den der Manager in einen Slot ziehen/legen
 * kann. Jeder Block deckt bestimmte Attribute (mit Gewichtung 0..1) ab und hat
 * eine Intensität sowie einen Belastungswert (Fitness-Kosten-Basis).
 */
export interface TrainingBlock {
  id: string;
  name: string;
  icon: string;
  category: TrainingBlockCategory;
  intensity: BlockIntensity;
  /** Belastungswert (Fitness-Kosten-Basis pro Einheit, 0..10). */
  load: number;
  /** Abgedeckte Attribute mit Gewichtung (0..1, 1 = Hauptfokus). */
  attributes: Partial<Record<AttributeKey, number>>;
  /** Kurzbeschreibung für die UI. */
  description: string;
}

/** Die drei Trainings-Slots eines Tages (Block-IDs oder null = frei). */
export interface DaySlots {
  /** Einheit 1 (Vormittag). */
  slot1: string | null;
  /** Einheit 2 (Nachmittag). */
  slot2: string | null;
  /** Extraeinheit (zusätzliche Belastung). */
  extra: string | null;
}

/**
 * Wochen-Trainingsplan: 7 Tage (Index 0 = Montag … 6 = Sonntag), je 3 Slots.
 * An Tagen mit Pflichtspiel wird nicht trainiert (Slots gesperrt).
 */
export interface WeeklyTrainingPlan {
  days: DaySlots[];
}

// -----------------------------------------------------------------------------
// 14c. ENTWICKLUNGS-ERGEBNISSE (Auf-/Abwertungs-Screen)
// -----------------------------------------------------------------------------

/** Richtung einer Wertveränderung. */
export type DevDirection = 'up' | 'down';

/** Eine einzelne sichtbare Wertveränderung eines Spielers. */
export interface DevelopmentResult {
  /** Betroffenes Attribut, oder 'overall' für eine OVR-Änderung. */
  attribute: AttributeKey | 'overall';
  /** Deutscher Anzeigename des Attributs. */
  attributeLabel: string;
  oldValue: number;
  newValue: number;
  direction: DevDirection;
}

/**
 * Zusammengefasste Entwicklung EINES Spielers für die Auf-/Abwertungs-Präsentation
 * (Trommelwirbel-Screen). Bündelt alle Änderungen eines Bewertungslaufs.
 */
export interface PlayerDevReveal {
  playerId: string;
  /** Alle Einzelveränderungen (mind. eine). */
  changes: DevelopmentResult[];
  /** Netto-OVR-Richtung: >0 Aufwertung, <0 Abwertung, 0 gemischt/neutral. */
  netOvr: number;
  /** Begründungstext (aus dem Ereignis-Katalog). */
  reason: string;
  /** Selten: nicht beeinflussbares Lebensereignis (statt Trainings-Grund). */
  isLifeEvent: boolean;
}

// -----------------------------------------------------------------------------
// 15. TRANSFER-SYSTEM
// -----------------------------------------------------------------------------

/** Status eines Transferfensters. */
export type TransferWindowStatus = 'closed' | 'open';

/** Status eines Transferangebots. */
export type TransferStatus =
  | 'pending'      // wartet auf Antwort
  | 'accepted'     // Vereine einig
  | 'rejected'     // abgelehnt
  | 'negotiating'  // in Verhandlung
  | 'withdrawn'    // zurückgezogen
  | 'completed';   // abgeschlossen (Spieler gewechselt)

/** Ein Transferfenster (Zeitraum). */
export interface TransferWindow {
  status: TransferWindowStatus;
  /** ISO-Startdatum. */
  openDate: string;
  /** ISO-Enddatum (Deadline). */
  closeDate: string;
  /** Bezeichnung, z.B. "Sommer 1980" oder "Winter 1981". */
  label: string;
}

/** Ein Transferangebot zwischen zwei Vereinen. */
export interface TransferOffer {
  id: string;
  /** Betroffener Spieler (ID). */
  playerId: string;
  /** Verein, der abgibt (ID). */
  sellingClubId: string;
  /** Verein, der kauft (ID). */
  buyingClubId: string;
  /** Gebotene Ablösesumme in DM. */
  fee: number;
  /** Angebotenes Wochengehalt an den Spieler in DM. */
  proposedWage: number;
  /** Vertragslaufzeit in Jahren. */
  contractLength: number;
  status: TransferStatus;
  /** ISO-Datum des Angebots. */
  date: string;
  /** Ob der Nutzer der Initiator ist. */
  initiatedByPlayer: boolean;
  /** Optionale Gegenforderung / Verhandlungsnotiz. */
  counterOffer?: number;
  /** Ablauf-/Antwortfrist (ISO-Datum). */
  expiryDate: string;
}

// -----------------------------------------------------------------------------
// 16. NACHRICHTEN / INBOX
// -----------------------------------------------------------------------------

/** Kategorie einer Inbox-Nachricht. */
export type MessageCategory =
  | 'transfer'
  | 'injury'
  | 'match'
  | 'board'
  | 'contract'
  | 'training'
  | 'media'
  | 'cup'
  | 'milestone'
  | 'general';

/**
 * Eine Nachricht/E-Mail in der Inbox ("Nachrichten") des Nutzers.
 * Wird in der Liste als Betreff + Kurztext angezeigt und öffnet beim Anklicken
 * eine ausführliche E-Mail-Detailansicht (Absender, Betreff, Datum, Fließtext).
 */
export interface InboxMessage {
  id: string;
  /** ISO-Datum, an dem die Nachricht eintraf. */
  date: string;
  category: MessageCategory;
  /** Absender (z.B. "Sportdirektor", "Pressestelle", "Mannschaftsarzt"). */
  from: string;
  /** Betreffzeile. */
  subject: string;
  /** Kurztext / Vorschau in der Listenansicht. */
  shortText: string;
  /** Ausführlicher Fließtext für die Detailansicht. */
  bodyText: string;
  /** Gelesen-Status (für Ungelesen-Badge). */
  read: boolean;
  /** Ob eine Entscheidung / Aktion erforderlich ist. */
  actionRequired?: boolean;
  /** Optionale verknüpfte Entität (Spieler/Verein/Angebot). */
  relatedId?: string;
}

// -----------------------------------------------------------------------------
// 16a. DFB-POKAL (K.-o.-Wettbewerb)
// -----------------------------------------------------------------------------

/** Wie eine Pokalbegegnung entschieden wurde. */
export type CupTieDecision = 'regular' | 'aet' | 'penalties';

/** Eine einzelne K.-o.-Begegnung (Single-Leg) im DFB-Pokal. */
export interface CupTie {
  id: string;
  /** Index der Runde (0 = 1. Hauptrunde). */
  round: number;
  /** Heimverein (ID) — der zuerst gezogene Verein hat Heimrecht. */
  homeClubId: string;
  /** Auswärtsverein (ID). */
  awayClubId: string;
  /** ISO-Datum der Begegnung. */
  date: string;
  /** Ob die Begegnung bereits ausgespielt wurde. */
  played: boolean;
  /** Ob der vom Nutzer gesteuerte Verein beteiligt ist. */
  involvesPlayerClub: boolean;
  /** Vollständiges Match-Objekt (mit Events) nach dem Spiel, sonst null. */
  match: Match | null;
  /** Tore Heim nach regulärer Zeit + evtl. Verlängerung (null bis gespielt). */
  homeGoals: number | null;
  /** Tore Auswärts nach regulärer Zeit + evtl. Verlängerung. */
  awayGoals: number | null;
  /** Art der Entscheidung. */
  decision: CupTieDecision | null;
  /** Ergebnis des Elfmeterschießens (falls decision === 'penalties'). */
  penalties: { home: number; away: number } | null;
  /** Sieger der Begegnung (Club-ID), null bis entschieden. */
  winnerClubId: string | null;
}

/** Eine Runde im DFB-Pokal (z.B. Achtelfinale). */
export interface CupRound {
  /** Index der Runde (0-basiert). */
  index: number;
  /** Anzeigename der Runde (z.B. "Achtelfinale"). */
  name: string;
  /** ISO-Datum, an dem die Runde ausgetragen wird. */
  date: string;
  /** Ob die Auslosung dieser Runde bereits erfolgt ist. */
  drawn: boolean;
  /** Alle Begegnungen dieser Runde. */
  ties: CupTie[];
}

/** Gesamtzustand des DFB-Pokal-Wettbewerbs einer Saison. */
export interface CupState {
  /** Saison-Bezeichnung, z.B. "1980/81". */
  season: string;
  /** Deterministischer Seed für alle Auslosungen. */
  seed: number;
  /** IDs aller Teilnehmer (Bundesligisten + Amateurvereine). */
  participantIds: string[];
  /** IDs der eigens generierten Amateur-/Unterklassevereine. */
  amateurClubIds: string[];
  /** Alle Runden (chronologisch). */
  rounds: CupRound[];
  /** Index der aktuell laufenden/nächsten Runde. */
  currentRoundIndex: number;
  /** Preisgeld pro Runde in DM (pro gewonnener Begegnung). */
  prizeByRound: number[];
  /** Pokalsieger (Club-ID) am Saisonende, sonst null. */
  winnerClubId: string | null;
}

// -----------------------------------------------------------------------------
// 16b. MANAGER-PROFIL & NEUES-SPIEL-OPTIONEN
// -----------------------------------------------------------------------------

/** Bevorzugte taktische Grundhaltung des Managers (Selbsteinschätzung). */
export type ManagerStyle = 'defensive' | 'balanced' | 'attacking';

/**
 * Profil des vom Nutzer gesteuerten Managers.
 * Wird bei "Neues Spiel" angelegt und im Speicherstand mitgeführt.
 */
export interface ManagerProfile {
  /** Vollständiger Name des Managers/Trainers. */
  name: string;
  /** Selbstgewählte Nationalität. */
  nationality: string;
  /** Geburtsjahr (für Alter/Immersion). */
  birthYear: number;
  /** Bevorzugter Spielstil. */
  style: ManagerStyle;
  /** Kurze Trainer-Vita / Hintergrund (Immersion). */
  background: ManagerBackground;
  /** Optionaler Avatar-/Initialen-Seed. */
  avatarSeed: string;
}

/** Trainer-Hintergrund (beeinflusst Startbedingungen leicht / rein narrativ). */
export type ManagerBackground = 'legend' | 'ex_pro' | 'tactician' | 'rookie';

/** Schwierigkeitsgrad eines neuen Spiels. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Gesammelte Optionen für ein neues Spiel (aus dem Erstellungs-Screen). */
export interface NewGameOptions {
  managedClubId: string;
  manager: ManagerProfile;
  difficulty: Difficulty;
  /** Realistische Kader (an) oder zufälligere Streuung (aus). */
  realisticSquads: boolean;
  /** Verletzungen aktiviert. */
  injuriesEnabled: boolean;
  /** Auto-Advance-Geschwindigkeit in ms/Tag. */
  speedMs: number;
}

// -----------------------------------------------------------------------------
// 17. UI-STATE / NAVIGATION
// -----------------------------------------------------------------------------

/** Verfügbare Bildschirme / Screens der App. */
export type ScreenName =
  | 'setup'         // Spielerstellung (Verein & Punktesystem wählen)
  | 'dashboard'
  | 'squad'         // Kader
  | 'player'        // Spielerdetail
  | 'tactics'       // Taktik / Aufstellung
  | 'training'
  | 'transfers'
  | 'league_table'
  | 'fixtures'      // Spielplan
  | 'match'         // Live-Match / Ergebnis
  | 'finances'
  | 'calendar'
  | 'inbox'
  | 'club';         // Vereinsinfo

/** UI-/Navigations-Zustand. */
export interface UIState {
  /** Aktuell angezeigter Screen. */
  currentScreen: ScreenName;
  /** Aktuell ausgewählter Spieler (für Detailansicht). */
  selectedPlayerId: string | null;
  /** Aktuell ausgewähltes Match (für Match-Ansicht). */
  selectedMatchId: string | null;
  /** Aktuell ausgewählter Verein (für Vereinsansicht). */
  selectedClubId: string | null;
  /** Ob ein modales Fenster offen ist. */
  modalOpen: boolean;
  /** Bezeichnung des offenen Modals (falls vorhanden). */
  activeModal: string | null;
  /** Anzahl ungelesener Inbox-Nachrichten (für Badge). */
  unreadMessages: number;
  /** Ob die Erstkonfiguration abgeschlossen ist. */
  setupComplete: boolean;
}

// -----------------------------------------------------------------------------
// 18. SPIEL-EINSTELLUNGEN (Setup)
// -----------------------------------------------------------------------------

/** Bei der Spielerstellung gewählte Einstellungen. */
export interface GameSettings {
  /** Gewähltes Punktesystem (2- oder 3-Punkte-Regel). */
  pointSystem: PointSystem;
  /** ID des vom Nutzer gewählten Vereins. */
  managedClubId: string;
  /** Name des Managers/Trainers. */
  managerName: string;
  /** Saison-Bezeichnung, z.B. "1980/81". */
  season: string;
  /** Schwierigkeitsgrad. */
  difficulty: 'easy' | 'normal' | 'hard';
  /** Auto-Advance-Geschwindigkeit in ms pro Tag. */
  calendarSpeedMs: number;
}

// -----------------------------------------------------------------------------
// 19. ZENTRALER GAME-STATE
// -----------------------------------------------------------------------------

/**
 * Der zentrale, alles zusammenhaltende Spielzustand.
 * Wird persistiert (Save/Load) und via Context/Reducer verwaltet.
 */
export interface GameState {
  /** Version des Speicherstands (für Migrationen). */
  version: string;
  /** Ob ein Spiel initialisiert wurde. */
  initialized: boolean;

  /** Gewählte Einstellungen. */
  settings: GameSettings;

  /** Alle Vereine, indiziert per ID. */
  clubs: Record<string, Club>;
  /** Alle Spieler, indiziert per ID. */
  players: Record<string, Player>;

  /** Ligatabelle. */
  leagueTable: LeagueTable;
  /** Spielplan. */
  fixtures: Fixtures;

  /** Kalender mit Auto-Advance. */
  calendar: GameCalendar;

  /** Aktives/aktuelle Transferfenster. */
  currentTransferWindow: TransferWindow;
  /** Alle Transferangebote (aktiv & historisch). */
  transferOffers: TransferOffer[];

  /** Inbox-Nachrichten. */
  inbox: InboxMessage[];

  /** UI-/Navigationszustand. */
  ui: UIState;

  /** ID des vom Nutzer verwalteten Vereins (Convenience-Referenz). */
  managedClubId: string;

  /** Zeitstempel des letzten Speicherns (ISO). */
  lastSaved: string;
}

// -----------------------------------------------------------------------------
// 20. REDUCER-ACTIONS (optional, für State-Management)
// -----------------------------------------------------------------------------

/** Union aller möglichen State-Aktionen (Erweiterung durch spätere Phasen). */
export type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { settings: GameSettings; clubs: Record<string, Club>; players: Record<string, Player>; fixtures: Fixtures } }
  | { type: 'ADVANCE_DAY' }
  | { type: 'SET_CALENDAR_RUNNING'; payload: boolean }
  | { type: 'SET_CALENDAR_SPEED'; payload: number }
  | { type: 'NAVIGATE'; payload: ScreenName }
  | { type: 'SELECT_PLAYER'; payload: string | null }
  | { type: 'SELECT_MATCH'; payload: string | null }
  | { type: 'SELECT_CLUB'; payload: string | null }
  | { type: 'PLAY_MATCH'; payload: { matchId: string } }
  | { type: 'UPDATE_TACTICS'; payload: { clubId: string; tactics: Tactics } }
  | { type: 'UPDATE_TRAINING'; payload: { clubId: string; schedule: TrainingSchedule } }
  | { type: 'MAKE_TRANSFER_OFFER'; payload: TransferOffer }
  | { type: 'RESPOND_TRANSFER_OFFER'; payload: { offerId: string; status: TransferStatus } }
  | { type: 'MARK_MESSAGE_READ'; payload: string }
  | { type: 'UPDATE_LEAGUE_TABLE'; payload: LeagueTable }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL' }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'RESET_GAME' };

// -----------------------------------------------------------------------------
// 21. POTENZIAL-SYSTEM (Stern-basiert)
// -----------------------------------------------------------------------------

/** Rundet einen Sternwert auf das nächste 0.25-Raster. */
export function roundToQuarter(x: number): number {
  return Math.round(x * 4) / 4;
}

/** Begrenzt einen Sternwert auf [1.0, 5.0] und rastet ihn auf 0.25-Schritte. */
export function clampStars(x: number): number {
  return Math.max(1, Math.min(5, roundToQuarter(x)));
}

/**
 * Bänder für die Umrechnung Sterne ⇄ maximale Gesamtstärke.
 * [Stern-Min, Stern-Max, Rating-Min, Rating-Max]
 */
const STAR_BANDS: [number, number, number, number][] = [
  [1.0, 1.75, 60, 65],
  [2.0, 2.75, 66, 72],
  [3.0, 3.75, 73, 82],
  [4.0, 4.75, 83, 89],
  [5.0, 5.0, 90, 99],
];

/**
 * Wandelt Potenzial-Sterne in die maximal erreichbare Gesamtstärke (Softcap) um.
 * Innerhalb eines Bandes wird linear interpoliert; 5.0 Sterne erreichen 99.
 */
export function starsToPotential(stars: number): number {
  const s = clampStars(stars);
  for (const [smin, smax, rmin, rmax] of STAR_BANDS) {
    if (s >= smin && s <= smax) {
      if (smax === smin) return rmax; // 5.0 → Höchstwert
      const frac = (s - smin) / (smax - smin);
      return Math.round(rmin + frac * (rmax - rmin));
    }
  }
  return 60;
}

/**
 * Inverse von {@link starsToPotential}: leitet aus einer maximal erreichbaren
 * Gesamtstärke die passenden Potenzial-Sterne (0.25-Raster) ab.
 */
export function potentialToStars(maxRating: number): number {
  const r = Math.max(50, Math.min(99, Math.round(maxRating)));
  for (const [smin, smax, rmin, rmax] of STAR_BANDS) {
    if (r >= rmin && r <= rmax) {
      if (rmax === rmin) return smin;
      const frac = (r - rmin) / (rmax - rmin);
      return clampStars(smin + frac * (smax - smin));
    }
  }
  // Unterhalb aller Bänder (Rating < 60) → Minimum
  return r < 60 ? 1.0 : 5.0;
}

/** Deutsche Anzeigenamen aller Attribute (für Training, Entwicklung & UI). */
export const ATTRIBUTE_LABELS_DE: Record<AttributeKey, string> = {
  fitness: 'Fitness', stamina: 'Ausdauer', speed: 'Schnelligkeit', acceleration: 'Antritt',
  strength: 'Kraft', jumping: 'Sprungkraft', agility: 'Agilität', balance: 'Balance',
  technique: 'Technik', firstTouch: 'Ballannahme', shooting: 'Torschuss', shotPower: 'Schusskraft',
  longShots: 'Distanzschuss', passing: 'Passspiel', longPassing: 'Langer Ball', crossing: 'Flanken',
  dribbling: 'Dribbling', ballControl: 'Ballkontrolle', heading: 'Kopfball',
  tackling: 'Tackling', marking: 'Manndeckung', positioning: 'Stellungsspiel', interceptions: 'Abfangen',
  experience: 'Erfahrung', vision: 'Übersicht', composure: 'Nervenstärke', concentration: 'Konzentration',
  decisions: 'Entscheidung', leadership: 'Führung', workRate: 'Arbeitseinsatz', aggression: 'Aggressivität',
  teamwork: 'Teamwork', flair: 'Kreativität',
  reflexes: 'Reflexe', handling: 'Fangsicherheit', kicking: 'Abschlag', aerialReach: 'Strafraum',
  oneOnOnes: 'Eins-gegen-Eins', communication: 'Kommandostärke',
  penalties: 'Elfmeter', freeKicks: 'Freistöße', corners: 'Eckbälle',
};

/**
 * Rendert Potenzial-Sterne als Text, z.B. 3.0 → "★★★☆☆", 3.5 → "★★★⯨☆".
 * Volle Sterne: ★  · Halbe Sterne: ⯨  · Leere Sterne: ☆
 */
export function renderStars(stars: number): string {
  const s = Math.max(0, Math.min(5, stars));
  const full = Math.floor(s);
  const half = s - full >= 0.25 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(Math.max(0, empty));
}

// =============================================================================
// Ende der Typ-Definitionen
// =============================================================================
