// =============================================================================
// DIE BESTEN DER SAISON IM AUSLAND + Kandidaten für den Kristallstern
// -----------------------------------------------------------------------------
// Wunsch Pascal: auf Statistiken › Auszeichnungen jede Liga wählen können und
// beim Kristallstern echte Konkurrenz aus dem Ausland. Die 1. Ligen im Ausland
// spielen ohne Spielereignisse (game/worldLeagues.ts); Tore/Vorlagen/Zu-null je
// Spieler kommen aus game/worldScorers.ts `leanLines`, die Note schätzt
// game/leanGrades.ts nach dem Maßstab der voll simulierten Heimatliga. Wertung
// dieselbe wie zu Hause (engine/seasonAwards.ts `computeAwards`).
// Saisonende: `worldSeasonAwards` in startNextSeason nach `worldLiveResults`
// (alle Spieltage gespielt, Kader noch die der Saison) – Die Besten der Saison und
// Elf der Saison aus denselben Kandidaten. Archiv kompakt in `seasonAwards.wv`
// (Format game/worldAwardsStore.ts), nur die letzten WORLD_AWARD_SEASONS Saisons;
// Anzeige über `awardsBySeason`/`worldTeamsOf`, Umrechnung alter Stände
// `migrateWorldAwards` (game/worldAwardsMigration.ts).
// =============================================================================
import { leagueName } from '../data/leagueNames';
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { seasonStartYear } from '../data/timeline';
import { AWARD_CATS, type AwardCandidate, type AwardCat, computeAwards, reasonText } from '../engine/seasonAwards';
import { pickTeamOfSeason } from '../engine/teamOfSeason';
import type { LeanDiv } from '../engine/world';
import { POSITION_GROUPS, type PositionGroup } from '../types';
import { type GradeModel, type GradeSample, contribOf, estimateGrade, fitGrades } from './leanGrades';
import { type AwardEntry, type AwardSeason, awardCandidates, awardsState, ensureAwards } from './seasonAwardsGame';
import type { Game } from './state';
import type { TosRow, TosSeason } from './teamOfSeasonGame';
import {
  type WCat, type WLeague, type WRef, type WorldAwardsStore,
  clubIdx, clubOf, idOfRef, packWin, packXi, refOfId, trimWorldStore, unpackWin, unpackXi, winLen, worldStore,
} from './worldAwardsStore';
import { leanMatchdays, leanTable } from './worldLeagues';
import { type WP, WP_FIELD as W } from './worldPool';
import { leanLines, type LeanLine } from './worldScorers';

export const WORLD_AWARD_SEASONS = 5;

/** Notenmaßstab der Heimatliga: Koeffizienten + Stärkeschnitt `homeMean` + Tore je Mannschaft und Spiel `homeGpg`. */
export type HomeGradeModel = GradeModel & { homeMean?: number; homeGpg?: number };

/** Notenmaßstab aus der eigenen (voll simulierten) Liga der laufenden Saison (+ Stärkeschnitt `homeMean`). */
export function homeGradeModel(g: Game): HomeGradeModel {
  const { cands, matchdays, teams } = awardCandidates(g);
  const regular = cands.filter((c) => c.apps >= Math.max(3, matchdays * 0.3));
  const ovr = (c: AwardCandidate) => g.players[c.pid]?.overall ?? 60;
  const mean = regular.length ? regular.reduce((t, c) => t + ovr(c), 0) / regular.length : 65;
  const samples: GradeSample[] = regular.map((c) => ({
    group: c.cat as PositionGroup, avg: c.avg, ovrDev: ovr(c) - mean,
    rankShare: teams > 1 ? (c.rank - 1) / (teams - 1) : 0.5,
    contrib: contribOf(c.cat as PositionGroup, c.apps, c.goals, c.assists, c.clean),
  }));
  const gf = g.table.rows.reduce((t, r) => t + r.goalsFor, 0), pl = g.table.rows.reduce((t, r) => t + r.played, 0);
  return Object.assign(fitGrades(samples), { homeMean: mean, ...(pl ? { homeGpg: gf / pl } : {}) });
}

