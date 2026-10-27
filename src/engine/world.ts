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

import { allEuroClubs, EuroClub, EuroCompId, EURO_FOREIGN_COUNT } from '../data/europe';
import { COUNTRY_SEEDS, COUNTRY_SPLITS, COUNTRY_TRENDS, CountrySeed, EURO_EXCLUSIONS } from '../data/worldSeed';
import { CupState } from '../types';

export interface WorldCountry {
  name: string;
  origin: string;
  /** Grundniveau 1975 (Trends werden je Jahr addiert). */
  base: number;
  tier1: number;
  tier2: number;
  /** Liga-Ebenen: [1. Liga, 2. Liga] mit Vereins-IDs. */
  tiers: string[][];
  /** Ungenutzte Städte für Nachrücker. */
  spareCities: string[];
  /** Letzte Endtabelle der 1. Liga (IDs nach Platz). */
  lastTable: string[];
  lastChampion?: string;
  lastCupWinner?: string;
  /** Koeffizienten-Punkte der letzten fünf Saisons (neueste zuletzt). */
  coef: number[];
  /** Meistertitel je Verein (für Chronik/Übersicht). */
  titles: Record<string, number>;
  active: boolean;
}

export interface WorldClubMeta {
  country: string;
  /** Größe 0..1 (Einzugsgebiet, Tradition, Wirtschaftskraft) – wächst mit Erfolg. */
  size: number;
  /** Natürliche Größe (Stadt, Tradition): dahin kehrt `size` langsam zurück. */
  home: number;
  /** Generationen-Zyklus: goldene und magere Jahre (langsamer Zufallsprozess). */
  cycle: number;
}

export interface WorldSeasonRecord {
  season: string;
  champions: Record<string, string>;
  cupWinners: Record<string, string>;
}

export interface WorldState {
  version: 1;
  countries: Record<string, WorldCountry>;
  meta: Record<string, WorldClubMeta>;
  /** Koeffizient Deutschlands (gleiche Wertung, für die Rangliste). */
  germanCoef: number[];
  /** Europapokal-Starter der aktuellen Saison (ausländische IDs je Wettbewerb). */
  participants: Record<EuroCompId, string[]> | null;
  history: WorldSeasonRecord[];
  nextId: number;
}

/** Auslandsverein (Europa-Simulation) statt deutscher Verein? */
export const isForeignId = (id: string) => id.startsWith('eu_') || id.startsWith('w_');

// -----------------------------------------------------------------------------
// Zufall (deterministisch je Saison)
// -----------------------------------------------------------------------------
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function gauss(r: () => number): number {
  return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
}
function poisson(lambda: number, r: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L && k < 12);
  return k - 1;
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Landesniveau im Jahr X
// -----------------------------------------------------------------------------
export function countryLevel(c: WorldCountry, year: number): number {
  let delta = 0;
  for (const [y, d] of COUNTRY_TRENDS[c.name] ?? []) if (year >= y) delta = d;
  return c.base + delta;
}

/** Zielstärke eines Vereins aus Landesniveau und Größe. */
function targetStrength(level: number, size: number, tier: number): number {
  return level - 5 + size * 16 - (tier === 1 ? 6 : 0);
}

// -----------------------------------------------------------------------------
// Farben/Namen für erfundene Vereine
// -----------------------------------------------------------------------------
const COLOR_PAIRS: [string, string, string][] = [
  ['Rot', '#C8102E', '#FFFFFF'], ['Blau', '#1B458F', '#FFFFFF'], ['Grün', '#00843D', '#FFFFFF'],
  ['Gelb', '#FFD100', '#000000'], ['Schwarz', '#111111', '#FFFFFF'], ['Weiß', '#FFFFFF', '#1B458F'],
  ['Violett', '#5B2C83', '#FFFFFF'], ['Orange', '#F28C00', '#000000'], ['Himmelblau', '#6CABDD', '#FFFFFF'],
  ['Weinrot', '#7A263A', '#FFFFFF'],
];

function makeShort(name: string, used: Set<string>): string {
  const letters = name.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase();
  let s = letters.slice(0, 3).padEnd(3, 'X');
  let i = 3;
  while (used.has(s) && i < letters.length) { s = letters.slice(0, 2) + letters[i]; i++; }
  used.add(s);
  return s;
}

