// =============================================================================
// Reiter „Jugend“ im Vereinsprofil (Wunsch Pascal): „Die meisten Jugendspieler
// sollten unbekannt sein, man soll sie aber scouten können. Dann tauchen sie bei
// Scouting auf.“
//   Eigener Verein: alle Jugendmannschaften (game/youthTeams.ts), Werte bekannt.
//   KI-Vereine mit vollem Kader: ihre schlanke Akademie (g.youthPlayers).
//   Weltvereine: die drei Jugendspieler aus dem Weltpool (game/worldPool.ts).
// Name/Alter/Position sind sichtbar; Stärke/Potenzial erst ab einer Bekanntheit
// von KNOWN_MIN (game/playerPool.ts `knowledge`/`estimate`), sonst „?“.
// „Scouten“ legt einen Auftrag an (game/scoutingGame.ts) → Transfers › Scouting
// und Spielerpool-Reiter „Gescoutet“.
// =============================================================================
import Short from '../../ui/Short';
import { useMemo, useState } from 'react';
import FaceThumb from '../FaceThumb';
import PosBadge from '../PosBadge';
import { StarRating, KnowledgeBar } from '../StarRating';
import { PlayerLink } from '../playerMenu/PlayerLink';
import { NatFlag } from '../competition/CountryFlag';
import { estimate, knowCtx, knowledge, knowWord, poolRows, type Estimate, type PoolRow } from '../../game/playerPool';
import { activeJob, jobProgress, jobTerms, queueScouting, queuedJob, scoutReport, scoutSlots } from '../../game/scoutingGame';
import { scoutRange } from '../../engine/scouting';
import { YOUTH_AGE_CLASS_LABEL, youthAgeClass, type YouthAgeClass } from '../../types';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { fmtPrice, vColor } from '../../ui/format';
import { POSITION_GROUPS } from '../../types';
import { ClubTabProps } from './shared';

/** Ab dieser Bekanntheit zeigt das Profil Spannen statt „?“. */
export const KNOWN_MIN = 0.35;

type Sort = 'name' | 'pos' | 'age' | 'ov' | 'pot' | 'k';
type Cls = 'all' | 'A' | 'B' | 'C' | 'young';
const CLS_LABEL: Record<Cls, string> = { all: 'Alle', A: 'A-Jgd.', B: 'B-Jgd.', C: 'C-Jgd.', young: 'Jüngere' };
const GROUP_ORDER = ['GK', 'DEF', 'MID', 'ATT'];

interface Row { r: PoolRow; e: Estimate; known: boolean; own: boolean; cls: YouthAgeClass | null; stLo: number; stHi: number }

/** Jugendspieler eines Vereins aus dem Spielerpool (volle Jugend bzw. Weltpool). */
export function clubYouthRows(g: ClubTabProps['g'], clubId: string): PoolRow[] {
  return poolRows(g).rows.filter((r) => r.clubId === clubId && (r.kind === 'youth' || (r.kind === 'world' && r.youth)));
}

