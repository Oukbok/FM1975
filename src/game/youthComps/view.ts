// =============================================================================
// JUGENDWETTBEWERBE — Schnappschüsse für die Seite (gleiches Format wie Erwachsene)
// -----------------------------------------------------------------------------
// Jeder Wettbewerb liefert Optionen: Staffeln/Verbandsligen (Tabelle), Gruppenphasen
// (Gruppenübersicht) und die Endrunde/K.-o.-Runden (Turnierbaum). Bestenlisten gelten
// für den ganzen Wettbewerb (Liga + Endrunde).
// =============================================================================
import type { GroupTable } from '../../components/competition/GroupTables';
import { STAT_CATS, topLists, type ArchRow, type StatCat } from '../leagueArchive';
import type { CompOption, CompSnapshot, RoundLite, SeasonOption, StatRow, TableRowLite } from '../competitionView';
import type { Game } from '../state';
import { personOf, statEntries } from './archive';
import { youthCompsOf } from './daily';
import { leagueTable } from './table';
import { isDdr, isVirtual, lvOf, regionOf, virtualPerson } from './sim';
import { LOW_CLS, isLowKey, lowFormat } from '../../data/youthLowerLeagues';
import type { YcCls, YcKey } from '../../data/youthCompetitions';
import type { YcArchComp, YcComp, YcLeague, YouthCompsState } from './types';

export interface YcSnapshot extends CompSnapshot {
  compKey: string;
  compLabel: string;
  section: string;
  groups?: GroupTable[];
  /** Gruppen: Plätze, die weiterkommen, und wohin. */
  advance?: { n: number; label: string; transfer?: { count: number; label: string } };
  /** Eigener Verein in diesem Wettbewerb (Staffel, Platz). */
  winner?: string | null;
  /** C–G: Spielklasse des eigenen Vereins (0 = obere, 1 = untere), Spielform. */
  lowLevel?: 0 | 1;
  play?: string;
  /** Spielfeste ohne Tabelle (G-Jugend, F vor 1984, G/F/E ab 2024). */
  fest?: { note: string; dates: { date: string; host: string }[]; count: number; apps: { pid: string; name: string; pos: string; n: number }[] };
}

export function youthSeasonOptions(g: Game): SeasonOption[] {
  const st = youthCompsOf(g);
  if (!st) return [];
  const out: SeasonOption[] = st.archive.map((a) => ({ season: a.season, source: 'archive' as const }));
  if (!out.some((o) => o.season === st.season)) out.push({ season: st.season, source: 'live' });
  return out;
}

type AnyComp = { key: string; label: string; section: string; leagues: { id: string; name: string; stage: number; group?: boolean }[]; ko: unknown[]; fest?: unknown };

/** Reihenfolge der Bereiche: A, B, C … G, DDR, Europa. */
function sectionRank(sec: string): number {
  const i = 'ABCDEFG'.indexOf(sec[0]);
  return sec.startsWith('DDR') ? 7 : sec === 'Europa' ? 8 : i < 0 ? 9 : i;
}

function compsOf(st: YouthCompsState, season: string): { live: boolean; comps: AnyComp[]; arch?: YcArchComp[] } | null {
  if (st.season === season) return { live: true, comps: st.comps };
  const a = st.archive.find((x) => x.season === season);
  return a ? { live: false, comps: a.comps, arch: a.comps } : null;
}

const stageLabel = (c: AnyComp, stage: number) =>
  c.key === 'uyl' ? 'Gruppenphase' : stage === 0 ? 'Vorrunde' : 'Hauptrunde Liga A';

