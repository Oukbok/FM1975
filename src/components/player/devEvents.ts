// Ereignis-Marker der Spielerentwicklung (Wunsch Pascal): große Sprünge in der Linie finden
// und aus echten Spieldaten aufschlüsseln, warum der Spieler gestiegen/gefallen ist.
// Quellen (nichts wird erfunden – ohne Treffer steht „ohne bekannten Anlass“):
//   • Bewertungsrunden mit Gründen und Beiträgen `development.ratingLog` (engine/ratingReasons.ts),
//     sonst nur die Bewertung selbst aus `development.abilityHistory`,
//   • Verletzungen `history.injuries` (Ausfall, Comeback), Wechsel/Leihen `history.transfers`,
//   • Positionswechsel `history.posChanges`, Trainingslager (Reiseliste/Wirkung in `camps`),
//   • Karrierephase aus dem Alter am Datum, im Zustandsverlauf das Formtief/-hoch.
import type { Player, WeekPoint } from '../../types';
import type { Game } from '../../game/state';
import type { CampHistoryEntry, CampState } from '../../game/winterShared';
import { campDestination } from '../../data/campDestinations';
import type { IconName } from '../Icon';
import { utcDate } from './shared';

const DAY = 86_400_000;
/** Ab so vielen Punkten (Summe gleichgerichteter Schritte) gilt eine Veränderung als groß. */
export const EVENT_MIN = 3;
/** Gleichgerichtete Schritte mit höchstens dieser Lücke zählen als ein Ereignis. */
const MERGE_GAP = 92 * DAY;
/** Ein Ereignis umfasst höchstens so viel Zeit („in kurzer Zeit“) – sonst wäre jeder Aufstieg eines Talents ein Block. */
const MAX_SPAN = 122 * DAY;
/** Vorlauf für Ursachen: was in den Monaten vor der Bewertung geschah, zählt mit. */
const LEAD = 120 * DAY;

export type CauseKind = 'rating' | 'injury' | 'transfer' | 'position' | 'camp' | 'age' | 'form' | 'none';
export interface CauseLine { text: string; v: number }
export interface Cause {
  kind: CauseKind;
  title: string;
  detail?: string;
  /** Beitrag in Punkten (Stärke), falls bekannt. */
  v?: number;
  /** Einzelgründe mit Beitrag (Bewertungsprotokoll). */
  lines?: CauseLine[];
}
export interface DevEvent {
  /** Index des Endpunkts in den angezeigten Punkten (dort sitzt der Marker). */
  i: number;
  d0: string; d1: string;
  from: number; to: number; delta: number;
  causes: Cause[];
}

const ts = (d: string) => Date.parse(d.slice(0, 10) + 'T00:00:00Z');
const day = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Alter in ganzen Jahren an einem Datum (aus dem Geburtsdatum). */
export function ageAt(dob: string | undefined, date: string): number | null {
  if (!dob) return null;
  const [by, bm, bd] = dob.slice(0, 10).split('-').map(Number);
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  if (!by || !y) return null;
  return y - by - (m * 100 + d < bm * 100 + bd ? 1 : 0);
}

export const signed = (v: number, digits = 0) => {
  const r = digits ? Math.round(v * 10 ** digits) / 10 ** digits : Math.round(v);
  if (r === 0) return '±0';
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

/** Große Veränderungen finden: gleichgerichtete Schritte bündeln, Summe ≥ EVENT_MIN. */
export function findSteps(pts: { d: string; t: number; val?: number }[]): Omit<DevEvent, 'causes'>[] {
  const out: Omit<DevEvent, 'causes'>[] = [];
  let cur: { s: number; e: number; sum: number } | null = null;
  const flush = () => {
    if (cur && Math.abs(cur.sum) >= EVENT_MIN) {
      const a = pts[cur.s].val!, b = pts[cur.e].val!;
      out.push({ i: cur.e, d0: pts[cur.s].d, d1: pts[cur.e].d, from: a, to: b, delta: b - a });
    }
    cur = null;
  };
  let prev = -1;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].val == null) continue;
    if (prev < 0) { prev = i; continue; }
    const dv = pts[i].val! - pts[prev].val!;
    if (dv !== 0) {
      if (cur && Math.sign(dv) === Math.sign(cur.sum) && pts[prev].t - pts[cur.e].t <= MERGE_GAP && pts[i].t - pts[cur.s].t <= MAX_SPAN) { cur.e = i; cur.sum += dv; }
      else { flush(); cur = { s: prev, e: i, sum: dv }; }
    }
    prev = i;
  }
  flush();
  return out;
}

