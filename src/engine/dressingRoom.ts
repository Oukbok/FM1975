// =============================================================================
// KABINE — Rechnung ohne Spielstand: Einfluss, Gruppen, Außenseiter, Moral
// -----------------------------------------------------------------------------
// Baut auf der Spielerpersönlichkeit (engine/persona.ts), der Zufriedenheit
// (Kabinenfrieden in game/aiOffers.ts), den Versprechen (game/promises.ts) und
// der Moral-Stufe (`Player.morale`, wirkt in engine/match/team.ts auf die
// Tagesform: sehr schlecht ×0,95 … sehr gut ×1,03) auf.
//
// Moral 0–100 (`Player.moraleScore`, nur eigener Verein): folgt täglich einem
// Zielwert aus erklärbaren Faktoren (Spielzeit, Teamstimmung, Form, Vertrag,
// Gehaltsgefüge, Sprache, Konflikte, Versprechen, Gespräche …). Die Stufe
// `Player.morale` wird daraus abgeleitet – Stufen-Änderungen anderer Systeme
// (Ereignisse, Trainingslager, Versprechen) fließen als abklingender Faktor ein.
// Einfluss 0–100: Alter, Jahre im Verein, Stammplatz, Stärke, Kapitän/
// Mannschaftsrat, Führungsqualität, Auftreten (Persönlichkeit), Sprache.
// Teamstimmung: Ergebnisse, Moral der Führungsspieler (nach Einfluss
// gewichtet), Zusammenhalt, Außenseiter, Konflikte, Maßnahmen.
// Spielablauf, Ereignisse und Aktionen: game/dressingRoomGame.ts.
// =============================================================================
import type { Player, PlayerMorale } from '../types';
import { personaOf } from './persona';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

// -----------------------------------------------------------------------------
// Spielstand-Teil (optional am Verein: `Club.dressingRoom`)
// -----------------------------------------------------------------------------
/** Abklingender Faktor: Gespräch, Ereignis, Teamevent … (`pid`: Spieler, '*' = Teamstimmung, '#c' = Zusammenhalt). */
export interface DRBoost { pid: string; value: number; label: string; date: string; half: number }
export interface DRConflict { a: string; b: string; since: string; until: string; reason: string }
export interface DRPledge { pid: string; date: string; until: string; starts0: number }

export interface DressingRoomState {
  v: 1;
  /** Teamstimmung 0–100 (geglättet). */
  mood: number;
  /** Ab hier nur eigener Verein. */
  cohesion?: number;
  /** Ernannter Kapitän (in der Aufstellung kann vertretungsweise ein anderer die Binde tragen). */
  captainId?: string;
  /** Seit wann der Kapitän im Amt ist. */
  captainSince?: string;
  /** Mannschaftsrat (bis zu drei Spieler, ohne Kapitän). */
  council?: string[];
  boosts?: DRBoost[];
  conflicts?: DRConflict[];
  /** Einzelgespräche je Spieler (Daten der letzten 120 Tage). */
  talks?: Record<string, string[]>;
  /** Mannschaftssitzungen (Daten der letzten 120 Tage). */
  meetings?: string[];
  /** Teamevents (Daten der letzten 180 Tage). */
  events?: string[];
  /** Seit wann die Stimmung in der Krise ist (unter 35). */
  lowSince?: string;
  /** Letzte Selbstheilung (Spieler raufen sich zusammen). */
  rally?: string;
  /** Letzter Kabinenvorfall (Ereignis mit Entscheidung). */
  lastIncident?: string;
  /** Zusagen „Du spielst“ aus Einzelgesprächen. */
  pledges?: DRPledge[];
  /** Abgelehnte Wechselwünsche (aus KI-Angeboten). */
  denied?: { pid: string; date: string }[];
  /** Merker: Paten, Sprachkurse, verarbeitete Nachrichten … */
  flags?: string[];
  /** Kader am Vortag (Neuzugänge bekommen ihre Moral aus der Stufe). */
  seen?: string[];
  /** Monatsverlauf für die Anzeige. */
  history?: { date: string; mood: number; cohesion: number; outsiders: number }[];
  /** Letzte Maßnahmen/Vorfälle (Anzeige). */
  log?: { date: string; text: string }[];
  /** Sofortige Moral-Sprünge je Spieler (Anzeige „+6 Siegtor gegen …“, game/moraleJolt.ts). */
  jolts?: DRJolt[];
  /** Bis zu diesem Tag sind Spiele für die Moral-Sprünge ausgewertet. */
  joltScan?: string;
  /** Spieler, die am Vortag auf der Transferliste standen. */
  listed?: string[];
}

