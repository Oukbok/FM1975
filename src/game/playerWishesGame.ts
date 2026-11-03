// =============================================================================
// SPIELERWÜNSCHE im Spielablauf — Kontext aus dem Spielstand, Nachrüstung,
// Vertragsklauseln (Treueprämie, Erfolgsgehalt), Rückkauf, Leihe mit Kaufoption
// -----------------------------------------------------------------------------
// Rechenlogik in engine/persona.ts + engine/playerWishes.ts. Hier: Wer ist
// Rivale, wo ist er zu Hause, wie lange ist er schon im Verein, spielt der
// Käufer international, wie dicht ist seine Position besetzt?
// =============================================================================
import { GROUP_OF } from '../engine/aiManager';
import { bookTransfer } from '../engine/finances';
import { book } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { findRivals, regionOf } from '../engine/environment';
import { makeMessage, pushMessage } from '../engine/messages';
import { personaOf } from '../engine/persona';
import { clubAppeal, ClubAppeal, promiseWeights, wageDemand, WageDemand, WishCtx, WishPromise } from '../engine/playerWishes';
import { isLeagueClub } from '../engine/clubEconomy';
import { CalendarEngine } from '../engine/calendar';
import { recordTransfer } from '../engine/history';
import { Club, Player } from '../types';
import { fmtPrice, fmtWage } from '../ui/format';
import { CHOICE_HANDLERS } from './eventsGame';
import { repairSquadLists } from './squads';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// -----------------------------------------------------------------------------
// Kontext
// -----------------------------------------------------------------------------
const rivalCache = new WeakMap<object, { key: string; map: Map<string, string[]> }>();
/** Rivalen je Verein (Derby-Region, wie im Vereinsumfeld). Zwischengespeichert je Saison. */
export function rivalsOf(g: Game, clubId: string): string[] {
  const key = `${g.season}|${Object.keys(g.clubs).length}`;
  let c = rivalCache.get(g.clubs);
  if (!c || c.key !== key) { c = { key, map: new Map() }; rivalCache.set(g.clubs, c); }
  let r = c.map.get(clubId);
  if (!r) {
    const club = g.clubs[clubId];
    r = club ? findRivals(club, Object.values(g.clubs).filter(isLeagueClub)).slice(0, 2) : [];
    c.map.set(clubId, r);
  }
  return r;
}

/** Stadt eines Vereins (auch unterklassige Sim-Vereine). */
function cityOf(g: Game, id?: string): string {
  if (!id) return '';
  return g.clubs[id]?.city ?? (g.simClubs?.[id] as { city?: string } | undefined)?.city ?? '';
}

/** Heimatregion des Spielers (Herkunftsverein), leer bei Ausländern ohne deutschen Herkunftsverein. */
export function homeRegionOf(g: Game, p: Player): string {
  const pe = personaOf(p);
  const city = cityOf(g, pe.homeClubId ?? pe.originClubId);
  const foreign = p.nationality && p.nationality !== 'GER';
  if (!city || (foreign && !pe.homeClubId)) return '';
  const r = regionOf(city);
  return r === 'Sonstige' ? `Raum ${city}` : r;
}
function inRegion(g: Game, region: string, clubId: string): boolean {
  if (!region) return false;
  const city = cityOf(g, clubId);
  const r = regionOf(city);
  return r === 'Sonstige' ? region === `Raum ${city}` : r === region;
}

/** Jahre beim jetzigen Verein (letzter Wechsel; Startspieler: aus der ID geschätzt). */
export function yearsAtClub(p: Player, today: string): number {
  const t = p.history?.transfers;
  const last = t?.length ? t[t.length - 1].date : undefined;
  if (last) return Math.max(0, (Date.parse(today + 'T00:00:00Z') - Date.parse(last + 'T00:00:00Z')) / (365.25 * 86400000));
  const pe = personaOf(p);
  if (pe.homeClubId === p.clubId) return Math.max(1, p.age - 18);
  return 1 + ((p.id.length * 7 + p.age) % 6);
}

/** Spielt der Verein (voraussichtlich) international? */
export function playsEurope(g: Game, clubId: string): boolean {
  const cups = g.euroCups;
  if (cups && [cups.ec, cups.cwc, cups.uefa].some((c) => c?.participantIds.includes(clubId))) return true;
  const rows = g.table?.rows ?? [];
  const pos = rows.findIndex((r) => r.clubId === clubId) + 1;
  const played = rows[0]?.played ?? 0;
  return pos > 0 && pos <= 4 && played >= 8 && (g.leagues?.playerDivision?.tier ?? 1) === 1;
}

