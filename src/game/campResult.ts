// =============================================================================
// TRAININGSLAGER – Reisegruppe und gemessene Wirkung (Vorher/Nachher je Spieler,
// Gesamterfolg, Gewinner/Verlierer). Erfasst in game/trainingCampGame.ts beim
// Lagerende, archiviert kompakt in `CampBooking.result` und im Verlauf.
// =============================================================================
import { campScore } from '../engine/campPlan';
import type { Player } from '../types';
import { Game, MORALE_ORDER } from './state';
import type { CampBooking, CampPlayerDelta, CampResult } from './winterShared';

const r1 = (v: number) => Math.round(v * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/** Jugendspieler ab diesem Alter können ins Lager eingeladen werden (B-/A-Jugend). */
export const CAMP_YOUTH_INVITE_AGE = 16;
export const CAMP_YOUTH_MAX = 6;

export interface CampGroup { pros: Player[]; youth: Player[]; stayed: Player[] }

/** Wer fährt mit? Ohne gespeicherte Auswahl (alte Stände, KI): alle Profis. */
export function campGroup(g: Game, b: Pick<CampBooking, 'squad' | 'youth'>): CampGroup {
  const club = g.clubs[g.managedClubId];
  const all = club.playerIds.map((id) => g.players[id]).filter(Boolean);
  const pick = b.squad ? new Set(b.squad) : null;
  const pros = pick ? all.filter((p) => pick.has(p.id)) : all;
  const stayed = pick ? all.filter((p) => !pick.has(p.id)) : [];
  const youth = (b.youth ?? []).map((id) => g.youthPlayers?.[id]).filter((p): p is Player => !!p && club.youthPlayerIds.includes(p.id));
  return { pros, youth, stayed };
}

/** Vorschlag: alle gesunden Profis (Verletzte bleiben zur Reha daheim). */
export function defaultCampSquad(g: Game): string[] {
  const club = g.clubs[g.managedClubId];
  return club.playerIds.filter((id) => g.players[id] && !g.players[id].injury);
}

/** Einladbare Jugendspieler (B-/A-Jugend), die stärksten und ältesten zuerst. */
export function invitableYouth(g: Game): Player[] {
  const club = g.clubs[g.managedClubId];
  return club.youthPlayerIds.map((id) => g.youthPlayers?.[id]).filter((p): p is Player => !!p && p.age >= CAMP_YOUTH_INVITE_AGE && !p.injury)
    .sort((a, b) => b.overall - a.overall || b.age - a.age);
}

export interface Snap { fit: number; form: number; frische: number; morale: number; dev: number }
export function snap(p: Player): Snap {
  return { fit: p.attributes.fitness, form: p.form, frische: p.frische ?? 100, morale: Math.max(0, MORALE_ORDER.indexOf(p.morale)), dev: p.development?.devPoints ?? 0 };
}
/** Teamgeist: mittlere Moral 0–100. */
export function spiritOf(ps: Player[]): number {
  return Math.round(mean(ps.map((p) => Math.max(0, MORALE_ORDER.indexOf(p.morale)) * 25)));
}

export function playerDelta(p: Player, before: Snap, youth: boolean, injured?: string, incident?: boolean): CampPlayerDelta {
  const a = snap(p);
  const fit = r1(a.fit - before.fit), form = r1(a.form - before.form), dev = Math.round((a.dev - before.dev) * 100) / 100, morale = a.morale - before.morale;
  const score = fit * 0.6 + form * 0.5 + dev * 25 + morale * 5 - (injured ? 30 : 0) - (incident ? 10 : 0);
  return { id: p.id, name: p.fullName, pos: p.naturalPosition, age: p.age, youth: youth || undefined, fit, form, dev, morale, injured, incident: incident || undefined, score: r1(score) };
}

export interface ResultInput {
  b: CampBooking; luck: number; group: CampGroup; before: Map<string, Snap>; spiritBefore: number;
  deltas: CampPlayerDelta[]; healed: number; income: number; sponsor: number; fans: number;
}
export function buildCampResult(g: Game, x: ResultInput): CampResult {
  const trav = [...x.group.pros, ...x.group.youth].filter((p) => x.before.has(p.id));
  const bef = trav.map((p) => x.before.get(p.id)!);
  const aft = trav.map(snap);
  const fit: [number, number] = [r1(mean(bef.map((s) => s.fit))), r1(mean(aft.map((s) => s.fit)))];
  const squad = g.clubs[g.managedClubId].playerIds.map((id) => g.players[id]).filter(Boolean);
  const moraleUp = x.deltas.filter((d) => d.morale > 0).length;
  const moraleDown = x.deltas.filter((d) => d.morale < 0).length;
  const injuries = x.deltas.filter((d) => d.injured).length;
  const incidents = x.deltas.filter((d) => d.incident).length;
  const dev = Math.round(mean(x.deltas.filter((d) => !d.injured && trav.some((p) => p.id === d.id)).map((d) => d.dev)) * 100) / 100;
  const ranked = x.deltas.filter((d) => trav.some((p) => p.id === d.id)).sort((a, b) => b.score - a.score);
  const best = ranked.filter((d) => d.score > 0).slice(0, 4);
  const worst = [...ranked].reverse().filter((d) => d.score < 1.5 && !best.includes(d)).slice(0, 4);
  // Zuhausegebliebene, die murren, zählen bei den Verlierern mit.
  for (const d of x.deltas) if (!trav.some((p) => p.id === d.id) && d.morale < 0 && worst.length < 4) worst.push(d);
  return {
    score: campScore({ luck: x.luck, fitGain: fit[1] - fit[0], fitAfter: fit[1], dev, moraleUp, moraleDown, travelers: trav.length, injuries, incidents }),
    luck: r1(x.luck * 100) / 100,
    travelers: x.group.pros.length, youth: x.group.youth.length, stayed: x.group.stayed.length,
    fit, form: [r1(mean(bef.map((s) => s.form))), r1(mean(aft.map((s) => s.form)))],
    frische: [Math.round(mean(bef.map((s) => s.frische))), Math.round(mean(aft.map((s) => s.frische)))],
    spirit: [x.spiritBefore, spiritOf(squad)],
    dev, moraleUp, moraleDown, injuries, incidents, healed: x.healed,
    cost: x.b.cost, income: x.income, sponsor: x.sponsor, fans: r1(x.fans),
    best, worst,
  };
}
