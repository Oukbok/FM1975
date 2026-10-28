// =============================================================================
// STADION-BLÖCKE im Spielablauf (eigener Verein)
// -----------------------------------------------------------------------------
// • Einführung: aus Kapazität, Stufe und Logen werden einmalig vier Blöcke.
//   Läuft noch ein altes Ausbauprojekt, warten wir dessen Ende ab.
// • Umbau eines Blocks als Bauprojekt: bar oder per Kredit (Bank prüft die
//   Raten), während des Baus ist die Hälfte des Blocks gesperrt.
// • Fertigstellung (täglich geprüft): Kapazität, Logen, Stufe, Stimmung.
// Rechenlogik: engine/stadiumBlocks.ts. KI-Vereine behalten das einfache
// Kapazitätsmodell (engine/clubEconomy.ts) – Spielstände bleiben klein.
// =============================================================================
import { annuity, loanInterest, makeLoan, monthlyLoanCost } from '../engine/clubBusiness';
import { economyScale, formatMoney, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  BLOCK_NAME, addMonths, blockCapacity, blocksCapacity, derivedLevel, migrateBlocks, planBlock, priceMix, vipAreaBoxes,
} from '../engine/stadiumBlocks';
import { BlockId, StadiumBlock } from '../types';
import { ensureEnvironment } from './environmentGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Blöcke für den eigenen Verein anlegen (idempotent). */
export function ensureStadiumBlocks(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (!club || club.stadium.blocks?.length || club.stadiumProject) return;
  const year = yearOf(g.calendar.currentDate);
  const blocks = migrateBlocks(club, year);
  club.stadium.blocks = blocks;
  club.stadium.capacity = blocksCapacity(blocks);
  club.stadium.priceBase = priceMix(blocks);
  club.stadium.vipBoxes = blocks.reduce((s, b) => s + b.lounges, 0);
}

export function blockOf(g: Game, id: BlockId): StadiumBlock | undefined {
  return g.clubs[g.managedClubId]?.stadium.blocks?.find((b) => b.id === id);
}

/** Kosten nominal (gebucht). */
export function nominalCost(costBase: number, year: number): number {
  return Math.round((costBase * economyScale(year)) / 10000) * 10000;
}

export function blockPlanFor(g: Game, target: StadiumBlock) {
  const club = g.clubs[g.managedClubId];
  const cur = blockOf(g, target.id)!;
  const year = yearOf(g.calendar.currentDate);
  const env = ensureEnvironment(g);
  const plan = planBlock(cur, target, year, club.stadium.capacity, env.tradition);
  const cost = nominalCost(plan.costBase, year);
  const rate = loanInterest(year, club.finances.balance < 0);
  return { plan, cost, rate, monthly: (years: number) => annuity(cost, rate, years * 12) };
}

/** Umbau starten. */
export function startBlockBuild(g: Game, target: StadiumBlock, financing: 'cash' | 'loan', years: number): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  if (club.stadium.blockProject || club.stadiumProject) return { ok: false, text: 'Es läuft bereits ein Umbau im Stadion.' };
  const cur = blockOf(g, target.id);
  if (!cur) return { ok: false, text: 'Block nicht gefunden.' };
  const { plan, cost } = blockPlanFor(g, target);
  if (!plan.ok) return { ok: false, text: plan.errors[0] };
  if (financing === 'cash') {
    if (club.finances.balance < cost) return { ok: false, text: 'Der Kontostand reicht für eine Barzahlung nicht.' };
    book(club.finances, today, -cost, 'facilities', `Umbau ${BLOCK_NAME[target.id]} (bar)`, true);
  } else {
    const rev = Math.max(1, (club.finances.seasonHistory ?? []).slice(-1)[0]?.revenue ?? 0);
    const loan = makeLoan(cost, years, year, today, `Umbau ${BLOCK_NAME[target.id]}`, club.finances.balance < 0);
    if (rev > 1 && (monthlyLoanCost(club) + loan.monthlyRate) * 12 > 0.12 * rev) {
      return { ok: false, text: 'Die Bank lehnt ab: Die Kreditraten wären zu hoch für den Umsatz des Vereins.' };
    }
    (club.loans ??= []).push(loan);
  }
  const loss = Math.round(blockCapacity(cur) * 0.5 / 100) * 100;
  club.stadium.capacity = Math.max(1000, club.stadium.capacity - loss);
  club.stadium.blockProject = {
    blockId: target.id, target: JSON.parse(JSON.stringify(target)), startDate: today,
    finishDate: addMonths(today, plan.months), cost, financing, capacityLoss: loss,
  };
  const fin = club.stadium.blockProject.finishDate;
  const text = `Baubeginn ${BLOCK_NAME[target.id]}: fertig zum ${fin.slice(8, 10)}.${fin.slice(5, 7)}.${fin.slice(0, 4)}.`;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Bauleitung', subject: `Umbau ${BLOCK_NAME[target.id]} beginnt`,
    shortText: text,
    bodyText: `${text}\n\nKosten: ${formatMoney(cost, year)} (${financing === 'loan' ? `Kredit über ${years} Jahre` : 'bar bezahlt'}).\nWährend der Bauzeit sind ${loss.toLocaleString('de-DE')} Plätze gesperrt.${plan.notes.length ? '\n\n' + plan.notes.join('\n') : ''}`,
  }));
  return { ok: true, text };
}

