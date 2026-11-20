// Länderprofil › Ligen: Tabellen der 1. und 2. Liga (laufend bzw. letzte Saison) |
// Meister & Pokalsieger je Saison · Rekordmeister + Sprung zu Statistiken › Liga.
// Daten: game/countryProfile.ts (countryLeagues → game/competitionCountry.ts countrySnapshot).
import { useMemo } from 'react';
import { leagueLabel, leagueName } from '../../data/leagueNames';
import { countryHolders, countryLeagues, titleCounts } from '../../game/countryProfile';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { TeamName } from '../../views/statistiken/competition/parts';
import { presetCompetition } from '../../views/statistiken/competition/CompetitionPage';
import { MiniTable, type CountryTabProps } from './parts';

export default function LeaguesTab({ g, c, onGoto }: CountryTabProps) {
  const lg = useMemo(() => countryLeagues(g, c), [g, c]);
  const holders = useMemo(() => countryHolders(g, c), [g, c]);
  if (c.kind === 'none') {
    return <DashBox title="Ligen" span={3} rows={2}><Empty icon="stats">Die Ligen von {c.name} laufen im Spiel nicht mit – keine Daten.</Empty></DashBox>;
  }
  const [a, b] = lg?.snaps ?? [];
  const record = titleCounts(holders).slice(0, 4);
  const open = () => { if (!lg) return; presetCompetition(lg.season, lg.preset); onGoto?.('table'); };

  return (
    <>
      <DashBox title={a?.label ?? leagueLabel(c.cc, 1)} rows={2} flush right={a ? lg?.season : undefined}>
        {a ? <MiniTable g={g} snap={a} /> : <Empty icon="stats">Keine Tabelle gespeichert.</Empty>}
      </DashBox>
      <DashBox title={b?.label ?? leagueLabel(c.cc, 2)} rows={2} flush right={b ? lg?.season : undefined}>
        {b ? <MiniTable g={g} snap={b} /> : <Empty icon="stats">Keine zweite Liga im Spiel.</Empty>}
      </DashBox>
      <DashBox title="Meister & Pokalsieger" flush right={holders.length ? `${holders.length} Saisons` : undefined}>
        {holders.length ? (
          <div className="cnx-scroll">
            <table className="dtable cnx-table cnx-holders">
              <thead><tr><th>Saison</th><th>Meister</th><th>Pokal</th></tr></thead>
              <tbody>
                {holders.map((h) => (
                  <tr key={h.season} className={h.before ? 'before' : ''}>
                    <td className="cnx-season">{h.season}</td>
                    <td className="cnx-team">{h.champ ? <TeamName g={g} id={h.champ} season={h.season} size={16} /> : '–'}</td>
                    <td className="cnx-team">{h.cup ? <TeamName g={g} id={h.cup} season={h.season} size={16} /> : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon="trophy">Keine Meister bekannt.</Empty>}
      </DashBox>
      <DashBox title="Rekordmeister">
        {record.length ? record.map((r) => <KV key={r.clubId} k={<TeamName g={g} id={r.clubId} season={g.season} size={16} />} v={`${r.champ}× Meister${r.cup ? ` · ${r.cup}× Pokal` : ''}`} />)
          : <div className="dnote">Keine Daten.</div>}
        <div className="dnote mt8">Bekannte Saisons: Weltdaten vor deinem Start (grau) und alle seitdem.</div>
        {!!lg?.moreGroups.length && <div className="dnote mt8">Die {leagueName(c.cc, 2)} spielt in Staffeln – {lg.moreGroups.join(', ')} unter Statistiken › Liga.</div>}
        {lg && onGoto && <button type="button" className="b3 b3-s cnx-goto" onClick={open}>Statistiken › Liga öffnen</button>}
      </DashBox>
    </>
  );
}
