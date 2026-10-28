// =============================================================================
// Vereins-Unternehmen im Spielablauf: Kredite & Bauprojekte (monatlich),
// Namensrechte, Ausgliederung/Investor (Aktionen), Überschuldung (Saisonwechsel).
// Rechenlogik: engine/clubBusiness.ts.
// =============================================================================
import { Game } from './state';
import { Club, NamingRights } from '../types';
import {
  advanceStadiumProject, corporateCapital, insolvencyHaircut, CORPORATE_YEAR, debtOf, dividendFor, insolvencyVerdict, investorName,
  investorPrice, MAX_INVESTOR_SHARE, namingAnnualNominal, namingOffers, serviceLoans, stadiumPlan, startStadiumProject,
} from '../engine/clubBusiness';
import { commercialMultiplier, isLeagueClub, lastRevenue } from '../engine/clubEconomy';
import { book } from '../engine/finances';
import { formatMoney, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { calculateTable } from '../engine/league';
import { ClubPhilosophy } from '../engine/environment';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function seasonOf(date: string): string {
  const y = Number(date.slice(0, 4));
  const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
}
function prevSeason(season: string): string {
  const s = Number(season.slice(0, 4)) - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
}

function shiftFans(g: Game, delta: number): void {
  if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood + delta, 0, 100);
}

// -----------------------------------------------------------------------------
// Monatlich (alle Vereine mit Krediten/Projekten/Namensrechten)
// -----------------------------------------------------------------------------
export function monthlyClubBusiness(g: Game, today: string): void {
  const year = yearOf(today);
  for (const club of Object.values(g.clubs)) {
    const mine = club.id === g.managedClubId;
    serviceLoans(club, today, mine);
    const done = advanceStadiumProject(club, today);
    if (done && mine) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Bauleitung',
        subject: 'Stadionausbau abgeschlossen', shortText: done, bodyText: `${done} Die zusätzlichen Plätze stehen ab sofort zur Verfügung.`,
      }));
    }
    const nr = club.namingRights;
    if (nr) {
      if (today >= `${nr.untilYear}-07-01`) {
        club.stadium.name = club.stadium.baseName ?? club.stadium.name;
        club.namingRights = undefined;
        if (mine) {
          pushMessage(g.messages, makeMessage({
            date: today, category: 'board', from: 'Vermarktung',
            subject: 'Namensrechte ausgelaufen',
            shortText: `Das Stadion heißt wieder ${club.stadium.name}.`,
            bodyText: `Der Vertrag mit ${nr.sponsor} ist ausgelaufen. Das Stadion trägt wieder seinen alten Namen. Neue Angebote findest du unter Verein → Vorstand.`,
          }));
        }
      } else {
        const m = Math.round(namingAnnualNominal(nr, club, year) / 12);
        if (m > 0) book(club.finances, today, m, 'commercial', `Namensrechte ${nr.arenaName} (Monat)`, mine);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Stadionbau (Aktion)
// -----------------------------------------------------------------------------
export function startStadiumBuild(g: Game, financing: 'cash' | 'loan', years: number): string {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const plan = stadiumPlan(club, year);
  if (!plan) return 'Kein Ausbau möglich.';
  const res = startStadiumProject(club, plan, financing, years, today, year, true);
  if (res.ok) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Bauleitung',
      subject: `Baubeginn: ${plan.label}`,
      shortText: res.text,
      bodyText: `${res.text}\n\nKosten: ${formatMoney(plan.cost, year)} (${financing === 'loan' ? `Kredit über ${years} Jahre` : 'bar bezahlt'}).\n`
        + `Während der Bauzeit sind ${club.stadiumProject?.capacityLoss.toLocaleString('de-DE')} Plätze gesperrt.`,
    }));
  }
  return res.text;
}

