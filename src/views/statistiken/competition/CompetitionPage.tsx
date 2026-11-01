// =============================================================================
// WETTBEWERBS-SEITE (Statistiken › Liga / Pokal / International)
// -----------------------------------------------------------------------------
// Einheitliches Layout: links groß Tabelle bzw. Turnierbaum/Runden, rechts oben die
// Statistik (Bestenlisten), rechts unten Saisonbilanz/Dein Weg. Oben im Kopf der
// linken Box: Saison (Historie ab 1963/64, Archiv, laufend) und Wettbewerb (alle
// Ligen inkl. DDR, Landespokal, Europapokale, Auslandsligen der letzten Saison).
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import type { EuroCompId } from '../../../data/europe';
import { buildSnapshot, competitionOptions, seasonOptions, type CompOption } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { CupRounds } from './CupRounds';
import { InfoBox } from './InfoBox';
import { LeagueTable } from './LeagueTable';
import { StatsBox } from './StatsBox';
import { EuropeBox } from '../EuropeBox';
import { compClubName } from '../../../game/competitionView';
import { inEuroCup } from '../../../game/euroFixture';

export type CompStart = 'league' | 'cup' | 'euro';

function defaultKey(g: Game, opts: CompOption[], start: CompStart): string {
  if (start === 'league') return opts.find((o) => o.key === g.leagues.playerDivision.id)?.key ?? opts.find((o) => o.kind === 'league')?.key ?? opts[0]?.key ?? '';
  if (start === 'cup') return opts.find((o) => o.key === 'cup')?.key ?? opts[0]?.key ?? '';
  const mid = g.managedClubId;
  const mineIn = (['ec', 'cwc', 'uefa'] as const).find((k) => inEuroCup(g.euroCups?.[k], mid));
  return opts.find((o) => o.key === mineIn)?.key ?? opts.find((o) => o.section === 'Europa')?.key ?? opts[0]?.key ?? '';
}

export function CompetitionPage({ g, start, onWatch, onReplayDraw }: {
  g: Game; start: CompStart; onWatch?: (matchId: string) => void; onReplayDraw?: (comp: 'cup' | EuroCompId, roundIndex: number) => void;
}) {
  const seasons = useMemo(() => seasonOptions(g), [g, g.season]);
  const [season, setSeason] = useState(g.season);
  const opts = useMemo(() => competitionOptions(g, season), [g, season]);
  const [key, setKey] = useState(() => defaultKey(g, competitionOptions(g, g.season), start));
  useEffect(() => { setSeason(g.season); setKey(defaultKey(g, competitionOptions(g, g.season), start)); }, [start, g.season]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wettbewerb beim Saisonwechsel halten, sonst gleichartigen wählen.
  const cur = opts.find((o) => o.key === key);
  const effKey = cur ? key : (opts.find((o) => o.kind === (key.startsWith('tier') || key.startsWith('ddr') || key.startsWith('w:') ? 'league' : 'cup') && o.section !== 'Ausland')?.key ?? opts[0]?.key ?? '');
  const snap = buildSnapshot(g, season, effKey);
  const sIdx = seasons.findIndex((s) => s.season === season);
  const step = (d: number) => { const n = seasons[sIdx + d]; if (n) setSeason(n.season); };
  const sections = [...new Set(opts.map((o) => o.section))];
  const src = seasons[sIdx]?.source;

  const header = (
    <span className="cmp-select">
      <button className="dchip" disabled={sIdx <= 0} onClick={() => step(-1)} title="Vorherige Saison">‹</button>
      <select className="dselect" value={season} onChange={(e) => setSeason(e.target.value)} title="Saison">
        {seasons.map((s) => <option key={s.season} value={s.season}>{s.season}{s.source === 'live' ? ' (laufend)' : s.source === 'history' ? ' (vor Spielbeginn)' : ''}</option>)}
      </select>
      <button className="dchip" disabled={sIdx >= seasons.length - 1} onClick={() => step(1)} title="Nächste Saison">›</button>
      <select className="dselect" value={effKey} onChange={(e) => setKey(e.target.value)} title="Wettbewerb">
        {sections.map((sec) => (
          <optgroup key={sec} label={sec}>
            {opts.filter((o) => o.section === sec).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </optgroup>
        ))}
      </select>
    </span>
  );

  return (
    <DashPage className="cmp-page">
      <DashBox title={snap ? snap.label : 'Wettbewerb'} icon={snap?.kind === 'cup' ? 'trophy' : 'dashTabelle'} span={2} rows={2} right={header} className="cmp-main">
        {!snap ? <Empty icon="stats">Für diese Auswahl liegen keine Daten vor.</Empty>
          : snap.kind === 'league' ? <LeagueTable key={`${season}-${effKey}`} g={g} snap={snap} />
          : <CupRounds g={g} snap={snap} onWatch={onWatch}
            onReplayDraw={onReplayDraw && src === 'live' ? (ri) => onReplayDraw(effKey as 'cup' | EuroCompId, ri) : undefined} />}
      </DashBox>
      <StatsBox key={`st-${season}-${effKey}`} g={g} snap={snap} />
      {snap && src === 'live' && ['ec', 'cwc', 'uefa'].includes(snap.key) && !snap.rounds?.some((r) => r.ties.some((t) => t.mine) || r.groups?.some((gr) => gr.rows.some((x) => x.id === g.managedClubId)))
        ? <EuropeBox g={g} germans={(g.euroCups?.[snap.key as EuroCompId]?.participantIds ?? []).filter((id) => !g.euroClubs?.[id])} teamName={(id) => compClubName(g, id, season)} />
        : <InfoBox g={g} snap={snap} />}
    </DashPage>
  );
}