function campsOf(g: Game | undefined): CampState | undefined {
  return (g as (Game & { camps?: CampState }) | undefined)?.camps;
}

/** Trainingslager, bei denen der Spieler nachweislich dabei war (Reiseliste bzw. gemessene Wirkung). */
function campsWith(p: Player, g: Game | undefined): { start: string; end: string; dest: string; dev?: number }[] {
  const st = campsOf(g);
  if (!st) return [];
  const out: { start: string; end: string; dest: string; dev?: number }[] = [];
  const seen = new Set<string>();
  const add = (id: string | undefined, start: string | undefined, end: string | undefined, destId: string, dev?: number) => {
    if (!start || !end || seen.has(id ?? start)) return;
    seen.add(id ?? start);
    out.push({ start, end, dest: campDestination(destId)?.name ?? 'Trainingslager', dev });
  };
  const delta = (h: CampHistoryEntry) => [...(h.result?.best ?? []), ...(h.result?.worst ?? [])].find((x) => x.id === p.id);
  for (const h of st.history ?? []) {
    const d = delta(h);
    if (d) add(h.bookingId, h.start, h.end, h.destId, d.dev);
  }
  for (const b of st.bookings ?? []) {
    if (!b.done) continue;
    const d = [...(b.result?.best ?? []), ...(b.result?.worst ?? [])].find((x) => x.id === p.id);
    if (d || b.squad?.includes(p.id)) add(b.id, b.start, b.end, b.destId, d?.dev);
  }
  return out;
}

function phase(age: number): string {
  if (age <= 20) return 'Talent: entwickelt sich noch stark';
  if (age <= 24) return 'Aufstieg: steigert sich weiter';
  if (age <= 32) return 'Spätphase: die körperlichen Werte lassen nach';
  return 'Karriereende naht: deutlicher Abbau der Physis';
}

interface Ctx { p: Player; g?: Game; today: string; weeks?: WeekPoint[]; away?: { a: string; b: string }[] }

