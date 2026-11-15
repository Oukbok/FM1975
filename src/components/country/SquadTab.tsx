// Länderprofil › Nationalkader: Aufgebot (Gesicht, Position, Alter, Verein, Länderspiele, Stärke) |
// Kader in Zahlen · Auf dem Sprung (nächste Kandidaten). Daten: game/national/pool.ts über
// game/countryProfile.ts (nationSquad/nextCandidates).
import { useMemo } from 'react';
import { foreignCountry } from '../../game/competitionView';
import { nationInfo, nationSquad, nextCandidates } from '../../game/countryProfile';
import { nationalState } from '../../game/national/nationalGame';
import { homeCountryKey } from '../../game/state';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { TeamName } from '../../views/statistiken/competition/parts';
import { NatRow, type CountryTabProps } from './parts';

export default function SquadTab({ g, c }: CountryTabProps) {
  const squad = useMemo(() => nationSquad(g, c), [g, c]);
  const more = useMemo(() => nextCandidates(g, c, squad, 12), [g, c, squad]);
  const nat = nationInfo(g, c);
  if (!c.nation || !nat) {
    return <DashBox title="Nationalkader" span={3} rows={2}><Empty icon="squad">Für {c.name} gibt es im Spiel keine Nationalmannschaft – keine Daten.</Empty></DashBox>;
  }
  const st = nationalState(g);
  const t = st.tourn && !st.tourn.done && g.calendar.currentDate >= st.tourn.nominate && st.tourn.squads[c.code] ? st.tourn : null;
  const nominated = !!t || st.windows.some((w) => w.squads[c.code]?.length && w.from <= g.calendar.currentDate);
  const xi = [...squad].sort((a, b) => b.ov - a.ov);
  const gk = xi.find((p) => p.pos === 'TW');
  const top11 = gk ? [gk, ...xi.filter((p) => p !== gk && p.pos !== 'TW').slice(0, 10)] : xi.slice(0, 11);
  const avg = (l: typeof squad, f: (p: (typeof squad)[number]) => number) => (l.length ? l.reduce((a, p) => a + f(p), 0) / l.length : 0);
  const homeKey = homeCountryKey(g);
  const abroad = squad.filter((p) => p.clubId && (foreignCountry(g, p.clubId) ?? homeKey) !== c.key).length;
  const byClub = new Map<string, number>();
  for (const p of squad) if (p.clubId) byClub.set(p.clubId, (byClub.get(p.clubId) ?? 0) + 1);
  const clubs = [...byClub.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <>
      <DashBox title={t ? `Aufgebot ${t.kind} ${t.year}` : nominated || !squad.length ? 'Aufgebot' : 'Aufgebot (Vorschlag)'} span={2} rows={2} right={squad.length ? `${squad.length} Spieler` : undefined}>
        {squad.length ? <>
          <div className="cnx-prow head caps"><span className="fthumb-pad" /><span className="cnx-pname">Name</span><span className="cnx-pos">Pos.</span><span className="cnx-age">Alter</span><span className="cnx-club">Verein</span><span className="cnx-caps">Spiele · Tore</span><b className="cnx-ov">Stärke</b></div>
          <div className="cnx-list">{squad.map((p) => <NatRow key={p.id} g={g} p={p} caps />)}</div>
        </> : <Empty icon="squad">{nat.exists ? 'Keine Spieler dieser Nationalität in der Spielwelt.' : `${c.name} besteht in dieser Saison nicht.`}</Empty>}
      </DashBox>

      <DashBox title="Kader in Zahlen" info="nationalteams">
        {squad.length ? <>
          <KV k="Stärke der Nationalmannschaft" v={nat.strength != null ? <b style={{ color: vColor(nat.strength) }}>{Math.round(nat.strength)}</b> : '–'} strong />
          <KV k="Ø Stärke beste Elf" v={Math.round(avg(top11, (p) => p.ov))} />
          <KV k="Ø Alter" v={avg(squad, (p) => p.age).toFixed(1).replace('.', ',')} />
          <KV k="Spielen im Ausland" v={`${abroad} von ${squad.length}`} />
          <div className="dsec">Vereine mit den meisten Nationalspielern</div>
          {clubs.map(([id, n]) => <KV key={id} k={<TeamName g={g} id={id} season={g.season} size={16} />} v={n} />)}
          {!nominated && <div className="dnote mt8">Noch kein Aufgebot in dieser Saison – gezeigt wird, wen der Nationaltrainer heute berufen würde.</div>}
        </> : <Empty icon="stats">Keine Daten.</Empty>}
      </DashBox>

      <DashBox title="Auf dem Sprung" right={more.length ? `${more.length}` : undefined}>
        {more.length ? <div className="cnx-list">{more.map((p) => <NatRow key={p.id} g={g} p={p} />)}</div>
          : <Empty icon="squad">Keine weiteren Kandidaten.</Empty>}
      </DashBox>
    </>
  );
}