export function youthCompOptions(g: Game, season: string): CompOption[] {
  const st = youthCompsOf(g);
  const s = st && compsOf(st, season);
  if (!s) return [];
  const out: CompOption[] = [];
  for (const c of s.comps) {
    if (c.fest) { out.push({ key: `${c.key}:fest`, label: `${c.label} (ohne Tabelle)`, kind: 'league', section: c.section }); continue; }
    const stages = [...new Set(c.leagues.filter((l) => l.group).map((l) => l.stage))];
    for (const l of c.leagues.filter((x) => !x.group)) out.push({ key: `${c.key}:${l.id}`, label: c.key === 'ddr' ? l.name : l.name, kind: 'league', section: c.section });
    for (const stg of stages) out.push({ key: `${c.key}:groups${stg}`, label: `${c.key === 'uyl' ? 'UEFA Youth League' : c.label} – ${stageLabel(c, stg)}`, kind: 'league', section: c.section });
    if ((c.ko as unknown[]).length) {
      const label = c.key === 'pokal' ? c.label : c.key === 'uyl' ? 'UEFA Youth League – K.-o.-Runde' : `${c.label} – Endrunde`;
      out.push({ key: `${c.key}:ko`, label, kind: 'cup', section: c.section });
    }
  }
  // Endrunde zuerst je Bereich, dann Ligen.
  return out.map((o, i) => ({ o, i })).sort((a, b) => sectionRank(a.o.section) - sectionRank(b.o.section)
    || (a.o.kind === b.o.kind ? 0 : a.o.kind === 'cup' ? -1 : 1) || a.i - b.i).map((x) => x.o);
}

// -----------------------------------------------------------------------------
// Bausteine
// -----------------------------------------------------------------------------
const fromArch = (rows: ArchRow[]): TableRowLite[] => rows.map((r, i) => ({ clubId: r[0], pos: i + 1, p: r[1] + r[2] + r[3], w: r[1], d: r[2], l: r[3], gf: r[4], ga: r[5], pts: r[6] }));

function zonesFor(n: number, slots: number, down: number | undefined, key: string): string[] {
  return Array.from({ length: n }, (_, i) => (i < slots ? 'zone-cl' : down && i >= n - down ? 'zone-rel' : ''));
}

function liveRounds(c: YcComp, mid: string, today: string): RoundLite[] {
  return c.ko.map((rd, i) => ({
    index: i, name: rd.name, date: rd.dates[0], drawn: rd.drawn,
    ties: rd.ties.map((t, j) => {
      const sh = t.g.reduce((s, x) => s + x[0], 0), sa = t.g.reduce((s, x) => s + x[1], 0);
      const next = rd.dates[t.g.length];
      return {
        id: `${i}-${j}`, home: t.h, away: t.a, hg: t.g.length ? sh : null, ag: t.g.length ? sa : null,
        dec: (t.dec ?? 0) as 0 | 1 | 2, pen: t.pen, winner: t.w ?? null, date: !t.w && next && next >= today ? next : undefined,
        mine: t.h === mid || t.a === mid,
        scoreText: rd.legs === 2 && t.g.length ? `${sh}:${sa} (${t.g.map((x) => `${x[0]}:${x[1]}`).join(', ')})${t.dec === 2 && t.pen ? ` i. E. ${t.pen[0]}:${t.pen[1]}` : ''}` : undefined,
      };
    }),
  }));
}

function archRounds(c: YcArchComp, mid: string): RoundLite[] {
  return c.ko.map((rd, i) => ({
    index: i, name: rd.n, drawn: true,
    ties: rd.t.map((t, j) => ({
      id: `${i}-${j}`, home: t[0], away: t[1], hg: t[2], ag: t[3], dec: t[4] as 0 | 1 | 2, winner: t[5] || null,
      pen: t[6] != null ? [t[6], t[7] ?? 0] as [number, number] : undefined, mine: t[0] === mid || t[1] === mid,
      scoreText: t[8] ? `${t[2]}:${t[3]} (${t[8]})${t[4] === 2 && t[6] != null ? ` i. E. ${t[6]}:${t[7]}` : ''}` : undefined,
    })),
  }));
}

function statsLive(g: Game, st: YouthCompsState, c: YcComp): Record<StatCat, StatRow[]> {
  const entries = statEntries(g, st, c);
  const apps = new Map(entries.map((e) => [e.pid, e.t[0]]));
  const lists = topLists(entries, 15);
  const out = {} as Record<StatCat, StatRow[]>;
  for (const cat of STAT_CATS) out[cat] = lists[cat].map(([pid, value]) => { const [name, clubId, pos] = personOf(g, st, pid); return { pid, name, clubId, pos, value, apps: apps.get(pid) ?? 0 }; });
  return out;
}

