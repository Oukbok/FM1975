// =============================================================================
// AUSLANDSLIGEN SPIELTAG FÜR SPIELTAG (Wunsch Pascal: ordentlich simuliert, mit
// ordentlichen Tabellen) – schlanke Fassung für alle Länder der Welt
// -----------------------------------------------------------------------------
// Gleiches Prinzip wie die deutschen Ligen: Hin- und Rückrunde jeder gegen jeden an
// festen Spieltagen, Ergebnis je Spiel aus der Vereinsstärke mit Heimvorteil
// (Poisson-Tore, `worldMatchGoals` – dasselbe Modell wie bisher die Saison in einem
// Zug, damit die Kräfteverhältnisse je Land gleich bleiben), Tabelle nach Punkten
// (2 oder 3 je Sieg nach Land und Jahr), Tordifferenz, Toren.
// Vereinfacht, um Rechenzeit und Spielstand klein zu halten:
//  - keine Kader, keine Spielereignisse, kein gespeicherter Spielplan: die Paarungen
//    eines Spieltags entstehen aus der Vereinsliste (Kreisverfahren), die Termine aus
//    dem Kalender (sonntags von Mitte August bis Ende Mai, bei Bedarf mittwochs);
//  - gespeichert wird je Liga nur eine Zeichenkette mit den Ergebnissen
//    (`LeanDiv.r`, zwei Zeichen je Spiel). Tabellen (gesamt/heim/auswärts/Form, Stand
//    nach jedem Spieltag) und Begegnungen werden daraus bei Bedarf berechnet.
// Am Saisonende übernimmt engine/world.ts die Endtabellen (`FixedCountryResult`) –
// Meister, Auf-/Abstieg, Europapokal-Starter – und die Welt-Historie behält die
// Ligen der letzten Saisons mit allen Ergebnissen (`WorldSeasonRecord.divs`).
// Dazu je Land der Pokal mit echten Runden (game/worldCups.ts) und Torschützenlisten aus dem
// Spielerpool (game/worldScorers.ts).
// Das Heimatland und die DDR (bei Heimat Deutschland) laufen über echte Divisionen;
// die frühere Wahl „Spiel für Spiel / Hintergrund“ je Land ist damit entfallen
// (game/fullCountries.ts räumt ältere Spielstände auf).
// =============================================================================
import { COUNTRY_BY_KEY } from '../data/world/countries';
import { seasonStartYear } from '../data/timeline';
import { hashStr, mulberry32 } from '../engine/leagues';
import { worldMatchGoals, type FixedCountryResult, type LeanCup, type LeanDiv, type WorldLive, type WorldLiveDiv } from '../engine/world';
import type { ResTuple } from './leagueResults';
import { homeCountryOf, type Game } from './state';
import { finishWorldCups, newLeanCup, worldCupsDaily } from './worldCups';
import { leanCupStats, leanStats, packScorers, packStats, type PackedStats } from './worldScorers';
import { secondGroups } from '../engine/worldSecond';

/**
 * Ligen eines Landes in der schlanken Simulation: Index 0 = 1. Liga, 1… = Staffeln der 2. Ebene
 * (eingleisig nur Index 1). Schlüssel in `world.live.divs` = `Land|Index`, ebenso die Einträge in
 * `WorldSeasonRecord.divs[Land][Index]` und die Statistik-Schlüssel (`scorers`/`pstats`).
 */
export const leanDivKey = (country: string, idx: number) => `${country}|${idx}`;

