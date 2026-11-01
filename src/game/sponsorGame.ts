// =============================================================================
// SPONSORING 2.0 — Spielablauf: Saisonstart (Laufzeiten, Abstiegsklauseln, neue
// Angebote, KI-Abschlüsse), Monat (Verlängerungen, Pflichtreisen, Image, Ereignisse),
// Saisonende (Erfolgsprämien, Mindestplatzierung, Jugend-Klausel), Aktionen der
// Oberfläche (Unterschreiben, Verhandeln, Option ziehen, Auflösen), Migration.
// Rechnung: engine/sponsorship.ts · Daten: data/sponsorCatalog.ts.
// =============================================================================
import { SLOT_BY_ID, SPONSOR_SLOTS, industryBan, industryImage } from '../data/sponsorCatalog';
import { campDestination } from '../data/campDestinations';
import { commercialMultiplier } from '../engine/clubEconomy';
import { economyScale, formatMoney, yearOf } from '../engine/economy';
import { book, clubCommercialScale } from '../engine/finances';
import { hashStr, mulberry32 } from '../engine/leagues';
import { makeMessage, pushMessage } from '../engine/messages';
import { fanEra } from '../engine/environment';
import {
  CounterRequest, CounterResult, SPONSOR_V, campPenaltyBase, clauseLabel, counterOffer, exclusiveIndustries, makeOffers,
  offerToDeal, slotMarketValue, slotOpen,
} from '../engine/sponsorship';
import { Club } from '../types';
import type { SponsorDeal, SponsorDealOffer, SponsorSlotId } from '../types/sponsor';
import { Game } from './state';
import { ownBooking } from './trainingCampGame';
import { summerWindow, winterWindow } from './winterShared';
import { youthInvestOf } from './youthInvest';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sim = (g: Game) => !!(g as any).simAutoManage;
/** Verein wird vom Spieler geführt (Angebote statt Automatik). */
const human = (g: Game, c: Club) => c.id === g.managedClubId && !sim(g);
const isSponsorClub = (c: Club) => !c.id.startsWith('eu_') && !c.id.startsWith('w_');

export function clubTierNow(g: Game, c: Club): number {
  if (c.id.startsWith('am')) return 5;
  return g.leagues?.playerDivision?.tier ?? c.finances.leagueTier ?? 1;
}

function seasonEnd(season: string): string {
  return `${Number(season.slice(0, 4)) + 1}-06-30`;
}

function com(c: Club) {
  return c.commerce ?? (c.commerce = { cateringMode: 'verpachtung' });
}

function log(c: Club, date: string, text: string, amount?: number): void {
  const l = (com(c).sponsorLog ??= []);
  l.unshift({ date, text, amount });
  if (l.length > 30) l.length = 30;
}

function msg(g: Game, date: string, subject: string, body: string, actionRequired = false): void {
  pushMessage(g.messages, makeMessage({ date, category: 'board', from: 'Marketingabteilung', subject, shortText: body.split('\n')[0].slice(0, 110), bodyText: body, actionRequired }));
}

/** Spiegel für ältere Anzeigen (Trikot/Banden im alten Format, 1975-Basis). */
export function syncLegacy(c: Club): void {
  const k = com(c);
  const mirror = (slot: SponsorSlotId) => {
    const d = k.deals?.find((x) => x.slot === slot);
    return d ? { name: d.partner, annualValue: d.annualValue, yearsTotal: d.yearsTotal, yearsLeft: d.yearsLeft } : undefined;
  };
  k.shirtSponsor = mirror('brust');
  k.banden = mirror('banden');
  k.shirtOffers = undefined;
  k.bandenOffers = undefined;
}

/** Freie Plätze einer Fläche. */
export function freeSlots(c: Club, slot: SponsorSlotId, year: number, tier: number): number {
  const def = SLOT_BY_ID[slot];
  if (!slotOpen(def, year, tier)) return 0;
  return Math.max(0, def.count(year, tier) - (com(c).deals ?? []).filter((d) => d.slot === slot).length);
}

