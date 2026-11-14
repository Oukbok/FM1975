// =============================================================================
// TRAINERTEAM UND SPIELERENTWICKLUNG (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Das Trainerteam eines Vereins hat ein NIVEAU auf der Skala der Spielerstärke
// (1–99, engine/staffSkills.ts `staffLevel`): 65 % Cheftrainer, 35 % Co-Trainer.
// Dieses Niveau steht jedem Spieler gegenüber:
//   • Decke: Sein volles Potenzial erreicht ein Spieler nur, wenn das Niveau im
//     Bereich seines Potenzials liegt (höchstens 5 Punkte darunter; mehr als 90
//     braucht niemand). Je Punkt, der fehlt, bleiben 0,4 Punkte Potenzial liegen,
//     höchstens 8. Das Potenzial selbst geht nicht verloren – unter einem
//     besseren Trainer geht es weiter.
//   • Lernen: Arbeitet das Trainerteam deutlich über dem Niveau des Spielers,
//     sammelt er schneller Entwicklungspunkte (bis +30 %), darunter langsamer
//     (bis −15 %). Neutral bei 4 Punkten Vorsprung des Trainerteams.
//   • Bewertungsrunden: Ein klar stärkeres Trainerteam bringt jungen Spielern
//     ab und zu einen Extrapunkt („Schub“); wem die Trainer nichts mehr
//     beibringen können, der verliert gelegentlich etwas („unterfordert“).
//   • Abbau: Gute Trainer bremsen ihn leicht, schwache beschleunigen ihn.
// Besetzung (nur eigener Verein): Ohne Cheftrainer und mit zu wenigen
// Co-Trainern für die Vereinsgröße sinkt die Trainingsqualität deutlich.
// Torhüter richten sich nach dem Torwarttrainer.
// Reine Rechnung – Ablauf in game/coachingGame.ts, Anwendung in development.ts.
// =============================================================================
import { effectiveQuality, methodFactor, type StaffMember } from './staffPeople';
import { hasTrait, roleFit, staffLevelExact } from './staffSkills';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const HEAD_ROLE = 'cheftrainer';
export const ASSIST_ROLE = 'cotrainer';
export const GK_ROLE = 'torwarttrainer';

/** Abzug auf die Trainingsqualität ohne Cheftrainer bzw. je fehlendem Co-Trainer. */
export const NO_HEAD_PENALTY = 0.1;
export const MISSING_ASSIST_PENALTY = 0.05;
/** Ohne jeden Trainer: das Niveau, auf dem die Mannschaft sich selbst überlassen ist. */
export const NO_COACH_LEVEL = 35;

/** Wie viele Co-Trainer ein Verein seiner Größe in der Zeit braucht (1–3). */
export function assistantsNeeded(clubRep: number, year: number, squadSize = 24): number {
  const base = year < 1990 ? 0.8 : year < 2005 ? 1.3 : 1.8;
  return clamp(Math.round(base + (clubRep - 60) / 20 + (squadSize > 28 ? 0.4 : 0)), 1, year < 1990 ? 2 : 3);
}

/** Stärke 1–99 einer Person in ihrer Stelle (veraltete Methoden kosten). */
export function memberLevel(m: StaffMember, year: number): number {
  return staffLevelExact(roleFit(m.skills, m.roleId, m.quality) * methodFactor(m, year));
}

/** Gewicht der Stellen für die Trainingsqualität; weitere Co-Trainer zählen abnehmend. */
const COACH_WEIGHT: Record<string, number> = {
  cheftrainer: 1, cotrainer: 0.7, konditionstrainer: 0.45, athletiktrainer: 0.45, torwarttrainer: 0.25,
  sportpsychologe: 0.2, fussballpsychologe: 0.2, sportwissenschaftler: 0.25, head_performance: 0.3,
};
const ASSIST_SHARE = [1, 0.5, 0.35];

