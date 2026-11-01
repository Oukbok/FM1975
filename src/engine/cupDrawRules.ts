// =============================================================================
// Ziehung einer Pokalrunde ohne Oberfläche: Lostöpfe, Kugelreihenfolge,
// Länderschutz (zurückgelegte Kugeln), Setzliste, Heimrecht der Amateure.
// Deterministisch über den Seed – dieselbe Ziehung ergibt dieselben Paarungen.
// =============================================================================
import type { DrawBall, DrawPair } from '../types/draw';
import type { DrawRules } from '../data/drawHistory';
import { seededShuffle } from './cup';

export interface DrawInput {
  ids: string[];
  rules: DrawRules;
  seed: number;
  /**
   * Seed des bisherigen Verfahrens (cup.ts `drawRound`): Bei einem Topf ohne
   * Länderschutz wird exakt wie früher gemischt – gleiche Paarungen wie vor der
   * Ziehungs-Show, die Balance des Pokals bleibt unverändert.
   */
  legacySeed?: number;
  isAmateur: (id: string) => boolean;
  countryOf: (id: string) => string;
  strengthOf: (id: string) => number;
  nameOf: (id: string) => string;
}

export interface DrawOutput {
  pots: { label: string; ids: string[] }[];
  balls: DrawBall[];
  pairs: DrawPair[];
}

function rng32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ein Versuch; `null`, wenn der Länderschutz am Ende nicht aufging. */
function attempt(inp: DrawInput, rnd: () => number, potIdx: Map<string, number>, numbers: Map<string, number>): { balls: DrawBall[]; pairs: DrawPair[] } | null {
  const { rules } = inp;
  const clash = (a: string, b: string) => rules.countryProtection && inp.countryOf(a) === inp.countryOf(b);
  const balls: DrawBall[] = [];
  const pairs: DrawPair[] = [];
  const ball = (id: string, pair: number, rejected = false) =>
    balls.push({ id, pot: potIdx.get(id) ?? 0, no: numbers.get(id) ?? 0, pair: rejected ? -1 : pair, ...(rejected ? { rejected: true } : {}) });
  /** Zieht aus `pool` den ersten passenden Gegner zu `first`; unpassende Kugeln gehen zurück. */
  const drawPartner = (pool: string[], first: string, pairNo: number): string | null => {
    const idx = pool.findIndex((x) => !clash(first, x));
    if (idx < 0) return null;
    for (let k = 0; k < idx; k++) ball(pool[k], pairNo, true);
    const [b] = pool.splice(idx, 1);
    return b;
  };

  if (rules.twoPots || rules.seeded) {
    // Zwei Töpfe: Amateure werden immer zuerst gezogen (Heimrecht). Bei der
    // Setzliste entscheidet je Paarung das Los, aus welchem Topf die erste Kugel
    // kommt – im Spiel gibt es nur ein Spiel, beide Seiten sollen Heimspiele bekommen.
    const a = shuffle(inp.ids.filter((id) => potIdx.get(id) === 0), rnd);
    const b = shuffle(inp.ids.filter((id) => potIdx.get(id) === 1), rnd);
    while (a.length && b.length) {
      const flip = rules.seeded && !rules.twoPots && rnd() < 0.5;
      const [from, to] = flip ? [b, a] : [a, b];
      const first = from.shift()!;
      const pairNo = pairs.length;
      ball(first, pairNo);
      const second = drawPartner(to, first, pairNo);
      if (!second) return null;
      ball(second, pairNo);
      pairs.push({ home: first, away: second });
    }
    // Rest (ungleich große Töpfe): untereinander.
    const rest = [...a, ...b];
    while (rest.length >= 2) {
      const first = rest.shift()!;
      const pairNo = pairs.length;
      ball(first, pairNo);
      const second = drawPartner(rest, first, pairNo);
      if (!second) return null;
      ball(second, pairNo);
      pairs.push({ home: first, away: second });
    }
  } else {
    const pool = inp.legacySeed != null && !rules.countryProtection ? seededShuffle(inp.ids, inp.legacySeed) : shuffle(inp.ids, rnd);
    while (pool.length >= 2) {
      const first = pool.shift()!;
      const pairNo = pairs.length;
      ball(first, pairNo);
      const second = drawPartner(pool, first, pairNo);
      if (!second) return null;
      ball(second, pairNo);
      pairs.push({ home: first, away: second });
    }
  }
  if (rules.amateurHome) {
    for (const p of pairs) {
      if (!inp.isAmateur(p.home) && inp.isAmateur(p.away)) {
        [p.home, p.away] = [p.away, p.home];
        p.swapped = true;
      }
    }
  }
  return { balls, pairs };
}

export function runDraw(inp: DrawInput): DrawOutput {
  const { rules } = inp;
  // Töpfe bilden.
  let pots: { label: string; ids: string[] }[];
  if (rules.twoPots) {
    const am = inp.ids.filter(inp.isAmateur);
    const pro = inp.ids.filter((id) => !inp.isAmateur(id));
    pots = am.length && pro.length
      ? [{ label: 'Amateure', ids: am }, { label: 'Profis', ids: pro }]
      : [{ label: 'Lostopf', ids: [...inp.ids] }];
  } else if (rules.seeded && inp.ids.length >= 4) {
    const byStr = [...inp.ids].sort((x, y) => inp.strengthOf(y) - inp.strengthOf(x) || x.localeCompare(y));
    const half = Math.floor(byStr.length / 2);
    pots = [{ label: 'Ungesetzt', ids: byStr.slice(half) }, { label: 'Gesetzt', ids: byStr.slice(0, half) }];
  } else {
    pots = [{ label: 'Lostopf', ids: [...inp.ids] }];
  }
  const effRules: DrawRules = pots.length === 1 ? { ...rules, twoPots: false, seeded: false } : rules;
  // Losnummern: alphabetisch je Topf.
  const potIdx = new Map<string, number>();
  const numbers = new Map<string, number>();
  pots.forEach((p, pi) => {
    p.ids.sort((x, y) => inp.nameOf(x).localeCompare(inp.nameOf(y), 'de'));
    p.ids.forEach((id, i) => { potIdx.set(id, pi); numbers.set(id, i + 1); });
  });
  const rnd = rng32(inp.seed);
  const run = { ...inp, rules: effRules };
  for (let tries = 0; tries < 60; tries++) {
    const res = attempt(run, rnd, potIdx, numbers);
    if (res) return { pots, ...res };
  }
  // Länderschutz nicht erfüllbar → ohne Schutz losen.
  const res = attempt({ ...run, rules: { ...effRules, countryProtection: false } }, rnd, potIdx, numbers)!;
  return { pots, ...res };
}
