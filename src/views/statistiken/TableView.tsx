import ClubCrest from '../../components/ClubCrest';
import ClubModal from '../../components/ClubModal';
import { seasonStartYear } from '../../data/timeline';
import { LeagueGroup, divisionLabel } from '../../engine/leagues';
import { buildClubProfile, clubView, divisionZone } from '../../game/clubProfile';
import { Game } from '../../game/state';
import { LeagueTable } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { useState } from 'react';

export function TableView({ g }: { g: Game }) {
  // Alle wählbaren Ligen/Staffeln: Spielerliga (volle Tabelle) + Sim-Ligen.
  const divisions: { id: string; label: string; tier: number; group: LeagueGroup; table: LeagueTable }[] = [
    { id: g.leagues.playerDivision.id, label: divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group), tier: g.leagues.playerDivision.tier, group: g.leagues.playerDivision.group, table: g.table },
    // DDR-Ligen tragen einen eigenen Namen (tier 101/102) und werden klar als
    // solche beschriftet; alle anderen nutzen das generische Ebenen-/Staffel-Label.
    ...g.leagues.otherDivisions.map((d) => ({ id: d.id, label: d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group), tier: d.tier, group: d.group, table: d.table })),
  ];
  // Sortierung: Ebene, dann Nord vor Süd.
  divisions.sort((a, b) => a.tier - b.tier || (a.group === 'nord' ? -1 : a.group === 'sued' ? 1 : 0) - (b.group === 'nord' ? -1 : b.group === 'sued' ? 1 : 0));

  const [selId, setSelId] = useState(g.leagues.playerDivision.id);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const sel = divisions.find((d) => d.id === selId) || divisions[0];
  const rowCount = sel.table.rows.length;

  return (
    <div className="page">
      <PageHead icon="dashTabelle" title={<>Tabelle <span className="accent">{g.season}</span></>} />

      {/* Liga-/Staffel-Umschalter */}
      <div className="card" style={{ padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {divisions.map((d) => {
            const active = d.id === sel.id;
            const isPlayer = d.id === g.leagues.playerDivision.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelId(d.id)}
                className="btn"
                style={{
                  padding: '6px 14px', fontWeight: active ? 800 : 600,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#06121a' : 'var(--text)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                {d.label}{isPlayer ? ' ★' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>#</th><th>Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th><th>Form</th></tr>
            </thead>
            <tbody>
              {sel.table.rows.map((r) => {
                const c = clubView(g, r.clubId, seasonStartYear(g.season));
                const mine = r.clubId === g.managedClubId;
                return (
                  <tr key={r.clubId} className={mine ? 'me' : ''}>
                    <td><span className={`pos-badge ${divisionZone(r.position, sel.tier, rowCount)}`}>{r.position}</span></td>
                    <td>
                      <div
                        className="club-link"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => setClubModalId(r.clubId)}
                        title="Vereinsprofil öffnen"
                      >
                        <ClubCrest club={c as any} size={22} />
                        <span style={{ fontWeight: mine ? 800 : 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                    <td className="dim">{r.goalsFor}:{r.goalsAgainst}</td>
                    <td>{r.goalDifference > 0 ? '+' : ''}{r.goalDifference}</td>
                    <td><b className="accent-text">{r.points}</b></td>
                    <td><div className="form-row">{r.form.map((f, i) => <span key={i} className={`form-pill ${f}`}>{f}</span>)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mini dim2 mt12" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {sel.tier === 1 ? (
            <>
              <span><span className="pos-badge zone-cl" style={{ width: 16, height: 16 }}></span> Landesmeister-Pokal</span>
              <span><span className="pos-badge zone-eu" style={{ width: 16, height: 16 }}></span> UEFA-Pokal</span>
              <span><span className="pos-badge zone-rel" style={{ width: 16, height: 16 }}></span> Abstieg</span>
              <span className="dim2">Pokalsieger-Pokal: über den DFB-Pokal</span>
            </>
          ) : (
            <>
              <span><span className="pos-badge zone-cl" style={{ width: 16, height: 16 }}></span> Direktaufstieg</span>
              <span><span className="pos-badge zone-eu" style={{ width: 16, height: 16 }}></span> Aufstiegs-Playoff</span>
            </>
          )}
        </div>
      </div>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}
