// =============================================================================
// DIE BESTEN DER SAISON IM AUSLAND + Kandidaten für den Goldenen Ball
// -----------------------------------------------------------------------------
// Wunsch Pascal: auf Statistiken › Auszeichnungen jede Liga wählen können und
// beim Goldenen Ball echte Konkurrenz aus dem Ausland. Die 1. Ligen im Ausland
// spielen ohne Spielereignisse (game/worldLeagues.ts); Tore/Vorlagen/Zu-null je
// Spieler kommen aus game/worldScorers.ts `leanLines`, die Note schätzt
// game/leanGrades.ts nach dem Maßstab der voll simulierten Heimatliga. Wertung
// dieselbe wie zu Hause (engine/seasonAwards.ts `computeAwards`).
// Saisonende: `worldSeasonAwards` in startNextSeason nach `worldLiveResults`
// (alle Spieltage gespielt, Kader noch die der Saison). Archiv `seasonAwards.world`,
// nur die letzten WORLD_AWARD_SEASONS Saisons (Speicherplatz).
// =============================================================================
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { seasonStartYear } from '../data/timeline';
import { AWARD_CATS, type AwardCandidate, type AwardCat, computeAwards } from '../engine/seasonAwards';
import type { LeanDiv } from '../engine/world';
import { POSITION_GROUPS, type PositionGroup } from '../types';
import { type GradeModel, type GradeSample, contribOf, estimateGrade, fitGrades } from './leanGrades';
import { type AwardEntry, type AwardSeason, awardCandidates, awardsState, ensureAwards } from './seasonAwardsGame';
import type { Game } from './state';
import { leanMatchdays, leanTable } from './worldLeagues';
import { WP_FIELD as W } from './worldPool';
import { leanLines, type LeanLine } from './worldScorers';

export const WORLD_AWARD_SEASONS = 5;

/** Notenmaßstab aus der eigenen (voll simulierten) Liga der laufenden Saison (+ Stärkeschnitt `homeMean`). */
export function homeGradeModel(g: Game): GradeModel & { homeMean?: number } {
  const { cands, matchdays, teams } = awardCandidates(g);
  const regular = cands.filter((c) => c.apps >= Math.max(3, matchdays * 0.3));
  const ovr = (c: AwardCandidate) => g.players[c.pid]?.overall ?? 60;
  const mean = regular.length ? regular.reduce((t, c) => t + ovr(c), 0) / regular.length : 65;
  const samples: GradeSample[] = regular.map((c) => ({
    group: c.cat as PositionGroup, avg: c.avg, ovrDev: ovr(c) - mean,
    rankShare: teams > 1 ? (c.rank - 1) / (teams - 1) : 0.5,
    contrib: contribOf(c.cat as PositionGroup, c.apps, c.goals, c.assists, c.clean),
  }));
  return Object.assign(fitGrades(samples), { homeMean: mean });
}

