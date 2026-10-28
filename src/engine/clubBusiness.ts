// =============================================================================
// VEREINS-UNTERNEHMEN — Stadionbau mit Kredit, Logen, Namensrechte,
// Ausgliederung & Investor, Überschuldung (Punktabzug, Zwangsabstieg)
// -----------------------------------------------------------------------------
// Reine Rechenlogik ohne UI. Beträge auf dem Konto sind NOMINAL, Preisschilder
// (Namensrechte-Jahreswert) in 1975-Basis. Ablauf im Spiel: game/clubBusiness.ts.
// =============================================================================
import { Club, ClubLoan, NamingRights, StadiumProject } from '../types';
import { economyScale, revenueScale } from './economy';
import { CAPACITY_PER_LEVEL, MAX_LEVEL, upgradeCost } from './infrastructure';
import { book } from './finances';
import { commercialMultiplier } from './clubEconomy';
import { vipAreaBoxes } from './stadiumBlocks';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Zinsen je Epoche (Bauzinsen für Vereine, grob an der Zinsgeschichte orientiert)
// -----------------------------------------------------------------------------
const RATE_ANCHORS: [number, number][] = [
  [1975, 0.085], [1981, 0.105], [1986, 0.075], [1992, 0.09], [1998, 0.06],
  [2008, 0.055], [2012, 0.035], [2016, 0.025], [2021, 0.02], [2023, 0.05], [2030, 0.045], [2060, 0.045],
];

/** Jahreszins für einen Stadionkredit im Jahr `year` (+ Risikoaufschlag bei Schulden). */
export function loanInterest(year: number, inDebt = false): number {
  let r = RATE_ANCHORS[RATE_ANCHORS.length - 1][1];
  for (let i = 0; i < RATE_ANCHORS.length - 1; i++) {
    const [y0, v0] = RATE_ANCHORS[i];
    const [y1, v1] = RATE_ANCHORS[i + 1];
    if (year <= y0) { r = v0; break; }
    if (year < y1) { r = v0 + ((v1 - v0) * (year - y0)) / (y1 - y0); break; }
  }
  return Math.round((r + (inDebt ? 0.015 : 0)) * 10000) / 10000;
}

/** Monatliche Annuität. */
export function annuity(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  if (r <= 0) return Math.round(principal / months);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}

export function makeLoan(principal: number, years: number, year: number, date: string, purpose: string, inDebt: boolean): ClubLoan {
  const annualRate = loanInterest(year, inDebt);
  const months = years * 12;
  return {
    id: `loan_${date}_${Math.round(principal)}`, purpose, principal: Math.round(principal), remaining: Math.round(principal),
    monthlyRate: annuity(principal, annualRate, months), annualRate, startDate: date, months, paidMonths: 0,
  };
}

/** Bucht die Monatsraten aller Kredite. Liefert die Summe der Raten. */
export function serviceLoans(club: Club, date: string, track: boolean): number {
  const loans = club.loans;
  if (!loans?.length) return 0;
  let total = 0;
  for (const l of loans) {
    if (l.remaining <= 0) continue;
    const interest = Math.round((l.remaining * l.annualRate) / 12);
    const pay = Math.min(l.monthlyRate, l.remaining + interest);
    l.remaining = Math.max(0, l.remaining - (pay - interest));
    l.paidMonths++;
    total += pay;
  }
  if (total > 0) book(club.finances, date, -total, 'other', 'Kreditraten (Zins + Tilgung)', track);
  club.loans = loans.filter((l) => l.remaining > 0);
  return total;
}

export const debtOf = (club: Club) => (club.loans ?? []).reduce((a, l) => a + l.remaining, 0);
export const monthlyLoanCost = (club: Club) => (club.loans ?? []).reduce((a, l) => a + l.monthlyRate, 0);

// -----------------------------------------------------------------------------
// Stadionausbau als Bauprojekt
// -----------------------------------------------------------------------------
/** Logen je Ausbaustufe nach Epoche (vor 1985 keine Logen). */
export function boxesPerLevel(year: number): number {
  if (year < 1985) return 0;
  if (year < 1993) return 8;
  if (year < 2004) return 16;
  return 28;
}

export interface StadiumPlan {
  targetLevel: number;
  addCapacity: number;
  addBoxes: number;
  buildSeasons: number;
  /** Baukosten nominal. */
  cost: number;
  label: string;
}

/** Nächster möglicher Ausbauschritt (oder null bei Maximalstufe/laufendem Bau). */
export function stadiumPlan(club: Club, year: number): StadiumPlan | null {
  if (club.stadiumProject) return null;
  const level = club.infrastructure.stadium ?? 1;
  if (level >= MAX_LEVEL) return null;
  const target = level + 1;
  const buildSeasons = target <= 3 ? 1 : target === 4 ? 2 : 3;
  // Moderne Arenen (ab 2004) sind pro Platz teurer, bringen aber mehr Logen.
  const modern = year >= 2004 ? 1.1 : 1;
  const cost = Math.round((upgradeCost('stadium', target) * economyScale(year) * modern) / 10000) * 10000;
  const label = year < 1993 ? (target >= 4 ? 'Neue Haupttribüne mit Dach' : 'Erweiterung der Stehränge')
    : year < 2004 ? 'Umbau zum reinen Fußballstadion' : 'Ausbau zur Arena';
  return { targetLevel: target, addCapacity: CAPACITY_PER_LEVEL, addBoxes: boxesPerLevel(year), buildSeasons, cost, label };
}

