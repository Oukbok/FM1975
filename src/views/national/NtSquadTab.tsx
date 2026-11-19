// Nationalteam › Aufgebot: Kandidatenliste im einheitlichen Spielertabellen-Stil (Gesicht,
// Name, Position, Stärke, Alter, Verein, Form/Verletzung) mit Haken „Aufgebot“ und „Elf“ |
// Dein Aufgebot (Stärke gegen Vorschlag des Co-Trainers, Bestätigen) | Startelf & Formation.
// Logik game/national/nationalPick.ts.
import { useState } from 'react';
import type { Game } from '../../game/state';
import type { Position } from '../../types';
import FaceThumb from '../../components/FaceThumb';
import PosBadge from '../../components/PosBadge';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { ClubLink } from '../../components/club/ClubLink';
import { PlayerForm } from '../../components/status';
import { activeJob, fmtDay } from '../../game/national/nationalJob';
import { autoXI, confirmPick, formationChoices, groupOf, pickPreview, resetPick, setPickFormation, toggleXI, togglePick, type PosGroup } from '../../game/national/nationalPick';
import { candidatesByNation, type Cand } from '../../game/national/pool';
import { currentSquad, natName } from '../../game/national/nationalGame';
import { clubNameOf } from '../../game/careerState';
import { worldClubInfo } from '../../game/worldPool';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import Seg, { type SegOption } from '../../ui/Seg';
import Select from '../../ui/Select';

type F = 'all' | PosGroup | 'sel';
const FILTERS: SegOption<F>[] = [
  { v: 'all', label: 'Alle' }, { v: 'GK', label: 'TW' }, { v: 'D', label: 'Abwehr' }, { v: 'M', label: 'Mittelfeld' }, { v: 'A', label: 'Angriff' }, { v: 'sel', label: 'Aufgebot' },
];
const SHOW = 140;

