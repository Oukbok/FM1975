// =============================================================================
// Platzierungs-Historie der Auslandsvereine füllen (Format engine/worldPlaces.ts):
//  • `seedWorldPlaces` – Weltdaten vor dem Startjahr (data/world/seasons/<cc>.ts):
//    echte Abschlusstabellen aller Hintergrund-Länder (newGame.ts, Laden).
//  • `migrateWorldPlaces` – ältere Spielstände einmalig: Weltdaten vor dem Start +
//    gespielte Saisons aus der Welt-Historie, soweit rekonstruierbar (letzte zehn
//    mit 1. und 2. Liga, davor die 1. Liga bzw. nur noch der Meister).
// =============================================================================
import { WORLD_COUNTRIES } from '../data/world/countries';
import { worldSeason, worldYears } from '../data/world/index';
import { notePlaces, placesOfWorld, setGroupPlace as setGroupPlaceOf, setPlace } from '../engine/worldPlaces';
import { rowGroups } from '../data/world/secondGroups';
import type { WorldState } from '../engine/worldTypes';
import { homeCountryOf, type Game } from './state';
import { leanTable } from './worldLeagues';

/** Weltdaten vor dem Startjahr für alle Vereine, die die Spielwelt kennt. */
export function seedWorldPlaces(w: WorldState, startYear: number, home: string, known: (id: string) => boolean): void {
  const p = placesOfWorld(w);
  for (const def of WORLD_COUNTRIES) {
    if (def.cc === home || (home === 'ger' && def.cc === 'gdr')) continue;
    for (const y of worldYears(def.cc)) {
      if (y >= startYear) break;
      const row = worldSeason(def.cc, y);
      if (!row) continue;
      const t1 = row.t1.map((id) => `w_${id}`);
      const groups = rowGroups(row).map((g) => g.map((id) => `w_${id}`));
      t1.forEach((id, i) => { if (known(id)) setPlace(p, id, y, 1, i + 1, t1.length); });
      // Mehrere Staffeln: Platz und Größe je Staffel (engine/worldPlaces.ts `s`).
      groups.forEach((g, k) => g.forEach((id, i) => {
        if (!known(id)) return;
        setPlace(p, id, y, 2, i + 1, g.length);
        if (groups.length > 1) setGroupPlaceOf(p, id, y, k, groups.length);
      }));
    }
  }
}

/** Beim Spielstart (nach dem Aufbau der Welt). */
export function startWorldPlaces(g: Game): void {
  if (!g.world) return;
  seedWorldPlaces(g.world, g.startYear ?? 1975, homeCountryOf(g), (id) => !!g.euroClubs?.[id]);
}

/** Ältere Spielstände: Historie einmalig nachbauen (idempotent über `world.places`). */
export function migrateWorldPlaces(g: Game): void {
  const w = g.world;
  if (!w || w.places) return;
  startWorldPlaces(g);
  const p = placesOfWorld(w);
  for (const h of w.history ?? []) {
    const year = Number(h.season.slice(0, 4));
    for (const [key, champ] of Object.entries(h.champions ?? {})) {
      const divs = h.divs?.[key];
      const order = (t: number) => { const d = divs?.[t]; return d ? leanTable(d, key, h.season).map((r) => r.clubId) : null; };
      const t1 = order(0) ?? h.tables?.[key] ?? null;
      const t2g = (divs ?? []).slice(1).map((_, i) => order(i + 1) ?? []).filter((x) => x.length);
      if (t1) {
        notePlaces(w, year, t1, t2g);
      } else if (champ) {
        setPlace(p, champ, year, 1, 1, w.countries[key]?.tier1 || w.countries[key]?.tiers[0]?.length || 18);
      }
    }
  }
}
