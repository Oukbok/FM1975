// =============================================================================
// TRANSFERVERHANDLUNGEN (eigener Verein kauft)
// -----------------------------------------------------------------------------
// Ablauf wie in großen Managern:
//   1. Vereinsgespräch: Ablöse + Ratenzahlung + Weiterverkaufsbeteiligung +
//      Erfolgsprämie. Der Verkäufer antwortet mit Gegenforderungen; seine
//      Schmerzgrenze bleibt verdeckt, du siehst nur eine Schätzspanne.
//      Zu niedrige Angebote kosten Geduld, bei 0 ist das Gespräch beendet.
//   2. Spielergespräch: Gehalt, Laufzeit, Handgeld, Ausstiegsklausel und bis
//      zu drei Versprechen. Der Berater nennt eine (überhöhte) Forderung.
//   3. Abschluss: sofort im Transferfenster (Juli/August, Januar), sonst zum
//      nächsten Fenster. Ab Bosman können Spieler mit auslaufendem Vertrag
//      (≤ 6 Monate) ohne Vereinsgespräch einen Vorvertrag unterschreiben.
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { hasTransferBan, marketWage } from '../engine/clubEconomy';
import { bosmanActive, monthsLeft, seasonEndYear } from '../engine/contractTalks';
import { book } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  ClubPackage, PlayerOffer, PROMISES, clubAnswer, estimateRange, hash01, playerAnswer, playerStance, PlayerStance,
  sellerPosition,
} from '../engine/transferMarket';
import { isForeignId } from '../engine/world';
import { Player, POSITION_GROUPS } from '../types';
import { fmtPrice } from '../ui/format';
import { transferPlayer } from './contracts';
import { ensureEnvironment } from './environmentGame';
import { givePromises, trustOf } from './promises';
import { repairSquadLists } from './squads';
import { staffEffectsOf } from './staffGame';
import { Game } from './state';

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
  if (!g.clubs[p.clubId] || isForeignId(p.clubId)) return 'Für Spieler ausländischer Vereine fehlen noch die Kontakte.';
  if (hasTransferBan(g.clubs[g.managedClubId], g.season)) return 'Transfersperre (Lizenzauflage).';
  if (activeTalks(g).length >= 4 && !talkFor(g, p.id)) return 'Höchstens vier Verhandlungen gleichzeitig.';
  return null;
}

function scoutKnowledge(g: Game, p: Player): number {
  const fx = staffEffectsOf(g);
  return clamp(0.25 + (fx.scouting ?? 0) * 2.5 + (p.transferListed ? 0.1 : 0), 0, 1);
}

