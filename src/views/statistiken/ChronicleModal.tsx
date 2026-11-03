// =============================================================================
// CHRONIK-POPUP — „Chronik des deutschen Fußballs“ (Footer rechts, GameShell)
// -----------------------------------------------------------------------------
// Großes Fenster (modal-xl) mit allen Meilensteinen aus data/timeline.ts:
// links Suche, Sprung zur aktuellen Saison, Jahrzehnte und Bereiche; Mitte die
// Zeitleiste nach Jahrzehnten (Markierung „Heute“ an der aktuellen Saison);
// rechts die laufende Saison, die nächsten Meilensteine, Wandel nach Bereichen
// und die Deutschen Meister.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { TIMELINE_TYPE_META, seasonStartYear } from '../../data/timeline';
import { recordBook } from '../../game/clubRecords';
import { compClubName } from '../../game/competitionView';
import type { Game } from '../../game/state';
import { KV, Meter } from '../../ui/DashPage';
import { openWiki } from '../../ui/InfoTip';
import { CHRONICLE_WIKI_ID, ChronTimeline, chronEvents, chronStateOf, decadeOf, matchChronicle, type TlType } from './ChronicleView';

export function ChronicleModal({ g, onClose }: { g: Game; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | TlType>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const curYear = seasonStartYear(g.season);
  const events = useMemo(() => chronEvents(), []);
  const stateOf = chronStateOf(g);
  const shown = matchChronicle(events, q).filter((e) => type === 'all' || e.type === type);
  const decades = [...new Set(events.map(decadeOf))];
  const types = (Object.keys(TIMELINE_TYPE_META) as TlType[]).filter((t) => events.some((e) => e.type === t));
  const passed = events.filter((e) => stateOf(e) !== 'future').length;
  const current = events.filter((e) => stateOf(e) === 'current');
  const upcoming = events.filter((e) => stateOf(e) === 'future').slice(0, 5);
  const champions = Object.entries(recordBook(g)?.titles ?? {})
    .flatMap(([id, l]) => l.filter(([k]) => k === 'meister').map(([, season]) => ({ id, season })))
    .sort((a, b) => b.season.localeCompare(a.season));

  const scrollTo = (sel: string, smooth = true) => {
    const box = listRef.current;
    const el = box?.querySelector<HTMLElement>(sel);
    if (box && el) box.scrollTo({ top: el.offsetTop - box.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' });
  };
  const toNow = (smooth = true) => scrollTo('.chm-now', smooth);
  useEffect(() => { toNow(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl chm-modal" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label="Chronik des deutschen Fußballs">
        <div className="mx-head">
          <div>
            <div className="mx-sub">Regeln, Wettbewerbe und Wandel · {passed}/{events.length} erreicht</div>
            <h2>Chronik des deutschen Fußballs</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="mx-body chm-body">
          <aside className="chm-nav">
            <input className="chm-search" type="search" value={q} placeholder="Suchen (z. B. Bosman, 1995)" onChange={(ev) => setQ(ev.target.value)} />
            <button className="chm-nowbtn" onClick={() => { setQ(''); setType('all'); setTimeout(() => toNow(), 0); }}>Zur aktuellen Saison</button>
            <div className="dsec">Jahrzehnte</div>
            {decades.map((d) => {
              const n = shown.filter((e) => decadeOf(e) === d).length;
              const isNow = Math.floor(curYear / 10) * 10 === d;
              return (
                <button key={d} className={`chm-dec ${isNow ? 'now' : ''}`} disabled={!n} onClick={() => scrollTo(`[data-dec="${d}"]`)}>
                  <span>{d}er</span><span className="chm-n">{n}</span>
                </button>
              );
            })}
            <div className="dsec">Bereiche</div>
            <div className="chm-types">
              <button className={`dchip ${type === 'all' ? 'on' : ''}`} onClick={() => setType('all')}>Alle</button>
              {types.map((t) => <button key={t} className={`dchip ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{TIMELINE_TYPE_META[t].label}</button>)}
            </div>
          </aside>

          <div className="chm-list" ref={listRef}>
            {!shown.length && <div className="dnote chm-empty">Kein Meilenstein passt zur Suche.</div>}
            <ChronTimeline g={g} shown={shown} />
          </div>

          <aside className="chm-side">
            <div className="dsec">Saison {g.season}</div>
            {current.length ? current.map((e) => (
              <div key={e.id} className="chm-cur"><b>{e.title}</b><span className="dnote">{e.description}</span></div>
            )) : <div className="dnote">In dieser Saison tritt kein Meilenstein in Kraft.</div>}
            <div className="dsec">Als Nächstes</div>
            {upcoming.length ? upcoming.map((e) => <KV key={e.id} k={e.title} v={e.season} />) : <div className="dnote">Keine weiteren Meilensteine.</div>}
            <div className="dsec">Wandel nach Bereichen</div>
            {types.map((t) => {
              const all = events.filter((e) => e.type === t);
              const done = all.filter((e) => stateOf(e) !== 'future').length;
              return <Meter key={t} label={TIMELINE_TYPE_META[t].label} value={done} max={Math.max(1, all.length)} text={`${done}/${all.length}`} />;
            })}
            <div className="dnote mt8">Jeder Meilenstein wird zu Beginn seiner Saison wirksam und verändert das Spiel, etwa die 3-Punkte-Regel 1995/96.</div>
            <button className="dchip mt8" onClick={() => { if (openWiki(CHRONICLE_WIKI_ID)) onClose(); }}>Im Wiki mit Verweisen lesen</button>
            <div className="dsec">Deutsche Meister{champions.length ? ` (seit ${champions[champions.length - 1].season})` : ''}</div>
            <div className="chm-champs">
              {champions.map((x) => <KV key={x.season} k={x.season} v={compClubName(g, x.id, x.season)} />)}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