export interface CoachingTeam {
  head: StaffMember | null;
  /** Stärke des Cheftrainers (0 = keiner). */
  headLevel: number;
  /** Co-Trainer, beste zuerst. */
  assistants: StaffMember[];
  assistLevel: number;
  /** Gebrauchte / fehlende Co-Trainer. */
  need: number;
  missing: number;
  gkCoach: StaffMember | null;
  /** Niveau des Trainerteams für Feldspieler bzw. Torhüter (1–99). */
  level: number;
  gkLevel: number;
  /** Trainingsqualität aus der Güte der Leute (−0,02 … +0,20). */
  quality: number;
  /** Abzug für fehlende Besetzung (≤ 0). */
  penalty: number;
  /** Zusatz zum Trainingsfaktor = quality + penalty. */
  extra: number;
  /** Besetzung 0,3–1 (Anzeige „Betreuung“; 1 = Cheftrainer und genug Co-Trainer). */
  capacity: number;
  /** Summe der gewichteten Trainerqualität (für Anzeigen). */
  strength: number;
  /** Eigenschaften im Team: Faktor für Spieler bis 21 bzw. auf den Abbau ab 30. */
  youthBoost: number;
  veteranBrake: number;
}

/** Trainerteam eines Vereins aus seinen Angestellten. */
export function coachingTeam(members: StaffMember[], squadSize: number, year: number, clubRep: number): CoachingTeam {
  const lvl = (m: StaffMember) => memberLevel(m, year);
  const heads = members.filter((m) => m.roleId === HEAD_ROLE).sort((a, b) => lvl(b) - lvl(a));
  const assistants = members.filter((m) => m.roleId === ASSIST_ROLE).sort((a, b) => lvl(b) - lvl(a));
  const gkCoach = members.filter((m) => m.roleId === GK_ROLE).sort((a, b) => lvl(b) - lvl(a))[0] ?? null;
  const head = heads[0] ?? null;
  const need = assistantsNeeded(clubRep, year, squadSize);
  const missing = Math.max(0, need - assistants.length);

  // Trainingsqualität: Sättigung über die gewichtete Güte aller Trainer.
  let s = 0;
  for (const m of members) {
    const w = COACH_WEIGHT[m.roleId];
    if (!w) continue;
    if (m.roleId === HEAD_ROLE && m !== head) continue;
    const share = m.roleId === ASSIST_ROLE ? ASSIST_SHARE[Math.min(ASSIST_SHARE.length - 1, assistants.indexOf(m))] ?? 0.35 : 1;
    s += w * share * effectiveQuality(m, year);
  }
  const quality = (1 - Math.exp(-s / 20)) * 0.22 - 0.02;
  const penalty = -(head ? 0 : NO_HEAD_PENALTY) - missing * MISSING_ASSIST_PENALTY;

  // Niveau: Cheftrainer 65 %, die gebrauchten Co-Trainer 35 % (der beste zählt doppelt).
  const headLevel = head ? lvl(head) : 0;
  const used = assistants.slice(0, need);
  let assistLevel = 0;
  if (used.length) {
    let sum = 0, ws = 0;
    used.forEach((m, i) => { const w = i === 0 ? 2 : 1; sum += lvl(m) * w; ws += w; });
    assistLevel = sum / ws;
  }
  let level: number;
  if (head) level = 0.65 * headLevel + 0.35 * (used.length ? assistLevel : headLevel - 15) - missing * 1.5;
  else if (used.length) level = assistLevel - 8 - missing * 1.5; // der Co-Trainer muss den Laden allein schmeißen
  else level = NO_COACH_LEVEL;
  level = clamp(level, NO_COACH_LEVEL, 99);

  // Torhüter: Torwarttrainer; ohne ihn bleibt nur das allgemeine Training (vor 1980 der Normalfall).
  const gkBase = level - (year < 1980 ? 3 : 10);
  const gkLevel = clamp(gkCoach ? Math.max(lvl(gkCoach), gkBase) : gkBase, NO_COACH_LEVEL - 5, 99);

  const lead = [head, ...used].filter(Boolean) as StaffMember[];
  const youthBoost = lead.some((m) => hasTrait(m, 'foerderer')) || members.some((m) => m.roleId === 'jugendtrainer' && hasTrait(m, 'foerderer')) ? 1.06 : 1;
  const veteranBrake = lead.some((m) => hasTrait(m, 'altmeister')) || members.some((m) => m.roleId === 'konditionstrainer' && hasTrait(m, 'altmeister')) ? 0.92 : 1;

  return {
    head, headLevel, assistants, assistLevel, need, missing, gkCoach, level, gkLevel,
    quality: Math.round(quality * 1000) / 1000, penalty: Math.round(penalty * 1000) / 1000,
    extra: Math.round((quality + penalty) * 1000) / 1000,
    capacity: clamp(1 - (head ? 0 : 0.3) - (missing / need) * 0.4, 0.3, 1),
    strength: Math.round(s * 10) / 10, youthBoost, veteranBrake,
  };
}

