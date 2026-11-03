// =============================================================================
// DIE BESTEN DER SAISON — Spielablauf und Archiv
// -----------------------------------------------------------------------------
// Am Tag nach dem letzten Ligaspieltag (`awardsDaily` in game/day.ts, Rückfall in
// startNextSeason für ältere Spielstände) werden in der Liga mit vollen Kadern
// (Liga des eigenen Vereins – nur dort gibt es Einzelstatistik) je Mannschaftsteil
// die drei Besten gekürt (Wertung engine/seasonAwards.ts). Ergebnis:
//   • Archiv im optionalen Feld `game.seasonAwards` (kompakt, höchstens MAX Saisons),
//   • `pending` öffnet das Popup (views/statistiken/awards/AwardsModal.tsx),
//   • Nachricht der Sportredaktion, kleiner Moral-Sprung für geehrte eigene Spieler.
// =============================================================================
import { compStatsOf } from '../engine/compStats';
import { makeMessage, pushMessage } from '../engine/messages';
import { AWARD_CATS, AWARD_CAT_LABEL, type AwardCandidate, type AwardCat, type ScoredCandidate, computeAwards } from '../engine/seasonAwards';
import { POSITION_GROUPS } from '../types';
import { moraleJolt } from './moraleJolt';
import type { Game } from './state';

/** Ein geehrter Spieler (kompakt, überdauert Wechsel und Karriereende). */
export interface AwardEntry {
  /** Spieler-ID, Name, Verein (ID + Name zur Saison), Position, Alter */
  p: string; n: string; c: string; cn: string; pos: string; a: number;
  /** Einsätze, Notenschnitt (2 Stellen), Tore, Vorlagen, Zu-null-Spiele */
  ap: number; g: number; gl: number; as: number; cs: number;
  /** Gegentore je Spiel der Mannschaft, Tabellenplatz, Wertungspunkte */
  ga: number; rk: number; pts: number;
  /** Begründung (ein Satz; nur Platz 1 und Newcomer, spart Platz im Spielstand). */
  why?: string;
}

export interface AwardSeason {
  season: string;
  /** Liga (ID, Name, Ebene) */
  div: string; divName: string; tier: number;
  cats: Record<AwardCat, AwardEntry[]>;
  /** Spieler der Saison = Platz 1 dieser Kategorie. */
  best?: AwardCat;
  /** Newcomer der Saison (≤ 21 Jahre) mit seiner Kategorie. */
  rookie?: AwardEntry & { cat: AwardCat };
  /** Eigener Verein zur Saison (Hervorhebung im Archiv). */
  mine?: string;
}

export interface SeasonAwardsState { v: 1; seasons: AwardSeason[]; pending?: string }

export const MAX_AWARD_SEASONS = 80;

type GameWithAwards = Game & { seasonAwards?: SeasonAwardsState };

export function awardsState(g: Game): SeasonAwardsState | undefined {
  return (g as GameWithAwards).seasonAwards;
}
function ensureAwards(g: Game): SeasonAwardsState {
  return ((g as GameWithAwards).seasonAwards ??= { v: 1, seasons: [] });
}
export function awardsOf(g: Game, season: string): AwardSeason | undefined {
  return awardsState(g)?.seasons.find((s) => s.season === season);
}
export function pendingAwards(g: Game): AwardSeason | undefined {
  const st = awardsState(g);
  return st?.pending ? awardsOf(g, st.pending) : undefined;
}
export function clearPendingAwards(g: Game): void {
  const st = awardsState(g);
  if (st) delete st.pending;
}

