// =============================================================================
// BEWERTUNGS-SHOW – Vollbild im Stil der Pokalauslosung (screens/draw/).
// Startbildschirm mit Regeln (RatingIntro.tsx), dann werden alle Spieler
// alphabetisch automatisch aufgerufen: Gesicht, alte → neue Stärke, Ergebnis,
// Begründung (engine/ratingReasons.ts). Links der Kader mit Status, rechts der
// Zwischenstand, unten die Kommentarzeile; am Ende die Bilanz. Die Werte sind
// bereits angewandt – die Show enthüllt sie nur. Ablauf: useRatingPlayer.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import type { RatingResult } from '../../engine/development';
import type { AppSettings } from '../../engine/save';
import type { Game } from '../../game/state';
import { fmtDateFull } from '../../ui/format';
import type { DrawSpeed } from '../draw/useDrawPlayer';
import { buildRows, endLine, introLine, scriptFor } from './ratingScript';
import { LivePanel, PlayerList, RatingSummary, StageCard, type PrevRound } from './RatingParts';
import { RatingIntro } from './RatingIntro';
import { useRatingPlayer } from './useRatingPlayer';

export function RatingShow({ g, results, anlass, settings, onSettings, onClose }: {
  g: Game; results: RatingResult[]; anlass: string; settings: AppSettings;
  onSettings: (s: AppSettings) => void; onClose: () => void;
}) {
  const [speed, setSpeed] = useState<DrawSpeed>(settings.ratingSpeed ?? settings.drawSpeed ?? 'normal');
  const rows = useMemo(() => buildRows(g, results), [g, results]);
  const steps = useMemo(() => rows.map((r) => ({ delta: r.delta, big: Math.abs(r.delta) >= 2 || (!!r.r.tag && r.delta !== 0) })), [rows]);
  const lines = useMemo(() => scriptFor(rows), [rows]);
  const p = useRatingPlayer(steps, speed);
  const [picked, setPicked] = useState<number | null>(null);
  const date = g.calendar.currentDate;
  const club = g.clubs[g.managedClubId];
  const prev: PrevRound | null = useMemo(() => {
    const rs = (g.ratingRounds ?? []).filter((r) => r.date < date);
    return rs.length ? rs[rs.length - 1] : null;
  }, [g, date]);

  useEffect(() => {
    if (speed !== settings.ratingSpeed) onSettings({ ...settings, ratingSpeed: speed });
  }, [speed]);

  // Leertaste = Pause, Esc = bis zum Ende springen bzw. schließen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay, .pp-overlay')) return;
      if (p.phase === 'intro' && !p.started) {
        if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); p.start(); }
        else if (e.key === 'Escape') { e.preventDefault(); p.skipAll(); }
        return;
      }
      if (e.code === 'Space') { e.preventDefault(); if (p.phase !== 'done') p.togglePause(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (p.phase === 'done') onClose(); else p.skipAll(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, onClose]);

  const intro = p.phase === 'intro';
  const done = p.phase === 'done';
  const row = !intro && !done ? rows[p.step] : picked != null ? rows[picked] : undefined;
  const countMs = speed === 'langsam' ? 1400 : speed === 'schnell' ? 500 : 900;
  const line = intro ? { text: introLine(rows.length, anlass), tone: 'neutral' as const }
    : done ? (picked != null ? lines[picked] : { text: endLine(rows), tone: 'neutral' as const })
    : p.phase === 'hold' ? lines[p.step] : null;

  return (
    <div className={`dr-root rt-root ${p.paused ? 'paused' : ''}`} role="dialog" aria-label={`Bewertungsrunde ${anlass}`}>
      <div className="dr-top">
        <div className="dr-top-l">
          <Icon name="training" size={34} />
          <span className="dr-comp">Bewertungsrunde · {anlass}</span>
          <span className="dr-dim">{club?.name}</span>
          <span className="dr-dim">{fmtDateFull(date)}</span>
        </div>
        {done ? (
          <div className="dr-top-r">
            {picked != null && <button className="ms-btn" onClick={() => setPicked(null)}>Zur Bilanz</button>}
            <button className="ms-btn" onClick={onClose} title="Esc">Schließen</button>
          </div>
        ) : (
          <div className="dr-top-r">
            <div className="seg-group dr-speed">
              {(['langsam', 'normal', 'schnell'] as DrawSpeed[]).map((v) => (
                <button key={v} className={`seg-btn ${speed === v ? 'active' : ''}`} onClick={() => setSpeed(v)}>
                  {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
                </button>
              ))}
            </div>
            {p.started && (
              <button className="ms-btn" onClick={p.togglePause} title="Leertaste">
                <Icon name={p.paused ? 'play' : 'pause'} size={24} /> {p.paused ? 'Fortsetzen' : 'Pause'}
              </button>
            )}
            <button className="ms-btn" onClick={p.skipAll} title="Esc">
              <Icon name="skip" size={24} /> Bis zum Ende springen
            </button>
          </div>
        )}
      </div>

      <div className={`dr-main rt-main ${intro ? 'intro' : ''}`}>
        <PlayerList rows={rows} shown={p.shown} current={done ? -1 : p.step}
          onPick={done ? (i) => setPicked(i) : undefined} picked={done ? picked : null} />

        <div className="dr-center">
          <div className="dr-stagebox rt-stage">
            <div className="dr-lights" aria-hidden="true" />
            {intro && <RatingIntro g={g} label={anlass} date={date} count={rows.length} onStart={p.start} onSkip={p.skipAll} />}
            {done && picked == null && <RatingSummary rows={rows} prev={prev} label={anlass} onClose={onClose} />}
            {row && <StageCard key={row.r.playerId} row={row} club={club} phase={done ? 'done' : p.phase} reduced={p.reduced} countMs={countMs} />}
            {!intro && !done && <div className="dr-progress">Spieler {Math.min(rows.length, p.step + 1)} von {rows.length}</div>}
          </div>
          <div className={`dr-now tone-${line?.tone ?? 'neutral'}`}>
            {line ? <span key={`${p.step}-${p.phase}-${picked}`} className="dr-now-txt">{line.text}</span>
              : <span className="dr-now-txt dim">{p.paused ? 'Pause' : 'Der nächste Spieler …'}</span>}
          </div>
        </div>

        {!intro && <LivePanel rows={rows} shown={p.shown} prev={prev} />}
      </div>
    </div>
  );
}
