// =============================================================================
// Erzähler des Textmodus: macht aus den Ereignissen einer Spielminute eine
// Folge von Zeilen (Aufbau → Abschluss → Spannungsmoment → Auflösung → Echo).
// =============================================================================
import type { MatchSim } from '../../engine/match/sim';
import { onPitch } from '../../engine/match/state';
import type { Side, SimEvent } from '../../engine/match/types';
import { MENTALITY_LABEL, other, type Mentality } from '../../engine/match/types';
import type { Club } from '../../types';
import { AMBIENCE } from './ambience';
import { CHANCES } from './chances';
import { Speaker, type TextCtx } from './grammar';
import { LEXICON } from './lexicon';
import { SITUATIONS } from './situations';

export type LineKind = 'normal' | 'chance' | 'goal' | 'card' | 'red' | 'phase' | 'you' | 'color' | 'save';

export interface Line {
  id: number;
  minute: string;
  text: string;
  kind: LineKind;
  side?: Side;
  /** Spannungsmoment: unleserlicher Text, der sich zu `word` auflöst. */
  suspense?: { word: string; good: boolean | null };
  /** Zusätzliche Wartezeit nach der Zeile (Faktor). */
  hold?: number;
  /** Diese Zeile verändert den Spielstand (Anzeige erst nach Auflösung). */
  score?: [number, number];
}

function colorWord(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex ?? '');
  if (!m) return 'Weiß';
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d < 0.12) return l > 0.75 ? 'Weiß' : l < 0.25 ? 'Schwarz' : 'Grau';
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  if (h < 20 || h >= 330) return 'Rot';
  if (h < 45) return 'Orange';
  if (h < 70) return 'Gelb';
  if (h < 170) return 'Grün';
  if (h < 260) return 'Blau';
  return 'Lila';
}

/** „rot-weiße“, „schwarz-gelbe“ … aus den Vereinsfarben. */
function colorAdjective(c: Club): string | null {
  const a = colorWord(c.colors?.primary), b = colorWord(c.colors?.secondary);
  const ok = ['Rot', 'Weiß', 'Schwarz', 'Gelb', 'Grün', 'Blau'];
  if (!ok.includes(a)) return null;
  if (a === b || !ok.includes(b)) return `${a.toLowerCase()}e`;
  return `${a.toLowerCase()}-${b.toLowerCase()}e`;
}

const SUSPENSE_WORD: Record<string, string[]> = {
  goal: ['TOR!'], saved: ['GEHALTEN!', 'PARIERT!'], wide: ['DANEBEN!', 'VORBEI!'], over: ['DRÜBER!'],
  post: ['PFOSTEN!', 'LATTE!'], blocked: ['GEBLOCKT!'],
};

export interface NarratorOpts { mySide: Side | null; suspense: boolean }

export class Narrator {
  private sp: Speaker;
  private n = 0;
  private lastStat = -20;
  private labelMem: Record<Side, number> = { home: 0, away: 0 };

  constructor(private sim: MatchSim, private opts: NarratorOpts) {
    this.sp = new Speaker({ ...LEXICON, ...CHANCES, ...SITUATIONS, ...AMBIENCE }, mulberry(Date.now() & 0xffffffff));
  }

  private rnd(): number { return Math.random(); }

  private dupes: Set<string> | null = null;

  /** Nachname; bei Namensgleichheit auf dem Platz mit Initiale („M. Krüger“). */
  private name(id?: string): string {
    if (!id) return '';
    const p = this.sim.players[id];
    if (!p) return '';
    if (!this.dupes) {
      const seen = new Map<string, number>();
      for (const t of [this.sim.home, this.sim.away]) for (const m of t.players) seen.set(m.p.lastName, (seen.get(m.p.lastName) ?? 0) + 1);
      this.dupes = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
    }
    return this.dupes.has(p.lastName) ? `${p.firstName?.[0] ?? ''}. ${p.lastName}` : p.lastName;
  }

  /** Vereinsname (in jedem Fall grammatisch passend). */
  team(side: Side): string { return this.sim.team(side).club.name; }

