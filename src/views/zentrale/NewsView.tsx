import { CalendarEngine } from '../../engine/calendar';
import { CATEGORY_META, unreadCount } from '../../engine/messages';
import { Game } from '../../game/state';
import { InboxMessage } from '../../types';
import { PageHead } from '../../ui/PageHead';
import { useState } from 'react';

// =============================================================================
// NACHRICHTEN (Liste + E-Mail-Detailansicht)
// =============================================================================
export function NewsView({ g, onRead }: { g: Game; onRead: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const list = filter === 'unread' ? g.messages.filter((m) => !m.read) : g.messages;
  const open = openId ? g.messages.find((m) => m.id === openId) ?? null : null;
  const unread = unreadCount(g.messages);

  const openMsg = (m: InboxMessage) => {
    if (!m.read) { m.read = true; onRead(); }
    setOpenId(m.id);
  };
  const markAllRead = () => { g.messages.forEach((m) => (m.read = true)); onRead(); };

  return (
    <div className="page">
      <PageHead
        icon="news"
        title={<>Nachrichten {unread > 0 && <span className="accent">({unread} ungelesen)</span>}</>}
        right={<>
          <button className={`btn-sm ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Alle</button>
          <button className={`btn-sm ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Ungelesen</button>
          <button className="btn-sm" onClick={markAllRead} disabled={unread === 0}>Alle gelesen</button>
        </>}
      />

      <div className="card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div className="dim" style={{ padding: 24, textAlign: 'center' }}>Keine Nachrichten.</div>
        ) : (
          <div className="msg-list">
            {list.map((m) => {
              const meta = CATEGORY_META[m.category];
              return (
                <div key={m.id} className={`msg-item ${m.read ? '' : 'unread'}`} onClick={() => openMsg(m)}>
                  <div className="msg-ico">{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="msg-top">
                      <span className="msg-from">{m.from}</span>
                      <span className="msg-cat">{meta.label}</span>
                      <span className="msg-date">{CalendarEngine.formatDate(m.date)}</span>
                    </div>
                    <div className="msg-subject">{!m.read && <span className="unread-dot" />}{m.subject}</div>
                    <div className="msg-preview dim">{m.shortText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && <MessageModal msg={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

export function MessageModal({ msg, onClose }: { msg: InboxMessage; onClose: () => void }) {
  const meta = CATEGORY_META[msg.category];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div className="row">
            <span className="pill">{meta.icon} {meta.label}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <h2 style={{ margin: '12px 0 6px', fontSize: 20 }}>{msg.subject}</h2>
          <div className="dim mini" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Von: <b style={{ color: 'var(--text)' }}>{msg.from}</b></span>
            <span>Datum: {CalendarEngine.formatDate(msg.date)}</span>
          </div>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {msg.bodyText}
        </div>
      </div>
    </div>
  );
}
