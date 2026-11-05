// =============================================================================
// Ligazusammensetzung eines Landes zum Start in einem beliebigen Jahr
// -----------------------------------------------------------------------------
// Quelle: Weltdaten (data/world/index.ts) – sonst Rückfall:
//   Deutschland → Vereine von 1975 (data/generate.ts), auf die Struktur des Jahres verteilt;
//   übrige Länder → nicht als Heimatland wählbar (Hintergrund wie bisher).
// Stärke/Ansehen kommen aus der Vorsaison-Tabelle (sonst Reihenfolge dieser Saison):
// keine Vorhersage des Ausgangs, nur „wer war zuletzt wie gut“.
// =============================================================================
import { CLUB_SEEDS, ClubSeed, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS, SecondLigaSeed } from '../data/generate';
import { DDR_LIGA_SEEDS, DDR_OBERLIGA_SEEDS } from '../data/ddr';
import { historicClubInfo } from '../data/history/historicClubs';
import { COUNTRY_SEEDS, COUNTRY_TRENDS } from '../data/worldSeed';
import { COUNTRY_BY_CC, countryExists, seasonLabelOf, WORLD_COUNTRIES } from '../data/world/countries';
import { structureForSeason } from '../data/reforms';
import { realClub, realClubName, worldSeason } from '../data/world/index';
import type { SeasonRow } from '../data/world/types';
import type { LeagueGroup, SimClub } from '../engine/leagues';

