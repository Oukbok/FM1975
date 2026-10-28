// =============================================================================
// VERTRÄGE im Spielablauf: Verlängerungen, Vertragsende, Bosman, Vorverträge.
// -----------------------------------------------------------------------------
// • Eigener Verein: Verlängerungen verhandelst du im Spielerprofil (Reiter
//   „Vertrag & Wert“). Wer zum 30. Juni ohne neuen Vertrag ist, geht:
//   vor Bosman (bis Sommer 1995) gegen eine Ablöse, danach ablösefrei.
// • Ab Bosman können andere Vereine im Winter einen Vorvertrag mit deinen
//   auslaufenden Leistungsträgern schließen.
// • KI-Vereine verlängern meistens automatisch, manche Spieler wechseln.
// • Verträge, die schon in einer früheren Saison abgelaufen sind (alte
//   Spielstände), werden einmalig still verlängert.
// =============================================================================
import { marketWage } from '../engine/clubEconomy';
import { bosmanActive, contractDemand, evaluateOffer, seasonEndYear } from '../engine/contractTalks';
import { bookTransfer } from '../engine/finances';
import { economyScale, yearOf } from '../engine/economy';
import { recordTransfer } from '../engine/history';
import { makeMessage, pushMessage } from '../engine/messages';
import { isForeignId } from '../engine/world';
import { Club, Player } from '../types';
import { fmtPrice } from '../ui/format';
import { repairSquadLists } from './squads';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function hashRand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

function yearsFor(age: number, r: number): number {
  if (age <= 24) return 3 + Math.floor(r * 3);
  if (age <= 29) return 2 + Math.floor(r * 3);
  if (age <= 32) return 1 + Math.floor(r * 2);
  return 1;
}

function squadOf(g: Game, club: Club): Player[] {
  return club.playerIds.map((id) => g.players[id]).filter(Boolean);
}

// -----------------------------------------------------------------------------
// Verhandlung (UI)
// -----------------------------------------------------------------------------
export function demandFor(g: Game, p: Player) {
  const club = g.clubs[p.clubId];
  return contractDemand(p, club, squadOf(g, club), g.calendar.currentDate);
}

/** Angebot an einen eigenen Spieler. Liefert den Ergebnistext. */
export function offerContract(g: Game, playerId: string, wage: number, years: number): { ok: boolean; text: string } {
  const p = g.players[playerId];
  if (!p || p.clubId !== g.managedClubId) return { ok: false, text: 'Nur eigene Spieler.' };
  const today = g.calendar.currentDate;
  const dem = demandFor(g, p);
  // Gehaltsrahmen des Vorstands (Wochenbudget, 1975-Basis) mit etwas Spielraum.
  const club = g.clubs[g.managedClubId];
  const wages = squadOf(g, club).reduce((s, x) => s + x.contract.weeklyWage, 0) - p.contract.weeklyWage + wage;
  const budget = club.finances.wageBudget ?? 0;
  if (budget > 0 && wage > p.contract.weeklyWage && wages > budget * 1.15) {
    return { ok: false, text: `Der Vorstand gibt das nicht frei: Die Gehälter lägen bei ${Math.round((wages / budget) * 100)} % des Gehaltsrahmens (Grenze 115 %).` };
  }
  const season = `${seasonEndYear(today) - 1}`;
  const talks = p.contract.talks && p.contract.talks.season === season ? p.contract.talks : { season, attempts: 0 };
  talks.attempts += 1;
  const res = evaluateOffer(p, dem, wage, years, talks.attempts);
  if (res.accepted) {
    p.contract.weeklyWage = Math.round(wage);
    // Laufzeit zählt ab der nächsten Saison, mindestens ein Jahr über das bisherige Ende hinaus.
    const endYear = Math.max(seasonEndYear(today) + years, Number(p.contract.expiryDate.slice(0, 4)) + 1);
    p.contract.expiryDate = `${endYear}-06-30`;
    p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) + 12, 0, 100);
    p.contract.talks = undefined;
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor',
      subject: `${p.fullName} verlängert bis ${p.contract.expiryDate.slice(0, 4)}`,
      shortText: `Neues Gehalt: ${fmtPrice(p.contract.weeklyWage)} pro Woche.`,
      bodyText: `${p.fullName} hat seinen Vertrag verlängert. Laufzeit bis 30.06.${p.contract.expiryDate.slice(0, 4)}, Wochengehalt ${fmtPrice(p.contract.weeklyWage)}.`,
    }));
    return { ok: true, text: res.text };
  }
  p.contract.satisfaction = clamp((p.contract.satisfaction ?? 60) - (wage / dem.wage < 0.8 ? 6 : 2), 0, 100);
  if (res.breakOff) {
    const d = new Date(today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 60);
    talks.blockedUntil = d.toISOString().slice(0, 10);
    talks.attempts = 0;
  }
  p.contract.talks = talks;
  return { ok: false, text: res.text };
}

