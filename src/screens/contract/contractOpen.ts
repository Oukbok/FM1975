// Öffnet den Verhandlungstisch (screens/contract/ContractScreen.tsx) von überall:
// Spielerprofil (Aktionsleiste, Reiter Vertrag), Rechtsklick-Menü, Nachrichten,
// Kader › Verträge, Transfermarkt/Spielerpool/Verhandlungen (Transfer) und die
// Mitarbeiter-Seiten. Die Spiel-Shell (shell/GameShell.tsx) hört auf das Ereignis,
// hält die Zeit an und zeigt den Bildschirm.
export type ContractOpenReq =
  | { kind: 'renew'; pid: string }
  | { kind: 'transfer'; talkId: string }
  /** Mitarbeiter: Person vom Arbeitsmarkt für eine Stelle (`role`) oder ein eigener Mitarbeiter (Verlängerung). */
  | { kind: 'staff'; id: string; role?: string; replaceId?: string };

export const CONTRACT_SCREEN_EVENT = 'fm:contract-screen';

export function openContractScreen(req: ContractOpenReq): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ContractOpenReq>(CONTRACT_SCREEN_EVENT, { detail: req }));
}
