// =============================================================================
// STADIONAUSBAU MIT BAUABLAUF (Wunsch Pascal): Blöcke + Ausstattung in einem
// Projekt, gebaut auf eine von drei Arten:
//   • parallel – alles gleichzeitig, je Block die Hälfte gesperrt (bisheriger Weg),
//   • stages   – in Etappen je Tribünenseite: die laufende Etappe ist ganz gesperrt,
//                der Rest bleibt offen; dauert länger, kostet 4 % mehr,
//   • away     – Abriss der Baustelle, Heimspiele im Ausweichstadion der Region
//                (dessen Plätze, Miete je Monat); am schnellsten, 8 % günstiger,
//                Fans murren zum Auszug (−3 Stimmung).
// Rechnung der Blöcke über groupPlanFor (game/stadiumGame.ts), der Ausstattung über
// planExtras (engine/stadiumExtras.ts). Täglich: Etappen fertigstellen, Miete.
// =============================================================================
import { annuity, makeLoan } from '../engine/clubBusiness';
import { economyScale, formatMoney, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { BLOCK_NAME, BLOCK_SIDE, addMonths, blockCapacity, blocksCapacity, planBlock } from '../engine/stadiumBlocks';
import { extrasOf, planExtras, type ExtrasPlan, type StadiumExtras } from '../engine/stadiumExtras';
import { honourFx } from '../engine/honourEffects';
import { regionOf } from '../engine/environment';
import type { BlockId, BlockSide, StadiumBlock } from '../types';
import { noteBudgetSpend } from './budgetPlan';
import { ensureEnvironment } from './environmentGame';
import { blockOf, buildBlocker, buildLoss, groupPlanFor, nominalCost } from './stadiumGame';
import type { Game } from './state';

export type BuildMode = 'parallel' | 'stages' | 'away';
export const BUILD_MODES: { id: BuildMode; name: string; text: string }[] = [
  { id: 'stages', name: 'In Etappen', text: 'Eine Tribünenseite nach der anderen – die übrigen bleiben offen. Dauert am längsten, 4 % teurer.' },
  { id: 'away', name: 'Abriss & Ausweichstadion', text: 'Die Baustelle wird komplett geräumt, gespielt wird im Ausweichstadion der Region. Am schnellsten und 8 % günstiger, aber Miete und weniger Plätze.' },
  { id: 'parallel', name: 'Alles gleichzeitig', text: 'Alle Blöcke zugleich, je Block ist die Hälfte gesperrt.' },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const STAGE_OF: Record<BlockSide, string> = { main: 'main', opposite: 'opposite', north: 'north', south: 'south', curve: '' };
const CURVE_STAGE: Partial<Record<BlockId, string>> = { curve_nw: 'north', curve_ne: 'north', curve_sw: 'south', curve_se: 'south' };
const STAGE_ORDER = ['north', 'south', 'opposite', 'main'];
const STAGE_NAME: Record<string, string> = { north: 'Nordseite', south: 'Südseite', opposite: 'Gegengerade', main: 'Haupttribüne' };
const stageKey = (id: BlockId) => STAGE_OF[BLOCK_SIDE[id]] || CURVE_STAGE[id] || 'north';

export interface AwayVenue { name: string; capacity: number; rentBase: number }
/** Ausweichstadion: größtes Stadion eines anderen Vereins der Region (sonst ein städtisches Stadion). */
export function awayVenue(g: Game): AwayVenue {
  const club = g.clubs[g.managedClubId];
  const cap = club.stadium.capacity;
  const reg = regionOf(club.city ?? '');
  const pool = [...Object.values(g.clubs), ...Object.values(g.simClubs ?? {})] as { id: string; city?: string; name: string; stadium?: { name?: string; capacity?: number } }[];
  const near = pool.filter((c) => c.id !== club.id && c.stadium?.capacity && reg !== 'Sonstige' && regionOf(c.city ?? '') === reg)
    .sort((a, b) => (b.stadium!.capacity ?? 0) - (a.stadium!.capacity ?? 0))[0];
  const capacity = Math.round(clamp(near ? Math.min(near.stadium!.capacity!, cap * 0.85) : cap * 0.55, 6000, 50000) / 500) * 500;
  const name = near ? `${near.stadium!.name ?? 'Stadion'} (${near.name})` : `Städtisches Stadion ${club.city ?? ''}`.trim();
  return { name, capacity, rentBase: Math.round(capacity * 0.5 / 100) * 100 };
}

export interface BuildPlan {
  targets: StadiumBlock[];
  extras: StadiumExtras | null;
  ex: ExtrasPlan | null;
  mode: BuildMode;
  costBase: number; cost: number; rate: number; monthly: (years: number) => number;
  months: number; mood: number; addCapacity: number;
  /** Gesperrt / offen während der Bauzeit (Etappen: schlimmste Etappe). */
  loss: number; capWhile: number;
  stages: { key: string; name: string; ids: BlockId[]; months: number; loss: number }[];
  away: AwayVenue | null;
  notes: string[]; errors: string[]; changed: boolean;
}

/** Planung eines Ausbaus mit Ausstattung und Bauablauf. */
export function buildPlanFor(g: Game, targets: StadiumBlock[], extras: StadiumExtras | null, mode: BuildMode): BuildPlan {
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const year = yearOf(g.calendar.currentDate);
  const grp = targets.length ? groupPlanFor(g, targets) : null;
  const live = grp ? grp.targets : [];
  const curX = extrasOf(club, year);
  const ex = extras ? planExtras(curX, extras, year, (st.blocks ?? []).map((b) => live.find((t) => t.id === b.id) ?? b)) : null;
  const exLive = ex?.changed ? ex : null;
  const errors = [...(live.length ? grp!.plan.errors : []), ...(exLive?.errors ?? [])];
  const notes = [...(live.length ? grp!.plan.notes : []), ...(exLive?.notes ?? [])];
  const changed = live.length > 0 || !!exLive;
  if (!changed) errors.splice(0, errors.length, 'Es ist nichts geändert.');
  // Etappen: je Seite, in fester Reihenfolge
  const byStage = new Map<string, StadiumBlock[]>();
  for (const t of live) { const k = stageKey(t.id); byStage.set(k, [...(byStage.get(k) ?? []), t]); }
  const stages = STAGE_ORDER.filter((k) => byStage.has(k)).map((k) => {
    const ts = byStage.get(k)!;
    const p = groupPlanFor(g, ts);
    return { key: k, name: STAGE_NAME[k], ids: ts.map((t) => t.id), months: p.plan.months, loss: ts.reduce((s, t) => s + blockCapacity(blockOf(g, t.id) ?? t), 0), costBase: p.plan.costBase };
  });
  const blockBase = live.length ? grp!.plan.costBase : 0;
  const blockMonths = live.length ? grp!.plan.months : 0;
  const exMonths = exLive?.months ?? 0;
  let costBase = blockBase, months = Math.max(blockMonths, exMonths), loss = live.length ? buildLoss(g, live) : 0;
  let away: AwayVenue | null = null;
  let mood = (live.length ? grp!.plan.mood : 0) + (exLive?.mood ?? 0);
  if (mode === 'stages' && stages.length) {
    costBase = stages.reduce((s, x) => s + x.costBase, 0) * 1.04;
    months = Math.max(exMonths, stages.reduce((s, x) => s + x.months, 0));
    loss = Math.max(...stages.map((x) => x.loss));
  } else if (mode === 'away' && changed) {
    away = awayVenue(g);
    costBase = blockBase * 0.92;
    months = Math.max(1, Math.ceil(Math.max(blockMonths, exMonths) * 0.75));
    loss = Math.max(0, st.capacity - away.capacity);
    mood -= 3;
    notes.push(`Heimspiele bis zur Fertigstellung im Ausweichstadion: ${away.name}, ${away.capacity.toLocaleString('de-DE')} Plätze.`);
  }
  costBase += exLive?.costBase ?? 0;
  const cost = nominalCost(costBase, year);
  const rate = grp?.rate ?? groupPlanFor(g, []).rate;
  return {
    targets: live, extras: exLive ? extras : null, ex: exLive, mode,
    costBase, cost, rate, monthly: (years: number) => annuity(cost, rate, years * 12),
    months, mood: Math.round(mood * 10) / 10, addCapacity: live.length ? grp!.plan.addCapacity : 0,
    loss, capWhile: Math.max(1000, st.capacity - loss),
    stages: stages.map(({ costBase: _c, ...x }) => x), away, notes: [...new Set(notes)], errors: [...new Set(errors)], changed,
  };
}

/** Bau beauftragen (Blöcke und/oder Ausstattung, mit Bauablauf). */
export function startStadiumBuild(g: Game, targets: StadiumBlock[], extras: StadiumExtras | null, mode: BuildMode, financing: 'cash' | 'loan', years: number): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const st = club.stadium;
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  if (st.blockProject || club.stadiumProject) return { ok: false, text: 'Es läuft bereits ein Umbau im Stadion.' };
  if (!st.blocks?.length) return { ok: false, text: 'Das Stadion ist noch nicht in Blöcke eingeteilt.' };
  const bp = buildPlanFor(g, targets, extras, mode);
  if (bp.errors.length) return { ok: false, text: bp.errors[0] };
  const blocker = buildBlocker(g, bp.cost, financing, years);
  if (blocker) return { ok: false, text: blocker };
  const n = bp.targets.length;
  const name = n > 1 ? `${BLOCK_NAME[bp.targets[0].id]} und ${n - 1} weitere${n > 2 ? '' : 'r'} Block${n > 2 ? 's' : ''}` : n ? BLOCK_NAME[bp.targets[0].id] : 'Stadionausstattung';
  if (financing === 'cash') {
    noteBudgetSpend(g, 'infra', bp.cost);
    book(club.finances, today, -bp.cost, 'facilities', `Umbau ${name} (bar)`, true);
  } else {
    (club.loans ??= []).push(makeLoan(bp.cost, years, year, today, `Umbau ${name}`, club.finances.balance < 0, honourFx(club.id, 'interest')));
  }
  const copy = (b: StadiumBlock) => JSON.parse(JSON.stringify(b)) as StadiumBlock;
  const all = n ? bp.targets.map(copy) : [copy(st.blocks[0])]; // nur Ausstattung: Platzhalter-Ziel = unveränderter Block
  const [first, ...rest] = all;
  // Etappen: Fertigstellung je Etappe; die erste ist sofort gesperrt.
  let stages: { ids: BlockId[]; finish: string }[] | undefined;
  let loss = bp.loss;
  if (mode === 'stages' && bp.stages.length) {
    let d = today;
    stages = bp.stages.map((s) => { d = addMonths(d, s.months); return { ids: s.ids, finish: d }; });
    loss = bp.stages[0].loss;
  }
  st.capacity = Math.max(1000, st.capacity - loss);
  st.blockProject = {
    blockId: first.id, target: first, more: rest.length ? rest : undefined, startDate: today,
    finishDate: addMonths(today, bp.months), cost: bp.cost, financing, capacityLoss: loss,
    extras: bp.extras ?? undefined, mode, stages, away: bp.away ? { name: bp.away.name, capacity: bp.away.capacity } : undefined,
  };
  if (mode === 'away') { const env = ensureEnvironment(g); env.fanMood = clamp(env.fanMood - 3, 0, 100); }
  const fin = st.blockProject.finishDate;
  const text = `Baubeginn ${name}: fertig zum ${fin.slice(8, 10)}.${fin.slice(5, 7)}.${fin.slice(0, 4)}.`;
  const how = mode === 'stages' && stages ? `In ${stages.length} Etappen: ${bp.stages.map((s) => s.name).join(' → ')}. Gesperrt ist jeweils nur die laufende Etappe.`
    : mode === 'away' && bp.away ? `Bis zur Fertigstellung spielen wir im Ausweichstadion: ${bp.away.name} (${bp.away.capacity.toLocaleString('de-DE')} Plätze, Miete monatlich).`
      : `Während der Bauzeit sind ${loss.toLocaleString('de-DE')} Plätze gesperrt.`;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Bauleitung', subject: `Umbau ${name} beginnt`, shortText: text,
    bodyText: `${text}\n\nKosten: ${formatMoney(bp.cost, year)} (${financing === 'loan' ? `Kredit über ${years} Jahre` : 'bar bezahlt'}).\n${how}${bp.notes.length ? '\n\n' + bp.notes.join('\n') : ''}`,
  }));
  return { ok: true, text };
}

