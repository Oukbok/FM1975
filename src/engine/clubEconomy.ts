// =============================================================================
// FINANZEN 2.0 — Marke, Erlös-Mix, TV-Verteilung, KI-Haushalt, Fairplay
// -----------------------------------------------------------------------------
// Konventionen (siehe CLAUDE.md):
//   • Kontostand und Buchungen sind NOMINAL (DM bzw. später als EUR angezeigt).
//   • „Preisschilder“ (Gehalt, Marktwert, Transferbudget, Vertragswerte) liegen
//     in 1975-Basis und werden bei Buchung/Anzeige mit economyScale(Jahr) skaliert.
//
// Der Kreislauf (Schwungrad): Erfolg → Marke/Ruf → Sponsoring, Fanartikel, TV,
// Europapokal-Prämien → bessere Spieler → Erfolg. Bremsen ohne Handicaps:
//   • Sättigung (Marken-Multiplikator gedeckelt, abnehmender Grenznutzen),
//   • steigende Gehälter guter Spieler (Gehaltsquote),
//   • KI-Vereine investieren ihre Überschüsse ebenfalls (keine Geldspeicher),
//   • Finanzielles Fairplay ab 2011/12, Lizenzauflagen bei hoher Verschuldung.
// =============================================================================

import { Club, ClubBrand, ClubFinances, Player, SeasonFinanceRecord } from '../types';
import { economyScale, revenueScale, revenueShare } from './economy';

const revenueShareCommercial = (y: number) => revenueShare('commercial', y);
import { createPlayer } from './playerFactory';
import { tvMarketFactor } from '../data/history';
import { refreshOverall } from './development';
import { book } from './finances';
import { recordTransfer } from './history';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Vollwertiger Liga-Verein (keine Amateure des Pokals, keine Auslandsvereine). */
export function isLeagueClub(c: Club): boolean {
  return !c.id.startsWith('am') && !c.id.startsWith('eu_') && !c.id.startsWith('w_');
}

// -----------------------------------------------------------------------------
// Marke
// -----------------------------------------------------------------------------
/** Marke, die allein aus dem Ruf zu erwarten wäre. */
export function brandFromReputation(rep: number): ClubBrand {
  return {
    regional: clamp(rep + 12, 0, 100),
    national: clamp(rep - 8, 0, 100),
    international: clamp((rep - 62) * 1.6, 0, 100),
  };
}

export function ensureBrand(c: Club): ClubBrand {
  if (!c.brand) c.brand = brandFromReputation(c.reputation ?? 50);
  return c.brand;
}

/** Gewicht der internationalen Bekanntheit je Epoche (Globalisierung, Auslands-TV). */
export function internationalWeight(year: number): number {
  return clamp(0.1 + (year - 1975) * 0.011, 0.1, 0.65);
}

export function brandIndex(b: ClubBrand, year: number): number {
  return 0.45 * b.regional + 0.35 * b.national + internationalWeight(year) * b.international;
}

/**
 * Multiplikator für Sponsoring und Fanartikel: Marke im Verhältnis zu dem, was der
 * Ruf allein erwarten lässt. Abnehmender Grenznutzen und Deckel (Sättigung).
 */
export function commercialMultiplier(c: Club, year: number): number {
  const b = ensureBrand(c);
  const ratio = brandIndex(b, year) / Math.max(10, brandIndex(brandFromReputation(c.reputation ?? 50), year));
  return Math.pow(clamp(ratio, 0.6, 1.9), 0.8);
}

// -----------------------------------------------------------------------------
// Marktwert & Gehaltsniveau (1975-Basis)
// -----------------------------------------------------------------------------
/**
 * Marktwert in 1975-DM: konvex (alle 5 Stärkepunkte doppelt so teuer), damit
 * Ausnahmespieler wirklich kostbar sind. Stärke 80 ≈ 1 Mio, 90 ≈ 4 Mio, 70 ≈ 250.000.
 */
export function baseMarketValue(p: Player): number {
  const age = p.age;
  const ageF = age < 21 ? 1.5 : age < 24 ? 1.4 : age < 29 ? 1.15 : age < 32 ? 0.7 : 0.35;
  const pot = p.development?.basePotential ?? p.overall;
  const potF = 1 + clamp(pot - p.overall, 0, 25) / 30;
  const v = 1_000_000 * Math.pow(2, (p.overall - 80) / 5) * ageF * potF;
  return Math.max(5000, Math.round(v / 5000) * 5000);
}

