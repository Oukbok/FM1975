import { EventChoices } from './EventChoices';
import { CalendarEngine } from '../../engine/calendar';
import { CATEGORY_META, unreadCount } from '../../engine/messages';
import { Game } from '../../game/state';
import { InboxMessage } from '../../types';
import { InboxFilterBar, matchesFilter, needsDecision, type InboxFilter } from './inboxFilter';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import { useState } from 'react';

// =============================================================================
// NACHRICHTEN — Posteingang links, Lesebereich rechts (wie Football Manager)
// =============================================================================
export function NewsView({ g, onRead }: { g: Game; onRead: () => void }) {
  const [openId, setOpenId] = useState<string | null>(g.messages[0]?.id ?? null);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const list = g.messages.filter((m) => matchesFilter(m, filter));
  const open = openId ? g.messages.find((m) => m.id === openId) ?? null : null;
  const unread = unreadCount(g.messages);

  const openMsg = (m: InboxMessage) => {
    if (!m.read) { m.read = true; onRead(); }
    setOpenId(m.id);
  };
  const markAllRead = () => { g.messages.forEach((m) => (m.read = true)); onRead(); };

  return (
    <DashPage>
      <DashBox title="Posteingang" icon="news" rows={2} right={unread > 0 ? `${unread} ungelesen` : 'alles gelesen'}>
        <div className="news-tools">
          <InboxFilterBar msgs={g.messages} value={filter} onChange={setFilter} compact />
          <button className="b3" onClick={markAllRead} disabled={unread === 0}>Alle gelesen</button>
        </div>
        {list.length === 0 ? <Empty icon="news">Keine Nachrichten.</Empty> : (
          <div className="dlist">
            {list.map((m) => (
              <div key={m.id} className={`dmsg ${m.read ? '' : 'unread'} ${m.id === openId ? 'sel' : ''}`} onClick={() => openMsg(m)}>
                <span className="dmsg-main">
                  <span className="dmsg-top"><b>{m.from}</b><span>{CATEGORY_META[m.category]?.label} · {CalendarEngine.formatDate(m.date)}</span></span>
                  <span className="dmsg-subj">{m.subject}{needsDecision(m) && <i className="dz-act">Entscheidung</i>}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </DashBox>

      <DashBox title={open ? open.subject : 'Nachricht'} icon="news" span={2} rows={2}
        right={open ? CATEGORY_META[open.category].label : undefined}>
        {open ? (
          <div className="dread">
            <div className="dread-meta">
              <span>Von <b>{open.from}</b></span>
              <span>{CalendarEngine.formatDate(open.date)}</span>
              {needsDecision(open) && <span className="dz-act">Entscheidung nötig</span>}
            </div>
            <div className="dread-lead">{open.shortText}</div>
            <div className="dread-body">{open.bodyText}</div>
            <EventChoices g={g} msg={open} onDone={onRead} />
          </div>
        ) : <Empty icon="news">Wähle links eine Nachricht aus.</Empty>}
      </DashBox>
    </DashPage>
  );
}

/** Einzelne Nachricht als großes Popup (z. B. aus der Zentrale geöffnet). */
export function MessageModal({ msg, onClose, g }: { msg: InboxMessage; onClose: () => void; g?: Game }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">{CATEGORY_META[msg.category].label} · {msg.from} · {CalendarEngine.formatDate(msg.date)}</div>
            <h2>{msg.subject}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body">
          <div className="dread">
            <div className="dread-lead">{msg.shortText}</div>
            <div className="dread-body">{msg.bodyText}</div>
            {g && <EventChoices g={g} msg={msg} />}
          </div>
        </div>
      </div>
    </div>
  );
}
