// =============================================================================
// VERHANDLUNGSTISCH — Einstieg (Wunsch Pascal: alle Verhandlungen an einem Tisch,
// übersichtlich, mit klarem Abschluss). Vollbild über allem, die Zeit steht
// (shell/GameShell.tsx). Je nach Anlass:
//   • Vertragsverlängerung eines Spielers      → negotiation/PlayerTalk
//   • Transfer (Verein → Spieler → Abschluss)  → negotiation/TransferFlow
//   • Mitarbeiter einstellen bzw. verlängern   → negotiation/StaffTalk
//   • Leihe (Spieler ausleihen)                → negotiation/LoanTalk
//   • Sponsor-Angebot bzw. Namensrechte         → negotiation/SponsorTalk
// Geöffnet wird von überall über `openContractScreen` (contractOpen.ts).
// =============================================================================
import type { Game } from '../../game/state';
import { LoanTalk } from '../negotiation/LoanTalk';
import { PlayerTalk } from '../negotiation/PlayerTalk';
import { SponsorTalk } from '../negotiation/SponsorTalk';
import { StaffTalk } from '../negotiation/StaffTalk';
import { TransferFlow } from '../negotiation/TransferFlow';
import type { ContractOpenReq } from './contractOpen';

export function ContractScreen({ g, req, onClose, onChange }: { g: Game; req: ContractOpenReq; onClose: () => void; onChange: () => void }) {
  if (req.kind === 'sponsor') return <SponsorTalk g={g} req={req} onClose={onClose} onChange={onChange} />;
  if (req.kind === 'staff') return <StaffTalk g={g} req={req} onClose={onClose} onChange={onChange} />;
  if (req.kind === 'loan') return <LoanTalk g={g} talkId={req.talkId} onClose={onClose} onChange={onChange} />;
  if (req.kind === 'transfer') return <TransferFlow g={g} talkId={req.talkId} onClose={onClose} onChange={onChange} />;
  return <PlayerTalk g={g} req={req} onClose={onClose} onChange={onChange} />;
}
