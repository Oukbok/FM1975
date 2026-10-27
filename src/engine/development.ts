// =============================================================================
// FOOTBALL MANAGER 1980 — Entwicklungs-Engine (vereinfacht)
// Alters-basierte periodische Neubewertung der Spieler.
// =============================================================================

import {
  Player, Club, AttributeKey, PlayerDevReveal, DevelopmentResult,
  ATTRIBUTE_LABELS_DE, starsToPotential, clampStars,
} from '../types';

/** Ergebnis der Leistungsbewertung je Spieler (auch bei change === 0). */
export interface RatingResult {
  playerId: string;
  playerName: string;
  clubId: string;
  clubShort: string;
  position: string;
  age: number;
  oldOverall: number;
  newOverall: number;
  change: number;
  isUserClub: boolean;
}

/**
 * Softcap-Wahrscheinlichkeit für Wachstum, abhängig vom Abstand zum
 * Potenzial-Maximum (aus den Sternen abgeleitet).
 *  - Cap erreicht/überschritten → 0.05 (sehr langsam)
 *  - ≤ 5 Punkte darunter        → 0.2  (langsam)
 *  - ≤ 10 Punkte darunter       → 0.5  (moderat)
 *  - sonst                      → 1.0  (volles Wachstum)
 */
export function calculateDevelopmentChance(maxRating: number, currentRating: number): number {
  const distance = maxRating - currentRating;
  if (distance <= 0) return 0.05;
  if (distance <= 5) return 0.2;
  if (distance <= 10) return 0.5;
  return 1.0;
}

/**
 * Aktualisiert die Ratings aller Spieler.
 * @param type 'small' (klein), 'medium' (mittel), 'large' (Saison-Bilanz)
 * Junge Spieler tendieren nach oben, alte nach unten. Max ±3 pro Update.
 * Wachstum wird zusätzlich durch das Stern-Potenzial (Softcap) gebremst.
 */
/**
 * Berechnet UND wendet die Bewertungsänderung für einen einzelnen Spieler an
 * (altersabhängig + Softcap). Aktualisiert overall, currentAbility,
 * lastRatingChange, abilityHistory sowie das Stern-Potenzial.
 * @returns die tatsächlich angewandte OVR-Änderung (kann 0 sein).
 */
function applyRatingToPlayer(
  p: Player,
  type: 'small' | 'medium' | 'large',
  dateISO: string,
): number {
  const magnitude = type === 'small' ? 1 : type === 'medium' ? 2 : 3;
  let change = 0;

  if (p.age <= 21) {
    // Junge Talente: meist +1, selten +2/+3
    const r = Math.random();
    change = r < 0.55 ? 1 : r < 0.75 ? 2 : r < 0.8 ? Math.min(3, magnitude) : 0;
  } else if (p.age <= 28) {
    // Peak: leichte Schwankung
    const r = Math.random();
    change = r < 0.3 ? 1 : r < 0.4 ? -1 : 0;
  } else if (p.age <= 31) {
    const r = Math.random();
    change = r < 0.35 ? -1 : r < 0.45 ? 1 : 0;
  } else {
    // Veteranen: Abbau
    const r = Math.random();
    change = r < 0.5 ? -1 : r < 0.7 ? -2 : r < 0.75 ? -Math.min(3, magnitude) : 0;
  }

  // Softcap: Potenzial (aus Sternen) bremst das Wachstum nahe am Maximum.
  const maxRating = starsToPotential(p.potentialStars);
  const cur = p.development.currentAbility;
  if (change > 0) {
    const chance = calculateDevelopmentChance(maxRating, cur);
    if (Math.random() > chance) {
      change = 0;
    } else {
      // Weiches Ceiling: knapp über dem Softcap ist Schluss.
      const ceiling = maxRating + 2;
      change = Math.min(change, Math.max(0, ceiling - cur));
    }
  }
  change = Math.max(-3, Math.min(3, change));

  if (change !== 0) {
    applyChange(p, change);
    p.development.lastRatingChange = change;
    p.development.currentAbility = Math.max(30, Math.min(99, p.development.currentAbility + change));
    p.development.abilityHistory.push({
      date: dateISO,
      ability: Math.round(p.development.currentAbility),
    });
  } else {
    p.development.lastRatingChange = 0;
  }

  // Potenzial-Sterne selbst können sich verändern (v.a. bei jungen Spielern).
  updatePotentialStars(p, type);
  return change;
}

