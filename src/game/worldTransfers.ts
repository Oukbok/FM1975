// =============================================================================
// TRANSFERS UND LEIHEN DER AUSLANDSVEREINE (Wunsch Pascal: „wirklich alles wie in
// Deutschland“) – Reiter „Transfers“ im Vereinsprofil wie bei deutschen Vereinen.
// -----------------------------------------------------------------------------
// Weltspieler (game/worldPool.ts) wechseln in zwei Fenstern:
//  • Sommer (`worldSummerWindow` aus `worldPoolSeason`, Termine 1.7.–31.8.):
//    Leih-Rückkehrer, herausragende Spieler zu stärkeren Vereinen (Ablöse), der
//    abgebende Verein kauft Ersatz bei einem schwächeren Verein, Routiniers ohne
//    Stammplatz gehen eine Stufe tiefer, junge Ergänzungsspieler werden verliehen.
//  • Winter (`worldWinterWindow` am 5.1., Termine 5.–31.1.): wenige Wechsel und Leihen.
// Protokoll kompakt (`game.worldTransfers`): eine Vereinsliste + je Saison eine Zeichenkette (die letzten
// `WORLD_TRANSFERS_FULL` Saisons vollständig, ältere nur Wechsel mit Ablöse ab Stärke 66),
// je Wechsel „Tag|ID|Name|Pos|Stärke|Alter|von|zu|Ablöse/1000|Art“ (Zahlen Basis 36,
// Vereine als Index), ≈ 40 Byte je Wechsel. Laufende Leihen in `l`.
// Gezeigt wird nur, was am heutigen Tag schon passiert ist (Datum ≤ heute).
// =============================================================================
import { marketValueFor } from '../engine/clubEconomy';
import { POSITION_GROUPS, type Player, type Position } from '../types';
import type { ClubTransferRow, ClubTransferSeason } from './clubTransfers';
import type { Game } from './state';

/** Felder des Weltspieler-Tupels (wie `WP_FIELD` in game/worldPool.ts – hier ohne Import, keine Zyklen). */
const F = { id: 0, club: 1, first: 2, last: 3, born: 6, pos: 7, ov: 8, pot: 9, youth: 12, shirt: 13 } as const;
type Tup = (string | number | undefined)[];
interface ClubLite { id: string; country: string; level: number; strength: number }

export interface WorldTransferStore {
  v: 1;
  /** Vereinsliste aller Saisons (Index in den Zeilen). */
  c: string[];
  /** Je Saison alle Wechsel `r` (Zeilen durch „;“ getrennt), `k` = ausgedünnt. */
  s: Record<string, { r: string; k?: 1 }>;
  /** Laufende Leihen: Spieler-ID → [Stammverein, Jahr der Rückkehr im Sommer]. */
  l: Record<string, [string, number]>;
  /** Jahr des letzten Winterfensters (Doppelausführung vermeiden). */
  w?: number;
}

/** So viele Saisons bleiben vollständig; ältere behalten nur Wechsel mit Ablöse von Spielern ab Stärke `KEEP_OV` (Spielstandgröße). */
export const WORLD_TRANSFERS_FULL = 10;
const KEEP_OV = 66;

/** Ältere Saisons ausdünnen (≈ 95 KB je volle Saison → ≈ 10 KB). Gekürzte Saisons tragen `k`. */
function pruneOld(st: WorldTransferStore, year: number): void {
  for (const [season, e] of Object.entries(st.s)) {
    if (e.k || Number(season.slice(0, 4)) > year - WORLD_TRANSFERS_FULL) continue;
    e.r = e.r.split(';').filter((row) => { const f = row.split('|'); return !f[9] && parseInt(f[8], 36) > 0 && parseInt(f[4], 36) >= KEEP_OV; }).join(';');
    e.k = 1;
  }
}

const EAST = new Set(['Sowjetunion', 'Polen', 'Ungarn', 'Tschechoslowakei', 'Rumaenien', 'Bulgarien', 'Albanien', 'Jugoslawien']);
const b36 = (n: number) => Math.max(0, Math.round(n)).toString(36);
const DAY = 86_400_000;

function storeOf(g: Game): WorldTransferStore { return (g.worldTransfers ??= { v: 1, c: [], s: {}, l: {} }); }

const seasonOf = (date: string) => {
  const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7));
  const s = m >= 7 ? y : y - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
};
const seasonStart = (season: string) => Date.UTC(Number(season.slice(0, 4)), 6, 1);