// -----------------------------------------------------------------------------
// Wechsel eines Spielers (Vertragsende / Vorvertrag)
// -----------------------------------------------------------------------------
function pickBuyer(g: Game, p: Player, exclude: string, seed: string): Club | null {
  const cands = Object.values(g.clubs).filter((c) => c.id !== exclude && c.id !== g.managedClubId && !isForeignId(c.id)
    && Math.abs((c.reputation ?? 60) - p.overall) <= 14 && c.playerIds.length < 30);
  if (!cands.length) return null;
  cands.sort((a, b) => b.reputation - a.reputation);
  // Bessere Spieler gehen eher zu größeren Vereinen.
  const i = Math.floor(Math.pow(hashRand(seed), 1.6) * cands.length);
  return cands[i] ?? cands[0];
}

/** Wechsel eines Spielers (Ablöse in 1975-Basis, 0 = ablösefrei). Gehalt/Laufzeit werden neu gesetzt. */
export function transferPlayer(g: Game, p: Player, from: Club, to: Club, fee: number, date: string): void {
  from.playerIds = from.playerIds.filter((id) => id !== p.id);
  to.playerIds.push(p.id);
  p.clubId = to.id;
  p.transferListed = false;
  p.contract.preContractClubId = undefined;
  p.contract.talks = undefined;
  p.contract.weeklyWage = Math.round(Math.max(p.contract.weeklyWage, marketWage(p)) * (fee === 0 ? 1.15 : 1));
  p.contract.expiryDate = `${Number(date.slice(0, 4)) + yearsFor(p.age, hashRand(p.id + date))}-06-30`;
  p.contract.satisfaction = 78;
  if (fee > 0) {
    to.finances.transferBudget -= fee;
    from.finances.transferBudget += fee;
    bookTransfer(to, fee, true, p.fullName, date, to.isPlayerControlled);
    bookTransfer(from, fee, false, p.fullName, date, from.isPlayerControlled);
  }
  recordTransfer(p, from.name, to.name, Math.round(fee * economyScale(yearOf(date))), date);
}

/** Ablöse vor Bosman für einen Spieler ohne Vertrag (1975-Basis). */
function preBosmanFee(p: Player): number {
  return Math.round(p.contract.transferValue * 0.6);
}

// -----------------------------------------------------------------------------
// 1. Juli: Vertragsende
// -----------------------------------------------------------------------------
export function handleContractExpiry(g: Game, today: string): void {
  const year = Number(today.slice(0, 4));
  const bosman = bosmanActive(today);
  const renewed: string[] = [];
  const left: string[] = [];
  let income = 0;

  for (const club of Object.values(g.clubs)) {
    // In der Simulation ohne UI wird der eigene Verein wie ein KI-Verein gepflegt.
    const mine = club.id === g.managedClubId && !(g as any).simAutoManage;
    for (const pid of [...club.playerIds]) {
      const p = g.players[pid];
      if (!p || p.contract.expiryDate > today) continue;
      const stale = Number(p.contract.expiryDate.slice(0, 4)) < year; // in früherer Saison abgelaufen
      const r = hashRand(pid + year);

      // Vorvertrag: Wechsel steht fest.
      const pre = p.contract.preContractClubId ? g.clubs[p.contract.preContractClubId] : undefined;
      // Eigener Spieler ohne Verlängerung geht; KI-Spieler wechseln selten.
      const leaves = !stale && (pre || mine || r < (bosman ? 0.12 : 0.06)) && p.age < 34;
      const buyer = leaves ? (pre ?? pickBuyer(g, p, club.id, pid + year)) : null;
      if (buyer) {
        const fee = bosman ? 0 : preBosmanFee(p);
        transferPlayer(g, p, club, buyer, fee, today);
        if (mine) { left.push(`${p.fullName} → ${buyer.name}${fee ? ` (Ablöse ${fmtPrice(fee)})` : ' (ablösefrei)'}`); income += fee; }
        continue;
      }
      // Verlängerung (KI, alte Spielstände oder kein Abnehmer)
      p.contract.expiryDate = `${year + yearsFor(p.age, r)}-06-30`;
      p.contract.weeklyWage = Math.round((p.contract.weeklyWage + marketWage(p)) / 2);
      p.contract.preContractClubId = undefined;
      if (mine && !stale) renewed.push(`${p.fullName} (bis ${p.contract.expiryDate.slice(0, 4)})`);
    }
  }
  if (left.length || renewed.length) repairSquadLists(g);
  if (left.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor',
      subject: `${left.length} Spieler mit Vertragsende verlassen uns`,
      shortText: bosman ? 'Ablösefrei – nach dem Bosman-Urteil gibt es keine Entschädigung mehr.' : `Ablöse-Einnahmen: ${fmtPrice(income)}.`,
      bodyText: `Diese Spieler hatten keinen neuen Vertrag und sind gewechselt:\n\n${left.join('\n')}\n\n${bosman
        ? 'Seit dem Bosman-Urteil wechseln Spieler nach Vertragsende ablösefrei. Wichtige Verträge solltest du früh verlängern.'
        : 'Auch ohne Vertrag steht uns noch eine Ablöse zu – das ändert sich erst mit dem Bosman-Urteil.'}`,
    }));
  }
  if (renewed.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor',
      subject: `${renewed.length} Vertr${renewed.length === 1 ? 'ag' : 'äge'} verlängert`,
      shortText: 'Diese Spieler fanden keinen neuen Verein und bleiben.',
      bodyText: `Für diese Spieler gab es keinen Abnehmer, sie haben zu angepassten Bezügen verlängert:\n\n${renewed.join('\n')}`,
    }));
  }
}

