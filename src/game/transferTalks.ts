// =============================================================================
// TRANSFERVERHANDLUNGEN (eigener Verein kauft)
// -----------------------------------------------------------------------------
// Ablauf wie in großen Managern:
//   1. Vereinsgespräch: Ablöse + Ratenzahlung + Weiterverkaufsbeteiligung +
//      Erfolgsprämie. Der Verkäufer antwortet mit Gegenforderungen; seine
//      Schmerzgrenze bleibt verdeckt, du siehst nur eine Schätzspanne.
//      Zu niedrige Angebote kosten Geduld, bei 0 ist das Gespräch beendet.
//      Dazu (je nach Epoche): drei Raten, Spieler-Tausch, Rückkaufoption,
//      Leihe mit Kaufoption. Der Verkäufer bewertet einen Tauschspieler nach
//      seinem eigenen Bedarf; der Tauschspieler muss selbst wechseln wollen.
//   2. Spielergespräch: Gehalt, Laufzeit, Handgeld, Ausstiegsklausel,
//      Treueprämie, Erfolgsklausel, Beraterprovision und Versprechen. Haltung
//      und Wünsche aus seiner Persönlichkeit (game/playerWishesGame.ts).
//   3. Abschluss: sofort im Transferfenster (Juli/August, Januar), sonst zum
//      nächsten Fenster. Ab Bosman können Spieler mit auslaufendem Vertrag
//      (≤ 6 Monate) ohne Vereinsgespräch einen Vorvertrag unterschreiben.
// =============================================================================
import { wageLimitFactor } from './budgetPlan';
import { CalendarEngine } from '../engine/calendar';
import { hasTransferBan, marketWage } from '../engine/clubEconomy';
import { bosmanActive, monthsLeft, seasonEndYear } from '../engine/contractTalks';
import { book } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  CLAUSE_FROM, ClubPackage, PlayerOffer, PROMISES, clubAnswer, estimateRange, hash01, playerAnswer, PlayerStance,
  sellerPosition, stanceFrom,
} from '../engine/transferMarket';
import { assessSquad, GROUP_OF } from '../engine/aiManager';
import { interestText } from '../engine/playerWishes';
import { playsEurope, rivalsOf, willJoin, wishesFor } from './playerWishesGame';
import { isForeignId } from '../engine/world';
import { Club, Player } from '../types';
import { fmtPrice, fmtWage } from '../ui/format';
import { transferPlayer } from './contracts';
import { ensureEnvironment } from './environmentGame';
import { givePromises, trustOf } from './promises';
import { repairSquadLists } from './squads';
import { staffEffectsOf } from './staffGame';
import { Game } from './state';
import { noteLoan } from './transferLog';
import { applyTransferExtras, extrasLine } from './contractClausesGame';
import { dropWorldPlayer, removeWorldEntry, worldClubs } from './worldPool';

/** Verkäufer: Verein mit vollem Kader oder (Weltspieler) ein schlanker Ersatz aus der Hintergrund-Welt. */
const sellerCache = new Map<string, Club>();
export function sellerOf(g: Game, id: string): Club | undefined {
  if (g.clubs[id]) return g.clubs[id];
  const hit = sellerCache.get(id);
  if (hit) return hit;
  const w = worldClubs(g).get(id);
  if (!w) return undefined;
  const c = {
    id: w.id, name: w.name, shortName: w.shortName, city: w.city, colors: w.colors, reputation: w.strength, playerIds: [], youthPlayerIds: [],
    finances: { balance: 1e9, transferBudget: 1e9, wageBudget: 1e9, income: {}, expenses: {}, transactions: [] },
    isPlayerControlled: false,
  } as unknown as Club;
  sellerCache.set(id, c);
  return c;
}
/** Kader eines Weltvereins als Rangliste (nur ID und Stärke). */
function worldSquad(g: Game, clubId: string): Player[] {
  return (g.worldPool?.p ?? []).filter((w) => w[1] === clubId && !w[12]).map((w) => ({ id: w[0], overall: w[8] }) as unknown as Player);
}
const EAST_BLOC = new Set(['Sowjetunion', 'Polen', 'Ungarn', 'Tschechoslowakei', 'Rumaenien', 'Bulgarien', 'Albanien']);
const isWorldPlayer = (p: Player | undefined) => !!(p as (Player & { world?: boolean }) | undefined)?.world;

