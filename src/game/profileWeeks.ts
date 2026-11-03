// =============================================================================
// WOCHENVERLAUF FÜRS SPIELERPROFIL (Reiter Statistiken › Spielerentwicklung)
// -----------------------------------------------------------------------------
// Sonntags (game/day.ts, nach der Wochen-Entwicklung) hält das Spiel für jeden
// Spieler des eigenen Kaders einen kleinen Messpunkt fest: Stärke, Form, Frische,
// Fitness, Moral (0–100, wie die Anzeige). Dazu der Kaderschnitt derselben Woche.
//   • Spieler: optionales `Player.history.weeks` (höchstens MAX_WEEKS Punkte),
//   • Kaderschnitt: optionales `game.profileWeeks.team` (ebenso begrenzt),
//   • Wer den Kader verlässt, verliert seinen Verlauf beim nächsten Messpunkt
//     (`ids` merkt sich, wer zuletzt gemessen wurde) – der Spielstand wächst nicht.
// Fehlende Felder (alte Spielstände) entstehen beim ersten Messpunkt; der Lauf ist
// idempotent: ein zweiter Aufruf am selben Tag schreibt nichts doppelt.
// =============================================================================
import type { Player, WeekPoint } from '../types';
import { fitness100, form100, freshness100, playerMorale100 } from '../components/status/statusScale';
import type { Game } from './state';

export const MAX_WEEKS = 52;

export interface ProfileWeeksState { v: 1; team: WeekPoint[]; ids: string[] }
type G = Game & { profileWeeks?: ProfileWeeksState };

export const profileWeeksOf = (g: Game | undefined): ProfileWeeksState | undefined => (g as G | undefined)?.profileWeeks;

function pointOf(p: Player, d: string): WeekPoint {
  return {
    d, ov: Math.round(p.overall), f: Math.round(form100(p)), fr: Math.round(freshness100(p)),
    fi: Math.round(fitness100(p)), m: Math.round(playerMorale100(p)),
  };
}

function push(list: WeekPoint[], pt: WeekPoint): void {
  if (list.length && list[list.length - 1].d === pt.d) list[list.length - 1] = pt;
  else list.push(pt);
  if (list.length > MAX_WEEKS) list.splice(0, list.length - MAX_WEEKS);
}

/** Sonntags aus processDay: Messpunkt für den eigenen Kader + Kaderschnitt. */
export function recordProfileWeek(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const squad = club.playerIds.map((id) => g.players[id]).filter((p): p is Player => !!p && !p.isYouth);
  if (!squad.length) return;
  const st = ((g as G).profileWeeks ??= { v: 1, team: [], ids: [] });
  const now = new Set(squad.map((p) => p.id));
  for (const id of st.ids) {
    if (now.has(id)) continue;
    const h = g.players[id]?.history;
    if (h?.weeks) delete h.weeks;
  }
  const sum = { ov: 0, f: 0, fr: 0, fi: 0, m: 0 };
  for (const p of squad) {
    const pt = pointOf(p, today);
    push(((p.history ??= {}).weeks ??= []), pt);
    sum.ov += pt.ov; sum.f += pt.f; sum.fr += pt.fr; sum.fi += pt.fi; sum.m += pt.m;
  }
  const n = squad.length;
  push(st.team, {
    d: today, ov: Math.round(sum.ov / n), f: Math.round(sum.f / n), fr: Math.round(sum.fr / n),
    fi: Math.round(sum.fi / n), m: Math.round(sum.m / n),
  });
  st.ids = [...now];
}
