// =============================================================================
// JUGEND › 2. MANNSCHAFT › KADER (Wunsch Pascal): alle Spieler, die für die zweite
// Mannschaft in Frage kommen – Profis bis 23 (bzw. alle mit „Profis über 23“),
// A-Jugendliche ab 17 –, mit Herkunft, Stärke, Potenzial, Elf des letzten
// Spieltags und Positionstraining. Alle Spalten sortierbar. Logik game/reserveTeam.ts.
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { ALL_POSITIONS } from '../../types';
import { eligible, reserveState, type ReserveState } from '../../game/reserveTeam';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import PosBadge from '../../components/PosBadge';
import FaceThumb from '../../components/FaceThumb';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { ScoutStarBar } from '../shared';
import { scoutRange } from '../../engine/scouting';
import { PlayerForm, PlayerFreshness } from '../../components/status';

type K = 'xi' | 'name' | 'pos' | 'age' | 'ovr' | 'pot' | 'from' | 'fit' | 'form';

export function ReserveSquad({ g }: { g: Game }) {
  const club = g.clubs[g.managedClubId];
  const st = reserveState(g) as ReserveState;
  const [sort, setSortRaw] = useState<K>('xi');
  const [desc, setDesc] = useState(true);
  const setSort = (k: K) => { if (k === sort) setDesc((d) => !d); else { setSortRaw(k); setDesc(!['name', 'pos', 'age', 'from'].includes(k)); } };
  const pros = st.pros || st.focus === 'comeback';
  const list = eligible(g, club, pros);
  const xiPos = new Map(st.lastXI.map(([id, p]) => [id, p]));
  const train = new Map(st.posTrain.map((t) => [t.pid, t.pos]));
  const isYouth = (p: Player) => !club.playerIds.includes(p.id);
  const fromOf = (p: Player) => (isYouth(p) ? 'A-Jugend' : p.age > 23 ? 'Profi (über 23)' : 'Profi');
  const key = (p: Player): number | string => {
    switch (sort) {
      case 'xi': return (xiPos.has(p.id) ? 1000 : 0) + p.overall;
      case 'name': return `${p.lastName} ${p.fullName}`;
      case 'pos': return ALL_POSITIONS.indexOf(p.naturalPosition);
      case 'age': return p.age;
      case 'ovr': return p.overall;
      case 'pot': return scoutRange(p)[1] * 100 + p.overall;
      case 'from': return fromOf(p);
      case 'fit': return p.frische ?? 0;
      case 'form': return p.form ?? 0;
    }
  };
  const rows = [...list].sort((a, b) => {
    const ka = key(a), kb = key(b);
    const c = typeof ka === 'string' ? ka.localeCompare(kb as string, 'de') : ka - (kb as number);
    return (desc ? -c : c) || b.overall - a.overall;
  });
  const Th = ({ k, children, cls, title }: { k: K; children: React.ReactNode; cls?: string; title?: string }) => (
    <th className={`sortable ${cls ?? ''} ${sort === k ? 'sorted' : ''}`} title={title} onClick={() => setSort(k)}
      aria-sort={sort === k ? (desc ? 'descending' : 'ascending') : undefined}>{children}{sort === k ? (desc ? ' ▾' : ' ▴') : ''}</th>
  );
  const pro = list.filter((p) => !isYouth(p)).length;
  const avg = (ps: Player[]) => (ps.length ? Math.round(ps.reduce((a, p) => a + p.overall, 0) / ps.length) : 0);
  const xiPlayers = list.filter((p) => xiPos.has(p.id));
  const missing = Math.max(0, 11 - st.lastXI.length);

  return (
    <DashPage className="res-squad-page">
      <DashBox title={`Kader 2. Mannschaft (${list.length})`} span={2} rows={2} flush info="zweitemannschaft">
        {rows.length ? (
          <table className="dtable rl-players yv-table">
            <thead><tr>
              <Th k="xi" cls="ctr" title="Stand in der Elf des letzten Spieltags">Elf</Th>
              <Th k="name">Name</Th><Th k="pos" cls="ctr">Pos</Th><Th k="age" cls="num">Alter</Th>
              <Th k="ovr" cls="num">Stärke</Th><Th k="pot" title="Potenzial laut Scouting">Potenzial</Th>
              <Th k="from">Herkunft</Th><Th k="fit" cls="ctr" title="Frische">Frische</Th><Th k="form" cls="ctr">Form</Th>
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} data-pid={p.id} className={xiPos.has(p.id) ? 'res-in' : ''}>
                  <td className="ctr">{xiPos.has(p.id) ? <PosBadge pos={xiPos.get(p.id)!} /> : <span className="dim">–</span>}</td>
                  <td className="rl-name"><span className="res-sq-name"><FaceThumb p={p} size={24} /><PlayerLink id={p.id}>{p.fullName}</PlayerLink>
                    {train.has(p.id) && <span className="res-tag" title="Positionstraining in der 2. Mannschaft">übt {train.get(p.id)}</span>}</span></td>
                  <td className="ctr"><PosBadge p={p} /></td>
                  <td className="num">{p.age}</td>
                  <td className="num"><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
                  <td><ScoutStarBar p={p} size={17} /></td>
                  <td className="res-from">{fromOf(p)}</td>
                  <td className="ctr"><PlayerFreshness p={p} /></td>
                  <td className="ctr"><PlayerForm p={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty icon="squad">Niemand steht für die zweite Mannschaft zur Verfügung.</Empty>}
      </DashBox>

      <DashBox title="Zusammensetzung">
        <KV k="Spieler verfügbar" v={`${list.length}`} strong />
        <KV k="davon Profis" v={`${pro}`} />
        <KV k="davon A-Jugend (ab 17)" v={`${list.length - pro}`} />
        <KV k="Ø Stärke Kader" v={`${avg(list)}`} />
        <KV k="Ø Stärke letzte Elf" v={xiPlayers.length ? `${avg(xiPlayers)}` : '–'} />
        <KV k="Vertragsamateure in der Elf" v={st.lastXI.length ? `${missing}` : '–'} />
        <div className="dnote mt8">Profis in der Startelf der ersten Mannschaft, Verletzte und Gesperrte fehlen hier. {pros ? 'Profis über 23 dürfen mitspielen.' : 'Profis über 23 sind ausgeschlossen (Anweisung in der Übersicht).'} Lücken füllen Vertragsamateure.</div>
      </DashBox>

      <DashBox title="Nach Mannschaftsteil">
        {(['TW', 'ABW', 'MF', 'ANG'] as const).map((part) => {
          const inPart = list.filter((p) => partOf(p) === part);
          return <KV key={part} k={PART_DE[part]} v={inPart.length ? `${inPart.length} · Ø ${avg(inPart)}` : '–'} />;
        })}
        <div className="dnote mt8">Fehlt ein Mannschaftsteil, stellt der Trainer der Amateure einen Vertragsamateur oder einen Spieler auf fremder Position auf.</div>
      </DashBox>
    </DashPage>
  );
}

const PART_DE = { TW: 'Torwart', ABW: 'Abwehr', MF: 'Mittelfeld', ANG: 'Angriff' } as const;
function partOf(p: Player): keyof typeof PART_DE {
  const pos = p.naturalPosition;
  if (pos === 'TW') return 'TW';
  if (['LIB', 'IV', 'RV', 'LV'].includes(pos)) return 'ABW';
  if (['DM', 'ZM', 'RM', 'LM', 'OM'].includes(pos)) return 'MF';
  return 'ANG';
}