export interface TransferTalk {
  id: string;
  playerId: string;
  sellerId: string;
  started: string;
  lastAction: string;
  phase: 'club' | 'player' | 'agreed' | 'done' | 'failed';
  /** Vorvertrag ohne Ablöse (Bosman, Vertrag endet in ≤ 6 Monaten). */
  freeAgent?: boolean;
  // Vereinsgespräch (verdeckt: asking/walkaway/hardness)
  asking: number;
  walkaway: number;
  hardness: number;
  untouchable: boolean;
  patience: number;
  round: number;
  currentAsk: number;
  estimate: [number, number];
  pkg?: ClubPackage;
  // Spielergespräch
  pRound: number;
  pPatience: number;
  terms?: PlayerOffer;
  log: { date: string; who: 'du' | 'verein' | 'spieler' | 'info'; text: string }[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const r5k = (x: number) => Math.round(x / 5000) * 5000;

export function inTransferWindow(date: string): boolean {
  const m = Number(date.slice(5, 7));
  return m === 7 || m === 8 || m === 1;
}

export function talksOf(g: Game): TransferTalk[] { return (g.transferTalks ??= []); }
export function activeTalks(g: Game): TransferTalk[] {
  return talksOf(g).filter((t) => t.phase === 'club' || t.phase === 'player' || t.phase === 'agreed');
}
export function talkFor(g: Game, playerId: string): TransferTalk | undefined {
  return activeTalks(g).find((t) => t.playerId === playerId);
}

/** Kann um diesen Spieler verhandelt werden? (Grund, falls nicht) */
export function talkBlocker(g: Game, p: Player): string | null {
  if (p.clubId === g.managedClubId) return 'Er spielt bereits bei dir.';
  if (p.isYouth) return 'Jugendspieler holst du über das Jugend-Scouting.';
  if (!isWorldPlayer(p) && (!g.clubs[p.clubId] || isForeignId(p.clubId))) return 'Für Spieler ausländischer Vereine fehlen noch die Kontakte.';
  if (p.clubId.startsWith('ddr') && yearOf(g.calendar.currentDate) < 1990) return 'Spieler aus der DDR-Oberliga dürfen nicht in den Westen wechseln.';
  if (isWorldPlayer(p) && yearOf(g.calendar.currentDate) < 1989 && EAST_BLOC.has(worldClubs(g).get(p.clubId)?.country ?? '')) return 'Spieler aus dem Ostblock dürfen vor 1989 nicht in den Westen wechseln.';
  if (p.loan) return 'Er ist nur ausgeliehen.';
  if (hasTransferBan(g.clubs[g.managedClubId], g.season)) return 'Transfersperre (Lizenzauflage).';
  if (activeTalks(g).length >= 4 && !talkFor(g, p.id)) return 'Höchstens vier Verhandlungen gleichzeitig.';
  return null;
}

/** Wie gut kennt dein Stab den Spieler (0..1)? Bestimmt Schätzspannen und die Wunsch-Anzeige. */
export function scoutKnowledge(g: Game, p: Player): number {
  if (p.clubId === g.managedClubId) return 1;
  const fx = staffEffectsOf(g);
  const talk = talkFor(g, p.id);
  return clamp(0.25 + (fx.scouting ?? 0) * 2.5 + (p.transferListed ? 0.1 : 0) + (talk ? 0.15 + Math.min(0.2, talk.pRound * 0.1) : 0), 0, 1);
}

function rivals(g: Game, sellerId: string): boolean {
  const env = ensureEnvironment(g);
  return env.rivals.includes(sellerId);
}

/** Direkter Tabellennachbar (höchstens drei Plätze auseinander, ab dem 6. Spieltag). */
function competitor(g: Game, a: string, b: string): boolean {
  const rows = g.table?.rows ?? [];
  if ((rows[0]?.played ?? 0) < 6) return false;
  const pa = rows.findIndex((r) => r.clubId === a), pb = rows.findIndex((r) => r.clubId === b);
  return pa >= 0 && pb >= 0 && Math.abs(pa - pb) <= 3 && Math.min(pa, pb) <= 6;
}

export function startTalk(g: Game, playerId: string): TransferTalk | string {
  const existing = talkFor(g, playerId);
  if (existing) return existing;
  const p = g.players[playerId];
  if (!p) return 'Spieler nicht gefunden.';
  const block = talkBlocker(g, p);
  if (block) return block;
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const seller = sellerOf(g, p.clubId);
  if (!seller) return 'Verein nicht gefunden.';
  const months = monthsLeft(today, p.contract.expiryDate);
  const bosman = bosmanActive(today);
  const pos = sellerPosition(p, seller, own, {
    year: yearOf(today), monthsLeft: months, bosman, rival: rivals(g, seller.id), scope: isWorldPlayer(p) && isForeignId(seller.id) ? 'world' : 'germany',
    squad: isWorldPlayer(p) ? worldSquad(g, seller.id) : seller.playerIds.map((id) => g.players[id]).filter(Boolean), competitor: competitor(g, own.id, seller.id),
  });
  const freeAgent = bosman && months <= 6;
  const t: TransferTalk = {
    id: `tt_${playerId}_${today}`, playerId, sellerId: seller.id, started: today, lastAction: today,
    phase: freeAgent ? 'player' : 'club', freeAgent,
    asking: pos.asking, walkaway: pos.walkaway, hardness: pos.hardness, untouchable: pos.untouchable,
    patience: pos.patience, round: 0, currentAsk: pos.asking,
    estimate: estimateRange(pos.asking, scoutKnowledge(g, p), `${p.id}|${today}`),
    pRound: 0, pPatience: 100, log: [],
  };
  if (freeAgent) {
    t.log.push({ date: today, who: 'info', text: `Sein Vertrag bei ${seller.name} endet im Sommer. Nach dem Bosman-Urteil kann er ablösefrei einen Vorvertrag unterschreiben.` });
  } else {
    t.log.push({ date: today, who: 'info', text: `Dein Sportdirektor schätzt die Forderung von ${seller.name} auf ${fmtPrice(t.estimate[0])} bis ${fmtPrice(t.estimate[1])}.` });
    if (pos.untouchable) t.log.push({ date: today, who: 'verein', text: `${p.lastName} ist für uns eigentlich unverkäuflich. Wenn, dann nur für sehr viel Geld.` });
    else if (pos.notes.includes('Geldsorgen')) t.log.push({ date: today, who: 'info', text: `${seller.name} braucht Geld – das stärkt deine Position.` });
    if (pos.notes.includes('direkter Konkurrent')) t.log.push({ date: today, who: 'info', text: `Ihr seid direkte Konkurrenten in der Tabelle – ${seller.shortName} verlangt einen Aufschlag.` });
  }
  const st = stanceFor(g, t);
  if (st.dealBreaker) t.log.push({ date: today, who: 'spieler', text: `Aus seinem Umfeld heißt es: ${st.dealBreaker}` });
  else if (st.interest < 36) t.log.push({ date: today, who: 'info', text: `Dein Scout hört: ${p.lastName} reizt ein Wechsel zu euch wenig (${interestText(st.interest).text.toLowerCase()}).` });
  talksOf(g).push(t);
  return t;
}

function say(t: TransferTalk, date: string, who: TransferTalk['log'][number]['who'], text: string) {
  t.log.push({ date, who, text });
  if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
  t.lastAction = date;
}

/**
 * Abgelehnter Vorschlag (Budget, Gehaltsrahmen, Klausel noch nicht erlaubt …): Er wird NICHT
 * abgeschickt. Damit der Verlauf nicht weiter das letzte gültige Angebot als neuestes zeigt,
 * steht der Grund als Info-Zeile darin (ohne `lastAction` – das Gespräch schläft trotzdem ein).
 */
function refuse(t: TransferTalk, date: string, text: string): string {
  t.log.push({ date, who: 'info', text: `Nicht abgeschickt: ${text}` });
  if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
  return text;
}

/** Wert eines eigenen Spielers als Tauschobjekt für den Verkäufer (0 = will ihn nicht bzw. er will nicht hin). */
export function swapValueFor(g: Game, swap: Player, seller: Club): { value: number; reason: string } {
  if (swap.clubId !== g.managedClubId) return { value: 0, reason: 'Nur eigene Spieler.' };
  if (swap.loan) return { value: 0, reason: 'Leihspieler kannst du nicht tauschen.' };
  if (!g.clubs[seller.id]) return { value: 0, reason: `${seller.shortName} nimmt keinen Tauschspieler.` };
  const a = assessSquad(seller.playerIds.map((id) => g.players[id]).filter(Boolean), seller.tactics?.formation);
  const need = a.groups[GROUP_OF[swap.naturalPosition]];
  const fits = swap.overall >= a.level - 8;
  const factor = (need.score >= 8 ? 0.85 : 0.5) * (fits ? 1 : 0.5) * (swap.age >= 31 ? 0.7 : 1);
  const join = willJoin(g, swap, seller, () => 0.5);
  if (!join.ok) return { value: 0, reason: `${swap.lastName} will nicht zu ${seller.shortName}.` };
  return { value: r5k(swap.contract.transferValue * factor), reason: need.score >= 8 ? 'Bedarf auf seiner Position' : 'kein dringender Bedarf' };
}

export function clubOffer(g: Game, talkId: string, pkg: ClubPackage): string {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (!t || t.phase !== 'club') return 'Kein offenes Vereinsgespräch.';
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  const seller = sellerOf(g, t.sellerId);
  if (!p || !seller || p.clubId !== seller.id) { t.phase = 'failed'; return 'Der Spieler ist nicht mehr verfügbar.'; }
  if (pkg.loan && year < CLAUSE_FROM.loanOption) return refuse(t, today, `Leihen mit Kaufoption gibt es erst ab ${CLAUSE_FROM.loanOption}.`);
  if (pkg.buyBack && year < CLAUSE_FROM.buyBack) return refuse(t, today, `Rückkaufoptionen sind erst ab ${CLAUSE_FROM.buyBack} üblich.`);
  if (pkg.rates === 3 && year < CLAUSE_FROM.threeRates) return refuse(t, today, `Drei Raten akzeptiert vor ${CLAUSE_FROM.threeRates} niemand.`);
  if (pkg.loan) {
    const rank = seller.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall).findIndex((x) => x.id === p.id);
    if (rank >= 0 && rank < 11 && p.age > 21) return refuse(t, today, `${seller.shortName} verleiht keine Stammspieler.`);
  }
  // Tauschspieler: Wert neu bestimmen (nicht vom Aufrufer übernehmen).
  if (pkg.swapPlayerId) {
    const sw = g.players[pkg.swapPlayerId];
    const sv = sw ? swapValueFor(g, sw, seller) : { value: 0, reason: 'Spieler nicht gefunden.' };
    if (!sv.value) return refuse(t, today, sv.reason);
    pkg = { ...pkg, swapValue: sv.value };
  } else pkg = { ...pkg, swapValue: 0 };
  const share = pkg.installments ? 1 / (pkg.rates ?? 2) : 1;
  const upfront = pkg.fee * share;
  if (upfront > own.finances.transferBudget) return refuse(t, today, `Der Vorstand gibt ${fmtPrice(pkg.fee)} nicht frei: Dein Transferbudget beträgt ${fmtPrice(own.finances.transferBudget)}${pkg.installments ? ' (bei Ratenzahlung zählt die erste Rate)' : ''}.`);
  t.round += 1;
  const swapP = pkg.swapPlayerId ? g.players[pkg.swapPlayerId] : undefined;
  const extras = [pkg.loan && `als Leihe, Kaufoption ${fmtPrice(pkg.optionFee ?? 0)}`, pkg.installments && `in ${pkg.rates ?? 2} Raten`, pkg.sellOn > 0 && `${Math.round(pkg.sellOn * 100)} % Weiterverkaufsbeteiligung`,
    pkg.bonus > 0 && `${fmtPrice(pkg.bonus)} Erfolgsprämie`, swapP && `plus ${swapP.fullName}`, pkg.buyBack && `Rückkaufoption ${fmtPrice(pkg.buyBack)}`].filter(Boolean).join(', ');
  say(t, today, 'du', `Angebot: ${fmtPrice(pkg.fee)}${pkg.loan ? ' Leihgebühr' : ''}${extras ? ` (${extras})` : ''}.`);
  const rnd = () => hash01(`${t.id}|${t.round}|${pkg.fee}`);
  const ans = clubAnswer({ asking: t.asking, walkaway: t.walkaway, hardness: t.hardness, untouchable: t.untouchable, patience: t.patience, notes: [] },
    t.currentAsk, pkg, t.round, t.patience, rnd);
  if (ans.kind === 'accept') {
    t.pkg = pkg;
    t.phase = 'player';
    say(t, today, 'verein', ans.text);
    const st = stanceFor(g, t);
    say(t, today, 'info', `Jetzt musst du ${p.fullName} überzeugen. ${st.agent ? `Sein Berater fordert ${fmtWage(st.agentWage)}${st.agentFee ? ` und ${fmtPrice(st.agentFee)} Provision` : ''}.` : `Er verhandelt selbst und fordert ${fmtWage(st.agentWage)}.`}`);
    return ans.text;
  }
  if (ans.kind === 'breakoff') {
    t.phase = 'failed';
    say(t, today, 'verein', ans.text);
    return ans.text;
  }
  t.patience -= ans.patienceLoss;
  t.currentAsk = ans.ask;
  const msg = `${ans.text} Unsere Forderung: ${fmtPrice(ans.ask)}${pkg.swapValue ? ` (deinen Tauschspieler rechnen wir mit ${fmtPrice(pkg.swapValue)} an)` : ''}.`;
  say(t, today, 'verein', msg);
  return msg;
}

/** Haltung des Spielers (deterministisch aus Persönlichkeit, Käufer und Lage). */
export function stanceFor(g: Game, t: TransferTalk): PlayerStance {
  const p = g.players[t.playerId];
  const own = g.clubs[g.managedClubId];
  const w = wishesFor(g, p, own, { freeAgent: !!t.freeAgent });
  return stanceFrom(w.appeal, w.demand, w.promises);
}

export function playerOffer(g: Game, talkId: string, offer: PlayerOffer): string {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (!t || t.phase !== 'player') return 'Kein offenes Spielergespräch.';
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  if (!p || p.clubId !== t.sellerId) { t.phase = 'failed'; return 'Der Spieler ist nicht mehr verfügbar.'; }
  if (offer.releaseClause && yearOf(today) < CLAUSE_FROM.releaseClause) return refuse(t, today, `Ausstiegsklauseln sind in Deutschland erst ab ${CLAUSE_FROM.releaseClause} üblich.`);
  // Gehaltsrahmen
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) + offer.wage;
  // Saisonbudget (game/budgetPlan.ts): harte Grenze; alte Spielstände ohne Plan wie bisher 115 %.
  const wf = wageLimitFactor(g);
  if (own.finances.wageBudget > 0 && wages > own.finances.wageBudget * wf) {
    return refuse(t, today, `Der Vorstand gibt ${fmtWage(offer.wage)} nicht frei: Die Gehälter lägen bei ${Math.round((wages / own.finances.wageBudget) * 100)} % des Gehaltsbudgets (Grenze ${Math.round(wf * 100)} %).${wf < 1.15 ? ' Mehr Spielraum schaffst du unter Finanzen › Budget.' : ''}`);
  }
  const fee = t.pkg ? t.pkg.fee / (t.pkg.installments ? (t.pkg.rates ?? 2) : 1) : 0;
  if (offer.signingFee + (offer.agentFee ?? 0) > own.finances.transferBudget - fee) {
    return refuse(t, today, 'Für Handgeld und Provision reicht das Transferbudget nicht.');
  }
  t.pRound += 1;
  const st = stanceFor(g, t);
  const promises = offer.promises.map((x) => PROMISES[x].label).join(', ');
  const extras = [offer.signingFee && `Handgeld ${fmtPrice(offer.signingFee)}`, offer.agentFee && `Provision ${fmtPrice(offer.agentFee)}`,
    offer.loyaltyBonus && `Treueprämie ${fmtPrice(offer.loyaltyBonus)}`, offer.successRaise && `+${Math.round(offer.successRaise * 100)} % bei Europapokal`,
    offer.releaseClause && 'Ausstiegsklausel', offer.extras && extrasLine(offer.extras)].filter(Boolean).join(', ');
  say(t, today, 'du', `Gehalt ${fmtWage(offer.wage)}, ${offer.years} Jahre${extras ? `, ${extras}` : ''}${promises ? ` · Versprechen: ${promises}` : ''}.`);
  const ans = playerAnswer(p, st, offer, trustOf(g), t.pRound - 1, () => hash01(`${t.id}|p${t.pRound}|${offer.wage}`), playsEurope(g, own.id));
  if (ans.accepted) {
    t.terms = offer;
    t.phase = 'agreed';
    say(t, today, 'spieler', ans.text);
    if (inTransferWindow(today) && !(t.freeAgent && monthsLeft(today, p.contract.expiryDate) > 0)) return completeTalk(g, t);
    const when = t.freeAgent ? `zum 1. Juli ${seasonEndYear(today)}` : 'zum nächsten Transferfenster';
    say(t, today, 'info', `Einigung erzielt. Der Wechsel wird ${when} vollzogen.`);
    return `${ans.text} Der Wechsel wird ${when} vollzogen.`;
  }
  t.pPatience -= st.dealBreaker ? 100 : 25;
  say(t, today, 'spieler', `${ans.text}${ans.hint ? ' ' + ans.hint : ''}`);
  if (t.pPatience <= 0) {
    t.phase = 'failed';
    say(t, today, 'spieler', `${p.lastName} hat genug und bleibt bei ${sellerOf(g, t.sellerId)?.name}.`);
    return `${p.lastName} bricht die Gespräche ab.`;
  }
  return `${ans.text}${ans.hint ? ' ' + ans.hint : ''}`;
}

