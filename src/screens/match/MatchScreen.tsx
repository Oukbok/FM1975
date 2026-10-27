// =============================================================================
// TEXTMODUS – eigene Oberfläche ohne Menü. Das Spiel läuft live: Ticker mit
// Lesezeit, Spannungsmomente, Wechsel, Ausrichtung, Zurufe, Halbzeitansprache
// und zeitgemäße Statistiken. Am Ende wird das Ergebnis regulär verbucht.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import type { MatchSim } from '../../engine/match/sim';
import type { MatchOutcome } from '../../engine/match/types';
import { Narrator, type Line } from '../../data/ticker/narrator';
import type { OwnMatchInfo } from '../../game/ownMatch';
import type { Game } from '../../game/state';
import type { AppSettings } from '../../engine/save';
import { fmtDateFull } from '../../ui/format';
import { LineupPanel, Momentum, StatsPanel, TacticsPanel } from './MatchPanels';
import { EndPanel, HalftimeDialog } from './MatchDialogs';
import { useTicker, type TextSpeed } from './useTicker';

const WEATHER: Record<string, string> = {
  sonnig: 'Sonnig', bewoelkt: 'Bewölkt', regen: 'Regen', schnee: 'Schnee', hitze: 'Hitze', wind: 'Windig', nebel: 'Nebel',
};

