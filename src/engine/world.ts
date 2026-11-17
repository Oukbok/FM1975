// =============================================================================
// EUROPA IM HINTERGRUND — Ligen der Welt auf Detailstufe 3 („Profil“)
// -----------------------------------------------------------------------------
// Jeder ausländische Verein ist nur ein schlanker Eintrag (EuroClub: Name, Land,
// Stärke, Farben) plus Meta (Größe, Liga-Ebene). Eine Saison wird am Saisonende
// in einem Rutsch per Poisson-Ergebnissen durchgerechnet (doppelte Runde, Auf-/
// Abstieg, Pokalsieger). Kosten: ~20 Länder × 2 Ligen × ~300 Spiele ≈ wenige
// Millisekunden pro Saison, Speicher < 100 KB – bleibt über Jahrzehnte schlank.
//
// Stärke entwickelt sich über eine dauerhafte „Größe“ (Stadt, Tradition, Geld)
// plus Landesniveau (verschiebt sich über die Jahrzehnte) plus Zufall. Erfolge
// vergrößern einen Verein langsam, Abstiege lassen ihn schrumpfen. Keine
// künstlichen Ausgleiche: wer groß ist, bleibt meist oben – aber nicht immer.
//
// Aus den Ergebnissen ergeben sich Landesmeister, Pokalsieger, Koeffizienten
// (5-Jahres-Wertung) und daraus die Europapokal-Starter der nächsten Saison.
// =============================================================================

import { allEuroClubs, EuroClub, EuroCompId } from '../data/europe';
import { COUNTRY_SEEDS } from '../data/worldSeed';
import { CupState } from '../types';
import { WorldSeasonRecord, WorldState, WORLD_TABLES_KEEP } from './worldTypes';
import { clamp, gauss, hash, poisson, rng } from './worldRandom';
import { applySplits, countryLevel, ensureCountryPool, fillCountry, makeCountry, softClubStrength, targetStrength } from './worldCountries';
import { euroParticipants, pushCoef, seasonEuroPoints } from './worldEuro';
import { notePlaces } from './worldPlaces';

// Aufgeteilt (Dateien < 600 Zeilen): Typen in worldTypes.ts, Länder/Vereine/Teilungen in
// worldCountries.ts, Koeffizienten/Rangliste/Starter in worldEuro.ts – hier weitergereicht.
export * from './worldTypes';
export { REP_LEVEL_K, legacyCountryLevel, countryLevel, softClubStrength, makeCountry, fillCountry, ensureCountryPools, ensureCountryPool, applySplits } from './worldCountries';
export { seasonEuroPoints, coefSum, countryRanking, germanRank, euroParticipants } from './worldEuro';

// -----------------------------------------------------------------------------
// Aufbau 1975
// -----------------------------------------------------------------------------
export function initWorld(euroClubs: Record<string, EuroClub>, year = 1975, opts?: WorldInitOpts): WorldState {
  const w: WorldState = {
    version: 1, countries: {}, meta: {}, germanCoef: [], participants: null, history: [], nextId: 1,
  };
  const r = rng(hash('world-init'));
  for (const seed of COUNTRY_SEEDS) w.countries[seed.name] = makeCountry(seed);
  // Bekannte Europapokal-Vereine als Spitzenclubs ihres Landes übernehmen.
  const known = Object.values(allEuroClubs()).filter((c) => euroClubs[c.id]);
  for (const ec of known) {
    const c = w.countries[ec.country];
    if (!c) continue;
    const level = countryLevel(c, year);
    const size = clamp((ec.strength - level + 5) / 16, 0.3, 0.95);
    w.meta[ec.id] = { country: c.name, size, home: size, cycle: 0 };
    c.tiers[0].push(ec.id);
    c.spareCities = c.spareCities.filter((x) => x !== ec.city);
  }
  for (const c of Object.values(w.countries)) {
    // Zu viele bekannte Vereine? Schwächste in die 2. Liga.
    c.tiers[0].sort((a, b) => euroClubs[b].strength - euroClubs[a].strength);
    while (c.tiers[0].length > c.tier1) c.tiers[1].push(c.tiers[0].pop()!);
    fillCountry(w, euroClubs, c, year, r);
    c.lastTable = [...c.tiers[0]].sort((a, b) => euroClubs[b].strength - euroClubs[a].strength);
  }
  // Start in einem späteren Jahr / mit Weltdaten / anderem Heimatland (engine/worldData.ts).
  if (opts?.overlay) opts.overlay(w, euroClubs, year, r);
  return w;
}

