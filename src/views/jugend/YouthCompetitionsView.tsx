// =============================================================================
// JUGEND › JUGENDWETTBEWERBE — gleicher Aufbau wie Statistiken › Liga/Pokal
// -----------------------------------------------------------------------------
// Links groß: Tabelle (Verbandsliga/Regionalliga/Staffel), Gruppenübersicht oder
// Endrunde (Turnierbaum ↔ Runden); rechts oben die Bestenlisten, rechts unten
// Saisonbilanz bzw. „Deine Jugend“. Kopf: Saison (laufend + Archiv) und Wettbewerb.
// Daten: game/youthComps/view.ts; Bausteine aus views/statistiken/competition/.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { GroupTables } from '../../components/competition/GroupTables';
import { seasonStartYear } from '../../data/timeline';
import { clubView } from '../../game/clubProfile';
import { compClubName } from '../../game/competitionView';
import type { Game } from '../../game/state';
import { youthCompOptions, youthSeasonOptions, youthSnapshot, type YcSnapshot } from '../../game/youthComps/view';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { CupRounds } from '../statistiken/competition/CupRounds';
import { LeagueTable } from '../statistiken/competition/LeagueTable';
import { StatsBox } from '../statistiken/competition/StatsBox';
import { YouthInfoBox } from './youthcomp/YouthInfoBox';
import { youthPlayerCard } from './youthcomp/YouthPlayerCard';

/** Standard: Liga/Staffel des eigenen Vereins in der A-Jugend, sonst Endrunde. */
function defaultKey(g: Game, season: string): string {
  const opts = youthCompOptions(g, season);
  const mid = g.managedClubId;
  for (const o of opts) {
    if (o.kind !== 'league' || !o.key.startsWith('u19')) continue;
    const s = youthSnapshot(g, season, o.key);
    if (s?.table?.some((r) => r.clubId === mid) || s?.groups?.some((x) => x.rows.some((r) => r.id === mid))) return o.key;
  }
  return opts[0]?.key ?? '';
}

function GroupsView({ g, snap }: { g: Game; snap: YcSnapshot }) {
  const year = seasonStartYear(snap.season);
  const club = (id: string) => {
    const eu = g.euroClubs?.[id];
    const v = eu ? { id, name: eu.name, shortName: eu.shortName, city: eu.city, colors: eu.colors } : clubView(g, id, year);
    return { name: compClubName(g, id, snap.season), short: v.shortName, crest: v as never };
  };
  const adv = snap.advance ?? { n: 1, label: 'nächste Runde' };
  return (
    <div className="cmp-scroll yc-groups">
      <GroupTables groups={snap.groups ?? []} club={club} advance={adv.n} advanceLabel={adv.label} transfer={adv.transfer} highlightId={g.managedClubId} />
    </div>
  );
}

export function YouthCompetitionsView({ g }: { g: Game }) {
  const seasons = useMemo(() => youthSeasonOptions(g), [g, g.season]); // eslint-disable-line react-hooks/exhaustive-deps
  const [season, setSeason] = useState(g.season);
  const opts = useMemo(() => youthCompOptions(g, season), [g, season]);
  const [key, setKey] = useState(() => defaultKey(g, g.season));
  useEffect(() => { setSeason(g.season); setKey(defaultKey(g, g.season)); }, [g.season]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wettbewerb beim Saisonwechsel halten, sonst gleichartigen wählen.
  const effKey = opts.some((o) => o.key === key) ? key
    : opts.find((o) => o.key.split(':')[0] === key.split(':')[0] && o.kind === (key.endsWith(':ko') ? 'cup' : 'league'))?.key ?? opts[0]?.key ?? '';
  const snap = effKey ? youthSnapshot(g, season, effKey) : null;
  const sIdx = seasons.findIndex((s) => s.season === season);
  const step = (d: number) => { const n = seasons[sIdx + d]; if (n) setSeason(n.season); };
  const sections = [...new Set(opts.map((o) => o.section))];

  if (!seasons.length) {
    return (
      <DashPage rows={1}>
        <DashBox title="Jugendwettbewerbe" icon="trophy" span={3}>
          <Empty icon="trophy">Die Jugendwettbewerbe werden zum nächsten Spieltag angesetzt.</Empty>
        </DashBox>
      </DashPage>
    );
  }

  const header = (
    <span className="cmp-select">
      <button className="dchip" disabled={sIdx <= 0} onClick={() => step(-1)} title="Vorherige Saison">‹</button>
      <select className="dselect" value={season} onChange={(e) => setSeason(e.target.value)} title="Saison">
        {seasons.map((s) => <option key={s.season} value={s.season}>{s.season}{s.source === 'live' ? ' (laufend)' : ''}</option>)}
      </select>
      <button className="dchip" disabled={sIdx >= seasons.length - 1} onClick={() => step(1)} title="Nächste Saison">›</button>
      <select className="dselect yc-comp-select" value={effKey} onChange={(e) => setKey(e.target.value)} title="Wettbewerb">
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
          : snap.groups ? <GroupsView g={g} snap={snap} />
          : snap.kind === 'league' ? <LeagueTable key={`${season}-${effKey}`} g={g} snap={snap} />
          : <CupRounds g={g} snap={snap} />}
      </DashBox>
      <StatsBox key={`st-${season}-${effKey}`} g={g} snap={snap} playerCard={(pid, close) => youthPlayerCard(g, snap, pid, close)} />
      <YouthInfoBox g={g} snap={snap} />
    </DashPage>
  );
}
