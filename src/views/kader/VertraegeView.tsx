import PlayerModal from '../../components/PlayerModal';
import { CalendarEngine } from '../../engine/calendar';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDM, vColor } from '../../ui/format';
import { PlayerRow, monthsUntil } from '../shared';
import { useState } from 'react';

// =============================================================================
// VERTRÄGE — Vertragsliste, auslaufende Verträge, Gehaltsstruktur, Zufriedenheit
// =============================================================================
export function VertraegeView({ g }: { g: Game }) {
  const [sel, setSel] = useState<string | null>(null);
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean)
    .sort((a, b) => a.contract.expiryDate.localeCompare(b.contract.expiryDate) || b.overall - a.overall);
  const wages = squad.reduce((s, p) => s + p.contract.weeklyWage, 0);
  const value = squad.reduce((s, p) => s + p.contract.transferValue, 0);
  const expiring = squad.filter((p) => monthsUntil(today, p.contract.expiryDate) <= 12);
  const byWage = [...squad].sort((a, b) => b.contract.weeklyWage - a.contract.weeklyWage);
  const unhappy = [...squad].sort((a, b) => a.contract.satisfaction - b.contract.satisfaction).slice(0, 5);
  const avgSat = squad.length ? Math.round(squad.reduce((s, p) => s + p.contract.satisfaction, 0) / squad.length) : 0;
  const p = sel ? g.players[sel] : null;

  return (
    <DashPage>
      <DashBox title="Laufende Verträge" icon="contracts" span={2} rows={2} flush right={`${squad.length} Spieler`}>
        <table className="dtable">
          <thead><tr>
            <th>Spieler</th><th className="ctr">Pos</th><th className="num">Alter</th><th className="num">Stärke</th>
            <th className="num">Gehalt/Wo.</th><th className="num">Vertrag bis</th><th className="num">Rest</th>
            <th className="num">Marktwert</th><th className="num">Klausel</th><th className="num">Zufr.</th>
          </tr></thead>
          <tbody>
            {squad.map((pl) => {
              const m = monthsUntil(today, pl.contract.expiryDate);
              return (
                <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                  <td className="nowrap" style={{ fontWeight: 700 }}>{pl.fullName}</td>
                  <td className="ctr"><span className="pos-badge">{pl.naturalPosition}</span></td>
                  <td className="num">{pl.age}</td>
                  <td className="num" style={{ color: vColor(pl.overall), fontWeight: 800 }}>{pl.overall}</td>
                  <td className="num">{fmtDM(pl.contract.weeklyWage)}</td>
                  <td className="num nowrap">{CalendarEngine.formatDate(pl.contract.expiryDate)}</td>
                  <td className="num" style={{ color: m <= 6 ? 'var(--red)' : m <= 12 ? 'var(--yellow)' : undefined, fontWeight: 700 }}>{m} M.</td>
                  <td className="num" style={{ color: 'var(--accent)' }}>{fmtDM(pl.contract.transferValue)}</td>
                  <td className="num muted">{pl.contract.releaseClause ? fmtDM(pl.contract.releaseClause) : '–'}</td>
                  <td className="num" style={{ color: vColor(pl.contract.satisfaction) }}>{Math.round(pl.contract.satisfaction)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Gehaltsstruktur" icon="finances">
        <div className="dkpis">
          <Kpi value={fmtDM(wages)} label="pro Woche" />
          <Kpi value={fmtDM(value)} label="Kaderwert" />
        </div>
        <KV k="Gehaltsbudget / Woche" v={fmtDM(club.finances.wageBudget)} />
        <Meter label="Budget ausgeschöpft" value={wages} max={Math.max(1, club.finances.wageBudget)}
          text={`${Math.round((wages / Math.max(1, club.finances.wageBudget)) * 100)} %`} color={wages > club.finances.wageBudget ? 'var(--red)' : undefined} />
        <div className="dsec">Topverdiener</div>
        {byWage.slice(0, 3).map((x) => <PlayerRow key={x.id} p={x} value={fmtDM(x.contract.weeklyWage)} color="var(--text-1)" onClick={() => setSel(x.id)} />)}
      </DashBox>

      <DashBox title="Handlungsbedarf" icon="negotiations" right={`Ø Zufriedenheit ${avgSat}`}>
        <div className="dsec">Laufen in 12 Monaten aus ({expiring.length})</div>
        {expiring.length ? expiring.slice(0, 5).map((x) => (
          <PlayerRow key={x.id} p={x} sub={CalendarEngine.formatDate(x.contract.expiryDate)} value={`${monthsUntil(today, x.contract.expiryDate)} M.`} color="var(--yellow)" onClick={() => setSel(x.id)} />
        )) : <Empty icon="contracts">Keine Verträge laufen bald aus.</Empty>}
        <div className="dsec">Unzufriedenste Spieler</div>
        {unhappy.map((x) => <PlayerRow key={x.id} p={x} value={Math.round(x.contract.satisfaction)} onClick={() => setSel(x.id)} />)}
        <div className="dnote mt8">Vertragsverlängerungen folgen in einem späteren Ausbau.</div>
      </DashBox>

      {p && <PlayerModal player={p} club={club} squad={squad} today={today} season={g.season} onClose={() => setSel(null)} />}
    </DashPage>
  );
}