/** Spieler seiner Positionsgruppe, die beim Käufer besser sind. */
export function depthRankAt(g: Game, p: Player, buyer: Club): number {
  const grp = GROUP_OF[p.naturalPosition];
  return buyer.playerIds.reduce((n, id) => {
    const x = g.players[id];
    return x && x.id !== p.id && GROUP_OF[x.naturalPosition] === grp && x.overall > p.overall ? n + 1 : n;
  }, 0);
}

export interface WishOpts { freeAgent?: boolean; abroad?: boolean; buyerTier?: number }

export function wishCtxFor(g: Game, p: Player, buyer: Club, o: WishOpts = {}): WishCtx {
  const today = g.calendar.currentDate;
  const current = g.clubs[p.clubId] ?? null;
  const pe = personaOf(p);
  const home = homeRegionOf(g, p);
  const rivCur = current ? rivalsOf(g, current.id) : [];
  const rivHome = pe.homeClubId && g.clubs[pe.homeClubId] ? rivalsOf(g, pe.homeClubId) : [];
  return {
    year: yearOf(today), current, buyer,
    buyerTier: o.buyerTier ?? (g.leagues?.playerDivision?.tier ?? 1),
    buyerEuro: playsEurope(g, buyer.id),
    depthRank: depthRankAt(g, p, buyer),
    rivalOfCurrent: rivCur.slice(0, 1).includes(buyer.id),
    rivalOfHome: !!pe.homeClubId && pe.homeClubId !== buyer.id && rivHome.slice(0, 1).includes(buyer.id),
    buyerInHome: inRegion(g, home, buyer.id),
    currentInHome: !!current && inRegion(g, home, current.id),
    abroad: !!o.abroad,
    yearsAtClub: yearsAtClub(p, today),
    freeAgent: !!o.freeAgent,
    coachRep: buyer.coach?.reputation,
  };
}

export interface Wishes { ctx: WishCtx; appeal: ClubAppeal; demand: WageDemand; promises: [WishPromise, number][] }

/** Alles, was ein Spieler über einen möglichen Wechsel denkt (deterministisch). */
export function wishesFor(g: Game, p: Player, buyer: Club, o: WishOpts = {}): Wishes {
  const ctx = wishCtxFor(g, p, buyer, o);
  const appeal = clubAppeal(p, ctx);
  const demand = wageDemand(p, buyer, ctx.year, appeal, ctx.freeAgent, p.clubId !== buyer.id);
  const promises = promiseWeights(p, { depthRank: ctx.depthRank, buyerRep: buyer.reputation, foreignMove: !!p.nationality && p.nationality !== 'GER', rivals: rivalsOf(g, buyer.id).length > 0 });
  return { ctx, appeal, demand, promises };
}

/** Will er zu diesem Verein? (KI-Entscheidung mit etwas Zufall) */
export function willJoin(g: Game, p: Player, buyer: Club, rng: () => number, o: WishOpts = {}): { ok: boolean; wishes: Wishes } {
  const w = wishesFor(g, p, buyer, o);
  if (w.appeal.dealBreaker) return { ok: false, wishes: w };
  return { ok: w.appeal.score + (rng() - 0.5) * 14 >= 45, wishes: w };
}

/** Bester Wunschverein aus einer Liste (für ablösefreie Spieler/Vorverträge). */
export function preferredClub(g: Game, p: Player, cands: Club[], rng: () => number): Club | null {
  let best: Club | null = null, bestS = -1;
  for (const c of cands) {
    const w = wishesFor(g, p, c, { freeAgent: true });
    if (w.appeal.dealBreaker) continue;
    const s = w.appeal.score + rng() * 10;
    if (s > bestS) { bestS = s; best = c; }
  }
  return bestS >= 40 ? best : null;
}

