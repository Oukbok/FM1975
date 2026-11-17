// =============================================================================
// Taktik-Seite, mittlere Spalte: alle Anweisungen in drei Abschnitten, jede Zeile
// gleich gebaut (Beschriftung + Stufen). Unten ein fester Erklärbereich: was die
// Wahl unter dem Mauszeiger bringt und kostet, warum etwas gesperrt ist – sonst
// der Steckbrief „Taktik der Zeit“. Ein Punkt markiert, was die Mannschaft
// eingeübt hat (engine/cohesion.ts).
// Wunsch Pascal (größer, übersichtlicher): Die Zeilen füllen die Box, jede Stufe ist ein
// großer Knopf; Stärke-Stufen tragen ansteigende Balken, die Breite eine kleine Angriffszone.
// =============================================================================
import { useState } from 'react';
import type { Tactics } from '../../types';
import { tacticEraNotes } from '../../engine/tacticEra';
import Icon from '../Icon';
import { INSTRUCTIONS, INSTR_BY_KEY, SECTION_LABEL, instructionState, type InstrKey, type Section } from './instructions';

/** Ansteigende Balken (Stufe i von n) bzw. Zone im Spielfeld (Breite: Mitte … Flügel). */
function Glyph({ kind, i, n }: { kind: 'level' | 'zone'; i: number; n: number }) {
  if (kind === 'zone') {
    // fünf Bahnen: 0 = nur Mitte, 4 = nur Flügel
    const lanes = [[2], [1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 3, 4], [0, 4]][i] ?? [2];
    return (
      <svg className="txi-glyph zone" viewBox="0 0 30 12" aria-hidden="true">
        <rect x="0.5" y="0.5" width="29" height="11" rx="1.5" className="g-frame" />
        {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={1.5 + k * 5.5} y="2" width="4.5" height="8" rx="0.8" className={lanes.includes(k) ? 'g-on' : 'g-off'} />)}
      </svg>
    );
  }
  return (
    <svg className="txi-glyph level" viewBox={`0 0 ${n * 5} 12`} aria-hidden="true">
      {Array.from({ length: n }, (_, k) => <rect key={k} x={k * 5} y={12 - (4 + k * 8 / Math.max(1, n - 1))} width="3.5" height={4 + k * 8 / Math.max(1, n - 1)} rx="0.6" className={k <= i ? 'g-on' : 'g-off'} />)}
    </svg>
  );
}

/** Eingeübt-Balken: Breite und Farbe (rot → grün) nach dem Stand; Einsatz braucht kein Einüben. */
function DrillBar({ v }: { v: number | null }) {
  if (v == null) return <i className="txi-drill none" title="Einsatz muss nicht eingeübt werden" />;
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
  const word = pct >= 85 ? 'sitzt' : pct >= 60 ? 'fast eingeübt' : pct >= 30 ? 'halb eingeübt' : 'kaum eingeübt';
  return (
    <i className="txi-drill" role="img" aria-label={`Eingeübt: ${word}`} title={`Eingeübt: ${word}`}>
      <em style={{ width: `${Math.max(4, pct)}%`, background: `color-mix(in srgb, var(--pos) ${pct}%, var(--neg))` }} />
    </i>
  );
}

export function InstructionPanel({ t, year, set, drilled, levels, sections }: {
  t: Tactics; year: number; set: (p: Partial<Tactics>) => void;
  /** Abschnitte dieser Box (Wunsch Pascal: In Ballbesitz = Grundausrichtung + Mit Ball, Defensive = Gegen den Ball). */
  sections: Section[];
  /** Eingeübte Wahl je Anweisung (Index) – fehlt = keine Markierung. */
  drilled?: Partial<Record<InstrKey, number>>;
  /** Wie gut jede Anweisung eingeübt ist (0–1) – Balken rot → grün vor den Stufen; fehlt = kein Balken. */
  levels?: Partial<Record<InstrKey, number>>;
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
        {sections.map((sec) => (
          <section key={sec} className="txi-sec">
            <h4 className="txi-h">{SECTION_LABEL[sec]}</h4>
            {INSTRUCTIONS.filter((d) => d.section === sec).map((d) => (
              <div key={d.key} className="txi-row" data-instr={d.key}>
                <span className="txi-label">
                  <span className="txi-label-t">{d.label}</span>
                  {levels && <DrillBar v={d.key === 'effort' ? null : levels[d.key] ?? 1} />}
                </span>
                <div className={`txi-steps n${d.opts.length}`} role="radiogroup" aria-label={d.label}>
                  {d.opts.map((o, i) => {
                    const lk = st[d.key].locks[i];
                    const on = st[d.key].i === i;
                    return (
                      <button key={i} type="button" role="radio" aria-checked={on} aria-disabled={!!lk || undefined}
                        className={`txi-step${on ? ' on' : ''}${lk ? ' locked' : ''}${drilled?.[d.key] === i ? ' drilled' : ''}`}
                        onMouseEnter={() => setFocus({ key: d.key, i })} onFocus={() => setFocus({ key: d.key, i })}
                        onClick={() => { setFocus({ key: d.key, i }); if (!lk && !on) set(d.set(i)); }}>
                        {d.glyph && <Glyph kind={d.glyph} i={i} n={d.opts.length} />}
                        <span className="txi-step-l">{lk && <Icon name="lockMono" size={13} />}<span>{o.label}</span></span>
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
          <p><b>{fd.label} · {fd.opts[focus.i].label}:</b> {lock ?? fd.opts[focus.i].text}
            {!lock && dIdx != null && dIdx !== focus.i && <span className="txi-foot-note"> Eingeübt ist „{fd.opts[dIdx].label}“ – die Umstellung braucht Training und Spiele.</span>}</p>
        ) : (
          <p><b>Taktik der Zeit {year}/{String((year + 1) % 100).padStart(2, '0')}:</b> {era.now.join(' ')}{era.next ? <span className="txi-foot-note"> Ab {era.next.year}: {era.next.text}</span> : null}</p>
        )}
      </div>
    </div>
  );
}
