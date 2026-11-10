// =============================================================================
// ANTEILSEIGNER DER PROFI-GESELLSCHAFT (Wunsch Pascal, #43)
// -----------------------------------------------------------------------------
// Neben dem Finanzinvestor (game/clubBusiness.ts) können ab der Ausgliederung
// auch Sponsoren Anteile kaufen – nach Vorbild der strategischen Partner großer
// Vereine (Sportartikler, Autobauer, Versicherer mit je rund 8–10 %).
//   Bonus: höherer Sponsorvertrag (+8 %), zwei Jahre Verlängerung, zuverlässige
//          Verlängerung solange sie Anteile halten, Rückendeckung im Aufsichtsrat
//          bei Erfolg (Vorstandsvertrauen schwankt stärker nach oben).
//   Malus: Dividende wie der Investor, Kritik im Aufsichtsrat bei Misserfolg
//          (Vertrauen schwankt stärker nach unten), Vertrag nicht kündbar.
// Rückkauf: Anteile (Investor und Partner) lassen sich zum Marktwert mit 20 %
// Aufschlag zurückkaufen. Sind alle Anteile beim Verein, kann die Mitglieder-
// versammlung die Rückführung in den e. V. beschließen (Einbringung des
// Geschäftsbetriebs in den Verein, Auflösung der Gesellschaft – rechtlich
// möglich, kostet Steuern/Beratung ≈ 3 % des Umsatzes).
// 50+1: Investor + Partner zusammen höchstens 49 %.
// =============================================================================
import type { Game } from './state';
import type { Club, CorporatePartner } from '../types';
import type { SponsorDeal } from '../types/sponsor';
import { investorPrice, MAX_INVESTOR_SHARE } from '../engine/clubBusiness';
import { commercialMultiplier, lastRevenue } from '../engine/clubEconomy';
import { book } from '../engine/finances';
import { formatMoney, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Flächen, deren Sponsoren als strategische Partner einsteigen. */
export const PARTNER_SLOTS = ['brust', 'ausruester', 'premium', 'copartner'] as const;
export const PARTNER_SHARES = [5, 8, 10];
export const BUYBACK_PREMIUM = 1.2;
export const PARTNER_PREMIUM = 1.1;
/** Kosten der Rückführung in den e. V. (Steuern, Beratung, Notar) in Anteilen des Jahresumsatzes. */
export const REINTEGRATION_COST = 0.03;
/** Stärkere Ausschläge des Vorstandsvertrauens je Sitz im Aufsichtsrat. */
export const SEAT_SWING = 0.2;

export const partnersOf = (club: Club): CorporatePartner[] => club.corporate?.partners ?? [];
export const externalShare = (club: Club): number => (club.corporate?.investorShare ?? 0) + partnersOf(club).reduce((a, p) => a + p.share, 0);
/** Sitze externer Anteilseigner im Aufsichtsrat: je Partner einer, Investor ab 10 %. */
export const boardSeats = (club: Club): number => partnersOf(club).length + ((club.corporate?.investorShare ?? 0) >= 10 ? 1 : 0);

function priceFor(g: Game, share: number, f: number): number {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  return Math.round((investorPrice(lastRevenue(club, year), commercialMultiplier(club, year), share) * f) / 10000) * 10000;
}
const shiftFans = (g: Game, d: number) => { if (g.environment) g.environment.fanMood = clamp(g.environment.fanMood + d, 0, 100); };
const msg = (g: Game, from: string, subject: string, shortText: string, bodyText: string) =>
  pushMessage(g.messages, makeMessage({ date: g.calendar.currentDate, category: 'board', from, subject, shortText, bodyText }));

// ---------------------------------------------------------------- Partner-Angebote
export interface PartnerOffer { deal: SponsorDeal; share: number; price: number; ok: boolean; reason?: string }

/** Sponsoren der großen Flächen, die Anteile kaufen würden (je Größe ein Angebot). */
export function partnerOffers(g: Game): PartnerOffer[] {
  const club = g.clubs[g.managedClubId];
  if (!club.corporate) return [];
  const held = new Set(partnersOf(club).map((p) => p.name));
  const deals = (club.commerce?.deals ?? []).filter((d) => (PARTNER_SLOTS as readonly string[]).includes(d.slot) && !held.has(d.partner) && d.yearsLeft >= 1);
  const free = MAX_INVESTOR_SHARE - externalShare(club);
  const out: PartnerOffer[] = [];
  for (const deal of deals) {
    for (const share of PARTNER_SHARES) {
      const ok = share <= free;
      out.push({ deal, share, price: priceFor(g, share, PARTNER_PREMIUM), ok, reason: ok ? undefined : `50+1: noch ${Math.max(0, free)} % frei.` });
    }
  }
  return out;
}

export function sellPartnerShare(g: Game, dealId: string, share: number): string {
  const club = g.clubs[g.managedClubId];
  const corp = club.corporate;
  if (!corp) return 'Zuerst den Profibereich ausgliedern.';
  const o = partnerOffers(g).find((x) => x.deal.id === dealId && x.share === share);
  if (!o) return 'Kein Angebot.';
  if (!o.ok) return o.reason ?? 'Nicht möglich.';
  const year = yearOf(g.calendar.currentDate);
  const d = o.deal;
  (corp.partners ??= []).push({ name: d.partner, slot: d.slot, share, since: year, paid: o.price });
  corp.capitalRaised += o.price;
  book(club.finances, g.calendar.currentDate, o.price, 'other', `Anteilsverkauf an ${d.partner} (${share} %)`, true);
  // Bonus: strategische Partnerschaft – Vertrag aufgewertet und verlängert.
  d.annualValue = Math.round(d.annualValue * 1.08);
  if (d.next) d.next.annualValue = Math.round(d.next.annualValue * 1.08);
  d.yearsLeft += 2; d.yearsTotal += 2;
  shiftFans(g, -Math.round(1 + share / 5));
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + 3, 0, 100);
  msg(g, 'Vorstand', `${d.partner} wird Anteilseigner (${share} %)`, `Kapital: ${formatMoney(o.price, year)}.`,
    `${d.partner} übernimmt ${share} % der Profi-Gesellschaft für ${formatMoney(o.price, year)} und bekommt einen Sitz im Aufsichtsrat. `
    + 'Der Sponsorvertrag steigt um 8 % und läuft zwei Jahre länger; solange der Partner Anteile hält, verlängert er zuverlässig. '
    + 'Dafür redet er mit: Läuft es gut, stärkt der Aufsichtsrat dem Vorstand den Rücken, läuft es schlecht, wächst die Kritik schneller. '
    + 'Von jedem Gewinn erhält er seinen Anteil, und der Vertrag ist nicht mehr kündbar.');
  return `${share} % an ${d.partner} verkauft.`;
}

