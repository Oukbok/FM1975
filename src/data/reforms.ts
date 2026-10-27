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
// ERWEITERBAR: Weitere Reformen (z. B. DDR-Wiedervereinigung 1991/92) werden als
// zusätzlicher Datensatz in LEAGUE_REFORMS ergänzt und – falls die Umlagerung
// bespoke ist – als eigener Migrations-Zweig in computeSeasonTransition angedockt.
// Nur die Spielerliga nutzt die volle Match-Engine; alle neuen/zusätzlichen Ebenen
// werden performant per Stärke simuliert (siehe engine/leagues.ts).
// =============================================================================

import {
  LeagueGroup, SimClub, DivisionMeta, mulberry32, hashStr, groupLabel,
} from '../engine/leagues';
import { seasonStartYear } from './timeline';

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
  // 1994/95 — Regionalliga als dritte Ebene (vier Staffeln)
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-1994-regionalliga',
    effectiveSeason: '1994/95',
    title: 'Regionalliga als 3. Ebene',
    description:
      'Zur Saison 1994/95 wird unterhalb der 2. Liga eine neue dritte Ebene '
      + 'eingeführt: die REGIONALLIGA mit vier regionalen Staffeln (Nord, Nordost, '
      + 'West, Süd) zu je 18 Vereinen. Ab sofort ist Auf-/Abstieg zwischen 2. Liga '
      + 'und Regionalliga möglich.',
    affectedTiers: [3],
    qualificationRule:
      'Die vier Regionalliga-Staffeln werden mit klar fiktiven Platzhaltervereinen '
      + '(erkennbar erfundene Städtenamen) besetzt, da die realen Amateuroberligen '
      + 'nicht Teil der Simulation sind. Geografische Zuweisung Nord/Nordost/West/Süd. '
      + 'Ab 1995/96: pro Staffel steigt der Meister auf, aus der 2. Liga steigen 4 ab.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 20 },
      { id: 'tier3-nord', tier: 3, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier3-nordost', tier: 3, group: 'nordost', name: 'Regionalliga Nordost', teamCount: 18 },
      { id: 'tier3-west', tier: 3, group: 'west', name: 'Regionalliga West', teamCount: 18 },
      { id: 'tier3-sued', tier: 3, group: 'sued', name: 'Regionalliga Süd', teamCount: 18 },
    ],
  },
  // ---------------------------------------------------------------------------
  // 2008/09 — Einführung der 3. Liga (eingleisig), Regionalliga wird 4. Ebene
  // ---------------------------------------------------------------------------
  {
    reformId: 'reform-2008-third-league',
    effectiveSeason: '2008/09',
    title: 'Einführung der 3. Liga',
    description:
      'Zur Saison 2008/09 wird zwischen 2. Liga und Regionalliga eine neue, '
      + 'eingleisige und vom Verband verwaltete 3. LIGA mit 20 Vereinen eingezogen. Die '
      + 'bisherige Regionalliga rückt auf Ebene 4 (nun drei Staffeln: Nord, Nordost, '
      + 'Süd zu je 18). Auf-/Abstieg gilt fortan 2.↔3. Liga und 3. Liga↔Regionalliga.',
    affectedTiers: [3, 4],
    qualificationRule:
      'Die besten 5 Vereine jeder der vier bisherigen Regionalliga-Staffeln (2007/08) '
      + 'qualifizieren sich sportlich für die 20 Startplätze der neuen 3. Liga '
      + '(vereinfachte Lizenzprüfung: sportlich = lizenziert). Die übrigen Vereine '
      + 'bilden die neue viertklassige Regionalliga (3 Staffeln), fehlende Plätze '
      + 'werden mit klar fiktiven Platzhaltern aufgefüllt.',
    targetStructure: [
      { id: 'tier1', tier: 1, group: null, name: '1. Liga', teamCount: 18 },
      { id: 'tier2', tier: 2, group: null, name: '2. Liga', teamCount: 20 },
      { id: 'tier3', tier: 3, group: null, name: '3. Liga', teamCount: 20 },
      { id: 'tier4-nord', tier: 4, group: 'nord', name: 'Regionalliga Nord', teamCount: 18 },
      { id: 'tier4-nordost', tier: 4, group: 'nordost', name: 'Regionalliga Nordost', teamCount: 18 },
      { id: 'tier4-sued', tier: 4, group: 'sued', name: 'Regionalliga Süd', teamCount: 18 },
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
// Geografie (vereinfacht) — Nord/Süd-Ordnung für Staffelzuweisung
// -----------------------------------------------------------------------------
// Grobe „Nord-Wert"-Schätzung je Stadt (höher = nördlicher). Für bekannte reale
// Städte hinterlegt, sonst deterministisch aus dem Namen abgeleitet. Dient der
// geografischen Verteilung von Absteigern in Staffeln und der Aufteilung neuer
// Ebenen in regionale Staffeln.
const CITY_NORTH: Record<string, number> = {
  'Hamburg': 98, 'Kiel': 100, 'Bremen': 92, 'Hannover': 82, 'Wolfsburg': 84,
  'Braunschweig': 80, 'Osnabrück': 83, 'Oldenburg': 90, 'Lübeck': 97, 'Rostock': 96,
  'Berlin': 85, 'Magdeburg': 80, 'Leipzig': 66, 'Dresden': 60, 'Cottbus': 72,
  'Erfurt': 60, 'Jena': 60, 'Chemnitz': 56, 'Halle': 68,
  'Dortmund': 72, 'Essen': 72, 'Duisburg': 72, 'Gelsenkirchen': 73, 'Bochum': 72,
  'Düsseldorf': 68, 'Köln': 64, 'Mönchengladbach': 68, 'Wuppertal': 70, 'Krefeld': 71,
  'Münster': 78, 'Bielefeld': 78, 'Aachen': 62, 'Leverkusen': 66,
  'Frankfurt': 50, 'Offenbach': 50, 'Mainz': 48, 'Wiesbaden': 49, 'Kassel': 62,
  'Saarbrücken': 40, 'Kaiserslautern': 42, 'Mannheim': 42, 'Karlsruhe': 38,
  'Stuttgart': 34, 'Freiburg': 24, 'Reutlingen': 30, 'Ulm': 28,
  'München': 22, 'Nürnberg': 40, 'Augsburg': 26, 'Fürth': 40, 'Regensburg': 34,
  'Ingolstadt': 30, 'Kempten': 18, 'Rosenheim': 18, 'Landshut': 26, 'Passau': 28,
};

function cityNorth(city: string): number {
  if (city in CITY_NORTH) return CITY_NORTH[city];
  // Deterministischer Fallback im mittleren Bereich (30..80).
  return 30 + (hashStr(city || 'x') % 51);
}

/** Ost-Reihung (höher = östlicher) – grob, für die Nordost-Zuordnung. */
const CITY_EAST: Record<string, number> = {
  'Berlin': 90, 'Magdeburg': 78, 'Leipzig': 82, 'Dresden': 92, 'Cottbus': 95,
  'Erfurt': 74, 'Jena': 76, 'Chemnitz': 84, 'Halle': 76, 'Rostock': 80,
};
function cityEast(city: string): number {
  if (city in CITY_EAST) return CITY_EAST[city];
  return hashStr('e:' + (city || 'x')) % 60; // West/Mitte-Bereich
}

// Rang einer Staffel-Kennung für die geografische Sortierung (Nord zuerst).
function groupNorthRank(g: LeagueGroup): number {
  switch (g) {
    case 'nord': return 4;
    case 'nordost': return 3;
    case 'west': return 2;
    case 'sued': return 1;
    default: return 0;
  }
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

let _phCounter = 0;
/** Erzeugt einen klar fiktiven Platzhalterverein für Ebene/Staffel. */
function makePlaceholder(seedKey: string, tier: number, group: LeagueGroup): SimClub {
  const idx = _phCounter++;
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

// -----------------------------------------------------------------------------
// Transition-Typen
// -----------------------------------------------------------------------------

/** Endstand einer Division vor dem Saisonwechsel. */
export interface CurrentDivision {
  id: string;
  tier: number;
  group: LeagueGroup;
  name: string;
  /** Abschlusstabelle: geordnete Verein-IDs (Meister zuerst). */
  orderedIds: string[];
}

export interface TransitionContext {
  newSeason: string;
  current: CurrentDivision[];
  strengthOf: (id: string) => number;
  cityOf: (id: string) => string;
  appliedReforms: string[];
  /** Verein des Spielers – darf NIE aus der Simulation fallen (Schutz bei Reformen). */
  protectedId?: string;
}

export interface TransitionResult {
  /** Neue Mitgliedschaften je Division (mit Meta der Zielstruktur). */
  divisions: { meta: DivisionMeta; ids: string[] }[];
  /** Neu erzeugte fiktive Platzhalter (in game.simClubs aufzunehmen). */
  placeholders: SimClub[];
  /** Aus der Pyramide entfernte Vereine (aus game.simClubs zu löschen). */
  dropped: string[];
  /** Die angewandte Reform (falls diese Saison eine Reform trägt), sonst null. */
  reform: LeagueReform | null;
  /** Aufsteiger in die 1. Liga (für Nachrichten). */
  promotedTop: string[];
  /** Absteiger aus der 1. Liga (für Nachrichten). */
  relegatedTop: string[];
}

// -----------------------------------------------------------------------------
// Verteil-Helfer: Vereine geografisch auf Staffeln aufteilen + auffüllen
// -----------------------------------------------------------------------------
// Verteilt `ids` (geografisch grob nach Nord→Süd) auf die Ziel-Staffeln `targets`
// (gleiche Ebene) und füllt fehlende Plätze mit fiktiven Platzhaltern auf.
function distributeToGroups(
  ids: string[],
  targets: DivisionTarget[],
  cityOf: (id: string) => string,
  seedKey: string,
): { result: { meta: DivisionMeta; ids: string[] }[]; placeholders: SimClub[] } {
  const sortedTargets = [...targets].sort((a, b) => groupNorthRank(b.group) - groupNorthRank(a.group));
  const sortedIds = [...ids].sort((a, b) => cityNorth(cityOf(b)) - cityNorth(cityOf(a)));
  const result: { meta: DivisionMeta; ids: string[] }[] = [];
  const placeholders: SimClub[] = [];
  let cursor = 0;
  for (const t of sortedTargets) {
    const take = sortedIds.slice(cursor, cursor + t.teamCount);
    cursor += take.length;
    const bucket = [...take];
    while (bucket.length < t.teamCount) {
      const ph = makePlaceholder(seedKey, t.tier, t.group);
      placeholders.push(ph);
      bucket.push(ph.id);
    }
    result.push({ meta: { id: t.id, name: t.name, tier: t.tier, group: t.group }, ids: bucket });
  }
  return { result, placeholders };
}

function metaOf(t: DivisionTarget): DivisionMeta {
  return { id: t.id, name: t.name, tier: t.tier, group: t.group };
}

// -----------------------------------------------------------------------------
// NORMALER Saisonwechsel (keine Reform): generischer Auf-/Abstieg
// -----------------------------------------------------------------------------
// Arbeitet strukturunabhängig auf der aktuellen Pyramide: für jede Ebenen-Grenze
// steigen die Staffelmeister (+ ggf. Playoff/weitere Plätze) auf, die Schlechtesten
// der oberen Ebene ab; Absteiger werden geografisch auf die unteren Staffeln
// verteilt, sodass alle Staffelgrößen konstant bleiben.
function normalTransition(ctx: TransitionContext): TransitionResult {
  const { current, strengthOf, cityOf } = ctx;
  const tiers = Array.from(new Set(current.map((d) => d.tier))).sort((a, b) => a - b);

  // Arbeitskopien + Sammelstellen für Zu-/Abgänge (aus ORIGINAL-Reihenfolge berechnet).
  const remove: Record<string, Set<string>> = {};
  const add: Record<string, string[]> = {};
  for (const d of current) { remove[d.id] = new Set(); add[d.id] = []; }

  let promotedTop: string[] = [];
  let relegatedTop: string[] = [];

  for (let i = 0; i < tiers.length - 1; i++) {
    const upperTier = tiers[i];
    const lowerTier = tiers[i + 1];
    const uppers = current.filter((d) => d.tier === upperTier);
    const lowers = current.filter((d) => d.tier === lowerTier);
    if (uppers.length === 0 || lowers.length === 0) continue;
    const upper = uppers[0]; // obere Ebene ist in allen Strukturen eingleisig
    const G = lowers.length;
    const P = G >= 3 ? G : 3; // Zahl der Auf-/Absteiger an dieser Grenze

    // Aufsteiger je Staffel bestimmen (Meister immer, Rest über Playoff/Reihung).
    const promotedByGroup: Record<string, string[]> = {};
    for (const lg of lowers) promotedByGroup[lg.id] = [];
    for (const lg of lowers) if (lg.orderedIds[0]) promotedByGroup[lg.id].push(lg.orderedIds[0]);
    let extra = P - G;
    if (extra > 0) {
      if (G === 1) {
        const lg = lowers[0];
        for (let k = 1; k <= extra && lg.orderedIds[k]; k++) promotedByGroup[lg.id].push(lg.orderedIds[k]);
      } else {
        const runners = lowers
          .map((lg) => ({ id: lg.orderedIds[1], gid: lg.id }))
          .filter((r) => !!r.id)
          .sort((a, b) => strengthOf(b.id) - strengthOf(a.id));
        for (let k = 0; k < extra && k < runners.length; k++) promotedByGroup[runners[k].gid].push(runners[k].id);
      }
    }
    const promoted: string[] = [];
    for (const lg of lowers) promoted.push(...promotedByGroup[lg.id]);

    // Absteiger der oberen Ebene = die schlechtesten `promoted.length` Vereine.
    const relegated = upper.orderedIds.slice(-promoted.length);

    // Zu-/Abgänge oben vermerken.
    for (const id of relegated) remove[upper.id].add(id);
    for (const id of promoted) add[upper.id].push(id);

    // Aufsteiger aus den Staffeln entfernen.
    for (const lg of lowers) for (const id of promotedByGroup[lg.id]) remove[lg.id].add(id);

    // Absteiger geografisch auf die Staffeln verteilen: jede Staffel erhält so
    // viele, wie sie abgegeben hat (Größe bleibt konstant).
    const slots: string[] = [];
    const lowersByNorth = [...lowers].sort((a, b) => groupNorthRank(b.group) - groupNorthRank(a.group));
    for (const lg of lowersByNorth) for (let k = 0; k < promotedByGroup[lg.id].length; k++) slots.push(lg.id);
    const relegByNorth = [...relegated].sort((a, b) => cityNorth(cityOf(b)) - cityNorth(cityOf(a)));
    for (let k = 0; k < slots.length && k < relegByNorth.length; k++) add[slots[k]].push(relegByNorth[k]);

    if (i === 0) { promotedTop = promoted.slice(); relegatedTop = relegated.slice(); }
  }

  const divisions = current.map((d) => ({
    meta: { id: d.id, name: d.name, tier: d.tier, group: d.group } as DivisionMeta,
    ids: d.orderedIds.filter((id) => !remove[d.id].has(id)).concat(add[d.id]),
  }));

  return { divisions, placeholders: [], dropped: [], reform: null, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// Hilfen für Reform-Migrationen
// -----------------------------------------------------------------------------
function findDiv(current: CurrentDivision[], pred: (d: CurrentDivision) => boolean): CurrentDivision | undefined {
  return current.find(pred);
}

// Normaler Auf-/Abstieg 1.↔2. Liga innerhalb einer Reform-Migration (eingleisige
// obere Struktur): 3 Absteiger, 3 Aufsteiger aus der Spitze der 2. Liga.
function topExchangeSingle(
  t1: string[], t2: string[],
): { newTier1: string[]; newTier2Base: string[]; promotedTop: string[]; relegatedTop: string[] } {
  const relegatedTop = t1.slice(-3);
  const promotedTop = t2.slice(0, 3);
  const newTier1 = t1.filter((id) => !relegatedTop.includes(id)).concat(promotedTop);
  const newTier2Base = t2.filter((id) => !promotedTop.includes(id)); // Absteiger werden später ergänzt
  return { newTier1, newTier2Base, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 1981/82 — Zusammenführung Nord/Süd → eingleisige 2. Liga
// -----------------------------------------------------------------------------
function migrate1981(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current, strengthOf } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const nord = findDiv(current, (d) => d.tier === 2 && d.group === 'nord')?.orderedIds ?? [];
  const sued = findDiv(current, (d) => d.tier === 2 && d.group === 'sued')?.orderedIds ?? [];

  // 1. Liga: normaler Auf-/Abstieg (3 runter, 3 rauf: beide Meister + bester Zweiter).
  const relegatedTop = t1.slice(-3);
  const nordChamp = nord[0]; const suedChamp = sued[0];
  const runnerUp = (nord[1] && sued[1])
    ? (strengthOf(nord[1]) >= strengthOf(sued[1]) ? nord[1] : sued[1])
    : (nord[1] || sued[1]);
  const promotedTop = [nordChamp, suedChamp, runnerUp].filter(Boolean) as string[];
  const newTier1 = t1.filter((id) => !relegatedTop.includes(id)).concat(promotedTop);

  // 2. Liga eingleisig: beste 10 je Staffel = Qualifikanten, minus Aufsteiger, plus Absteiger.
  const promSet = new Set(promotedTop);
  const qualPool = [...nord.slice(0, 10), ...sued.slice(0, 10)];
  const newTier2 = qualPool.filter((id) => !promSet.has(id)).concat(relegatedTop);

  // Alle übrigen 2.-Liga-Vereine steigen ab (aus der Simulation entfernt).
  const kept = new Set([...promotedTop, ...newTier2]);
  const dropped = [...nord, ...sued].filter((id) => !kept.has(id));

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
  ];
  return { divisions, placeholders: [], dropped, reform, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 1994/95 — Regionalliga (Ebene 3, vier Staffeln) neu einziehen
// -----------------------------------------------------------------------------
function migrate1994(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current, cityOf } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];

  const { newTier1, newTier2Base, promotedTop, relegatedTop } = topExchangeSingle(t1, t2);
  const newTier2 = newTier2Base.concat(relegatedTop); // bleibt 20

  // Neue Regionalliga: vier Staffeln. Eine bereits bestehende dritte Ebene
  // (z. B. die 1991/92 gebildete NOFV-Oberliga) fließt in die neue Regionalliga
  // ein; fehlende Plätze werden mit fiktiven Platzhaltern aufgefüllt.
  const oldTier3 = current.filter((d) => d.tier === 3).flatMap((d) => d.orderedIds);
  const rlTargets = reform.targetStructure.filter((x) => x.tier === 3);
  const { result: rlDivs, placeholders } = distributeToGroups(oldTier3, rlTargets, cityOf, reform.reformId);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    ...rlDivs,
  ];
  return { divisions, placeholders, dropped: [], reform, promotedTop, relegatedTop };
}

// -----------------------------------------------------------------------------
// 2008/09 — 3. Liga (eingleisig) einziehen, Regionalliga auf Ebene 4
// -----------------------------------------------------------------------------
function migrate2008(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current, cityOf } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];
  const rlGroups = current.filter((d) => d.tier === 3); // bisherige Regionalliga-Staffeln

  const { newTier1, newTier2Base, promotedTop, relegatedTop } = topExchangeSingle(t1, t2);
  const newTier2 = newTier2Base.concat(relegatedTop); // bleibt 20

  // 3. Liga: beste 5 jeder bisherigen Regionalliga-Staffel = 20 Qualifikanten.
  const thirdLeague: string[] = [];
  const remainder: string[] = [];
  for (const g of rlGroups) {
    thirdLeague.push(...g.orderedIds.slice(0, 5));
    remainder.push(...g.orderedIds.slice(5));
  }
  // Sollgröße 20 der 3. Liga sicherstellen (auffüllen, falls Datenlage kleiner).
  const thirdTarget = reform.targetStructure.find((x) => x.id === 'tier3')!;
  const thirdPlaceholders: SimClub[] = [];
  while (thirdLeague.length < thirdTarget.teamCount) {
    const ph = makePlaceholder(reform.reformId, 3, null);
    thirdPlaceholders.push(ph); thirdLeague.push(ph.id);
  }

  // Neue viertklassige Regionalliga: Rest geografisch auf 3 Staffeln + auffüllen.
  const rl4Targets = reform.targetStructure.filter((x) => x.tier === 4);
  const { result: rl4Divs, placeholders: rl4Placeholders } =
    distributeToGroups(remainder, rl4Targets, cityOf, reform.reformId);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    { meta: metaOf(thirdTarget), ids: thirdLeague },
    ...rl4Divs,
  ];
  return {
    divisions,
    placeholders: [...thirdPlaceholders, ...rl4Placeholders],
    dropped: [], reform, promotedTop, relegatedTop,
  };
}

// -----------------------------------------------------------------------------
// 1991/92 — Deutsche Wiedervereinigung: DDR-Ligen in die Pyramide integrieren
// -----------------------------------------------------------------------------
// Die DDR-Divisionen (interne tier 101 = DDR-Oberliga, tier 102 = DDR-Liga)
// werden für diese eine Transition in `ctx.current` mitgegeben (siehe App.tsx /
// startNextSeason). Verteilung nach DDR-Oberliga-Endstand:
//   Platz 1–2 → 1. Liga (auf 20 aufgestockt),
//   Platz 3–6 → 2. Liga (direkt), Platz 7–8 → 2. Liga (Aufstiegsrunde),
//   Rest DDR-Oberliga + komplette DDR-Liga → NOFV-Oberliga (Ebene 3, Nordost).
// West-Auf-/Abstieg 1.↔2. Liga entfällt in dieser Umbau-Saison (alle West-Vereine
// bleiben; die 1. Liga wächst durch die 2 DDR-Aufsteiger einmalig auf 20).
function migrate1991(ctx: TransitionContext, reform: LeagueReform): TransitionResult {
  const { current } = ctx;
  const t1 = findDiv(current, (d) => d.tier === 1)?.orderedIds ?? [];
  const t2 = findDiv(current, (d) => d.tier === 2)?.orderedIds ?? [];
  const ober = findDiv(current, (d) => d.tier === 101)?.orderedIds ?? [];
  const liga = findDiv(current, (d) => d.tier === 102)?.orderedIds ?? [];

  const toBL = ober.slice(0, 2);        // Platz 1–2 → 1. Liga
  const toL2direct = ober.slice(2, 6);  // Platz 3–6 → 2. Liga direkt
  const toL2playoff = ober.slice(6, 8); // Platz 7–8 → 2. Liga (Aufstiegsrunde)
  const restOber = ober.slice(8);       // Rest DDR-Oberliga → NOFV

  // 1. Liga: alle West-Erstligisten bleiben + 2 DDR-Aufsteiger → einmalig 20.
  const newTier1 = [...t1, ...toBL];
  // 2. Liga: alle West-Zweitligisten bleiben + 6 DDR-Vereine (einmalig vergrößert).
  const newTier2 = [...t2, ...toL2direct, ...toL2playoff];
  // NOFV-Oberliga (Ebene 3, Nordost): Rest DDR-Oberliga + komplette DDR-Liga.
  let nofv = [...restOber, ...liga];
  const dropped: string[] = [];
  // Gerade Staffelgröße sicherstellen (Spielplan-Generator braucht gerade Zahl).
  if (nofv.length % 2 === 1) dropped.push(nofv.pop() as string);

  const t = reform.targetStructure;
  const divisions = [
    { meta: metaOf(t.find((x) => x.id === 'tier1')!), ids: newTier1 },
    { meta: metaOf(t.find((x) => x.id === 'tier2')!), ids: newTier2 },
    { meta: metaOf(t.find((x) => x.id === 'tier3-nordost')!), ids: nofv },
  ];
  // promotedTop = DDR-Aufsteiger in die 1. Liga (für die Meilenstein-Nachricht).
  return { divisions, placeholders: [], dropped, reform, promotedTop: toBL, relegatedTop: [] };
}

// -----------------------------------------------------------------------------
// Normalisierung übergroßer Ebenen auf die Soll-(Steady-)Struktur
// -----------------------------------------------------------------------------
// Nach der einmalig übergroßen Wiedervereinigungs-Saison (1. Liga = 20, 2. Liga
// vergrößert) führt der reguläre Saisonwechsel die Ebenen schrittweise auf ihre
// Sollgrößen zurück: übergroße Ebenen geben ihre schwächsten Vereine an die
// nächsttiefere Ebene ab (top-down); auf der untersten Ebene fallen Überzählige
// aus der Simulation. Dadurch steigen in der Normalisierungs-Saison mehr Vereine
// ab als sonst. Passt eine Ebene bereits, ist der Schritt ein No-op.
function normalizeToSteady(res: TransitionResult, newSeason: string): TransitionResult {
  const targets = structureForSeason(newSeason);
  const tiers = Array.from(new Set(res.divisions.map((d) => d.meta.tier))).sort((a, b) => a - b);
  const dropped = [...res.dropped];
  for (const tier of tiers) {
    for (const d of res.divisions.filter((x) => x.meta.tier === tier)) {
      const tgt = targets.find((t) => t.id === d.meta.id)?.teamCount
        ?? targets.find((t) => t.tier === tier)?.teamCount
        ?? d.ids.length;
      while (d.ids.length > tgt) {
        const victim = d.ids.pop() as string; // schwächster (Tabellenende) zuerst
        const lower = res.divisions.find((x) => x.meta.tier === tier + 1);
        if (lower) lower.ids.push(victim); else dropped.push(victim);
      }
    }
  }
  return { ...res, dropped };
}

// -----------------------------------------------------------------------------
// Öffentliche Einstiegsfunktion
// -----------------------------------------------------------------------------
/**
 * Berechnet die Mitgliedschaften der neuen Saison. Liegt für die Saison eine noch
 * nicht angewandte Reform vor, wird die entsprechende Struktur-Migration
 * ausgeführt; andernfalls der generische, strukturunabhängige Auf-/Abstieg.
 */
export function computeSeasonTransition(ctx: TransitionContext): TransitionResult {
  const pending = pendingReform(ctx.newSeason, ctx.appliedReforms);
  let res: TransitionResult;
  if (pending) {
    switch (pending.reformId) {
      case 'reform-1981-single-second': res = migrate1981(ctx, pending); break;
      case 'reform-1991-reunification': res = migrate1991(ctx, pending); break;
      case 'reform-1994-regionalliga': res = migrate1994(ctx, pending); break;
      case 'reform-2008-third-league': res = migrate2008(ctx, pending); break;
      default: res = normalTransition(ctx); break;
    }
  } else {
    // Regulärer Saisonwechsel; führt zugleich übergroße Ebenen (z. B. die 1991/92
    // einmalig vergrößerte 1./2. Liga) schrittweise auf die Sollgrößen zurück.
    res = normalizeToSteady(normalTransition(ctx), ctx.newSeason);
  }
  return ensureProtected(res, ctx.protectedId);
}

/**
 * Stellt sicher, dass der Verein des Spielers nie aus der Ligapyramide fällt.
 * Falls eine Reform ihn (z. B. als Absteiger in eine nicht simulierte Amateurliga)
 * entfernen würde, wird er stattdessen in die unterste Ebene aufgenommen und
 * verdrängt dort den schwächsten Eintrag (Platzhalter bevorzugt, sonst realer
 * Verein, der dann absteigt). So bleiben alle Staffelgrößen gerade.
 */
function ensureProtected(res: TransitionResult, protectedId?: string): TransitionResult {
  if (!protectedId) return res;
  if (res.divisions.some((d) => d.ids.includes(protectedId))) return res;
  const lowestTier = Math.max(...res.divisions.map((d) => d.meta.tier));
  const target = res.divisions.find((d) => d.meta.tier === lowestTier);
  if (!target || target.ids.length === 0) return res;
  const victimIdx = target.ids.length - 1;
  const victim = target.ids[victimIdx];
  target.ids[victimIdx] = protectedId;
  const dropped = res.dropped.filter((id) => id !== protectedId);
  let placeholders = res.placeholders;
  if (victim && victim.startsWith('ph-')) {
    placeholders = res.placeholders.filter((p) => p.id !== victim); // Platzhalter entfällt lautlos
  } else if (victim) {
    dropped.push(victim); // realer Verein steigt an Stelle des Spielers ab
  }
  return { ...res, dropped, placeholders };
}

/** Kurzlabel einer Division für Nachrichten (nutzt Name, sonst Tier/Gruppe). */
export function divisionShort(name: string, group: LeagueGroup): string {
  return group ? `${name}` : name || groupLabel(group);
}
