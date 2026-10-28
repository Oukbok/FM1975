// =============================================================================
// FOOTBALL MANAGER 1980 — Vereinsgelände / Infrastruktur-Engine
// =============================================================================
// Ausbaubare Einrichtungen mit je 5 Stufen. Jede Stufe kostet Geld vom
// Vereinskonto (DM, Ära-gerecht 1980/81) und hat einen KONKRETEN, real in den
// Engines wirkenden Effekt:
//
//   • Stadion         → +Kapazität → mehr Stadioneinnahmen (finances.ts)
//   • Trainingszentrum→ +facilitiesQuality → schnellere Entwicklung
//                       (weeklyTraining.applyDailyTraining nutzt facilitiesQuality)
//   • Jugendakademie  → mehr & bessere Talente (youth.ts: Intake-Zahl & Qualität)
//   • Medizin/Reha    → schnellere Fitness-Regeneration + kürzere Ausfallzeiten
//   • Merchandising   → höherer Fanartikel-Erlös pro Kopf (finances.ts)
//
// Der Ausbau ist nur bei ausreichendem Kontostand möglich; Abschluss bucht die
// Kosten und passt die betroffenen Vereinswerte sofort an.
// =============================================================================

import { economyScale } from './economy';
import { Club, ClubInfrastructure, FacilityKey, CateringMode } from '../types';
import { book, CATERING_UPKEEP } from './finances';
import type { IconName } from '../components/iconPaths';

export const MAX_LEVEL = 5;

/** Kapazitätszuwachs pro Stadion-Stufe (ab Stufe 1). */
export const CAPACITY_PER_LEVEL = 6000;

/** Statische Metadaten je Einrichtung. */
export interface FacilityDef {
  key: FacilityKey;
  name: string;
  icon: string;
  /** Optionales <Icon>-Symbol (statt Emoji); z.B. Catering. */
  iconName?: IconName;
  desc: string;
  /** Basiskosten (DM) — werden mit der Zielstufe skaliert. */
  baseCost: number;
  /** Effektbeschreibung für eine gegebene Stufe (1–5). */
  effectAt: (level: number) => string;
  /**
   * Optionales Freischaltjahr (Epoche). Fehlt es, ist die Einrichtung von Beginn
   * an (1975) verfügbar. Zukunfts-Einrichtungen setzen ein Jahr und erscheinen
   * erst dann als ausbaubar (davor über die „Zukunft"-Ansicht sichtbar).
   */
  unlockYear?: number;
  /** Optional: ab diesem Jahr veraltet – nicht mehr bau- oder ausbaubar (Datensatz). */
  obsoleteYear?: number;
}

/** Kann die Einrichtung im Jahr gebaut/ausgebaut werden? */
export function facilityAvailable(def: FacilityDef, year: number): boolean {
  return (!def.unlockYear || year >= def.unlockYear) && (!def.obsoleteYear || year < def.obsoleteYear);
}

// -----------------------------------------------------------------------------
// Effekt-Kennlinien (deterministisch aus der Stufe)
// -----------------------------------------------------------------------------

/** Trainingszentrum: Stufe → Anlagenqualität (facilitiesQuality, 0–100). */
export function trainingQualityForLevel(level: number): number {
  return [0, 55, 68, 78, 88, 96][clampLevel(level)];
}

/** Jugendakademie: Stufe → Anzahl neuer Talente je Nachwuchsrunde. */
export function academyIntakeCount(level: number): number {
  return [0, 1, 2, 2, 3, 4][clampLevel(level)];
}

/** Jugendakademie: Stufe → Qualitäts-Bonus auf Talent-Attribute (OVR-Punkte). */
export function academyQualityBonus(level: number): number {
  return [0, 0, 3, 6, 9, 13][clampLevel(level)];
}

/** Jugendakademie: Stufe → Lernraten-Faktor auf die Jugendentwicklung. */
export function academyGrowthFactor(level: number): number {
  return [0, 0.85, 1.0, 1.15, 1.3, 1.5][clampLevel(level)];
}

/** Medizin: Stufe → zusätzliche tägliche Fitness-Regeneration (Punkte). */
export function medicalRecoveryBonus(level: number): number {
  return [0, 0, 1, 2, 3, 5][clampLevel(level)];
}

/** Medizin: Stufe → zusätzliche pro Tag reduzierte Reha-Tage (Verletzung). */
export function medicalRehabBonus(level: number): number {
  return [0, 0, 0, 1, 1, 2][clampLevel(level)];
}

/** Merchandising: Stufe → Multiplikator auf den Fanartikel-Erlös pro Kopf. */
export function merchandisingFactor(level: number): number {
  return [1, 1, 1.15, 1.3, 1.5, 1.75][clampLevel(level)];
}