/** Ursachen eines Ereignisses im Zeitraum (d0, d1] – nur aus vorhandenen Daten. */
export function causesFor(ev: Omit<DevEvent, 'causes'>, c: Ctx): Cause[] {
  const { p, g, today } = c;
  const t0 = ts(ev.d0), t1 = ts(ev.d1) + DAY - 1, lead = t0 - LEAD;
  const inWin = (d: string, from = t0) => { const t = ts(d); return t > from && t <= t1; };
  const out: Cause[] = [];
  const managed = !!g && p.clubId === g.managedClubId;

  // Bewertungsrunden: Protokoll mit Gründen, sonst die nackte Bewertung.
  const logged = (p.development.ratingLog ?? []).filter((r) => inWin(r.date) && r.change !== 0);
  for (const r of logged) {
    const lines = r.reasons.filter((x) => x.k !== 'generic').map((x) => ({ text: x.text, v: x.v }));
    out.push({
      kind: 'rating', title: `${r.label} am ${utcDate(r.date)}`, detail: `Stärke ${r.old} → ${r.new}${r.generic ? ' · noch ohne Einzelnachweis' : ''}`,
      v: r.change, lines,
    });
  }
  if (!logged.length) {
    const ah = p.development.abilityHistory ?? [];
    for (let k = 0; k < ah.length; k++) {
      const h = ah[k];
      if (!inWin(h.date)) continue;
      const before = k > 0 ? Math.round(ah[k - 1].ability) : null;
      const now = Math.round(h.ability);
      const ch = before != null ? now - before : null;
      if (ch === 0) continue;
      const then = c.away?.some((s) => h.date.slice(0, 10) > s.a && h.date.slice(0, 10) <= s.b);
      out.push({
        kind: 'rating', title: `Bewertungsrunde am ${utcDate(h.date)}`,
        detail: `${before != null ? `Stärke ${before} → ${now}` : `Stärke ${now}`} · ${managed && !then ? 'Gründe nicht mehr im Protokoll (es hält die letzten neun Bewertungen)' : then ? 'damals bei einem anderen Verein: Gründe hält das Spiel nur für deinen Kader fest' : 'Gründe protokolliert das Spiel nur für deinen Kader'}`,
        v: ch ?? undefined,
      });
    }
  }

  // Verletzungen, die in den Zeitraum (mit Vorlauf) fallen – ab zehn Tagen Ausfall.
  const inj = (p.history?.injuries ?? []).filter((x) => {
    if (x.days < 10) return false;
    const a = ts(x.date), b = a + x.days * DAY;
    return a <= t1 && b > lead;
  }).sort((a, b) => b.days - a.days).slice(0, 3);
  for (const x of inj) {
    const back = day(ts(x.date) + x.days * DAY);
    const weeks = Math.round(x.days / 7);
    out.push({
      kind: 'injury', title: `Verletzung: ${x.description}`,
      detail: `${weeks >= 2 ? `${weeks} Wochen` : `${x.days} Tage`} Ausfall ab ${utcDate(x.date)}${x.fromTraining ? ' (im Training)' : ''} · ${back > today ? `Comeback voraussichtlich ${utcDate(back)}` : `Comeback ${utcDate(back)}`}`,
    });
  }

  // Vereinswechsel und Leihen.
  for (const x of (p.history?.transfers ?? []).filter((x) => inWin(x.date, lead))) {
    const what = x.kind === 'loan' ? 'Leihe' : x.kind === 'back' ? 'Rückkehr von der Leihe' : 'Vereinswechsel';
    out.push({ kind: 'transfer', title: `${what}: ${x.fromClub} → ${x.toClub}`, detail: utcDate(x.date) });
  }

  // Neue Stammposition.
  for (const x of (p.history?.posChanges ?? []).filter((x) => inWin(x.d, lead))) {
    out.push({ kind: 'position', title: `Positionswechsel: ${x.from} → ${x.to}`, detail: `${utcDate(x.d)} · Stärke gilt jetzt für die neue Stammposition` });
  }

  // Trainingslager, bei denen er dabei war.
  for (const x of campsWith(p, g).filter((x) => ts(x.end) <= t1 && ts(x.end) > lead)) {
    out.push({
      kind: 'camp', title: `Trainingslager ${x.dest}`, detail: `${utcDate(x.start)} – ${utcDate(x.end)}${x.dev ? ` · Entwicklungspunkte ${signed(x.dev, 1)}` : ''}`,
      v: undefined,
    });
  }

  // Form im Wochenverlauf (nur Ansicht „Stärke & Zustand“).
  if (c.weeks?.length) {
    const ws = c.weeks.filter((w) => { const t = ts(w.d); return t > t0 - 28 * DAY && t <= t1; });
    if (ws.length >= 2) {
      const hi = Math.max(...ws.map((w) => w.f)), lo = Math.min(...ws.map((w) => w.f));
      const iHi = ws.findIndex((w) => w.f === hi), iLo = ws.findIndex((w) => w.f === lo);
      if (hi - lo >= 15) {
        out.push(iHi < iLo
          ? { kind: 'form', title: 'Formtief', detail: `Form ${hi} → ${lo} (Form zählt nicht zur Stärke, sie wirkt im Spiel)` }
          : { kind: 'form', title: 'Formhoch', detail: `Form ${lo} → ${hi} (Form zählt nicht zur Stärke, sie wirkt im Spiel)` });
      }
    }
  }

  // Karrierephase passend zur Richtung, wenn das Protokoll das Alter nicht schon nennt.
  const age = ageAt(p.dateOfBirth, ev.d1);
  const ageInLog = out.some((x) => x.lines?.some((l) => /^Alter \d+/.test(l.text)));
  if (age != null && !ageInLog && ((ev.delta < 0 && age >= 29) || (ev.delta > 0 && age <= 24))) {
    out.push({ kind: 'age', title: `Karrierephase mit ${age} Jahren`, detail: phase(age) });
  }

  if (!out.some((x) => x.kind !== 'age' && x.kind !== 'form')) {
    out.unshift({ kind: 'none', title: 'Ohne bekannten Anlass', detail: 'Für diesen Zeitraum ist keine Bewertung, Verletzung oder kein Wechsel festgehalten.' });
  }
  return out;
}