/** Paarungen eines Spieltags (Index-Paare [Heim, Gast]) nach dem Kreisverfahren; bei ungerader Zahl setzt einer aus. */
export function leanPairs(n: number, md: number): [number, number][] {
  const m = n % 2 ? n + 1 : n; // gerade Zahl; Index n = spielfrei
  const half = m - 1;
  const second = md > half;
  const r = (md - 1) % half;
  const out: [number, number][] = [];
  for (let i = 0; i < m / 2; i++) {
    const a = i === 0 ? m - 1 : (r + i) % half;
    const b = (r + half - i) % half;
    if (a >= n || b >= n) continue;
    // Heimrecht wechselt je Runde; in der Rückrunde getauscht.
    const swap = (i === 0 ? r % 2 === 1 : i % 2 === 1) !== second;
    out.push(swap ? [b, a] : [a, b]);
  }
  return out;
}
export const leanMatchdays = (n: number) => 2 * ((n % 2 ? n + 1 : n) - 1);
const perDay = (n: number) => Math.floor(n / 2);

const DAY = 86_400_000;
const dateCache = new Map<string, string[]>();
/**
 * Termine der Spieltage einer Saison (Index = Spieltag − 1): gleichmäßig von Mitte August bis
 * Ende Mai, jeweils der nächste Sonntag; fallen zwei Spieltage auf denselben Sonntag (lange
 * Ligen), rückt der frühere auf den Mittwoch davor.
 */
export function leanDates(season: string, total: number): string[] {
  const ck = `${season}|${total}`;
  const hit = dateCache.get(ck);
  if (hit) return hit;
  const y = seasonStartYear(season);
  const t0 = Date.UTC(y, 7, 12), t1 = Date.UTC(y + 1, 4, 28);
  const days = Math.round((t1 - t0) / DAY);
  const sunday = (t: number) => t + ((7 - new Date(t).getUTCDay()) % 7) * DAY;
  const raw = Array.from({ length: total }, (_, i) => sunday(t0 + Math.floor(((i + 1) / total) * days) * DAY));
  for (let i = 0; i < total - 1; i++) if (raw[i] === raw[i + 1]) raw[i] -= 4 * DAY;
  const out = raw.map((t) => new Date(t).toISOString().slice(0, 10));
  if (dateCache.size > 40) dateCache.clear();
  dateCache.set(ck, out);
  return out;
}

/** Welche Länder laufen über diese Simulation? Alle außer dem Heimatland und der DDR bei Heimat Deutschland (echte Divisionen). */
function leanCountry(g: Game, key: string): boolean {
  const cc = COUNTRY_BY_KEY[key]?.cc;
  const home = homeCountryOf(g);
  return !cc || !(cc === home || (home === 'ger' && cc === 'gdr'));
}

/** Laufende Saison anlegen (idempotent je Saison). */
export function ensureWorldLive(g: Game): WorldLive | null {
  const w = g.world;
  if (!w || !g.euroClubs) return null;
  // Landespokale (game/worldCups.ts): auch für laufende Saisons älterer Spielstände nachrüsten.
  const cups = () => {
    const out: NonNullable<WorldLive['cups']> = {};
    for (const c of Object.values(w.countries)) {
      if (!c.active || !leanCountry(g, c.name)) continue;
      const cup = newLeanCup(g, c.tiers, c.name);
      if (cup) out[c.name] = cup;
    }
    return out;
  };
  if (w.live?.season === g.season) {
    if (!w.live.cups) {
      // Mitten in der Saison nachgerüstet: fällige Runden sofort nachholen (Ergebnisse hängen nur an Land/Saison/Runde).
      w.live.cups = cups();
      worldCupsDaily(g, g.season, w.live.cups, g.calendar.currentDate);
    }
    return w.live;
  }
  const live: WorldLive = { season: g.season, divs: {}, cups: cups() };
  for (const c of Object.values(w.countries)) {
    if (!c.active || !leanCountry(g, c.name)) continue;
    [c.tiers[0] ?? [], ...secondGroups(c)].forEach((ids0, t) => {
      const ids = ids0.filter((id) => g.euroClubs![id]);
      if (ids.length < 4) return;
      live.divs[leanDivKey(c.name, t)] = { ids, md: 0, n: leanMatchdays(ids.length), r: '' };
    });
  }
  w.live = live;
  return live;
}

