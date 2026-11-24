// =============================================================================
// RELEGATION – ANZEIGEDATEN (Statistiken › Liga, Ligensystem, i-Hilfe)
// -----------------------------------------------------------------------------
// Tabellenzonen der Relegationsplätze (`relZonePositions`, eigene Farbe `zone-rg`),
// Ergebnisse je Liga (`relViewFor`: laufende Saison/Archiv im Heimatland, Welt-
// Historie im Ausland) und Kurztext je Ebene für die Ligensystem-Kästen
// (`relLevelText`). Nur gelesen – nichts wird hier verändert.
// =============================================================================
import { bracketEntrants, entPos, relegationFormat, relegationFormats, relegationText, relKindName, type RelFormat } from '../data/relegationRules';
import { leagueName } from '../data/leagueNames';
import { seasonStartYear } from '../data/timeline';
import { COUNTRY_BY_CC } from '../data/world/countries';
import { groupOrder } from '../data/regionGeo';
import type { Game } from './state';
import { homeCountryOf } from './state';
import { legName, relState } from './relegationHome';
import { worldRelOf } from './relegationWorld';
import { leanTierOf } from './worldLeagues';
import type { RelLeg, RelRecord } from './relegationCore';

/** Plätze (1-basiert) einer Liga, die in der Saison Relegation spielen (ohne Entscheidungsspiele bei Gleichstand). */
export function relZonePositions(cc: string, season: string, tier: number, groupIdx: number, n: number): number[] {
  const y = seasonStartYear(season);
  const out = new Set<number>();
  for (const f of relegationFormats(cc, y)) {
    if (f.brackets === 'champs') continue;
    for (const b of f.brackets) {
      if (b.ifLevel) continue;
      for (const e of bracketEntrants(b)) {
        if (e.s === 'u' && f.lv === tier) out.add(entPos(e, n));
        if (e.s === 'l' && f.lv === tier - 1 && (e.g ?? 0) === groupIdx) out.add(entPos(e, n));
      }
    }
  }
  return [...out].filter((p) => p >= 1 && p <= n).sort((a, b) => a - b);
}

/** Ein Duell für die Anzeige. */
export interface RelTieView { name: string; legs: (RelLeg & { matchId?: string })[]; w?: string }
/** Eine Klammer für die Anzeige. */
export interface RelBlockView { title: string; lv: number; ties: RelTieView[]; w?: string; ent: string[]; pending: boolean; skip?: boolean; up?: string }

function kindTitle(f: RelFormat | null, cc: string, lv: number): string {
  const k = f ? relKindName(f) : 'Relegation';
  return f?.kind === 'playout' ? `${k} ${leagueName(cc, lv + 1)}` : `${k} ${leagueName(cc, lv)}/${leagueName(cc, lv + 1)}`;
}

function tiesOf(rec: RelRecord, f: RelFormat | null, today: string, mt?: Record<string, unknown>): RelTieView[] {
  const def = f && f.brackets !== 'champs' ? f.brackets[rec.b] : undefined;
  return rec.ties.filter((t) => t.legs[0]?.h).map((t) => ({
    name: legName({ def, ties: rec.ties }, t.m, 0).replace(/ · Hinspiel$/, '').replace(/^Hinspiel$|^Spiel$/, ''),
    // Hintergrund: Ergebnisse erst ab dem Termin zeigen.
    legs: t.legs.map((l) => (l.d > today ? { d: l.d, h: l.h, a: l.a } : { ...l, matchId: l.id && mt?.[l.id] ? l.id : undefined })),
    w: t.legs.every((l) => l.d <= today) ? t.w : undefined,
  }));
}

/**
 * Relegation zu einer Liga (Ebene `tier`, Staffel `groupIdx`) in einer Saison: Klammern, in denen sie oben
 * (Ebene = tier) oder unten (Ebene = tier − 1) mitspielt. `cc` = Land, `worldKey` für Auslandsligen.
 */
export function relViewFor(g: Game, c: { cc: string; mode: string; worldKey?: string }, season: string, tier: number, groupIdx: number): RelBlockView[] {
  const y = seasonStartYear(season);
  const today = g.calendar.currentDate;
  const cc = c.cc;
  const home = c.mode === 'home' && cc === homeCountryOf(g);
  let recs: (RelRecord & { fi?: number; mt?: Record<string, unknown>; res?: 1 })[] = [];
  if (home) {
    const st = relState(g);
    if (st?.season === season) recs = st.recs;
    else recs = st?.arch.find((a) => a.season === season)?.recs ?? [];
  } else if (c.mode === 'world') {
    recs = worldRelOf(g, c.worldKey ?? COUNTRY_BY_CC[cc]?.key ?? cc, season);
  }
  const out: RelBlockView[] = [];
  for (const rec of recs) {
    if (rec.lv !== tier && rec.lv !== tier - 1) continue;
    const f = relegationFormat(cc, y, rec.lv);
    // Obere Liga: nur Klammern, in denen sie selbst mitspielt (Play-offs der unteren Liga stehen dort).
    if (rec.lv === tier && (!f || f.brackets === 'champs' || !bracketEntrants(f.brackets[rec.b] ?? { m: [] }).some((e) => e.s === 'u'))) continue;
    // Untere Liga mit mehreren Staffeln: nur Klammern mit einem Verein dieser Staffel (bzw. vor der Auslosung alle).
    if (rec.lv === tier - 1 && f && f.brackets !== 'champs' && rec.ent.length) {
      const b = f.brackets[rec.b];
      if (b && !bracketEntrants(b).some((e) => e.s === 'l' && (e.g ?? 0) === groupIdx) && groupIdx > 0) continue;
    }
    const pending = home ? !rec.res : false;
    const ties = tiesOf(rec, f, today, rec.mt);
    const done = !!rec.w && rec.ties.every((t) => t.legs.every((l) => l.d <= today));
    const upId = rec.up?.[0];
    out.push({
      title: kindTitle(f, cc, rec.lv),
      lv: rec.lv, ties, w: done ? rec.w : undefined, ent: rec.ent, pending, skip: !!rec.skip, up: upId,
    });
  }
  return out;
}