/** Leitsymbol eines Ereignisses (wichtigste Ursache). */
export function mainKind(ev: DevEvent): CauseKind {
  const has = (k: CauseKind) => ev.causes.some((c) => c.kind === k);
  const longInj = ev.causes.some((c) => c.kind === 'injury' && /(\d+) Wochen/.test(c.detail ?? '') && Number(/(\d+) Wochen/.exec(c.detail!)![1]) >= 4);
  if (ev.delta < 0 && longInj) return 'injury';
  for (const k of ['rating', 'transfer', 'position', 'camp', 'injury', 'age', 'form'] as CauseKind[]) if (has(k)) return k;
  return 'none';
}

export const KIND_ICON: Record<CauseKind, IconName> = {
  rating: 'trendUp', injury: 'medCross', transfer: 'swap', position: 'lineup', camp: 'training', age: 'hourglass', form: 'stats', none: 'info',
};

/** Höchstzahl Marker je Zeitraum – bei langen Zeiträumen nur die größten. */
export const MAX_MARKERS: Record<string, number> = { '1': 6, '3': 8, '5': 8, '10': 10, max: 10 };

/**
 * Ereignisse für die Ansicht: Schritte finden, die größten behalten, zu dicht
 * liegende kleinere weglassen (Abstand in viewBox-Einheiten über `xOf`).
 */
export function devEvents(
  pts: { d: string; t: number; val?: number }[], c: Ctx, opts: { max: number; xOf: (t: number) => number; gap?: number },
): { events: DevEvent[]; hidden: number } {
  const steps = findSteps(pts);
  const ranked = [...steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.d1.localeCompare(a.d1));
  const kept: typeof steps = [];
  for (const s of ranked) {
    if (kept.length >= opts.max) break;
    const x = opts.xOf(pts[s.i].t);
    if (kept.some((k) => Math.abs(opts.xOf(pts[k.i].t) - x) < (opts.gap ?? 22))) continue;
    kept.push(s);
  }
  kept.sort((a, b) => a.i - b.i);
  return { events: kept.map((s) => ({ ...s, causes: causesFor(s, c) })), hidden: steps.length - kept.length };
}

/**
 * Zeiträume bei einem anderen Verein (nur für Spieler deines Kaders): aus der
 * Transferhistorie (Wechsel/Leihe zu dir bzw. von dir weg). Ohne Wechsel = immer bei dir.
 * `a` leer = seit Beginn des Verlaufs.
 */
export function awaySpans(p: Player, g: Game | undefined, today: string): { a: string; b: string }[] {
  if (!g || p.clubId !== g.managedClubId) return [];
  const own = g.clubs[g.managedClubId]?.name;
  const list = [...(p.history?.transfers ?? [])].sort((x, y) => x.date.localeCompare(y.date));
  if (!own || !list.length) return [];
  const out: { a: string; b: string }[] = [];
  let ours = list[0].fromClub === own;
  let from = '';
  for (const t of list) {
    if (!ours && t.toClub === own) { if (t.date > from) out.push({ a: from, b: t.date }); ours = true; }
    else if (ours && t.fromClub === own && t.toClub !== own) { from = t.date; ours = false; }
  }
  if (!ours) out.push({ a: from, b: today });
  return out;
}

/** Ereignis in einem fremden Abschnitt ohne bekannte Ursache? (Dann kein Marker.) */
export function unknownAway(ev: DevEvent, spans: { a: string; b: string }[]): boolean {
  const inside = spans.some((s) => ev.d1 > s.a && ev.d1 <= s.b);
  return inside && !ev.causes.some((c) => c.kind !== 'none' && c.kind !== 'age' && c.kind !== 'form');
}
