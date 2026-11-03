// =============================================================================
// Transferbilanz: linke Spalte (Liga + „Transfer des Fensters“) und die
// Nachrichten-Kästen Vertragsverlängerungen / Gerüchteküche / Trainerkarussell.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { positionSuitability } from '../../../engine/positions';
import type { Game } from '../../../game/state';
import type { TLNews, TLRow } from '../../../game/transferLogView';
import type { Position } from '../../../types';
import { vColor } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import type { InfoKey } from '../../../data/infoTexts';
import { AnyCrest, Face, feeText, fmtDate, potText } from './parts';
import PosBadge from '../../../components/PosBadge';

/** Positionen mit Stärke: Stammposition + bis zu zwei Nebenpositionen. */
function positionsOf(r: TLRow): { pos: string; v: number }[] {
  const p = r.player;
  if (!p) return [{ pos: r.e.pos, v: r.e.ov }];
  const list: Position[] = [p.naturalPosition, ...(p.secondaryPositions ?? []).filter((x) => x !== p.naturalPosition)].slice(0, 3);
  return list.map((pos, i) => ({ pos, v: i === 0 ? Math.round(p.overall) : Math.round(positionSuitability(p, pos)) }));
}

export function WindowSide({ g, league, label, top, onOpen }: { g: Game; league: string; label: string; top?: TLRow; onOpen: (id: string) => void }) {
  return (
    <aside className="tw-side">
      <div className="tw-league">
        <div className="tw-league-name">{league}</div>
        <div className="tw-league-sub">Transferfenster {label}</div>
      </div>
      <div className="tw-sec">Transfer des Fensters<InfoTip k="transferbilanz" /></div>
      {top ? (
        <div className="tw-totw">
          <div className={`tw-totw-pic ${top.player ? 'clickable' : ''}`} onClick={() => top.player && onOpen(top.e.p)}>
            <Face g={g} row={top} size={150} />
            <span className="tw-totw-crest"><ClubLink id={top.toId}><AnyCrest g={g} id={top.toId} size={68} /></ClubLink></span>
          </div>
          <div className={`tw-totw-name ${top.player ? 'clickable' : ''}`} onClick={() => top.player && onOpen(top.e.p)}>{top.e.n}</div>
          <div className="tw-kv"><span>Nationalität</span><b><span className="tw-nat">{top.e.nat}</span></b></div>
          <div className="tw-kv"><span>Potenzial</span><b>{potText(top)}</b></div>
          <div className="tw-kv"><span>Position</span><b className="tw-posrow">{positionsOf(top).map((x) => <PosBadge key={x.pos} pos={x.pos} />)}</b></div>
          <div className="tw-kv"><span>Stärke</span><b className="tw-posrow">{positionsOf(top).map((x) => <span key={x.pos} className="tw-posv" style={{ color: vColor(x.v) }}>{x.v}</span>)}</b></div>
          <div className="tw-kv"><span>Alter</span><b>{top.e.age}</b></div>
          <div className="tw-kv"><span>Ablöse</span><b>{feeText(top)}</b></div>
          <div className="tw-kv"><span>Vertragsende</span><b>{fmtDate(top.expiry)}</b></div>
          <p className="tw-totw-text">{top.e.n} wechselt von {top.fromName} zu {top.toName}.</p>
        </div>
      ) : <div className="tw-empty">Kein Wechsel in diesem Fenster.</div>}
    </aside>
  );
}

export function NewsList({ g, items, empty, onOpen }: { g: Game; items: TLNews[]; empty: string; onOpen: (id: string) => void }) {
  if (!items.length) return <div className="tw-empty sm">{empty}</div>;
  return (
    <div className="tw-news">
      {items.map((x) => (
        <div key={x.key} className={`tw-news-row ${x.clubId === g.managedClubId ? 'me' : ''}`}>
          <ClubLink id={x.clubId}><span className="tw-news-crest"><AnyCrest g={g} id={x.clubId} size={34} /></span></ClubLink>
          <span className={`tw-news-text ${x.playerId && g.players[x.playerId] ? 'clickable' : ''}`}
            onClick={() => x.playerId && g.players[x.playerId] && onOpen(x.playerId)}>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

export function NewsBox({ title, info, children }: { title: string; info?: InfoKey; children: React.ReactNode }) {
  return (
    <section className="tw-box">
      <div className="tw-box-h">{title}{info && <InfoTip k={info} />}</div>
      <div className="tw-box-b">{children}</div>
    </section>
  );
}