// --- Zukunfts-Einrichtungen (epochenabhängig freigeschaltet) -----------------

/** Reha-Zentrum: Stufe → zusätzlich pro Tag reduzierte Reha-Tage. */
export function rehaRehabBonus(level: number): number {
  return [0, 0, 1, 1, 2, 3][clampLevel(level)];
}

/** Reha-Zentrum: Stufe → zusätzliche tägliche Fitness-Regeneration. */
export function rehaRecoveryBonus(level: number): number {
  return [0, 0, 1, 1, 2, 2][clampLevel(level)];
}

/** Leistungszentrum: Stufe → zusätzliche Anlagenqualität (auf facilitiesQuality). */
export function performanceQualityBonus(level: number): number {
  return [0, 0, 2, 4, 6, 8][clampLevel(level)];
}

/** Datenanalyse-Zentrum: Stufe → Scouting-Genauigkeitsbonus (Anteil, 0–1). */
export function dataScoutingBonus(level: number): number {
  return [0, 0, 0.02, 0.04, 0.06, 0.08][clampLevel(level)];
}

/** Nachwuchsleistungszentrum: Stufe → zusätzlicher Jugend-Wachstumsfaktor. */
export function nlzGrowthBonus(level: number): number {
  return [0, 0, 0.05, 0.1, 0.15, 0.2][clampLevel(level)];
}

function clampLevel(level: number): number {
  return Math.max(0, Math.min(MAX_LEVEL, Math.round(level)));
}

// -----------------------------------------------------------------------------
// Einrichtungs-Definitionen
// -----------------------------------------------------------------------------

export const FACILITIES: FacilityDef[] = [
  {
    key: 'stadium', name: 'Stadion', icon: '🏟️', baseCost: 900000,
    desc: 'Mehr Sitz- und Stehplätze erhöhen die Zuschauerkapazität und damit die Stadioneinnahmen pro Heimspiel.',
    effectAt: (l) => `Kapazität +${((l - 1) * CAPACITY_PER_LEVEL).toLocaleString('de-DE')} Plätze ggü. Grundausbau`,
  },
  {
    key: 'trainingCenter', name: 'Trainingszentrum', icon: '🎯', baseCost: 320000,
    desc: 'Bessere Plätze, Geräte und Trainer beschleunigen die Attribut-Entwicklung des gesamten Kaders.',
    effectAt: (l) => `Anlagenqualität ${trainingQualityForLevel(l)} → schnelleres Wachstum`,
  },
  {
    key: 'youthAcademy', name: 'Jugendakademie', icon: '🧒', baseCost: 260000,
    desc: 'Eine stärkere Akademie bringt mehr und talentiertere Nachwuchsspieler und beschleunigt deren Entwicklung.',
    effectAt: (l) => `${academyIntakeCount(l)} Talent(e)/Jahr · Qualität +${academyQualityBonus(l)} · Lernrate ×${academyGrowthFactor(l).toFixed(2)}`,
  },
  {
    key: 'medical', name: 'Medizinische Abteilung', icon: '⚕️', baseCost: 200000,
    desc: 'Ärzte und Reha-Geräte lassen Spieler schneller regenerieren und verkürzen Ausfallzeiten nach Verletzungen.',
    effectAt: (l) => `Regeneration +${medicalRecoveryBonus(l)}/Tag · Reha ${medicalRehabBonus(l) > 0 ? `−${medicalRehabBonus(l)} Tag(e)/Tag` : 'normal'}`,
  },
  {
    key: 'merchandising', name: 'Fanshop / Merchandising', icon: '🧣', baseCost: 180000,
    desc: 'Ein größerer Fanshop steigert den Fanartikel-Erlös je Stadionbesucher.',
    effectAt: (l) => `Fanartikel-Erlös ×${merchandisingFactor(l).toFixed(2)} pro Besucher`,
  },
  {
    key: 'catering', name: 'Catering / Wuerstchenbuden', icon: '🌭', iconName: 'catering', baseCost: 120000,
    desc: 'Mehr und bessere Imbiss- und Getränkestände erhöhen den Pro-Kopf-Erlös an jedem Heimspieltag. Die Betriebsform (Eigenbetrieb, Umsatzbeteiligung, Verpachtung) bestimmt Erlös und Fixkosten.',
    effectAt: (l) => `Netto/Besucher & Kapazität steigen mit Stufe ${l}`,
  },
  {
    key: 'rehaCenter', name: 'Reha-Zentrum', icon: '🏥', baseCost: 240000, unlockYear: 1990,
    desc: 'Ein eigenes Reha-Zentrum verkürzt Ausfallzeiten weiter und beschleunigt die tägliche Regeneration zusätzlich zur medizinischen Abteilung.',
    effectAt: (l) => `Reha ${rehaRehabBonus(l) > 0 ? `−${rehaRehabBonus(l)} Tag(e)/Tag` : 'normal'} · Regeneration +${rehaRecoveryBonus(l)}/Tag`,
  },
  {
    key: 'nlz', name: 'Nachwuchsleistungszentrum', icon: '🏫', baseCost: 380000, unlockYear: 1998,
    desc: 'Ein NLZ nach modernem Vorbild fördert die Talententwicklung systematisch und steigert das Wachstum der Jugendspieler.',
    effectAt: (l) => `Jugend-Wachstum +${Math.round(nlzGrowthBonus(l) * 100)} %`,
  },
  {
    key: 'performanceCenter', name: 'Leistungszentrum', icon: '💪', baseCost: 340000, unlockYear: 2003,
    desc: 'Sportwissenschaft, Athletik und moderne Trainingssteuerung erhöhen die Anlagenqualität über das klassische Trainingszentrum hinaus.',
    effectAt: (l) => `Anlagenqualität +${performanceQualityBonus(l)} zusätzlich`,
  },
  {
    key: 'dataCenter', name: 'Datenanalyse-Zentrum', icon: '📊', baseCost: 300000, unlockYear: 2013,
    desc: 'Datenanalyse und Videoscouting erhöhen die Genauigkeit der Talentbewertung im eigenen Nachwuchs.',
    effectAt: (l) => `Scouting-Genauigkeit +${Math.round(dataScoutingBonus(l) * 100)} %`,
  },
];

