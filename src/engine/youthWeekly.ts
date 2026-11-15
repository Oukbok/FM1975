// =============================================================================
// Jugendsystem: wöchentliche Entwicklung der Talente (Akkumulator, Aufwertungen,
// Scouting-Spanne). Teil von engine/youth.ts (dort weitergereicht).
// =============================================================================
import { Player, Club, Position, AttributeKey, clampStars, starsToPotential } from '../types';
import { academyGrowthOf, academyLevelOf, ageCapBonus } from './youthAcademy';
import { ageFactor, potentialFactor } from './weeklyTraining';
import { youthMaturityCap, maturityGrowth, tempoFactor, diligenceFactor } from './talent';
import { baseMarketValue, pseudo } from './youthShared';

// -----------------------------------------------------------------------------
// Wöchentliche Entwicklung der Talente
// -----------------------------------------------------------------------------
export interface YouthDevReveal {
  playerId: string;
  name: string;
  upAttrs: string[];
  ovrUp: boolean;
  newOverall: number;
}

const YOUTH_BASE_GAIN = 0.26;      // Grundlernreiz pro Woche
const OVR_PER_ATTR_POINT = 0.34;   // wie in development.ts

/**
 * Entwickelt die Talente eines Vereins um eine Woche weiter:
 *  - füllt den Attribut-Akkumulator (Lernrate × Alter × Kopffreiheit × Akademie),
 *  - schreibt sichtbare +1-Aufwertungen gut (Softcap aus wahrem Potenzial),
 *  - engt die Scouting-Spanne Schritt für Schritt an das wahre Potenzial an.
 * @param youthPlayers globale Talent-Sammlung (wird in-place verändert)
 */
export function developYouthWeekly(
  club: Club,
  youthPlayers: Record<string, Player>,
  opts?: { growthBonus?: number; scoutBonus?: number },
): YouthDevReveal[] {
  const reveals: YouthDevReveal[] = [];
  // NLZ (Block p11) erhöht das Wachstum zusätzlich zur klassischen Akademie.
  const growthBonus = Math.max(0, opts?.growthBonus ?? 0);
  const scoutBonus = Math.max(0, opts?.scoutBonus ?? 0);
  const growth = academyGrowthOf(club) * (1 + growthBonus);
  const level = academyLevelOf(club);
  if (growth <= 0) return reveals;

  for (const pid of club.youthPlayerIds) {
    const p = youthPlayers[pid];
    if (!p) continue;

    if (!p.development.attributeProgress) p.development.attributeProgress = {};
    if (p.development.ovrProgress == null) p.development.ovrProgress = 0;
    const acc = p.development.attributeProgress;
    // Altersgerechte Obergrenze: ein 16-Jähriger ist noch weit vom Endstand entfernt.
    // Gute Ausbildung (Nachwuchs-Investitionen) lässt Talente mit 18/19 reifer sein.
    // Frühreife Talente sind mit 16–19 schon deutlich weiter (engine/talent.ts).
    const pot = p.development.potentialAbility ?? starsToPotential(p.potentialStars);
    const maxRating = Math.min(pot, Math.round(pot * (0.35 + 0.035 * Math.max(0, p.age - 7) + ageCapBonus(club, p.age) + youthMaturityCap(p))));

    const aFactor = ageFactor(p.age);
    const pFactor = potentialFactor(p);
    // Verdeckte Werte: Entwicklungstempo und Trainingsfleiß (engine/talent.ts), im Mittel ≈ 1.
    const weekGain = YOUTH_BASE_GAIN * aFactor * pFactor * growth * (p.age >= 14 ? maturityGrowth(p) : 1) * tempoFactor(p) * diligenceFactor(p);

    // --- Akkumulator über eine Auswahl entwicklungsrelevanter Attribute füllen
    const devAttrs = developmentAttrsFor(p.naturalPosition);
    for (const key of devAttrs) {
      const cur = p.attributes[key] as number;
      if (cur >= 99) continue;
      // leichte Streuung je Attribut, deterministisch aus id+key+ability
      const jitter = 0.75 + 0.5 * pseudo(`${p.id}:${key}:${p.development.currentAbility}`);
      const gain = Math.round(weekGain * jitter * 10) / 10;
      if (gain <= 0) continue;
      acc[key] = Math.round(((acc[key] ?? 0) + gain) * 10) / 10;
    }

    // --- sichtbare Aufwertungen (max. +1 je Attribut/Woche) ---
    const upAttrs: string[] = [];
    for (const key of Object.keys(acc) as AttributeKey[]) {
      const progress = acc[key] ?? 0;
      if (progress < 1.0) continue;
      const cur = p.attributes[key] as number;
      const atCap = p.development.currentAbility >= maxRating || cur >= 99;
      if (atCap) { acc[key] = Math.min(progress, 0.95); continue; }
      (p.attributes[key] as number) = cur + 1;
      acc[key] = Math.round((progress - 1.0) * 10) / 10;
      upAttrs.push(key);
      p.development.ovrProgress += OVR_PER_ATTR_POINT;
    }

    // --- OVR-Aufwertung ---
    let ovrUp = false;
    if (p.development.ovrProgress >= 1.0 && p.overall < 99 && p.development.currentAbility < maxRating) {
      p.overall = Math.min(99, p.overall + 1);
      p.development.ovrProgress -= 1.0;
      p.development.currentAbility = Math.min(99, p.development.currentAbility + 1);
      p.positionRatings[p.naturalPosition] = p.overall;
      // Marktwert folgt der Kurve der Profis (1975-Basis, clubEconomy.baseMarketValue) – vorher
      // overall² × 400 als Deckel: Stärke 62 ≈ 1,5 Mio. Basis (2016 ≈ 39 Mio. €).
      p.contract.transferValue = Math.min(Math.round(p.contract.transferValue * 1.15), baseMarketValue(p));
      ovrUp = true;
    }

    // --- Scouting-Spanne an das wahre Potenzial annähern ---
    narrowScoutRange(p, level, scoutBonus);

    if (upAttrs.length > 0 || ovrUp) {
      reveals.push({ playerId: p.id, name: p.fullName, upAttrs, ovrUp, newOverall: p.overall });
    }
  }

  return reveals;
}


