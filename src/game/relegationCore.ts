// =============================================================================
// RELEGATION – KERN OHNE SPIELSTAND (Teilnehmer, Spiele, Sieger, Platztausch)
// -----------------------------------------------------------------------------
// Gemeinsam für das Heimatland (game/relegationHome.ts, Spiele über die Match-Engine
// bzw. das Schnellmodell der Sim-Ligen) und die Auslandsligen im Hintergrund
// (game/relegationWorld.ts, `worldMatchGoals`). Formate: data/relegationRules.ts.
// Der Saisonwechsel rechnet Auf-/Abstieg wie bisher; danach tauscht `relSwap` je
// Klammer den Verein, der den umkämpften Platz ohne Relegation bekommen hätte, mit
// dem Sieger der Relegation (Größen und Zahl der Auf-/Absteiger bleiben gleich).
// =============================================================================
import type { RelBracket, RelEnt, RelFormat, RelSlot } from '../data/relegationRules';
import { entPos } from '../data/relegationRules';
import { hashStr, mulberry32 } from '../engine/leagues';

/** Ein gespieltes (oder angesetztes) Spiel: Datum, Heim, Gast, Tore, Verlängerung, Elfmeterschießen. */
export interface RelLeg {
  d: string; h: string; a: string;
  hg?: number; ag?: number;
  /** nach Verlängerung */
  et?: 1;
  /** Elfmeterschießen [Heim, Gast] */
  p?: [number, number];
  /** ID (Heimatland: Kalender/Spielbericht) */
  id?: string;
}
/** Ein Duell einer Klammer (Spiel `m` der Format-Definition). */
export interface RelTie { m: number; legs: RelLeg[]; w?: string }
/** Eine Klammer einer Saison: Ebene, Format-Index im Land, Klammer-Index, Teilnehmer, Duelle, Sieger. */
export interface RelRecord {
  lv: number; b: number;
  /** Teilnehmer der Klammer (Vereins-IDs). */
  ent: string[];
  ties: RelTie[];
  w?: string;
  /** Entscheidungsspiel nicht nötig (keine Punktgleichheit). */
  skip?: 1;
  /** Teilnehmer aus der oberen Liga. */
  up?: string[];
}

/** Endstand einer Liga: Reihenfolge + Punkte. */
export interface RelStanding { ids: string[]; pts: Record<string, number> }
/** Tabellen an einer Ebenen-Grenze: obere Liga (eingleisig) und die Staffeln darunter. */
export interface RelTables { upper: RelStanding | null; lower: RelStanding[] }

export const isEnt = (s: RelSlot): s is RelEnt => 's' in s;

/** Verein auf dem Platz eines Teilnehmers (null = Liga/Platz fehlt). */
export function entId(e: RelEnt, t: RelTables): string | null {
  const st = e.s === 'u' ? t.upper : t.lower[e.g ?? 0];
  if (!st || st.ids.length < 4) return null;
  const pos = entPos(e, st.ids.length);
  return pos >= 1 && pos <= st.ids.length ? st.ids[pos - 1] : null;
}

/** Rang zum Vergleich „Besserplatzierter“: obere Liga vor unterer, dann Platz. */
export function seedOf(id: string, t: RelTables): number {
  const u = t.upper?.ids.indexOf(id) ?? -1;
  if (u >= 0) return u;
  for (const st of t.lower) { const k = st.ids.indexOf(id); if (k >= 0) return 1000 + k; }
  return 9999;
}

/** Klammer zu Teilnehmern auflösen; null = nicht spielbar (fehlende Liga, Entscheidungsspiel ohne Gleichstand → `skip`). */
export function resolveBracket(b: RelBracket, t: RelTables): { ent: string[]; up: string[]; skip?: boolean } | null {
  const ent: string[] = [], up: string[] = [];
  for (const m of b.m) for (const s of [m.a, m.b]) {
    if (!isEnt(s)) continue;
    const id = entId(s, t);
    if (!id || ent.includes(id)) return null;
    ent.push(id);
    if (s.s === 'u') up.push(id);
  }
  if (b.ifLevel) {
    const pt = (id: string) => (t.upper?.pts[id] ?? t.lower.find((x) => x.ids.includes(id))?.pts[id] ?? 0);
    if (ent.length === 2 && pt(ent[0]) !== pt(ent[1])) return { ent, up, skip: true };
  }
  return { ent, up };
}

/** Teilnehmer eines Platzes (Teilnehmer laut `rec.ent` in Reihenfolge der Klammer oder Sieger eines früheren Duells); '' = noch offen. */
export function slotId(s: RelSlot, b: RelBracket, rec: RelRecord): string {
  if (isEnt(s)) {
    const k = b.m.flatMap((m) => [m.a, m.b]).filter(isEnt).indexOf(s);
    return rec.ent[k] ?? '';
  }
  return rec.ties.find((x) => x.m === s.w)?.w ?? '';
}

