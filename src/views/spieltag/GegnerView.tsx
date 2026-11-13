// =============================================================================
// AUFSTELLUNG › GEGNER (Wunsch Pascal; früher Kategorie „Spieltag“): alles über
// den nächsten Gegner in Liga, Pokal, Europapokal oder Supercup.
// Boxen: Nächstes Spiel + direkter Vergleich | Gegner-Analyse | So spielt der Gegner
//        Mannschaftsteile im Vergleich | Form & letzte Spiele | Ausfälle & Torjäger
// Daten: game/opponentView.ts.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { getFormation } from '../../data/formations';
import { COMP_DE } from '../zentrale/career/parts';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { absences, h2hSummary, homeAwayRecord, nextOpponent, oppName, oppStrength, recentMatches, topScorers, unitCompare } from '../../game/opponentView';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDateShort, vColor } from '../../ui/format';
import { FormDots, MatchRow, PlayerRow, avg, squadOf, tableRow } from '../shared';
import { TAC_STYLE_DE } from '../categoryDashboards';

const rec = (r: number[]) => `${r[0]}-${r[1]}-${r[2]} · ${r[3]}:${r[4]}`;

export function GegnerView({ g, onGoto, onWatch }: { g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void }) {
  const me = g.managedClubId;
  const myClub = g.clubs[me];
  const nx = nextOpponent(g);
  const oppId = nx?.opp ?? null;
  const opp = oppId ? g.clubs[oppId] : undefined;
  const full = !!opp && opp.playerIds.length > 0;
  const name = oppId ? oppName(g, oppId) : '';
  const oppRow = oppId ? tableRow(g, oppId) : undefined;
  const oppSquad = oppId ? squadOf(g, oppId) : [];
  const mySquad = squadOf(g);
  const h2h = oppId ? h2hSummary(g, oppId) : null;
  const units = oppId ? unitCompare(g, oppId) : null;
  const out = oppId ? absences(g, oppId) : [];
  const scorers = oppId ? topScorers(g, oppId) : [];
  const recent = oppId ? recentMatches(g, oppId) : [];
  const ha = oppId ? homeAwayRecord(g, oppId) : null;
  const t = opp?.tactics;
  const homeId = nx ? (nx.home ? me : nx.opp) : '';
  const awayId = nx ? (nx.home ? nx.opp : me) : '';
  const side = (id: string) => (
    <ClubLink id={id} block className="dvs-side">
      {g.clubs[id] ? <ClubCrest club={g.clubs[id]} size={72} /> : <span className="dvs-nocrest" />}
      <b>{oppName(g, id)}</b>
    </ClubLink>
  );
  const notFull = <Empty icon="watchlist">{name}: keine Kaderdaten – geschätzte Stärke {oppId ? oppStrength(g, oppId) : '–'}.</Empty>;

  return (
    <DashPage>
      <DashBox title="Nächstes Spiel" onClick={() => onGoto('fixtures')} right={nx?.comp}>
        {nx ? (
          <>
            <div className="dvs">
              {side(homeId)}
              <div className="dvs-mid">VS<span>{fmtDateShort(nx.date).dmy}</span></div>
              {side(awayId)}
            </div>
            <KV k="Spielort" v={nx.home ? `Heimspiel · ${myClub.stadium.name}` : `Auswärts${opp ? ` · ${opp.stadium.name}` : ''}`} />
            {h2h && (h2h.w + h2h.d + h2h.l) > 0 ? (
              <>
                <KV k="Direkter Vergleich (S-U-N)" info="direktervergleich" v={`${h2h.w}-${h2h.d}-${h2h.l} · ${h2h.gf}:${h2h.ga}`} strong />
                {h2h.last.map((x, i) => (
                  <div key={i} className="dlist-row">
                    <span className="meta" style={{ minWidth: 64 }}>{fmtDateShort(x[1]).dmy}</span>
                    <span className="grow muted">{COMP_DE[x[2]] ?? x[2]} · {x[3] ? 'Heim' : 'Auswärts'}</span>
                    <span className={`dres dres-${x[4] > x[5] ? 'W' : x[4] < x[5] ? 'L' : 'D'}`}>{x[4]}:{x[5]}</span>
                  </div>
                ))}
              </>
            ) : <KV k="Direkter Vergleich" v="erstes Duell" />}
          </>
        ) : <Empty icon="schedule">Kein weiteres Pflichtspiel angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Gegner-Analyse" right={opp?.shortName ?? (name || undefined)}>
        {oppId ? full ? (
          <>
            <div className="dkpis">
              <Kpi value={oppRow ? `${oppRow.position}.` : '–'} label="Platz" />
              <Kpi value={Math.round(avg(oppSquad.map((p) => p.overall)))} label="Ø Stärke" sub={`wir: ${Math.round(avg(mySquad.map((p) => p.overall)))}`} />
              <Kpi value={oppRow ? `${oppRow.goalsFor}:${oppRow.goalsAgainst}` : '–'} label="Tore" />
            </div>
            {oppRow && <KV k="Form" v={<FormDots form={oppRow.form} />} />}
            <div className="dsec">Gefährlichste Spieler</div>
            {[...oppSquad].sort((a, b) => b.overall - a.overall).slice(0, 3).map((p) => <PlayerRow key={p.id} p={p} value={p.overall} />)}
          </>
        ) : notFull : <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="So spielt der Gegner" info="mentalitaet" right={t ? getFormation(t.formation).label : undefined}>
        {t ? (
          <>
            <KV k="Trainer" v={opp?.coach ? opp.coach.name : '–'} />
            <KV k="Ausrichtung" v={TAC_STYLE_DE[t.style] ?? t.style} strong />
            <Meter label="Tempo" value={t.tempo} />
            <Meter label="Pressing" value={t.pressing} />
            <Meter label="Abwehrlinie" value={t.defensiveLine} />
            <KV k="Spielaufbau" v={t.buildup === 'long' ? 'Lange Bälle' : 'Kurzpassspiel'} />
            <div className="dnote">Stell dich darauf ein: gegen hohes Pressing helfen lange Bälle, gegen eine hohe Abwehrlinie schnelle Spitzen.</div>
          </>
        ) : oppId ? notFull : <Empty icon="tactics">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Mannschaftsteile im Vergleich" info="mannschaftsteile" onClick={() => onGoto('lineup')}>
        {units ? (
          <>
            <div className="opp-units-head"><span /><span>{myClub.shortName}</span><span>{opp?.shortName}</span></div>
            {units.map((u) => (
              <div key={u.key} className="opp-unit">
                <span className="opp-unit-k">{u.label}</span>
                <b style={{ color: vColor(u.us) }}>{u.us || '–'}</b>
                <b style={{ color: vColor(u.them) }}>{u.them || '–'}</b>
                <span className={`opp-unit-d ${u.us - u.them > 1 ? 'pos' : u.us - u.them < -1 ? 'neg' : ''}`}>{u.us - u.them > 0 ? '+' : ''}{u.us - u.them}</span>
              </div>
            ))}
            <KV k="Ø Alter" v={`${avg(mySquad.map((p) => p.age)).toFixed(1)} · ${avg(oppSquad.map((p) => p.age)).toFixed(1)}`} />
            <div className="dnote">Ø der Besten je Teil: Torwart 1, Abwehr 4, Mittelfeld 4, Angriff 2.</div>
          </>
        ) : oppId ? notFull : <Empty icon="squad">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Form & letzte Spiele" right={name || undefined}>
        {oppId && recent.length ? (
          <>
            {ha && <KV k={nx?.home ? 'Auswärtsbilanz (S-U-N)' : 'Heimbilanz (S-U-N)'} v={rec(nx?.home ? ha.away : ha.home)} strong />}
            {recent.map((m) => <MatchRow key={m.id} g={g} m={m} clubId={oppId} onClick={() => onWatch(m.id)} />)}
          </>
        ) : <Empty icon="stats">{oppId ? `Von ${name} liegen keine Spiele dieser Saison vor.` : 'Kein Gegner angesetzt.'}</Empty>}
      </DashBox>

      <DashBox title="Ausfälle & Torjäger" right={out.length ? `${out.length} fehlen` : undefined}>
        {full ? (
          <>
            <div className="dsec">Ausfälle</div>
            {out.length ? out.slice(0, 4).map(({ p, why }) => <PlayerRow key={p.id} p={p} sub={why} value={p.overall} />)
              : <div className="dnote">Keine Ausfälle bekannt.</div>}
            <div className="dsec">Torjäger</div>
            {scorers.length ? scorers.map((p) => <PlayerRow key={p.id} p={p} sub={`${p.seasonStats.appearances} Spiele`} value={`${p.seasonStats.goals} T`} />)
              : <div className="dnote">Noch keine Tore in dieser Saison.</div>}
          </>
        ) : oppId ? notFull : <Empty icon="injury">Kein Gegner angesetzt.</Empty>}
      </DashBox>
    </DashPage>
  );
}
