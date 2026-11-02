import { useState } from 'react';
import { ClubLink } from '../../components/club/ClubLink';
import {
  INDOOR_LAST_WINTER, MASTERS_FIRST_WINTER, MASTERS_LAST_WINTER, MASTERS_TEAMS, REAL_MASTERS, indoorPhase, mastersMoney,
  mastersTv, mastersVenue, winterYearOf,
} from '../../data/indoorHistory';
import { INDOOR_SQUAD_LABEL, IndoorMatch, tourRanking, winnerOf } from '../../engine/indoor';
import { allTournaments, indoorName, indoorShort, setOwnIndoorDecision } from '../../game/indoorGame';
import { Game } from '../../game/state';
import { IndoorDecision, IndoorTournament, indoorState } from '../../game/winterShared';
import { DashBox, DashPage, Empty, KV, Meter } from '../../ui/DashPage';
import { fmtDM, fmtDay } from '../../ui/format';

// =============================================================================
// HALLE — Hallenturniere der Winterpause, Tour-Wertung, Hallen-Masters (1976–2004)
// Spielablauf: game/indoorGame.ts · Historie: data/indoorHistory.ts
// =============================================================================
const PHASE_TEXT: Record<string, string> = {
  invitational: 'Einladungsturniere ohne Endrunde – Budenzauber mit Bundesligisten in vollen Hallen.',
  masters: 'DFB-Hallenpokal: Qualifikationsturniere, Wertung nach Durchschnittspunkten, die Besten spielen das Masters.',
  regional: 'Nach dem Aus der Masters laufen nur noch ein paar regionale Turniere aus.',
  none: 'Keine Hallenturniere mit Profis.',
};

const STAGE: Record<string, string> = { A: 'Gr. A', B: 'Gr. B', SF: 'HF', P3: 'P3', F: 'Finale' };

