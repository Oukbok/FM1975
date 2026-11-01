// =============================================================================
// ZIEHUNGS-SHOW – Vollbild wie der Textmodus (ohne Menü). Startbildschirm mit
// den Regeln der Runde (DrawIntro.tsx), dann werden die Kugeln nacheinander
// gezogen und geöffnet, die Paarungen bauen sich auf. Am Ende: dein Los, alle
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
import { DrawSummary, PairsPanel, PotsPanel, StageReveal } from './DrawParts';
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
          <span className="dr-comp">{cup ? drawCompLabel(rec.comp, cup) : drawCompName(rec.comp)} · {rec.roundName}</span>
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
                <Icon name={p.paused ? 'play' : 'pause'} size={24} /> {p.paused ? 'Fortsetzen' : 'Pause'}
              </button>
            )}
            {p.hasMine && (
              <button className="ms-btn" onClick={p.skipToMine} disabled={p.fast}>
                <Icon name="skip" size={24} /> Bis zu meiner Ziehung
              </button>
            )}
            <button className="ms-btn" onClick={p.skipAll} title="Esc">
              <Icon name="skip" size={24} /> Überspringen
            </button>
          </div>
        )}
      </div>

      {p.phase === 'done' && tab !== 'los' ? (
        <div className="dr-wide">
          {tab === 'pairs' && (grouped ? <GroupsOverview rec={rec} clubs={lookup} /> : <PairsOverview rec={rec} clubs={lookup} myId={myId} />)}
          {tab === 'bracket' && cup && <BracketOverview cup={cup} rec={rec} clubs={lookup} myId={myId} />}
        </div>
      ) : (
      <div className={`dr-main ${p.phase === 'intro' ? 'intro' : ''}`}>
        <PotsPanel rec={rec} clubs={clubs} shown={p.shown} activePot={ball ? ball.pot : null} />

        <div className="dr-center">
          <div className="dr-stagebox">
            <div className="dr-lights" aria-hidden="true" />
            {p.phase === 'intro' && (
              <DrawIntro rec={rec} cup={cup} startYear={startYear} show={show} replay={replay} onStart={p.start} onOverview={toOverview} />
            )}
            {p.phase === 'done' && (grouped
              ? <GroupSummary rec={rec} clubs={lookup} myId={myId} onClose={() => setTab('pairs')} />
              : <DrawSummary rec={rec} clubs={clubs} myId={myId} endLine="" onClose={() => setTab('pairs')} closeLabel="Alle Paarungen" />)}
            {ball && <StageReveal rec={rec} clubs={clubs} ball={ball} phase={p.phase} step={p.step} reduced={p.reduced} />}
            {p.phase !== 'intro' && p.phase !== 'done' && (
              <div className="dr-progress">{grouped ? `Kugel ${Math.min(rec.balls.length, p.step + 1)} von ${rec.balls.length}` : `Paarung ${pairNo} von ${rec.pairs.length}`}</div>
            )}
          </div>
          <div className={`dr-now tone-${line?.tone ?? 'neutral'}`}>
            {line ? <span key={`${p.step}-${p.phase}`} className="dr-now-txt">{line.text}</span>
              : <span className="dr-now-txt dim">{p.paused ? 'Pause' : 'Die nächste Kugel …'}</span>}
          </div>
        </div>

        {p.phase !== 'intro' && (grouped ? <GroupsPanel rec={rec} clubs={lookup} shown={p.shown} /> : <PairsPanel rec={rec} clubs={clubs} shown={p.shown} />)}
      </div>
      )}
    </div>
  );
}
