// =============================================================================
// HALLENSPIEL IM KURZEN TEXTMODUS – zerlegt die Torerwartung aus indoorRates
// (engine/indoor.ts) in Minuten: Tore je Minute ~ Poisson(Rate/Minute), die Summe
// hat dieselbe Verteilung wie simIndoorMatch. Dazu Szenen ohne Tor (Bande,
// Pfosten, Paraden), Zeitstrafe, Halbzeit (K.-o.: 2 × 10 Min.), Neunmeterschießen.
// Kleine Entscheidungen vor dem Spiel (nur der eigene Verein, KI unverändert):
//  - Ausrichtung defensiv/ausgewogen/offensiv: weniger bzw. mehr Tore auf beiden Seiten,
//  - Einsatz „Stammfünf“: die besten fünf spielen fast durch (etwas stärker, müder,
//    höheres Verletzungsrisiko – Buchung in game/indoorGame.ts),
//  - Torwart raus in der Schlussminute bei 1–2 Toren Rückstand (Annahme: ab 1988,
//    als die Masters im Fernsehen liefen und die Trainer alles riskierten).
// Kommentar: data/ticker/indoor.ts, Ablauf/Anzeige: screens/indoor/.
// =============================================================================
import { IndoorEntrant, IndoorMatch, IndoorStage, NINE_METER_HIT, indoorRates, poisson } from './indoor';

type Rng = () => number;

export type IndoorStyle = 'defensiv' | 'ausgewogen' | 'offensiv';
export interface IndoorPlan { style: IndoorStyle; block: boolean; keeperOut: boolean }
export const DEFAULT_INDOOR_PLAN: IndoorPlan = { style: 'ausgewogen', block: false, keeperOut: false };
/** Torwart raus in der Schlussminute (Annahme: ab dem Masters-Zeitalter). */
export const KEEPER_OUT_FROM = 1988;

/** Wirkung der Ausrichtung auf die eigene bzw. gegnerische Torerwartung. */
export const STYLE_EFFECT: Record<IndoorStyle, { own: number; opp: number }> = {
  defensiv: { own: 0.82, opp: 0.8 },
  ausgewogen: { own: 1, opp: 1 },
  offensiv: { own: 1.18, opp: 1.16 },
};
/** Stammfünf durchspielen: etwa +2 Punkte Hallenstärke (exp(2/40)). */
export const BLOCK_FACTOR = Math.exp(2 / 40);

export interface IndoorSide extends IndoorEntrant {
  keeper?: string;
  /** Feldspieler mit Torgefahr-Gewicht (leer = Verein ohne vollen Kader). */
  field: { name: string; w: number }[];
}

export type IndoorEventKind =
  | 'kickoff' | 'goal' | 'chance' | 'save' | 'post' | 'board' | 'penalty' | 'penalty_end' | 'half' | 'second'
  | 'keeper_out' | 'end' | 'so_start' | 'so_shot' | 'so_end';

export interface IndoorEvent {
  /** Spielsekunde (Neunmeterschießen: nach Abpfiff). */
  t: number;
  kind: IndoorEventKind;
  /** 0 = Mannschaft a, 1 = Mannschaft b. */
  side: 0 | 1;
  who?: string;
  assist?: string;
  keeper?: string;
  /** Stand nach dem Ereignis (im Neunmeterschießen: Stand des Schießens). */
  score: [number, number];
  ok?: boolean;
  /** Tor ins leere Tor / mit fünftem Feldspieler. */
  empty?: boolean;
}

export interface IndoorPlay {
  match: IndoorMatch;
  events: IndoorEvent[];
  minutes: number;
  halves: 1 | 2;
}

function pickName(field: IndoorSide['field'], rng: Rng, not?: string): string | undefined {
  const pool = field.filter((f) => f.name !== not);
  if (!pool.length) return undefined;
  const tot = pool.reduce((s, f) => s + f.w, 0);
  let r = rng() * tot;
  for (const f of pool) { r -= f.w; if (r <= 0) return f.name; }
  return pool[pool.length - 1].name;
}

/**
 * Eigenes Hallenspiel minutengenau. `own` = Seite des eigenen Vereins (0/1),
 * `year` für den Torwart-Wechsel. Gegner und KI-Spiele unverändert.
 */