/** Sofortiger Moral-Sprung: wirkt sofort, gleitet danach mit dem Tageslauf zum Zielwert zurück. */
export interface DRJolt { pid: string; date: string; value: number; label: string }
/** Täglicher Anteil, mit dem die Moral dem Zielwert folgt (game/dressingRoomGame.ts). */
export const MORALE_GLIDE = 0.08;
/** Nachwirkung eines Sprungs nach `days` Tagen (ohne neue Ereignisse). */
export function joltLeft(j: DRJolt, today: string): number {
  const d = Math.max(0, (Date.parse(today + 'T00:00:00Z') - Date.parse(j.date + 'T00:00:00Z')) / 86400000);
  return j.value * Math.pow(1 - MORALE_GLIDE, d);
}

// -----------------------------------------------------------------------------
// Moral-Stufen ↔ Zahl
// -----------------------------------------------------------------------------
export const MORALE_STEPS: PlayerMorale[] = ['very_low', 'low', 'okay', 'good', 'excellent'];
/** Untergrenzen der Stufen (sehr schlecht < 24 ≤ schlecht < 41 ≤ okay < 59 ≤ gut < 77 ≤ sehr gut). */
const STEP_LO = [0, 24, 41, 59, 77, 101];
export const MORALE_LABEL: Record<PlayerMorale, string> = { very_low: 'sehr schlecht', low: 'schlecht', okay: 'okay', good: 'gut', excellent: 'sehr gut' };
export function moraleStepOf(score: number): PlayerMorale {
  for (let i = 4; i >= 0; i--) if (score >= STEP_LO[i]) return MORALE_STEPS[i];
  return 'very_low';
}
export function moraleScoreOf(m: PlayerMorale): number {
  const i = Math.max(0, MORALE_STEPS.indexOf(m));
  return Math.round((STEP_LO[i] + STEP_LO[i + 1]) / 2);
}
/** Grenzen der Stufe (für das Einrasten nach fremden Stufenwechseln). */
export function stepRange(m: PlayerMorale): [number, number] {
  const i = Math.max(0, MORALE_STEPS.indexOf(m));
  return [STEP_LO[i], STEP_LO[i + 1] - 1];
}

/** Aktueller Wert eines abklingenden Faktors (Halbwertszeit in Tagen). */
export function boostNow(b: DRBoost, today: string): number {
  const days = Math.max(0, (Date.parse(today + 'T00:00:00Z') - Date.parse(b.date + 'T00:00:00Z')) / 86400000);
  return b.value * Math.pow(0.5, days / Math.max(1, b.half));
}

// -----------------------------------------------------------------------------
// Sprache
// -----------------------------------------------------------------------------
const LANG: Record<string, string> = {
  GER: 'Deutsch', AUT: 'Deutsch', SUI: 'Deutsch', Deutschland: 'Deutsch',
  ENG: 'Englisch', SCO: 'Englisch', USA: 'Englisch', GHA: 'Englisch', NGA: 'Englisch',
  ESP: 'Spanisch', ARG: 'Spanisch', BRA: 'Portugiesisch', POR: 'Portugiesisch',
  FRA: 'Französisch', CMR: 'Französisch', MAR: 'Französisch', NED: 'Niederländisch', BEL: 'Niederländisch',
  DEN: 'Skandinavisch', SWE: 'Skandinavisch', NOR: 'Skandinavisch',
  YUG: 'Serbokroatisch', SRB: 'Serbokroatisch', CRO: 'Serbokroatisch',
  POL: 'Polnisch', TCH: 'Tschechisch', HUN: 'Ungarisch', ITA: 'Italienisch', GRE: 'Griechisch',
  TUR: 'Türkisch', RUS: 'Russisch', JPN: 'Japanisch', KOR: 'Koreanisch',
};
/** Sprachen mit kurzem Weg zum Deutschen. */
const NEAR = new Set(['Niederländisch', 'Skandinavisch', 'Deutsch']);
export function languageOf(p: Player): string { return LANG[p.nationality] ?? 'Englisch'; }
export const LANG_GROUP: Record<string, string> = {
  Englisch: 'Englischsprachige', Spanisch: 'Spanischsprachige', Portugiesisch: 'Portugiesischsprachige', Französisch: 'Französischsprachige',
  Niederländisch: 'Niederländer & Belgier', Skandinavisch: 'Skandinavier', Serbokroatisch: 'Jugoslawen', Polnisch: 'Polen', Tschechisch: 'Tschechen',
  Ungarisch: 'Ungarn', Italienisch: 'Italiener', Griechisch: 'Griechen', Türkisch: 'Türken', Russisch: 'Russischsprachige', Japanisch: 'Japaner', Koreanisch: 'Koreaner',
};

/** Sprachbarriere 0..1: sinkt mit den Jahren im Verein, schneller bei hoher Anpassungsfähigkeit. */
export function languageBarrier(p: Player, years: number, help = 1): number {
  const lang = languageOf(p);
  if (lang === 'Deutsch') return 0;
  const base = NEAR.has(lang) ? 0.55 : 1;
  const adapt = p.development.adaptability ?? 50;
  const learnYears = clamp(2.6 - adapt / 45, 0.7, 2.6);
  return r1(clamp(base * (1 - years / learnYears), 0, 1) * help * 100) / 100;
}