function statsArch(g: Game, a: { people: Record<string, [string, string, string]> }, c: YcArchComp): Record<StatCat, StatRow[]> {
  const out = {} as Record<StatCat, StatRow[]>;
  for (const cat of STAT_CATS) out[cat] = (c.stats[cat] ?? []).map(([pid, value, apps]) => { const [name, clubId, pos] = a.people[pid] ?? (isVirtual(pid) ? virtualPerson(g, pid) : [pid, '', '']); return { pid, name, clubId, pos, value, apps }; });
  return out;
}

const groupRows = (rows: TableRowLite[]) => rows.map((r) => ({ id: r.clubId, played: r.p, won: r.w, drawn: r.d, lost: r.l, gf: r.gf, ga: r.ga, pts: r.pts }));

function advanceOf(fmt: string, stage: number): YcSnapshot['advance'] {
  if (fmt === 'nwl') return stage === 0 ? { n: 3, label: 'Hauptrunde Liga A' } : { n: 4, label: 'Achtelfinale' };
  if (fmt === 'uyl1') return { n: 2, label: 'Achtelfinale' };
  return { n: 1, label: 'Achtelfinale', transfer: { count: 1, label: 'Play-offs' } };
}

// -----------------------------------------------------------------------------
// Schnappschuss
// -----------------------------------------------------------------------------
export function youthSnapshot(g: Game, season: string, key: string): YcSnapshot | null {
  const st = youthCompsOf(g);
  const s = st && compsOf(st, season);
  if (!st || !s) return null;
  const opt = youthCompOptions(g, season).find((o) => o.key === key);
  if (!opt) return null;
  const [ck, part] = key.split(':');
  const mid = g.managedClubId;
  const today = g.calendar.currentDate;
  const live = s.live;
  const lc = live ? st.comps.find((c) => c.key === ck) : undefined;
  const ac = !live ? s.arch!.find((c) => c.key === ck) : undefined;
  const arch = !live ? st.archive.find((a) => a.season === season)! : undefined;
  if (!lc && !ac) return null;
  const meta = (lc ?? ac)!;
  const fmt = lc?.fmt ?? (ck === 'uyl' ? (Number(season.slice(0, 4)) < 2015 ? 'uyl1' : Number(season.slice(0, 4)) < 2024 ? 'uyl2' : 'uyl3') : ck === 'u19' || ck === 'u17' ? 'nwl' : '');
  const pts = lc?.pts ?? (g.pointSystem === '3-point' ? 3 : 2);
  const base: YcSnapshot = {
    key, label: opt.label, season, kind: opt.kind, source: live ? 'live' : 'archive',
    compKey: ck, compLabel: meta.label, section: meta.section, winner: lc ? lc.winner ?? null : ac!.winner,
    stats: lc ? statsLive(g, st, lc) : statsArch(g, arch!, ac!),
  };
  base.lowLevel = lc?.lvl ?? ac?.lvl;
  base.play = lc?.play ?? ac?.play;
  if (isLowKey(ck)) base.label = `${(lc?.cls ?? LOW_CLS[ck])}-Jugend · ${part === 'fest' ? 'Spielfeste' : opt.label}`;
  if (part === 'fest') return { ...base, fest: festOf(g, st, lc, ac, season) };
  if (part === 'ko') {
    return { ...base, rounds: lc ? liveRounds(lc, mid, today) : archRounds(ac!, mid) };
  }
  const tableOf = (l: YcLeague | YcArchComp['leagues'][number]): TableRowLite[] =>
    'fx' in l ? leagueTable(l, pts) : fromArch(l.rows);
  const leagues = (lc ? lc.leagues : ac!.leagues) as (YcLeague | YcArchComp['leagues'][number])[];
  if (part.startsWith('groups')) {
    const stage = Number(part.slice(6));
    const ls = leagues.filter((l) => l.group && l.stage === stage);
    return {
      ...base, groups: ls.map((l) => ({ name: l.name.replace(/^.*Gruppe /, 'Gruppe '), rows: groupRows(tableOf(l)) })),
      advance: advanceOf(fmt, stage),
    };
  }
  const l = leagues.find((x) => x.id === part);
  if (!l) return null;
  const table = tableOf(l);
  const snap: YcSnapshot = { ...base, table, zones: zonesFor(table.length, l.slots, l.down, ck) };
  if (lc && 'fx' in l) {
    snap.split = { home: leagueTable(l, pts, undefined, 'home'), away: leagueTable(l, pts, undefined, 'away') };
    snap.note = undefined;
  }
  return snap;
}

