// =============================================================================
// Gruppen und Ligaphase im Europapokal: Spielpläne, Tabellen, Wertung.
//   • Vierergruppe Hin/Rück: 6 Spieltage, Rückrunde gespiegelt (Spieltag 4 = 3 mit
//     getauschtem Heimrecht, 5 = 2, 6 = 1).
//   • Fünfergruppe einfach (Europa-Pokal 2004–2008): 5 Spieltage, je Team 4 Spiele
//     mit zwei Heim- und zwei Auswärtsspielen, ein Spieltag spielfrei.
//   • Ligaphase (ab 2024/25): Gegner aus jedem Topf (zwei bzw. einer), Spieltage so
//     verteilt, dass jeder Verein an jedem Spieltag genau einmal spielt.
// Wertung je Epoche: data/euroFormats.ts `tiebreak`.
// =============================================================================
import type { CupGroup, GroupMatch } from '../types/euro2';

export interface Standing {
  id: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
  /** Auswärtstore und Auswärtssiege (Wertung). */
  agf: number; aw: number;
}

const GROUP_NAMES = 'ABCDEFGHIJKLMNOP';
export const groupName = (i: number) => GROUP_NAMES[i] ?? String(i + 1);

// -----------------------------------------------------------------------------
// Spielpläne
// -----------------------------------------------------------------------------
/** Paarungen [Heim, Gast] je Spieltag für eine Gruppe (Indizes der Teams). */
export function groupRounds(n: number, rr: 1 | 2): [number, number][][] {
  if (n === 5 && rr === 1) {
    // Kanten ±1 und ±2 (mod 5): i empfängt i+1 und i−2, spielt auswärts bei i−1 und i+2.
    const out: [number, number][][] = [];
    for (let r = 0; r < 5; r++) {
      const a = (r + 1) % 5, b = (r + 4) % 5, c = (r + 2) % 5, d = (r + 3) % 5;
      // (a,b): Abstand 3 ≡ −2 → b empfängt? b = a+3 = a−2 → a empfängt a−2 … a ist Heim gegen b.
      // (c,d): Abstand 1 → c empfängt c+1 = d.
      out.push([[a, b], [c, d]]);
    }
    return out;
  }
  // Kreisverfahren (gerade Anzahl, sonst mit Spielfrei-Platz).
  const m = n % 2 ? n + 1 : n;
  const idx = Array.from({ length: m }, (_, i) => i);
  const first: [number, number][][] = [];
  for (let r = 0; r < m - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < m / 2; i++) {
      const x = idx[i], y = idx[m - 1 - i];
      if (x >= n || y >= n) continue;
      pairs.push(r % 2 === 0 ? [x, y] : [y, x]);
    }
    first.push(pairs);
    idx.splice(1, 0, idx.pop()!);
  }
  if (rr === 1) return first;
  const second = [...first].reverse().map((ps) => ps.map(([h, a]) => [a, h] as [number, number]));
  return [...first, ...second];
}

/** Spiele einer Gruppe anlegen (Spieltag = Index in `dates`). */
export function buildGroupMatches(ids: string[], rr: 1 | 2, dates: string[], idPrefix: string): GroupMatch[] {
  const out: GroupMatch[] = [];
  groupRounds(ids.length, rr).forEach((pairs, md) => {
    pairs.forEach(([h, a], k) => out.push({
      id: `${idPrefix}_m${md}_${k}`, md, date: dates[md] ?? dates[dates.length - 1], home: ids[h], away: ids[a], hg: null, ag: null,
    }));
  });
  return out;
}