/** Eingaben der Wertung aus der laufenden Saison (Ligastatistik je Spieler). */
export function awardCandidates(g: Game): { cands: AwardCandidate[]; matchdays: number; teams: number } {
  const rows = g.table.rows;
  const teams = rows.length;
  const rowOf = new Map(rows.map((r, i) => [r.clubId, { rank: i + 1, ga: r.played ? r.goalsAgainst / r.played : 1.5 }]));
  const matchdays = Math.max(0, ...g.fixtures.map((m) => m.matchday ?? 0)) || Math.max(1, (teams - 1) * 2);
  const cands: AwardCandidate[] = [];
  for (const p of Object.values(g.players)) {
    if (p.isYouth) continue;
    const row = rowOf.get(p.clubId);
    const t = compStatsOf(p)?.L;
    if (!row || !t || !t[0]) continue;
    const cat = POSITION_GROUPS[p.naturalPosition] ?? 'MID';
    const avg = t[7] != null && t[8] ? t[7] / t[8] : p.seasonStats?.averageRating ?? 0;
    cands.push({
      pid: p.id, name: p.fullName, clubId: p.clubId, clubName: g.clubs[p.clubId]?.name ?? p.clubId,
      pos: p.naturalPosition, cat, age: p.age, apps: t[0], avg,
      goals: t[1], assists: t[2], clean: t[9] ?? (cat === 'GK' ? t[6] : 0),
      gaPerGame: row.ga, rank: row.rank,
    });
  }
  return { cands, matchdays, teams };
}

const pack = (c: ScoredCandidate, why?: string): AwardEntry => {
  const e: AwardEntry = {
    p: c.pid, n: c.name, c: c.clubId, cn: c.clubName, pos: c.pos, a: c.age,
    ap: c.apps, g: Math.round(c.avg * 100) / 100, gl: c.goals, as: c.assists, cs: c.clean,
    ga: Math.round(c.gaPerGame * 100) / 100, rk: c.rank, pts: Math.round(c.score * 10) / 10,
  };
  if (why) e.why = why;
  return e;
};

/** Wertung der laufenden Saison (ohne zu speichern). */
export function evaluateSeasonAwards(g: Game): AwardSeason | null {
  const { cands, matchdays, teams } = awardCandidates(g);
  if (!cands.length || teams < 2) return null;
  const res = computeAwards(cands, { matchdays, teams });
  if (!AWARD_CATS.some((c) => res.cats[c].length)) return null;
  const pd = g.leagues.playerDivision;
  const cats = {} as Record<AwardCat, AwardEntry[]>;
  for (const cat of AWARD_CATS) cats[cat] = res.cats[cat].map((c, i) => pack(c, i === 0 ? res.why[c.pid] : undefined));
  const out: AwardSeason = { season: g.season, div: pd.id, divName: pd.name, tier: pd.tier, cats, mine: g.managedClubId };
  if (res.best) out.best = res.best;
  if (res.rookie) out.rookie = { ...pack(res.rookie, res.why[res.rookie.pid]), cat: res.rookie.cat };
  return out;
}

/**
 * Saisonende: Auszeichnungen vergeben (einmal je Saison), Nachricht + Moral.
 * `popup` = Fenster zum Anzeigen vormerken. Rückgabe: die vergebene Saison oder null.
 */
export function awardSeasonEnd(g: Game, date: string, popup = true): AwardSeason | null {
  if (awardsOf(g, g.season)) return null;
  const res = evaluateSeasonAwards(g);
  if (!res) return null;
  const st = ensureAwards(g);
  st.seasons.push(res);
  if (st.seasons.length > MAX_AWARD_SEASONS) st.seasons.splice(0, st.seasons.length - MAX_AWARD_SEASONS);
  if (popup) st.pending = res.season;
  honourOwnPlayers(g, res, date);
  pushMessage(g.messages, makeMessage({
    date, category: 'media', from: 'Sportredaktion',
    subject: `Die Besten der Saison ${res.season}`,
    shortText: `Ehrungen der ${res.divName}: ${AWARD_CATS.map((c) => res.cats[c][0]?.n).filter(Boolean).join(', ')}.`,
    bodyText: awardsText(g, res),
  }));
  return res;
}

function awardsText(g: Game, s: AwardSeason): string {
  const lines = [`Die Sportredaktion ehrt die besten Spieler der ${s.divName} ${s.season} auf ihren Positionen:`, ''];
  for (const cat of AWARD_CATS) {
    const [w, ...rest] = s.cats[cat];
    if (!w) continue;
    lines.push(`${AWARD_CAT_LABEL[cat]}: ${w.n} (${w.cn}) – ${w.why}`);
    if (rest.length) lines.push(`   dahinter: ${rest.map((e) => `${e.n} (${e.cn})`).join(', ')}`);
  }
  const best = s.best ? s.cats[s.best][0] : undefined;
  if (best) lines.push('', `Spieler der Saison: ${best.n} (${best.cn}).`);
  if (s.rookie) lines.push(`Newcomer der Saison: ${s.rookie.n} (${s.rookie.cn}, ${s.rookie.a} Jahre).`);
  const mine = ownHonours(g, s);
  if (mine.length) lines.push('', `Aus deinem Kader geehrt: ${mine.map((m) => `${m.e.n} (${m.label})`).join(', ')}.`);
  lines.push('', 'Alle Jahrgänge findest du unter Statistiken › Auszeichnungen.');
  return lines.join('\n');
}

