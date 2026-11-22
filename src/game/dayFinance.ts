// =============================================================================
// Tagesablauf, Teil 3: Monatsabschluss aller Vereine (Gehälter, Fixkosten,
// Sponsoring, Zinsen), Mitarbeitergehälter/Werbung des eigenen Vereins und
// abgeschlossene geplante Aktivitäten. Aufgerufen aus game/day.ts.
// =============================================================================
import { marketingMonthly } from './marketingGame';
import { ACTIVITY_DEFS, activityIncomeBase } from '../data/activities';
import { staffMonthlyTotal } from '../data/staff';
import { memberMonthlySalary } from '../engine/staffPeople';
import { economyScale, yearOf } from '../engine/economy';
import { bookDebtInterest } from '../engine/clubEconomy';
import { book, bookMonthly } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { Game, bumpMorale } from './state';
import { bookAiStaffPayroll, staffedClubs, staffIndex } from './staffAi';
import { fmtDM } from '../ui/format';

/** MONATSABSCHLUSS (am 1.): Buchungen aller Vereine, dann Mitarbeiter & Werbung (nur eigener Verein). */
export function monthlyFinanceClose(g: Game, today: string, curMonth: string): void {
  const sim = !!(g as Game & { simAutoManage?: boolean }).simAutoManage;
  const staffIdx = staffIndex(g);
  const staffed = new Set(staffedClubs(g).map((c) => c.id));
  for (const club of Object.values(g.clubs)) {
    if (club.finances.lastMonthlyBooking === curMonth) continue;
    const isMine = club.id === g.managedClubId;
    const m = bookMonthly(club, g.players, today, g.table, isMine, economyScale(yearOf(today)));
    // KI-Vereine zahlen ihren Stab wie du deinen (game/staffAi.ts).
    if (staffed.has(club.id)) bookAiStaffPayroll(g, club, staffIdx, today);
    bookDebtInterest(club, today, isMine);
    if (isMine) {
      const net = m.net;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Finanzabteilung',
        subject: `Monatsabschluss – Kontostand ${fmtDM(club.finances.balance)}`,
        shortText: `${net >= 0 ? 'Überschuss' : 'Fehlbetrag'}: ${fmtDM(Math.abs(net))} im Monat.`,
        bodyText: `Der Monatsabschluss wurde gebucht.\n\n`
          + `Sponsoring: +${fmtDM(m.sponsorship)}\n`
          + `Werbung (Banden, Wettpartner): +${fmtDM(m.advertising)}\n`
          + (m.merchGlobal > 0 ? `Fanartikel weltweit: +${fmtDM(m.merchGlobal)}\n` : '')
          + (m.tv > 0 ? `TV-Gelder: +${fmtDM(m.tv)}\n` : '')
          + `Mitgliedsbeiträge: +${fmtDM(m.membership)}\n`
          + (m.cateringLease > 0 ? `Catering-Pacht: +${fmtDM(m.cateringLease)}\n` : '')
          + (m.placementBonus > 0 ? `Platzierungsbonus: +${fmtDM(m.placementBonus)}\n` : '')
          + `Spielergehälter: -${fmtDM(m.wages)}\n`
          + `Betreuerstab: -${fmtDM(m.staffWages)}\n`
          + `Stadionunterhalt: -${fmtDM(m.stadiumMaintenance)}\n`
          + `Gebäude-Fixkosten: -${fmtDM(m.facilities)}\n`
          + `Sonstige Kosten: -${fmtDM(m.otherFixed)}\n`
          + (m.operations > 0 ? `Betrieb & Vermarktung: -${fmtDM(m.operations)}\n` : '')
          + `\n`
          + `Monatssaldo: ${net >= 0 ? '+' : '-'}${fmtDM(Math.abs(net))}\n`
          + `Neuer Kontostand: ${fmtDM(club.finances.balance)}\n\n`
          + `Details findest du im Bereich Finanzen.`,
      }));
      if (club.finances.balance < 0) {
        pushMessage(g.messages, makeMessage({
          date: today, category: 'board', from: 'Vereinsvorstand',
          subject: 'Konto im Minus!',
          shortText: 'Der Verein steckt in den roten Zahlen.',
          bodyText: `Achtung: Das Vereinskonto ist mit ${fmtDM(club.finances.balance)} im Minus. `
            + `Der Vorstand erwartet, dass du die Ausgaben (v. a. Gehälter) senkst oder über Transfers/Erfolg neue Einnahmen generierst.`,
          actionRequired: true,
        }));
      }
    }
  }
  // -----------------------------------------------------------------------
  // BLOCK p11 — Monatliche Buchung von Mitarbeitergehältern & Marketing
  // (nur Manager-Verein). Gehälter/Kosten skalieren mit der Wirtschaftslage.
  // -----------------------------------------------------------------------
  {
    const scale = economyScale(yearOf(today));
    const mine = g.clubs[g.managedClubId];
    // 1) Mitarbeitergehälter → Ausgabe-Kategorie 'staff_wages'.
    const staffCost = g.staff
      ? g.staff.reduce((a, m) => a + memberMonthlySalary(m, scale), 0)
      : staffMonthlyTotal(g.hiredStaff ?? [], scale);
    if (staffCost > 0 && mine && !sim) {
      book(mine.finances, today, -staffCost, 'staff_wages', 'Gehälter Mitarbeiterstab (Monat)', true);
    }
    // 2) Werbung: Kosten, Wirkung nachziehen, Marke aufbauen (game/marketingGame.ts).
    marketingMonthly(g, today);
  }
}