export function cancelTalk(g: Game, talkId: string): void {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (t && t.phase !== 'done') { t.phase = 'failed'; say(t, g.calendar.currentDate, 'info', 'Du hast die Verhandlung beendet.'); }
}

/** Wechsel vollziehen: Ablöse, Vertrag, Handgeld, Raten, Versprechen. */
function completeTalk(g: Game, t: TransferTalk): string {
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const seller = sellerOf(g, t.sellerId);
  const p = g.players[t.playerId];
  if (!p || !seller || !t.terms || p.clubId !== seller.id) { t.phase = 'failed'; return 'Der Wechsel ist geplatzt.'; }
  const pkg = t.pkg;
  const swap = pkg?.swapPlayerId ? g.players[pkg.swapPlayerId] : undefined;
  if (pkg?.swapPlayerId && (!swap || swap.clubId !== own.id)) { t.phase = 'failed'; say(t, today, 'info', 'Der Tauschspieler ist nicht mehr da – der Wechsel platzt.'); return 'Der Wechsel ist geplatzt.'; }
  const fee = t.freeAgent ? 0 : pkg?.fee ?? 0;
  const rates = pkg?.installments ? (pkg.rates ?? 2) : 1;
  const upfront = Math.round(fee / rates);
  const oldWage = p.contract.weeklyWage;
  transferPlayer(g, p, seller, own, upfront, today);
  for (let k = 1; k < rates; k++) {
    (g.transferInstallments ??= []).push({ due: CalendarEngine.addDays(today, 365 * k), amount: Math.round((fee - upfront) / (rates - 1)), from: own.id, to: seller.id, name: p.fullName, kind: 'rate' });
  }
  if (rates > 1) own.finances.transferBudget -= fee - upfront;
  if (pkg?.bonus) (g.transferInstallments ??= []).push({ due: `${seasonEndYear(today)}-06-30`, amount: pkg.bonus, from: own.id, to: seller.id, name: p.fullName, kind: 'bonus', playerId: p.id });
  if (pkg?.sellOn) p.sellOn = { clubId: seller.id, pct: pkg.sellOn };
  if (pkg?.buyBack) p.contract.buyBack = { clubId: seller.id, fee: pkg.buyBack, until: `${seasonEndYear(today) + 2}-06-30` };
  if (pkg?.loan) { p.loan = { fromClubId: seller.id, until: `${seasonEndYear(today)}-06-30`, optionFee: pkg.optionFee ?? 0, wage: oldWage }; noteLoan(g, p.id); }
  if (swap) {
    transferPlayer(g, swap, own, seller, 0, today);
    say(t, today, 'info', `${swap.fullName} wechselt im Tausch zu ${seller.name}.`);
  }
  // Vertrag nach Einigung (transferPlayer setzt Standardwerte)
  const terms = t.terms;
  p.contract.weeklyWage = Math.round(terms.wage * 1e4) / 1e4; // ungerundet: angezeigt = vereinbart
  p.contract.expiryDate = `${seasonEndYear(today) + terms.years - (Number(today.slice(5, 7)) >= 7 ? 1 : 0)}-06-30`;
  if (pkg?.loan && p.contract.expiryDate <= p.loan!.until) p.contract.expiryDate = `${seasonEndYear(today) + 1}-06-30`;
  p.contract.releaseClause = terms.releaseClause ? (terms.releaseAmount ?? r5k(Math.max(fee, p.contract.transferValue) * 1.8)) : undefined;
  if (terms.extras) applyTransferExtras(g, p, terms.extras, today); // Vertrag 2.0: Prämien, Staffelung, Option, Abstiegsklausel
  p.contract.loyaltyBonus = terms.loyaltyBonus || undefined;
  p.contract.successRaise = terms.successRaise || undefined;
  p.contract.noRivalSale = terms.promises.includes('keinRivale') || undefined;
  p.contract.satisfaction = 80;
  const scale = economyScale(yearOf(today));
  if (terms.signingFee > 0) {
    book(own.finances, today, -Math.round(terms.signingFee * scale), 'transfer_expense', `Handgeld ${p.fullName}`, true);
    own.finances.transferBudget -= terms.signingFee;
  }
  if (terms.agentFee) {
    book(own.finances, today, -Math.round(terms.agentFee * scale), 'transfer_expense', `Beraterprovision ${p.fullName}`, true);
    own.finances.transferBudget -= terms.agentFee;
  }
  if (terms.promises.includes('umzug')) book(own.finances, today, -Math.round(Math.max(1000, marketWage(p) * 4) * scale), 'other', `Umzug & Familie ${p.fullName}`, true);
  givePromises(g, p, terms.promises, today);
  if (isWorldPlayer(p)) removeWorldEntry(g, p.id);
  repairSquadLists(g);
  t.phase = 'done';
  const text = pkg?.loan ? `${p.fullName} kommt für eine Saison auf Leihbasis von ${seller.name} (Leihgebühr ${fmtPrice(fee)}, Kaufoption ${fmtPrice(pkg.optionFee ?? 0)}).`
    : `${p.fullName} wechselt ${fee ? `für ${fmtPrice(fee)} ` : 'ablösefrei '}von ${seller.name} zu dir${swap ? ` – ${swap.fullName} geht im Tausch` : ''}.`;
  say(t, today, 'info', text);
  const clauses = [terms.releaseClause && `Ausstiegsklausel ${fmtPrice(p.contract.releaseClause ?? 0)}`, terms.loyaltyBonus && `Treueprämie ${fmtPrice(terms.loyaltyBonus)} bei Vertragsende`,
    terms.successRaise && `+${Math.round(terms.successRaise * 100)} % Gehalt bei Europapokal-Platz`, pkg?.buyBack && `Rückkaufoption für ${seller.shortName}: ${fmtPrice(pkg.buyBack)} (2 Jahre)`].filter(Boolean);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'transfer', from: 'Sportdirektor', subject: `Transfer perfekt: ${p.fullName}`,
    shortText: text,
    bodyText: `${text}\n\nVertrag bis 30.06.${p.contract.expiryDate.slice(0, 4)}, Gehalt ${fmtWage(p.contract.weeklyWage)}.${clauses.length ? `\nKlauseln: ${clauses.join(', ')}.` : ''}${terms.promises.length ? `\nVersprechen: ${terms.promises.map((x) => PROMISES[x].label).join(', ')} – sie werden am Saisonende geprüft.` : ''}`,
  }));
  return text;
}