/** Runde (0 = erste) eines Duells innerhalb der Klammer – für die Termine. */
export function roundOf(b: RelBracket, mi: number): number {
  const m = b.m[mi];
  const r = (s: RelSlot): number => (isEnt(s) ? -1 : roundOf(b, s.w));
  return 1 + Math.max(r(m.a), r(m.b));
}

/** Gesamtstand eines Duells aus Sicht von `a` (Heim im Hinspiel). */
function agg(tie: RelTie, a: string): { ga: number; gb: number; awayA: number; awayB: number } {
  let ga = 0, gb = 0, awayA = 0, awayB = 0;
  for (const l of tie.legs) {
    if (l.hg == null || l.ag == null) continue;
    if (l.h === a) { ga += l.hg; gb += l.ag; awayB += l.ag; } else { ga += l.ag; gb += l.hg; awayA += l.ag; }
  }
  return { ga, gb, awayA, awayB };
}

/**
 * Sieger eines gespielten Duells nach Gesamtstand, Auswärtstoren (`awayGoals`), Elfmeterschießen
 * und – ohne Elfmeterschießen – dem Besserplatzierten (`better`). null = noch nicht entschieden.
 */
export function tieWinner(tie: RelTie, awayGoals: boolean, better: (a: string, b: string) => string): string | null {
  const last = tie.legs[tie.legs.length - 1];
  if (!last || last.hg == null) return null;
  const a = tie.legs[0].h, b = tie.legs[0].a;
  const s = agg(tie, a);
  if (s.ga !== s.gb) return s.ga > s.gb ? a : b;
  if (awayGoals && tie.legs.length === 2 && s.awayA !== s.awayB) return s.awayA > s.awayB ? a : b;
  if (last.p) return last.p[0] > last.p[1] ? last.h : last.a;
  return better(a, b);
}

/** Steht das Duell vor dem letzten Spiel (inkl. Auswärtstore) unentschieden? Für die Schnellsimulation. */
export function tieLevel(tie: RelTie, awayGoals: boolean): boolean {
  const a = tie.legs[0].h;
  const s = agg(tie, a);
  return s.ga === s.gb && (!awayGoals || tie.legs.length < 2 || s.awayA === s.awayB);
}

export interface RelPlayOpts {
  /** Ergebnis der regulären Spielzeit (Heim/Gast). */
  goals: (h: string, a: string, neutral: boolean, r: () => number) => [number, number];
  /** Stärke für Verlängerung/Elfmeterschießen. */
  strength: (id: string) => number;
  awayGoals: boolean;
  tieBetter: boolean;
  better: (a: string, b: string) => string;
}

/** Letztes Spiel eines Duells im Schnellmodell zu Ende bringen (Verlängerung, Elfmeterschießen). */
export function finishQuick(tie: RelTie, leg: RelLeg, o: RelPlayOpts, r: () => number): void {
  if (!tieLevel(tie, o.awayGoals)) return;
  const sh = o.strength(leg.h), sa = o.strength(leg.a);
  // Verlängerung: ein Drittel der Torerwartung (je Tor 1/3 Chance aus einem zweiten Ergebnis).
  const [eh, ea] = o.goals(leg.h, leg.a, true, r);
  const xh = Array.from({ length: eh }).filter(() => r() < 1 / 3).length;
  const xa = Array.from({ length: ea }).filter(() => r() < 1 / 3).length;
  leg.et = 1;
  leg.hg = (leg.hg ?? 0) + xh; leg.ag = (leg.ag ?? 0) + xa;
  if (!tieLevel(tie, o.awayGoals) || o.tieBetter) return;
  const pH = Math.max(0.3, Math.min(0.7, 0.5 + (sh - sa) / 120));
  const hw = r() < pH;
  const lose = 2 + Math.floor(r() * 3);
  leg.p = hw ? [lose + 1, lose] : [lose, lose + 1];
}

/**
 * Eine Klammer komplett im Schnellmodell spielen (Hintergrund): Termine `dateOf(Duell, Spiel)`.
 * Gibt den Datensatz mit allen Spielen und dem Sieger zurück.
 */