// -----------------------------------------------------------------------------
// Eingaben und Ausgaben
// -----------------------------------------------------------------------------
export interface DRPlayerIn {
  p: Player;
  years: number;
  /** Gleitende Einsatzminuten / 600 (≈ 1 bei Stammspielern). */
  share: number;
  /** Rang im Kader nach Stärke (1 = bester). */
  rank: number;
  barrier: number;
  captain: boolean;
  council: boolean;
  brokenPromise: boolean;
  deniedMove: boolean;
  /** 0..1: Gehalt deutlich unter Gleichwertigen. */
  wageGap: number;
}
export interface DRContext {
  today: string;
  year: number;
  /** Sommer-/Winterpause: Spielzeit zählt nicht. */
  offSeason: boolean;
  squadAvg: number;
  mood: number;
  /** Punkte je Spiel der letzten (bis zu) fünf Ligaspiele; null = noch keine. */
  ppg: number | null;
  boosts: DRBoost[];
  conflicts: DRConflict[];
  /** Lage gemessen am Saisonziel des Vorstands (nur während der Saison). */
  goal?: DRGoal;
}
/** Tabellenlage gegenüber dem Saisonziel. */
export interface DRGoal {
  /** Saisonziel des Vorstands (Text). */
  label: string;
  pos: number;
  /** Platz, den das Ziel verlangt. */
  expected: number;
  size: number;
  /** Bisher gespielte Ligaspiele. */
  played: number;
  /** Ab diesem Platz Abstiegszone. */
  dropFrom: number;
  /** Liga-Spiele in Folge ohne Sieg. */
  winless: number;
}
export interface DRFactor { label: string; value: number }
export type DRTier = 'fuehrung' | 'stuetze' | 'mitlaeufer' | 'aussen';
export const TIER_LABEL: Record<DRTier, string> = { fuehrung: 'Führungsspieler', stuetze: 'Stütze', mitlaeufer: 'Mitläufer', aussen: 'Außen vor' };

export interface DRPlayerOut {
  id: string;
  influence: number;
  influenceWhy: DRFactor[];
  tier: DRTier;
  group: string;
  outsider: boolean;
  outsiderWhy: string[];
  target: number;
  moraleWhy: DRFactor[];
  language: string;
  barrier: number;
}
export interface DRGroup { id: string; label: string; members: string[]; why: string }
export interface DRAnalysis {
  players: DRPlayerOut[];
  byId: Record<string, DRPlayerOut>;
  groups: DRGroup[];
  cohesion: number;
  cohesionWhy: DRFactor[];
  moodTarget: number;
  moodWhy: DRFactor[];
  leaders: string[];
  outsiders: string[];
}

const sum = (fs: DRFactor[]) => fs.reduce((a, f) => a + f.value, 0);
const push = (fs: DRFactor[], label: string, value: number) => { if (Math.abs(value) >= 0.5) fs.push({ label, value: Math.round(value) }); };

/**
 * Druck aus der Tabelle: Saisonziel klar verfehlt, Abstiegskampf wider
 * Erwarten, lange sieglos. Wächst in den ersten zehn Spieltagen auf volle
 * Stärke (vorher ist die Tabelle wenig aussagekräftig).
 */
export function goalFactors(goal: DRGoal): DRFactor[] {
  const fs: DRFactor[] = [];
  const w = clamp((goal.played - 3) / 7, 0, 1);
  const rel = (goal.pos - goal.expected) / Math.max(1, goal.size);
  if (rel > 0.05 && goal.pos - goal.expected >= 2) push(fs, `Saisonziel verfehlt (Platz ${goal.pos} statt ${goal.expected})`, -clamp(rel * 50, 0, 18) * w);
  else if (rel < -0.12) push(fs, 'Besser als erwartet', clamp(-rel * 20, 0, 6) * w);
  if (goal.pos >= goal.dropFrom && goal.expected < goal.dropFrom - 2) push(fs, 'Abstiegskampf wider Erwarten', -8 * w);
  if (goal.winless >= 3) push(fs, `Seit ${goal.winless} Ligaspielen sieglos`, -clamp((goal.winless - 2) * 2.5, 0, 12));
  return fs;
}


