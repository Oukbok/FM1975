// =============================================================================
// Taktgeber des Textmodus: holt Minute für Minute neue Ereignisse aus der
// Simulation, lässt den Erzähler Zeilen bauen und spielt sie mit Lesezeit ab.
// Spannungsmomente halten die Auflösung zurück; Eingriffe des Trainers werden
// sofort erzählt.
// =============================================================================
import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { MatchSim } from '../../engine/match/sim';
import type { Line, Narrator } from '../../data/ticker/narrator';

export type TextSpeed = 'langsam' | 'normal' | 'schnell';

const TIMING: Record<TextSpeed, { base: number; perChar: number; suspense: number; quiet: number }> = {
  langsam: { base: 1700, perChar: 46, suspense: 2700, quiet: 650 },
  normal: { base: 1050, perChar: 29, suspense: 2100, quiet: 380 },
  schnell: { base: 520, perChar: 14, suspense: 1350, quiet: 170 },
};

export interface TickerCfg { speed: TextSpeed; suspense: boolean; halftimeTalk: boolean }

interface TickerState {
  queue: Line[];
  history: Line[];
  current: Line | null;
  revealing: boolean;
  score: [number, number];
  pens: [number, number] | null;
  clock: string;
  paused: boolean;
  halftimePending: boolean;
  halftimeDone: boolean;
  ended: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

function clockOf(sim: MatchSim): string {
  if (sim.phase === 'halftime') return 'HZ';
  if (sim.phase === 'done') return 'Ende';
  if (sim.phase === 'shootout') return 'i.E.';
  return sim.stoppage ? `${sim.minute}+${sim.stoppage}'` : `${sim.minute}'`;
}

export function useTicker(sim: MatchSim, nar: Narrator, cfg: TickerCfg) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  nar.opts.suspense = cfg.suspense;
  const ref = useRef<TickerState>({
    queue: [], history: [], current: null, revealing: false, score: [0, 0], pens: null, clock: "0'",
    paused: false, halftimePending: false, halftimeDone: false, ended: false, timer: null,
  });

  const schedule = useCallback((ms: number) => {
    const s = ref.current;
    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(() => tickRef.current(), ms);
  }, []);

  const publish = (line: Line) => {
    const s = ref.current;
    if (line.score) s.score = line.score;
    if (line.pens) s.pens = line.pens;
    if (line.minute && line.minute !== 'i.E.') s.clock = line.minute;
    s.history.unshift(line);
    if (s.history.length > 260) s.history.length = 260;
  };

  const delayFor = (line: Line) => {
    const t = TIMING[cfgRef.current.speed];
    return (t.base + line.text.length * t.perChar) * (line.hold ?? 1);
  };

  const tick = () => {
    const s = ref.current;
    s.timer = null;
    if (s.paused || s.halftimePending || s.ended) return;
    if (!s.queue.length) {
      if (sim.finished) { s.ended = true; s.clock = 'Ende'; force(); return; }
      if (sim.phase === 'halftime' && !s.halftimeDone) {
        s.halftimeDone = true;
        if (cfgRef.current.halftimeTalk) { s.halftimePending = true; force(); return; }
      }
      const evs = sim.step();
      s.queue.push(...nar.narrate(evs));
      if (!s.queue.length) {
        s.clock = clockOf(sim);
        force();
        schedule(TIMING[cfgRef.current.speed].quiet);
        return;
      }
    }
    const line = s.queue.shift()!;
    if (line.suspense) {
      if (!cfgRef.current.suspense) { tick(); return; }
      s.current = line;
      s.revealing = true;
      if (line.minute) s.clock = line.minute;
      force();
      s.timer = setTimeout(() => {
        s.revealing = false;
        publish(line);
        force();
        schedule(TIMING[cfgRef.current.speed].base * 0.9);
      }, TIMING[cfgRef.current.speed].suspense);
      return;
    }
    s.current = line;
    publish(line);
    force();
    schedule(delayFor(line));
  };
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    schedule(600);
    return () => { const s = ref.current; if (s.timer) clearTimeout(s.timer); };
  }, [schedule]);

  /** Eingriff ausführen und sofort erzählen (vor allen wartenden Zeilen). */
  const act = useCallback((fn: () => unknown) => {
    const from = sim.events.length;
    const r = fn();
    const lines = nar.narrate(sim.events.slice(from));
    const s = ref.current;
    s.queue.unshift(...lines);
    if (!s.timer && !s.paused && !s.halftimePending && !s.revealing) schedule(150);
    force();
    return r;
  }, [sim, nar, schedule]);

  const setPaused = useCallback((p: boolean) => {
    const s = ref.current;
    s.paused = p;
    if (!p && !s.timer && !s.revealing) schedule(200);
    force();
  }, [schedule]);

  const finishHalftime = useCallback(() => {
    const s = ref.current;
    s.halftimePending = false;
    schedule(300);
    force();
  }, [schedule]);

  /** Bis zur nächsten Unterbrechung vorspulen (ohne Lesepausen). */
  const skip = useCallback(() => {
    const s = ref.current;
    if (s.timer) clearTimeout(s.timer);
    s.timer = null;
    s.revealing = false;
    for (const l of s.queue) if (!l.suspense) publish(l);
    s.queue = [];
    let guard = 0;
    do {
      const evs = sim.step();
      for (const l of nar.narrate(evs)) if (!l.suspense) publish(l);
    } while (!sim.finished && (sim.phase === 'play' || sim.phase === 'shootout') && guard++ < 400);
    s.score = sim.score();
    s.clock = clockOf(sim);
    s.current = s.history[0] ?? null;
    if (sim.phase === 'halftime' && !s.halftimeDone) {
      s.halftimeDone = true;
      if (cfgRef.current.halftimeTalk) s.halftimePending = true;
    }
    if (sim.finished) s.ended = true;
    force();
    if (!s.ended && !s.halftimePending && !s.paused) schedule(400);
  }, [sim, nar, schedule]);

  return { state: ref.current, act, setPaused, finishHalftime, skip };
}
