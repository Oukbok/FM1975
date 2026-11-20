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
import { ddrTransferBlocker } from './ddrHome';
import { registrationBlocker } from './registrationGame';
import { wageLimitFactor } from './budgetPlan';
import { CalendarEngine } from '../engine/calendar';
import { hasTransferBan, marketValueFor, marketWage } from '../engine/clubEconomy';
import { bosmanActive, monthsLeft, seasonEndYear } from '../engine/contractTalks';
import { book } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  CLAUSE_FROM, ClubPackage, FRIENDLY_UNTIL, PlayerOffer, PROMISES, clubAnswer, estimateRange, hash01, packageValue, playerAnswer, PlayerStance,
  sellerPosition, stanceFrom,
} from '../engine/transferMarket';
import { ClubClause, clubCounter, friendlyGate, sellerPrefs, SellerStance } from '../engine/clubNegotiation';
import { squadLevel } from '../engine/contractTalks';
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
import { competitiveDays } from './winterShared';

/** Verkäufer: Verein mit vollem Kader oder (Weltspieler) ein schlanker Ersatz aus der Hintergrund-Welt. */
const sellerCache = new Map<string, Club>();
/** Ersatz-Vereine des vorigen Spielstands verwerfen (game/resetModuleState.ts). */
export function clearSellerCache(): void { sellerCache.clear(); }
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
  /** Gegenpaket des Verkäufers aus der letzten Runde (wer es übernimmt, bekommt den Zuschlag). */
  counter?: ClubPackage;
  /** Punkte, die er im Gegenpaket von sich aus verlangt hat. */
  asks?: ClubClause[];
  /** Verlauf je Runde: [Wert deines Angebots für ihn, seine Forderung danach]. */
  hist?: [number, number][];
  /** Schätzung der Schmerzgrenze durch deinen Sportdirektor. */
  walkEst?: [number, number];
  /** Geduld zu Beginn (für die Anzeige). */
  patience0?: number;
  // Spielergespräch
  pRound: number;
  pPatience: number;
  terms?: PlayerOffer;
  /** Spielergespräch am Verhandlungstisch (game/transferPlayerTalk.ts): seine aktuelle Forderung und der Verlauf. */
  pAsk?: import('../engine/contractNegotiation').ContractTerms;
  pHist?: [number, number][];
  /** Warum das Gespräch endete (Anzeige im Abschluss). */
  endNote?: string;
  log: { date: string; who: 'du' | 'verein' | 'spieler' | 'berater' | 'info'; text: string }[];
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
  // Spieler ausländischer Vereine sind verhandelbar (Wunsch Pascal) – Verkäufer über die Weltvereine (sellerOf).
  if (!g.clubs[p.clubId] && !sellerOf(g, p.clubId)) return 'Sein Verein ist nicht erreichbar.';
  // DDR-Start (game/ddrHome.ts): umgekehrte Sperre – vor dem Mauerfall nur Spieler aus der DDR.
  const ddrBlock = ddrTransferBlocker(g, p.clubId, g.calendar.currentDate);
  if (ddrBlock) return ddrBlock;
  if (!g.ddrHome && p.clubId.startsWith('ddr') && yearOf(g.calendar.currentDate) < 1990) return 'Spieler aus der DDR-Oberliga dürfen nicht in den Westen wechseln.';
  if ((isWorldPlayer(p) || isForeignId(p.clubId)) && yearOf(g.calendar.currentDate) < 1989 && EAST_BLOC.has(worldClubs(g).get(p.clubId)?.country ?? '')) return 'Spieler aus dem Ostblock dürfen vor 1989 nicht in den Westen wechseln.';
  if (p.loan) return 'Er ist nur ausgeliehen.';
  if (hasTransferBan(g.clubs[g.managedClubId], g.season)) return 'Transfersperre (Lizenzauflage).';
  // Kein Limit gleichzeitiger Verhandlungen mehr (Wunsch Pascal).
  const reg = registrationBlocker(g, p);
  if (reg) return reg;
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