export const FACILITY_BY_KEY: Record<FacilityKey, FacilityDef> =
  Object.fromEntries(FACILITIES.map((f) => [f.key, f])) as Record<FacilityKey, FacilityDef>;

// -----------------------------------------------------------------------------
// Monatliche Gebaeude-Fixkosten (Unterhalt) — Pascals Punkt 1
// -----------------------------------------------------------------------------

/** Stufen-Multiplikator der Fixkosten (Index = Stufe 1..5). */
export const LEVEL_MULT = [0, 1, 1.4, 1.9, 2.5, 3.2];

/**
 * Basis-Unterhaltskosten je Einrichtung (DM/Monat, Stufe-1-Basis, 1975).
 * `stadium` bewusst NICHT enthalten (bleibt in `stadiumMaintenance`, sonst
 * Doppelzaehlung). `catering` ist Sonderfall je Betriebsform (CATERING_UPKEEP).
 */
export const FAC_UPKEEP_BASE: Partial<Record<FacilityKey, number>> = {
  trainingCenter: 4000,
  youthAcademy: 3000,
  medical: 2500,
  merchandising: 2000,
  rehaCenter: 3000,
  nlz: 4000,
  performanceCenter: 4500,
  dataCenter: 3500,
};

/** Einrichtungen, die erst ab Stufe >= 2 als „gebaut" Fixkosten verursachen. */
const FUTURE_KEYS: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];

/**
 * Summe der monatlichen Gebaeude-Fixkosten eines Vereins (bereits era-skaliert).
 * `stadium` ausgenommen. `catering` je Betriebsform. Zukunfts-Einrichtungen
 * zaehlen nur ab Stufe >= 2 (Stufe 1 = Grundausbau, noch nicht gebaut).
 */
export function facilityUpkeep(club: Club, scale = 1): number {
  const infra = club.infrastructure;
  let sum = 0;
  for (const key of Object.keys(FAC_UPKEEP_BASE) as FacilityKey[]) {
    const level = clampLevel((infra[key] as number) ?? 1);
    if (level < 1) continue;
    if (FUTURE_KEYS.includes(key) && level < 2) continue;
    sum += FAC_UPKEEP_BASE[key]! * LEVEL_MULT[level];
  }
  // Catering: Sonderfall je Betriebsform.
  const cLevel = clampLevel(infra.catering ?? 1);
  if (cLevel >= 1) {
    const mode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
    sum += CATERING_UPKEEP[mode][cLevel];
  }
  return Math.round(sum * scale);
}

/**
 * Kosten für den Ausbau auf die ZIELstufe (2–5). Skaliert überproportional mit
 * der Stufe. Stufe 1 ist die Grundausstattung und kostet nichts.
 */
