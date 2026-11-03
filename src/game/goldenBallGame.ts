// =============================================================================
// GOLDENER BALL — Spielablauf und Archiv (Wertung engine/goldenBall.ts)
// -----------------------------------------------------------------------------
// Am 20. Dezember (`goldenBallDaily` in game/day.ts) wählt die Jury den Fußballer
// des Jahres. Kandidaten:
//   • alle Spieler mit vollem Kader (Liga des eigenen Vereins): Kalenderjahr =
//     Rückrunde der abgelaufenen Saison (halbe Saisonstation aus der Historie) +
//     Hinrunde der laufenden Saison (`seasonStats`),
//   • die Stars der stärksten Auslandsvereine: Kurzkader des Europapokals
//     (engine/euroLight.ts `phantomRoster`, gleiche Namen/IDs wie in den Bestenlisten);
//     Note und Torquote aus der Stärke geschätzt – nach dem Maßstab der vollen
//     Spieler (lineare Anpassung), dazu echte Europapokal-Tore der laufenden Saison.
//   • Titel des Jahres aus dem Liga-Archiv (Meister, Pokal, Europapokale der
//     abgelaufenen Saison) bzw. den Auslandsligen (`world.countries[…].lastChampion`).
// Archiv im optionalen Feld `game.goldenBall` (Top 10 je Jahr, höchstens MAX Jahre),
// `pending` öffnet die Gala (screens/gala/GalaShow.tsx).
// =============================================================================
import { ORIGINS } from '../data/origins';
import { seasonLabel } from '../engine/calendar';
import { COUNTRY_ORIGIN, hashKey, phantomRoster } from '../engine/euroLight';
import { type GBCandidate, type GBTitle, gbEra, gbReason, rankGoldenBall } from '../engine/goldenBall';
import { makeMessage, pushMessage } from '../engine/messages';
import type { CupState, PositionGroup } from '../types';
import { POSITION_GROUPS } from '../types';
import { archivedSeason } from './leagueArchive';
import { moraleJolt } from './moraleJolt';
import type { Game } from './state';

export interface GBEntry {
  p: string; n: string; nat: string; c: string; cn: string; pos: string; a: number; ov: number;
  ap: number; g: number; gl: number; as: number; cs: number; tt?: GBTitle[]; pts: number;
  /** Begründung (nur Plätze 1–3). */
  why?: string;
  /** Werte geschätzt (Auslandsverein ohne Einzelstatistik). */
  est?: 1;
}
export interface GBYear { year: number; title: string; venue: string; rule: string; top: GBEntry[]; mine?: string }
export interface GoldenBallState { v: 1; years: GBYear[]; pending?: number }

export const MAX_GB_YEARS = 80;
export const GB_DAY = '12-20';

