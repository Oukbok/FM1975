// =============================================================================
// WERBUNG 2.0 (Wunsch Pascal: „warum sollte man werben, wenn es nur kostet?“)
// -----------------------------------------------------------------------------
// Werbung ist eine Investition mit Anlauf: Die Regler (game.marketing) legen fest,
// wie stark jeder Kanal bespielt wird; daraus ergibt sich je Werbeziel eine
// Zielwirkung (data/marketing.ts `marketingTargets`). Die tatsächliche Wirkung
// (`game.marketingFx`) läuft der Zielwirkung Monat für Monat hinterher – eine
// Kampagne braucht rund ein halbes Jahr, bis sie voll trägt, und verpufft ebenso
// langsam, wenn du sie streichst.
//   • Zuschauer, Mitglieder, Fanartikel: wirken sofort über die Engine
//     (engine/honourEffects.ts `setMarketingFx` → Nachfrage, Mitgliedsbeiträge,
//     Fanartikel-Potenzial des eigenen Vereins).
//   • Marke regional/national/international: Die Werbewirkung liegt als Aufschlag
//     in `club.brand` (gebucht wird monatlich nur die Änderung, `applied` merkt,
//     wie viel schon drinsteckt; bei 100 ist Schluss). Die Marke treibt Sponsoring,
//     Vermarktung und Fanartikel (commercialMultiplier). Markenwirkung verfällt
//     viel langsamer als die übrige – sie bleibt nach dem Ende der Werbung gut ein
//     Jahr lang spürbar.
// ZUGKRAFT (Wunsch Pascal: Werbung verstärkt, was der Erfolg ohnehin bewegt, und der beste
// Einsatz soll sich laufend verschieben): Die Zielwirkung wird mit der Zugkraft des Vereins
// multipliziert (0,7–1,4) – Tabellenplatz gegen das Saisonziel, Form der letzten fünf Spiele,
// Titel der Vorsaison. Läuft es, zündet jede Kampagne stärker und mehr Werbung lohnt sich;
// in der Krise verpufft ein Teil, und der einträglichste Einsatz liegt tiefer.
// KI-Vereine werben nicht (ihre Erlöse sind pauschal kalibriert).
// =============================================================================
import { GOAL_CAP, MARKETING_AREAS, MARKETING_GOALS, marketingAvailable, marketingMonthlyBase, marketingPriceFactor, marketingTargets, type MarketingGoal } from '../data/marketing';
import { brandFromReputation, brandIndex, ensureBrand } from '../engine/clubEconomy';
import type { ClubBrand } from '../types';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { setMarketingFx } from '../engine/honourEffects';
import { titlesOf } from './clubRecords';
import { goalOf } from './dressingRoomGame';
import type { Game } from './state';

export type MarketingFx = Record<MarketingGoal, number>;
const ZERO = (): MarketingFx => ({ att: 0, members: 0, merch: 0, reg: 0, nat: 0, intl: 0 });
/** Anteil des Abstands zur Zielwirkung, der je Monat aufgeholt wird (Aufbau schneller als Verfall). */
const UP = 0.3, DOWN = 0.18;
/** Markenwirkung baut sich langsamer auf und hält viel länger. */
const BRAND_UP = 0.2, BRAND_DOWN = 0.05;
const BRAND_KEY: Partial<Record<MarketingGoal, keyof ClubBrand>> = { reg: 'regional', nat: 'national', intl: 'international' };