function newClub(
  w: WorldState, euroClubs: Record<string, EuroClub>, country: WorldCountry,
  city: string, strength: number, size: number, r: () => number, usedShort: Set<string>,
): string {
  const takenNames = new Set(Object.values(euroClubs).filter((c) => c.country === country.name).map((c) => c.name));
  let name = city;
  let pair = COLOR_PAIRS[Math.floor(r() * COLOR_PAIRS.length)];
  if (takenNames.has(name)) {
    for (const p of COLOR_PAIRS) {
      if (!takenNames.has(`${city} ${p[0]}`)) { name = `${city} ${p[0]}`; pair = p; break; }
    }
  }
  const id = `w_${w.nextId++}`;
  euroClubs[id] = {
    id, name, shortName: makeShort(name, usedShort), city, country: country.name,
    strength: Math.round(strength), colors: { primary: pair[1], secondary: pair[2] }, comp: 'uefa',
  };
  w.meta[id] = { country: country.name, size, home: size, cycle: 0 };
  return id;
}

function makeCountry(seed: CountrySeed): WorldCountry {
  return {
    name: seed.name, origin: seed.origin, base: seed.base, tier1: seed.tier1, tier2: seed.tier2,
    tiers: [[], []], spareCities: [...seed.cities], lastTable: [], coef: [], titles: {}, active: true,
  };
}

/** Füllt die Ligen eines Landes mit erfundenen Vereinen auf die Sollgröße auf. */
function fillCountry(
  w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, year: number, r: () => number,
): void {
  const used = new Set(Object.values(euroClubs).map((e) => e.shortName));
  const level = countryLevel(c, year);
  const sizes = [c.tier1, c.tier2];
  for (let t = 0; t < 2; t++) {
    while (c.tiers[t].length < sizes[t]) {
      // Keine freie Stadt mehr? Dann zweiter Verein in einer bestehenden Stadt (mit Farbe).
      const cities = [...c.tiers[0], ...c.tiers[1]].map((id) => euroClubs[id].city);
      const city = c.spareCities.shift() ?? cities[Math.floor(r() * Math.min(8, cities.length))] ?? c.name;
      // Die ersten Städte der Liste sind die größten: absteigende Größe mit Streuung.
      const k = c.tiers[t].length;
      const size = t === 0
        ? clamp(0.78 - k * 0.045 + gauss(r) * 0.06, 0.08, 0.85)
        : clamp(0.3 - k * 0.012 + gauss(r) * 0.05, 0.02, 0.4);
      const s = targetStrength(level, size, t) + gauss(r) * 1.5;
      c.tiers[t].push(newClub(w, euroClubs, c, city, s, size, r, used));
    }
  }
}

// -----------------------------------------------------------------------------
// Aufbau 1975
// -----------------------------------------------------------------------------
export function initWorld(euroClubs: Record<string, EuroClub>, year = 1975): WorldState {
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
  return w;
}

// -----------------------------------------------------------------------------
// Eine Liga durchrechnen
// -----------------------------------------------------------------------------
interface Row { id: string; pts: number; gd: number; gf: number }

