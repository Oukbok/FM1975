// =============================================================================
// STADION-BLÖCKE im Spielablauf (eigener Verein)
// -----------------------------------------------------------------------------
// • Einführung: aus Kapazität, Stufe und Logen werden einmalig 14 Blöcke
//   (ältere Spielstände mit vier Blöcken werden umgewandelt).
// • Ein Umbau kann mehrere Blöcke einer Seite zugleich umfassen.
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
  BLOCK_NAME, BLOCK_SIDE, BlockPlan, MAX_CAPACITY, addMonths, blockCapacity, blocksCapacity, convertLegacyBlocks, derivedLevel, migrateBlocks, planBlock, priceMix, vipAreaBoxes,
} from '../engine/stadiumBlocks';
import { BlockId, StadiumBlock } from '../types';
import { ensureEnvironment } from './environmentGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Blöcke für den eigenen Verein anlegen (idempotent). */
export function ensureStadiumBlocks(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (club) convertLegacyBlocks(club);
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
  return groupPlanFor(g, [target]);
}

/** Planung für einen oder mehrere Blöcke (gleichzeitiger Umbau). */
export function groupPlanFor(g: Game, targets: StadiumBlock[]) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const env = ensureEnvironment(g);
  const parts = targets.map((t) => ({ t, p: planBlock(blockOf(g, t.id)!, t, year, club.stadium.capacity, env.tradition) }));
  const live = parts.filter((x) => x.p.changed);
  const multi = live.length > 1;
  const errors = new Set<string>(), notes = new Set<string>();
  for (const { p } of live) { p.errors.forEach((e) => errors.add(e)); p.notes.forEach((n) => notes.add(n)); }
  if (!live.length) errors.add('Es ist nichts geändert.');
  const addCapacity = live.reduce((s2, x) => s2 + x.p.addCapacity, 0);
  if (club.stadium.capacity + addCapacity > MAX_CAPACITY) errors.add(`Mehr als ${MAX_CAPACITY.toLocaleString('de-DE')} Plätze genehmigt die Stadt nicht.`);
  const plan: BlockPlan = {
    ok: !errors.size, errors: [...errors], notes: [...notes], changed: live.length > 0, addCapacity,
    costBase: live.reduce((s2, x) => s2 + x.p.costBase, 0) * (multi ? 0.95 : 1),
    months: live.length ? Math.min(24, Math.max(...live.map((x) => x.p.months)) + (live.length - 1)) : 0,
    mood: Math.round(live.reduce((s2, x) => s2 + x.p.mood, 0) * 10) / 10,
  };
  const cost = nominalCost(plan.costBase, year);
  const rate = loanInterest(year, club.finances.balance < 0);
  return { plan, cost, rate, monthly: (years: number) => annuity(cost, rate, years * 12), targets: live.map((x) => x.t) };
}

/** Umbau starten (ein Block oder mehrere Blöcke einer Seite). */
export function startBlockBuild(g: Game, target: StadiumBlock | StadiumBlock[], financing: 'cash' | 'loan', years: number): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  if (club.stadium.blockProject || club.stadiumProject) return { ok: false, text: 'Es läuft bereits ein Umbau im Stadion.' };
  const all = Array.isArray(target) ? target : [target];
  if (all.some((t) => !blockOf(g, t.id))) return { ok: false, text: 'Block nicht gefunden.' };
  const { plan, cost, targets } = groupPlanFor(g, all);
  if (!plan.ok) return { ok: false, text: plan.errors[0] };
  const name = targets.length > 1 ? `${BLOCK_NAME[targets[0].id]} und ${targets.length - 1} weitere${targets.length > 2 ? '' : 'r'} Block${targets.length > 2 ? 's' : ''}` : BLOCK_NAME[targets[0].id];
  if (financing === 'cash') {
    if (club.finances.balance < cost) return { ok: false, text: 'Der Kontostand reicht für eine Barzahlung nicht.' };
    book(club.finances, today, -cost, 'facilities', `Umbau ${name} (bar)`, true);
  } else {
    const rev = Math.max(1, (club.finances.seasonHistory ?? []).slice(-1)[0]?.revenue ?? 0);
    const loan = makeLoan(cost, years, year, today, `Umbau ${name}`, club.finances.balance < 0);
    if (rev > 1 && (monthlyLoanCost(club) + loan.monthlyRate) * 12 > 0.12 * rev) {
      return { ok: false, text: 'Die Bank lehnt ab: Die Kreditraten wären zu hoch für den Umsatz des Vereins.' };
    }
    (club.loans ??= []).push(loan);
  }
  const loss = Math.round(targets.reduce((s2, t) => s2 + blockCapacity(blockOf(g, t.id)!), 0) * 0.5 / 100) * 100;
  club.stadium.capacity = Math.max(1000, club.stadium.capacity - loss);
  const [first, ...rest] = targets.map((t) => JSON.parse(JSON.stringify(t)) as StadiumBlock);
  club.stadium.blockProject = {
    blockId: first.id, target: first, more: rest.length ? rest : undefined, startDate: today,
    finishDate: addMonths(today, plan.months), cost, financing, capacityLoss: loss,
  };
  const fin = club.stadium.blockProject.finishDate;
  const text = `Baubeginn ${name}: fertig zum ${fin.slice(8, 10)}.${fin.slice(5, 7)}.${fin.slice(0, 4)}.`;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Bauleitung', subject: `Umbau ${name} beginnt`,
    shortText: text,
    bodyText: `${text}\n\nKosten: ${formatMoney(cost, year)} (${financing === 'loan' ? `Kredit über ${years} Jahre` : 'bar bezahlt'}).\nWährend der Bauzeit sind ${loss.toLocaleString('de-DE')} Plätze gesperrt.${plan.notes.length ? '\n\n' + plan.notes.join('\n') : ''}`,
  }));
  return { ok: true, text };
}

