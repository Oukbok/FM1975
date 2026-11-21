// =============================================================================
// WETTBEWERBS-SEITE (Statistiken › Liga / Pokal / International)
// -----------------------------------------------------------------------------
// Einheitliches Layout: links groß Tabelle bzw. Turnierbaum/Runden, rechts oben die
// Statistik (Bestenlisten), rechts unten Saisonbilanz/Dein Weg. Oben im Kopf der
// linken Box: Saison (Historie ab 1963/64, Archiv, laufend) und Wettbewerb (alle
// Ligen, Landespokal, Europapokale). Davor die Länderwahl (Wunsch Pascal): Heimatland,
// DDR und alle Auslandsligen (game/competitionCountry.ts).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EuroCompId } from '../../../data/europe';
import { competitionOptions, type CompOption } from '../../../game/competitionView';
import {
  countryMatchdays, countryOfKey, countryOptions, countrySeasons, countrySnapshot, pickSeason, seasonSuffix, statsCountries, homeStatsCountry, type StatsCountry,
} from '../../../game/competitionCountry';
import { useSubTab } from '../../../ui/SubTabs';
import { Caption, CountrySelect, RosterList, WinnersList } from './CountryParts';
import { TeamFlagCtx } from './parts';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { CupRounds } from './CupRounds';
import { InfoBox } from './InfoBox';
import { LeagueTable } from './LeagueTable';
import { StatsBox } from './StatsBox';
import { EuropeBox } from '../EuropeBox';
import { compClubName } from '../../../game/competitionView';
import { inEuroCup } from '../../../game/euroFixture';
import Icon from '../../../components/Icon';
import Select from '../../../ui/Select';
import { liveFixtures, resultsFor, winPoints, type TableMode } from '../../../game/leagueResults';
import { MatchdayBox, fromTuple, type MdGame } from './MatchdayBox';

export type CompStart = 'league' | 'cup' | 'euro';

/** Vorauswahl für Statistiken › Liga (Länderprofil, „Ligen der Welt“); wird einmal verbraucht –
 *  beim nächsten Öffnen der Seite oder sofort, wenn die Seite schon offen ist. */
type Preset = { season: string; key: string };
let pendingPreset: Preset | null = null;
const presetListeners = new Set<(p: Preset) => void>();
export function presetCompetition(season: string, key: string): void {
  pendingPreset = { season, key };
  const ls = [...presetListeners]; const l = ls[ls.length - 1];
  if (l) { pendingPreset = null; l({ season, key }); }
}

function defaultKey(g: Game, opts: CompOption[], start: CompStart): string {
  if (start === 'league') return opts.find((o) => o.key === g.leagues.playerDivision.id)?.key ?? opts.find((o) => o.kind === 'league')?.key ?? opts[0]?.key ?? '';
  if (start === 'cup') return opts.find((o) => o.key === 'cup')?.key ?? opts[0]?.key ?? '';
  const mid = g.managedClubId;
  const mineIn = (['ec', 'cwc', 'uefa'] as const).find((k) => inEuroCup(g.euroCups?.[k], mid));
  return opts.find((o) => o.key === mineIn)?.key ?? opts.find((o) => o.section === 'Europa')?.key ?? opts[0]?.key ?? '';
}

/** Reiter zeigen nur ihre Art (Wunsch Pascal): Liga = Ligen, Pokal = Pokale, International = Europapokale. */
export function fitsTab(o: CompOption, start: CompStart): boolean {
  if (start === 'euro') return o.section === 'Europa';
  return o.section !== 'Europa' && o.kind === (start === 'cup' ? 'cup' : 'league');
}

/** Erster Wettbewerb eines anderen Landes: gleiche Art wie bisher (Liga/Pokal). */
function keyFor(g: Game, c: StatsCountry, opts: CompOption[], start: CompStart, kind?: 'league' | 'cup'): string {
  if (c.mode === 'home' && !kind) return defaultKey(g, opts, start);
  const want = kind ?? (start === 'cup' ? 'cup' : 'league');
  return opts.find((o) => o.kind === want && o.section !== 'Europa')?.key ?? opts[0]?.key ?? '';
}

