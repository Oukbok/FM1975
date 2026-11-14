// =============================================================================
// Taktik-Seite, mittlere Spalte: alle Anweisungen in drei Abschnitten, jede Zeile
// gleich gebaut (Beschriftung + Stufen). Unten ein fester Erklärbereich: was die
// Wahl unter dem Mauszeiger bringt und kostet, warum etwas gesperrt ist – sonst
// der Steckbrief „Taktik der Zeit“. Ein Punkt markiert, was die Mannschaft
// eingeübt hat (engine/cohesion.ts).
// =============================================================================
import { useState } from 'react';
import type { Tactics } from '../../types';
import { tacticEraNotes } from '../../engine/tacticEra';
import Icon from '../Icon';
import { INSTRUCTIONS, INSTR_BY_KEY, SECTION_LABEL, instructionState, type InstrKey, type Section } from './instructions';

const SECTIONS: Section[] = ['grund', 'ball', 'gegen'];

export function InstructionPanel({ t, year, set, drilled }: {
  t: Tactics; year: number; set: (p: Partial<Tactics>) => void;
  /** Eingeübte Wahl je Anweisung (Index) – fehlt = keine Markierung. */
  drilled?: Partial<Record<InstrKey, number>>;
}) {
  const st = instructionState(t, year);
  const [focus, setFocus] = useState<{ key: InstrKey; i: number } | null>(null);
  const era = tacticEraNotes(year);
  const fd = focus ? INSTR_BY_KEY[focus.key] : null;
  const lock = focus ? st[focus.key].locks[focus.i] : null;
  const dIdx = focus ? drilled?.[focus.key] : undefined;
  return (
    <div className="txi" onMouseLeave={() => setFocus(null)}>
      <div className="txi-rows">
        {SECTIONS.map((sec) => (
          <section key={sec} className="txi-sec">
            <h4 className="txi-h">{SECTION_LABEL[sec]}</h4>
            {INSTRUCTIONS.filter((d) => d.section === sec).map((d) => (
              <div key={d.key} className="txi-row" data-instr={d.key}>
                <span className="txi-label">{d.label}</span>
                <div className={`txi-steps n${d.opts.length}`} role="radiogroup" aria-label={d.label}>
                  {d.opts.map((o, i) => {
                    const lk = st[d.key].locks[i];
                    const on = st[d.key].i === i;
                    return (
                      <button key={i} type="button" role="radio" aria-checked={on} aria-disabled={!!lk || undefined}
                        className={`txi-step${on ? ' on' : ''}${lk ? ' locked' : ''}${drilled?.[d.key] === i ? ' drilled' : ''}`}
                        onMouseEnter={() => setFocus({ key: d.key, i })} onFocus={() => setFocus({ key: d.key, i })}
                        onClick={() => { setFocus({ key: d.key, i }); if (!lk && !on) set(d.set(i)); }}>
                        {lk && <Icon name="lockMono" size={13} />}<span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="txi-foot" aria-live="polite">
        {fd && focus ? (
          <>
            <div className="txi-foot-h"><b>{fd.label}</b><span>{fd.opts[focus.i].label}</span></div>
            <p>{lock ?? fd.opts[focus.i].text}</p>
            {!lock && dIdx != null && dIdx !== focus.i && <p className="txi-foot-note">Eingeübt ist „{fd.opts[dIdx].label}“ – die Umstellung braucht Training und Spiele.</p>}
            {lock && <p className="txi-foot-note">{fd.about}</p>}
          </>
        ) : (
          <>
            <div className="txi-foot-h"><b>Taktik der Zeit</b><span>Saison {year}/{String((year + 1) % 100).padStart(2, '0')}</span></div>
            <ul className="txi-era">
              {era.now.map((x) => <li key={x}>{x}</li>)}
              {era.next && <li className="next">Ab {era.next.year}: {era.next.text}</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