function log(g: Game, date: string, w: Tup, year: number, from: string, to: string, fee: number, kind: '' | 'l' | 'b'): void {
  const season = seasonOf(date);
  const st = storeOf(g);
  const e = (st.s[season] ??= { r: '' });
  const idx = (id: string) => { let i = st.c.indexOf(id); if (i < 0) { st.c.push(id); i = st.c.length - 1; } return i; };
  const day = Math.round((Date.parse(`${date}T00:00:00Z`) - seasonStart(season)) / DAY);
  const name = `${w[F.first]} ${w[F.last]}`.trim().replace(/[|;]/g, ' ');
  const row = [b36(day), w[F.id], name, w[F.pos], b36(w[F.ov] as number), b36(year - (w[F.born] as number)), b36(idx(from)), b36(idx(to)), b36(fee / 1000), kind].join('|');
  e.r = e.r ? `${e.r};${row}` : row;
}

function valueOf(w: Tup, year: number): number {
  return marketValueFor({ age: year - (w[F.born] as number), overall: w[F.ov], development: { basePotential: w[F.pot] } } as unknown as Player, year);
}

const grp = (w: Tup) => POSITION_GROUPS[w[F.pos] as Position];
const dateIn = (year: number, month: number, from: number, to: number, r: () => number) => {
  const t = Date.UTC(year, month, from) + Math.floor(r() * (to - from + 1)) * DAY;
  return new Date(t).toISOString().slice(0, 10);
};

function move(w: Tup, to: string): void {
  w[F.club] = to; w[F.youth] = 0;
  if (w.length > F.shirt) w.length = F.shirt; // neue Rückennummer (numberWorldPool)
}

interface Ctx {
  g: Game; year: number; r: () => number;
  clubs: Map<string, ClubLite>;
  /** Vereine nach Stärke absteigend. */
  list: ClubLite[];
  byClub: Map<string, Tup[]>;
  date: () => string;
  /** Schon bewegte Spieler (je Fenster höchstens ein Wechsel). */
  moved: Set<string>;
}

const closed = (c: Ctx, a: ClubLite, b: ClubLite) => c.year < 1990 && a.country !== b.country && (EAST.has(a.country) || EAST.has(b.country));

function relocate(c: Ctx, w: Tup, from: ClubLite, to: ClubLite, fee: number, kind: '' | 'l' | 'b'): void {
  const l = c.byClub.get(from.id); if (l) { const i = l.indexOf(w); if (i >= 0) l.splice(i, 1); }
  (c.byClub.get(to.id) ?? c.byClub.set(to.id, []).get(to.id)!).push(w);
  move(w, to.id);
  c.moved.add(w[F.id] as string);
  log(c.g, c.date(), w, c.year, from.id, to.id, kind === '' ? fee : 0, kind);
}

function pick<T>(xs: T[], r: () => number): T | undefined { return xs.length ? xs[Math.floor(r() * xs.length)] : undefined; }

/** Vereine im Stärkefenster (eigenes Land bevorzugt). */
function clubsIn(c: Ctx, from: ClubLite, lo: number, hi: number, homeShare: number): ClubLite[] {
  const cands = c.list.filter((x) => x.id !== from.id && x.strength >= lo && x.strength <= hi && !closed(c, from, x));
  const home = cands.filter((x) => x.country === from.country);
  return home.length && c.r() < homeShare ? home : cands;
}

/** Einkauf: passender Spieler (Mannschaftsteil, Stärke um `want`) eines schwächeren Vereins – Ersatz für einen Abgang oder Verstärkung. */
function buyPlayer(c: Ctx, buyer: ClubLite, group: string, want: number): void {
  const sellers = clubsIn(c, buyer, buyer.strength - 14, buyer.strength - 3, 0.7);
  let best: { w: Tup; s: ClubLite; d: number } | null = null;
  for (let k = 0; k < 6 && sellers.length; k++) {
    const s = pick(sellers, c.r)!;
    for (const w of c.byClub.get(s.id) ?? []) {
      const age = c.year - (w[F.born] as number);
      if (w[F.youth] || age < 20 || age > 29 || grp(w) !== group || c.moved.has(w[F.id] as string) || c.g.worldTransfers?.l[w[F.id] as string]) continue;
      const d = Math.abs((w[F.ov] as number) - want);
      if ((w[F.ov] as number) >= buyer.strength - 6 && (!best || d < best.d)) best = { w, s, d };
    }
  }
  if (best) relocate(c, best.w, best.s, buyer, valueOf(best.w, c.year) * (0.8 + c.r() * 0.5), '');
}