/** Marktübliches Wochengehalt (1975-Basis) für einen Spieler. */
export function marketWage(p: Player): number {
  const top = Math.max(0, p.overall - 70);
  return Math.round(p.overall * 110 + top * top * 18);
}

/** Marktwerte aller Spieler zum Saisonstart neu bewerten. */
export function refreshMarketValues(players: Record<string, Player>): void {
  for (const p of Object.values(players)) p.contract.transferValue = baseMarketValue(p);
}

// -----------------------------------------------------------------------------
// Saisonabschluss: Bilanz sichern, Töpfe leeren
// -----------------------------------------------------------------------------
export function revenueOf(fin: ClubFinances): number {
  const i = fin.income;
  return i.ticketSales + i.tvMoney + i.sponsorship + i.merchandise + i.prizeMoney + i.catering
    + i.advertising + (i.commercial ?? 0) + i.membership + i.matchday + i.other;
}
function totalOut(fin: ClubFinances): number {
  return Object.values(fin.expenses).reduce((a, b) => a + (b || 0), 0);
}

export function closeSeasonFinances(c: Club, season: string): SeasonFinanceRecord {
  const fin = c.finances;
  const revenue = revenueOf(fin);
  const rec: SeasonFinanceRecord = {
    season,
    income: { ...fin.income },
    expenses: { ...fin.expenses },
    revenue,
    result: revenue + fin.income.transferIncome - totalOut(fin),
    balanceEnd: Math.round(fin.balance),
    wageRatio: revenue > 0 ? (fin.expenses.wages + fin.expenses.staffWages) / revenue : 0,
  };
  (fin.seasonHistory ??= []).push(rec);
  if (fin.seasonHistory.length > 30) fin.seasonHistory.shift();
  for (const k of Object.keys(fin.income) as (keyof ClubFinances['income'])[]) fin.income[k] = 0;
  for (const k of Object.keys(fin.expenses) as (keyof ClubFinances['expenses'])[]) fin.expenses[k] = 0;
  return rec;
}

/** Umsatz der Vorsaison (nominal) oder eine Schätzung, wenn es noch keine Bilanz gibt. */
export function lastRevenue(c: Club, year: number): number {
  const h = c.finances.seasonHistory;
  if (h && h.length) return h[h.length - 1].revenue;
  return (2_000_000 + (c.reputation ?? 50) * 120_000) * economyScale(year);
}

// -----------------------------------------------------------------------------
// Marke & Ruf nach der Saison
// -----------------------------------------------------------------------------
export interface SeasonOutcome {
  /** Platz in der Liga (1 = Meister), Ligagröße, Ebene (1 = 1. Liga). */
  position: number;
  size: number;
  tier: number;
  cupWinner: boolean;
  /** Europapokal-Punkte (siehe engine/world.ts seasonEuroPoints). */
  euroPoints: number;
  euroTitle: boolean;
}

export function updateBrand(c: Club, o: SeasonOutcome, year: number, isManaged: boolean): void {
  const b = ensureBrand(c);
  const perf = o.size > 1 ? 1 - (o.position - 1) / (o.size - 1) : 0.5;
  const tierBonus = o.tier === 1 ? 0 : o.tier === 2 ? -2.5 : -5;
  const anchor = brandFromReputation(c.reputation ?? 50);
  const champion = o.tier === 1 && o.position === 1;
  // Regional: treue Fans, wenig Schwankung.
  b.regional = clamp(b.regional + (perf - 0.5) * 1.5 + tierBonus * 0.3 + (anchor.regional - b.regional) * 0.05, 0, 100);
  // National: Titel und Tabellenplatz zählen.
  b.national = clamp(b.national + (perf - 0.5) * 3 + tierBonus + (champion ? 4 : 0) + (o.cupWinner ? 2 : 0)
    + (anchor.national - b.national) * 0.08, 0, 100);
  // International: Europapokal und Meistertitel; ab den 1990ern wichtiger.
  const intGain = o.euroPoints * 0.7 + (o.euroTitle ? 6 : 0) + (champion ? (year >= 1990 ? 2.5 : 1) : 0);
  b.international = clamp(b.international + intGain - 1.2 + (anchor.international - b.international) * 0.06, 0, 100);
  // Ruf der KI-Vereine driftet mit dem Erfolg (der eigene Verein: siehe game/day.ts).
  if (!isManaged) {
    const repTarget = 35 + perf * 30 + (o.tier === 1 ? 20 : o.tier === 2 ? 8 : 0) + (champion ? 8 : 0);
    c.reputation = Math.round(clamp(c.reputation + (repTarget - c.reputation) * 0.12, 20, 99));
  }
}