/** Niveau eines KI-Vereins: Ansehen des Cheftrainers (als Stärke) und sein Co-Trainer vom Arbeitsmarkt. */
export function aiCoachLevel(headLevel: number, assistLevel: number, gkCoachLevel: number | null, year: number): { level: number; gk: number } {
  const level = clamp(0.65 * headLevel + 0.35 * assistLevel, NO_COACH_LEVEL, 99);
  const gkBase = level - (year < 1980 ? 3 : 6);
  return { level, gk: clamp(gkCoachLevel != null ? Math.max(gkCoachLevel, gkBase) : gkBase, NO_COACH_LEVEL, 99) };
}

// -----------------------------------------------------------------------------
// Wirkung auf den einzelnen Spieler
// -----------------------------------------------------------------------------
/** So weit darf das Trainerniveau unter dem Potenzial liegen, ohne dass etwas liegen bleibt. */
export const POT_TOLERANCE = 5;
/** Mehr Trainerniveau als das braucht kein Spieler. */
export const POT_NEED_MAX = 90;
const POT_CUT_PER_POINT = 0.4;
export const POT_CUT_MAX = 8;

/** Niveau, das ein Spieler mit diesem Potenzial braucht, um es ganz auszuschöpfen. */
export const levelNeeded = (potential: number): number => Math.min(potential - POT_TOLERANCE, POT_NEED_MAX);

/** Punkte Potenzial, die unter diesem Trainerniveau unerreichbar bleiben (0–8). */
export function coachPotCut(potential: number, level: number): number {
  return clamp((levelNeeded(potential) - level) * POT_CUT_PER_POINT, 0, POT_CUT_MAX);
}

/** Vorsprung des Trainerteams, bei dem das Lerntempo normal ist. */
export const TEACH_NEUTRAL = 4;
/** Lerntempo 0,85–1,30 aus dem Abstand Trainerniveau − Spielerstärke. */
export function teachFactor(level: number, overall: number): number {
  return 1 + clamp((level - overall - TEACH_NEUTRAL) * 0.012, -0.15, 0.3);
}

/** Faktor auf den Abbau im Alter (0,88–1,08): starke Trainer bremsen, schwache beschleunigen. */
export function declineFactor(level: number, overall: number): number {
  return 1 - clamp((level - overall) * 0.006, -0.08, 0.12);
}

/** Chance auf einen Extrapunkt in der Bewertungsrunde (junger Spieler, Trainerteam klar stärker). */
export function pushChance(level: number, overall: number, age: number): number {
  if (age > 27) return 0;
  const diff = level - overall;
  return diff < 8 ? 0 : clamp((diff - 4) * 0.012, 0, 0.3);
}

/** Chance auf einen Abzug in der Bewertungsrunde (Spieler klar über dem Niveau seiner Trainer). */
export function dragChance(level: number, overall: number, age: number): number {
  if (age < 22) return 0;
  const diff = overall - level;
  return diff < 8 ? 0 : clamp((diff - 4) * 0.012, 0, 0.25);
}
