// =============================================================================
// MANAGER-KI DER KONKURRENZ & KABINENFRIEDEN
// -----------------------------------------------------------------------------
// 1) Angebote: In den Transferfenstern bieten größere KI-Vereine für deine
//    Leistungsträger. Du entscheidest: annehmen, ablehnen, nachverhandeln.
//    Ein abgelehnter Wechselwunsch kostet Zufriedenheit und Moral.
// 2) Gehaltsgefüge: Wer schwächer ist, aber deutlich mehr verdient, macht
//    andere unzufrieden.
// 3) Spielzeit: Leistungsträger ohne Einsätze werden unruhig, Einsätze machen
//    zufrieden. Talente sind geduldiger.
// Alles nur für den eigenen Verein; KI-Vereine pflegen ihre Kader selbst.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { baseMarketValue } from '../engine/clubEconomy';
import { economyScale, yearOf } from '../engine/economy';
import { bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { aiMaxPay, capBase, cappedMarketValue, frenzy, softCap } from '../engine/transferMarket';
import { coefSum } from '../engine/world';
import { archiveRetired } from './archive';
import { breakPromise } from './promises';
import { squadLevel } from '../engine/contractTalks';
import { makeMessage, pushMessage } from '../engine/messages';
import { shiftMorale } from '../engine/randomEvents';
import { isForeignId } from '../engine/world';
import { Club, MessageEventRef, Player } from '../types';
import { fmtPrice } from '../ui/format';
import { transferPlayer } from './contracts';
import { CHOICE_HANDLERS } from './eventsGame';
import { repairSquadLists } from './squads';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const OFFER_DAYS = new Set(['07-08', '07-22', '08-05', '08-19', '01-06', '01-20']);
const OFFER_TYPE = 'ai_offer';

function squadOf(g: Game, club: Club): Player[] {
  return club.playerIds.map((id) => g.players[id]).filter(Boolean);
}

/** Will der Spieler den Wechsel? (größerer Verein, unzufrieden) */
function wantsMove(p: Player, own: Club, buyer: Club): boolean {
  return (buyer.reputation - own.reputation >= 5 && (p.development.ambition ?? 50) >= 55) || (p.contract.satisfaction ?? 60) < 45;
}

function pickBidder(g: Game, p: Player, own: Club, fee: number): Club | null {
  const cands = Object.values(g.clubs).filter((c) => c.id !== own.id && !isForeignId(c.id)
    && c.reputation >= Math.max(own.reputation - 4, p.overall - 6) && c.finances.transferBudget >= fee && c.playerIds.length < 30);
  if (!cands.length) return null;
  cands.sort((a, b) => b.reputation - a.reputation);
  return cands[Math.floor(Math.random() * Math.min(4, cands.length))];
}

/** Großer Auslandsverein (Spitze der stärksten Ligen Europas) als Bieter. */
function foreignBidder(g: Game): { id: string; name: string } | null {
  const w = g.world;
  if (!w) return null;
  const countries = Object.values(w.countries).filter((c) => c.active !== false && c.lastTable?.length)
    .sort((a, b) => coefSum(b.coef) - coefSum(a.coef)).slice(0, 4);
  if (!countries.length) return null;
  const c = countries[Math.floor(Math.random() * countries.length)];
  const id = c.lastTable[Math.floor(Math.random() * Math.min(3, c.lastTable.length))];
  const name = g.euroClubs?.[id]?.name;
  return name ? { id, name: `${name} (${c.name})` } : null;
}

/** An Stichtagen der Transferfenster: KI-Angebote für eigene Spieler. */
export function rollAiOffers(g: Game, today: string): void {
  if (!OFFER_DAYS.has(today.slice(5)) || (g as any).simAutoManage) return;
  const own = g.clubs[g.managedClubId];
  if (!own) return;
  const open = g.messages.filter((m) => m.eventRef?.type === OFFER_TYPE && !m.eventRef.resolved).length;
  if (open >= 2) return;
  const year = Number(today.slice(0, 4));
  const squad = squadOf(g, own);
  const level = squadLevel(squad);
  const cands = squad.filter((p) => p.age <= 31 && !p.isYouth && !p.contract.preContractClubId)
    .sort((a, b) => b.overall - a.overall).slice(0, 10);
  for (const p of cands) {
    const sat = p.contract.satisfaction ?? 60;
    const chance = clamp(0.04 + Math.max(0, p.overall - own.reputation) / 70 + Math.max(0, p.overall - level) / 90
      + (60 - sat) / 300 + (p.transferListed ? 0.3 : 0), 0.02, 0.4);
    if (Math.random() >= chance) continue;
    // Stars ziehen gelegentlich große Auslandsvereine an – die zahlen nach der Weltkurve.
    const abroad = p.overall >= 82 && Math.random() < 0.3 ? foreignBidder(g) : null;
    let buyerId: string, buyerName: string, maxPay: number, bigger: boolean;
    if (abroad) {
      const raw = cappedMarketValue(baseMarketValue(p), year, 'world');
      const cap = capBase(year, 'world');
      maxPay = Math.round(softCap(raw * (1 + Math.random() * 0.3), cap) * frenzy(raw, cap, Math.random) / 5000) * 5000;
      buyerId = 'foreign:' + abroad.id; buyerName = abroad.name; bigger = true;
    } else {
      const est = Math.round(p.contract.transferValue * 1.1);
      const buyer = pickBidder(g, p, own, est);
      if (!buyer) continue;
      maxPay = aiMaxPay(p, buyer, year, 'germany', Math.random);
      buyerId = buyer.id; buyerName = buyer.name; bigger = buyer.reputation > own.reputation;
    }
    if (maxPay <= 0) continue;
    // Ausstiegsklausel: Wer sie zahlt, bekommt den Spieler – ohne Verhandlung.
    const clause = p.contract.releaseClause;
    if (clause && maxPay >= clause) {
      const name = p.fullName;
      if (abroad) sellAbroad(g, p, own, buyerName, clause, today);
      else transferPlayer(g, p, own, g.clubs[buyerId], clause, today);
      repairSquadLists(g);
      pushMessage(g.messages, makeMessage({
        date: today, category: 'transfer', from: 'Sportdirektor', subject: `${buyerName} zieht die Ausstiegsklausel für ${name}`,
        shortText: `${fmtPrice(clause)} – der Wechsel ist nicht aufzuhalten.`,
        bodyText: `${buyerName} hat die vertraglich festgelegte Ausstiegsklausel von ${fmtPrice(clause)} gezahlt. ${name} verlässt uns.`,
      }));
      return;
    }
    const fee = Math.round(maxPay * (0.72 + Math.random() * 0.18) / 5000) * 5000;
    const wish = abroad ? (p.development.ambition ?? 50) >= 45 || sat < 55 : wantsMove(p, own, g.clubs[buyerId]);
    const msg = makeMessage({
      date: today, category: 'transfer', from: buyerName,
      subject: `${buyerName} bietet ${fmtPrice(fee)} für ${p.fullName}`,
      shortText: wish ? 'Der Spieler würde gern wechseln.' : 'Der Spieler fühlt sich bei uns wohl.',
      bodyText: `${buyerName} möchte ${p.fullName} (${p.naturalPosition}, ${p.age} J., Stärke ${p.overall}) verpflichten und bietet eine Ablöse von ${fmtPrice(fee)}. Sein Marktwert liegt bei ${fmtPrice(p.contract.transferValue)}.${abroad ? ' Auslandsvereine zahlen oft deutlich mehr als deutsche.' : ''}\n\n${wish
        ? 'Er hat signalisiert, dass ihn der Wechsel reizt. Lehnst du ab, wird er enttäuscht sein.'
        : 'Er selbst drängt nicht auf einen Wechsel.'}${p.promises?.some((x) => x.type === 'freigabe' && !x.result) && bigger ? '\n\nAchtung: Du hast ihm die Freigabe bei einem Angebot eines größeren Vereins versprochen.' : ''}\n\nDas Angebot gilt fünf Tage.`,
      actionRequired: true, relatedId: p.id,
    });
    msg.choices = [
      { id: 'annehmen', label: 'Annehmen', hint: `${fmtPrice(fee)} Ablöse` },
      { id: 'nachverhandeln', label: 'Mehr fordern (+25 %)', hint: 'Sie könnten abspringen' },
      { id: 'ablehnen', label: 'Ablehnen' },
    ];
    const ref: MessageEventRef = { type: OFFER_TYPE, playerId: p.id, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'ablehnen',
      data: { buyer: buyerId, buyerName, fee, max: maxPay, wish: wish ? 1 : 0, bigger: bigger ? 1 : 0 } };
    msg.eventRef = ref;
    pushMessage(g.messages, msg);
    return; // höchstens ein Angebot pro Stichtag
  }
}

CHOICE_HANDLERS[OFFER_TYPE] = (g, ref, choice) => {
  const p = ref.playerId ? g.players[ref.playerId] : undefined;
  const own = g.clubs[g.managedClubId];
  const buyerId = String(ref.data?.buyer ?? '');
  const foreign = buyerId.startsWith('foreign:');
  const buyer = foreign ? null : g.clubs[buyerId];
  const buyerName = String(ref.data?.buyerName ?? buyer?.name ?? 'Ausland');
  if (!p || (!foreign && !buyer) || p.clubId !== own.id) return { text: 'Das Angebot ist hinfällig.' };
  const fee = Number(ref.data?.fee ?? 0);
  const max = Number(ref.data?.max ?? fee * 1.2);
  const wish = Number(ref.data?.wish ?? 0) === 1;
  const bigger = Number(ref.data?.bigger ?? 0) === 1;
  const today = g.calendar.currentDate;
  const sell = (amount: number) => {
    if (buyer) transferPlayer(g, p, own, buyer, amount, today);
    else sellAbroad(g, p, own, buyerName, amount, today);
    repairSquadLists(g);
    return { text: `${p.fullName} wechselt für ${fmtPrice(amount)} zu ${buyerName}.` };
  };
  if (choice === 'annehmen') return sell(fee);
  if (choice === 'nachverhandeln') {
    const higher = Math.round(fee * 1.25 / 5000) * 5000;
    if (higher <= max) return sell(higher);
    if (max >= fee * 1.05 && Math.random() < 0.7) {
      const last = Math.round(max / 5000) * 5000;
      const r = sell(last);
      return { text: `${buyerName} geht nicht ganz so weit, bessert aber auf ${fmtPrice(last)} nach – du schlägst ein. ${r.text}` };
    }
    if (wish) { p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 8, 0, 100); shiftMorale(p, -1); }
    if (bigger) breakPromise(g, p, 'freigabe', today);
    return { text: `${buyerName} ist das zu teuer und zieht das Angebot zurück.${wish ? ` ${p.lastName} ist enttäuscht.` : ''}` };
  }
  if (bigger) breakPromise(g, p, 'freigabe', today);
  if (wish) {
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 14, 0, 100);
    shiftMorale(p, -1);
    return { text: `${p.lastName} ist enttäuscht, dass er nicht wechseln darf.` };
  }
  return { text: `${p.lastName} bleibt – er hatte ohnehin nicht auf einen Wechsel gedrängt.` };
};