/** Fertigstellungsdatum: 1. Juli nach `buildSeasons` Spielzeiten. */
function finishDateFor(date: string, buildSeasons: number): string {
  const y = Number(date.slice(0, 4));
  const startSeason = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  return `${startSeason + buildSeasons}-07-01`;
}

/** Startet den Bau. Bar: Kosten sofort; Kredit: Rate über `years` Jahre. */
export function startStadiumProject(
  club: Club, plan: StadiumPlan, financing: 'cash' | 'loan', years: number, date: string, year: number, track: boolean,
): { ok: boolean; text: string } {
  if (club.stadiumProject) return { ok: false, text: 'Es läuft bereits ein Bauprojekt.' };
  if (financing === 'cash' && club.finances.balance < plan.cost) return { ok: false, text: 'Der Kontostand reicht für eine Barzahlung nicht.' };
  if (financing === 'loan') {
    // Banken geben nur Kredit, wenn die Raten tragbar sind (≈ max. 12 % des Umsatzes je Jahr).
    const rev = Math.max(1, (club.finances.seasonHistory ?? []).slice(-1)[0]?.revenue ?? 0);
    const loan = makeLoan(plan.cost, years, year, date, `Stadionausbau Stufe ${plan.targetLevel}`, club.finances.balance < 0);
    const yearly = (monthlyLoanCost(club) + loan.monthlyRate) * 12;
    if (rev > 1 && yearly > 0.12 * rev) return { ok: false, text: 'Die Bank lehnt ab: Die Kreditraten wären zu hoch für den Umsatz des Vereins.' };
    (club.loans ??= []).push(loan);
  } else {
    book(club.finances, date, -plan.cost, 'facilities', `Stadionausbau Stufe ${plan.targetLevel} (bar)`, track);
  }
  const loss = Math.round((club.stadium.capacity * 0.08) / 100) * 100;
  club.stadium.capacity -= loss;
  const p: StadiumProject = {
    targetLevel: plan.targetLevel, addCapacity: plan.addCapacity, addBoxes: plan.addBoxes,
    startDate: date, finishDate: finishDateFor(date, plan.buildSeasons), cost: plan.cost, financing, capacityLoss: loss,
  };
  club.stadiumProject = p;
  return { ok: true, text: `Baubeginn: ${plan.label}. Fertigstellung zum ${p.finishDate.slice(8, 10)}.${p.finishDate.slice(5, 7)}.${p.finishDate.slice(0, 4)}.` };
}

/** Prüft die Fertigstellung. Liefert den Text, wenn das Stadion fertig ist. */
export function advanceStadiumProject(club: Club, date: string): string | null {
  const p = club.stadiumProject;
  if (!p || date < p.finishDate) return null;
  club.stadium.capacity += p.capacityLoss + p.addCapacity;
  club.stadium.vipBoxes = (club.stadium.vipBoxes ?? 0) + p.addBoxes;
  club.stadium.condition = Math.max(club.stadium.condition, 95);
  club.infrastructure.stadium = p.targetLevel;
  club.stadiumProject = undefined;
  return `Das Stadion ist fertig: ${club.stadium.capacity.toLocaleString('de-DE')} Plätze`
    + (p.addBoxes ? `, ${club.stadium.vipBoxes} Logen` : '') + '.';
}

/** Logen-Einnahmen je Heimspiel (nominal). 1975-Basis 1.400 DM je Loge. */
export function vipIncome(club: Club, mdScale: number, year: number): number {
  const boxes = (club.stadium.vipBoxes ?? 0) + vipAreaBoxes(club);
  if (!boxes) return 0;
  return Math.round(boxes * 1400 * mdScale * clamp(commercialMultiplier(club, year), 0.6, 1.8));
}

