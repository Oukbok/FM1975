// =============================================================================
// ZENTRALE in der Ansicht Nationalteam (Wunsch Pascal): Kurz-Widgets links/rechts
// neben dem Newscenter – nächstes Länderspiel, Aufgebot, verletzte Kandidaten |
// Ziel & Vertrauen, Gruppe bzw. Bilanz, Weltrangliste. Rahmen `Widget` aus dash/LeftWidgets.
// =============================================================================
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { NatFlag } from '../../components/competition/CountryFlag';
import PosBadge from '../../components/PosBadge';
import { activeJob, defOfKey, tLong } from '../../game/national/nationalJob';
import { nationalState, natName } from '../../game/national/nationalGame';
import { candidatesByNation } from '../../game/national/pool';
import { rankingRows } from '../../game/national/ranking';
import { groupTable } from '../../game/national/tournament';
import { ddmm, jobCalendar, recText } from '../../game/national/nationalJobView';
import { condBar, condColor } from '../../ui/format';
import { InfoTip } from '../../ui/InfoTip';
import { Widget } from '../zentrale/dash/LeftWidgets';
import type { Position } from '../../types';

type Go = (s: Screen) => void;

function NextWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const today = g.calendar.currentDate;
  const list = jobCalendar(g).filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  return (
    <Widget title="Nächste Termine" to="nationalteam" onGoto={onGoto}>
      {list.length ? <div className="ntw-list">{list.map((e) => (
        <div key={e.date + e.line} className={`ntw-row ${e.own ? 'own' : ''}`}><span className="dz-dim">{ddmm(e.date)}</span><span className="ntw-txt">{e.line.replace(/^Nationalteam: /, '')}</span></div>
      ))}</div> : <div className="dz-empty">Keine Termine in dieser Saison.</div>}
    </Widget>
  );
}

function SquadWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const p = activeJob(g)?.pick;
  return (
    <Widget title="Aufgebot" info="ntAufgebot" to="nationalteam" onGoto={onGoto}>
      {p && !p.used ? <>
        <div className="dz-kv"><span>Für</span><b className="ntw-ell">{p.label}</b></div>
        <div className="dz-kv"><span>Spieler</span><b>{p.ids.length} / {p.size}</b></div>
        <div className="dz-kv"><span>Stichtag</span><b>{ddmm(p.date)}</b></div>
        <div className="dz-kv"><span>Stand</span><b>{p.confirmed ? 'gemeldet' : p.touched ? 'in Arbeit' : 'Vorschlag Co-Trainer'}</b></div>
      </> : <div className="dz-empty">Gerade kein Aufgebot zu nominieren.</div>}
    </Widget>
  );
}

function InjuredWidget({ g, onGoto, openPlayer }: { g: Game; onGoto: Go; openPlayer: (id: string) => void }) {
  const job = activeJob(g)!;
  const top = (candidatesByNation(g).get(job.nat) ?? []).slice(0, 45);
  const hurt = top.map((c) => ({ c, p: g.players[c.id] })).filter((x) => x.p?.injury).slice(0, 6);
  return (
    <Widget title="Verletzte Kandidaten" to="nationalteam" onGoto={onGoto}>
      {hurt.length ? <div className="dz-grid dz-abs">
        {hurt.map(({ c, p }) => (
          <div key={c.id} className="dz-tr clickable" onClick={(e) => { e.stopPropagation(); openPlayer(c.id); }}>
            <span className="dz-cn"><PosBadge pos={c.pos as Position} /> {p!.lastName || c.name}</span>
            <span className="dz-tag injury">Verletzt</span>
            <span className="dz-r">{p!.injury!.daysRemaining ?? '–'} T.</span>
          </div>
        ))}
      </div> : <div className="dz-empty">Alle wichtigen Kandidaten sind fit.</div>}
    </Widget>
  );
}

function GoalWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const job = activeJob(g)!;
  const def = defOfKey(job.untilKey);
  const v = job.trust;
  return (
    <Widget title={`Nationalteam ${natName(job.nat)}`} to="nationalteam" onGoto={onGoto} right={<NatFlag nat={job.nat} height={14} />}>
      <div className="dz-kv"><span>Vertrag</span><b>{def ? `bis ${tLong(def)}` : job.untilKey}</b></div>
      <div className="dz-kv"><span>Ziel<InfoTip k="ntZiel" /></span><b className="ntw-ell">{job.goal?.label ?? '–'}</b></div>
      <div className="dz-bar"><span>Vertrauen<InfoTip k="ntVertrauen" /></span><span className="dz-track"><i style={{ width: `${Math.max(2, v)}%`, background: condBar(v) }} /></span><b style={{ color: condColor(v) }}>{v}</b></div>
      <div className="dz-kv"><span>Bilanz</span><b>{job.record.total.p ? `${recText(job.record.total)} · ${job.record.total.gf}:${job.record.total.ga}` : 'noch kein Spiel'}</b></div>
    </Widget>
  );
}

function GroupWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const job = activeJob(g)!;
  const t = nationalState(g).tourn;
  const today = g.calendar.currentDate;
  const gr = t && !t.done && today >= t.start ? t.groups.find((x) => x.teams.includes(job.nat)) : null;
  if (gr && t) {
    return (
      <Widget title={`${t.kind} ${t.year} · Gruppe ${gr.name}`} to="nationalteam" onGoto={onGoto}>
        <div className="ntw-list">{groupTable(t, gr, today).map((r, i) => (
          <div key={r.c} className={`ntw-row ${r.c === job.nat ? 'me' : ''}`}><span className="dz-dim">{i + 1}.</span><span className="ntw-txt"><NatFlag nat={r.c} /> {natName(r.c)}</span><b>{r.pts}</b></div>
        ))}</div>
      </Widget>
    );
  }
  const rows = Object.entries(job.record.by).reverse().slice(0, 4);
  return (
    <Widget title="Bilanz je Wettbewerb" to="nationalteam" onGoto={onGoto}>
      {rows.length ? rows.map(([k, r]) => <div key={k} className="dz-kv"><span className="ntw-ell">{k}</span><b>{recText(r)}</b></div>)
        : <div className="dz-empty">Noch kein Länderspiel unter dir.</div>}
    </Widget>
  );
}

function RankWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const job = activeJob(g)!;
  // Elo-Weltrangliste (game/national/ranking.ts), nicht mehr die Stärke-Reihenfolge.
  const rows = rankingRows(g);
  const mine = rows.find((r) => r.code === job.nat);
  const shown = rows.slice(0, 8);
  if (mine && mine.rank > 8) shown.push(mine);
  return (
    <Widget title="Weltrangliste" to="nationalteams" onGoto={onGoto} right={mine ? `Platz ${mine.rank}` : undefined}>
      {shown.length ? <div className="ntw-list">{shown.map((r) => (
        <div key={r.code} className={`ntw-row ${r.code === job.nat ? 'me' : ''}`}><span className="dz-dim">{r.rank}.</span><span className="ntw-txt"><NatFlag nat={r.code} /> {natName(r.code)}</span><b>{r.pts}</b></div>
      ))}</div> : <div className="dz-empty">Noch keine Weltrangliste.</div>}
    </Widget>
  );
}

export function NationalLeftColumn({ g, onGoto, openPlayer }: { g: Game; onGoto: Go; openPlayer: (id: string) => void }) {
  if (!activeJob(g)) return <div className="dz-col dz-left" />;
  return (
    <div className="dz-col dz-left">
      <NextWidget g={g} onGoto={onGoto} />
      <SquadWidget g={g} onGoto={onGoto} />
      <InjuredWidget g={g} onGoto={onGoto} openPlayer={openPlayer} />
    </div>
  );
}
export function NationalRightColumn({ g, onGoto }: { g: Game; onGoto: Go }) {
  if (!activeJob(g)) return <div className="dz-col dz-right" />;
  return (
    <div className="dz-col dz-right">
      <GoalWidget g={g} onGoto={onGoto} />
      <GroupWidget g={g} onGoto={onGoto} />
      <RankWidget g={g} onGoto={onGoto} />
    </div>
  );
}