/** Täglich vor der Fertigstellung: Etappen abschließen, Miete des Ausweichstadions. */
export function stadiumBuildDaily(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  const p = club?.stadium.blockProject;
  if (!p || !club.stadium.blocks) return;
  if (p.mode === 'away' && p.away && today.slice(8) === '01' && today > p.startDate) {
    const rent = Math.round(Math.round(p.away.capacity * 0.5 / 100) * 100 * economyScale(yearOf(today)));
    book(club.finances, today, -rent, 'facilities', `Miete Ausweichstadion (${p.away.name})`, true);
  }
  if (p.mode !== 'stages' || !p.stages) return;
  const all = [p.target, ...(p.more ?? [])];
  for (let i = 0; i < p.stages.length; i++) {
    const s = p.stages[i];
    if (s.done || today < s.finish || today >= p.finishDate) continue;
    s.done = true;
    const env = ensureEnvironment(g);
    let mood = 0;
    const blocks = club.stadium.blocks;
    for (const id of s.ids) {
      const t = all.find((x) => x.id === id);
      const cur = blocks.find((b) => b.id === id);
      if (!t || !cur) continue;
      mood += planBlock(cur, t, yearOf(p.startDate), club.stadium.capacity + p.capacityLoss, env.tradition).mood;
      club.stadium.blocks = club.stadium.blocks.map((b) => (b.id === id ? JSON.parse(JSON.stringify(t)) : b));
    }
    const next = p.stages.find((x) => !x.done);
    const nextLoss = next ? next.ids.reduce((a, id) => a + blockCapacity(club.stadium.blocks!.find((b) => b.id === id)!), 0) : 0;
    p.capacityLoss = nextLoss;
    club.stadium.capacity = Math.max(1000, blocksCapacity(club.stadium.blocks) - nextLoss);
    club.stadium.vipBoxes = club.stadium.blocks.reduce((a, b) => a + b.lounges, 0);
    env.fanMood = clamp(env.fanMood + mood, 0, 100);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Bauleitung', subject: `Etappe ${i + 1} fertig`,
      shortText: `${s.ids.map((id) => BLOCK_NAME[id]).join(', ')} wieder offen.`,
      bodyText: `Etappe ${i + 1} ist abgeschlossen: ${s.ids.map((id) => BLOCK_NAME[id]).join(', ')}. Das Stadion fasst jetzt ${club.stadium.capacity.toLocaleString('de-DE')} Zuschauer${next ? `; als Nächstes ist ${next.ids.map((id) => BLOCK_NAME[id]).join(', ')} gesperrt` : ''}.`,
    }));
  }
}
