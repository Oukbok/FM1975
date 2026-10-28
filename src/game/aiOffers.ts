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

/** An Stichtagen der Transferfenster: KI-Angebote für eigene Spieler. */
export function rollAiOffers(g: Game, today: string): void {
  if (!OFFER_DAYS.has(today.slice(5)) || (g as any).simAutoManage) return;
  const own = g.clubs[g.managedClubId];
  if (!own) return;
  const open = g.messages.filter((m) => m.eventRef?.type === OFFER_TYPE && !m.eventRef.resolved).length;
  if (open >= 2) return;
  const squad = squadOf(g, own);
  const level = squadLevel(squad);
  const cands = squad.filter((p) => p.age <= 31 && !p.isYouth && !p.contract.preContractClubId)
    .sort((a, b) => b.overall - a.overall).slice(0, 10);
  for (const p of cands) {
    const sat = p.contract.satisfaction ?? 60;
    const chance = clamp(0.04 + Math.max(0, p.overall - own.reputation) / 70 + Math.max(0, p.overall - level) / 90
      + (60 - sat) / 300 + (p.transferListed ? 0.3 : 0), 0.02, 0.4);
    if (Math.random() >= chance) continue;
    const fee = Math.round(p.contract.transferValue * (0.95 + Math.random() * 0.45));
    const buyer = pickBidder(g, p, own, fee);
    if (!buyer) continue;
    const wish = wantsMove(p, own, buyer);
    const msg = makeMessage({
      date: today, category: 'transfer', from: buyer.name,
      subject: `${buyer.name} bietet ${fmtPrice(fee)} für ${p.fullName}`,
      shortText: wish ? 'Der Spieler würde gern wechseln.' : 'Der Spieler fühlt sich bei uns wohl.',
      bodyText: `${buyer.name} möchte ${p.fullName} (${p.naturalPosition}, ${p.age} J., Stärke ${p.overall}) verpflichten und bietet eine Ablöse von ${fmtPrice(fee)}. Sein Marktwert liegt bei ${fmtPrice(p.contract.transferValue)}.\n\n${wish
        ? 'Er hat signalisiert, dass ihn der Wechsel reizt. Lehnst du ab, wird er enttäuscht sein.'
        : 'Er selbst drängt nicht auf einen Wechsel.'}\n\nDas Angebot gilt fünf Tage.`,
      actionRequired: true, relatedId: p.id,
    });
    msg.choices = [
      { id: 'annehmen', label: 'Annehmen', hint: `${fmtPrice(fee)} Ablöse` },
      { id: 'nachverhandeln', label: 'Mehr fordern (+25 %)', hint: 'Sie könnten abspringen' },
      { id: 'ablehnen', label: 'Ablehnen' },
    ];
    const ref: MessageEventRef = { type: OFFER_TYPE, playerId: p.id, deadline: CalendarEngine.addDays(today, 5), defaultChoice: 'ablehnen', data: { buyer: buyer.id, fee, wish: wish ? 1 : 0 } };
    msg.eventRef = ref;
    pushMessage(g.messages, msg);
    return; // höchstens ein Angebot pro Stichtag
  }
}

CHOICE_HANDLERS[OFFER_TYPE] = (g, ref, choice) => {
  const p = ref.playerId ? g.players[ref.playerId] : undefined;
  const own = g.clubs[g.managedClubId];
  const buyer = g.clubs[String(ref.data?.buyer ?? '')];
  if (!p || !buyer || p.clubId !== own.id) return { text: 'Das Angebot ist hinfällig.' };
  const fee = Number(ref.data?.fee ?? 0);
  const wish = Number(ref.data?.wish ?? 0) === 1;
  const today = g.calendar.currentDate;
  const sell = (amount: number) => {
    transferPlayer(g, p, own, buyer, amount, today);
    repairSquadLists(g);
    return { text: `${p.fullName} wechselt für ${fmtPrice(amount)} zu ${buyer.name}.` };
  };
  if (choice === 'annehmen') return sell(fee);
  if (choice === 'nachverhandeln') {
    const higher = Math.round(fee * 1.25);
    if (buyer.finances.transferBudget >= higher && Math.random() < 0.5) return sell(higher);
    if (wish) { p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 8, 0, 100); shiftMorale(p, -1); }
    return { text: `${buyer.name} ist das zu teuer und zieht das Angebot zurück.${wish ? ` ${p.lastName} ist enttäuscht.` : ''}` };
  }
  if (wish) {
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - 14, 0, 100);
    shiftMorale(p, -1);
    return { text: `${p.lastName} ist enttäuscht, dass er nicht wechseln darf.` };
  }
  return { text: `${p.lastName} bleibt – er hatte ohnehin nicht auf einen Wechsel gedrängt.` };
};

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