const G36 = (n: number) => Math.min(35, Math.max(0, n)).toString(36);
function playMatchday(g: Game, key: string, d: WorldLiveDiv): void {
  const md = d.md + 1;
  const rnd = mulberry32(hashStr(`wl:${key}:${g.season}:md${md}`));
  let out = '';
  for (const [h, a] of leanPairs(d.ids.length, md)) {
    const [hg, ag] = worldMatchGoals(g.euroClubs![d.ids[h]]?.strength ?? 50, g.euroClubs![d.ids[a]]?.strength ?? 50, rnd);
    out += G36(hg) + G36(ag);
  }
  d.r += out;
  d.md = md;
}

/** Täglich: alle Auslandsligen bis zum Kalenderstand spielen (auch Nachholen nach dem Laden älterer Spielstände). */
export function worldLiveDaily(g: Game, today: string): void {
  if (!g.world) return;
  const live = ensureWorldLive(g);
  if (!live) return;
  for (const [key, d] of Object.entries(live.divs)) {
    if (d.md >= d.n) continue;
    const dates = leanDates(live.season, d.n);
    while (d.md < d.n && dates[d.md] <= today) playMatchday(g, key, d);
  }
  if (live.cups) worldCupsDaily(g, live.season, live.cups, today);
}

/** Punkte je Sieg im Land in der Saison (data/world/countries.ts `points3From`). */
export const leanWinPts = (key: string, season: string): number => {
  const c = COUNTRY_BY_KEY[key];
  return c && seasonStartYear(season) >= c.points3From ? 3 : 2;
};

/** Alle Spiele einer schlanken Liga: gespielte mit Ergebnis, kommende mit `null` (bis Spieltag `played`). */
export interface LeanGame { md: number; date: string; home: string; away: string; hg: number | null; ag: number | null; hh: number; ha: number }
export function leanGames(d: LeanDiv, season: string, played?: number): LeanGame[] {
  const n = d.ids.length, total = leanMatchdays(n), per = perDay(n);
  const done = Math.min(total, played ?? Math.floor(d.r.length / (2 * per || 1)));
  const dates = leanDates(season, total);
  const out: LeanGame[] = [];
  for (let md = 1; md <= total; md++) {
    const pairs = leanPairs(n, md);
    for (let j = 0; j < pairs.length; j++) {
      const o = ((md - 1) * per + j) * 2;
      const ok = md <= done && o + 1 < d.r.length;
      out.push({ md, date: dates[md - 1], home: d.ids[pairs[j][0]], away: d.ids[pairs[j][1]], hg: ok ? parseInt(d.r[o], 36) : null, ag: ok ? parseInt(d.r[o + 1], 36) : null, hh: -1, ha: -1 });
    }
  }
  return out;
}
/** Gespielte Spiele als Ergebnis-Tupel (wie game/leagueResults.ts – für Tabellen nach Spieltag, Heim/Auswärts, Form). */
export const leanResTuples = (games: LeanGame[]): ResTuple[] =>
  games.filter((x) => x.hg != null).map((x) => [x.md, x.date, x.home, x.away, x.hg!, x.ag!, -1, -1]);

export interface LeanTableRow { clubId: string; pos: number; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; cs: number; form: ('W' | 'D' | 'L')[] }
/** Tabelle einer schlanken Liga (Punkte nach der Regel des Landes; Reihenfolge Punkte, Tordifferenz, Tore). */
export function leanTable(d: LeanDiv, key: string, season: string): LeanTableRow[] {
  const wp = leanWinPts(key, season);
  const rows = new Map<string, LeanTableRow>(d.ids.map((id) => [id, { clubId: id, pos: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, cs: 0, form: [] }]));
  const put = (id: string, gf: number, ga: number) => {
    const r = rows.get(id)!;
    r.p++; r.gf += gf; r.ga += ga;
    if (ga === 0) r.cs++;
    if (gf > ga) { r.w++; r.pts += wp; r.form.push('W'); } else if (gf === ga) { r.d++; r.pts++; r.form.push('D'); } else { r.l++; r.form.push('L'); }
  };
  for (const x of leanGames(d, season)) if (x.hg != null) { put(x.home, x.hg, x.ag!); put(x.away, x.ag!, x.hg); }
  return [...rows.values()]
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.clubId.localeCompare(b.clubId))
    .map((r, i) => ({ ...r, pos: i + 1, form: r.form.slice(-5) }));
}