function addObligations(g: Game, c: Club, d: SponsorDeal, season: string, today: string): void {
  if (!human(g, c)) return;
  for (const k of d.clauses) {
    if (k.kind !== 'camp') continue;
    const w = k.window === 'summer' ? summerWindow(g, season) : winterWindow(g, season);
    if (w.to < today) continue; // Fenster schon vorbei
    const list = (com(c).campObligations ??= []);
    if (list.some((o) => o.dealId === d.id && o.season === season && o.window === k.window)) continue;
    list.push({ destId: k.destId, season, window: k.window, dealId: d.id, partner: d.partner, status: 'open' });
  }
}

/** Unterschreibt ein Angebot (prüft Platz und Exklusivität). Fehlertext oder null. */
function sign(g: Game, c: Club, o: SponsorDealOffer, today: string): string | null {
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  const k = com(c);
  const deals = (k.deals ??= []);
  if (o.renewal) {
    // Verlängerung: neue Konditionen gelten ab der nächsten Saison.
    const old = deals.find((d) => d.slot === o.slot && d.partner === o.partner);
    if (old) {
      old.yearsLeft += o.years; old.yearsTotal += o.years;
      old.next = { annualValue: o.annualValue, clauses: o.clauses.map((x) => ({ ...x })), bonuses: { ...o.bonuses } };
      if (human(g, c)) log(c, today, `Verlängert: ${old.partner} bis ${Number(g.season.slice(0, 4)) + old.yearsLeft}`, Math.round(o.annualValue * economyScale(year)));
      return null;
    }
  }
  if (freeSlots(c, o.slot, year, tier) <= 0) return `Für „${SLOT_BY_ID[o.slot].name}“ ist kein Platz frei.`;
  if (exclusiveIndustries(deals).has(o.industry)) return 'Ein laufender Vertrag sichert dieser Branche Exklusivität zu.';
  if (o.clauses.some((x) => x.kind === 'exclusive') && deals.some((d) => d.industry === o.industry)) return 'Exklusivität nicht möglich: Ein anderer Partner derselben Branche hat schon einen Vertrag.';
  const ban = industryBan(o.industry, o.slot, year);
  if (ban) return ban;
  const d = offerToDeal(o, g.season);
  d.tier = tier;
  deals.push(d);
  addObligations(g, c, d, g.season, today);
  syncLegacy(c);
  if (human(g, c)) {
    const img = d.clauses.find((x) => x.kind === 'image');
    if (img && img.kind === 'image' && g.environment) {
      const hit = img.level * 2 * fanEra(year).volatility;
      g.environment.fanMood = clamp(g.environment.fanMood - hit, 0, 100);
      msg(g, today, `Fans kritisieren den neuen Partner ${d.partner}`, `Kurve und Mitglieder sind unzufrieden: ${d.partner} gilt als umstritten. Die Fan-Stimmung sinkt um ${hit.toFixed(1)} Punkte – und bleibt belastet, solange der Vertrag läuft.`);
    }
    log(c, today, `Vertrag: ${d.partner} (${SLOT_BY_ID[d.slot].name}), ${d.yearsTotal} J.`, Math.round(d.annualValue * economyScale(year)));
  }
  return null;
}