/** Würde der Verein ihn brauchen? (Platz im Kader, er wäre unter den besten 16 bzw. in seiner Gruppe nicht überzählig) */
export function clubWants(g: Game, p: Player, c: Club): boolean {
  if (c.playerIds.length >= 26) return false;
  const sq = c.playerIds.map((id) => g.players[id]).filter(Boolean);
  const ovr = sq.map((x) => x.overall).sort((a, b) => b - a);
  if (p.overall < (ovr[15] ?? 0)) return false;
  const grp = GROUP_OF[p.naturalPosition];
  const same = sq.filter((x) => GROUP_OF[x.naturalPosition] === grp && x.overall >= p.overall - 2).length;
  return same <= (grp === 'TW' ? 2 : grp === 'ZM' ? 5 : 4);
}

/**
 * Wohin geht ein Spieler ohne Vertrag? Kandidaten: Ligavereine, die ihn
 * brauchen; er wählt nach seinen Wünschen (Größe, Stammplatz, Heimat …).
 */
export function freeAgentDestination(g: Game, p: Player, exclude: string, rng: () => number): Club | null {
  const cands = Object.values(g.clubs).filter((c) => isLeagueClub(c) && c.id !== exclude && c.id !== g.managedClubId && clubWants(g, p, c));
  return preferredClub(g, p, cands, rng);
}

// -----------------------------------------------------------------------------
// Nachrüstung alter Spielstände
// -----------------------------------------------------------------------------
/** Persönlichkeit für alle Spieler nachrüsten (idempotent). */
export function migratePersonas(g: Game): number {
  let n = 0;
  for (const p of [...Object.values(g.players), ...Object.values(g.youthPlayers ?? {})]) {
    if (!p.persona) { personaOf(p); n++; }
  }
  return n;
}

// -----------------------------------------------------------------------------
// Vertragsklauseln: Treueprämie, Erfolgsgehalt (30. Juni), Leihen
// -----------------------------------------------------------------------------
export function contractClausesDaily(g: Game, today: string): void {
  // 29.6.: der 30.6. wird als Tag nicht mehr verarbeitet (Saison gilt dann schon als beendet, siehe aiLoans.ts).
  if (today.slice(5) !== '06-29') return;
  const own = g.clubs[g.managedClubId];
  if (!own) return;
  const scale = economyScale(yearOf(today));
  const pos = g.table.rows.findIndex((r) => r.clubId === own.id) + 1;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const end = `${today.slice(0, 4)}-06-30`; // Verträge/Leihen enden am 30.6.
  for (const id of own.playerIds) {
    const p = g.players[id];
    if (!p) continue;
    if (p.contract.successRaise && tier === 1 && pos > 0 && pos <= 5) {
      const old = p.contract.weeklyWage;
      p.contract.weeklyWage = Math.round(old * (1 + p.contract.successRaise));
      pushMessage(g.messages, makeMessage({
        date: today, category: 'contract', from: 'Sportdirektor', subject: `Erfolgsklausel: ${p.fullName} verdient mehr`,
        shortText: `Platz ${pos} – sein Gehalt steigt auf ${fmtWage(p.contract.weeklyWage)}.`,
        bodyText: `Vertraglich vereinbart: Bei einem Europapokal-Platz steigt das Gehalt von ${p.fullName} um ${Math.round(p.contract.successRaise * 100)} %. Neu: ${fmtWage(p.contract.weeklyWage)} statt ${fmtWage(old, { unit: false })}.`,
      }));
      p.contract.successRaise = undefined;
    }
    if (p.contract.loyaltyBonus && p.contract.expiryDate <= end) {
      book(own.finances, today, -Math.round(p.contract.loyaltyBonus * scale), 'other', `Treueprämie ${p.fullName}`, true);
      p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 6, 0, 100);
      p.contract.loyaltyBonus = undefined;
    }
  }
  loanSeasonEnd(g, today, end);
}

const LOAN_TYPE = 'loan_option';