/** Täglich (billig, nur eigener Verein): Umbau fertigstellen bzw. Blöcke anlegen. */
export function stadiumDaily(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const p = club.stadium.blockProject;
  if (p && today >= p.finishDate && club.stadium.blocks) {
    const cur = club.stadium.blocks.find((b) => b.id === p.blockId)!;
    const env = ensureEnvironment(g);
    const plan = planBlock(cur, p.target, yearOf(p.startDate), club.stadium.capacity + p.capacityLoss, env.tradition);
    club.stadium.blocks = club.stadium.blocks.map((b) => (b.id === p.blockId ? p.target : b));
    club.stadium.capacity = blocksCapacity(club.stadium.blocks);
    club.stadium.vipBoxes = club.stadium.blocks.reduce((s, b) => s + b.lounges, 0);
    club.stadium.condition = Math.max(club.stadium.condition, 95);
    club.infrastructure.stadium = derivedLevel(club.stadium.blocks);
    club.stadium.blockProject = undefined;
    env.fanMood = clamp(env.fanMood + plan.mood, 0, 100);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Bauleitung', subject: `${BLOCK_NAME[p.blockId]} fertig`,
      shortText: `Das Stadion fasst jetzt ${club.stadium.capacity.toLocaleString('de-DE')} Zuschauer.`,
      bodyText: `Der Umbau der ${BLOCK_NAME[p.blockId]} ist abgeschlossen. Kapazität: ${club.stadium.capacity.toLocaleString('de-DE')} Plätze, Logen: ${club.stadium.vipBoxes}.${plan.mood ? `\n\nDie Fans reagieren ${plan.mood > 0 ? 'erfreut' : 'verstimmt'} (${plan.mood > 0 ? '+' : ''}${plan.mood} Stimmung).` : ''}`,
    }));
  }
  // Altes Ausbauprojekt (vor den Blöcken) ist inzwischen fertig → Blöcke anlegen.
  if (!club.stadium.blocks?.length && !club.stadiumProject) ensureStadiumBlocks(g);
  // Kapazität wurde außerhalb der Blöcke verändert (Autopilot/Simulation, altes Projekt):
  // Blöcke neu ableiten, Ticketfaktor bleibt erhalten.
  const bl = club.stadium.blocks;
  if (bl?.length && !club.stadium.blockProject && !club.stadiumProject) {
    const sum = blocksCapacity(bl);
    if (Math.abs(club.stadium.capacity - sum) / sum > 0.03) {
      const factor = club.stadium.priceBase ? priceMix(bl) / club.stadium.priceBase : 1;
      club.stadium.vipBoxes = (club.stadium.vipBoxes ?? 0) + vipAreaBoxes(club); // VIP-Bereiche nicht verlieren
      club.stadium.blocks = undefined;
      ensureStadiumBlocks(g);
      const nb = club.stadium.blocks as StadiumBlock[] | undefined;
      if (nb) club.stadium.priceBase = priceMix(nb) / factor;
    }
  }
}
