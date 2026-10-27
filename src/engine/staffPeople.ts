// =============================================================================
// MITARBEITER 2.0 — echte Personen statt Rollen-Schalter
// -----------------------------------------------------------------------------
// Jede angestellte Rolle ist eine Person mit Qualität (1–20), Spezialgebiet,
// Methodenstand (Jahr, in dem ihr Wissen aktuell war), Alter und Vereinstreue.
//
// Wirkung auf die Entwicklung (bewusst gebremst, kein „Top-Co-Trainer = alle explodieren“):
//   • Trainerteam erhöht das Entwicklungstempo um höchstens ~+20 % (Sättigung).
//     Das Potenzial selbst ändert sich nicht – gute Trainer holen nur zuverlässiger
//     heraus, was in den Spielern steckt.
//   • Kapazität: ein Trainer betreut ~9 Spieler sinnvoll; ein riesiger Kader verwässert.
//   • Methodenstand veraltet: ab 8 Jahren ohne Fortbildung sinkt die Wirkung.
//   • Spezialisten wirken nur auf passende Spieler (Torwart-, Technik-, Taktik-, Athletiktrainer).
//   • Förderspieler (max. 3) bekommen mehr Aufmerksamkeit – der Rest etwas weniger.
//   • Gute Leute werden abgeworben; Treue und ein großer Verein halten sie.
// =============================================================================

import { STAFF_BY_ID, STAFF_CAPS, STAFF_COST_BASE, StaffEffects, StaffRole } from '../data/staff';
import { makeName, pickOrigin } from '../data/origins';
import { Player } from '../types';

export type CoachSpecialty = 'allround' | 'athletik' | 'technik' | 'taktik' | 'torwart' | 'mental' | 'jugend';

export const SPECIALTY_LABEL: Record<CoachSpecialty, string> = {
  allround: 'Allrounder', athletik: 'Athletik', technik: 'Technik', taktik: 'Taktik',
  torwart: 'Torwart', mental: 'Mentales', jugend: 'Nachwuchs',
};

export interface StaffMember {
  id: string;
  roleId: string;
  name: string;
  age: number;
  /** Fachliche Qualität 1–20. */
  quality: number;
  specialty: CoachSpecialty;
  /** Jahr, in dem der Methodenstand aktuell war (Ausbildung/letzte Fortbildung). */
  methodYear: number;
  /** Vereinstreue 0–100 (schützt vor Abwerbung). */
  loyalty: number;
  /** Gehaltsfaktor relativ zur Kostenklasse der Rolle. */
  salaryFactor: number;
  hired: string;
}

/** Trainingsphilosophie je Saisonphase (wenig Klickarbeit, spürbare Wirkung). */
export type TrainingFocus = 'balance' | 'belastung' | 'technik' | 'regeneration' | 'jugend';
export type SeasonPhase = 'vorbereitung' | 'hinrunde' | 'winter' | 'rueckrunde';

export const FOCUS_LABEL: Record<TrainingFocus, string> = {
  balance: 'Ausgewogen', belastung: 'Hohe Belastung', technik: 'Technik & Taktik', regeneration: 'Schonung', jugend: 'Talente fördern',
};
export const FOCUS_INFO: Record<TrainingFocus, string> = {
  balance: 'Keine Schwerpunkte, keine Nebenwirkungen.',
  belastung: 'Mehr Entwicklung (+6 %), aber höheres Verletzungsrisiko (+20 %) und weniger Frische.',
  technik: 'Mehr Entwicklung bei Technikern und jungen Spielern (+5 %), etwas weniger bei Älteren.',
  regeneration: 'Weniger Verletzungen (−20 %), dafür langsamere Entwicklung (−5 %).',
  jugend: 'Spieler bis 23 entwickeln sich schneller (+10 %), Ältere langsamer (−4 %).',
};
export const PHASE_LABEL: Record<SeasonPhase, string> = {
  vorbereitung: 'Vorbereitung (Jul–Aug)', hinrunde: 'Hinrunde (Sep–Nov)', winter: 'Winter (Dez–Jan)', rueckrunde: 'Rückrunde (Feb–Jun)',
};

