// =============================================================================
// Sim-Bericht Trainingslager des eigenen Vereins (CAMP=drills|plain in tests/sim.ts).
// Der eigene Verein bucht in jedem Sommer- und Winterfenster ein Lager mit einem
// „gut geplanten“ Programm (8 Punkte Taktik, sechs Taktik-Inhalte) – bei `plain`
// dieselbe Verteilung ohne Inhalte. Gemessen werden die +1 aus den Taktik-Inhalten
// (je Saison, je Alter, Abstand zum Potenzial), die Lager-Entwicklungspunkte und die
// übrige Entwicklung (Bewertungsrunden) des eigenen Kaders zum Vergleich.
// =============================================================================
import type { Game } from '../src/game/state';
import type { AttributeKey, Player } from '../src/types';
import { CampProgram } from '../src/engine/campProgram';
import { campYear, destinationsFor } from '../src/engine/trainingCamp';
import { bookCamp, campWindow, ownBooking, quoteCamp } from '../src/game/trainingCampGame';
import { campState } from '../src/game/winterShared';
import { CalendarEngine } from '../src/engine/calendar';
import { leagueClubs } from '../src/game/season';
import { familiarity, footFactor, rawSuitability } from '../src/engine/positions';

export type CampMode = 'drills' | 'plain';
export const campModeFromEnv = (v?: string): CampMode | null => (v === 'drills' || v === 'plain' ? v : v ? 'drills' : null);

const PROGRAM = (mode: CampMode): CampProgram => ({
  pts: { kondition: 3, technik: 3, taktik: 8, kopf: 2, teamgeist: 2, regeneration: 2, jugend: 1 },
  // Kern-Inhalte (8 Punkte): treffen die Schlüsselattribute der meisten Positionen – der stärkste sinnvolle Plan.
  drills: mode === 'drills' ? ['abwehr', 'aufbau', 'kurzpass', 'langball', 'torwart'] : [],
});

const AGE_GROUPS = ['≤21', '22–24', '25–27', '28–30', '31+'] as const;
const ageGroup = (a: number) => (a <= 21 ? 0 : a <= 24 ? 1 : a <= 27 ? 2 : a <= 30 ? 3 : 4);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

interface Snap { ovr: number; attrs: number; dev: number; age: number; room: number }
const attrSum = (p: Player) => Object.entries(p.attributes).reduce((s, [k, v]) => (k === 'fitness' ? s : s + (v ?? 0)), 0);
/** Stärke ungerundet (wie positionSuitability, ohne Rundung), damit einzelne +1 messbar sind. */
const rawOvr = (p: Player) => rawSuitability(p, p.naturalPosition) * familiarity(p, p.naturalPosition) * footFactor(p, p.naturalPosition);
const snapOf = (p: Player): Snap => ({ ovr: rawOvr(p), attrs: attrSum(p), dev: p.development.devPoints ?? 0, age: p.age, room: p.development.potentialAbility - p.development.currentAbility });

/** Laufende Zähler (je Saison zurückgesetzt) und Gesamtsummen. */
const S = {
  mode: null as CampMode | null,
  camps: 0, campDays: 0, travelers: 0, ups: 0, drillOvr: 0, campDev: 0,
  upsByAge: [0, 0, 0, 0, 0], travByAge: [0, 0, 0, 0, 0], campDaysByAge: [0, 0, 0, 0, 0], drillOvrByAge: [0, 0, 0, 0, 0],
  rooms: [] as number[], seasonStart: new Map<string, number>(), seasonDrillOvr: new Map<string, number>(),
  pending: null as null | { id: string; days: number; before: Map<string, Snap> },
  devBefore: new Map<string, number>(), rating: false,
  // Gesamt über alle Saisons
  tot: { seasons: 0, camps: 0, ups: 0, drillOvr: 0, campDev: 0, travelers: 0, campDays: 0,
    upsByAge: [0, 0, 0, 0, 0], travByAge: [0, 0, 0, 0, 0], drillDayByAge: [0, 0, 0, 0, 0], campDaysByAge: [0, 0, 0, 0, 0],
    growByAge: [0, 0, 0, 0, 0], growNByAge: [0, 0, 0, 0, 0], wkDev: [0, 0, 0, 0, 0], wkDays: [0, 0, 0, 0, 0], campDevByAge: [0, 0, 0, 0, 0], rooms: [] as number[], gap: [] as number[], failed: 0 },
};

function ownSquad(g: Game): Player[] {
  return (g.clubs[g.managedClubId]?.playerIds ?? []).map((id) => g.players[id]).filter((p): p is Player => !!p && !p.isYouth);
}
const topAvg = (ps: Player[], n = 14) => avg(ps.map((p) => p.overall).sort((a, b) => b - a).slice(0, n));

