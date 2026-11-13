// =============================================================================
// ZENTRALE – Newscenter (Mitte): Nachrichtenliste gruppiert nach Heute/Gestern/
// Diese Woche/Älter, Lesebereich der gewählten Nachricht mit Entscheidungen
// (EventChoices), Sprungzielen und Gesicht des betroffenen Spielers.
// Daten: g.messages (engine/messages.ts) – dieselben wie Zentrale › Nachrichten.
// =============================================================================
import { PlayerMorale } from '../../../components/status';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { openContractScreen } from '../../../screens/contract/contractOpen';
import { JUMP_DECISION_EVENT, oldestPendingDecision } from '../../../engine/messages';
import PlayerAvatar from '../../../components/PlayerAvatar';
import { CATEGORY_META, unreadCount } from '../../../engine/messages';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import type { InboxMessage, MessageCategory } from '../../../types';
import { WD_FULL, vColor } from '../../../ui/format';
import { EventChoices } from '../EventChoices';
import { msgGroup, msgPlayer, msgPlayers, ownGames, type MsgGroup } from './data';
import PosBadge from '../../../components/PosBadge';
import { InboxFilterBar, matchesFilter, needsDecision, type InboxFilter } from '../inboxFilter';
import { pressPhotoFor } from '../../../data/pressPhotos';

/** Passende Seite je Kategorie (Knopf im Lesebereich). */
const CAT_TARGET: Partial<Record<MessageCategory, [Screen, string]>> = {
  transfer: ['verhandlungen', 'Verhandlungen'], injury: ['squad', 'Kader'], match: ['fixtures', 'Spielplan'],
  board: ['cat-verein', 'Verein'], contract: ['vertraege', 'Verträge'], training: ['training', 'Trainingsplan'],
  media: ['presse', 'Presse'], cup: ['cup', 'Pokal'],
};

const dmy = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const wd = (iso: string) => WD_FULL[new Date(iso.slice(0, 10) + 'T00:00:00Z').getUTCDay()];