// -----------------------------------------------------------------------------
// Namensrechte (ab 2000)
// -----------------------------------------------------------------------------
export const NAMING_RIGHTS_YEAR = 2000;
const FIRMS = [
  'Nordlicht Versicherung', 'Rheintal Energie', 'Hanse Logistik', 'Alpenblick Bank', 'Kronenquell Brauerei',
  'Westfalen Stahl', 'Mainufer Finanz', 'Elbe Telekom', 'Lindenhof Autohaus', 'Sonnwerk Solar', 'Brückner Bau',
  'Taunus Software', 'Weserwerft', 'Spreeblick Medien', 'Bergland Mobilfunk', 'Isartal Versand',
];
const ARENA = ['Arena', 'Park', 'Stadion', 'Sportpark'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Angebote für die Namensrechte (deterministisch je Saison). */
export function namingOffers(club: Club, year: number, season: string): NamingRights[] {
  if (year < NAMING_RIGHTS_YEAR) return [];
  const base = club.stadium.capacity * 2.6 * clamp(0.6 + club.reputation / 100, 0.8, 1.6);
  const out: NamingRights[] = [];
  const used = new Set<number>();
  for (let i = 0; i < 3; i++) {
    let k = hash(`${club.id}:${season}:${i}`) % FIRMS.length;
    while (used.has(k)) k = (k + 1) % FIRMS.length;
    used.add(k);
    const firm = FIRMS[k];
    const years = [3, 5, 8][i];
    const factor = [0.9, 1, 1.12][i] * (0.9 + (hash(`${firm}:${season}`) % 20) / 100);
    const word = ARENA[hash(firm) % ARENA.length];
    out.push({
      sponsor: firm, arenaName: `${firm.split(' ')[0]}-${word}`,
      annualValue: Math.round((base * factor) / 1000) * 1000, fromYear: year, untilYear: year + years,
    });
  }
  return out;
}

/** Jahreswert nominal (Vermarktungs-Skala × Marke). */
export function namingAnnualNominal(nr: NamingRights, club: Club, year: number): number {
  return Math.round(nr.annualValue * revenueScale('commercial', year) * commercialMultiplier(club, year));
}

// -----------------------------------------------------------------------------
// Ausgliederung & Investor (ab 1998, 50+1)
// -----------------------------------------------------------------------------
export const CORPORATE_YEAR = 1998;
export const MAX_INVESTOR_SHARE = 49;
const INVESTORS = ['Kessler Holding', 'Brandt & Söhne Beteiligungen', 'Atlas Sportkapital', 'Vogelsang Industrie', 'Meridian Partners', 'Falkenstein Gruppe'];

/** Einmaliges Kapital der Ausgliederung (Anteile an Fans, Sponsoren, Mitglieder): 12 % des Umsatzes. */
export function corporateCapital(revenue: number): number {
  return Math.round((revenue * 0.12) / 10000) * 10000;
}

/** Kaufpreis für weitere `share` Prozent beim Investor (nominal). */
export function investorPrice(revenue: number, brandFactor: number, share: number): number {
  return Math.round((revenue * 0.06 * share * clamp(brandFactor, 0.6, 1.8)) / 10000) * 10000;
}

export function investorName(club: Club): string {
  return INVESTORS[hash(club.id) % INVESTORS.length];
}

/** Jährliche Ausschüttung an den Investor: sein Anteil am positiven Saisonergebnis. */
export function dividendFor(club: Club, seasonResult: number): number {
  const share = club.corporate?.investorShare ?? 0;
  if (!share || seasonResult <= 0) return 0;
  return Math.round((seasonResult * share) / 100);
}

// -----------------------------------------------------------------------------
// Überschuldung: Punktabzug und Zwangsabstieg (alle Vereine)
// -----------------------------------------------------------------------------
export interface InsolvencyVerdict { points: number; relegate: boolean; text: string }

/** Insolvenzverfahren: Schuldenschnitt auf 30 % des Umsatzes, Kredite zu einem Viertel. */
export function insolvencyHaircut(club: Club, revenue: number): void {
  club.finances.balance = Math.max(club.finances.balance, -Math.round(0.3 * revenue));
  for (const l of club.loans ?? []) {
    l.remaining = Math.round(l.remaining * 0.25);
    l.monthlyRate = Math.max(1, Math.round(l.monthlyRate * 0.25));
  }
}

/**
 * Schwere der Überschuldung nach dem Verhältnis Schulden : Jahresumsatz.
 * Kontostand < −60 % → −3, < −90 % → −6, < −120 % → −9 Punkte;
 * hatte der Verein schon in der Vorsaison einen Abzug und liegt er unter −150 %,
 * folgt der Zwangsabstieg zum Saisonende.
 */
export function insolvencyVerdict(club: Club, revenue: number, prevDeduction: boolean): InsolvencyVerdict {
  const debt = -club.finances.balance + debtOf(club) * 0.25; // Kredite zählen anteilig
  const ratio = revenue > 0 ? debt / revenue : 0;
  if (ratio < 0.6) return { points: 0, relegate: false, text: '' };
  const points = ratio >= 1.2 ? 9 : ratio >= 0.9 ? 6 : 3;
  const relegate = (prevDeduction && ratio >= 1.5) || ratio >= 2.5;
  return {
    points, relegate,
    text: relegate
      ? `Die Schulden liegen bei ${Math.round(ratio * 100)} % des Jahresumsatzes. Der Verein muss Insolvenz anmelden: Im Insolvenzverfahren verzichten die Gläubiger auf den Großteil ihrer Forderungen (die Schulden sinken auf 30 % des Umsatzes), `
        + `doch der Verband zieht die Konsequenz: ${points} Punkte Abzug und Zwangsabstieg zum Saisonende.`
      : `Die Schulden liegen bei ${Math.round(ratio * 100)} % des Jahresumsatzes. Der Verband verhängt ${points} Punkte Abzug für die neue Saison. Bleibt die Lage so, droht im nächsten Jahr der Zwangsabstieg.`,
  };
}