export function campInit(g: Game, mode: CampMode | null): void {
  S.mode = mode;
  for (const p of ownSquad(g)) S.seasonStart.set(p.id, p.overall);
}

/** Vor processDay: ggf. buchen, Schnappschuss vor dem Ende eines eigenen Lagers. */
export function campBefore(g: Game): void {
  if (!S.mode) return;
  const today = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  for (const s of ['summer', 'winter'] as const) {
    if (ownBooking(g, s)) continue;
    const w = campWindow(g, s);
    if (today < CalendarEngine.addDays(w.from, -25) || today > CalendarEngine.addDays(w.to, -16)) continue;
    const days = s === 'summer' ? 9 : 7;
    const year = campYear(g.season, s);
    const dests = destinationsFor(s, year, club.reputation).filter((x) => x.status.ok);
    let done = false;
    for (let st = CalendarEngine.addDays(today, 7); !done && st <= CalendarEngine.addDays(w.to, 1 - days); st = CalendarEngine.addDays(st, 1)) {
      if (st < w.from) continue;
      const opts = dests.map((x) => ({ id: x.d.id, q: quoteCamp(g, x.d.id, s, st, days, { program: PROGRAM(S.mode) }) }))
        .filter((x) => !x.q.error && x.q.cost < club.finances.balance * 0.5).sort((a, b) => a.q.cost - b.q.cost);
      // Mittleres Preisniveau statt des billigsten Ziels (ein „vernünftiger“ Manager).
      const pick = opts[Math.floor(opts.length / 2)];
      if (pick && !bookCamp(g, pick.id, s, st, days, 2, { program: PROGRAM(S.mode) })) done = true;
    }
    if (!done && today === CalendarEngine.addDays(w.to, -16)) S.tot.failed++;
  }
  S.devBefore = new Map(ownSquad(g).map((p) => [p.id, p.development.devPoints ?? 0] as const));
  S.rating = g.calendar.events.some((e) => e.date === today && e.type === 'rating_update');
  const b = campState(g).bookings.find((x) => !x.done && x.end <= today);
  if (b) {
    const before = new Map(ownSquad(g).map((p) => [p.id, snapOf(p)] as const));
    S.pending = { id: b.id, days: Math.round((Date.parse(b.end) - Date.parse(b.start)) / 86_400_000) + 1, before };
  }
}

/** Nach processDay: Wirkung des eben beendeten Lagers verbuchen. */
export function campAfter(g: Game): void {
  const pd = S.pending;
  // Übrige Tage: Entwicklungspunkte aus dem Wochentraining (ohne Bewertungsrunden und Lager-Rückkehr).
  if (S.mode && !pd && !S.rating) {
    for (const p of ownSquad(g)) {
      const b0 = S.devBefore.get(p.id);
      if (b0 == null || p.injury) continue;
      const i = ageGroup(p.age);
      S.tot.wkDev[i] += (p.development.devPoints ?? 0) - b0; S.tot.wkDays[i]++;
    }
  }
  if (!pd) return;
  S.pending = null;
  const b = campState(g).bookings.find((x) => x.id === pd.id);
  if (!b?.done || !b.result) return;
  const travelers = new Set([...(b.squad ?? ownSquad(g).map((p) => p.id))]);
  S.camps++; S.campDays += pd.days;
  S.campDev += (b.result.dev ?? 0) * b.result.travelers;
  for (const p of ownSquad(g)) {
    const bf = pd.before.get(p.id);
    if (!bf || !travelers.has(p.id) || p.injury) continue;
    const ag = ageGroup(bf.age);
    const ups = attrSum(p) - bf.attrs;
    const dOvr = rawOvr(p) - bf.ovr;
    S.tot.campDevByAge[ag] += (p.development.devPoints ?? 0) - bf.dev;
    S.travelers++; S.travByAge[ag]++; S.campDaysByAge[ag] += pd.days;
    S.ups += ups; S.upsByAge[ag] += ups; S.drillOvr += dOvr; S.drillOvrByAge[ag] += dOvr;
    S.seasonDrillOvr.set(p.id, (S.seasonDrillOvr.get(p.id) ?? 0) + dOvr);
    for (let i = 0; i < ups; i++) S.rooms.push(bf.room);
  }
}

