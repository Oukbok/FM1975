// =============================================================================
// Länder „Spiel für Spiel“ (Wunsch Pascal: Simulationstiefe wählbar)
// -----------------------------------------------------------------------------
// Im Assistenten gewählte Länder laufen wie die 2. Liga: Spielplan, Tabelle Spieltag für
// Spieltag (engine/leagues.ts), Auf-/Abstieg am Saisonende. Vereine bleiben zugleich
// Hintergrund-Vereine (EuroClub) für Europapokal/Koeffizienten: am Saisonende übernimmt
// engine/world.ts die Endtabellen statt einer eigenen Rechnung (`FixedCountryResult`).
// Ebenen: tier = 200 + 10 × Index + Liga (1/2) – weit weg vom Heimat-Auf-/Abstieg (< 100)
// und der DDR (101/102). Optionales Feld `game.fullCountries`.
// =============================================================================
import { COUNTRY_BY_CC, WORLD_COUNTRIES } from '../data/world/countries';
import { homeCountryOf } from './state';
import type { EuroClub } from '../data/europe';
import { buildDivision, LeagueDivision, SimClub } from '../engine/leagues';
import type { FixedCountryResult } from '../engine/world';
import type { Game } from './state';

export const FULL_TIER_BASE = 200;
export const isFullDivision = (d: { tier: number }) => d.tier >= FULL_TIER_BASE;

function simOf(e: EuroClub, tier: number): SimClub {
  return { id: e.id, name: e.name, shortName: e.shortName, city: e.city, strength: e.strength, colors: { ...e.colors }, tier, group: null };
}

/** Länder, die Spiel für Spiel laufen können (aktiv in der Hintergrund-Welt, nicht das Heimatland). */
export function fullCandidates(g: Game): string[] {
  const home = homeCountryOf(g);
  return WORLD_COUNTRIES.filter((c) => c.cc !== home && !(home === 'ger' && c.cc === 'gdr') && g.world?.countries[c.key]?.active).map((c) => c.cc);
}

/** Land Spiel für Spiel an/aus – wirkt ab dem nächsten Saisonwechsel (Wunsch Pascal: auch im laufenden Spiel). */
export function setFullCountry(g: Game, cc: string, on: boolean): void {
  const list = new Set(g.fullCountries ?? []);
  if (on) list.add(cc); else { list.delete(cc); g.fullAll = false; }
  g.fullCountries = [...list];
}
export function setFullAll(g: Game, on: boolean): void {
  g.fullAll = on;
  g.fullCountries = on ? fullCandidates(g) : [];
}
/** Saisonwechsel: „alle Länder“ schließt neu entstandene Länder ein (z. B. Kroatien 1992). */
export function refreshFullAll(g: Game): void {
  if (g.fullAll) g.fullCountries = fullCandidates(g);
  else if (g.fullCountries) g.fullCountries = g.fullCountries.filter((cc) => fullCandidates(g).includes(cc));
}

/** Divisionen aller gewählten Länder neu aufbauen (Spielbeginn und nach dem Saisonwechsel). */
export function buildFullCountries(g: Game, seasonStart: string): void {
  if (!g.fullCountries?.length || !g.world || !g.euroClubs) return;
  g.leagues.otherDivisions = g.leagues.otherDivisions.filter((d) => !isFullDivision(d));
  for (const id of Object.keys(g.simClubs)) if (g.simClubs[id].tier >= FULL_TIER_BASE) delete g.simClubs[id];
  g.fullCountries.forEach((cc, idx) => {
    const def = COUNTRY_BY_CC[cc];
    const c = def ? g.world!.countries[def.key] : undefined;
    if (!c || !c.active) return;
    c.tiers.forEach((ids, t) => {
      const list = ids.filter((id) => g.euroClubs![id] && !g.clubs[id]);
      if (list.length % 2) list.pop();
      if (list.length < 4) return;
      const tier = FULL_TIER_BASE + idx * 10 + t + 1;
      for (const id of list) g.simClubs[id] = simOf(g.euroClubs![id], tier);
      g.leagues.otherDivisions.push(buildDivision({ id: `x-${cc}-${t + 1}`, name: `${def.name} ${t + 1}. Liga`, tier, group: null }, list, g.pointSystem, g.season, seasonStart));
    });
  });
}

/** Endtabellen der Länder für engine/world.ts (vor dem Neuaufbau der Divisionen lesen). */
export function fullCountryResults(g: Game): Record<string, FixedCountryResult> {
  const out: Record<string, FixedCountryResult> = {};
  for (const cc of g.fullCountries ?? []) {
    const def = COUNTRY_BY_CC[cc];
    const d1 = g.leagues.otherDivisions.find((d) => d.id === `x-${cc}-1`);
    if (!def || !d1) continue;
    const d2 = g.leagues.otherDivisions.find((d) => d.id === `x-${cc}-2`);
    const order = (d: LeagueDivision) => [...d.table.rows].sort((a, b) => a.position - b.position).map((r) => r.clubId);
    const t1 = order(d1), t2 = d2 ? order(d2) : [];
    const n = !t2.length ? 0 : t1.length >= 16 ? 3 : 2;
    out[def.key] = { t1, t2, next: [[...t1.slice(0, t1.length - n), ...t2.slice(0, n)], [...t2.slice(n), ...(n ? t1.slice(-n) : [])]] };
  }
  return out;
}

/** Stärke der Sim-Vereine nach der Entwicklung im Hintergrund (engine/world.ts) übernehmen. */
export function divisionsOfFull(g: Game): LeagueDivision[] { return g.leagues.otherDivisions.filter(isFullDivision); }
