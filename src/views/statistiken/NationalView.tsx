// =============================================================================
// STATISTIKEN › NATIONALTEAMS (Wunsch Pascal, #36): Nationalmannschaft des
// Heimatlandes (Stärke, Rangliste, Termine), Aufgebot, deine Nationalspieler,
// laufendes/letztes Turnier (Gruppen + K.-o.), Länderspiele/Rangliste/Sieger.
// Logik: game/national/ (nationalGame.ts, pool.ts, tournament.ts).
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import { currentSquad, nationMatches, nationalSeason, natName, upcoming } from '../../game/national/nationalGame';
import { allStrengths } from '../../game/national/pool';
import { STAGE_LABEL, groupTable, type NtMatch, type Tournament } from '../../game/national/tournament';
import { homeNat } from '../../game/registrationGame';
import { clubNameOf } from '../../game/careerState';
import { worldClubInfo } from '../../game/worldPool';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { NatFlag } from '../../components/competition/CountryFlag';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { ClubLink } from '../../components/club/ClubLink';
import PosBadge from '../../components/PosBadge';
import type { Position } from '../../types';

const fmtD = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
const tName = (t: { kind: string; year: number }) => `${t.kind === 'WM' ? 'Weltmeisterschaft' : 'Europameisterschaft'} ${t.year}`;

function Score({ m, today }: { m: NtMatch; today: string }) {
  if (m.date > today) return <span className="nt-score off">–:–</span>;
  return <span className="nt-score">{m.ga}:{m.gb}{m.extra === 'nV' ? ' n.V.' : m.extra === 'iE' ? ' i.E.' : ''}</span>;
}

function MatchLine({ m, today, label }: { m: NtMatch; today: string; label?: string }) {
  return (
    <div className="nt-mrow">
      <span className="nt-date">{m.date.slice(8, 10)}.{m.date.slice(5, 7)}.</span>
      <span className="nt-team r">{natName(m.a)} <NatFlag nat={m.a} /></span>
      <Score m={m} today={today} />
      <span className="nt-team"><NatFlag nat={m.b} /> {natName(m.b)}{m.pw && m.date <= today ? ` (${natName(m.pw)})` : ''}</span>
      {label && <span className="nt-lab">{label}</span>}
    </div>
  );
}

function TournamentBox({ t, today, home }: { t: Tournament; today: string; home: string }) {
  const ko = t.matches.filter((m) => !m.stage.startsWith('G'));
  // Eine K.-o.-Runde erscheint erst, wenn die Runde davor komplett gespielt ist (keine Vorschau auf Weiterkommen).
  const order = ['G', ...new Set(ko.map((m) => m.stage))];
  const doneUpTo = (st: string) => t.matches.filter((m) => (st === 'G' ? m.stage.startsWith('G') : m.stage === st)).every((m) => m.date <= today);
  const stages = order.slice(1).filter((_, i) => doneUpTo(order[i]));
  const pending = order.slice(1).find((st) => !stages.includes(st));
  return (
    <div className={`nt-tourn ${t.groups.length ? '' : 'ko-only'}`}>
      {t.groups.length > 0 && <div className="nt-groups">
        {t.groups.map((gr) => (
          <div key={gr.name} className="nt-group">
            <div className="dsec">Gruppe {gr.name}</div>
            {groupTable(t, gr, today).map((r, i) => (
              <div key={r.c} className={`nt-grow ${r.c === home ? 'me' : ''}`}>
                <span className="rl-rank">{i + 1}</span><NatFlag nat={r.c} /><span className="nt-gname">{natName(r.c)}</span>
                <span>{r.p}</span><span>{r.gf}:{r.ga}</span><b>{r.pts}</b>
              </div>
            ))}
          </div>
        ))}
      </div>}
      <div className="nt-ko">
        {stages.map((s) => (
          <div key={s}>
            <div className="dsec">{STAGE_LABEL[s]}</div>
            {ko.filter((m) => m.stage === s).map((m, i) => <MatchLine key={i} m={m} today={today} />)}
          </div>
        ))}
        {pending && <div className="dnote">{STAGE_LABEL[pending]} ab {fmtD(t.matches.find((m) => m.stage === pending)!.date)} – Paarungen nach Abschluss der Runde davor.</div>}
        {today > t.end && <div className="nt-champ"><NatFlag nat={t.winner} height={20} /> {t.result[t.winner]}: <b>{natName(t.winner)}</b></div>}
      </div>
    </div>
  );
}