export interface MarketingPull { factor: number; word: string; why: string }
/** Zugkraft des eigenen Vereins: wie stark Werbung gerade zündet (1 = normal). */
export function marketingPull(g: Game): MarketingPull {
  const club = g.clubs[g.managedClubId];
  const why: string[] = [];
  let f = 1;
  const goal = club ? goalOf(g, club) : undefined;
  if (goal && goal.played >= 3) {
    const d = Math.max(-0.25, Math.min(0.25, ((goal.expected - goal.pos) / Math.max(4, goal.size)) * 0.9));
    f += d;
    if (d > 0.04) why.push(`Platz ${goal.pos} – besser als erwartet`); else if (d < -0.04) why.push(`Platz ${goal.pos} – hinter den Erwartungen`);
    const form = g.table.rows.find((r) => r.clubId === club.id)?.form ?? [];
    if (form.length >= 3) {
      const pts = form.reduce((a, x) => a + (x === 'W' ? 3 : x === 'D' ? 1 : 0), 0) / (form.length * 3);
      f += (pts - 0.45) * 0.3;
      if (pts >= 0.7) why.push('starke Form'); else if (pts <= 0.25) why.push('schwache Form');
    }
  }
  const prev = `${Number(g.season.slice(0, 4)) - 1}/`;
  const won = club ? titlesOf(g, club.id).filter((t) => t.season.startsWith(prev) && ['meister', 'ddr', 'pokal', 'ec', 'cwc', 'uefa'].includes(t.kind)) : [];
  if (won.length) { f += won.some((t) => t.kind !== 'pokal') ? 0.12 : 0.07; why.push('Titel der Vorsaison'); }
  const factor = Math.round(Math.max(0.7, Math.min(1.4, f)) * 100) / 100;
  const word = factor >= 1.2 ? 'sehr hoch' : factor >= 1.07 ? 'hoch' : factor > 0.93 ? 'normal' : factor > 0.82 ? 'gedämpft' : 'schwach';
  return { factor, word, why: why.join(', ') || 'Saison läuft wie erwartet' };
}

export function marketingFxOf(g: Game): MarketingFx {
  return { ...ZERO(), ...(g.marketingFx ?? {}) };
}

/** Wirkungen an die Engine melden (täglich, beim Laden, beim Spielstart). */
export function bindMarketing(g: Game): void {
  const fx = marketingFxOf(g);
  setMarketingFx(g.managedClubId, { demand: fx.att, members: fx.members, merch: fx.merch });
}

/** Erlöse, auf die Werbung wirkt (Spieltag, Mitglieder, Fanartikel) in der letzten abgeschlossenen Saison. */
function marketBase(c: Game['clubs'][string]): number {
  const h = c.finances.seasonHistory;
  const i = h?.[h.length - 1]?.income;
  return i ? i.ticketSales + i.catering + i.matchday + i.membership + i.merchandise : 0;
}

/**
 * Preisfaktor der Werbung für den eigenen Verein: Epoche × Vereinsgröße. Die Größe kommt aus dem Ruf,
 * höchstens aber aus dem Markt, den der Verein tatsächlich erreicht (Erlöse aus Spieltag, Mitgliedern und
 * Fanartikeln gegen den Schnitt seiner Liga). Sonst zahlt ein Traditionsverein mit kleinem Stadion den
 * Kampagnenpreis eines Großklubs, ohne dessen Ertrag zu haben, und Werbung trägt sich nicht mehr auf jeder
 * Stufe (test:marketing, Vorlage 1978: Mönchengladbach/Kaiserslautern/Braunschweig). Nie teurer als nach Ruf.
 */
export function marketingPrice(g: Game): number {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const byRep = marketingPriceFactor(year, club?.reputation ?? 60);
  const own = club ? marketBase(club) : 0;
  if (!club || own <= 0) return byRep;
  const tier = club.finances.leagueTier ?? 1;
  const peers = Object.values(g.clubs).filter((c) => (c.finances.leagueTier ?? 1) === tier && marketBase(c) > 0);
  if (peers.length < 6) return byRep;
  const meanBase = peers.reduce((s, c) => s + marketBase(c), 0) / peers.length;
  const meanPrice = peers.reduce((s, c) => s + marketingPriceFactor(year, c.reputation ?? 60), 0) / peers.length;
  const byMarket = (own / meanBase) * meanPrice;
  return Math.max(marketingPriceFactor(year, 30), Math.min(byRep, byMarket));
}

