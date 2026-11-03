// =============================================================================
// VERSPRECHEN ZUM ERSTEN TRAINING — Spielablauf
// -----------------------------------------------------------------------------
// Katalog/Reaktionen in engine/seasonPromises.ts, Popup views/kader/promises/.
//   • `seasonPromisesDaily` (game/day.ts): am ersten Trainingstag der Saison
//     (vor dem ersten Ligaspiel) wird `pending` gesetzt → Popup. Danach: Frische-
//     Verstöße an eigenen Spieltagen zählen, montags früh brechende Versprechen
//     prüfen (Pokal-Aus, zu viele Verstöße), 2. Januar Zwischenstand.
//   • `giveSeasonPromises`: Auswahl speichern, Reaktion je Persönlichkeit als
//     sofortiger Moral-Sprung, Teamstimmung, Nachricht.
//   • `seasonPromiseSnapshot` + `settleSeasonPromises` (game/season.ts
//     startNextSeason): Endtabelle/Pokale vor dem Saisonwechsel, Auf-/Abstieg
//     danach → gehalten/gebrochen mit Folgen für Glaubwürdigkeit (`promiseTrust`,
//     dieselbe wie bei Transfer-Versprechen), Moral, Kabine, Vorstand, Fans.
// Optionales Feld `game.seasonPromises` (fehlt = noch nie angeboten).
// =============================================================================
import {
  MAX_SEASON_PROMISES, SEASON_PROMISES, SP_DEF, SP_LIMITS, type Reaction, type ReactorIn, type SeasonPromiseId,
  reactionJolt, reactionOf, realismOf,
} from '../engine/seasonPromises';
import { makeMessage, pushMessage } from '../engine/messages';
import { originClubOf, personaOf } from '../engine/persona';
import { staffEffectsOf } from './staffGame';
import { addBoost, goalOf, logRoom, roomAnalysis, roomOf, squadOf } from './dressingRoomGame';
import { ensureEnvironment } from './environmentGame';
import { moraleJolt } from './moraleJolt';
import { trustOf } from './promises';
import { ownFixtures } from './trainingWeek';
import type { Club, Player } from '../types';
import type { LineupPrefs } from '../engine/lineupAI';
import type { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type SPResult = 'kept' | 'broken';
export interface SeasonPromisePick { id: SeasonPromiseId; r?: SPResult; on?: string; note?: string }
export interface SeasonPromiseBase {
  cap: number; proj: boolean; scout: number; train: number; youth: number; invest: number;
  level: number; expected: number; size: number; goal?: string;
  /** Spieler bis 21 bzw. erfahrene Leistungsträger ab 31 (IDs) beim ersten Training. */
  young: string[]; vets: string[];
}
export interface SeasonPromiseRecord {
  season: string; date: string; club: string;
  picks: SeasonPromisePick[];
  base: SeasonPromiseBase;
  /** Reaktionen (Spieler-ID → Summe) beim Versprechen; wer daran glaubte, ist beim Bruch enttäuscht. */
  react?: Record<string, number>;
  /** Startelf-Einsätze mit zu wenig Frische. */
  fit?: number;
  /** Zwischenstand verschickt. */
  mid?: boolean;
  /** Saison ausgewertet. */
  done?: boolean;
}
export interface SeasonPromiseState { v: 1; pending?: string; seasons: SeasonPromiseRecord[] }

const MAX_RECORDS = 40;
type GameSP = Game & { seasonPromises?: SeasonPromiseState };

export function spState(g: Game): SeasonPromiseState | undefined { return (g as GameSP).seasonPromises; }
function ensureSP(g: Game): SeasonPromiseState { return ((g as GameSP).seasonPromises ??= { v: 1, seasons: [] }); }
export function spRecord(g: Game, season = g.season): SeasonPromiseRecord | undefined {
  return spState(g)?.seasons.find((s) => s.season === season);
}
export function pendingSeasonPromises(g: Game): string | undefined {
  const st = spState(g);
  return st?.pending && st.pending === g.season && !spRecord(g) ? st.pending : undefined;
}
export function clearPendingSeasonPromises(g: Game): void { const st = spState(g); if (st) delete st.pending; }

// -----------------------------------------------------------------------------
// Ausgangslage
// -----------------------------------------------------------------------------
function ownLeaguePlayed(g: Game, id: string): number {
  return g.fixtures.filter((m) => m.result && (m.homeClubId === id || m.awayClubId === id)).length;
}
function level(g: Game): number { return g.leagues.playerDivision.tier % 100; }

function inCup(g: Game, id: string): boolean { return !!g.cup?.participantIds?.includes(id); }
function inEuro(g: Game, id: string): boolean {
  return Object.values(g.euroCups ?? {}).some((c) => c && (c.participantIds?.includes(id) || c.rounds?.some((r) => r.ties?.some((t) => t.homeClubId === id || t.awayClubId === id))));
}
/** Aus dem Wettbewerb ausgeschieden? */
function outOf(cups: ({ rounds?: { ties?: { homeClubId: string; awayClubId: string; winnerClubId: string | null }[] }[] } | null | undefined)[], id: string): boolean {
  return cups.some((c) => c?.rounds?.some((r) => r.ties?.some((t) => (t.homeClubId === id || t.awayClubId === id) && t.winnerClubId && t.winnerClubId !== id)));
}

function infraValues(g: Game, club: Club) {
  const inf = club.infrastructure;
  const yi = club.youthInvest;
  return {
    cap: club.stadium.capacity,
    proj: !!club.stadium.blockProject || !!club.stadiumProject,
    scout: Math.round(((staffEffectsOf(g).scouting ?? 0) + (inf.dataCenter ?? 1) * 0.02) * 1000) / 1000,
    train: inf.trainingCenter + (inf.performanceCenter ?? 0),
    youth: inf.youthAcademy + (inf.nlz ?? 0) + (yi ? Object.values(yi.levels).reduce((a, v) => a + v, 0) + yi.builds.length * 0.5 : 0),
    invest: club.corporate?.investorShare ?? -1,
  };
}

function veteransOf(squad: Player[]): string[] {
  const top = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 14);
  return top.filter((p) => p.age >= 31).map((p) => p.id);
}