/** Saisonende: Zeile ausgeben, Wachstum ohne Lager-Inhalte je Alter merken. */
export function campSeasonReport(g: Game): void {
  if (!S.mode) return;
  const T = S.tot;
  const sq = ownSquad(g);
  for (const p of sq) {
    const start = S.seasonStart.get(p.id);
    if (start == null) continue;
    const ag = ageGroup(p.age - 1);
    T.growByAge[ag] += p.overall - start - (S.seasonDrillOvr.get(p.id) ?? 0);
    T.growNByAge[ag]++;
  }
  const league = leagueClubs(g).filter((c) => c.id !== g.managedClubId).map((c) => topAvg(c.playerIds.map((id) => g.players[id]).filter(Boolean)));
  const gap = topAvg(sq) - avg(league);
  T.gap.push(gap);
  console.log(`   CAMP ${S.mode} Lager ${S.camps} (${S.campDays} T) | Reisende ${S.travelers} | +1 gesamt ${S.ups} = ${(S.ups / Math.max(1, S.travelers)).toFixed(2)}/Spieler·Lager | OVR aus Inhalten ${(S.drillOvr / Math.max(1, S.travelers)).toFixed(2)}/Spieler·Lager | Lager-devPts ${(S.campDev / Math.max(1, S.travelers)).toFixed(2)} | +1 je Alter ${AGE_GROUPS.map((a, i) => `${a}:${(S.upsByAge[i] / Math.max(1, S.travByAge[i])).toFixed(1)}`).join(' ')} | Luft Ø ${avg(S.rooms).toFixed(1)} (<3: ${S.rooms.filter((r) => r < 3).length}) | Top14 ${topAvg(sq).toFixed(1)} vs Liga ${avg(league).toFixed(1)} (${gap >= 0 ? '+' : ''}${gap.toFixed(1)})`);
  T.seasons++; T.camps += S.camps; T.ups += S.ups; T.drillOvr += S.drillOvr; T.campDev += S.campDev; T.travelers += S.travelers; T.campDays += S.campDays;
  for (let i = 0; i < 5; i++) { T.upsByAge[i] += S.upsByAge[i]; T.travByAge[i] += S.travByAge[i]; T.drillDayByAge[i] += S.drillOvrByAge[i]; T.campDaysByAge[i] += S.campDaysByAge[i]; }
  T.rooms.push(...S.rooms);
  Object.assign(S, { camps: 0, campDays: 0, travelers: 0, ups: 0, drillOvr: 0, campDev: 0, rooms: [] });
  S.upsByAge = [0, 0, 0, 0, 0]; S.travByAge = [0, 0, 0, 0, 0]; S.campDaysByAge = [0, 0, 0, 0, 0]; S.drillOvrByAge = [0, 0, 0, 0, 0];
  S.seasonDrillOvr.clear();
}

/** Nach startNextSeason: Stärken zum Saisonstart merken. */
export function campSeasonStart(g: Game): void {
  if (!S.mode) return;
  S.seasonStart.clear();
  for (const p of ownSquad(g)) S.seasonStart.set(p.id, p.overall);
}

export function campSummary(): void {
  if (!S.mode) return;
  const T = S.tot;
  const tr = Math.max(1, T.travelers);
  console.log(`CAMP ${S.mode}: ${T.seasons} Saisons, ${T.camps} Lager (${T.failed} Fenster ohne Buchung), +1 je Spieler·Lager ${(T.ups / tr).toFixed(2)}, OVR je Spieler·Lager ${(T.drillOvr / tr).toFixed(3)}, Lager-devPts je Spieler·Lager ${(T.campDev / tr).toFixed(2)}, Luft Ø ${avg(T.rooms).toFixed(1)}, Abstand Top14 zur Liga Ø ${avg(T.gap).toFixed(2)} (erste 10 ${avg(T.gap.slice(0, 10)).toFixed(2)}, letzte 10 ${avg(T.gap.slice(-10)).toFixed(2)})`);
  console.log('CAMP Alter  | +1/Spieler·Lager | OVR Inhalte/Lagertag | Lager-devPts/Lagertag | Wochentraining devPts/Tag | Lager gesamt ÷ Wochentraining | OVR übrige Entw./Tag');
  for (let i = 0; i < 5; i++) {
    const drillDay = T.drillDayByAge[i] / Math.max(1, T.campDaysByAge[i]);
    const growDay = T.growByAge[i] / Math.max(1, T.growNByAge[i]) / 365;
    const campDay = T.campDevByAge[i] / Math.max(1, T.campDaysByAge[i]);
    const wk = T.wkDev[i] / Math.max(1, T.wkDays[i]);
    console.log(`CAMP ${AGE_GROUPS[i].padEnd(6)} | ${(T.upsByAge[i] / Math.max(1, T.travByAge[i])).toFixed(2).padStart(5)} | ${drillDay.toFixed(4)} | ${campDay.toFixed(4)} | ${wk.toFixed(4)} | ${wk > 0 ? ((drillDay + campDay) / wk).toFixed(1) + '×' : '–'} | ${growDay.toFixed(4)}`);
  }
}

export type { AttributeKey };