export function NtSquadTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const [f, setF] = useState<F>('all');
  const job = activeJob(g)!;
  const p = job.pick && !job.pick.used ? job.pick : null;
  const pv = p ? pickPreview(g) : null;
  const all = candidatesByNation(g).get(job.nat) ?? [];
  const cName = (id: string) => g.clubs[id]?.name ?? worldClubInfo(g, id)?.name ?? clubNameOf(g, id);
  const year = parseInt(g.calendar.currentDate.slice(0, 4), 10);
  const act = (fn: () => void) => () => { fn(); onChange(); };

  if (!p || !pv) {
    const last = currentSquad(g, job.nat);
    return (
      <DashPage className="ntj-squad">
        <DashBox title="Letztes Aufgebot" span={2} rows={2} right={`${last.length} Spieler`}>
          <div className="ntj-list">{last.map((c) => (
            <div key={c.id} className="ntj-prow" data-pid={c.full ? c.id : undefined}>
              <PosBadge pos={c.pos as Position} /><span className="ntj-pname">{c.full ? <PlayerLink id={c.id}>{c.name}</PlayerLink> : c.name}</span>
              <span className="ntj-club"><ClubLink id={c.clubId}>{cName(c.clubId)}</ClubLink></span><b style={{ color: vColor(c.ov) }}>{c.ov}</b>
            </div>
          ))}</div>
        </DashBox>
        <DashBox title="Aufgebot nominieren" info="ntAufgebot" rows={2}>
          <Empty icon="kalender">Gerade steht keine Nominierung an. Drei Tage vor jedem Länderspielfenster und vor dem Turnier hält die Zeit an – dann stellst du hier dein Aufgebot zusammen.</Empty>
        </DashBox>
      </DashPage>
    );
  }

  const inSq = new Set(p.ids);
  const inXI = new Set(pv.xi.map((c) => c.id));
  const rows = (f === 'sel' ? pv.squad : all.filter((c) => f === 'all' || groupOf(c.pos) === f))
    .slice(0, f === 'sel' ? 99 : SHOW);
  // Ausgewählte Spieler, die außerhalb der ersten Treffer liegen, bleiben sichtbar.
  if (f !== 'sel') for (const c of pv.squad) if (!rows.includes(c) && (f === 'all' || groupOf(c.pos) === f)) rows.push(c);
  const sorted = [...rows].sort((a, b) => b.ov - a.ov);
  const diff = Math.round((pv.strength - pv.autoStrength) * 10) / 10;
  const counts = (['GK', 'D', 'M', 'A'] as PosGroup[]).map((k) => pv.squad.filter((c) => groupOf(c.pos) === k).length);

  const Row = ({ c }: { c: Cand }) => {
    const pl = g.players[c.id];
    const hurt = pl?.injury;
    return (
      <tr data-pid={c.full ? c.id : undefined} className={inSq.has(c.id) ? 'ntj-in' : ''}>
        <td className="ctr"><button type="button" className={`ntj-check ${inSq.has(c.id) ? 'on' : ''}`} aria-pressed={inSq.has(c.id)} title={inSq.has(c.id) ? 'Aus dem Aufgebot nehmen' : 'Ins Aufgebot'}
          disabled={!inSq.has(c.id) && p.ids.length >= p.size} onClick={act(() => togglePick(g, c.id))} /></td>
        <td className="ctr"><button type="button" className={`ntj-check xi ${inXI.has(c.id) ? 'on' : ''}`} aria-pressed={inXI.has(c.id)} title="Startelf"
          disabled={!inSq.has(c.id)} onClick={act(() => toggleXI(g, c.id))} /></td>
        <td className="rl-name"><span className="ntj-name"><FaceThumb p={pl ?? null} size={24} />{c.full ? <PlayerLink id={c.id}>{c.name}</PlayerLink> : c.name}</span></td>
        <td className="ctr">{pl ? <PosBadge p={pl} /> : <PosBadge pos={c.pos} />}</td>
        <td className="num"><b className="mk-ov" style={{ color: vColor(c.ov) }}>{c.ov}</b></td>
        <td className="num">{c.age}</td>
        <td className="ntj-club"><ClubLink id={c.clubId}>{cName(c.clubId)}</ClubLink></td>
        <td className="ctr">{hurt ? <span className="ntj-hurt" title={hurt.description}>verletzt {hurt.daysRemaining} T.</span> : pl ? <PlayerForm p={pl} size={18} /> : <span className="dim">–</span>}</td>
      </tr>
    );
  };

  return (
    <DashPage className="ntj-squad">
      <DashBox title={`Kandidaten ${natName(job.nat)}`} span={2} rows={2} flush right={`${all.length} Spieler`}>
        <div className="ntj-tools"><Seg<F> size="s" maxSeg={7} value={f} options={FILTERS} onChange={(v) => setF(v)} /><span>Haken „Aufg.“ = im Aufgebot · „Elf“ = Startelf</span></div>
        <div className="ntj-tablewrap">
          <table className="dtable rl-players ntj-table">
            <thead><tr><th className="ctr" title="Im Aufgebot">Aufg.</th><th className="ctr" title="Startelf">Elf</th><th>Name</th><th className="ctr">Pos</th><th className="num">Stärke</th><th className="num">Alter</th><th>Verein</th><th className="ctr">Form</th></tr></thead>
            <tbody>{sorted.map((c) => <Row key={c.id} c={c} />)}</tbody>
          </table>
        </div>
      </DashBox>

      <DashBox title="Dein Aufgebot" info="ntAufgebot" right={`${p.ids.length} / ${p.size}`}>
        <KV k="Für" v={p.label} />
        <KV k="Stichtag" v={fmtDay(p.date)} />
        <KV k="Stärke" v={<><b style={{ color: vColor(pv.strength) }}>{pv.strength.toFixed(1).replace('.', ',')}</b> <span className={diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'dim'}>({diff > 0 ? '+' : ''}{String(diff).replace('.', ',')} zum Vorschlag)</span></>} strong />
        <KV k="TW · Abwehr · Mittelfeld · Angriff" v={counts.join(' · ')} />
        <KV k="Stand" v={p.confirmed ? 'gemeldet' : p.touched ? 'geändert, noch nicht gemeldet' : 'Vorschlag des Co-Trainers'} />
        <div className="ntj-actions ntj-push">
          <button type="button" className="b3 b3-s" disabled={!p.touched} onClick={act(() => resetPick(g))}>Vorschlag übernehmen</button>
          <button type="button" className="b3 b3-s b3-primary" disabled={p.confirmed && !p.touched} onClick={act(() => confirmPick(g))}>Aufgebot bestätigen</button>
        </div>
      </DashBox>

      <DashBox title="Startelf & Formation" info="ntFormation" right={pv.misfit ? `${pv.misfit} außerhalb` : undefined}>
        <div className="ntj-form">
          <Select size="s" width={190} value={p.formation ?? ''} onChange={(v) => { setPickFormation(g, v || null); onChange(); }}
            options={[{ value: '', label: 'Automatisch' }, ...formationChoices(year).map((x) => ({ value: x.id, label: x.label }))]} aria-label="Formation" />
          <button type="button" className="b3 b3-s" disabled={!p.xi} onClick={act(() => autoXI(g))}>Elf automatisch</button>
        </div>
        <div className="ntj-list">{pv.xi.map((c) => (
          <div key={c.id} className="ntj-prow"><PosBadge pos={c.pos as Position} /><span className="ntj-pname">{c.name}</span><b style={{ color: vColor(c.ov) }}>{c.ov}</b></div>
        ))}</div>
      </DashBox>
    </DashPage>
  );
}
