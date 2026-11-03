// =============================================================================
// TEXTMODUS – eigene Oberfläche ohne Menü (Aufbau nach dem EA-Textmodus).
// Links: Kopf-Bühne (Wappen, Ergebnis, Chancen-Meter, Uhr, Zeitleiste) und die
// Ereignisliste mit Szenen-Blöcken. Rechts: Schiedsrichter, Reiter Team/Taktik/
// Gegner/Live/Statistik/Tabelle, Knöpfe. Wechsel und Umstellungen laufen über
// den eigenen Wechsel-Bildschirm (changes/ChangesScreen.tsx).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import PlayerModal from '../../components/PlayerModal';
import type { MatchSim } from '../../engine/match/sim';
import type { MatchOutcome } from '../../engine/match/types';
import { Narrator } from '../../data/ticker/narrator';
import type { OwnMatchInfo } from '../../game/ownMatch';
import type { Game } from '../../game/state';
import type { AppSettings } from '../../engine/save';
import { fmtDateFull } from '../../ui/format';
import { StatsPanel, TacticsPanel } from './MatchPanels';
import { EndPanel } from './MatchDialogs';
import { useTicker, type TextSpeed } from './useTicker';
import { Stage } from './board/Stage';
import { TickerList } from './board/TickerList';
import { LineupBoard } from './board/LineupBoard';
import { OptionsBox, optOn } from './board/OptionsBox';
import { RefereeBox, TablePanel } from './board/SidePanels';
import { makeStopCheck, type StopOpts } from './board/stops';
import { ChangesScreen, type ChangesTab } from './changes/ChangesScreen';

const WEATHER: Record<string, string> = {
  sonnig: 'Sonnig', bewoelkt: 'Bewölkt', regen: 'Regen', schnee: 'Schnee', hitze: 'Hitze', wind: 'Windig', nebel: 'Nebel',
};
type RTab = 'team' | 'taktik' | 'gegner' | 'live' | 'stats' | 'tabelle';
const RTABS: [RTab, string][] = [['team', 'Team'], ['taktik', 'Taktik'], ['gegner', 'Gegner'], ['live', 'Live'], ['stats', 'Statistik'], ['tabelle', 'Tabelle']];

