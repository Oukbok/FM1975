// =============================================================================
// Libero ausgestorben (Wunsch Pascal: im Spielstand 2035 gab es noch Liberos)
// -----------------------------------------------------------------------------
// Neue Liberos entstehen ab 1996 nicht mehr (data/formations.ts `eraPosition`). Ab der Saison
// 2000/01 (`LIBERO_END`) räumt `retireLibero` zum Saisonwechsel und beim Laden auf:
//  - Alle Vereine (auch der eigene, dessen System sonst seit 1975 stehen bleiben kann; Pokal-Amateure,
//    Europapokal-Gegner) wechseln vom Libero-System auf das Nachfolgesystem mit gleich vielen
//    Verteidigern (`LIBERO_SUCCESSOR`). Wer will, stellt in der Aufstellung wieder Libero ein.
//  - Spieler mit Stammposition Libero werden Innenverteidiger; Libero bleibt Nebenposition,
//    die Vertrautheit als IV erbt den Libero-Wert. Positionstraining „Libero“ entfällt (außer beim eigenen Verein).
// =============================================================================
import { LIBERO_SUCCESSOR, getFormation, liberoOut } from '../data/formations';
import { refreshOverall } from '../engine/development';
import { autoFillLineup } from '../engine/lineupAI';
import type { Club, Player } from '../types';
import type { Game } from './state';

export function retireLibero(g: Game, year: number): void {
  if (!liberoOut(year)) return;
  const pending: Club[] = [];
  for (const c of Object.values(g.clubs)) {
    const f = c.tactics?.formation;
    if (!f || !getFormation(f).libero) continue;
    c.tactics.formation = LIBERO_SUCCESSOR[f] ?? '4-4-2';
    c.tactics.slotLayout = undefined; // eigene Slot-Lagen gehörten zum alten System
    pending.push(c);
  }
  const fix = (p: Player) => {
    if (p.positionSkill?.train === 'LIB' && p.clubId !== g.managedClubId) delete p.positionSkill.train;
    if (p.naturalPosition !== 'LIB') return;
    p.naturalPosition = 'IV';
    p.secondaryPositions = [...new Set([...(p.secondaryPositions ?? []).filter((x) => x !== 'IV'), 'LIB' as const])];
    const v = p.positionSkill?.v;
    if (v) v.IV = Math.max(v.IV ?? 0, v.LIB ?? 0);
    refreshOverall(p);
  };
  for (const p of Object.values(g.players)) fix(p);
  for (const p of Object.values(g.youthPlayers ?? {})) fix(p);
  // Elf und Bank im neuen System neu besetzen (nach der Umstellung der Spieler).
  for (const c of pending) c.tactics = autoFillLineup(c, g.players, c.tactics);
}
