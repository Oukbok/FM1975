// =============================================================================
// HALLENFUSSBALL – eigene, schnelle Hallen-Simulation (ohne die Match-Engine).
// Fünf Feldspieler + Torwart, Rundumbande (Ball fast nie im Aus), kurze Spiel-
// zeiten, viele Tore, Zwei-Minuten-Strafen. Rein rechnerisch, ohne Spielstand –
// der Spielablauf liegt in game/indoorGame.ts, die Daten in data/indoorHistory.ts.
// =============================================================================
import type { Player } from '../types';
import { INDOOR_MINUTES } from '../data/indoorHistory';

/** Kaderwahl für die Halle: Stammkräfte, gemischt oder Nachwuchs/Reservisten. */
export type IndoorSquad = 'stars' | 'mix' | 'youth';
export const INDOOR_SQUAD_LABEL: Record<IndoorSquad, string> = {
  stars: 'Stammkräfte', mix: 'Gemischt', youth: 'Nachwuchs/Reservisten',
};

export interface IndoorEntrant { id: string; strength: number }
export type IndoorStage = 'A' | 'B' | 'SF' | 'P3' | 'F';
export interface IndoorMatch {
  a: string; b: string; ga: number; gb: number;
  /** Neunmeterschießen (nur K.-o.-Spiele). */
  pa?: number; pb?: number;
  stage: IndoorStage;
  /** Besonderheit (Zeitstrafe, Bandentor …) für die Anzeige. */
  note?: string;
}
export interface IndoorRow { id: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }
export interface IndoorResult {
  groups: string[][];
  tables: IndoorRow[][];
  matches: IndoorMatch[];
  /** Endplatzierung (Index 0 = Sieger). */
  ranking: string[];
}

type Rng = () => number;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Spielerwert in der Halle: Technik, Ballkontrolle, Antritt und Wendigkeit zählen
// mehr als Kopfball und Zweikampfhärte (enger Raum, Bande als „Mitspieler“).
// -----------------------------------------------------------------------------
export function indoorSkill(p: Player): number {
  const a = p.attributes;
  if (p.naturalPosition === 'TW') return p.overall;
  const tech = (a.technique + a.firstTouch + a.dribbling + a.ballControl + a.agility + a.acceleration + a.shooting) / 7;
  return 0.45 * p.overall + 0.55 * tech;
}

/**
 * Wählt bis zu 8 Spieler (1 Torwart + 7 Feldspieler) nach Kaderwahl aus.
 * `candidates` = Profis (+ ggf. A-Jugendliche), bereits ohne Verletzte.
 */
export function pickIndoorSquad(candidates: Player[], squad: IndoorSquad): Player[] {
  const byOvr = [...candidates].sort((x, y) => y.overall - x.overall);
  const keepers = byOvr.filter((p) => p.naturalPosition === 'TW');
  const field = byOvr.filter((p) => p.naturalPosition !== 'TW');
  let tw: Player | undefined;
  let fp: Player[];
  if (squad === 'stars') {
    tw = keepers[0];
    fp = field.slice(0, 7);
  } else if (squad === 'mix') {
    tw = keepers[1] ?? keepers[0];
    fp = [...field.slice(0, 3), ...field.slice(11, 15)];
    if (fp.length < 7) fp = [...fp, ...field.slice(3, 3 + 7 - fp.length)];
  } else {
    // Reservisten und Junge zuerst (Stammkräfte = die besten 11 werden geschont).
    tw = keepers[keepers.length - 1] ?? keepers[0];
    const rest = field.slice(10).sort((x, y) => x.age - y.age);
    fp = rest.slice(0, 7);
    if (fp.length < 7) fp = [...fp, ...field.slice(10 - (7 - fp.length), 10)];
  }
  return [...(tw ? [tw] : []), ...fp].slice(0, 8);
}

/** Hallenstärke einer Auswahl: Torwart 25 %, beste fünf Feldspieler 75 % (+ kleine Bankbreite). */
export function indoorStrength(squad: Player[]): number {
  if (!squad.length) return 40;
  const tw = squad.find((p) => p.naturalPosition === 'TW');
  const field = squad.filter((p) => p !== tw).map(indoorSkill).sort((a, b) => b - a);
  const top5 = field.slice(0, 5);
  const fAvg = top5.length ? top5.reduce((s, v) => s + v, 0) / top5.length : 45;
  const bench = field.length > 5 ? field.slice(5).reduce((s, v) => s + v, 0) / (field.length - 5) : fAvg - 10;
  const twv = tw ? indoorSkill(tw) : fAvg - 15;
  return 0.25 * twv + 0.68 * fAvg + 0.07 * bench;
}

export function poisson(lambda: number, rng: Rng): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L && k < 30);
  return k - 1;
}

