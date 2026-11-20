// Länderprofil › Länderspiele: Bilanz & Termine · Länderspiele (Liste) | Turnier · WM & EM im Spiel
// Daten: game/national/ (nationalGame.ts nationMatches/upcoming, tournament.ts).
import { activeJob } from '../../game/national/nationalJob';
import { Fragment } from 'react';
import { nationMatches, nationalSeason, natName, upcoming } from '../../game/national/nationalGame';
import { nationInfo } from '../../game/countryProfile';
import { worldRank } from '../../game/national/ranking';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { MatchLine, TournamentBox } from '../../views/statistiken/NationalView';
import { NatFlag } from '../competition/CountryFlag';
import type { CountryTabProps } from './parts';

const fmtD = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export default function MatchesTab({ g, c }: CountryTabProps) {
  const today = g.calendar.currentDate;
  const nat = nationInfo(g, c);
  const wr = worldRank(g, c.code);
  if (!c.nation || !nat) {
    return <DashBox title="Länderspiele" span={3} rows={2}><Empty icon="international">Für {c.name} gibt es im Spiel keine Nationalmannschaft – keine Daten.</Empty></DashBox>;
  }
  const code = c.code;
  const st = nationalSeason(g);
  const games = nationMatches(g, code);
  const season = games.filter((m) => m.date >= `${g.season.slice(0, 4)}-07-01`);
  const bil = (list: typeof games) => list.reduce((a, m) => {
    const gf = m.a === code ? m.ga : m.gb, ga = m.a === code ? m.gb : m.ga;
    a.gf += gf; a.ga += ga;
    if (gf > ga || m.pw === code) a.w++; else if (gf < ga || (m.pw && m.pw !== code)) a.l++; else a.d++;
    return a;
  }, { w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const s = bil(season), all = bil(games);
  const next = upcoming(g);
  const t = st.tourn && today >= st.tourn.nominate ? st.tourn : null;
  const inT = !!t && t.teams.includes(code);
  const archive = [...st.archive].reverse();

  return (
    <>
      <DashBox title="Bilanz & Termine" right={wr ? `Weltrangliste: Platz ${wr.rank}` : undefined}>
        <KV k={`Saison ${g.season}`} v={season.length ? `${s.w} S · ${s.d} U · ${s.l} N · ${s.gf}:${s.ga}` : 'noch kein Länderspiel'} strong />
        <KV k="Gespeicherte Spiele" v={games.length ? `${all.w} S · ${all.d} U · ${all.l} N · ${all.gf}:${all.ga}` : '–'} />
        {!nat.exists && <div className="dnote">{c.name} besteht in dieser Saison nicht – die Spieler laufen für den Nachfolger auf.</div>}
        <div className="dsec">Nächste Termine (Länderspielkalender)</div>
        {next.length ? next.map((x) => <div key={x.date + x.text} className="nt-next"><span>{fmtD(x.date)}</span>{x.text}{x.hosts?.map((h) => <Fragment key={h}> <NatFlag nat={h} /></Fragment>)}</div>) : <div className="dnote">Keine Termine.</div>}
      </DashBox>

      <DashBox title="Länderspiele" span={2} right={games.length ? `${games.length}` : undefined}>
        {games.length ? <div className="nt-list">{games.map((m, i) => <MatchLine key={i} m={m} today={today} label={m.label} />)}</div>
          : <Empty icon="schedule">Noch keine Länderspiele gespeichert – das Spiel kennt die Länderspiele der laufenden Saison und des Turniers.</Empty>}
      </DashBox>

      <DashBox title={t ? `${t.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'} ${t.year}` : 'Turnier'} span={2}
        right={t ? (inT ? (today > t.end ? t.result[code] ?? 'Teilnehmer' : 'qualifiziert') : 'nicht dabei') : undefined}>
        {t && inT ? <TournamentBox t={t} today={today} home={code} mine={activeJob(g)?.nat} />
          : <Empty icon="trophy">{t ? `${c.name} ist bei diesem Turnier nicht dabei.` : `${next.find((x) => /meisterschaft/.test(x.text))?.text ?? 'Kein Turnier angesetzt'} – Aufgebote und Spielplan 25 Tage vor dem Anpfiff.`}</Empty>}
      </DashBox>

      <DashBox title="WM & EM im Spiel" right={`${nat.titles.wm.length + nat.titles.em.length} Titel`}>
        {archive.length ? (
          <div className="nt-list">
            {archive.map((a) => (
              <div key={a.kind + a.year} className={`nt-arow ${a.winner === code || a.runnerUp === code ? 'me' : ''}`}>
                <span className="nt-date">{a.kind} {a.year}</span>
                <span className="nt-pname"><NatFlag nat={a.winner} /> {natName(a.winner)}</span>
                <span className="nt-club">{a.winner === code ? 'Titel' : a.runnerUp === code ? 'Finale' : `vor ${natName(a.runnerUp)}`}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Seit deinem Start noch kein Turnier ausgespielt.</Empty>}
      </DashBox>
    </>
  );
}
