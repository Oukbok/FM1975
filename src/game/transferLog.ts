// =============================================================================
// TRANSFERPROTOKOLL — alle Wechsel je Transferfenster (Transferbilanz-Popup,
// Top-Transfers der Liga, Transfermarkt › Transferbilanz).
// -----------------------------------------------------------------------------
// • Jeder Wechsel läuft über `recordTransfer` (engine/history.ts). Dort hängt
//   `bindTransferLog` einen Empfänger an, der einen schlanken Eintrag schreibt:
//   IDs, Zahlen, Name (falls der Spieler das Spiel verlässt) – keine Objekte.
// • Fenster-Schlüssel: „1978S“ = Sommer 1978 (Wechsel 1.2.–31.8.), „1979W“ =
//   Winter 1978/79 (1.9.–31.1.). Wechsel außerhalb der Fristen (Vertragsende
//   am 1. Juli, Leihende …) zählen zum nächsten Fensterschluss.
// • Speicher: höchstens 8 Fenster; die beiden neuesten vollständig (≤ 400),
//   ältere auf die 60 bedeutendsten Wechsel gekürzt.
// • Popup am Tag nach dem Fensterschluss (Kalenderereignis
//   `transfer_window_close`): `transferWindowDue` aus game/day.ts.
// • Alte Spielstände ohne Feld: `migrateTransferLog` baut die beiden letzten
//   Fenster aus den Spielerverläufen nach (was rekonstruierbar ist).
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { economyScale } from '../engine/economy';
import { setTransferSink, type TransferKind } from '../engine/history';
import { hashStr } from '../engine/leagues';
import type { Player } from '../types';
import type { Game } from './state';

export interface TLEntry {
  /** Datum */ d: string;
  /** Spieler-ID */ p: string;
  /** Name (bleibt, wenn der Spieler das Spiel verlässt) */ n: string;
  pos: string; ov: number; age: number; nat: string;
  /** Von/Zu: Vereins-ID, sonst Name („Ausland“, Unterklasse) */ f: string; t: string;
  /** Ablöse in 1975-Basis (fmtPrice) */ fee: number;
  k?: TransferKind;
}
export interface TLRenewal { d: string; p: string; n: string; pos: string; ov: number; c: string; until: string }
/** Gerücht beim Fensterschluss: Spieler + Interessent + Textvariante. */
export interface TLRumor { p: string; n: string; c: string; v: number }
/** Trainerkarussell beim Fensterschluss. */
export interface TLCoach { c: string; n: string; kind: 'entlassen' | 'ruhestand' | 'abgeworben' | 'vertragsende' | 'neu' | 'wackelt' }
export interface TLWindow {
  key: string;
  e: TLEntry[];
  r: TLRenewal[];
  gr?: TLRumor[];
  co?: TLCoach[];
  /** aus Spielerverläufen nachgebaut (alter Spielstand) */ rec?: boolean;
}
export interface TransferLog { wins: TLWindow[]; /** zuletzt gezeigtes Fenster */ shown?: string }

const MAX_WINS = 8;
const FULL_WINS = 2;
const CAP_FULL = 400;
const CAP_OLD = 60;
const CAP_REN = 60;
const CAP_REN_OLD = 15;

// ----------------------------------------------------------------- Fenster
/** Fenster, zu dem ein Datum gehört. */
export function windowKeyOf(date: string): string {
  const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7));
  if (m === 1) return `${y}W`;
  if (m >= 9) return `${y + 1}W`;
  return `${y}S`;
}
export const isWinterKey = (key: string) => key.endsWith('W');
export const keyYear = (key: string) => Number(key.slice(0, 4));
/** „Sommer 1978“ bzw. „Winter 1978/79“. */
export function windowLabel(key: string): string {
  const y = keyYear(key);
  return isWinterKey(key) ? `Winter ${y - 1}/${String(y).slice(2)}` : `Sommer ${y}`;
}
/** Letzter Tag des Fensters (Schluss der Frist). */
export const windowClose = (key: string) => (isWinterKey(key) ? `${keyYear(key)}-01-31` : `${keyYear(key)}-08-31`);
/** Erster Tag, der zum Fenster zählt. */
export const windowFrom = (key: string) => (isWinterKey(key) ? `${keyYear(key) - 1}-09-01` : `${keyYear(key)}-02-01`);
function prevKey(key: string): string {
  const y = keyYear(key);
  return isWinterKey(key) ? `${y - 1}S` : `${y}W`;
}

export function logOf(g: Game): TransferLog { return (g.transferLog ??= { wins: [] }); }
function winOf(g: Game, key: string): TLWindow {
  const log = logOf(g);
  let w = log.wins.find((x) => x.key === key);
  if (!w) {
    w = { key, e: [], r: [] };
    log.wins.push(w);
    log.wins.sort((a, b) => a.key.localeCompare(b.key));
    trimLog(log);
  }
  return w;
}

