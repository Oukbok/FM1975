// =============================================================================
// Laufzeit-Zustand einer Mannschaft in der Simulation.
// =============================================================================
import type { Club, Tactics } from '../../types';
import type { FormationSlot } from '../../data/formations';
import type { MPlayer, Mentality, ShoutId, Side, TeamStats } from './types';
import { tacticPlan, type TacticPlan } from './tacticPlan';
import { refreshSkills } from './skills';
import { computeUnits, referenceWeights, tacticMods, type TacticMods, type TeamRefs, type Units } from './team';

export interface TeamState {
  side: Side;
  club: Club;
  human: boolean;
  players: MPlayer[]; // alle (Startelf + Bank), Reihenfolge stabil
  formation: string;
  refs: TeamRefs;
  units: Units;
  mods: TacticMods;
  /** Angriffswege und Duell-Verschiebungen aus der Taktik (engine/match/tacticPlan.ts). */
  plan: TacticPlan;
  /** Saisonjahr (für den Epochen-Mix der Angriffswege). */
  year: number;
  goals: number;
  stats: TeamStats;
  mentality: Mentality;
  subsUsed: number;
  shout: ShoutId | null;
  shoutUntil: number;
  shoutPower: number;
  shoutReadyAt: number;
  shoutHistory: ShoutId[];
  talk: number;
  penaltyTakerId: string | null;
  freeKickTakerId: string | null;
  cornerTakerId: string | null;
  captainId: string | null;
  dirty: boolean;
  /** Zwischenspeicher der Spieler auf dem Platz (null = neu berechnen). */
  pitch: MPlayer[] | null;
  /** Zwischenspeicher der Feldspieler auf dem Platz. */
  field?: MPlayer[] | null;
  /** Formation mit Slots und Belegung (Slot-ID → Spieler-ID) – Anzeige/Umstellung im Textmodus. */
  layout?: { formation: string; slots: FormationSlot[]; map: Record<string, string> };
  /** Taktik nur für dieses Spiel (Änderungen im Wechsel-Bildschirm); sonst gilt club.tactics. */
  tactics?: Tactics;
  /** Menschlicher Trainer: Co-Trainer wechselt selbst (autoSubs) – sonst wartet ein Verletzter auf dich. */
  coach?: { autoSubs: boolean };
}

/** Taktik, die gerade gilt (Spiel-Taktik vor Vereins-Taktik). */
export const tacticsOf = (t: TeamState): Tactics | undefined => t.tactics ?? t.club.tactics;

export function emptyStats(): TeamStats {
  return {
    shots: 0, shotsOnTarget: 0, xg: 0, bigChances: 0, corners: 0, fouls: 0, yellow: 0, red: 0, offsides: 0,
    possession: 0, passes: 0, passesOk: 0, duels: 0, duelsWon: 0, distance: 0, saves: 0,
    crosses: 0, crossesOk: 0, aerials: 0, aerialsWon: 0, dribbles: 0, dribblesOk: 0, counters: 0,
  };
}

export const onPitch = (t: TeamState): MPlayer[] => t.pitch ?? (t.pitch = t.players.filter((m) => m.onPitch));
/** Nach Wechsel/Platzverweis aufrufen. */
export function lineupChanged(t: TeamState): void { t.pitch = null; t.field = null; t.dirty = true; refreshSkills(); }
export const fieldPlayers = (t: TeamState): MPlayer[] => t.field ?? (t.field = onPitch(t).filter((m) => m.group !== 'GK'));
export const bench = (t: TeamState): MPlayer[] => t.players.filter((m) => !m.onPitch && m.minuteOut === null && !m.started);

export function initRefs(t: TeamState): void {
  t.refs = referenceWeights(onPitch(t));
}

/** Mannschaftsteile + Taktik neu berechnen. */
export function refresh(t: TeamState, minute: number): void {
  const active = t.shout && minute < t.shoutUntil ? t.shout : null;
  t.mods = tacticMods(tacticsOf(t), t.mentality, active, active ? t.shoutPower : 0, t.talk);
  t.plan = tacticPlan(tacticsOf(t), t.year, t.mods);
  t.units = computeUnits(onPitch(t), t.refs);
  t.dirty = false;
}