export function CompetitionPage({ g, start, onWatch, onReplayDraw }: {
  g: Game; start: CompStart; onWatch?: (matchId: string) => void; onReplayDraw?: (comp: 'cup' | EuroCompId, roundIndex: number) => void;
}) {
  const countries = useMemo(() => statsCountries(g), [g, g.season]);
  const homeC = homeStatsCountry(countries);
  const [preset] = useState(() => (pendingPreset ? { ...pendingPreset, ...countryOfKey(g, pendingPreset.season, pendingPreset.key) } : null));
  useEffect(() => { pendingPreset = null; }, []);
  const [remCc, remember] = useSubTab<string>(`cmp-country-${start}`, homeC.cc);
  const [cc, setCcState] = useState(() => preset?.cc ?? (start === 'euro' ? homeC.cc : remCc));
  // Europapokale stehen unter „Europa“ (Wunsch Pascal), nicht unter einem Land: Daten aus dem Heimatland.
  const euroMode = start === 'euro';
  const country = euroMode ? homeC : countries.find((c) => c.cc === cc) ?? homeC;
  const seasons = useMemo(() => countrySeasons(g, country), [g, g.season, country]); // eslint-disable-line react-hooks/exhaustive-deps
  const [seasonState, setSeason] = useState(() => preset?.season ?? pickSeason(countrySeasons(g, country), g.season));
  const season = seasons.some((s) => s.season === seasonState) ? seasonState : pickSeason(seasons, seasonState);
  const src = seasons.find((s) => s.season === season)?.source ?? 'live';
  const opts = useMemo(() => countryOptions(g, country, season, src).filter((o) => fitsTab(o, start)), [g, country, season, src, start]);
  const [key, setKeyState] = useState(() => preset?.key ?? keyFor(g, country, countryOptions(g, country, season, src), start));
  const [kind, setKind] = useState<'league' | 'cup' | undefined>(undefined);
  const setKey = (k: string) => { setKeyState(k); setKind(opts.find((o) => o.key === k)?.kind); };
  // Seite schon offen: Vorauswahl von außen sofort übernehmen (sonst nur beim ersten Aufbau gelesen).
  useEffect(() => {
    if (start !== 'league') return undefined;
    const apply = (p: Preset) => {
      const c = countryOfKey(g, p.season, p.key);
      setCcState(c.cc); setSeason(p.season); setKeyState(c.key); setKind(undefined);
    };
    presetListeners.add(apply);
    return () => { presetListeners.delete(apply); };
  }, [g, start]);
  const last = useRef(`${start}|${g.season}`);
  useEffect(() => {
    if (last.current === `${start}|${g.season}`) return; // Startwerte (inkl. Vorauswahl) stehen schon
    last.current = `${start}|${g.season}`;
    const list = countrySeasons(g, country);
    const s = pickSeason(list, g.season);
    setSeason(s); setKeyState(keyFor(g, country, countryOptions(g, country, s, list.find((x) => x.season === s)?.source ?? 'live'), start));
  }, [start, g.season]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCountry = (v: string) => {
    const c = countries.find((x) => x.cc === v) ?? homeC;
    const list = countrySeasons(g, c);
    const s = pickSeason(list, season);
    const curKind = kind ?? opts.find((o) => o.key === key)?.kind;
    setCcState(c.cc); remember(c.cc); setSeason(s);
    setKeyState(keyFor(g, c, countryOptions(g, c, s, list.find((x) => x.season === s)?.source ?? 'live'), start, c.mode === 'home' && !kind ? undefined : curKind));
  };

  // Wettbewerb beim Saisonwechsel halten, sonst gleichartigen wählen.
  const cur = opts.find((o) => o.key === key);
  const wantKind = kind ?? (key === 'cup' || key === 'xcup' || ['ec', 'cwc', 'uefa'].includes(key) ? 'cup' : 'league');
  const effKey = cur ? key : (opts.find((o) => o.kind === wantKind && o.section !== 'Europa')?.key ?? opts[0]?.key ?? '');
  const snap = countrySnapshot(g, country, season, src, effKey);
  const sIdx = seasons.findIndex((s) => s.season === season);
  const step = (d: number) => { const n = seasons[sIdx + d]; if (n) setSeason(n.season); };
  const sections = [...new Set(opts.map((o) => o.section))];
  // Eigene aktive Liga / eigener Europapokal dezent hinterlegt (Wunsch Pascal).
  const mineEuro = (['ec', 'cwc', 'uefa'] as const).find((k) => inEuroCup(g.euroCups?.[k], g.managedClubId));
  const isMineComp = (k: string) => season === g.season && (country.cc === homeC.cc || euroMode) && (k === g.leagues.playerDivision.id || k === mineEuro);

  // Reihenfolge im Kopf (Wunsch Pascal): Land | Wettbewerb | Saison; darunter der Spieltag (in der Tabelle).
  const header = (
    <span className="cmp-select">
      {euroMode
        ? <Select className="dselect cmp-country" width={168} value="eu" onChange={() => undefined} title="Wettbewerbe" options={[{ value: 'eu', text: 'Europa', label: 'Europa' }]} />
        : <CountrySelect countries={countries} value={country.cc} onChange={changeCountry} mineCc={homeC.cc} />}
      <Select className="dselect cmp-comp" width={190} popWidth={260} value={effKey} onChange={(v) => setKey(v)} title="Wettbewerb">
        {sections.map((sec) => (
          <optgroup key={sec} label={sec}>
            {opts.filter((o) => o.section === sec).map((o) => <option key={o.key} value={o.key} data-mine={isMineComp(o.key) || undefined}>{o.label}</option>)}
          </optgroup>
        ))}
      </Select>
      <button className="b3 b3-icon" disabled={sIdx <= 0} onClick={() => step(-1)} title="Vorherige Saison" aria-label="Vorherige Saison"><Icon name="navPrev" size={18} /></button>
      <Select className="dselect cmp-season" width={150} popWidth={260} value={season} onChange={(v) => setSeason(v)} title="Saison">
        {seasons.map((s) => <option key={s.season} value={s.season}>{s.season}{seasonSuffix(s)}</option>)}
      </Select>
      <button className="b3 b3-icon" disabled={sIdx >= seasons.length - 1} onClick={() => step(1)} title="Nächste Saison" aria-label="Nächste Saison"><Icon name="navNext" size={18} /></button>
    </span>
  );

  // Spieltage (Ligen der Heimat mit Einzelergebnissen): gemeinsamer Stand für Tabelle und „Begegnungen“.
  const isLeague = !!snap && snap.kind === 'league' && !snap.winners && !snap.roster && !snap.placingsOnly;
  // Auslandsligen (schlanke Spieltag-Simulation): Spiele und Ergebnisse aus game/worldLeagues.ts.
  const today = g.calendar.currentDate;
  const lean = useMemo(() => (isLeague ? countryMatchdays(g, country, season, effKey) : null), [g, country, season, effKey, isLeague, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const res = lean ? lean.res : isLeague && country.mode !== 'world' ? resultsFor(g, season, effKey) : null;
  const fx = isLeague && country.mode !== 'world' && season === g.season ? liveFixtures(g, effKey) : null;
  const mdGames: MdGame[] = lean ? lean.games : fx ? fx.map((m) => {
    const r = res?.find((x) => x[0] === m.matchday && x[2] === m.homeClubId && x[3] === m.awayClubId);
    return r ? fromTuple(r) : { md: m.matchday, date: m.date, home: m.homeClubId, away: m.awayClubId, hg: null, ag: null, hh: -1, ha: -1 };
  }) : (res ?? []).map(fromTuple);
  const maxMd = mdGames.reduce((a, x) => Math.max(a, x.md), 0);
  const playedMd = (res ?? []).reduce((a, x) => Math.max(a, x[0]), 0);
  const mdKey = `${country.cc}|${season}|${effKey}`;
  const [mdSel, setMdSel] = useState<{ key: string; md: number } | null>(null);
  const [mode, setMode] = useState<TableMode>('all');
  const md = mdSel?.key === mdKey ? Math.min(Math.max(1, mdSel.md), maxMd || 1) : Math.max(1, playedMd || (fx || lean ? 1 : maxMd));
  const onMd = (n: number) => setMdSel({ key: mdKey, md: n });
  const nav = { mode, setMode, md, maxMd, playedMd, onMd, res, ptsWin: lean?.ptsWin ?? winPoints(g, season) };

  const main = !snap ? <Empty icon="stats">Für diese Auswahl liegen keine Daten vor.</Empty>
    : snap.winners ? <><Caption snap={snap} /><WinnersList g={g} snap={snap} /></>
    : snap.kind === 'league' && snap.roster ? <><Caption snap={snap} /><RosterList g={g} snap={snap} /></>
    : snap.kind === 'league' && !snap.table?.length && snap.emptyText ? <><Caption snap={snap} /><Empty icon="stats">{snap.emptyText}</Empty></>
    : snap.kind === 'league' ? <><Caption snap={snap} /><LeagueTable key={`${country.cc}-${season}-${effKey}`} g={g} snap={snap} nav={nav} /></>
    : <CupRounds g={g} snap={snap} onWatch={onWatch}
      onReplayDraw={onReplayDraw && src === 'live' ? (ri) => onReplayDraw(effKey as 'cup' | EuroCompId, ri) : undefined} />;

  const withMd = isLeague && !!snap?.table?.length && (mdGames.length > 0 || country.mode !== 'world');
  const euro = ['ec', 'cwc', 'uefa'].includes(effKey);
  return (
    <TeamFlagCtx.Provider value={euro}>
    <DashPage className={`cmp-page${withMd ? ' cmp-mdpage' : ''}`}>
      <DashBox title={snap ? snap.label : 'Wettbewerb'} icon={snap?.kind === 'cup' ? 'trophy' : 'dashTabelle'} span={2} rows={2} right={header} className="cmp-main" info={start === 'euro' ? undefined : 'ligaLand'}>
        {main}
      </DashBox>
      {withMd && <MatchdayBox g={g} season={season} games={mdGames} md={md} maxMd={maxMd} onMd={onMd}
        none={mdGames.length ? undefined : 'Für diese Saison liegen keine Einzelergebnisse vor.'} />}
      <StatsBox key={`st-${country.cc}-${season}-${effKey}`} g={g} snap={snap} noScorer={withMd && !!lean} />
      {withMd ? (lean && !snap?.stats ? <InfoBox g={g} snap={snap} cell /> : null) : snap && src === 'live' && ['ec', 'cwc', 'uefa'].includes(snap.key) && !snap.rounds?.some((r) => r.ties.some((t) => t.mine) || r.groups?.some((gr) => gr.rows.some((x) => x.id === g.managedClubId)))
        ? <EuropeBox g={g} germans={(g.euroCups?.[snap.key as EuroCompId]?.participantIds ?? []).filter((id) => !g.euroClubs?.[id])} teamName={(id) => compClubName(g, id, season)} />
        : <InfoBox g={g} snap={snap} />}
    </DashPage>
    </TeamFlagCtx.Provider>
  );
}