/** Monatskosten der Regler (nominal): Stammdaten × Preisfaktor (Epoche, Vereinsgröße) × Preisniveau des Jahres. */
export function marketingCostMonth(g: Game, budgets: Record<string, number> = g.marketing ?? {}): number {
  const year = yearOf(g.calendar.currentDate);
  return Math.round(marketingMonthlyBase(budgets) * marketingPrice(g) * economyScale(year));
}

/** Monatsabschluss (1. des Monats): Kosten buchen, Wirkung nachziehen, Marke aufbauen. */
export function marketingMonthly(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const year = yearOf(today);
  const mkt = g.marketing ?? {};
  const cost = marketingCostMonth(g, mkt);
  if (cost > 0) book(club.finances, today, -cost, 'other', 'Marketing & Werbung (Monat)', true);
  const target = marketingTargets(mkt, year, marketingPull(g).factor);
  const fx = marketingFxOf(g);
  const b = ensureBrand(club);
  const applied = { ...(g.marketingBrand ?? {}) } as Partial<Record<MarketingGoal, number>>;
  for (const k of MARKETING_GOALS) {
    const bk = BRAND_KEY[k];
    const d = target[k] - fx[k];
    fx[k] = Math.max(0, fx[k] + d * (d > 0 ? (bk ? BRAND_UP : UP) : (bk ? BRAND_DOWN : DOWN)));
    if (fx[k] < GOAL_CAP[k] * 0.004) fx[k] = 0;
    if (bk) {
      // Nur die Änderung in die Marke buchen; bei 100 ist Schluss (der Rest verfällt).
      const was = applied[k] ?? 0;
      const next = Math.max(0, Math.min(100, b[bk] + (fx[k] - was)));
      applied[k] = Math.max(0, was + (next - b[bk]));
      b[bk] = next;
    }
  }
  g.marketingFx = fx;
  g.marketingBrand = applied;
  bindMarketing(g);
}

// -----------------------------------------------------------------------------
// Anzeige: Wirkung jetzt / Ziel und eine Schätzung in Geld (Finanzen › Werbung)
// -----------------------------------------------------------------------------
export interface MarketingGoalRow {
  goal: MarketingGoal;
  now: number; target: number; cap: number;
  /** Geschätzter Mehrertrag je Jahr bei voller Zielwirkung (nominal); Marke: gemeinsam in `brandYear`. */
  perYear: number;
}
export interface MarketingView {
  rows: MarketingGoalRow[];
  costMonth: number; costYear: number;
  /** Geschätzter Mehrertrag je Jahr aus der Marke (Sponsoring, Vermarktung, Fanartikel) bei voller Zielwirkung. */
  brandYear: number;
  /** Summe aller Schätzungen je Jahr. */
  gainYear: number;
  /** Anteil der Zielwirkung, der heute schon erreicht ist (0..1). */
  progress: number;
  pull: MarketingPull;
  /** Geschätzter Saldo je Jahr, wenn alle bespielten Kanäle eine Stufe tiefer/höher stünden (null = geht nicht). */
  netDown: number | null; netUp: number | null;
}

