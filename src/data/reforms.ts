// =============================================================================
// 1975 – A Football Manager — LIGAREFORM-SYSTEM (datengetriebene Struktur-Migrationen)
// =============================================================================
// Historische Umbauten der deutschen Ligastruktur werden als ATOMARE Reform-
// Datensätze abgebildet. Jede Reform beschreibt die neue Soll-Struktur der
// Ligapyramide ab einer bestimmten Saison sowie die Qualifikationsregel, nach der
// die bestehenden Vereine der alten Struktur zugeordnet werden.
//
// Beim Saisonwechsel prüft die Engine (App.tsx / startNextSeason), ob für die neue
// Saison eine noch nicht angewandte Reform vorliegt. Wenn ja, wird – integriert in
// den normalen Auf-/Abstieg – die Struktur-Migration ausgeführt:
//   1. alte Saison abschließen (Endtabellen)         [in startNextSeason]
//   2. sportliche Qualifikanten je Regel bestimmen
//   3. Playoffs/Aufstiegsrunden (vereinfacht)
//   4. Lizenzprüfung (vereinfacht: sportlich = lizenziert)
//   5. reformbedingte Zusatzqualifikation
//   6. Vereine geografisch (Nord/Süd/…) zuweisen
//   7. Sollgrößen prüfen: fehlende Plätze mit KLAR FIKTIVEN Platzhaltern füllen
//      oder überzählige Vereine dokumentiert entfernen
//   8. neue Spielpläne generieren                     [in startNextSeason]
//   9. alte Tabellen archivieren / sauber ersetzen    [in startNextSeason]
//
// ERWEITERBAR: Weitere Reformen werden als zusätzlicher Datensatz in LEAGUE_REFORMS
// ergänzt und – falls die Umlagerung bespoke ist – als eigener Migrations-Zweig in
// computeSeasonTransition (data/reformTransition.ts) angedockt. Staffeln werden über
// ihre Kennung `group` gefunden, Vereine nach Region zugeordnet (data/regionGeo.ts).
// Nur die Spielerliga nutzt die volle Match-Engine; alle neuen/zusätzlichen Ebenen
// werden performant per Stärke simuliert (siehe engine/leagues.ts).
// =============================================================================

import {
  LeagueGroup, SimClub, mulberry32, hashStr, groupLabel,
} from '../engine/leagues';
import { seasonStartYear } from './timeline';
import { nextSeq } from '../engine/idSeq';

// -----------------------------------------------------------------------------
// Datenmodell
// -----------------------------------------------------------------------------

/** Eine Ziel-Division (Ebene/Staffel) in der Soll-Struktur einer Epoche. */
export interface DivisionTarget {
  /** Stabile Divisions-ID (z. B. 'tier2', 'tier3-nord'). */
  id: string;
  tier: number;
  group: LeagueGroup;
  /** Anzeigename (z. B. '2. Liga', 'Regionalliga Nord', '3. Liga'). */
  name: string;
  /** Sollgröße (Anzahl Vereine) – muss GERADE sein (Spielplan-Generator). */
  teamCount: number;
  /** Nur obere Liga: so viele Aufsteiger aus der Ebene darunter (fehlt = je Staffel einer, mind. 3).
   *  Weniger Plätze als Staffeln → Aufstiegsrunde der Meister (reformTransition.ts). */
  upSlots?: number;
  /** Nur Staffel: der Vizemeister spielt die Aufstiegsrunde mit (Regionalliga Südwest 2012–2018). */
  playoffRunnerUp?: boolean;
}

/** Ein atomarer Ligareform-Datensatz. */
export interface LeagueReform {
  reformId: string;
  /** Saison, zu deren Beginn die Reform wirksam wird (z. B. '1981/82'). */
  effectiveSeason: string;
  title: string;
  description: string;
  /** Betroffene Ebenen (für Chronik/Doku). */
  affectedTiers: number[];
  /** Menschliche Beschreibung der Qualifikationsregel. */
  qualificationRule: string;
  /** VOLLSTÄNDIGE Soll-Struktur der Pyramide ab dieser Saison. */
  targetStructure: DivisionTarget[];
}

// -----------------------------------------------------------------------------
// Struktur-Definitionen je Epoche
// -----------------------------------------------------------------------------

