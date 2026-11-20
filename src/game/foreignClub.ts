// =============================================================================
// AUSLANDSVEREINE IM PROFIL WIE DEUTSCHE VEREINE (Wunsch Pascal: „das muss alles
// simuliert werden … wirklich alles wie in Deutschland“) – Anzeigedaten für
// game/clubProfile.ts: Tabellenplatz/Punkte/Form/Spiele aus der laufenden
// Auslandsliga (game/worldLeagues.ts), Ansehen aus der Welt-Simulation (Größe,
// Stärke, Titel), Platzierungen über die ganze Geschichte (engine/worldPlaces.ts).
// Nur gelesen, nichts gespeichert.
// =============================================================================
import { COUNTRY_BY_KEY, seasonLabelOf } from '../data/world/countries';
import { worldSeason, worldYears } from '../data/world/index';
import { worldPlacesOf } from '../engine/worldPlaces';
import type { SeasonPlacement } from './clubRecords';
import type { Game } from './state';
import { deepIdx, leanGames, leanTable, worldLiveDiv, worldLiveDivCount } from './worldLeagues';
import { deepGroupsOf } from '../engine/worldDeep';
import { groupNamesOf, leagueLabel, leagueName } from '../data/leagueNames';
import { countryName } from './worldPool';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Ansehen 0–100 wie `Club.reputation` deutscher Vereine: Stärke (enthält schon das
 * Landesniveau) + Größe des Vereins (Einzugsgebiet, Tradition, Geld) + Meistertitel.
 * Eichung: Spitzenklub einer großen Liga (Stärke 80, Größe 0,8) ≈ 90, Mittelfeld ≈ 65,
 * kleiner Erstligist eines kleinen Landes (50, 0,2) ≈ 40 – wie die deutschen Startwerte.
 */
export function foreignReputation(g: Game, id: string): number | undefined {
  const e = g.euroClubs?.[id];
  if (!e) return undefined;
  const m = g.world?.meta[id];
  const titles = g.world?.countries[e.country]?.titles?.[id] ?? 0;
  const size = m?.size ?? 0.3;
  return Math.round(clamp(1.2 * e.strength + 25 * size - 25 + Math.min(5, titles * 0.5), 15, 99));
}

export interface ForeignLive {
  label: string; tier: number; pos?: number; size: number; points?: number; played?: number; goals?: string;
  form?: ('W' | 'D' | 'L')[];
  games: { date: string; home: string; away: string; hg: number | null; ag: number | null }[];
}

/** Laufende Liga eines Auslandsvereins (null: Verein spielt in keiner Auslandsliga). */
export function foreignLive(g: Game, id: string, key: string): ForeignLive | null {
  const cc = COUNTRY_BY_KEY[key]?.cc;
  const n = worldLiveDivCount(g, key);
  for (let i = 0; i < Math.max(2, n); i++) {
    const d = worldLiveDiv(g, key, i);
    if (!d || !d.ids.includes(id)) continue;
    const t = Math.min(1, i);
    // Mehrere Staffeln der 2. Ebene, Name in der Landessprache: „2. Ligue Nord Frankreich“.
    const label = `${leagueLabel(cc, t + 1, n > 2 && i > 0 ? { n: n - 1, i: i - 1 } : {})} ${countryName(key)}`;
    const games = leanGames(d, g.season, d.md).filter((x) => x.home === id || x.away === id);
    if (d.md <= 0) return { label, tier: t + 1, size: d.ids.length, games };
    const row = leanTable(d, key, g.season).find((r) => r.clubId === id)!;
    return { label, tier: t + 1, pos: row.pos, size: d.ids.length, points: row.pts, played: row.p, goals: `${row.gf}:${row.ga}`, form: row.form, games };
  }
  // Tiefere Ebenen (engine/worldDeep.ts): „3. División Grupo 2 Spanien“.
  const c = g.world?.countries[key];
  for (let k = 0; c && k < (c.deep?.length ?? 0); k++) {
    const gs = deepGroupsOf(c, k);
    const i = gs.findIndex((x) => x.includes(id));
    if (i < 0) continue;
    const d = worldLiveDiv(g, key, deepIdx(k + 3, i));
    if (!d) return null;
    const label = `${leagueLabel(cc, k + 3, { n: gs.length, i })} ${countryName(key)}`;
    const games = leanGames(d, g.season, d.md).filter((x) => x.home === id || x.away === id);
    if (d.md <= 0) return { label, tier: k + 3, size: d.ids.length, games };
    const row = leanTable(d, key, g.season).find((r) => r.clubId === id)!;
    return { label, tier: k + 3, pos: row.pos, size: d.ids.length, points: row.pts, played: row.p, goals: `${row.gf}:${row.ga}`, form: row.form, games };
  }
  return null;
}

/** Alle bekannten Endplätze (komplette Historie inkl. Weltdaten vor dem Startjahr). */
export function foreignSeasons(g: Game, id: string, key: string): SeasonPlacement[] {
  const name = countryName(key);
  const cc = COUNTRY_BY_KEY[key]?.cc;
  return worldPlacesOf(g.world, id).map((p) => ({
    season: `${p.year}/${String((p.year + 1) % 100).padStart(2, '0')}`,
    tier: p.tier, pos: p.pos, size: p.size,
    league: `${leagueName(cc, p.tier)}${p.group != null ? ` ${p.groups ? groupNamesOf(cc, p.groups)[p.group] : groupNamesOf(cc, 9)[p.group]}` : ''} ${name}`,
  }));
}

/** Titel eines Auslandsvereins: Meister aus der kompletten Platzierungs-Historie, Pokal aus Welt-Historie + Weltdaten vor dem Start. */
export function foreignTitles(g: Game, id: string, key: string): { label: string; seasons: string[] }[] {
  const name = countryName(key);
  const champ = foreignSeasons(g, id, key).filter((s) => s.tier === 1 && s.pos === 1).map((s) => s.season);
  const cup = new Set<string>();
  const cc = COUNTRY_BY_KEY[key]?.cc;
  const start = g.startYear ?? 1975;
  if (cc && id.startsWith('w_')) for (const y of worldYears(cc)) {
    if (y >= start) break;
    if (worldSeason(cc, y)?.cup === id.slice(2)) cup.add(seasonLabelOf(y));
  }
  for (const h of g.world?.history ?? []) if (h.cupWinners?.[key] === id) cup.add(h.season);
  return [
    { label: `Meister ${name}`, seasons: champ },
    { label: `Pokalsieger ${name}`, seasons: [...cup].sort() },
  ].filter((x) => x.seasons.length);
}