/**
 * BLOCK p11 — Geplante Aktivitäten: Effekt anwenden, sobald das Enddatum
 * erreicht ist (Fitness/Form/Moral auf den Kader; Freundschaftsspiel-Erlös).
 * Kosten wurden bereits bei der Planung gebucht.
 */
export function finishActivities(g: Game, today: string): void {
  if (Array.isArray(g.activities) && g.activities.length > 0) {
    const mine = g.clubs[g.managedClubId];
    for (const act of g.activities) {
      if (act.applied || act.endDate > today) continue;
      act.applied = true;
      const def = ACTIVITY_DEFS[act.type];
      if (mine) {
        for (const pid of mine.playerIds) {
          const p = g.players[pid];
          if (!p) continue;
          if (def.fitness) p.attributes.fitness = Math.min(100, (p.attributes.fitness ?? 0) + def.fitness);
          if (def.form) p.form = Math.max(0, Math.min(100, (p.form ?? 50) + def.form));
          if (def.morale) p.morale = bumpMorale(p.morale, def.morale);
        }
        // Freundschaftsspiel: kleiner Erlös (ära-gerecht skaliert).
        const incBase = activityIncomeBase(act.type);
        if (incBase > 0) {
          const inc = Math.round(incBase * economyScale(yearOf(today)));
          book(mine.finances, today, inc, 'other', `Einnahmen ${def.name}`, true);
        }
      }
      pushMessage(g.messages, makeMessage({
        date: today, category: 'board', from: 'Trainerstab',
        subject: `${act.label} abgeschlossen`,
        shortText: `${def.name} beendet – die Mannschaft profitiert.`,
        bodyText: `Die geplante Aktivität „${act.label}" (${def.name}) ist abgeschlossen.\n\n`
          + (def.fitness ? `Fitness: +${def.fitness}\n` : '')
          + (def.form ? `Form: +${def.form}\n` : '')
          + (def.morale ? `Moral: verbessert\n` : '')
          + (activityIncomeBase(act.type) > 0 ? `Erlös: +${fmtDM(Math.round(activityIncomeBase(act.type) * economyScale(yearOf(today))))}\n` : '')
          + `\nDie Effekte wirken sofort auf den Kader.`,
      }));
    }
  }
}