export function MatchScreen({ g, sim, info, settings, onSettings, onComplete, onFinish }: {
  g: Game; sim: MatchSim; info: OwnMatchInfo; settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  /** Abpfiff: Ergebnis verbuchen (einmalig). */
  onComplete: () => MatchOutcome;
  /** „Weiter“ nach dem Abschluss. */
  onFinish: () => void;
}) {
  const side = info.side;
  const opp = side === 'home' ? 'away' : 'home';
  const suspense = optOn(settings, 'matchSuspense');
  const nar = useMemo(() => new Narrator(sim, { mySide: side, suspense, markup: true }), [sim, side]);
  const [speed, setSpeed] = useState<TextSpeed>(settings.matchTextSpeed ?? 'normal');
  const [rtab, setRtab] = useState<RTab>('team');
  const [optsOpen, setOptsOpen] = useState(false);
  const [cs, setCs] = useState<{ tab?: ChangesTab; pane?: 'system' | 'taktik'; wasPaused: boolean } | null>(null);
  const [profile, setProfileRaw] = useState<string | null>(null);
  const profPaused = useRef(false);
  const stopOpts = useRef<StopOpts>({ stopSubs: true, stopLate: false, stopBehind: false, autoSubs: false });
  stopOpts.current = {
    stopSubs: optOn(settings, 'matchStopSubs'), stopLate: optOn(settings, 'matchStopLate'),
    stopBehind: optOn(settings, 'matchStopBehind'), autoSubs: optOn(settings, 'matchAutoSubs'),
  };
  const stopCheck = useMemo(() => makeStopCheck(sim, side, () => stopOpts.current), [sim, side]);
  const { state, act, setPaused, finishHalftime, skip } = useTicker(sim, nar, {
    speed, suspense, halftimeTalk: optOn(settings, 'matchHalftimeTalk'), stopCheck,
  });
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  useEffect(() => { if (state.ended && !outcome) setOutcome(onComplete()); }, [state.ended]);

  // Co-Trainer (Option „Automatische Auswechslungen“) in der Engine setzen
  const t = sim.team(side);
  t.coach = { autoSubs: stopOpts.current.autoSubs };

  // Tempo merken (gilt auch beim nächsten Spiel)
  useEffect(() => { if (speed !== settings.matchTextSpeed) onSettings({ ...settings, matchTextSpeed: speed }); }, [speed]);

  // Leertaste = Pause (nicht, solange der Wechsel-Bildschirm offen ist)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || cs || state.halftimePending || state.stop || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault(); setPaused(!state.paused);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, setPaused, cs]);

  /** Spielerprofil öffnen: Ticker hält solange an. */
  function setProfile(id: string | null) {
    if (id && !profile) { profPaused.current = state.paused; setPaused(true); }
    if (!id && profile && !changesOpen) setPaused(profPaused.current);
    setProfileRaw(id);
  }
  const forced = !state.ended && (state.halftimePending || !!state.stop);
  const changesOpen = forced || !!cs;
  const openChanges = (tab?: ChangesTab, pane?: 'system' | 'taktik') => {
    if (state.ended || sim.finished || sim.phase === 'shootout') return;
    setCs({ tab, pane, wasPaused: state.paused });
    setPaused(true);
  };
  const closeChanges = (apply?: () => void) => {
    if (apply) act(apply);
    const was = cs?.wasPaused ?? false;
    setCs(null);
    if (forced) finishHalftime(); else setPaused(was);
  };
  const prof = profile ? g.players[profile] : null;

  return (
    <div className="ms-root tm-root">
      <div className="ms-top">
        <div className="ms-top-l">
          <Icon name="matchball" size={30} />
          <span className="ms-comp">Textmodus</span>
          <span className="ms-dim">{fmtDateFull(info.date)}</span>
          <span className="ms-dim"><Icon name="weather" size={22} /> {WEATHER[sim.weather] ?? sim.weather}</span>
          <span className="ms-dim">{sim.attendance.toLocaleString('de-DE')} Zuschauer</span>
          {sim.derby && <span className="ms-pill">Derby</span>}
          {state.paused && !changesOpen && <span className="ms-pill">Pause</span>}
        </div>
        <div className="ms-top-r">
          <button type="button" className="btn-primary tm-change-btn" onClick={() => openChanges()} disabled={state.ended || sim.phase === 'shootout'}>
            <Icon name="swap" size={22} /> Wechsel / Taktik
          </button>
        </div>
      </div>

      <div className="tm-main">
        <div className="tm-left">
          <Stage g={g} sim={sim} info={info} score={state.score} pens={state.pens} clock={state.clock}
            revealing={state.revealing} shownSeq={state.shownSeq} history={state.history} current={state.current} />
          <TickerList sim={sim} history={state.history} current={state.current} revealing={state.revealing} mySide={side} onPlayer={setProfile} />
        </div>
        <div className="tm-right">
          <RefereeBox sim={sim} info={info} />
          <div className="ms-panel tm-rpanel">
            <div className="tm-tabs" role="tablist">
              {RTABS.map(([id, label]) => (
                <button key={id} role="tab" aria-selected={rtab === id} className={rtab === id ? 'on' : ''} onClick={() => setRtab(id)}>{label}</button>
              ))}
            </div>
            <div className="tm-rbody">
              {rtab === 'team' && <LineupBoard sim={sim} mySide={side} view={side} act={act} onPlayer={setProfile} />}
              {rtab === 'gegner' && <LineupBoard sim={sim} mySide={side} view={opp} act={act} onPlayer={setProfile} />}
              {rtab === 'taktik' && <div className="tm-pad"><TacticsPanel sim={sim} side={side} act={act} /></div>}
              {rtab === 'stats' && <div className="tm-pad"><StatsPanel sim={sim} /></div>}
              {rtab === 'live' && <TablePanel g={g} sim={sim} info={info} live />}
              {rtab === 'tabelle' && <TablePanel g={g} sim={sim} info={info} live={false} />}
            </div>
          </div>
          <div className="tm-actions">
            <div className="tm-act-grid">
              <button type="button" className="ms-btn" onClick={() => openChanges('gespraeche')} disabled={state.ended}>Individuelle Anweisungen</button>
              <button type="button" className="ms-btn" onClick={() => openChanges('aufstellung', 'system')} disabled={state.ended}>Aufstellung</button>
              <button type="button" className="ms-btn" onClick={() => openChanges('aufstellung', 'taktik')} disabled={state.ended}>Taktik</button>
              <button type="button" className="ms-btn" onClick={() => setRtab('stats')}>Statistikzentrale</button>
              <button type="button" className={`ms-btn ${optsOpen ? 'on' : ''}`} onClick={() => setOptsOpen(!optsOpen)}>Einstellungen</button>
            </div>
            <div className="tm-round">
              <button type="button" className="tm-rbtn" onClick={() => setPaused(!state.paused)} disabled={state.ended}
                aria-label={state.paused ? 'Weiter' : 'Pause'}><Icon name={state.paused ? 'play' : 'pause'} size={30} /></button>
              <button type="button" className="tm-rbtn" onClick={skip} disabled={state.ended || changesOpen}
                aria-label={sim.period === 1 ? 'Bis zur Pause vorspulen' : 'Bis zum Ende vorspulen'}><Icon name="skip" size={30} /></button>
            </div>
          </div>
          {optsOpen && (
            <div className="tm-opt-pop">
              <OptionsBox settings={settings} onSettings={onSettings} speed={speed} onSpeed={setSpeed} />
            </div>
          )}
        </div>
      </div>

      {changesOpen && !state.ended && (
        <ChangesScreen sim={sim} side={side} reason={state.stop} halftime={state.halftimePending}
          initialTab={cs?.tab} initialPane={cs?.pane}
          autoSubs={stopOpts.current.autoSubs} onAutoSubs={(v) => onSettings({ ...settings, matchAutoSubs: v })}
          onConfirm={(apply) => closeChanges(apply)} onCancel={() => closeChanges()} onPlayer={setProfile} />
      )}
      {state.ended && <EndPanel g={g} sim={sim} side={side} outcome={outcome} onClose={onFinish} />}
      {prof && (
        <div className="tm-profile">
          <PlayerModal player={prof} club={g.clubs[prof.clubId]} today={g.calendar.currentDate} season={g.season} onClose={() => setProfile(null)} />
        </div>
      )}
    </div>
  );
}
