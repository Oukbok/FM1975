// =============================================================================
// VERTRAGSBAUSTEINE im Spielablauf (Vertragsverhandlung 2.0, eigener Verein)
// -----------------------------------------------------------------------------
// • Einsatz-/Tor-/Zu-null-Prämien: täglich aus der Saisonstatistik nachgebucht
//   (Zähler `contract.bonusPaid`, idempotent).
// • 29.6.: Titelprämie (Meisterschaft/Staffelsieg, Pokalsieg); Klassenerhalt-
//   Prämien werden vorgemerkt und nach dem Auf-/Abstieg zum Saisonstart gezahlt.
// • Saisonstart: Abstiegsklausel (Gehaltskürzung), gestaffelte Gehälter.
// • Vereinsoption ziehen (+1 Jahr), Spieleroption am Vertragsende (contracts.ts).
// KI-Vereine: keine Einzelprämien – sie zahlen weiter die pauschalen Sieg-/
// Punktprämien aus engine/finances.ts (gleiches Niveau, Balance unverändert).
// Alle Beträge in 1975-Basis, gebucht nominal (× economyScale).
// =============================================================================
import type { ContractTerms } from '../engine/contractNegotiation';
import { economyScale, yearOf } from '../engine/economy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { PROMISES } from '../engine/transferMarket';
import { Contract, Player } from '../types';
import { fmtPriceAuto, fmtWage } from '../ui/format';
import { Game } from './state';

const pct = (x: number) => `${Math.round(x * 100)} %`;

export interface Contracts2State {
  v: 1;
  /** Liga-Ebene des eigenen Vereins in der letzten Saison (Abstieg erkennen). */
  lastTier?: number;
  /** Vorgemerkte Klassenerhalt-Prämien (gezahlt nach dem Auf-/Abstieg). */
  stayPending?: { name: string; amount: number }[];
}

function state(g: Game): Contracts2State {
  return (g.contracts2 ??= { v: 1, lastTier: g.leagues?.playerDivision?.tier ?? 1 });
}

/** Kurzfassung eines Pakets für Verlauf und Nachrichten. */
export function termsSummary(t: ContractTerms): string {
  const parts = [`Gehalt ${fmtWage(t.wage)}`, `${t.years} Jahr${t.years > 1 ? 'e' : ''}`];
  if (t.signing) parts.push(`Handgeld ${fmtPriceAuto(t.signing)}`);
  if (t.appearance) parts.push(`Einsatzprämie ${fmtPriceAuto(t.appearance)}`);
  if (t.goal) parts.push(`Torprämie ${fmtPriceAuto(t.goal)}`);
  if (t.cleanSheet) parts.push(`Zu-null-Prämie ${fmtPriceAuto(t.cleanSheet)}`);
  if (t.title) parts.push(`Titelprämie ${fmtPriceAuto(t.title)}`);
  if (t.stay) parts.push(`Klassenerhalt ${fmtPriceAuto(t.stay)}`);
  if (t.raise) parts.push(`+${pct(t.raise)} je Saison`);
  if (t.fixedFee) parts.push(`Ablöse festgeschrieben ${fmtPriceAuto(t.fixedFee)}`);
  if (t.release) parts.push(`Ausstiegsklausel ${fmtPriceAuto(t.release)}`);
  if (t.option !== 'none') parts.push(t.option === 'club' ? 'Vereinsoption +1 Jahr' : 'Spieleroption +1 Jahr');
  if (t.relegation) parts.push(`−${pct(t.relegation)} bei Abstieg`);
  if (t.loyalty) parts.push(`Treueprämie ${fmtPriceAuto(t.loyalty)}`);
  if (t.success) parts.push(`+${pct(t.success)} bei Europapokal`);
  if (t.agent) parts.push(`Provision ${fmtPriceAuto(t.agent)}`);
  if (t.promises.length) parts.push(`Zusagen: ${t.promises.map((x) => PROMISES[x].label).join(', ')}`);
  return parts.join(', ');
}

