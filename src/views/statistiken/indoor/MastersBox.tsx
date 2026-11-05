// =============================================================================
// HALLE – Box „Masters-Wertung“ (Statistiken › Halle): Punkte der Teams für das
// Hallen-Masters, Trennlinie nach den Masters-Plätzen, Status je Verein, Vorjahre.
// Logik: game/indoorMasters.ts
// =============================================================================
import { useState } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import { indoorShort } from '../../../game/indoorGame';
import { mastersBoard, unpackBoard, type MastersRow, type MastersStatus } from '../../../game/indoorMasters';
import type { Game } from '../../../game/state';
import type { IndoorState, IndoorWinter } from '../../../game/winterShared';
import { DashBox } from '../../../ui/DashPage';
import Select from '../../../ui/Select';

const STATUS: Record<MastersStatus, [string, string]> = {
  in: ['auf Kurs', 'Stand jetzt auf einem Masters-Platz'],
  q: ['dabei', 'Für das Masters qualifiziert'],
  sub: ['Nachrücker', 'Rückt für einen Verzicht oder Verhinderten ins Masters-Feld'],
  declined: ['verzichtet', 'Hat auf den Masters-Platz verzichtet'],
  blocked: ['verhindert', 'Hat an den Masters-Tagen noch ein Pflichtspiel'],
  out: ['', ''],
  guest: ['Gast', 'Gast (Ausland/Amateure) – nicht startberechtigt für das Masters'],
};

function statusText(r: MastersRow): [string, string] {
  if (r.place) return [r.place === 1 ? 'Sieger' : `${r.place}. Masters`, `Masters-Endrunde: Platz ${r.place}${r.status === 'sub' ? ' (als Nachrücker)' : ''}`];
  return STATUS[r.status ?? 'out'];
}

export function MastersBox({ g, st, cur, wy }: { g: Game; st: IndoorState; cur: IndoorWinter | undefined; wy: number }) {
  // Letzter Winter, solange die neue Hallensaison noch nicht begonnen hat (Juli–Oktober): live aus dem Spielstand.
  const prev = !cur && st.current && st.current.season !== g.season && st.current.phase !== 'none' ? st.current : undefined;
  const past = st.history.filter((h) => h.board && h.year !== wy && h.year !== prev?.winterYear).map((h) => h.year);
  const years = [...new Set([...(prev ? [prev.winterYear] : []), ...past])].sort((a, b) => b - a);
  const [year, setYear] = useState<number>(() => prev?.winterYear ?? wy);
  const sel = years.includes(year) ? year : wy;
  const entry = st.history.find((h) => h.year === sel);
  const name = (id: string) => indoorShort(g, id);
  const board = sel === wy ? mastersBoard(g, cur, wy, name)
    : sel === prev?.winterYear ? mastersBoard(g, prev, sel, name)
    : unpackBoard(entry!.board!, sel);
  const mid = g.managedClubId;
  const masters = board.mode === 'masters';
  const label = (y: number) => `${y - 1}/${String(y % 100).padStart(2, '0')}`;

  const right = years.length ? (
    <Select size="s" width={118} value={sel} onChange={(v) => setYear(Number(v))} title="Winter" aria-label="Winter">
      <option value={wy}>{label(wy)}</option>
      {years.map((y) => <option key={y} value={y}>{label(y)}</option>)}
    </Select>
  ) : undefined;

  return (
    <DashBox title={masters ? 'Masters-Wertung' : 'Hallen-Wertung'} info="hallenWertung" flush right={right} className="mst-box">
      <div className="mst-hint dnote">{board.hint}</div>
      {board.rows.length ? (
        <div className="mst-scroll">
          <table className="dtable rl-sm mst-table">
            <thead><tr>
              <th className="rl-rank">#</th><th>Verein</th>
              {!masters && <th className="num" title="Turniersiege">Siege</th>}
              <th className="num" title="Turniere">T</th><th className="num" title="Spiele">Sp</th><th className="num" title="Punkte">Pkt</th>
              <th className="num" title="Tore">Tore</th>{masters && <th className="num" title="Punkte je Spiel – entscheidet über die Qualifikation">Ø</th>}
              {masters && <th className="mst-st">Status</th>}
            </tr></thead>
            <tbody>
              {board.rows.map((r, i) => {
                const [txt, tip] = statusText(r);
                const zone = masters && (r.status === 'q' || r.status === 'sub' || r.status === 'in') ? 'zone-cl' : '';
                const cut = masters && board.cut > 0 && i === board.cut - 1;
                const firstGuest = r.status === 'guest' && board.rows[i - 1]?.status !== 'guest';
                return (
                  <tr key={r.id} className={`${r.id === mid ? 'me' : ''} ${cut ? 'mst-cut' : ''} ${firstGuest ? 'mst-guests' : ''} ${r.status === 'guest' || r.status === 'declined' ? 'mst-dim' : ''}`}>
                    <td className="rl-rank"><span className={`rl-z ${zone}`}>{r.status === 'guest' || (!r.sp && !r.place && r.status !== 'q' && r.status !== 'sub') ? '' : i + 1}</span></td>
                    <td className="nowrap"><ClubLink id={r.id}><span className="rl-name">{indoorShort(g, r.id)}</span></ClubLink></td>
                    {!masters && <td className="num rl-main">{r.wins}</td>}
                    <td className="num">{r.t}</td><td className="num">{r.sp}</td>
                    <td className={`num ${masters ? '' : 'muted'}`}>{r.pts}</td>
                    <td className="num muted">{r.gf}:{r.ga}</td>
                    {masters && <td className="num rl-main">{r.sp ? (r.pts / r.sp).toFixed(2) : '–'}</td>}
                    {masters && <td className="mst-st" title={tip}>{txt}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="mst-empty dnote">{board.mode === 'none' ? 'In diesem Winter gibt es keine Hallenturniere.' : 'Die Teilnehmer stehen fest, sobald die Einladungen verschickt sind (Anfang November).'}</div>}
    </DashBox>
  );
}