// -----------------------------------------------------------------------------
// Einfluss
// -----------------------------------------------------------------------------
export function influenceOf(x: DRPlayerIn, ctx: DRContext): { value: number; why: DRFactor[] } {
  const { p } = x;
  const pe = personaOf(p);
  const why: DRFactor[] = [];
  push(why, 'Alter und Erfahrung', clamp((p.age - 20) * 1.4, -3, 15));
  push(why, 'Jahre im Verein', clamp(x.years * 3, 0, 15));
  if (ctx.offSeason) push(why, x.rank <= 11 ? 'Stammkraft' : 'Ergänzungsspieler', x.rank <= 11 ? 8 : x.rank > 18 ? -4 : 0);
  else if (p.injury && p.injury.daysRemaining > 20) push(why, 'Lange verletzt', -3);
  else push(why, x.share >= 0.8 ? 'Stammplatz' : x.share >= 0.45 ? 'Regelmäßige Einsätze' : 'Kaum Einsätze', x.share >= 0.8 ? 12 : x.share >= 0.45 ? 6 : x.share < 0.2 ? -6 : 0);
  push(why, 'Stärke im Kader', clamp((p.overall - ctx.squadAvg) * 1.0, -10, 15));
  if (x.captain) push(why, 'Kapitän', 15);
  if (x.council) push(why, 'Mannschaftsrat', 8);
  push(why, 'Führungsqualität', ((p.attributes.leadership ?? 50) - 50) * 0.3);
  push(why, 'Auftreten', (pe.rampenlicht - 50) * 0.08 + (pe.ehrgeiz - 50) * 0.04 + ((p.development.professionalism ?? 50) - 50) * 0.06);
  push(why, 'Sprachbarriere', -12 * x.barrier);
  if (x.years < 0.5) push(why, 'Neu im Verein', -6);
  why.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { value: Math.round(clamp(20 + sum(why), 0, 100)), why };
}

// -----------------------------------------------------------------------------
// Außenseiter-Gründe
// -----------------------------------------------------------------------------
interface Reason { text: string; w: number }
function outsiderReasons(x: DRPlayerIn, ctx: DRContext, influence: number, leaders: Set<string>, name: (id: string) => string, langMates: number): Reason[] {
  const { p } = x;
  const rs: Reason[] = [];
  const injured = !!p.injury;
  if (!ctx.offSeason && !injured && x.share < 0.15 && p.age >= 21) rs.push({ text: 'keine Einsätze', w: 1 });
  if (x.barrier >= 0.45) rs.push({ text: langMates ? 'Sprachbarriere (Landsleute helfen)' : 'Sprachbarriere', w: (x.barrier >= 0.8 ? 2 : 1.5) * (langMates ? 0.5 : 1) });
  if (x.wageGap >= 0.5) rs.push({ text: 'Gehalt deutlich unter Gleichwertigen', w: 1 });
  if (x.brokenPromise) rs.push({ text: 'gebrochenes Versprechen', w: 2 });
  if (x.deniedMove) rs.push({ text: 'Wechselwunsch abgelehnt', w: 1.5 });
  if (p.transferListed) rs.push({ text: 'auf der Transferliste', w: 1.5 });
  for (const c of ctx.conflicts) {
    const other = c.a === p.id ? c.b : c.b === p.id ? c.a : '';
    if (!other) continue;
    const lead = leaders.has(other) && !leaders.has(p.id);
    rs.push({ text: `Konflikt mit ${lead ? 'Führungsspieler ' : ''}${name(other)}`, w: lead ? 2 : 1 });
  }
  if (x.years < 0.4 && (p.development.adaptability ?? 50) < 45) rs.push({ text: 'noch nicht angekommen', w: 1 });
  if (rs.length && influence < 25) rs.push({ text: 'kaum Rückhalt im Team', w: 0.5 });
  return rs;
}

// -----------------------------------------------------------------------------
// Moral-Zielwert
// -----------------------------------------------------------------------------
export function moraleTarget(x: DRPlayerIn, ctx: DRContext, extra: { outsider: boolean; influence: number; conflictNames: string[] }): { value: number; why: DRFactor[] } {
  const { p } = x;
  const pe = personaOf(p);
  const amb = 0.6 + pe.ehrgeiz / 125;
  const why: DRFactor[] = [];
  // Spielzeit gemessen an der Rolle (Rang im Kader).
  if (p.injury) push(why, p.injury.daysRemaining > 30 ? 'Lange verletzt' : 'Verletzt', p.injury.daysRemaining > 30 ? -6 : -2);
  else if (!ctx.offSeason) {
    if (x.rank <= 11 && p.age >= 21) push(why, x.share >= 0.7 ? 'Spielt regelmäßig' : x.share >= 0.4 ? 'Spielt zu selten' : 'Sitzt draußen (sieht sich als Stammkraft)', x.share >= 0.7 ? 4 : x.share >= 0.4 ? -3 * amb : -14 * amb);
    else if (x.rank <= 16) push(why, x.share >= 0.4 ? 'Bekommt seine Einsätze' : x.share < 0.15 ? 'Kaum Einsätze' : 'Einsätze', x.share >= 0.4 ? 4 : x.share < 0.15 ? -6 * amb : 0);
    else push(why, x.share >= 0.3 ? 'Einsätze über Erwartung' : 'Reservist', x.share >= 0.3 ? 5 : p.age <= 20 ? 0 : -2);
  }
  push(why, 'Teamstimmung', (ctx.mood - 55) * 0.35);
  push(why, 'Eigene Form', ((p.form ?? 50) - 50) * 0.12);
  push(why, 'Vertrag und Zufriedenheit', ((p.contract.satisfaction ?? 60) - 60) * 0.18);
  if (x.wageGap > 0.05) push(why, 'Gehalt unter Gleichwertigen', -7 * x.wageGap * (0.5 + pe.geld / 100));
  push(why, 'Sprachbarriere', -10 * x.barrier);
  if (x.captain) push(why, 'Kapitän', 5 + (pe.rampenlicht - 50) * 0.05);
  if (x.council) push(why, 'Mannschaftsrat', 3);
  extra.conflictNames.slice(0, 2).forEach((n) => push(why, `Konflikt mit ${n}`, -7));
  if (x.brokenPromise) push(why, 'Gebrochenes Versprechen', -9);
  if (x.deniedMove) push(why, 'Wechsel verweigert', -8 * clamp(pe.ehrgeiz / 60, 0.6, 1.5));
  if (p.transferListed) push(why, 'Auf der Transferliste', -7);
  if (extra.outsider) push(why, 'Außen vor', -7);
  if (x.years < 0.3 && x.barrier < 0.3) push(why, 'Neu – Aufbruchstimmung', 3);
  // Abklingende Faktoren (Gespräche, Ereignisse, Stufenwechsel anderer Systeme).
  const own = new Map<string, number>();
  for (const b of ctx.boosts) if (b.pid === p.id) own.set(b.label, (own.get(b.label) ?? 0) + boostNow(b, ctx.today));
  for (const [label, v] of own) push(why, label, v);
  // Professionalität: Profis stecken Rückschläge weg, andere lassen sich hängen.
  const neg = why.filter((f) => f.value < 0).reduce((a, f) => a + f.value, 0);
  const prof = p.development.professionalism ?? 50;
  push(why, prof >= 50 ? 'Professionell – steckt Rückschläge weg' : 'Lässt sich hängen', -neg * (prof - 50) / 250);
  why.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { value: Math.round(clamp(60 + sum(why), 3, 97)), why };
}

