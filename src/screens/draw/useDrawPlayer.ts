// =============================================================================
// Ablaufsteuerung der Ziehungs-Show: Startbildschirm (wartet auf „Mit der
// Auslosung beginnen“) → je Kugel Rollen, Öffnen, Stehenlassen → Zusammenfassung. Tempo, Pause, Sprung zur eigenen Ziehung,
// Rest überspringen, Einzelschritt `next`. Respektiert prefers-reduced-motion (kein Rollen).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import type { DrawRecord } from '../../types/draw';

export type DrawSpeed = 'langsam' | 'normal' | 'schnell';
export type DrawPhase = 'intro' | 'roll' | 'open' | 'hold' | 'done';

// Seit 11/2026 rund 30 % ruhiger als zuvor (normal 1,0 → 1,3).
const FACTOR: Record<DrawSpeed, number> = { langsam: 2.1, normal: 1.3, schnell: 0.6 };

function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export function useDrawPlayer(rec: DrawRecord, myId: string, speed: DrawSpeed) {
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState<DrawPhase>('intro');
  const [paused, setPaused] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [started, setStarted] = useState(false);
  const reduced = useMemo(prefersReducedMotion, []);
  const myFirst = useMemo(() => rec.balls.findIndex((b) => b.id === myId && !b.rejected), [rec, myId]);
  const n = rec.balls.length;

  // Sprung zur eigenen Ziehung endet an der ersten Kugel der eigenen Paarung.
  const grouped = !!rec.groups?.length;
  const pairStart = useMemo(() => {
    if (myFirst < 0) return -1;
    if (rec.groups?.length) return myFirst;
    const pair = rec.balls[myFirst].pair;
    return rec.balls.findIndex((b) => b.pair === pair && !b.rejected);
  }, [rec, myFirst]);
  const fast = turbo && pairStart >= 0 && step < pairStart;
  useEffect(() => { if (turbo && pairStart >= 0 && step >= pairStart) setTurbo(false); }, [turbo, step, pairStart]);

  useEffect(() => {
    if (paused || phase === 'done' || (phase === 'intro' && !started)) return;
    const f = fast ? 0.04 : FACTOR[speed];
    const ball = rec.balls[step];
    const pairDone = !grouped && !!ball && !ball.rejected && rec.balls.findIndex((b) => b.pair === ball.pair && !b.rejected) !== step;
    const mine = !!ball && (grouped ? ball.id === myId : !!rec.pairs[ball.pair] && (rec.pairs[ball.pair].home === myId || rec.pairs[ball.pair].away === myId));
    let ms: number; let next: () => void;
    if (phase === 'intro') { ms = 500; next = () => { setStep(0); setPhase('roll'); }; }
    else if (phase === 'roll') { ms = reduced ? 0 : (grouped ? 550 : 750) * f; next = () => setPhase('open'); }
    else if (phase === 'open') { ms = (reduced ? 200 : grouped ? 400 : 550) * f; next = () => setPhase('hold'); }
    else {
      ms = (ball?.rejected ? 1300 : pairDone ? (mine ? 3600 : 2200) : mine ? 2200 : 1300) * f;
      next = () => {
        if (step + 1 >= n) { setStep(n); setPhase('done'); }
        else { setStep(step + 1); setPhase('roll'); }
      };
    }
    const id = setTimeout(next, Math.max(16, ms));
    return () => clearTimeout(id);
  }, [phase, step, paused, speed, fast, reduced, rec, myId, n, started, grouped]);

  /** Alle Kugeln, die schon „offen“ sind (inkl. der aktuellen ab Phase open). */
  const shown = phase === 'done' ? n : phase === 'intro' ? 0 : step + (phase === 'roll' ? 0 : 1);

  return {
    step, phase, paused, reduced, shown, fast,
    hasMine: myFirst >= 0, started,
    /** Startknopf: die erste Kugel rollt kurz danach. */
    start: () => { setStarted(true); setPaused(false); },
    togglePause: () => setPaused((p) => !p),
    skipToMine: () => { if (pairStart >= 0 && step < pairStart) { setStarted(true); setPaused(false); setTurbo(true); if (phase === 'intro') { setStep(0); setPhase('roll'); } } },
    /** Runder Knopf/Pfeil rechts: Start bzw. sofort zum nächsten Schritt (auch in der Pause). */
    next: () => {
      if (phase === 'done') return;
      if (phase === 'intro') { setStarted(true); setStep(0); setPhase('roll'); return; }
      if (phase !== 'hold') { setPhase('hold'); return; }
      if (step + 1 >= n) { setStep(n); setPhase('done'); } else { setStep(step + 1); setPhase('roll'); }
    },
    skipAll: () => { setStep(n); setPhase('done'); setPaused(false); },
  };
}
