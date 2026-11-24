import { leagueName } from '../../data/leagueNames';
import { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Select from '../../ui/Select';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { worldLeagueOverview } from '../../game/competitionCountry';
import { leagueRepLabel } from '../../game/leagueRepGame';
import { pyramidFromGame, type PyramidSide } from '../../game/leaguePyramid';
import { defaultPick, leaguePeriods, withPeriod, type PyrPick } from '../../game/leaguePeriods';
import { periodFinalTable } from '../../game/leaguePeriodTable';
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
// Zeiträume (Wunsch Pascal): im Box-Kopf Pfeil | Zeitraum | Pfeil wie die Saisonwahl unter
// Statistiken › Liga – Abschnitte gleicher Ligastruktur bis zur laufenden Saison (game/leaguePeriods.ts),
// frühere mit Abschlusstabelle der letzten Saison (game/leaguePeriodTable.ts); archivierte Ligen
// (DDR, aufgelöste Staaten) zeigen ihren letzten Stand mit Stempel „Archiviert“.
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
export function LeagueSystemView({ g, onGoto }: { g: Game; onChange?: () => void; onGoto?: (screen: 'table') => void }) {
  const today = g.calendar.currentDate;
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, today]);
  const rows = useMemo(() => worldLeagueOverview(g), [g, g.season, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const withRep = rows.some((r) => r.rep);
  const [pick, setPick] = useState<PyrPick>(() => defaultPick(data, g.managedClubId));
  const set = useMemo(() => leaguePeriods(data, pick), [data, pick]);
  // Gewählter Zeitraum je Land (Startwert: der jüngste = laufend bzw. letzter Stand einer archivierten Liga).
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const pk = `${pick.side}:${pick.side === 'abroad' ? pick.country : ''}|${g.season}`;
  const last = set.periods.length - 1;
  const idx = Math.min(last, chosen[pk] ?? last);
  const period = set.periods[idx];
  const choose = (i: number) => setChosen((m) => ({ ...m, [pk]: Math.max(0, Math.min(last, i)) }));
  const shown = useMemo(() => {
    const d = withPeriod(data, pick, set, period);
    // Früherer Zeitraum: Vereinszahl aus der gespeicherten Abschlusstabelle, wo vorhanden (z. B. DDR-Liga je Spielstand 12 oder 16).
    if (period && !period.current) {
      const sys = pick.side === 'west' ? d.west : pick.side === 'ddr' ? d.ddr : d.abroad.find((a) => a.key === pick.country);
      for (const div of sys?.levels.flat() ?? []) {
        if (div.struct || div.pool) continue;
        const n = periodFinalTable(g, pick, period, div)?.clubs?.length;
        if (n) div.size = n;
      }
    }
    return d;
  }, [g, data, pick, set, period]);
  const ctl = {
    pick,
    onPick: (side: PyramidSide, country: string) => setPick({ side, country }),
    final: period && !period.current ? (d: Parameters<typeof periodFinalTable>[3]) => periodFinalTable(g, pick, period, d) : undefined,
    onReform: (season: string) => { const i = set.periods.findIndex((p) => p.reform === season && p.from === Number(season.slice(0, 4))); if (i >= 0) choose(i); },
  };
  const nav = set.periods.length ? (
    <span className="cmp-select lp-period-nav">
      <button className="b3 b3-icon" disabled={idx <= 0} onClick={() => choose(idx - 1)} title="Früherer Zeitraum" aria-label="Früherer Zeitraum"><Icon name="navPrev" size={18} /></button>
      <Select className="dselect lp-period" width={210} popWidth={260} value={String(idx)} onChange={(v) => choose(Number(v))} title="Zeitraum der Ligastruktur">
        {set.periods.map((p, i) => <option key={p.from} value={String(i)}>{p.label}</option>)}
      </Select>
      <button className="b3 b3-icon" disabled={idx >= last} onClick={() => choose(idx + 1)} title="Späterer Zeitraum" aria-label="Späterer Zeitraum"><Icon name="navNext" size={18} /></button>
    </span>
  ) : `Saison ${g.season}`;
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" info="ligenstruktur" span={2} rows={2} right={nav} className="lp-box-page">
        <LeaguePyramid key={`${pk}|${idx}`} data={shown} mineId={g.managedClubId} ctl={ctl} />
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
