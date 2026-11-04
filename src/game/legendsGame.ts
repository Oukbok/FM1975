// =============================================================================
// Ausnahmetalente der Fußballgeschichte – stiller Ablauf (keine Nachrichten,
// keine Markierung). Liste: data/legends/ (Datensatz-Feld `legendsV2`),
// Erzeugung: game/legendFactory.ts. Wiki erwähnt nur die Option beim Spielstart.
//
// Wege ins Spiel (je Eintrag fest aus Spielstand-Salz + Kennung):
//  • Deutschland (BRD, nach 1990 auch DDR-Jahrgänge): ab 15 als Jugendspieler
//    beim eingestellten Verein bzw. – ohne Vorgabe – bei einem Verein der
//    Spielerliga, gewichtet nach Ausbildungsqualität (Akademie-Stufe hoch 2,5).
//    Wer 1975 schon 18 ist, steht im Startkader; 15–17-Jährige in der Jugend.
//  • DDR-Jahrgänge vor der Wende: wechseln zum 1.7.1990 als Profi in den Westen.
//  • Ausland (keine vollen Kader außerhalb der Spielerliga): wächst unsichtbar
//    im Heimatland auf und wechselt mit 18–22 (frühreif früher) als junger Profi
//    zu einem Verein der Spielerliga; 1975 bereits 20-Jährige gleich im Startkader.
//    Ziel gewichtet nach Ruf (große Vereine holen die Stars), nie der eigene Verein.
//  • Verein verlässt die Spielerliga (Abstieg): Legenden wechseln vorher still zu
//    einem verbleibenden Verein (sonst gingen sie mit dem Kader verloren).
// Alte Spielstände (ohne `legends2`) bekommen keine Legenden.
// =============================================================================
import type { Club, Player } from '../types';
import type { Game } from './state';
import { LEGENDS, type LegendDef } from '../data/legends';
import { ageOn, makeLegendPro, makeLegendYouth, seededRng } from './legendFactory';
import { isLeagueClub } from '../engine/clubEconomy';
import { academyLevelOf } from '../engine/youthAcademy';
import { recordTransfer } from '../engine/history';
import { bookTransfer } from '../engine/finances';
import { economyScale } from '../engine/economy';
import { GROUP_OF } from '../engine/aiManager';

export interface LegendsState {
  on: boolean;
  /** Erschienene bzw. entfallene Einträge: Kennung → Spieler-ID ('-' = entfallen). */
  done: Record<string, string>;
}

const START = '1975-07-01';
const REUNIFY = 1990;

type Route = { kind: 'youth' } | { kind: 'pro'; from: string } | { kind: 'wait' } | { kind: 'skip' };

function salt(g: Game): string { return g.youthSalt ?? '|'; }

/** Vereine mit vollem Kader (Spielerliga), ohne Pokal-Amateure/Auslandsgäste. */
function fullClubs(g: Game): Club[] {
  return Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.playerIds.length >= 11);
}