/** Basisstruktur 1975/76–1980/81: 1. Liga + zweigleisige 2. Liga (Nord/Süd). */
export const BASE_STRUCTURE: DivisionTarget[] = [
  { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
  { id: 'tier2-nord', tier: 2, group: 'nord', name: '2. Liga Nord', teamCount: 20 },
  { id: 'tier2-sued', tier: 2, group: 'sued', name: '2. Liga Süd', teamCount: 20 },
];

/**
 * Die zentrale Reform-Chronik (nach Saison aufsteigend).
 * Jede Reform trägt die komplette Soll-Struktur ab ihrer Saison.
 */
export const LEAGUE_REFORMS: LeagueReform[] = [
  // ---------------------------------------------------------------------------
  // 1981/82 — Eingleisige 2. 1. Liga
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-1981-single-second',
    effectiveSeason: '1981/82',
    title: 'Eingleisige 2. 1. Liga',
    description:
      'Zur Saison 1981/82 werden die beiden Staffeln Nord und Süd der 2. Liga zu '
      + 'einer EINGLEISIGEN 2. Liga mit 20 Vereinen (38 Spieltage) zusammengeführt. '
      + 'Die regionale Meister-/Playoff-Logik entfällt zugunsten einer einheitlichen '
      + 'Tabelle.',
    affectedTiers: [2],
    qualificationRule:
      'Die besten 10 Vereine jeder Staffel (Nord + Süd) der Saison 1980/81 bilden die '
      + 'neue eingleisige 2. Liga. Aufsteiger in die 1. Liga werden zuvor abgezogen und '
      + 'durch die 3 Erstliga-Absteiger ersetzt. Die übrigen Vereine steigen in die '
      + 'regionalen Amateurligen ab (aus der Simulation entfernt).',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 20 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 1991/92 — Deutsche Wiedervereinigung im Fußball
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-1991-reunification',
    effectiveSeason: '1991/92',
    title: 'Deutsche Wiedervereinigung im Fußball',
    description:
      'Zur Saison 1991/92 wird das DDR-Ligasystem in die gesamtdeutsche Ligapyramide '
      + 'integriert. Die zwei besten DDR-Oberliga-Vereine steigen direkt in die 1. Liga '
      + 'auf, die für DIESE EINE Saison auf 20 Vereine (38 Spieltage) vergrößert wird. '
      + 'Vier weitere DDR-Vereine wechseln direkt in die 2. Liga, zwei weitere über eine '
      + 'Aufstiegsrunde. Die übrigen DDR-Vereine bilden als NOFV-Oberliga die dritte '
      + 'Ebene (Nordost). Die separat geführte DDR-Struktur wird damit aufgelöst.',
    affectedTiers: [1, 2, 3],
    qualificationRule:
      'DDR-Oberliga-Endstand 1990/91: Platz 1–2 → 1. Liga (auf 20 aufgestockt), '
      + 'Platz 3–6 → 2. Liga (direkt), Platz 7–8 → 2. Liga (Aufstiegsrunde), Rest der '
      + 'DDR-Oberliga + DDR-Liga → NOFV-Oberliga (Ebene 3, Nordost). '
      + 'NORMALISIERUNG: Die einmalig vergrößerte 1. Liga (20) und 2. Liga werden ab der '
      + 'Folgesaison 1992/93 durch den regulären Auf-/Abstieg schrittweise auf die '
      + 'Sollgrößen (18 bzw. 20) zurückgeführt – d. h. in jener Saison steigen '
      + 'entsprechend MEHR Vereine ab (siehe normalizeToSteady).',
    targetStructure: [
      // SOLL-(Steady-)Struktur ab 1991/92. Die 1991/92 selbst startet einmalig
      // ÜBERGROSS (Tier 1 = 20, Tier 2 vergrößert); die Normalisierung auf diese
      // Sollgrößen erfolgt über die Folgesaisons (normalizeToSteady).
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 20 },
      { id: 'tier3-nordost', tier: 3, group: 'nordost', name: 'NOFV-Oberliga', teamCount: 18 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 1994/95 — Regionalliga als dritte Ebene (vier Staffeln), 2. Liga mit 18 Vereinen
  // Quellen: de.wikipedia „2. Fußball-Bundesliga 1993/94“ (20 Vereine, Verkleinerung auf 18),
  // „2. Fußball-Bundesliga 1994/95“ (18 Vereine, 34 Spieltage); Weltdaten ger 1993 → 1994:
  // 3 Auf-/3 Absteiger zur 1. Liga, 5 Absteiger in die Regionalliga, 3 Aufsteiger.
  // Aufstieg aus der Regionalliga: 1994–2000 die vier Meister (vier Absteiger), 2000–2008
  // je zwei aus Nord/Süd (upSlots 4), ab 2008 3. Liga (vereinfacht drei direkte statt
  // zwei + Relegation).
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-1994-regionalliga',
    effectiveSeason: '1994/95',
    title: 'Regionalliga als 3. Ebene',
    description:
      'Zur Saison 1994/95 wird unterhalb der 2. Liga eine neue dritte Ebene '
      + 'eingeführt: die REGIONALLIGA mit vier regionalen Staffeln (Nord, Nordost, '
      + 'West, Süd) zu je 18 Vereinen. Ab sofort ist Auf-/Abstieg zwischen 2. Liga '
      + 'und Regionalliga möglich. Die 2. Liga wird zugleich von 20 auf 18 Vereine '
      + 'verkleinert (34 Spieltage).',
    affectedTiers: [3],
    qualificationRule:
      'Die vier Regionalliga-Staffeln werden mit klar fiktiven Platzhaltervereinen '
      + '(erkennbar erfundene Städtenamen) besetzt, da die realen Amateuroberligen '
      + 'nicht Teil der Simulation sind. Geografische Zuweisung Nord/Nordost/West/Süd. '
      + 'Ab 1995/96: pro Staffel steigt der Meister auf, aus der 2. Liga steigen 4 ab. '
      + 'Die 2. Liga hat ab 1994/95 18 Vereine: in der Umbau-Saison steigen deshalb fünf '
      + 'Zweitligisten in die Regionalliga ab.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 18 },
      { id: 'tier3-nord', tier: 3, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier3-nordost', tier: 3, group: 'nordost', name: 'Regionalliga Nordost', teamCount: 18 },
      { id: 'tier3-west', tier: 3, group: 'west', name: 'Regionalliga West', teamCount: 18 },
      { id: 'tier3-sued', tier: 3, group: 'sued', name: 'Regionalliga Süd', teamCount: 18 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 2000/01 — Regionalliga zweigleisig (Nord, Süd)
  // Quellen: de.wikipedia „Fußball-Regionalliga 1999/2000“ (letzte Saison mit vier Staffeln,
  // zugleich Qualifikation), en.wikipedia „2000–01 Regionalliga“ (Nord und Süd, je 18;
  // je Staffel steigen zwei in die 2. Liga auf), „Regionalliga West/Südwest“ (aufgelöst 2000:
  // NRW → Nord, Rheinland-Pfalz/Saarland → Süd; Nordosten → Nord).
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-2000-regionalliga',
    effectiveSeason: '2000/01',
    title: 'Regionalliga nur noch zweigleisig',
    description:
      'Zur Saison 2000/01 wird die Regionalliga von vier auf zwei Staffeln zu je 18 Vereinen '
      + 'verkleinert: Nord (Norden, Nordosten, Nordrhein-Westfalen) und Süd (Bayern, '
      + 'Baden-Württemberg, Hessen, Rheinland-Pfalz, Saarland). Je Staffel steigen die ersten '
      + 'zwei in die 2. Liga auf, aus der 2. Liga steigen vier ab.',
    affectedTiers: [3],
    qualificationRule:
      'Die Saison 1999/2000 gilt als Qualifikation: Nach Auf- und Abstieg werden alle Vereine der '
      + 'dritten Ebene nach Region auf Nord und Süd verteilt; hat eine Region mehr Vereine als '
      + 'Plätze, steigen die Schwächsten in die Amateurligen ab.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 18, upSlots: 4 },
      { id: 'tier3-nord', tier: 3, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier3-sued', tier: 3, group: 'sued', name: 'Regionalliga Süd', teamCount: 18 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 2008/09 — Einführung der 3. Liga (eingleisig), Regionalliga wird 4. Ebene
  // Quelle: https://en.wikipedia.org/wiki/Regionalliga (2008–2012: drei Staffeln
  // Nord = Norden + Nordosten, West = Nordrhein-Westfalen + Rheinland-Pfalz/Saar,
  // Süd = Bayern + Hessen + Baden-Württemberg, je 18 Vereine).
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-2008-third-league',
    effectiveSeason: '2008/09',
    title: 'Einführung der 3. Liga',
    description:
      'Zur Saison 2008/09 wird zwischen 2. Liga und Regionalliga eine neue, '
      + 'eingleisige und vom Verband verwaltete 3. LIGA mit 20 Vereinen eingezogen. Die '
      + 'Regionalliga rückt auf Ebene 4 und hat nur noch drei Staffeln zu je 18 Vereinen: '
      + 'Nord (Norden und Nordosten), West (Nordrhein-Westfalen, Rheinland-Pfalz, Saarland) '
      + 'und Süd (Bayern, Hessen, Baden-Württemberg). Die drei Meister steigen in die 3. Liga '
      + 'auf, aus der 3. Liga steigen drei ab.',
    affectedTiers: [3, 4],
    qualificationRule:
      'Die besten zehn Vereine beider bisherigen Regionalliga-Staffeln (2007/08) '
      + 'qualifizieren sich sportlich für die 20 Startplätze der neuen 3. Liga '
      + '(vereinfachte Lizenzprüfung: sportlich = lizenziert). Die übrigen Vereine '
      + 'bilden nach Region die neue viertklassige Regionalliga Nord/West/Süd (hat eine Region '
      + 'mehr Vereine als Plätze, steigen die Schwächsten in die Amateurligen ab); fehlende '
      + 'Plätze werden aus den Amateurligen bzw. mit klar fiktiven Platzhaltern aufgefüllt.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 18 },
      { id: 'tier3', tier: 3, group: null, name: '3. Liga', teamCount: 20, upSlots: 3 },
      { id: 'tier4-nord', tier: 4, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier4-west', tier: 4, group: 'west', name: 'Regionalliga West', teamCount: 18 },
      { id: 'tier4-sued', tier: 4, group: 'sued', name: 'Regionalliga Süd', teamCount: 18 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 2012/13 — Regionalliga-Reform: fünf Staffeln
  // Quellen: https://en.wikipedia.org/wiki/Regionalliga (ab 2012: Nord, Nordost,
  // West, Südwest = Rheinland-Pfalz/Saar/Hessen/Baden-Württemberg, Bayern; Aufstieg
  // 2012/13–2017/18: fünf Meister + Vizemeister Südwest spielen drei Plätze in
  // Hin- und Rückspiel aus), https://de.wikipedia.org/wiki/Fu%C3%9Fball-Regionalliga_2012/13
  // (2012/13: Nord 18, Nordost 16, West 20, Südwest 19, Bayern 20 Vereine).
  // VEREINFACHT: Südwest 18 statt 19 (Spielplan braucht gerade Zahlen); die
  // Relegation wird als drei geloste Duelle per Stärke entschieden (kein Spielplan);
  // die Sonderregel ab 2018/19 (Südwest-Meister direkt) ist nicht abgebildet.
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-2012-regionalliga',
    effectiveSeason: '2012/13',
    title: 'Regionalliga-Reform: fünf Staffeln',
    description:
      'Zur Saison 2012/13 wird die viertklassige Regionalliga neu geordnet: Statt drei gibt '
      + 'es nun fünf Staffeln, getragen von den Regionalverbänden – Nord (Niedersachsen, '
      + 'Bremen, Hamburg, Schleswig-Holstein), Nordost (Berlin und die neuen Länder), West '
      + '(Nordrhein-Westfalen), Südwest (Rheinland-Pfalz, Saarland, Hessen, Baden-Württemberg) '
      + 'und Bayern. Je Staffel höchstens sieben zweite Mannschaften.',
    affectedTiers: [4],
    qualificationRule:
      'Die Vereine der bisherigen Regionalliga Nord/West/Süd werden nach ihrer Region auf die '
      + 'fünf neuen Staffeln verteilt; die zusätzlichen Plätze gehen an Vereine aus den '
      + 'Amateurligen der Region (sonst klar fiktive Platzhalter). Ab 2012/13 steigen nur noch '
      + 'drei Vereine auf: Die fünf Meister und der Vizemeister Südwest spielen in drei '
      + 'gelosten Duellen um den Aufstieg, aus der 3. Liga steigen drei ab.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 18 },
      { id: 'tier3', tier: 3, group: null, name: '3. Liga', teamCount: 20, upSlots: 3 },
      { id: 'tier4-nord', tier: 4, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier4-nordost', tier: 4, group: 'nordost', name: 'Regionalliga Nordost', teamCount: 16 },
      { id: 'tier4-west', tier: 4, group: 'west', name: 'Regionalliga West', teamCount: 20 },
      { id: 'tier4-suedwest', tier: 4, group: 'suedwest', name: 'Regionalliga Südwest', teamCount: 18, playoffRunnerUp: true },
      { id: 'tier4-bayern', tier: 4, group: 'bayern', name: 'Regionalliga Bayern', teamCount: 20 },
    ],
  },
];

/** Liefert die Soll-Struktur für eine Saison (letzte wirksame Reform, sonst Basis). */
export function structureForSeason(season: string): DivisionTarget[] {
  const y = seasonStartYear(season);
  let best: DivisionTarget[] = BASE_STRUCTURE;
  let bestYear = -1;
  for (const r of LEAGUE_REFORMS) {
    const ry = seasonStartYear(r.effectiveSeason);
    if (ry <= y && ry > bestYear) { best = r.targetStructure; bestYear = ry; }
  }
  return best;
}

/** Die zur neuen Saison fällige, noch nicht angewandte Reform (oder null). */
export function pendingReform(newSeason: string, appliedReforms: string[]): LeagueReform | null {
  const applied = new Set(appliedReforms);
  return LEAGUE_REFORMS.find((r) => r.effectiveSeason === newSeason && !applied.has(r.reformId)) ?? null;
}

// -----------------------------------------------------------------------------
// Klar FIKTIVE Platzhaltervereine (zum Auffüllen neuer/größerer Ebenen)
// -----------------------------------------------------------------------------
const FICT_CITIES = [
  'Musterstadt', 'Beispielheim', 'Platzhausen', 'Fiktivingen', 'Schablonau',
  'Exempelburg', 'Attrappenau', 'Dummendorf', 'Musterbach', 'Beispielfurt',
  'Platzberg', 'Schemenstadt', 'Blaupausen', 'Vorlagheim', 'Teststetten',
  'Musterhofen', 'Beispieldorf', 'Fiktheim', 'Platzkirchen', 'Exempeldorf',
  'Attrappenheim', 'Schablonberg', 'Musterwalde', 'Beispielau', 'Platzendorf',
  'Fiktenau', 'Schemendorf', 'Musterfeld', 'Beispielbrück', 'Platzsee',
];
const FICT_PREFIX = ['FC', 'SV', 'TSV', 'VfL', 'SpVgg', 'SC', '1. FC', 'FV'];
const FICT_COLORS = ['#2E7D32', '#1565C0', '#C62828', '#6A1B9A', '#EF6C00', '#00838F', '#455A64', '#AD1457'];

/** Erzeugt einen klar fiktiven Platzhalterverein für Ebene/Staffel (Nummer aus dem Spielstand, engine/idSeq.ts). */
export function makePlaceholder(seedKey: string, tier: number, group: LeagueGroup): SimClub {
  const idx = `s${nextSeq().toString(36)}`;
  const rng = mulberry32(hashStr(`${seedKey}:${tier}:${group}:${idx}`));
  const city = FICT_CITIES[Math.floor(rng() * FICT_CITIES.length)];
  const prefix = FICT_PREFIX[Math.floor(rng() * FICT_PREFIX.length)];
  const name = `${prefix} ${city}`;
  const base = tier <= 3 ? 50 : 44;
  const strength = Math.max(30, Math.min(70, Math.round(base + (rng() * 8 - 4))));
  const primary = FICT_COLORS[Math.floor(rng() * FICT_COLORS.length)];
  const short = (city.slice(0, 3)).toUpperCase();
  return {
    id: `ph-t${tier}-${group ?? 'x'}-${idx}`,
    name, shortName: short, city, strength,
    colors: { primary, secondary: '#FFFFFF' }, tier, group,
  };
}

/** Kurzlabel einer Division für Nachrichten (nutzt Name, sonst Tier/Gruppe). */
export function divisionShort(name: string, group: LeagueGroup): string {
  return group ? `${name}` : name || groupLabel(group);
}