// -----------------------------------------------------------------------------
// Erinnerungen (2. Januar, 1. April) und Vorverträge (ab Bosman, 15. Januar)
// -----------------------------------------------------------------------------
export function contractReminders(g: Game, today: string): void {
  const md = today.slice(5);
  const club = g.clubs[g.managedClubId];
  if (!club || (g as any).simAutoManage) return;
  const endYear = seasonEndYear(today);
  const expiring = squadOf(g, club).filter((p) => p.contract.expiryDate <= `${endYear}-06-30` && !p.contract.preContractClubId);

  if ((md === '01-02' || md === '04-01') && expiring.length) {
    const bosman = bosmanActive(`${endYear}-07-01`);
    expiring.sort((a, b) => b.overall - a.overall);
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor',
      subject: `${expiring.length} Vertr${expiring.length === 1 ? 'ag läuft' : 'äge laufen'} im Sommer aus`,
      shortText: bosman ? 'Ohne Verlängerung gehen sie ablösefrei.' : 'Ohne Verlängerung gehen sie – gegen Ablöse.',
      bodyText: `Diese Verträge enden am 30.06.${endYear}:\n\n${expiring.map((p) => `${p.fullName} (${p.naturalPosition}, ${p.age} J., Stärke ${p.overall})`).join('\n')}\n\nVerhandeln kannst du im Spielerprofil unter „Vertrag & Wert“.`,
    }));
  }

  // Vorverträge: andere Vereine sprechen deine Leistungsträger an.
  if (md === '01-15' && bosmanActive(today)) {
    const level = squadOf(g, club).map((p) => p.overall).sort((a, b) => b - a)[13] ?? 0;
    for (const p of expiring) {
      if (p.overall < level || p.age >= 33) continue;
      const sat = p.contract.satisfaction ?? 60;
      const chance = clamp(0.25 + (60 - sat) / 150 + (p.overall - (club.reputation ?? 60)) / 60, 0.05, 0.7);
      if (hashRand(p.id + today) >= chance) continue;
      const buyer = pickBuyer(g, p, club.id, p.id + 'pre' + today);
      if (!buyer) continue;
      p.contract.preContractClubId = buyer.id;
      pushMessage(g.messages, makeMessage({
        date: today, category: 'transfer', from: 'Sportdirektor',
        subject: `${p.fullName} unterschreibt Vorvertrag bei ${buyer.name}`,
        shortText: 'Er wechselt im Sommer ablösefrei.',
        bodyText: `${p.fullName} hat bei ${buyer.name} einen Vertrag ab der neuen Saison unterschrieben. Sein Vertrag bei uns läuft aus, eine Ablöse gibt es nicht. Wer jetzt noch Geld sehen will, muss ihn im Winter verkaufen.`,
      }));
    }
  }
}