export function Newscenter({ g, onGoto, onWatch, onChange, openPlayer }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void; onChange: () => void; openPlayer: (id: string) => void;
}) {
  const msgs = g.messages ?? [];
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selId, setSelId] = useState<string | null>(() => (oldestPendingDecision(msgs) ?? msgs.find((m) => !m.read) ?? msgs[0])?.id ?? null);
  const list = msgs.filter((m) => matchesFilter(m, filter));
  const sel = (selId && msgs.find((m) => m.id === selId)) || list[0] || null;
  const unread = unreadCount(msgs);
  const today = g.calendar.currentDate;

  // Roter Brief „Nachrichten“ (GameShell): zur ältesten Nachricht springen, die eine Entscheidung verlangt.
  useEffect(() => {
    const jump = () => {
      const m = oldestPendingDecision(g.messages ?? []);
      if (!m) return;
      setFilter('all'); setSelId(m.id);
      if (!m.read) { m.read = true; onChange(); }
      requestAnimationFrame(() => document.getElementById(`dz-msg-${m.id}`)?.scrollIntoView({ block: 'center' }));
    };
    jump();
    window.addEventListener(JUMP_DECISION_EVENT, jump);
    return () => window.removeEventListener(JUMP_DECISION_EVENT, jump);
  }, [g]);

  const open = (m: InboxMessage) => { setSelId(m.id); if (!m.read) { m.read = true; onChange(); } };
  const allRead = () => { msgs.forEach((m) => (m.read = true)); onChange(); };
  const markUnread = () => { if (sel && sel.read) { sel.read = false; onChange(); } };

  // Wunsch Pascal: keine angeschnittene Zeile unten – Höhe der Liste = Kopf + ganze Zeilen,
  // beim Scrollen rasten die Zeilen ein (scroll-snap, CSS .dz-nlist-in).
  const listRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitH, setFitH] = useState(0);
  useLayoutEffect(() => {
    const outer = listRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = () => {
      const cs = getComputedStyle(outer);
      const avail = outer.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const head = inner.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const row = inner.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0;
      const scale = outer.getBoundingClientRect().height / (outer.offsetHeight || 1); // UI-Skalierung herausrechnen
      if (!row || !avail) return;
      const h = (head + Math.max(1, Math.floor((avail * scale - head) / row)) * row) / scale;
      setFitH((o) => (Math.abs(o - h) > 0.5 ? h : o));
      inner.style.scrollPaddingTop = `${head / scale}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [list.length > 0]);

  let lastGroup: MsgGroup | null = null;
  return (
    <section className="dz-news">
      <div className="dz-nh">
        <span className="dz-nh-title">Newscenter</span>
        <span className="dz-nh-count">{unread > 0 ? `${unread} ungelesen` : 'Alles gelesen'}</span>
        <span className="dz-nh-act">
          <button className="b3" onClick={allRead} disabled={unread === 0} title="Alle Nachrichten als gelesen markieren">Alle gelesen</button>
          <button className="b3" onClick={markUnread} disabled={!sel?.read} title="Gewählte Nachricht wieder als ungelesen markieren">Als ungelesen</button>
        </span>
      </div>
      <InboxFilterBar msgs={msgs} value={filter} onChange={setFilter} />

      <div className="dz-nbody">
        <div className="dz-nlist" ref={listRef}>
          <div className="dz-nlist-in" ref={innerRef} style={fitH ? { height: fitH } : undefined}>
          <table className="dtable rl-sm dz-ntable">
            <thead><tr><th className="dz-ncol-grp">Eingang</th><th>Thema</th><th className="dz-ncol-date">Datum</th><th className="dz-ncol-cat">Kategorie</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} className="dz-dim" style={{ textAlign: 'center' }}>Keine Nachrichten.</td></tr>}
              {list.map((m) => {
                const grp = msgGroup(m, today);
                const head = grp !== lastGroup;
                lastGroup = grp;
                return (
                  <tr key={m.id} id={`dz-msg-${m.id}`} className={`dz-msg ${m.read ? '' : 'unread'} ${sel?.id === m.id ? 'me' : ''} ${head ? 'grp-start' : ''}`}
                    data-player={msgPlayer(g, m) ? '1' : '0'} onClick={() => open(m)}>
                    <td className="dz-ncol-grp">{head ? grp : ''}</td>
                    <td className="dz-nsubj">{needsDecision(m) && <i className="dz-act lead" title="Entscheidung nötig">Entscheidung</i>}<span>{m.subject}</span></td>
                    <td className="dz-ncol-date">{dmy(m.date)}</td>
                    <td className="dz-ncol-cat">{CATEGORY_META[m.category]?.label ?? m.category}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        <Reader g={g} m={sel} onGoto={onGoto} onWatch={onWatch} onChange={onChange} openPlayer={openPlayer} />
      </div>

      <div className="dz-nfoot">
        <span className="dz-dim">{list.length} von {msgs.length} Nachrichten · es bleiben die letzten 80 erhalten.</span>
      </div>
    </section>
  );
}

function Reader({ g, m, onGoto, onWatch, onChange, openPlayer }: {
  g: Game; m: InboxMessage | null; onGoto: (s: Screen) => void; onWatch: (id: string) => void; onChange: () => void; openPlayer: (id: string) => void;
}) {
  if (!m) return <div className="dz-read dz-read-empty">Wähle links eine Nachricht aus.</div>;
  const faces = msgPlayers(g, m);
  const p = faces[0] ?? null;
  const game = !p && m.relatedId ? ownGames(g).find((x) => x.matchId === m.relatedId) : undefined;
  const matchId = game ? m.relatedId! : null;
  const target = CAT_TARGET[m.category];
  const photo = pressPhotoFor(m, { won: !!game && game.gf != null && game.ga != null && game.gf > game.ga });
  return (
    <article className="dz-read" key={m.id}>
      <div className="dz-rdate"><span>{wd(m.date)}</span> {dmy(m.date)}</div>
      <h3 className="dz-rsubj">{m.subject}</h3>
      <div className="dz-rmeta">Von {m.from} · {CATEGORY_META[m.category]?.label}{m.actionRequired && !m.eventRef?.resolved && !m.resultText ? ' · Entscheidung nötig' : ''}</div>
      <div className="dz-rtext">
        {m.shortText && m.shortText !== m.bodyText && <p className="dz-rlead">{m.shortText}</p>}
        {photo && <img className="dz-rphoto" src={photo} alt="" loading="lazy" draggable={false} />}
        <p className="dz-rbody">{m.bodyText}</p>
        <EventChoices g={g} msg={m} onDone={onChange} />
      </div>
      <div className="dz-rfoot">
        <div className="dz-rlinks">
          {matchId && <button className="b3" onClick={() => onWatch(matchId)}>Spielbericht</button>}
          {p && faces.length === 1 && <button className="b3" onClick={() => openPlayer(p.id)}>Spielerprofil</button>}
          {p && m.category === 'contract' && p.clubId === g.managedClubId && !p.isYouth && g.players[p.id] && (
            <button className="b3" onClick={() => openContractScreen({ kind: 'renew', pid: p.id })}>Verhandlungstisch</button>
          )}
          {target && <button className="b3" onClick={() => onGoto(target[0])}>{target[1]}</button>}
        </div>
        {faces.length > 0 && (
          <div className={`dz-rfaces n${faces.length}`}>
            {faces.map((f) => {
              const fx = m.moraleFx?.find((x) => x.pid === f.id);
              return (
                <button key={f.id} className="dz-rface" onClick={() => openPlayer(f.id)} title={`${f.fullName} – Spielerprofil öffnen`}>
                  <PlayerAvatar key={f.id} player={f} club={g.clubs[f.clubId]} size={faces.length > 2 ? 84 : 100} priority />
                  <span className="dz-rface-name">{f.fullName}</span>
                  <span className="dz-rface-sub"><PosBadge p={f} single /><span>{f.age} J. · Stärke {f.overall}</span></span>
                  {f.clubId === g.managedClubId && !f.isYouth && (
                    <span className="dz-rface-mor">Moral <PlayerMorale p={f} size={16} showValue />
                      {fx && <span className={`dz-rface-fx ${fx.d > 0 ? 'pos' : fx.d < 0 ? 'neg' : ''}`}>{fx.d > 0 ? '+' : ''}{fx.d}</span>}
                    </span>
                  )}
                  {fx && <span className="dz-rface-w">{fx.w}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