/** Bausteine eines vereinbarten Pakets in den Vertrag schreiben (Gehalt/Laufzeit setzt der Aufrufer). */
export function applyContractExtras(g: Game, p: Player, t: ContractTerms, today: string, resetBonusBase: boolean): void {
  const k = p.contract;
  const u = (v: number) => (v ? v : undefined);
  k.appearanceBonus = u(t.appearance);
  k.goalBonus = u(t.goal);
  k.cleanSheetBonus = u(t.cleanSheet);
  k.titleBonus = u(t.title);
  k.stayBonus = u(t.stay);
  k.annualRaise = u(t.raise);
  k.raisedFor = g.season;
  k.fixedFee = u(t.fixedFee);
  k.releaseClause = u(t.release);
  k.option = t.option === 'none' ? undefined : t.option;
  k.relegationCut = u(t.relegation);
  k.loyaltyBonus = u(t.loyalty);
  k.successRaise = u(t.success);
  if (t.promises.includes('keinRivale')) k.noRivalSale = true;
  k.signed = { date: today, signing: u(t.signing), agent: u(t.agent) };
  if (resetBonusBase || !k.bonusPaid) {
    const s = p.seasonStats;
    k.bonusPaid = { season: g.season, apps: s?.appearances ?? 0, goals: s?.goals ?? 0, cs: s?.cleanSheets ?? 0 };
  }
}

/** Kurzfassung der Zusatz-Bausteine eines Transfer-Angebots (Verlauf). */
export function extrasLine(x: NonNullable<import('../engine/transferMarket').PlayerOffer['extras']>): string {
  return [x.appearance && `Einsatzprämie ${fmtPriceAuto(x.appearance)}`, x.goal && `Torprämie ${fmtPriceAuto(x.goal)}`, x.cleanSheet && `Zu-null-Prämie ${fmtPriceAuto(x.cleanSheet)}`,
    x.title && `Titelprämie ${fmtPriceAuto(x.title)}`, x.stay && `Klassenerhalt ${fmtPriceAuto(x.stay)}`, x.raise && `+${pct(x.raise)} je Saison`,
    x.relegation && `−${pct(x.relegation)} bei Abstieg`, x.fixedFee && `Ablöse festgeschrieben ${fmtPriceAuto(x.fixedFee)}`,
    x.option !== 'none' && (x.option === 'club' ? 'Vereinsoption' : 'Spieleroption')].filter(Boolean).join(', ');
}

/** Bausteine aus dem Spielergespräch beim Transfer (Verhandlungstisch) übernehmen. */
export function applyTransferExtras(g: Game, p: Player, x: NonNullable<import('../engine/transferMarket').PlayerOffer['extras']>, today: string): void {
  const k = p.contract;
  const u = (v: number) => (v ? v : undefined);
  k.appearanceBonus = u(x.appearance); k.goalBonus = u(x.goal); k.cleanSheetBonus = u(x.cleanSheet);
  k.titleBonus = u(x.title); k.stayBonus = u(x.stay); k.annualRaise = u(x.raise); k.raisedFor = g.season;
  k.option = x.option === 'none' ? undefined : x.option; k.relegationCut = u(x.relegation); k.fixedFee = u(x.fixedFee);
  const s = p.seasonStats;
  k.bonusPaid = { season: g.season, apps: s?.appearances ?? 0, goals: s?.goals ?? 0, cs: s?.cleanSheets ?? 0 };
  k.signed = { date: today };
}

/** Bausteine beim Vereinswechsel löschen (der neue Verein schließt einen neuen Vertrag). */
export function clearContractExtras(k: Contract): void {
  k.appearanceBonus = undefined; k.goalBonus = undefined; k.cleanSheetBonus = undefined; k.titleBonus = undefined; k.stayBonus = undefined;
  k.annualRaise = undefined; k.raisedFor = undefined; k.fixedFee = undefined; k.option = undefined; k.relegationCut = undefined;
  k.bonusPaid = undefined; k.signed = undefined;
}

