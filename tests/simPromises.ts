// =============================================================================
// Sim-Bericht Versprechen zum ersten Training (PROMISES=aware|plain in tests/sim.ts).
// Ein „vernünftiger“ Manager: Aufstellung per Co-Trainer („beste Elf“, autoFillLineup)
// vor jedem Tag, Versprechen passend zum Saisonziel (Saisonziel + Stimmung + Disziplin +
// zwei wechselnde Team-Versprechen). `aware` = der Co-Trainer beachtet die Versprechen
// (`promiseLineupPrefs`), bei Disziplin wird weniger hart gespielt; `plain` = wie früher.
// Zusätzlich wird jedes verfügbare Versprechen „im Schatten“ geprüft (ohne Folgen), um die
// Haltequote auch ohne Abgabe zu sehen.
// =============================================================================
import type { Game } from '../src/game/state';
import { SP_DEF, SP_LIMITS, type SeasonPromiseId } from '../src/engine/seasonPromises';
import {
  giveSeasonPromises, pendingSeasonPromises, promiseLineupPrefs, promiseOptions, promiseStatus, spRecord,
  type SeasonPromiseRecord,
} from '../src/game/seasonPromisesGame';
import { autoFillLineup } from '../src/engine/lineupAI';
import { eraRules } from '../src/engine/match/era';
import { ownFixtures } from '../src/game/trainingWeek';
import { roomOf } from '../src/game/dressingRoomGame';
import { trustOf } from '../src/game/promises';

export type PromMode = 'aware' | 'plain';
export const promModeFromEnv = (v?: string): PromMode | null => (v === 'plain' ? 'plain' : v ? 'aware' : null);

const ROTATE: SeasonPromiseId[][] = [['fitness', 'jugend'], ['leistung', 'rotation'], ['erfahrung', 'fitness'], ['jugend', 'leistung'], ['rotation', 'erfahrung']];
const GOALS: SeasonPromiseId[] = ['meister', 'pokal', 'international', 'aufstieg', 'klassenerhalt', 'zielPlus', 'ziel', 'europaNext'];

interface Tally { n: number; kept: number }
const S = {
  mode: null as PromMode | null, idx: 0,
  shadowIds: [] as SeasonPromiseId[], shadowFit: 0, fitDay: '', level: 0, pos: 0, size: 0, cup: false, euro: false, mood: 0,
  shadow: new Map<SeasonPromiseId, Tally>(), real: new Map<SeasonPromiseId, Tally>(), realism: new Map<SeasonPromiseId, number[]>(),
  moods: [] as number[], trust: [] as number[], picksLog: [] as string[],
};
const tally = (m: Map<SeasonPromiseId, Tally>, id: SeasonPromiseId, kept: boolean) => { const t = m.get(id) ?? { n: 0, kept: 0 }; t.n++; if (kept) t.kept++; m.set(id, t); };

function choosePicks(g: Game): SeasonPromiseId[] {
  const opts = promiseOptions(g).filter((o) => !o.why);
  const has = (id: SeasonPromiseId) => opts.some((o) => o.def.id === id);
  const picks: SeasonPromiseId[] = [];
  // Saisonziel: das, was der Vorstand verlangt (ohne Ziel: Klassenerhalt bzw. Aufstieg nach Lage).
  // Ein Saisonziel, das realistisch ist (Realismus ≥ 0,6): das Vorstandsziel, sonst das nächstbescheidenere.
  const real = (id: SeasonPromiseId) => has(id) && (opts.find((o) => o.def.id === id)?.realism ?? 0) >= 0.6;
  const goal = (['ziel', 'aufstieg', 'europaNext', 'klassenerhalt'] as SeasonPromiseId[]).find(real);
  if (goal) picks.push(goal);
  for (const id of ['stimmung', 'disziplin', ...ROTATE[S.idx % ROTATE.length]] as SeasonPromiseId[]) if (has(id) && !picks.includes(id)) picks.push(id);
  S.idx++;
  return picks.slice(0, 5);
}

/** Vor processDay (nach dem Zurücksetzen der Startelf in sim.ts). */
export function promBefore(g: Game): void {
  if (!S.mode) return;
  const today = g.calendar.currentDate;
  if (pendingSeasonPromises(g)) {
    S.shadowIds = promiseOptions(g).filter((o) => !o.why).map((o) => o.def.id);
    for (const id of S.shadowIds) { const r = promiseOptions(g).find((o) => o.def.id === id)!.realism; S.realism.set(id, [...(S.realism.get(id) ?? []), r]); }
    S.shadowFit = 0;
    const picks = choosePicks(g);
    giveSeasonPromises(g, picks, today);
    S.picksLog.push(`${g.season}: ${picks.join(',')}`);
  }
  const club = g.clubs[g.managedClubId];
  if (!club?.tactics) return;
  const rec = spRecord(g);
  const prefs = S.mode === 'aware' ? promiseLineupPrefs(g) : undefined;
  Object.assign(club.tactics, autoFillLineup(club, g.players, club.tactics, eraRules(Number(today.slice(0, 4))).benchSize, prefs));
  if (S.mode === 'aware' && rec?.picks.some((p) => p.id === 'disziplin' && !p.r)) club.tactics.tackleHardness = Math.min(club.tactics.tackleHardness ?? 50, 35);
  if (ownFixtures(g, today, today).size && S.fitDay !== today) {
    S.fitDay = today;
    const ids = new Set(Object.values(club.tactics.lineupMap ?? {}));
    S.shadowFit += [...ids].filter((pid) => (g.players[pid]?.frische ?? 100) < SP_LIMITS.fitFresh).length;
  }
}