/** Haltung des Verkäufers zu den Bausteinen (engine/clubNegotiation.ts) – fest je Verein, Spieler und Lage. */
export function sellerStance(g: Game, t: TransferTalk, swapId?: string): SellerStance | null {
  const p = g.players[t.playerId];
  const seller = sellerOf(g, t.sellerId);
  const own = g.clubs[g.managedClubId];
  if (!p || !seller || !own) return null;
  const real = !!g.clubs[seller.id] && !isForeignId(seller.id);
  const squad = own.playerIds.map((id) => g.players[id]).filter(Boolean);
  const rows = g.table?.rows ?? [];
  const pos = rows.findIndex((r) => r.clubId === own.id);
  const euro = playsEurope(g, own.id) ? 0.7 : pos >= 0 && rows.length ? clamp(0.55 - (pos / rows.length) * 0.9, 0.05, 0.5) : clamp((own.reputation - 60) / 60, 0.05, 0.5);
  let swapNeed = 0;
  const sw = swapId ? g.players[swapId] : undefined;
  if (sw && real) swapNeed = assessSquad(seller.playerIds.map((id) => g.players[id]).filter(Boolean), seller.tactics?.formation).groups[GROUP_OF[sw.naturalPosition]].score;
  return sellerPrefs(p, seller, own, {
    year: yearOf(g.calendar.currentDate), buyerLevel: squadLevel(squad), buyerEuro: euro, realSeller: real,
    capacity: seller.stadium?.capacity ?? 0, swapNeed,
  });
}