export function makeBase(g: Game): SeasonPromiseBase {
  const club = g.clubs[g.managedClubId];
  const squad = squadOf(g, club);
  const size = g.table.rows.length || 18;
  const goal = goalOf(g, club);
  return {
    ...infraValues(g, club), level: level(g), size, expected: goal?.expected ?? Math.round(size / 2), goal: club.boardExpectation,
    young: squad.filter((p) => p.age <= 21).map((p) => p.id), vets: veteransOf(squad),
  };
}

/** Warum ein Versprechen gerade nicht passt (ausgegraut) – sonst undefined. */
export function unavailableWhy(g: Game, id: SeasonPromiseId, base = makeBase(g)): string | undefined {
  const me = g.managedClubId;
  const club = g.clubs[me];
  switch (id) {
    case 'meister': return base.level > 1 ? 'Nur in der höchsten Spielklasse – versprich lieber den Aufstieg.' : undefined;
    case 'pokal': return inCup(g, me) ? undefined : 'Ihr spielt diese Saison nicht im Landespokal.';
    case 'international': return inEuro(g, me) ? undefined : 'Ihr spielt diese Saison nicht im Europapokal.';
    case 'aufstieg': return base.level <= 1 ? 'Ihr spielt bereits in der höchsten Spielklasse.' : undefined;
    case 'europaNext': return base.level > 1 ? 'Nur aus der höchsten Spielklasse möglich.' : undefined;
    case 'ziel': return club.boardExpectation ? undefined : 'Der Vorstand hat kein Saisonziel ausgegeben.';
    case 'zielPlus': return !club.boardExpectation ? 'Der Vorstand hat kein Saisonziel ausgegeben.' : base.expected <= 1 ? 'Das Saisonziel ist schon die Meisterschaft.' : undefined;
    case 'jugend': return base.young.length < 2 ? 'Kaum Spieler bis 21 im Kader – hol erst Talente hoch.' : undefined;
    case 'erfahrung': return base.vets.length ? undefined : 'Kein erfahrener Leistungsträger über 30 im Kader.';
    case 'boerse':
      if (!club.corporate) return 'Erst nach der Ausgliederung des Profibereichs (ab 1998, Verein › Vorstand).';
      return club.corporate.investorShare >= 49 ? 'Die 50+1-Grenze ist erreicht.' : undefined;
    default: return undefined;
  }
}

// -----------------------------------------------------------------------------
// Popup: wer hört zu, wie reagiert er?
// -----------------------------------------------------------------------------
export interface Listener { p: Player; influence: number; captain: boolean; role: string; reactor: ReactorIn }