// -----------------------------------------------------------------------------
// Zentrale TV-Vermarktung
// -----------------------------------------------------------------------------
/** TV-Topf der 1. Liga in 1975-Werten (≈ 18 Vereine × 0,78 Mio). */
const TV_POOL_1975 = 14_000_000;

export function tvPoolFor(tier: number, year: number): number {
  const top = TV_POOL_1975 * revenueScale('tv', year) * tvMarketFactor(year);
  if (tier <= 1) return top;
  if (tier === 2) return top * (year < 2000 ? 0.25 : 0.2);
  if (tier === 3) return top * 0.035;
  return top * 0.008;
}

/** Gewicht der Tabellenplatzierung bei der TV-Verteilung (früher fast gleichmäßig). */
export function tvPerformanceWeight(year: number): number {
  return year < 1990 ? 0.15 : year < 2000 ? 0.25 : 0.35;
}

/**
 * Verteilt den TV-Topf der Liga auf ihre Vereine (Jahresbetrag, nominal).
 * @param perfOf  0..1 (1 = Meister der Vorsaison), Aufsteiger ≈ 0,15
 */
export function allocateTv(clubs: Club[], tier: number, year: number, perfOf: (id: string) => number): void {
  if (!clubs.length) return;
  const pool = tvPoolFor(tier, year);
  const w = tvPerformanceWeight(year);
  const weights = clubs.map((c) => (1 - w) + w * 2 * perfOf(c.id));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  clubs.forEach((c, i) => { c.finances.tvAnnual = Math.round((pool * weights[i]) / sum); });
}

// -----------------------------------------------------------------------------
// Vermarktung & Hospitality (Logen, Lizenzen, Partner)
// -----------------------------------------------------------------------------
/** Durchschnittsumsatz eines Erstligisten 1975 im Spiel (Bezug für die Vermarktung). */
const AVG_REVENUE_1975 = 11_000_000;

/**
 * Jahreswert der Vermarktung (nominal): 1975 praktisch null, ab den 1990ern ein
 * Hauptpfeiler. Große Marken verdienen überproportional (internationale Strahlkraft),
 * gedeckelt durch die Markenwerte (max. 100).
 */
export function commercialAnnualFor(c: Club, tier: number, year: number): number {
  const b = ensureBrand(c);
  const growth = Math.max(0, revenueShareCommercial(year) - revenueShareCommercial(1975));
  const size = Math.pow(Math.max(5, brandIndex(b, year)) / 45, 1.5);
  const tierF = tier <= 1 ? 1 : tier === 2 ? 0.35 : 0.1;
  return Math.round(AVG_REVENUE_1975 * economyScale(year) * growth * 1.3 * size * tierF);
}

// -----------------------------------------------------------------------------
// Zinsen auf Schulden (monatlich)
// -----------------------------------------------------------------------------
export function bookDebtInterest(c: Club, date: string, track: boolean): number {
  if (c.finances.balance >= 0) return 0;
  const interest = Math.round(-c.finances.balance * 0.0065); // ≈ 8 % p. a.
  if (interest > 0) book(c.finances, date, -interest, 'other', 'Zinsen (Überziehung)', track);
  return interest;
}

// -----------------------------------------------------------------------------
// Finanzielles Fairplay & Lizenz
// -----------------------------------------------------------------------------
export const FFP_START_YEAR = 2011;
export const WAGE_CAP_YEAR = 2034;
export const WAGE_CAP = 0.7;

export interface LicenseVerdict { level: 'ok' | 'warning' | 'ban'; text: string }

/**
 * Prüft nach Saisonende Fairplay (ab 2011/12: Ergebnis der letzten drei Saisons
 * darf höchstens 5 % des Umsatzes negativ sein) und die Verschuldung (alle Epochen:
 * Kontostand unter −40 % des Jahresumsatzes → Lizenz nur mit Transfersperre).
 */