/** Was deine Verhandlungsposition stärkt (+) oder schwächt (−) – für die Anzeige am Verhandlungstisch. */
export function sellerLevers(g: Game, t: TransferTalk): { text: string; side: 1 | -1; w: number }[] {
  const p = g.players[t.playerId];
  const seller = sellerOf(g, t.sellerId);
  const own = g.clubs[g.managedClubId];
  if (!p || !seller || !own) return [];
  const today = g.calendar.currentDate;
  const months = monthsLeft(today, p.contract.expiryDate);
  const out: { text: string; side: 1 | -1; w: number }[] = [];
  const squad = isWorldPlayer(p) || !g.clubs[seller.id] ? worldSquad(g, seller.id) : seller.playerIds.map((id) => g.players[id]).filter(Boolean);
  const rank = [...squad].sort((a, b) => b.overall - a.overall).findIndex((x) => x.id === p.id);
  if (t.untouchable) out.push({ text: 'Gilt als unverkäuflich', side: -1, w: 3 });
  else if (rank >= 0 && rank < 3) out.push({ text: 'Leistungsträger seines Vereins', side: -1, w: 2 });
  else if (rank >= 11) out.push({ text: 'Nur Ergänzungsspieler', side: 1, w: 1 });
  if (months >= 36) out.push({ text: 'Langer Vertrag', side: -1, w: 2 });
  else if (months < 12) out.push({ text: bosmanActive(today) ? 'Vertrag läuft aus – bald ablösefrei' : 'Vertrag läuft aus', side: 1, w: bosmanActive(today) ? 3 : 1 });
  if (seller.finances.balance < 0) out.push({ text: `${seller.shortName ?? seller.name} braucht Geld`, side: 1, w: 2 });
  if (p.transferListed) out.push({ text: 'Steht auf der Transferliste', side: 1, w: 2 });
  if ((p.contract.satisfaction ?? 60) < 45) out.push({ text: 'Spieler will weg', side: 1, w: 1 });
  if (rivals(g, seller.id)) out.push({ text: 'Ihr seid Rivalen', side: -1, w: 2 });
  if (competitor(g, own.id, seller.id)) out.push({ text: 'Direkter Konkurrent in der Tabelle', side: -1, w: 1 });
  if (own.reputation > seller.reputation + 5) out.push({ text: 'Du kommst vom größeren Verein – er wittert Geld', side: -1, w: 1 });
  out.push(t.hardness >= 0.66 ? { text: 'Harter Verhandlungspartner', side: -1, w: 1 } : t.hardness <= 0.33 ? { text: 'Umgänglicher Verhandlungspartner', side: 1, w: 1 } : { text: 'Sachlicher Verhandlungspartner', side: 1, w: 0 });
  return out;
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
  const abroad = isForeignId(seller.id);
  // Alte Europapokal-Kader (`w_*`/`eu_*`) werden nicht laufend bewertet – Marktwert vor dem Gespräch auffrischen.
  if (abroad && !isWorldPlayer(p)) p.contract.transferValue = marketValueFor(p, yearOf(today));
  const months = monthsLeft(today, p.contract.expiryDate);
  const bosman = bosmanActive(today);
  const pos = sellerPosition(p, seller, own, {
    year: yearOf(today), monthsLeft: months, bosman, rival: rivals(g, seller.id), scope: abroad ? 'world' : 'germany',
    squad: isWorldPlayer(p) || (abroad && !g.clubs[seller.id]) ? worldSquad(g, seller.id) : seller.playerIds.map((id) => g.players[id]).filter(Boolean), competitor: competitor(g, own.id, seller.id),
  });
  const freeAgent = bosman && months <= 6;
  const t: TransferTalk = {
    id: `tt_${playerId}_${today}`, playerId, sellerId: seller.id, started: today, lastAction: today,
    phase: freeAgent ? 'player' : 'club', freeAgent,
    asking: pos.asking, walkaway: pos.walkaway, hardness: pos.hardness, untouchable: pos.untouchable,
    patience: pos.patience, round: 0, currentAsk: pos.asking, patience0: pos.patience,
    estimate: estimateRange(pos.asking, scoutKnowledge(g, p), `${p.id}|${today}`),
    walkEst: estimateRange(pos.walkaway, scoutKnowledge(g, p), `${p.id}|${today}|w`),
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

export function say(t: TransferTalk, date: string, who: TransferTalk['log'][number]['who'], text: string) {
  t.log.push({ date, who, text });
  if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
  t.lastAction = date;
}

/**
 * Abgelehnter Vorschlag (Budget, Gehaltsrahmen, Klausel noch nicht erlaubt …): Er wird NICHT
 * abgeschickt. Damit der Verlauf nicht weiter das letzte gültige Angebot als neuestes zeigt,
 * steht der Grund als Info-Zeile darin (ohne `lastAction` – das Gespräch schläft trotzdem ein).
 */
export function refuse(t: TransferTalk, date: string, text: string): string {
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

export function clubOffer(g: Game, talkId: string, pkg: ClubPackage, locks: ClubClause[] = []): string {
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
  const st0 = sellerStance(g, t, pkg.swapPlayerId);
  if (pkg.friendly && !(st0 && st0.friendlyValue > 0)) return refuse(t, today, year > FRIENDLY_UNTIL ? 'Ablösespiele sind aus der Mode gekommen.' : `${seller.shortName} hat an einem Ablösespiel kein Interesse.`);
  if (pkg.loan) pkg = { ...pkg, friendly: undefined, euroBonus: undefined, sellOn: 0, bonus: 0, installments: false, buyBack: undefined };
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
  say(t, today, 'du', `Angebot: ${packageLine(g, pkg)}.`);
  const st = st0 ?? undefined;
  const lockSet = new Set(locks);
  const value = packageValue(pkg, st);
  // Seine Bedingung „keine Raten“ lässt sich nicht wegverhandeln – das Angebot zählt nicht als Annäherung.
  if (st?.noRates && pkg.installments) {
    t.patience -= 6 + lockSet.size * 3;
    const c = clubCounter(pkg, t.currentAsk, st, lockSet);
    t.counter = c.pkg; t.asks = c.asks;
    (t.hist ??= []).push([Math.round(value), t.currentAsk]);
    if (t.patience <= 0) { t.phase = 'failed'; t.endNote = `${seller.shortName ?? seller.name} besteht auf sofortiger Zahlung und bricht ab.`; say(t, today, 'verein', 'Wir drehen uns im Kreis. Die Gespräche sind beendet.'); return 'Die Gespräche sind beendet.'; }
    const msg = `Ratenzahlung kommt für uns nicht infrage – wir brauchen das Geld sofort. Unser Vorschlag: ${packageLine(g, c.pkg)}.`;
    say(t, today, 'verein', msg);
    return msg;
  }
  const rnd = () => hash01(`${t.id}|${t.round}|${pkg.fee}`);
  const ans = clubAnswer({ asking: t.asking, walkaway: t.walkaway, hardness: t.hardness, untouchable: t.untouchable, patience: t.patience, notes: [] },
    t.currentAsk, pkg, t.round, t.patience - lockSet.size * 3, rnd, st);
  if (ans.kind === 'accept') {
    t.pkg = pkg;
    t.phase = 'player';
    t.counter = undefined; t.asks = undefined;
    (t.hist ??= []).push([Math.round(value), Math.round(value)]);
    say(t, today, 'verein', ans.text);
    const st = stanceFor(g, t);
    say(t, today, 'info', `Jetzt musst du ${p.fullName} überzeugen. ${st.agent ? `Sein Berater fordert ${fmtWage(st.agentWage)}${st.agentFee ? ` und ${fmtPrice(st.agentFee)} Provision` : ''}.` : `Er verhandelt selbst und fordert ${fmtWage(st.agentWage)}.`}`);
    return ans.text;
  }
  if (ans.kind === 'breakoff') {
    t.phase = 'failed';
    t.endNote = `${seller.shortName ?? seller.name} hat die Geduld verloren – dein Angebot lag zu weit unter der Forderung.`;
    (t.hist ??= []).push([Math.round(value), t.currentAsk]);
    say(t, today, 'verein', ans.text);
    return ans.text;
  }
  t.patience -= ans.patienceLoss + lockSet.size * 3;
  t.currentAsk = ans.ask;
  (t.hist ??= []).push([Math.round(value), ans.ask]);
  // Gegenpaket: deine Struktur, seine Bedingungen, der Rest über die Ablöse (engine/clubNegotiation.ts).
  let extra = '';
  if (st) {
    const c = clubCounter(pkg, ans.ask, st, lockSet);
    t.counter = c.pkg; t.asks = c.asks;
    const want = [c.asks.includes('sellOn') && 'eine Weiterverkaufsbeteiligung', c.asks.includes('friendly') && 'ein Ablösespiel bei uns', c.asks.includes('bonus') && 'einen Nachschlag nach Einsätzen',
      c.asks.includes('euro') && 'einen Nachschlag bei Europapokal-Teilnahme'].filter(Boolean).join(' und ');
    extra = ` Unser Vorschlag: ${packageLine(g, c.pkg)}.${want ? ` Wichtig ist uns ${want}.` : ''}${c.short > 0 ? ' Wenn du dich bei der Ablöse nicht bewegst, kommen wir so nicht zusammen.' : ''}${lockSet.size >= 2 ? ' Etwas mehr Beweglichkeit würde helfen.' : ''}`;
  } else t.counter = undefined;
  const msg = `${ans.text}${extra || ` Unsere Forderung: ${fmtPrice(ans.ask)}.`}${pkg.swapValue ? ` Deinen Tauschspieler rechnen wir mit ${fmtPrice(pkg.swapValue)} an.` : ''}`;
  say(t, today, 'verein', msg);
  return msg;
}

/** Ein Paket in einem Satz (Verlauf, Abschluss). */
export function packageLine(g: Game, pkg: ClubPackage): string {
  const swapP = pkg.swapPlayerId ? g.players[pkg.swapPlayerId] : undefined;
  const extras = [pkg.loan && `Kaufoption ${fmtPrice(pkg.optionFee ?? 0)}`, pkg.installments && `in ${pkg.rates ?? 2} Raten`, pkg.sellOn > 0 && `${Math.round(pkg.sellOn * 100)} % Weiterverkaufsbeteiligung`,
    pkg.bonus > 0 && `${fmtPrice(pkg.bonus)} Nachschlag nach 20 Einsätzen`, (pkg.euroBonus ?? 0) > 0 && `${fmtPrice(pkg.euroBonus!)} bei Europapokal-Teilnahme`, pkg.friendly && 'Ablösespiel',
    swapP && `plus ${swapP.fullName}`, pkg.buyBack && `Rückkaufoption ${fmtPrice(pkg.buyBack)}`].filter(Boolean).join(', ');
  return `${fmtPrice(pkg.fee)}${pkg.loan ? ' Leihgebühr' : pkg.installments ? '' : ' sofort'}${extras ? `, ${extras}` : ''}`;
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
    say(t, today, 'spieler', ans.text);
    return `${ans.text} ${sealPlayerTerms(g, t, offer)}`.trim();
  }
  t.pPatience -= st.dealBreaker ? 100 : 25;
  say(t, today, 'spieler', `${ans.text}${ans.hint ? ' ' + ans.hint : ''}`);
  if (t.pPatience <= 0) {
    t.phase = 'failed';
    t.endNote = `${p.lastName} hat die Gespräche abgebrochen.`;
    say(t, today, 'spieler', `${p.lastName} hat genug und bleibt bei ${sellerOf(g, t.sellerId)?.name}.`);
    return `${p.lastName} bricht die Gespräche ab.`;
  }
  return `${ans.text}${ans.hint ? ' ' + ans.hint : ''}`;
}

/** Einigung mit dem Spieler festhalten: sofort wechseln (offenes Fenster) oder zum nächsten Termin vormerken. */
export function sealPlayerTerms(g: Game, t: TransferTalk, offer: PlayerOffer): string {
  const today = g.calendar.currentDate;
  const p = g.players[t.playerId];
  t.terms = offer;
  t.phase = 'agreed';
  if (p && inTransferWindow(today) && !(t.freeAgent && monthsLeft(today, p.contract.expiryDate) > 0)) return completeTalk(g, t);
  const when = t.freeAgent ? `zum 1. Juli ${seasonEndYear(today)}` : 'zum nächsten Transferfenster';
  say(t, today, 'info', `Einigung erzielt. Der Wechsel wird ${when} vollzogen.`);
  return `Der Wechsel wird ${when} vollzogen.`;
}

export function cancelTalk(g: Game, talkId: string): void {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (t && t.phase !== 'done') { t.phase = 'failed'; t.endNote = 'Du hast die Verhandlung beendet.'; say(t, g.calendar.currentDate, 'info', 'Du hast die Verhandlung beendet.'); }
}

/** Wechsel vollziehen: Ablöse, Vertrag, Handgeld, Raten, Versprechen. */
function completeTalk(g: Game, t: TransferTalk): string {
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const seller = sellerOf(g, t.sellerId);
  const p = g.players[t.playerId];
  if (!p || !seller || !t.terms || p.clubId !== seller.id) { t.phase = 'failed'; t.endNote = 'Der Spieler ist nicht mehr verfügbar – der Wechsel ist geplatzt.'; return 'Der Wechsel ist geplatzt.'; }
  const pkg = t.pkg;
  const swap = pkg?.swapPlayerId ? g.players[pkg.swapPlayerId] : undefined;
  if (pkg?.swapPlayerId && (!swap || swap.clubId !== own.id)) { t.phase = 'failed'; t.endNote = 'Der Tauschspieler ist nicht mehr da – der Wechsel ist geplatzt.'; say(t, today, 'info', 'Der Tauschspieler ist nicht mehr da – der Wechsel platzt.'); return 'Der Wechsel ist geplatzt.'; }
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
  if (pkg?.euroBonus) (g.transferInstallments ??= []).push({ due: `${seasonEndYear(today)}-06-28`, amount: pkg.euroBonus, from: own.id, to: seller.id, name: p.fullName, kind: 'euro', playerId: p.id });
  if (pkg?.friendly && g.clubs[seller.id]) (g.transferInstallments ??= []).push({ due: friendlyDate(g, today), amount: friendlyGate(own.reputation, seller.stadium?.capacity ?? 20000), from: own.id, to: seller.id, name: p.fullName, kind: 'friendly' });
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
  const clauses = [pkg?.friendly && `Ablösespiel bei ${seller.shortName ?? seller.name} (Einnahmen für den Verkäufer)`, pkg?.euroBonus && `${fmtPrice(pkg.euroBonus)} Nachschlag bei Europapokal-Teilnahme`,
    terms.releaseClause && `Ausstiegsklausel ${fmtPrice(p.contract.releaseClause ?? 0)}`, terms.loyaltyBonus && `Treueprämie ${fmtPrice(terms.loyaltyBonus)} bei Vertragsende`,
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
        t.endNote = 'Ohne neue Angebote ist die Verhandlung eingeschlafen.';
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
      if (d.kind === 'euro') {
        // Nachschlag nur, wenn der Spieler noch da ist und der Käufer am Saisonende auf einem Europapokal-Platz steht.
        const p = d.playerId ? g.players[d.playerId] : undefined;
        if (!p || p.clubId !== d.from || !playsEurope(g, d.from)) return false;
      }
      const nominal = Math.round(d.amount * scale);
      if (d.kind === 'friendly') { playFriendly(g, d, nominal, today); return false; }
      const label = d.kind === 'bonus' ? 'Nachschlag nach Einsätzen' : d.kind === 'euro' ? 'Nachschlag Europapokal' : 'Rate';
      if (from) book(from.finances, today, -nominal, 'transfer_expense', `${label}: ${d.name}`, from.id === g.managedClubId);
      if (to) book(to.finances, today, nominal, 'transfer_income', `${label}: ${d.name}`, to.id === g.managedClubId);
      return false;
    });
  }
}

