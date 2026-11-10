import { useMemo, useState } from 'react';
import { LeaguePyramid } from '../../components/competition/LeaguePyramid';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { COUNTRY_BY_CC } from '../../data/world/countries';
import { fullCandidates, isFullDivision, setFullAll, setFullCountry } from '../../game/fullCountries';
import { pyramidFromGame } from '../../game/leaguePyramid';
import type { Game } from '../../game/state';
import { DashBox, DashPage } from '../../ui/DashPage';

// =============================================================================
// STATISTIKEN › LIGENSYSTEM — Pyramide der laufenden Saison (West, DDR, Ausland)
// + Simulationstiefe je Land (Wunsch Pascal: jede Liga simulieren; Umschalten
// wirkt ab dem nächsten Saisonwechsel, game/fullCountries.ts).
// Daten: game/leaguePyramid.ts · Darstellung: components/competition/LeaguePyramid.tsx
// =============================================================================
export function LeagueSystemView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const data = useMemo(() => pyramidFromGame(g), [g, g.season, g.calendar.currentDate]);
  const [, setTick] = useState(0);
  const cands = fullCandidates(g).filter((cc) => COUNTRY_BY_CC[cc]).sort((a, b) => COUNTRY_BY_CC[a].name.localeCompare(COUNTRY_BY_CC[b].name, 'de'));
  const want = new Set(g.fullCountries ?? []);
  const running = new Set(g.leagues.otherDivisions.filter(isFullDivision).map((d) => d.id.split('-')[1]));
  const n = cands.filter((cc) => want.has(cc)).length;
  const upd = () => { setTick((t) => t + 1); onChange(); };
  return (
    <DashPage>
      <DashBox title="Übersicht Ligensystem" span={2} rows={2} right={`Saison ${g.season}`} className="lp-box-page">
        <LeaguePyramid data={data} mineId={g.managedClubId} />
      </DashBox>
      <DashBox title="Simulation der Länder" info="simtiefe" rows={2} flush right={`${n} / ${cands.length} Spiel für Spiel`}>
        <div className="lsv-head">
          <span className="seg3 lsv-all">
            <button className={g.fullAll ? 'on' : ''} onClick={() => { setFullAll(g, true); upd(); }}>Alle Spiel für Spiel</button>
            <button className={!n ? 'on' : ''} onClick={() => { setFullAll(g, false); upd(); }}>Alle Hintergrund</button>
          </span>
          <div className="dnote">Änderungen gelten ab dem nächsten Saisonwechsel. „Spiel für Spiel“: Spielplan, Tabelle je Spieltag und Ergebnisse unter Statistiken › Liga; „Hintergrund“: nur die Abschlusstabelle.</div>
        </div>
        <div className="lsv-list">
          {cands.map((cc) => {
            const def = COUNTRY_BY_CC[cc];
            const on = want.has(cc), now = running.has(cc);
            return (
              <div key={cc} className="dlist-row lsv-row" data-cc={cc}>
                <CountryFlag country={def.key} height={14} />
                <span className="grow"><b>{def.name}</b>{on !== now && <span className="muted"> · ab nächster Saison {on ? 'Spiel für Spiel' : 'Hintergrund'}</span>}</span>
                <span className="seg3 seg3-s">
                  <button className={on ? 'on' : ''} onClick={() => { if (!on) { setFullCountry(g, cc, true); upd(); } }}>Spiel für Spiel</button>
                  <button className={on ? '' : 'on'} onClick={() => { if (on) { setFullCountry(g, cc, false); upd(); } }}>Hintergrund</button>
                </span>
              </div>
            );
          })}
        </div>
      </DashBox>
    </DashPage>
  );
}
