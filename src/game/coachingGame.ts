// =============================================================================
// TRAINERTEAM ↔ ENTWICKLUNG IM SPIELABLAUF (Rechnung: engine/coaching.ts)
// -----------------------------------------------------------------------------
// `bindCoaching` hinterlegt für jeden Verein der Spielerliga das Niveau seines
// Trainerteams bei der Entwicklungs-Engine (engine/development.ts
// `setClubCoaching`) – täglich, beim Laden und vor jeder Bewertungsrunde:
//   • eigener Verein: aus deinen Angestellten (`ownCoaching`), mit Abzügen für
//     fehlende Besetzung;
//   • KI-Vereine: Ansehen des Cheftrainers (game/coachCarousel.ts) als Stärke,
//     dazu Co- und Torwarttrainer vom Arbeitsmarkt (game/staffWorld.ts).
// `coachingOutlook` sagt für die Oberfläche, wen das eigene Trainerteam bremst
// und wer besonders profitiert – gerechnet mit der Potenzial-Schätzung, die du
// auch sonst siehst (Sterne), nie mit dem verdeckten Wert.
// =============================================================================
import { Club, Player, starsToPotential } from '../types';
import { isLeagueClub } from '../engine/clubEconomy';
import { aiCoachLevel, coachingTeam, coachPotCut, CoachingTeam, levelNeeded, memberLevel, teachFactor } from '../engine/coaching';
import { ClubCoaching, setClubCoaching } from '../engine/development';
import { yearOf } from '../engine/economy';
import { scoutRange } from '../engine/scouting';
import { coachRepLevel } from '../engine/staffGen';
import { roleFit, staffLevelExact } from '../engine/staffSkills';
import type { StaffMember } from '../engine/staffPeople';
import { ensureStaff } from './staffGame';
import { clubStaffTarget } from './staffWorld';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isSim = (g: Game) => !!(g as Game & { simAutoManage?: boolean }).simAutoManage;

/** Trainerteam des eigenen Vereins (Niveau, Besetzung, Trainingsqualität). */
export function ownCoaching(g: Game): CoachingTeam {
  const club = g.clubs[g.managedClubId];
  return coachingTeam(ensureStaff(g), club?.playerIds.length ?? 24, yearOf(g.calendar.currentDate), club?.reputation ?? 60);
}

/** Niveau eines KI-Vereins aus Cheftrainer und Trainerteam vom Arbeitsmarkt. */
function aiCoaching(c: Club, mine: StaffMember[] | undefined, year: number): ClubCoaching {
  // Cheftrainer: Ansehen als Stärke – war er schon Person auf dem Arbeitsmarkt (früherer Co-Trainer, dein Ex-Trainer), zählen seine Fähigkeiten.
  const sm = c.coach?.sm;
  const head = sm?.skills ? clamp(staffLevelExact(roleFit(sm.skills, 'cheftrainer', 8)), 40, 97) : coachRepLevel(c.coach?.reputation ?? (c.reputation ?? 60) - 2);
  const co = mine?.find((m) => m.roleId === 'cotrainer');
  const tw = mine?.find((m) => m.roleId === 'torwarttrainer');
  const r = aiCoachLevel(head, co ? memberLevel(co, year) : staffLevelExact(clubStaffTarget(c)), tw ? memberLevel(tw, year) : null, year);
  return { level: r.level, gk: r.gk };
}

/** Niveau der Trainerteams aller Liga-Vereine bei der Entwicklungs-Engine hinterlegen. */
export function bindCoaching(g: Game): Map<string, ClubCoaching> {
  const year = yearOf(g.calendar.currentDate);
  const byClub = new Map<string, StaffMember[]>();
  for (const m of g.staffWorld?.people ?? []) {
    if (!m.clubId) continue;
    const l = byClub.get(m.clubId);
    if (l) l.push(m); else byClub.set(m.clubId, [m]);
  }
  const map = new Map<string, ClubCoaching>();
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c)) continue;
    if (c.id === g.managedClubId && !isSim(g)) {
      const t = ownCoaching(g);
      map.set(c.id, { level: t.level, gk: t.gkLevel, old: t.veteranBrake });
    } else map.set(c.id, aiCoaching(c, byClub.get(c.id), year));
  }
  setClubCoaching(map);
  return map;
}

/** Niveau des Trainerteams eines beliebigen Liga-Vereins (für Anzeigen, z. B. Vergleich mit der Liga). */
export function clubCoachLevel(g: Game, clubId: string): number | null {
  return bindCoaching(g).get(clubId)?.level ?? null;
}

export interface OutlookRow { p: Player; /** geschätztes Potenzial (Mitte der Sterne-Spanne). */ pot: number; /** Punkte, die liegen bleiben. */ cut: number; /** Niveau, das er bräuchte. */ need: number; teach: number }
export interface CoachingOutlook {
  team: CoachingTeam;
  /** Spieler, deren Potenzial das Trainerteam nicht ausschöpft (größter Verlust zuerst). */
  limited: OutlookRow[];
  /** Spieler, die besonders viel lernen (Trainerteam klar über ihrem Niveau). */
  learners: OutlookRow[];
  /** Spieler, denen das Trainerteam kaum noch etwas beibringt. */
  stalled: OutlookRow[];
  /** Rang des Niveaus in der Liga (1 = bestes) und Zahl der Vereine. */
  rank: number;
  of: number;
}

/** Wen bremst das Trainerteam, wer profitiert? Mit der sichtbaren Potenzial-Schätzung gerechnet. */
export function coachingOutlook(g: Game): CoachingOutlook {
  const team = ownCoaching(g);
  const club = g.clubs[g.managedClubId];
  const rows: OutlookRow[] = [];
  for (const id of club?.playerIds ?? []) {
    const p = g.players[id];
    if (!p || p.isYouth) continue;
    const [lo, hi] = scoutRange(p);
    const pot = Math.max(p.overall, starsToPotential((lo + hi) / 2));
    const lvl = p.naturalPosition === 'TW' ? team.gkLevel : team.level;
    rows.push({ p, pot, cut: p.age <= 27 ? Math.min(coachPotCut(pot, lvl), Math.max(0, pot - p.overall)) : 0, need: levelNeeded(pot), teach: teachFactor(lvl, p.overall) });
  }
  const levels = [...bindCoaching(g).entries()];
  const mineLvl = team.level;
  return {
    team,
    limited: rows.filter((r) => r.cut >= 1).sort((a, b) => b.cut - a.cut),
    learners: rows.filter((r) => r.teach >= 1.08 && r.p.age <= 27).sort((a, b) => b.teach - a.teach),
    stalled: rows.filter((r) => r.teach <= 0.95 && r.p.age <= 28).sort((a, b) => a.teach - b.teach),
    rank: 1 + levels.filter(([id, c]) => id !== g.managedClubId && c.level > mineLvl).length,
    of: levels.length,
  };
}