export function NationalView({ g }: { g: Game }) {
  const today = g.calendar.currentDate;
  const year = parseInt(today.slice(0, 4), 10);
  const st = nationalSeason(g);
  const home = homeNat(g);
  const strength = allStrengths(g);
  const rank = [...strength.entries()].sort((a, b) => b[1] - a[1]);
  const myRank = rank.findIndex(([c]) => c === home) + 1;
  const squad = currentSquad(g, home).sort((a, b) => (a.pos === 'TW' ? 0 : 1) - (b.pos === 'TW' ? 0 : 1) || b.ov - a.ov);
  const games = nationMatches(g, home);
  const season = games.filter((m) => m.date >= `${g.season.slice(0, 4)}-07-01`);
  const rec = season.reduce((a, m) => { const gf = m.a === home ? m.ga : m.gb, ga = m.a === home ? m.gb : m.ga; return gf > ga ? { ...a, w: a.w + 1 } : gf < ga ? { ...a, l: a.l + 1 } : { ...a, d: a.d + 1 }; }, { w: 0, d: 0, l: 0 });
  const next = upcoming(g);
  const club = g.clubs[g.managedClubId];
  const awayIds = new Set(Object.keys(st.away));
  const inSquad = new Set(squad.map((c) => c.id));
  const mine = club.playerIds.map((id) => g.players[id]).filter((p) => p && (p.intl?.caps || awayIds.has(p.id) || inSquad.has(p.id)))
    .sort((a, b) => (b.intl?.caps ?? 0) - (a.intl?.caps ?? 0));
  const t = st.tourn && today >= st.tourn.nominate ? st.tourn : null;
  const [tab, setTab] = useState<'spiele' | 'rang' | 'sieger'>('spiele');
  const coach = home === 'GER' ? 'der Bundestrainer' : 'der Nationaltrainer';
  const cName = (id: string) => g.clubs[id]?.name ?? worldClubInfo(g, id)?.name ?? clubNameOf(g, id);

  return (
    <DashPage className="nt-page">
      <DashBox title={`Nationalmannschaft ${natName(home)}`} info="nationalteams" right={<NatFlag nat={home} height={18} />}>
        <KV k="Stärke" v={<b style={{ color: vColor(strength.get(home) ?? 0) }}>{Math.round(strength.get(home) ?? 0)}</b>} strong />
        <KV k="Rangliste" v={myRank ? `${myRank}. von ${rank.length}` : '–'} />
        <KV k="Trainer" v={coach} />
        <KV k="Saisonbilanz" v={season.length ? `${rec.w} S · ${rec.d} U · ${rec.l} N` : 'noch kein Länderspiel'} />
        <div className="dsec">Nächste Termine</div>
        {next.length ? next.map((x) => <div key={x.date + x.text} className="nt-next"><span>{fmtD(x.date)}</span>{x.text}</div>) : <div className="dnote">Keine Termine.</div>}
      </DashBox>

      <DashBox title={t && !t.done ? `Aufgebot ${t.kind} ${t.year}` : 'Aufgebot'} right={`${squad.length}`}>
        <div className="nt-list">
          {squad.map((c) => (
            <div key={c.id} className="nt-prow" data-pid={c.full ? c.id : undefined}>
              <PosBadge pos={c.pos as Position} />
              <span className="nt-pname">{c.full ? <PlayerLink id={c.id}>{c.name}</PlayerLink> : c.name}</span>
              <span className="nt-club"><ClubLink id={c.clubId}>{cName(c.clubId)}</ClubLink></span>
              <b style={{ color: vColor(c.ov) }}>{c.ov}</b>
            </div>
          ))}
        </div>
      </DashBox>

      <DashBox title="Deine Nationalspieler" right={`${mine.length}`}>
        {mine.length ? (
          <div className="nt-list">
            {mine.map((p) => {
              const span = st.away[p.id];
              // Beim Turnier kein Enddatum zeigen (verriete das Abschneiden).
              const atT = span?.includes('|');
              const until = span && !atT ? span : null;
              return (
                <div key={p.id} className="nt-prow" data-pid={p.id}>
                  <NatFlag nat={p.nationality} />
                  <span className="nt-pname"><PlayerLink id={p.id}>{p.fullName}</PlayerLink></span>
                  <span className="nt-club">{atT ? (today >= span!.split('|')[0] ? `beim Turnier (${natName(p.nationality)})` : 'für das Turnier nominiert') : until ? `abgestellt bis ${until.slice(8, 10)}.${until.slice(5, 7)}.` : p.intl?.caps ? `${p.intl.caps} Spiele · ${p.intl.goals} Tore` : 'im Aufgebot, noch ohne Einsatz'}</span>
                </div>
              );
            })}
          </div>
        ) : <Empty icon="international">Noch kein Nationalspieler in deinem Kader.</Empty>}
      </DashBox>

      <DashBox title={t ? `${tName(t)} ${t.place}` : 'Turnier'} span={2}>
        {t ? <TournamentBox t={t} today={today} home={home} />
          : <Empty icon="trophy">{next.find((x) => /meisterschaft/.test(x.text))?.text ?? 'Kein Turnier angesetzt.'} – Aufgebote und Spielplan 25 Tage vor dem Anpfiff.</Empty>}
      </DashBox>

      <DashBox title="Länderspiele" right={<span className="nt-tabs">{([['spiele', 'Spiele'], ['rang', 'Rangliste'], ['sieger', 'Sieger']] as const).map(([k, l]) => (
          <button key={k} className={`dchip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>))}</span>}>
        {tab === 'spiele' && (games.length ? <div className="nt-list">{games.slice(0, 20).map((m, i) => <MatchLine key={i} m={m} today={today} label={m.label} />)}</div>
          : <Empty icon="schedule">Noch keine Länderspiele.</Empty>)}
        {tab === 'rang' && (
          <div className="nt-list">
            {rank.slice(0, 40).map(([c, v], i) => (
              <div key={c} className={`nt-prow ${c === home ? 'me' : ''}`}>
                <span className="rl-rank">{i + 1}</span><NatFlag nat={c} /><span className="nt-pname">{natName(c)}</span>
                <b style={{ color: vColor(v) }}>{Math.round(v)}</b>
              </div>
            ))}
          </div>
        )}
        {tab === 'sieger' && (st.archive.length ? (
          <div className="nt-list">
            {[...st.archive].reverse().map((a) => (
              <div key={a.kind + a.year} className="nt-arow">
                <span className="nt-date">{a.kind} {a.year}</span>
                <span className="nt-pname"><NatFlag nat={a.winner} /> {natName(a.winner)}</span>
                <span className="nt-club">vor {natName(a.runnerUp)} · {natName(home)}: {a.home}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="trophy">Seit deinem Start noch kein Turnier ausgespielt.</Empty>)}
        <div className="dnote mt8">Stand {year}: Stärke = Startelf aus den Spielern der Spielwelt, ergänzt um die Grundstärke des Landes.</div>
      </DashBox>
    </DashPage>
  );
}
