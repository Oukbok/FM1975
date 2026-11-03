// =============================================================================
// BEWERTUNGS-SHOW – Fenster „Auf- und Abwertungsrunde“ (Aufbau nach Pascals Vorbild):
// oben links Bühne (Start/Spieler/Abschluss), oben rechts Spielerentwicklung (Top 3),
// unten Überblick aller Spieler mit Grund 1/2, Fußleiste mit Einzelbestätigung, Tempo,
// „Spieler vor“ und OK. Spieler alphabetisch, Begründung aus engine/ratingReasons.ts.
// Werte sind bereits angewandt – die Show enthüllt sie nur. Bausteine RatingBoard.tsx,
// Ablauf useRatingPlayer.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import type { RatingResult } from '../../engine/development';
import type { AppSettings } from '../../engine/save';
import type { Game } from '../../game/state';
import { fmtDateFull } from '../../ui/format';
import type { DrawSpeed } from '../draw/useDrawPlayer';
import { buildRows, endLine, introLine, scriptFor } from './ratingScript';
import type { PrevRound } from './RatingParts';
import { Overview, StageCard, SummaryCard, TopThree } from './RatingBoard';
import ClubCrest from '../../components/ClubCrest';
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
  const [manual, setManual] = useState(!!settings.ratingStepwise);
  const [hideNext, setHideNext] = useState(false);
  const p = useRatingPlayer(steps, speed, manual);
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
      else if (e.key === 'Enter') { e.preventDefault(); if (p.phase !== 'done') p.advance(); }
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

  const prevLine = prev && prev.n
    ? `Letzte Runde (${prev.label}): ${prev.ups} besser, ${prev.downs} schlechter, Ø ${(prev.sum / prev.n >= 0 ? '+' : '−')}${Math.abs(prev.sum / prev.n).toFixed(2).replace('.', ',')}.`
    : null;
  const close = () => { if (hideNext) onSettings({ ...settings, ratingShow: 'aus' }); onClose(); };

  return (
    <div className={`rb2-overlay rt-root ${p.paused ? 'paused' : ''}`} role="dialog" aria-label={`Bewertungsrunde ${anlass}`}>
      <div className="rb2-panel">
        <div className="rb2-titlebar">
          {club && <ClubCrest club={club} size={64} />}
          <div className="rb2-titles">
            <div className="rb2-title">Auf- und Abwertungsrunde</div>
            <div className="rb2-subtitle">{club?.name} · {anlass} · {fmtDateFull(date)}</div>
          </div>
          <div className="rb2-title-r">
            {p.started && !done && (
              <button className="ms-btn" onClick={p.togglePause} title="Leertaste">
                <Icon name={p.paused ? 'play' : 'pause'} size={22} /> {p.paused ? 'Fortsetzen' : 'Pause'}
              </button>
            )}
            {!done && <button className="ms-btn" onClick={p.skipAll} title="Esc"><Icon name="skip" size={22} /> Bis zum Ende springen</button>}
          </div>
        </div>

        <div className="rb2-upper">
          <div className="rb2-stage rt-stage">
            {intro && <RatingIntro g={g} label={anlass} date={date} count={rows.length} onStart={p.start} onSkip={p.skipAll} />}
            {done && picked == null && <SummaryCard rows={rows} prevLine={prevLine} />}
            {row && <StageCard key={row.r.playerId} row={row} club={club} phase={done ? 'done' : p.phase} reduced={p.reduced} countMs={countMs} />}
            {line && !intro && <div className={`rb2-line tone-${line.tone}`}><span key={`${p.step}-${p.phase}-${picked}`}>{line.text}</span></div>}
          </div>
          <TopThree rows={rows} shown={p.shown} club={club} onPick={(i) => { if (done) setPicked(i); }} />
        </div>

        <Overview rows={rows} shown={p.shown} current={done ? -1 : p.step} picked={done ? picked : null}
          onPick={(i) => { if (done) setPicked(picked === i ? null : i); }} />

        <div className="rb2-foot">
          <label className="rb2-check"><input type="checkbox" checked={manual} onChange={(e) => { setManual(e.target.checked); onSettings({ ...settings, ratingSpeed: speed, ratingStepwise: e.target.checked }); }} /> Jeden Spieler einzeln bestätigen</label>
          <span className="rb2-foot-lbl">Geschwindigkeit</span>
          <div className="seg-group">
            {(['langsam', 'normal', 'schnell'] as DrawSpeed[]).map((v) => (
              <button key={v} className={`seg-btn ${speed === v ? 'active' : ''}`} onClick={() => setSpeed(v)}>
                {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
              </button>
            ))}
          </div>
          <label className="rb2-check"><input type="checkbox" checked={hideNext} onChange={(e) => setHideNext(e.target.checked)} /> Künftig nur die kurze Liste zeigen</label>
          <span className="rb2-foot-sp" />
          {done
            ? <>{picked != null && <button className="ms-btn" onClick={() => setPicked(null)}>Zur Bilanz</button>}<button className="dr-close rb2-ok" onClick={close} title="Esc">OK</button></>
            : <button className="dr-close rb2-ok" onClick={p.advance} title="Enter">{intro ? 'Starten' : 'Spieler vor'}</button>}
        </div>
      </div>
    </div>
  );
}