function reactorOf(p: Player, rank: number): ReactorIn {
  return {
    persona: personaOf(p), prof: p.development.professionalism ?? 50, age: p.age, rank,
    stamina: p.attributes.fitness ?? 60, homegrown: originClubOf(p.id).homegrown,
  };
}

/** Alle Kaderspieler mit Einfluss (absteigend); die ersten 8 zeigt das Popup. */
export function listeners(g: Game): Listener[] {
  const club = g.clubs[g.managedClubId];
  const squad = squadOf(g, club);
  const rank = new Map([...squad].sort((a, b) => b.overall - a.overall).map((p, i) => [p.id, i + 1]));
  const a = roomAnalysis(g, club);
  const cap = roomOf(club).captainId;
  return squad.map((p) => {
    const o = a.byId[p.id];
    const captain = p.id === cap;
    const role = captain ? 'Kapitän' : o?.tier === 'fuehrung' ? 'Führungsspieler' : o?.tier === 'stuetze' ? 'Stütze' : o?.tier === 'aussen' ? 'Außen vor' : 'Mitläufer';
    return { p, influence: o?.influence ?? 30, captain, role, reactor: reactorOf(p, rank.get(p.id) ?? 99) };
  }).sort((x, y) => (y.captain ? 1000 : 0) + y.influence - ((x.captain ? 1000 : 0) + x.influence));
}

export function realismFn(base: SeasonPromiseBase) {
  return (id: SeasonPromiseId) => realismOf(id, { expected: base.expected, size: base.size, level: base.level });
}

export function reactionFor(g: Game, l: Listener, picks: SeasonPromiseId[], base: SeasonPromiseBase): Reaction {
  return reactionOf(l.reactor, picks, realismFn(base), trustOf(g));
}

// -----------------------------------------------------------------------------
// Versprechen abgeben
// -----------------------------------------------------------------------------
export function giveSeasonPromises(g: Game, picks: SeasonPromiseId[], today = g.calendar.currentDate): SeasonPromiseRecord {
  const st = ensureSP(g);
  const base = makeBase(g);
  const ok = [...new Set(picks)].filter((id) => SP_DEF[id] && !unavailableWhy(g, id, base)).slice(0, MAX_SEASON_PROMISES);
  const rec: SeasonPromiseRecord = { season: g.season, date: today, club: g.managedClubId, picks: ok.map((id) => ({ id })), base, react: {} };
  st.seasons = st.seasons.filter((s) => s.season !== g.season);
  st.seasons.push(rec);
  if (st.seasons.length > MAX_RECORDS) st.seasons.splice(0, st.seasons.length - MAX_RECORDS);
  delete st.pending;
  if (!ok.length) return rec;
  const club = g.clubs[g.managedClubId];
  const dr = roomOf(club);
  const ls = listeners(g);
  let wsum = 0, w = 0;
  for (const l of ls) {
    const r = reactionFor(g, l, ok, base);
    rec.react![l.p.id] = r.total;
    const j = reactionJolt(r.total);
    if (j) moraleJolt(g, l.p, j, 'Ansprache zum ersten Training', today);
    wsum += r.total * (0.5 + l.influence / 100); w += 0.5 + l.influence / 100;
  }
  const avg = w ? wsum / w : 0;
  if (Math.abs(avg) >= 0.3) addBoost(dr, '*', Math.round(clamp(avg * 3, -6, 6)), 'Ansprache zum ersten Training', today, 30);
  const fans = ok.filter((id) => SP_DEF[id].public).length;
  if (fans) { const env = ensureEnvironment(g); env.fanMood = clamp(env.fanMood + Math.min(4, fans * 1.5), 0, 100); }
  logRoom(dr, today, `Ansprache zum ersten Training: ${ok.length} Versprechen.`);
  const mood = avg >= 0.7 ? 'Die Mannschaft ist angetan.' : avg <= -0.7 ? 'Die Mannschaft ist skeptisch.' : 'Die Mannschaft wartet ab.';
  pushMessage(g.messages, makeMessage({
    date: today, category: 'training', from: 'Co-Trainer', subject: 'Ansprache zum ersten Training',
    shortText: `${ok.length} Versprechen für die Saison ${g.season}. ${mood}`,
    bodyText: `Du hast der Mannschaft beim ersten Training versprochen:\n${ok.map((id) => `• ${SP_DEF[id].label} – ${SP_DEF[id].check}`).join('\n')}\n\n${mood} `
      + 'Den Stand siehst du jederzeit unter Kader › Kabine (Reiter „Versprechen“). Gehaltene Versprechen stärken deine Glaubwürdigkeit, gebrochene kosten Moral, Vertrauen und Ansehen.',
  }));
  return rec;
}

