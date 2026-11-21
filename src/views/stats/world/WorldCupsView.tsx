// =============================================================================
// STATISTIKEN › INTERNATIONAL › WELT (Wunsch Pascal): Weltpokal, Klub-WM,
// Interkontinentalpokal und die Kontinentalpokale der anderen Kontinente.
// Links Wettbewerb + Saison im Kopf, Gruppen und Turnierbaum; rechts oben Modus
// der Epoche + Teilnehmer, rechts unten die Siegerliste. Daten: game/worldCupsView.ts.
// =============================================================================
import { useMemo, useState } from 'react';
import type { Game } from '../../../game/state';
import { WORLD_COMP_OPTIONS, worldCompAbout, worldCompSeasons, worldCompSnapshot, worldCompWinners, worldPlanText, type WorldCompKey } from '../../../game/worldCupsView';
import { foreignCountry } from '../../../game/competitionView';
import { homeCountryKey } from '../../../game/state';
import { DashBox, DashPage, Empty, KV } from '../../../ui/DashPage';
import Select from '../../../ui/Select';
import Icon from '../../../components/Icon';
import RoundsBracket from '../../../components/competition/RoundsBracket';
import { GroupTables } from '../../../components/competition/GroupTables';
import { TeamFlagCtx, TeamName } from '../competition/parts';
import { clubView } from '../../../game/clubProfile';
import { useSubTab } from '../../../ui/SubTabs';

export function WorldCupsView({ g, onWatch }: { g: Game; onWatch?: (matchId: string) => void }) {
  const [key, setKey] = useSubTab<WorldCompKey>('wcx-comp', g.season >= '2005' ? 'cwc' : 'wp');
  const seasons = useMemo(() => worldCompSeasons(g, key), [g, key, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const [seasonSel, setSeason] = useState<string | null>(null);
  const season = seasonSel && seasons.includes(seasonSel) ? seasonSel : seasons[0] ?? '';
  const snap = useMemo(() => (season ? worldCompSnapshot(g, key, season) : null), [g, key, season, g.calendar.currentDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const winners = useMemo(() => worldCompWinners(g, key), [g, key, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const idx = seasons.indexOf(season);
  const year = Number(g.season.slice(0, 4));
  const home = homeCountryKey(g);
  const country = (id: string) => foreignCountry(g, id) ?? home;
  const club = (id: string) => { const v = clubView(g, id, year); return { name: v.name, short: v.shortName, crest: v as never }; };
  const sections = [...new Set(WORLD_COMP_OPTIONS.map((o) => o.section))];

  const header = (
    <span className="cmp-select">
      <Select className="dselect wcx-comp" width={230} popWidth={280} value={key} onChange={(v) => { setKey(v as WorldCompKey); setSeason(null); }} title="Wettbewerb">
        {sections.map((sec) => (
          <optgroup key={sec} label={sec}>{WORLD_COMP_OPTIONS.filter((o) => o.section === sec).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</optgroup>
        ))}
      </Select>
      {/* Liste neueste zuerst: „vorherige Saison“ = weiter hinten */}
      <button className="b3 b3-icon" disabled={idx < 0 || idx >= seasons.length - 1} onClick={() => setSeason(seasons[idx + 1])} title="Vorherige Saison" aria-label="Vorherige Saison"><Icon name="navPrev" size={18} /></button>
      <Select className="dselect cmp-season" width={120} popWidth={200} value={season} onChange={(v) => setSeason(v)} title="Saison">
        {seasons.length ? seasons.map((s) => <option key={s} value={s}>{s}</option>) : <option value="">–</option>}
      </Select>
      <button className="b3 b3-icon" disabled={idx <= 0} onClick={() => setSeason(seasons[idx - 1])} title="Nächste Saison" aria-label="Nächste Saison"><Icon name="navNext" size={18} /></button>
    </span>
  );

  return (
    <TeamFlagCtx.Provider value>
      <DashPage className="wcx-page">
        <DashBox title={snap?.title ?? 'Welt'} icon="trophy" right={header} className="cmp-main wcx-main" info="weltpokal">
          {!snap ? <Empty icon="international">{seasons.length ? 'Für diese Auswahl liegen keine Daten vor.' : worldCompAbout(key)}</Empty> : (
            <div className="cmp-scroll wcx-scroll">
              {snap.note && <div className="dnote wcx-note">{snap.note}.</div>}
              {snap.groups && <GroupTables groups={snap.groups} club={club} highlightId={g.managedClubId}
                zones={snap.groups[0]?.rows.length === 4 && snap.teams.length === 8 ? [{ from: 1, to: 1, label: 'Finale', kind: 'adv' }, { from: 2, to: 2, label: 'Spiel um Platz 3', kind: 'po' }] : [{ from: 1, to: 2, label: 'Achtelfinale', kind: 'adv' }]} />}
              {snap.rounds.length > 0 && <div className="wcx-bracket"><RoundsBracket rounds={snap.rounds}
                renderTeam={(id) => (id ? <TeamName g={g} id={id} season={snap.nameSeason} size={18} /> : <span className="rb-open">offen</span>)}
                onTie={onWatch ? (t) => t.matchId && onWatch(t.matchId) : undefined} /></div>}
            </div>
          )}
        </DashBox>

        <DashBox title="Modus & Teilnehmer" className="wcx-side" right={snap?.live ? 'läuft' : undefined}>
          {snap ? <>
            <KV k="Modus" v={snap.mode} />
            {snap.winner && <KV k="Sieger" v={<TeamName g={g} id={snap.winner} season={snap.nameSeason} size={18} />} strong />}
            {snap.runnerUp && <KV k="Finalist" v={<TeamName g={g} id={snap.runnerUp} season={snap.nameSeason} size={18} />} />}
            {snap.score && <KV k="Finale" v={snap.score} />}
            <div className="dsec">Teilnehmer ({snap.teams.length})</div>
            <div className="wcx-teams">
              {[...snap.teams].sort((a, b) => country(a).localeCompare(country(b))).map((id) => (
                <div key={id} className={`wcx-team ${id === g.managedClubId ? 'me' : ''}`}><TeamName g={g} id={id} season={snap.nameSeason} size={16} /></div>
              ))}
            </div>
          </> : <div className="dnote">{worldPlanText(year)}</div>}
        </DashBox>

        <DashBox title="Siegerliste" className="wcx-side">
          {winners.length ? (
            <div className="nt-list wcx-winners">
              {winners.map((w) => (
                <div key={w.season + (w.name ?? '')} className={`nt-arow ${w.winner === g.managedClubId || w.runnerUp === g.managedClubId ? 'me' : ''} ${w.pre ? 'wcx-pre' : ''}`}
                  title={w.pre ? 'Vor deinem Spielstart (echte Geschichte)' : undefined}>
                  <span className="nt-date">{w.season}</span>
                  {w.winner ? <span className="nt-pname"><TeamName g={g} id={w.winner} season={w.season} size={14} /></span>
                    : <span className="nt-pname">{w.note ?? 'ausgefallen'}</span>}
                  <span className="nt-club">{w.score ?? (w.pre ? 'Geschichte' : '')}{w.name ? ` · ${w.name}` : ''}</span>
                </div>
              ))}
            </div>
          ) : <Empty icon="trophy">Noch keine Sieger seit deinem Start.</Empty>}
        </DashBox>
      </DashPage>
    </TeamFlagCtx.Provider>
  );
}