export function MatchScreen({ g, sim, info, settings, onSettings, onComplete, onFinish }: {
  g: Game; sim: MatchSim; info: OwnMatchInfo; settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  /** Abpfiff: Ergebnis verbuchen (einmalig). */
  onComplete: () => MatchOutcome;
  /** „Weiter“ nach dem Abschluss. */
  onFinish: () => void;
}) {
  const side = info.side;
  const nar = useMemo(() => new Narrator(sim, { mySide: side, suspense: settings.matchSuspense !== false }), [sim, side]);
  const [speed, setSpeed] = useState<TextSpeed>(settings.matchTextSpeed ?? 'normal');
  const [suspense, setSuspense] = useState(settings.matchSuspense !== false);
  const [tab, setTab] = useState<'stats' | 'tactics' | 'opp'>('tactics');
  const { state, act, setPaused, finishHalftime, skip } = useTicker(sim, nar, {
    speed, suspense, halftimeTalk: settings.matchHalftimeTalk !== false,
  });
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  useEffect(() => { if (state.ended && !outcome) setOutcome(onComplete()); }, [state.ended]);

  // Geänderte Einstellungen merken (gelten auch beim nächsten Spiel)
  useEffect(() => {
    if (speed !== settings.matchTextSpeed || suspense !== (settings.matchSuspense !== false)) {
      onSettings({ ...settings, matchTextSpeed: speed, matchSuspense: suspense });
    }
  }, [speed, suspense]);

  // Leertaste = Pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setPaused(!state.paused); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, setPaused]);

  const H = sim.home.club, A = sim.away.club;
  const [hs, as] = state.score;
  const scorers = (s: 'home' | 'away') => state.history.filter((l) => l.scorer && l.side === s).reverse();

  return (
    <div className="ms-root">
      {/* ---------- Kopfzeile ---------- */}
      <div className="ms-top">
        <div className="ms-top-l">
          <Icon name="matchball" size={30} />
          <span className="ms-comp">{info.label}</span>
          <span className="ms-dim">{fmtDateFull(info.date)}</span>
          <span className="ms-dim"><Icon name="weather" size={22} /> {WEATHER[sim.weather] ?? sim.weather}</span>
          <span className="ms-dim">{sim.attendance.toLocaleString('de-DE')} Zuschauer</span>
          {sim.derby && <span className="ms-pill">Derby</span>}
        </div>
        <div className="ms-top-r">
          <div className="seg-group ms-speed">
            {(['langsam', 'normal', 'schnell'] as TextSpeed[]).map((v) => (
              <button key={v} className={`seg-btn ${speed === v ? 'active' : ''}`} onClick={() => setSpeed(v)}>
                {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
              </button>
            ))}
          </div>
          <label className="ms-toggle">
            <input type="checkbox" checked={suspense} onChange={(e) => setSuspense(e.target.checked)} />
            <span className={`toggle ${suspense ? 'on' : ''}`} /> Spannung
          </label>
          <button className="ms-btn" onClick={() => setPaused(!state.paused)} disabled={state.ended}>
            <Icon name={state.paused ? 'play' : 'pause'} size={24} /> {state.paused ? 'Weiter' : 'Pause'}
          </button>
          <button className="ms-btn" onClick={skip} disabled={state.ended || state.halftimePending}
            title="Ohne Lesepausen bis zur nächsten Unterbrechung">
            <Icon name="skip" size={24} /> {sim.period === 1 ? 'Bis zur Pause' : sim.phase === 'shootout' ? 'Auflösen' : 'Bis zum Ende'}
          </button>
        </div>
      </div>

      {/* ---------- Anzeigetafel ---------- */}
      <div className="ms-board">
        <div className={`ms-team ${side === 'home' ? 'mine' : ''}`}>
          <ClubCrest club={H} size={110} />
          <div>
            <div className="ms-tname">{H.name}</div>
            <div className="ms-scorers">{scorers('home').map((l) => <span key={l.id}>{l.scorer} {l.minute}</span>)}</div>
          </div>
        </div>
        <div className="ms-center">
          <div className={`ms-score ${state.revealing ? 'tense' : ''}`}>{hs}<span>:</span>{as}</div>
          {state.pens && <div className="ms-pens">{state.pens[0]}:{state.pens[1]} i.E.</div>}
          <div className="ms-clock">{state.clock}</div>
        </div>
        <div className={`ms-team away ${side === 'away' ? 'mine' : ''}`}>
          <div>
            <div className="ms-tname">{A.name}</div>
            <div className="ms-scorers">{scorers('away').map((l) => <span key={l.id}>{l.scorer} {l.minute}</span>)}</div>
          </div>
          <ClubCrest club={A} size={110} />
        </div>
      </div>
      <Momentum sim={sim} />

      {/* ---------- Hauptbereich ---------- */}
      <div className="ms-main">
        <LineupPanel sim={sim} side={side} mine
          onSub={(o, i) => act(() => sim.substitute(side, o, i))} />

        <div className="ms-ticker">
          <TickerNow line={state.current} revealing={state.revealing} mySide={side} />
          <div className="ms-hist">
            {state.history.filter((l) => l !== state.current && !l.suspense).map((l, i) => (
              <div key={l.id} className={`ms-line k-${l.kind} ${l.side === side ? 'own' : l.side ? 'opp' : ''} ${i === 0 ? 'fresh' : ''}`}>
                <span className="ms-min">{l.minute}</span>
                <span className="ms-txt">{l.suspense ? <b>{l.text}</b> : l.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ms-panel ms-side">
          <div className="ms-tabs">
            <button className={tab === 'tactics' ? 'on' : ''} onClick={() => setTab('tactics')}><Icon name="tactics" size={22} /> Taktik</button>
            <button className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}><Icon name="stats" size={22} /> Statistik</button>
            <button className={tab === 'opp' ? 'on' : ''} onClick={() => setTab('opp')}><Icon name="squad" size={22} /> Gegner</button>
          </div>
          <div className="ms-tabbody">
            {tab === 'tactics' && <TacticsPanel sim={sim} side={side} act={act} />}
            {tab === 'stats' && <StatsPanel sim={sim} />}
            {tab === 'opp' && <LineupPanel sim={sim} side={side === 'home' ? 'away' : 'home'} mine={false} />}
          </div>
        </div>
      </div>

      {state.halftimePending && (
        <HalftimeDialog sim={sim} side={side} onTalk={(t) => { if (t) act(() => sim.teamTalk(side, t)); finishHalftime(); }} />
      )}
      {state.ended && <EndPanel g={g} sim={sim} side={side} outcome={outcome} onClose={onFinish} />}
    </div>
  );
}

/** Aktuelle Zeile groß – mit Spannungsmoment (flimmernde Zeichen, die sich auflösen). */
function TickerNow({ line, revealing, mySide }: { line: Line | null; revealing: boolean; mySide: 'home' | 'away' }) {
  const [glyphs, setGlyphs] = useState('');
  useEffect(() => {
    if (!revealing) return;
    const chars = '#%&@$?!*+=<>/\\|ABCDEFGHKMNRSTXZ0123456789';
    const len = Math.max(6, line?.suspense?.word.length ?? 6);
    const roll = () => {
      let s = '';
      for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
      setGlyphs(s);
    };
    roll();
    const id = setInterval(roll, 55);
    return () => clearInterval(id);
  }, [revealing, line]);
  if (!line) return <div className="ms-now"><span className="ms-now-txt dim">Gleich geht es los …</span></div>;
  const s = line.suspense;
  const tone = s ? (s.good === true ? 'good' : s.good === false ? 'bad' : 'neutral') : '';
  return (
    <div className={`ms-now k-${line.kind} ${line.side === mySide ? 'own' : line.side ? 'opp' : ''}`}>
      <span className="ms-now-min">{line.minute}</span>
      {s ? (
        revealing
          ? <span className="ms-susp">{glyphs}</span>
          : <span key={line.id} className={`ms-reveal ${tone}`}>{s.word}</span>
      ) : (
        <span key={line.id} className="ms-now-txt">{line.text}</span>
      )}
    </div>
  );
}
