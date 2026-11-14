import { useMemo } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { worldLeagueOverview } from '../../game/competitionCountry';
import { pyramidFromGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { presetCompetition } from './competition/CompetitionPage';
import { TeamName } from './competition/parts';

// =============================================================================
// STATISTIKEN › LIGENSYSTEM — Pyramide der laufenden Saison (West, DDR, Ausland)
// + „Ligen der Welt“: Stand aller Auslandsligen (Spieltag, Tabellenführer); ein Klick
// öffnet die Liga unter Statistiken › Liga. Alle Auslandsligen laufen Spieltag für
// Spieltag (game/worldLeagues.ts) – die frühere Wahl der Simulationstiefe ist entfallen.
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
export function LeagueSystemView({ g, onGoto }: { g: Game; onChange?: () => void; onGoto?: (screen: 'table') => void }) {
  const today = g.calendar.currentDate;
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, today]);
  const rows = useMemo(() => worldLeagueOverview(g), [g, g.season, today]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" span={2} rows={2} right={`Saison ${g.season}`} className="lp-box-page">
        <LeaguePyramid data={data} mineId={g.managedClubId} />
      </DashBox>
      <DashBox title="Ligen der Welt" info="simtiefe" rows={2} flush right={`${rows.length} Länder`}>
        <div className="lsv-head">
          <div className="dnote">Alle Auslandsligen laufen Spieltag für Spieltag. Klick öffnet Tabelle und Begegnungen unter Statistiken › Liga.</div>
        </div>
        {rows.length ? (
          <div className="lsv-list">
            {rows.map((r) => (
              <button key={r.cc} type="button" className="dlist-row lsv-row" data-cc={r.cc} title={`${r.name}: Tabelle öffnen`}
                onClick={() => { presetCompetition(g.season, `w:${r.key}`); onGoto?.('table'); }}>
                <CountryFlag country={r.key} height={14} />
                <span className="lsv-name">{r.name}</span>
                <span className="grow lsv-lead">{r.leader ? <TeamName g={g} id={r.leader} season={g.season} size={16} /> : <span className="muted">–</span>}</span>
                <span className="lsv-md" title="Gespielte Spieltage der 1. Liga">{r.md}/{r.total}</span>
              </button>
            ))}
          </div>
        ) : <Empty icon="stats">Keine Auslandsligen in diesem Spielstand.</Empty>}
      </DashBox>
    </DashPage>
  );
}