/** Bisherige Bausteine eines Vertrags als Paket (Vorbelegung des Angebots, Anzeige). */
export function termsOfContract(p: Player, years: number): ContractTerms {
  const k = p.contract;
  return {
    wage: k.weeklyWage, years, signing: 0, appearance: k.appearanceBonus ?? 0, goal: k.goalBonus ?? 0, cleanSheet: k.cleanSheetBonus ?? 0,
    title: k.titleBonus ?? 0, stay: k.stayBonus ?? 0, raise: k.annualRaise ?? 0, fixedFee: k.fixedFee ?? 0, release: k.releaseClause ?? 0,
    option: k.option ?? 'none', relegation: k.relegationCut ?? 0, promises: [], agent: 0, loyalty: k.loyaltyBonus ?? 0, success: k.successRaise ?? 0,
  };
}

// -----------------------------------------------------------------------------
// Täglich: Einsatz-, Tor- und Zu-null-Prämien
// -----------------------------------------------------------------------------
export function contractBonusesDaily(g: Game, today: string): void {
  const club = g.clubs[g.managedClubId];
  if (!club || (g as { simAutoManage?: boolean }).simAutoManage) return;
  if (!g.contracts2) state(g);
  const scale = economyScale(yearOf(today));
  let total = 0;
  const who: string[] = [];
  for (const id of club.playerIds) {
    const p = g.players[id];
    const k = p?.contract;
    if (!k || !(k.appearanceBonus || k.goalBonus || k.cleanSheetBonus)) continue;
    const s = p.seasonStats;
    const cur = { apps: s?.appearances ?? 0, goals: s?.goals ?? 0, cs: s?.cleanSheets ?? 0 };
    const bp = k.bonusPaid && k.bonusPaid.season === g.season ? k.bonusPaid : { season: g.season, apps: 0, goals: 0, cs: 0 };
    const da = Math.max(0, cur.apps - bp.apps), dg = Math.max(0, cur.goals - bp.goals), dc = Math.max(0, cur.cs - bp.cs);
    k.bonusPaid = { season: g.season, ...cur };
    const sum = da * (k.appearanceBonus ?? 0) + dg * (k.goalBonus ?? 0) + dc * (k.cleanSheetBonus ?? 0);
    if (sum <= 0) continue;
    total += sum;
    who.push(p.lastName);
  }
  if (total > 0) book(club.finances, today, -Math.round(total * scale), 'wages', `Vertragsprämien (${who.slice(0, 4).join(', ')}${who.length > 4 ? ' …' : ''})`, true);
}

// -----------------------------------------------------------------------------
// 29.6.: Titelprämie, Klassenerhalt vormerken
// -----------------------------------------------------------------------------
export function contractSeasonEndDaily(g: Game, today: string): void {
  if (today.slice(5) !== '06-29') return;
  const club = g.clubs[g.managedClubId];
  if (!club || (g as { simAutoManage?: boolean }).simAutoManage) return;
  const st = state(g);
  const pos = (g.table?.rows ?? []).findIndex((r) => r.clubId === club.id) + 1;
  const titles = (pos === 1 ? 1 : 0) + (g.cup?.winnerClubId === club.id ? 1 : 0);
  const scale = economyScale(yearOf(today));
  const paid: string[] = [];
  st.stayPending = [];
  for (const id of club.playerIds) {
    const p = g.players[id];
    if (!p) continue;
    if (titles && p.contract.titleBonus) {
      const amt = p.contract.titleBonus * titles;
      book(club.finances, today, -Math.round(amt * scale), 'wages', `Titelprämie ${p.fullName}`, true);
      paid.push(`${p.fullName}: ${fmtPriceAuto(amt)}`);
    }
    if (p.contract.stayBonus) st.stayPending.push({ name: p.fullName, amount: p.contract.stayBonus });
  }
  if (paid.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor', subject: `Titelprämien ausgezahlt (${paid.length})`,
      shortText: 'Vertraglich vereinbarte Prämien für den Titel.', bodyText: `Ausgezahlt:\n\n${paid.join('\n')}`,
    }));
  }
}