/** Jahreswert einer Einnahmeart: letzte abgeschlossene Saison, sonst die laufende hochgerechnet. */
function annual(g: Game, pick: (i: Game['clubs'][string]['finances']['income']) => number): number {
  const fin = g.clubs[g.managedClubId].finances;
  const last = fin.seasonHistory?.[fin.seasonHistory.length - 1];
  const today = g.calendar.currentDate;
  const start = `${today.slice(5) >= '07-01' ? today.slice(0, 4) : Number(today.slice(0, 4)) - 1}-07-01`;
  const frac = Math.max(0.08, Math.min(1, (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / (365 * 86400000)));
  const run = pick(fin.income) / frac;
  return last ? Math.max(pick(last.income), frac > 0.5 ? run : 0) : run;
}

export function marketingView(g: Game, budgets: Record<string, number> = g.marketing ?? {}): MarketingView {
  const v = viewOf(g, budgets);
  // Wo liegt der einträglichste Einsatz? Vergleich mit „überall eine Stufe weniger/mehr“.
  const year = yearOf(g.calendar.currentDate);
  const live = MARKETING_AREAS.filter((a) => marketingAvailable(a, year));
  const shift = (d: number) => Object.fromEntries(live.map((a) => [a.id, Math.max(0, Math.min(a.maxUnits, (budgets[a.id] ?? 0) + d))]).filter(([, u]) => (u as number) > 0)) as Record<string, number>;
  const net = (b: Record<string, number>) => { const x = viewOf(g, b); return x.gainYear - x.costYear; };
  const canDown = live.some((a) => (budgets[a.id] ?? 0) > 0), canUp = live.some((a) => (budgets[a.id] ?? 0) < a.maxUnits);
  return { ...v, netDown: canDown ? net(shift(-1)) : null, netUp: canUp ? net(shift(1)) : null };
}

function viewOf(g: Game, budgets: Record<string, number>): Omit<MarketingView, 'netDown' | 'netUp'> {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const pull = marketingPull(g);
  const target = marketingTargets(budgets, year, pull.factor), fx = marketingFxOf(g);
  const tickets = annual(g, (i) => i.ticketSales + i.catering + i.matchday);
  const members = annual(g, (i) => i.membership);
  const merch = annual(g, (i) => i.merchandise);
  const commercial = annual(g, (i) => i.sponsorship + i.advertising + (i.commercial ?? 0) + i.merchandise);
  // Die heutigen Erlöse enthalten die schon wirkende Werbung – auf „ohne Werbung“ zurückrechnen.
  const perYear: Record<MarketingGoal, number> = {
    att: (tickets / (1 + fx.att)) * target.att,
    members: (members / (1 + fx.members)) * target.members,
    merch: (merch / (1 + fx.merch)) * target.merch,
    reg: 0, nat: 0, intl: 0,
  };
  // Marke: Sponsoring/Vermarktung/Fanartikel folgen dem Markenindex im Verhältnis zum Ruf-Niveau (^0,8).
  const anchor = brandFromReputation(club.reputation ?? 50), b = ensureBrand(club);
  const baseIdx = Math.max(10, brandIndex(anchor, year));
  const ap = g.marketingBrand ?? {};
  const without: ClubBrand = { regional: b.regional - (ap.reg ?? 0), national: b.national - (ap.nat ?? 0), international: b.international - (ap.intl ?? 0) };
  const withT: ClubBrand = { regional: Math.min(100, without.regional + target.reg), national: Math.min(100, without.national + target.nat), international: Math.min(100, without.international + target.intl) };
  const mult = (x: ClubBrand) => Math.pow(Math.max(0.6, Math.min(1.9, brandIndex(x, year) / baseIdx)), 0.8);
  const nowMult = mult(b);
  const brandYear = Math.max(0, (commercial / nowMult) * (mult(withT) - mult(without)));
  const costMonth = marketingCostMonth(g, budgets);
  const rows = MARKETING_GOALS.map((goal) => ({ goal, now: fx[goal], target: target[goal], cap: GOAL_CAP[goal], perYear: Math.round(perYear[goal]) }));
  const sumT = rows.reduce((s, r) => s + r.target / r.cap, 0), sumN = rows.reduce((s, r) => s + Math.min(r.now, r.target) / r.cap, 0);
  return {
    rows, costMonth, costYear: costMonth * 12, brandYear: Math.round(brandYear),
    gainYear: Math.round(perYear.att + perYear.members + perYear.merch + brandYear),
    progress: sumT > 0 ? sumN / sumT : 1, pull,
  };
}