/** Täglich: Einigungen im Fenster vollziehen, Raten/Prämien fällig, alte Gespräche schließen. */
export function transferTalkDaily(g: Game, today: string): void {
  const talks = g.transferTalks;
  if (talks?.length) {
    for (const t of talks) {
      if (t.phase === 'agreed' && inTransferWindow(today)) {
        const p = g.players[t.playerId];
        if (!t.freeAgent || (p && monthsLeft(today, p.contract.expiryDate) <= 0) || today.slice(5) === '07-01') completeTalk(g, t);
      } else if ((t.phase === 'club' || t.phase === 'player') && CalendarEngine.addDays(t.lastAction, 30) < today) {
        t.phase = 'failed';
        say(t, today, 'info', 'Ohne neue Angebote ist die Verhandlung eingeschlafen.');
      }
    }
    // Abgeschlossene Gespräche nach 60 Tagen entfernen.
    g.transferTalks = talks.filter((t) => !(t.phase === 'done' || t.phase === 'failed') || CalendarEngine.addDays(t.lastAction, 60) >= today);
    // Weltspieler ohne laufendes Gespräch wieder in den Weltpool zurück (nur sein Eintrag bleibt).
    for (const t of talks) if (t.phase === 'failed' && !activeTalks(g).some((x) => x.playerId === t.playerId)) dropWorldPlayer(g, t.playerId);
  }
  const due = g.transferInstallments;
  if (due?.length) {
    const scale = economyScale(yearOf(today));
    g.transferInstallments = due.filter((d) => {
      if (d.due > today) return true;
      const from = g.clubs[d.from], to = g.clubs[d.to];
      if (d.kind === 'bonus') {
        const p = d.playerId ? g.players[d.playerId] : undefined;
        if (!p || (p.seasonStats?.appearances ?? 0) < 20) return false; // Prämie nicht erreicht
      }
      const nominal = Math.round(d.amount * scale);
      if (from) book(from.finances, today, -nominal, 'transfer_expense', `${d.kind === 'bonus' ? 'Erfolgsprämie' : 'Rate'}: ${d.name}`, from.id === g.managedClubId);
      if (to) book(to.finances, today, nominal, 'transfer_income', `${d.kind === 'bonus' ? 'Erfolgsprämie' : 'Rate'}: ${d.name}`, to.id === g.managedClubId);
      return false;
    });
  }
}
