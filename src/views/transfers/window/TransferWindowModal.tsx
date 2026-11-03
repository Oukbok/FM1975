// =============================================================================
// TRANSFERBILANZ — Popup nach jedem Fensterschluss (DayUi.onTransferWindow,
// shell/GameShell.tsx) und nachträglich aus dem Transfermarkt.
// Ablauf nach dem Schluss: erst „Top-Transfers“ (Zeitungsseite), dann die Bilanz.
// Reiter Transfers | Verträge | Gerüchteküche | Trainerkarussell, links Liga und
// „Transfer des Fensters“, unten „nicht wieder anzeigen“ + „Verein auswählen“.
// Daten: game/transferLog.ts + game/transferLogView.ts. CSS 28-transfer3.css.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import PlayerModal from '../../../components/PlayerModal';
import { CalendarEngine } from '../../../engine/calendar';
import type { AppSettings } from '../../../engine/save';
import type { Game } from '../../../game/state';
import { windowClose, windowLabel, windowsForView } from '../../../game/transferLog';
import {
  clubsOfWindow, coachNews, DEFAULT_FILTER, filterRows, renewalNews, rowsOf, rumorNews, sortRows, topTransfers, transferOfWindow,
  type TLFilter, type TLSortKey,
} from '../../../game/transferLogView';
import { NewsBox, NewsList, WindowSide } from './WindowSide';
import { WindowFilters, WindowTable } from './WindowTable';
import { TopTransfersPage } from './TopTransfersPage';
import { fmtDate } from './parts';

type Tab = 'transfers' | 'vertraege' | 'geruechte' | 'trainer';
const TABS: { k: Tab; label: string }[] = [
  { k: 'transfers', label: 'Transfers' }, { k: 'vertraege', label: 'Verträge' },
  { k: 'geruechte', label: 'Gerüchteküche' }, { k: 'trainer', label: 'Trainerkarussell' },
];