export function playIndoorMatch(a: IndoorSide, b: IndoorSide, stage: IndoorStage, own: 0 | 1, plan: IndoorPlan, year: number, rng: Rng): IndoorPlay {
  const r = indoorRates(a, b, stage, rng);
  const minutes = r.minutes;
  const ko = stage !== 'A' && stage !== 'B';
  const halves: 1 | 2 = ko ? 2 : 1;
  const st = STYLE_EFFECT[plan.style];
  const blk = plan.block ? BLOCK_FACTOR : 1;
  // Grundraten ohne Zeitstrafe (die verteilt sich auf die zwei Minuten danach).
  const extra = r.penaltyAgainst ? 0.5 : 0;
  let base: [number, number] = [r.la - (r.penaltyAgainst === 'b' ? extra : 0), r.lb - (r.penaltyAgainst === 'a' ? extra : 0)];
  base = own === 0 ? [base[0] * st.own * blk, base[1] * st.opp / blk] : [base[0] * st.opp / blk, base[1] * st.own * blk];
  const sides = [a, b];
  const penMin = r.penaltyAgainst ? 1 + Math.floor(rng() * (minutes - 3)) : -1;
  const penSide: 0 | 1 = r.penaltyAgainst === 'a' ? 0 : 1;
  const sc: [number, number] = [0, 0];
  const ev: IndoorEvent[] = [{ t: 0, kind: 'kickoff', side: 0, score: [0, 0] }];
  // Szenen ohne Tor: etwa jede dritte Minute in den kurzen, jede vierte bis fünfte in den langen Spielen (≈ 8–15 Zeilen).
  const chanceP = ko ? 0.22 : 0.36;
  let keeperOut = false;
  for (let m = 0; m < minutes; m++) {
    if (halves === 2 && m === minutes / 2) {
      ev.push({ t: m * 60, kind: 'half', side: 0, score: [...sc] as [number, number] });
      ev.push({ t: m * 60 + 1, kind: 'second', side: 0, score: [...sc] as [number, number] });
    }
    const rate: [number, number] = [base[0] / minutes, base[1] / minutes];
    if (m === penMin) ev.push({ t: m * 60 + 5, kind: 'penalty', side: penSide, score: [...sc] as [number, number] });
    if (penMin >= 0 && (m === penMin || m === penMin + 1)) rate[1 - penSide] += extra / 2;
    if (m === penMin + 2 && penMin >= 0) ev.push({ t: m * 60 + 5, kind: 'penalty_end', side: penSide, score: [...sc] as [number, number] });
    // Schlussminute: Torwart raus, wenn der eigene Verein mit 1–2 Toren zurückliegt.
    const behind = sc[1 - own] - sc[own];
    if (m === minutes - 1 && plan.keeperOut && year >= KEEPER_OUT_FROM && behind >= 1 && behind <= 2) {
      keeperOut = true;
      ev.push({ t: m * 60 + 2, kind: 'keeper_out', side: own, score: [...sc] as [number, number] });
      rate[own] *= 2.2;
      rate[1 - own] *= 3.5;
    }
    const goals: { t: number; side: 0 | 1 }[] = [];
    for (const s of [0, 1] as const) {
      const n = poisson(rate[s], rng);
      for (let k = 0; k < n; k++) goals.push({ t: m * 60 + 6 + Math.floor(rng() * 52), side: s });
    }
    if (rng() < chanceP) {
      const tot = rate[0] + rate[1];
      const s: 0 | 1 = rng() * tot < rate[0] ? 0 : 1;
      const kr = rng();
      const kind: IndoorEventKind = kr < 0.34 ? 'save' : kr < 0.52 ? 'post' : kr < 0.74 ? 'board' : 'chance';
      const atk = sides[s], def = sides[1 - s];
      ev.push({ t: m * 60 + 6 + Math.floor(rng() * 52), kind, side: s, who: pickName(atk.field, rng), keeper: def.keeper, score: [0, 0] });
    }
    for (const gl of goals.sort((x, y) => x.t - y.t)) {
      const atk = sides[gl.side];
      const who = pickName(atk.field, rng);
      const assist = rng() < 0.55 ? pickName(atk.field, rng, who) : undefined;
      ev.push({ t: gl.t, kind: 'goal', side: gl.side, who, assist, score: [0, 0], empty: keeperOut && gl.side !== own });
      sc[gl.side]++; // laufender Stand (für die Schlussminute)
    }
  }
  ev.sort((x, y) => x.t - y.t);
  // Stand nach jedem Ereignis nachtragen.
  sc[0] = 0; sc[1] = 0;
  for (const e of ev) {
    if (e.kind === 'goal') sc[e.side]++;
    e.score = [sc[0], sc[1]];
  }
  ev.push({ t: minutes * 60, kind: 'end', side: 0, score: [sc[0], sc[1]] });
  const match: IndoorMatch = { a: a.id, b: b.id, ga: sc[0], gb: sc[1], stage };
  if (r.penaltyAgainst) match.note = 'Zeitstrafe gegen ' + (r.penaltyAgainst === 'a' ? a.id : b.id);
  if (ko && sc[0] === sc[1]) {
    // Neunmeterschießen: je drei Schützen, danach Entscheidung (wie simIndoorMatch).
    const so: [number, number] = [0, 0];
    const t0 = minutes * 60 + 30;
    ev.push({ t: t0, kind: 'so_start', side: 0, score: [0, 0] });
    let i = 0;
    const shoot = (s: 0 | 1) => {
      const ok = rng() < NINE_METER_HIT;
      if (ok) so[s]++;
      const used = new Set(ev.filter((e) => e.kind === 'so_shot' && e.side === s).map((e) => e.who));
      const shooters = sides[s].field.filter((f) => !used.has(f.name));
      const who = pickName(shooters.length ? shooters : sides[s].field, rng);
      ev.push({ t: t0 + ++i, kind: 'so_shot', side: s, who, keeper: sides[1 - s].keeper, ok, score: [so[0], so[1]] });
    };
    for (let k = 0; k < 3; k++) {
      shoot(0); shoot(1);
    }
    let guard = 0;
    while (so[0] === so[1] && guard++ < 20) { shoot(0); shoot(1); }
    if (so[0] === so[1]) so[0]++; // praktisch nie (20 Runden gleich) – wie simIndoorMatch
    match.pa = so[0]; match.pb = so[1];
    ev.push({ t: t0 + ++i, kind: 'so_end', side: so[0] > so[1] ? 0 : 1, score: [so[0], so[1]] });
  }
  return { match, events: ev, minutes, halves };
}