// -----------------------------------------------------------------------------
// Messung
// -----------------------------------------------------------------------------
interface Lineups { ids: string[][]; bad: Set<string>[]; cards: { y: number; r: number }; leagueY: number; teamMatches: number }

function ownLeagueLineups(g: Game, me: string): Lineups {
  const out: Lineups = { ids: [], bad: [], cards: { y: 0, r: 0 }, leagueY: 0, teamMatches: 0 };
  const list = g.fixtures.filter((m) => m.result).sort((a, b) => a.date.localeCompare(b.date));
  for (const m of list) {
    const res = m.result as typeof m.result & { report?: { lineups: { home: { id: string; started: boolean; grade: number; card?: string }[]; away: { id: string; started: boolean; grade: number; card?: string }[] } } };
    out.leagueY += res!.homeYellowCards + res!.awayYellowCards; out.teamMatches += 2;
    if (m.homeClubId !== me && m.awayClubId !== me) continue;
    const home = m.homeClubId === me;
    out.cards.y += home ? res!.homeYellowCards : res!.awayYellowCards;
    const lu = res!.report?.lineups?.[home ? 'home' : 'away'];
    if (!lu) continue;
    out.ids.push(lu.filter((e) => e.started).map((e) => e.id));
    out.bad.push(new Set(lu.filter((e) => e.grade >= SP_LIMITS.badGrade).map((e) => e.id)));
    out.cards.r += lu.filter((e) => e.card === 'Rot' || e.card === 'Gelb-Rot').length;
  }
  return out;
}

/**
 * Was der Co-Trainer beim automatischen Aufstellen beachtet, solange Team-Versprechen
 * offen sind (engine/lineupAI.ts `autoFillLineup`): Müde (Frische knapp über der
 * Grenze) und nach einer Note 5 sitzen draußen, Jugend bzw. Routiniers werden
 * bevorzugt, bei „Rotation“ bekommen die Spieler des letzten Ligaspiels einen Abschlag.
 */
export function promiseLineupPrefs(g: Game): LineupPrefs | undefined {
  const rec = spRecord(g);
  if (!rec || rec.done || rec.club !== g.managedClubId) return undefined;
  const open = new Set(rec.picks.filter((p) => !p.r).map((p) => p.id));
  if (!['fitness', 'leistung', 'jugend', 'erfahrung', 'rotation'].some((id) => open.has(id as SeasonPromiseId))) return undefined;
  const me = rec.club;
  const rest = new Set<string>();
  const club = g.clubs[me];
  if (open.has('fitness')) for (const pid of club.playerIds) if ((g.players[pid]?.frische ?? 100) < SP_LIMITS.fitFresh + 3) rest.add(pid);
  const L = open.has('leistung') || open.has('rotation') || open.has('jugend') ? ownLeagueLineups(g, me) : undefined;
  if (open.has('leistung') && L?.bad.length) for (const pid of L.bad[L.bad.length - 1]) rest.add(pid);
  const last = new Set(open.has('rotation') && L?.ids.length ? L.ids[L.ids.length - 1] : []);
  // Jugend: stärkerer Bonus, solange der Anteil unter dem Ziel liegt.
  let youth = 1;
  if (open.has('jugend')) {
    const all = L?.ids.reduce((a, x) => a + x.length, 0) ?? 0;
    const y = L?.ids.reduce((a, x) => a + x.filter((pid) => (g.players[pid]?.age ?? 99) <= 21).length, 0) ?? 0;
    youth = all && y / all >= SP_LIMITS.youthShare + 0.03 ? 1.04 : 1.12;
  }
  const vets = new Set(open.has('erfahrung') ? rec.base.vets : []);
  const weight = (p: Player) => (p.age <= 21 ? youth : 1) * (vets.has(p.id) ? 1.06 : 1) * (last.has(p.id) ? 0.95 : 1);
  return { rest, weight };
}

export interface SPStatus { s: 'kept' | 'broken' | 'good' | 'risk' | 'open'; text: string }