export function checkLicense(c: Club, newSeason: string, year: number): LicenseVerdict {
  const fin = c.finances;
  const h = fin.seasonHistory ?? [];
  const last = h[h.length - 1];
  const ffp = (fin.ffp ??= { warnings: 0 });
  ffp.banSeason = undefined;
  ffp.note = undefined;
  if (last && fin.balance < -0.4 * last.revenue) {
    ffp.banSeason = newSeason;
    ffp.note = 'Lizenzauflage wegen Überschuldung';
    return { level: 'ban', text: 'Der Verband erteilt die Lizenz nur unter Auflagen: Wegen der hohen Verschuldung darfst du in dieser Saison keine Ablösesummen zahlen.' };
  }
  // Fiktive Zukunft: ab 2034/35 Gehaltsquote statt Fairplay (data/timeline.ts „wagecap-2034“).
  if (year >= WAGE_CAP_YEAR && last && last.wageRatio > WAGE_CAP) {
    ffp.warnings++;
    if (ffp.warnings >= 2) {
      ffp.banSeason = newSeason; ffp.note = 'Gehaltsquote überschritten: Transfersperre'; ffp.warnings = 1;
      return { level: 'ban', text: `Die Gehaltsquote lag erneut über ${Math.round(WAGE_CAP * 100)} % des Umsatzes. Für diese Saison gilt eine Transfersperre.` };
    }
    return { level: 'warning', text: `Die Gehaltsquote liegt bei ${Math.round(last.wageRatio * 100)} % des Umsatzes (erlaubt: ${Math.round(WAGE_CAP * 100)} %). Bei einem weiteren Verstoß droht eine Transfersperre.` };
  }
  if (year >= FFP_START_YEAR && year < WAGE_CAP_YEAR && h.length >= 3) {
    const recent = h.slice(-3);
    const res = recent.reduce((a, r) => a + r.result, 0);
    const rev = recent.reduce((a, r) => a + r.revenue, 0);
    if (res < -0.05 * rev) {
      ffp.warnings++;
      if (ffp.warnings >= 2) {
        ffp.banSeason = newSeason;
        ffp.note = 'Finanzielles Fairplay: Transfersperre';
        ffp.warnings = 1;
        return { level: 'ban', text: 'Finanzielles Fairplay: Die Verluste der letzten drei Spielzeiten liegen erneut über der Toleranz. Für diese Saison gilt eine Transfersperre (keine Ablösen).' };
      }
      return { level: 'warning', text: 'Finanzielles Fairplay: Die Verluste der letzten drei Spielzeiten überschreiten die Toleranz. Bei einem weiteren Verstoß droht eine Transfersperre.' };
    }
    ffp.warnings = Math.max(0, ffp.warnings - 1);
  }
  return { level: 'ok', text: '' };
}

export function hasTransferBan(c: Club, season: string): boolean {
  return c.finances.ffp?.banSeason === season;
}

// -----------------------------------------------------------------------------
// KI-Haushalt: Überschüsse investieren, Schulden abbauen
// -----------------------------------------------------------------------------
export interface AiEconomyContext {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  managedClubId: string;
  season: string;
  date: string;
  year: number;
  rng: () => number;
  /** Eigenen Verein ebenfalls automatisch führen (nur Simulation/Tests). */
  autoManageMine?: boolean;
}

const MIN_KEEP = 20;
const MAX_SQUAD = 25;

function squadRankValue(c: Club, players: Record<string, Player>, rank: number): number {
  const ovr = c.playerIds.map((id) => players[id]?.overall ?? 0).sort((a, b) => b - a);
  return ovr[Math.min(rank, ovr.length - 1)] ?? 60;
}

function movePlayer(p: Player, from: Club | null, to: Club | null, feeNominal: number, ctx: AiEconomyContext, abroad: string): void {
  if (from) {
    from.playerIds = from.playerIds.filter((x) => x !== p.id);
    if (feeNominal > 0) book(from.finances, ctx.date, feeNominal, 'transfer_income', `Transfer: Abgang ${p.fullName}`, from.id === ctx.managedClubId);
  }
  if (to) {
    to.playerIds.push(p.id);
    if (feeNominal > 0) book(to.finances, ctx.date, -feeNominal, 'transfer_expense', `Transfer: Verpflichtung ${p.fullName}`, to.id === ctx.managedClubId);
    p.clubId = to.id;
    // Gehalt im Gefüge des neuen Vereins: am Mittel des Kaders ausgerichtet.
    const mates = to.playerIds.map((id) => ctx.players[id]).filter((m) => m && m.id !== p.id);
    const avgRatio = mates.length ? mates.reduce((a, m) => a + m.contract.weeklyWage / Math.max(1, marketWage(m)), 0) / mates.length : 1;
    p.contract.weeklyWage = Math.round(marketWage(p) * Math.max(0.3, avgRatio) * 1.1);
    p.contract.satisfaction = 75;
    p.transferListed = false;
  } else {
    delete ctx.players[p.id];
  }
  recordTransfer(p, from?.name ?? abroad, to?.name ?? abroad, feeNominal, ctx.date);
}

