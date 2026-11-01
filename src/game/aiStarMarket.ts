// =============================================================================
// STAR-MARKT DER KI — Topvereine holen die Besten der kleineren Vereine
// -----------------------------------------------------------------------------
// Wie in der Bundesliga: Die Großen kaufen die Leistungsträger der Kleinen,
// die Kleinen kassieren und kaufen günstiger nach. Pro Sommer versucht jeder
// KI-Verein (außer den vier kleinsten) einen solchen Coup, die fünf angesehensten
// bis zu zwei (die drei größten bis zu drei) (auch bei nur etwas kleineren Vereinen, notfalls in zwei Raten):
//   • Ziel: ein Spieler (20–29 J.), der klar besser ist als der schwächste
//     Stammspieler seiner Positionsgruppe und mindestens Mannschaftsniveau hat,
//   • bei einem kleineren Verein (Ruf ≥ 3 bzw. ≥ 6 Punkte darunter),
//   • der Verkäufer verkauft über seiner Schmerzgrenze (Verkäuferposition),
//   • der Spieler will (Persönlichkeit: Größe, Stammplatz, Rivalität …).
// Die Spitze wird dadurch nicht breiter (es entstehen keine neuen Stars), aber
// die Stars sammeln sich bei den großen Vereinen.
// =============================================================================
import { GROUP_OF, POS_GROUPS, SquadAssessment } from '../engine/aiManager';
import { hasTransferBan } from '../engine/clubEconomy';
import { CalendarEngine } from '../engine/calendar';
import { bosmanActive } from '../engine/contractTalks';
import { capBase, frenzy, sellerPosition, softCap } from '../engine/transferMarket';
import { Club, Player } from '../types';
import { fmtPrice } from '../ui/format';
import { isAiClub, monthsLeftOf, recentlyMoved, reportDeal, RoundCtx, squadOf } from './aiClubs';
import { transferPlayer } from './contracts';
import { willJoin } from './playerWishesGame';
import { MIN_SQUAD } from './squads';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r5k = (v: number) => Math.round(v / 5000) * 5000;
const LAST_DAY = '08-21';
const TOP_N = 5;

/** Versucht einen Star-Transfer; true bei Erfolg. */
export function poachStar(ctx: RoundCtx, buyer: Club, a: SquadAssessment): boolean {
  const { g, rng, today } = ctx;
  if (today.slice(5) > LAST_DAY || hasTransferBan(buyer, g.season)) return false;
  const m = g.aiMarket!;
  const key = `${buyer.id}#star`;
  const done = m.arrivals[key] ?? 0;
  if (done >= 3) return false;
  const budget = buyer.finances.transferBudget;
  if (budget <= 0 || buyer.playerIds.length >= 26) return false;
  // Die angesehensten Vereine schlagen häufiger zu, aber jeder größere Verein bedient sich bei kleineren.
  const ranked = Object.values(g.clubs).filter((c) => isAiClub(g, c)).sort((x, y) => y.reputation - x.reputation);
  const rank = ranked.findIndex((c) => c.id === buyer.id);
  if (rank >= ranked.length - 4 || (rank >= TOP_N && done >= 1) || (rank >= 3 && done >= 2) || rng() > (rank < TOP_N ? 0.8 : 0.35)) return false;

  // Spitzenvereine dürfen in zwei Raten zahlen (Hälfte jetzt, Rest in einem Jahr).
  const credit = rank < TOP_N ? 1.8 : 1;
  // Schwächste Stelle der Startelf (gemessen am Mannschaftsniveau).
  const groups = POS_GROUPS.map((k) => a.groups[k]).filter((x) => x.starters > 0).sort((x, y) => x.startMin - y.startMin);
  for (const grp of groups.slice(0, 2)) {
    const bar = Math.max(grp.startMin + (rank < TOP_N ? 2 : 3), Math.round(a.level) - (rank < TOP_N ? 1 : 0));
    const cands = ctx.pool.filter((p) => GROUP_OF[p.naturalPosition] === grp.group && p.overall >= bar && p.age >= 20 && p.age <= 29
      && p.clubId !== buyer.id && !ctx.busy.has(p.id) && !p.contract.preContractClubId && !p.isYouth && !recentlyMoved(p, today)
      && p.contract.transferValue * 0.85 <= budget * credit && (g.clubs[p.clubId]?.reputation ?? 99) <= buyer.reputation - (rank < TOP_N ? 3 : 6))
      .sort((x, y) => y.overall - x.overall).slice(0, 3);
    for (const p of cands) {
      if (tryBuy(ctx, buyer, p, budget, credit)) { m.arrivals[key] = done + 1; return true; }
    }
  }
  return false;
}

function tryBuy(ctx: RoundCtx, buyer: Club, p: Player, budget: number, credit: number): boolean {
  const { g, rng, today, year } = ctx;
  const seller = g.clubs[p.clubId];
  if (!seller || !isAiClub(g, seller) || seller.playerIds.length <= MIN_SQUAD - 2) return false;
  const pos = sellerPosition(p, seller, buyer, { year, monthsLeft: monthsLeftOf(p, today), bosman: bosmanActive(today), squad: squadOf(g, seller), rival: false, scope: 'germany' });
  const raw = p.contract.transferValue * (1.1 + rng() * 0.3);
  const cap = capBase(year, 'germany');
  const maxPay = Math.min(budget * credit, softCap(raw, cap) * frenzy(raw, cap, rng));
  if (maxPay < pos.walkaway) return false;
  const join = willJoin(g, p, buyer, rng);
  if (!join.ok) return false;
  const fee = r5k(clamp((pos.walkaway + Math.min(pos.asking, maxPay)) / 2, pos.walkaway, maxPay));
  const name = p.fullName;
  // Über dem Budget: zweite Hälfte als Rate in einem Jahr (wie beim Spieler, game/transferTalks.ts).
  const upfront = fee > budget ? r5k(fee / 2) : fee;
  transferPlayer(g, p, seller, buyer, upfront, today);
  if (upfront < fee) {
    (g.transferInstallments ??= []).push({ due: CalendarEngine.addDays(today, 365), amount: fee - upfront, from: buyer.id, to: seller.id, name: p.fullName, kind: 'rate' });
    buyer.finances.transferBudget -= fee - upfront;
  }
  p.contract.weeklyWage = Math.round(join.wishes.demand.min);
  ctx.busy.add(p.id);
  reportDeal(ctx, `${buyer.name} holt Leistungsträger ${name} von ${seller.name} (${fmtPrice(fee)})`, fee, name, buyer, seller.name, GROUP_OF[p.naturalPosition]);
  return true;
}
