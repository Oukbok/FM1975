import { useState } from 'react';
import { InboxMessage } from '../../types';
import { Game } from '../../game/state';
import { chooseEventOption } from '../../game/eventsGame';

/** Entscheidungsknöpfe eines Zufallsereignisses (bzw. das Ergebnis danach). */
export function EventChoices({ g, msg, onDone }: { g: Game; msg: InboxMessage; onDone?: () => void }) {
  const [, tick] = useState(0);
  if (msg.resultText) return <div className="dnote mt8" style={{ color: 'var(--accent)', fontSize: 16 }}>{msg.resultText}</div>;
  if (!msg.choices?.length || !msg.eventRef || msg.eventRef.resolved) return null;
  return (
    <div className="mt8">
      <div className="dsec">Deine Entscheidung (bis {msg.eventRef.deadline.split('-').reverse().join('.')})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {msg.choices.map((c) => (
          <button key={c.id} className="dchip on" title={c.hint} onClick={() => { chooseEventOption(g, msg, c.id); tick((t) => t + 1); onDone?.(); }}>
            {c.label}{c.hint ? <span className="muted" style={{ fontWeight: 500 }}> · {c.hint}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
