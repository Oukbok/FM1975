// =============================================================================
// Vertragsablauf zum Saisonstart (1. Juli): abgelaufene Verträge werden
// automatisch verlängert – Laufzeit nach Alter, Gehalt halb alt / halb
// marktgerecht (1975-Basis). Echte Verhandlungen folgen in einem späteren
// Ausbau; bis dahin bleibt kein Spieler mit einem Vertrag aus der Vergangenheit.
// =============================================================================
import { marketWage } from '../engine/clubEconomy';
import { makeMessage, pushMessage } from '../engine/messages';
import { Game } from './state';

function yearsFor(age: number, r: number): number {
  if (age <= 24) return 3 + Math.floor(r * 3);
  if (age <= 29) return 2 + Math.floor(r * 3);
  if (age <= 32) return 1 + Math.floor(r * 2);
  return 1;
}

export function renewExpiredContracts(g: Game, today: string): void {
  const year = Number(today.slice(0, 4));
  const mine: string[] = [];
  for (const club of Object.values(g.clubs)) {
    for (const pid of club.playerIds) {
      const p = g.players[pid];
      if (!p || p.contract.expiryDate > today) continue;
      // deterministisch je Spieler/Jahr, damit Tests reproduzierbar bleiben
      let h = year;
      for (let i = 0; i < pid.length; i++) h = (h * 31 + pid.charCodeAt(i)) >>> 0;
      const r = (h % 1000) / 1000;
      p.contract.expiryDate = `${year + yearsFor(p.age, r)}-06-30`;
      p.contract.weeklyWage = Math.round((p.contract.weeklyWage + marketWage(p)) / 2);
      if (club.id === g.managedClubId) mine.push(`${p.fullName} (bis ${p.contract.expiryDate.slice(0, 4)})`);
    }
  }
  if (mine.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor',
      subject: `${mine.length} Vertr${mine.length === 1 ? 'ag' : 'äge'} verlängert`,
      shortText: 'Auslaufende Verträge wurden zum Saisonstart verlängert.',
      bodyText: `Zum Saisonstart haben wir die ausgelaufenen Verträge verlängert, die Gehälter wurden an den Markt angepasst:\n\n${mine.join('\n')}`,
    }));
  }
}