/** Schwächsten/ältesten überzähligen Spieler abgeben (ablösefrei ins Ausland). */
function trimSquad(c: Club, ctx: AiEconomyContext): void {
  while (c.playerIds.length > MAX_SQUAD) {
    const worst = c.playerIds.map((id) => ctx.players[id]).filter((p) => p && !(p.development.legendId && p.age <= 23))
      .sort((a, b) => (a.overall - a.age * 0.4) - (b.overall - b.age * 0.4))[0];
    if (!worst) break;
    movePlayer(worst, c, null, 0, ctx, 'Ausland');
  }
}

/**
 * Haushaltsführung der KI-Vereine zum Saisonstart. Gibt Schlagzeilen zurück
 * (große Transfers), damit die Liga lebendig wirkt.
 */
export function runAiEconomy(ctx: AiEconomyContext): string[] {
  const news: string[] = [];
  const scale = economyScale(ctx.year);
  const league = Object.values(ctx.clubs).filter(isLeagueClub);
  const isAi = (c: Club) => c.id !== ctx.managedClubId || !!ctx.autoManageMine;

  // Gehälter der KI-Vereine: Vertragsverlängerungen. Die Verteilung folgt der Leistung
  // (marketWage), die Summe dem Umsatz des Vereins (Gehaltsquote ~58 %, reiche Vereine
  // etwas mehr). So können sich auch Drittligisten ihren Kader leisten.
  for (const c of league) {
    if (!isAi(c)) continue;
    const rev = lastRevenue(c, ctx.year);
    const rich = Math.max(0, (c.finances.balance - 0.6 * rev) / Math.max(1, rev));
    const quota = 0.62 + Math.min(0.12, rich * 0.1) - (c.finances.balance < 0 ? 0.06 : 0);
    const budgetWeekly = (quota * rev) / scale / 52 / 1.18;
    const squad = c.playerIds.map((id) => ctx.players[id]).filter(Boolean);
    const sum = squad.reduce((a, p) => a + marketWage(p), 0) || 1;
    const factor = budgetWeekly / sum;
    for (const p of squad) {
      const target = marketWage(p) * factor;
      p.contract.weeklyWage = Math.max(200, Math.round(p.contract.weeklyWage + (target - p.contract.weeklyWage) * 0.5));
    }
  }

  // 1) Verschuldete Vereine verkaufen.
  for (const c of league) {
    if (!isAi(c)) continue;
    let guard = 0;
    while (c.finances.balance < 0 && guard++ < 3 && c.playerIds.length > MIN_KEEP - 2) {
      const sell = c.playerIds.map((id) => ctx.players[id]).filter(Boolean)
        .sort((a, b) => b.contract.transferValue - a.contract.transferValue)[0];
      if (!sell) break;
      const fee = Math.round(sell.contract.transferValue * scale);
      // Käufer: reichster KI-Verein mit Platz und Geld, sonst Ausland.
      const buyer = league
        .filter((b) => b.id !== c.id && isAi(b) && !hasTransferBan(b, ctx.season) && b.playerIds.length < MAX_SQUAD
          && b.finances.balance - fee > 0.3 * lastRevenue(b, ctx.year))
        .sort((a, b) => b.finances.balance - a.finances.balance)[0] ?? null;
      movePlayer(sell, c, buyer, fee, ctx, 'Ausland');
      news.push(`${c.name} muss sparen: ${sell.fullName} wechselt ${buyer ? 'zu ' + buyer.name : 'ins Ausland'}.`);
    }
  }

  // 2) Überschüsse investieren (max. zwei Zugänge je Verein).
  // Bezug für Auslands-Zugänge: typisches Stammspieler-Niveau der Liga, damit Importe
  // die Liga nicht über die Jahre aufblähen (keine Stärke-Inflation).
  const elevenths = league.map((c) => squadRankValue(c, ctx.players, 10)).sort((a, b) => a - b);
  const leagueRef = elevenths[Math.floor(elevenths.length * 0.75)] ?? 72;
  const order = [...league].sort((a, b) => b.finances.balance - a.finances.balance);
  for (const c of order) {
    if (!isAi(c) || hasTransferBan(c, ctx.season)) continue;
    const rev = lastRevenue(c, ctx.year);
    for (let k = 0; k < 2; k++) {
      const surplus = c.finances.balance - 0.3 * rev;
      if (surplus < 0.05 * rev) break;
      const budget = surplus * 0.6;
      const need = squadRankValue(c, ctx.players, 13); // 14. Spieler = Breite
      const starter = squadRankValue(c, ctx.players, 10);
      const aim = Math.max(need + 3, Math.min(starter + 4, need + 10));
      let bought = false;
      // a) Inland: besserer Spieler eines schwächeren KI-Vereins, der ihn abgeben kann.
      if (ctx.rng() < 0.55) {
        const cands = league
          .filter((s) => s.id !== c.id && s.id !== ctx.managedClubId && s.playerIds.length > MIN_KEEP)
          .flatMap((s) => s.playerIds.map((id) => ctx.players[id]).filter(Boolean))
          .filter((p) => p.overall >= aim && p.age <= 30 && p.contract.transferValue * scale * 1.15 <= budget)
          .sort((a, b) => b.overall - a.overall || a.contract.transferValue - b.contract.transferValue);
        const p = cands[Math.floor(ctx.rng() * Math.min(3, cands.length))];
        if (p) {
          const seller = ctx.clubs[p.clubId];
          const fee = Math.round(p.contract.transferValue * scale * 1.15);
          movePlayer(p, seller, c, fee, ctx, 'Ausland');
          if (fee > 0.15 * rev) news.push(`${c.name} verpflichtet ${p.fullName} von ${seller.name}.`);
          bought = true;
        }
      }
      // b) Ausland: Neuzugang passender Stärke, Ablöse fließt aus der Liga ab.
      if (!bought) {
        if (ctx.rng() < 0.4) break; // nicht jeder Überschuss findet einen passenden Auslandsspieler
        const strength = Math.min(aim + Math.floor(ctx.rng() * 3), leagueRef + 2);
        if (strength <= need) break;
        const age = 21 + Math.floor(ctx.rng() * 8);
        const p = createPlayer({
          id: `${c.id}_t${ctx.year}_${k}_${Math.floor(ctx.rng() * 1e6)}`, clubId: c.id,
          pos: (['VS', 'ZM', 'MS', 'AV', 'FL', 'OM', 'DM', 'TW'] as const)[Math.floor(ctx.rng() * 8)],
          age, strength, year: ctx.year, date: ctx.date, rng: ctx.rng, shirt: 0,
        });
        refreshOverall(p);
        p.contract.transferValue = baseMarketValue(p);
        const fee = Math.round(p.contract.transferValue * scale);
        if (fee > budget) break;
        ctx.players[p.id] = p;
        p.clubId = '';
        movePlayer(p, null, c, fee, ctx, 'Ausland');
        if (fee > 0.15 * rev) news.push(`${c.name} holt ${p.fullName} aus dem Ausland.`);
      }
      trimSquad(c, ctx);
    }
  }

  // 3) Reiche Vereine bauen aus und zahlen mehr (Geld bleibt nicht auf dem Konto liegen):
  //    Gelände/Stadion ausbauen, Gehälter über Markt (Prämien, Spitzengehälter).
  for (const c of league) {
    if (!isAi(c)) continue;
    const rev = lastRevenue(c, ctx.year);
    const excess = c.finances.balance - 0.6 * rev;
    if (excess <= 0) continue;
    const ratio = excess / Math.max(1, rev);
    const spend = Math.round(excess * 0.6);
    const keys = (['trainingCenter', 'youthAcademy', 'medical', 'merchandising'] as const)
      .filter((k) => (c.infrastructure?.[k] ?? 1) < 5);
    if (keys.length) {
      const k = keys[Math.floor(ctx.rng() * keys.length)];
      (c.infrastructure as any)[k] = (c.infrastructure?.[k] ?? 1) + 1;
    }
    if (c.stadium.capacity < 75000) c.stadium.capacity = Math.round(c.stadium.capacity * 1.06 / 100) * 100;
    book(c.finances, ctx.date, -spend, 'facilities', 'Ausbau Vereinsgelände und Stadion', false);
    void ratio;
  }
  return news;
}