function measure(g: Game, rec: SeasonPromiseRecord, id: SeasonPromiseId): SPStatus {
  const me = rec.club;
  const club = g.clubs[me];
  const b = rec.base;
  const pos = g.table.rows.findIndex((r) => r.clubId === me) + 1;
  const size = g.table.rows.length || b.size;
  const played = ownLeaguePlayed(g, me);
  const early = played < 4;
  const posTxt = played ? `Platz ${pos} nach ${played} Spielen` : 'Die Saison hat noch nicht begonnen';
  const rank = (good: boolean, ok: boolean): SPStatus => ({ s: early ? 'open' : good ? 'good' : ok ? 'open' : 'risk', text: posTxt });
  switch (id) {
    case 'meister': return rank(pos === 1, pos <= 3);
    case 'aufstieg': return rank(pos <= 2, pos <= 4);
    case 'klassenerhalt': return rank(pos < size - 4, pos < size - 2);
    case 'ziel': return rank(pos <= b.expected, pos <= b.expected + 2);
    case 'zielPlus': return rank(pos < b.expected, pos <= b.expected);
    case 'europaNext': return rank(pos <= 4, pos <= 6);
    case 'pokal': return outOf([g.cup], me) ? { s: 'broken', text: 'Im Pokal ausgeschieden.' } : { s: 'open', text: g.cup?.winnerClubId === me ? 'Pokalsieger!' : 'Noch im Wettbewerb.' };
    case 'international': return outOf(Object.values(g.euroCups ?? {}), me) ? { s: 'broken', text: 'Im Europapokal ausgeschieden.' } : { s: 'open', text: 'Noch im Wettbewerb.' };
    case 'fitness': {
      const n = rec.fit ?? 0;
      return { s: n > SP_LIMITS.fitAllowed ? 'broken' : n === SP_LIMITS.fitAllowed ? 'risk' : 'good', text: `${n} von höchstens ${SP_LIMITS.fitAllowed} Einsätzen ohne Frische.` };
    }
    case 'leistung': {
      const L = ownLeagueLineups(g, me);
      let n = 0;
      for (let i = 1; i < L.ids.length; i++) n += L.ids[i].filter((pid) => L.bad[i - 1].has(pid)).length;
      return { s: n > SP_LIMITS.badAllowed ? 'broken' : n === SP_LIMITS.badAllowed ? 'risk' : 'good', text: `${n} von höchstens ${SP_LIMITS.badAllowed} Ausnahmen.` };
    }
    case 'rotation': {
      const L = ownLeagueLineups(g, me);
      let ch = 0;
      for (let i = 1; i < L.ids.length; i++) ch += L.ids[i].filter((pid) => !L.ids[i - 1].includes(pid)).length;
      const avg = L.ids.length > 1 ? ch / (L.ids.length - 1) : 0;
      return { s: L.ids.length < 4 ? 'open' : avg >= SP_LIMITS.rotation ? 'good' : 'risk', text: `Ø ${avg.toFixed(1).replace('.', ',')} Wechsel in der Startelf je Spiel.` };
    }
    case 'disziplin': {
      const L = ownLeagueLineups(g, me);
      const mine = L.ids.length ? L.cards.y / L.ids.length : 0;
      const avg = L.teamMatches ? L.leagueY / L.teamMatches : 0;
      const txt = `${L.cards.r} Platzverweise, Ø ${mine.toFixed(1).replace('.', ',')} Gelbe (Liga ${avg.toFixed(1).replace('.', ',')}).`;
      if (L.cards.r > SP_LIMITS.reds) return { s: 'broken', text: txt };
      return { s: L.ids.length < 4 ? 'open' : mine <= avg ? 'good' : 'risk', text: txt };
    }
    case 'stimmung': {
      const m = Math.round(roomOf(club).mood);
      return { s: m >= SP_LIMITS.mood ? 'good' : 'risk', text: `Teamstimmung ${m}.` };
    }
    case 'jugend': {
      const L = ownLeagueLineups(g, me);
      const all = L.ids.reduce((a, x) => a + x.length, 0);
      const yg = new Set(b.young);
      const y = L.ids.reduce((a, x) => a + x.filter((pid) => yg.has(pid) || (g.players[pid]?.age ?? 99) <= 21).length, 0);
      const sh = all ? y / all : 0;
      return { s: L.ids.length < 4 ? 'open' : sh >= SP_LIMITS.youthShare ? 'good' : 'risk', text: `${Math.round(sh * 100)} % der Startelf-Einsätze für Spieler bis 21.` };
    }
    case 'erfahrung': {
      const L = ownLeagueLineups(g, me);
      const vets = b.vets.filter((pid) => g.players[pid]?.clubId === me);
      const okN = vets.filter((pid) => L.ids.length && L.ids.filter((x) => x.includes(pid)).length / L.ids.length >= SP_LIMITS.vetShare).length;
      const need = Math.ceil(vets.length * 2 / 3);
      return { s: L.ids.length < 4 || !vets.length ? 'open' : okN >= need ? 'good' : 'risk', text: `${okN} von ${vets.length} Routiniers regelmäßig in der Startelf.` };
    }
    case 'stadion': {
      const v = infraValues(g, club);
      const done = v.cap > b.cap || (v.proj && !b.proj);
      return { s: done ? 'good' : 'open', text: done ? (v.cap > b.cap ? `${(v.cap - b.cap).toLocaleString('de-DE')} Plätze mehr.` : 'Umbau läuft.') : 'Noch kein Ausbau begonnen.' };
    }
    case 'boerse': {
      const v = infraValues(g, club);
      return { s: v.invest > b.invest ? 'good' : 'open', text: v.invest > b.invest ? `Investor hält ${v.invest} %.` : 'Noch keine Anteile verkauft.' };
    }
    case 'treue': return g.managedClubId === me ? { s: 'good', text: 'Du bist noch da.' } : { s: 'broken', text: 'Du hast den Verein verlassen.' };
    case 'scouting': { const v = infraValues(g, club); return { s: v.scout > b.scout + 0.0005 ? 'good' : 'open', text: v.scout > b.scout + 0.0005 ? 'Scoutabteilung verstärkt.' : 'Noch nichts verbessert.' }; }
    case 'trainingsanlagen': { const v = infraValues(g, club); return { s: v.train > b.train ? 'good' : 'open', text: v.train > b.train ? 'Ausgebaut.' : 'Noch nichts ausgebaut.' }; }
    case 'nachwuchs': { const v = infraValues(g, club); return { s: v.youth > b.youth ? 'good' : 'open', text: v.youth > b.youth ? 'Ausbau begonnen.' : 'Noch nichts ausgebaut.' }; }
    default: return { s: 'open', text: '' };
  }
}