export function updatePlayerRatings(
  players: Record<string, Player>,
  type: 'small' | 'medium' | 'large',
  excludeIds?: Set<string>,
): { playerId: string; change: number }[] {
  const changes: { playerId: string; change: number }[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const p of Object.values(players)) {
    // Spieler des Manager-Vereins werden separat über den Wochen-Trainingslauf
    // entwickelt (runWeeklyDevelopment) und hier ausgenommen.
    if (excludeIds && excludeIds.has(p.id)) continue;
    const change = applyRatingToPlayer(p, type, today);
    if (change !== 0) changes.push({ playerId: p.id, change });
  }

  return changes;
}

/**
 * Leistungsbewertungs-Zeremonie: bewertet JEDEN Spieler der Liga (jeder bekommt
 * seine Chance auf Auf-/Abwertung), liefert aber NUR die Ergebnisse des
 * Manager-Vereins zurück (auch bei change === 0) — der Nutzer möchte ausschließlich
 * die Entwicklung des eigenen Vereins in der Zeremonie verfolgen.
 * @param managedClubId  Verein des Nutzers (nur dessen Spieler werden enthüllt)
 * @param dateISO        aktuelles Spieldatum (für die abilityHistory)
 */
export function runRatingCeremony(
  players: Record<string, Player>,
  clubs: Record<string, Club>,
  managedClubId: string,
  type: 'small' | 'medium' | 'large',
  dateISO: string,
): RatingResult[] {
  const managed = clubs[managedClubId];
  const managedIds = new Set(managed ? managed.playerIds : []);
  const shortOf = managed ? managed.shortName : '—';

  const results: RatingResult[] = [];

  // 1) Zuerst die Spieler des Manager-Vereins bewerten UND als Ergebnis erfassen.
  if (managed) {
    for (const pid of managed.playerIds) {
      const p = players[pid];
      if (!p) continue;
      const oldOverall = p.overall;
      const change = applyRatingToPlayer(p, type, dateISO);
      results.push({
        playerId: p.id,
        playerName: p.fullName,
        clubId: managedClubId,
        clubShort: shortOf,
        position: p.naturalPosition,
        age: p.age,
        oldOverall,
        newOverall: p.overall,
        change,
        isUserClub: true,
      });
    }
  }

  // 2) Alle übrigen Spieler bekommen ebenfalls ihre Chance — ohne Enthüllung.
  for (const p of Object.values(players)) {
    if (managedIds.has(p.id)) continue;
    applyRatingToPlayer(p, type, dateISO);
  }

  return results;
}

/**
 * Passt die Potenzial-Sterne eines Spielers an:
 *  - Junge Spieler (<23): gute Form hebt (+0.25, max. +0.5/Saison),
 *    schwache Form oder schwere Verletzung senkt (-0.25).
 *  - Ältere Spieler (30+): langsamer Rückgang (-0.25 alle ~2–3 Jahre).
 * Grenzen: nie unter 1.0, nie über 5.0.
 */
function updatePotentialStars(p: Player, type: 'small' | 'medium' | 'large'): void {
  const before = p.potentialStars;
  let delta = 0;

  if (p.age < 23) {
    const rating = p.seasonStats.averageRating; // 1.0 = sehr gut ... 6.0 (0 = keine Spiele)
    const goodForm = p.form >= 70 || (rating > 0 && rating <= 2.7);
    const badForm = p.form <= 45 || rating >= 4.0;
    const seriousInjury = !!p.injury && (p.injury.severity === 'severe' || p.injury.severity === 'critical');

    if (goodForm && Math.random() < (type === 'large' ? 0.7 : 0.4)) delta += 0.25;
    if (badForm && Math.random() < 0.5) delta -= 0.25;
    if (seriousInjury) delta -= 0.25;

    // Maximaler Netto-Zuwachs von +0.5 Sternen pro Saison.
    const gainedThisSeason = p.development.seasonStarChange ?? 0;
    if (delta > 0) delta = Math.min(delta, Math.max(0, 0.5 - gainedThisSeason));
  } else if (p.age >= 30 && type !== 'small') {
    // Langsamer Rückgang, im Schnitt ~-0.25 alle 2–3 Jahre.
    if (Math.random() < 0.25) delta -= 0.25;
  }

  if (delta !== 0) {
    p.potentialStars = clampStars(p.potentialStars + delta);
    const applied = p.potentialStars - before;
    if (applied > 0) {
      p.development.seasonStarChange = (p.development.seasonStarChange ?? 0) + applied;
    }
    p.development.potentialAbility = starsToPotential(p.potentialStars);
  }

  // Große Saison-Bewertung: Saison-Zähler für Stern-Zuwachs zurücksetzen.
  if (type === 'large') p.development.seasonStarChange = 0;
}