// ---------------------------------------------------------------- Rückkauf
export type Holder = { kind: 'investor'; name: string; share: number } | { kind: 'partner'; name: string; share: number };

export function holders(club: Club): Holder[] {
  const c = club.corporate;
  if (!c) return [];
  const out: Holder[] = [];
  if (c.investorShare) out.push({ kind: 'investor', name: c.investorName ?? 'Investor', share: c.investorShare });
  for (const p of partnersOf(club)) out.push({ kind: 'partner', name: p.name, share: p.share });
  return out;
}

export function buybackQuote(g: Game, name: string): { ok: boolean; price: number; share: number; reason?: string } {
  const club = g.clubs[g.managedClubId];
  const h = holders(club).find((x) => x.name === name);
  if (!h) return { ok: false, price: 0, share: 0, reason: 'Kein Anteilseigner.' };
  const price = priceFor(g, h.share, BUYBACK_PREMIUM);
  if (club.finances.balance < price) return { ok: false, price, share: h.share, reason: 'Kontostand reicht für den Rückkauf nicht.' };
  return { ok: true, price, share: h.share };
}

export function buyBackShares(g: Game, name: string): string {
  const club = g.clubs[g.managedClubId];
  const corp = club.corporate;
  const q = buybackQuote(g, name);
  if (!corp || !q.ok) return q.reason ?? 'Nicht möglich.';
  const year = yearOf(g.calendar.currentDate);
  book(club.finances, g.calendar.currentDate, -q.price, 'other', `Rückkauf der Anteile von ${name} (${q.share} %)`, true);
  if (corp.investorName === name && corp.investorShare) corp.investorShare = 0;
  else corp.partners = partnersOf(club).filter((p) => p.name !== name);
  shiftFans(g, Math.round(2 + q.share / 6));
  msg(g, 'Vorstand', `Anteile zurückgekauft: ${name}`, `${q.share} % für ${formatMoney(q.price, year)}.`,
    `Der Verein kauft die ${q.share} % von ${name} für ${formatMoney(q.price, year)} zurück (Marktwert plus Aufschlag). `
    + 'Der Sitz im Aufsichtsrat entfällt, Ausschüttungen an diesen Anteilseigner gibt es nicht mehr. In der Kurve wird das gern gesehen.'
    + (externalShare(club) === 0 ? ' Alle Anteile liegen jetzt wieder beim Verein – die Mitgliederversammlung könnte die Rückführung in den e. V. beschließen.' : ''));
  return `Anteile von ${name} zurückgekauft.`;
}

