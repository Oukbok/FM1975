// =============================================================================
// STATISTIKEN › SUPERCUP (Wunsch Pascal, #46): Supercup bzw. Ligapokal des
// Heimatlandes in der laufenden Saison, Europäischer Supercup, Regeln der Epoche,
// Siegerliste und die Supercups der übrigen Länder. Logik: game/superCupGame.ts,
// Stammdaten: data/superCups.ts.
// =============================================================================
import type { Game } from '../../game/state';
import { homeCountryKey } from '../../game/state';
import { ROUND_DE, superCupState, type ScEvent, type ScMatch } from '../../game/superCupGame';
import { compClubName } from '../../game/competitionView';
import { SUPER_CUPS, SUPER_PRIZE, superEra, type SuperEra } from '../../data/superCups';
import { COUNTRY_BY_KEY } from '../../data/world/countries';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { ClubLink } from '../../components/club/ClubLink';
import { fmtPrice } from '../../ui/format';

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
        <div className="nt-champ">{ev.shared ? 'Geteilter Titel' : 'Sieger'}: <b>{ev.shared ? ev.teams.slice(0, 2).map((id) => compClubName(g, id, ev.season)).join(' und ') : compClubName(g, ev.winner, ev.season)}</b></div>
      )}
    </>
  );
}

export function SuperCupView({ g }: { g: Game }) {
  const st = superCupState(g);
  const year = parseInt(g.season.slice(0, 4), 10);
  const homeKey = homeCountryKey(g);
  const era = superEra(homeKey, year);
  const next = SUPER_CUPS[homeKey]?.find((e) => e.from > year);
  const home = st.season === g.season ? st.events.find((e) => e.key === 'home') : undefined;
  const uefa = st.season === g.season ? st.events.find((e) => e.key === 'uefa') : undefined;
  const winners = [...st.archive].filter((a) => a.country === homeKey).reverse();
  const euWinners = [...st.archive].filter((a) => a.country === 'Europa').reverse();
  // Je Land der jüngste Eintrag.
  const latest = new Map<string, (typeof st.archive)[number]>();
  for (const a of st.archive) if (a.country !== homeKey && a.country !== 'Europa') latest.set(a.country, a);
  const others = [...latest.values()].sort((a, b) => a.country.localeCompare(b.country));
  const cname = (k: string) => COUNTRY_BY_KEY[k]?.name ?? k;

  return (
    <DashPage className="sc-page">
      <DashBox title={home ? `${home.name} ${home.season}` : era ? `${era.name} ${g.season}` : 'Supercup'} info="supercup">
        {home ? <EventBox g={g} ev={home} />
          : era ? <Empty icon="trophy">Der {era.name} wird zum Start der nächsten Saison ausgespielt.</Empty>
            : <Empty icon="trophy">{next ? `In ${cname(homeKey)} gibt es noch keinen nationalen Supercup – der ${next.name} startet ${next.from}.` : `In ${cname(homeKey)} wird zurzeit kein nationaler Supercup ausgespielt.`}</Empty>}
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
        ) : <div className="dnote">Kein Supercup in dieser Saison.{next ? ` Ab ${next.from}: ${next.name}.` : ''}</div>}
      </DashBox>

      <DashBox title="Europäischer Supercup">
        {uefa ? <EventBox g={g} ev={uefa} /> : <div className="dnote">Landesmeister-Sieger gegen {year <= 1999 ? 'Pokalsieger-Sieger' : 'Europa-Pokal-Sieger'}, ein Spiel Ende August.</div>}
        {euWinners.length > 0 && <div className="dsec">Bisherige Sieger</div>}
        <div className="nt-list">
          {euWinners.slice(0, 8).map((a) => (
            <div key={a.season} className="nt-arow"><span className="nt-date">{a.season}</span><span className="nt-pname">{compClubName(g, a.winner, a.season)}</span><span className="nt-club">{a.score}</span></div>
          ))}
        </div>
      </DashBox>

      <DashBox title={`Sieger ${cname(homeKey)}`}>
        {winners.length ? (
          <div className="nt-list">
            {winners.map((a) => (
              <div key={a.season + a.name} className={`nt-arow ${a.winner === g.managedClubId || a.runnerUp === g.managedClubId ? 'me' : ''}`}>
                <span className="nt-date">{a.season}</span>
                <span className="nt-pname"><ClubLink id={a.winner}>{compClubName(g, a.winner, a.season)}</ClubLink>{a.shared ? ' (geteilt)' : ''}{a.name !== 'Supercup' ? ` · ${a.name}` : ''}</span>
                <span className="nt-club">{a.score} gegen {compClubName(g, a.runnerUp, a.season)}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Seit deinem Start noch kein Supercup ausgespielt.</Empty>}
      </DashBox>

      <DashBox title="Andere Länder" span={2} right={others[0]?.season}>
        {others.length ? (
          <div className="nt-list">
            {others.map((a) => (
              <div key={a.country} className="nt-arow">
                <span className="nt-date">{cname(a.country)}</span>
                <span className="nt-pname">{compClubName(g, a.winner, a.season)}{a.shared ? ' (geteilt)' : ''}</span>
                <span className="nt-club">{a.score} gegen {compClubName(g, a.runnerUp, a.season)}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="international">Die Supercups der übrigen Länder erscheinen ab dem ersten Saisonwechsel.</Empty>}
      </DashBox>
    </DashPage>
  );
}
