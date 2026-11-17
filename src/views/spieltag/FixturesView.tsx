// =============================================================================
// AUFSTELLUNG › SPIELPLAN (Mockup Pascal): oben Leiste „Nächstes Pflichtspiel“
// mit Fanbild, links der eigene Spielplan nach Monaten (Anzeige Alle/Heim/Auswärts,
// Hin-/Rückrunde), rechts Saisonbilanz und der letzte/nächste Spieltag der Liga.
// Bausteine fixtures/parts.tsx, CSS `.fxp-*` in 28-fixtures.css.
// =============================================================================
import { useMemo, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { CalendarEngine } from '../../engine/calendar';
import { Game } from '../../game/state';
import { Match } from '../../types';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import Seg from '../../ui/Seg';
import Icon from '../../components/Icon';
import { resultFor } from '../shared';
import { moveLabel } from '../../game/fixtureWatch';
import { nextOpponent } from '../../game/opponentView';
import type { Screen } from '../../shell/navigation';
import { clubCodes, FixtureStrip } from './fixtures/parts';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const dm = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}.`;

function bilanz(ms: Match[], clubId: string) {
  let w = 0, d = 0, l = 0, gf = 0, ga = 0;
  for (const m of ms) {
    if (!m.result) continue;
    const home = m.homeClubId === clubId;
    gf += home ? m.result.homeGoals : m.result.awayGoals;
    ga += home ? m.result.awayGoals : m.result.homeGoals;
    const r = resultFor(m, clubId);
    if (r === 'W') w++; else if (r === 'D') d++; else l++;
  }
  return { w, d, l, gf, ga };
}

type Side = 'all' | 'home' | 'away';
type Half = 1 | 2;

export function FixturesView({ g, onWatch, onGoto }: { g: Game; onWatch: (id: string) => void; onGoto?: (s: Screen) => void }) {
  const mid = g.managedClubId;
  const myMatches = useMemo(() => g.fixtures.filter((m) => m.involvesPlayerClub).sort((a, b) => a.date.localeCompare(b.date) || a.matchday - b.matchday), [g.fixtures]);
  const played = myMatches.filter((m) => m.status === 'finished');
  const maxMd = myMatches.reduce((a, m) => Math.max(a, m.matchday), 0);
  const halfOf = (m: Match): Half => (m.matchday <= Math.ceil(maxMd / 2) ? 1 : 2);
  const nextLeague = myMatches.find((m) => m.status === 'scheduled');
  const [side, setSide] = useState<Side>('all');
  const [half, setHalf] = useState<Half>(nextLeague ? halfOf(nextLeague) : played.length ? halfOf(played[played.length - 1]) : 1);

  const home = bilanz(played.filter((m) => m.homeClubId === mid), mid);
  const away = bilanz(played.filter((m) => m.awayClubId === mid), mid);
  const w = home.w + away.w, d = home.d + away.d, l = home.l + away.l;
  const winPts = g.pointSystem === '3-point' ? 3 : 2;
  const pts = w * winPts + d;
  const lastMd = played.length ? played[played.length - 1].matchday : null;
  const showMd = lastMd ?? nextLeague?.matchday ?? null;
  const mdMatches = showMd != null ? g.fixtures.filter((m) => m.matchday === showMd) : [];
  const codes = useMemo(() => {
    const names: Record<string, string> = {};
    for (const m of mdMatches) for (const id of [m.homeClubId, m.awayClubId]) names[id] = g.clubs[id]?.shortName ?? g.clubs[id]?.name ?? id;
    return clubCodes(names);
  }, [mdMatches, g.clubs]);

  const rows = myMatches.filter((m) => halfOf(m) === half && (side === 'all' || (side === 'home') === (m.homeClubId === mid)));
  const nx = nextOpponent(g);
  const body: JSX.Element[] = [];
  let month = '';
  for (const m of rows) {
    const mk = m.date.slice(0, 7);
    if (mk !== month) {
      month = mk;
      body.push(<tr key={`m-${mk}`} className="fxp-month"><td colSpan={6}><Icon name="schedule" size={16} />{MONTHS[+mk.slice(5, 7) - 1]} {mk.slice(0, 4)}</td></tr>);
    }
    const isHome = m.homeClubId === mid;
    const oppId = isHome ? m.awayClubId : m.homeClubId;
    const opp = g.clubs[oppId];
    const r = resultFor(m, mid);
    const score = m.result ? (isHome ? `${m.result.homeGoals}:${m.result.awayGoals}` : `${m.result.awayGoals}:${m.result.homeGoals}`) : '–:–';
    const isNext = m.id === nextLeague?.id;
    body.push(
      <tr key={m.id} className={isNext ? 'me fxp-next' : ''}>
        <td className="fxp-md">{m.matchday}</td>
        <td className="fxp-dt">
          {CalendarEngine.formatDate(m.date)}
          {m.moved && <span className="fx-tag" title={moveLabel(m) ?? undefined}>{m.moved.makeup ? 'Nachholspiel' : 'verlegt'}</span>}
        </td>
        <td className="fxp-where">{isHome ? 'Heim' : 'Ausw.'}</td>
        <td><ClubLink id={oppId}><span className="fxp-opp">{opp && <ClubCrest club={opp} size={24} />}<span>{opp?.name ?? oppId}</span></span></ClubLink></td>
        <td className="ctr"><span className={`fxp-res ${r ? 'r-' + r : ''}`}>{score}</span></td>
        <td className="num">{m.status === 'finished' && <button className="b3 b3-s fxp-rep" onClick={() => onWatch(m.id)}>Bericht</button>}</td>
      </tr>,
    );
  }

  const n = Math.max(1, w + d + l);
  return (
    <div className="dpage fxp-page">
      <FixtureStrip g={g} nx={nx} onOpponent={() => onGoto?.('cat-spieltag')} />

      <DashBox title={`Spielplan ${g.season}`} span={2} className="fxp-plan" info="spielplan" right={`${played.length} von ${myMatches.length} gespielt`} flush>
        <div className="fxp-filters">
          <span className="fxp-flabel">Anzeige:</span>
          <Seg<Side> size="s" value={side} onChange={setSide} options={[{ v: 'all', label: 'Alle' }, { v: 'home', label: 'Heim' }, { v: 'away', label: 'Auswärts' }]} />
          <span className="fxp-fsep" />
          <span className="fxp-flabel">Runde:</span>
          <Seg<Half> size="s" value={half} onChange={setHalf} options={[{ v: 1, label: 'Hinrunde' }, { v: 2, label: 'Rückrunde' }]} />
        </div>
        <div className="fxp-scroll">
          {rows.length ? (
            <table className="dtable fxp-table">
              <thead><tr><th>St</th><th>Datum</th><th>Ort</th><th>Gegner</th><th className="ctr">Ergebnis</th><th /></tr></thead>
              <tbody>{body}</tbody>
            </table>
          ) : <Empty icon="schedule">Keine Spiele in dieser Auswahl.</Empty>}
        </div>
      </DashBox>

      <DashBox title="Saisonbilanz" className="fxp-bil">
        <div className="fxp-kpis">
          <div><b>{pts}</b><span>Punkte</span></div>
          <div><b>{home.gf + away.gf}:{home.ga + away.ga}</b><span>Tore</span></div>
          <div><b>{w}-{d}-{l}</b><span>S-U-N</span></div>
        </div>
        <div className="fxp-wdl">
          {w > 0 && <span className="w" style={{ flexGrow: w / n }}>{w} {w === 1 ? 'Sieg' : 'Siege'}</span>}
          {d > 0 && <span className="d" style={{ flexGrow: d / n }}>{d} U</span>}
          {l > 0 && <span className="l" style={{ flexGrow: l / n }}>{l} N</span>}
          {w + d + l === 0 && <span className="e">Noch kein Spiel</span>}
        </div>
        <KV k="Heim (S-U-N, Tore)" v={`${home.w}-${home.d}-${home.l} · ${home.gf}:${home.ga}`} />
        <KV k="Auswärts (S-U-N, Tore)" v={`${away.w}-${away.d}-${away.l} · ${away.gf}:${away.ga}`} />
        <KV k="Punkte Heim / Auswärts" v={`${home.w * winPts + home.d} / ${away.w * winPts + away.d}`} />
        <KV k="Ø Tore pro Spiel" v={played.length ? ((home.gf + away.gf) / played.length).toFixed(2) : '–'} />
      </DashBox>

      <DashBox title={showMd != null ? `${showMd}. Spieltag` : 'Spieltag'} className="fxp-md-box" right={lastMd ? 'Ergebnisse' : 'Paarungen'}>
        {mdMatches.length ? (
          <div className="fxp-mdlist">
            {mdMatches.map((m) => {
              const mine = m.homeClubId === mid || m.awayClubId === mid;
              const team = (id: string, right: boolean) => (
                <ClubLink id={id} className={`fxp-mdt ${right ? 'r' : ''}`}>
                  {!right && g.clubs[id] && <ClubCrest club={g.clubs[id]} size={24} />}
                  <span title={g.clubs[id]?.name}>{codes[id]}</span>
                  {right && g.clubs[id] && <ClubCrest club={g.clubs[id]} size={24} />}
                </ClubLink>
              );
              return (
                <div key={m.id} className={`fxp-mdrow ${mine ? 'me' : ''} ${m.status === 'finished' ? 'clickable' : ''}`} onClick={() => m.status === 'finished' && onWatch(m.id)}>
                  {team(m.homeClubId, false)}
                  <span className="fxp-mdres">{m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : m.moved?.makeup ? dm(m.date) : '–:–'}</span>
                  {team(m.awayClubId, true)}
                </div>
              );
            })}
          </div>
        ) : <Empty icon="schedule">Kein Spieltag.</Empty>}
      </DashBox>
    </div>
  );
}