/** Stand eines Versprechens (für Kabine und Popup-Archiv). */
export function promiseStatus(g: Game, rec: SeasonPromiseRecord, pick: SeasonPromisePick): SPStatus {
  if (pick.r) return { s: pick.r, text: pick.note ?? (pick.r === 'kept' ? 'Gehalten.' : 'Gebrochen.') };
  if (rec.season !== g.season) return { s: 'open', text: '' };
  return measure(g, rec, pick.id);
}

// -----------------------------------------------------------------------------
// Folgen
// -----------------------------------------------------------------------------
function settle(g: Game, rec: SeasonPromiseRecord, pick: SeasonPromisePick, kept: boolean, note: string, today: string): void {
  if (pick.r) return;
  pick.r = kept ? 'kept' : 'broken'; pick.on = today; pick.note = note;
  const club = g.clubs[rec.club];
  if (!club) return;
  const def = SP_DEF[pick.id];
  const dr = roomOf(club);
  const believers = Object.entries(rec.react ?? {}).filter(([, v]) => v >= 0.7).map(([pid]) => g.players[pid]).filter((p): p is Player => !!p && p.clubId === club.id);
  const env = ensureEnvironment(g);
  if (kept) {
    g.promiseTrust = clamp(trustOf(g) + 4, 0, 100);
    for (const p of believers) moraleJolt(g, p, 3, `Versprechen gehalten: ${def.label}`, today);
    addBoost(dr, '*', 3, `Versprechen gehalten: ${def.label}`, today, 30);
    if (def.public) { club.boardConfidence = clamp(club.boardConfidence + 3, 0, 100); env.fanMood = clamp(env.fanMood + 2, 0, 100); }
    logRoom(dr, today, `Versprechen gehalten: ${def.label}`);
    return;
  }
  g.promiseTrust = clamp(trustOf(g) - 8, 0, 100);
  for (const p of believers) { moraleJolt(g, p, -5, `Versprechen gebrochen: ${def.label}`, today); addBoost(dr, p.id, -3, `Versprechen gebrochen: ${def.label}`, today, 45); }
  addBoost(dr, '*', -4, `Versprechen gebrochen: ${def.label}`, today, 40);
  if (def.public) { club.boardConfidence = clamp(club.boardConfidence - 3, 0, 100); env.fanMood = clamp(env.fanMood - 3, 0, 100); }
  // Vorfall: ein Führungsspieler, der daran geglaubt hat, stellt dich zur Rede.
  const a = believers.length ? roomAnalysis(g, club) : undefined;
  const leader = a ? believers.filter((p) => (a.byId[p.id]?.influence ?? 0) >= 60).sort((x, y) => (a.byId[y.id]?.influence ?? 0) - (a.byId[x.id]?.influence ?? 0))[0] : undefined;
  if (leader) {
    addBoost(dr, '#c', -3, `${leader.lastName} stellt dich zur Rede`, today, 30);
    logRoom(dr, today, `${leader.lastName} stellt dich vor der Mannschaft zur Rede: „${def.label}“ war versprochen.`);
  } else logRoom(dr, today, `Versprechen gebrochen: ${def.label}`);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'general', from: leader?.fullName ?? 'Co-Trainer', subject: `Versprechen gebrochen: ${def.label}`,
    shortText: note,
    bodyText: (leader ? `${leader.fullName} stellt dich vor der Mannschaft zur Rede: „Beim ersten Training hast du gesagt: ${def.label} ${note} Wie sollen wir dir noch glauben?“`
      : `Beim ersten Training hast du versprochen: „${def.label}“ ${note}`)
      + `\n\nWer daran geglaubt hat, ist enttäuscht; die Teamstimmung leidet.${def.public ? ' Auch Vorstand und Fans haben es registriert.' : ''} Glaubwürdigkeit jetzt ${trustOf(g)}.`,
  }));
}