function playLeague(ids: string[], euroClubs: Record<string, EuroClub>, winPts: number, r: () => number): string[] {
  const rows: Record<string, Row> = {};
  for (const id of ids) rows[id] = { id, pts: 0, gd: 0, gf: 0 };
  for (const h of ids) {
    for (const a of ids) {
      if (h === a) continue;
      const diff = (euroClubs[h].strength - euroClubs[a].strength) / 10;
      const lh = clamp(1.45 * Math.exp(diff * 0.55), 0.25, 4);
      const la = clamp(1.1 * Math.exp(-diff * 0.55), 0.2, 3.5);
      const gh = poisson(lh, r), ga = poisson(la, r);
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
// Staatenteilungen
// -----------------------------------------------------------------------------
function applySplits(w: WorldState, euroClubs: Record<string, EuroClub>, year: number, r: () => number): string[] {
  const notes: string[] = [];
  for (const sp of COUNTRY_SPLITS) {
    if (sp.year !== year) continue;
    const old = w.countries[sp.from];
    if (!old || !old.active) continue;
    const all = [...old.tiers[0], ...old.tiers[1]];
    for (const part of sp.parts) {
      const nc = makeCountry(part);
      nc.spareCities = part.cities.filter((city) => !all.some((id) => euroClubs[id].city === city));
      w.countries[part.name] = nc;
    }
    const restName = sp.renameRest ?? sp.from;
    const rest = sp.renameRest ? makeCountry({
      name: restName, origin: sp.restOrigin ?? old.origin, base: old.base + (sp.restBaseDelta ?? 0),
      tier1: old.tier1, tier2: old.tier2, cities: sp.restCities ?? [],
    }) : old;
    // Vereine nach Stadt verteilen (Reihenfolge = bisherige Stärke).
    all.sort((a, b) => euroClubs[b].strength - euroClubs[a].strength);
    for (const id of all) {
      const club = euroClubs[id];
      if (sp.dropCities.includes(club.city)) { delete w.meta[id]; continue; }
      const part = sp.parts.find((p) => p.cities.includes(club.city));
      const target = part ? w.countries[part.name] : rest;
      club.country = target.name;
      w.meta[id].country = target.name;
      const t = target.tiers[0].length < target.tier1 ? 0 : 1;
      if (target.tiers[t].length < (t === 0 ? target.tier1 : target.tier2)) target.tiers[t].push(id);
      else delete w.meta[id];
    }
    if (sp.renameRest) {
      rest.coef = [...old.coef];
      old.active = false;
      old.tiers = [[], []];
      w.countries[restName] = rest;
    }
    for (const p of sp.parts) w.countries[p.name].coef = old.coef.map((v) => v * 0.6);
    for (const name of [restName, ...sp.parts.map((p) => p.name)]) {
      fillCountry(w, euroClubs, w.countries[name], year, r);
    }
    notes.push(`${sp.from} zerfällt: neue Ligen in ${[restName, ...sp.parts.map((p) => p.name)].join(', ')}.`);
  }
  return notes;
}

// -----------------------------------------------------------------------------
// Koeffizienten aus den Europapokal-Ergebnissen
// -----------------------------------------------------------------------------
export function seasonEuroPoints(cups: Record<EuroCompId, CupState | null> | undefined): Record<string, number> {
  const pts: Record<string, number> = {};
  if (!cups) return pts;
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const cup = cups[comp];
    if (!cup) continue;
    for (const id of cup.participantIds) pts[id] = (pts[id] ?? 0) + 1;
    for (const round of cup.rounds) {
      for (const t of round.ties) if (t.winnerClubId) pts[t.winnerClubId] = (pts[t.winnerClubId] ?? 0) + 2;
    }
    if (cup.winnerClubId) pts[cup.winnerClubId] = (pts[cup.winnerClubId] ?? 0) + 2;
  }
  return pts;
}

function pushCoef(arr: number[], v: number): void {
  arr.push(Math.round(v * 100) / 100);
  while (arr.length > 5) arr.shift();
}
export const coefSum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

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
    if (isGerman(id)) add('Deutschland', id);
    else if (euroClubs[id]) add(euroClubs[id].country, id);
  }
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const e = byCountry[c.name];
    pushCoef(c.coef, e ? e.p / e.n : 0);
  }
  const de = byCountry['Deutschland'];
  pushCoef(w.germanCoef, de ? de.p / de.n : 0);
  // Europapokal-Erfolg vergrößert Vereine leicht (Geld, Ruf).
  for (const [id, p] of Object.entries(pts)) {
    const m = w.meta[id];
    if (m) m.size = clamp(m.size + (p - 3) * 0.004, 0, 1);
  }

  // 2) Ligen spielen
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const t1 = playLeague(c.tiers[0], euroClubs, winPts, r);
    const t2 = playLeague(c.tiers[1], euroClubs, winPts, r);
    const champ = t1[0];
    const cupWinner = playCup([...c.tiers[0], ...c.tiers[1]], euroClubs, r);
    c.lastTable = t1;
    c.lastChampion = champ;
    c.lastCupWinner = cupWinner;
    c.titles[champ] = (c.titles[champ] ?? 0) + 1;
    rec.champions[c.name] = champ;
    rec.cupWinners[c.name] = cupWinner;

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
    const n = c.tier1 >= 16 ? 3 : 2;
    const down = t1.slice(-n), up = t2.slice(0, n);
    c.tiers[0] = [...t1.slice(0, t1.length - n), ...up];
    c.tiers[1] = [...t2.slice(n), ...down];
  }

  // 3) Staatenteilungen (vor der Stärkeentwicklung, damit neue Ligen mitlaufen)
  notes.push(...applySplits(w, euroClubs, endYear, r));

  // 4) Stärke für die neue Saison: Zug zur Zielstärke + Zufall
  for (const c of Object.values(w.countries)) {
    if (!c.active) continue;
    const level = countryLevel(c, endYear);
    c.tiers.forEach((ids, t) => {
      for (const id of ids) {
        const club = euroClubs[id];
        const m = w.meta[id];
        m.size = clamp(m.size + (m.home - m.size) * 0.06 + gauss(r) * 0.01, 0, 1);
        m.cycle = m.cycle * 0.8 + gauss(r) * 2.2;
        const target = targetStrength(level, m.size, t) + m.cycle;
        club.strength = Math.round(clamp(club.strength + (target - club.strength) * 0.4 + gauss(r) * 1.5, 40, 92));
      }
    });
  }

  // 5) Starter der neuen Saison
  const participants = euroParticipants(w, euroClubs, endYear);
  w.participants = participants;
  w.history.push(rec);
  if (w.history.length > 60) w.history.shift();
  return { notes, participants };
}

