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
import { checkBudget, noteBudgetSpend } from './budgetPlan';
import { Game } from './state';
import { honourFx } from '../engine/honourEffects';
import {
  RebuildSpec, blockLook, initialBuilt, loungeLimit, neutralBuilt, planRebuild, stadiumComfort, stadiumLook,
} from '../engine/stadiumStandard';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Blöcke für den eigenen Verein anlegen (idempotent). */
export function ensureStadiumBlocks(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (club) convertLegacyBlocks(club);
  if (club?.stadium.blocks?.length) ensureStadiumAge(g);
  if (!club || club.stadium.blocks?.length || club.stadiumProject) return;
  const year = yearOf(g.calendar.currentDate);
  const blocks = migrateBlocks(club, year);
  club.stadium.blocks = blocks;
  club.stadium.capacity = blocksCapacity(blocks);
  club.stadium.priceBase = priceMix(blocks);
  club.stadium.vipBoxes = blocks.reduce((s, b) => s + b.lounges, 0);
  ensureStadiumAge(g);
}

/**
 * Baujahr des Stadions anlegen (idempotent): im ersten Jahrzehnt eines Spiels aus der Ausbaustufe,
 * in älteren Spielständen so, dass der Komfort den Ansprüchen der Fans gerade genügt – die
 * Einführung ändert die Zuschauerzahlen nicht.
 */
export function ensureStadiumAge(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (!club || club.stadium.built != null || !club.stadium.blocks?.length) return;
  const year = yearOf(g.calendar.currentDate);
  const start = (g as unknown as { startYear?: number }).startYear ?? 1975;
  const n = neutralBuilt(club, year);
  club.stadium.built = year - start <= 8 ? Math.max(initialBuilt(club, year), n) : n;
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
  const st = club.stadium;
  const parts = targets.map((t) => {
    const cur = blockOf(g, t.id)!;
    return { t, p: planBlock(cur, t, year, st.capacity, env.tradition, { built: st.built, lookChanged: blockLook(t, st) !== blockLook(cur, st), maxLounges: loungeLimit(t.id, st.built) }) };
  });
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
  const rate = Math.max(0.01, loanInterest(year, club.finances.balance < 0) - honourFx(club.id, 'interest')); // Solide Kasse
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
    const block = checkBudget(g, 'infra', cost); // Saisonbudget (game/budgetPlan.ts)
    if (block) return { ok: false, text: block };
    noteBudgetSpend(g, 'infra', cost);
    book(club.finances, today, -cost, 'facilities', `Umbau ${name} (bar)`, true);
  } else {
    const rev = Math.max(1, (club.finances.seasonHistory ?? []).slice(-1)[0]?.revenue ?? 0);
    const loan = makeLoan(cost, years, year, today, `Umbau ${name}`, club.finances.balance < 0, honourFx(club.id, 'interest'));
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
    : { ...JSON.parse(JSON.stringify(b)), tiers: JSON.parse(JSON.stringify(draft.tiers)), roof: draft.roof, look: draft.look }));
}

/** Name eines laufenden Umbaus. */
export function projectName(p: { blockId: BlockId; more?: StadiumBlock[] }): string {
  const n = 1 + (p.more?.length ?? 0);
  if ((p as { rebuild?: boolean }).rebuild) return 'Stadion-Neubau';
  return n > 1 ? `${BLOCK_NAME[p.blockId]} + ${n - 1}` : BLOCK_NAME[p.blockId];
}

// -----------------------------------------------------------------------------
// Neubau des ganzen Stadions (engine/stadiumStandard.ts)
// -----------------------------------------------------------------------------
export function rebuildPlanFor(g: Game, spec: RebuildSpec) {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const plan = planRebuild(club, spec, year);
  const cost = nominalCost(plan.costBase, year);
  const rate = Math.max(0.01, loanInterest(year, club.finances.balance < 0) - honourFx(club.id, 'interest'));
  return { plan, cost, rate, monthly: (years: number) => annuity(cost, rate, years * 12) };
}