function pickWeighted(list: Club[], w: (c: Club) => number, rng: () => number): Club | undefined {
  const ws = list.map((c) => Math.max(0.001, w(c)));
  let r = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
export const youthWeight = (c: Club) => Math.pow(academyLevelOf(c), 2.5);
export const proWeight = (c: Club) => Math.pow(Math.max(0.3, ((c.reputation ?? 50) - 35) / 15), 3);

const isDomestic = (def: LegendDef) => def.country === 'GER' || (def.country === 'DDR' && Number(def.birth.slice(0, 4)) + 15 >= REUNIFY + 1);

/** Wechselalter eines Auslands-Talents (18–22, frühreif früher; fest je Spielstand). */
export function joinAge(def: LegendDef, s: string): number {
  const r = seededRng(`${def.id}|${s}|join`)();
  return Math.max(18, Math.min(22, Math.round(20 - def.maturity * 1.5 + (r - 0.5) * 2.4)));
}

/** Weg eines Eintrags an einem 1. Juli. */
export function routeOf(def: LegendDef, date: string, s: string, start: boolean): Route {
  const age = ageOn(def.birth, date);
  if (age > 34) return { kind: 'skip' };
  if (isDomestic(def)) {
    if (start && age >= 18) return { kind: 'pro', from: '' };
    if (age >= 15 && age <= 19) return { kind: 'youth' };
    return age < 15 ? { kind: 'wait' } : { kind: 'skip' };
  }
  const year = Number(date.slice(0, 4));
  if (def.country === 'DDR') return year >= REUNIFY ? { kind: 'pro', from: 'DDR' } : { kind: 'wait' };
  if (start && age >= 20) return { kind: 'pro', from: 'Ausland' };
  return age >= joinAge(def, s) ? { kind: 'pro', from: 'Ausland' } : { kind: 'wait' };
}

/** Herkunftsverein für die Transferhistorie (Auslandsverein des Landes bzw. DDR-Verein). */
function fromName(g: Game, def: LegendDef, rng: () => number): string {
  if (def.country === 'DDR') {
    const ddr = Object.values(g.simClubs ?? {}).filter((c) => (c as { ddr?: boolean }).ddr || c.id.startsWith('ddr-'));
    if (ddr.length) return ddr[Math.floor(rng() * ddr.length)].name;
  }
  const names: Record<string, string> = { NED: 'Niederlande', FRA: 'Frankreich', ITA: 'Italien', ESP: 'Spanien', ENG: 'England', SCO: 'Schottland', POR: 'Portugal', BEL: 'Belgien', DEN: 'Daenemark', SWE: 'Schweden', POL: 'Polen', CZE: 'Tschechoslowakei', BUL: 'Bulgarien', CRO: 'Jugoslawien', UKR: 'Sowjetunion' };
  const land = names[def.country];
  const eu = land ? Object.values(g.euroClubs ?? {}).filter((c) => c.country === land) : [];
  return eu.length ? eu[Math.floor(rng() * eu.length)].name : 'Ausland';
}

/** Schwächsten Spieler derselben Positionsgruppe streichen (nur Startkader 1975: Kadergröße bleibt). */
function dropWeakest(g: Game, club: Club, p: Player): void {
  const grp = GROUP_OF[p.naturalPosition];
  const cand = club.playerIds.map((id) => g.players[id]).filter((x): x is Player => !!x && GROUP_OF[x.naturalPosition] === grp && !legendIds(g).has(x.id));
  cand.sort((a, b) => a.overall - b.overall);
  const w = cand[0];
  if (!w || cand.length < 2) return;
  club.playerIds = club.playerIds.filter((id) => id !== w.id);
  delete g.players[w.id];
}

let idCache: { g: Game; n: number; set: Set<string> } | null = null;
/** Spieler-IDs aller erschienenen Legenden. */
export function legendIds(g: Game): Set<string> {
  const d = g.legends2?.done ?? {};
  const n = Object.keys(d).length;
  if (idCache && idCache.g === g && idCache.n === n) return idCache.set;
  const set = new Set(Object.values(d).filter((x) => x !== '-'));
  idCache = { g, n, set };
  return set;
}

function spawnOne(g: Game, def: LegendDef, date: string, start: boolean): void {
  const st = g.legends2!;
  const s = salt(g);
  const route = routeOf(def, date, s, start);
  if (route.kind === 'wait') return;
  if (route.kind === 'skip') { st.done[def.id] = '-'; return; }
  const rng = seededRng(`${def.id}|${s}|${date}`);
  const clubs = fullClubs(g);
  if (!clubs.length) return;
  const fixed = def.club ? g.clubs[def.club] : undefined;
  const fixedOk = !!fixed && clubs.includes(fixed);
  if (route.kind === 'youth') {
    // Vorgegebener Verein spielt (noch) nicht in der Spielerliga: bis 17 warten, dann gewichtet.
    if (def.club && !fixedOk && ageOn(def.birth, date) < 17) return;
    const club = fixedOk ? fixed! : pickWeighted(clubs, youthWeight, rng)!;
    const p = makeLegendYouth(def, { clubId: club.id, date, salt: s, academyLevel: academyLevelOf(club) });
    g.youthPlayers[p.id] = p;
    club.youthPlayerIds.push(p.id);
    st.done[def.id] = p.id;
    return;
  }
  // Profi: Startkader bzw. stiller Wechsel nach Deutschland – nie zum eigenen Verein.
  const pool = clubs.filter((c) => c.id !== g.managedClubId);
  const club = fixedOk && fixed!.id !== g.managedClubId ? fixed! : pickWeighted(pool.length ? pool : clubs, proWeight, rng)!;
  const p = makeLegendPro(def, { clubId: club.id, date, salt: s }, start ? rng() : rng() * 0.6);
  g.players[p.id] = p;
  club.playerIds.push(p.id);
  st.done[def.id] = p.id;
  if (start) { dropWeakest(g, club, p); return; }
  const year = Number(date.slice(0, 4));
  const fee = Math.max(0, Math.min(club.finances.transferBudget, Math.round(p.contract.transferValue * 0.8 / 5000) * 5000));
  if (fee > 0) { club.finances.transferBudget -= fee; bookTransfer(club, fee, true, p.fullName, date, false); }
  recordTransfer(p, route.from === 'DDR' || route.from === 'Ausland' ? fromName(g, def, rng) : route.from, club.name, Math.round(fee * economyScale(year)), date);
}

function spawnDue(g: Game, date: string, start: boolean): void {
  const st = g.legends2;
  if (!st?.on) return;
  for (const def of LEGENDS) if (!st.done[def.id]) spawnOne(g, def, date, start);
}

/** Spielstart: Zustand anlegen und die Jahrgänge bis 1975 einsetzen. */
export function initLegends(g: Game, on: boolean): void {
  g.legends2 = { on, done: {} };
  spawnDue(g, g.calendar?.currentDate?.slice(0, 10) || START, true);
}

/** Täglich (wirksam nur am 1. Juli): neue Jahrgänge und fällige Wechsel. */
export function legendsDaily(g: Game, today: string): void {
  if (!g.legends2?.on || today.slice(5) !== '07-01') return;
  spawnDue(g, today, false);
}

/**
 * Saisonwechsel: Legenden in Vereinen, die die Spielerliga verlassen, wechseln vorher
 * still zu einem verbleibenden Verein (Jugend nach Ausbildungsqualität, Profis nach Ruf).
 * `stay` = Vereine der neuen Spielerliga.
 */
export function rescueLegends(g: Game, stay: Set<string>, date: string): void {
  if (!g.legends2?.on) return;
  const targets = Object.values(g.clubs).filter((c) => stay.has(c.id) && isLeagueClub(c) && c.id !== g.managedClubId);
  if (!targets.length) return;
  for (const pid of legendIds(g)) {
    const youth = g.youthPlayers[pid], pro = g.players[pid];
    const p = youth ?? pro;
    if (!p || stay.has(p.clubId) || !g.clubs[p.clubId] || p.loan) continue;
    const from = g.clubs[p.clubId];
    const rng = seededRng(`${pid}|${salt(g)}|rescue|${date}`);
    const to = pickWeighted(targets, youth ? youthWeight : proWeight, rng)!;
    if (youth) {
      from.youthPlayerIds = from.youthPlayerIds.filter((id) => id !== pid);
      to.youthPlayerIds.push(pid);
    } else {
      from.playerIds = from.playerIds.filter((id) => id !== pid);
      to.playerIds.push(pid);
      p.shirtNumber = 0;
      recordTransfer(p, from.name, to.name, 0, date);
    }
    p.clubId = to.id;
  }
}
