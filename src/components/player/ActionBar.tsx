// Aktionsleiste unten im Spielerprofil (Vorbild EA Fussball Manager): runde Symbolknöpfe mit
// Tooltip. Nur Aktionen, die es im Spiel gibt – Bericht, Spielergespräch (views/kader/talk/),
// Vertrag verlängern, Transferliste (eigener Kader), Transferverhandlung (fremde Spieler),
// Vereinsprofil. Nicht passende Knöpfe bleiben sichtbar, aber gesperrt (Tooltip sagt warum).
import { useState } from 'react';
import type { Player } from '../../types';
import { useClubProfile } from '../club/ClubLink';
import { startTalk } from '../../game/transferTalks';
import { PlayerTalkModal } from '../../views/kader/talk/PlayerTalkModal';
import { TransferTalkModal } from '../../views/transfers/TransferTalkModal';
import Icon from '../Icon';
import type { IconName } from '../iconPaths';

interface Act { key: string; icon: IconName; tip: string; run?: () => void; on?: boolean; group: number }

export default function ActionBar({ p, onTab, onChange }: { p: Player; onTab: (t: 'report' | 'contract') => void; onChange: () => void }) {
  const api = useClubProfile();
  const g = api?.game;
  const [talk, setTalk] = useState(false);
  const [deal, setDeal] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  if (!g) return null;
  const mine = p.clubId === g.managedClubId;
  const own = mine && !p.isYouth && !!g.players[p.id];
  const foreign = !mine && !p.isYouth && !!g.players[p.id];
  const changed = () => { api?.onChange?.(); onChange(); };
  const onlyOwn = 'Nur für Spieler deines Kaders';

  const acts: Act[] = [
    { key: 'report', icon: 'watchlist', tip: 'Scoutbericht', run: () => onTab('report'), group: 0 },
    { key: 'talk', icon: 'talk', tip: own ? 'Spielergespräch' : `Spielergespräch – ${onlyOwn.toLowerCase()}`, run: own ? () => setTalk(true) : undefined, group: 1 },
    { key: 'contract', icon: 'contracts', tip: own ? 'Vertrag verlängern' : `Vertrag verlängern – ${onlyOwn.toLowerCase()}`, run: own ? () => onTab('contract') : undefined, group: 1 },
    {
      key: 'list', icon: 'transfers', on: own && p.transferListed,
      tip: own ? (p.transferListed ? 'Von der Transferliste nehmen' : 'Auf die Transferliste setzen') : `Transferliste – ${onlyOwn.toLowerCase()}`,
      run: own ? () => { p.transferListed = !p.transferListed; changed(); } : undefined, group: 1,
    },
    {
      key: 'deal', icon: 'negotiations', tip: foreign ? 'Transferverhandlung starten' : 'Transferverhandlung – nur für Spieler anderer Vereine',
      run: foreign ? () => {
        const r = startTalk(g, p.id);
        if (typeof r === 'string') { setNote(r); return; }
        setNote(null); setDeal(r.id); changed();
      } : undefined, group: 2,
    },
    {
      key: 'club', icon: 'shield', tip: 'Vereinsprofil',
      run: api?.canOpen(p.clubId) ? () => api.open(p.clubId) : undefined, group: 2,
    },
  ];
  const dealTalk = deal ? (g.transferTalks ?? []).find((t) => t.id === deal) : undefined;

  return (
    <div className="pp3-actbar">
      {acts.map((a, i) => (
        <span key={a.key} className={`pp3-actwrap${i > 0 && acts[i - 1].group !== a.group ? ' gap' : ''}`}>
          <button type="button" className={`pp2-round pp3-act${a.on ? ' on' : ''}`} disabled={!a.run} onClick={a.run} aria-label={a.tip}>
            <Icon name={a.icon} size={20} />
          </button>
          <span className="pp3-acttip" role="tooltip">{a.tip}</span>
        </span>
      ))}
      {note && <span className="pp3-actnote">{note}</span>}
      {talk && <PlayerTalkModal g={g} pid={p.id} onClose={() => { setTalk(false); changed(); }} onChange={changed} />}
      {dealTalk && <TransferTalkModal g={g} talk={dealTalk} onClose={() => { setDeal(null); changed(); }} onChange={changed} />}
    </div>
  );
}