/** Erweiterung des Aufbaus (Startjahr, Weltdaten, Heimatland) – siehe engine/worldData.ts. */
export interface WorldInitOpts {
  overlay?: (w: WorldState, euroClubs: Record<string, EuroClub>, year: number, r: () => number) => void;
}

/** Schlüssel des Heimatlandes in der Koeffizienten-Rechnung (früher fest „Deutschland“). */
const HOME_KEY = '__home__';

/** Länder, deren Ligen das Spiel selbst Spiel für Spiel rechnet (voll simulierte Länder). */
/** `next` = fertige Ligen der Folgesaison (Länder „Spiel für Spiel“); fehlt es, regelt die Welt Auf- und Abstieg selbst. */
export interface FixedCountryResult { t1: string[]; t2: string[]; next?: string[][]; /** Pokalsieger aus dem ausgespielten Landespokal (game/worldCups.ts). */ cup?: string }

// -----------------------------------------------------------------------------
// Eine Liga durchrechnen
// -----------------------------------------------------------------------------
interface Row { id: string; pts: number; gd: number; gf: number }

/**
 * Ergebnis eines Ligaspiels der Welt: Poisson-Tore aus dem Stärkeunterschied mit Heimvorteil.
 * Dasselbe Modell für die Saison in einem Zug (`playLeague`) und die Spieltag-Simulation
 * der Auslandsligen (game/worldLeagues.ts) – so bleibt die Dominanz der Großen je Land gleich.
 */
export function worldMatchGoals(homeStr: number, awayStr: number, r: () => number): [number, number] {
  const diff = (homeStr - awayStr) / 10;
  const lh = clamp(1.45 * Math.exp(diff * 0.55), 0.25, 4);
  const la = clamp(1.1 * Math.exp(-diff * 0.55), 0.2, 3.5);
  return [poisson(lh, r), poisson(la, r)];
}

function playLeague(ids: string[], euroClubs: Record<string, EuroClub>, winPts: number, r: () => number): string[] {
  const rows: Record<string, Row> = {};
  for (const id of ids) rows[id] = { id, pts: 0, gd: 0, gf: 0 };
  for (const h of ids) {
    for (const a of ids) {
      if (h === a) continue;
      const [gh, ga] = worldMatchGoals(euroClubs[h].strength, euroClubs[a].strength, r);
      const rh = rows[h], ra = rows[a];
      rh.gf += gh; ra.gf += ga; rh.gd += gh - ga; ra.gd += ga - gh;
      if (gh > ga) rh.pts += winPts; else if (ga > gh) ra.pts += winPts; else { rh.pts++; ra.pts++; }
    }
  }
  return Object.values(rows)
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.id.localeCompare(y.id))
    .map((x) => x.id);
}

/** Pokalsieger: K.-o.-Lotterie mit Stärke-Gewichtung (Außenseiter gewinnen manchmal). */
function playCup(ids: string[], euroClubs: Record<string, EuroClub>, r: () => number): string {
  let field = [...ids].sort(() => r() - 0.5);
  while (field.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < field.length; i += 2) {
      const a = field[i], b = field[i + 1];
      if (!b) { next.push(a); continue; }
      const d = euroClubs[a].strength - euroClubs[b].strength;
      const pA = 1 / (1 + Math.exp(-d / 5));
      next.push(r() < pA ? a : b);
    }
    field = next;
  }
  return field[0];
}

// -----------------------------------------------------------------------------
// Saisonwechsel
// -----------------------------------------------------------------------------
export interface WorldSeasonResult {
  notes: string[];
  participants: Record<EuroCompId, string[]>;
}