/** Schwächster Mannschaftsteil (Ø der Stammkräfte 1/4/4/2 gegen die Vereinsstärke) – dort wird verstärkt. */
const UNIT_N: Record<string, number> = { GK: 1, DEF: 4, MID: 4, ATT: 2 };
function weakestUnit(c: Ctx, clubId: string): string {
  const l = (c.byClub.get(clubId) ?? []).filter((w) => !w[F.youth]);
  let best = 'MID', low = Infinity;
  for (const [g, n] of Object.entries(UNIT_N)) {
    const xs = l.filter((w) => grp(w) === g).map((w) => w[F.ov] as number).sort((a, b) => b - a).slice(0, n);
    const avg = xs.length < n ? 0 : xs.reduce((a, b) => a + b, 0) / n;
    if (avg < low) { low = avg; best = g; }
  }
  return best;
}

/** Ein Transferfenster der Welt (Sommer: volle Stärke, Winter: `scale` < 1). */
function runWindow(c: Ctx, scale: number): void {
  const loans = storeOf(c.g).l;
  // 1) Herausragende Spieler wechseln zu stärkeren Vereinen (Ablöse), der Verkäufer kauft Ersatz.
  for (const w of [...c.byClub.values()].flat()) {
    const club = c.clubs.get(w[F.club] as string);
    const age = c.year - (w[F.born] as number);
    const lead = scale < 1 ? 10 : 9;
    if (!club || age < 19 || age > 30 || (w[F.ov] as number) < club.strength + lead || loans[w[F.id] as string] || c.moved.has(w[F.id] as string) || c.r() > 0.6 * scale) continue;
    const want = (w[F.ov] as number) - 4;
    const to = pick(clubsIn(c, club, want, want + 10, 0.6), c.r);
    if (!to) continue;
    const fee = valueOf(w, c.year) * (0.9 + c.r() * 0.6) * (to.strength > club.strength + 8 ? 1.15 : 1);
    relocate(c, w, club, to, fee, '');
    if (c.r() < 0.75) buyPlayer(c, club, grp(w), (w[F.ov] as number) - 3);
  }
  // 1b) Verstärkung: Erstligisten holen je Fenster einen Spieler auf Stammplatz-Niveau (der Kader wird danach nachgeführt).
  for (const club of c.list) if (club.level === 1 && c.r() < 0.45 * scale) buyPlayer(c, club, weakestUnit(c, club.id), club.strength + 1);
  // 2) Routiniers ohne Stammplatz eine Stufe tiefer (meist ablösefrei), junge Ergänzungsspieler auf Leihe.
  for (const [cid, l] of [...c.byClub.entries()]) {
    const club = c.clubs.get(cid);
    if (!club) continue;
    const pros = l.filter((w) => !w[F.youth]).sort((a, b) => (b[F.ov] as number) - (a[F.ov] as number));
    pros.forEach((w, rank) => {
      const id = w[F.id] as string;
      if (c.moved.has(id) || loans[id]) return;
      const age = c.year - (w[F.born] as number);
      if (age >= 30 && age <= 33 && rank >= 13 && c.r() < 0.22 * scale) {
        const to = pick(clubsIn(c, club, club.strength - 15, club.strength - 4, 0.85), c.r);
        if (to) relocate(c, w, club, to, c.r() < 0.6 ? 0 : valueOf(w, c.year) * 0.4, '');
      } else if (age >= 18 && age <= 21 && rank >= 15 && (w[F.ov] as number) < club.strength - 5 && c.r() < 0.16 * scale) {
        const to = pick(clubsIn(c, club, club.strength - 18, club.strength - 6, 0.9), c.r);
        if (!to) return;
        relocate(c, w, club, to, 0, 'l');
        loans[id] = [club.id, scale < 1 ? c.year : c.year + 1];
      }
    });
  }
}

function context(g: Game, pool: Tup[], clubs: Map<string, ClubLite>, year: number, r: () => number, date: () => string): Ctx {
  const byClub = new Map<string, Tup[]>();
  for (const w of pool) { const k = w[F.club] as string; const l = byClub.get(k); if (l) l.push(w); else byClub.set(k, [w]); }
  return { g, year, r, clubs, list: [...clubs.values()].sort((a, b) => b.strength - a.strength), byClub, date, moved: new Set() };
}