function rivals(g: Game, sellerId: string): boolean {
  const env = ensureEnvironment(g);
  return env.rivals.includes(sellerId);
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
  const seller = g.clubs[p.clubId];
  const months = monthsLeft(today, p.contract.expiryDate);
  const bosman = bosmanActive(today);
  const pos = sellerPosition(p, seller, own, {
    year: yearOf(today), monthsLeft: months, bosman, rival: rivals(g, seller.id), scope: 'germany',
    squad: seller.playerIds.map((id) => g.players[id]).filter(Boolean),
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
  }
  talksOf(g).push(t);
  return t;
}

function say(t: TransferTalk, date: string, who: TransferTalk['log'][number]['who'], text: string) {
  t.log.push({ date, who, text });
  if (t.log.length > 30) t.log.splice(0, t.log.length - 30);
  t.lastAction = date;
}

export function clubOffer(g: Game, talkId: string, pkg: ClubPackage): string {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (!t || t.phase !== 'club') return 'Kein offenes Vereinsgespräch.';
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  const seller = g.clubs[t.sellerId];
  if (!p || !seller || p.clubId !== seller.id) { t.phase = 'failed'; return 'Der Spieler ist nicht mehr verfügbar.'; }
  const upfront = pkg.installments ? pkg.fee * 0.5 : pkg.fee;
  if (upfront > own.finances.transferBudget) return `Der Vorstand gibt das nicht frei: Dein Transferbudget beträgt ${fmtPrice(own.finances.transferBudget)}${pkg.installments ? ' (bei Ratenzahlung zählt die erste Hälfte)' : ''}.`;
  t.round += 1;
  const extras = [pkg.installments && 'in zwei Raten', pkg.sellOn > 0 && `${Math.round(pkg.sellOn * 100)} % Weiterverkaufsbeteiligung`, pkg.bonus > 0 && `${fmtPrice(pkg.bonus)} Erfolgsprämie`].filter(Boolean).join(', ');
  say(t, today, 'du', `Angebot: ${fmtPrice(pkg.fee)}${extras ? ` (${extras})` : ''}.`);
  const rnd = () => hash01(`${t.id}|${t.round}|${pkg.fee}`);
  const ans = clubAnswer({ asking: t.asking, walkaway: t.walkaway, hardness: t.hardness, untouchable: t.untouchable, patience: t.patience, notes: [] },
    t.currentAsk, pkg, t.round, t.patience, rnd);
  if (ans.kind === 'accept') {
    t.pkg = pkg;
    t.phase = 'player';
    say(t, today, 'verein', ans.text);
    say(t, today, 'info', `Jetzt musst du ${p.fullName} überzeugen. Sein Berater fordert ${fmtPrice(stanceFor(g, t).agentWage)} pro Woche.`);
    return ans.text;
  }
  if (ans.kind === 'breakoff') {
    t.phase = 'failed';
    say(t, today, 'verein', ans.text);
    return ans.text;
  }
  t.patience -= ans.patienceLoss;
  t.currentAsk = ans.ask;
  const msg = `${ans.text} Unsere Forderung: ${fmtPrice(ans.ask)}.`;
  say(t, today, 'verein', msg);
  return msg;
}

/** Haltung des Spielers (deterministisch aus Spieler, Käufer und Lage). */
export function stanceFor(g: Game, t: TransferTalk): PlayerStance {
  const p = g.players[t.playerId];
  const own = g.clubs[g.managedClubId];
  const seller = g.clubs[t.sellerId];
  const grp = POSITION_GROUPS[p.naturalPosition];
  const depthRank = own.playerIds.map((id) => g.players[id]).filter((x) => x && POSITION_GROUPS[x.naturalPosition] === grp && x.overall > p.overall).length;
  const pos = g.table.rows.findIndex((r) => r.clubId === own.id) + 1;
  return playerStance(p, own, {
    year: yearOf(g.calendar.currentDate), sellerRep: seller?.reputation ?? 60, buyerTier: g.leagues?.playerDivision?.tier ?? 1,
    buyerEuro: pos > 0 && pos <= 5 && (g.leagues?.playerDivision?.tier ?? 1) === 1, depthRank, trust: trustOf(g),
  });
}

export function playerOffer(g: Game, talkId: string, offer: PlayerOffer): string {
  const t = talksOf(g).find((x) => x.id === talkId);
  if (!t || t.phase !== 'player') return 'Kein offenes Spielergespräch.';
  const today = g.calendar.currentDate;
  const own = g.clubs[g.managedClubId];
  const p = g.players[t.playerId];
  if (!p || p.clubId !== t.sellerId) { t.phase = 'failed'; return 'Der Spieler ist nicht mehr verfügbar.'; }
  // Gehaltsrahmen
  const wages = own.playerIds.reduce((s, id) => s + (g.players[id]?.contract.weeklyWage ?? 0), 0) + offer.wage;
  if (own.finances.wageBudget > 0 && wages > own.finances.wageBudget * 1.15) {
    return `Der Vorstand gibt das Gehalt nicht frei: Die Gehälter lägen bei ${Math.round((wages / own.finances.wageBudget) * 100)} % des Gehaltsrahmens (Grenze 115 %).`;
  }
  if (offer.signingFee > own.finances.transferBudget - (t.pkg ? (t.pkg.installments ? t.pkg.fee * 0.5 : t.pkg.fee) : 0)) {
    return 'Für dieses Handgeld reicht das Transferbudget nicht.';
  }
  t.pRound += 1;
  const st = stanceFor(g, t);
  const promises = offer.promises.map((x) => PROMISES[x].label).join(', ');
  say(t, today, 'du', `${fmtPrice(offer.wage)} pro Woche, ${offer.years} Jahre${offer.signingFee ? `, Handgeld ${fmtPrice(offer.signingFee)}` : ''}${offer.releaseClause ? ', Ausstiegsklausel' : ''}${promises ? ` · Versprechen: ${promises}` : ''}.`);
  const ans = playerAnswer(p, st, offer, trustOf(g), t.pRound - 1, () => hash01(`${t.id}|p${t.pRound}|${offer.wage}`));
  if (ans.accepted) {
    t.terms = offer;
    t.phase = 'agreed';
    say(t, today, 'spieler', ans.text);
    if (inTransferWindow(today) && !(t.freeAgent && monthsLeft(today, p.contract.expiryDate) > 0)) return completeTalk(g, t);
    const when = t.freeAgent ? `zum 1. Juli ${seasonEndYear(today)}` : 'zum nächsten Transferfenster';
    say(t, today, 'info', `Einigung erzielt. Der Wechsel wird ${when} vollzogen.`);
    return `${ans.text} Der Wechsel wird ${when} vollzogen.`;
  }
  t.pPatience -= 25;
  say(t, today, 'spieler', `${ans.text}${ans.hint ? ' ' + ans.hint : ''}`);
  if (t.pPatience <= 0) {
    t.phase = 'failed';
    say(t, today, 'spieler', `${p.lastName} hat genug und bleibt bei ${g.clubs[t.sellerId]?.name}.`);
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
  const seller = g.clubs[t.sellerId];
  const p = g.players[t.playerId];
  if (!p || !seller || !t.terms || p.clubId !== seller.id) { t.phase = 'failed'; return 'Der Wechsel ist geplatzt.'; }
  const fee = t.freeAgent ? 0 : t.pkg?.fee ?? 0;
  const upfront = t.pkg?.installments ? Math.round(fee * 0.5) : fee;
  transferPlayer(g, p, seller, own, upfront, today);
  if (t.pkg?.installments && fee > upfront) {
    (g.transferInstallments ??= []).push({ due: CalendarEngine.addDays(today, 365), amount: fee - upfront, from: own.id, to: seller.id, name: p.fullName, kind: 'rate' });
    own.finances.transferBudget -= fee - upfront;
  }
  if (t.pkg?.bonus) (g.transferInstallments ??= []).push({ due: `${seasonEndYear(today)}-06-30`, amount: t.pkg.bonus, from: own.id, to: seller.id, name: p.fullName, kind: 'bonus', playerId: p.id });
  if (t.pkg?.sellOn) p.sellOn = { clubId: seller.id, pct: t.pkg.sellOn };
  // Vertrag nach Einigung (transferPlayer setzt Standardwerte)
  p.contract.weeklyWage = Math.round(t.terms.wage);
  p.contract.expiryDate = `${seasonEndYear(today) + t.terms.years - (Number(today.slice(5, 7)) >= 7 ? 1 : 0)}-06-30`;
  p.contract.releaseClause = t.terms.releaseClause ? r5k(Math.max(fee, p.contract.transferValue) * 1.8) : undefined;
  p.contract.satisfaction = 80;
  const scale = economyScale(yearOf(today));
  if (t.terms.signingFee > 0) {
    book(own.finances, today, -Math.round(t.terms.signingFee * scale), 'transfer_expense', `Handgeld ${p.fullName}`, true);
    own.finances.transferBudget -= t.terms.signingFee;
  }
  if (t.terms.promises.includes('umzug')) book(own.finances, today, -Math.round(Math.max(2000, marketWage(p) * 4) * scale), 'other', `Umzug & Familie ${p.fullName}`, true);
  givePromises(g, p, t.terms.promises, today);
  repairSquadLists(g);
  t.phase = 'done';
  const text = `${p.fullName} wechselt ${fee ? `für ${fmtPrice(fee)} ` : 'ablösefrei '}von ${seller.name} zu dir.`;
  say(t, today, 'info', text);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'transfer', from: 'Sportdirektor', subject: `Transfer perfekt: ${p.fullName}`,
    shortText: text,
    bodyText: `${text}\n\nVertrag bis 30.06.${p.contract.expiryDate.slice(0, 4)}, ${fmtPrice(p.contract.weeklyWage)} pro Woche.${t.terms.promises.length ? `\nVersprechen: ${t.terms.promises.map((x) => PROMISES[x].label).join(', ')} – sie werden am Saisonende geprüft.` : ''}`,
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
