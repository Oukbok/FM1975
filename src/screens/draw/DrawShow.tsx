// =============================================================================
// ZIEHUNGS-SHOW „Gala“ – Vollbild (ohne Menü) auf einer gezeichneten Studio-
// bühne (GalaStage.tsx). Mittelkarte: Pokal + Titel, Lostopf als Raster aller
// Teilnehmer, darunter Regeln (DrawIntro.tsx) bzw. die Paarungsliste/Gruppen,
// die sich aufbauen, während die Vereine aus dem Raster verschwinden
// (DrawBoard.tsx, DrawGroups.tsx); Kommentarband, runder Start/Weiter-Knopf. Am Ende: dein Los, alle
// Paarungen und der Turnierbaum (DrawOverview.tsx). Live am Auslosungstag (Zeit
// steht) oder als Wiederholung. Daten: round.draw (game/cupDraw.ts), Ablauf:
// useDrawPlayer.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import type { AppSettings } from '../../engine/save';
import type { Game } from '../../game/state';
import { compCup, drawCompLabel, drawCompName } from '../../game/cupDraw';
import { drawVenue, seasonStartYearOf } from '../../data/drawHistory';
import { fmtDateFull } from '../../ui/format';
import type { DrawRecord } from '../../types/draw';
import { buildScript, showClub, type ShowClub } from './drawScript';
import { BallSvg, DrawSummary } from './DrawParts';
import { PairList, PoolGrid, TrophyMark, boardSize } from './DrawBoard';
import { GalaStage } from './GalaStage';
import { DrawIntro } from './DrawIntro';
import { BracketOverview, PairsOverview, useClubLookup, type OverviewTab } from './DrawOverview';
import { useDrawPlayer, type DrawSpeed } from './useDrawPlayer';
import { GroupSummary, GroupsOverview, GroupsPanel, isGroupDraw, isLeagueDraw } from './DrawGroups';