/** Kurztext der Relegation an der Grenze unter Ebene `lv` (Ligensystem-Kästen), '' = keine. */
export function relLevelText(cc: string, year: number, lv: number, nUp: number): string {
  const f = relegationFormat(cc, year, lv);
  if (!f) return '';
  return `${relKindName(f)}: ${relegationText(f, nUp, leagueName(cc, lv + 1))}`;
}

/** Hat das Land in der Saison überhaupt eine Relegation (Zeichenerklärung)? */
export const hasRelegation = (cc: string, year: number): boolean => relegationFormats(cc, year).length > 0;

/** Staffel-Index einer Liga des Heimatlandes (wie die Relegation sie zählt: nach Staffel-Reihenfolge). */
export function homeGroupIndex(g: Game, tier: number, group: string | null | undefined): number {
  const groups = [g.leagues.playerDivision, ...g.leagues.otherDivisions].filter((d) => d.tier === tier && !d.id.startsWith('ddr-'))
    .map((d) => d.group ?? null).sort((a, b) => groupOrder(a as never) - groupOrder(b as never));
  return Math.max(0, groups.indexOf((group ?? null) as never));
}

/** Relegation eines Liga-Kastens: Marken (oben/unten) und Plätze mit Relegation (Zone `zone-rg`). */
export interface PyrRel { marks: { text: string; tip: string }[]; pos: number[]; kind: string }
export function pyrRelInfo(cc: string, year: number, level: number, groupIdx: number, n: number, nUp: number): PyrRel | undefined {
  const marks: PyrRel['marks'] = [];
  let kind = '';
  const down = relegationFormat(cc, year, level);
  if (down) {
    const tip = relLevelText(cc, year, level, n);
    marks.push({ text: down.kind === 'playout' ? 'Play-out' : relKindName(down), tip });
    kind = relKindName(down);
  }
  const up = relegationFormat(cc, year, level - 1);
  if (up && up.kind !== 'playout') {
    const mine = up.brackets === 'champs' || up.brackets.some((b) => bracketEntrants(b).some((e) => e.s === 'l' && (e.g ?? 0) === groupIdx));
    if (mine && up.brackets !== 'champs') {
      marks.push({ text: relKindName(up), tip: relLevelText(cc, year, level - 1, nUp || n) });
      kind = kind || relKindName(up);
    }
  }
  if (!marks.length) return undefined;
  // Gleiche Art oben und unten (z. B. 2. Liga ab 2008/09): eine Marke, beide Formate im Tooltip.
  if (marks.length === 2 && marks[0].text === marks[1].text) marks.splice(0, 2, { text: marks[0].text, tip: `Nach oben – ${marks[1].tip} · Nach unten – ${marks[0].tip}` });
  return { marks, pos: relZonePositions(cc, `${year}/${String(year + 1).slice(2)}`, level, groupIdx, n), kind: kind || 'Relegation' };
}

/** Statistiken › Liga: Relegationsplätze und -ergebnisse zur gezeigten Liga (null = keine Liga mit Relegation). */
export interface RelSnapInfo { pos: number[]; blocks: RelBlockView[]; hint: string }
export function relSnapshotInfo(
  g: Game, c: { cc: string; mode: string; worldKey?: string }, season: string, leanIdx: number,
  snap: { tier?: number; group?: string | null; table?: unknown[] },
): RelSnapInfo | null {
  if (c.mode === 'div' || !snap.table?.length) return null;
  let tier = snap.tier ?? 0, gi = 0;
  if (c.mode === 'world') {
    if (leanIdx < 0) return null;
    const t = leanTierOf(leanIdx);
    tier = t.tier; gi = t.group;
  } else gi = homeGroupIndex(g, tier, snap.group);
  if (!tier || tier >= 100) return null;
  const y = seasonStartYear(season);
  const n = snap.table.length;
  const info = pyrRelInfo(c.cc, y, tier, gi, n, 0);
  const blocks = relViewFor(g, c, season, tier, gi);
  if (!info && !blocks.length) return null;
  return { pos: info?.pos ?? [], blocks, hint: (info?.marks ?? []).map((m) => m.tip).join(' · ') };
}
