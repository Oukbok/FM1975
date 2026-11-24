import { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Select from '../../ui/Select';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { CountryCups } from '../../components/competition/CountryCups';
import { coefRowOf, coefTable } from '../../game/coefficients';
import { countryCups, pickCountryKey } from '../../game/countryCups';
import { pyramidFromGame, type PyramidSide } from '../../game/leaguePyramid';
import { defaultPick, leaguePeriods, withPeriod, type PyrPick } from '../../game/leaguePeriods';
import { periodFinalTable } from '../../game/leaguePeriodTable';
import type { Game } from '../../game/state';
import { seasonLabelOf } from '../../data/world/countries';
import { DashBox, DashPage } from '../../ui/DashPage';
import { SubTabsPage, presetSubTab, useSubTab } from '../../ui/SubTabs';
import { WorldLeaguesPage } from './WorldLeaguesPage';

// =============================================================================
// STATISTIKEN › LIGENSYSTEM — drittes Menü (Wunsch Pascal: Platz für die Pokale des Landes):
//   Ligensystem       = Abschlusstabelle | Pyramide (je Liga Trophäe + Auf/Ab/Aufstiegsrunde) |
//                       Pokale des Landes mit Platz in der Fünfjahreswertung (CountryCups; „Ganze
//                       Wertung“ → Statistiken › International › Fünfjahreswertung),
//   Ligen der Welt    = höchste Liga jedes anderen Landes (WorldLeaguesPage).
// Zeiträume (Wunsch Pascal): im Box-Kopf Pfeil | Zeitraum | Pfeil wie die Saisonwahl unter
// Statistiken › Liga – Abschnitte gleicher Ligastruktur bis zur laufenden Saison (game/leaguePeriods.ts),
// frühere mit Abschlusstabelle der letzten Saison (game/leaguePeriodTable.ts); archivierte Ligen
// (DDR, aufgelöste Staaten) zeigen ihren letzten Stand mit Stempel „Archiviert“.
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
type LsTab = 'system' | 'world';

export function LeagueSystemView({ g, onGoto }: { g: Game; onChange?: () => void; onGoto?: (screen: 'table' | 'international') => void }) {
  const [tabState, setTab] = useSubTab<LsTab>('ls-tab', 'system');
  const tab: LsTab = tabState === 'world' ? 'world' : 'system';
  const tabs = [{ id: 'system' as const, label: 'Ligensystem' }, { id: 'world' as const, label: 'Ligen der Welt' }];
  // Die Fünfjahreswertung steht unter Statistiken › International (Wunsch Pascal).
  const onCoef = onGoto ? () => { presetSubTab('intl-tab', 'coef'); onGoto('international'); } : undefined;
  return (
    <SubTabsPage tabs={tabs} active={tab} onSelect={setTab}>
      {tab === 'system' ? <SystemTab g={g} onCoef={onCoef} />
        : <WorldLeaguesPage g={g} onGoto={onGoto} />}
    </SubTabsPage>
  );
}

function SystemTab({ g, onCoef }: { g: Game; onCoef?: () => void }) {
  const today = g.calendar.currentDate;
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, today]);
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
  // Pokale des Landes + Fünfjahreswertung (game/countryCups.ts, game/coefficients.ts).
  const live = !period || period.current;
  const cupSeason = live ? g.season : seasonLabelOf(period.to);
  const cups = useMemo(() => countryCups(g, pick.side, pick.country, cupSeason, live), [g, pick, cupSeason, live, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const coef = useMemo(() => coefTable(g), [g, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const row = coefRowOf(coef, pickCountryKey(g, pick.side, pick.country));
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" info="ligenstruktur" span={3} rows={2} right={nav} className="lp-box-page">
        <LeaguePyramid key={`${pk}|${idx}`} data={shown} mineId={g.managedClubId} ctl={ctl}
          aside={<CountryCups g={g} cups={cups} coef={coef} row={row} past={!live} onCoef={onCoef}
            missing={pick.side === 'ddr' ? 'Die DDR-Vereine zählen im Spiel in der Wertung von Deutschland mit.' : undefined} />} />
      </DashBox>
    </DashPage>
  );
}
