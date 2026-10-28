// =============================================================================
// FOOTBALL MANAGER 1980 — Transfer-Engine (vereinfacht)
// =============================================================================

import { recordTransfer } from './history';
import { Player, Club, TransferOffer } from '../types';
import { bookTransfer } from './finances';
import { economyScale, formatMoney, yearOf } from './economy';

/** Ablöse (1975-Basis) als nominaler Betrag zum Transferdatum – für die Transferhistorie. */
const nominalFee = (base: number) => Math.round(base * economyScale(yearOf(transferDate)));

/** Aktuelles Spieldatum für Transfer-Buchungen (von App.tsx gesetzt). */
let transferDate = new Date().toISOString().slice(0, 10);
export function setTransferDate(date: string): void { transferDate = date; }

/** Alle transfergelisteten Spieler der Liga (außer eigener Verein). */
export function getAvailablePlayers(
  players: Record<string, Player>,
  managedClubId: string,
): Player[] {
  return Object.values(players)
    .filter((p) => p.clubId !== managedClubId && (p.transferListed || p.contract.satisfaction < 60))
    .sort((a, b) => b.overall - a.overall);
}

/**
 * Angebot für einen Spieler abgeben. Gibt zurück, ob der Deal akzeptiert wurde.
 * Vereinfacht: Angebot >= Marktwert -> akzeptiert (mit etwas Zufall).
 */
export function makeOffer(
  buyingClub: Club,
  player: Player,
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  amount: number,
  wage: number,
): { accepted: boolean; message: string; offer: TransferOffer } {
  const sellingClub = clubs[player.clubId];
  const value = player.contract.transferValue;
  const clubAccepts = amount >= value * (0.9 + Math.random() * 0.3);
  const playerAccepts = wage >= player.contract.weeklyWage * (0.95 + Math.random() * 0.2);
  const affordable = buyingClub.finances.transferBudget >= amount;
  // Lizenzauflage / Finanzielles Fairplay: Transfersperre für die laufende Saison.
  const y = Number(transferDate.slice(0, 4));
  const season = Number(transferDate.slice(5, 7)) >= 7 ? `${y}/${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}/${String(y % 100).padStart(2, '0')}`;
  if (buyingClub.finances.ffp?.banSeason === season) {
    const offer: TransferOffer = {
      id: `off_${Date.now()}`, playerId: player.id, sellingClubId: player.clubId, buyingClubId: buyingClub.id,
      fee: amount, proposedWage: wage, contractLength: 3, status: 'rejected', date: transferDate, initiatedByPlayer: true, expiryDate: transferDate,
    };
    return { accepted: false, message: `Transfersperre: ${buyingClub.finances.ffp.note ?? 'Lizenzauflage'}.`, offer };
  }

  const accepted = clubAccepts && playerAccepts && affordable;
  let message: string;
  if (!affordable) message = 'Dein Transferbudget reicht nicht aus.';
  else if (!clubAccepts) message = `${sellingClub?.name ?? 'Der Verein'} lehnt das Angebot ab (zu niedrig).`;
  else if (!playerAccepts) message = `${player.fullName} ist mit dem Gehalt nicht einverstanden.`;
  else message = `Transfer abgeschlossen: ${player.fullName} wechselt für ${formatMoney(nominalFee(amount), yearOf(transferDate), true)}!`;

  const offer: TransferOffer = {
    id: `off_${Date.now()}`, playerId: player.id,
    sellingClubId: player.clubId, buyingClubId: buyingClub.id,
    fee: amount, proposedWage: wage, contractLength: 3,
    status: accepted ? 'completed' : 'rejected',
    date: new Date().toISOString().slice(0, 10), initiatedByPlayer: true,
    expiryDate: new Date().toISOString().slice(0, 10),
  };

  if (accepted) {
    // Spieler transferieren
    if (sellingClub) sellingClub.playerIds = sellingClub.playerIds.filter((id) => id !== player.id);
    buyingClub.playerIds.push(player.id);
    recordTransfer(player, sellingClub?.name ?? 'vereinslos', buyingClub.name, nominalFee(amount), transferDate);
    player.clubId = buyingClub.id;
    player.transferListed = false;
    player.contract.weeklyWage = wage;
    player.contract.satisfaction = 80;
    buyingClub.finances.transferBudget -= amount;
    bookTransfer(buyingClub, amount, true, player.fullName, transferDate, buyingClub.isPlayerControlled);
    if (sellingClub) {
      sellingClub.finances.transferBudget += amount;
      bookTransfer(sellingClub, amount, false, player.fullName, transferDate, sellingClub.isPlayerControlled);
    }
  }

  return { accepted, message, offer };
}

/** KI-Transfers: gelegentlich tauschen KI-Vereine gelistete Spieler untereinander. */
export function runAITransfers(
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  managedClubId: string,
): string[] {
  const news: string[] = [];
  const listed = Object.values(players).filter((p) => p.transferListed && p.clubId !== managedClubId);
  const aiClubs = Object.values(clubs).filter((c) => c.id !== managedClubId);

  for (const player of listed) {
    if (Math.random() > 0.15) continue; // nur ~15% pro Durchlauf
    const buyer = aiClubs[Math.floor(Math.random() * aiClubs.length)];
    if (!buyer || buyer.id === player.clubId) continue;
    if (buyer.finances.transferBudget < player.contract.transferValue) continue;

    const seller = clubs[player.clubId];
    if (seller) seller.playerIds = seller.playerIds.filter((id) => id !== player.id);
    buyer.playerIds.push(player.id);
    const fee = player.contract.transferValue;
    buyer.finances.transferBudget -= fee;
    bookTransfer(buyer, fee, true, player.fullName, transferDate, buyer.isPlayerControlled);
    if (seller) {
      seller.finances.transferBudget += fee;
      bookTransfer(seller, fee, false, player.fullName, transferDate, seller.isPlayerControlled);
    }
    recordTransfer(player, seller?.name ?? 'vereinslos', buyer.name, nominalFee(fee), transferDate);
    player.clubId = buyer.id;
    player.transferListed = false;
    news.push(`${player.fullName} wechselt zu ${buyer.name} (${formatMoney(nominalFee(fee), yearOf(transferDate), true)}).`);
  }
  return news;
}