/**
 * Ein Hallenspiel. Torerwartung ≈ 0,2 Tore je Minute und Mannschaft bei Gleichstand
 * (Endspiele der Masters: 5:3, 6:3, 4:4 … [indoorHistory S2]); Stärkeunterschiede
 * wirken gedämpfter als auf dem Feld (kleiner Raum, Bande, Zufall).
 */
/** Torerwartung eines Hallenspiels (Zeitstrafe gewürfelt, genau ein Zufallswert). */
export interface IndoorRates {
  minutes: number; la: number; lb: number;
  /** Zeitstrafe gegen Mannschaft a bzw. b (der Gegner bekommt +0,5 Tore Erwartung). */
  penaltyAgainst?: 'a' | 'b';
}
export function indoorRates(a: IndoorEntrant, b: IndoorEntrant, stage: IndoorStage, rng: Rng): IndoorRates {
  const minutes = stage === 'A' || stage === 'B' ? INDOOR_MINUTES.group : INDOOR_MINUTES.knockout;
  const diff = clamp(a.strength - b.strength, -30, 30);
  const r: IndoorRates = { minutes, la: minutes * 0.2 * Math.exp(diff / 40), lb: minutes * 0.2 * Math.exp(-diff / 40) };
  // Zwei-Minuten-Strafe (Wechselfehler, Foul an der Bande) [indoorHistory S1/S4].
  const pen = rng();
  if (pen < 0.07) { r.lb += 0.5; r.penaltyAgainst = 'a'; }
  else if (pen < 0.14) { r.la += 0.5; r.penaltyAgainst = 'b'; }
  return r;
}

/** Trefferquote im Neunmeterschießen. */
export const NINE_METER_HIT = 0.72;

/**
 * Ein Hallenspiel. Torerwartung ≈ 0,2 Tore je Minute und Mannschaft bei Gleichstand
 * (Endspiele der Masters: 5:3, 6:3, 4:4 … [indoorHistory S2]); Stärkeunterschiede
 * wirken gedämpfter als auf dem Feld (kleiner Raum, Bande, Zufall). Der Textmodus
 * (engine/indoorMatch.ts) zerlegt dieselbe Erwartung in Minuten.
 */
export function simIndoorMatch(a: IndoorEntrant, b: IndoorEntrant, stage: IndoorStage, rng: Rng): IndoorMatch {
  const r = indoorRates(a, b, stage, rng);
  const m: IndoorMatch = { a: a.id, b: b.id, ga: poisson(r.la, rng), gb: poisson(r.lb, rng), stage };
  if (r.penaltyAgainst) m.note = 'Zeitstrafe gegen ' + (r.penaltyAgainst === 'a' ? a.id : b.id);
  if (stage !== 'A' && stage !== 'B' && m.ga === m.gb) {
    // Neunmeterschießen: je drei Schützen, danach Entscheidung.
    let pa = 0, pb = 0;
    for (let i = 0; i < 3; i++) { if (rng() < NINE_METER_HIT) pa++; if (rng() < NINE_METER_HIT) pb++; }
    let guard = 0;
    while (pa === pb && guard++ < 20) { if (rng() < NINE_METER_HIT) pa++; if (rng() < NINE_METER_HIT) pb++; }
    if (pa === pb) pa++;
    m.pa = pa; m.pb = pb;
  }
  return m;
}

export function winnerOf(m: IndoorMatch): string | null {
  if (m.ga !== m.gb) return m.ga > m.gb ? m.a : m.b;
  if (m.pa != null && m.pb != null) return m.pa > m.pb ? m.a : m.b;
  return null;
}

function emptyRow(id: string): IndoorRow { return { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; }

export function sortRows(rows: IndoorRow[]): IndoorRow[] {
  return [...rows].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.id.localeCompare(y.id));
}

/** Tabelle einer Gruppe aus den gespielten Spielen (auch für die Live-Show). */
export function groupTable(ids: string[], matches: IndoorMatch[], winPts: number): IndoorRow[] {
  const rows = new Map(ids.map((id) => [id, emptyRow(id)]));
  for (const m of matches) {
    const ra = rows.get(m.a), rb = rows.get(m.b);
    if (!ra || !rb) continue;
    ra.p++; rb.p++; ra.gf += m.ga; ra.ga += m.gb; rb.gf += m.gb; rb.ga += m.ga;
    if (m.ga > m.gb) { ra.w++; rb.l++; ra.pts += winPts; }
    else if (m.ga < m.gb) { rb.w++; ra.l++; rb.pts += winPts; }
    else { ra.d++; rb.d++; ra.pts++; rb.pts++; }
  }
  return sortRows([...rows.values()]);
}

/** Rundenturnier einer Gruppe. */
function playGroup(ids: string[], strength: Map<string, number>, stage: 'A' | 'B', winPts: number, rng: Rng, out: IndoorMatch[]): IndoorRow[] {
  const own: IndoorMatch[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    own.push(simIndoorMatch({ id: ids[i], strength: strength.get(ids[i])! }, { id: ids[j], strength: strength.get(ids[j])! }, stage, rng));
  }
  out.push(...own);
  return groupTable(ids, own, winPts);
}