export function playBracketQuick(
  b: RelBracket, lv: number, bi: number, t: RelTables, o: RelPlayOpts, seed: string,
  dateOf: (mi: number, leg: number) => string,
): RelRecord | null {
  const res = resolveBracket(b, t);
  if (!res) return null;
  const rec: RelRecord = { lv, b: bi, ent: res.ent, ties: [], ...(res.up.length ? { up: res.up } : {}) };
  if (res.skip) { rec.skip = 1; return rec; }
  const r = mulberry32(hashStr(`rel:${seed}`));
  for (let mi = 0; mi < b.m.length; mi++) {
    const def = b.m[mi];
    const a = slotId(def.a, b, rec), bb = slotId(def.b, b, rec);
    if (!a || !bb) return null;
    const tie: RelTie = { m: mi, legs: [] };
    rec.ties.push(tie);
    for (let k = 0; k < def.legs; k++) {
      const [h, aw] = k === 0 ? [a, bb] : [bb, a];
      const [hg, ag] = o.goals(h, aw, !!def.neutral, r);
      const leg: RelLeg = { d: dateOf(mi, k), h, a: aw, hg, ag };
      tie.legs.push(leg);
      if (k === def.legs - 1) finishQuick(tie, leg, o, r);
    }
    tie.w = tieWinner(tie, o.awayGoals, o.better) ?? a;
  }
  rec.w = rec.ties[rec.ties.length - 1]?.w;
  return rec;
}

/** Auswärtstore in der Saison `year`? */
export const awayGoalsIn = (f: RelFormat, year: number): boolean => f.awayGoalsTo != null && year <= f.awayGoalsTo;

// -----------------------------------------------------------------------------
// Platztausch nach dem Saisonwechsel
// -----------------------------------------------------------------------------
/** Eine Klammer für den Tausch: Teilnehmer + Sieger (alle Sieger einer Grenze bei `pool`). */
export interface RelOutcome { lv: number; ent: string[]; w: string; pool?: boolean; /** Teilnehmer aus der oberen Liga. */ upper?: string[] }

/**
 * Tauscht in `arrays` (Mitgliedschaften der neuen Saison; `levelOf(i)` = Ebene der Liste i) die Vereine so,
 * dass jeder Relegationssieger oben (Ebene ≤ lv) spielt: je Klammer der Verein, der ohne Relegation den
 * umkämpften Platz bekäme, gegen den Sieger. Geloste Aufstiegsspiele (`pool`) werden je Ebene gemeinsam
 * getauscht. Rückgabe: Zahl der Tausche.
 */
export function relSwap(arrays: string[][], levelOf: (i: number) => number, outs: RelOutcome[]): number {
  const find = (id: string): [number, number] | null => {
    for (let i = 0; i < arrays.length; i++) { const k = arrays[i].indexOf(id); if (k >= 0) return [i, k]; }
    return null;
  };
  const up = (id: string, lv: number) => { const f = find(id); return !!f && levelOf(f[0]) <= lv; };
  const swap = (x: string, y: string): boolean => {
    const fx = find(x), fy = find(y);
    if (!fx || !fy) return false;
    arrays[fx[0]][fx[1]] = y; arrays[fy[0]][fy[1]] = x;
    return true;
  };
  let n = 0;
  const rest = new Map<number, RelOutcome[]>();
  // Überzählige Plätze (Klammer mit mehr als einem Verein oben) und Klammern ohne Platz je Ebene.
  const surplus = new Map<number, string[]>(), deficit = new Map<number, string[]>();
  const push = (m: Map<number, string[]>, lv: number, id: string) => { const l = m.get(lv) ?? []; l.push(id); m.set(lv, l); };
  for (const o of outs) {
    const d = o.ent.filter((id) => up(id, o.lv));
    if (o.pool) { const l = rest.get(o.lv) ?? []; l.push(o); rest.set(o.lv, l); continue; }
    const notUpper = (id: string) => !(o.upper ?? []).includes(id);
    if (!d.length) { push(deficit, o.lv, o.w); continue; }
    if (!d.includes(o.w)) {
      // Gibt der Saisonwechsel der Klammer mehr als einen Platz, weicht zuerst ein Aufsteiger aus der unteren Liga.
      const victim = d.find(notUpper) ?? d[d.length - 1];
      if (swap(victim, o.w)) n++;
      d.splice(d.indexOf(victim), 1, o.w);
    }
    for (const id of [...d.filter((x) => x !== o.w && notUpper(x)), ...d.filter((x) => x !== o.w && !notUpper(x))]) push(surplus, o.lv, id);
  }
  // Ligagröße weicht von der historischen ab (z. B. zwei Plätze in einer Klammer, keiner in der anderen):
  // Sieger einer Klammer ohne Platz tauscht mit einem überzähligen Verein derselben Grenze.
  for (const [lv, wins] of deficit) {
    const sp = surplus.get(lv) ?? [];
    for (const w of wins) { const x = sp.shift(); if (x && swap(x, w)) n++; }
  }
  for (const [lv, list] of rest) {
    const ent = [...new Set(list.flatMap((o) => o.ent))];
    const wins = list.map((o) => o.w);
    const d = ent.filter((id) => up(id, lv));
    if (d.length !== wins.length) continue;
    const losers = d.filter((id) => !wins.includes(id)), gainers = wins.filter((id) => !d.includes(id));
    for (let i = 0; i < Math.min(losers.length, gainers.length); i++) if (swap(losers[i], gainers[i])) n++;
  }
  return n;
}
