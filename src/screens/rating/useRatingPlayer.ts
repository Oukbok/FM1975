// =============================================================================
// Ablauf der Bewertungs-Show: Startbildschirm (wartet auf „Starten“) → je
// Spieler Aufruf, Zählen alt → neu, Stehenlassen mit Begründung → Übersicht.
// Tempo wie die Auslosung (screens/draw/useDrawPlayer.ts), Pause, Sprung ans Ende.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import type { DrawSpeed } from '../draw/useDrawPlayer';

export type RatingPhase = 'intro' | 'call' | 'count' | 'hold' | 'done';

// Gleiche Faktoren wie die Ziehungs-Show.
const FACTOR: Record<DrawSpeed, number> = { langsam: 2.1, normal: 1.3, schnell: 0.6 };

function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export interface StepInfo { delta: number; big: boolean }

export function useRatingPlayer(steps: StepInfo[], speed: DrawSpeed, manual = false) {
  const [step, setStep] = useState(-1);
  const [phase, setPhase] = useState<RatingPhase>('intro');
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const reduced = useMemo(prefersReducedMotion, []);
  const n = steps.length;

  useEffect(() => {
    if (paused || phase === 'done' || (phase === 'intro' && !started)) return;
    if (manual && phase === 'hold') return; // wartet auf „Spieler vor“
    const f = FACTOR[speed];
    const s = steps[step];
    let ms: number; let next: () => void;
    if (phase === 'intro') { ms = 500; next = () => { if (n) { setStep(0); setPhase('call'); } else setPhase('done'); }; }
    else if (phase === 'call') { ms = (reduced ? 500 : 950) * f; next = () => setPhase('count'); }
    else if (phase === 'count') { ms = (reduced ? 150 : s?.delta ? 900 : 450) * f; next = () => setPhase('hold'); }
    else {
      ms = (!s?.delta ? 1700 : s.big ? 3600 : 2700) * f;
      next = () => {
        if (step + 1 >= n) { setStep(n); setPhase('done'); }
        else { setStep(step + 1); setPhase('call'); }
      };
    }
    const id = setTimeout(next, Math.max(16, ms));
    return () => clearTimeout(id);
  }, [phase, step, paused, speed, reduced, steps, n, started, manual]);

  /** Spieler mit bekanntem Ergebnis (ab Phase count gilt der aktuelle als bekannt). */
  const shown = phase === 'done' ? n : phase === 'intro' ? 0 : step + (phase === 'call' ? 0 : 1);

  return {
    step, phase, paused, reduced, shown, started,
    start: () => { setStarted(true); setPaused(false); },
    togglePause: () => setPaused((p) => !p),
    /** „Spieler vor“: aktuellen Spieler sofort auflösen bzw. zum nächsten springen. */
    advance: () => {
      setStarted(true); setPaused(false);
      if (phase === 'intro') { if (n) { setStep(0); setPhase('call'); } else setPhase('done'); }
      else if (phase === 'call' || phase === 'count') setPhase('hold');
      else if (phase === 'hold') { if (step + 1 >= n) { setStep(n); setPhase('done'); } else { setStep(step + 1); setPhase('call'); } }
    },
    skipAll: () => { setStarted(true); setStep(n); setPhase('done'); setPaused(false); },
  };
}
