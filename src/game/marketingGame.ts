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
// KI-Vereine werben nicht (ihre Erlöse sind pauschal kalibriert).
// =============================================================================
import { GOAL_CAP, MARKETING_GOALS, marketingMonthlyBase, marketingPriceFactor, marketingTargets, type MarketingGoal } from '../data/marketing';
import { brandFromReputation, brandIndex, ensureBrand } from '../engine/clubEconomy';
import type { ClubBrand } from '../types';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { setMarketingFx } from '../engine/honourEffects';
import type { Game } from './state';

export type MarketingFx = Record<MarketingGoal, number>;
const ZERO = (): MarketingFx => ({ att: 0, members: 0, merch: 0, reg: 0, nat: 0, intl: 0 });
/** Anteil des Abstands zur Zielwirkung, der je Monat aufgeholt wird (Aufbau schneller als Verfall). */
const UP = 0.3, DOWN = 0.18;
/** Markenwirkung baut sich langsamer auf und hält viel länger. */
const BRAND_UP = 0.2, BRAND_DOWN = 0.05;
const BRAND_KEY: Partial<Record<MarketingGoal, keyof ClubBrand>> = { reg: 'regional', nat: 'national', intl: 'international' };

export function marketingFxOf(g: Game): MarketingFx {
  return { ...ZERO(), ...(g.marketingFx ?? {}) };
}

/** Wirkungen an die Engine melden (täglich, beim Laden, beim Spielstart). */
export function bindMarketing(g: Game): void {
  const fx = marketingFxOf(g);
  setMarketingFx(g.managedClubId, { demand: fx.att, members: fx.members, merch: fx.merch });
}

/** Monatskosten der Regler (nominal): Stammdaten × Preisfaktor (Epoche, Vereinsgröße) × Preisniveau des Jahres. */
export function marketingCostMonth(g: Game, budgets: Record<string, number> = g.marketing ?? {}): number {
  const year = yearOf(g.calendar.currentDate);
  return Math.round(marketingMonthlyBase(budgets) * marketingPriceFactor(year, g.clubs[g.managedClubId]?.reputation ?? 60) * economyScale(year));
}

/** Monatsabschluss (1. des Monats): Kosten buchen, Wirkung nachziehen, Marke aufbauen. */
export function marketingMonthly(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const year = yearOf(today);
  const mkt = g.marketing ?? {};
  const cost = marketingCostMonth(g, mkt);
  if (cost > 0) book(club.finances, today, -cost, 'other', 'Marketing & Werbung (Monat)', true);
  const target = marketingTargets(mkt, year);
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
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const target = marketingTargets(budgets, year), fx = marketingFxOf(g);
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
    progress: sumT > 0 ? sumN / sumT : 1,
  };
}