/** Verteilt eine Rating-Änderung auf relevante Attribute + Overall. */
function applyChange(p: Player, change: number): void {
  const keys = Object.keys(p.attributes) as (keyof typeof p.attributes)[];
  // Wende die Änderung auf ~40% zufälliger (nicht-Fitness) Attribute an
  const affected = keys.filter((k) => k !== 'fitness' && Math.random() < 0.4);
  for (const k of affected) {
    const cur = p.attributes[k] as number;
    p.attributes[k] = Math.max(1, Math.min(99, cur + change)) as never;
  }
  p.overall = Math.max(1, Math.min(99, p.overall + change));
}

/** Aktualisiert das Alter aller Spieler zum aktuellen Datum. */
export function updateAges(players: Record<string, Player>, currentDateISO: string): void {
  const now = new Date(currentDateISO + 'T00:00:00');
  for (const p of Object.values(players)) {
    const dob = new Date(p.dateOfBirth + 'T00:00:00');
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    p.age = age;
  }
}



// =============================================================================
// WOCHEN-ENTWICKLUNG (Auf-/Abwertungs-Lauf für den Manager-Verein)
// -----------------------------------------------------------------------------
// Wertet am Ende einer Trainingswoche den versteckten Attribut-Akkumulator aus:
//   • Attribut-Akkumulator ≥ 1.0  → sichtbares Attribut +1 (Softcap beachtet),
//     Akkumulator −1.0. Jeder Attribut-Punkt speist den OVR-Akkumulator (+0.34);
//     erreicht dieser 1.0, steigt der sichtbare OVR um +1.
//   • Abwertungen (max. 1 pro Spieler/Woche): Alter, Formkrise + wenig Einsatz,
//     Übertraining.
//   • SEHR selten (~4%): unkontrollierbares Lebensereignis (auf/ab).
// Liefert eine Liste von PlayerDevReveal — NUR für Spieler mit sichtbarer
// Veränderung — für den Trommelwirbel-Screen.
// =============================================================================

/** Attribute, die als „körperlich" gelten (altern/übertrainieren zuerst). */
const PHYSICAL_ATTRS: AttributeKey[] = [
  'speed', 'acceleration', 'stamina', 'strength', 'jumping', 'agility', 'balance',
];

/** OVR-Anteil je sichtbarem Attribut-Punkt (koppelt OVR ans Training). */
const OVR_PER_ATTR_POINT = 0.34;