// -----------------------------------------------------------------------------
// Tabelle
// -----------------------------------------------------------------------------
function table(ids: string[], matches: GroupMatch[], winPts: number): Map<string, Standing> {
  const t = new Map<string, Standing>(ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, agf: 0, aw: 0 }]));
  for (const m of matches) {
    if (m.hg == null || m.ag == null) continue;
    const h = t.get(m.home), a = t.get(m.away);
    if (!h || !a) continue;
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg; a.agf += m.ag;
    if (m.hg > m.ag) { h.w++; a.l++; h.pts += winPts; }
    else if (m.hg < m.ag) { a.w++; h.l++; a.pts += winPts; a.aw++; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return t;
}

/**
 * Tabelle einer Gruppe (bzw. Ligaphase) mit der Wertung der Epoche:
 *   overall  Punkte, Tordifferenz, Tore, Auswärtstore (1991–1998)
 *   h2h      Punkte, direkter Vergleich (Punkte, Tordifferenz, Tore, Auswärtstore), dann Tordifferenz, Tore
 *   league   Punkte, Tordifferenz, Tore, Auswärtstore, Siege, Auswärtssiege (ab 2024/25)
 * Zuletzt entscheidet die Stärke (statt Koeffizient/Los).
 */
export function groupStandings(group: CupGroup, winPts: number, tiebreak: 'overall' | 'h2h' | 'league', strengthOf: (id: string) => number): Standing[] {
  const all = table(group.ids, group.matches, winPts);
  const rows = [...all.values()];
  const overall = (a: Standing, b: Standing) => (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
  const tail = (a: Standing, b: Standing) => strengthOf(b.id) - strengthOf(a.id) || a.id.localeCompare(b.id);
  if (tiebreak !== 'h2h') {
    rows.sort((a, b) => b.pts - a.pts || overall(a, b) || b.agf - a.agf
      || (tiebreak === 'league' ? b.w - a.w || b.aw - a.aw : 0) || tail(a, b));
    return rows;
  }
  // Direkter Vergleich: Punktgleiche Blöcke über ihre Spiele untereinander ordnen.
  rows.sort((a, b) => b.pts - a.pts);
  const out: Standing[] = [];
  for (let i = 0; i < rows.length;) {
    let j = i;
    while (j < rows.length && rows[j].pts === rows[i].pts) j++;
    const block = rows.slice(i, j);
    if (block.length > 1) {
      const ids = new Set(block.map((r) => r.id));
      const mini = table([...ids], group.matches.filter((m) => ids.has(m.home) && ids.has(m.away)), winPts);
      block.sort((a, b) => {
        const x = mini.get(a.id)!, y = mini.get(b.id)!;
        return y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || y.agf - x.agf || overall(a, b) || tail(a, b);
      });
    }
    out.push(...block);
    i = j;
  }
  return out;
}

/** Sind alle Spiele der Gruppe gespielt? */
export function groupDone(group: CupGroup): boolean {
  return group.matches.every((m) => m.hg != null);
}

// -----------------------------------------------------------------------------
// Ligaphase: Gegner je Topf + Spieltage
// -----------------------------------------------------------------------------
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Paarungen der Ligaphase. `pots`: Lostöpfe (gleich groß). Bei 4 Töpfen spielt jeder gegen
 * zwei Vereine je Topf (ein Heim-, ein Auswärtsspiel), bei 6 Töpfen gegen einen je Topf
 * (drei Heim-, drei Auswärtsspiele insgesamt). Länderschutz: keine Duelle innerhalb eines Landes.
 */
export function leaguePairings(pots: string[][], rnd: () => number, countryOf: (id: string) => string): [string, string][] {
  const two = pots.length <= 4;
  for (let tries = 0; tries < 400; tries++) {
    const strict = tries < 300;
    const edges: [string, string][] = [];
    const seen = new Set<string>();
    const ok = (a: string, b: string) => a !== b && !seen.has(a < b ? `${a}|${b}` : `${b}|${a}`) && (!strict || countryOf(a) !== countryOf(b));
    const add = (h: string, a: string) => { seen.add(h < a ? `${h}|${a}` : `${a}|${h}`); edges.push([h, a]); };
    let fail = false;
    const perm = (P: string[], Q: string[], test: (a: string, b: string) => boolean): string[] | null => {
      for (let k = 0; k < 60; k++) {
        const q = shuffle(Q, rnd);
        if (P.every((p, i) => test(p, q[i]))) return q;
      }
      return null;
    };
    for (let pi = 0; pi < pots.length && !fail; pi++) {
      const P = shuffle(pots[pi], rnd);
      if (two) {
        // Eigener Topf: Kreis (jeder ein Heim- und ein Auswärtsspiel gegen verschiedene Gegner).
        let cyc: string[] | null = null;
        for (let k = 0; k < 60 && !cyc; k++) {
          const c = shuffle(P, rnd);
          if (c.every((x, i) => ok(x, c[(i + 1) % c.length]))) cyc = c;
        }
        if (!cyc) { fail = true; break; }
        cyc.forEach((x, i) => add(x, cyc![(i + 1) % cyc!.length]));
      } else {
        // Ein Gegner aus dem eigenen Topf: Paare.
        let pairs: string[] | null = null;
        for (let k = 0; k < 60 && !pairs; k++) {
          const c = shuffle(P, rnd);
          let good = true;
          for (let i = 0; i + 1 < c.length; i += 2) if (!ok(c[i], c[i + 1])) good = false;
          if (good) pairs = c;
        }
        if (!pairs) { fail = true; break; }
        for (let i = 0; i + 1 < pairs.length; i += 2) add(pairs[i], pairs[i + 1]);
      }
      for (let qi = pi + 1; qi < pots.length && !fail; qi++) {
        const Q = pots[qi];
        const q1 = perm(P, Q, ok);
        if (!q1) { fail = true; break; }
        P.forEach((p, i) => add(p, q1[i]));
        if (two) {
          const q2 = perm(P, Q, ok);
          if (!q2) { fail = true; break; }
          P.forEach((p, i) => add(q2[i], p));
        }
      }
    }
    if (fail) continue;
    return two ? edges : balanceHome(edges);
  }
  return [];
}

/** Heim/Auswärts so ausrichten, dass jeder Verein gleich viele Heimspiele hat (Euler-Orientierung). */
function balanceHome(edges: [string, string][]): [string, string][] {
  const adj = new Map<string, { to: string; e: number }[]>();
  edges.forEach(([a, b], e) => {
    (adj.get(a) ?? adj.set(a, []).get(a)!).push({ to: b, e });
    (adj.get(b) ?? adj.set(b, []).get(b)!).push({ to: a, e });
  });
  const used = new Array(edges.length).fill(false);
  const out: [string, string][] = [];
  for (const start of adj.keys()) {
    const stack = [start];
    while (stack.length) {
      const v = stack[stack.length - 1];
      const list = adj.get(v)!;
      while (list.length && used[list[list.length - 1].e]) list.pop();
      if (!list.length) { stack.pop(); continue; }
      const { to, e } = list.pop()!;
      used[e] = true;
      out.push([v, to]);
      stack.push(to);
    }
  }
  return out;
}

/**
 * Spieltage verteilen: jede Kante bekommt einen Spieltag 0…k−1, kein Verein spielt zweimal
 * an einem Tag (Kantenfärbung mit Kempe-Tausch). `null`, wenn es nicht aufgeht.
 */
export function colorMatchdays(edges: [string, string][], k: number, rnd: () => number): number[] | null {
  for (let tries = 0; tries < 60; tries++) {
    const col = new Array<number>(edges.length).fill(-1);
    const at = new Map<string, Map<number, number>>(); // Verein → Farbe → Kante
    const slot = (v: string) => at.get(v) ?? at.set(v, new Map()).get(v)!;
    const order = shuffle(edges.map((_, i) => i), rnd);
    let ok = true;
    for (const e of order) {
      const [u, v] = edges[e];
      const su = slot(u), sv = slot(v);
      let c = -1;
      for (let x = 0; x < k; x++) if (!su.has(x) && !sv.has(x)) { c = x; break; }
      if (c < 0) {
        // Kempe-Kette: Farbe a frei bei u, b frei bei v; a/b-Pfad ab v tauschen.
        const a = [...Array(k).keys()].find((x) => !su.has(x));
        const b = [...Array(k).keys()].find((x) => !sv.has(x));
        if (a == null || b == null) { ok = false; break; }
        const path: number[] = [];
        let cur = v, want = a, guard = 0;
        while (guard++ < 200) {
          const ed = slot(cur).get(want);
          if (ed == null) break;
          path.push(ed);
          const [x, y] = edges[ed];
          cur = x === cur ? y : x;
          want = want === a ? b : a;
        }
        if (cur === u) { ok = false; break; }
        for (const ed of path) { const [x, y] = edges[ed]; slot(x).delete(col[ed]); slot(y).delete(col[ed]); }
        for (const ed of path) { col[ed] = col[ed] === a ? b : a; const [x, y] = edges[ed]; slot(x).set(col[ed], ed); slot(y).set(col[ed], ed); }
        if (su.has(a) || sv.has(a)) { ok = false; break; }
        c = a;
      }
      col[e] = c; su.set(c, e); sv.set(c, e);
    }
    if (ok && col.every((c) => c >= 0)) return col;
  }
  return null;
}

/** Ligaphase als eine Gruppe anlegen. Ohne gültige Verteilung: Kreisverfahren als Rückfall. */
export function buildLeaguePhase(pots: string[][], matches: number, dates: string[], rnd: () => number, countryOf: (id: string) => string, idPrefix: string): GroupMatch[] {
  const ids = pots.flat();
  let edges: [string, string][] = [];
  let col: number[] | null = null;
  for (let t = 0; t < 30 && !col; t++) {
    edges = leaguePairings(pots, rnd, countryOf);
    col = edges.length ? colorMatchdays(edges, matches, rnd) : null;
  }
  if (!col) {
    // Rückfall: die ersten `matches` Runden eines Kreisverfahrens (jeder genau einmal je Spieltag).
    const rounds = groupRounds(ids.length, 1).slice(0, matches);
    edges = []; col = [];
    rounds.forEach((ps, md) => ps.forEach(([h, a]) => { edges.push([ids[h], ids[a]]); col!.push(md); }));
  }
  return edges.map(([h, a], i) => ({ id: `${idPrefix}_m${col![i]}_${i}`, md: col![i], date: dates[col![i]], home: h, away: a, hg: null, ag: null }));
}
