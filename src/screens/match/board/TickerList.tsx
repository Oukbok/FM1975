// =============================================================================
// Ereignisliste des Textmodus (Vorbild EA-Textmodus): Tabelle Min. | Erg. |
// Symbol | Wappen | Ereignis. Jede Szene ist ein Block – Aufbau, Verlauf und
// Abschluss untereinander –, neueste oben. Spielernamen mit Position, farbig
// je Team; Tore fett mit Saisontor-Zähler. Reiter filtern die Liste.
// =============================================================================
import { useEffect, useState, type ReactNode } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import Icon from '../../../components/Icon';
import type { MatchSim } from '../../../engine/match/sim';
import type { Side } from '../../../engine/match/types';
import { NAME_CLOSE, NAME_MID, NAME_OPEN, type Line } from '../../../data/ticker/narrator';

export type TickerFilter = 'alles' | 'highlights' | 'tore' | 'wechsel' | 'karten';
const FILTERS: [TickerFilter, string][] = [['alles', 'Alles'], ['highlights', 'Highlights'], ['tore', 'Tore'], ['wechsel', 'Wechsel'], ['karten', 'Karten']];

const PHASES = new Set(['kickoff', 'halftime', 'second_half', 'fulltime', 'et_start', 'et_half', 'et_second', 'et_end', 'shootout_start', 'shootout_end']);
const YOU = new Set(['shout', 'mentality', 'talk', 'reshape', 'ptalk', 'warmup']);

interface Block { key: number; seq?: number; minute: string; score: [number, number]; side?: Side; evk?: string; lines: Line[] }

/** Zeilen zu Szenen bündeln (gleiches Ereignis = ein Block), älteste zuerst. */
function toBlocks(oldestFirst: Line[], pending: Line | null): Block[] {
  const out: Block[] = [];
  let score: [number, number] = [0, 0];
  for (const l of oldestFirst) {
    const last = out[out.length - 1];
    if (l.score && l !== pending) score = l.score;
    if (last && l.seq != null && last.seq === l.seq) { last.lines.push(l); last.score = score; continue; }
    out.push({ key: l.id, seq: l.seq, minute: l.minute, score, side: l.side, evk: l.evk, lines: [l] });
  }
  return out;
}

const isGoal = (b: Block) => b.lines.some((l) => l.kind === 'goal' && l.scorer);
const isCard = (b: Block) => b.evk === 'card';
function matches(b: Block, f: TickerFilter): boolean {
  if (f === 'alles') return true;
  if (f === 'tore') return isGoal(b);
  if (f === 'wechsel') return b.evk === 'sub';
  if (f === 'karten') return isCard(b);
  return isGoal(b) || isCard(b) || b.evk === 'sub' || b.evk === 'injury' || PHASES.has(b.evk ?? '') || b.lines.some((l) => l.kind === 'chance' || l.kind === 'save');
}