/** Eigene Lage je Wettbewerb (Kategorie-Übersicht, Info-Box). */
export interface YouthStanding { compKey: string; compLabel: string; cls: YcCls; fest?: boolean; league?: string; pos?: number; size?: number; ko?: string; next?: { date: string; opp: string; home: boolean; what: string } }

export function myYouthStandings(g: Game): YouthStanding[] {
  const st = youthCompsOf(g);
  if (!st || st.season !== g.season) return [];
  const mid = g.managedClubId;
  const today = g.calendar.currentDate;
  const out: YouthStanding[] = [];
  for (const c of st.comps) {
    const s: YouthStanding = { compKey: c.key, compLabel: c.label, cls: c.cls };
    const mine = c.leagues.filter((l) => l.clubs.includes(mid)).sort((a, b) => b.stage - a.stage)[0];
    if (mine) {
      const t = leagueTable(mine, c.pts);
      s.league = mine.name; s.pos = t.find((r) => r.clubId === mid)?.pos; s.size = t.length;
    }
    const nexts: NonNullable<YouthStanding['next']>[] = [];
    if (c.fest) {
      s.fest = true; s.league = c.label;
      const nd = c.fest.d.find((x) => x >= today);
      if (nd) s.next = { date: nd, opp: c.fest.h[c.fest.d.indexOf(nd)], home: c.fest.h[c.fest.d.indexOf(nd)] === mid, what: 'Spielfest' };
    }
    for (const l of c.leagues) for (const f of l.fx) if (f[3] < 0 && f[0] >= today && (f[1] === mid || f[2] === mid)) nexts.push({ date: f[0], opp: f[1] === mid ? f[2] : f[1], home: f[1] === mid, what: l.name });
    for (const rd of c.ko) for (const t of rd.ties) {
      if (t.h !== mid && t.a !== mid) continue;
      if (t.w) { s.ko = t.w === mid ? (rd === c.ko[c.ko.length - 1] ? 'Sieger' : `${rd.name}: weiter`) : `${rd.name}: ausgeschieden`; continue; }
      s.ko = rd.name;
      const leg = t.g.length;
      const date = rd.dates[leg];
      if (date && date >= today) nexts.push({ date, opp: t.h === mid ? t.a : t.h, home: leg === 0 ? t.h === mid : t.a === mid, what: rd.name });
    }
    s.next = nexts.sort((a, b) => a.date.localeCompare(b.date))[0];
    if (s.league || s.ko || s.next) out.push(s);
  }
  return out;
}

/** Je Jugendmannschaft des eigenen Vereins: Liga + Platz (A = U19-Meisterschaft, B = U17, C–G = Staffel). */
export function teamStandings(g: Game): Partial<Record<YcCls, YouthStanding>> {
  const out: Partial<Record<YcCls, YouthStanding>> = {};
  for (const s of myYouthStandings(g)) {
    if (s.compKey === 'pokal' || s.compKey === 'uyl' || s.compKey === 'ddr' && out.A) continue;
    if (!out[s.cls]) out[s.cls] = s;
  }
  return out;
}

/** Spielfeste: Termine, Gastgeber, Teilnahmen der eigenen Kinder. */
function festOf(g: Game, st: YouthCompsState, lc: YcComp | undefined, ac: YcArchComp | undefined, season: string): NonNullable<YcSnapshot['fest']> {
  const key = (lc ?? ac)!.key;
  const apps = Object.entries(lc ? st.stats[key] ?? {} : {}).map(([pid, t]) => {
    const [name, , pos] = personOf(g, st, pid);
    return { pid, name, pos, n: t[0] };
  }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  if (!lc) {
    const y0 = Number(season.slice(0, 4));
    return { note: festNoteFor(g, key, y0), dates: [], count: ac!.fest ?? 0, apps: [] };
  }
  return { note: lc.fest!.note, dates: lc.fest!.d.map((date, i) => ({ date, host: lc.fest!.h[i] })), count: lc.fest!.d.length, apps };
}

function festNoteFor(g: Game, key: YcKey, y0: number): string {
  if (!isLowKey(key)) return '';
  const mid = g.managedClubId;
  return lowFormat(key, y0, regionOf(g, mid), lvOf(g, mid), 0, isDdr(g, mid) && y0 < 1991).fest ?? '';
}