// -----------------------------------------------------------------------------
// Saisonstart
// -----------------------------------------------------------------------------
/** Restlaufzeiten, Klauseln, Angebote, KI-Abschlüsse (aus game/season.ts, nach dem Ligen-Umbau). */
export function sponsorSeasonStart(g: Game, season: string, today: string): void {
  const year = yearOf(today);
  for (const c of Object.values(g.clubs)) {
    if (!isSponsorClub(c)) continue;
    ensureSponsorship(g, c, today, false);
    const k = com(c);
    const tier = clubTierNow(g, c);
    const oldTier = k.lastTier ?? tier;
    const notes: string[] = [];
    const keep: SponsorDeal[] = [];
    for (const d of k.deals ?? []) {
      if (d.next) { d.annualValue = d.next.annualValue; d.clauses = d.next.clauses; d.bonuses = d.next.bonuses; d.next = undefined; d.tier = tier; }
      if (d.since === season) { keep.push(d); continue; } // gerade erst (Nachrüstung) abgeschlossen
      d.yearsLeft -= 1;
      const ban = industryBan(d.industry, d.slot, year);
      if (ban) { notes.push(`${d.partner}: Vertrag endet – ${ban}.`); continue; }
      if (tier > oldTier && d.clauses.some((x) => x.kind === 'relegationExit')) { notes.push(`${d.partner} nutzt die Ausstiegsklausel nach dem Abstieg.`); continue; }
      if (d.yearsLeft <= 0) {
        // KI zieht eine Verlängerungsoption, der Spieler entscheidet im Januar.
        const opt = d.clauses.find((x) => x.kind === 'option');
        if (!human(g, c) && opt && opt.kind === 'option') {
          d.clauses = d.clauses.filter((x) => x !== opt);
          d.annualValue = Math.round(d.annualValue * (1 + opt.raise));
          d.yearsLeft = opt.years; d.yearsTotal += opt.years;
        } else { notes.push(`Vertrag mit ${d.partner} (${SLOT_BY_ID[d.slot].name}) ist ausgelaufen.`); continue; }
      }
      const rel = d.clauses.find((x) => x.kind === 'relegationCut');
      const relCut = rel && rel.kind === 'relegationCut' && tier > (d.tier ?? oldTier) ? rel.cut : 0;
      d.cut = Math.round((1 - (1 - relCut) * (1 - (d.placeCut ?? 0))) * 100) / 100 || undefined;
      keep.push(d);
    }
    k.deals = keep;
    k.lastTier = tier;
    if (human(g, c)) {
      k.dealOffers = (k.dealOffers ?? []).filter((o) => o.renewal && o.until >= today);
      k.campObligations = (k.campObligations ?? []).filter((o) => o.season >= season || o.status === 'missed').slice(-12);
      for (const d of k.deals) addObligations(g, c, d, season, today);
      const offers = generateOffers(g, c, season, today, 'start');
      k.dealOffers.push(...offers);
      if (notes.length || offers.length) {
        msg(g, today, `Sponsoring ${season}: ${offers.length} neue Angebote`,
          (notes.length ? notes.map((x) => `• ${x}`).join('\n') + '\n\n' : '')
          + (offers.length ? `Für freie Werbeflächen liegen ${offers.length} Angebote vor (Finanzen › Sponsoring). Du kannst annehmen oder nachverhandeln.` : 'Alle Werbeflächen sind vergeben.'),
          offers.length > 0);
      }
    } else {
      aiFill(g, c, season, today);
    }
    syncLegacy(c);
  }
}

/** Angebote für alle freien Flächen (eigener Verein). */
function generateOffers(g: Game, c: Club, season: string, today: string, key: string): SponsorDealOffer[] {
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  const k = com(c);
  const taken = new Set((k.dealOffers ?? []).map((o) => o.partner));
  const out: SponsorDealOffer[] = [];
  for (const def of SPONSOR_SLOTS) {
    const free = freeSlots(c, def.id, year, tier);
    if (free <= 0) continue;
    if ((k.dealOffers ?? []).some((o) => o.slot === def.id && !o.renewal)) continue;
    const n = Math.min(4, free + (def.id === 'brust' || def.id === 'ausruester' ? 2 : 1));
    const offers = makeOffers({ club: c, year, season, tier, deals: k.deals ?? [], taken, until: seasonEnd(season) }, def.id, n, key);
    offers.forEach((o) => taken.add(o.partner));
    out.push(...offers);
  }
  return out;
}

/** Angebote für alle freien Flächen des eigenen Vereins nachlegen (Tests/Screenshots). */
export function offerFreeSlots(g: Game): number {
  const c = g.clubs[g.managedClubId];
  const k = com(c);
  const fresh = generateOffers(g, c, g.season, g.calendar.currentDate, `free${g.calendar.currentDate}`);
  k.dealOffers = [...(k.dealOffers ?? []), ...fresh];
  syncLegacy(c);
  return fresh.length;
}