function developmentAttrsFor(pos: Position): AttributeKey[] {
  const common: AttributeKey[] = ['stamina', 'speed', 'strength', 'technique', 'firstTouch', 'passing', 'decisions', 'composure', 'concentration', 'workRate'];
  if (pos === 'TW') return ['reflexes', 'handling', 'positioning', 'oneOnOnes', 'aerialReach', 'communication', 'kicking', 'concentration', 'agility', 'composure'];
  if (['LIB', 'IV', 'RV', 'LV'].includes(pos)) return [...common, 'tackling', 'marking', 'positioning', 'heading', 'interceptions'];
  if (['DM', 'ZM', 'RM', 'LM', 'OM'].includes(pos)) return [...common, 'vision', 'ballControl', 'longPassing', 'dribbling', 'positioning'];
  return [...common, 'shooting', 'dribbling', 'ballControl', 'heading', 'shotPower', 'longShots'];
}

/**
 * Engt die Scouting-Spanne [min,max] pro Woche etwas weiter an das wahre
 * Potenzial an. Bessere Akademien scouten präziser (schnellere Annäherung).
 */
function narrowScoutRange(p: Player, academyLevel: number, scoutBonus = 0): void {
  const truePot = p.potentialStars;
  if (p.scoutedPotentialMin == null) p.scoutedPotentialMin = truePot;
  if (p.scoutedPotentialMax == null) p.scoutedPotentialMax = truePot;
  const step = 0.25; // ein Raster-Schritt je Woche
  // Höhere Stufe → gelegentlich zwei Schritte (schnellere Konvergenz).
  const fast = academyLevel >= 4 && pseudo(`${p.id}:${p.overall}:fast`) < 0.5;
  // Scouting-Bonus (Mitarbeiter + Datenanalyse-Zentrum, Block p11): zusätzliche
  // Chance auf einen weiteren Raster-Schritt → präzisere Talentbewertung.
  const bonusStep = scoutBonus > 0 && pseudo(`${p.id}:${p.overall}:scout`) < Math.min(0.9, scoutBonus * 3) ? step : 0;
  const shrink = (fast ? step * 2 : step) + bonusStep;

  if (p.scoutedPotentialMin < truePot) {
    p.scoutedPotentialMin = clampStars(Math.min(truePot, p.scoutedPotentialMin + shrink));
  }
  if (p.scoutedPotentialMax > truePot) {
    p.scoutedPotentialMax = clampStars(Math.max(truePot, p.scoutedPotentialMax - shrink));
  }
}