/** Kandidaten einer Auslandsliga (Saisonzeilen + geschätzte Note). */
export function leanCandidates(g: Game, key: string, d: LeanDiv, season: string, model: GradeModel, lines?: LeanLine[], refMean?: number): AwardCandidate[] {
  const ls = lines ?? leanLines(g, d, season);
  const table = leanTable(d, key, season);
  const row = new Map(table.map((r) => [r.clubId, r]));
  const n = table.length;
  const regulars = ls.filter((l) => l.apps >= l.played * 0.5);
  const mean = regulars.length ? regulars.reduce((t, l) => t + l.w[W.ov], 0) / regulars.length : 65;
  const y = seasonStartYear(season) + 1;
  // Vergleich über Ligen hinweg (Goldener Ball): schwächere Liga → Note und Torquote nach dem Maßstab
  // der Heimatliga abwerten (Tore gegen schwache Abwehrreihen zählen weniger).
  const gap = refMean != null ? Math.max(0, refMean - mean) : 0;
  const scale = Math.max(0.45, 1 - 0.035 * gap);
  return ls.map((l) => {
    const pos = l.w[W.pos];
    const cat = (POSITION_GROUPS[pos] ?? 'MID') as AwardCat;
    const r = row.get(l.clubId);
    const rankShare = r && n > 1 ? (r.pos - 1) / (n - 1) : 0.5;
    const contrib = contribOf(cat as PositionGroup, l.apps, l.goals, l.assists, l.clean);
    return {
      pid: l.w[W.id], name: `${l.w[W.first]} ${l.w[W.last]}`.trim(), clubId: l.clubId, clubName: g.euroClubs?.[l.clubId]?.name ?? l.clubId,
      pos, cat, age: y - l.w[W.born], apps: l.apps,
      avg: Math.min(5.5, estimateGrade(model, { group: cat as PositionGroup, ovrDev: l.w[W.ov] - mean, rankShare, contrib }, `${season}|${l.w[W.id]}`) + 0.045 * gap),
      goals: Math.round(l.goals * scale), assists: Math.round(l.assists * scale), clean: Math.round(l.clean * scale),
      gaPerGame: r && r.p ? r.ga / r.p : 1.4, rank: r?.pos ?? n,
    };
  });
}

const pack = (c: AwardCandidate & { score: number }, why?: string): AwardEntry => {
  const e: AwardEntry = {
    p: c.pid, n: c.name, c: c.clubId, cn: c.clubName, pos: c.pos, a: c.age,
    ap: c.apps, g: c.avg, gl: c.goals, as: c.assists, cs: c.clean,
    ga: Math.round(c.gaPerGame * 100) / 100, rk: c.rank, pts: Math.round(c.score * 10) / 10,
  };
  if (why) e.why = why;
  return e;
};

/** Anzeigename einer Auslandsliga. */
export const worldDivName = (key: string) => `${COUNTRY_BY_KEY[key]?.name ?? key} · 1. Liga`;

/** Saisonende: Die Besten der 1. Ligen im Ausland (einmal je Saison). */
export function worldSeasonAwards(g: Game, season: string, divs: Record<string, (LeanDiv | null)[]>): number {
  const st = ensureAwards(g);
  const list = (st.world ??= []);
  if (list.some((s) => s.season === season)) return 0;
  const model = homeGradeModel(g);
  let n = 0;
  for (const [key, tiers] of Object.entries(divs)) {
    const d = tiers[0];
    if (!d?.r || d.ids.length < 4) continue;
    const cands = leanCandidates(g, key, d, season, model);
    const res = computeAwards(cands, { matchdays: leanMatchdays(d.ids.length), teams: d.ids.length });
    if (!AWARD_CATS.some((c) => res.cats[c].length)) continue;
    const cats = {} as Record<AwardCat, AwardEntry[]>;
    for (const cat of AWARD_CATS) cats[cat] = res.cats[cat].map((c, i) => pack(c, i === 0 ? res.why[c.pid] : undefined));
    const out: AwardSeason = { season, div: key, divName: worldDivName(key), tier: 1, cats };
    if (res.best) out.best = res.best;
    if (res.rookie) out.rookie = { ...pack(res.rookie, res.why[res.rookie.pid]), cat: res.rookie.cat };
    list.push(out);
    n++;
  }
  const keep = [...new Set(list.map((s) => s.season))].sort().slice(-WORLD_AWARD_SEASONS);
  st.world = list.filter((s) => keep.includes(s.season));
  return n;
}

/** Auszeichnungen aller Ligen einer Saison: eigene Liga zuerst, dann das Ausland nach Name. */
export function awardsBySeason(g: Game, season: string): AwardSeason[] {
  const st = awardsState(g);
  const own = st?.seasons.filter((s) => s.season === season) ?? [];
  const world = (st?.world ?? []).filter((s) => s.season === season).sort((a, b) => a.divName.localeCompare(b.divName, 'de'));
  return [...own, ...world];
}
