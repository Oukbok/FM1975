// =============================================================================
// Saisonwechsel der Finanzen (Finanzen 2.0): Bilanz sichern, Marke/Ruf anpassen,
// TV-Gelder verteilen, Lizenz/Fairplay prüfen, KI-Haushalte führen.
// Aufgerufen aus game/season.ts (startNextSeason) und game/newGame.ts.
// =============================================================================
import { Game } from './state';
import { Club } from '../types';
import { economyScale, euroMoneyFactor, euroStartFactor, yearOf } from '../engine/economy';
import {
  allocateTv, checkLicense, commercialAnnualFor, hasTransferBan, lastRevenue, closeSeasonFinances, isLeagueClub, refreshMarketValues, runAiEconomy, updateBrand,
} from '../engine/clubEconomy';
import { seasonEuroPoints } from '../engine/world';
import { book, WAGE_OVERHEAD } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { EuroCompId, EURO_COMP_NAMES } from '../data/europe';
import { formatMoney } from '../engine/economy';
import { boardBudgetShare } from '../engine/environment';
import { seasonClubBusiness } from './clubBusiness';
import { seatingNewSeason } from './seatingGame';
import { sponsorSeasonClose } from './sponsorGame';

/** Leistungswert 0..1 der Vorsaison je Verein (für die TV-Verteilung). */
export type PerfMap = Record<string, number>;

/**
 * Schließt die Finanzsaison aller Ligavereine (vor dem Umbau der Ligen aufrufen,
 * solange Tabelle, Pokal und Europapokal der alten Saison noch vorliegen).
 */
export function closeFinancialSeason(g: Game, oldSeason: string, date: string): PerfMap {
  const year = yearOf(date);
  const rows = g.table.rows;
  const n = rows.length;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const euroPts = seasonEuroPoints(g.euroCups as any);
  const euroWinners = new Set(['ec', 'cwc', 'uefa'].map((c) => (g.euroCups as any)?.[c]?.winnerClubId).filter(Boolean));
  const perf: PerfMap = {};
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c)) continue;
    const pos = rows.findIndex((r) => r.clubId === c.id) + 1;
    const p = pos > 0 && n > 1 ? 1 - (pos - 1) / (n - 1) : 0.15;
    perf[c.id] = p;
    updateBrand(c, {
      position: pos || n, size: n, tier,
      cupWinner: g.cup?.winnerClubId === c.id,
      euroPoints: euroPts[c.id] ?? 0,
      euroTitle: euroWinners.has(c.id),
    }, year, c.id === g.managedClubId);
    if (c.id !== g.managedClubId) driftAttendance(c, p, tier);
    // Erfolgsprämien, Mindestplatzierung, Jugend-Klausel der Sponsoren (game/sponsorGame.ts).
    sponsorSeasonClose(g, c, {
      position: pos || n, size: n, tier, cupWinner: g.cup?.winnerClubId === c.id,
      euroPoints: euroPts[c.id] ?? 0, euroTitle: euroWinners.has(c.id),
    }, date);
    closeSeasonFinances(c, oldSeason);
  }
  return perf;
}

/**
 * Zuschauerzuspruch der KI-Vereine folgt Ruf, Tabellenplatz und Liga (der eigene Verein:
 * Fanstimmung, game/environmentGame.ts). Die Nachfrage der Epoche kommt beim Spiel dazu.
 */
function driftAttendance(c: Club, perf: number, tier: number): void {
  const tierAdj = tier <= 1 ? 0 : tier === 2 ? -0.08 : -0.15;
  const target = Math.max(0.15, Math.min(0.95, 0.17 + (c.reputation ?? 60) * 0.0036 + (perf - 0.5) * 0.12 + tierAdj));
  const r = c.stadium.averageAttendanceRate ?? target;
  c.stadium.averageAttendanceRate = Math.round((r + (target - r) * 0.35) * 1000) / 1000;
}