export function TransferWindowModal({ g, initialKey, auto, settings, onSettings, onClose }: {
  g: Game; initialKey?: string; auto?: boolean;
  settings?: AppSettings; onSettings?: (s: AppSettings) => void; onClose: () => void;
}) {
  const wins = windowsForView(g);
  const [key, setKey] = useState(initialKey ?? wins[0]?.key ?? '');
  const win = wins.find((w) => w.key === key) ?? wins[0];
  const rows = useMemo(() => (win ? rowsOf(g, win) : []), [g, win]);
  const tops = useMemo(() => topTransfers(g, rows), [g, rows]);
  const [page, setPage] = useState<'top' | 'bilanz'>(auto && tops.length ? 'top' : 'bilanz');
  const [tab, setTab] = useState<Tab>('transfers');
  const [filter, setFilter] = useState<TLFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<{ k: TLSortKey; desc: boolean }>({ k: 'fee', desc: true });
  const [sel, setSel] = useState<string | null>(null);
  const [hide, setHide] = useState(settings?.transferWindowShow === false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sel && document.querySelectorAll('.modal-overlay').length <= 1) close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const close = () => {
    if (settings && onSettings && hide !== (settings.transferWindowShow === false)) onSettings({ ...settings, transferWindowShow: !hide });
    onClose();
  };
  const club = filter.club;
  const shown = sortRows(filterRows(rows, filter), sort.k, sort.desc);
  const top = transferOfWindow(club ? rows.filter((r) => r.e.f === club || r.e.t === club) : rows);
  const league = g.leagues?.playerDivision?.name ?? '1. Liga';
  const clubs = clubsOfWindow(g, rows);
  const p = sel ? g.players[sel] : null;
  const onSort = (k: TLSortKey) => setSort((s) => (s.k === k ? { k, desc: !s.desc } : { k, desc: k !== 'name' && k !== 'pos' && k !== 'from' && k !== 'to' }));

  if (!win) {
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="tw-panel tw-panel-empty" onClick={(e) => e.stopPropagation()}>
          <div className="tw-empty">Noch keine Wechsel protokolliert. Die Transferbilanz füllt sich mit dem nächsten Transferfenster.</div>
          <div className="tw-foot"><span className="tw-sp" /><button className="btn btn-primary" onClick={close}>Schließen</button></div>
        </div>
      </div>
    );
  }

  const renew = renewalNews(g, win, club);
  const rumors = rumorNews(g, win, club);
  const coaches = coachNews(g, win, club);

  return (
    <div className="modal-overlay tw-overlay" onClick={close}>
      <div className="tw-panel" role="dialog" aria-label="Transferbilanz" onClick={(e) => e.stopPropagation()}>
        <div className="tw-head">
          <div className="tw-title">{page === 'top' ? 'Top-Transfers' : 'Transferbilanz'}</div>
          <div className="tw-head-sub">{windowLabel(win.key)}{win.rec ? ' · nachträglich aus den Spielerverläufen' : ''}</div>
          <span className="tw-sp" />
          {wins.length > 1 && (
            <label className="tw-select">Fenster
              <select value={win.key} onChange={(e) => { setKey(e.target.value); setFilter({ ...filter, club: '' }); }}>
                {wins.map((w) => <option key={w.key} value={w.key}>{windowLabel(w.key)}</option>)}
              </select>
            </label>
          )}
          <button className={`dchip ${page === 'top' ? 'on' : ''}`} onClick={() => setPage(page === 'top' ? 'bilanz' : 'top')}>
            {page === 'top' ? 'Zur Transferbilanz' : 'Top-Transfers'}
          </button>
        </div>

        {page === 'top' ? (
          <div className="tw-page-top">
            <TopTransfersPage g={g} league={league} label={windowLabel(win.key)} date={CalendarEngine.addDays(windowClose(win.key), 1)} rows={tops} onOpen={setSel} />
          </div>
        ) : (
          <>
            <nav className="tw-tabs">
              {TABS.map((t) => <button key={t.k} className={`tw-tab ${tab === t.k ? 'on' : ''}`} onClick={() => setTab(t.k)}>{t.label}</button>)}
              <span className="tw-sp" />
              <button className="tw-tab" onClick={close}>Schließen</button>
            </nav>
            <div className="tw-main">
              <WindowSide g={g} league={league} label={windowLabel(win.key)} top={top} onOpen={setSel} />
              {tab === 'transfers' ? (
                <div className="tw-content">
                  <div className="tw-upper">
                    <div className="tw-tablewrap"><WindowTable g={g} rows={shown} sort={sort} onSort={onSort} onOpen={setSel} /></div>
                    <WindowFilters f={filter} onChange={setFilter} count={shown.length} total={rows.length} until={fmtDate(windowClose(win.key))} />
                  </div>
                  <div className="tw-boxes">
                    <NewsBox title="Vertragsverlängerungen"><NewsList g={g} items={renew.slice(0, 8)} empty="Keine Verlängerungen gemeldet." onOpen={setSel} /></NewsBox>
                    <NewsBox title="Gerüchteküche" info="geruechtekueche"><NewsList g={g} items={rumors} empty="Die Gerüchteküche ist ruhig." onOpen={setSel} /></NewsBox>
                    <NewsBox title="Trainerkarussell"><NewsList g={g} items={coaches} empty="Keine Trainerwechsel." onOpen={setSel} /></NewsBox>
                  </div>
                </div>
              ) : (
                <div className="tw-content">
                  <NewsBox title={TABS.find((t) => t.k === tab)!.label} info={tab === 'geruechte' ? 'geruechtekueche' : undefined}>
                    {tab === 'vertraege' && <NewsList g={g} items={renew} empty="Keine Verlängerungen gemeldet. Verlängerungen der Vereine stehen jeweils im Sommerfenster (Vertragsende am 1. Juli)." onOpen={setSel} />}
                    {tab === 'geruechte' && <NewsList g={g} items={rumors} empty="Die Gerüchteküche ist ruhig." onOpen={setSel} />}
                    {tab === 'trainer' && <NewsList g={g} items={coaches} empty="Keine Trainerwechsel in diesem Zeitraum." onOpen={setSel} />}
                  </NewsBox>
                </div>
              )}
            </div>
          </>
        )}

        <div className="tw-foot">
          {settings && onSettings ? (
            <label className="tw-chk"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Diesen Bildschirm nicht wieder anzeigen</label>
          ) : <span className="tw-foot-note">Nach jedem Fensterschluss erscheint die Bilanz automatisch (Einstellungen).</span>}
          <span className="tw-sp" />
          {page === 'bilanz' && (
            <label className="tw-select">Verein auswählen
              <select value={club} onChange={(e) => setFilter({ ...filter, club: e.target.value })}>
                <option value="">Alle Vereine</option>
                {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          {page === 'top'
            ? <><button className="btn btn-ghost" onClick={close}>Schließen</button><button className="btn btn-primary" onClick={() => setPage('bilanz')}>OK</button></>
            : <button className="btn btn-primary" onClick={close}>Schließen</button>}
        </div>
      </div>
      {p && (
        <div onClick={(e) => e.stopPropagation()}>
          <PlayerModal player={p} club={g.clubs[p.clubId]} squad={g.clubs[p.clubId]?.playerIds.map((id) => g.players[id])}
            today={g.calendar.currentDate} season={g.season} onClose={() => setSel(null)} />
        </div>
      )}
    </div>
  );
}