/** Kandidaten einer Auslandsliga (Saisonzeilen + geschätzte Note). */
export function leanCandidates(g: Game, key: string, d: LeanDiv, season: string, model: HomeGradeModel, lines?: LeanLine[], refMean?: number): AwardCandidate[] {
  const ls = lines ?? leanLines(g, d, season);
  const table = leanTable(d, key, season);
  const row = new Map(table.map((r) => [r.clubId, r]));
  const n = table.length;
  const regulars = ls.filter((l) => l.apps >= l.played * 0.5);
  const mean = regulars.length ? regulars.reduce((t, l) => t + l.w[W.ov], 0) / regulars.length : 65;
  const y = seasonStartYear(season) + 1;
  // Vergleich über Ligen hinweg (Kristallstern): schwächere Liga → Note und Torquote nach dem Maßstab
  // der Heimatliga abwerten (Tore gegen schwache Abwehrreihen zählen weniger). Die Stärke zählt dann
  // gegen den Schnitt der Heimatliga, nicht gegen die eigene Liga – sonst wirkt ein guter Spieler in
  // einer schwachen Liga wie ein Weltstar (Kalibrierung über die Epochen, tests/simAwards.ts).
  const gap = refMean != null ? Math.max(0, refMean - mean) : 0;
  const scale = Math.max(0.45, 1 - 0.035 * gap);
  const base = refMean ?? mean;
  // Torniveau: Die voll simulierte Heimatliga fällt torreicher aus als die Auslandsligen (1977 z. B.
  // 1,87 gegen 1,33–1,40 Tore je Mannschaft und Spiel). Für den Ligavergleich Tore und Vorlagen auf das
  // Torniveau der Heimatliga bringen – sonst gewinnen fast nur Spieler der Heimatliga.
  const tGf = table.reduce((t, r) => t + r.gf, 0), tP = table.reduce((t, r) => t + r.p, 0);
  const norm = refMean != null && model.homeGpg && tGf > 0 ? Math.max(0.8, Math.min(1.6, model.homeGpg / (tGf / tP))) : 1;
  return ls.map((l) => {
    const pos = l.w[W.pos];
    const cat = (POSITION_GROUPS[pos] ?? 'MID') as AwardCat;
    const r = row.get(l.clubId);
    const rankShare = r && n > 1 ? (r.pos - 1) / (n - 1) : 0.5;
    const contrib = contribOf(cat as PositionGroup, l.apps, l.goals * norm, l.assists * norm, l.clean);
    return {
      pid: l.w[W.id], name: `${l.w[W.first]} ${l.w[W.last]}`.trim(), clubId: l.clubId, clubName: g.euroClubs?.[l.clubId]?.name ?? l.clubId,
      pos, cat, age: y - l.w[W.born], apps: l.apps,
      avg: Math.min(5.5, estimateGrade(model, { group: cat as PositionGroup, ovrDev: l.w[W.ov] - base, rankShare, contrib }, `${season}|${l.w[W.id]}`) + 0.03 * gap),
      goals: Math.round(l.goals * scale * norm), assists: Math.round(l.assists * scale * norm), clean: Math.round(l.clean * scale),
      gaPerGame: r && r.p ? r.ga / r.p : 1.4, rank: r?.pos ?? n,
    };
  });
}

/** Stärkeschnitt der Stammspieler einer Auslandsliga (Maßstab für den Ligavergleich). */
export function leanLeagueMean(lines: LeanLine[]): number {
  const regulars = lines.filter((l) => l.apps >= l.played * 0.5);
  return regulars.length ? regulars.reduce((t, l) => t + l.w[W.ov], 0) / regulars.length : 65;
}

const h100 = (v: number) => Math.round(v * 100);

