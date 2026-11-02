// =============================================================================
// Ligatabelle: Gesamt / Heim / Auswärts / Form (laufende Saison), sonst Abschlusstabelle
// =============================================================================
import { useState } from 'react';
import type { CompSnapshot, TableRowLite } from '../../../game/competitionView';
import type { Game } from '../../../game/state';
import { FormDots } from '../../shared';
import { Chips, TeamName, zoneOf } from './parts';

type Mode = 'all' | 'home' | 'away' | 'form';

/** Formtabelle: Punkte aus den letzten fünf Spielen. */
function formTable(rows: TableRowLite[], ptsWin: number): TableRowLite[] {
  const val = (r: TableRowLite) => (r.form ?? []).slice(-5).reduce((s, f) => s + (f === 'W' ? ptsWin : f === 'D' ? 1 : 0), 0);
  return [...rows].sort((a, b) => val(b) - val(a) || a.pos - b.pos).map((r, i) => ({ ...r, pos: i + 1, pts: val(r) }));
}

export function LeagueTable({ g, snap }: { g: Game; snap: CompSnapshot }) {
  const [mode, setMode] = useState<Mode>('all');
  const rowsAll = snap.table ?? [];
  const live = snap.source === 'live';
  const ptsWin = g.pointSystem === '3-point' && live ? 3 : 2;
  const m: Mode = live ? mode : 'all';
  const rows = m === 'home' ? snap.split?.home ?? rowsAll : m === 'away' ? snap.split?.away ?? rowsAll : m === 'form' ? formTable(rowsAll, ptsWin) : rowsAll;
  const mid = g.managedClubId;
  const historic = snap.source === 'history';

  if (snap.placingsOnly) {
    return (
      <table className="dtable cmp-table">
        <thead><tr><th className="rl-rank">#</th><th>Verein</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.clubId}><td className="rl-rank"><span className={`rl-z ${r.pos === 1 ? 'zone-cl' : ''}`}>{r.pos}</span></td><td><TeamName g={g} id={r.clubId} season={snap.season} size={26} /></td></tr>
        ))}</tbody>
      </table>
    );
  }

  return (
    <div className="cmp-league">
      {live && (
        <div className="cmp-toolbar">
          <Chips<Mode> value={mode} onChange={setMode} options={[
            { v: 'all', label: 'Gesamt' }, { v: 'home', label: 'Heim' }, { v: 'away', label: 'Auswärts' },
            { v: 'form', label: 'Form', title: 'Punkte aus den letzten fünf Spielen' },
          ]} />
        </div>
      )}
      <div className="cmp-scroll">
        <table className="dtable cmp-table">
          <thead><tr>
            <th className="rl-rank">#</th><th>Verein</th><th className="num">Sp</th><th className="num">S</th><th className="num">U</th><th className="num">N</th>
            <th className="num">Tore</th><th className="num">Diff</th><th className="num">{m === 'form' ? 'Pkt (5)' : 'Pkt'}</th>{live && <th>Form</th>}
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const diff = r.gf - r.ga;
              return (
                <tr key={r.clubId} className={r.clubId === mid ? 'me' : ''}>
                  <td className="rl-rank"><span className={`rl-z ${m === 'all' ? (snap.zones ? snap.zones[r.pos - 1] ?? '' : zoneOf(r.pos, snap.tier, rows.length, historic)) : ''}`}>{r.pos}</span></td>
                  <td className="nowrap"><TeamName g={g} id={r.clubId} season={snap.season} size={26} /></td>
                  <td className="num">{r.p}</td><td className="num">{r.w}</td><td className="num">{r.d}</td><td className="num">{r.l}</td>
                  <td className="num muted">{r.gf}:{r.ga}</td>
                  <td className="num">{diff > 0 ? '+' : ''}{diff}</td>
                  <td className="num rl-main">{r.pts}{r.ded ? <sup className="cmp-ded" title={`${r.ded} Punkte Abzug`}>−{r.ded}</sup> : null}</td>
                  {live && <td><FormDots form={r.form ?? []} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