/** Saisonende: Für jeden Leihspieler entscheidest du über die Kaufoption. */
function loanSeasonEnd(g: Game, today: string, end: string): void {
  const own = g.clubs[g.managedClubId];
  for (const id of own.playerIds) {
    const p = g.players[id];
    if (!p?.loan || p.loan.until > end) continue;
    const parent = g.clubs[p.loan.fromClubId];
    const msg = makeMessage({
      date: today, category: 'transfer', from: 'Sportdirektor', subject: `Kaufoption für ${p.fullName}`,
      shortText: `Die Leihe von ${parent?.name ?? 'seinem Verein'} endet. Kaufoption: ${fmtPrice(p.loan.optionFee)}.`,
      bodyText: `Die Leihe von ${p.fullName} endet am 30. Juni. Du kannst die vereinbarte Kaufoption über ${fmtPrice(p.loan.optionFee)} ziehen – dann bleibt er fest. Sonst kehrt er zu ${parent?.name ?? 'seinem Verein'} zurück.\n\nOhne Antwort kehrt er nach drei Tagen zurück.`,
      actionRequired: true, relatedId: p.id,
    });
    msg.choices = [{ id: 'kaufen', label: 'Kaufoption ziehen', hint: fmtPrice(p.loan.optionFee) }, { id: 'zurueck', label: 'Zurückgeben' }];
    msg.eventRef = { type: LOAN_TYPE, playerId: p.id, deadline: CalendarEngine.addDays(today, 3), defaultChoice: 'zurueck', data: {} };
    pushMessage(g.messages, msg);
  }
}

CHOICE_HANDLERS[LOAN_TYPE] = (g, ref, choice) => {
  const p = ref.playerId ? g.players[ref.playerId] : undefined;
  const own = g.clubs[g.managedClubId];
  if (!p?.loan || p.clubId !== own.id) return { text: 'Die Leihe ist bereits abgewickelt.' };
  const parent = g.clubs[p.loan.fromClubId];
  const today = g.calendar.currentDate;
  if (choice === 'kaufen' && parent) {
    const fee = p.loan.optionFee;
    if (fee > own.finances.transferBudget) return endLoan(g, p, own, parent, today, 'Das Transferbudget reicht nicht für die Kaufoption.');
    own.finances.transferBudget -= fee;
    parent.finances.transferBudget += fee;
    bookTransfer(own, fee, true, `${p.fullName} (Kaufoption)`, today, true);
    bookTransfer(parent, fee, false, `${p.fullName} (Kaufoption)`, today, false);
    recordTransfer(p, parent.name, own.name, Math.round(fee * economyScale(yearOf(today))), today);
    p.loan = undefined;
    return { text: `${p.fullName} bleibt fest – Kaufoption über ${fmtPrice(fee)} gezogen.` };
  }
  return parent ? endLoan(g, p, own, parent, today) : { text: 'Der Stammverein existiert nicht mehr – er bleibt.' };
};

function endLoan(g: Game, p: Player, own: Club, parent: Club, today: string, why = ''): { text: string } {
  own.playerIds = own.playerIds.filter((x) => x !== p.id);
  parent.playerIds.push(p.id);
  p.clubId = parent.id;
  p.contract.weeklyWage = p.loan?.wage ?? p.contract.weeklyWage;
  p.loan = undefined;
  p.promises = (p.promises ?? []).filter((x) => x.result);
  recordTransfer(p, own.name, parent.name, 0, today, 'back');
  repairSquadLists(g);
  return { text: `${why ? why + ' ' : ''}${p.fullName} kehrt zu ${parent.name} zurück.` };
}

/** Rückkaufoption: der frühere Verein holt ihn zurück, wenn er stark geworden ist (KI, Sommerfenster). */
export function buyBackDaily(g: Game, today: string, transfer: (p: Player, from: Club, to: Club, fee: number) => void): void {
  if (today.slice(5) !== '07-15') return;
  for (const p of Object.values(g.players)) {
    const bb = p.contract.buyBack;
    if (!bb) continue;
    if (bb.until < today) { p.contract.buyBack = undefined; continue; }
    const from = g.clubs[p.clubId], to = g.clubs[bb.clubId];
    if (!from || !to || to.id === g.managedClubId || to.id === from.id) continue;
    if (p.contract.transferValue < bb.fee * 1.25 || to.finances.transferBudget < bb.fee) continue;
    const name = p.fullName;
    p.contract.buyBack = undefined;
    transfer(p, from, to, bb.fee);
    if (from.id === g.managedClubId) {
      pushMessage(g.messages, makeMessage({
        date: today, category: 'transfer', from: 'Sportdirektor', subject: `${to.name} zieht die Rückkaufoption für ${name}`,
        shortText: `${fmtPrice(bb.fee)} – vertraglich vereinbart, der Wechsel ist nicht aufzuhalten.`,
        bodyText: `Beim Kauf von ${name} hatten wir ${to.name} eine Rückkaufoption über ${fmtPrice(bb.fee)} eingeräumt. Sie haben sie gezogen.`,
      }));
    }
  }
}
