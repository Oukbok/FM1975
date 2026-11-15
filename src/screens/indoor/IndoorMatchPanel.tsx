// =============================================================================
// Hallen-Show: kurzer Textmodus eines eigenen Spiels – aufgebaut wie der große
// Textmodus (Wunsch Pascal): Kopf-Bühne mit Wappen, Leiste mit Stand, Torschützen,
// Chancen-Meter (springt je Zeile sofort auf 1/2/3 und fällt zurück) und Spieluhr,
// Zeitleiste mit Toren; darunter die Ereignisliste, neueste oben (scrollt intern,
// die Box wächst nie). Tempo Langsam/Normal/Schnell, „Nächste Szene“
// (Leertaste/Enter), „Zum Abpfiff“. Daten: engine/indoorMatch.ts, Kommentar: indoorScript.ts.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import type { IndoorPlay } from '../../engine/indoorMatch';
import type { Game } from '../../game/state';
import { AnyCrest } from '../../views/transfers/window/parts';
import { MeterCells } from '../match/board/DangerMeter';
import { STAGE_LABEL, fmtClock, indoorName, type TickLine } from './indoorScript';

export type TickSpeed = 'langsam' | 'normal' | 'schnell';
const MS: Record<TickSpeed, number> = { langsam: 1900, normal: 1100, schnell: 480 };

export function useIndoorTicker(lines: TickLine[], speed: TickSpeed) {
  const [shown, setShown] = useState(1);
  const done = shown >= lines.length;
  useEffect(() => {
    if (done) return;
    const last = lines[shown - 1];
    const slow = last && (last.tone === 'goal' || last.tone === 'goal-mine') ? 1.5 : 1;
    const t = setTimeout(() => setShown((s) => Math.min(lines.length, s + 1)), MS[speed] * slow);
    return () => clearTimeout(t);
  }, [shown, speed, done, lines]);
  return { shown, done, next: () => setShown((s) => Math.min(lines.length, s + 1)), toEnd: () => setShown(lines.length) };
}

