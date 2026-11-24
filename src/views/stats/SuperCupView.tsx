// =============================================================================
// GIPFELPOKALE (Wunsch Pascal, #46) – zwei Ansichten derselben Daten:
//   scope 'home' = Statistiken › Nationale Pokale › Gipfelpokal: Gipfel- bzw. Auftaktpokal des
//                  Heimatlandes in der laufenden Saison, Regeln der Epoche, Siegerliste, andere Länder;
//   scope 'euro' = Statistiken › International › Europäischer Gipfelpokal: Spiel der Saison,
//                  Regeln, alle bisherigen Sieger (gewählte Saison hervorgehoben).
// Logik: game/superCupGame.ts, Stammdaten: data/superCups.ts.
// =============================================================================
import { Fragment } from 'react';
import type { Game } from '../../game/state';
import { homeCountryKey } from '../../game/state';
import { ROUND_DE, superCupState, type ScEvent, type ScMatch } from '../../game/superCupGame';
import { compClubName } from '../../game/competitionView';
import { SUPER_CUPS, SUPER_PRIZE, superEra, uefaSuperName, type SuperEra } from '../../data/superCups';
import { COUNTRY_BY_KEY } from '../../data/world/countries';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { ClubLink } from '../../components/club/ClubLink';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { fmtPrice } from '../../ui/format';
import { euroCompName } from '../../data/euroFormats';

const fmtD = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

const FORMAT_DE: Record<SuperEra['format'], string> = {
  final: 'ein Spiel', legs2: 'Hin- und Rückspiel', four: 'vier Mannschaften (Halbfinale, Finale)', six: 'sechs Mannschaften (Viertelfinale, Halbfinale, Finale)',
};

function Score({ m }: { m: ScMatch }) {
  if (!m.played) return <span className="nt-score off">–:–</span>;
  return <span className="nt-score">{m.hg}:{m.ag}{m.pens ? ` (${m.pens[0]}:${m.pens[1]} i.E.)` : m.aet ? ' n.V.' : ''}</span>;
}

function Line({ g, ev, m }: { g: Game; ev: ScEvent; m: ScMatch }) {
  const me = g.managedClubId;
  const n = (id: string) => (id ? <ClubLink id={id}>{compClubName(g, id, ev.season)}</ClubLink> : <span className="sc-open">offen</span>);
  return (
    <div className={`nt-mrow ${m.home === me || m.away === me ? 'sc-me' : ''}`}>
      <span className="nt-date">{m.date.slice(8, 10)}.{m.date.slice(5, 7)}.</span>
      <span className="nt-team r">{n(m.home)}</span>
      <Score m={m} />
      <span className="nt-team">{n(m.away)}</span>
      <span className="nt-lab">{ROUND_DE[m.stage]}</span>
    </div>
  );
}

function EventBox({ g, ev }: { g: Game; ev: ScEvent }) {
  // Spätere Runden erst zeigen, wenn die Paarung feststeht.
  const shown = ev.matches.filter((m) => m.played || (m.home && m.away) || !m.from);
  const open = ev.matches.filter((m) => !shown.includes(m));
  return (
    <>
      <div className="nt-list">{shown.map((m) => <Line key={m.id} g={g} ev={ev} m={m} />)}</div>
      {open.map((m) => <div key={m.id} className="dnote">{ROUND_DE[m.stage]} am {fmtD(m.date)} – Paarung nach der Runde davor.</div>)}
      {ev.winner && (
        <div className="nt-champ">{ev.shared ? 'Geteilter Titel' : 'Sieger'}: <b>{ev.shared ? ev.teams.slice(0, 2).map((id, i) => <Fragment key={id}>{i ? ' und ' : ''}<ClubLink id={id}>{compClubName(g, id, ev.season)}</ClubLink></Fragment>) : <ClubLink id={ev.winner}>{compClubName(g, ev.winner, ev.season)}</ClubLink>}</b></div>
      )}
    </>
  );
}

