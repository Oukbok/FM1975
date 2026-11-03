// =============================================================================
// Top-Transfers: Zeitungsseite im Blattstil der Presse (Blattname je Epoche aus
// game/press/calendar.ts) – Podest der drei stärksten Neuzugänge der eigenen Liga
// und Top 10 als Tabelle. Erste Seite nach dem Fensterschluss, sonst über den
// Knopf „Top-Transfers“ der Transferbilanz.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { mastheadFor } from '../../../game/press/calendar';
import type { Game } from '../../../game/state';
import type { TLRow } from '../../../game/transferLogView';
import { vColor } from '../../../ui/format';
import { AnyCrest, ClubCell, Face, feeText, fmtDate, PlayerName } from './parts';

const eraClass = (year: number) => (year < 1986 ? 'np-e1' : year < 1998 ? 'np-e2' : year < 2012 ? 'np-e3' : 'np-e4');

function Podium({ g, r, n, onOpen }: { g: Game; r: TLRow; n: number; onOpen: (id: string) => void }) {
  return (
    <div className={`tt-pod ${r.own ? 'me' : ''}`}>
      <div className="tt-pod-stage">
        <span className="tt-pod-n">{n}</span>
        <span className={`tt-pod-face ${r.player ? 'clickable' : ''}`} onClick={() => r.player && onOpen(r.e.p)}><Face g={g} row={r} size={112} /></span>
        <span className="tt-pod-crest"><ClubLink id={r.toId}><AnyCrest g={g} id={r.toId} size={58} /></ClubLink></span>
      </div>
      <div className="tt-pod-name"><PlayerName row={r} onOpen={onOpen} /></div>
      <div className="tt-pod-club"><ClubLink id={r.toId}>{r.toName}</ClubLink></div>
      <div className="tt-pod-kv"><span>Alter</span><b>{r.e.age}</b></div>
      <div className="tt-pod-kv"><span>Stärke</span><b style={{ color: vColor(r.e.ov) }}>{r.e.ov}</b></div>
      <div className="tt-pod-kv"><span>Ablöse</span><b>{feeText(r)}</b></div>
    </div>
  );
}

export function TopTransfersPage({ g, league, label, date, rows, onOpen }: {
  g: Game; league: string; label: string; date: string; rows: TLRow[]; onOpen: (id: string) => void;
}) {
  const year = Number(date.slice(0, 4));
  const mast = mastheadFor(year);
  return (
    <div className={`tt-sheet np-sheet ${eraClass(year)}`}>
      <header className="np-mast tt-mast">
        <div className="np-mast-l">Transferfenster<br />{label}</div>
        <div className="np-mast-c"><div className="np-name">{mast.name}</div><div className="np-claim">{mast.claim}</div></div>
        <div className="np-mast-r">{mast.name}<br />{fmtDate(date)}</div>
      </header>
      <h1 className="tt-title">Top-Transfers</h1>
      <section className="tt-box">
        <div className="tt-league">{league}</div>
        {rows.length ? (
          <>
            <div className="tt-podium">{rows.slice(0, 3).map((r, i) => <Podium key={r.i} g={g} r={r} n={i + 1} onOpen={onOpen} />)}</div>
            <table className="dtable tt-table">
              <thead><tr>
                <th className="num">Pl.</th><th>Spieler</th><th className="ctr">Position</th><th className="num">Alter</th><th className="num">Stärke</th>
                <th className="num">Ablöse</th><th>Vorher</th><th>Neu</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.i} className={r.own ? 'me' : ''}>
                    <td className="num rl-rank">{i + 1}</td>
                    <td className="nowrap rl-name"><PlayerName row={r} onOpen={onOpen} /></td>
                    <td className="ctr"><span className="pos-badge">{r.e.pos}</span></td>
                    <td className="num">{r.e.age}</td>
                    <td className="num"><b style={{ color: vColor(r.e.ov) }}>{r.e.ov}</b></td>
                    <td className="num nowrap">{feeText(r)}</td>
                    <td className="nowrap"><ClubCell g={g} id={r.fromId} name={r.fromName} /></td>
                    <td className="nowrap"><ClubCell g={g} id={r.toId} name={r.toName} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : <div className="tw-empty">Die Vereine der {league} haben in diesem Fenster niemanden verpflichtet.</div>}
      </section>
    </div>
  );
}
