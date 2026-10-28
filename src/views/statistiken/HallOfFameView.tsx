import { Game } from '../../game/state';
import type { ArchivedPlayer } from '../../game/archive';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';

// =============================================================================
// RUHMESHALLE — Karrieren nach dem Karriereende (Spieler-Archiv)
// =============================================================================
function Row({ a, value, sub }: { a: ArchivedPlayer; value: React.ReactNode; sub?: string }) {
  return (
    <div className="dlist-row">
      <span className="pos-badge">{a.pos}</span>
      <span className="grow">{a.name}<span className="muted"> · {sub ?? `${a.born}–${a.retired}`}</span></span>
      <span className="val">{value}</span>
    </div>
  );
}

export function HallOfFameView({ g }: { g: Game }) {
  const all = g.archive ?? [];
  const byPeak = [...all].sort((a, b) => b.peak - a.peak || b.apps - a.apps).slice(0, 60);
  const mine = all.filter((a) => a.lastClubId === g.managedClubId).sort((a, b) => b.apps - a.apps || b.peak - a.peak);
  const legends = all.filter((a) => a.legendId).sort((a, b) => b.peak - a.peak);
  const topScorer = [...all].sort((a, b) => b.goals - a.goals)[0];
  const mostApps = [...all].sort((a, b) => b.apps - a.apps)[0];

  return (
    <DashPage>
      <DashBox title="Größte Karrieren" icon="trophy" span={2} rows={2} flush right={`${all.length} archiviert`}>
        {byPeak.length ? (
          <table className="dtable">
            <thead><tr>
              <th>Spieler</th><th className="ctr">Pos</th><th className="num">Jahre</th><th className="num">Spitze</th>
              <th className="num">Einsätze</th><th className="num">Tore</th><th>Stationen</th>
            </tr></thead>
            <tbody>
              {byPeak.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap" style={{ fontWeight: 700 }}>{a.name}{a.legendId && <span className="muted"> · Legende</span>}</td>
                  <td className="ctr"><span className="pos-badge">{a.pos}</span></td>
                  <td className="num nowrap">{a.born}–{a.retired}</td>
                  <td className="num" style={{ color: vColor(a.peak), fontWeight: 800 }}>{a.peak}</td>
                  <td className="num">{a.apps}</td>
                  <td className="num">{a.goals}</td>
                  <td className="muted" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.clubs.join(' → ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon="trophy">Noch hat keine bemerkenswerte Karriere geendet. Nach jedem Saisonwechsel kommen Spieler hinzu.</Empty>}
      </DashBox>

      <DashBox title="Vereinslegenden" icon="dashVerein" right={`${mine.length}`}>
        {mine.length ? mine.slice(0, 8).map((a) => <Row key={a.id} a={a} value={`${a.apps} Sp.`} />)
          : <Empty icon="dashVerein">Bei dir hat noch niemand seine Karriere beendet.</Empty>}
      </DashBox>

      <DashBox title="Rekorde & Legenden" icon="chronicle">
        {topScorer ? <KV k="Meiste Tore" v={`${topScorer.name} (${topScorer.goals})`} /> : null}
        {mostApps ? <KV k="Meiste Einsätze" v={`${mostApps.name} (${mostApps.apps})`} /> : null}
        <div className="dsec">Fiktive Legenden im Ruhestand ({legends.length})</div>
        {legends.length ? legends.slice(0, 5).map((a) => <Row key={a.id} a={a} value={<span style={{ color: vColor(a.peak) }}>{a.peak}</span>} sub={a.clubs[a.clubs.length - 1]} />)
          : <Empty icon="youth">Noch keine Legende im Ruhestand.</Empty>}
      </DashBox>
    </DashPage>
  );
}