/** Laufende Liga eines Landes (Index wie `leanDivKey`; null: Land läuft nicht schlank bzw. hat die Liga nicht). */
export function worldLiveDiv(g: Game, key: string, idx: number): WorldLiveDiv | null {
  return ensureWorldLive(g)?.divs[leanDivKey(key, idx)] ?? null;
}

/** Zahl der laufenden Ligen eines Landes in der schlanken Simulation (1. Liga + Staffeln). */
export function worldLiveDivCount(g: Game, key: string): number {
  const live = ensureWorldLive(g);
  let n = 0;
  while (live?.divs[leanDivKey(key, n)]) n++;
  return n;
}

/** Saisonende: alle Ligen zu Ende spielen; Endtabellen für engine/world.ts und die Ligen für die Historie. */
export interface WorldLiveEnd {
  fixed: Record<string, FixedCountryResult>;
  divs: Record<string, (LeanDiv | null)[]>;
  /** Landespokale mit allen Runden und die Torschützenlisten (`Land|Ebene`, Pokal `Land|cup`) für die Historie. */
  cups: Record<string, LeanCup>;
  scorers: Record<string, [string, string, string, number][]>;
  pstats: Record<string, PackedStats>;
}
export function worldLiveResults(g: Game): WorldLiveEnd {
  const fixed: Record<string, FixedCountryResult> = {}, divs: Record<string, (LeanDiv | null)[]> = {};
  const scorers: WorldLiveEnd['scorers'] = {};
  const pstats: WorldLiveEnd['pstats'] = {};
  const live = ensureWorldLive(g);
  if (!live) return { fixed, divs, cups: {}, scorers, pstats };
  for (const [k, d] of Object.entries(live.divs)) {
    while (d.md < d.n) playMatchday(g, k, d);
    const [key, t] = k.split('|');
    const order = leanTable(d, key, live.season).map((r) => r.clubId);
    const fx = (fixed[key] ??= { t1: [], t2: [] });
    const idx = Number(t);
    if (idx === 0) fx.t1 = order; else (fx.t2g ??= [])[idx - 1] = order;
    const list = (divs[key] ??= [null, null]);
    while (list.length <= idx) list.push(null);
    list[idx] = { ids: d.ids, r: d.r };
    const st = leanStats(g, d, live.season, 10);
    if (st.goals.length) { scorers[k] = packScorers(st.goals); pstats[k] = packStats(st); }
  }
  // Länder ohne 1. Liga in der schlanken Rechnung (zu wenige Vereine) rechnet die Welt wie bisher.
  for (const key of Object.keys(fixed)) if (!fixed[key].t1.length) { delete fixed[key]; delete divs[key]; }
  // 2. Ebene: alle Staffeln hintereinander (`t2`), einzeln in `t2g` (fehlende Staffel = leer → Welt rechnet sie).
  for (const fx of Object.values(fixed)) if (fx.t2g) { fx.t2g = Array.from(fx.t2g, (x) => x ?? []); fx.t2 = fx.t2g.flat(); }
  // Landespokale zu Ende spielen: der Sieger geht an die Welt.
  const cupEnd = finishWorldCups(g, live.season, live.cups ?? {});
  const cups: WorldLiveEnd['cups'] = {};
  for (const [key, id] of Object.entries(cupEnd.winners)) {
    if (!fixed[key]) continue;
    fixed[key].cup = id;
    cups[key] = cupEnd.cups[key];
    const st = leanCupStats(g, key, live.season, cups[key], 10);
    if (st.goals.length) { scorers[`${key}|cup`] = packScorers(st.goals); pstats[`${key}|cup`] = packStats(st); }
  }
  return { fixed, divs, cups, scorers, pstats };
}