  /** Abwechselnde Bezeichnung als Satzsubjekt (Nominativ, Singular). */
  subject(side: Side): string {
    const c = this.sim.team(side).club;
    const opts = [c.name, c.name, c.name];
    const adj = colorAdjective(c);
    if (adj) opts.push(`die ${adj} Elf`);
    opts.push(side === 'home' ? 'der Gastgeber' : 'der Gast');
    if (c.city && !c.name.includes(c.city)) opts.push(`die Mannschaft aus ${c.city}`);
    const i = (this.labelMem[side] + 1 + Math.floor(this.rnd() * (opts.length - 1))) % opts.length;
    this.labelMem[side] = i;
    return opts[i];
  }

  private keeperName(side: Side): string {
    const k = onPitch(this.sim.team(side)).find((m) => m.group === 'GK');
    return k ? this.name(k.id) : 'der Torwart';
  }

  private ctx(ev: SimEvent | null, extra: Record<string, string | number | undefined> = {}, flags: string[] = []): TextCtx {
    const sim = this.sim;
    const f = new Set<string>(flags);
    f.add(sim.weather);
    if (sim.derby) f.add('derby');
    if (sim.knockout) f.add('pokal');
    if (sim.attendance >= (sim.home.club.stadium?.capacity ?? 1e9) * 0.97) f.add('ausverkauft');
    const side = ev?.side;
    if (side && this.opts.mySide) f.add(side === this.opts.mySide ? 'eigen' : 'gegner');
    const [h, a] = ev?.score ?? sim.score();
    return {
      year: sim.year, flags: f,
      slots: {
        score: `${h}:${a}`, home: sim.home.club.name, away: sim.away.club.name,
        stadium: sim.home.club.stadium?.name ?? 'Stadion', crowd: sim.attendance.toLocaleString('de-DE'),
        t: side ? this.team(side) : '', o: side ? this.team(other(side)) : '', tn: side ? this.subject(side) : '',
        p: this.name(ev?.player), a: this.name(ev?.assist), d: this.name(ev?.other),
        k: side ? this.keeperName(other(side)) : '', dist: 17 + Math.floor(this.rnd() * 14),
        ...extra,
      },
    };
  }

  private line(ev: SimEvent | null, text: string, kind: LineKind, more: Partial<Line> = {}): Line | null {
    if (!text) return null;
    const minute = !ev ? '' : ev.kind === 'halftime' ? 'HZ' : ev.kind === 'fulltime' && ev.detail !== 'et' ? 'Ende'
      : ev.stoppage ? `${ev.minute}+${ev.stoppage}'` : `${ev.minute}'`;
    return { id: ++this.n, minute, text, kind, side: ev?.side, ...more };
  }