/** Eröffnet die Finanzsaison: Marktwerte, TV-Verteilung, Lizenz, KI-Haushalte, Startgelder. */
export function openFinancialSeason(g: Game, newSeason: string, date: string, prevPerf: PerfMap): void {
  const year = yearOf(date);
  const league = Object.values(g.clubs).filter(isLeagueClub);
  const fmt = (v: number) => formatMoney(v, year);
  refreshMarketValues(g.players, year);
  seatingNewSeason(g, date); // Platzkategorien: Preise, Potenzial, KI-Platzmix

  // TV-Gelder der neuen Saison.
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  for (const c of league) c.finances.leagueTier = tier;
  allocateTv(league, tier, year, (id) => prevPerf[id] ?? 0.15);
  for (const c of league) c.finances.commercialAnnual = commercialAnnualFor(c, tier, year);

  // Lizenz & Fairplay.
  for (const c of league) {
    const v = checkLicense(c, newSeason, year);
    if (c.id === g.managedClubId && v.level !== 'ok') {
      pushMessage(g.messages, makeMessage({
        date, category: 'board', from: 'Lizenzierungsausschuss',
        subject: v.level === 'ban' ? 'Lizenz nur unter Auflagen' : 'Verwarnung: Finanzielles Fairplay',
        shortText: v.text.slice(0, 90), bodyText: v.text, actionRequired: false,
      }));
    }
  }

  // Startgelder im Europapokal (ab 1992 deutlich höher).
  const START_FEE: Record<EuroCompId, number> = { ec: 18000, cwc: 12000, uefa: 7500 };
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const cup = (g.euroCups as any)?.[comp];
    if (!cup) continue;
    for (const id of cup.participantIds as string[]) {
      const c = g.clubs[id];
      if (!c || !isLeagueClub(c)) continue;
      // Ab 2000 (Marktpool, später Koeffizienten-Säule): große Namen bekommen mehr – international bekannte
      // Vereine bis knapp das Doppelte (FC Bayern 2024/25: 106 Mio. € bis zum Viertelfinale).
      const pillar = comp === 'ec' && year >= 2000 ? 1 + 0.8 * (c.brand?.international ?? 0) / 100 : 1;
      const fee = Math.round(START_FEE[comp] * economyScale(year) * euroMoneyFactor(comp, year) * euroStartFactor(comp, year) * pillar);
      book(c.finances, date, fee, 'prize_money', `${EURO_COMP_NAMES[comp]} - Startgeld`, c.id === g.managedClubId);
    }
  }

  // KI-Haushalte (Überschüsse investieren, Schulden abbauen).
  const news = runAiEconomy({
    clubs: g.clubs, players: g.players, managedClubId: g.managedClubId, season: newSeason, date, year,
    rng: Math.random, autoManageMine: !!(g as any).simAutoManage, skipInvest: true, tier,
  });
  if (news.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'transfer', from: 'Sportpresse',
      subject: 'Transfersommer: Die wichtigsten Wechsel der Liga',
      shortText: news[0], bodyText: news.slice(0, 12).map((x) => `• ${x}`).join('\n'), actionRequired: false,
    }));
  }

  const mine = g.clubs[g.managedClubId];
  // Transferbudget (Preisschild in 1975-Basis): der Vorstand gibt einen Teil des
  // Polsters über der Liquiditätsreserve frei; bei Lizenzauflagen nichts.
  if (mine) {
    const rev = lastRevenue(mine, year);
    const free = Math.max(0, mine.finances.balance - 0.25 * rev) * boardBudgetShare(mine.boardConfidence ?? 60);
    const banned = hasTransferBan(mine, newSeason);
    mine.finances.transferBudget = banned ? 0 : Math.round(free / economyScale(year) / 10000) * 10000;
    // Gehaltsrahmen (Wochen-Grundgehalt, 1975-Werte): etwa 60 % des Umsatzes für Spieler
    // samt Betreuerstab und Prämien (WAGE_OVERHEAD).
    mine.finances.wageBudget = Math.round((0.6 * rev) / economyScale(year) / 52 / WAGE_OVERHEAD / 100) * 100;
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Vorstand',
      subject: `Transferbudget ${newSeason}: ${fmt(mine.finances.transferBudget * economyScale(year))}`,
      shortText: banned ? 'Wegen der Lizenzauflagen gibt es kein Transferbudget.' : 'Der Vorstand gibt Mittel für Neuzugänge frei.',
      bodyText: banned
        ? 'Wegen der Lizenzauflagen dürfen in dieser Saison keine Ablösesummen gezahlt werden.'
        : `Der Vorstand gibt für die Saison ${newSeason} ${fmt(mine.finances.transferBudget * economyScale(year))} für Ablösesummen frei. `
          + `Grundlage: Kontostand ${fmt(mine.finances.balance)} abzüglich einer Liquiditätsreserve von einem Viertel des Jahresumsatzes (${fmt(rev)}); davon gibt der Vorstand bei einem Vertrauen von ${mine.boardConfidence ?? 60} einen Anteil von ${Math.round(boardBudgetShare(mine.boardConfidence ?? 60) * 100)} % frei.`,
      actionRequired: false,
    }));
  }
  if (mine?.finances.tvAnnual) {
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Finanzabteilung',
      subject: `TV-Gelder ${newSeason}: ${fmt(mine.finances.tvAnnual)}`,
      shortText: 'Verteilung der zentralen Vermarktung steht fest.',
      bodyText: `Aus der zentralen TV-Vermarktung erhält der Verein in der Saison ${newSeason} ${fmt(mine.finances.tvAnnual)} (monatliche Raten). Die Verteilung richtet sich nach Liga und Tabellenplatz der Vorsaison.`,
      actionRequired: false,
    }));
  }

  // Ausschüttung, Überschuldung (Punktabzug/Zwangsabstieg), Vorstandsgeduld (game/clubBusiness.ts).
  seasonClubBusiness(g, newSeason, date);
}
