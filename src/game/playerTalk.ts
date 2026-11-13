// =============================================================================
// SPIELERGESPRÄCH — Themen, Lage und Antwort des Spielers
// -----------------------------------------------------------------------------
// Oberfläche: views/kader/talk/PlayerTalkModal.tsx. Rechnet nichts neu, sondern
// nutzt das Einzelgespräch der Kabine (`talkTo` in game/dressingRoomGame.ts:
// Abklingzeit je Spieler, Abnutzung, Wochenlimit, Moral-Sprung über
// game/moraleJolt.ts, Zusage „Einsatz“) und die Erfolgsaussicht
// `talkOdds` aus engine/dressingRoom.ts (Persönlichkeit engine/persona.ts,
// Glaubwürdigkeit aus game/promises.ts). Hier kommen nur dazu:
//   • welche Themen in der Lage passen (`talkTopics`),
//   • kleine Nebenwirkungen bei Erfolg (Form/Frische/Vertragszufriedenheit),
//   • die Antwort des Spielers in Worten (data/talkReplies.ts).
// =============================================================================
import { privateTalkBonus } from './private/privateState';
import { TalkCtx, TalkKind, TALK_INFO, talkOdds, moraleScoreOf } from '../engine/dressingRoom';
import { yearOf } from '../engine/economy';
import { personaOf, PersonaTrait, TRAITS } from '../engine/persona';
import { GESTURE, TALK_LINES, TRAIT_TAIL } from '../data/talkReplies';
import { Player } from '../types';
import { addBoost, roomAnalysis, roomOf, talkState, talkTo, talkWeek } from './dressingRoomGame';
import { trustOf } from './promises';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const days = (a: string, b: string) => (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000;

/** Reihenfolge der Themen in der Liste. */
const ORDER: TalkKind[] = ['training', 'loben', 'fordern', 'pause', 'topform', 'ziele', 'kritisieren', 'einsatz', 'beruhigen', 'zukunft', 'fuehrung'];

export interface TalkTopic { kind: TalkKind; say: string; info: string; hint: string; needed: boolean }
export interface TalkOutcome {
  ok: boolean;
  /** Text bei Ablehnung (Abklingzeit, Wochenlimit). */
  text: string;
  success: boolean;
  needed: boolean;
  before: number;
  after: number;
  /** Antwort des Spielers (wörtlich) und Geste. */
  quote: string;
  gesture: string;
  /** Kleine Nebenwirkungen in Worten, z. B. „Frische +8“. */
  effects: string[];
}

/** Nächstes Ligaspiel des eigenen Vereins ab heute. */
export function nextOwnMatch(g: Game): string | undefined {
  const today = g.calendar.currentDate, id = g.managedClubId;
  let best: string | undefined;
  for (const m of g.fixtures) {
    if (m.result || m.date < today || (m.homeClubId !== id && m.awayClubId !== id)) continue;
    if (!best || m.date < best) best = m.date;
  }
  return best;
}

/** Lage für die Erfolgsaussicht. */
export function talkContext(g: Game, p: Player): TalkCtx {
  const today = g.calendar.currentDate;
  const next = nextOwnMatch(g);
  const exp = p.contract?.expiryDate;
  const months = exp ? Math.max(0, Math.round(days(today, exp.slice(0, 10)) / 30.4)) : 24;
  return { trust: trustOf(g), matchSoon: !!next && days(today, next) <= 7, contractMonths: months, manager: privateTalkBonus(g) };
}

/** Letzte Note (bis 21 Tage alt). */
function lastRating(g: Game, p: Player): number | undefined {
  const ms = p.history?.matches ?? [];
  const m = ms[ms.length - 1];
  return m && m.rating > 0 && days(m.date, g.calendar.currentDate) <= 21 ? m.rating : undefined;
}

/** Themen, die zur Lage des Spielers passen. */
export function talkTopics(g: Game, pid: string): TalkTopic[] {
  const p = g.players[pid];
  if (!p) return [];
  const a = roomAnalysis(g);
  const o = a.byId[pid];
  const dr = roomOf(g.clubs[g.managedClubId]);
  const score = p.moraleScore ?? moraleScoreOf(p.morale);
  const ctx = talkContext(g, p);
  const fri = typeof p.frische === 'number' ? p.frische : 100;
  const form = p.form ?? 50;
  const rating = lastRating(g, p);
  const pledged = !!dr.pledges?.some((x) => x.pid === pid);
  const show: Record<TalkKind, boolean> = {
    training: form >= 45,
    loben: (rating !== undefined && rating <= 2.6) || form >= 66,
    fordern: true,
    pause: fri < 80 && p.availability !== 'injured',
    topform: !!ctx.matchSoon && p.availability !== 'injured' && p.suspensionMatches <= 0,
    ziele: p.age <= 30,
    kritisieren: (rating !== undefined && rating >= 4.0) || form < 42,
    einsatz: !pledged && !!o && (o.target < 65 || o.outsider) && p.availability !== 'injured',
    beruhigen: !!o && (o.target < 55 || o.outsider || score < 45 || o.moraleWhy.some((f) => f.label.startsWith('Konflikt'))),
    zukunft: (ctx.contractMonths ?? 24) <= 18 || (p.contract.satisfaction ?? 60) < 50,
    fuehrung: (o?.influence ?? 0) >= 45 && p.age >= 23,
  };
  return ORDER.filter((k) => show[k]).map((k) => {
    const odds = talkOdds(k, p, o, score, ctx);
    return { kind: k, say: sayFor(g, p, k), info: TALK_INFO[k], hint: odds.hint, needed: odds.needed };
  });
}

function sayFor(g: Game, p: Player, k: TalkKind): string {
  if (k === 'fuehrung' && roomOf(g.clubs[g.managedClubId]).captainId === p.id) return 'Als Kapitän brauche ich dich jetzt besonders.';
  return TALK_LINES[k].say;
}

/** Stärkster Charakterzug (für den Nachsatz). */
function topTrait(p: Player): { t: PersonaTrait; v: number } {
  const pe = personaOf(p);
  return TRAITS.map((t) => ({ t, v: pe[t] })).sort((x, y) => y.v - x.v)[0];
}

const pick = <T,>(xs: T[], rng: () => number): T => xs[Math.floor(rng() * xs.length) % xs.length];

/** Antwort des Spielers. */
export function talkReply(g: Game, p: Player, kind: TalkKind, success: boolean, needed: boolean, rng: () => number = Math.random): { quote: string; gesture: string } {
  const lines = TALK_LINES[kind];
  const mood = success ? (needed ? 'ok' : 'meh') : 'fail';
  let quote = pick(lines[mood], rng);
  const tt = topTrait(p);
  if (mood !== 'meh' && tt.v >= 62 && rng() < 0.55) quote += ' ' + TRAIT_TAIL[tt.t][success ? 'ok' : 'fail'];
  const coach = yearOf(g.calendar.currentDate) >= 2000 ? 'Coach' : 'Trainer';
  const club = g.clubs[g.managedClubId]?.name ?? 'diesem Verein';
  quote = quote.replace(/\{coach\}/g, coach).replace(/\{club\}/g, club);
  return { quote, gesture: pick(GESTURE[mood], rng) };
}

/** Gespräch führen: Kabinen-Gespräch + Nebenwirkung + Antwort. */
export function holdTalk(g: Game, pid: string, kind: TalkKind, rng: () => number = Math.random): TalkOutcome {
  const p = g.players[pid];
  const fail = (text: string): TalkOutcome => ({ ok: false, text, success: false, needed: false, before: 0, after: 0, quote: '', gesture: '', effects: [] });
  if (!p) return fail('Der Spieler ist nicht mehr im Kader.');
  const ctx = talkContext(g, p);
  const score = p.moraleScore ?? moraleScoreOf(p.morale);
  const needed = talkOdds(kind, p, roomAnalysis(g).byId[pid], score, ctx).needed;
  const r = talkTo(g, pid, kind, rng, ctx);
  if (!r.ok) return fail(r.text);
  const success = !!r.success;
  const effects: string[] = [];
  const bump = (label: string, get: () => number, set: (v: number) => void, d: number) => {
    const before = get();
    set(clamp(before + d, 0, 100));
    const real = Math.round(get() - before);
    if (real) effects.push(`${label} ${real > 0 ? '+' : ''}${real}`);
  };
  const formUp = (d: number) => bump('Form', () => p.form ?? 50, (v) => { p.form = v; }, d);
  if (kind === 'pause') bump('Frische', () => (typeof p.frische === 'number' ? p.frische : 100), (v) => { p.frische = v; }, needed ? 8 : 3);
  if (success) {
    if (kind === 'training') formUp(1);
    if (kind === 'fordern' || kind === 'topform') formUp(3);
    if (kind === 'ziele') formUp(2);
    if (kind === 'kritisieren') effects.push('Form +4');
    if (kind === 'zukunft') bump('Vertragszufriedenheit', () => p.contract.satisfaction ?? 60, (v) => { p.contract.satisfaction = v; }, needed ? 5 : 2);
    if (kind === 'fuehrung' && needed) {
      addBoost(roomOf(g.clubs[g.managedClubId]), '*', 1, `${p.lastName} geht voran`, g.calendar.currentDate, 14);
      effects.push('Teamstimmung leicht +');
    }
    if (kind === 'einsatz') effects.push('Zusage: zwei Startelf-Einsätze in vier Wochen');
  }
  const { quote, gesture } = talkReply(g, p, kind, success, needed, rng);
  return { ok: true, text: r.text, success, needed, before: r.before ?? score, after: r.after ?? score, quote, gesture, effects };
}

/** Kann mit dem Spieler gerade gesprochen werden? (Abklingzeit, Wochenlimit) */
export function talkBlock(g: Game, pid: string): string | undefined {
  const st = talkState(g, pid);
  if (st.nextOn) return `Ihr habt gerade erst gesprochen – wieder ab ${st.nextOn.split('-').reverse().join('.')}.`;
  const wk = talkWeek(g);
  if (wk.left <= 0) return `Diese Woche hast du keine Zeit mehr für Einzelgespräche – wieder ab ${wk.resets.split('-').reverse().join('.')}.`;
  return undefined;
}