/** Ziele eines Umbaus: nur der Block oder die ganze Seite (Ränge und Dach wie geplant, übrige Ausstattung bleibt). */
export function sideTargets(blocks: StadiumBlock[], draft: StadiumBlock, whole: boolean): StadiumBlock[] {
  if (!whole) return [draft];
  return blocks.filter((b) => BLOCK_SIDE[b.id] === BLOCK_SIDE[draft.id]).map((b) => (b.id === draft.id ? draft
    : { ...JSON.parse(JSON.stringify(b)), tiers: JSON.parse(JSON.stringify(draft.tiers)), roof: draft.roof }));
}

/** Name eines laufenden Umbaus. */
export function projectName(p: { blockId: BlockId; more?: StadiumBlock[] }): string {
  const n = 1 + (p.more?.length ?? 0);
  return n > 1 ? `${BLOCK_NAME[p.blockId]} + ${n - 1}` : BLOCK_NAME[p.blockId];
}

/** Täglich (billig, nur eigener Verein): Umbau fertigstellen bzw. Blöcke anlegen. */
export function stadiumDaily(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  convertLegacyBlocks(club);
  const p = club.stadium.blockProject;
  if (p && today >= p.finishDate && club.stadium.blocks) {
    const env = ensureEnvironment(g);
    const targets = [p.target, ...(p.more ?? [])];
    const mood = targets.reduce((s2, t) => {
      const cur = club.stadium.blocks!.find((b) => b.id === t.id)!;
      return s2 + planBlock(cur, t, yearOf(p.startDate), club.stadium.capacity + p.capacityLoss, env.tradition).mood;
    }, 0);
    const plan = { mood: Math.round(mood * 10) / 10 };
    club.stadium.blocks = club.stadium.blocks.map((b) => targets.find((t) => t.id === b.id) ?? b);
    club.stadium.capacity = blocksCapacity(club.stadium.blocks);
    club.stadium.vipBoxes = club.stadium.blocks.reduce((s, b) => s + b.lounges, 0);
    club.stadium.condition = Math.max(club.stadium.condition, 95);
    club.infrastructure.stadium = derivedLevel(club.stadium.blocks);
    club.stadium.blockProject = undefined;
    env.fanMood = clamp(env.fanMood + plan.mood, 0, 100);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Bauleitung', subject: `${projectName(p)} fertig`,
      shortText: `Das Stadion fasst jetzt ${club.stadium.capacity.toLocaleString('de-DE')} Zuschauer.`,
      bodyText: `Der Umbau (${targets.map((t) => BLOCK_NAME[t.id]).join(', ')}) ist abgeschlossen. Kapazität: ${club.stadium.capacity.toLocaleString('de-DE')} Plätze, Logen: ${club.stadium.vipBoxes}.${plan.mood ? `\n\nDie Fans reagieren ${plan.mood > 0 ? 'erfreut' : 'verstimmt'} (${plan.mood > 0 ? '+' : ''}${plan.mood} Stimmung).` : ''}`,
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