// -----------------------------------------------------------------------------
// Namensrechte (Aktion)
// -----------------------------------------------------------------------------
/** Angebote, solange kein Vertrag läuft oder er in höchstens einem Jahr endet. */
export function currentNamingOffers(g: Game): NamingRights[] {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  if (club.namingRights && club.namingRights.untilYear - year > 1) return [];
  const offers = namingOffers(club, year, seasonOf(g.calendar.currentDate));
  const cur = club.namingRights;
  if (cur) offers.unshift({ ...cur, annualValue: Math.round(cur.annualValue * 1.1), fromYear: cur.untilYear, untilYear: cur.untilYear + 5 });
  return offers;
}

const NAMING_FAN_COST: Record<ClubPhilosophy, number> = { glamour: 0.4, offensiv: 0.8, jugend: 1, kampf: 1.3, bodenstaendig: 1.3 };

export function acceptNaming(g: Game, offer: NamingRights): string {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const renewal = club.namingRights?.sponsor === offer.sponsor;
  club.stadium.baseName ??= club.stadium.name;
  club.namingRights = { ...offer };
  club.stadium.name = offer.arenaName;
  let fanCost = 0;
  if (!renewal && g.environment) {
    fanCost = Math.round((3 + g.environment.tradition / 12) * NAMING_FAN_COST[g.environment.philosophy]);
    shiftFans(g, -fanCost);
  }
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vermarktung',
    subject: `Namensrechte an ${offer.sponsor} verkauft`,
    shortText: `Das Stadion heißt jetzt ${offer.arenaName}.`,
    bodyText: `${offer.sponsor} zahlt ${formatMoney(namingAnnualNominal(offer, club, year), year)} pro Jahr bis 30.06.${offer.untilYear}. `
      + (fanCost ? `Teile der Fans reagieren verärgert (Stimmung −${fanCost}).` : ''),
  }));
  return `Vertrag mit ${offer.sponsor} unterschrieben.`;
}

// -----------------------------------------------------------------------------
// Ausgliederung & Investor (Aktion)
// -----------------------------------------------------------------------------
const OUTSOURCE_FAN: Record<ClubPhilosophy, number> = { glamour: 2, offensiv: -3, jugend: -5, kampf: -7, bodenstaendig: -8 };

export function canOutsource(g: Game): { ok: boolean; reason?: string; capital: number } {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const capital = corporateCapital(lastRevenue(club, year));
  if (year < CORPORATE_YEAR) return { ok: false, reason: `Kapitalgesellschaften sind erst ab ${CORPORATE_YEAR} erlaubt.`, capital };
  if (club.corporate) return { ok: false, reason: 'Der Profibereich ist bereits ausgegliedert.', capital };
  return { ok: true, capital };
}

export function outsource(g: Game): string {
  const chk = canOutsource(g);
  if (!chk.ok) return chk.reason ?? 'Nicht möglich.';
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  club.corporate = { since: year, investorShare: 0, capitalRaised: chk.capital };
  book(club.finances, today, chk.capital, 'other', 'Kapital aus der Ausgliederung', true);
  const fan = g.environment ? OUTSOURCE_FAN[g.environment.philosophy] - (g.environment.tradition > 70 ? 3 : 0) : 0;
  shiftFans(g, fan);
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + 8, 0, 100);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Mitgliederversammlung',
    subject: 'Profiabteilung ausgegliedert',
    shortText: `Kapital: ${formatMoney(chk.capital, year)}.`,
    bodyText: `Die Mitgliederversammlung hat der Ausgliederung zugestimmt. Der Verein hält die Mehrheit (50+1). `
      + `Fans, Sponsoren und Mitglieder zeichnen Anteile für ${formatMoney(chk.capital, year)}. `
      + `Die Geldgeber erwarten mehr: Die Saisonziele fallen ab jetzt ehrgeiziger aus.`
      + (fan < 0 ? ` In der Kurve wird über den „Ausverkauf“ diskutiert (Stimmung ${fan}).` : ''),
  }));
  return 'Ausgliederung beschlossen.';
}

export function investorQuote(g: Game, share: number): { ok: boolean; price: number; reason?: string } {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const price = investorPrice(lastRevenue(club, year), commercialMultiplier(club, year), share);
  if (!club.corporate) return { ok: false, price, reason: 'Zuerst den Profibereich ausgliedern.' };
  if (club.corporate.investorShare + share > MAX_INVESTOR_SHARE) return { ok: false, price, reason: `50+1: Höchstens ${MAX_INVESTOR_SHARE} % für Investoren.` };
  return { ok: true, price };
}