/** Verkauf ins Ausland: Spieler verlässt das Spiel (Eckdaten bleiben im Archiv). */
export function sellAbroad(g: Game, p: Player, from: Club, toName: string, fee: number, date: string): void {
  from.playerIds = from.playerIds.filter((id) => id !== p.id);
  from.finances.transferBudget += fee;
  if (p.sellOn && g.clubs[p.sellOn.clubId]) {
    const share = Math.round(fee * p.sellOn.pct), old = g.clubs[p.sellOn.clubId];
    bookTransfer(from, share, true, `${p.fullName} (Weiterverkaufsbeteiligung)`, date, true);
    bookTransfer(old, share, false, `${p.fullName} (Weiterverkaufsbeteiligung)`, date, false);
  }
  bookTransfer(from, fee, false, p.fullName, date, from.isPlayerControlled);
  recordTransfer(p, from.name, toName, Math.round(fee * economyScale(yearOf(date))), date);
  archiveRetired(g, p, date);
  delete g.players[p.id];
}

// -----------------------------------------------------------------------------
// Kabinenfrieden (monatlich)
// -----------------------------------------------------------------------------
export function monthlySquadHarmony(g: Game, today: string): void {
  if ((g as any).simAutoManage) return;
  const own = g.clubs[g.managedClubId];
  if (!own) return;
  const squad = squadOf(g, own).filter((p) => !p.isYouth);
  if (squad.length < 12) return;
  const bySkill = [...squad].sort((a, b) => b.overall - a.overall);
  const regularCut = bySkill[10]?.overall ?? 0;
  const newlyUnhappy: { p: Player; why: string }[] = [];
  const seasonStart = today.slice(5, 7) === '07' || today.slice(5, 7) === '08';

  for (const p of squad) {
    const before = p.contract.satisfaction ?? 60;
    let delta = (60 - before) * 0.05; // langsame Rückkehr zur Mitte
    const why: string[] = [];
    // Gehaltsgefüge: schwächere Mitspieler, die deutlich mehr verdienen.
    const envy = squad.filter((x) => x.overall <= p.overall - 3 && x.contract.weeklyWage > p.contract.weeklyWage * 1.35).length;
    if (envy) { delta -= Math.min(4, 1.5 + envy); why.push('Gehaltsgefüge'); }
    // Spielzeit (nicht in der Sommerpause).
    if (!seasonStart) {
      const mins = p.development.recentMinutes ?? 0;
      if (p.overall >= regularCut && p.age >= 21) {
        if (mins < 150) { delta -= p.age >= 28 ? 5 : 4; why.push('Spielzeit'); }
        else if (mins > 420) delta += 1.5;
      } else if (mins > 300) delta += 1;
    }
    const after = clamp(before + delta, 0, 100);
    p.contract.satisfaction = Math.round(after * 10) / 10;
    if (before >= 40 && after < 40 && why.length) newlyUnhappy.push({ p, why: why.join(' und ') });
    if (after < 30 && Math.random() < 0.25) shiftMorale(p, -1);
  }
  if (newlyUnhappy.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'general', from: 'Co-Trainer',
      subject: `Unruhe in der Kabine: ${newlyUnhappy.map((x) => x.p.lastName).join(', ')}`,
      shortText: 'Unzufriedene Spieler – andere Vereine werden aufmerksam.',
      bodyText: `${newlyUnhappy.map((x) => `${x.p.fullName}: unzufrieden wegen ${x.why}`).join('\n')}\n\nUnzufriedene Spieler fordern bei Verlängerungen mehr, verlängern ungern und ziehen Angebote anderer Vereine an.`,
    }));
  }
}
