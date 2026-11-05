// =============================================================================
// Europa im Hintergrund mit Weltdaten, Startjahr und Heimatland
// -----------------------------------------------------------------------------
// Ergänzt initWorld (engine/world.ts):
//  1. Staatsteilungen bis zum Startjahr vorwegnehmen (UdSSR/Jugoslawien 1992, ČSSR 1993).
//  2. Länder mit Saisondaten (data/world/index.ts): Ligen aus den echten (verfremdeten)
//     Vereinen; IDs `w_<realId>`; letzte Tabelle/Meister/Pokalsieger aus der Vorsaison.
//  3. Heimatland ≠ Deutschland: dieses Land aus dem Hintergrund nehmen, Deutschland
//     (und bis 1990 die DDR) als Hintergrundländer aufnehmen.
//  4. Europapokal-Starter der Startsaison: Formatplätze nach Koeffizienten-Rang, für
//     Länder mit Daten die echten Teilnehmer (`euro`).
// Ohne Daten, Start 1975 und Deutschland bleibt alles wie bisher (overlay entfällt).
// =============================================================================
import type { EuroClub, EuroCompId } from '../data/europe';
import { COUNTRY_SPLITS } from '../data/worldSeed';
import { CLUB_SEEDS, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS } from '../data/generate';
import { DDR_LIGA_SEEDS, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { COUNTRY_BY_CC, COUNTRY_BY_KEY, countryExists, WORLD_COUNTRIES } from '../data/world/countries';
import { worldSeason } from '../data/world/index';
import type { EuroComp, SeasonRow } from '../data/world/types';
import { countryLevelOf, identOf } from '../game/worldCompose';
import { applySplits, euroParticipants, fillCountry, makeCountry, WorldState } from './world';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Interne ID eines Hintergrund-Vereins aus den Weltdaten. */
export const worldId = (realId: string) => `w_${realId}`;

/** Weltdaten-Wettbewerb → Wettbewerb im Spiel (CL = Landesmeister, EL = UEFA, ECL = dritter Wettbewerb). */
export const EURO_MAP: Record<EuroComp, EuroCompId> = { ec: 'ec', cl: 'ec', cwc: 'cwc', ecl: 'cwc', uefa: 'uefa', el: 'uefa' };

export interface OverlayOpts {
  /** Heimatland (Code); Standard Deutschland. */
  home: string;
}

/** Braucht der Start die Erweiterung? (Sonst bleibt der Aufbau von 1975 unverändert.) */
export function needsOverlay(year: number, home: string): boolean {
  if (year !== 1975 || home !== 'ger') return true;
  return WORLD_COUNTRIES.some((c) => c.cc !== 'ger' && c.cc !== 'gdr' && !!worldSeason(c.cc, year));
}

function strengthFor(level: number, share: number, tier: number): number {
  return Math.round(clamp(tier === 0 ? level + 9 - share * 16 : level - 6 - share * 8, 40, 90));
}

function dataCountry(w: WorldState, euroClubs: Record<string, EuroClub>, cc: string, year: number, row: SeasonRow, r: () => number): void {
  const def = COUNTRY_BY_CC[cc];
  const key = def.key;
  let c = w.countries[key];
  if (!c) {
    c = makeCountry({ name: key, origin: def.origin, base: countryLevelOf(cc, year), tier1: row.t1.length, tier2: row.t2?.length || def.t2 || 10, cities: [] });
    w.countries[key] = c;
  }
  // Bisherige (erfundene/bekannte) Vereine des Landes entfernen.
  for (const id of [...c.tiers[0], ...c.tiers[1]]) { delete w.meta[id]; if (id.startsWith('w_') || id.startsWith('eu_')) delete euroClubs[id]; }
  for (const e of Object.values(euroClubs)) if (e.country === key && e.id.startsWith('eu_')) delete euroClubs[e.id];
  c.tiers = [[], []];
  c.active = true;
  c.tier1 = row.t1.length;
  c.tier2 = (row.t2?.length ?? 0) + (row.t2b?.length ?? 0) || c.tier2 || def.t2 || 10;
  const level = countryLevelOf(cc, year);
  const prev = worldSeason(cc, year - 1);
  const ranked = (ids: string[]) => ids.map((id, i) => ({ id, share: i / Math.max(1, ids.length - 1) }));
  const lists: [string[], number][] = [[row.t1, 0], [[...(row.t2 ?? []), ...(row.t2b ?? [])], 1]];
  for (const [ids, t] of lists) {
    // Stärke aus der Vorsaison, wenn vorhanden (keine Vorhersage des Saisonausgangs).
    const order = prev ? [...prev.t1, ...(prev.t2 ?? []), ...(prev.t2b ?? [])] : ids;
    for (const { id, share } of ranked(ids)) {
      const ident = identOf(cc, id, year);
      if (!ident) continue;
      const pi = order.indexOf(id);
      const s = pi >= 0 && prev ? (pi < prev.t1.length ? pi / Math.max(1, prev.t1.length - 1) : 1) : share;
      const wid = worldId(id);
      euroClubs[wid] = {
        id: wid, name: ident.name, shortName: ident.shortName, city: ident.city, country: key,
        strength: strengthFor(level, s, t), colors: { primary: ident.primary, secondary: ident.secondary }, comp: 'uefa',
      };
      const size = clamp(t === 0 ? 0.8 - s * 0.6 : 0.3 - s * 0.25, 0.05, 0.9);
      w.meta[wid] = { country: key, size, home: size, cycle: 0 };
      c.tiers[t].push(wid);
    }
  }
  fillCountry(w, euroClubs, c, year, r);
  const prevT1 = prev?.t1.map(worldId).filter((id) => w.meta[id]) ?? [];
  c.lastTable = prevT1.length >= 4 ? prevT1 : [...c.tiers[0]].sort((a, b) => euroClubs[b].strength - euroClubs[a].strength);
  c.lastChampion = c.lastTable[0];
  const cw = prev?.cup ? worldId(prev.cup) : undefined;
  c.lastCupWinner = cw && w.meta[cw] ? cw : undefined;
}

/** Deutschland (und DDR) als Hintergrundländer, wenn das Heimatland woanders liegt. */
function germanyAbroad(w: WorldState, euroClubs: Record<string, EuroClub>, year: number, r: () => number): void {
  for (const cc of ['ger', 'gdr'] as const) {
    const def = COUNTRY_BY_CC[cc];
    if (!countryExists(def, year)) continue;
    const row = worldSeason(cc, year);
    if (row) { dataCountry(w, euroClubs, cc, year, row, r); continue; }
    const c = makeCountry({ name: def.key, origin: def.origin, base: countryLevelOf(cc, year), tier1: 0, tier2: 0, cities: [] });
    w.countries[def.key] = c;
    const level = countryLevelOf(cc, year);
    const t1 = cc === 'ger' ? CLUB_SEEDS.map((s) => s.id) : DDR_OBERLIGA_SEEDS.map((s) => s.id);
    const t2 = cc === 'ger' ? [...SECOND_LIGA_NORD_SEEDS, ...SECOND_LIGA_SUED_SEEDS].sort((a, b) => b.strength - a.strength).slice(0, 18).map((s) => s.id) : DDR_LIGA_SEEDS.slice(0, 14).map((s) => s.id);
    [t1, t2].forEach((ids, t) => ids.forEach((id, i) => {
      const ident = identOf(cc, id, year);
      if (!ident) return;
      const wid = worldId(id);
      const share = i / Math.max(1, ids.length - 1);
      euroClubs[wid] = { id: wid, name: ident.name, shortName: ident.shortName, city: ident.city, country: def.key, strength: strengthFor(level, share, t), colors: { primary: ident.primary, secondary: ident.secondary }, comp: 'uefa' };
      const size = clamp(t === 0 ? 0.8 - share * 0.6 : 0.3 - share * 0.25, 0.05, 0.9);
      w.meta[wid] = { country: def.key, size, home: size, cycle: 0 };
      c.tiers[t].push(wid);
    }));
    c.tier1 = c.tiers[0].length; c.tier2 = c.tiers[1].length;
    c.lastTable = [...c.tiers[0]];
    c.lastChampion = c.lastTable[0];
  }
}

/** Erweiterung für initWorld (engine/world.ts `WorldInitOpts.overlay`). */
export function worldOverlay(opts: OverlayOpts) {
  return (w: WorldState, euroClubs: Record<string, EuroClub>, year: number, r: () => number): void => {
    // 1) Teilungen bis zum Startjahr
    const splitYears = [...new Set(COUNTRY_SPLITS.map((s) => s.year))].sort((a, b) => a - b);
    for (const y of splitYears) if (y <= year) applySplits(w, euroClubs, y, r);
    // 2) Länder mit Daten
    for (const def of WORLD_COUNTRIES) {
      if (def.cc === opts.home || def.cc === 'ger' || def.cc === 'gdr' || !countryExists(def, year)) continue;
      const row = worldSeason(def.cc, year);
      if (row) dataCountry(w, euroClubs, def.cc, year, row, r);
    }
    // 3) Heimatland
    if (opts.home !== 'ger') {
      const key = COUNTRY_BY_CC[opts.home]?.key;
      const c = key ? w.countries[key] : undefined;
      if (c) {
        for (const id of [...c.tiers[0], ...c.tiers[1]]) { delete w.meta[id]; delete euroClubs[id]; }
        delete w.countries[key!];
      }
      for (const e of Object.values(euroClubs)) if (e.country === key) delete euroClubs[e.id];
      germanyAbroad(w, euroClubs, year, r);
    }
    // 4) Starter der Startsaison
    const part = euroParticipants(w, euroClubs, year);
    for (const def of WORLD_COUNTRIES) {
      if (def.cc === opts.home) continue;
      const row = worldSeason(def.cc, year);
      if (!row?.euro) continue;
      const mine = new Set(Object.values(euroClubs).filter((e) => e.country === def.key).map((e) => e.id));
      for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) part[comp] = part[comp].filter((id) => !mine.has(id));
      for (const [k, ids] of Object.entries(row.euro) as [EuroComp, string[]][]) {
        const comp = EURO_MAP[k];
        for (const id of ids ?? []) {
          const wid = worldId(id);
          if (euroClubs[wid] && !part.ec.includes(wid) && !part.cwc.includes(wid) && !part.uefa.includes(wid)) { part[comp].push(wid); euroClubs[wid].comp = comp; }
        }
      }
    }
    w.participants = part;
  };
}

/** Land eines Hintergrund-Vereins als Code (für Herkunft der Spieler). */
export function ccOfCountryKey(key: string): string | undefined { return COUNTRY_BY_KEY[key]?.cc; }
