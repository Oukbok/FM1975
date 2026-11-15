// =============================================================================
// HALLE – Box „Masters-Siegerliste | Hallenkönige“ (Statistiken › Halle).
// Auswahl im Box-Kopf: Masters-Sieger in deinem Spiel oder die ewige Bestenliste
// der Hallenspieler (Hallenruf = Tore + 3 je Turniersieg + 5 je Masters-Sieg,
// game/indoorRecords.ts). Spaltenköpfe sortieren nach Ruf, Toren oder Turniersiegen.
// =============================================================================
import { useState } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { MASTERS_FIRST_WINTER, MASTERS_LAST_WINTER } from '../../../data/indoorHistory';
import { indoorShort } from '../../../game/indoorGame';
import { HALL_SPECIALIST, hallKings, type HallKingSort } from '../../../game/indoorRecords';
import type { Game } from '../../../game/state';
import type { IndoorState } from '../../../game/winterShared';
import { DashBox } from '../../../ui/DashPage';
import Select from '../../../ui/Select';

type View = 'masters' | 'kings';
let lastView: View = 'masters';

export function HallOfKingsBox({ g, st }: { g: Game; st: IndoorState }) {
  const [view, setViewState] = useState<View>(lastView);
  const setView = (v: View) => { lastView = v; setViewState(v); };
  const [by, setBy] = useState<HallKingSort>('ruf');
  const right = (
    <Select size="s" width={176} value={view} onChange={(v) => setView(v as View)} title="Ansicht" aria-label="Ansicht">
      <option value="masters">Masters-Sieger</option>
      <option value="kings">Hallenkönige</option>
    </Select>
  );
  return (
    <DashBox title={view === 'masters' ? 'Masters-Siegerliste' : 'Hallenkönige'} info={view === 'masters' ? 'hallenMasters' : 'hallenkoenige'} right={right} flush className="hk-box">
      {view === 'masters' ? <MastersList g={g} st={st} /> : <Kings g={g} by={by} setBy={setBy} />}
    </DashBox>
  );
}

function MastersList({ g, st }: { g: Game; st: IndoorState }) {
  const list = [...st.history].reverse().filter((h) => h.mastersWinner);
  return (
    <div className="hk-scroll">
      {list.length ? <div className="dsec">In deinem Spiel</div> : null}
      {list.map((h) => (
        <div key={h.year} className="dlist-row">
          <span className="meta" style={{ minWidth: 40 }}>{h.year}</span>
          <span className="grow"><b><ClubLink id={h.mastersWinner!}>{indoorShort(g, h.mastersWinner!)}</ClubLink></b> <span className="muted">{h.mastersScore} {h.mastersRunnerUp ? indoorShort(g, h.mastersRunnerUp) : ''}</span></span>
          <span className="meta">{h.city}</span>
        </div>
      ))}
      {!list.length && <div className="dnote">Noch keine Endrunde in deinem Spiel – das Hallen-Masters gibt es von {MASTERS_FIRST_WINTER} bis {MASTERS_LAST_WINTER}.</div>}
    </div>
  );
}

function Kings({ g, by, setBy }: { g: Game; by: HallKingSort; setBy: (b: HallKingSort) => void }) {
  const list = hallKings(g, by, 40);
  const mid = g.managedClubId;
  const th = (k: HallKingSort, label: string, title: string) => (
    <th className={`num hk-sort ${by === k ? 'on' : ''}`} title={title} onClick={() => setBy(k)}>{label}</th>
  );
  if (!list.length) return <div className="dnote hk-empty">Noch keine Hallentore – die Bestenliste füllt sich mit jedem Hallenturnier (1976–2004).</div>;
  return (
    <div className="hk-scroll">
      <table className="dtable rl-sm hk-table">
        <thead><tr>
          <th className="rl-rank">#</th><th>Spieler</th><th>Verein</th>
          {th('g', 'Tore', 'Hallentore (alle Turniere)')}
          <th className="num" title="Turniere">T</th>
          {th('w', 'Siege', 'Turniersiege (inkl. Masters)')}
          <th className="num" title="Masters-Siege">M</th>
          {th('ruf', 'Ruf', `Hallenruf: Tore + 3 je Turniersieg + 5 je Masters-Sieg; ab ${HALL_SPECIALIST} Hallenspezialist`)}
        </tr></thead>
        <tbody>
          {list.map((k, i) => {
            const alive = !!g.players[k.id];
            return (
              <tr key={k.id} className={k.r.c === mid && alive && g.players[k.id]?.clubId === mid ? 'me' : ''} data-pid={alive ? k.id : undefined}>
                <td className="rl-rank">{i + 1}</td>
                <td className="nowrap hk-name">{alive ? <PlayerLink id={k.id}>{k.r.n}</PlayerLink> : <span className="muted">{k.r.n}</span>}</td>
                <td className="nowrap hk-club"><ClubLink id={k.r.c}><span className="rl-name">{indoorShort(g, k.r.c)}</span></ClubLink></td>
                <td className={`num ${by === 'g' ? 'rl-main' : ''}`}>{k.r.g}</td>
                <td className="num muted">{k.r.t}</td>
                <td className={`num ${by === 'w' ? 'rl-main' : ''}`}>{k.r.w}</td>
                <td className="num muted">{k.r.m || '–'}</td>
                <td className={`num ${by === 'ruf' ? 'rl-main' : ''}`}>{k.ruf}{k.ruf >= HALL_SPECIALIST && <span className="hk-star" title="Hallenspezialist"> *</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="dnote hk-foot">* Hallenspezialist (Ruf ab {HALL_SPECIALIST}). Grau: nicht mehr aktiv. Verein = zuletzt in der Halle.</div>
    </div>
  );
}
