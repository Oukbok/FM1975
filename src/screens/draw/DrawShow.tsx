// =============================================================================
// ZIEHUNGS-SHOW – Vollbild wie der Textmodus (ohne Menü). Kugeln werden
// nacheinander gezogen und geöffnet, die Paarungen bauen sich auf, am Ende
// steht dein Los. Live am Auslosungstag (Zeit steht) oder als Wiederholung.
// Daten: round.draw (game/cupDraw.ts), Ablauf: useDrawPlayer.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import type { AppSettings } from '../../engine/save';
import type { Game } from '../../game/state';
import { compCup, drawCompName } from '../../game/cupDraw';
import { drawVenue, seasonStartYearOf } from '../../data/drawHistory';
import { fmtDateFull } from '../../ui/format';
import type { DrawRecord } from '../../types/draw';
import { buildScript, showClub, type ShowClub } from './drawScript';
import { DrawSummary, PairsPanel, PotsPanel, StageReveal } from './DrawParts';
import { useDrawPlayer, type DrawSpeed } from './useDrawPlayer';

export function DrawShow({ g, rec, replay, settings, onSettings, onClose }: {
  g: Game; rec: DrawRecord; replay?: boolean; settings: AppSettings;
  onSettings: (s: AppSettings) => void; onClose: () => void;
}) {
  const myId = g.managedClubId;
  const [speed, setSpeed] = useState<DrawSpeed>(settings.drawSpeed ?? 'normal');
  const p = useDrawPlayer(rec, myId, speed);
  const cup = compCup(g, rec.comp);
  const clubs = useMemo(() => {
    const am = new Set(cup?.amateurClubIds ?? []);
    const out: Record<string, ShowClub> = {};
    for (const pot of rec.pots) for (const id of pot.ids) out[id] = showClub(g, id, am);
    return out;
  }, [g, rec, cup]);
  const script = useMemo(() => buildScript(g, rec, clubs), [g, rec, clubs]);
  const startYear = seasonStartYearOf(rec.matchDate);
  const show = drawVenue(rec.comp, rec.roundIndex, startYear).show;

  useEffect(() => {
    if (speed !== settings.drawSpeed) onSettings({ ...settings, drawSpeed: speed });
  }, [speed]);

  // Leertaste = Pause, Esc = Rest überspringen bzw. schließen (nicht, wenn das Vereinsprofil offen ist).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay')) return;
      if (e.code === 'Space') { e.preventDefault(); if (p.phase !== 'done') p.togglePause(); }
      else if (e.key === 'Escape') { e.preventDefault(); if (p.phase === 'done') onClose(); else p.skipAll(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, onClose]);

  const ball = p.phase === 'intro' || p.phase === 'done' ? undefined : rec.balls[p.step];
  const line = p.phase === 'intro' ? { text: script.intro, tone: 'neutral' as const }
    : p.phase === 'done' ? { text: script.end, tone: 'neutral' as const }
    : p.phase === 'hold' ? script.perBall[p.step] : null;
  const doneCount = rec.pairs.filter((_, i) => rec.balls.slice(0, p.shown).filter((b) => b.pair === i).length === 2).length;
  const pairNo = ball && !ball.rejected ? ball.pair + 1 : Math.min(rec.pairs.length, doneCount + 1);

  return (
    <div className={`dr-root dr-stage-${rec.stage} ${p.paused ? 'paused' : ''}`} role="dialog" aria-label={`Auslosung ${rec.roundName}`}>
      <div className="dr-top">
        <div className="dr-top-l">
          <Icon name="trophy" size={34} />
          <span className="dr-comp">{drawCompName(rec.comp)} · {rec.roundName}</span>
          <span className="dr-dim">{rec.venue} · {show}</span>
          <span className="dr-dim">{fmtDateFull(rec.date)}</span>
          {replay && <span className="dr-pill dim">Wiederholung</span>}
        </div>
        <div className="dr-top-r">
          <div className="seg-group dr-speed">
            {(['langsam', 'normal', 'schnell'] as DrawSpeed[]).map((v) => (
              <button key={v} className={`seg-btn ${speed === v ? 'active' : ''}`} onClick={() => setSpeed(v)}>
                {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
              </button>
            ))}
          </div>
          <button className="ms-btn" onClick={p.togglePause} disabled={p.phase === 'done'} title="Leertaste">
            <Icon name={p.paused ? 'play' : 'pause'} size={24} /> {p.paused ? 'Fortsetzen' : 'Pause'}
          </button>
          {p.hasMine && (
            <button className="ms-btn" onClick={p.skipToMine} disabled={p.phase === 'done' || p.fast}>
              <Icon name="skip" size={24} /> Bis zu meiner Ziehung
            </button>
          )}
          <button className="ms-btn" onClick={p.skipAll} disabled={p.phase === 'done'} title="Esc">
            <Icon name="skip" size={24} /> Überspringen
          </button>
        </div>
      </div>

      <div className="dr-main">
        <PotsPanel rec={rec} clubs={clubs} shown={p.shown} activePot={ball ? ball.pot : null} />

        <div className="dr-center">
          <div className="dr-stagebox">
            <div className="dr-lights" aria-hidden="true" />
            {p.phase === 'intro' && (
              <div className="dr-intro">
                <div className="dr-intro-kicker">{drawCompName(rec.comp)} {cup?.season ?? ''}</div>
                <div className="dr-intro-title">Auslosung</div>
                <div className="dr-intro-round">{rec.roundName}</div>
                <ul className="dr-rules">{rec.rules.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
            {p.phase === 'done' && <DrawSummary rec={rec} clubs={clubs} myId={myId} endLine="" onClose={onClose} />}
            {ball && <StageReveal rec={rec} clubs={clubs} ball={ball} phase={p.phase} step={p.step} reduced={p.reduced} />}
            {p.phase !== 'intro' && p.phase !== 'done' && (
              <div className="dr-progress">Paarung {pairNo} von {rec.pairs.length}</div>
            )}
          </div>
          <div className={`dr-now tone-${line?.tone ?? 'neutral'}`}>
            {line ? <span key={`${p.step}-${p.phase}`} className="dr-now-txt">{line.text}</span>
              : <span className="dr-now-txt dim">{p.paused ? 'Pause' : 'Die nächste Kugel …'}</span>}
          </div>
        </div>

        <PairsPanel rec={rec} clubs={clubs} shown={p.shown} />
      </div>
    </div>
  );
}