export function DrawShow({ g, rec, replay, settings, onSettings, onClose }: {
  g: Game; rec: DrawRecord; replay?: boolean; settings: AppSettings;
  onSettings: (s: AppSettings) => void; onClose: () => void;
}) {
  const myId = g.managedClubId;
  const [speed, setSpeed] = useState<DrawSpeed>(settings.drawSpeed ?? 'normal');
  // Ohne eigenen Verein in der Runde startet die Übersicht mit allen Paarungen.
  const grouped = isGroupDraw(rec);
  const inDraw = rec.pairs.some((x) => x.home === myId || x.away === myId) || !!rec.groups?.some((x) => x.ids.includes(myId));
  const [tab, setTab] = useState<OverviewTab>(inDraw ? 'los' : 'pairs');
  const p = useDrawPlayer(rec, myId, speed);
  const cup = compCup(g, rec.comp);
  const clubs = useMemo(() => {
    const am = new Set(cup?.amateurClubIds ?? []);
    const out: Record<string, ShowClub> = {};
    for (const pot of rec.pots) for (const id of pot.ids) out[id] = showClub(g, id, am);
    return out;
  }, [g, rec, cup]);
  const script = useMemo(() => buildScript(g, rec, clubs), [g, rec, clubs]);
  const lookup = useClubLookup(g, cup, clubs);
  const startYear = seasonStartYearOf(rec.matchDate);
  const show = drawVenue(rec.comp, rec.roundIndex, startYear).show;
  const toOverview = () => { setTab('pairs'); p.skipAll(); };

  useEffect(() => {
    if (speed !== settings.drawSpeed) onSettings({ ...settings, drawSpeed: speed });
  }, [speed]);

  // Leertaste = Pause, Esc = Rest überspringen bzw. schließen (nicht, wenn das Vereinsprofil offen ist).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay')) return;
      if (p.phase === 'intro' && !p.started) {
        if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); p.start(); }
        else if (e.key === 'Escape') { e.preventDefault(); toOverview(); }
        return;
      }
      if (e.code === 'Space') { e.preventDefault(); if (p.phase !== 'done') p.togglePause(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { if (p.phase !== 'done') { e.preventDefault(); p.next(); } }
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
  const compLabel = cup ? drawCompLabel(rec.comp, cup) : drawCompName(rec.comp);
  const drawing = p.phase !== 'intro' && p.phase !== 'done';
  const back = p.phase === 'hold' && ball?.rejected ? ball.id : null;
  const goLabel = p.phase === 'done' ? 'Schließen' : p.phase === 'intro' && !p.started ? 'Auslosung starten' : 'Nächste Kugel';

  return (
    <div className={`dr-root dg-root dr-c-${rec.comp} dr-stage-${rec.stage} ${p.paused ? 'paused' : ''}`} role="dialog" aria-label={`Auslosung ${rec.roundName}`}>
      <GalaStage />
      <div className="dr-top">
        <div className="dr-top-l">
          <span className="dr-dim">{rec.venue} · {show}</span>
          <span className="dr-dim">{fmtDateFull(rec.date)}</span>
          {replay && <span className="dr-pill dim">Wiederholung</span>}
        </div>
        {p.phase === 'done' ? (
          <div className="dr-top-r">
            <div className="seg-group dr-speed dr-tabs">
              {((grouped
                ? [['los', isLeagueDraw(rec) ? 'Deine Gegner' : inDraw ? 'Deine Gruppe' : 'Gruppe A'], ['pairs', isLeagueDraw(rec) ? 'Alle Töpfe' : 'Alle Gruppen']]
                : [['los', inDraw ? 'Dein Los' : 'Topspiel'], ['pairs', 'Alle Paarungen'], ...(cup ? [['bracket', 'Turnierbaum']] : [])]) as [OverviewTab, string][]).map(([v, l]) => (
                <button key={v} className={`seg-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
              ))}
            </div>
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
                <Icon name={p.paused ? 'play' : 'pause'} size={22} /> {p.paused ? 'Fortsetzen' : 'Pause'}
              </button>
            )}
            {p.hasMine && (
              <button className="ms-btn" onClick={p.skipToMine} disabled={p.fast}>
                <Icon name="skip" size={22} /> Bis zu meiner Ziehung
              </button>
            )}
            <button className="ms-btn" onClick={p.skipAll} title="Esc">
              <Icon name="skip" size={22} /> Überspringen
            </button>
          </div>
        )}
      </div>

      <div className="dg-screen">
        <div className="dg-board">
          <div className="dg-head">
            <TrophyMark />
            <h1 className="dr-comp">Auslosung {compLabel} – {rec.roundName}</h1>
            <span className="dg-count">
              {drawing ? (grouped ? `Kugel ${Math.min(rec.balls.length, p.step + 1)} von ${rec.balls.length}` : `Paarung ${pairNo} von ${rec.pairs.length}`)
                : p.phase === 'intro' ? `${rec.pots.reduce((n, x) => n + x.ids.length, 0)} Vereine im Lostopf` : 'Ziehung beendet'}
            </span>
          </div>

          {p.phase === 'done' ? (
            <div className={`dg-body ${tab === 'los' ? 'center' : 'wide'}`}>
              {tab === 'los' && (grouped
                ? <GroupSummary rec={rec} clubs={lookup} myId={myId} onClose={() => setTab('pairs')} />
                : <DrawSummary rec={rec} clubs={clubs} myId={myId} endLine="" onClose={() => setTab('pairs')} closeLabel="Alle Paarungen" />)}
              {tab === 'pairs' && (grouped ? <GroupsOverview rec={rec} clubs={lookup} /> : <PairsOverview rec={rec} clubs={lookup} myId={myId} />)}
              {tab === 'bracket' && cup && <BracketOverview cup={cup} rec={rec} clubs={lookup} myId={myId} />}
            </div>
          ) : (
            <div className={`dg-body draw dg-${boardSize(rec)}`}>
              <PoolGrid rec={rec} clubs={lookup} shown={p.shown} back={back} activePot={ball ? ball.pot : null} />
              <div className="dg-lower">
                {p.phase === 'intro'
                  ? <DrawIntro rec={rec} cup={cup} startYear={startYear} show={show} replay={replay} onStart={p.start} onOverview={toOverview} />
                  : grouped ? <GroupsPanel rec={rec} clubs={lookup} shown={p.shown} /> : <PairList rec={rec} clubs={clubs} shown={p.shown} />}
              </div>
            </div>
          )}

          <div className={`dg-band tone-${line?.tone ?? 'neutral'}`} aria-live="polite">
            {drawing && p.phase !== 'hold' && ball && (
              <span key={`b${p.step}`} className={`dg-ball ${p.phase} ${p.reduced ? 'still' : ''}`}><BallSvg pot={ball.pot} size={46} /></span>
            )}
            {line ? <span key={`${p.step}-${p.phase}`} className="dg-band-txt">{line.text}</span>
              : <span className="dg-band-txt dim">{p.paused ? 'Pause' : p.phase === 'open' && ball ? `Los ${ball.no} · ${rec.pots[ball.pot]?.label ?? ''}` : 'Die nächste Kugel …'}</span>}
          </div>
          <button className="dg-go" onClick={p.phase === 'done' ? onClose : p.phase === 'intro' && !p.started ? p.start : p.next}
            title={goLabel} aria-label={goLabel} disabled={p.phase === 'intro' && p.started}>
            <Icon name={p.phase === 'done' ? 'close' : p.phase === 'intro' ? 'play' : 'skip'} size={40} />
          </button>
        </div>
      </div>
    </div>
  );
}