type G = Game & { goldenBall?: GoldenBallState };
export const goldenBallState = (g: Game) => (g as G).goldenBall;
export const goldenBallOf = (g: Game, year: number) => goldenBallState(g)?.years.find((y) => y.year === year);
export function pendingGoldenBall(g: Game): GBYear | undefined {
  const st = goldenBallState(g);
  return st?.pending != null ? goldenBallOf(g, st.pending) : undefined;
}
export function clearPendingGoldenBall(g: Game): void {
  const st = goldenBallState(g);
  if (st) delete st.pending;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Lineare Anpassung y = a + b·x (kleinste Quadrate). */
function fit(xs: number[], ys: number[]): [number, number] {
  const n = xs.length;
  if (n < 5) return [ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0, 0];
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b = sxx > 0 ? sxy / sxx : 0;
  return [my - b * mx, b];
}

/** Kandidaten des Kalenderjahres. */
export function goldenBallCandidates(g: Game, year: number): GBCandidate[] {
  const prev = seasonLabel(year - 1);
  const arch = archivedSeason(g, prev);
  const won = new Map<string, GBTitle[]>();
  const add = (id: string | null | undefined, t: GBTitle) => { if (id) won.set(id, [...(won.get(id) ?? []), t]); };
  if (arch) {
    const top = arch.divisions.find((d) => d.tier === 1 && !d.id.startsWith('ddr'));
    add(top?.rows[0]?.[0], 'meister');
    add(arch.cups.cup?.winner, 'pokal');
    add(arch.cups.ec?.winner, 'ec'); add(arch.cups.cwc?.winner, 'cwc'); add(arch.cups.uefa?.winner, 'uefa');
  }
  for (const c of Object.values(g.world?.countries ?? {})) { add(c.lastChampion, 'meister'); add(c.lastCupWinner, 'pokal'); }

  // 1) Spieler mit voller Statistik
  const out: GBCandidate[] = [];
  for (const p of Object.values(g.players)) {
    if (p.isYouth) continue;
    const st = p.history?.stations?.find((s) => s.season === prev);
    const cur = p.seasonStats;
    const half = st ? st.appearances * 0.5 : 0;
    const apps = Math.round(half + (cur?.appearances ?? 0));
    if (apps < 10) continue;
    const rated = half + (cur?.ratedMatches ?? 0);
    const avg = rated > 0 ? (half * (st?.averageRating ?? 0) + (cur?.ratingSum ?? 0)) / rated : 0;
    const cleanRate = cur && cur.appearances ? cur.cleanSheets / cur.appearances : 0;
    const titleClub = st?.clubId ?? p.clubId;
    out.push({
      pid: p.id, name: p.fullName, nat: p.nationality, clubId: p.clubId, clubName: g.clubs[p.clubId]?.name ?? p.clubId,
      country: 'Deutschland', pos: p.naturalPosition, group: POSITION_GROUPS[p.naturalPosition] ?? 'MID', age: p.age, ovr: p.overall,
      apps, avg, goals: Math.round((st?.goals ?? 0) * 0.5 + (cur?.goals ?? 0)), assists: Math.round((st?.assists ?? 0) * 0.5 + (cur?.assists ?? 0)),
      clean: Math.round(cleanRate * apps), titles: won.get(titleClub) ?? [],
    });
  }

  // 2) Stars der stärksten Auslandsvereine (geschätzt nach dem Maßstab oben)
  const full = out.filter((c) => c.apps >= 15);
  const [ga, gb] = fit(full.map((c) => c.ovr), full.map((c) => c.avg));
  const rate: Partial<Record<PositionGroup, [number, number]>> = {};
  for (const grp of ['DEF', 'MID', 'ATT'] as PositionGroup[]) {
    const f = full.filter((c) => c.group === grp);
    rate[grp] = fit(f.map((c) => c.ovr), f.map((c) => (c.goals + 0.5 * c.assists) / c.apps));
  }
  const euro = g.euroClubs ?? {};
  const live: Record<string, number[]> = {};
  for (const cup of Object.values(g.euroCups ?? {}) as (CupState | null)[]) {
    for (const [pid, t] of Object.entries(cup?.xstats ?? {})) {
      const l = (live[pid] ??= [0, 0, 0]); l[0] += t[0]; l[1] += t[1]; l[2] += t[2];
    }
  }
  const foreign = Object.entries(euro)
    .filter(([id, c]) => !g.clubs[id] && !g.simClubs?.[id] && c.country && c.country !== 'Deutschland' && c.country !== 'DDR')
    .sort((a, b) => b[1].strength - a[1].strength);
  const chosen = new Set(foreign.slice(0, 28).map(([id]) => id));
  for (const id of won.keys()) if (euro[id] && !g.clubs[id]) chosen.add(id);
  const dummy = { xpeople: {} } as unknown as CupState;
  for (const id of chosen) {
    const c = euro[id];
    if (!c || g.clubs[id] || g.simClubs?.[id]) continue;
    const roster = phantomRoster(dummy, id, c.country, c.strength, year).sort((a, b) => b.q - a.q).slice(0, 3);
    const nat = ORIGINS[COUNTRY_ORIGIN[c.country] ?? 'eng']?.nationality ?? 'ENG';
    for (const pl of roster) {
      const h = hashKey(pl.id + ':' + year);
      const noise = ((h % 1000) / 1000 - 0.5);
      const grp = POSITION_GROUPS[pl.pos] ?? 'MID';
      const apps = 26 + (h % 9) + (live[pl.id]?.[0] ?? 0);
      const ovr = Math.round(pl.q);
      const avg = Math.min(4.2, Math.max(1.6, ga + gb * ovr + noise * 0.3));
      const [ra, rb] = rate[grp] ?? [0, 0];
      const contrib = Math.max(0, ra + rb * ovr) * (1 + noise * 0.4) * apps;
      const goals = Math.round(contrib * 0.7) + (live[pl.id]?.[1] ?? 0);
      const assists = Math.round(contrib * 0.35) + (live[pl.id]?.[2] ?? 0);
      out.push({
        pid: pl.id, name: dummy.xpeople![pl.id]?.[0] ?? pl.id, nat, clubId: id, clubName: c.name, country: c.country,
        pos: pl.pos, group: grp, age: 22 + (h % 10), ovr, apps, avg, goals: grp === 'GK' ? 0 : goals, assists: grp === 'GK' ? 0 : assists,
        clean: grp === 'GK' || grp === 'DEF' ? Math.round(apps * (0.25 + (ovr - 75) / 100)) : 0,
        titles: won.get(id) ?? [], est: true,
      });
    }
  }
  return out;
}

/** Wahl des Jahres (ohne zu speichern). */
export function evaluateGoldenBall(g: Game, year: number): GBYear | null {
  const top = rankGoldenBall(goldenBallCandidates(g, year), year, 10);
  if (!top.length) return null;
  const era = gbEra(year);
  return {
    year, title: era.title, venue: era.venue, rule: era.rule, mine: g.managedClubId,
    top: top.map((c, i) => {
      const e: GBEntry = {
        p: c.pid, n: c.name, nat: c.nat, c: c.clubId, cn: c.clubName, pos: c.pos, a: c.age, ov: c.ovr,
        ap: c.apps, g: r2(c.avg), gl: c.goals, as: c.assists, cs: c.clean, pts: Math.round(c.score * 10) / 10,
      };
      if (c.titles.length) e.tt = c.titles;
      if (i < 3) e.why = gbReason(c);
      if (c.est) e.est = 1;
      return e;
    }),
  };
}

/** Wahl durchführen (einmal je Jahr): Archiv, Nachricht, Moral, Ruf. */
export function awardGoldenBall(g: Game, year: number, date: string, popup = true): GBYear | null {
  if (goldenBallOf(g, year)) return null;
  const res = evaluateGoldenBall(g, year);
  if (!res) return null;
  const st = ((g as G).goldenBall ??= { v: 1, years: [] });
  st.years.push(res);
  if (st.years.length > MAX_GB_YEARS) st.years.splice(0, st.years.length - MAX_GB_YEARS);
  if (popup) st.pending = year;
  const mine = res.top.map((e, i) => ({ e, i })).filter((x) => x.e.c === g.managedClubId);
  for (const { e, i } of mine) {
    moraleJolt(g, g.players[e.p], i === 0 ? 8 : i < 3 ? 4 : 2, i === 0 ? `Goldener Ball ${year}` : `Platz ${i + 1} beim Goldenen Ball ${year}`, date);
  }
  const club = g.clubs[g.managedClubId];
  if (club && mine.some((x) => x.i === 0)) club.reputation = Math.min(100, club.reputation + 1); // Ansehen des Vereins
  const w = res.top[0];
  pushMessage(g.messages, makeMessage({
    date, category: 'media', from: 'Sportredaktion',
    subject: `${res.title} ${year}: ${w.n}`,
    shortText: `Der Goldene Ball geht an ${w.n} (${w.cn}).`,
    bodyText: [
      `Bei der Gala in ${res.venue} erhielt ${w.n} (${w.cn}) den Goldenen Ball ${year} – ${res.title}. ${w.why ?? ''}`,
      '',
      ...res.top.map((e, i) => `${i + 1}. ${e.n} (${e.cn}, ${e.nat})`),
      ...(mine.length ? ['', `Aus deinem Kader unter den Besten: ${mine.map((x) => `${x.e.n} (Platz ${x.i + 1})`).join(', ')}.`] : []),
      '', `Regel des Jahres: ${res.rule}. Alle Sieger findest du unter Statistiken › Auszeichnungen.`,
    ].join('\n'),
  }));
  return res;
}

/** Täglich aus processDay: am 20. Dezember (oder danach im Dezember, falls verpasst). */
export function goldenBallDaily(g: Game, today: string): boolean {
  if (today.slice(5) < GB_DAY || today.slice(5, 7) !== '12') return false;
  const year = Number(today.slice(0, 4));
  return !!awardGoldenBall(g, year, today);
}

/** Alte Spielstände: ohne Feld nichts tun; sonst säubern und begrenzen (idempotent). */
export function migrateGoldenBall(g: Game): void {
  const st = goldenBallState(g);
  if (!st) return;
  if (!Array.isArray(st.years)) st.years = [];
  st.years = st.years.filter((y) => y && typeof y.year === 'number' && Array.isArray(y.top));
  if (st.years.length > MAX_GB_YEARS) st.years.splice(0, st.years.length - MAX_GB_YEARS);
  if (st.pending != null && !st.years.some((y) => y.year === st.pending)) delete st.pending;
  st.v = 1;
}