export function SuperCupView({ g, scope = 'home', season }: { g: Game; scope?: 'home' | 'euro'; season?: string }) {
  if (scope === 'euro') return <EuroSuperView g={g} season={season ?? g.season} />;
  return <HomeSuperView g={g} />;
}

/** Europäischer Gipfelpokal: Spiel der laufenden Saison, Regeln, alle Sieger seit deinem Start. */
function EuroSuperView({ g, season }: { g: Game; season: string }) {
  const st = superCupState(g);
  const y = parseInt(season.slice(0, 4), 10);
  const uefa = st.season === g.season && season === g.season ? st.events.find((e) => e.key === 'uefa') : undefined;
  const past = st.archive.find((a) => a.country === 'Europa' && a.season === season);
  const euWinners = [...st.archive].filter((a) => a.country === 'Europa').reverse();
  return (
    <DashPage className="sc-page">
      <DashBox title={`${uefaSuperName(y)} ${season}`} info="supercup" span={2}>
        {uefa ? <EventBox g={g} ev={uefa} />
          : past ? <div className="nt-list"><div className="nt-arow me"><span className="nt-date">{past.season}</span><span className="nt-pname"><ClubLink id={past.winner}>{compClubName(g, past.winner, past.season)}</ClubLink></span><span className="nt-club">{past.score} gegen <ClubLink id={past.runnerUp}>{compClubName(g, past.runnerUp, past.season)}</ClubLink></span></div></div>
            : <Empty icon="trophy">{season === g.season ? 'Das Spiel steht noch nicht fest – es wird Ende August ausgetragen.' : 'Für diese Saison liegt im Spielstand kein Ergebnis vor (Siegerliste ab deinem Start).'}</Empty>}
      </DashBox>
      <DashBox title="Regeln dieser Zeit">
        <KV k="Wettbewerb" v={uefaSuperName(y)} strong />
        <KV k="Teilnehmer" v={`Sieger ${euroCompName('ec', y)} gegen Sieger ${y <= 1999 ? euroCompName('cwc', y) : euroCompName('uefa', y)}`} />
        <KV k="Modus" v="ein Spiel Ende August" />
        <KV k="Prämie" v={fmtPrice(SUPER_PRIZE.uefa)} />
      </DashBox>
      <DashBox title="Bisherige Sieger" span={3} right={euWinners.length ? `${euWinners.length} Ausgaben` : undefined}>
        {euWinners.length ? (
          <div className="nt-list">
            {euWinners.map((a) => (
              <div key={a.season} className={`nt-arow ${a.season === season ? 'me' : ''}`}>
                <span className="nt-date">{a.season}</span>
                <span className="nt-pname"><ClubLink id={a.winner}>{compClubName(g, a.winner, a.season)}</ClubLink></span>
                <span className="nt-club">{a.score} gegen <ClubLink id={a.runnerUp}>{compClubName(g, a.runnerUp, a.season)}</ClubLink></span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Seit deinem Start noch kein Europäischer Gipfelpokal ausgespielt.</Empty>}
      </DashBox>
    </DashPage>
  );
}

function HomeSuperView({ g }: { g: Game }) {
  const st = superCupState(g);
  const year = parseInt(g.season.slice(0, 4), 10);
  const homeKey = homeCountryKey(g);
  const era = superEra(homeKey, year);
  const next = SUPER_CUPS[homeKey]?.find((e) => e.from > year);
  const home = st.season === g.season ? st.events.find((e) => e.key === 'home') : undefined;
  const winners = [...st.archive].filter((a) => a.country === homeKey).reverse();
  // Je Land der jüngste Eintrag.
  const latest = new Map<string, (typeof st.archive)[number]>();
  for (const a of st.archive) if (a.country !== homeKey && a.country !== 'Europa') latest.set(a.country, a);
  const others = [...latest.values()].sort((a, b) => a.country.localeCompare(b.country));
  const cname = (k: string) => COUNTRY_BY_KEY[k]?.name ?? k;

  return (
    <DashPage className="sc-page">
      <DashBox title={home ? `${home.name} ${home.season}` : era ? `${era.name} ${g.season}` : 'Gipfelpokal'} info="supercup">
        {home ? <EventBox g={g} ev={home} />
          : era ? <Empty icon="trophy">Der {era.name} wird zum Start der nächsten Saison ausgespielt.</Empty>
            : <Empty icon="trophy">{next ? `In ${cname(homeKey)} gibt es noch keinen nationalen Gipfelpokal – der ${next.name} startet ${next.from}.` : `In ${cname(homeKey)} wird zurzeit kein nationaler Gipfelpokal ausgespielt.`}</Empty>}
      </DashBox>

      <DashBox title="Regeln dieser Zeit">
        {era ? (
          <>
            <KV k="Wettbewerb" v={era.name} strong />
            <KV k="Modus" v={FORMAT_DE[era.format]} />
            <KV k="Teilnehmer" v={era.format === 'six' ? 'Meister, Pokalsieger, Liga nach Platz' : era.format === 'four' ? 'Meister, Pokalsieger, Liga nach Platz' : 'Meister gegen Pokalsieger'} />
            <KV k="Doublesieger" v={era.double === 'cupFinalist' ? 'Gegner: Pokalfinalist' : 'Gegner: Vizemeister'} />
            <KV k="Spielort" v={era.host === 'other' ? 'beim Pokalsieger' : era.host === 'champion' ? 'beim Meister' : 'neutral'} />
            <KV k="Unentschieden" v={era.shared ? 'Titel wird geteilt' : era.directPens ? 'direkt Elfmeterschießen' : 'Verlängerung, Elfmeterschießen'} />
            <KV k="Prämie" v={`${fmtPrice(SUPER_PRIZE.start)} Antritt · ${fmtPrice(era.format === 'six' ? SUPER_PRIZE.ligapokal : SUPER_PRIZE.win)} Sieg`} />
          </>
        ) : <div className="dnote">Kein Gipfelpokal in dieser Saison.{next ? ` Ab ${next.from}: ${next.name}.` : ''}</div>}
      </DashBox>

      <DashBox title={<span className="kv-flag">Sieger <CountryFlag country={homeKey} height={12} />{cname(homeKey)}</span>}>
        {winners.length ? (
          <div className="nt-list">
            {winners.map((a) => (
              <div key={a.season + a.name} className={`nt-arow ${a.winner === g.managedClubId || a.runnerUp === g.managedClubId ? 'me' : ''}`}>
                <span className="nt-date">{a.season}</span>
                <span className="nt-pname"><ClubLink id={a.winner}>{compClubName(g, a.winner, a.season)}</ClubLink>{a.shared ? ' (geteilt)' : ''}{a.name !== 'Gipfelpokal' ? ` · ${a.name}` : ''}</span>
                <span className="nt-club">{a.score} gegen <ClubLink id={a.runnerUp}>{compClubName(g, a.runnerUp, a.season)}</ClubLink></span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Seit deinem Start noch kein Gipfelpokal ausgespielt.</Empty>}
      </DashBox>

      <DashBox title="Andere Länder" span={3} right={others[0]?.season}>
        {others.length ? (
          <div className="nt-list">
            {others.map((a) => (
              <div key={a.country} className="nt-arow">
                <span className="nt-date kv-flag"><CountryFlag country={a.country} height={12} />{cname(a.country)}</span>
                <span className="nt-pname"><ClubLink id={a.winner}>{compClubName(g, a.winner, a.season)}</ClubLink>{a.shared ? ' (geteilt)' : ''}</span>
                <span className="nt-club">{a.score} gegen <ClubLink id={a.runnerUp}>{compClubName(g, a.runnerUp, a.season)}</ClubLink></span>
              </div>
            ))}
          </div>
        ) : <Empty icon="international">Die Gipfelpokale der übrigen Länder erscheinen ab dem ersten Saisonwechsel.</Empty>}
      </DashBox>
    </DashPage>
  );
}