export function sellInvestorShare(g: Game, share: number): string {
  const q = investorQuote(g, share);
  if (!q.ok) return q.reason ?? 'Nicht möglich.';
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const corp = club.corporate!;
  corp.investorName ??= investorName(club);
  corp.investorShare += share;
  corp.capitalRaised += q.price;
  book(club.finances, today, q.price, 'other', `Anteilsverkauf an ${corp.investorName} (${share} %)`, true);
  const eraF = year >= 2015 ? 1.4 : year >= 2005 ? 1.2 : 1;
  const philF = g.environment?.philosophy === 'glamour' ? 0.5 : g.environment?.philosophy === 'bodenstaendig' || g.environment?.philosophy === 'kampf' ? 1.3 : 1;
  const fan = -Math.round((4 + share / 3) * eraF * philF);
  shiftFans(g, fan);
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + 4, 0, 100);
  const protest = (g.environment?.fanMood ?? 60) < 45;
  pushMessage(g.messages, makeMessage({
    date: today, category: 'board', from: 'Vorstand',
    subject: `${corp.investorName} steigt ein (${corp.investorShare} %)`,
    shortText: `Kapital: ${formatMoney(q.price, year)}.`,
    bodyText: `${corp.investorName} übernimmt weitere ${share} % der Anteile für ${formatMoney(q.price, year)} und hält jetzt ${corp.investorShare} %. `
      + 'Der Investor erwartet Rendite: Von jedem Gewinn geht sein Anteil als Ausschüttung an ihn, und die Ziele werden ehrgeiziger. '
      + `Fan-Stimmung ${fan}.` + (protest ? '\n\nIn der Kurve hängen Banner gegen den Investor – beim nächsten Heimspiel ist mit Protesten zu rechnen.' : ''),
  }));
  if (protest && g.environment) club.stadium.averageAttendanceRate = Math.max(0.3, club.stadium.averageAttendanceRate - 0.02);
  return `${share} % an ${corp.investorName} verkauft.`;
}

/** Verschiebung der Kaderstärke-Rangfolge für das Saisonziel (Erwartungsdruck der Geldgeber). */
export function expectationShift(club: Club): number {
  const c = club.corporate;
  if (!c) return 0;
  return 1 + (c.investorShare >= 25 ? 1 : 0);
}

