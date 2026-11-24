import { useEffect, useMemo, useState } from 'react';
import type { EuroCompId } from '../../data/europe';
import { UEFA_SUPER, uefaSuperName } from '../../data/superCups';
import { seasonStartYear } from '../../data/timeline';
import { countryOptions, countrySeasons, homeStatsCountry, pickSeason, statsCountries } from '../../game/competitionCountry';
import { inEuroCup } from '../../game/euroFixture';
import { Game } from '../../game/state';
import { SubTabsPage, useSubTab } from '../../ui/SubTabs';
import { CoefficientPage } from './CoefficientPage';
import { CompetitionPage } from './competition/CompetitionPage';
import { SuperCupView } from './SuperCupView';
import { WorldCupsView } from './world/WorldCupsView';

// =============================================================================
// INTERNATIONAL — drittes Menü (Wunsch Pascal: je europäischem Pokal ein Reiter, am Schluss die
// Fünfjahreswertung):
//   je Europapokal der gewählten Saison ein Reiter mit dem Namen der Epoche (Reihenfolge wie die
//   Startplätze: bis 1998 Landesmeister, Pokalsieger, Europa-Pokal; danach Meisterliga,
//   Kontinental-Liga, Europa-Trophäe) = Baum/Runden + Bestenlisten (competition/CompetitionPage.tsx
//   mit festem Wettbewerb `lockKey` und gemeinsamer Saison), Wettbewerbe ohne Ausgabe in der
//   Saison fehlen; dann Europäischer Gipfelpokal (SuperCupView scope 'euro', ab 1975),
//   Welt (world/WorldCupsView.tsx) und Fünfjahreswertung (CoefficientPage.tsx).
// Sommer-/Intertoto-Wettbewerbe gibt es im Spiel nicht (Europapokale = ec/cwc/uefa).
// =============================================================================
type IntlTab = EuroCompId | 'esuper' | 'welt' | 'coef';

/** Reihenfolge der Europapokale in einer Saison (wie game/coefficients.ts). */
const order = (y: number): EuroCompId[] => (y + 1 <= 1998 ? ['ec', 'cwc', 'uefa'] : ['ec', 'uefa', 'cwc']);

export function InternationalView({ g, onWatch, onReplayDraw }: { g: Game; onWatch: (id: string) => void; onReplayDraw?: (comp: EuroCompId, roundIndex: number) => void }) {
  const homeC = useMemo(() => homeStatsCountry(statsCountries(g)), [g, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const seasons = useMemo(() => countrySeasons(g, homeC), [g, g.season, homeC]); // eslint-disable-line react-hooks/exhaustive-deps
  const [seasonState, setSeason] = useState(() => pickSeason(seasons, g.season));
  useEffect(() => { setSeason(pickSeason(seasons, g.season)); }, [g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const season = seasons.some((s) => s.season === seasonState) ? seasonState : pickSeason(seasons, seasonState);
  const src = seasons.find((s) => s.season === season)?.source ?? 'live';
  const y = seasonStartYear(season);
  const comps = useMemo(() => {
    const have = new Map(countryOptions(g, homeC, season, src).filter((o) => o.section === 'Europa').map((o) => [o.key, o.label]));
    return order(y).filter((k) => have.has(k)).map((k) => ({ id: k, label: have.get(k)! }));
  }, [g, homeC, season, src, y]);
  const mine = (['ec', 'cwc', 'uefa'] as const).find((k) => inEuroCup(g.euroCups?.[k], g.managedClubId));
  const [tabState, setTab] = useSubTab<IntlTab>('intl-tab', mine ?? 'ec');
  const fixed: IntlTab[] = ['esuper', 'welt', 'coef'];
  // Reiter, den es in der gewählten Saison nicht gibt (oder alter Wert „europa“): erster Europapokal.
  const tab: IntlTab = comps.some((c) => c.id === tabState) || (fixed.includes(tabState) && (tabState !== 'esuper' || y >= UEFA_SUPER.from))
    ? tabState : comps[0]?.id ?? 'welt';
  const tabs = [
    ...comps.map((c) => ({ id: c.id as IntlTab, label: c.label })),
    ...(y >= UEFA_SUPER.from ? [{ id: 'esuper' as IntlTab, label: uefaSuperName(y) }] : []),
    { id: 'welt' as IntlTab, label: 'Welt' },
    { id: 'coef' as IntlTab, label: 'Fünfjahreswertung' },
  ];
  return (
    <SubTabsPage tabs={tabs} active={tab} onSelect={setTab}>
      {tab === 'welt' ? <WorldCupsView g={g} onWatch={onWatch} />
        : tab === 'coef' ? <CoefficientPage g={g} />
          : tab === 'esuper' ? <SuperCupView g={g} scope="euro" season={season} />
            : <CompetitionPage key={tab} g={g} start="euro" onWatch={onWatch} lockKey={tab} season={season} onSeason={setSeason}
              onReplayDraw={onReplayDraw ? (comp, ri) => { if (comp !== 'cup') onReplayDraw(comp, ri); } : undefined} />}
    </SubTabsPage>
  );
}