export function upgradeCost(key: FacilityKey, targetLevel: number): number {
  const def = FACILITY_BY_KEY[key];
  if (!def || targetLevel <= 1 || targetLevel > MAX_LEVEL) return 0;
  // Zielstufe 2 → ×1, 3 → ×2.1, 4 → ×3.6, 5 → ×5.4 (grob quadratisch).
  const mult = [0, 0, 1, 2.1, 3.6, 5.4][targetLevel];
  return Math.round((def.baseCost * mult) / 10000) * 10000;
}

/** Ob der Verein die nächste Stufe finanzieren und ausbauen kann. */
export function canUpgrade(club: Club, key: FacilityKey, scale = 1): { ok: boolean; reason?: string; cost: number; nextLevel: number } {
  const level = (club.infrastructure[key] as number) ?? 1;
  const nextLevel = level + 1;
  if (nextLevel > MAX_LEVEL) return { ok: false, reason: 'Maximalstufe erreicht', cost: 0, nextLevel: level };
  // Preisschild in 1975-Basis, Buchung × Wirtschaftsskala.
  const cost = Math.round((upgradeCost(key, nextLevel) * scale) / 10000) * 10000;
  if (key === 'stadium') return { ok: false, reason: 'Stadionausbau als Bauprojekt unter „Stadion“', cost, nextLevel };
  if (club.finances.balance < cost) return { ok: false, reason: 'Kontostand zu niedrig', cost, nextLevel };
  return { ok: true, cost, nextLevel };
}

/**
 * Wendet den Effekt einer Einrichtungsstufe SOFORT auf die Vereinswerte an,
 * die von anderen Engines gelesen werden (Trainingsqualität, Stadionkapazität).
 * Wird nach jedem Ausbau und beim Laden/Erzeugen aufgerufen.
 */
export function applyFacilityEffects(club: Club): void {
  // Trainingszentrum (+ Leistungszentrum) → facilitiesQuality (von weeklyTraining genutzt)
  if (club.trainingSchedule) {
    const base = trainingQualityForLevel(club.infrastructure.trainingCenter);
    const perf = performanceQualityBonus(club.infrastructure.performanceCenter ?? 1);
    club.trainingSchedule.facilitiesQuality = Math.min(100, base + perf);
  }
}

/**
 * Führt den Ausbau einer Einrichtung durch: prüft, bucht die Kosten, erhöht die
 * Stufe und passt die betroffenen Vereinswerte an.
 * @returns Erfolg + neue Stufe + Kosten (für die Nachricht).
 */
export function upgradeFacility(
  club: Club,
  key: FacilityKey,
  date: string,
  trackDetail: boolean,
): { ok: boolean; reason?: string; newLevel: number; cost: number } {
  const check = canUpgrade(club, key, economyScale(Number(date.slice(0, 4))));
  if (!check.ok) return { ok: false, reason: check.reason, newLevel: (club.infrastructure[key] as number) ?? 1, cost: check.cost };

  const def = FACILITY_BY_KEY[key];
  // Kosten buchen (als Ausgabe).
  book(club.finances, date, -check.cost, 'other', `Ausbau ${def.name} → Stufe ${check.nextLevel}`, trackDetail);

  // Stufe erhöhen.
  (club.infrastructure[key] as number) = check.nextLevel;

  // Direkte Sofort-Effekte (Kapazität / Trainingsqualität).
  if (key === 'stadium') {
    club.stadium.capacity += CAPACITY_PER_LEVEL;
  }
  applyFacilityEffects(club);

  return { ok: true, newLevel: check.nextLevel, cost: check.cost };
}

/** Erzeugt einen sinnvollen Anfangs-Infrastruktur-Satz aus der Reputation. */
export function makeInfrastructure(reputation: number): ClubInfrastructure {
  // Größere Vereine starten mit besserer Infrastruktur (Stufe 1–4).
  const lvl = (base: number) => Math.max(1, Math.min(MAX_LEVEL, base));
  const r = reputation;
  return {
    stadium: lvl(r >= 82 ? 3 : r >= 72 ? 2 : 1),
    trainingCenter: lvl(r >= 80 ? 3 : r >= 68 ? 2 : 1),
    youthAcademy: lvl(r >= 84 ? 3 : r >= 70 ? 2 : 1),
    medical: lvl(r >= 82 ? 3 : r >= 70 ? 2 : 1),
    merchandising: lvl(r >= 80 ? 2 : 1),
    catering: lvl(r >= 80 ? 2 : 1),
    // Zukunfts-Einrichtungen starten auf Grundausbau (Stufe 1, ohne Effekt).
    rehaCenter: 1,
    nlz: 1,
    performanceCenter: 1,
    dataCenter: 1,
    lastYouthIntakeYear: 1975,
  };
}