// ----------------------------------------------------------- Vereinsauflösung
const nameCache = new WeakMap<Game, { sig: string; map: Map<string, string> }>();
/** Vereins-ID zu einem Namen (Liga, Unterklasse, Ausland); undefined = unbekannt. */
export function clubIdByName(g: Game, name: string): string | undefined {
  const sig = `${g.season}:${Object.keys(g.clubs).length}:${Object.keys(g.simClubs ?? {}).length}`;
  let c = nameCache.get(g);
  if (!c || c.sig !== sig) {
    const map = new Map<string, string>();
    for (const e of Object.values(g.euroClubs ?? {})) map.set(e.name, e.id);
    for (const s of Object.values(g.simClubs ?? {})) { map.set(s.name, s.id); if (s.historicalName) map.set(s.historicalName, s.id); }
    for (const cl of Object.values(g.clubs)) map.set(cl.name, cl.id);
    c = { sig, map };
    nameCache.set(g, c);
  }
  return c.map.get(name);
}

const weight = (e: TLEntry, my: string) => (e.f === my || e.t === my ? 1000 : 0) + e.ov + Math.log10(1 + e.fee) * 4;

function trimLog(log: TransferLog, my = ''): void {
  if (log.wins.length > MAX_WINS) log.wins.splice(0, log.wins.length - MAX_WINS);
  log.wins.forEach((w, i) => {
    const old = i < log.wins.length - FULL_WINS;
    const cap = old ? CAP_OLD : CAP_FULL;
    if (w.e.length > cap) w.e = [...w.e].sort((a, b) => weight(b, my) - weight(a, my)).slice(0, cap).sort((a, b) => a.d.localeCompare(b.d));
    const rc = old ? CAP_REN_OLD : CAP_REN;
    if (w.r.length > rc) w.r = [...w.r].sort((a, b) => b.ov - a.ov).slice(0, rc);
    if (old) { if (w.gr) w.gr = w.gr.slice(0, 4); if (w.co) w.co = w.co.slice(0, 4); }
  });
}

// ------------------------------------------------------------------ Schreiben
function entryOf(g: Game, p: Player, from: string, to: string, feeNominal: number, date: string, kind?: TransferKind): TLEntry {
  const scale = economyScale(Number(date.slice(0, 4))) || 1;
  const e: TLEntry = {
    d: date, p: p.id, n: p.fullName, pos: p.naturalPosition, ov: Math.round(p.overall), age: p.age, nat: p.nationality || 'GER',
    f: clubIdByName(g, from) ?? from, t: clubIdByName(g, to) ?? to, fee: Math.round(feeNominal / scale),
  };
  if (kind) e.k = kind;
  return e;
}

/** Einen Wechsel eintragen (über den Empfänger in recordTransfer). */
export function logTransfer(g: Game, p: Player, from: string, to: string, feeNominal: number, date: string, kind?: TransferKind): void {
  const w = winOf(g, windowKeyOf(date));
  w.e.push(entryOf(g, p, from, to, feeNominal, date, kind));
  if (w.e.length > CAP_FULL * 1.25) trimLog(logOf(g), g.managedClubId);
}

/** Letzten Eintrag des Spielers als Leihe markieren (Leihe wird nach dem Wechsel vereinbart). */
export function noteLoan(g: Game, playerId: string): void {
  for (const w of [...(g.transferLog?.wins ?? [])].reverse()) {
    const e = [...w.e].reverse().find((x) => x.p === playerId);
    if (e) { e.k = 'loan'; return; }
  }
}

/** Vertragsverlängerung eintragen (Vertragsende am 1. Juli bzw. eigenes Gespräch). */
export function logRenewal(g: Game, p: Player, clubId: string, date: string): void {
  if (!g.clubs[clubId]) return;
  const w = winOf(g, windowKeyOf(date));
  w.r.push({ d: date, p: p.id, n: p.fullName, pos: p.naturalPosition, ov: Math.round(p.overall), c: clubId, until: p.contract.expiryDate });
  if (w.r.length > CAP_REN * 2) w.r = [...w.r].sort((a, b) => b.ov - a.ov).slice(0, CAP_REN);
}

/** Empfänger an recordTransfer hängen (bei jedem Tag und beim Laden). */
export function bindTransferLog(g: Game): void {
  logOf(g);
  setTransferSink((p, from, to, fee, date, kind) => {
    const cur = g.players[p.id] ?? g.youthPlayers?.[p.id];
    if (cur && cur !== p) return; // anderer Spielstand
    logTransfer(g, p, from, to, fee, date, kind);
  });
}

