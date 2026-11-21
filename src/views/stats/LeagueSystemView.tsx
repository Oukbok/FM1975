import { leagueName } from '../../data/leagueNames';
import { useMemo } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { worldLeagueOverview } from '../../game/competitionCountry';
import { leagueRepLabel } from '../../game/leagueRepGame';
import { pyramidFromGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { presetCompetition } from './competition/CompetitionPage';
import { TeamName } from './competition/parts';

// =============================================================================
// STATISTIKEN › LIGENSYSTEM — Pyramide der laufenden Saison (alle Länder alphabetisch,
// bis Ebene 4 mit historischen Namen/Staffeln aus data/leagueTiers.ts)
// + „Ligen der Welt“: Tabelle aller anderen Länder mit Spalten Land | Liga | Spieltag |
// Tabellenführer | Ligaruf ± Vorsaison (Wunsch Pascal: verständlich statt bloßer Zeilen);
// ein Klick öffnet die Liga unter Statistiken › Liga.
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
export function LeagueSystemView({ g, onGoto }: { g: Game; onChange?: () => void; onGoto?: (screen: 'table') => void }) {
  const today = g.calendar.currentDate;
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, today]);
  const rows = useMemo(() => worldLeagueOverview(g), [g, g.season, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const withRep = rows.some((r) => r.rep);
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" info="ligenstruktur" span={2} rows={2} right={`Saison ${g.season}`} className="lp-box-page">
        <LeaguePyramid data={data} mineId={g.managedClubId} />
      </DashBox>
      <DashBox title="Ligen der Welt" info="ligenDerWelt" rows={2} flush right={`${rows.length} Länder`}>
        {rows.length ? <div className="lsv-wrap">
          <div className={`lsv-row lsv-headrow ${withRep ? 'rep' : ''}`}>
            <span className="lsv-land">Land</span>
            <span className="lsv-league">Liga</span>
            <span className="lsv-md" title="Gespielte von allen Spieltagen der höchsten Liga">Spieltag</span>
            <span className="lsv-lead">Tabellenführer</span>
            {withRep && <span className="lsv-rep" title={`Ligaruf 0–100 (Ligen ${leagueRepLabel(g.leagueRepMode).toLowerCase()}) und Veränderung zur Vorsaison`}>Ligaruf ±</span>}
          </div>
          <div className="lsv-list">
            {rows.map((r) => (
              <button key={r.cc} type="button" className={`lsv-row ${withRep ? 'rep' : ''}`} data-cc={r.cc} title={`${r.name}: Tabelle und Begegnungen unter Statistiken › Liga öffnen`}
                onClick={() => { presetCompetition(g.season, `w:${r.key}`); onGoto?.('table'); }}>
                <span className="lsv-land"><CountryFlag country={r.key} height={14} noLink /><span className="lsv-name">{r.name}</span></span>
                <span className="lsv-league" title={r.groups > 1 ? `2. Ebene in ${r.groups} Staffeln – jede Staffel wird Spieltag für Spieltag simuliert` : undefined}>{r.league}{r.groups > 1 && <small className="lsv-groups">{leagueName(r.cc, 2)} {r.groups} Staffeln</small>}</span>
                <span className="lsv-md">{r.md}<small>/{r.total}</small></span>
                <span className="lsv-lead">{r.leader ? <TeamName g={g} id={r.leader} season={g.season} size={14} /> : <span className="muted">noch kein Spiel</span>}</span>
                {withRep && (
                  <span className="lsv-rep" title={r.rep ? `Ligaruf ${r.rep.rep.toFixed(0)} – historisch um diese Zeit ${r.rep.hist.toFixed(0)}` : undefined}>
                    {r.rep ? <><b>{r.rep.rep.toFixed(0)}</b><small className={r.rep.delta == null || Math.abs(r.rep.delta) < 0.5 ? '' : r.rep.delta > 0 ? 'up' : 'down'}>{r.rep.delta == null ? '' : `${r.rep.delta > 0 ? '+' : r.rep.delta < 0 ? '−' : '±'}${Math.abs(r.rep.delta).toFixed(0)}`}</small></> : '–'}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="lsv-foot">{withRep ? 'Nach Ligaruf sortiert.' : 'Alphabetisch.'} Klick auf ein Land öffnet die Tabelle unter Statistiken › Liga.</div>
        </div> : <Empty icon="stats">Keine Auslandsligen in diesem Spielstand.</Empty>}
      </DashBox>
    </DashPage>
  );
}