export function phaseOf(dateISO: string): SeasonPhase {
  const m = Number(dateISO.slice(5, 7));
  if (m === 7 || m === 8) return 'vorbereitung';
  if (m >= 9 && m <= 11) return 'hinrunde';
  if (m === 12 || m === 1) return 'winter';
  return 'rueckrunde';
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Kandidaten & Personen
// -----------------------------------------------------------------------------
const TRAINER_ROLES = new Set(['cheftrainer', 'cotrainer', 'konditionstrainer', 'athletiktrainer', 'torwarttrainer', 'jugendtrainer']);

function specialtyFor(roleId: string, r: () => number): CoachSpecialty {
  if (roleId === 'torwarttrainer') return 'torwart';
  if (roleId === 'konditionstrainer' || roleId === 'athletiktrainer') return 'athletik';
  if (roleId === 'jugendtrainer' || roleId === 'nachwuchskoord') return 'jugend';
  if (roleId === 'sportpsychologe' || roleId === 'fussballpsychologe') return 'mental';
  if (roleId === 'cheftrainer' || roleId === 'cotrainer') {
    const opts: CoachSpecialty[] = ['allround', 'allround', 'technik', 'taktik', 'athletik', 'mental'];
    return opts[Math.floor(r() * opts.length)];
  }
  return 'allround';
}

/**
 * Drei Bewerber für eine Rolle: günstiger Nachwuchsmann, solide Kraft, Spitzenkraft.
 * Die Spitzenkraft ist teuer und oft älter (Methodenstand evtl. nicht mehr frisch).
 */
export function makeCandidates(roleId: string, year: number, clubRep: number, r: () => number): StaffMember[] {
  const out: StaffMember[] = [];
  const tiers = [
    { q: [5, 9], age: [27, 36], fac: 0.7, method: [0, 2] },
    { q: [9, 14], age: [34, 52], fac: 1.0, method: [0, 10] },
    { q: [14, 19], age: [40, 62], fac: 2.0, method: [2, 16] },
  ];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    // Kleine Vereine bekommen seltener echte Spitzenkräfte.
    const repCap = i === 2 ? Math.round(12 + clubRep / 12) : 20;
    const quality = Math.min(repCap, t.q[0] + Math.floor(r() * (t.q[1] - t.q[0] + 1)));
    const age = t.age[0] + Math.floor(r() * (t.age[1] - t.age[0] + 1));
    const origin = pickOrigin(year, r, true);
    const n = makeName(origin, r);
    out.push({
      id: `st_${roleId}_${year}_${Math.floor(r() * 1e9)}`,
      roleId, name: `${n.firstName} ${n.lastName}`, age, quality,
      specialty: specialtyFor(roleId, r),
      methodYear: year - (t.method[0] + Math.floor(r() * (t.method[1] - t.method[0] + 1))),
      loyalty: 30 + Math.floor(r() * 50),
      salaryFactor: Math.round((t.fac * (0.85 + quality / 40) + r() * 0.2) * 100) / 100,
      hired: '',
    });
  }
  return out;
}

/** Bestehende Rollen-Listen (alte Spielstände) in Personen umwandeln. */
export function migrateStaff(roleIds: string[], year: number, r: () => number): StaffMember[] {
  return roleIds.filter((id) => STAFF_BY_ID[id]).map((id) => {
    const c = makeCandidates(id, year, 60, r)[1];
    return { ...c, hired: `${year}-07-01` };
  });
}

export function memberMonthlySalary(m: StaffMember, scale: number): number {
  const role = STAFF_BY_ID[m.roleId];
  if (!role) return 0;
  return Math.round(STAFF_COST_BASE[role.costClass] * m.salaryFactor * scale);
}

/** Methodenstand: nach 8 Jahren ohne Fortbildung verliert die Arbeit an Wirkung. */
export function methodFactor(m: StaffMember, year: number): number {
  return clamp(1 - Math.max(0, year - m.methodYear - 8) * 0.025, 0.65, 1);
}

export function effectiveQuality(m: StaffMember, year: number): number {
  return m.quality * methodFactor(m, year);
}

// -----------------------------------------------------------------------------
// Wirkung
// -----------------------------------------------------------------------------
/** Gedeckelte Effekte wie bisher, aber nach Qualität gewichtet. */
export function staffEffectsFromMembers(members: StaffMember[], year: number): StaffEffects {
  let injuryReduction = 0, rehabReduction = 0, recovery = 0, scouting = 0, reach = 0;
  for (const m of members) {
    const r: StaffRole | undefined = STAFF_BY_ID[m.roleId];
    if (!r) continue;
    const q = clamp(effectiveQuality(m, year) / 11, 0.35, 1.5);
    injuryReduction += (r.injuryReduction ?? 0) * q;
    rehabReduction += (r.rehabReduction ?? 0) * q;
    recovery += (r.recovery ?? 0) * q;
    scouting += (r.scouting ?? 0) * q;
    reach += (r.reach ?? 0) * q;
  }
  return {
    injuryReduction: Math.min(STAFF_CAPS.injuryReduction, injuryReduction),
    rehabReduction: Math.min(STAFF_CAPS.rehabReduction, rehabReduction),
    recovery: Math.min(STAFF_CAPS.recovery, recovery),
    scouting: Math.min(STAFF_CAPS.scouting, scouting),
    reach: Math.min(STAFF_CAPS.reach, reach),
  };
}