/** KI: freie Flächen mit dem besten von zwei Angeboten füllen (ohne Verhandlung). */
function aiFill(g: Game, c: Club, season: string, today: string): void {
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  const k = com(c);
  for (const def of SPONSOR_SLOTS) {
    let free = freeSlots(c, def.id, year, tier);
    let round = 0;
    while (free-- > 0) {
      const best = makeOffers({ club: c, year, season, tier, deals: k.deals ?? [], until: seasonEnd(season) }, def.id, 2, `ai${round++}`)[0];
      if (!best) break;
      if (sign(g, c, best, today)) break;
    }
  }
}

// -----------------------------------------------------------------------------
// Monat
// -----------------------------------------------------------------------------
export function monthlySponsoring(g: Game, today: string): void {
  const year = yearOf(today);
  const month = Number(today.slice(5, 7));
  for (const c of Object.values(g.clubs)) {
    if (!isSponsorClub(c) || !c.commerce?.deals) continue;
    worldEvents(g, c, today, year, month);
  }
  const mine = g.clubs[g.managedClubId];
  // Simulation (eigener Verein automatisch): wie die KI freie Flächen füllen.
  if (mine && sim(g)) { (com(mine).dealOffers ??= []).length = 0; aiFill(g, mine, g.season, today); syncLegacy(mine); return; }
  if (!mine || !human(g, mine)) return;
  const k = com(mine);
  ensureSponsorship(g, mine, today, false);
  // Abgelaufene Angebote entfernen.
  k.dealOffers = (k.dealOffers ?? []).filter((o) => o.until >= today);
  // Januar: Verlängerungsangebote der Partner im letzten Vertragsjahr.
  if (month === 1) renewalOffers(g, mine, today);
  // Neue Interessenten für freie Flächen (etwa jeder vierte Monat).
  const rng = mulberry32(hashStr(`spons|${mine.id}|${today}`));
  if (month !== 6 && rng() < 0.3) {
    const fresh = generateOffers(g, mine, g.season, today, `m${today}`)
      .map((o) => ({ ...o, until: minDate(addDays(today, 75), seasonEnd(g.season)) }));
    if (fresh.length) {
      const one = fresh.slice(0, 2);
      k.dealOffers.push(...one);
      msg(g, today, `Neues Sponsor-Angebot: ${one[0].partner}`, `${one[0].partner} interessiert sich für „${SLOT_BY_ID[one[0].slot].name}“ (${formatMoney(one[0].annualValue * economyScale(year), year, true)} pro Jahr).`);
    }
  }
  imageMood(g, mine, year);
  checkObligations(g, mine, today);
  if (month === 1) friendlies(g, mine, today);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
const minDate = (a: string, b: string) => (a < b ? a : b);

/** Weltereignisse: Krypto-Einbruch (FTX, 11/2022), Kriegsbeginn 2022 (russische Sponsoren). */
function worldEvents(g: Game, c: Club, today: string, year: number, month: number): void {
  const k = com(c);
  const rng = mulberry32(hashStr(`world|${c.id}|${today}`));
  const ended: string[] = [];
  k.deals = (k.deals ?? []).filter((d) => {
    if (year === 2022 && month === 3 && d.country === 'RU') { ended.push(`${d.partner}: Nach Kriegsbeginn in der Ukraine beendet der Verein die Partnerschaft.`); return false; }
    if (year === 2022 && month === 12 && d.industry === 'krypto' && rng() < 0.6) { ended.push(`${d.partner}: Die Krypto-Börse ist nach dem Markteinbruch zahlungsunfähig.`); return false; }
    return true;
  });
  if (ended.length) {
    syncLegacy(c);
    if (human(g, c)) { for (const e of ended) log(c, today, e); msg(g, today, 'Sponsor-Vertrag beendet', ended.join('\n')); }
  }
}

function renewalOffers(g: Game, c: Club, today: string): void {
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  const k = com(c);
  for (const d of k.deals ?? []) {
    if (d.yearsLeft !== 1 || (k.dealOffers ?? []).some((o) => o.renewal && o.partner === d.partner)) continue;
    if (industryBan(d.industry, d.slot, year + 1)) continue;
    const rng = mulberry32(hashStr(`renew|${d.id}|${g.season}`));
    const market = slotMarketValue(c, d.slot, year, tier) / economyScale(year);
    const value = Math.max(d.annualValue * (0.95 + rng() * 0.1), market * (0.9 + rng() * 0.15));
    const def = SLOT_BY_ID[d.slot];
    const years = def.years[0] + Math.floor(rng() * (def.years[1] - def.years[0] + 1));
    k.dealOffers!.push({
      id: `${d.id}-r${g.season}`, slot: d.slot, partner: d.partner, industry: d.industry, country: d.country,
      annualValue: Math.round(value / 500) * 500, years, bonuses: { ...d.bonuses },
      clauses: d.clauses.filter((x) => x.kind !== 'option').map((x) => (x.kind === 'image' ? { kind: 'image' as const, level: industryImage(d.industry, year, d.country) } : { ...x })).filter((x) => x.kind !== 'image' || x.level > 0),
      interest: 0.75, rounds: 0, until: `${year}-05-31`, renewal: true,
    });
    msg(g, today, `${d.partner} möchte verlängern`, `Der Vertrag mit ${d.partner} (${def.name}) läuft im Sommer aus. Der Partner bietet ${formatMoney(value * economyScale(year), year, true)} pro Jahr für ${years} weitere Saisons. Du kannst annehmen, nachverhandeln – oder den Markt testen.`, true);
  }
}

function imageMood(g: Game, c: Club, year: number): void {
  if (!g.environment) return;
  let lvl = 0;
  for (const d of c.commerce?.deals ?? []) lvl += industryImage(d.industry, year, d.country);
  if (lvl <= 0) return;
  g.environment.fanMood = clamp(g.environment.fanMood - Math.min(2, 0.25 * lvl * fanEra(year).volatility), 0, 100);
}

/** Pflichtreisen auswerten, sobald das Fenster vorbei ist; vorher erinnern. */
function checkObligations(g: Game, c: Club, today: string): void {
  const k = com(c);
  const year = yearOf(today);
  for (const o of k.campObligations ?? []) {
    if (o.status !== 'open' || o.season !== g.season) continue;
    const w = o.window === 'summer' ? summerWindow(g) : winterWindow(g);
    const dest = campDestination(o.destId);
    const booked = ownBooking(g, o.window);
    if (today < w.from && addDays(today, 45) >= w.from && !booked) {
      msg(g, today, `Erinnerung: ${o.partner} erwartet dich in ${dest?.place ?? o.destId}`, `Laut Vertrag mit ${o.partner} muss das ${o.window === 'winter' ? 'Wintertrainingslager' : 'Sommerprogramm'} in ${dest?.name ?? o.destId} stattfinden (Training › Trainingslager). Sonst wird eine Vertragsstrafe fällig.`, true);
      continue;
    }
    if (today <= w.to) continue;
    const deal = k.deals?.find((d) => d.id === o.dealId);
    if (booked && booked.destId === o.destId) {
      o.status = 'done';
      log(c, today, `Pflichtreise erfüllt: ${dest?.name ?? o.destId} (${o.partner})`);
    } else {
      o.status = 'missed';
      const pen = Math.round((deal ? campPenaltyBase(deal) : 0) * economyScale(year));
      if (pen > 0) book(c.finances, today, -pen, 'other', `Vertragsstrafe ${o.partner} (Pflicht-Trainingslager verpasst)`, true);
      log(c, today, `Pflichtreise verpasst – Vertragsstrafe an ${o.partner}`, -pen);
      msg(g, today, `Vertragsstrafe: ${o.partner}`, `Das vereinbarte Trainingslager in ${dest?.name ?? o.destId} fand nicht statt. ${o.partner} verlangt ${formatMoney(pen, year, true)} Vertragsstrafe.`);
    }
  }
}

/** Freundschaftsspiel beim Sponsor (Klausel), einmal im Winter. */
function friendlies(g: Game, c: Club, today: string): void {
  const year = yearOf(today);
  for (const d of c.commerce?.deals ?? []) {
    if (!d.clauses.some((x) => x.kind === 'friendly')) continue;
    const income = Math.round(d.annualValue * 0.03 * economyScale(year));
    book(c.finances, today, income, 'matchday', `Freundschaftsspiel bei ${d.partner}`, true);
    for (const id of c.playerIds) { const p = g.players[id]; if (p && !p.injury) p.frische = clamp((p.frische ?? 100) - 3, 30, 100); }
    log(c, today, `Freundschaftsspiel bei ${d.partner}`, income);
    msg(g, today, `Freundschaftsspiel bei ${d.partner}`, `Wie vertraglich vereinbart spielte die Mannschaft beim Sponsor ${d.partner} (Werksgelände). Einnahmen ${formatMoney(income, year, true)}, die Spieler sind etwas müde (Frische −3).`);
  }
}

// -----------------------------------------------------------------------------
// Saisonende (vor dem Bilanzabschluss, game/seasonFinance.ts)
// -----------------------------------------------------------------------------
export interface SponsorSeasonOutcome { position: number; size: number; tier: number; cupWinner: boolean; euroPoints: number; euroTitle: boolean }

export function sponsorSeasonClose(g: Game, c: Club, o: SponsorSeasonOutcome, date: string): void {
  const deals = c.commerce?.deals;
  if (!deals?.length) return;
  const year = yearOf(date);
  const scale = economyScale(year);
  const mine = human(g, c);
  const champion = o.tier <= 1 && o.position === 1;
  const survived = o.tier <= 1 && o.position > 0 && o.position <= o.size - 2;
  const lines: string[] = [];
  for (const d of [...deals]) {
    const b = d.bonuses ?? {};
    let sum = 0;
    if (champion && b.title) sum += b.title;
    if (o.cupWinner && b.cup) sum += b.cup;
    if (o.euroPoints > 0 && b.euro) sum += b.euro * (o.euroTitle ? 2 : 0.5);
    if (survived && b.survive) sum += b.survive;
    if (sum > 0) {
      const v = Math.round(sum * scale);
      book(c.finances, date, v, 'sponsorship', `Erfolgsprämie ${d.partner}`, mine);
      lines.push(`${d.partner}: ${formatMoney(v, year, true)}`);
    }
    const mp = d.clauses.find((x) => x.kind === 'minPlace');
    d.placeCut = mp && mp.kind === 'minPlace' && (o.tier > 1 || o.position > mp.place) ? mp.cut : undefined;
    if (d.placeCut && mine) log(c, date, `${d.partner}: Mindestplatzierung verfehlt, −${Math.round(d.placeCut * 100)} % nächste Saison`);
    const yc = d.clauses.find((x) => x.kind === 'youth');
    if (yc && yc.kind === 'youth' && !c.id.startsWith('am')) {
      const need = Math.min(150000, yc.share * d.annualValue);
      if (youthInvestOf(c, year).budget < need) {
        deals.splice(deals.indexOf(d), 1);
        if (mine) { log(c, date, `${d.partner} zieht sich zurück: Jugendetat zu niedrig`); lines.push(`${d.partner} beendet die Partnerschaft – der Jugendetat lag unter der vereinbarten Zweckbindung.`); }
      }
    }
  }
  syncLegacy(c);
  if (mine && lines.length) msg(g, date, 'Sponsoren: Saisonabrechnung', lines.map((x) => `• ${x}`).join('\n'));
}

// -----------------------------------------------------------------------------
// Aktionen (Oberfläche)
// -----------------------------------------------------------------------------
export function signSponsorOffer(g: Game, offerId: string): string | null {
  const c = g.clubs[g.managedClubId];
  const k = com(c);
  const o = (k.dealOffers ?? []).find((x) => x.id === offerId);
  if (!o) return 'Angebot nicht mehr gültig.';
  const err = sign(g, c, o, g.calendar.currentDate);
  if (err) return err;
  // Angebote für eine nun volle Fläche verfallen.
  const year = yearOf(g.calendar.currentDate);
  const tier = clubTierNow(g, c);
  k.dealOffers = k.dealOffers!.filter((x) => x.id !== offerId && (x.renewal ? x.partner !== o.partner : freeSlots(c, x.slot, year, tier) > 0));
  return null;
}

export function rejectSponsorOffer(g: Game, offerId: string): void {
  const k = com(g.clubs[g.managedClubId]);
  k.dealOffers = (k.dealOffers ?? []).filter((x) => x.id !== offerId);
}

export function counterSponsorOffer(g: Game, offerId: string, req: CounterRequest): CounterResult | null {
  const k = com(g.clubs[g.managedClubId]);
  const i = (k.dealOffers ?? []).findIndex((x) => x.id === offerId);
  if (i < 0) return null;
  const res = counterOffer(k.dealOffers![i], req);
  if (res.outcome === 'withdraw') k.dealOffers!.splice(i, 1);
  else k.dealOffers![i] = res.offer;
  return res;
}

/** Verlängerungsoption ziehen (letztes Vertragsjahr). */
export function exerciseOption(g: Game, dealId: string): string | null {
  const c = g.clubs[g.managedClubId];
  const d = com(c).deals?.find((x) => x.id === dealId);
  const opt = d?.clauses.find((x) => x.kind === 'option');
  if (!d || !opt || opt.kind !== 'option') return 'Keine Option vorhanden.';
  d.clauses = d.clauses.filter((x) => x !== opt);
  d.annualValue = Math.round(d.annualValue * (1 + opt.raise));
  d.yearsLeft += opt.years; d.yearsTotal += opt.years;
  com(c).dealOffers = (com(c).dealOffers ?? []).filter((o) => !(o.renewal && o.partner === d.partner));
  log(c, g.calendar.currentDate, `Option gezogen: ${d.partner} +${opt.years} J. (+${Math.round(opt.raise * 100)} %)`);
  syncLegacy(c);
  return null;
}

/** Ablöse für eine vorzeitige Auflösung (nominal): halber Restwert. */
export function terminationCost(g: Game, d: SponsorDeal): number {
  const year = yearOf(g.calendar.currentDate);
  return Math.round(d.annualValue * Math.max(1, d.yearsLeft) * 0.5 * economyScale(year));
}

export function terminateDeal(g: Game, dealId: string): string | null {
  const c = g.clubs[g.managedClubId];
  const k = com(c);
  const d = k.deals?.find((x) => x.id === dealId);
  if (!d) return 'Vertrag nicht gefunden.';
  const cost = terminationCost(g, d);
  if (c.finances.balance < cost) return 'Kontostand reicht für die Ablöse nicht.';
  const today = g.calendar.currentDate;
  book(c.finances, today, -cost, 'other', `Auflösung Sponsorvertrag ${d.partner}`, true);
  k.deals = k.deals!.filter((x) => x !== d);
  k.campObligations = (k.campObligations ?? []).filter((o) => o.dealId !== d.id || o.status !== 'open');
  if (g.environment && d.clauses.some((x) => x.kind === 'image')) g.environment.fanMood = clamp(g.environment.fanMood + 3, 0, 100);
  log(c, today, `Vertrag aufgelöst: ${d.partner}`, -cost);
  syncLegacy(c);
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  if (!(k.dealOffers ?? []).some((o) => o.slot === d.slot)) {
    k.dealOffers = [...(k.dealOffers ?? []), ...makeOffers({ club: c, year, season: g.season, tier, deals: k.deals, until: seasonEnd(g.season) }, d.slot, 2, `t${today}`)];
  }
  return null;
}

/** Monatliche Einnahmen aus allen Verträgen (Anzeige) – siehe engine/sponsorship.ts sponsorMonthly. */
export function dealLabel(d: SponsorDeal): string[] {
  return d.clauses.map(clauseLabel);
}

// -----------------------------------------------------------------------------
// Migration / neues Spiel
// -----------------------------------------------------------------------------
/**
 * Alte Spielstände: Trikot- und Bandenvertrag werden übernommen (Jahreswert so umgerechnet,
 * dass die Monatsrate gleich bleibt), weitere Flächen kommen erst zur neuen Saison, damit
 * die Vermarktungspauschale der laufenden Saison nicht doppelt zählt. `fresh` (neues Spiel):
 * alle Verträge nach dem neuen Modell.
 */
export function ensureSponsorship(g: Game, c: Club, today: string, fresh: boolean): void {
  const k = com(c);
  if (k.sponsorV === SPONSOR_V) return;
  const year = yearOf(today);
  const tier = clubTierNow(g, c);
  k.deals = [];
  if (!fresh) {
    const commScale = clubCommercialScale(c, year) * commercialMultiplier(c, year) / economyScale(year);
    const take = (slot: SponsorSlotId, old?: { name: string; annualValue: number; yearsTotal: number; yearsLeft: number }) => {
      if (!old) return;
      k.deals!.push({
        id: `d-legacy-${slot}-${c.id}`, slot, partner: old.name, industry: slot === 'banden' ? 'handel' : 'versicherung', country: 'DE',
        annualValue: Math.round(old.annualValue * commScale / 500) * 500, yearsTotal: old.yearsTotal, yearsLeft: Math.max(1, old.yearsLeft),
        since: g.season, bonuses: {}, clauses: [], tier, legacy: true,
      });
    };
    take('brust', k.shirtSponsor);
    take('banden', k.banden);
  }
  k.sponsorV = SPONSOR_V;
  k.lastTier = tier;
  k.dealOffers = [];
  k.campObligations ??= [];
  const legacyOnly = (s: SponsorSlotId) => fresh || s === 'brust' || s === 'banden' || s === 'ausruester';
  if (human(g, c)) {
    k.dealOffers = generateOffers(g, c, g.season, today, fresh ? 'new' : 'mig').filter((o) => legacyOnly(o.slot));
  } else {
    const k2 = com(c);
    for (const def of SPONSOR_SLOTS) {
      if (!legacyOnly(def.id)) continue;
      let free = freeSlots(c, def.id, year, tier);
      let r = 0;
      while (free-- > 0) {
        const best = makeOffers({ club: c, year, season: g.season, tier, deals: k2.deals ?? [], until: seasonEnd(g.season) }, def.id, 2, `init${r++}`)[0];
        if (!best || sign(g, c, best, today)) break;
      }
    }
  }
  syncLegacy(c);
}

/** Aufruf in App.tsx beim Laden (idempotent). */
export function migrateSponsorship(g: Game): void {
  for (const c of Object.values(g.clubs)) if (isSponsorClub(c)) ensureSponsorship(g, c, g.calendar.currentDate, false);
}

/** Neues Spiel (game/newGame.ts): alle Verträge nach dem neuen Modell. */
export function initSponsorship(g: Game): void {
  for (const c of Object.values(g.clubs)) if (isSponsorClub(c)) ensureSponsorship(g, c, g.calendar.currentDate, true);
  const n = g.clubs[g.managedClubId]?.commerce?.dealOffers?.length ?? 0;
  if (n) {
    msg(g, g.calendar.currentDate, `Sponsoren warten auf deine Antwort (${n} Angebote)`,
      'Trikotbrust, Ausrüster, Banden und Regionalpartner sind noch frei. Unter Finanzen › Sponsoring kannst du annehmen, ablehnen oder nachverhandeln – ohne Vertrag gibt es aus diesen Flächen kein Geld.', true);
  }
}
