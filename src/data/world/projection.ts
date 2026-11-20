// =============================================================================
// Fortschreibung der Weltdaten über die letzte echte Saison hinaus (Wunsch Pascal:
// Startjahr bis 2027, Saison 2027/28). Die Daten reichen je Land bis 2025/26; für
// spätere Startjahre wird jede fehlende Saison aus der vorigen abgeleitet:
//   - Stärke eines Vereins = mittlerer Rang der letzten 10 echten Saisons (2. Liga
//     zählt hinter der 1.), dazu ein fester Zufall je Land/Saison/Verein,
//   - daraus die Abschlusstabelle, Ab-/Aufstieg mit so vielen Plätzen wie zuletzt
//     tatsächlich getauscht wurden, ohne 2. Liga Nachrücker aus früheren Erstligisten,
//   - Europapokal-Plätze in derselben Anzahl wie zuletzt (Pokalsieger bleibt offen).
// Deterministisch (gleiche Daten = gleiche Fortschreibung). Echte Zeilen gehen immer vor.
// =============================================================================
import type { EuroComp, SeasonRow } from './types';

/** Saisons über die letzte echte hinaus, die fortgeschrieben werden (2025 → bis 2027). */
export const PROJECT_YEARS = 2;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

const yearsOf = (seasons: Record<number, SeasonRow>) => Object.keys(seasons).map(Number).filter((y) => Number.isFinite(y)).sort((a, b) => a - b);

/** Letztes Jahr mit echter Zeile. */
export function lastDataYear(seasons: Record<number, SeasonRow>): number | null {
  const ys = yearsOf(seasons).filter((y) => seasons[y]?.t1?.length >= 2);
  return ys.length ? ys[ys.length - 1] : null;
}

/** Mittlerer Rang (kleiner = stärker) aus den letzten 10 echten Saisons; 1. Liga 1..n, 2. Liga dahinter. */
function strengthMap(seasons: Record<number, SeasonRow>, last: number): Map<string, number> {
  const sum = new Map<string, { s: number; n: number }>();
  for (let y = last - 9; y <= last; y++) {
    const r = seasons[y];
    if (!r?.t1?.length) continue;
    const w = y === last ? 0.5 : 1; // laufende Saison: Reihenfolge = Vorjahr, halbes Gewicht
    const put = (id: string, rank: number) => { const o = sum.get(id) ?? { s: 0, n: 0 }; o.s += rank * w; o.n += w; sum.set(id, o); };
    r.t1.forEach((id, i) => put(id, (i + 1) / r.t1.length));
    for (const t2 of [r.t2, r.t2b]) t2?.forEach((id, i) => put(id, 1.15 + (i + 1) / t2.length));
  }
  return new Map([...sum].map(([id, o]) => [id, o.s / o.n]));
}

function table(ids: string[], str: Map<string, number>, key: string): string[] {
  const v = (id: string) => (str.get(id) ?? 1.6) + (hash(`${key}:${id}`) - 0.5) * 0.55;
  return [...ids].sort((a, b) => v(a) - v(b));
}

/** Zeile `year` (> letzte echte) oder null. */
export function projectRow(seasons: Record<number, SeasonRow>, year: number): SeasonRow | null {
  const last = lastDataYear(seasons);
  if (last == null || year <= last || year > last + PROJECT_YEARS || last < 2020) return null;
  const str = strengthMap(seasons, last);
  const prevReal = seasons[last - 1];
  let row: SeasonRow = seasons[last];
  for (let y = last; y < year; y++) {
    const key = `${y}`;
    const t1 = table(row.t1, str, `t1:${key}`);
    const groups = [row.t2, row.t2b].filter((g): g is string[] => !!g?.length).map((g, i) => table(g, str, `t2${i}:${key}`));
    // Getauscht wird so viel wie zuletzt echt (Aufsteiger der letzten echten Saison), 1–4.
    const swapped = prevReal ? seasons[last].t1.filter((id) => !prevReal.t1.includes(id)).length : 2;
    const n = Math.max(1, Math.min(4, swapped || 2));
    const down = t1.slice(-n);
    let up: string[];
    if (groups.length) {
      // Aufsteiger: die Besten jeder Staffel abwechselnd.
      up = [];
      for (let i = 0; up.length < n && i < 10; i++) for (const g of groups) if (up.length < n && g[i]) up.push(g[i]);
    } else {
      // Ohne 2. Liga: frühere Erstligisten, die gerade fehlen (stärkste zuerst).
      const out = [...str.keys()].filter((id) => !row.t1.includes(id) && (str.get(id) ?? 9) < 1.1);
      up = table(out, str, `up:${key}`).slice(0, n);
      if (up.length < n) down.splice(0, n - up.length);
    }
    const nt1 = [...t1.filter((id) => !down.includes(id)), ...up];
    // 2. Liga: Aufsteiger raus, Absteiger rein (reihum je Staffel); unten tauschen so viele
    // Zweitligisten gegen frühere Zweitligisten von außerhalb, wie Absteiger kamen.
    const t2s = groups.map((g) => g.filter((id) => !up.includes(id)));
    if (t2s.length) {
      const inAny = new Set([...nt1, ...t2s.flat(), ...down]);
      const back = table([...str.keys()].filter((id) => !inAny.has(id) && (str.get(id) ?? 9) >= 1.1), str, `t3:${key}`);
      t2s.forEach((g, gi) => {
        const size = groups[gi].length;
        const mine = down.filter((_, i) => i % t2s.length === gi);
        while (g.length + mine.length > size) g.pop();
        const k = Math.min(mine.length, back.length, Math.max(0, g.length - 4));
        g.splice(g.length - k, k, ...back.splice(0, k));
        g.unshift(...mine); // Absteiger als Favoriten vorn
      });
    }
    // Europapokal: gleiche Anzahl je Wettbewerb wie zuletzt, aus der Tabelle der eben beendeten Saison.
    const euro: Partial<Record<EuroComp, string[]>> = {};
    let pos = 0;
    for (const comp of Object.keys(row.euro ?? {}) as EuroComp[]) {
      const cnt = row.euro?.[comp]?.length ?? 0;
      euro[comp] = t1.slice(pos, pos + cnt);
      pos += cnt;
    }
    const next: SeasonRow = {
      t1: nt1,
      ...(t2s[0] ? { t2: t2s[0] } : {}),
      ...(t2s[1] ? { t2b: t2s[1] } : {}),
      euro,
      note: 'Fortschreibung ohne echte Daten: Reihenfolge = fortgeschriebene Vorsaison, Aufsteiger hinten.',
    };
    if (y + 1 === year) return next;
    row = next;
  }
  return null;
}
