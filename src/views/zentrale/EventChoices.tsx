import { useState } from 'react';
import { InboxMessage } from '../../types';
import { Game } from '../../game/state';
import { chooseEventOption } from '../../game/eventsGame';

/** Entscheidungsknöpfe eines Zufallsereignisses (bzw. das Ergebnis danach). */
export function EventChoices({ g, msg, onDone }: { g: Game; msg: InboxMessage; onDone?: () => void }) {
  const [, tick] = useState(0);
  if (msg.resultText) return <div className="ev-result">{msg.resultText}</div>;
  if (!msg.choices?.length || !msg.eventRef || msg.eventRef.resolved) return null;
  return (
    <div className="ev-choices">
      <div className="dsec">Deine Entscheidung (bis {msg.eventRef.deadline.split('-').reverse().join('.')})</div>
      <div className="ev-list">
        {msg.choices.map((c) => (
          <button key={c.id} type="button" className="ev-choice" onClick={() => { chooseEventOption(g, msg, c.id); tick((t) => t + 1); onDone?.(); }}>
            <span className="ev-choice-l">{c.label}</span>
            {c.hint && <span className="ev-choice-h">{c.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