// -----------------------------------------------------------------------------
// Gesamtanalyse der Kabine
// -----------------------------------------------------------------------------
export function analyzeRoom(xs: DRPlayerIn[], ctx: DRContext, scores: Record<string, number>): DRAnalysis {
  const name = (id: string) => xs.find((x) => x.p.id === id)?.p.lastName ?? 'einem Ex-Spieler';
  // 1) Einfluss und Rangfolge
  const inf = new Map(xs.map((x) => [x.p.id, influenceOf(x, ctx)]));
  const ranked = [...xs].sort((a, b) => inf.get(b.p.id)!.value - inf.get(a.p.id)!.value);
  const leaders = new Set(ranked.filter((x, i) => i === 0 || (i < 4 && inf.get(x.p.id)!.value >= 62)).map((x) => x.p.id));
  // 2) Sprachgruppen
  const byLang = new Map<string, string[]>();
  for (const x of xs) { const l = languageOf(x.p); if (l !== 'Deutsch') byLang.set(l, [...(byLang.get(l) ?? []), x.p.id]); }
  // 3) Außenseiter
  const players: DRPlayerOut[] = xs.map((x) => {
    const iv = inf.get(x.p.id)!;
    const lang = languageOf(x.p);
    const mates = lang === 'Deutsch' ? 0 : (byLang.get(lang)?.length ?? 1) - 1;
    const rs = outsiderReasons(x, ctx, iv.value, leaders, name, mates);
    let w = rs.reduce((a, r) => a + r.w, 0);
    if ((scores[x.p.id] ?? 60) < 35 && rs.length) w += 0.5;
    const outsider = w >= 2.5 && !leaders.has(x.p.id);
    const tier: DRTier = outsider ? 'aussen' : leaders.has(x.p.id) ? 'fuehrung' : iv.value >= 42 ? 'stuetze' : 'mitlaeufer';
    const conflictNames = ctx.conflicts.filter((c) => c.a === x.p.id || c.b === x.p.id).map((c) => name(c.a === x.p.id ? c.b : c.a));
    const mt = moraleTarget(x, ctx, { outsider, influence: iv.value, conflictNames });
    return { id: x.p.id, influence: iv.value, influenceWhy: iv.why, tier, group: '', outsider, outsiderWhy: rs.sort((a, b) => b.w - a.w).map((r) => r.text), target: mt.value, moraleWhy: mt.why, language: lang, barrier: x.barrier };
  });
  const byId: Record<string, DRPlayerOut> = Object.fromEntries(players.map((o) => [o.id, o]));
  // 4) Gruppen (jede Person in genau einer; Vorrang von oben nach unten)
  const groups: DRGroup[] = [];
  const taken = new Set<string>();
  const add = (id: string, label: string, ids: string[], why: string) => {
    const m = ids.filter((x) => !taken.has(x));
    if (!m.length) return;
    m.forEach((x) => taken.add(x));
    groups.push({ id, label, members: m, why });
  };
  add('fuehrung', 'Führungskreis', [...leaders], 'Die Spieler mit dem größten Einfluss – sie prägen die Stimmung.');
  for (const [l, ids] of [...byLang.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (ids.length >= 2) add(`lang-${l}`, LANG_GROUP[l] ?? l, ids, `Gemeinsame Sprache: ${l}. Gibt Halt, kann aber abschotten.`);
  }
  const newbies = xs.filter((x) => x.years < 0.6 && !taken.has(x.p.id)).map((x) => x.p.id);
  if (newbies.length >= 3) add('neu', 'Neuzugänge', newbies, 'Seit kurzem im Verein – noch auf der Suche nach ihrem Platz.');
  add('jung', 'Junge Wilde', xs.filter((x) => x.p.age <= 22).map((x) => x.p.id), 'Bis 22 Jahre: hungrig, ungeduldig, oft gemeinsam unterwegs.');
  add('routine', 'Routiniers', xs.filter((x) => x.p.age >= 30).map((x) => x.p.id), 'Ab 30 Jahren: viel Erfahrung, eigene Vorstellungen.');
  add('stamm', 'Stammkräfte', xs.filter((x) => (ctx.offSeason ? x.rank <= 13 : x.share >= 0.45)).map((x) => x.p.id), 'Spielen regelmäßig.');
  add('bank', 'Ergänzungsspieler', xs.map((x) => x.p.id), 'Warten auf ihre Chance.');
  for (const gr of groups) for (const id of gr.members) byId[id].group = gr.id;
  // 5) Zusammenhalt
  const cw: DRFactor[] = [];
  const regulars = xs.filter((x) => x.rank <= 14);
  const avgYears = regulars.reduce((a, x) => a + x.years, 0) / Math.max(1, regulars.length);
  push(cw, 'Gemeinsame Jahre der Stammkräfte', clamp((avgYears - 2.5) * 4, -10, 10));
  const newCount = xs.filter((x) => x.years < 0.5).length;
  push(cw, `${newCount} Neuzugänge`, -clamp((newCount - 3) * 2, 0, 10));
  const closed = groups.filter((gr) => gr.id.startsWith('lang-') && gr.members.reduce((a, id) => a + byId[id].barrier, 0) / gr.members.length >= 0.4).length;
  push(cw, 'Abgeschottete Sprachgruppen', -4 * closed);
  const outs = players.filter((o) => o.outsider).map((o) => o.id);
  push(cw, 'Außenseiter', -Math.min(12, 3 * outs.length));
  push(cw, 'Konflikte', -6 * ctx.conflicts.length);
  const top = ranked[0]?.p;
  if (top) push(cw, `Führung durch ${top.lastName}`, clamp(((top.attributes.leadership ?? 50) - 55) * 0.2 + ((scores[top.id] ?? 60) - 60) * 0.1, -8, 8));
  const restless = xs.filter((x) => !ctx.offSeason && x.rank <= 11 && x.p.age >= 21 && x.share < 0.4 && !x.p.injury).length;
  push(cw, 'Unruhe auf der Bank', -Math.min(8, 2 * restless));
  const cb = new Map<string, number>();
  for (const b of ctx.boosts) if (b.pid === '#c') cb.set(b.label, (cb.get(b.label) ?? 0) + boostNow(b, ctx.today));
  for (const [l, v] of cb) push(cw, l, v);
  cw.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const cohesion = Math.round(clamp(62 + sum(cw), 5, 98));
  // 6) Teamstimmung (Zielwert)
  const mw: DRFactor[] = [];
  if (ctx.ppg != null) push(mw, 'Letzte Ergebnisse', clamp((ctx.ppg - 1.35) * 15, -20, 18));
  if (ctx.goal && !ctx.offSeason) for (const f of goalFactors(ctx.goal)) mw.push(f);
  const lead = ranked.slice(0, 5);
  const wsum = lead.reduce((a, x) => a + inf.get(x.p.id)!.value, 0) || 1;
  const leadMorale = lead.reduce((a, x) => a + (scores[x.p.id] ?? 60) * inf.get(x.p.id)!.value, 0) / wsum;
  push(mw, 'Laune der Führungsspieler', (leadMorale - 60) * 0.35);
  push(mw, 'Zusammenhalt', (cohesion - 60) * 0.3);
  push(mw, 'Außenseiter', -Math.min(8, 2.5 * Math.max(0, outs.length - 1)));
  push(mw, 'Konflikte', -4 * ctx.conflicts.length);
  const mb = new Map<string, number>();
  for (const b of ctx.boosts) if (b.pid === '*') mb.set(b.label, (mb.get(b.label) ?? 0) + boostNow(b, ctx.today));
  for (const [l, v] of mb) push(mw, l, v);
  mw.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const moodTarget = Math.round(clamp(55 + sum(mw), 5, 97));
  return { players, byId, groups, cohesion, cohesionWhy: cw, moodTarget, moodWhy: mw, leaders: [...leaders], outsiders: outs };
}

// -----------------------------------------------------------------------------
// KI-Vereine: günstige Variante (nur Stimmung → Moral-Stufen)
// -----------------------------------------------------------------------------
/** Zielstimmung eines KI-Vereins aus den letzten Ergebnissen (W/D/L, neueste zuletzt). */
export function aiMoodTarget(form: ('W' | 'D' | 'L')[]): number {
  if (!form.length) return 58;
  const ppg = form.reduce((a, r) => a + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0) / form.length;
  return clamp(58 + (ppg - 1.35) * 14, 15, 92);
}
/** Ziel-Stufe eines KI-Spielers: Stimmung, Spielzeit, Zufriedenheit. */
export function aiMoraleStep(mood: number, p: Player, rank: number): number {
  let i = mood >= 74 ? 4 : mood >= 46 ? 3 : mood >= 30 ? 2 : 1;
  if (rank <= 11 && p.age >= 21 && (p.development.recentMinutes ?? 600) < 150 && !p.injury) i--;
  if ((p.contract.satisfaction ?? 60) < 35) i--;
  return clamp(i, 0, 4);
}

// -----------------------------------------------------------------------------
// Einzelgespräch: Erfolgsaussicht nach Persönlichkeit und Lage
// -----------------------------------------------------------------------------
export type TalkKind = 'loben' | 'kritisieren' | 'einsatz' | 'beruhigen'
  // Spielergespräch (views/kader/talk/, game/playerTalk.ts)
  | 'training' | 'fordern' | 'pause' | 'topform' | 'ziele' | 'zukunft' | 'fuehrung';
export const TALK_LABEL: Record<TalkKind, string> = {
  loben: 'Loben', kritisieren: 'Kritisieren', einsatz: 'Einsatz versprechen', beruhigen: 'Beruhigen',
  training: 'Training loben', fordern: 'Mehr Einsatz fordern', pause: 'Pause gönnen', topform: 'Topform fordern',
  ziele: 'Höhere Ziele', zukunft: 'Zukunft zusichern', fuehrung: 'Führungsrolle',
};
export const TALK_INFO: Record<TalkKind, string> = {
  loben: 'Wirkt bei guter Form und bei Spielern, die gern im Mittelpunkt stehen.',
  kritisieren: 'Weckt Ehrgeizige und Profis bei schwacher Form – kann nach hinten losgehen.',
  einsatz: 'Hebt die Laune sofort. Er muss in den nächsten vier Wochen zweimal in der Startelf stehen.',
  beruhigen: 'Hilft Unzufriedenen, Außenseitern und Streithähnen – Loyale und Familienmenschen hören zu.',
  training: 'Kleines Lob für gute Trainingsleistungen – kommt bei Profis in Form fast immer an.',
  fordern: 'Verlangt mehr im Training: bei Erfolg etwas Form, Unprofessionelle fühlen sich gegängelt.',
  pause: 'Ein freier Tag für müde Spieler: Frische steigt etwas. Wer nicht müde ist, fühlt sich aussortiert.',
  topform: 'Vor dem nächsten Spiel: Ehrgeizige und Nervenstarke legen zu, andere spüren nur Druck.',
  ziele: 'Spornt Ehrgeizige und junge Spieler an – Ältere hören das ungern.',
  zukunft: 'Bei auslaufendem Vertrag oder Unzufriedenheit: Loyale glauben dir, je nach deiner Glaubwürdigkeit.',
  fuehrung: 'Für einflussreiche Spieler: stärkt Selbstbewusstsein, gelingt es, zieht die Kabine leicht mit.',
};
export interface TalkOdds { chance: number; gain: number; loss: number; hint: string; needed: boolean }
/** Lage für die Gesprächsthemen des Spielergesprächs (fehlt = neutral). */
export interface TalkCtx {
  /** Glaubwürdigkeit des Trainers 0–100 (game/promises.ts). */
  trust?: number;
  /** Nächstes Pflichtspiel in höchstens 7 Tagen. */
  matchSoon?: boolean;
  /** Monate bis Vertragsende. */
  contractMonths?: number;
  /** Privatleben: Menschenführung/Energie/Laune des Managers (−0,05 … +0,1). */
  manager?: number;
}

export function talkOdds(kind: TalkKind, p: Player, out: DRPlayerOut | undefined, score: number, ctx: TalkCtx = {}): TalkOdds {
  const pe = personaOf(p);
  const prof = p.development.professionalism ?? 50;
  const form = p.form ?? 50;
  const fri = typeof p.frische === 'number' ? p.frische : 100;
  let chance = 0.5, gain = 6, loss = 0, needed = true;
  switch (kind) {
    case 'loben':
      chance = 0.55 + (form - 50) / 150 + (pe.rampenlicht - 50) / 250 + (score < 50 ? 0.1 : 0);
      gain = score >= 80 ? 3 : 8; loss = -1; needed = score < 80;
      break;
    case 'kritisieren':
      chance = 0.3 + (prof - 50) / 120 + (pe.ehrgeiz - 50) / 200 + (form < 45 ? 0.2 : -0.15) - (score < 35 ? 0.2 : 0);
      gain = 5; loss = 8; needed = form < 50;
      break;
    case 'einsatz':
      chance = 1; gain = 9; loss = 0; needed = !!out && !out.outsider ? out.target < 65 : true;
      break;
    case 'beruhigen':
      needed = !!out && (out.target < 55 || out.outsider || out.moraleWhy.some((f) => f.label.startsWith('Konflikt')));
      chance = needed ? 0.45 + (pe.loyalitaet - 50) / 200 + (pe.familie - 50) / 300 + ((p.development.adaptability ?? 50) - 50) / 250 : 0.2;
      gain = needed ? 7 : 1; loss = 2;
      break;
    case 'training':
      needed = form >= 52 && score < 85;
      chance = 0.62 + (form - 55) / 120 + (prof - 50) / 300 + (pe.rampenlicht - 50) / 400;
      gain = score < 60 ? 5 : 3; loss = 1;
      break;
    case 'fordern':
      needed = form < 55;
      chance = 0.42 + (prof - 50) / 140 + (pe.ehrgeiz - 50) / 260 - (score < 40 ? 0.15 : 0) + (needed ? 0.08 : -0.1);
      gain = 2; loss = 4;
      break;
    case 'pause':
      needed = fri < 75;
      chance = needed ? 0.92 - (pe.ehrgeiz - 50) / 400 : 0.35 - (pe.ehrgeiz - 50) / 250;
      gain = needed ? 3 : 1; loss = 3;
      break;
    case 'topform':
      needed = !!ctx.matchSoon;
      chance = 0.45 + (pe.ehrgeiz - 50) / 200 + ((p.attributes.composure ?? 50) - 50) / 200 + (prof - 50) / 300 - (score < 40 ? 0.15 : 0);
      gain = 2; loss = 3;
      break;
    case 'ziele':
      needed = p.age <= 27;
      chance = 0.36 + (pe.ehrgeiz - 50) / 120 + (p.age <= 23 ? 0.1 : 0) - (p.age >= 31 ? 0.15 : 0);
      gain = 4; loss = 4;
      break;
    case 'zukunft': {
      const months = ctx.contractMonths ?? 24;
      needed = months <= 18 || (p.contract.satisfaction ?? 60) < 50;
      chance = 0.4 + (pe.loyalitaet - 50) / 150 + ((ctx.trust ?? 70) - 70) / 150 - (pe.geld - 50) / 250 + (needed ? 0 : -0.15);
      gain = needed ? 6 : 2; loss = 3;
      break;
    }
    case 'fuehrung':
      needed = (out?.influence ?? 0) >= 50;
      chance = 0.42 + (pe.rampenlicht - 50) / 200 + ((p.attributes.leadership ?? 50) - 50) / 160 + (needed ? 0.1 : -0.2);
      gain = 5; loss = 2;
      break;
  }
  if (kind !== 'einsatz') chance += ctx.manager ?? 0;
  chance = clamp(chance, 0.05, 1);
  const hint = !needed ? 'kaum nötig' : chance >= 0.65 ? 'kommt vermutlich an' : chance >= 0.4 ? 'offen' : 'riskant';
  return { chance, gain, loss, hint, needed };
}

// -----------------------------------------------------------------------------
// Teamevents je Epoche (Preise in 1975-Basis, Buchung × economyScale)
// -----------------------------------------------------------------------------
export type TeamEventKind = 'abend' | 'ausflug' | 'reise';
export interface TeamEventDef { kind: TeamEventKind; label: string; text: string; cost: number; mood: number; cohesion: number; outsider: number }
export function teamEventDefs(year: number): TeamEventDef[] {
  const abend = year < 1990 ? 'Kegelabend' : year < 2005 ? 'Grillabend' : 'Mannschaftsabend im Restaurant';
  const ausflug = year < 1990 ? 'Dampferfahrt mit Weinprobe' : year < 2005 ? 'Kartbahn' : year < 2013 ? 'Hochseilgarten' : 'Escape-Room und Hochseilgarten';
  const reise = year < 1990 ? 'Wochenende im Schwarzwald' : year < 2005 ? 'Kurztrip nach Mallorca' : 'Städtereise';
  const fa = year < 1990 ? 1.2 : year < 2005 ? 1 : 0.85;
  const fr = year < 1990 ? 0.9 : 1.1;
  return [
    { kind: 'abend', label: abend, text: 'Ein Abend zusammen, ohne Trainer-Ansprache.', cost: 1500, mood: 5 * fa, cohesion: 6 * fa, outsider: 4 },
    { kind: 'ausflug', label: ausflug, text: 'Ein Tag raus aus dem Alltag – auch die Stillen kommen ins Gespräch.', cost: 6000, mood: 7, cohesion: 10, outsider: 6 },
    { kind: 'reise', label: reise, text: 'Zwei, drei Tage weg. Teuer, aber schweißt zusammen.', cost: 20000, mood: 10 * fr, cohesion: 14 * fr, outsider: 8 },
  ];
}