/** Eigener Spieltag, vor dem Anpfiff (game/day.ts): Startelf mit zu wenig Frische zählen. */
export function seasonPromisesFitness(g: Game, today: string): void {
  const rec = spRecord(g);
  const club = g.clubs[g.managedClubId];
  if (!rec || rec.done || rec.club !== club?.id || !rec.picks.some((p) => p.id === 'fitness' && !p.r)) return;
  if (!ownFixtures(g, today, today).size) return;
  const ids = new Set(Object.values(club.tactics?.lineupMap ?? {}));
  rec.fit = (rec.fit ?? 0) + [...ids].filter((pid) => (g.players[pid]?.frische ?? 100) < SP_LIMITS.fitFresh).length;
}

/** Täglich (game/day.ts), nur eigener Verein. Rückgabe true = Popup ist jetzt fällig. */
export function seasonPromisesDaily(g: Game, today: string, trainedToday: boolean): boolean {
  const me = g.managedClubId;
  const rec = spRecord(g);
  if (!rec) {
    const st = spState(g);
    if (!trainedToday || st?.pending === g.season || ownLeaguePlayed(g, me) > 0) return false;
    ensureSP(g).pending = g.season;
    return true;
  }
  if (rec.done || !rec.picks.length) return false;
  const wd = new Date(today + 'T00:00:00Z').getUTCDay();
  if (wd === 1 || rec.club !== me) {
    for (const p of rec.picks) {
      if (p.r || !['pokal', 'international', 'fitness', 'leistung', 'disziplin', 'treue'].includes(p.id)) continue;
      const s = measure(g, rec, p.id);
      if (s.s === 'broken') settle(g, rec, p, false, s.text, today);
    }
  }
  if (today.slice(5) === '01-02' && !rec.mid) {
    rec.mid = true;
    const open = rec.picks.filter((p) => !p.r);
    if (open.length) {
      const lines = rec.picks.map((p) => { const s = promiseStatus(g, rec, p); return `• ${SP_DEF[p.id].label} – ${SP_WORD[s.s]}${s.text ? ` (${s.text})` : ''}`; });
      pushMessage(g.messages, makeMessage({
        date: today, category: 'general', from: 'Co-Trainer', subject: 'Halbzeit: deine Versprechen',
        shortText: `${open.filter((p) => measure(g, rec, p.id).s === 'risk').length} Versprechen gefährdet.`,
        bodyText: `Zur Saisonhälfte erinnert die Mannschaft an deine Ansprache zum ersten Training:\n${lines.join('\n')}`,
      }));
    }
  }
  return false;
}

export const SP_WORD: Record<SPStatus['s'], string> = { kept: 'gehalten', broken: 'gebrochen', good: 'auf Kurs', risk: 'gefährdet', open: 'offen' };

