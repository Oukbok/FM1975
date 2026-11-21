// =============================================================================
// Ligatabelle: Gesamt / Heim / Auswärts / Form und Stand nach jedem Spieltag – für jede Saison
// mit Einzelergebnissen (game/leagueResults.ts), sonst nur die Abschlusstabelle.
// =============================================================================
import { useState } from 'react';
import Icon from '../../../components/Icon';
import type { CompSnapshot, TableRowLite } from '../../../game/competitionView';
import { tableFrom, type ResTuple, type TableMode } from '../../../game/leagueResults';
import type { Game } from '../../../game/state';
import { FormDots } from '../../shared';
import { Chips, TeamName, zoneOf } from './parts';

type Mode = TableMode;

/** Formtabelle: Punkte aus den letzten fünf Spielen. */
function formTable(rows: TableRowLite[], ptsWin: number): TableRowLite[] {
  const val = (r: TableRowLite) => (r.form ?? []).slice(-5).reduce((s, f) => s + (f === 'W' ? ptsWin : f === 'D' ? 1 : 0), 0);
  return [...rows].sort((a, b) => val(b) - val(a) || a.pos - b.pos).map((r, i) => ({ ...r, pos: i + 1, pts: val(r) }));
}

export interface TableNav { mode: Mode; setMode: (m: Mode) => void; md: number; maxMd: number; playedMd: number; onMd: (n: number) => void; res: ResTuple[] | null; ptsWin: number }

export function LeagueTable({ g, snap, nav: navIn }: { g: Game; snap: CompSnapshot; nav?: TableNav }) {
  const [ownMode, setOwnMode] = useState<Mode>('all');
  const nav: TableNav = navIn ?? { mode: ownMode, setMode: setOwnMode, md: 0, maxMd: 0, playedMd: 0, onMd: () => {}, res: null, ptsWin: g.pointSystem === '3-point' ? 3 : 2 };
  const rowsAll = snap.table ?? [];
  const live = snap.source === 'live';
  const { res, md, maxMd, ptsWin } = nav;
  const can = !!res && res.length > 0;
  const m: Mode = can || live ? nav.mode : 'all';
  const finalView = !can || (md >= nav.playedMd && m === 'all');
  let rows: TableRowLite[];
  if (finalView) rows = m === 'home' ? snap.split?.home ?? rowsAll : m === 'away' ? snap.split?.away ?? rowsAll : m === 'form' ? formTable(rowsAll, ptsWin) : rowsAll;
  else rows = tableFrom(res!, rowsAll.map((r) => r.clubId), md, m, ptsWin).map((r, i) => ({ ...r, pos: i + 1 }));
  const showForm = live || can;
  // Form-Spalte: Stand bis zum gewählten Spieltag
  const formOf = (id: string) => (can ? tableFrom(res!, [id], md, 'all', ptsWin).find((r) => r.clubId === id)?.form ?? [] : rowsAll.find((r) => r.clubId === id)?.form ?? []);
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
      <div className="cmp-toolbar">
        <Chips<Mode> value={m} onChange={nav.setMode} options={[
          { v: 'all', label: 'Gesamt' }, { v: 'home', label: 'Heim', disabled: !can && !live }, { v: 'away', label: 'Auswärts', disabled: !can && !live },
          { v: 'form', label: 'Form', title: 'Punkte aus den letzten fünf Spielen', disabled: !can && !live },
        ]} />
        {maxMd > 0 && (
          <span className="cmp-mdnav">
            <button className="b3 b3-s b3-icon" disabled={md <= 1} onClick={() => nav.onMd(md - 1)} aria-label="Vorheriger Spieltag" title="Vorheriger Spieltag"><Icon name="navPrev" size={16} /></button>
            <span className="cmp-mdlabel">{md}. Spieltag</span>
            <button className="b3 b3-s b3-icon" disabled={md >= maxMd} onClick={() => nav.onMd(md + 1)} aria-label="Nächster Spieltag" title="Nächster Spieltag"><Icon name="navNext" size={16} /></button>
          </span>
        )}
        {navIn && !can && !live && <span className="cmp-mdnone">Für diese Saison liegen keine Einzelergebnisse vor.</span>}
      </div>
      <div className="cmp-scroll">
        <table className="dtable cmp-table">
          <thead><tr>
            <th className="rl-rank">#</th><th>Verein</th><th className="num">Sp</th><th className="num">S</th><th className="num">U</th><th className="num">N</th>
            <th className="num">Tore</th><th className="num">Diff</th><th className="num">{m === 'form' ? 'Pkt (5)' : 'Pkt'}</th>{showForm && <th>Form</th>}
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
                  {showForm && <td><FormDots form={(finalView && !can ? r.form ?? [] : formOf(r.clubId)).slice(-5)} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