// ------------------------------------------------- Gerüchte & Trainerkarussell
/** Gerüchte zum Fensterschluss: gute Spieler der Liga mit auslaufendem Vertrag oder auf der Liste. */
export function buildRumors(g: Game, date: string, n = 5): TLRumor[] {
  const league = new Set(g.table.rows.map((r) => r.clubId));
  const bigs = Object.values(g.clubs).filter((c) => league.has(c.id)).sort((a, b) => b.reputation - a.reputation).slice(0, 8);
  const soon = CalendarEngine.addDays(date, 300);
  const cands = Object.values(g.players).filter((p) => league.has(p.clubId) && p.overall >= 66 && (p.transferListed || p.contract.expiryDate <= soon || (p.contract.satisfaction ?? 70) < 55))
    .sort((a, b) => b.overall - a.overall).slice(0, n * 2);
  const out: TLRumor[] = [];
  for (const p of cands) {
    const h = hashStr(`${p.id}:${date}`);
    const targets = bigs.filter((b) => b.id !== p.clubId && b.reputation >= (g.clubs[p.clubId]?.reputation ?? 0) - 6);
    if (!targets.length || h % 3 === 0) continue;
    out.push({ p: p.id, n: p.fullName, c: targets[h % targets.length].id, v: (h >>> 4) % 4 });
    if (out.length >= n) break;
  }
  return out;
}

/** Trainerwechsel im Fensterzeitraum + Trainer, die wackeln (nur beim Schluss bekannt). */
export function buildCoachNews(g: Game, key: string, live: boolean): TLCoach[] {
  const from = windowFrom(key), to = windowClose(key);
  const out: TLCoach[] = [];
  for (const c of Object.values(g.clubs)) {
    const hist = c.coachHistory ?? [];
    hist.forEach((h, i) => {
      if (h.to < from || h.to > to) return;
      out.push({ c: c.id, n: h.name, kind: h.reason });
      const succ = hist[i + 1]?.name ?? (c.coach && c.coach.since >= h.to ? c.coach.name : undefined);
      if (succ) out.push({ c: c.id, n: succ, kind: 'neu' });
    });
    if (live && c.coach && c.id !== g.managedClubId && c.coach.pressure >= 60) out.push({ c: c.id, n: c.coach.name, kind: 'wackelt' });
  }
  return out.slice(0, 12);
}

// -------------------------------------------------------------- Fensterschluss
/**
 * Am Tag nach einem Fensterschluss: Gerüchte/Trainer festhalten und den Schlüssel
 * zurückgeben, wenn das Popup erscheinen soll (einmal je Fenster, nur mit Wechseln).
 */
export function transferWindowDue(g: Game, today: string): string | null {
  const prev = CalendarEngine.addDays(today, -1);
  if (!CalendarEngine.eventsOn(g.calendar, prev).some((e) => e.type === 'transfer_window_close')) return null;
  const key = windowKeyOf(prev);
  const log = logOf(g);
  if (log.shown === key) return null;
  log.shown = key;
  const w = winOf(g, key);
  w.gr = buildRumors(g, today);
  w.co = buildCoachNews(g, key, true);
  trimLog(log, g.managedClubId);
  return w.e.length ? key : null;
}

/** Fenster, die schon geschlossen sind oder gerade laufen (neueste zuerst, nur mit Inhalt). */
export function windowsForView(g: Game): TLWindow[] {
  return [...(g.transferLog?.wins ?? [])].filter((w) => w.e.length || w.r.length).reverse();
}

// ------------------------------------------------------------------ Migration
/**
 * Alte Spielstände: die beiden letzten Fenster aus den Spielerverläufen nachbauen
 * (Spieler, die das Spiel verlassen haben, fehlen). Idempotent; hängt den Empfänger an.
 */
export function migrateTransferLog(g: Game): void {
  if (!g.transferLog) {
    const today = g.calendar.currentDate;
    const cur = windowKeyOf(today);
    const keys = new Set([cur, prevKey(cur)]);
    const log: TransferLog = { wins: [] };
    g.transferLog = log;
    for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers ?? {})]) {
      for (const t of p.history?.transfers ?? []) {
        const k = windowKeyOf(t.date);
        if (!keys.has(k) || t.date > today) continue;
        const w = winOf(g, k);
        w.rec = true;
        w.e.push(entryOf(g, p, t.fromClub, t.toClub, t.fee, t.date));
      }
    }
    for (const w of log.wins) w.e.sort((a, b) => a.d.localeCompare(b.d));
    // Kein altes Popup beim Laden: das zuletzt geschlossene Fenster gilt als gezeigt.
    log.shown = prevKey(cur);
    trimLog(log, g.managedClubId);
  }
  bindTransferLog(g);
}