/** Saisonende vor startNextSeason: Schatten-Prüfung aller verfügbaren Versprechen. */
export function promSeasonEnd(g: Game): Map<SeasonPromiseId, string> | undefined {
  if (!S.mode) return undefined;
  const rec = spRecord(g);
  if (!rec) return undefined;
  const me = g.managedClubId;
  S.level = g.leagues.playerDivision.tier % 100;
  S.pos = g.table.rows.findIndex((r) => r.clubId === me) + 1; S.size = g.table.rows.length;
  S.cup = g.cup?.winnerClubId === me;
  S.euro = Object.values(g.euroCups ?? {}).some((c) => c?.winnerClubId === me);
  S.mood = Math.round(roomOf(g.clubs[me]).mood);
  const shadow: SeasonPromiseRecord = { ...rec, picks: S.shadowIds.map((id) => ({ id })), fit: S.shadowFit };
  const st = new Map<SeasonPromiseId, string>();
  for (const p of shadow.picks) st.set(p.id, promiseStatus(g, shadow, p).s);
  S.moods.push(S.mood);
  return st;
}

/** Nach startNextSeason: Schatten auswerten (Auf-/Abstieg, Europapokal), echte Bilanz zählen. */
export function promSeasonStart(g: Game, st: Map<SeasonPromiseId, string> | undefined, season: string): void {
  if (!S.mode || !st) return;
  const me = g.managedClubId;
  const level = g.leagues.playerDivision.tier % 100;
  const rec = spRecord(g, season);
  const euroNext = Object.values(g.euroCups ?? {}).some((c) => c && (c.participantIds?.includes(me) || c.rounds?.some((r) => r.ties?.some((t) => t.homeClubId === me || t.awayClubId === me))));
  for (const [id, s] of st) {
    let kept: boolean;
    switch (id) {
      case 'meister': kept = S.pos === 1; break;
      case 'pokal': kept = S.cup; break;
      case 'international': kept = S.euro; break;
      case 'aufstieg': kept = level < S.level; break;
      case 'klassenerhalt': kept = level <= S.level; break;
      case 'ziel': kept = S.pos > 0 && S.pos <= (rec?.base.expected ?? 99); break;
      case 'zielPlus': kept = S.pos > 0 && S.pos < (rec?.base.expected ?? 0); break;
      case 'europaNext': kept = euroNext; break;
      case 'stimmung': kept = S.mood >= SP_LIMITS.mood; break;
      case 'treue': kept = true; break;
      default: kept = s === 'good' || s === 'kept';
    }
    tally(S.shadow, id, kept);
  }
  for (const p of rec?.picks ?? []) if (p.r) tally(S.real, p.id, p.r === 'kept');
  S.trust.push(trustOf(g));
  const real = (rec?.picks ?? []).map((p) => `${p.id}:${p.r === 'kept' ? '+' : '-'}`).join(' ');
  console.log(`   PROM ${season} Platz ${S.pos}/${S.size} (Ziel ${rec?.base.expected ?? '-'}) Stimmung ${S.mood} Glaubw. ${trustOf(g)} | ${real}`);
}

export function promSummary(): void {
  if (!S.mode) return;
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  console.log(`PROM ${S.mode}: Stimmung Saisonende Ø ${avg(S.moods).toFixed(0)} (≥ ${SP_LIMITS.mood}: ${S.moods.filter((m) => m >= SP_LIMITS.mood).length}/${S.moods.length}), Glaubwürdigkeit Ende ${S.trust[S.trust.length - 1] ?? '-'} (Ø ${avg(S.trust).toFixed(0)})`);
  console.log('PROM Versprechen            | Schatten n | gehalten | gegeben n | gehalten | Ø Realismus');
  const ids = [...new Set([...S.shadow.keys(), ...S.real.keys()])].sort((a, b) => (GOALS.includes(a) ? 0 : 1) - (GOALS.includes(b) ? 0 : 1));
  for (const id of ids) {
    const sh = S.shadow.get(id), re = S.real.get(id);
    const pct = (t?: Tally) => (t && t.n ? `${Math.round((t.kept / t.n) * 100)} %` : '–');
    console.log(`PROM ${SP_DEF[id].label.slice(0, 26).padEnd(26)} | ${String(sh?.n ?? 0).padStart(3)} | ${pct(sh).padStart(5)} | ${String(re?.n ?? 0).padStart(3)} | ${pct(re).padStart(5)} | ${avg(S.realism.get(id) ?? []).toFixed(2)}`);
  }
}

export function promInit(mode: PromMode | null): void { S.mode = mode; }
