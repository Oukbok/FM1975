// =============================================================================
// Taktik-Seite: Vorlagen laden und eigene Taktiken speichern (Kopf der Box
// „Anweisungen“). Vorlagen der Epoche + eigene in einer Auswahlliste; das kleine
// Fenster „Speichern“ hat feste Größe und verwaltet die eigenen Taktiken.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { Tactics } from '../../types';
import type { Game } from '../../game/state';
import Select from '../../ui/Select';
import Icon from '../Icon';
import { PRESETS, instrPatchOf, samePatch } from './instructions';
import { MAX_SAVED_TACTICS, applySaved, deleteTactic, saveTactic, savedTactics } from './savedTactics';

export function TacticPresets({ g, t, year, set }: { g: Game; t: Tactics; year: number; set: (p: Partial<Tactics>) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [, bump] = useState(0);
  const root = useRef<HTMLSpanElement>(null);
  const saved = savedTactics(g);
  const cur = instrPatchOf(t, year);
  const presets = PRESETS.filter((p) => !p.from || year >= p.from);
  const active = saved.find((s) => samePatch(s.patch, cur))?.id ?? presets.find((p) => samePatch(p.patch, cur))?.id ?? '';
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', down);
    window.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); window.removeEventListener('keydown', key); };
  }, [open]);
  const pick = (id: string) => {
    const s = saved.find((x) => x.id === id);
    if (s) return set(applySaved(t, s));
    const p = presets.find((x) => x.id === id);
    if (p) set({ ...p.patch });
  };
  const full = saved.length >= MAX_SAVED_TACTICS && !saved.some((s) => s.name.toLowerCase() === name.trim().toLowerCase());
  const save = () => { if (saveTactic(g, t, year, name)) { setName(''); bump((n) => n + 1); } };
  return (
    <span className="txp" ref={root}>
      <Select className="dselect txp-select" size="s" width={236} popWidth={380} value={active} onChange={pick} placeholder="Vorlage laden" title="Vorlage oder gespeicherte Taktik laden" aria-label="Vorlage laden">
        <optgroup label="Vorlagen">
          {presets.map((p) => <option key={p.id} value={p.id} title={p.text}>{p.name}</option>)}
        </optgroup>
        {saved.length > 0 && (
          <optgroup label="Eigene Taktiken">
            {saved.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </optgroup>
        )}
      </Select>
      <button type="button" className={`b3 b3-s${open ? ' on' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>Speichern</button>
      {open && (
        <div className="txp-pop" role="dialog" aria-label="Taktik speichern">
          <div className="txp-new">
            <input value={name} maxLength={28} placeholder={`Taktik ${saved.length + 1}`} aria-label="Name der Taktik" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !full) save(); }} />
            <button type="button" className="b3 b3-s b3-primary" disabled={full} onClick={save}>Speichern</button>
          </div>
          <div className="txp-hint">{full ? `Höchstens ${MAX_SAVED_TACTICS} Taktiken – lösche eine oder überschreibe sie mit ihrem Namen.` : 'Gespeichert werden Anweisungen und Rollen, nicht die Aufstellung. Gleicher Name überschreibt.'}</div>
          <div className="txp-list">
            {saved.length ? saved.map((s) => (
              <div key={s.id} className="txp-item">
                <button type="button" className="txp-load" onClick={() => { set(applySaved(t, s)); setOpen(false); }} title="Laden">{s.name}</button>
                <button type="button" className="txp-del" aria-label={`${s.name} löschen`} title="Löschen" onClick={() => { deleteTactic(g, s.id); bump((n) => n + 1); }}><Icon name="close" size={14} /></button>
              </div>
            )) : <div className="txp-empty">Noch keine eigene Taktik gespeichert.</div>}
          </div>
        </div>
      )}
    </span>
  );
}