/** Archiv anlegen (Auslandsligen). */
export function ensureWorldStore(g: Game): WorldAwardsStore {
  return (ensureAwards(g).wv ??= { v: 1, cl: {}, gone: {}, s: {} });
}

/** Anzeigename einer Auslandsliga. */
export const worldDivName = (key: string) => `${COUNTRY_BY_KEY[key]?.name ?? key} · ${leagueName(COUNTRY_BY_KEY[key]?.cc, 1)}`;

/** Saisonende: Die Besten der Saison + Elf der Saison der 1. Ligen im Ausland (einmal je Saison). */
export function worldSeasonAwards(g: Game, season: string, divs: Record<string, (LeanDiv | null)[]>): number {
  const st = ensureWorldStore(g);
  if (st.s[season]) return 0;
  const model = homeGradeModel(g);
  const endYear = seasonStartYear(season) + 1;
  const cache = new Map<string, number>();
  const out: Record<string, WLeague> = {};
  let n = 0;
  for (const [key, tiers] of Object.entries(divs)) {
    const d = tiers[0];
    if (!d?.r || d.ids.length < 4) continue;
    const ctx = { matchdays: leanMatchdays(d.ids.length), teams: d.ids.length };
    const cands = leanCandidates(g, key, d, season, model);
    const res = computeAwards(cands, ctx);
    const tos = pickTeamOfSeason(cands, ctx, endYear);
    if (!AWARD_CATS.some((c) => res.cats[c].length) && tos.xi.length < 11) continue;
    const ci = (id: string) => clubIdx(st, key, id, cache);
    const win = (c: AwardCandidate, k: number): WRef[] => packWin(k, {
      r: refOfId(c.pid), c: ci(c.clubId), ap: c.apps, g: h100(c.avg), gl: c.goals, as: c.assists, cs: c.clean, f: res.flags[c.pid] ?? 0, ga: h100(c.gaPerGame),
    });
    const cats = AWARD_CATS.map((cat, k): WCat => res.cats[cat].flatMap((c, i) => (i === 0 ? win(c, k) : [refOfId(c.pid), ci(c.clubId), h100(c.avg)])));
    const rk = res.rookie ? AWARD_CATS.indexOf(res.rookie.cat) : -1;
    const rookie = res.rookie ? [rk, ...win(res.rookie, rk)] : 0;
    const l: WLeague = [res.best ? AWARD_CATS.indexOf(res.best) : -1, cats, rookie, 0];
    if (tos.xi.length >= 11) l[3] = packXi(l, tos.xi.map((t) => [refOfId(t.c.pid), ci(t.c.clubId), h100(t.c.avg)]));
    out[key] = l;
    n++;
  }
  if (n) st.s[season] = out;
  trimWorldStore(st, WORLD_AWARD_SEASONS);
  return n;
}

// -----------------------------------------------------------------------------
// Anzeige: Tupel → AwardSeason / TosSeason (Name, Alter, Position aus dem Weltpool)
// -----------------------------------------------------------------------------
const poolCache = new WeakMap<WP[], { n: number; map: Map<string, WP> }>();
function poolMap(g: Game): Map<string, WP> {
  const p = g.worldPool?.p ?? [];
  const c = poolCache.get(p);
  if (c && c.n === p.length) return c.map;
  const map = new Map(p.map((w) => [w[W.id], w]));
  poolCache.set(p, { n: p.length, map });
  return map;
}

interface Who { id: string; n: string; born: number; pos: string }
function whoOf(g: Game, st: WorldAwardsStore, r: WRef, pool: Map<string, WP>): Who {
  const id = idOfRef(r);
  if (!id) return { id: '', n: String(r), born: 0, pos: 'ZM' };
  const gone = st.gone[r as number];
  if (gone) return { id, n: gone[0], born: gone[1], pos: gone[2] };
  const w = pool.get(id);
  if (w) return { id, n: `${w[W.first]} ${w[W.last]}`.trim(), born: w[W.born], pos: w[W.pos] };
  const p = g.players[id];
  return { id, n: p?.fullName ?? '?', born: p ? Number(p.dateOfBirth?.slice(0, 4)) || 0 : 0, pos: p?.naturalPosition ?? 'ZM' };
}