const BEST_LABEL: Record<AwardCat, string> = { GK: 'bester Torwart', DEF: 'bester Abwehrspieler', MID: 'bester Mittelfeldspieler', ATT: 'bester Stürmer' };

/** Ehrungen eigener Spieler (für Nachricht, Moral und Hervorhebung). */
export function ownHonours(g: Game, s: AwardSeason): { e: AwardEntry; label: string; place: number }[] {
  const mine = s.mine ?? g.managedClubId;
  const out: { e: AwardEntry; label: string; place: number }[] = [];
  for (const cat of AWARD_CATS) s.cats[cat].forEach((e, i) => {
    if (e.c === mine) out.push({ e, label: i === 0 ? BEST_LABEL[cat] : `Platz ${i + 1} ${AWARD_CAT_LABEL[cat]}`, place: i + 1 });
  });
  if (s.rookie && s.rookie.c === mine) out.push({ e: s.rookie, label: 'Newcomer der Saison', place: 1 });
  return out;
}

function honourOwnPlayers(g: Game, s: AwardSeason, date: string): void {
  const best = s.best ? s.cats[s.best][0]?.p : undefined;
  for (const h of ownHonours(g, s)) {
    const v = h.place === 1 ? 5 : 2;
    moraleJolt(g, g.players[h.e.p], v + (h.e.p === best ? 3 : 0), `Ehrung: ${h.e.p === best ? 'Spieler der Saison' : h.label}`, date);
  }
}

/** Anzahl der Siege je Spieler über alle Saisons (Kategorie-Platz 1, Spieler der Saison, Newcomer). */
export function awardTallies(g: Game): { p: string; n: string; wins: number; best: number; last: string; cn: string }[] {
  const map = new Map<string, { p: string; n: string; wins: number; best: number; last: string; cn: string }>();
  for (const s of awardsState(g)?.seasons ?? []) {
    for (const cat of AWARD_CATS) {
      const w = s.cats[cat][0];
      if (!w) continue;
      const t = map.get(w.p) ?? { p: w.p, n: w.n, wins: 0, best: 0, last: s.season, cn: w.cn };
      t.wins++; t.last = s.season; t.cn = w.cn;
      if (s.best === cat) t.best++;
      map.set(w.p, t);
    }
  }
  return [...map.values()].sort((a, b) => b.wins - a.wins || b.best - a.best || b.last.localeCompare(a.last));
}

/**
 * Täglich aus processDay: am ersten Tag nach dem letzten Ligaspieltag der eigenen Liga
 * vergeben. Rückgabe true = vergeben (der Vorlauf hält für das Popup an).
 */
export function awardsDaily(g: Game, today: string): boolean {
  if (awardsOf(g, g.season) || !g.fixtures.length) return false;
  let last = '';
  for (const m of g.fixtures) {
    if (m.status !== 'finished') return false;
    if (m.date > last) last = m.date;
  }
  if (today <= last) return false;
  return !!awardSeasonEnd(g, today);
}

/** Alte Spielstände: Feld fehlt → nichts tun; vorhandenes Archiv säubern und begrenzen (idempotent). */
export function migrateSeasonAwards(g: Game): void {
  const st = awardsState(g);
  if (!st) return;
  if (!Array.isArray(st.seasons)) st.seasons = [];
  st.seasons = st.seasons.filter((s) => s && typeof s.season === 'string' && s.cats);
  for (const s of st.seasons) for (const cat of AWARD_CATS) if (!Array.isArray(s.cats[cat])) s.cats[cat] = [];
  if (st.seasons.length > MAX_AWARD_SEASONS) st.seasons.splice(0, st.seasons.length - MAX_AWARD_SEASONS);
  if (st.pending && !st.seasons.some((s) => s.season === st.pending)) delete st.pending;
  st.v = 1;
}
