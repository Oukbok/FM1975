// =============================================================================
// GALA GOLDENER BALL — Zeremonie zum Fußballer des Jahres (20. Dezember)
// Ablauf: Startbild „Gala live aus …“ mit Pokal → Platz 3 → Platz 2 → Platz 1
// werden nacheinander auf dem Podest enthüllt → darunter die Plätze 4–10.
// Jeder Spieler erscheint genau einmal (kein doppeltes Podest wie beim Vorbild).
// Klick/Leertaste/Enter: nächster Schritt, „Überspringen“ springt ans Ende, Esc schließt.
// Bei reduzierter Bewegung startet die Gala direkt im Endbild.
// Ausgelöst über game.goldenBall.pending (game/goldenBallGame.ts → GameShell).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PlayerModal from '../../components/PlayerModal';
import { seasonLabel } from '../../engine/calendar';
import type { GBYear } from '../../game/goldenBallGame';
import type { Game } from '../../game/state';
import { GalaRest, GoldenBallTrophy, PodiumCard } from './GalaParts';

const STEP_MS = 3200;
const LAST = 4; // 0 Start, 1 Platz 3, 2 Platz 2, 3 Platz 1, 4 Endbild mit Liste

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function GalaShow({ g, y, onClose }: { g: Game; y: GBYear; onClose: () => void }) {
  const [step, setStep] = useState(() => (reduced() ? LAST : 0));
  const [sel, setSel] = useState<string | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (step >= LAST) return;
    const t = setTimeout(() => setStep((s) => Math.min(LAST, s + 1)), step === 0 ? STEP_MS + 600 : STEP_MS);
    return () => clearTimeout(t);
  }, [step]);
  const advance = () => { if (stepRef.current < LAST) setStep(stepRef.current + 1); else onClose(); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose(); }
      else if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); advance(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  const season = seasonLabel(y.year);
  const mine = y.mine ?? g.managedClubId;
  const [w1, w2, w3] = y.top;
  const shown = (place: number) => step >= 4 - place; // Platz 3 bei Schritt 1, Platz 1 bei Schritt 3
  const p = sel ? g.players[sel] : null;
  const ownHit = y.top.findIndex((e) => e.c === mine);
  return (
    <div className={`gb-root step-${step}`} role="dialog" aria-label={`${y.title} ${y.year}`} onClick={advance}>
      <div className="gb-light" aria-hidden />
      <header className="gb-top">
        <div className="gb-kicker">Gala live aus {y.venue} · {y.year}</div>
        <h1 className="gb-title">{y.title}</h1>
        <div className="gb-sub">Der Goldene Ball · {y.rule}</div>
      </header>

      {step === 0 ? (
        <div className="gb-intro">
          <GoldenBallTrophy size={190} />
          <p>Die Jury hat abgestimmt. Bewertet wird das Kalenderjahr {y.year}: Noten, Tore und Vorlagen, Titel und Klasse.</p>
        </div>
      ) : (
        <div className="gb-stage">
          <div className="gb-podium">
            {w2 && <PodiumCard g={g} e={w2} place={2} shown={shown(2)} season={season} mine={w2.c === mine} />}
            {w1 && (
              <div className="gb-center">
                <GoldenBallTrophy size={step >= 3 ? 96 : 120} />
                <PodiumCard g={g} e={w1} place={1} shown={shown(1)} season={season} mine={w1.c === mine} />
              </div>
            )}
            {w3 && <PodiumCard g={g} e={w3} place={3} shown={shown(3)} season={season} mine={w3.c === mine} />}
          </div>
          {step >= LAST && (
            <section className="gb-list" onClick={(e) => e.stopPropagation()}>
              <h3>Plätze 4 bis 10</h3>
              <GalaRest g={g} top={y.top} mine={mine} season={season} />
            </section>
          )}
        </div>
      )}

      <footer className="gb-foot" onClick={(e) => e.stopPropagation()}>
        <span className="gb-foot-note">
          {step >= LAST
            ? (ownHit >= 0 ? `Aus deinem Kader: ${y.top[ownHit].n} auf Platz ${ownHit + 1}.` : 'Diesmal ist niemand aus deinem Kader unter den besten zehn.')
            : 'Klick oder Leertaste – weiter'}
        </span>
        {step < LAST && <button className="btn btn-ghost" onClick={() => setStep(LAST)}>Überspringen</button>}
        {step >= LAST && w1 && g.players[w1.p] && <button className="btn btn-ghost" onClick={() => setSel(w1.p)}>Profil des Siegers</button>}
        <button className="btn btn-primary" onClick={step >= LAST ? onClose : advance}>{step >= LAST ? 'Weiter' : 'Nächster Platz'}</button>
      </footer>
      {p && createPortal(
        <div onClick={(e) => e.stopPropagation()}>
          <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id]).filter(Boolean)}
            today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />
        </div>,
        document.body,
      )}
    </div>
  );
}