const COACH_WEIGHT: Record<string, number> = {
  cheftrainer: 1, cotrainer: 0.7, konditionstrainer: 0.45, athletiktrainer: 0.45, torwarttrainer: 0.25,
  sportpsychologe: 0.2, fussballpsychologe: 0.2, sportwissenschaftler: 0.25, head_performance: 0.3,
};

export interface CoachingReport {
  /** Zusatz zum Trainingsfaktor (−0,02 … +0,20). */
  extra: number;
  /** Betreuungsquote (1 = ausreichend Trainer für den Kader). */
  capacity: number;
  /** Summe der effektiven Trainerqualität (für Anzeigen). */
  strength: number;
}

export function coachingReport(members: StaffMember[], squadSize: number, year: number): CoachingReport {
  let s = 0, coaches = 0;
  for (const m of members) {
    const w = COACH_WEIGHT[m.roleId];
    if (!w) continue;
    s += w * effectiveQuality(m, year);
    if (TRAINER_ROLES.has(m.roleId) && m.roleId !== 'jugendtrainer') coaches++;
  }
  // Der Manager selbst zählt als ein Trainer.
  const capacity = clamp(((coaches + 1) * 9) / Math.max(1, squadSize), 0.35, 1);
  const extra = (1 - Math.exp(-s / 20)) * 0.22 * Math.sqrt(capacity) - 0.02;
  return { extra: Math.round(extra * 1000) / 1000, capacity, strength: Math.round(s * 10) / 10 };
}

const OFFENSIVE = new Set(['OM', 'FL', 'MS', 'HS', 'ZM']);
const DEFENSIVE = new Set(['LIB', 'VS', 'AV', 'DM']);

/** Spezialisten-Bonus für einen Spieler (Multiplikator 1,00 … 1,10). */
export function specialistBoost(members: StaffMember[], p: Player, year: number): number {
  let b = 0;
  for (const m of members) {
    const q = effectiveQuality(m, year) / 20; // 0..1
    switch (m.specialty) {
      case 'torwart': if (p.naturalPosition === 'TW') b += 0.08 * q; break;
      case 'technik': if (OFFENSIVE.has(p.naturalPosition)) b += 0.05 * q; break;
      case 'taktik': if (DEFENSIVE.has(p.naturalPosition)) b += 0.05 * q; break;
      case 'athletik': b += 0.025 * q; break;
      case 'mental': b += 0.02 * q; break;
      default: break;
    }
  }
  return 1 + Math.min(0.1, b);
}

/** Wirkung der Trainingsphilosophie auf Entwicklung und Verletzungsrisiko. */
export function focusEffect(focus: TrainingFocus, p: Player): { dev: number; injury: number } {
  switch (focus) {
    case 'belastung': return { dev: 1.06, injury: 1.2 };
    case 'regeneration': return { dev: 0.95, injury: 0.8 };
    case 'technik': return { dev: p.age <= 24 || OFFENSIVE.has(p.naturalPosition) ? 1.05 : 0.98, injury: 1 };
    case 'jugend': return { dev: p.age <= 23 ? 1.1 : 0.96, injury: 1 };
    default: return { dev: 1, injury: 1 };
  }
}

// -----------------------------------------------------------------------------
// Saisonwechsel: Altern, Ruhestand, Abwerbung
// -----------------------------------------------------------------------------
export interface StaffSeasonNews { left: { m: StaffMember; reason: string }[] }

export function staffSeasonTurnover(
  members: StaffMember[], clubRep: number, year: number, r: () => number, rivalName: () => string,
): StaffSeasonNews {
  const left: { m: StaffMember; reason: string }[] = [];
  for (const m of [...members]) {
    m.age++;
    m.loyalty = clamp(m.loyalty + 3, 0, 100);
    if (m.age >= 66 || (m.age >= 62 && r() < 0.3)) {
      left.push({ m, reason: 'geht in den Ruhestand' });
      continue;
    }
    if (m.quality >= 14) {
      const chance = 0.06 + (m.quality - 14) * 0.035 - m.loyalty / 500 + (clubRep < 70 ? 0.05 : 0) - (m.salaryFactor > 2.2 ? 0.04 : 0);
      if (r() < chance) left.push({ m, reason: `wird von ${rivalName()} abgeworben` });
    }
    // Qualität entwickelt sich leicht (junge Trainer lernen, alte stagnieren).
    if (m.age < 45 && r() < 0.35) m.quality = Math.min(20, m.quality + 1);
    else if (m.age > 58 && r() < 0.2) m.quality = Math.max(1, m.quality - 1);
  }
  for (const l of left) members.splice(members.indexOf(l.m), 1);
  return { left };
}

/** Kosten einer Fortbildung: drei Monatsgehälter. Setzt den Methodenstand auf heute. */
export function trainingCourseCost(m: StaffMember, scale: number): number {
  return memberMonthlySalary(m, scale) * 3;
}