export function IndoorView({ g, onChange }: { g: Game; onChange: () => void }) {
  const st = indoorState(g);
  const cur = st.current?.season === g.season ? st.current : undefined;
  const wy = winterYearOf(g.season);
  const phase = cur?.phase ?? indoorPhase(wy);
  const mid = g.managedClubId;
  const list = allTournaments(cur).sort((a, b) => a.date.localeCompare(b.date));
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const sel = list.find((t) => t.id === selId) ?? cur?.masters ?? [...list].reverse().find((t) => t.done) ?? list[0];
  const today = g.calendar.currentDate;

  const decide = (t: IndoorTournament, d: IndoorDecision) => { setNote(setOwnIndoorDecision(g, t.id, d)); onChange(); };

  const ownLabel = (t: IndoorTournament) => {
    if (t.own === undefined) return null;
    if (t.own === null) return <span style={{ color: 'var(--accent)' }}>Einladung offen</span>;
    if (t.own === 'decline') return <span className="muted">abgesagt</span>;
    return <span style={{ color: 'var(--green)' }}>Zusage · {INDOOR_SQUAD_LABEL[t.own]}</span>;
  };

  const tour = tourRanking(cur?.tour ?? []);
  // Reale Sieger nur bis zum aktuellen Winter (keine Vorschau auf die Zukunft).
  const realSoFar = REAL_MASTERS.filter((r) => r.year < wy || (r.year === wy && !!cur?.masters?.done)).reverse();
  const title = (id: string) => st.titles[id] ?? 0;
  const ownPhaseStatus = phase === 'none'
    ? (wy > INDOOR_LAST_WINTER ? `Seit ${INDOOR_LAST_WINTER + 1} keine Hallenturniere mehr` : 'Noch keine Hallensaison')
    : PHASE_TEXT[phase];

  return (
    <DashPage>
      <DashBox title={`Hallenwinter ${g.season}`} icon="kalender" span={2}
        right={cur?.phase && cur.phase !== 'none' ? `${list.filter((t) => t.done).length}/${list.length} gespielt` : undefined}>
        {!list.length ? (
          <Empty icon="kalender">{phase === 'none'
            ? (wy > INDOOR_LAST_WINTER ? 'Der Hallenfußball mit Profis ist Geschichte – die Winterpause gehört dem Trainingslager.' : 'Hallenturniere gibt es in dieser Saison nicht.')
            : 'Die Einladungen für die Hallenturniere kommen Anfang November.'}</Empty>
        ) : list.map((t) => {
          const mine = t.own !== undefined;
          const editable = mine && !t.done && t.date > today;
          return (
            <div key={t.id} className={`dlist-row clickable ${sel?.id === t.id ? 'win-sel' : ''}`} onClick={() => setSelId(t.id)}>
              <span className="meta" style={{ minWidth: 72 }}>{fmtDay(t.date)}{t.days > 1 ? ' +1' : ''}</span>
              <span className="grow">
                <b>{t.kind === 'masters' ? t.name : t.city}</b>
                <span className="muted"> · {t.hall}{t.kind !== 'masters' ? ` · ${t.clubIds.map((id) => indoorShort(g, id)).join(', ')}` : ''}</span>
              </span>
              {mine && <span className="mini nowrap">{ownLabel(t)}</span>}
              {editable && (
                <span className="dbtnrow" onClick={(e) => e.stopPropagation()}>
                  {(['stars', 'mix', 'youth'] as const).map((d) => (
                    <button key={d} className={`dchip ${t.own === d ? 'on' : ''}`} title={INDOOR_SQUAD_LABEL[d]} onClick={() => decide(t, d)}>
                      {d === 'stars' ? 'Stars' : d === 'mix' ? 'Mix' : 'Jugend'}
                    </button>
                  ))}
                  <button className={`dchip ${t.own === 'decline' ? 'on' : ''}`} onClick={() => decide(t, 'decline')}>Absage</button>
                </span>
              )}
              {t.done && t.result && <span className="meta">Sieger <b>{indoorShort(g, t.result.ranking[0])}</b>{t.result.ranking.includes(mid) ? ` · ihr: ${t.result.ranking.indexOf(mid) + 1}.` : ''}</span>}
            </div>
          );
        })}
        {note && <div className="dnote mt8" style={{ color: 'var(--accent)' }}>{note}</div>}
      </DashBox>

      <DashBox title="Hallenfußball" info="halle" icon="trophy" right={phase === 'masters' ? `Endrunde ${wy}` : undefined}>
        <div className="dnote" style={{ marginBottom: 8 }}>{ownPhaseStatus}</div>
        {phase === 'masters' && (
          <>
            <KV k="Endrunde" v={`${mastersVenue(wy).hall}, ${mastersVenue(wy).city}`} />
            <KV k="Teilnehmer" v={`${MASTERS_TEAMS} Beste der Tour`} />
            <KV k="Antrittsgeld" v={mastersMoney(wy).start ? fmtDM(mastersMoney(wy).start) : 'keines'} />
            <KV k="Siegprämie" v={fmtDM(mastersMoney(wy).winner)} />
            <KV k="Fernsehen" v={mastersTv(wy)} />
          </>
        )}
        <KV k="Masters-Titel (dein Verein)" v={String(title(mid))} />
        <KV k="Turniersiege (dein Verein)" v={String(st.wins[mid] ?? 0)} />
        <Meter label="Ärger über Absagen" value={Math.min(100, st.snub * 33)} color="var(--red)" text={st.snub >= 2 ? 'weniger Einladungen' : st.snub > 0 ? 'spürbar' : 'keiner'} />
        <div className="dnote mt8">Plus: Antrittsgeld, Fans, Spielpraxis für Reservisten, Moral bei Titeln. Minus: harter Boden und Bande (Verletzungen), müde Spieler, kürzere Pause, Konflikt mit dem Trainingslager.</div>
      </DashBox>

      <DashBox title={phase === 'masters' ? 'Tour-Wertung' : 'Turniersieger'} icon="stats" flush>
        {phase === 'masters' ? (tour.length ? (
          <table className="dtable">
            <thead><tr><th className="rl-rank">#</th><th>Verein</th><th className="num">T</th><th className="num">Sp</th><th className="num">Pkt</th><th className="num">Ø</th></tr></thead>
            <tbody>
              {tour.slice(0, 30).map((s, i) => (
                <tr key={s.id} className={s.id === mid ? 'me' : ''}>
                  <td className="rl-rank"><span className={`rl-z ${i < MASTERS_TEAMS ? 'zone-cl' : ''}`}>{i + 1}</span></td>
                  <td className="nowrap"><ClubLink id={s.id}><span className="rl-name">{indoorShort(g, s.id)}</span></ClubLink>{cur?.mastersDeclined?.includes(s.id) ? <span className="muted"> (verzichtet)</span> : ''}</td>
                  <td className="num">{s.tournaments}</td><td className="num">{s.games}</td><td className="num rl-main">{s.pts}</td>
                  <td className="num">{(s.pts / s.games).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon="stats">Noch keine Qualifikationsturniere gespielt.</Empty>) : (
          <div style={{ padding: '0 15px' }}>
            {list.filter((t) => t.done).length ? list.filter((t) => t.done).map((t) => (
              <div key={t.id} className="dlist-row"><span className="grow">{t.city}</span><b>{indoorName(g, t.result!.ranking[0])}</b></div>
            )) : <Empty icon="trophy">Noch keine Turniere gespielt.</Empty>}
          </div>
        )}
      </DashBox>

      <DashBox title={!sel ? 'Turnier' : sel.kind === 'masters' ? sel.name : `Turnier ${sel.city} ${fmtDay(sel.date)}`} icon="matchball">
        {!sel ? <Empty icon="matchball">Kein Turnier ausgewählt.</Empty> : !sel.done || !sel.result ? (
          <>
            <div className="dnote">{fmtDay(sel.date)} · {sel.hall}, {sel.city}</div>
            <div className="dsec">Teilnehmer</div>
            {sel.clubIds.length ? sel.clubIds.map((id) => (
              <div key={id} className="dlist-row"><span className="grow"><ClubLink id={id}>{indoorName(g, id)}</ClubLink></span>
                <span className="meta">{id === mid ? (sel.own && sel.own !== 'decline' ? INDOOR_SQUAD_LABEL[sel.own] : 'offen') : sel.squads[id] ? INDOOR_SQUAD_LABEL[sel.squads[id]] : ''}</span></div>
            )) : <div className="dnote">Das Teilnehmerfeld steht nach der letzten Qualifikation fest.</div>}
          </>
        ) : (
          <>
            {sel.result.tables.map((tb, gi) => (
              <div key={gi}>
                <div className="dsec">Gruppe {gi === 0 ? 'A' : 'B'}</div>
                {tb.map((r) => (
                  <div key={r.id} className={`dlist-row ${r.id === mid ? 'win-me' : ''}`}>
                    <span className="grow">{indoorShort(g, r.id)}</span><span className="meta">{r.gf}:{r.ga}</span><b>{r.pts}</b>
                  </div>
                ))}
              </div>
            ))}
            <div className="dsec">K.-o.-Runde</div>
            {sel.result.matches.filter((m) => m.stage !== 'A' && m.stage !== 'B').map((m, i) => <MatchLine key={i} g={g} m={m} mid={mid} />)}
          </>
        )}
      </DashBox>

      <DashBox title="Masters-Siegerliste" info="hallenMasters" icon="chronicle">
        {st.history.some((h) => h.mastersWinner) && <div className="dsec">In deinem Spiel</div>}
        {[...st.history].reverse().filter((h) => h.mastersWinner).map((h) => (
          <div key={h.year} className="dlist-row">
            <span className="meta" style={{ minWidth: 40 }}>{h.year}</span>
            <span className="grow"><b><ClubLink id={h.mastersWinner!}>{indoorShort(g, h.mastersWinner!)}</ClubLink></b> <span className="muted">{h.mastersScore} {h.mastersRunnerUp ? indoorShort(g, h.mastersRunnerUp) : ''}</span></span>
            <span className="meta">{h.city}</span>
          </div>
        ))}
        <div className="dsec">Wirklichkeit {MASTERS_FIRST_WINTER}–{MASTERS_LAST_WINTER}</div>
        {!realSoFar.length && <div className="dnote">Noch keine offizielle Endrunde – bis 1987 sind Hallenturniere reine Einladungsturniere.</div>}
        {realSoFar.map((r) => (
          <div key={r.year} className="dlist-row">
            <span className="meta" style={{ minWidth: 40 }}>{r.year}</span>
            <span className="grow">{r.winner} <span className="muted">{r.score} {r.runnerUp}{r.note ? ` (${r.note})` : ''}</span></span>
            <span className="meta">{r.city}</span>
          </div>
        ))}
      </DashBox>
    </DashPage>
  );
}

function MatchLine({ g, m, mid }: { g: Game; m: IndoorMatch; mid: string }) {
  const w = winnerOf(m);
  return (
    <div className={`dlist-row ${m.a === mid || m.b === mid ? 'win-me' : ''}`}>
      <span className="meta" style={{ minWidth: 48 }}>{STAGE[m.stage]}</span>
      <span className="grow"><span style={{ fontWeight: w === m.a ? 800 : 400 }}>{indoorShort(g, m.a)}</span> – <span style={{ fontWeight: w === m.b ? 800 : 400 }}>{indoorShort(g, m.b)}</span></span>
      <b>{m.ga}:{m.gb}</b>{m.pa != null && <span className="meta">({m.pa}:{m.pb} NM)</span>}
    </div>
  );
}