export interface ComposedSecond { group: LeagueGroup; name: string; clubs: SecondLigaSeed[] }
export interface ComposedHome {
  cc: string;
  year: number;
  tier1: ClubSeed[];
  second: ComposedSecond[];
  /** Saisondaten vorhanden (sonst Rückfall). */
  fromData: boolean;
  row: SeasonRow | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Grundniveau eines Landes im Jahr (Skala Vereinsstärke; Deutschland ≈ 68). */
export function countryLevelOf(cc: string, year: number): number {
  if (cc === 'ger') return 68;
  if (cc === 'gdr') return 62;
  const def = COUNTRY_BY_CC[cc];
  const seed = COUNTRY_SEEDS.find((s) => s.name === def?.key);
  let base = seed?.base;
  if (base == null) {
    // Nachfolgestaaten ohne Seed: Teilungs-Daten; sonst kleines Land.
    base = def?.successorOf ? 58 : 50;
  }
  let delta = 0;
  for (const [y, d] of COUNTRY_TRENDS[def?.key ?? ''] ?? []) if (year >= y) delta = d;
  return base + delta;
}

/** Rang 0..1 (0 = Spitze) je Verein aus der Vorsaison (beide Ebenen), sonst aus dieser Saison. */
function rankShare(cc: string, year: number, row: SeasonRow): Map<string, number> {
  const prev = worldSeason(cc, year - 1);
  const src = prev ?? row;
  const out = new Map<string, number>();
  const put = (ids: string[] | undefined, lo: number) => (ids ?? []).forEach((id, i, a) => {
    if (!out.has(id)) out.set(id, lo + (i / Math.max(1, a.length - 1)) * 0.5);
  });
  put(src.t1, 0); put(src.t2, 0.5); put(src.t2b, 0.5);
  // Vereine dieser Saison ohne Vorjahreseintrag (Aufsteiger von unten): hinten einordnen.
  for (const id of [...row.t1, ...(row.t2 ?? []), ...(row.t2b ?? [])]) if (!out.has(id)) out.set(id, row.t1.includes(id) ? 0.55 : 0.95);
  return out;
}

interface Ident { id: string; name: string; shortName: string; city: string; primary: string; secondary: string; founded?: number; stadium?: string; capacity?: number }

/** Name/Farben eines Vereins: Weltdaten > Seeds des Spiels > Historie. */
export function identOf(cc: string, id: string, year: number): Ident | null {
  // Deutschland ab 1991/92 nutzt die DDR-IDs (clubs/gdr.ts) mit.
  const rc = realClub(cc, id) ?? (cc === 'ger' ? realClub('gdr', id) : cc === 'gdr' ? realClub('ger', id) : undefined);
  const seed = cc === 'ger' ? CLUB_SEEDS.find((s) => s.id === id) : undefined;
  const sec = cc === 'ger' ? [...SECOND_LIGA_NORD_SEEDS, ...SECOND_LIGA_SUED_SEEDS].find((s) => s.id === id) : undefined;
  const ddr = cc === 'ger' || cc === 'gdr' ? [...DDR_OBERLIGA_SEEDS, ...DDR_LIGA_SEEDS].find((s) => s.id === id) : undefined;
  const hist = cc === 'ger' || cc === 'gdr' ? historicClubInfo(id) : undefined;
  const base: Ident | null = seed ? { ...seed }
    : sec ? { id, name: sec.name, shortName: sec.shortName, city: sec.city, primary: sec.primary, secondary: sec.secondary }
    : ddr ? { id, name: ddr.name, shortName: ddr.shortName, city: ddr.city, primary: ddr.colors.primary, secondary: ddr.colors.secondary }
    : hist ? { id, name: hist.name, shortName: hist.shortName, city: hist.city, primary: hist.colors.primary, secondary: hist.colors.secondary }
    : null;
  if (rc) {
    return {
      ...(base ?? {}), id, name: realClubName(rc, year), shortName: rc.short, city: rc.city,
      primary: rc.colors.primary, secondary: rc.colors.secondary,
    } as Ident;
  }
  return base;
}

function toTier1Seed(cc: string, id: string, year: number, share: number, n: number): ClubSeed | null {
  const ident = identOf(cc, id, year);
  if (!ident) return null;
  const lvl = countryLevelOf(cc, year) - 68;
  const rep = clamp(Math.round(90 - share * 2 * 26 + lvl), 40, 95);
  void n;
  return {
    id, name: ident.name, shortName: ident.shortName, city: ident.city,
    founded: ident.founded ?? 1900 + (Math.abs(hashCode(id)) % 25),
    primary: ident.primary, secondary: ident.secondary, reputation: rep,
    stadium: ident.stadium ?? `Stadion ${ident.city}`,
    capacity: ident.capacity ?? Math.round((18000 + (rep - 55) * 1400) / 500) * 500,
  };
}

function toSecondSeed(cc: string, id: string, year: number, share: number): SecondLigaSeed | null {
  const ident = identOf(cc, id, year);
  if (!ident) return null;
  const lvl = countryLevelOf(cc, year) - 68;
  const s = clamp(Math.round(68 - (share - 0.5) * 2 * 18 + lvl), 38, 80);
  return { id, name: ident.name, shortName: ident.shortName, city: ident.city, primary: ident.primary, secondary: ident.secondary, strength: s };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * Ligen des Heimatlandes zum Start im Jahr `year`. Deutschland 1975 ohne Datensatz-
 * Überschreibung liefert null (= bisheriger Weg, unverändert).
 */
export function composeHome(cc: string, year: number): ComposedHome | null {
  let row = worldSeason(cc, year);
  if (cc === 'ger' && year === 1975 && row && sameAsSeeds1975(row)) return null;
  if (!row) {
    if (cc !== 'ger' || year === 1975) return null;
    // Deutschland ohne Daten: Vereine von 1975, Zweitligisten nach Struktur des Jahres.
    const second: ComposedSecond[] = year < 1981
      ? [{ group: 'nord', name: '2. Liga Nord', clubs: SECOND_LIGA_NORD_SEEDS.map((s) => ({ ...s })) },
        { group: 'sued', name: '2. Liga Süd', clubs: SECOND_LIGA_SUED_SEEDS.map((s) => ({ ...s })) }]
      : [{ group: null, name: '2. Liga', clubs: [...SECOND_LIGA_NORD_SEEDS, ...SECOND_LIGA_SUED_SEEDS].sort((a, b) => b.strength - a.strength).slice(0, 20).map((s) => ({ ...s })) }];
    return { cc, year, tier1: CLUB_SEEDS.map((s) => ({ ...s })), second, fromData: false, row: null };
  }
  row = completeRow(cc, year, row);
  const share = rankShare(cc, year, row);
  const tier1 = row.t1.map((id) => toTier1Seed(cc, id, year, share.get(id) ?? 0.5, row.t1.length)).filter(Boolean) as ClubSeed[];
  // Neu zusammengesetzt: echte Vereine bleiben ihren Seeds treu (Stadion), Ansehen aus dem Rang.
  const mk = (ids: string[] | undefined) => (ids ?? []).map((id) => toSecondSeed(cc, id, year, share.get(id) ?? 0.75)).filter(Boolean) as SecondLigaSeed[];
  const second: ComposedSecond[] = [];
  if (row.t2b?.length) {
    second.push({ group: 'nord', name: '2. Liga Nord', clubs: mk(row.t2) }, { group: 'sued', name: '2. Liga Süd', clubs: mk(row.t2b) });
  } else if (row.t2?.length) {
    second.push({ group: null, name: '2. Liga', clubs: mk(row.t2) });
  }
  // Gerade Vereinszahl (Spielplan-Generator): überzählige schwächste fallen weg.
  if (tier1.length % 2) tier1.pop();
  for (const s of second) if (s.clubs.length % 2) s.clubs.pop();
  return { cc, year, tier1, second: second.filter((s) => s.clubs.length >= 4), fromData: true, row };
}

/** Übrige Vereine eines Landes (nicht in t1/t2 der Saison) als Pool-Kandidaten. */
export function poolClubsOf(cc: string, year: number, taken: Set<string>, tier: number): SimClub[] {
  const row = worldSeason(cc, year);
  const ids = new Set<string>();
  // Vereine aus benachbarten Saisons (±5 Jahre) – realistische Nachrücker.
  for (let y = year - 5; y <= year + 5; y++) {
    const r = worldSeason(cc, y);
    if (r) for (const id of [...r.t1, ...(r.t2 ?? []), ...(r.t2b ?? [])]) ids.add(id);
  }
  void row;
  const lvl = countryLevelOf(cc, year) - 68;
  const out: SimClub[] = [];
  for (const id of ids) {
    if (taken.has(id)) continue;
    const ident = identOf(cc, id, year);
    if (!ident) continue;
    out.push({
      id, name: ident.name, shortName: ident.shortName, city: ident.city,
      strength: clamp(48 + lvl + (Math.abs(hashCode(id)) % 7) - 3, 36, 66),
      colors: { primary: ident.primary, secondary: ident.secondary }, tier, group: null,
    });
  }
  return out;
}

/** Länder, die im Jahr als Heimatland wählbar sind (Deutschland immer, sonst mit Saisondaten). */
export function playableCountries(year: number): string[] {
  return WORLD_COUNTRIES.filter((c) => countryExists(c, year) && c.cc !== 'gdr' && (c.cc === 'ger' || !!worldSeason(c.cc, year))).map((c) => c.cc);
}

/** DDR-Ligen einer Saison aus den Weltdaten (`gdr`), sonst null (= Vereine von 1975). */
export function ddrSeedsFor(year: number): { ober: SimClub[]; liga: SimClub[] } | null {
  const row = worldSeason('gdr', year);
  if (!row) return null;
  const share = rankShare('gdr', year, row);
  const mk = (ids: string[], tier: number): SimClub[] => ids.map((id) => {
    const ident = identOf('gdr', id, year);
    if (!ident) return null;
    const s = share.get(id) ?? 0.75;
    return {
      id, canonicalId: id, name: ident.name, shortName: ident.shortName, city: ident.city,
      strength: clamp(Math.round(tier === 101 ? 79 - s * 2 * 20 : 62 - (s - 0.5) * 2 * 12), 40, 82),
      colors: { primary: ident.primary, secondary: ident.secondary }, tier, group: 'nordost' as LeagueGroup, ddr: true,
    };
  }).filter(Boolean) as SimClub[];
  const ober = mk(row.t1, 101);
  const liga = mk([...(row.t2 ?? []), ...(row.t2b ?? [])], 102);
  if (ober.length % 2) ober.pop();
  if (liga.length % 2) liga.pop();
  const oberIds = new Set(ober.map((s) => s.id));
  const fallback = DDR_LIGA_SEEDS.filter((s) => !oberIds.has(s.id)).map((s) => ({ ...s }));
  if (fallback.length % 2) fallback.pop();
  return ober.length >= 6 ? { ober, liga: liga.length >= 6 ? liga : fallback } : null;
}

/** Zweitligisten der Zusammensetzung als Sim-Vereine (Ebene 2, Staffel je Gruppe). */
export function secondSimClubs(comp: ComposedHome): Record<string, SimClub> {
  const out: Record<string, SimClub> = {};
  for (const sec of comp.second) {
    for (const s of sec.clubs) {
      out[s.id] = { id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: s.strength, colors: { primary: s.primary, secondary: s.secondary }, tier: 2, group: sec.group };
    }
  }
  return out;
}

/** Deutschland 1975/76 in den Daten = Startvereine des Spiels? Dann bleibt der alte Aufbau (Seeds). */
export function sameAsSeeds1975(row: SeasonRow): boolean {
  const same = (a: string[] | undefined, b: string[]) => !!a && a.length === b.length && b.every((id) => a.includes(id));
  if (!same(row.t1, CLUB_SEEDS.map((s) => s.id))) return false;
  if (!row.t2?.length && !row.t2b?.length) return true;
  return same(row.t2, SECOND_LIGA_NORD_SEEDS.map((s) => s.id)) && same(row.t2b, SECOND_LIGA_SUED_SEEDS.map((s) => s.id));
}

/**
 * Lücken der Daten schließen: fehlende 2. Liga (Top-8-Länder) aus der nächstgelegenen Saison
 * mit 2. Liga (ohne die Erstligisten dieser Saison); Deutschland: zwei Staffeln zu einer, wenn
 * das Spiel im Jahr eine eingleisige 2. Liga führt (Wiedervereinigungssaison 1991/92).
 */
export function completeRow(cc: string, year: number, row: SeasonRow): SeasonRow {
  let out = row;
  if (!row.t2?.length && COUNTRY_BY_CC[cc]?.top8) {
    for (let d = 1; d <= 12; d++) {
      const near = worldSeason(cc, year - d)?.t2?.length ? worldSeason(cc, year - d) : worldSeason(cc, year + d)?.t2?.length ? worldSeason(cc, year + d) : null;
      if (!near) continue;
      const t2 = [...(near.t2 ?? []), ...(near.t2b ?? [])].filter((id) => !row.t1.includes(id));
      out = { ...row, t2 };
      break;
    }
  }
  if (cc === 'ger' && out.t2b?.length && !structureForSeason(seasonLabelOf(year)).some((t) => t.id === 'tier2-nord')) {
    const a = out.t2 ?? [], b = out.t2b ?? [];
    const merged: string[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) merged.push(a[i]); if (b[i]) merged.push(b[i]); }
    out = { ...out, t2: merged, t2b: undefined };
  }
  return out;
}