export function IndoorMatchPanel({ g, play, lines, minutesLabel, speed, onSpeed, onDone }: {
  g: Game; play: IndoorPlay; lines: TickLine[]; minutesLabel: string; speed: TickSpeed;
  onSpeed: (s: TickSpeed) => void; onDone: () => void;
}) {
  const tk = useIndoorTicker(lines, speed);
  const listRef = useRef<HTMLDivElement | null>(null);
  const mid = g.managedClubId;
  const vis = lines.slice(0, tk.shown);
  const cur = vis[vis.length - 1];
  const sc = cur?.score ?? [0, 0];
  const so = cur?.so;
  const lastT = [...vis].reverse().find((l) => l.t != null)?.t ?? 0;
  const len = play.minutes * 60;
  const half = play.halves === 2 ? (lastT >= len / 2 ? '2. Hälfte' : '1. Hälfte') : 'Spielzeit';
  const m = play.match;
  const names = [indoorName(g, m.a), indoorName(g, m.b)];
  const mine: 0 | 1 | null = m.a === mid ? 0 : m.b === mid ? 1 : null;

  // Meter: springt mit jeder neuen Zeile sofort auf die Stufe und fällt nach gut der halben Taktzeit zurück.
  const [hot, setHot] = useState(true);
  useEffect(() => {
    setHot(true);
    const t = setTimeout(() => setHot(false), MS[speed] * 0.6);
    return () => clearTimeout(t);
  }, [tk.shown, speed]);
  const meterLine = hot && !tk.done ? cur : undefined;

  // Neueste Szene oben wie im großen Textmodus (Wunsch Pascal) – die Liste bleibt am Anfang stehen.
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = 0; }, [tk.shown]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay')) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (tk.done) onDone(); else tk.next(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const minOf = (l: TickLine) => (l.t == null ? '9 m' : `${Math.min(play.minutes, Math.floor(l.t / 60) + 1)}.`);
  const goals = vis.filter((l) => l.ev.kind === 'goal');
  const scorers = (s: 0 | 1) => goals.filter((l) => l.ev.side === s).map((l) => <span key={l.key}>{l.ev.who ?? names[s]} {minOf(l)}</span>);
  const sideCls = (s: 0 | 1) => `${s === 0 ? 'home' : 'away'} ${mine === s ? 'mine' : ''}`;
  const pct = (t: number) => `${(Math.min(len, Math.max(0, t)) / len) * 100}%`;
  const r = 40, c = 2 * Math.PI * r;
  const frac = tk.done ? 1 : Math.min(1, lastT / len);

  return (
    <div className="ix-match">
      <div className="tm-stage ix-stage">
        <div className="tm-comp"><div>{STAGE_LABEL[m.stage]}<span> · {minutesLabel}</span>{so && <b> · {so[0]}:{so[1]} n.N.</b>}</div></div>
        <div className="tm-stage-row">
          <AnyCrest g={g} id={m.a} size={128} />
          <div className="tm-bar">
            <div className={`tm-bar-team ${sideCls(0)}`}><span className="tm-bar-name">{names[0]}</span></div>
            <div className="tm-bar-score"><div key={`${sc[0]}-${sc[1]}`} className="ix-score">{sc[0]}<span>:</span>{sc[1]}</div></div>
            <div className={`tm-bar-team ${sideCls(1)}`}><span className="tm-bar-name">{names[1]}</span></div>
          </div>
          <AnyCrest g={g} id={m.b} size={128} />
        </div>
        <div className="tm-stage-info">
          <div className="tm-tinfo home"><div className="tm-scorers">{scorers(0)}</div></div>
          <div className="tm-stage-mid">
            <MeterCells lvl={meterLine?.danger ?? 0} side={meterLine ? (meterLine.ev.side === 0 ? 'home' : 'away') : undefined} homeName={names[0]} awayName={names[1]} />
            <div className="tm-clock" aria-label={`Spielzeit ${fmtClock(lastT)}`}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} className="tm-clock-bg" />
                <circle cx="50" cy="50" r={r} className="tm-clock-fg" strokeDasharray={`${c * frac} ${c}`} transform="rotate(-90 50 50)" />
              </svg>
              <div className="tm-clock-txt">
                {so ? <><b>{so[0]}:{so[1]}</b><span>Neunmeter</span></>
                  : tk.done ? <span>Abpfiff</span> : <><b>{fmtClock(lastT)}</b><span>{half}</span></>}
              </div>
            </div>
          </div>
          <div className="tm-tinfo away"><div className="tm-scorers">{scorers(1)}</div></div>
        </div>
        <div className="tm-tl ix-tl-bar" title="Zeitleiste: oben links genannte Mannschaft, unten rechts genannte">
          <div className="tm-tl-track">
            <div className="tm-tl-fill" style={{ width: pct(tk.done ? len : lastT) }} />
            {play.halves === 2 && <span className="tm-tl-tick half" style={{ left: '50%' }} />}
            <span className="tm-tl-ball" style={{ left: pct(tk.done ? len : lastT) }}><Icon name="matchball" size={22} /></span>
          </div>
          {goals.map((l) => (
            <span key={l.key} className={`tm-tl-mark ${l.ev.side === 0 ? 'home' : 'away'} k-goal`} style={{ left: pct(l.ev.t) }}><Icon name="matchball" size={20} /></span>
          ))}
        </div>
      </div>

      <div className="ms-panel tm-ticker ix-ticker">
        <div className="tm-tk-head"><span>Min.</span><span>Erg.</span><span /><span /><span>Ereignis</span></div>
        <div className="tm-tk-body" ref={listRef} aria-live="polite">
          {vis.slice().reverse().map((l, i) => {
            const goal = l.ev.kind === 'goal';
            const phase = l.tone === 'whistle';
            const s = l.ev.side;
            return (
              <div key={l.key} className={`tm-tk-row ${i === 0 ? 'fresh' : ''} ${goal ? 'goal' : ''} ${phase ? 'phase' : ''} ${!phase && mine === s ? 'own' : ''}`}>
                <span className="tm-tk-min">{minOf(l)}</span>
                <span className="tm-tk-score">{l.so ? `${l.so[0]}:${l.so[1]}` : `${l.score[0]}:${l.score[1]}`}</span>
                <span className="tm-tk-ico">
                  {goal || l.tone === 'so-hit' ? <Icon name="matchball" size={24} /> : phase ? <Icon name="whistle" size={24} /> : null}
                </span>
                <span className="tm-tk-crest">{!phase && <AnyCrest g={g} id={s === 0 ? m.a : m.b} size={32} />}</span>
                <div className="tm-tk-txt">
                  <div className={`tm-tk-line ${goal ? 'k-goal' : ''} ix-t-${l.tone}`}>{l.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ix-ctrl">
        <div className="seg-group ix-speed">
          {(['langsam', 'normal', 'schnell'] as TickSpeed[]).map((v) => (
            <button key={v} className={`seg-btn ${speed === v ? 'active' : ''}`} onClick={() => onSpeed(v)}>
              {v === 'langsam' ? 'Langsam' : v === 'normal' ? 'Normal' : 'Schnell'}
            </button>
          ))}
        </div>
        <span className="ix-ctrl-gap" />
        {!tk.done && <button className="ix-btn" onClick={tk.toEnd}><Icon name="skip" size={22} /> Zum Abpfiff</button>}
        {tk.done
          ? <button className="ix-btn primary" onClick={onDone}>Weiter</button>
          : <button className="ix-btn primary" onClick={tk.next} title="Leertaste">Nächste Szene</button>}
      </div>
    </div>
  );
}
