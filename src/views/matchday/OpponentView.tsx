// =============================================================================
// AUFSTELLUNG › GEGNER (Wunsch Pascal; früher Kategorie „Spieltag“): alles über
// den nächsten Gegner in Liga, Pokal, Europapokal oder Supercup.
// Aufbau nach Pascals Mockup: oben die Leiste „Nächstes Spiel“, darunter drei hohe
// Boxen – Begegnung (Ort, Termin) + direkter Vergleich | Gegner-Analyse (Kennzahlen,
// Netzdiagramm der Mannschaftsteile, gefährlichste Spieler) | So spielt der Gegner
// (Trainer, Ausrichtung, Grundordnung auf dem Feld, Tempo/Pressing/Abwehrlinie).
// Bausteine in opponent/parts.tsx, CSS `.opx-*` in 28-opponent.css.
// Daten: game/opponentView.ts.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { getFormation } from '../../data/formations';
import { COMP_DE } from '../office/career/parts';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { absences, h2hSummary, nextOpponent, oppName, oppStrength, unitCompare } from '../../game/opponentView';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDateShort } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import Icon from '../../components/Icon';
import { resolveLineup } from '../../engine/match/team';
import { seasonYearOf } from '../../engine/match/era';
import { avg, squadOf, tableRow } from '../shared';
import { DangerCard, FormationPitch, H2HBar, NextStrip, UnitRadar } from './opponent/parts';
import { useMemo } from 'react';
import { TAC_STYLE_DE } from '../categoryDashboards';

export function OpponentView({ g, onGoto, onWatch }: { g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void }) {
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
  const t = opp?.tactics;
  const homeId = nx ? (nx.home ? me : nx.opp) : '';
  const awayId = nx ? (nx.home ? nx.opp : me) : '';
  const side = (id: string) => (
    <ClubLink id={id} block className="opx-side">
      {g.clubs[id] ? <ClubCrest club={g.clubs[id]} size={84} /> : <span className="dvs-nocrest" />}
      <b>{oppName(g, id)}</b>
    </ClubLink>
  );
  const notFull = <Empty icon="watchlist">{name}: keine Kaderdaten – geschätzte Stärke {oppId ? oppStrength(g, oppId) : '–'}.</Empty>;
  const year = seasonYearOf(g.calendar.currentDate);
  // Grundordnung des Gegners: voraussichtliche Elf auf den Slots seiner Formation
  const dots = useMemo(() => {
    if (!opp || !full) return [];
    try {
      const lu = resolveLineup(opp, g.players, false, 0, { year });
      const slots = lu.slots ?? getFormation(lu.formation).slots;
      return lu.xi.map((x) => {
        const s = slots.find((sl) => sl.id === x.slot);
        return { x: s ? 6 + s.x * 0.88 : 50, y: s ? 8 + s.y * 1.14 : 65, nr: String(x.p.shirtNumber || ''), gk: x.pos === 'TW' };
      });
    } catch { return []; }
  }, [oppId, g.calendar.currentDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const hurt = new Map(out.map((o) => [o.p.id, o.why]));
  const danger = [...oppSquad].sort((a, b) => b.overall - a.overall).slice(0, 3);
  const venue = nx ? (nx.home ? myClub.stadium.name : opp?.stadium.name ?? '') : '';

  return (
    <DashPage rows={1} className="opx-page">
      <NextStrip g={g} nx={nx} />

      {/* Titel nicht noch einmal „Nächstes Spiel“ – das steht schon in der Leiste darüber */}
      <DashBox title="Begegnung" right={nx?.comp} className="opx-next">
        {nx ? (
          <>
            <div className="opx-vs">
              {side(homeId)}
              <div className="opx-vs-mid"><i />VS<i /></div>
              {side(awayId)}
            </div>
            <div className="opx-where">
              <span><Icon name="schedule" size={18} />{fmtDateShort(nx.date).dmy}</span>
              {venue && <span><Icon name="stadium" size={18} />{venue}</span>}
              <em>{nx.home ? 'Heimspiel' : 'Auswärts'}</em>
            </div>
            <div className="dsec">Direkter Vergleich (S-U-N) <InfoTip k="direktervergleich" /></div>
            {h2h && (h2h.w + h2h.d + h2h.l) > 0 ? (
              <>
                <H2HBar w={h2h.w} d={h2h.d} l={h2h.l} />
                <div className="opx-last">
                  {h2h.last.map((x, i) => (
                    <div key={i} className="opx-last-c">
                      <span>{fmtDateShort(x[1]).dmy} · {COMP_DE[x[2]] ?? x[2]}</span>
                      <b className={`dres dres-${x[4] > x[5] ? 'W' : x[4] < x[5] ? 'L' : 'D'}`}>{x[4]}:{x[5]}</b>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="dnote">Erstes Pflichtspiel gegeneinander.</div>}
          </>
        ) : <Empty icon="schedule">Kein weiteres Pflichtspiel angesetzt.</Empty>}
      </DashBox>

      <DashBox title="Gegner-Analyse" info="mannschaftsteile" className="opx-ana">
        {oppId ? full ? (
          <>
            <div className="opx-kpis">
              <Kpi value={oppRow ? `${oppRow.position}.` : '–'} label="Platz" />
              <Kpi value={Math.round(avg(oppSquad.map((p) => p.overall)))} label="Stärke" />
              <Kpi value={oppRow ? `${oppRow.goalsFor}:${oppRow.goalsAgainst}` : '–'} label="Tore" />
            </div>
            {units && <UnitRadar units={units} me={myClub.shortName || myClub.name} opp={opp?.shortName || name} meId={myClub.id} oppId={oppId} />}
            <div className="dsec">Gefährlichste Spieler</div>
            <div className="opx-danger">{danger.map((p) => <DangerCard key={p.id} club={opp!} p={p} hurt={hurt.get(p.id)} />)}</div>
          </>
        ) : notFull : <Empty icon="watchlist">Kein Gegner angesetzt.</Empty>}
      </DashBox>

      <DashBox title="So spielt der Gegner" info="mentalitaet" className="opx-plays">
        {t ? (
          <>
            <KV k="Trainer" v={opp?.coach ? opp.coach.name : '–'} strong />
            <KV k="Ausrichtung" v={TAC_STYLE_DE[t.style] ?? t.style} strong />
            <KV k="Grundordnung" v={getFormation(t.formation).label} strong />
            {dots.length > 0 && <FormationPitch dots={dots} />}
            <Meter label="Tempo" value={t.tempo} />
            <Meter label="Pressing" value={t.pressing} />
            <Meter label="Abwehrlinie" value={t.defensiveLine} />
          </>
        ) : oppId ? notFull : <Empty icon="tactics">Kein Gegner angesetzt.</Empty>}
      </DashBox>
    </DashPage>
  );
}
