import { LinkedText } from '../../ui/LinkedText';
import { useState } from 'react';
import { InboxMessage } from '../../types';
import { Game } from '../../game/state';
import { chooseEventOption } from '../../game/eventsGame';

/** Hat die Nachricht eine offene Entscheidung oder ein Ergebnis, das EventChoices zeigt? */
export function hasEventChoices(msg: InboxMessage): boolean {
  return !!msg.resultText || (!!msg.choices?.length && !!msg.eventRef && !msg.eventRef.resolved);
}

/**
 * Entscheidungsknöpfe eines Zufallsereignisses (bzw. das Ergebnis danach).
 * `row`: Knöpfe nebeneinander (fester Entscheidungsbereich im Newscenter).
 */
export function EventChoices({ g, msg, onDone, row = false }: { g: Game; msg: InboxMessage; onDone?: () => void; row?: boolean }) {
  const [, tick] = useState(0);
  if (msg.resultText) return <div className="ev-result"><LinkedText g={g} text={msg.resultText} /></div>;
  if (!msg.choices?.length || !msg.eventRef || msg.eventRef.resolved) return null;
  return (
    <div className={`ev-choices ${row ? 'ev-row' : ''}`}>
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
