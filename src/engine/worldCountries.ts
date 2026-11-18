// Länder der Hintergrund-Welt (engine/world.ts): Landesniveau, erfundene Vereine,
// Auffüllen der Ligen, Unterbau und Staatenteilungen.
import { EuroClub } from '../data/europe';
import { COUNTRY_SPLITS, COUNTRY_TRENDS, CountrySeed } from '../data/worldSeed';
import { WorldCountry, WorldState } from './worldTypes';
import { clamp, gauss, hash, rng } from './worldRandom';
import { worldStructureOfKey } from '../data/world/structure';

// -----------------------------------------------------------------------------
// Landesniveau im Jahr X
// -----------------------------------------------------------------------------
/** Stärkepunkte des Landesniveaus je Ruf-Punkt (20 Ruf ≈ 5 Punkte Vereinsstärke). */
export const REP_LEVEL_K = 0.25;

/** Landesniveau ohne Ligaruf: Grundniveau plus historische Verschiebung (COUNTRY_TRENDS). */
export function legacyCountryLevel(c: WorldCountry, year: number): number {
  let delta = 0;
  for (const [y, d] of COUNTRY_TRENDS[c.name] ?? []) if (year >= y) delta = d;
  return c.base + delta;
}

/** Landesniveau im Jahr: mit Ligaruf aus dem Ruf (engine/leagueRep.ts), sonst wie bisher. */
export function countryLevel(c: WorldCountry, year: number): number {
  if (c.rep != null && c.repBase != null) return c.repBase + REP_LEVEL_K * c.rep;
  return legacyCountryLevel(c, year);
}

/** Zielstärke eines Vereins aus Landesniveau und Größe. */
export function targetStrength(level: number, size: number, tier: number): number {
  return level - 5 + size * 16 - (tier === 1 ? 6 : 0);
}

/**
 * Obergrenze der Vereinsstärke (Wunsch Pascal, Maßstab EA FC): Die Stärke steht für den
 * Schnitt der 14 Stammkräfte. Die besten Vereine der Welt liegen dort bei ~84–85
 * (Startelf ~86–87) – oberhalb von 80 zählt nur die Hälfte, Deckel 86.
 */
export function softClubStrength(v: number): number {
  return Math.min(86, v > 80 ? 80 + (v - 80) * 0.5 : v);
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
    strength: Math.round(softClubStrength(strength)), colors: { primary: pair[1], secondary: pair[2] }, comp: 'uefa',
  };
  w.meta[id] = { country: country.name, size, home: size, cycle: 0 };
  return id;
}

export function makeCountry(seed: CountrySeed): WorldCountry {
  return {
    name: seed.name, origin: seed.origin, base: seed.base, tier1: seed.tier1, tier2: seed.tier2,
    tiers: [[], []], spareCities: [...seed.cities], lastTable: [], coef: [], titles: {}, active: true,
  };
}

/** Füllt die Ligen eines Landes mit erfundenen Vereinen auf die Sollgröße auf. */
export function fillCountry(
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

/** Unterbau aller aktiven Länder sicherstellen (Spielstart, Laden alter Spielstände). */
export function ensureCountryPools(w: WorldState | undefined, euroClubs: Record<string, EuroClub> | undefined, year: number): void {
  if (!w || !euroClubs) return;
  const r = rng(hash(`world-pool|${year}`));
  for (const c of Object.values(w.countries)) if (c.active && (c.tiers[1]?.length ?? 0) >= 8) ensureCountryPool(w, euroClubs, c, year, r);
}

/** Unterbau eines Landes anlegen bzw. auf 10 Vereine auffüllen (erfundene Vereine aus freien Städten). */
export function ensureCountryPool(w: WorldState, euroClubs: Record<string, EuroClub>, c: WorldCountry, year: number, r: () => number, min = 10): void {
  const pool = (c.pool ??= []).filter((id) => euroClubs[id]);
  c.pool = pool;
  if (pool.length >= min) return;
  const used = new Set(Object.values(euroClubs).map((e) => e.shortName));
  const level = countryLevel(c, year);
  const cities = [...c.tiers[0], ...c.tiers[1]].map((id) => euroClubs[id]?.city).filter(Boolean) as string[];
  while (c.pool.length < min) {
    const city = c.spareCities.shift() ?? cities[Math.floor(r() * Math.max(1, cities.length))] ?? c.name;
    const size = clamp(0.12 + gauss(r) * 0.05, 0.02, 0.3);
    c.pool.push(newClub(w, euroClubs, c, city, targetStrength(level, size, 1) - 4 + gauss(r) * 1.5, size, r, used));
  }
}

/** Ligagrößen eines neuen Landes nach der historischen Struktur der Saison (data/world/structure.ts). */
function sizeByStructure(c: WorldCountry, year: number): void {
  const st = worldStructureOfKey(c.name, year);
  if (!st) return;
  c.tier1 = st.t1;
  c.tier2 = st.t2 ?? c.tier2;
  // Mehrere Staffeln: fillCountry füllt die 2. Ebene in einem Stück, die Größen teilen sie (engine/worldSecond.ts).
  if (st.groups && st.groups.length > 1) c.groups = [...st.groups]; else delete c.groups;
}

// -----------------------------------------------------------------------------
// Staatenteilungen
// -----------------------------------------------------------------------------
export function applySplits(w: WorldState, euroClubs: Record<string, EuroClub>, year: number, r: () => number): string[] {
  const notes: string[] = [];
  for (const sp of COUNTRY_SPLITS) {
    if (sp.year !== year) continue;
    const old = w.countries[sp.from];
    if (!old || !old.active) continue;
    const all = [...old.tiers[0], ...old.tiers[1]];
    for (const part of sp.parts) {
      const nc = makeCountry(part);
      sizeByStructure(nc, year);
      nc.spareCities = part.cities.filter((city) => !all.some((id) => euroClubs[id].city === city));
      w.countries[part.name] = nc;
    }
    const restName = sp.renameRest ?? sp.from;
    const rest = sp.renameRest ? makeCountry({
      name: restName, origin: sp.restOrigin ?? old.origin, base: old.base + (sp.restBaseDelta ?? 0),
      tier1: old.tier1, tier2: old.tier2, cities: sp.restCities ?? [],
    }) : old;
    if (sp.renameRest) sizeByStructure(rest, year);
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