/** Neubau beauftragen: gespielt wird während der Bauzeit im alten Stadion mit 60 % der Plätze. */
export function startRebuild(g: Game, spec: RebuildSpec, financing: 'cash' | 'loan', years: number): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const st = club.stadium;
  if (st.blockProject || club.stadiumProject) return { ok: false, text: 'Es läuft bereits ein Umbau im Stadion.' };
  if (!st.blocks?.length) return { ok: false, text: 'Das Stadion ist noch nicht in Blöcke eingeteilt.' };
  const { plan, cost } = rebuildPlanFor(g, spec);
  if (plan.errors.length) return { ok: false, text: plan.errors[0] };
  if (financing === 'cash') {
    if (club.finances.balance < cost) return { ok: false, text: 'Der Kontostand reicht für eine Barzahlung nicht.' };
    const block = checkBudget(g, 'infra', cost);
    if (block) return { ok: false, text: block };
    noteBudgetSpend(g, 'infra', cost);
    book(club.finances, today, -cost, 'facilities', 'Stadion-Neubau (bar)', true);
  } else {
    const rev = Math.max(1, (club.finances.seasonHistory ?? []).slice(-1)[0]?.revenue ?? 0);
    const loan = makeLoan(cost, years, year, today, 'Stadion-Neubau', club.finances.balance < 0, honourFx(club.id, 'interest'));
    // Ein Neubau ist das größte Vorhaben des Vereins: die Bank trägt bis zu 20 % des Umsatzes an Raten.
    if (rev > 1 && (monthlyLoanCost(club) + loan.monthlyRate) * 12 > 0.2 * rev) {
      return { ok: false, text: 'Die Bank lehnt ab: Die Kreditraten wären zu hoch für den Umsatz des Vereins.' };
    }
    (club.loans ??= []).push(loan);
  }
  const loss = Math.max(0, st.capacity - plan.capWhile);
  st.capacity = Math.max(1000, st.capacity - loss);
  const [first, ...rest] = plan.blocks;
  st.blockProject = { blockId: first.id, target: first, more: rest, startDate: today, finishDate: addMonths(today, plan.months), cost, financing, capacityLoss: loss, rebuild: true };
  const fin = st.blockProject.finishDate;
  const text = `Baubeginn Stadion-Neubau: fertig zum ${fin.slice(8, 10)}.${fin.slice(5, 7)}.${fin.slice(0, 4)}.`;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Bauleitung', subject: 'Der Stadion-Neubau beginnt',
    shortText: text,
    bodyText: `${text}\n\nKosten: ${formatMoney(cost, year)} (${financing === 'loan' ? `Kredit über ${years} Jahre` : 'bar bezahlt'}).\nDas neue Stadion fasst ${plan.capacity.toLocaleString('de-DE')} Zuschauer. Gebaut wird in Abschnitten um das Spielfeld: bis zur Eröffnung sind ${loss.toLocaleString('de-DE')} Plätze gesperrt.`,
  }));
  return { ok: true, text };
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
    // Neubau: die Eröffnung begeistert (+6), verlorene Stehplätze wiegen höchstens −8.
    const plan = { mood: Math.round((p.rebuild ? 6 + Math.max(-8, mood) : mood) * 10) / 10 };
    if (p.rebuild) club.stadium.built = yearOf(today);
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
  ensureStadiumAge(g);
  // Jährlich zum 1. Juli: Die Ansprüche der Fans sind gestiegen – liegt der Komfort deutlich darunter, melden sie sich.
  if (today.slice(5) === '07-01') {
    const y = yearOf(today);
    const c = stadiumComfort(club, y);
    if (c && c.expect - c.comfort >= 6 && (club.stadium.agedNote ?? 0) < y - 2) {
      club.stadium.agedNote = y;
      const full = c.cap * 0.97 <= c.comfort;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Fanbeauftragter', subject: 'Die Fans erwarten mehr vom Stadion',
        shortText: `Komfort ${Math.round(c.comfort)}, erwartet werden ${Math.round(c.expect)} – es kommen rund ${Math.round((1 - c.factor) * 100)} % weniger Zuschauer.`,
        bodyText: `Die Ansprüche der Zuschauer steigen von Jahr zu Jahr. Unser Stadion (Baujahr ${c.built}) kommt auf einen Komfort von ${Math.round(c.comfort)}, erwartet werden inzwischen ${Math.round(c.expect)}. Das kostet uns rund ${Math.round((1 - c.factor) * 100)} % der Zuschauer.\n\n${full
          ? `Die Bausubstanz ist ausgereizt (Obergrenze ${Math.round(c.cap)}). Mehr geht nur mit einem Neubau: Verein › Stadion › Neubau.`
          : `Noch ist Luft bis zur Obergrenze der Bausubstanz (${Math.round(c.cap)}): bessere Sitze, mehr Dach, Anzeigetafel, Verpflegung und Anreise heben den Komfort. Darüber hinaus hilft nur ein Neubau.`}`,
      }));
    }
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
