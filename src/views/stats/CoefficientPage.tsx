// =============================================================================
// Statistiken › International › Fünfjahreswertung (Wunsch Pascal: Mix aus 5-jahres-wertung.de
// und kicker, eher an 5-jahres-wertung.de orientiert, im Stil des FM1975 übersichtlich).
// Eine Tabelle über die volle Breite (Kopf fest, Liste scrollt intern): Platz | Vorjahr mit
// Bewegung | Land | Starter noch dabei (gesamt) | vier abgeschlossene Saisons + laufende (live) |
// Gesamt | Teampunkte | Rückstand | Startplätze der Folgesaison je Wettbewerb; Zeilen nach
// Startplatz-Zone getönt (Legende unten), dein Land hervorgehoben, sortierbar nach Gesamt bzw.
// laufender Saison. Klick auf Land → Länderprofil, Klick auf Saisonpunkte → Seitenpanel mit den
// Punkten je Verein (nur wo das Spiel sie kennt, game/coefBoard.ts `breakdownCells`).
// Daten nur aus dem Spiel: game/coefBoard.ts (liest game/coefficients.ts + engine/worldEuro.ts).
// =============================================================================
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CountryFlag } from '../../components/competition/CountryFlag';
import Icon from '../../components/Icon';
import { ClubLink } from '../../components/club/ClubLink';
import { seasonStartYear } from '../../data/timeline';
import { breakdownCells, coefBoard, coefBreakdown, compShort, type BoardRow, type CoefBoard } from '../../game/coefBoard';
import type { CoefComp } from '../../game/coefficients';
import type { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';

/** Punkte mit zwei Nachkommastellen („12,50“); null → „–“. */
const f2 = (v: number | null | undefined) => (v == null ? '–' : v.toFixed(2).replace('.', ','));
const STATE_DE = { in: 'dabei', out: 'ausgeschieden', won: 'Sieger' } as const;
type Sort = 'total' | 'live';

export function CoefficientPage({ g }: { g: Game }) {
  const today = g.calendar.currentDate;
  const b = useMemo(() => coefBoard(g), [g, g.season, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const cells = useMemo(() => (b ? breakdownCells(g, b) : new Set<string>()), [g, b]);
  const [sort, setSort] = useState<Sort>('total');
  const [open, setOpen] = useState<{ key: string; col: number } | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(null); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);
  if (!b) return <DashPage><DashBox title="Fünfjahreswertung" info="fuenfjahreswertung" span={3} rows={2}><Empty icon="international">Dieser Spielstand hat keine Hintergrund-Welt – keine Fünfjahreswertung.</Empty></DashBox></DashPage>;

  const rows = sort === 'total' ? b.rows : [...b.rows].sort((x, y) => (y.seasons[b.live] ?? -1) - (x.seasons[b.live] ?? -1) || x.rank - y.rank);
  const own = b.rows.find((r) => r.home);
  const nextY = seasonStartYear(b.next);
  const comps = b.comps.map((c) => ({ ...c, short: compShort(c.id, nextY) }));
  const grid = { gridTemplateColumns: `40px 74px minmax(160px, 2.2fr) minmax(64px, 0.8fr) repeat(${b.seasons.length}, minmax(60px, 1fr)) minmax(70px, 1fr) minmax(76px, 1fr) minmax(64px, 0.9fr) repeat(${comps.length}, 40px)` };
  const breakdown = open ? coefBreakdown(g, b, open.key, open.col) : null;
  const openRow = open ? b.rows.find((r) => r.key === open.key) : null;
  const right = own ? (
    <span className="cfx-own">
      <CountryFlag country={own.key} height={14} />
      <b>{own.name}: {own.rank}.</b>
      <span>{f2(own.total)} Punkte · Startplätze {b.next}: {comps.map((c) => own.slots[c.id]).join('/')}</span>
    </span>
  ) : undefined;

  return (
    <DashPage>
      <DashBox title="Fünfjahreswertung" info="fuenfjahreswertung" span={3} rows={2} flush className="cfx-box" right={right}>
        <div className="cfx-wrap">
          <div className="cfx-row cfx-head" style={grid}>
            <span className="cfx-c" title="Platz nach vier abgeschlossenen Saisons + laufender Saison">Pl.</span>
            <span className="cfx-c" title={`Amtlicher Platz nach ${b.lastDone} – nach ihm richten sich die Startplätze dieser Saison`}>Vorjahr</span>
            <span>Land</span>
            <span className="cfx-n" title={`Starter ${b.seasons[b.live]}: noch im Wettbewerb (gesamt)`}>Starter</span>
            {b.seasons.map((s, i) => (
              <button key={s} type="button" className={`cfx-n cfx-sort ${i === b.live ? 'cfx-live' : ''} ${i === b.live && sort === 'live' ? 'on' : ''}`}
                disabled={i !== b.live} onClick={() => setSort(sort === 'live' ? 'total' : 'live')}
                title={i === b.live ? 'Laufende Saison (live) – Klick sortiert danach' : `Saison ${s}`}>
                {s.slice(2)}{i === b.live && <em>live</em>}
              </button>
            ))}
            <button type="button" className={`cfx-n cfx-sort cfx-sum ${sort === 'total' ? 'on' : ''}`} onClick={() => setSort('total')} title="Summe der fünf Saisons – Klick sortiert danach">Gesamt</button>
            <span className="cfx-n" title={`Punkte aller Starter ${b.seasons[b.live]} zusammen (die Wertung nimmt den Durchschnitt je Starter)`}>Teampkt.</span>
            <span className="cfx-n" title="Rückstand auf den Platz davor">Rückst.</span>
            {comps.map((c) => <span key={c.id} className="cfx-c cfx-slothead" title={`Startplätze ${c.name} ${b.next}`}>{c.short}</span>)}
          </div>
          <div className="cfx-list">
            {rows.map((r) => <Row key={r.key} r={r} b={b} grid={grid} comps={comps} cells={cells} open={open} onOpen={(col) => setOpen(open?.key === r.key && open.col === col ? null : { key: r.key, col })} />)}
          </div>
          <Legend b={b} comps={comps} />
          {open && openRow && (
            <aside className="cfx-panel" role="dialog" aria-label="Punkte je Verein">
              <div className="cfx-panel-head">
                <span className="cflag-link" data-country={openRow.key}><CountryFlag country={openRow.key} height={16} noLink />{openRow.name}</span>
                <b>{b.seasons[open.col]}{open.col === b.live ? ' · live' : ''}</b>
                <button type="button" className="b3 b3-icon cfx-x" onClick={() => setOpen(null)} aria-label="Schließen" title="Schließen (Esc)"><Icon name="close" size={16} /></button>
              </div>
              {breakdown ? <>
                <div className="cfx-prow cfx-phead"><span>Verein</span><span title="Wettbewerb">Wettb.</span>{breakdown.live && <span>Stand</span>}<span className="cfx-n" title="Punkte">Pkt.</span></div>
                <div className="cfx-plist">
                  {breakdown.clubs.map((c) => (
                    <div key={c.id} className={`cfx-prow ${c.id === g.managedClubId ? 'me' : ''}`}>
                      <span className="cfx-club"><ClubLink id={c.id}>{c.name}</ClubLink></span>
                      <span className="cfx-dim">{c.comps.map((k) => comps.find((x) => x.id === k)?.short ?? compShort(k, seasonStartYear(breakdown.season))).join(' + ')}</span>
                      {breakdown.live && <span className={`cfx-st ${c.state ?? ''}`}>{c.state ? STATE_DE[c.state] : ''}</span>}
                      <b className="cfx-n">{f2(c.pts)}</b>
                    </div>
                  ))}
                </div>
                <div className="cfx-psum">
                  <span>{f2(breakdown.sum)} Punkte ÷ {breakdown.clubs.length} Starter</span>
                  <b>= {f2(breakdown.avg)}</b>
                </div>
                <div className="cfx-pnote">1 Punkt je Teilnahme, 2 je gewonnene Runde und für den Titel, in Gruppen 1 je Sieg und ½ je Remis.{breakdown.live ? ' Stand heute – die Saison läuft noch.' : ''}</div>
              </> : <div className="cfx-pnote">Für diese Saison kennt das Spiel nur den Wert des Landes ({f2(openRow.seasons[open.col])}), keine Punkte je Verein.</div>}
            </aside>
          )}
        </div>
      </DashBox>
    </DashPage>
  );
}

function Row({ r, b, grid, comps, cells, open, onOpen }: {
  r: BoardRow; b: CoefBoard; grid: CSSProperties; comps: { id: CoefComp; name: string; short: string }[];
  cells: Set<string>; open: { key: string; col: number } | null; onOpen: (col: number) => void;
}) {
  const mv = r.prev == null ? null : r.prev - r.rank;
  const zone = b.bands[r.band];
  const zoned = zone && comps.some((c) => zone.slots[c.id] > 0);
  return (
    <div className={`cfx-row ${r.home ? 'me' : ''} ${zoned ? `cfx-z${Math.min(r.band, 5)}` : ''}`} style={grid} data-country-row={r.key}>
      <span className="cfx-c cfx-rank">{r.rank}</span>
      <span className="cfx-c cfx-prev" title={r.prev == null ? 'Damals noch nicht gewertet' : `Platz nach ${b.lastDone}: ${r.prev}`}>
        {r.prev ?? '–'}{mv != null && mv !== 0 && <i className={`cfx-mv ${mv > 0 ? 'up' : 'down'}`}>{mv > 0 ? `+${mv}` : `−${-mv}`}</i>}
      </span>
      <span className="cfx-land"><span className="cflag-link" data-country={r.key} title={`Länderprofil ${r.name}`}><CountryFlag country={r.key} height={14} noLink />{r.name}</span>{r.home && <em>Dein Land</em>}</span>
      <span className="cfx-n cfx-teams" title={r.teams ? comps.map((c) => `${c.name}: ${r.teams!.byComp[c.id]}`).join(' · ') : 'Keine Europapokale in dieser Saison'}>
        {r.teams ? <>{r.teams.alive}<small> ({r.teams.total})</small></> : '–'}
      </span>
      {r.seasons.map((v, i) => {
        const can = cells.has(`${r.key}|${i}`);
        const on = open?.key === r.key && open.col === i;
        const cls = `cfx-n cfx-season ${i === b.live ? 'cfx-live' : ''} ${can ? 'can' : ''} ${on ? 'on' : ''}`;
        return can
          ? <button key={i} type="button" className={cls} onClick={() => onOpen(i)} title={`Punkte je Verein ${b.seasons[i]}`}>{f2(v)}</button>
          : <span key={i} className={cls}>{f2(v)}</span>;
      })}
      <span className="cfx-n cfx-sum">{f2(r.total)}</span>
      <span className="cfx-n cfx-dim">{f2(r.teamPts)}</span>
      <span className="cfx-n cfx-dim">{r.gap == null ? '' : f2(r.gap)}</span>
      {comps.map((c) => <span key={c.id} className={`cfx-c cfx-slot ${r.slots[c.id] ? '' : 'none'} ${r.fixed ? 'fixed' : ''}`}
        title={r.fixed ? 'Steht fest (Platz nach der letzten abgeschlossenen Saison)' : 'Prognose nach heutigem Platz'}>{r.slots[c.id] || '–'}</span>)}
    </div>
  );
}

function Legend({ b, comps }: { b: CoefBoard; comps: { id: CoefComp; name: string; short: string }[] }) {
  return (
    <div className="cfx-foot">
      <div className="cfx-zones">
        <span className="cfx-ftitle">Startplätze {b.next}</span>
        {b.bands.map((z, i) => comps.some((c) => z.slots[c.id] > 0) && (
          <span key={z.from} className={`cfx-zone cfx-z${Math.min(i, 5)}`}>
            <b>{z.from === z.to ? `${z.from}.` : `${z.from}.–${z.to}.`}</b>{comps.map((c) => z.slots[c.id]).join('/')}
          </span>
        ))}
        <span className="cfx-keys">{comps.map((c) => <span key={c.id}><b>{c.short}</b> {c.name}</span>)}</span>
      </div>
      <div className="cfx-note">
        Punkte je Saison = Durchschnitt aller Starter des Landes · Wertung = Summe der fünf Spalten, die laufende Saison zählt live mit ·
        Startplätze deines Landes stehen fest (Platz nach {b.lastDone}), die übrigen sind eine Prognose – beim Saisonwechsel wird neu gereiht ·
        einer der Plätze im Wettbewerb „{b.comps.find((c) => c.id === b.cupTo)?.name}“ geht an den Landespokalsieger
      </div>
    </div>
  );
}