/** Trainingsbasierte Aufwertungs-Begründungen je Attribut. */
const UP_REASONS: Partial<Record<AttributeKey, string[]>> = {
  stamina: ['Harte Ausdauereinheiten zahlen sich aus', 'Läuft und läuft — die Kondition stimmt'],
  speed: ['Sprinttraining zeigt Wirkung', 'Deutlich spritziger über die ersten Meter'],
  acceleration: ['Explosiver Antritt nach intensiver Schnelligkeitsarbeit', 'Erste drei Schritte sitzen jetzt'],
  strength: ['Krafttraining trägt Früchte', 'Deutlich robuster im Zweikampf'],
  jumping: ['Sprungkraft im Kopfballtraining verbessert', 'Steht in der Luft nun seinen Mann'],
  agility: ['Beweglichkeitsübungen machen sich bezahlt', 'Wendiger und geschmeidiger am Ball'],
  balance: ['Bessere Balance durch gezieltes Koordinationstraining', 'Kaum noch aus dem Gleichgewicht zu bringen'],
  technique: ['Feinschliff an der Technik zahlt sich aus', 'Sauberer im Umgang mit dem Ball'],
  firstTouch: ['Die erste Ballannahme sitzt jetzt', 'Ballannahme im Training merklich verbessert'],
  ballControl: ['Ballkontrolle unter Druck deutlich stabiler', 'Klebt der Ball förmlich am Fuß'],
  dribbling: ['Durchbruch im Dribbling-Training', 'Neue Finten sitzen im Eins-gegen-eins'],
  flair: ['Mehr Mut zu kreativen Aktionen', 'Traut sich jetzt das Besondere zu'],
  passing: ['Passschärfe im Training verbessert', 'Die Zuspiele kommen präziser an'],
  longPassing: ['Der lange Ball sitzt jetzt', 'Verlagerungen gelingen deutlich sicherer'],
  crossing: ['Flankentraining zeigt Wirkung', 'Hereingaben kommen punktgenau'],
  vision: ['Bessere Übersicht durch Spielformen', 'Sieht Räume, die andere nicht sehen'],
  shooting: ['Durchbruch im Abschlusstraining', 'Der Abschluss wird zur echten Waffe'],
  shotPower: ['Deutlich mehr Wucht im Schuss', 'Schusskraft im Training gesteigert'],
  longShots: ['Distanzschüsse sitzen nach hartem Training', 'Gefahr auch aus der zweiten Reihe'],
  composure: ['Ruhiger und abgeklärter vor dem Tor', 'Behält jetzt die Nerven'],
  heading: ['Kopfballstärke im Training verbessert', 'Gewinnt mehr Duelle in der Luft'],
  tackling: ['Zweikampfverhalten deutlich verbessert', 'Grätscht sauberer und sicherer'],
  marking: ['Manndeckung im Training geschärft', 'Klebt am Gegenspieler'],
  interceptions: ['Liest das Spiel besser und fängt mehr ab', 'Antizipation im Training verbessert'],
  positioning: ['Besseres Stellungsspiel nach Taktikeinheiten', 'Steht jetzt goldrichtig'],
  decisions: ['Trifft schnellere, klügere Entscheidungen', 'Entscheidungsfindung im Training verbessert'],
  concentration: ['Konzentriert sich über 90 Minuten', 'Weniger Konzentrationsfehler'],
  teamwork: ['Ordnet sich stärker der Mannschaft unter', 'Funktioniert besser im Verbund'],
  workRate: ['Geht voran und ackert für das Team', 'Arbeitseinsatz spürbar gestiegen'],
  leadership: ['Übernimmt mehr Verantwortung', 'Wächst in eine Führungsrolle'],
  reflexes: ['Reflexe im Torwarttraining geschärft', 'Reagiert blitzschnell auf der Linie'],
  handling: ['Fangsicherheit deutlich verbessert', 'Der Ball klebt in den Handschuhen'],
  oneOnOnes: ['Stark im Eins-gegen-eins gegen Stürmer', 'Behält im Duell die Oberhand'],
  aerialReach: ['Beherrscht den Strafraum jetzt souverän', 'Pflückt hohe Bälle sicher herunter'],
  kicking: ['Präziserer Abschlag nach dem Training', 'Leitet Angriffe sauber ein'],
  communication: ['Organisiert die Abwehr lautstark', 'Kommandostärke im Training gewachsen'],
  penalties: ['Nervenstark vom Elfmeterpunkt', 'Elfmetertraining zahlt sich aus'],
  freeKicks: ['Freistoßtraining zeigt Wirkung', 'Gefährlich bei ruhenden Bällen'],
  corners: ['Ecken kommen jetzt mit Gefahr', 'Eckballtraining verbessert'],
};

/** Allgemeine positive Trainingsgründe (Fallback). */
const UP_GENERIC = [
  'Harte Trainingswoche zahlt sich aus',
  'Macht im Training einen Riesenschritt',
  'Fleiß auf dem Trainingsplatz wird belohnt',
  'Entwickelt sich prächtig weiter',
];