// -----------------------------------------------------------------------------
// Saisonende (startNextSeason)
// -----------------------------------------------------------------------------
export interface SPSnapshot { season: string; pos: number; size: number; cup: boolean; euro: boolean; euroNext: boolean; level: number; mood: number; status: Record<string, SPStatus> }

/** Vor dem Saisonwechsel: Endstand festhalten (Tabelle/Pokale werden danach überschrieben). */
export function seasonPromiseSnapshot(g: Game, euroNext: boolean): SPSnapshot | undefined {
  const rec = spRecord(g);
  if (!rec || rec.done || !rec.picks.length) return undefined;
  const me = rec.club;
  const status: Record<string, SPStatus> = {};
  for (const p of rec.picks) if (!p.r) status[p.id] = measure(g, rec, p.id);
  return {
    season: g.season, pos: g.table.rows.findIndex((r) => r.clubId === me) + 1, size: g.table.rows.length, level: level(g),
    cup: g.cup?.winnerClubId === me, euro: Object.values(g.euroCups ?? {}).some((c) => c?.winnerClubId === me),
    euroNext, mood: Math.round(roomOf(g.clubs[me]).mood), status,
  };
}

/** Nach dem Auf-/Abstieg: alle offenen Versprechen auswerten, Bilanz-Nachricht. */
export function settleSeasonPromises(g: Game, snap: SPSnapshot | undefined, today: string): void {
  if (!snap) return;
  const rec = spRecord(g, snap.season);
  if (!rec || rec.done) return;
  const newLevel = level(g);
  const up = newLevel < snap.level, down = newLevel > snap.level;
  const posTxt = `Platz ${snap.pos}.`;
  for (const p of rec.picks) {
    if (p.r) continue;
    const st = snap.status[p.id] ?? { s: 'open', text: '' };
    let kept: boolean; let note = st.text;
    switch (p.id) {
      case 'meister': kept = snap.pos === 1; note = posTxt; break;
      case 'pokal': kept = snap.cup; note = kept ? 'Pokalsieger!' : 'Der Pokal ging an einen anderen.'; break;
      case 'international': kept = snap.euro; note = kept ? 'Europapokalsieger!' : 'Der Titel ging an einen anderen.'; break;
      case 'aufstieg': kept = up; note = kept ? 'Aufgestiegen!' : `${posTxt} Kein Aufstieg.`; break;
      case 'klassenerhalt': kept = !down; note = kept ? `${posTxt} Klasse gehalten.` : 'Abgestiegen.'; break;
      case 'ziel': kept = snap.pos > 0 && snap.pos <= rec.base.expected; note = `${posTxt} Gefordert war Platz ${rec.base.expected}.`; break;
      case 'zielPlus': kept = snap.pos > 0 && snap.pos < rec.base.expected; note = `${posTxt} Gefordert war Platz ${rec.base.expected}.`; break;
      case 'europaNext': kept = snap.euroNext; note = kept ? 'Startplatz im Europapokal gesichert.' : 'Kein Startplatz im Europapokal.'; break;
      case 'stimmung': kept = snap.mood >= SP_LIMITS.mood; note = `Teamstimmung ${snap.mood}.`; break;
      default: kept = st.s === 'good' || st.s === 'kept'; break;
    }
    settle(g, rec, p, kept, note, today);
  }
  rec.done = true;
  const k = rec.picks.filter((p) => p.r === 'kept');
  const b = rec.picks.filter((p) => p.r === 'broken');
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Co-Trainer', subject: `Bilanz deiner Versprechen ${snap.season}: ${k.length} gehalten, ${b.length} gebrochen`,
    shortText: b.length ? 'Nicht alles, was du beim ersten Training gesagt hast, ist eingetreten.' : 'Du hast Wort gehalten.',
    bodyText: rec.picks.map((p) => `• ${SP_DEF[p.id].label} – ${p.r === 'kept' ? 'gehalten' : 'gebrochen'}${p.note ? ` (${p.note})` : ''}`).join('\n')
      + `\n\nGlaubwürdigkeit jetzt ${trustOf(g)}. Je höher sie ist, desto eher glauben dir Spieler beim nächsten ersten Training – und bei Transfers.`,
  }));
}

/** Katalog in Anzeige-Reihenfolge mit Grund, falls nicht wählbar. */
export function promiseOptions(g: Game, base = makeBase(g)) {
  return SEASON_PROMISES.map((d) => ({ def: d, why: unavailableWhy(g, d.id, base), realism: realismFn(base)(d.id) }));
}