/** Zwei Gruppen in Schlangenlinie nach Stärke (gleich starke Vereine per Zufall). */
export function seedGroups(entrants: IndoorEntrant[], rng: Rng): [string[], string[]] {
  const seeded = [...entrants].sort((x, y) => y.strength - x.strength || (rng() - 0.5));
  const gA: string[] = [], gB: string[] = [];
  seeded.forEach((e, i) => { const row = Math.floor(i / 2); ((row % 2 === 0) === (i % 2 === 0) ? gA : gB).push(e.id); });
  return [gA, gB];
}

/** Endplatzierung aus Gruppentabellen und K.-o.-Spielen (Halbfinale 1/2, Platz 3, Finale). */
export function finalRanking(tA: IndoorRow[], tB: IndoorRow[], sf1: IndoorMatch, sf2: IndoorMatch, p3: IndoorMatch, fin: IndoorMatch): string[] {
  const w1 = winnerOf(sf1)!, w2 = winnerOf(sf2)!;
  const l1 = w1 === sf1.a ? sf1.b : sf1.a, l2 = w2 === sf2.a ? sf2.b : sf2.a;
  const champ = winnerOf(fin)!;
  const third = winnerOf(p3)!;
  const rest = sortRows([...tA.slice(2), ...tB.slice(2)]).map((r) => r.id);
  return [champ, champ === fin.a ? fin.b : fin.a, third, third === p3.a ? p3.b : p3.a, ...rest];
}

/**
 * Ein ganzes Turnier: zwei Gruppen (Schlangenlinie nach Stärke), Halbfinale über
 * Kreuz, Spiel um Platz 3, Finale. 6 Teams → Dreiergruppen, 8 Teams → Vierergruppen.
 * `winPts` = Punkte für einen Sieg (2 bis 1995, danach 3 – wie in der Liga).
 * Live-Variante mit eigenem Textmodus: engine/indoorLive.ts.
 */
export function runIndoorTournament(entrants: IndoorEntrant[], winPts: number, rng: Rng): IndoorResult {
  const strength = new Map(entrants.map((e) => [e.id, e.strength]));
  const [gA, gB] = seedGroups(entrants, rng);
  const matches: IndoorMatch[] = [];
  const tA = playGroup(gA, strength, 'A', winPts, rng, matches);
  const tB = playGroup(gB, strength, 'B', winPts, rng, matches);
  const ent = (id: string): IndoorEntrant => ({ id, strength: strength.get(id)! });
  const sf1 = simIndoorMatch(ent(tA[0].id), ent(tB[1].id), 'SF', rng);
  const sf2 = simIndoorMatch(ent(tB[0].id), ent(tA[1].id), 'SF', rng);
  matches.push(sf1, sf2);
  const w1 = winnerOf(sf1)!, w2 = winnerOf(sf2)!;
  const l1 = w1 === sf1.a ? sf1.b : sf1.a, l2 = w2 === sf2.a ? sf2.b : sf2.a;
  const p3 = simIndoorMatch(ent(l1), ent(l2), 'P3', rng);
  const fin = simIndoorMatch(ent(w1), ent(w2), 'F', rng);
  matches.push(p3, fin);
  return { groups: [gA, gB], tables: [tA, tB], matches, ranking: finalRanking(tA, tB, sf1, sf2, p3, fin) };
}

/** Tour-Wertung: alle Spiele eines Vereins über die Qualifikationsturniere. */
export interface TourStat { id: string; tournaments: number; games: number; pts: number; gf: number; ga: number }

/** Sortierung nach Durchschnittspunkten je Spiel, dann Tordifferenz je Spiel [indoorHistory S1]. */
export function tourRanking(stats: TourStat[]): TourStat[] {
  const avg = (s: TourStat) => (s.games ? s.pts / s.games : 0);
  const gd = (s: TourStat) => (s.games ? (s.gf - s.ga) / s.games : 0);
  return [...stats].filter((s) => s.games > 0).sort((x, y) => avg(y) - avg(x) || gd(y) - gd(x) || y.gf - x.gf);
}

export function addResultToTour(stats: Map<string, TourStat>, res: IndoorResult, winPts: number): void {
  const touch = (id: string) => { let s = stats.get(id); if (!s) { s = { id, tournaments: 0, games: 0, pts: 0, gf: 0, ga: 0 }; stats.set(id, s); } return s; };
  for (const id of res.ranking) touch(id).tournaments++;
  for (const m of res.matches) {
    const a = touch(m.a), b = touch(m.b);
    a.games++; b.games++; a.gf += m.ga; a.ga += m.gb; b.gf += m.gb; b.ga += m.ga;
    if (m.ga > m.gb) a.pts += winPts; else if (m.gb > m.ga) b.pts += winPts; else { a.pts++; b.pts++; }
  }
}