export default function YouthTab({ g, d, onChange }: ClubTabProps & { onChange: () => void }) {
  const [sort, setSortKey] = useState<Sort>('age');
  const [desc, setDesc] = useState(true);
  const [cls, setCls] = useState<Cls>('all');
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const setSort = (k: Sort) => { if (k === sort) setDesc((x) => !x); else { setSortKey(k); setDesc(k === 'ov' || k === 'pot' || k === 'k' || k === 'age'); } };
  const own = d.isPlayerClub;

  const rows: Row[] = useMemo(() => {
    const ctx = knowCtx(g);
    return clubYouthRows(g, d.clubId).map((r) => {
      const k = own ? 1 : knowledge(ctx, r);
      const e = estimate(r, k);
      let stLo = e.stLo, stHi = e.stHi;
      if (own && r.player) [stLo, stHi] = scoutRange(r.player);
      return { r, e, known: own || k >= KNOWN_MIN, own, cls: youthAgeClass(r.age), stLo, stHi };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, d.clubId, own, g.calendar.currentDate, tick, g.scouting?.reports && Object.keys(g.scouting.reports).length]);

  if (!rows.length) {
    return (
      <DashBox title="Jugend" span={3} rows={2}>
        <Empty icon="youth">Über die Jugend von {d.name} liegt nichts vor. Der Verein spielt in einer rein simulierten Liga – Jugendspieler tauchen erst auf, wenn er einen eigenen Kader bekommt.</Empty>
      </DashBox>
    );
  }

  const ovKey = (x: Row) => (x.known ? x.e.ov : -1);
  const potKey = (x: Row) => (x.known ? (x.stLo + x.stHi) / 2 : -1);
  const base = (a: Row, b: Row) => {
    switch (sort) {
      case 'name': return a.r.name.localeCompare(b.r.name, 'de');
      case 'pos': return GROUP_ORDER.indexOf(POSITION_GROUPS[a.r.pos]) - GROUP_ORDER.indexOf(POSITION_GROUPS[b.r.pos]);
      case 'age': return a.r.age - b.r.age;
      case 'ov': return ovKey(a) - ovKey(b);
      case 'pot': return potKey(a) - potKey(b);
      default: return a.e.k - b.e.k;
    }
  };
  const cmp = (a: Row, b: Row) => (desc ? -base(a, b) : base(a, b)) || a.r.name.localeCompare(b.r.name, 'de');
  const pick = (x: Row) => cls === 'all' || (cls === 'young' ? !x.cls || !['A', 'B', 'C'].includes(x.cls) : x.cls === cls);
  const list = rows.filter(pick).sort(cmp);
  const classes = (['A', 'B', 'C', 'young'] as Cls[]).filter((c) => rows.some((x) => (c === 'young' ? !x.cls || !['A', 'B', 'C'].includes(x.cls) : x.cls === c)));

  const Th = ({ k, cls: c, pri, children }: { k: Sort; cls?: string; pri?: number; children: React.ReactNode }) => (
    <th className={`mk-sort ${c ?? ''} ${sort === k ? 'on' : ''}`} data-pri={pri} data-flex={k === 'name' ? '' : undefined} onClick={() => setSort(k)} aria-sort={sort === k ? (desc ? 'descending' : 'ascending') : undefined}>
      {children}{sort === k ? <span className="mk-sort-dir">{desc ? '▼' : '▲'}</span> : null}
    </th>
  );

  const abroad = (r: PoolRow) => r.country !== 'Deutschland';
  const scout = (x: Row) => {
    const res = queueScouting(g, { id: x.r.id, name: x.r.name, clubName: d.name, abroad: abroad(x.r), youth: true });
    setMsg(res === 'started' ? `Ein Scout ist zu ${x.r.name} unterwegs.` : res === 'queued' ? `${x.r.name} ist vorgemerkt – der nächste freie Scout fährt los.` : res);
    setTick((t) => t + 1);
    onChange();
  };
  const full = (g.scouting?.jobs.length ?? 0) >= scoutSlots(g);
  const terms = jobTerms(g, abroad(rows[0].r), true);
  const unknown = rows.filter((x) => !x.known).length;
  const scouted = rows.filter((x) => scoutReport(g, x.r.id) != null).length;
  const busy = rows.filter((x) => activeJob(g, x.r.id) || queuedJob(g, x.r.id) >= 0).length;

  return (
    <>
      <DashBox title={`Jugend (${rows.length})`} span={2} rows={2} flush info="clubJugend"
        right={<span className="dbtnrow">
          <button className={`dchip ${cls === 'all' ? 'on' : ''}`} onClick={() => setCls('all')}>{CLS_LABEL.all}</button>
          {classes.map((c) => <button key={c} className={`dchip ${cls === c ? 'on' : ''}`} onClick={() => setCls(c)}>{CLS_LABEL[c]}</button>)}
        </span>}>
        <table className="dtable rl-players mk-table cmx-youth">
          <thead><tr>
            <Th k="name" cls="cmx-yname">Name</Th><th className="ctr cmx-yw" data-pri={4}><Short s="Nat.">Nation</Short></th><Th k="pos" cls="ctr cmx-ypos"><Short s="Pos.">Position</Short></Th><Th k="age" cls="num cmx-yw">Alter</Th><th className="cmx-yteam" data-pri={2}><Short s="Team">Mannschaft</Short></th>
            <Th k="ov" cls="num cmx-yw">Stärke</Th><Th k="pot" cls="cmx-ypot"><Short s="Pot.">Potenzial</Short></Th>{!own && <Th k="k" cls="ctr cmx-yk" pri={3}><Short s="Kenn.">Kenntnis</Short></Th>}{!own && <th className="cmx-yact" />}
          </tr></thead>
          <tbody>
            {list.map((x) => {
              const { r, e } = x;
              const job = own ? undefined : activeJob(g, r.id);
              const waiting = !own && queuedJob(g, r.id) >= 0;
              const done = !own && scoutReport(g, r.id) != null;
              return (
                <tr key={r.id} data-pid={r.id}>
                  <td className="nowrap rl-name"><span className="tm-name">
                    <FaceThumb p={r.player ?? { id: r.id, face: r.face, dateOfBirth: `${r.born}-07-01`, age: r.age, fullName: r.name }} size={26} />
                    <PlayerLink id={r.id}><span className="mk-pname">{r.name}</span></PlayerLink>
                  </span></td>
                  <td className="ctr"><NatFlag nat={r.nat} /></td>
                  <td className="ctr">{r.player ? <PosBadge p={r.player} /> : <PosBadge pos={r.pos} />}</td>
                  <td className="num mk-num">{r.age}</td>
                  <td className="nowrap muted">{x.cls ? YOUTH_AGE_CLASS_LABEL[x.cls].replace(' (Bambini)', '') : 'Jugend'}</td>
                  <td className="num nowrap mk-num">{!x.known ? <span className="cmx-unk" title="Unbekannt – ein Scout schafft Klarheit">?</span>
                    : e.exact || own ? <b className="mk-ov" style={{ color: vColor(own ? r.ov : e.ov) }}>{own ? r.ov : e.ov}</b>
                      : <b className="mk-ov" style={{ color: vColor(e.ov) }} title={`Geschätzt ${e.ovLo}–${e.ovHi}`}>{e.ovLo}–{e.ovHi}</b>}</td>
                  <td>{x.known ? <StarRating lo={x.stLo} hi={x.stHi} label="Potenzial" note="Mögliche Höchststärke." />
                    : <span className="cmx-unk" title="Unbekannt – ein Scout schafft Klarheit">?</span>}</td>
                  {!own && <td className="ctr"><KnowledgeBar k={e.k} word={knowWord(e.k)} /></td>}
                  {!own && (
                    <td className="num">
                      <button className="dchip" disabled={!!job || waiting || done}
                        title={done ? 'Bericht liegt vor – siehe Transfers › Scouting' : `${terms.days} Tage · Reisekosten ${fmtPrice(jobTerms(g, abroad(r), true).cost)}${full ? ' · alle Scouts unterwegs: wird vorgemerkt' : ''}`}
                        onClick={() => scout(x)}>
                        {job ? `Scout ${Math.round(jobProgress(g, job) * 100)} %` : waiting ? 'Vorgemerkt' : done ? 'Gescoutet' : full ? 'Vormerken' : 'Scouten'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashBox>

      <DashBox title={own ? 'Deine Jugend' : 'Jugend-Scouting'} rows={2} info="scouting">
        {own ? (
          <>
            <KV k="Jugendspieler" v={rows.length} />
            {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as YouthAgeClass[]).map((c) => {
              const n = rows.filter((x) => x.cls === c).length;
              return n ? <KV key={c} k={YOUTH_AGE_CLASS_LABEL[c]} v={n} /> : null;
            })}
            <div className="dnote mt8">Deine eigenen Jugendspieler kennst du genau. Aufstellung, Training und Hochziehen findest du unter Jugend › Mannschaften.</div>
          </>
        ) : (
          <>
            <KV k="Unbekannt" v={`${unknown} von ${rows.length}`} />
            <KV k="Gescoutet" v={scouted} />
            <KV k="Scout unterwegs/vorgemerkt" v={busy} />
            <KV k="Auftrag" v={`${terms.days} Tage · ${fmtPrice(terms.cost)}`} />
            <KV k="Scouts frei" v={`${Math.max(0, scoutSlots(g) - (g.scouting?.jobs.length ?? 0))} von ${scoutSlots(g)}`} />
            <div className="dnote mt8">Über fremde Jugendspieler weißt du kaum etwas: Name, Alter und Position sind bekannt, Stärke und Potenzial meist nicht. Schick einen Scout – nach dem Bericht siehst du die Werte hier, unter Transfers › Scouting und im Spielerpool unter „Gescoutet“.</div>
            {msg && <div className="dnote mt8 cmx-ymsg">{msg}</div>}
          </>
        )}
      </DashBox>
    </>
  );
}