/** „45+1'“ → „45'+1“. */
const fmtMin = (m: string) => m.replace(/^(\d+)\+(\d+)'$/, "$1'+$2");

export function TickerList({ sim, history, current, revealing, mySide, onPlayer }: {
  sim: MatchSim; history: Line[]; current: Line | null; revealing: boolean; mySide: Side; onPlayer: (id: string) => void;
}) {
  const [filter, setFilter] = useState<TickerFilter>('alles');
  const glyphs = useGlyphs(revealing, current);
  const lines = history.slice().reverse();
  const pending = revealing && current?.suspense ? current : null;
  if (pending) lines.push(pending);
  const blocks = toBlocks(lines, pending);
  // Saisontore: Stand vor dem Spiel + Tore in diesem Spiel bis zu diesem Treffer
  const goalNo = new Map<number, number>();
  const count = new Map<string, number>();
  for (const b of blocks) {
    const id = b.lines.find((l) => l.scorerId)?.scorerId;
    if (!id || !isGoal(b)) continue;
    const n = (count.get(id) ?? 0) + 1;
    count.set(id, n);
    goalNo.set(b.key, (sim.players[id]?.seasonStats?.goals ?? 0) + n);
  }
  const shown = blocks.filter((b) => matches(b, filter)).reverse();
  const newest = blocks[blocks.length - 1]?.key;

  const posOf = (id: string) => (sim.home.players.find((m) => m.id === id) ?? sim.away.players.find((m) => m.id === id));
  const rich = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let i = 0, k = 0;
    while (i < text.length) {
      const a = text.indexOf(NAME_OPEN, i);
      if (a < 0) { parts.push(text.slice(i)); break; }
      const b = text.indexOf(NAME_MID, a), c = text.indexOf(NAME_CLOSE, b);
      if (b < 0 || c < 0) { parts.push(text.slice(i)); break; }
      parts.push(text.slice(i, a));
      const id = text.slice(a + 1, b), name = text.slice(b + 1, c);
      const m = posOf(id);
      const cls = m ? (m.side === mySide ? 'mine' : 'opp') : '';
      parts.push(<button key={k++} type="button" className={`tm-n ${cls}`} onClick={() => onPlayer(id)}>{name}{m ? ` (${m.pos})` : ''}</button>);
      i = c + 1;
    }
    return parts;
  };

  return (
    <div className="ms-panel tm-ticker">
      <div className="tm-tabs" role="tablist">
        {FILTERS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <div className="tm-tk-head"><span>Min.</span><span>Erg.</span><span /><span /><span>Ereignis</span></div>
      <div className="tm-tk-body">
        {shown.map((b) => {
          const club = b.side ? sim.team(b.side).club : null;
          const goal = isGoal(b);
          const no = goalNo.get(b.key);
          const scorer = b.lines.find((l) => l.scorerId)?.scorerId;
          const red = b.lines.some((l) => l.kind === 'red');
          return (
            <div key={b.key} className={`tm-tk-row ${b.key === newest ? 'fresh' : ''} ${goal ? 'goal' : ''} ${YOU.has(b.evk ?? '') ? 'you' : ''} ${PHASES.has(b.evk ?? '') ? 'phase' : ''} ${b.side === mySide ? 'own' : b.side ? 'opp' : ''}`}>
              <span className="tm-tk-min">{fmtMin(b.minute)}</span>
              <span className="tm-tk-score">{b.score[0]}:{b.score[1]}</span>
              <span className="tm-tk-ico">
                {goal ? <Icon name="matchball" size={24} /> : isCard(b) ? <i className={`ms-card ${red ? 'r' : 'y'}`} />
                  : b.evk === 'sub' ? <Icon name="swap" size={24} /> : b.evk === 'injury' ? <Icon name="injury" size={24} />
                  : PHASES.has(b.evk ?? '') ? <Icon name="whistle" size={24} /> : YOU.has(b.evk ?? '') ? <Icon name="tactics" size={22} /> : null}
              </span>
              <span className="tm-tk-crest">{club && <ClubCrest club={club} size={32} />}</span>
              <div className="tm-tk-txt">
                {goal && scorer && (
                  <div className="tm-tk-goal">{b.score[0]}:{b.score[1]} {rich(`${NAME_OPEN}${scorer}${NAME_MID}${sim.players[scorer]?.lastName ?? ''}${NAME_CLOSE}`)}
                    {no ? <span className="tm-tk-no"> ({no}. Tor in dieser Saison)</span> : null}</div>
                )}
                {b.lines.map((l) => (
                  l.suspense
                    ? <div key={l.id} className={`tm-tk-susp ${l === pending ? 'rolling' : l.suspense.good === true ? 'good' : l.suspense.good === false ? 'bad' : ''}`}>{l === pending ? glyphs : l.suspense.word}</div>
                    : <div key={l.id} className={`tm-tk-line k-${l.kind}`}>{rich(l.text)}</div>
                ))}
              </div>
            </div>
          );
        })}
        {!shown.length && <div className="tm-ev-empty">{history.length ? 'Noch nichts in dieser Auswahl.' : 'Gleich geht es los …'}</div>}
      </div>
    </div>
  );
}

/** Flimmernde Zeichen im Spannungsmoment. */
function useGlyphs(revealing: boolean, line: Line | null): string {
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
  return glyphs;
}
