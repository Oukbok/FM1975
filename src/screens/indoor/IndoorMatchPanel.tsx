// =============================================================================
// Hallen-Show: kurzer Textmodus eines eigenen Spiels. Anzeigetafel (Wappen, Stand,
// Spieluhr, Neunmeter), darunter die Tickerzeilen (Inhalt scrollt intern, die Box
// wächst nie). Tempo Langsam/Normal/Schnell, „Nächste Szene“ (Leertaste/Enter),
// „Zum Abpfiff“. Daten: engine/indoorMatch.ts, Kommentar: indoorScript.ts.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import type { IndoorPlay } from '../../engine/indoorMatch';
import type { Game } from '../../game/state';
import { AnyCrest } from '../../views/transfers/window/parts';
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
  const half = play.halves === 2 ? (lastT >= (play.minutes * 60) / 2 ? '2. Hälfte' : '1. Hälfte') : minutesLabel;
  const m = play.match;

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tk.shown]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay')) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (tk.done) onDone(); else tk.next(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const side = (id: string, right: boolean) => (
    <div className={`ix-tb-side ${right ? 'r' : ''} ${id === mid ? 'me' : ''}`}>
      <span className="ix-tb-crest"><AnyCrest g={g} id={id} size={96} /></span>
      <span className="ix-tb-name">{indoorName(g, id)}</span>
    </div>
  );

  return (
    <div className="ix-match">
      <div className="ix-tb">
        {side(m.a, false)}
        <div className="ix-tb-mid">
          <div className="ix-tb-stage">{STAGE_LABEL[m.stage]}</div>
          <div className="ix-tb-score" key={`${sc[0]}-${sc[1]}`}>{sc[0]}<span>:</span>{sc[1]}</div>
          {so ? <div className="ix-tb-so">Neunmeter {so[0]}:{so[1]}</div>
            : <div className="ix-tb-clock">{fmtClock(lastT)} <span>· {tk.done ? 'Abpfiff' : half}</span></div>}
        </div>
        {side(m.b, true)}
      </div>

      <div className="ix-ticker" ref={listRef} aria-live="polite">
        {vis.map((l) => (
          <div key={l.key} className={`ix-tl tone-${l.tone}`}>
            <span className="ix-tl-min">{l.t == null ? '9 m' : `${Math.min(play.minutes, Math.floor(l.t / 60) + 1)}.`}</span>
            <span className="ix-tl-txt">{l.text}</span>
            {(l.tone === 'goal' || l.tone === 'goal-mine') && <span className="ix-tl-score">{l.score[0]}:{l.score[1]}</span>}
          </div>
        ))}
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
