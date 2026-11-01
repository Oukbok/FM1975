// =============================================================================
// Info-Box rechts unten: Saisonbilanz bzw. „Deine Lage“ / „Dein Weg“
// =============================================================================
import { CalendarEngine } from '../../../engine/calendar';
import type { CompSnapshot } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import { DashBox, KV } from '../../../ui/DashPage';
import { fmtDMfull } from '../../../ui/format';
import { TeamName } from './parts';
import { groupBonusEur } from '../../../data/euroFormats';
import { seasonStartYear } from '../../../data/timeline';
import { DM_PER_EUR } from '../../../engine/economy';

export function InfoBox({ g, snap }: { g: Game; snap: CompSnapshot | null }) {
  const mid = g.managedClubId;
  if (!snap) return <DashBox title="Saison" icon="chronicle"><div className="dnote">–</div></DashBox>;
  const T = (id: string) => <TeamName g={g} id={id} season={snap.season} size={16} />;

  if (snap.kind === 'league') {
    const rows = snap.table ?? [];
    const my = rows.find((r) => r.clubId === mid);
    const top = rows[0];
    const goals = rows.reduce((s, r) => s + r.gf, 0);
    const games = rows.reduce((s, r) => s + r.p, 0) / 2;
    const done = snap.source !== 'live';
    return (
      <DashBox title={done ? 'Saisonbilanz' : 'Deine Lage'} icon={done ? 'chronicle' : 'dashVerein'} right={snap.label}>
        {top && <KV k={done ? 'Meister' : 'Tabellenführer'} v={T(top.clubId)} strong />}
        {my && <>
          <KV k={done ? 'Dein Verein' : 'Platz'} v={`${my.pos}. · ${my.pts} Pkt.`} />
          {!done && top && top.clubId !== mid && <KV k="Rückstand auf Platz 1" v={`${top.pts - my.pts} Pkt.`} />}
        </>}
        {!snap.placingsOnly && games > 0 && <KV k="Tore gesamt · Ø pro Spiel" v={`${goals} · ${(goals / games).toFixed(2)}`} />}
        {(snap.tier === 1 || snap.tier === 101) && done && rows.length > 2 && (
          <KV k="Absteiger" v={<span className="cmp-inline">{rows.slice(snap.source === 'history' || snap.tier === 101 ? -2 : -3).map((r) => <span key={r.clubId}>{T(r.clubId)}</span>)}</span>} />
        )}
        <div className="dsec">Legende</div>
        <div className="dzones">
          {snap.tier === 1 ? <>
            <span><span className="pos-badge zone-cl" /> Meister</span>
            {snap.source !== 'history' && <span><span className="pos-badge zone-eu" /> Europapokal</span>}
            <span><span className="pos-badge zone-rel" /> Abstieg</span>
          </> : snap.tier === 2 ? <>
            <span><span className="pos-badge zone-cl" /> Aufstieg</span>
            <span><span className="pos-badge zone-eu" /> Aufstiegsspiel</span>
          </> : <><span><span className="pos-badge zone-cl" /> Meister</span>{snap.tier === 101 && <span><span className="pos-badge zone-rel" /> Abstieg</span>}</>}
        </div>
        {snap.note && <div className="dnote mt8">{snap.note}</div>}
      </DashBox>
    );
  }

  // Pokal
  const rounds = snap.rounds ?? [];
  const mine = rounds.flatMap((r) => r.ties.filter((t) => t.mine).map((t) => ({ r, t })));
  const prize = snap.source === 'live' && snap.key === 'cup' ? g.cup?.prizeByRound : undefined;
  const nextMine = snap.source === 'live' ? mine.find(({ t }) => t.winner == null) : undefined;
  // Gruppen/Ligaphase: eigener Platz und nächstes Gruppenspiel.
  const myGroups = rounds.flatMap((r) => (r.groups ?? []).filter((gr) => gr.rows.some((x) => x.id === mid)).map((gr) => ({ r, gr })));
  const nextGroup = snap.source === 'live' && !nextMine ? rounds.flatMap((r) => (r.matches ?? []).filter((m) => m.mine && m.hg == null).map((m) => ({ r, m })))[0] : undefined;
  const euroKey = snap.key === 'ec' || snap.key === 'cwc' || snap.key === 'uefa' ? snap.key : null;
  const bonus = snap.source === 'live' && euroKey && rounds.some((r) => r.groups?.length) ? groupBonusEur(euroKey, seasonStartYear(snap.season)) : null;
  const nextLegDate = nextMine?.t.legDates?.find((d, i) => i >= (nextMine.t.legs?.length ?? 0)) ?? nextMine?.t.date;
  return (
    <DashBox title={mine.length || myGroups.length ? 'Dein Weg' : 'Saisonbilanz'} icon={mine.length || myGroups.length ? 'dashBall' : 'trophy'} right={snap.label}>
      {snap.winner ? <KV k="Sieger" v={T(snap.winner)} strong /> : <KV k="Sieger" v="steht noch aus" />}
      {snap.final && <KV k="Endspiel" v={<span className="cmp-inline">{T(snap.final.winner)} {snap.final.score} {T(snap.final.runnerUp)}</span>} />}
      {nextMine && <>
        <div className="dsec">Nächstes Spiel</div>
        <KV k={`${nextMine.r.name}${nextMine.t.agg ? ((nextMine.t.legs?.length ?? 0) ? ' · Rückspiel' : ' · Hinspiel') : ''}`} v={nextLegDate ? CalendarEngine.formatDate(nextLegDate) : '–'} />
        {nextMine.t.agg && (nextMine.t.legs?.length ?? 0) === 1 && <KV k="Hinspiel" v={`${nextMine.t.legs![0][nextMine.t.home === mid ? 0 : 1]}:${nextMine.t.legs![0][nextMine.t.home === mid ? 1 : 0]}`} />}
        <KV k="Gegner" v={T(nextMine.t.home === mid ? nextMine.t.away : nextMine.t.home)} />
      </>}
      {nextGroup && <>
        <div className="dsec">Nächstes Spiel</div>
        <KV k={`${nextGroup.r.name}, ${nextGroup.m.md + 1}. Spieltag`} v={CalendarEngine.formatDate(nextGroup.m.date)} />
        <KV k={nextGroup.m.home === mid ? 'Heim gegen' : 'Auswärts bei'} v={T(nextGroup.m.home === mid ? nextGroup.m.away : nextGroup.m.home)} />
      </>}
      {myGroups.map(({ r, gr }) => {
        const pos = gr.rows.findIndex((x) => x.id === mid) + 1;
        const row = gr.rows[pos - 1];
        return <KV key={`${r.index}-${gr.name}`} k={`${r.name}${r.kind === 'league' ? '' : ` · Gruppe ${gr.name}`}`} v={`Platz ${pos} · ${row.pts} Pkt. · ${row.gf}:${row.ga}`} />;
      })}
      {mine.some(({ t }) => t.winner != null) && <div className="dsec">Gespielt</div>}
      {mine.filter(({ t }) => t.winner != null).map(({ r, t }) => {
        const home = t.home === mid;
        return (
          <div key={t.id} className="dlist-row">
            <span className="meta" style={{ minWidth: 100 }}>{r.name}</span>
            <span className="grow">{T(home ? t.away : t.home)}</span>
            <span className={`dres dres-${t.winner === mid ? 'W' : 'L'}`}>{home ? `${t.hg}:${t.ag}` : `${t.ag}:${t.hg}`}{t.awayGoals ? ' Ausw.' : t.dec === 1 ? ' n. V.' : t.dec === 2 ? ' i. E.' : ''}{t.legs?.length === 2 && !t.agg ? ' Wdh.' : ''}</span>
          </div>
        );
      })}
      {bonus && <>
        <div className="dsec">Prämie je Gruppen-/Ligaspiel</div>
        <KV k="Sieg · Unentschieden" v={`${fmtDMfull(Math.round(bonus.win * DM_PER_EUR))} · ${fmtDMfull(Math.round(bonus.draw * DM_PER_EUR))}`} />
      </>}
      {prize && <>
        <div className="dsec">Preisgeld je Sieg</div>
        <div className="cmp-prize">{rounds.map((r, i) => <KV key={r.index} k={r.name} v={fmtDMfull(prize[i] ?? 0)} />)}</div>
      </>}
      {snap.note && <div className="dnote mt8">{snap.note}</div>}
    </DashBox>
  );
}
