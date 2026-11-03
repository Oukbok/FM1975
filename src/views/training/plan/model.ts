// =============================================================================
// Training › Trainingsplan – Anzeigedaten der vier Reiter (nichts wird gespeichert):
// Bausteingruppen (= Fachgebiet des Trainerteams, das sie anleitet), Trainingsgruppen
// aus dem Kader (nach echten Unterschieden im Trainingsablauf), Leitung je Gruppe.
// =============================================================================
import type { Player, TrainingBlock } from '../../../types';
import type { Game } from '../../../game/state';
import { yearOf } from '../../../engine/economy';
import { ensureStaff } from '../../../game/staffGame';
import { skillForBlock } from '../../../game/trainerTeam';
import { CoachSkill, SKILL_LABEL } from '../../../engine/staffSkills';
import { effectiveQuality, StaffMember } from '../../../engine/staffPeople';

export type PlanTab = 'team' | 'players' | 'groups' | 'long';
export const PLAN_TABS: { id: PlanTab; label: string }[] = [
  { id: 'team', label: 'Mannschaftstraining' },
  { id: 'players', label: 'Individuelle Spieler' },
  { id: 'groups', label: 'Trainingsgruppen' },
  { id: 'long', label: 'Langfristig' },
];

/** Bausteingruppe = Reiter rechts und Farbe der Kachel (Tokens --trc-*). */
export type BlockKind = 'fit' | 'tech' | 'tac' | 'misc';
export const KIND_TABS: { id: BlockKind; label: string; skill: CoachSkill | null }[] = [
  { id: 'fit', label: 'Fitness', skill: 'fitness' },
  { id: 'tech', label: 'Technik', skill: 'technik' },
  { id: 'tac', label: 'Taktik', skill: 'taktik' },
  { id: 'misc', label: 'Sonstiges', skill: null },
];
export function blockKind(b: TrainingBlock | null | undefined): BlockKind {
  if (!b) return 'misc';
  const s = skillForBlock(b);
  return s === 'fitness' ? 'fit' : s === 'technik' ? 'tech' : s === 'taktik' ? 'tac' : 'misc';
}

/** Bestes Mitglied des Trainerteams in einem Fachgebiet (Methodenstand berücksichtigt). */
export function leaderFor(g: Game, skill: CoachSkill): { m: StaffMember; v: number } | null {
  const year = yearOf(g.calendar.currentDate);
  let best: { m: StaffMember; v: number } | null = null;
  for (const m of ensureStaff(g)) {
    const raw = m.skills?.[skill] ?? 0;
    const v = Math.round(raw * (effectiveQuality(m, year) / Math.max(1, m.quality)));
    if (v > 0 && (!best || v > best.v)) best = { m, v };
  }
  return best;
}
export function leaderText(g: Game, skill: CoachSkill): string {
  const l = leaderFor(g, skill);
  return l ? `${l.m.name} · ${SKILL_LABEL[skill]} ${l.v}/20` : `niemand vom Fach (${SKILL_LABEL[skill]})`;
}

// -----------------------------------------------------------------------------
// Trainingsgruppen
// -----------------------------------------------------------------------------
export type GroupId = 'feld' | 'tw' | 'foerder' | 'position' | 'schonung' | 'verletzt';
export interface TrainGroup { id: GroupId; title: string; lead: string; note: string; players: Player[] }

/** Unter dieser Fitness steigt das Verletzungsrisiko im Training (engine/trainingPlan.ts dailyInjuryRisk). */
export const LOW_FITNESS = 50;

/**
 * Jeder Spieler genau einmal, Vorrang: verletzt › angeschlagen › Torhüter › Förderspieler ›
 * Positionstraining › Feldspieler. Alle (außer Verletzten) trainieren nach dem Wochenplan.
 */
export function trainingGroups(g: Game, squad: Player[]): TrainGroup[] {
  const foerder = new Set(g.foerderSpieler ?? []);
  const by: Record<GroupId, Player[]> = { feld: [], tw: [], foerder: [], position: [], schonung: [], verletzt: [] };
  for (const p of squad) {
    if (p.injury) by.verletzt.push(p);
    else if ((p.attributes.fitness ?? 100) < LOW_FITNESS) by.schonung.push(p);
    else if (p.naturalPosition === 'TW') by.tw.push(p);
    else if (foerder.has(p.id)) by.foerder.push(p);
    else if (p.positionSkill?.train) by.position.push(p);
    else by.feld.push(p);
  }
  return [
    { id: 'feld', title: 'Feldspieler', lead: leaderText(g, 'taktik'), note: 'Trainieren nach dem Wochenplan.', players: by.feld },
    { id: 'tw', title: 'Torhüter', lead: leaderText(g, 'torwart'), note: 'Torwarttraining wirkt nur hier; der Torwarttrainer verstärkt es.', players: by.tw },
    { id: 'foerder', title: 'Förderspieler', lead: 'Chef persönlich', note: '+25 % Entwicklungstempo, der übrige Kader −3 %.', players: by.foerder },
    { id: 'position', title: 'Positionstraining', lead: 'Trainingsanlagen', note: 'Lernen zusätzlich eine Position (bis 85, Rest im Spiel).', players: by.position },
    { id: 'schonung', title: 'Angeschlagen', lead: leaderText(g, 'fitness'), note: `Fitness unter ${LOW_FITNESS}: höheres Verletzungsrisiko bei harten Einheiten.`, players: by.schonung },
    { id: 'verletzt', title: 'Verletzte Spieler', lead: leaderText(g, 'medizin'), note: 'Trainieren nicht, nur Reha.', players: by.verletzt },
  ];
}

const POS_ORDER = ['TW', 'LIB', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM', 'LM', 'OM', 'RA', 'LA', 'HS', 'MS'];
export const byPosition = (a: Player, b: Player) =>
  (POS_ORDER.indexOf(a.naturalPosition) - POS_ORDER.indexOf(b.naturalPosition)) || b.overall - a.overall;
