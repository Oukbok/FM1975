import ClubCrest from '../../components/ClubCrest';
import ClubModal from '../../components/ClubModal';
import { seasonStartYear } from '../../data/timeline';
import { LeagueGroup, divisionLabel } from '../../engine/leagues';
import { buildClubProfile, clubView, divisionZone } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { LeagueTable, LeagueTableRow as TableRow } from '../../types';
import { DashBox, DashPage, KV, Kpi } from '../../ui/DashPage';
import { FormDots } from '../shared';
import { useState } from 'react';

// =============================================================================
// TABELLE — Liga wählbar, Ligarekorde, eigene Lage, Zonen-Legende
// =============================================================================
export function TableView({ g }: { g: Game }) {
  const divisions: { id: string; label: string; tier: number; group: LeagueGroup; table: LeagueTable }[] = [
    { id: g.leagues.playerDivision.id, label: divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group), tier: g.leagues.playerDivision.tier, group: g.leagues.playerDivision.group, table: g.table },
    // DDR-Ligen tragen einen eigenen Namen, alle anderen das Ebenen-/Staffel-Label.
    ...g.leagues.otherDivisions.map((d) => ({ id: d.id, label: d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group), tier: d.tier, group: d.group, table: d.table })),
  ];
  const gOrd = (x: LeagueGroup) => (x === 'nord' ? -1 : x === 'sued' ? 1 : 0);
  divisions.sort((a, b) => a.tier - b.tier || gOrd(a.group) - gOrd(b.group));

  const [selId, setSelId] = useState(g.leagues.playerDivision.id);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const sel = divisions.find((d) => d.id === selId) || divisions[0];
  const rows = sel.table.rows;
  const rowCount = rows.length;
  const year = seasonStartYear(g.season);
  const nameOf = (id: string) => clubView(g, id, year).name;
  const best = (f: (r: TableRow) => number, low = false) => [...rows].sort((a, b) => (low ? f(a) - f(b) : f(b) - f(a)))[0];
  const played = rows.some((r) => r.played > 0);
  const totalGoals = rows.reduce((s, r) => s + r.goalsFor, 0);
  const matches = rows.reduce((s, r) => s + r.played, 0) / 2;

  const my = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const top = g.table.rows[0];
  const relIdx = Math.max(0, g.table.rows.length - 3);
  const relRow = g.table.rows[relIdx];

  return (
    <DashPage>
      <DashBox title={`Tabelle ${g.season}`} icon="dashTabelle" span={2} rows={2} flush
        right={<select className="dselect" value={sel.id} onChange={(e) => setSelId(e.target.value)}>
          {divisions.map((d) => <option key={d.id} value={d.id}>{d.label}{d.id === g.leagues.playerDivision.id ? ' (deine Liga)' : ''}</option>)}
        </select>}>
        <table className="dtable">
          <thead><tr>
            <th className="ctr">#</th><th>Verein</th><th className="num">Sp</th><th className="num">S</th><th className="num">U</th><th className="num">N</th>
            <th className="num">Tore</th><th className="num">Diff</th><th className="num">Pkt</th><th>Form</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const c = clubView(g, r.clubId, year);
              const mine = r.clubId === g.managedClubId;
              return (
                <tr key={r.clubId} className={`clickable ${mine ? 'me' : ''}`} onClick={() => setClubModalId(r.clubId)}>
                  <td className="ctr"><span className={`pos-badge ${divisionZone(r.position, sel.tier, rowCount)}`}>{r.position}</span></td>
                  <td className="nowrap"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><ClubCrest club={c as any} size={24} />{c.name}</span></td>
                  <td className="num">{r.played}</td><td className="num">{r.won}</td><td className="num">{r.drawn}</td><td className="num">{r.lost}</td>
                  <td className="num muted">{r.goalsFor}:{r.goalsAgainst}</td>
                  <td className="num">{r.goalDifference > 0 ? '+' : ''}{r.goalDifference}</td>
                  <td className="num"><b style={{ color: 'var(--accent)' }}>{r.points}</b></td>
                  <td><FormDots form={r.form} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Deine Lage" icon="dashVerein">
        {my ? <>
          <div className="dkpis">
            <Kpi value={`${my.position}.`} label="Platz" />
            <Kpi value={my.points} label="Punkte" />
          </div>
          <KV k="Rückstand auf Platz 1" v={top && top.clubId !== my.clubId ? `${top.points - my.points} Pkt.` : 'Tabellenführer'} />
          <KV k={`Abstand zu Platz ${relRow?.position ?? "–"}`} v={relRow && my.position < relRow.position ? `${my.points - relRow.points} Pkt.` : 'Abstiegszone'} />
          <KV k="Tore" v={`${my.goalsFor}:${my.goalsAgainst}`} />
        </> : <div className="dnote">Keine Tabellendaten.</div>}
        <div className="dsec">Legende</div>
        <div className="dzones">
          {sel.tier === 1 ? <>
            <span><span className="pos-badge zone-cl" /> Landesmeister-Pokal</span>
            <span><span className="pos-badge zone-eu" /> Europa-Pokal</span>
            <span><span className="pos-badge zone-rel" /> Abstieg</span>
          </> : <>
            <span><span className="pos-badge zone-cl" /> Direktaufstieg</span>
            <span><span className="pos-badge zone-eu" /> Aufstiegs-Playoff</span>
          </>}
        </div>
      </DashBox>

      <DashBox title="Ligarekorde" icon="trophy" right={sel.label}>
        {played ? <>
          <KV k="Bester Angriff" v={`${nameOf(best((r) => r.goalsFor).clubId)} (${best((r) => r.goalsFor).goalsFor})`} />
          <KV k="Beste Abwehr" v={`${nameOf(best((r) => r.goalsAgainst, true).clubId)} (${best((r) => r.goalsAgainst, true).goalsAgainst})`} />
          <KV k="Meiste Siege" v={`${nameOf(best((r) => r.won).clubId)} (${best((r) => r.won).won})`} />
          <KV k="Meiste Remis" v={`${nameOf(best((r) => r.drawn).clubId)} (${best((r) => r.drawn).drawn})`} />
          <KV k="Schwächster Angriff" v={`${nameOf(best((r) => r.goalsFor, true).clubId)} (${best((r) => r.goalsFor, true).goalsFor})`} />
          <KV k="Tore gesamt · Ø pro Spiel" v={`${totalGoals} · ${matches ? (totalGoals / matches).toFixed(2) : '–'}`} strong />
        </> : <div className="dnote">Rekorde erscheinen nach dem ersten Spieltag.</div>}
        <div className="dnote mt8">Klicke einen Verein für sein Profil. Punkte: {g.pointSystem === '3-point' ? '3' : '2'} pro Sieg.</div>
      </DashBox>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </DashPage>
  );
}