/** Rangliste der Länder nach 5-Jahres-Koeffizient (ohne Deutschland). */
export function countryRanking(w: WorldState, year: number): WorldCountry[] {
  return Object.values(w.countries)
    .filter((c) => c.active && !EURO_EXCLUSIONS.some((e) => e.country === c.name && year >= e.from && year <= e.to))
    .sort((a, b) => coefSum(b.coef) - coefSum(a.coef) || countryLevel(b, year) - countryLevel(a, year));
}

/**
 * Ausländische Starter: Meister der 15 bestplatzierten Länder (Landesmeister),
 * Pokalsieger der 15 bestplatzierten (bzw. Finalgegner-Ersatz: nächster der Tabelle),
 * Europa-Pokal: 29 Plätze nach Koeffizienten-Rang (3/2/1 Starter je Land).
 */
export function euroParticipants(w: WorldState, euroClubs: Record<string, EuroClub>, year: number): Record<EuroCompId, string[]> {
  const rank = countryRanking(w, year);
  const out: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  const taken = new Set<string>();
  const nextFromTable = (c: WorldCountry) => c.lastTable.find((id) => !taken.has(id) && euroClubs[id] && w.meta[id]);

  for (const c of rank) {
    if (out.ec.length >= EURO_FOREIGN_COUNT.ec) break;
    const id = c.lastChampion && w.meta[c.lastChampion] ? c.lastChampion : nextFromTable(c);
    if (id) { out.ec.push(id); taken.add(id); }
  }
  for (const c of rank) {
    if (out.cwc.length >= EURO_FOREIGN_COUNT.cwc) break;
    let id = c.lastCupWinner && w.meta[c.lastCupWinner] && !taken.has(c.lastCupWinner) ? c.lastCupWinner : undefined;
    if (!id) id = nextFromTable(c);
    if (id) { out.cwc.push(id); taken.add(id); }
  }
  // Europa-Pokal: Plätze nach Rang verteilen, Rest auffüllen.
  const slotsFor = (i: number) => (i < 2 ? 3 : i < 9 ? 2 : 1);
  let round = 0;
  while (out.uefa.length < EURO_FOREIGN_COUNT.uefa && round < 6) {
    rank.forEach((c, i) => {
      if (out.uefa.length >= EURO_FOREIGN_COUNT.uefa) return;
      const want = round === 0 ? slotsFor(i) : 1;
      for (let k = 0; k < want && out.uefa.length < EURO_FOREIGN_COUNT.uefa; k++) {
        const id = nextFromTable(c);
        if (id) { out.uefa.push(id); taken.add(id); }
      }
    });
    round++;
  }
  // Für die Simulation im Pokal wird `comp` mitgeführt (nur informativ).
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) for (const id of out[comp]) euroClubs[id].comp = comp;
  return out;
}