/**
 * Rechnet die abgelaufene Saison aller ausländischen Ligen durch, wertet den
 * Europapokal aus und bestimmt die ausländischen Starter der neuen Saison.
 * @param endYear      Kalenderjahr des Saisonendes (z. B. 1976 für 1975/76)
 * @param winPts       Punkte pro Sieg (2 bzw. 3 ab 1995)
 * @param germanIds    IDs der deutschen Vereine (für den deutschen Koeffizienten)
 */
export function advanceWorldSeason(
  w: WorldState, euroClubs: Record<string, EuroClub>, season: string, endYear: number,
  winPts: number, cups: Record<EuroCompId, CupState | null> | undefined,
  isGerman: (id: string) => boolean,
  fixed?: Record<string, FixedCountryResult>,
  /** Ligaruf fortschreiben (engine/leagueRep.ts) – nach Koeffizienten und Teilungen, vor der Stärkeentwicklung. */
  beforeStrength?: (endYear: number) => void,
): WorldSeasonResult {
  const r = rng(hash(`world:${season}`));
  const notes: string[] = [];
  const rec: WorldSeasonRecord = { season, champions: {}, cupWinners: {} };

  // 1) Koeffizienten aus dem abgelaufenen Europapokal
  const pts = seasonEuroPoints(cups);
  const byCountry: Record<string, { p: number; n: number }> = {};
  const add = (country: string, id: string) => {
    const e = (byCountry[country] ??= { p: 0, n: 0 });
    e.p += pts[id]; e.n++;
  };
  for (const id of Object.keys(pts)) {
    if (isGerman(id)) add(HOME_KEY, id);
    else if (euroClubs[id]) add(euroClubs[id].country, id);
  }
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const e = byCountry[c.name];
    pushCoef(c.coef, e ? e.p / e.n : 0);
  }
  const de = byCountry[HOME_KEY];
  pushCoef(w.germanCoef, de ? de.p / de.n : 0);
  // Europapokal-Erfolg vergrößert Vereine leicht (Geld, Ruf).
  for (const [id, p] of Object.entries(pts)) {
    const m = w.meta[id];
    if (m) m.size = clamp(m.size + (p - 3) * 0.004, 0, 1);
  }

  // 2) Ligen spielen
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const fx = fixed?.[c.name];
    // Vorgegebene Endtabelle (Spiel für Spiel bzw. schlanke Spieltag-Simulation); fehlende Vereine hinten anfügen,
    // eine nicht vorgegebene 2. Liga rechnet die Welt selbst.
    const given = (ids: string[], tier: string[]) => { const got = ids.filter((id) => w.meta[id]); return fx?.next ? got : [...got, ...tier.filter((id) => !got.includes(id))]; };
    const t1 = fx ? given(fx.t1, c.tiers[0]) : playLeague(c.tiers[0], euroClubs, winPts, r);
    const t2 = fx && (fx.t2.length || fx.next) ? given(fx.t2, c.tiers[1]) : playLeague(c.tiers[1], euroClubs, winPts, r);
    const champ = t1[0];
    const cupWinner = fx?.cup && w.meta[fx.cup] ? fx.cup : playCup([...c.tiers[0], ...c.tiers[1]], euroClubs, r);
    c.lastTable = t1;
    c.lastChampion = champ;
    c.lastCupWinner = cupWinner;
    c.titles[champ] = (c.titles[champ] ?? 0) + 1;
    rec.champions[c.name] = champ;
    rec.cupWinners[c.name] = cupWinner;
    (rec.tables ??= {})[c.name] = [...t1];
    notePlaces(w, endYear - 1, t1, t2); // komplette Platzierungs-Historie je Verein (engine/worldPlaces.ts)

    // Größe: Meister/Spitzenplätze wachsen, Absteiger schrumpfen.
    t1.forEach((id, i) => {
      const m = w.meta[id];
      const rel = 1 - i / Math.max(1, t1.length - 1);
      m.size = clamp(m.size + (rel - 0.55) * 0.012 + (i === 0 ? 0.006 : 0), 0, 1);
    });
    t2.forEach((id, i) => {
      const m = w.meta[id];
      m.size = clamp(m.size + (i < 3 ? 0.01 : -0.004), 0, 1);
    });

    // Auf-/Abstieg (3 bei großen Ligen, 2 bei kleinen)
    if (fx?.next) { c.tiers = [fx.next[0].filter((id) => w.meta[id]), fx.next[1].filter((id) => w.meta[id])]; continue; }
    const n = !t2.length ? 0 : c.tier1 >= 16 ? 3 : 2;
    const down = n ? t1.slice(-n) : [], up = t2.slice(0, n);
    c.tiers[0] = [...t1.slice(0, t1.length - n), ...up];
    c.tiers[1] = [...t2.slice(n), ...down];
    // 2. Liga ↔ Unterbau: die zwei Letzten gegen die zwei stärksten Amateurvereine (mit Zufall).
    if (t2.length >= 8) {
      ensureCountryPool(w, euroClubs, c, endYear, r);
      const pool = (c.pool ?? []).filter((id) => euroClubs[id]);
      const rank = pool.map((id) => ({ id, v: euroClubs[id].strength + gauss(r) * 3 })).sort((a, b) => b.v - a.v);
      const k = Math.min(2, rank.length);
      const out = t2.slice(-k).filter((id) => !up.includes(id));
      const inn = rank.slice(0, out.length).map((x) => x.id);
      c.tiers[1] = [...c.tiers[1].filter((id) => !out.includes(id)), ...inn];
      c.pool = [...pool.filter((id) => !inn.includes(id)), ...out];
    }
  }

  // 3) Staatenteilungen (vor der Stärkeentwicklung, damit neue Ligen mitlaufen)
  notes.push(...applySplits(w, euroClubs, endYear, r));
  beforeStrength?.(endYear);

  // 4) Stärke für die neue Saison: Zug zur Zielstärke + Zufall
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const level = countryLevel(c, endYear);
    c.tiers.forEach((ids, t) => {
      for (const id of ids) {
        const club = euroClubs[id];
        const m = w.meta[id];
        // Natürliche Größe driftet über Jahrzehnte (Stadtentwicklung, Investoren, Niedergang):
        // ohne Drift gewann derselbe Verein oft 30+ von 50 Titeln (z. B. England).
        m.home = clamp(m.home + gauss(r) * 0.02, 0.1, 0.95);
        m.size = clamp(m.size + (m.home - m.size) * 0.06 + gauss(r) * 0.01, 0, 1);
        m.cycle = m.cycle * 0.85 + gauss(r) * 2.6;
        const target = softClubStrength(targetStrength(level, m.size, t) + m.cycle);
        club.strength = Math.round(clamp(club.strength + (target - club.strength) * 0.4 + gauss(r) * 1.5, 40, 86));
      }
    });
  }

  // 4b) Unterbau: Amateurniveau unterhalb der 2. Liga
  for (const c of Object.values(w.countries)) {
    if (!c.active || !c.pool?.length) continue;
    const level = countryLevel(c, endYear);
    for (const id of c.pool) {
      const club = euroClubs[id], m = w.meta[id];
      if (!club || !m) continue;
      m.size = clamp(m.size + gauss(r) * 0.01, 0.02, 0.3);
      const target = targetStrength(level, m.size, 1) - 4;
      club.strength = Math.round(clamp(club.strength + (target - club.strength) * 0.4 + gauss(r) * 1.5, 35, 80));
    }
  }

  // 5) Starter der neuen Saison
  const participants = euroParticipants(w, euroClubs, endYear);
  w.participants = participants;
  w.history.push(rec);
  if (w.history.length > 60) w.history.shift();
  for (let i = 0; i < w.history.length - WORLD_TABLES_KEEP; i++) { delete w.history[i].tables; delete w.history[i].divs; delete w.history[i].cups; delete w.history[i].scorers; delete w.history[i].pstats; }
  return { notes, participants };
}
