// =============================================================================
// Laufzeit-Zustand einer Mannschaft in der Simulation.
// =============================================================================
import { teamFit } from './tacticFit';
import type { TakerKind } from '../../types';
import { teamBoostOf } from '../teamBoost';
import type { Club, Tactics } from '../../types';
import type { FormationSlot } from '../../data/formations';
import type { MPlayer, Mentality, ShoutId, Side, TeamStats } from './types';
import { tacticPlan, type TacticPlan } from './tacticPlan';
import { refreshSkills } from './skills';
import { computeUnits, referenceWeights, tacticMods, type TacticMods, type TeamRefs, type Units } from './team';
import { honourFx, staffStrength } from '../honourEffects';
import { effectiveTactics } from '../tacticEra';
import { autoRole, roleFitFactor, roleFor, roleRef, roleWeights, NEUTRAL_RU } from '../tacticRoles';
import { COHESION_NEUTRAL, cohesionErrors, cohesionFactor, cohesionOf, validCohesion } from '../cohesion';

export interface TeamState {
  side: Side;
  club: Club;
  human: boolean;
  /** Verein des Spielers (gespeicherte Aufstellung und Rollen); KI-Vereine wählen Rollen je Spiel selbst. */
  own?: boolean;
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
  /** Reihenfolgen für Kapitän/Standards (engine/setPieceOrder.ts); fehlt sie, gelten die Einzel-IDs. */
  orders?: Partial<Record<TakerKind, string[]>>;
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

/**
 * Rollen der Spieler auf dem Platz (engine/tacticRoles.ts): eigener Verein nach `Tactics.roles` (je Slot),
 * KI-Vereine die passendste Rolle. Neu gesetzt nur, wenn sich Position oder Vorgabe geändert hat.
 */
function assignRoles(t: TeamState, tac: Tactics | undefined): number {
  const bySlot: Record<string, string> = {};
  if (t.own && t.layout) for (const k in t.layout.map) bySlot[t.layout.map[k]] = k;
  let changed = false, sweep = 0;
  for (const m of onPitch(t)) {
    const want = t.own ? tac?.roles?.[bySlot[m.id] ?? ''] ?? '' : '*';
    const key = `${m.pos}|${want}`;
    if (m.roleKey !== key) {
      const ref = roleRef(m.p, m.base);
      const role = t.own ? roleFor(want || undefined, m.pos, t.year) : autoRole(m.p, m.pos, t.year, ref);
      m.roleKey = key;
      m.role = role.id;
      m.rf = roleWeights(role);
      m.ru = role.ru ?? NEUTRAL_RU;
      m.rd = role.rd ?? 1;
      m.rfit = roleFitFactor(m.p, role, ref);
      changed = true;
    }
    if (m.group === 'GK' && m.role === 'tw_mit') sweep = 0.12;
  }
  if (changed) refreshSkills();
  return sweep;
}

/** Mannschaftsteile + Taktik neu berechnen. */
export function refresh(t: TeamState, minute: number): void {
  const active = t.shout && minute < t.shoutUntil ? t.shout : null;
  // Taktik mit den Grenzen der Epoche und der Formation (engine/tacticEra.ts)
  const tac = effectiveTactics(tacticsOf(t), t.year);
  const sweep = assignRoles(t, tac);
  t.mods = tacticMods(tac, t.mentality, active, active ? t.shoutPower : 0, t.talk);
  // Eingespieltheit (engine/cohesion.ts): 80 = neutral; wenig eingespielt = schwächer und fehleranfälliger.
  const co = t.club?.cohesion;
  const coh = tac && validCohesion(co) ? cohesionOf(co, tac, t.year, t.formation).total : COHESION_NEUTRAL;
  if (coh !== COHESION_NEUTRAL) {
    const cf = cohesionFactor(coh);
    t.mods = { ...t.mods, att: t.mods.att * cf, ctrl: t.mods.ctrl * cf, def: t.mods.def * cf, errors: t.mods.errors * cohesionErrors(coh) };
  }
  const sf = staffStrength(t.club?.id); // Stab (game/staffGame.ts bindStaffFactor)
  if (sf !== 1) t.mods = { ...t.mods, att: t.mods.att * sf, ctrl: t.mods.ctrl * sf, def: t.mods.def * sf };
  if (t.side === 'home') { // Festung (game/clubHonours.ts): etwas mehr Heimstärke
    const hs = honourFx(t.club?.id, 'homeStrength');
    if (hs) { t.mods = { ...t.mods, att: t.mods.att * (1 + hs), ctrl: t.mods.ctrl * (1 + hs), def: t.mods.def * (1 + hs) }; }
  }
  // Teambonus der Führungsspieler auf dem Platz (engine/teamBoost.ts, höchstens +3 %).
  const tb = teamBoostOf(onPitch(t).map((m) => m.p));
  if (tb) t.mods = { ...t.mods, att: t.mods.att * (1 + tb), ctrl: t.mods.ctrl * (1 + tb), def: t.mods.def * (1 + tb) };
  const pitch = onPitch(t);
  t.plan = tacticPlan(tac, t.year, t.mods, coh, sweep, teamFit(pitch.map((m) => ({ p: m.p, pos: m.pos }))));
  t.units = computeUnits(pitch, t.refs);
  t.dirty = false;
}
