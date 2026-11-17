// Reiter „Transfers“ (Wunsch Pascal): Wechsel je Saison in vier Boxen
// Zugänge | Abgänge | Verliehen | Geliehen. Saison = Saison des Wechseltags
// (game/clubTransfers.ts); Pfeile blättern einzeln, Auswahlliste springt.
import { useState } from 'react';
import { clubTransfersOf, transferSeasons, type ClubTransferRow } from '../../game/clubTransfers';
import type { Game } from '../../game/state';
import { DashBox, Empty } from '../../ui/DashPage';
import { fmtPrice, vColor } from '../../ui/format';
import Select from '../../ui/Select';
import Icon from '../Icon';
import PosBadge from '../PosBadge';
import { PlayerLink } from '../playerMenu/PlayerLink';
import { ClubCell, fmtDate } from '../../views/transfers/window/parts';
import type { ClubTabProps } from './shared';

const clubName = (g: Game, id: string) => g.clubs[id]?.name ?? g.simClubs?.[id]?.name ?? g.euroClubs?.[id]?.name;

function feeOf(r: ClubTransferRow): string {
  if (r.kind === 'back') return 'Leih-Ende';
  if (r.kind === 'loan') return r.fee > 0 ? fmtPrice(r.fee) : 'ohne Gebühr';
  return r.fee > 0 ? fmtPrice(r.fee) : 'ablösefrei';
}

function TransferList({ g, rows, dir, empty }: { g: Game; rows: ClubTransferRow[]; dir: 'von' | 'zu'; empty: string }) {
  if (!rows.length) return <Empty icon="swap">{empty}</Empty>;
  const sorted = [...rows].sort((a, b) => b.fee - a.fee || b.ov - a.ov);
  return (
    <table className="dtable rl-sm ctr-table">
      <thead><tr>
        <th>Spieler</th><th className="ctr">Pos.</th><th className="num">Stärke</th><th className="num">Alter</th>
        <th>{dir === 'von' ? 'Von' : 'Zu'}</th><th className="num">Datum</th><th className="num">Ablöse</th>
      </tr></thead>
      <tbody>
        {sorted.map((r) => {
          const known = !!(g.players[r.pid] ?? g.youthPlayers?.[r.pid]);
          const nm = clubName(g, r.other);
          return (
            <tr key={`${r.date}${r.pid}`} data-pid={known ? r.pid : undefined}>
              <td className="nowrap rl-name">{known ? <PlayerLink id={r.pid}>{r.name}</PlayerLink> : r.name}</td>
              <td className="ctr"><PosBadge pos={r.pos} /></td>
              <td className="num"><b style={{ color: vColor(r.ov) }}>{r.ov}</b></td>
              <td className="num">{r.age}</td>
              <td className="nowrap"><ClubCell g={g} id={nm ? r.other : undefined} name={nm ?? r.other} size={22} /></td>
              <td className="num nowrap">{fmtDate(r.date).slice(0, 6)}</td>
              <td className="num nowrap">{feeOf(r)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const sum = (rs: ClubTransferRow[]) => rs.reduce((a, r) => a + (r.kind === 'back' ? 0 : r.fee), 0);

export default function TransfersTab({ g, d }: ClubTabProps) {
  const seasons = transferSeasons(g);
  const [season, setSeason] = useState(g.season);
  const i = Math.max(0, seasons.indexOf(season));
  const cur = seasons[i] ?? g.season;
  const t = clubTransfersOf(g, d.clubId, cur);
  const spent = sum(t.ins), earned = sum(t.outs);
  return (
    <>
      <div className="ctr-bar">
        <button className="b3 b3-icon" disabled={i >= seasons.length - 1} onClick={() => setSeason(seasons[i + 1])} title="Vorherige Saison" aria-label="Vorherige Saison">
          <Icon name="navPrev" size={18} />
        </button>
        <Select value={cur} onChange={setSeason} width={170} options={seasons.map((s) => ({ value: s, label: `Saison ${s}` }))} />
        <button className="b3 b3-icon" disabled={i <= 0} onClick={() => setSeason(seasons[i - 1])} title="Nächste Saison" aria-label="Nächste Saison">
          <Icon name="navNext" size={18} />
        </button>
        <span className="ctr-sum">
          Ausgaben <b>{fmtPrice(spent)}</b> · Einnahmen <b>{fmtPrice(earned)}</b> · Bilanz <b className={earned - spent >= 0 ? 'pos' : 'neg'}>{earned - spent >= 0 ? '+' : '−'}{fmtPrice(Math.abs(earned - spent))}</b>
        </span>
      </div>
      <DashBox title="Zugänge" right={`${t.ins.length}`} flush><TransferList g={g} rows={t.ins} dir="von" empty="Keine Zugänge in dieser Saison." /></DashBox>
      <DashBox title="Abgänge" right={`${t.outs.length}`} flush><TransferList g={g} rows={t.outs} dir="zu" empty="Keine Abgänge in dieser Saison." /></DashBox>
      <DashBox title="Verliehen" right={`${t.loanedOut.length}`} flush><TransferList g={g} rows={t.loanedOut} dir="zu" empty="Kein Spieler verliehen." /></DashBox>
      <DashBox title="Geliehen" right={`${t.loanedIn.length}`} flush><TransferList g={g} rows={t.loanedIn} dir="von" empty="Kein Spieler ausgeliehen." /></DashBox>
    </>
  );
}