/** Sommerfenster (aus `worldPoolSeason`, nach Entwicklung/Karriereende, vor dem Nachführen der Kader). */
export function worldSummerWindow(g: Game, pool: Tup[], clubs: Map<string, ClubLite>, year: number, r: () => number): void {
  const st = storeOf(g);
  const c = context(g, pool, clubs, year, r, () => dateIn(year, 6, 1, 61, r));
  // Leih-Rückkehrer zum 1.7.
  const byId = new Map(pool.map((w) => [w[F.id] as string, w]));
  for (const [pid, [owner, back]] of Object.entries(st.l)) {
    const w = byId.get(pid);
    if (!w) { delete st.l[pid]; continue; }
    if (back > year) continue;
    delete st.l[pid];
    const from = clubs.get(w[F.club] as string), to = clubs.get(owner);
    if (!from || !to || from.id === to.id) continue;
    const l = c.byClub.get(from.id); if (l) { const i = l.indexOf(w); if (i >= 0) l.splice(i, 1); }
    (c.byClub.get(to.id) ?? c.byClub.set(to.id, []).get(to.id)!).push(w);
    move(w, to.id);
    log(g, `${year}-07-01`, w, year, from.id, to.id, 0, 'b');
  }
  runWindow(c, 1);
  pruneOld(st, year);
}

/** Winterfenster: am 5.1. einmal je Winter (Aufruf `worldPoolWinter` in game/worldPool.ts aus day.ts). */
export function worldWinterWindow(g: Game, pool: Tup[], clubs: Map<string, ClubLite>, today: string): boolean {
  if (today.slice(5) !== '01-05') return false;
  const year = Number(today.slice(0, 4));
  const st = storeOf(g);
  if (st.w === year || !clubs.size) return false;
  st.w = year;
  let a = (year * 2654435761) >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  runWindow(context(g, pool, clubs, year, r, () => dateIn(year, 0, 5, 26, r)), 0.25);
  return true;
}

// -----------------------------------------------------------------------------
// Lesen (Vereinsprofil › Transfers)
// -----------------------------------------------------------------------------
/** Saisons mit Wechseln der Weltspieler. */
export const worldTransferSeasons = (g: Game): string[] => Object.keys(g.worldTransfers?.s ?? {});

/** Wechsel eines Vereins in einer Saison (nur bis heute), aufgeteilt wie bei deutschen Vereinen. */
export function worldTransfersOf(g: Game, clubId: string, season: string, out: ClubTransferSeason): void {
  const st = g.worldTransfers;
  const e = st?.s[season];
  const ci = e ? st!.c.indexOf(clubId) : -1;
  if (!e || ci < 0 || !e.r) return;
  const today = g.calendar.currentDate;
  const t0 = seasonStart(season);
  const me = ci.toString(36);
  for (const row of e.r.split(';')) {
    const f = row.split('|');
    if (f[6] !== me && f[7] !== me) continue;
    const date = new Date(t0 + parseInt(f[0], 36) * DAY).toISOString().slice(0, 10);
    if (date > today) continue;
    const toMe = f[7] === me;
    const kind = f[9] === 'l' ? 'loan' : f[9] === 'b' ? 'back' : undefined;
    const r: ClubTransferRow = {
      date, pid: f[1], name: f[2], pos: f[3], ov: parseInt(f[4], 36), age: parseInt(f[5], 36),
      other: st!.c[parseInt(toMe ? f[6] : f[7], 36)] ?? '', fee: parseInt(f[8], 36) * 1000, kind,
    };
    if (kind === 'loan') (toMe ? out.loanedIn : out.loanedOut).push(r);
    else (toMe ? out.ins : out.outs).push(r);
  }
}

/** Wechsel aller Saisons mit Ablöse (für Rekordtransfers im Reiter „Historie“). */
export function worldTransferRecords(g: Game, clubId: string): { ins: ClubTransferRow[]; outs: ClubTransferRow[] } {
  const all: ClubTransferSeason = { ins: [], outs: [], loanedIn: [], loanedOut: [] };
  for (const s of worldTransferSeasons(g)) worldTransfersOf(g, clubId, s, all);
  const top = (xs: ClubTransferRow[]) => xs.filter((x) => x.fee > 0 && !x.kind).sort((a, b) => b.fee - a.fee).slice(0, 3);
  return { ins: top(all.ins), outs: top(all.outs) };
}