/** Junge-Talente-Bonus-Gründe. */
const UP_YOUNG = [
  'Das große Talent bricht sich Bahn',
  'Der Youngster reift mit jeder Einheit',
  'Riesenschritt in der Entwicklung des Nachwuchsspielers',
];

/** Abwertungsgründe je Ursache. */
const DOWN_AGE = [
  'Altersbedingter Leistungsabfall',
  'Die Jahre fordern langsam ihren Tribut',
  'Nicht mehr ganz so frisch wie früher',
];
const DOWN_FORM = [
  'Formschwäche und wenig Spielpraxis',
  'Fehlende Einsatzzeit bremst die Entwicklung',
  'Steckt in einem tiefen Formtief',
];
const DOWN_OVERTRAINING = [
  'Übertraining zehrt an der Substanz',
  'Zu hohe Belastung fordert ihren Preis',
  'Ausgelaugt nach zu harten Wochen',
];

/** SEHR seltene, unkontrollierbare Lebensereignisse (positiv/negativ). */
const LIFE_EVENTS_UP = [
  'Neue Motivation nach Vaterschaft',
  'Privates Glück beflügelt die Leistung',
  'Rückkehr in die Heimat setzt Kräfte frei',
  'Neuer Lebenspartner sorgt für Auftrieb',
];
const LIFE_EVENTS_DOWN = [
  'Privatunglück belastet den Spieler',
  'Feiert zu viel neben dem Platz',
  'Ärger im privaten Umfeld',
  'Schlechter Schlaf und Unruhe abseits des Rasens',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Baut ein DevelopmentResult für ein Attribut oder OVR. */
function makeResult(
  attribute: AttributeKey | 'overall',
  oldValue: number,
  newValue: number,
): DevelopmentResult {
  return {
    attribute,
    attributeLabel: attribute === 'overall' ? 'Gesamtstärke' : ATTRIBUTE_LABELS_DE[attribute],
    oldValue,
    newValue,
    direction: newValue >= oldValue ? 'up' : 'down',
  };
}

/**
 * Führt die Wochen-Entwicklung für die Spieler des Manager-Vereins durch.
 * @param players     alle Spieler
 * @param userClubPlayerIds Spieler-IDs des Manager-Vereins
 * @returns Liste der sichtbar veränderten Spieler (für den Reveal-Screen)
 */
export function runWeeklyDevelopment(
  players: Record<string, Player>,
  userClubPlayerIds: Set<string>,
): PlayerDevReveal[] {
  const reveals: PlayerDevReveal[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const pid of userClubPlayerIds) {
    const p = players[pid];
    if (!p) continue;

    const changes: DevelopmentResult[] = [];
    const upAttrs: AttributeKey[] = [];
    let downAttr: AttributeKey | null = null;

    const maxRating = starsToPotential(p.potentialStars);
    if (!p.development.attributeProgress) p.development.attributeProgress = {};
    if (p.development.ovrProgress == null) p.development.ovrProgress = 0;
    const acc = p.development.attributeProgress;

    // --- 1) Aufwertungen aus dem Akkumulator (max. +1 je Attribut/Woche) ---
    for (const key of Object.keys(acc) as AttributeKey[]) {
      let progress = acc[key] ?? 0;
      if (progress < 1.0) continue;
      const cur = p.attributes[key] as number;
      // Softcap: knapp über dem Potenzial ist Schluss.
      const atCap = p.development.currentAbility >= maxRating + 2 || cur >= 99;
      if (atCap) {
        acc[key] = Math.min(progress, 0.95); // stauen, kein sichtbarer Punkt
        continue;
      }
      // Einen sichtbaren Punkt gutschreiben, Rest im Akkumulator lassen.
      (p.attributes[key] as number) = cur + 1;
      acc[key] = Math.round((progress - 1.0) * 10) / 10;
      changes.push(makeResult(key, cur, cur + 1));
      upAttrs.push(key);
      p.development.ovrProgress += OVR_PER_ATTR_POINT;
    }

    // --- 2) OVR-Aufwertung, wenn der OVR-Akkumulator 1.0 erreicht ---
    let ovrUp = false;
    if (p.development.ovrProgress >= 1.0 && p.overall < 99) {
      const before = p.overall;
      p.overall = Math.min(99, p.overall + 1);
      p.development.ovrProgress -= 1.0;
      p.development.currentAbility = Math.min(99, p.development.currentAbility + 1);
      changes.push(makeResult('overall', before, p.overall));
      ovrUp = true;
    }

    // --- 3) Abwertung (nur wenn es keine Aufwertung gab, max. 1/Woche) ---
    let downReason: string | null = null;
    if (upAttrs.length === 0) {
      const lowMinutes = p.seasonStats.minutesPlayed < 200;
      const ageRisk = p.age >= 30 ? (p.age - 29) * 0.03 : 0;
      const formRisk = p.form < 40 && lowMinutes ? 0.15 : 0;
      const overRisk = p.attributes.fitness < 35 || p.trainingLoad > 120 ? 0.10 : 0;

      let cause: 'age' | 'form' | 'over' | null = null;
      const roll = Math.random();
      if (roll < ageRisk) cause = 'age';
      else if (roll < ageRisk + formRisk) cause = 'form';
      else if (roll < ageRisk + formRisk + overRisk) cause = 'over';

      if (cause) {
        // Betroffenes Attribut wählen.
        let target: AttributeKey;
        if (cause === 'age' || cause === 'over') {
          const candidates = PHYSICAL_ATTRS.filter((a) => (p.attributes[a] as number) > 30);
          target = candidates.length ? pick(candidates) : 'stamina';
        } else {
          const all = Object.keys(ATTRIBUTE_LABELS_DE) as AttributeKey[];
          const candidates = all.filter((a) => a !== 'fitness' && (p.attributes[a] as number) > 30);
          target = candidates.length ? pick(candidates) : 'concentration';
        }
        const before = p.attributes[target] as number;
        (p.attributes[target] as number) = Math.max(1, before - 1);
        downAttr = target;
        changes.push(makeResult(target, before, before - 1));

        // OVR mitziehen (leichte Kopplung), wenn er nicht gerade gestiegen ist.
        p.development.ovrProgress -= OVR_PER_ATTR_POINT;
        if (p.development.ovrProgress <= -1.0 && p.overall > 1) {
          const bO = p.overall;
          p.overall = Math.max(1, p.overall - 1);
          p.development.ovrProgress += 1.0;
          p.development.currentAbility = Math.max(30, p.development.currentAbility - 1);
          changes.push(makeResult('overall', bO, p.overall));
        }

        downReason = cause === 'age' ? pick(DOWN_AGE)
          : cause === 'form' ? pick(DOWN_FORM)
          : pick(DOWN_OVERTRAINING);
      }
    }

    if (changes.length === 0) {
      p.development.lastRatingChange = 0;
      continue;
    }

    // --- 4) Sehr selten: unkontrollierbares Lebensereignis überschreibt den Grund ---
    let isLifeEvent = false;
    let reason: string;
    if (Math.random() < 0.04) {
      isLifeEvent = true;
      const netUp = upAttrs.length > 0 && !downAttr;
      reason = netUp ? pick(LIFE_EVENTS_UP) : pick(LIFE_EVENTS_DOWN);
    } else if (downReason) {
      reason = downReason;
    } else {
      // Aufwertungs-Grund: an das am stärksten geförderte Attribut koppeln.
      const primary = upAttrs[0];
      if (p.age <= 21 && Math.random() < 0.5) {
        reason = pick(UP_YOUNG);
      } else {
        reason = (primary && UP_REASONS[primary]) ? pick(UP_REASONS[primary]!) : pick(UP_GENERIC);
      }
      if (ovrUp && upAttrs.length === 0) reason = pick(UP_GENERIC);
    }

    // Netto-OVR-Richtung bestimmen.
    const ovrChange = changes.find((c) => c.attribute === 'overall');
    const netOvr = ovrChange
      ? (ovrChange.direction === 'up' ? 1 : -1)
      : (upAttrs.length > 0 && !downAttr ? 1 : downAttr && upAttrs.length === 0 ? -1 : 0);

    p.development.lastRatingChange = netOvr;
    p.development.abilityHistory.push({
      date: today,
      ability: Math.round(p.development.currentAbility),
    });

    reveals.push({
      playerId: p.id,
      changes,
      netOvr,
      reason,
      isLifeEvent,
    });
  }

  return reveals;
}