// -----------------------------------------------------------------------------
// Saisonwechsel: Ausschüttung, Überschuldung (alle Vereine), Vorstandsgeduld
// -----------------------------------------------------------------------------
export function seasonClubBusiness(g: Game, newSeason: string, date: string): void {
  const year = yearOf(date);
  const fmt = (v: number) => formatMoney(v, year);
  const mine = g.clubs[g.managedClubId];
  const prev = prevSeason(newSeason);

  // Ausschüttung an den Investor.
  if (mine?.corporate?.investorShare) {
    const last = (mine.finances.seasonHistory ?? []).slice(-1)[0];
    const div = dividendFor(mine, last?.result ?? 0);
    if (div > 0) {
      book(mine.finances, date, -div, 'other', `Ausschüttung an ${mine.corporate.investorName}`, true);
      mine.corporate.dividendsPaid = (mine.corporate.dividendsPaid ?? 0) + div;
      pushMessage(g.messages, makeMessage({
        date, category: 'board', from: 'Finanzabteilung', subject: `Ausschüttung: ${fmt(div)}`,
        shortText: `${mine.corporate.investorShare} % des Gewinns gehen an ${mine.corporate.investorName}.`,
        bodyText: `Vom Gewinn der Saison ${prev} (${fmt(last?.result ?? 0)}) erhält ${mine.corporate.investorName} seinen Anteil von ${mine.corporate.investorShare} %.`,
      }));
    } else {
      mine.boardConfidence = clamp((mine.boardConfidence ?? 60) - 5, 0, 100);
      pushMessage(g.messages, makeMessage({
        date, category: 'board', from: mine.corporate.investorName ?? 'Investor', subject: 'Keine Rendite – der Investor ist unzufrieden',
        shortText: 'Die Saison endete ohne Gewinn.',
        bodyText: 'Ohne Gewinn gibt es keine Ausschüttung. Der Investor erwartet eine Wende und macht im Aufsichtsrat Druck (Vorstandsvertrauen −5).',
      }));
    }
  }

  // Überschuldung (alle Ligavereine).
  const aiNews: string[] = [];
  let changed = false;
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c)) continue;
    const prevDed = c.pointDeduction?.season === prev;
    const v = insolvencyVerdict(c, lastRevenue(c, year), prevDed);
    const ffp = (c.finances.ffp ??= { warnings: 0 });
    ffp.forcedRelegation = undefined;
    if (!v.points) { if (c.pointDeduction && c.pointDeduction.season !== newSeason) c.pointDeduction = undefined; continue; }
    c.pointDeduction = { season: newSeason, points: v.points, reason: 'Überschuldung' };
    if (v.relegate) { ffp.forcedRelegation = newSeason; insolvencyHaircut(c, lastRevenue(c, year)); }
    changed = true;
    if (c.id === g.managedClubId) {
      pushMessage(g.messages, makeMessage({
        date, category: 'board', from: 'Lizenzierungsausschuss',
        subject: v.relegate ? `Insolvenz: Zwangsabstieg und ${v.points} Punkte Abzug` : `${v.points} Punkte Abzug wegen Überschuldung`,
        shortText: v.text.slice(0, 90), bodyText: v.text, actionRequired: true,
      }));
    } else {
      aiNews.push(`${c.name}: ${v.points} Punkte Abzug${v.relegate ? ', Insolvenz und Zwangsabstieg zum Saisonende' : ''}`);
    }
  }
  if (aiNews.length) {
    pushMessage(g.messages, makeMessage({
      date, category: 'media', from: 'Sportpresse', subject: 'Lizenzierung: Strafen für überschuldete Vereine',
      shortText: aiNews[0], bodyText: aiNews.map((x) => `• ${x}`).join('\n'),
    }));
  }
  if (changed && g.table?.rows?.length) {
    const list = g.table.rows.map((r) => g.clubs[r.clubId]).filter(Boolean) as Club[];
    g.table = calculateTable(list, g.fixtures, g.pointSystem, g.table.season, g.table);
  }

  // Vorstandsgeduld: unter 20 halbiert der Vorstand die Transfermittel.
  if (mine && (mine.boardConfidence ?? 60) < 20) {
    mine.finances.transferBudget = Math.round(mine.finances.transferBudget * 0.5 / 10000) * 10000;
    pushMessage(g.messages, makeMessage({
      date, category: 'board', from: 'Vorstand', subject: 'Letzte Warnung des Vorstands',
      shortText: `Vertrauen nur noch ${mine.boardConfidence}. Transfermittel halbiert.`,
      bodyText: `Das Vertrauen des Vorstands liegt bei ${mine.boardConfidence} von 100. Wir halten an dir fest, aber das Transferbudget wird halbiert, `
        + 'bis die Ergebnisse stimmen. Erfülle das Saisonziel, dann wächst das Vertrauen wieder.',
      actionRequired: true,
    }));
  }
}

/** Zwangsabstieg: betroffene Vereine ans Tabellenende der Endstände setzen. */
export function applyForcedRelegation(g: Game, ordered: string[], season: string): string[] {
  const forced = ordered.filter((id) => g.clubs[id]?.finances.ffp?.forcedRelegation === season);
  if (!forced.length) return ordered;
  return [...ordered.filter((id) => !forced.includes(id)), ...forced];
}

/** Kennzahlen für die Vorstands-Seite. */
export function debtSummary(club: Club, year: number): { loans: number; ratio: number; deduction?: number } {
  const rev = Math.max(1, lastRevenue(club, year));
  const debt = Math.max(0, -club.finances.balance) + debtOf(club) * 0.25;
  return { loans: debtOf(club), ratio: debt / rev, deduction: club.pointDeduction?.points };
}
