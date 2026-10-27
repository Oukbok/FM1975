import ClubCrest from '../../components/ClubCrest';
import ClubModal from '../../components/ClubModal';
import { CalendarEngine } from '../../engine/calendar';
import { buildClubProfile } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { Match } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi } from '../../ui/DashPage';
import { resultFor } from '../shared';
import { useState } from 'react';

// =============================================================================
// SPIELPLAN — eigene Saison, Bilanz Heim/Auswärts, Spieltag der Liga
// =============================================================================
function bilanz(ms: Match[], clubId: string) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of ms) {
    if (!m.result) continue;
    const home = m.homeClubId === clubId;
    gf += home ? m.result.homeGoals : m.result.awayGoals;
    ga += home ? m.result.awayGoals : m.result.homeGoals;
    const r = resultFor(m, clubId);
    if (r === 'W') w++; else if (r === 'D') d++; else l++;
  }
  return { w, d, l, gf, ga, n: w + d + l };
}

export function FixturesView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const mid = g.managedClubId;
  const myMatches = g.fixtures.filter((m) => m.involvesPlayerClub).sort((a, b) => a.matchday - b.matchday);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const played = myMatches.filter((m) => m.status === 'finished');
  const home = bilanz(played.filter((m) => m.homeClubId === mid), mid);
  const away = bilanz(played.filter((m) => m.awayClubId === mid), mid);
  const lastMd = played.length ? played[played.length - 1].matchday : null;
  const nextMd = myMatches.find((m) => m.status === 'scheduled')?.matchday ?? null;
  const showMd = lastMd ?? nextMd;
  const mdMatches = showMd != null ? g.fixtures.filter((m) => m.matchday === showMd) : [];
  const ptsHome = g.pointSystem === '3-point' ? 3 : 2;

  return (
    <DashPage>
      <DashBox title={`Spielplan ${g.season}`} icon="schedule" span={2} rows={2} right={`${played.length} von ${myMatches.length} gespielt`} flush>
        <table className="dtable">
          <thead><tr><th className="ctr">ST</th><th>Datum</th><th className="ctr">Ort</th><th>Gegner</th><th className="ctr">Ergebnis</th><th /></tr></thead>
          <tbody>
            {myMatches.map((m) => {
              const isHome = m.homeClubId === mid;
              const oppId = isHome ? m.awayClubId : m.homeClubId;
              const opp = g.clubs[oppId];
              const r = resultFor(m, mid);
              const score = m.result ? (isHome ? `${m.result.homeGoals}:${m.result.awayGoals}` : `${m.result.awayGoals}:${m.result.homeGoals}`) : '–:–';
              return (
                <tr key={m.id} className={m.matchday === nextMd ? 'me' : ''}>
                  <td className="ctr"><b>{m.matchday}</b></td>
                  <td className="nowrap muted">{CalendarEngine.formatDate(m.date)}</td>
                  <td className="ctr">{isHome ? 'Heim' : 'Ausw.'}</td>
                  <td className="clickable" style={{ cursor: 'pointer' }} onClick={() => setClubModalId(oppId)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{opp && <ClubCrest club={opp} size={24} />}{opp?.name}</span>
                  </td>
                  <td className="ctr"><span className={`dres ${r ? 'dres-' + r : ''}`}>{score}</span></td>
                  <td className="num">{m.status === 'finished' && <button className="dchip" onClick={() => onWatch(m.id)}>Bericht</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Saisonbilanz" icon="stats">
        <div className="dkpis">
          <Kpi value={`${home.w + away.w}-${home.d + away.d}-${home.l + away.l}`} label="S-U-N" />
          <Kpi value={`${home.gf + away.gf}:${home.ga + away.ga}`} label="Tore" />
        </div>
        <KV k="Heim (S-U-N, Tore)" v={`${home.w}-${home.d}-${home.l} · ${home.gf}:${home.ga}`} />
        <KV k="Auswärts (S-U-N, Tore)" v={`${away.w}-${away.d}-${away.l} · ${away.gf}:${away.ga}`} />
        <KV k="Punkte Heim / Auswärts" v={`${home.w * ptsHome + home.d} / ${away.w * ptsHome + away.d}`} />
        <KV k="Ø Tore pro Spiel" v={played.length ? ((home.gf + away.gf) / played.length).toFixed(2) : '–'} />
      </DashBox>

      <DashBox title={showMd != null ? `${showMd}. Spieltag` : 'Spieltag'} icon="dashTabelle" right={lastMd ? 'Ergebnisse' : 'Paarungen'}>
        {mdMatches.length ? mdMatches.map((m) => (
          <div key={m.id} className={`dlist-row ${m.involvesPlayerClub ? 'clickable' : ''}`} onClick={() => m.status === 'finished' && onWatch(m.id)}>
            <span className="grow" style={{ textAlign: 'right', fontWeight: m.homeClubId === mid ? 900 : 500 }}>{g.clubs[m.homeClubId]?.shortName}</span>
            <span className="dres">{m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : '–:–'}</span>
            <span className="grow" style={{ fontWeight: m.awayClubId === mid ? 900 : 500 }}>{g.clubs[m.awayClubId]?.shortName}</span>
          </div>
        )) : <Empty icon="schedule">Kein Spieltag.</Empty>}
      </DashBox>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </DashPage>
  );
}