// -----------------------------------------------------------------------------
// Saisonstart (aus game/season.ts nach dem Auf-/Abstieg)
// -----------------------------------------------------------------------------
export function contractSeasonStart(g: Game): void {
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const st = state(g);
  const today = g.calendar.currentDate;
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const relegated = tier > (st.lastTier ?? tier);
  st.lastTier = tier;
  if ((g as { simAutoManage?: boolean }).simAutoManage) { st.stayPending = []; return; }
  const scale = economyScale(yearOf(today));
  const notes: string[] = [];
  if (!relegated && st.stayPending?.length) {
    const sum = st.stayPending.reduce((s, x) => s + x.amount, 0);
    book(club.finances, today, -Math.round(sum * scale), 'wages', `Klassenerhalt-Prämien (${st.stayPending.length})`, true);
    notes.push(`Klassenerhalt-Prämien: ${fmtPriceAuto(sum)} an ${st.stayPending.length} Spieler.`);
  }
  st.stayPending = [];
  for (const id of club.playerIds) {
    const p = g.players[id];
    const k = p?.contract;
    if (!k) continue;
    if (relegated && k.relegationCut) {
      const old = k.weeklyWage;
      k.weeklyWage = Math.round(old * (1 - k.relegationCut) * 1e4) / 1e4;
      notes.push(`${p.fullName}: Abstiegsklausel −${pct(k.relegationCut)}, neu ${fmtWage(k.weeklyWage)}.`);
      k.relegationCut = undefined;
    }
    if (k.annualRaise && k.raisedFor !== g.season) {
      k.weeklyWage = Math.round(k.weeklyWage * (1 + k.annualRaise) * 1e4) / 1e4;
      k.raisedFor = g.season;
      notes.push(`${p.fullName}: gestaffeltes Gehalt +${pct(k.annualRaise)}, neu ${fmtWage(k.weeklyWage)}.`);
    }
  }
  if (notes.length) {
    pushMessage(g.messages, makeMessage({
      date: today, category: 'contract', from: 'Sportdirektor', subject: relegated ? 'Abstieg: Vertragsklauseln greifen' : 'Vertragsklauseln zum Saisonstart',
      shortText: notes[0], bodyText: notes.join('\n'),
    }));
  }
}

// -----------------------------------------------------------------------------
// Optionen
// -----------------------------------------------------------------------------
/** Kann die Vereinsoption jetzt gezogen werden? (letzte Saison des Vertrags) */
export function clubOptionOpen(g: Game, p: Player): boolean {
  const today = g.calendar.currentDate;
  const end = p.contract.expiryDate;
  const m = Number(today.slice(5, 7));
  const seasonEnd = `${Number(today.slice(0, 4)) + (m >= 7 ? 1 : 0)}-06-30`;
  return p.clubId === g.managedClubId && p.contract.option === 'club' && end <= seasonEnd && end >= today;
}

export function exerciseClubOption(g: Game, pid: string): string {
  const p = g.players[pid];
  if (!p || !clubOptionOpen(g, p)) return 'Die Option kann jetzt nicht gezogen werden.';
  p.contract.expiryDate = `${Number(p.contract.expiryDate.slice(0, 4)) + 1}-06-30`;
  p.contract.option = undefined;
  p.contract.talks = undefined;
  const sat = p.contract.satisfaction ?? 60;
  p.contract.satisfaction = Math.max(0, sat - 4);
  pushMessage(g.messages, makeMessage({
    date: g.calendar.currentDate, category: 'contract', from: 'Sportdirektor', relatedId: p.id,
    subject: `Option gezogen: ${p.fullName} bleibt bis ${p.contract.expiryDate.slice(0, 4)}`,
    shortText: 'Ein weiteres Jahr zu den bisherigen Bedingungen.',
    bodyText: `Du hast die Vereinsoption gezogen. ${p.fullName} bleibt ein weiteres Jahr zu unveränderten Bezügen (${fmtWage(p.contract.weeklyWage)}). Begeistert ist er nicht – er hätte lieber neu verhandelt.`,
  }));
  return `${p.lastName} bleibt bis 30.06.${p.contract.expiryDate.slice(0, 4)}.`;
}

/** Nachrüstung: Zustand anlegen, kaputte Gesprächsstände verwerfen (idempotent). */
export function migrateContracts2(g: Game): void {
  state(g);
  for (const id of g.clubs[g.managedClubId]?.playerIds ?? []) {
    const t = g.players[id]?.contract.talks;
    if (t?.neg && (t.neg.v !== 1 || !t.neg.ask || !Array.isArray(t.neg.log))) t.neg = undefined;
  }
}
