// =============================================================================
// MatchSim – Minute-für-Minute-Simulation eines Spiels.
// Dieselbe Klasse dient der Schnellsimulation (runToEnd) und dem Textmodus
// (step() je Minute + Eingriffe des Trainers). Ergebnisse werden in finish()
// identisch verbucht.
// =============================================================================
import { simulateSeatSales, type SeatSale } from '../seating';
import { attendanceRestriction } from '../../data/history';
import type { Club, InjurySeverity, Player, Position } from '../../types';
import { POSITION_GROUPS } from '../../types';
import { mirrorPosition, positionSuitability } from '../positions';
import { eraRules, seasonYearOf, type EraRules } from './era';
import { bench, emptyStats, fieldPlayers, initRefs, lineupChanged, onPitch, refresh, tacticsOf, type TeamState } from './state';
import { makeMPlayer, matchBase, rating, resolveLineup } from './team';
import { openPlayFoul, maybeInjury, shootoutKick } from './actions';
import { aerial, attack } from './attack';
import { aerialSkill, countDuel, dayForm, dribbleSkill, duelP, duelSkill, refreshSkills, tackleSkill } from './skills';
import type { MPlayer, Mentality, ShoutId, Side, SimEvent, SimEventKind, TeamTalk } from './types';
import { applyWarmBonus, assistantCoach, drainWarmUps } from './sideline';
import { other } from './types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wetter eines Spieltags fest aus Datum und Heimverein (Vorschau, Kartenverkauf). */
export function fixedWeather(date: string, homeId: string): Weather {
  const key = `wx:${date}:${homeId}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return rollWeather(date, mulberry32(h >>> 0));
}

export type Phase = 'pre' | 'play' | 'halftime' | 'et_break' | 'et_half' | 'shootout' | 'done';
export type Weather = 'sonnig' | 'bewoelkt' | 'regen' | 'schnee' | 'hitze' | 'wind' | 'nebel';

export interface SimOptions {
  seed?: number;
  date?: string;
  year: number;
  knockout?: boolean;
  /** Seiten, die der Mensch im Textmodus selbst coacht (keine KI-Wechsel). */
  humanSides?: Side[];
  /** Vereine, deren gespeicherte Aufstellung gilt (sonst KI-Aufstellung). */
  humanClubIds?: string[];
  /** Live-Modus (Textmodus): auch ruhige Minuten als Ereignis melden. */
  live?: boolean;
  /** Wettbewerb (Europapokal: ab 1998 nur Sitzplätze). */
  competition?: 'Liga' | 'Pokal' | 'Europapokal';
  /** K.-o.-Regel im Detail (Rückspiel mit Gesamtstand, Wiederholungsspiel statt Elfmeter). */
  ko?: KoRule;
  /** Bedeutung des Spiels 0–1 (z. B. Titel-/Abstiegsentscheidung), zusätzlich zu Derby/Pokal/Europapokal. */
  stakes?: number;
  /** Wetter vorgeben (Vorschau „Nächstes Spiel“, game/prematch.ts); sonst ausgewürfelt. */
  weather?: Weather;
}

/**
 * K.-o.-Regel eines Spiels. Ohne Angabe gilt bei `knockout`: Verlängerung, dann Elfmeter.
 *   prev        Rückspiel: Tore [dieses Heimteams, dieses Gastteams] im Hinspiel
 *   awayGoals   Auswärtstorregel bei Gleichstand (auch in der Verlängerung)
 *   extraTime   Verlängerung bei Gleichstand (Standard true)
 *   shootout    Elfmeterschießen nach der Verlängerung (false = Wiederholungsspiel)
 */
export interface KoRule { prev?: [number, number]; awayGoals?: boolean; extraTime?: boolean; shootout?: boolean }

const PERIOD_END = [0, 45, 90, 105, 120];
/** Hintergrund-Zweikämpfe je Minute (dazu kommen die Duelle der Angriffe). */
const BG_DUELS = 1;
/** Angriffe ins letzte Drittel je Minute und Team (Grundwert). */
const ATTACK_PACE = 0.42;
const bgRole = (m: MPlayer) => (m.group === 'MID' ? 1.4 : m.group === 'ATT' ? 1 : 0.9);
/** Schnelle Auswahl nach Rolle für Hintergrund-Zweikämpfe (ohne Zwischenarrays). */
function bgPick(ms: MPlayer[], r: number): MPlayer {
  let sum = 0;
  for (let i = 0; i < ms.length; i++) sum += bgRole(ms[i]);
  let x = r * sum;
  for (let i = 0; i < ms.length; i++) { x -= bgRole(ms[i]); if (x <= 0) return ms[i]; }
  return ms[ms.length - 1];
}

export class MatchSim {
  readonly home: TeamState;
  readonly away: TeamState;
  readonly rng: () => number;
  readonly era: EraRules;
  readonly year: number;
  readonly date?: string;
  readonly knockout: boolean;
  readonly ko?: KoRule;
  readonly derby: boolean;
  readonly weather: Weather;
  readonly live: boolean;
  readonly attendance: number;
  /** Verkauf je Platzkategorie (für die Buchung, nicht im Spielstand). */
  readonly seatSale: SeatSale;
  minute = 0;
  stoppage = 0;
  period: 1 | 2 | 3 | 4 | 5 = 1;
  phase: Phase = 'pre';
  readonly added = [0, 0, 0, 0, 0];
  readonly events: SimEvent[] = [];
  readonly momentum: number[] = [];
  mom = 0;
  /** Bedrohung der Minute (für Druckphasen). */
  pulse = 0;
  halftimeScore: [number, number] = [0, 0];
  readonly injuries = new Map<string, InjurySeverity>();
  shoot = { home: 0, away: 0, kicksH: 0, kicksA: 0, next: 'home' as Side, done: false };
  private seq = 0;
  private incidents = 0;

  constructor(homeClub: Club, awayClub: Club, readonly players: Record<string, Player>, opts: SimOptions) {
    const seed = opts.seed ?? Math.floor(Math.random() * 0xffffffff);
    this.rng = mulberry32(seed);
    this.year = opts.year;
    this.date = opts.date;
    // Regeln gelten je Saison (Videobeweis ab 2017/18, fünf Wechsel ab 2020/21 …), nicht ab Januar.
    this.era = eraRules(opts.date ? seasonYearOf(opts.date) : opts.year);
    this.knockout = !!opts.knockout || !!opts.ko;
    this.ko = opts.ko;
    this.live = !!opts.live;
    this.derby = !!homeClub.city && homeClub.city === awayClub.city;
    this.stakes = Math.min(1, (this.derby ? 0.5 : 0) + (this.knockout ? 0.5 : 0) + (opts.competition === 'Europapokal' ? 0.4 : 0) + (opts.stakes ?? 0));
    const rolled = rollWeather(opts.date, this.rng); // Zufallsfolge bleibt gleich, auch mit Vorgabe
    // Eigenes Stadion (Blöcke): Wetter fest aus Datum und Verein wie in der Vorschau (game/matchWeather.ts),
    // damit Kartenverkauf und Prognose dasselbe Wetter rechnen.
    this.weather = opts.weather ?? (homeClub.stadium.blocks?.length && opts.date ? fixedWeather(opts.date, homeClub.id) : rolled);
    const month = opts.date ? Number(opts.date.slice(5, 7)) : 9;
    // Zuschauer je Platzkategorie (engine/seating.ts): eigene Nachfrage für Steh, Sitz, Dach, Premium,
    // Business, Logen und Gästeblock; im Europapokal ab 1998/99 nur Sitzplätze.
    this.seatSale = simulateSeatSales(homeClub, awayClub, {
      year: opts.year, date: opts.date, away: awayClub, derby: this.derby, weather: this.weather, month,
      euro: opts.competition === 'Europapokal', cup: opts.competition === 'Pokal', restriction: attendanceRestriction(opts.date),
    }, this.rng);
    this.attendance = this.seatSale.attendance;
    const humanSides = new Set(opts.humanSides ?? []);
    const humanClubs = new Set(opts.humanClubIds ?? []);
    this.home = this.makeTeam('home', homeClub, humanSides.has('home'), humanClubs.has(homeClub.id));
    this.away = this.makeTeam('away', awayClub, humanSides.has('away'), humanClubs.has(awayClub.id));
  }

  private makeTeam(side: Side, club: Club, human: boolean, savedLineup: boolean): TeamState {
    const lu = resolveLineup(club, this.players, savedLineup, this.era.benchSize);
    const ps: MPlayer[] = lu.xi.map(({ p, pos }) => makeMPlayer(p, side, pos, true, 0));
    const map: Record<string, string> = {};
    for (const x of lu.xi) if (x.slot) map[x.slot] = x.p.id;
    for (const p of lu.bench) ps.push(makeMPlayer(p, side, p.naturalPosition, false, 0));
    // Tagesleistung je Spieler (Konstanz): streut um 1, ohne den Schnitt zu verschieben.
    for (const m of ps) m.day = dayForm(m, this.rng);
    refreshSkills();
    const t = club.tactics;
    const xiIds = new Set(lu.xi.map((x) => x.p.id));
    const pick = (id: string | null | undefined) => (id && xiIds.has(id) ? id : null);
    const team: TeamState = {
      side, club, human, players: ps, formation: lu.formation,
      refs: { attack: 1, control: 1, defense: 1 }, units: null as never, mods: null as never, plan: null as never, year: this.era.year,
      goals: 0, stats: emptyStats(), mentality: 0, subsUsed: 0,
      shout: null, shoutUntil: 0, shoutPower: 0, shoutReadyAt: 0, shoutHistory: [], talk: 1,
      penaltyTakerId: pick(t?.penaltyTakerId), freeKickTakerId: pick(t?.freeKickTakerId),
      cornerTakerId: pick(t?.cornerTakerId), captainId: pick(t?.captainId), dirty: true, pitch: null, field: null,
      layout: lu.slots ? { formation: lu.formation, slots: lu.slots, map } : undefined,
      coach: human ? { autoSubs: false } : undefined,
    };
    initRefs(team);
    refresh(team, 0);
    return team;
  }

  team(s: Side): TeamState { return s === 'home' ? this.home : this.away; }
  score(): [number, number] { return [this.home.goals, this.away.goals]; }
  get finished(): boolean { return this.phase === 'done'; }

  emit(kind: SimEventKind, data: Partial<SimEvent> = {}): SimEvent {
    const ev: SimEvent = {
      seq: ++this.seq, minute: this.minute, period: this.period, kind, score: this.score(), ...data,
    };
    if (this.stoppage) ev.stoppage = this.stoppage;
    this.events.push(ev);
    return ev;
  }

  /** Grundbedeutung des Spiels (Derby, K.-o.-Spiel, Europapokal, Vorgabe des Aufrufers). */
  readonly stakes: number;

  /** Druck in diesem Moment (0–1): Bedeutung + knappe Schlussphase. Wirkt über die Nervenstärke (skills.ts nerveF). */
  pressureNow(): number {
    let p = this.stakes;
    if (this.minute >= 75 && Math.abs(this.effDiff('home')) <= 1) p += 0.5;
    if (this.period >= 3) p += 0.3;
    return p > 1 ? 1 : p;
  }

  /** Ereignis nur für Kommentar/Analyse (Ballverluste): ohne Textmodus nicht gespeichert – spart Zeit in Sim-Ligen. */
  note(kind: SimEventKind, data: Partial<SimEvent> = {}): void {
    if (this.live || this.trace) this.emit(kind, data);
  }
  /** Auch ohne Textmodus alle Ereignisse aufzeichnen (Benchmarks). */
  trace = false;

  /** Ereignisse, die die Nachspielzeit verlängern. */
  incident(weight = 1): void { this.incidents += weight; }

  // ---------------------------------------------------------------------------
  // Ablauf
  // ---------------------------------------------------------------------------

  /** Simuliert die nächste Minute (bzw. den nächsten Abschnitt) und liefert die neuen Ereignisse. */
  step(): SimEvent[] {
    const from = this.events.length;
    this.tick();
    return this.events.slice(from);
  }

  private tick(): void {
    switch (this.phase) {
      case 'pre':
        this.phase = 'play';
        this.emit('kickoff', { side: 'home' });
        break;
      case 'halftime':
        this.period = 2; this.minute = 45; this.stoppage = 0; this.phase = 'play';
        this.home.dirty = this.away.dirty = true;
        this.emit('second_half', { side: 'away' });
        break;
      case 'et_break':
        this.period = 3; this.minute = 90; this.stoppage = 0; this.phase = 'play';
        this.emit('et_start');
        break;
      case 'et_half':
        this.period = 4; this.minute = 105; this.stoppage = 0; this.phase = 'play';
        this.emit('et_second');
        break;
      case 'shootout':
        shootoutKick(this);
        break;
      case 'play':
        if (this.advanceClock()) this.playMinute();
        else this.endPeriod();
        break;
      default:
        break;
    }
  }

  /** Spielt bis zum Ende durch (Schnellsimulation / Überspringen). */
  runToEnd(): void {
    let guard = 0;
    while (this.phase !== 'done' && guard++ < 600) this.tick();
  }

  /** Spielt bis zur nächsten Pause (Halbzeit, Verlängerung, Ende). */
  runToBreak(): SimEvent[] {
    const from = this.events.length;
    let guard = 0;
    do { this.tick(); } while (this.phase === 'play' && guard++ < 300);
    return this.events.slice(from);
  }

  private advanceClock(): boolean {
    const end = PERIOD_END[this.period];
    if (this.minute < end) { this.minute++; return true; }
    if (this.stoppage === 0 && this.added[this.period] === 0) {
      this.added[this.period] = this.computeAdded();
      if (this.added[this.period] > 0) this.emit('stoppage', { value: this.added[this.period] });
    }
    if (this.stoppage < this.added[this.period]) { this.stoppage++; return true; }
    return false;
  }

  private computeAdded(): number {
    const p = this.period;
    const base = p === 1 ? 1 : p === 2 ? 2.5 : 0.5;
    const extra = this.incidents * 0.35 + (this.era.var && p <= 2 ? 0.8 : 0) + (this.year < 1990 ? -0.6 : 0);
    this.incidents = 0;
    const v = Math.round(base + extra + (this.rng() - 0.5) * 1.6);
    return Math.max(p >= 3 ? 0 : 1, Math.min(p === 2 ? 9 : 5, v));
  }

  private endPeriod(): void {
    this.stoppage = 0;
    const [h, a] = this.score();
    if (this.period === 1) {
      this.halftimeScore = [h, a];
      this.phase = 'halftime';
      this.minute = 45;
      this.emit('halftime');
      for (const t of [this.home, this.away]) for (const m of onPitch(t)) m.energy = Math.min(100, m.energy + 6);
      return;
    }
    if (this.period === 2 || this.period === 4) {
      const more = this.period === 2 ? this.ko?.extraTime !== false : this.ko?.shootout !== false;
      if (this.knockout && more && this.koLevel()) {
        if (this.period === 2) {
          this.phase = 'et_break'; this.minute = 90;
          this.emit('fulltime', { detail: 'et' });
          for (const t of [this.home, this.away]) for (const m of onPitch(t)) m.energy = Math.min(100, m.energy + 3);
        } else {
          this.phase = 'shootout'; this.minute = 120; this.period = 5;
          this.emit('shootout_start');
        }
        return;
      }
      this.minute = this.period === 2 ? 90 : 120;
      if (this.period === 4) this.emit('et_end');
      this.phase = 'done';
      this.emit('fulltime');
      return;
    }
    if (this.period === 3) {
      this.phase = 'et_half'; this.minute = 105;
      this.emit('et_half');
    }
  }

  /** Vorsprung aus Sicht einer Seite – im Rückspiel nach Gesamtstand (Auswärtstore ±0,4). */
  effDiff(side: Side): number {
    const [h, a] = this.score();
    let d = h - a;
    const r = this.ko;
    if (r?.prev) {
      d += r.prev[0] - r.prev[1];
      if (d === 0 && r.awayGoals && r.prev[0] !== a) d = r.prev[0] > a ? 0.4 : -0.4;
    }
    return side === 'home' ? d : -d;
  }

  /** Steht die Begegnung (inkl. Hinspiel und Auswärtstoren) noch unentschieden? */
  koLevel(): boolean {
    const [h, a] = this.score();
    const r = this.ko;
    if (!r?.prev) return h === a;
    const aggH = h + r.prev[0], aggA = a + r.prev[1];
    if (aggH !== aggA) return false;
    // Auswärtstore: dieses Heimteam traf im Hinspiel auswärts prev[0], das Gastteam heute a.
    return !r.awayGoals || r.prev[0] === a;
  }

  private playMinute(): void {
    const H = this.home, A = this.away;
    const nEvents = this.events.length;
    this.pulse = 0;
    if (H.dirty || this.minute % 10 === 0) refresh(H, this.minute);
    if (A.dirty || this.minute % 10 === 0) refresh(A, this.minute);
    if (this.minute % 5 === 0) { this.drain(H); this.drain(A); }
    for (const t of [H, A]) if (t.shout && this.minute === t.shoutUntil) { t.shout = null; t.dirty = true; }

    // --- Ballbesitz aus der Spielkontrolle ---
    const lead = (t: TeamState) => this.effDiff(t.side);
    const homeCtrl = 1 + (this.era.homeAdvantage - 1) * 0.35;
    const ctrl = (t: TeamState) => t.units.control * t.mods.ctrl * (t.side === 'home' ? homeCtrl : 1) * (1 - 0.025 * Math.max(-2, Math.min(2, lead(t))))
      * (this.weather === 'schnee' ? 0.97 : 1);
    const ch = ctrl(H) ** 1.6, ca = ctrl(A) ** 1.6;
    let ph = ch / (ch + ca) + (this.rng() - 0.5) * 0.12;
    ph = Math.max(0.2, Math.min(0.8, ph));
    H.stats.possession += ph; A.stats.possession += 1 - ph;
    this.passStats(H, ph); this.passStats(A, 1 - ph);
    this.duels(H, A, ph);

    // --- Angriffe ---
    const pace = ATTACK_PACE * (this.year < 1990 ? 1.04 : this.year < 2005 ? 0.98 : 1);
    const late = this.minute > 75 ? 1.06 : 1;
    const rateH = pace * H.mods.rate * (0.75 + 0.5 * ph) * late;
    const rateA = pace * A.mods.rate * (0.75 + 0.5 * (1 - ph)) * late;
    const first: Side = this.rng() < 0.5 ? 'home' : 'away';
    for (const s of [first, other(first)]) {
      const t = this.team(s);
      if (this.rng() < (s === 'home' ? rateH : rateA)) attack(this, t, this.team(other(s)));
    }

    // --- Fouls im Spielaufbau, Verletzungen ---
    openPlayFoul(this, H, A); openPlayFoul(this, A, H);
    maybeInjury(this, H, A); maybeInjury(this, A, H);

    // --- KI-Trainer ---
    if (!H.human) this.aiManager(H); else if (H.coach?.autoSubs) assistantCoach(this, H);
    if (!A.human) this.aiManager(A); else if (A.coach?.autoSubs) assistantCoach(this, A);

    // --- Druckphasen ---
    this.mom = this.mom * 0.8 + Math.max(-1, Math.min(1, this.pulse)) * 0.2;
    if (this.stoppage === 0 && this.period <= 4) this.momentum[this.minute - 1] = Math.round(this.mom * 100) / 100;

    if (this.live && this.events.length === nEvents) {
      const side: Side = this.rng() < ph ? 'home' : 'away';
      const r = this.rng();
      this.emit('flow', { side, zone: r < 0.3 ? 'def' : r < 0.78 ? 'mid' : 'att' });
    }
  }

  private drain(t: TeamState): void {
    if (t.human) drainWarmUps(this, t);
    const heat = this.weather === 'hitze' ? 1.18 : 1;
    const et = this.period >= 3 ? 1.15 : 1;
    for (const m of t.players) {
      if (!m.onPitch) continue;
      const st = m.p.attributes.stamina ?? 60;
      const base = m.group === 'GK' ? 0.08 : 0.42 * (1.45 - st / 100);
      m.energy = Math.max(15, m.energy - 5 * base * t.mods.drain * heat * et);
    }
  }

  private passStats(t: TeamState, share: number): void {
    const rate = this.year < 1985 ? 5.6 : this.year < 1995 ? 6.4 : this.year < 2005 ? 7.6 : this.year < 2015 ? 9 : 9.8;
    const n = rate * share * (0.85 + this.rng() * 0.3);
    // Passquote: Epoche (weniger Technik, schlechtere Plätze früher), Passspiel des Teams,
    // eigene Taktik (kurz/Tempo) und das Pressing des Gegners.
    const o = this.team(other(t.side));
    const eraAcc = this.year < 1985 ? 0.69 : this.year < 1995 ? 0.72 : this.year < 2005 ? 0.75 : this.year < 2015 ? 0.78 : 0.8;
    const accBase = eraAcc + (t.units.passing - 62) / 100 * 0.45 + t.plan.passBias * 0.12 - o.plan.pressBias * 0.08;
    const acc = Math.max(0.5, Math.min(0.93, accBase + (share - 0.5) * 0.12 - (this.weather === 'regen' || this.weather === 'schnee' ? 0.025 : 0)));
    t.stats.passes += n; t.stats.passesOk += n * acc;
  }

  /**
   * Zweikämpfe abseits der Torszenen (Mittelfeld, zweite Bälle, Luftduelle): je Minute ein bis drei,
   * jeweils zwischen zwei konkreten Spielern. Zählt für Spieler- und Teamstatistik.
   */
  private duels(H: TeamState, A: TeamState, ph: number): void {
    const n = BG_DUELS + (this.rng() < 0.5 ? 1 : 0);
    const fH = fieldPlayers(H), fA = fieldPlayers(A);
    if (!fH.length || !fA.length) return;
    const airP = (this.year < 1990 ? 0.32 : 0.27);
    for (let i = 0; i < n; i++) {
      const homeBall = this.rng() < ph;
      const T = homeBall ? H : A, O = homeBall ? A : H;
      const carrier = bgPick(homeBall ? fH : fA, this.rng());
      const chal = bgPick(homeBall ? fA : fH, this.rng());
      const air = this.rng() < airP * (tacticsOf(T)?.buildup === 'long' ? 1.3 : 1);
      const bias = (T.mods.duel - O.mods.duel) * 3 + (T.plan.tackleBias - O.plan.tackleBias) * 0.5;
      const p = air ? duelP(aerialSkill(carrier), aerialSkill(chal), bias) : duelP(duelSkill(carrier) * 0.5 + dribbleSkill(carrier) * 0.5, tackleSkill(chal), bias);
      const w = this.rng() < p;
      if (air) aerial(T, O, w ? carrier : chal, w ? chal : carrier, w);
      else countDuel(w ? carrier : chal, w ? chal : carrier, w ? T.stats : O.stats, w ? O.stats : T.stats);
      if (!w && !air) chal.tackles++;
    }
  }

  // ---------------------------------------------------------------------------
  // Auswechslungen
  // ---------------------------------------------------------------------------

  subsLeft(t: TeamState): number { return this.era.maxSubs - t.subsUsed; }

  /** Wechsel; der Neue übernimmt die Position des Ausgewechselten. */
  substitute(side: Side, outId: string, inId: string, reason?: string): boolean {
    const t = this.team(side);
    if (this.subsLeft(t) <= 0 || this.phase === 'done' || this.phase === 'shootout') return false;
    const out = t.players.find((m) => m.id === outId && m.onPitch);
    const inn = bench(t).find((m) => m.id === inId);
    if (!out || !inn) return false;
    out.onPitch = false;
    out.minuteOut = this.minute;
    inn.onPitch = true;
    inn.minuteIn = this.minute;
    inn.pos = out.pos;
    inn.group = out.group;
    inn.base = matchBase(inn.p, out.pos);
    applyWarmBonus(this, inn);
    if (t.layout) for (const k in t.layout.map) if (t.layout.map[k] === outId) t.layout.map[k] = inId;
    t.subsUsed++;
    lineupChanged(t);
    if (t.captainId === out.id) t.captainId = null;
    if (t.penaltyTakerId === out.id) t.penaltyTakerId = null;
    if (t.freeKickTakerId === out.id) t.freeKickTakerId = null;
    if (t.cornerTakerId === out.id) t.cornerTakerId = null;
    this.incident(0.5);
    this.emit('sub', { side, player: inId, other: outId, detail: reason });
    return true;
  }

  /** Bester Ersatz für eine Position (Eignung × Tagesform). */
  bestReplacement(t: TeamState, out: MPlayer): MPlayer | undefined {
    let best: MPlayer | undefined; let bv = -1;
    for (const b of bench(t)) {
      if ((out.group === 'GK') !== (b.p.naturalPosition === 'TW')) continue;
      const v = subValue(b.p, out.pos) * b.cond;
      if (v > bv) { bv = v; best = b; }
    }
    return best;
  }

  setMentality(side: Side, m: Mentality): void {
    const t = this.team(side);
    if (t.mentality === m || this.phase === 'done') return;
    t.mentality = m; t.dirty = true;
    this.emit('mentality', { side, value: m });
  }

  /** Zuruf; liefert die verbleibende Abklingzeit, wenn (noch) nicht möglich. */
  shout(side: Side, id: ShoutId): boolean {
    const t = this.team(side);
    if (this.phase !== 'play' && this.phase !== 'halftime') return false;
    if (this.minute < t.shoutReadyAt || (t.shout && this.minute < t.shoutUntil)) return false;
    const repeats = t.shoutHistory.slice(-3).filter((s) => s === id).length;
    const cap = t.players.find((m) => m.id === t.captainId && m.onPitch);
    const lead = cap ? cap.p.attributes.leadership : 55;
    t.shoutPower = Math.max(0.2, (1 - repeats * 0.3) * (0.8 + lead / 250) * (0.85 + this.rng() * 0.3));
    t.shout = id;
    t.shoutUntil = this.minute + 10;
    t.shoutReadyAt = this.minute + 16;
    t.shoutHistory.push(id);
    t.dirty = true;
    this.emit('shout', { side, value: id, detail: repeats >= 2 ? 'stumpf' : t.shoutPower > 1 ? 'zuendet' : undefined });
    return true;
  }

  shoutCooldown(side: Side): number {
    const t = this.team(side);
    return Math.max(0, t.shoutReadyAt - this.minute);
  }

  /** Halbzeitansprache (wirkt in der zweiten Hälfte). */
  teamTalk(side: Side, talk: TeamTalk): void {
    const t = this.team(side);
    const [h, a] = this.score();
    const diff = side === 'home' ? h - a : a - h;
    let f = 1;
    const r = (this.rng() - 0.5) * 0.02;
    if (talk === 'loben') f = diff > 0 ? 1.02 : diff === 0 ? 1.01 : 0.985;
    if (talk === 'analyse') f = 1.012;
    if (talk === 'predigt') f = diff < 0 ? 1.035 : diff === 0 ? 1.01 : 0.98;
    t.talk = f + r;
    if (talk === 'predigt') for (const m of t.players) m.energy = Math.min(100, m.energy + 2);
    t.dirty = true;
    this.emit('talk', { side, value: talk, detail: t.talk >= 1.02 ? 'gut' : t.talk < 0.995 ? 'schlecht' : 'neutral' });
  }

  // ---------------------------------------------------------------------------
  // KI an der Seitenlinie
  // ---------------------------------------------------------------------------

  private aiManager(t: TeamState): void {
    const min = this.minute;
    if (this.stoppage || min % 3 !== 0 || min < 55) return;
    const diff = Math.round(this.effDiff(t.side));
    // Ausrichtung
    let want: Mentality = 0;
    if (this.period <= 2) {
      if (diff === -1 && min >= 70) want = min >= 82 ? 2 : 1;
      else if (diff <= -2 && min >= 60) want = 1;
      else if (diff === 1 && min >= 80) want = -1;
      else if (diff >= 2 && min >= 75) want = 0;
    } else if (diff < 0) want = 1;
    if (want !== t.mentality) this.setMentality(t.side, want);

    // Wechsel
    if (this.subsLeft(t) <= 0) return;
    const window = this.era.maxSubs >= 5 ? 55 : 58;
    if (min < window) return;
    const keepOne = this.subsLeft(t) === 1 && min < 78;
    if (keepOne) return;
    const cands = onPitch(t).filter((m) => m.group !== 'GK')
      .map((m) => ({ m, need: (84 - m.energy) / 10 + (m.impact < -0.5 ? 1.2 : 0) + (m.yellow && m.p.attributes.aggression > 65 ? 0.8 : 0)
        + (diff < 0 && min > 65 && m.group === 'DEF' ? 0.6 : 0) + (min - 55) / 12 }))
      .sort((x, y) => y.need - x.need);
    let budget = this.era.maxSubs >= 5 && min >= 60 ? 2 : 1;
    for (const c of cands.slice(0, 4)) {
      if (budget <= 0 || this.subsLeft(t) <= 0 || c.need < 0.4) break;
      const rep = this.bestReplacement(t, c.m);
      if (!rep) continue;
      const newR = subValue(rep.p, c.m.pos) * rep.cond;
      if (newR < rating(c.m) * 0.72) continue;
      if (this.substitute(t.side, c.m.id, rep.id, c.m.energy < 60 ? 'muede' : 'taktik')) budget--;
    }
  }
}

/**
 * Eignung eines Einwechselspielers: die Position selbst oder (leicht abgewertet) ihr Spiegelbild –
 * ein Rechtsverteidiger kann auch links aushelfen. Seitengebundene Positionen sollen Wechsel nicht blockieren.
 */
function subValue(p: Player, pos: Position): number {
  const own = positionSuitability(p, pos);
  const mir = mirrorPosition(pos);
  let v = mir === pos ? own : Math.max(own, positionSuitability(p, mir) * 0.95);
  // Spieler derselben Gruppe (z. B. ZM für DM, LA für RM) als Notlösung zulassen
  if (POSITION_GROUPS[p.naturalPosition] === POSITION_GROUPS[pos]) v = Math.max(v, positionSuitability(p, p.naturalPosition) * 0.86);
  return v;
}

/** Wetter nach Monat (auch für die Vorhersage in game/prematch.ts). */
export function rollWeather(date: string | undefined, rng: () => number): Weather {
  const month = date ? Number(date.slice(5, 7)) : 9;
  const r = rng();
  if (month === 12 || month <= 2) return r < 0.14 ? 'schnee' : r < 0.42 ? 'regen' : r < 0.52 ? 'nebel' : r < 0.85 ? 'bewoelkt' : 'sonnig';
  if (month >= 6 && month <= 8) return r < 0.22 ? 'hitze' : r < 0.32 ? 'regen' : r < 0.75 ? 'sonnig' : 'bewoelkt';
  return r < 0.3 ? 'regen' : r < 0.4 ? 'wind' : r < 0.7 ? 'bewoelkt' : 'sonnig';
}