const clubNameOf = (g: Game, id: string) => g.euroClubs?.[id]?.name ?? g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? id;

/** Eine Liga des Archivs als AwardSeason (wie die eigene Liga). */
export function decodeWorldLeague(g: Game, st: WorldAwardsStore, season: string, key: string, l: WLeague): AwardSeason {
  const pool = poolMap(g);
  const y = seasonStartYear(season) + 1;
  const entry = (a: WRef[], i: number, cat: AwardCat, full: boolean): AwardEntry => {
    const w = full ? unpackWin(AWARD_CATS.indexOf(cat), a, i) : undefined;
    const who = whoOf(g, st, a[i], pool);
    const c = clubOf(st, key, Number(a[i + 1]));
    const e: AwardEntry = {
      p: who.id, n: who.n, c, cn: c ? clubNameOf(g, c) : '', pos: who.pos, a: who.born ? y - who.born : 0,
      ap: w?.ap ?? 0, g: (w ? w.g : Number(a[i + 2])) / 100, gl: w?.gl ?? 0, as: w?.as ?? 0, cs: w?.cs ?? 0,
      ga: (w?.ga ?? 0) / 100, rk: 0, pts: 0,
    };
    if (w) e.why = reasonText({ cat, clean: e.cs, avg: e.g, goals: e.gl, assists: e.as, apps: e.ap }, w.f);
    return e;
  };
  const cats = {} as Record<AwardCat, AwardEntry[]>;
  AWARD_CATS.forEach((cat, k) => {
    const a = l[1][k] ?? [];
    const list: AwardEntry[] = [];
    if (a.length) {
      list.push(entry(a, 0, cat, true));
      for (let i = winLen(k); i < a.length; i += 3) list.push(entry(a, i, cat, false));
    }
    cats[cat] = list;
  });
  const out: AwardSeason = { season, div: key, divName: worldDivName(key), tier: 1, cats };
  if (l[0] >= 0) out.best = AWARD_CATS[l[0]];
  if (l[2]) {
    const cat = AWARD_CATS[Number(l[2][0])] ?? 'MID';
    out.rookie = { ...entry(l[2], 1, cat, true), cat };
  }
  return out;
}

/** Auszeichnungen aller Ligen einer Saison: eigene Liga zuerst, dann das Ausland nach Name. */
export function awardsBySeason(g: Game, season: string): AwardSeason[] {
  const st = awardsState(g);
  const own = st?.seasons.filter((s) => s.season === season) ?? [];
  const ws = worldStore(g);
  const world = Object.entries(ws?.s[season] ?? {}).filter(([, l]) => l[1].some((c) => c.length))
    .map(([key, l]) => decodeWorldLeague(g, ws!, season, key, l))
    .sort((a, b) => a.divName.localeCompare(b.divName, 'de'));
  return [...own, ...world];
}

/** Elf der Saison der Auslandsligen einer Saison (ohne `dn`/`f`, Reihenfolge wie gespeichert). */
export function worldTeamsOf(g: Game, season: string): TosSeason[] {
  const ws = worldStore(g);
  if (!ws?.s[season]) return [];
  const pool = poolMap(g);
  const out: TosSeason[] = [];
  for (const [key, l] of Object.entries(ws.s[season])) {
    if (!l[3]) continue;
    const c: string[] = [];
    const x: TosRow[] = [];
    const ids: (string | undefined)[] = [];
    for (const [r, club, grade] of unpackXi(l)) {
      const id = clubOf(ws, key, club);
      let k = c.indexOf(id);
      if (k < 0) k = c.push(id) - 1;
      const who = whoOf(g, ws, r, pool);
      x.push([who.n, grade, k]);
      ids.push(who.id || undefined);
    }
    out.push({ s: season, d: key, c, x, ids });
  }
  return out;
}
