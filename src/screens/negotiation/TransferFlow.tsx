// =============================================================================
// VERHANDLUNGSTISCH — ein Transfer von Anfang bis Ende an einem Tisch:
//   1. Verein (Ablöse) → 2. Spieler (Vertrag) → 3. Abschluss.
// Vorverträge (ablösefrei nach Bosman) beginnen beim Spieler. Jeder Schritt endet
// mit einem klaren Ergebnis; nach der Einigung mit dem Verein geht es per Knopf
// zum Spielergespräch weiter.
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import type { TransferTalk } from '../../game/transferTalks';
import { ClubTalk } from './ClubTalk';
import type { NegStep } from './NegFrame';
import { PlayerTalk } from './PlayerTalk';

export function TransferFlow({ g, talkId, onClose, onChange }: { g: Game; talkId: string; onClose: () => void; onChange: () => void }) {
  const t: TransferTalk | undefined = (g.transferTalks ?? []).find((x) => x.id === talkId);
  // Beim Öffnen im Vereinsgespräch: die Einigung dort erst zeigen, dann per Knopf weiter.
  const [atClub, setAtClub] = useState(() => t?.phase === 'club');
  if (!t) return <PlayerTalk g={g} req={{ kind: 'transfer', talkId }} onClose={onClose} onChange={onChange} />;
  const clubFailed = t.phase === 'failed' && !t.pkg && !t.freeAgent;
  const showClub = !t.freeAgent && (t.phase === 'club' || clubFailed || (atClub && t.phase === 'player'));
  const done = t.phase === 'agreed' || t.phase === 'done';
  const steps: NegStep[] = [
    ...(t.freeAgent ? [] : [{ label: 'Verein', state: clubFailed ? 'fail' : t.phase === 'club' ? 'now' : 'done' } as NegStep]),
    { label: 'Spieler', state: t.phase === 'club' || clubFailed ? 'todo' : t.phase === 'failed' ? 'fail' : done ? 'done' : showClub ? 'todo' : 'now' },
    { label: 'Abschluss', state: done ? 'done' : 'todo' },
  ];
  if (showClub) return <ClubTalk g={g} talk={t} onClose={onClose} onChange={onChange} onNext={() => setAtClub(false)} steps={steps} />;
  return <PlayerTalk g={g} req={{ kind: 'transfer', talkId }} onClose={onClose} onChange={onChange} steps={steps} />;
}