// ---------------------------------------------------------------- Rückführung in den e. V.
export function reintegrationQuote(g: Game): { ok: boolean; cost: number; reason?: string } {
  const club = g.clubs[g.managedClubId];
  const year = yearOf(g.calendar.currentDate);
  const cost = Math.round((lastRevenue(club, year) * REINTEGRATION_COST) / 10000) * 10000;
  if (!club.corporate) return { ok: false, cost, reason: 'Der Verein ist bereits ein e. V.' };
  if (externalShare(club) > 0) return { ok: false, cost, reason: 'Erst alle Anteile zurückkaufen.' };
  if (club.finances.balance < cost) return { ok: false, cost, reason: 'Kontostand reicht für die Kosten nicht.' };
  return { ok: true, cost };
}

export function reintegrate(g: Game): string {
  const club = g.clubs[g.managedClubId];
  const q = reintegrationQuote(g);
  if (!q.ok || !club.corporate) return q.reason ?? 'Nicht möglich.';
  const year = yearOf(g.calendar.currentDate);
  const c = club.corporate;
  book(club.finances, g.calendar.currentDate, -q.cost, 'other', 'Rückführung in den e. V. (Steuern, Beratung)', true);
  (club.corporateHistory ??= []).push({ since: c.since, until: year, capitalRaised: c.capitalRaised, dividendsPaid: c.dividendsPaid ?? 0 });
  club.corporate = undefined;
  const trad = (g.environment?.tradition ?? 50) > 60 ? 3 : 0;
  shiftFans(g, 5 + trad);
  if (g.environment) g.environment.identity = clamp(g.environment.identity + 4, 0, 100);
  club.boardConfidence = clamp((club.boardConfidence ?? 60) - 3, 0, 100);
  msg(g, 'Mitgliederversammlung', 'Zurück zum eingetragenen Verein', `Kosten: ${formatMoney(q.cost, year)}.`,
    `Die Mitglieder haben mit großer Mehrheit zugestimmt: Die Profi-Gesellschaft bringt ihren Geschäftsbetrieb in den Verein ein und wird aufgelöst. `
    + `Steuern, Beratung und Notar kosten ${formatMoney(q.cost, year)}. Die Saisonziele werden wieder bodenständiger, die Fans feiern die Rückkehr – `
    + 'neues Kapital über Anteile gibt es aber erst nach einer erneuten Ausgliederung.');
  return 'Rückführung in den e. V. beschlossen.';
}

// ---------------------------------------------------------------- Spielablauf
/** Saisonwechsel: Ausschüttung an Partner, Verlängerung ihrer Verträge. */
export function corporateSeason(g: Game, date: string, lastResult: number): void {
  const club = g.clubs[g.managedClubId];
  const ps = partnersOf(club);
  if (!club.corporate || !ps.length) return;
  const year = yearOf(date);
  for (const p of ps) {
    const div = lastResult > 0 ? Math.round((lastResult * p.share) / 100) : 0;
    if (div > 0) {
      book(club.finances, date, -div, 'other', `Ausschüttung an ${p.name}`, true);
      club.corporate.dividendsPaid = (club.corporate.dividendsPaid ?? 0) + div;
    }
    const deal = (club.commerce?.deals ?? []).find((d) => d.partner === p.name);
    if (deal && deal.yearsLeft <= 1) {
      deal.yearsLeft += 2; deal.yearsTotal += 2;
      pushMessage(g.messages, makeMessage({ date, category: 'board', from: p.name, subject: `${p.name} verlängert als Anteilseigner`,
        shortText: 'Der Vertrag läuft zwei Jahre länger.', bodyText: `Als Anteilseigner (${p.share} %) verlängert ${p.name} den Vertrag um zwei Jahre zu den bisherigen Konditionen. Ausschüttung der Saison: ${formatMoney(div, year)}.` }));
    }
  }
}

/** Monatlich: Aufsichtsrat verstärkt die Bewegung des Vorstandsvertrauens (Bonus bei Erfolg, Malus bei Misserfolg). */
export function boardSeatSwing(club: Club, boardDelta: number): number {
  const seats = boardSeats(club);
  if (!seats || !boardDelta) return 0;
  const extra = boardDelta * SEAT_SWING * seats;
  club.boardConfidence = Math.round(clamp((club.boardConfidence ?? 60) + extra, 0, 100));
  return extra;
}

/** Sponsorvertrag eines Anteilseigners ist nicht kündbar. */
export function partnerLock(club: Club, partner: string): string | null {
  return partnersOf(club).some((p) => p.name === partner) ? `${partner} ist Anteilseigner – erst die Anteile zurückkaufen.` : null;
}