  /** Alle Ereignisse einer Minute erzählen. */
  narrate(evs: SimEvent[]): Line[] {
    const out: (Line | null)[] = [];
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      const next = evs[i + 1];
      switch (ev.kind) {
        case 'kickoff': {
          const c = this.ctx(ev);
          out.push(this.line(ev, this.sp.say('kickoff', c), 'phase'));
          out.push(this.line(ev, this.sp.say('kickoff_atmo', c), 'color'));
          if (this.rnd() < 0.5) out.push(this.line(ev, this.sp.say('kickoff_atmo', c), 'color'));
          break;
        }
        case 'halftime': out.push(this.line(ev, this.sp.say('halftime', this.ctx(ev)), 'phase', { hold: 1.5 })); break;
        case 'second_half': out.push(this.line(ev, this.sp.say('second_half', this.ctx(ev)), 'phase')); break;
        case 'fulltime': out.push(this.line(ev, this.sp.say(ev.detail === 'et' ? 'fulltime_et' : 'fulltime', this.ctx(ev)), 'phase', { hold: 1.5 })); break;
        case 'et_start': case 'et_half': case 'et_second': case 'et_end': case 'shootout_start':
          out.push(this.line(ev, this.sp.say(ev.kind, this.ctx(ev)), 'phase')); break;
        case 'stoppage': { const n = ev.value as number; out.push(this.line(ev, this.sp.say('stoppage', this.ctx(ev, { nmin: n === 1 ? 'Eine Minute' : `${n} Minuten` })), 'color')); break; }
        case 'flow': out.push(...this.flow(ev)); break;
        case 'attack_fail': if (this.rnd() < 0.7) out.push(this.line(ev, this.sp.say('fail', this.ctx(ev, { d: this.name(ev.other) })), 'normal')); break;
        case 'offside': out.push(this.line(ev, this.sp.say('offside', this.ctx(ev)), 'normal')); break;
        case 'corner': {
          if (next?.kind === 'chance' && next.build === 'ecke') break;
          const c = this.ctx(ev, { a: this.name(ev.player) || this.randomAttacker(ev.side!) });
          out.push(this.line(ev, this.sp.say('corner_plain', c), 'normal'));
          if (this.rnd() < 0.5) out.push(this.line(ev, this.sp.say('corner_cleared', c), 'normal'));
          break;
        }
        case 'foul': {
          const card = next?.kind === 'card' && next.player === ev.player ? next : null;
          const after = card ? evs[i + 2] : next;
          const pen = after?.kind === 'chance' && after.build === 'elfer';
          const fk = after?.kind === 'chance' && after.build === 'freistoss';
          const c = this.ctx(ev);
          if (pen) out.push(this.line(ev, this.sp.say('penalty_call', c), 'chance', { hold: 1.2 }));
          else if (fk || ev.zone === 'att') out.push(this.line(ev, this.sp.say('foul_danger', c), 'normal'));
          else if (card || this.rnd() < 0.4) out.push(this.line(ev, this.sp.say('foul', c), 'normal'));
          break;
        }
        case 'card': {
          const c = this.ctx(ev);
          const sym = ev.card === 'red' ? 'red' : ev.card === 'yellowRed' ? 'yellowRed' : 'yellow';
          out.push(this.line(ev, this.sp.say(sym, c), ev.card === 'yellow' ? 'card' : 'red'));
          if (ev.card !== 'yellow') out.push(this.line(ev, this.sp.say('red_after', c), 'normal'));
          break;
        }
        case 'injury': {
          const c = this.ctx(ev);
          out.push(this.line(ev, this.sp.say('injury', c), 'normal'));
          const m = this.sim.team(ev.side!).players.find((x) => x.id === ev.player);
          out.push(this.line(ev, this.sp.say(m?.onPitch ? 'injury_on' : 'injury_off', c), 'normal'));
          break;
        }
        case 'sub': {
          const mine = ev.side === this.opts.mySide;
          const c = this.ctx(ev);
          out.push(this.line(ev, this.sp.say('sub', c), mine ? 'you' : 'normal'));
          if (ev.detail && this.rnd() < 0.6) out.push(this.line(ev, this.sp.say(`sub_reason_${ev.detail}`, c), 'normal'));
          break;
        }
        case 'mentality': {
          const v = ev.value as Mentality;
          if (ev.side === this.opts.mySide) out.push(this.line(ev, `Neue Ausrichtung: ${MENTALITY_LABEL[v]}.`, 'you'));
          else out.push(this.line(ev, this.sp.say(v > 0 ? 'ment_up' : v < 0 ? 'ment_down' : 'ment_zero', this.ctx(ev)), 'normal'));
          break;
        }
        case 'shout': {
          const c = this.ctx(ev);
          out.push(this.line(ev, this.sp.say(`shout_${ev.value}`, c), 'you'));
          out.push(this.line(ev, this.sp.say(`shout_${ev.detail ?? 'normal'}`, c), 'normal'));
          break;
        }
        case 'talk': out.push(this.line(ev, this.sp.say(`talk_${ev.detail ?? 'neutral'}`, this.ctx(ev)), 'you')); break;
        case 'chance': out.push(...this.chance(ev, next)); break;
        case 'shootout_kick': out.push(...this.kick(ev)); break;
        case 'shootout_end': {
          const s = ev.shootout!;
          out.push(this.line(ev, this.sp.say('shootout_end', this.ctx(ev, { sh: s.home, sa: s.away })), 'goal', { hold: 1.5 }));
          break;
        }
        default: break;
      }
    }
    return out.filter((l): l is Line => !!l);
  }

  private flow(ev: SimEvent): (Line | null)[] {
    const r = this.rnd();
    const side = ev.side!;
    const t = this.sim.team(side), o = this.sim.team(other(side));
    const pick = (arr: { id: string }[]) => this.name(arr[Math.floor(this.rnd() * arr.length)]?.id);
    const pt = onPitch(t).filter((m) => m.group !== 'GK'), po = onPitch(o).filter((m) => m.group !== 'GK');
    const st = (x: typeof t) => x.stats;
    const possTot = st(this.sim.home).possession + st(this.sim.away).possession || 1;
    const c = this.ctx(ev, {
      p: pick(pt), d: pick(po), k_t: this.keeperName(side),
      poss: Math.round((st(t).possession / possTot) * 100), shots: st(t).shots,
      duels: Math.round((st(t).duelsWon / Math.max(1, st(t).duels)) * 100), passes: Math.round(st(t).passes),
      xg_h: st(this.sim.home).xg.toFixed(2), xg_a: st(this.sim.away).xg.toFixed(2),
      corners: `${st(this.sim.home).corners}:${st(this.sim.away).corners}`,
    });
    if (r < 0.004) return [this.line(ev, this.sp.say('anecdote', c), 'color')];
    if (r < 0.1 && ev.minute - this.lastStat > 12 && ev.minute > 10) {
      this.lastStat = ev.minute;
      return [this.line(ev, this.sp.say('stat_line', c), 'color')];
    }
    if (r < 0.22) return [this.line(ev, this.sp.say('color', c), 'color')];
    if (r < 0.62) return [this.line(ev, this.sp.say(`flow_${ev.zone ?? 'mid'}`, c), 'normal')];
    return [];
  }

  private chance(ev: SimEvent, next?: SimEvent): (Line | null)[] {
    const ch = ev.chance!;
    const side = ev.side!;
    const out: (Line | null)[] = [];
    const [h, a] = ev.score;
    const scored = ch.outcome === 'goal' && !ch.disallowed;
    const prev: [number, number] = scored ? (side === 'home' ? [h - 1, a] : [h, a - 1]) : [h, a];
    const flags: string[] = [];
    if (scored) {
      const mine = side === 'home' ? h : a, theirs = side === 'home' ? a : h;
      if (mine === theirs) flags.push('ausgleich');
      else if (mine === theirs + 1) flags.push('fuehrung');
      else if (mine > theirs + 1) flags.push('ausbau');
      else if (mine === theirs - 1) flags.push('anschluss');
      if (ev.minute >= 80) flags.push('spaet');
      if (ev.minute <= 8 && ev.period === 1) flags.push('frueh');
      const m = this.sim.team(side).players.find((x) => x.id === ev.player);
      if (m && !ch.ownGoal) { if (m.goals === 2) flags.push('doppel'); if (m.goals === 3) flags.push('dreier'); }
    }
    // Torwart aus Sicht der Angreifer; bei Eigentor ist {p} der Unglücksrabe.
    const c = this.ctx(ev, {
      k: this.name(ev.keeper) || this.keeperName(other(side)),
      d: this.name(ev.other) || this.randomDefender(other(side)),
      a: this.name(ev.assist) || this.randomAttacker(side, ev.player),
      score: `${h}:${a}`, xgp: Math.round(ch.xg * 100),
    }, flags);
    const build = ev.build ?? 'kurzpass';

    // Aufbau (bei Elfmeter kam der Pfiff schon mit dem Foul)
    if (ch.type !== 'penalty' && !ch.ownGoal) {
      const sym = `b_${build}`;
      const t = this.sp.say(sym, c) || this.sp.say('b_kurzpass', c);
      out.push(this.line(ev, t, ch.big ? 'chance' : 'normal'));
      if (ch.big && this.rnd() < 0.45) out.push(this.line(ev, this.sp.say('b_spannung', c), 'chance'));
    }
    // Abschluss
    if (ch.ownGoal) {
      out.push(this.line(ev, this.sp.say('b_flanke', this.ctx(ev, { a: this.randomAttacker(side) })), 'normal'));
    } else {
      const sym = ch.type === 'penalty' ? 's_penalty' : ch.type === 'freekick' ? 's_freekick' : ch.type === 'header' ? 's_header'
        : ch.type === 'long' ? 's_long' : ch.type === 'counter' ? 's_counter' : ch.type === 'solo' ? 's_solo' : ch.type === 'big' ? 's_big' : 's_normal';
      out.push(this.line(ev, this.sp.say(sym, c), ch.big ? 'chance' : 'normal', { score: prev }));
    }
    // Spannungsmoment
    const tense = this.opts.suspense && (ch.big || ch.type === 'penalty' || ch.type === 'freekick' || ch.xg >= 0.2);
    const mine = this.opts.mySide ? side === this.opts.mySide : null;
    let word = '';
    if (!ch.ownGoal) {
      const words = SUSPENSE_WORD[ch.outcome] ?? ['…'];
      word = words[Math.floor(this.rnd() * words.length)];
      if (tense) {
        const good = mine == null ? null : ch.outcome === 'goal' ? mine : !mine;
        out.push(this.line(ev, word, scored ? 'goal' : 'chance', { suspense: { word, good }, score: scored ? [h, a] : prev }));
      }
    }
    // Ausgang
    let osym: string;
    if (ch.outcome === 'goal') {
      osym = ch.ownGoal ? 'o_goal_own' : ch.type === 'penalty' ? 'o_goal_penalty' : ch.type === 'header' ? 'o_goal_header'
        : ch.type === 'long' ? 'o_goal_long' : ch.type === 'freekick' ? 'o_goal_freekick' : 'o_goal';
    } else if (ch.type === 'penalty') osym = ch.outcome === 'saved' ? 'o_saved_penalty' : 'o_missed_penalty';
    else if (ch.outcome === 'post') osym = 'o_post';
    else osym = `o_${ch.outcome}`;
    let otext = this.sp.say(osym, c);
    if (ch.outcome === 'post' && word) otext = otext.replace(word === 'LATTE!' ? /Pfosten!/ : /Latte!/, word === 'LATTE!' ? 'Latte!' : 'Pfosten!');
    out.push(this.line(ev, otext, scored ? 'goal' : ch.outcome === 'saved' ? 'save' : ch.big ? 'chance' : 'normal', { score: scored ? [h, a] : undefined, hold: scored ? 1.4 : ch.big ? 1.1 : 1 }));

    if (ch.disallowed) {
      const v = next?.kind === 'var' ? next : null;
      if (this.sim.era.var) {
        out.push(this.line(ev, this.sp.say('var_check', c), 'chance', { hold: 1.3 }));
        const s = this.opts.suspense ? { word: 'KEIN TOR!', good: mine == null ? null : !mine } : undefined;
        if (s) out.push(this.line(ev, 'KEIN TOR!', 'chance', { suspense: s }));
        out.push(this.line(ev, this.sp.say(v?.detail === 'foul' ? 'var_foul' : 'var_abseits', c), 'chance', { score: prev }));
      } else out.push(this.line(ev, this.sp.say('disallowed', c), 'chance', { score: prev }));
      return out;
    }
    if (scored) {
      out.push(this.line(ev, this.sp.say(side === 'home' ? 'after_goal_home' : 'after_goal_away', c), 'color'));
      if (this.rnd() < 0.7) out.push(this.line(ev, this.sp.say('after_goal_ctx', c), 'color'));
    } else if (ch.big && ch.outcome === 'saved' && this.rnd() < 0.45) out.push(this.line(ev, this.sp.say('after_save', c), 'color'));
    else if (ch.big && this.rnd() < 0.55) out.push(this.line(ev, this.sp.say('after_miss', c), 'color'));
    return out;
  }

  private kick(ev: SimEvent): (Line | null)[] {
    const s = ev.shootout!;
    const c = this.ctx(ev, { k: this.name(ev.keeper), sh: s.home, sa: s.away });
    const mine = this.opts.mySide ? ev.side === this.opts.mySide : null;
    const out: (Line | null)[] = [this.line(ev, this.sp.say('so_kick', c), 'chance', { minute: 'Elf.' } as Partial<Line>)];
    const word = s.scored ? 'TOR!' : s.saved ? 'GEHALTEN!' : 'VERSCHOSSEN!';
    if (this.opts.suspense) out.push(this.line(ev, word, s.scored ? 'goal' : 'chance', { suspense: { word, good: mine == null ? null : s.scored ? mine : !mine } }));
    out.push(this.line(ev, this.sp.say(s.scored ? 'so_goal' : s.saved ? 'so_saved' : 'so_miss', c), s.scored ? 'goal' : 'save'));
    for (const l of out) if (l) l.minute = 'i.E.';
    return out;
  }

  private randomDefender(side: Side): string {
    const ds = onPitch(this.sim.team(side)).filter((m) => m.group === 'DEF');
    return this.name(ds[Math.floor(this.rnd() * ds.length)]?.id);
  }
  private randomAttacker(side: Side, not?: string): string {
    const ds = onPitch(this.sim.team(side)).filter((m) => m.group !== 'GK' && m.group !== 'DEF' && m.id !== not);
    return this.name(ds[Math.floor(this.rnd() * ds.length)]?.id);
  }
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
