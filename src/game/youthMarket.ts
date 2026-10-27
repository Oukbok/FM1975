// =============================================================================
// Jugend-Transfers im Spielablauf: fremde Talente ansprechen, eigene schützen,
// Abwerbeversuche zum Saisonwechsel.
// =============================================================================
import { Game } from './state';
import { Player } from '../types';
import { economyScale, yearOf } from '../engine/economy';
import { book, bookTransfer } from '../engine/finances';
import { recordTransfer } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import {
  aiPoachAttempts, approachYouth, moveYouth, protectionAvailable, protectionCost, visibleForeignYouth, youthCompensation,
} from '../engine/youthScouting';
import { staffEffectsOf } from './staffGame';
import { dataScoutingBonus } from '../engine/infrastructure';

function seasonStart(date: string): number {
  const y = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 7 ? y : y - 1;
}

export function scoutedYouth(g: Game): Player[] {
  const mine = g.clubs[g.managedClubId];
  const scouting = staffEffectsOf(g).scouting + dataScoutingBonus(mine?.infrastructure?.dataCenter ?? 1);
  return visibleForeignYouth(g.clubs, g.youthPlayers, g.managedClubId, scouting, g.calendar.currentDate);
}

/** Bereits in dieser Saison angesprochen? (eine Chance je Talent und Saison) */
export function approachedThisSeason(g: Game, playerId: string): boolean {
  return (g.youthApproaches?.[playerId] ?? -1) === seasonStart(g.calendar.currentDate);
}

export function approachForeignYouth(g: Game, playerId: string): string {
  const p = g.youthPlayers[playerId];
  const mine = g.clubs[g.managedClubId];
  const from = p ? g.clubs[p.clubId] : undefined;
  if (!p || !mine || !from) return 'Talent nicht gefunden.';
  if (approachedThisSeason(g, playerId)) return `Du hast ${p.fullName} in dieser Saison schon angesprochen.`;
  const date = g.calendar.currentDate;
  if (mine.finances.ffp?.banSeason && mine.finances.ffp.banSeason.startsWith(String(seasonStart(date)))) {
    return 'Transfersperre: Ausbildungsentschädigungen sind derzeit nicht erlaubt.';
  }
  (g.youthApproaches ??= {})[playerId] = seasonStart(date);
  const res = approachYouth(p, from, mine, g.youthPlayers, date, mine.finances.transferBudget);
  if (!res.ok) return res.text;
  moveYouth(p, from, mine);
  mine.finances.transferBudget -= res.fee;
  bookTransfer(mine, res.fee, true, `${p.fullName} (Ausbildungsentschädigung)`, date, true);
  bookTransfer(from, res.fee, false, `${p.fullName} (Ausbildungsentschädigung)`, date, false);
  recordTransfer(p, from.name, mine.name, Math.round(res.fee * economyScale(yearOf(date))), date);
  pushMessage(g.messages, makeMessage({
    date, category: 'transfer', from: 'Leiter Jugendakademie',
    subject: `${p.fullName} kommt in unsere Jugend`,
    shortText: `Ausbildungsentschädigung an ${from.name} gezahlt.`,
    bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age}) wechselt von ${from.name} in unsere Jugendakademie. ${from.name} erhält eine Ausbildungsentschädigung.`,
  }));
  return res.text;
}

/** Fördervertrag für ein eigenes Talent (ein Jahr Schutz vor Abwerbung). */
export function protectOwnYouth(g: Game, playerId: string): string {
  const p = g.youthPlayers[playerId];
  const mine = g.clubs[g.managedClubId];
  const date = g.calendar.currentDate;
  const year = yearOf(date);
  if (!p || !mine || p.clubId !== mine.id) return '';
  if (!protectionAvailable(year)) return 'Förderverträge für Jugendliche gibt es erst ab 1990.';
  const until = seasonStart(date) + 1;
  if ((p.development.protectedUntil ?? 0) >= until) return `${p.fullName} ist bereits geschützt.`;
  const cost = Math.round(protectionCost(p) * economyScale(year));
  book(mine.finances, date, -cost, 'wages', `Fördervertrag ${p.fullName}`, true);
  p.development.protectedUntil = until;
  return `${p.fullName} unterschreibt einen Fördervertrag bis Sommer ${until + 1}.`;
}

/** Saisonwechsel: größere Vereine versuchen, deine Talente abzuwerben. */
export function youthPoachingAtSeasonChange(g: Game, date: string): void {
  const mine = g.clubs[g.managedClubId];
  if (!mine) return;
  const year = yearOf(date);
  const league = Object.values(g.clubs).filter((c) => c.id !== mine.id && !c.id.startsWith('am') && !c.id.startsWith('eu_') && !c.id.startsWith('w_'));
  const lost = aiPoachAttempts(mine, league, g.youthPlayers, year, Math.random);
  for (const { p, to } of lost) {
    const fee = youthCompensation(p, year);
    bookTransfer(mine, fee, false, `${p.fullName} (Ausbildungsentschädigung)`, date, true);
    bookTransfer(to, fee, true, `${p.fullName} (Ausbildungsentschädigung)`, date, false);
    recordTransfer(p, mine.name, to.name, Math.round(fee * economyScale(year)), date);
    pushMessage(g.messages, makeMessage({
      date, category: 'transfer', from: 'Leiter Jugendakademie',
      subject: `${to.name} wirbt ${p.fullName} ab`,
      shortText: 'Eines unserer größten Talente verlässt uns.',
      bodyText: `${to.name} hat ${p.fullName} (${p.age}) überzeugt, in ihre Jugendakademie zu wechseln. Wir erhalten eine Ausbildungsentschädigung.`
        + (protectionAvailable(year) ? '\n\nTipp: Mit einem Fördervertrag (Jugend → Talent öffnen) lassen sich Talente schützen.' : ''),
    }));
  }
}