/** Termin des Ablösespiels: der erste Dienstag in frühestens zehn Tagen ohne eigenes Pflichtspiel am Tag selbst oder an den Nachbartagen. */
function friendlyDate(g: Game, today: string): string {
  const busy = competitiveDays(g);
  let d = CalendarEngine.addDays(today, 10);
  for (let i = 0; i < 120; i++, d = CalendarEngine.addDays(d, 1)) {
    if (new Date(d + 'T00:00:00Z').getUTCDay() !== 2) continue;
    if (!busy.has(d) && !busy.has(CalendarEngine.addDays(d, -1)) && !busy.has(CalendarEngine.addDays(d, 1))) return d;
  }
  return d;
}

/** Ablösespiel austragen: Einnahmen für den Verkäufer, deiner Mannschaft kostet der Abend etwas Frische. */
function playFriendly(g: Game, d: NonNullable<Game['transferInstallments']>[number], nominal: number, today: string): void {
  const own = g.clubs[d.from], seller = g.clubs[d.to];
  if (!own || !seller) return;
  book(seller.finances, today, nominal, 'ticket_sales', `Ablösespiel gegen ${own.shortName ?? own.name} (${d.name})`, false);
  if (own.id !== g.managedClubId) return;
  const squad = own.playerIds.map((id) => g.players[id]).filter((x) => x && !x.injury);
  for (const x of squad.sort((a, b) => b.overall - a.overall).slice(0, 14)) x.frische = clamp((x.frische ?? 100) - 12, 30, 100);
  const h = hash01(`${d.due}|${d.to}|${d.name}`);
  const gf = 1 + Math.floor(h * 4), ga = Math.floor(hash01(`${d.due}|${d.to}|a`) * 3);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'match', from: 'Sportdirektor', subject: `Ablösespiel bei ${seller.name}: ${ga}:${gf}`,
    shortText: `Vereinbart beim Transfer von ${d.name}. Die Einnahmen bleiben beim Gastgeber.`,
    bodyText: `Das beim Wechsel von ${d.name} vereinbarte Ablösespiel ist gespielt: ${seller.name} – ${own.name} ${ga}:${gf}.\n\nDie Einnahmen des Abends (rund ${fmtPrice(d.amount)}) gehören vereinbarungsgemäß ${seller.name}. Deine Mannschaft hat den Abend in den Beinen – die Frische der eingesetzten Spieler ist etwas gesunken.`,
  }));
}
