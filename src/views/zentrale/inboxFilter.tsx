// =============================================================================
// Posteingang-Filter (Zentrale › Newscenter und Zentrale › Nachrichten)
// =============================================================================
// Wunsch Pascal: keine kleinen orangenen Kategorie-Symbole, keine fummeligen
// Mini-Knöpfe. Oben wenige große Segmente für das, was man wirklich sucht
// (Alle / Ungelesen / Entscheidungen / Spiele / Transfers / Verein), jede
// einzelne Kategorie über die Auswahlliste „Kategorie“. In der Liste steht die
// Kategorie nur noch als ruhige Textspalte.
// =============================================================================
import type { ReactNode } from 'react';
import { CATEGORY_META, pendingDecisions } from '../../engine/messages';
import type { InboxMessage, MessageCategory } from '../../types';
import Seg from '../../ui/Seg';
import Select from '../../ui/Select';

export type InboxFilter = 'all' | 'unread' | 'decision' | 'games' | 'transfers' | 'club' | `cat:${MessageCategory}`;

const GROUPS: Record<'games' | 'transfers' | 'club', MessageCategory[]> = {
  games: ['match', 'cup'],
  transfers: ['transfer', 'contract'],
  club: ['board', 'media', 'general', 'milestone', 'training', 'injury'],
};

/** Verlangt die Nachricht noch eine Entscheidung? */
export function needsDecision(m: InboxMessage): boolean {
  return !!(m.choices?.length && m.eventRef && !m.eventRef.resolved);
}

export function matchesFilter(m: InboxMessage, f: InboxFilter): boolean {
  if (f === 'all') return true;
  if (f === 'unread') return !m.read;
  if (f === 'decision') return needsDecision(m);
  if (f.startsWith('cat:')) return m.category === f.slice(4);
  return GROUPS[f as keyof typeof GROUPS].includes(m.category);
}

const n = (x: number) => <span className="b3-n">{x}</span>;

/** Segmente + Kategorie-Auswahl. `compact` lässt „Verein“ weg (schmale Box). */
export function InboxFilterBar({ msgs, value, onChange, compact }: {
  msgs: InboxMessage[]; value: InboxFilter; onChange: (f: InboxFilter) => void; compact?: boolean;
}) {
  const count = (f: InboxFilter) => msgs.filter((m) => matchesFilter(m, f)).length;
  const decisions = pendingDecisions(msgs).length;
  const segs: { v: InboxFilter; label: ReactNode; title?: string }[] = [
    { v: 'all', label: <>Alle {n(msgs.length)}</> },
    { v: 'unread', label: <>Ungelesen {n(count('unread'))}</> },
    { v: 'decision', label: <>Entscheidungen {n(decisions)}</>, title: 'Nachrichten, die eine Entscheidung von dir verlangen' },
    { v: 'games', label: <>Spiele {n(count('games'))}</>, title: 'Spiele und Pokal' },
    { v: 'transfers', label: <>Transfers {n(count('transfers'))}</>, title: 'Transfers und Verträge' },
  ];
  if (!compact) segs.push({ v: 'club', label: <>Verein {n(count('club'))}</>, title: 'Vorstand, Presse, Training, Medizin, Allgemeines' });
  const cats = (Object.keys(CATEGORY_META) as MessageCategory[]).filter((c) => msgs.some((m) => m.category === c));
  const catValue = value.startsWith('cat:') ? value : '';
  return (
    <div className="inbox-filter">
      <Seg<InboxFilter> value={value} onChange={onChange} options={segs} maxSeg={8} aria-label="Nachrichten filtern" />
      <Select
        className="inbox-cat"
        width={210}
        value={catValue || '-'}
        placeholder="Kategorie …"
        aria-label="Nach Kategorie filtern"
        onChange={(v) => onChange((v || 'all') as InboxFilter)}
        options={[
          { value: '', label: 'Alle Kategorien' },
          ...cats.map((c, i) => ({
            value: `cat:${c}`, divider: i === 0,
            label: <>{CATEGORY_META[c].label} {n(msgs.filter((m) => m.category === c).length)}</>,
            text: CATEGORY_META[c].label,
          })),
        ]}
      />
    </div>
  );
}
