// =============================================================================
// FOOTBALL MANAGER 1980 — Haupt-App (modernes Dark-Theme UI)
// =============================================================================
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import {
  Club, Player, Match, LeagueTable, GameCalendar, PointSystem, TrainingFocus,
  InboxMessage, MessageCategory, ManagerProfile, NewGameOptions, Difficulty, ManagerStyle, ManagerBackground,
  WeeklyTrainingPlan, DaySlots, TrainingBlock, PlayerDevReveal,
  renderStars, starsToPotential, ATTRIBUTE_LABELS_DE, POSITION_GROUPS,
  YouthAgeClass, YOUTH_AGE_CLASS_ORDER, YOUTH_AGE_CLASS_LABEL, YOUTH_AGE_CLASS_RANGE,
  youthAgeClass, YOUTH_ENTRY_AGE,
  CupState, CupTie,
  ClubCommerce, SponsorContract, SponsorOffer, CateringMode, FacilityKey,
} from './types';
import { generateWorld, getClubSeeds, generateCupAmateurs, SECOND_LIGA_NORD_SEEDS, SECOND_LIGA_SUED_SEEDS, buildProClub } from './data/generate';
import {
  createCup, drawRound, simulateCupTie, roundWinners, nextPlayerTie,
  decisionBadge, findTie, ROUND_NAMES,
} from './engine/cup';
import {
  EuroClub, EuroCompId, allEuroClubs, EURO_COMP_NAMES, EURO_COMP_SHORT,
} from './data/europe';
import {
  createEuroCup, drawEuroRound, simulateEuroTie, computeGermanEuroQualifiers,
  nextPlayerEuroTie,
} from './engine/euro';
import {
  makeInfrastructure, applyFacilityEffects, FACILITIES, FACILITY_BY_KEY,
  canUpgrade, upgradeFacility, upgradeCost, MAX_LEVEL, CAPACITY_PER_LEVEL,
  medicalRecoveryBonus, medicalRehabBonus,
  rehaRehabBonus, rehaRecoveryBonus, dataScoutingBonus, nlzGrowthBonus,
  facilityUpkeep, FAC_UPKEEP_BASE, LEVEL_MULT,
} from './engine/infrastructure';
import {
  STAFF_ROLES, STAFF_BY_ID, STAFF_EPOCHS, STAFF_GROUP_META, STAFF_CAPS,
  staffMonthlySalary, staffMonthlyTotal, computeStaffEffects, staffAvailable,
  StaffEffects,
} from './data/staff';
import {
  MARKETING_AREAS, MARKETING_BY_ID, MARKETING_EPOCHS, marketingAvailable,
  areaMonthlyCostBase, areaBenefit, marketingMonthlyBase, marketingIncomeBase,
  marketingReputationNudge,
} from './data/marketing';
import {
  ACTIVITY_DEFS, ActivityType, PlannedActivity, activityId, addDaysUTC,
  daysInRange, activityCostBase, activityIncomeBase,
} from './data/activities';
import {
  generateYouthPlayer, academyIntake, developYouthWeekly, ageYouthPlayers, promoteYouth,
  academyStartingCohort, graduateYouth,
} from './engine/youth';
import { generateFixtures, calculateTable } from './engine/league';
import {
  LeagueSystem, LeagueDivision, DivisionMeta, SimClub, LeagueGroup,
  divisionLabel, buildDivision, advanceDivision, flushDivision, simClubFromClub,
  mulberry32, hashStr, simMatchGoals, simDisplayName,
} from './engine/leagues';
import {
  DDR_OBERLIGA_SEEDS, DDR_LIGA_SEEDS, DDR_OBERLIGA_ID, DDR_LIGA_ID,
} from './data/ddr';
import { generateSeasonCalendar, CalendarEngine, seasonLabel } from './engine/calendar';
import {
  TIMELINE, TimelineEvent, TIMELINE_TYPE_META, dueTimelineEvents, timelineEventsUpTo,
  seasonStartYear,
} from './data/timeline';
import {
  computeSeasonTransition, CurrentDivision, TransitionResult, LeagueReform,
  LEAGUE_REFORMS,
} from './data/reforms';
import {
  economyScale, formatMoney, formatMoneyShort, currencyForYear, yearOf, DM_PER_EUR,
} from './engine/economy';
import { MatchEngine } from './engine/match';
import { trainPlayers, dailyRecovery } from './engine/training';
import {
  TRAINING_BLOCKS, BLOCKS_BY_ID, INTENSITY_LABELS, createDefaultWeeklyPlan,
  expectedFitnessDelta, dayLoad, applyDailyTraining,
} from './engine/weeklyTraining';
import { getAvailablePlayers, makeOffer, runAITransfers, setTransferDate } from './engine/transfers';
import { updatePlayerRatings, updateAges, runWeeklyDevelopment, runRatingCeremony, RatingResult } from './engine/development';
import { applyMatchEffects, applyTrainingForm, formIndicator, SideResult } from './engine/form';
import { makeMessage, pushMessage, unreadCount, CATEGORY_META } from './engine/messages';
import {
  saveGame, loadGame, listSaves, deleteSave, nextFreeSlot, SaveMeta,
  loadSettings, saveSettings, AppSettings, DisplayMode, storageAvailable,
} from './engine/save';
import { WIKI_CATEGORIES, WIKI_ARTICLES, searchWiki, WikiArticle } from './data/wiki';
import PlayerAvatar from './components/PlayerAvatar';
import PlayerModal from './components/PlayerModal';
import ClubModal, { ClubProfileData, ClubMatchLine } from './components/ClubModal';
import ClubCrest from './components/ClubCrest';
import JerseySVG, { type JerseyPattern } from './components/JerseySVG';
import ClubEditorModal from './components/ClubEditorModal';
import { getClubKitDisplay } from './data/kits';
import { hydrateClubOverrides } from './data/clubOverrides';
import LineupView from './components/LineupView';
import TacticsView from './components/TacticsView';
import MatchLiveView from './components/MatchLiveView';
import Icon, { type IconName } from './components/Icon';
import { autoFillLineup } from './engine/lineupAI';
import {
  book, bookHomeMatch, bookMonthly, computeMonthly, forecastSeasonEnd,
  totalIncome, totalExpense, weeklyWageBill,
  bookCupHomeMatch, bookCupPrize,
  expectedAttendance, expectedAttendanceRate, cateringMatchIncome, matchdayIncome,
  generateShirtOffers, generateBandenOffers, bandenBaseValue,
  CATERING_NETPERHEAD, CATERING_LEASE, CATERING_UPKEEP, SHIRT_TIERS,
} from './engine/finances';

// -----------------------------------------------------------------------------
// Kommerz-Helfer (Trikot/Banden-Vertraege) — modulweit, fuer Migration & Saisonstart.
// -----------------------------------------------------------------------------
/** Waehlt aus einer Angebotsliste das wertvollste Angebot. */
function bestOffer(offers: SponsorOffer[]): SponsorOffer | undefined {
  return offers.slice().sort((a, b) => b.annualValue - a.annualValue)[0];
}

/** Macht aus einem Angebot einen laufenden Vertrag. */
function offerToContract(o: SponsorOffer): SponsorContract {
  return { name: o.name, annualValue: o.annualValue, yearsTotal: o.years, yearsLeft: o.years };
}

/** Erzeugt Default-Kommerz fuer einen Altstand-Verein (Migration). */
function migrateCommerce(club: Club, isManaged: boolean): ClubCommerce {
  const shirtOffers = generateShirtOffers(club, `mig-shirt-${club.id}`);
  const bandenOffers = generateBandenOffers(club, `mig-banden-${club.id}`);
  if (isManaged) {
    return { cateringMode: 'verpachtung', shirtOffers, bandenOffers };
  }
  const s = bestOffer(shirtOffers);
  const b = bestOffer(bandenOffers);
  return {
    cateringMode: 'verpachtung',
    shirtSponsor: s ? offerToContract(s) : undefined,
    banden: b ? offerToContract(b) : undefined,
  };
}

// -----------------------------------------------------------------------------
// Zentraler Spielzustand (mutabel, in Ref gehalten). Reines Datenobjekt →
// direkt JSON-serialisierbar (Speichern/Laden).
// -----------------------------------------------------------------------------
interface Game {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  /** Jugendspieler aller Vereine (getrennt vom Profikader gehalten). */
  youthPlayers: Record<string, Player>;
  fixtures: Match[];
  table: LeagueTable;
  calendar: GameCalendar;
  pointSystem: PointSystem;
  managedClubId: string;
  season: string;
  manager: ManagerProfile;
  difficulty: Difficulty;
  injuriesEnabled: boolean;
  messages: InboxMessage[];
  /** Wochen-Trainingsplan des Manager-Vereins (7 Tage × 3 Slots). */
  trainingPlan: WeeklyTrainingPlan;
  /** DFB-Pokal-Wettbewerb (parallel zur Bundesliga). */
  cup: CupState;
  /** Europapokal-Wettbewerbe (optional -> abwaertskompatibel mit Alt-Saves). */
  euroCups?: { ec: CupState | null; cwc: CupState | null; uefa: CupState | null };
  /** Leichte auslaendische Europapokal-Vereine (aus allEuroClubs()). */
  euroClubs?: Record<string, EuroClub>;
  /** IDs bereits ausgelöster Chronik-Meilensteine (Epochen-/Timeline-System). */
  firedMilestones: string[];
  /** Freigeschaltete Features (durch Meilensteine, z. B. "champions_league"). */
  unlockedFeatures: string[];
  /** IDs der aktuell angestellten Mitarbeiter (Block p11, Bereich „Mitarbeiter"). */
  hiredStaff: string[];
  /** Marketing-Budget je Bereich: Bereichs-ID → Anzahl Einheiten (0 = aus). */
  marketing: Record<string, number>;
  /** Geplante Aktivitäten (Trainingslager, Freundschaftsspiele, Teambuilding). */
  activities: PlannedActivity[];
  /** Mehrstufiges Ligasystem (Ebenen/Staffeln oberhalb der Spielerliga). */
  leagues: LeagueSystem;
  /** Aggregierte Nicht-Spieler-Vereine (2. Liga usw.), rein per Stärke simuliert. */
  simClubs: Record<string, SimClub>;
  /** IDs bereits angewandter Ligareformen (verhindert Doppel-Migration beim Laden). */
  appliedReforms: string[];
}

type Screen = 'dashboard' | 'table' | 'fixtures' | 'squad' | 'lineup' | 'training' | 'transfers' | 'finances' | 'youth' | 'facilities' | 'cup' | 'chronicle' | 'news' | 'wiki' | 'staff' | 'marketing' | 'calendar'
  // Kategorie-Dashboards (Übersichtsseiten je Hauptkategorie)
  | 'cat-spieltag' | 'cat-kader' | 'cat-transfers' | 'cat-finanzen' | 'cat-verein' | 'cat-statistiken'
  // Neue Einzelseiten
  | 'tactics' | 'stadium' | 'presse' | 'vertraege' | 'beobachtung' | 'verhandlungen' | 'sponsoring' | 'fans' | 'international';

// -----------------------------------------------------------------------------
// Währung ära-gerecht: bis 2001 DM, ab 2002 EUR (1 EUR = 1,95583 DM). Damit die
// zahlreichen bestehenden fmtDM/fmtDMfull-Aufrufe ohne Jahr weiter funktionieren,
// hält ein Modul-Level-Jahr das aktuelle Spieljahr; es wird bei jeder Verarbeitung
// und jedem Render aktualisiert (setDisplayYear).
// -----------------------------------------------------------------------------
let _displayYear = 1975;
function setDisplayYear(year: number): void { _displayYear = year; }
const fmtDM = (n: number) => formatMoneyShort(n, _displayYear);
const fmtDMfull = (n: number) => formatMoney(n, _displayYear);
const vColor = (v: number) => v >= 75 ? 'var(--green)' : v >= 60 ? 'var(--yellow)' : v >= 45 ? 'var(--orange)' : 'var(--red)';

// Moral-Stufen in aufsteigender Reihenfolge (für Aktivitäts-Effekte, Block p11).
const MORALE_ORDER: import('./types').PlayerMorale[] = ['very_low', 'low', 'okay', 'good', 'excellent'];
/** Hebt die Moral um `steps` Stufen an (begrenzt auf „excellent"). */
function bumpMorale(m: import('./types').PlayerMorale, steps: number): import('./types').PlayerMorale {
  const i = MORALE_ORDER.indexOf(m);
  if (i < 0) return m;
  return MORALE_ORDER[Math.max(0, Math.min(MORALE_ORDER.length - 1, i + steps))];
}

// -----------------------------------------------------------------------------
// DFB-Pokal — Hilfsfunktionen für Kalender & Nachrichten
// -----------------------------------------------------------------------------

/** Kleiner FNV-1a-Hash für stabile Seeds aus Strings. */
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fügt für jede Pokalrunde ein Kalender-Event ein (chronologisch einsortiert). */
function addCupCalendarEvents(calendar: GameCalendar, cup: CupState): void {
  let cnt = 0;
  for (const round of cup.rounds) {
    calendar.events.push({
      id: `cupev_${round.index}`,
      date: round.date,
      type: 'cup_matchday',
      title: `DFB-Pokal: ${round.name}`,
      description: `${round.name} im DFB-Pokal ${cup.season}.`,
      cupRoundIndex: round.index,
      processed: false,
      requiresAction: false,
    });
    cnt++;
  }
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
  void cnt;
}

/** Baut die Menge aller Liga-Spieltag-Daten (für kollisionsfreie Pokaltermine). */
function leagueDateSet(fixtures: Match[]): Set<string> {
  return new Set(fixtures.map((m) => m.date));
}

// -----------------------------------------------------------------------------
// EUROPAPOKAL — Hilfsfunktionen für Kalender, Aufbau & Nachrichten
// -----------------------------------------------------------------------------

/** Menge aller DFB-Pokal-Termine (zur Kollisionsvermeidung der Euro-Termine). */
function cupDateSet(cup: CupState | null | undefined): Set<string> {
  const s = new Set<string>();
  if (cup) for (const r of cup.rounds) s.add(r.date);
  return s;
}

/** Fügt für jede Runde eines Europapokals ein Kalender-Event ein. */
function addEuroCalendarEvents(calendar: GameCalendar, comp: EuroCompId, cup: CupState): void {
  for (const round of cup.rounds) {
    calendar.events.push({
      id: `euroev_${comp}_${round.index}`,
      date: round.date,
      type: 'euro_matchday',
      title: `${EURO_COMP_NAMES[comp]}: ${round.name}`,
      description: `${round.name} im ${EURO_COMP_NAMES[comp]} ${cup.season}.`,
      cupRoundIndex: round.index,
      euroComp: comp,
      processed: false,
      requiresAction: false,
    });
  }
  calendar.events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Erstellt die drei Europapokal-Wettbewerbe für eine Saison, ergänzt die
 * Kalendereinträge und liefert sie als `euroCups`-Objekt zurück. Deutsche
 * Starter kommen aus `quals`; auslaendische fix aus europe.ts (getrennt je comp).
 */
function buildEuroCupsForSeason(
  quals: Record<EuroCompId, string[]>,
  euroClubs: Record<string, EuroClub>,
  leagueDates: Set<string>,
  cupDates: Set<string>,
  seedBase: string,
  earliest: string,
  managedClubId: string,
  calendar: GameCalendar,
): { ec: CupState | null; cwc: CupState | null; uefa: CupState | null } {
  const foreignByComp: Record<EuroCompId, string[]> = { ec: [], cwc: [], uefa: [] };
  for (const c of Object.values(euroClubs)) foreignByComp[c.comp].push(c.id);

  const comps: EuroCompId[] = ['ec', 'cwc', 'uefa'];
  const out: { ec: CupState | null; cwc: CupState | null; uefa: CupState | null } = {
    ec: null, cwc: null, uefa: null,
  };
  for (const comp of comps) {
    const germanIds = (quals[comp] ?? []).filter(Boolean);
    if (germanIds.length === 0) continue;
    const cup = createEuroCup(
      comp,
      germanIds,
      foreignByComp[comp],
      leagueDates,
      cupDates,
      hashSeed(`${seedBase}:euro:${comp}`),
      earliest,
      managedClubId,
    );
    addEuroCalendarEvents(calendar, comp, cup);
    out[comp] = cup;
  }
  return out;
}

/** Baut die Auslosungs-Info-Nachricht des Europapokals (nur wenn Spieler dabei). */
function euroDrawMessage(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, managedClubId: string,
  roundIndex: number, date: string,
): InboxMessage | null {
  const round = cup.rounds[roundIndex];
  if (!round) return null;
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  if (!myTie) return null; // Nachrichten nur, wenn der Spielerverein beteiligt ist.
  const name = (id: string) => clubs[id]?.name ?? euroClubs[id]?.name ?? id;
  const heim = myTie.homeClubId === managedClubId;
  const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
  const compName = EURO_COMP_NAMES[comp];
  return makeMessage({
    date,
    category: 'cup',
    from: 'Europapokal-Kommission',
    subject: `Auslosung ${round.name} — ${compName} ${cup.season}`,
    shortText: `Dein Los: ${gegner}`,
    bodyText: `Die Auslosung der ${round.name} im ${compName} ${cup.season} ist erfolgt.\n\n`
      + `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nViel Erfolg in Europa!`,
    actionRequired: false,
  });
}

/** Baut die Ergebnis-Nachricht der eigenen Europapokal-Begegnung. */
function euroResultMessage(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, managedClubId: string,
  tie: CupTie, roundIndex: number, prize: number,
): InboxMessage {
  const round = cup.rounds[roundIndex];
  const name = (id: string) => clubs[id]?.name ?? euroClubs[id]?.name ?? id;
  const myHome = tie.homeClubId === managedClubId;
  const opp = myHome ? name(tie.awayClubId) : name(tie.homeClubId);
  const advanced = tie.winnerClubId === managedClubId;
  const isFinal = roundIndex === cup.rounds.length - 1;
  const badge = decisionBadge(tie);
  const scoreLine = `${tie.homeGoals}:${tie.awayGoals}${badge ? ' ' + badge : ''}${tie.penalties ? ` (Elfmeter ${tie.penalties.home}:${tie.penalties.away})` : ''}`;
  const hName = name(tie.homeClubId); const aName = name(tie.awayClubId);
  const compName = EURO_COMP_NAMES[comp];
  let subject: string; let shortText: string; let body: string;
  if (isFinal && advanced) {
    subject = `Europapokalsieger! ${compName} ${cup.season}`;
    shortText = `Ihr habt den ${compName} gewonnen!`;
    body = `Sensation! Im Finale des ${compName} ${cup.season} setzte sich dein Verein mit ${scoreLine} gegen ${opp} durch.\n\nEin historischer Triumph in Europa! Prämie: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else if (advanced) {
    subject = `Europapokal: Weiter! ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} gewonnen — weiter in Europa.`;
    body = `${round.name}, ${compName} ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein steht in der nächsten Runde! Prämie für diese Runde: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else {
    subject = `Europapokal-Aus: ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} verloren — in Europa ausgeschieden.`;
    body = `${round.name}, ${compName} ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein ist gegen ${opp} ausgeschieden. Der Europapokal-Traum ist für diese Saison beendet.`;
  }
  return makeMessage({
    date: tie.date, category: 'cup', from: 'Spielbericht Europapokal',
    subject, shortText, bodyText: body, relatedId: tie.match?.id,
  });
}

/** Dezente Chronik-Notiz zum Europapokalsieger (auch wenn nicht der Spieler). */
function euroWinnerChronicle(
  comp: EuroCompId, cup: CupState, clubs: Record<string, Club>,
  euroClubs: Record<string, EuroClub>, date: string,
): InboxMessage {
  const winner = cup.winnerClubId;
  const wname = winner ? (clubs[winner]?.name ?? euroClubs[winner]?.name ?? winner) : '';
  const compName = EURO_COMP_NAMES[comp];
  return makeMessage({
    date, category: 'media', from: 'Europapokal-Chronik',
    subject: `${compName} ${cup.season}: ${wname}`,
    shortText: `${wname} gewinnt den ${compName}.`,
    bodyText: `Das Finale des ${compName} ${cup.season} ist entschieden. ${wname} sichert sich den Titel.`,
    actionRequired: false,
  });
}

// -----------------------------------------------------------------------------
// LIGASYSTEM-AUFBAU (Ebenen oberhalb/neben der Spielerliga)
// -----------------------------------------------------------------------------
// Erzeugt die aggregierten 2.-Liga-Vereine (Nord/Süd) als SimClubs. Die
// eigentliche Spielerliga (Tier 1) lebt weiter in game.clubs/game.table.
function buildSecondLigaSimClubs(): Record<string, SimClub> {
  const out: Record<string, SimClub> = {};
  for (const s of SECOND_LIGA_NORD_SEEDS) {
    out[s.id] = {
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: s.strength,
      colors: { primary: s.primary, secondary: s.secondary }, tier: 2, group: 'nord',
    };
  }
  for (const s of SECOND_LIGA_SUED_SEEDS) {
    out[s.id] = {
      id: s.id, name: s.name, shortName: s.shortName, city: s.city, strength: s.strength,
      colors: { primary: s.primary, secondary: s.secondary }, tier: 2, group: 'sued',
    };
  }
  return out;
}

// Baut das komplette Ligasystem für einen Saisonstart: Spielerliga (Tier 1) als
// Meta + die beiden simulierten 2.-Liga-Staffeln. seasonStart = ISO-Datum des
// ersten Ligaspieltags (für die Sim-Fixtures).
function buildLeagueSystem(
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
  seasonStart: string,
): LeagueSystem {
  const nordIds = Object.values(simClubs).filter((s) => s.tier === 2 && s.group === 'nord').map((s) => s.id);
  const suedIds = Object.values(simClubs).filter((s) => s.tier === 2 && s.group === 'sued').map((s) => s.id);
  const nord = buildDivision(
    { id: 'tier2-nord', name: '2. Liga Nord', tier: 2, group: 'nord' },
    nordIds, pointSystem, season, seasonStart,
  );
  const sued = buildDivision(
    { id: 'tier2-sued', name: '2. Liga Süd', tier: 2, group: 'sued' },
    suedIds, pointSystem, season, seasonStart,
  );
  return {
    playerDivision: { id: 'tier1', name: '1. Liga', tier: 1, group: null },
    otherDivisions: [nord, sued],
    season,
  };
}

// Baut die parallele DDR-Ligapyramide (bis zur Wiedervereinigung 1991/92):
// DDR-Oberliga (tier 101) + DDR-Liga (tier 102), beide Staffel 'nordost'. Die
// DDR-Sim-Vereine werden in `simClubs` aufgenommen und als zusätzliche
// simulierte Divisionen zurückgegeben (Aufnahme in leagues.otherDivisions).
// Die hohen tier-Werte halten die DDR-Ligen aus dem West-Auf-/Abstieg heraus.
function buildDdrDivisions(
  simClubs: Record<string, SimClub>,
  pointSystem: PointSystem,
  season: string,
  seasonStart: string,
): LeagueDivision[] {
  for (const s of DDR_OBERLIGA_SEEDS) simClubs[s.id] = { ...s };
  for (const s of DDR_LIGA_SEEDS) simClubs[s.id] = { ...s };
  const ober = buildDivision(
    { id: DDR_OBERLIGA_ID, name: 'DDR-Oberliga', tier: 101, group: 'nordost' },
    DDR_OBERLIGA_SEEDS.map((s) => s.id), pointSystem, season, seasonStart,
  );
  const liga = buildDivision(
    { id: DDR_LIGA_ID, name: 'DDR-Liga', tier: 102, group: 'nordost' },
    DDR_LIGA_SEEDS.map((s) => s.id), pointSystem, season, seasonStart,
  );
  return [ober, liga];
}

/** Baut die erste Pokal-Auslosungs-Nachricht (1. Hauptrunde). */
function cupDrawMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, date: string): InboxMessage {
  const round = cup.rounds[cup.currentRoundIndex];
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  const name = (id: string) => clubs[id]?.name ?? id;
  let body = `Die Auslosung der ${round.name} des DFB-Pokals ${cup.season} ist erfolgt. 32 Mannschaften kämpfen um den Pokal — 18 Bundesligisten und 14 Amateurvereine.\n\n`;
  if (myTie) {
    const heim = myTie.homeClubId === managedClubId;
    const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
    body += `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nViel Erfolg im Pokal!`;
  } else {
    body += 'Dein Verein ist in dieser Saison nicht für den Pokal gesetzt.';
  }
  return makeMessage({
    date,
    category: 'cup',
    from: 'DFB-Pokal-Kommission',
    subject: `Auslosung ${round.name} — DFB-Pokal ${cup.season}`,
    shortText: myTie
      ? `Dein Los: ${myTie.homeClubId === managedClubId ? name(myTie.awayClubId) : name(myTie.homeClubId)}`
      : 'Die 1. Hauptrunde ist ausgelost.',
    bodyText: body,
    actionRequired: false,
  });
}

/** Baut die Auslosungs-Nachricht einer Folgerunde (Achtelfinale … Finale). */
function cupNextDrawMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, roundIndex: number, date: string): InboxMessage {
  const round = cup.rounds[roundIndex];
  const myTie = round.ties.find((t) => t.involvesPlayerClub);
  const name = (id: string) => clubs[id]?.name ?? id;
  let body = `Die Auslosung des ${round.name} im DFB-Pokal ${cup.season} ist erfolgt. Noch ${round.ties.length * 2} Mannschaften sind im Wettbewerb.\n\n`;
  if (myTie) {
    const heim = myTie.homeClubId === managedClubId;
    const gegner = heim ? name(myTie.awayClubId) : name(myTie.homeClubId);
    body += `Deine Begegnung: ${heim ? 'Heimspiel gegen' : 'Auswärts bei'} ${gegner} (${CalendarEngine.formatDate(round.date)}).\n\nWeiter geht's im Pokal!`;
  } else {
    body += 'Dein Verein ist im Pokal bereits ausgeschieden.';
  }
  return makeMessage({
    date,
    category: 'cup',
    from: 'DFB-Pokal-Kommission',
    subject: `Auslosung ${round.name} — DFB-Pokal ${cup.season}`,
    shortText: myTie
      ? `Dein Los: ${myTie.homeClubId === managedClubId ? name(myTie.awayClubId) : name(myTie.homeClubId)}`
      : `${round.name} ausgelost.`,
    bodyText: body,
    actionRequired: false,
  });
}

/** Baut die Ergebnis-Nachricht der eigenen Pokalbegegnung (Weiterkommen/Aus/Sieg). */
function cupResultMessage(cup: CupState, clubs: Record<string, Club>, managedClubId: string, tie: CupTie, roundIndex: number, prize: number): InboxMessage {
  const round = cup.rounds[roundIndex];
  const name = (id: string) => clubs[id]?.name ?? id;
  const myHome = tie.homeClubId === managedClubId;
  const opp = myHome ? name(tie.awayClubId) : name(tie.homeClubId);
  const advanced = tie.winnerClubId === managedClubId;
  const isFinal = roundIndex === cup.rounds.length - 1;
  const badge = decisionBadge(tie);
  const scoreLine = `${tie.homeGoals}:${tie.awayGoals}${badge ? ' ' + badge : ''}${tie.penalties ? ` (Elfmeter ${tie.penalties.home}:${tie.penalties.away})` : ''}`;
  const hName = name(tie.homeClubId); const aName = name(tie.awayClubId);
  let subject: string; let shortText: string; let body: string;
  if (isFinal && advanced) {
    subject = `🏆 DFB-Pokalsieger ${cup.season}!`;
    shortText = 'Ihr habt den DFB-Pokal gewonnen!';
    body = `Sensation! Im Finale des DFB-Pokals ${cup.season} setzte sich dein Verein mit ${scoreLine} gegen ${opp} durch.\n\nDer DFB-Pokal steht in der Vitrine — ein historischer Triumph! Prämie: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else if (advanced) {
    subject = `Pokal: Weiter! ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} gewonnen — weiter im Pokal.`;
    body = `${round.name}, DFB-Pokal ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein steht in der nächsten Runde! Prämie für diese Runde: ${Math.round(prize).toLocaleString('de-DE')} DM.`;
  } else {
    subject = `Pokal-Aus: ${hName} ${scoreLine} ${aName}`;
    shortText = `${round.name} verloren — im Pokal ausgeschieden.`;
    body = `${round.name}, DFB-Pokal ${cup.season}:\n\n${hName} ${scoreLine} ${aName}\n\nDein Verein ist gegen ${opp} ausgeschieden. Der Pokaltraum ist für diese Saison beendet.`;
  }
  return makeMessage({
    date: tie.date, category: 'cup', from: 'Spielbericht Pokal',
    subject, shortText, bodyText: body, relatedId: tie.match?.id,
  });
}

/**
 * Historisch korrektes Punktesystem, abgeleitet aus dem Start-Jahr der Saison.
 * Bis Saison 1994/95 gilt die 2-Punkte-Regel, ab Saison 1995/96 automatisch die
 * 3-Punkte-Regel. NICHT mehr vom Nutzer wählbar – die Umstellung während eines
 * laufenden Spiels erfolgt automatisch über den Timeline-Meilenstein „3-Punkte-Regel".
 */
function historicPointSystem(season: string): PointSystem {
  const startYear = parseInt((season ?? '').slice(0, 4), 10);
  return Number.isFinite(startYear) && startYear >= 1995 ? '3-point' : '2-point';
}

// =============================================================================
// ROOT: Startmenü ⇄ Spiel
// =============================================================================
export default function App() {
  const gameRef = useRef<Game | null>(null);
  const [inGame, setInGame] = useState(false);
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);

  // Spielweiten Vereins-Override-Store (IndexedDB) einmalig beim Start laden und
  // danach neu rendern, damit hochgeladene Wappen/Trikots nach dem asynchronen
  // Laden erscheinen.
  useEffect(() => { hydrateClubOverrides().then(rerender).catch(() => {}); }, [rerender]);

  // --- Neues Spiel starten ---
  const startGame = useCallback((opts: NewGameOptions) => {
    // Punktesystem historisch fest ableiten (Spielstart immer 1975/76 → 2-Punkte-Regel).
    // Die Umstellung auf 3 Punkte erfolgt automatisch beim Meilenstein 1995/96.
    const pointSystem = historicPointSystem('1975/76');
    const world = generateWorld(opts.managedClubId);
    const clubList = Object.values(world.clubs);
    const fixtures = generateFixtures(clubList);
    for (const m of fixtures) {
      m.involvesPlayerClub = m.homeClubId === opts.managedClubId || m.awayClubId === opts.managedClubId;
    }
    const table = calculateTable(clubList, fixtures, pointSystem);
    const calendar = generateSeasonCalendar(fixtures);
    calendar.speedMs = opts.speedMs;
    const club = world.clubs[opts.managedClubId];

    // --- DFB-Pokal aufsetzen: 14 Amateurvereine ergänzen (→ 32er-Feld) ---
    const amateurs = generateCupAmateurs(14);
    Object.assign(world.clubs, amateurs.clubs);
    Object.assign(world.players, amateurs.players);
    const blClubIds = clubList.map((c) => c.id);
    const cup = createCup(
      blClubIds,
      Object.keys(amateurs.clubs),
      leagueDateSet(fixtures),
      hashSeed(opts.managedClubId + ':1980'),
      calendar.seasonStartDate,
      opts.managedClubId,
    );
    addCupCalendarEvents(calendar, cup);
    const welcome = makeMessage({
      date: calendar.currentDate,
      category: 'board',
      from: 'Vereinsvorstand',
      subject: `Willkommen bei ${club.name}, ${opts.manager.name}!`,
      shortText: 'Der Vorstand heißt dich willkommen und nennt das Saisonziel.',
      bodyText: `Sehr geehrte(r) ${opts.manager.name},\n\nherzlich willkommen als neue(r) Cheftrainer(in) von ${club.name}! Wir freuen uns auf die Zusammenarbeit in der Saison 1975/76.\n\nUnser Ziel: ${club.boardExpectation}\n\nDie Mannschaft steht bereit, der Kader ist einsatzfähig. Nutze das Training und den Transfermarkt klug. Wir vertrauen auf dein Geschick.\n\nSportliche Grüße\nDer Vorstand von ${club.name}`,
      actionRequired: false,
    });
    const cupDraw = cupDrawMessage(cup, world.clubs, opts.managedClubId, calendar.currentDate);
    // --- Europapokal 1975/76: feste historische deutsche Starter aufsetzen ---
    const euroClubs = allEuroClubs();
    const euroQuals = computeGermanEuroQualifiers(
      { clubs: world.clubs, players: world.players, managedClubId: opts.managedClubId, pointSystem } as any,
      true,
    );
    const euroCups = buildEuroCupsForSeason(
      euroQuals, euroClubs, leagueDateSet(fixtures), cupDateSet(cup),
      opts.managedClubId + ':1975', calendar.seasonStartDate, opts.managedClubId, calendar,
    );
    const euroDrawMsgs: InboxMessage[] = [];
    (['ec', 'cwc', 'uefa'] as EuroCompId[]).forEach((comp) => {
      const ec = euroCups[comp];
      if (ec) {
        const m = euroDrawMessage(comp, ec, world.clubs, euroClubs, opts.managedClubId, 0, calendar.currentDate);
        if (m) euroDrawMsgs.push(m);
      }
    });
    // --- Mehrstufiges Ligasystem: 2. Liga Nord/Süd (aggregiert simuliert) ---
    const simClubs = buildSecondLigaSimClubs();
    const ligaStart = fixtures[0]?.date ?? calendar.seasonStartDate;
    const leagues = buildLeagueSystem(simClubs, pointSystem, '1975/76', ligaStart);
    // Parallele DDR-Ligapyramide (bis zur Wiedervereinigung 1991/92) ergänzen.
    leagues.otherDivisions.push(...buildDdrDivisions(simClubs, pointSystem, '1975/76', ligaStart));
    const g0: Game = {
      clubs: world.clubs, players: world.players, youthPlayers: world.youthPlayers,
      fixtures, table, calendar,
      pointSystem, managedClubId: opts.managedClubId, season: '1975/76',
      manager: opts.manager, difficulty: opts.difficulty, injuriesEnabled: opts.injuriesEnabled,
      messages: [cupDraw, ...euroDrawMsgs, welcome],
      trainingPlan: createDefaultWeeklyPlan(),
      cup,
      euroCups,
      euroClubs,
      firedMilestones: [],
      unlockedFeatures: [],
      hiredStaff: [],
      marketing: {},
      activities: [],
      leagues,
      simClubs,
      appliedReforms: [],
    };
    // Startsaison-Meilensteine (1975/76) sofort auslösen → Chronik-Nachricht + Effekte.
    fireTimelineForSeason(g0, '1975/76', calendar.currentDate);
    setDisplayYear(yearOf(calendar.currentDate));
    gameRef.current = g0;
    setCurrentSlot(null);
    setInGame(true);
    rerender();
  }, [rerender]);

  // --- Spiel laden ---
  const doLoad = useCallback((slot: string) => {
    const s = loadGame<Game>(slot);
    if (!s) return;
    // Alte Spielstände kennen den Wochen-Trainingsplan noch nicht → nachrüsten.
    if (!s.game.trainingPlan || !Array.isArray(s.game.trainingPlan.days) || s.game.trainingPlan.days.length !== 7) {
      s.game.trainingPlan = createDefaultWeeklyPlan();
    }
    // Alte Spielstände ohne erweiterte Aufstellung → Startelf/Positionen nachrüsten.
    for (const c of Object.values(s.game.clubs) as any[]) {
      if (c.tactics && !c.tactics.assignedPositions) {
        Object.assign(c.tactics, autoFillLineup(c, s.game.players, c.tactics));
      }
    }
    // Alte Spielstände ohne Jugend/Infrastruktur → nachrüsten.
    if (!s.game.youthPlayers) s.game.youthPlayers = {};
    for (const c of Object.values(s.game.clubs) as any[]) {
      if (!c.infrastructure) c.infrastructure = makeInfrastructure(c.reputation ?? 65);
      if (!Array.isArray(c.youthPlayerIds)) c.youthPlayerIds = [];
      // Zukunfts-Einrichtungen (Block p11) auf Grundausbau nachrüsten.
      if (c.infrastructure.rehaCenter == null) c.infrastructure.rehaCenter = 1;
      if (c.infrastructure.nlz == null) c.infrastructure.nlz = 1;
      if (c.infrastructure.performanceCenter == null) c.infrastructure.performanceCenter = 1;
      if (c.infrastructure.dataCenter == null) c.infrastructure.dataCenter = 1;
      // Finanzsystem-Migration (SAVE_VERSION 9): Catering-Gebaeude, neue Buckets, Kommerz.
      if (c.infrastructure.catering == null) c.infrastructure.catering = (c.reputation ?? 65) >= 80 ? 2 : 1;
      if (c.finances) {
        const inc = c.finances.income ?? (c.finances.income = {} as any);
        for (const k of ['ticketSales', 'tvMoney', 'sponsorship', 'merchandise', 'transferIncome', 'prizeMoney', 'catering', 'advertising', 'membership', 'matchday', 'other']) {
          if (inc[k] == null) inc[k] = 0;
        }
        const exp = c.finances.expenses ?? (c.finances.expenses = {} as any);
        for (const k of ['wages', 'transferExpense', 'stadiumMaintenance', 'trainingFacilities', 'facilities', 'staffWages', 'other']) {
          if (exp[k] == null) exp[k] = 0;
        }
      }
      if (!c.commerce) {
        c.commerce = migrateCommerce(c, c.id === s.game.managedClubId);
      } else if (!c.commerce.cateringMode) {
        c.commerce.cateringMode = 'verpachtung';
      }
      applyFacilityEffects(c);
      const curDate = s.game.calendar.currentDate;
      if (c.youthPlayerIds.length === 0) {
        // Noch gar keine Talente → kompletten Altersaufbau F–A erzeugen.
        for (const yp of academyStartingCohort(c, curDate)) {
          s.game.youthPlayers[yp.id] = yp;
          c.youthPlayerIds.push(yp.id);
        }
      } else {
        // Bestehende Jugend nachrüsten: fehlende jüngere Jahrgänge (7–16)
        // auffüllen, damit auch Altstände einen vollen Altersaufbau erhalten.
        const agesPresent = new Set<number>(
          c.youthPlayerIds
            .map((id: string) => s.game.youthPlayers[id]?.age)
            .filter((a: number | undefined): a is number => typeof a === 'number'),
        );
        const lvl = c.infrastructure.youthAcademy ?? 1;
        for (let age = YOUTH_ENTRY_AGE; age <= 16; age++) {
          if (!agesPresent.has(age)) {
            const yp = generateYouthPlayer(c.id, `retrofill_${age}`, curDate, lvl, age);
            s.game.youthPlayers[yp.id] = yp;
            c.youthPlayerIds.push(yp.id);
          }
        }
      }
    }
    // Alte Spielstände ohne DFB-Pokal → sauber nachrüsten (darf nicht crashen).
    if (!s.game.cup) {
      try {
        const amateurs = generateCupAmateurs(14);
        Object.assign(s.game.clubs, amateurs.clubs);
        Object.assign(s.game.players, amateurs.players);
        const blClubIds = Object.values(s.game.clubs)
          .filter((c: any) => !c.id.startsWith('am'))
          .map((c: any) => c.id);
        const curDate = s.game.calendar.currentDate;
        const cup = createCup(
          blClubIds,
          Object.keys(amateurs.clubs),
          leagueDateSet(s.game.fixtures),
          hashSeed(s.game.managedClubId + ':1980'),
          curDate,
          s.game.managedClubId,
        );
        addCupCalendarEvents(s.game.calendar, cup);
        s.game.cup = cup;
        pushMessage(s.game.messages, cupDrawMessage(cup, s.game.clubs, s.game.managedClubId, curDate));
      } catch (err) {
        console.error('Pokal-Nachrüstung fehlgeschlagen:', err);
      }
    }
    // Alte Spielstände ohne Europapokale → defensiv nachrüsten (darf nicht crashen).
    if (!s.game.euroClubs || !s.game.euroCups) {
      try {
        const euroClubs = s.game.euroClubs ?? allEuroClubs();
        s.game.euroClubs = euroClubs;
        const firstSeason = s.game.season === '1975/76';
        const quals = computeGermanEuroQualifiers(s.game, firstSeason);
        s.game.euroCups = buildEuroCupsForSeason(
          quals, euroClubs, leagueDateSet(s.game.fixtures), cupDateSet(s.game.cup),
          s.game.managedClubId + ':euroload', s.game.calendar.currentDate,
          s.game.managedClubId, s.game.calendar,
        );
        for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
          const ec = s.game.euroCups[comp];
          if (!ec) continue;
          const dmsg = euroDrawMessage(comp, ec, s.game.clubs, euroClubs, s.game.managedClubId, 0, s.game.calendar.currentDate);
          if (dmsg) pushMessage(s.game.messages, dmsg);
        }
      } catch (err) {
        console.error('Europapokal-Nachrüstung fehlgeschlagen:', err);
      }
    }
    // Alte Spielstände ohne Epochen-/Timeline-System → nachrüsten. Die bis zur
    // aktuellen Saison fälligen Meilensteine werden STILL angewandt (Effekte wie
    // Punktesystem/Feature-Flags korrekt setzen), ohne die Inbox zu überfluten.
    if (!Array.isArray(s.game.firedMilestones)) s.game.firedMilestones = [];
    if (!Array.isArray(s.game.unlockedFeatures)) s.game.unlockedFeatures = [];
    if (s.game.firedMilestones.length === 0) {
      // ALLE bis zur aktuellen Saison fälligen Meilensteine still anwenden
      // (Effekte wie Punktesystem/Feature-Flags korrekt setzen) und als
      // ausgelöst markieren, ohne die Inbox rückwirkend zu fluten.
      for (const ev of timelineEventsUpTo(s.game.season)) {
        s.game.firedMilestones.push(ev.id);
        applyTimelineEffect(s.game, ev);
      }
    }
    // Robustheit: Fehlt/verunreinigt das Punktesystem in einem Altstand, historisch
    // aus der aktuellen Saison ableiten (bis 1994/95 → 2 Punkte, ab 1995/96 → 3 Punkte).
    if (s.game.pointSystem !== '2-point' && s.game.pointSystem !== '3-point') {
      s.game.pointSystem = historicPointSystem(s.game.season);
    }
    // Neues Attribut "Frische" (SAVE_VERSION 7) → in Altständen ergänzen. Standard 100
    // (bzw. aktuelle Fitness als sinnvoller Startwert), damit alte Saves nicht brechen.
    const retrofitFrische = (rec: any) => {
      for (const p of Object.values(rec ?? {}) as any[]) {
        if (p && typeof p.frische !== 'number') {
          p.frische = typeof p?.attributes?.fitness === 'number' ? p.attributes.fitness : 100;
        }
      }
    };
    retrofitFrische(s.game.players);
    retrofitFrische(s.game.youthPlayers);
    // Block p11 (Mitarbeiter / Marketing / Kalender) → fehlende Felder nachrüsten.
    if (!Array.isArray(s.game.hiredStaff)) s.game.hiredStaff = [];
    if (!s.game.marketing || typeof s.game.marketing !== 'object') s.game.marketing = {};
    if (!Array.isArray(s.game.activities)) s.game.activities = [];
    // Mehrstufiges Ligasystem (SAVE_VERSION 4) → alte Einliga-Spielstände auf die
    // neue Struktur heben: bestehende Profivereine bleiben Tier 1 (Spielerliga),
    // die 2. Liga Nord/Süd wird als aggregierte Sim-Ligen ergänzt.
    if (!s.game.simClubs || typeof s.game.simClubs !== 'object') s.game.simClubs = {};
    if (!s.game.leagues) {
      try {
        const simClubs = buildSecondLigaSimClubs();
        s.game.simClubs = simClubs;
        const seasonStart = s.game.fixtures[0]?.date ?? s.game.calendar.seasonStartDate;
        s.game.leagues = buildLeagueSystem(simClubs, s.game.pointSystem, s.game.season, seasonStart);
        // Sim-Ligen bis zum aktuellen Liga-Spieltag der laufenden Saison nachziehen,
        // damit die 2.-Liga-Tabellen zum Spielstand passen.
        const playedMd = Math.max(
          0,
          ...s.game.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
        );
        for (const div of s.game.leagues.otherDivisions) {
          let guard = 0;
          while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
            advanceDivision(div, simClubs, s.game.pointSystem, s.game.season);
            guard++;
          }
        }
      } catch (err) {
        console.error('Ligasystem-Nachrüstung fehlgeschlagen:', err);
      }
    }
    // Ligareform-System (SAVE_VERSION 5) → nachrüsten. Bei Altständen ohne dieses
    // Feld werden bereits VERGANGENE Reformen als „angewandt" markiert, damit an
    // schon durchlaufenen Saison-Grenzen keine rückwirkende Struktur-Migration
    // ausgelöst wird (verhindert Doppel-Migration beim Laden).
    if (!Array.isArray(s.game.appliedReforms)) {
      s.game.appliedReforms = LEAGUE_REFORMS
        .filter((r) => seasonStartYear(r.effectiveSeason) <= seasonStartYear(s.game.season))
        .map((r) => r.reformId);
    }
    // DDR-Ligasystem (SAVE_VERSION 6) → nachrüsten. Spielstände VOR der
    // Wiedervereinigung (Saison-Startjahr < 1991) ohne separate DDR-Divisionen
    // erhalten die parallele DDR-Pyramide nachträglich; die DDR-Tabellen werden
    // bis zum aktuellen Liga-Spieltag nachgezogen. Stände AB 1991/92 gelten als
    // bereits integriert (die DDR-Struktur wurde dort aufgelöst) – nichts zu tun.
    try {
      const hasDdr = s.game.leagues?.otherDivisions?.some((d: any) => String(d.id).startsWith('ddr-'));
      const beforeWende = seasonStartYear(s.game.season) < 1991;
      const reunified = Array.isArray(s.game.appliedReforms)
        && s.game.appliedReforms.includes('reform-1991-reunification');
      if (s.game.leagues && !hasDdr && beforeWende && !reunified) {
        const seasonStart = s.game.fixtures[0]?.date ?? s.game.calendar.seasonStartDate;
        const ddrDivs = buildDdrDivisions(s.game.simClubs, s.game.pointSystem, s.game.season, seasonStart);
        const playedMd = Math.max(
          0,
          ...s.game.fixtures.filter((m: any) => m.status === 'finished').map((m: any) => m.matchday),
        );
        for (const div of ddrDivs) {
          let guard = 0;
          while (div.nextMatchday <= playedMd && div.fixtures.some((m: any) => m.matchday === div.nextMatchday) && guard < 80) {
            advanceDivision(div, s.game.simClubs, s.game.pointSystem, s.game.season);
            guard++;
          }
        }
        s.game.leagues.otherDivisions.push(...ddrDivs);
      }
    } catch (err) {
      console.error('DDR-Nachrüstung fehlgeschlagen:', err);
    }
    // Anzeige-Währung auf das aktuelle Spieljahr setzen (DM ≤2001, EUR ≥2002).
    setDisplayYear(yearOf(s.game.calendar.currentDate));
    gameRef.current = s.game;
    setCurrentSlot(slot);
    setInGame(true);
    rerender();
  }, [rerender]);

  // --- Spiel verlassen (zurück ins Menü) ---
  const exitToMenu = useCallback(() => {
    setInGame(false);
    rerender();
  }, [rerender]);

  const updateSettings = useCallback((s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
    if (gameRef.current) gameRef.current.calendar.speedMs = s.speedMs;
    // Anzeige-Modus direkt im Klick-Kontext anwenden (Fullscreen-API benötigt
    // eine Nutzer-Geste — der "Speichern"-Klick zählt als solche).
    applyDisplayMode(s.displayMode);
  }, []);

  // Anzeige-Modus beim Start bestmöglich wiederherstellen (ohne Nutzer-Geste
  // kann der Browser Vollbild ablehnen — das wird sauber abgefangen).
  useEffect(() => {
    applyDisplayMode(settings.displayMode);
    // nur einmal beim Mounten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (!inGame || !gameRef.current) ? (
    <MainMenu
      settings={settings}
      onNewGame={startGame}
      onLoad={doLoad}
      onUpdateSettings={updateSettings}
    />
  ) : (
    <GameShell
      game={gameRef.current}
      rerender={rerender}
      currentSlot={currentSlot}
      setCurrentSlot={setCurrentSlot}
      settings={settings}
      onExit={exitToMenu}
      onLoad={doLoad}
      onUpdateSettings={updateSettings}
    />
  );

  return (
    <DisplayFrame resolution={settings.resolution} uiScale={settings.uiScale}>
      {content}
    </DisplayFrame>
  );
}

// =============================================================================
// ANZEIGE / AUFLÖSUNG — Konstanten, Helfer & Rahmen
// =============================================================================

/** Auswählbare Auflösungen, gruppiert nach Seitenverhältnis. */
export const RESOLUTION_GROUPS: { label: string; options: string[] }[] = [
  { label: '16:9', options: ['1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'] },
  { label: '16:10', options: ['1280x800', '1680x1050', '1920x1200', '2560x1600'] },
  { label: '21:9 (Ultrawide)', options: ['2560x1080', '3440x1440', '3840x1600'] },
];

/**
 * Wendet den Anzeige-Modus an. "Vollbild" und "Randlos" nutzen die
 * Fullscreen-API (Randlos = funktional Vollbild, aber getrennt wählbar),
 * "Fenster" verlässt den Vollbild. Robust gegen fehlende API/abgelehnte Gesten.
 */
export function applyDisplayMode(mode: DisplayMode): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  try {
    if (mode === 'fullscreen' || mode === 'borderless') {
      if (!document.fullscreenElement && el.requestFullscreen) {
        const p = el.requestFullscreen();
        if (p && typeof p.catch === 'function') p.catch(() => { /* Geste/Support fehlt */ });
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        const p = document.exitFullscreen();
        if (p && typeof p.catch === 'function') p.catch(() => { /* ignore */ });
      }
    }
  } catch {
    /* Fullscreen nicht verfügbar — kein Crash */
  }
}

/**
 * Rahmen um das gesamte Spiel. Bei fester Auflösung wird das Spiel in einem
 * zentrierten Rahmen mit passendem Seitenverhältnis dargestellt (Letterboxing/
 * Pillarboxing, dunkler Hintergrund) und so skaliert, dass es in den Viewport
 * passt ("fit", nichts wird abgeschnitten). Bei "Automatisch" füllt das Spiel
 * responsiv den Viewport. Die UI-Skalierung wirkt in beiden Fällen via `zoom`.
 */
/**
 * Automatischer Zoom-Faktor nach effektiver Bildschirmbreite.
 * Basisbreite 1920px = 1.0. Bei 3840px = 1.5 (+50%), dazwischen linear.
 * Unter 1920px proportional herunter, gedeckelt bei 0.6. Ergebnis clamped 0.6..1.5.
 */
function autoScaleForWidth(width: number): number {
  const w = width > 0 ? width : 1920;
  let s: number;
  if (w >= 1920) {
    s = 1 + 0.5 * (w - 1920) / 1920; // 1920→1.0, 3840→1.5
  } else {
    s = w / 1920; // kleiner als Basis → proportional runter
  }
  return Math.max(0.6, Math.min(1.5, s));
}

/**
 * Festes Design-Canvas. 3840x2160 (4K) ist die verbindliche Referenz-Auflösung:
 * Bei exakt dieser Auflösung sieht die Zentrale/Dashboard-Ansicht so aus wie
 * heute. `DESIGN_ZOOM` ist der Zoom, der genau diese 4K-Darstellung erzeugt
 * (= autoScaleForWidth(3840) = 1.5). Ein einziger Quellwert, kein Raten.
 */
const DESIGN_CANVAS = { w: 3840, h: 2160 };

function DisplayFrame({ resolution, uiScale, children }: {
  resolution: string; uiScale: number; children: ReactNode;
}) {
  // Feste Auflösung parsen; im Auto-Modus gilt das 4K-Design-Canvas als Referenz.
  const parsed = resolution !== 'auto' ? parseResolution(resolution) : null;
  const canvas = parsed ?? DESIGN_CANVAS;

  const [vp, setVp] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  // Resize-Handling: der Einpass-Faktor hängt stets von der aktuellen
  // Viewport-Größe ab. Sauberes Cleanup.
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Innerer Zoom des Canvas (erzeugt bei der jeweiligen Canvas-Breite die
  // Referenz-Darstellung). Für das 4K-Design-Canvas = 1.5 → heutige Ansicht.
  const designZoom = autoScaleForWidth(canvas.w);

  // Uniformer Einpass-Faktor: skaliert das GESAMTE Canvas gleichmäßig in den
  // Viewport (fit, zentriert, nichts abgeschnitten) → bei kleineren Auflösungen
  // bleiben alle Proportionen 1:1 erhalten, kein Reflow/Umbruch/Verdichten.
  // Der manuelle uiScale-Slider wirkt multiplikativ als Feinjustierung
  // (Default 100 → reines Auto/Fit-Verhalten).
  const manual = (uiScale || 100) / 100;
  const fit = Math.min(vp.w / canvas.w, vp.h / canvas.h) * manual;

  return (
    <div className="display-outer">
      <div
        className="display-inner"
        style={{
          width: canvas.w,
          height: canvas.h,
          transform: `translate(-50%, -50%) scale(${fit})`,
        }}
      >
        <div className="display-content" style={{ zoom: designZoom, height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Parst "BREITExHÖHE" zu Zahlen; null bei ungültigem Wert. */
function parseResolution(v: string): { w: number; h: number } | null {
  const m = /^(\d+)x(\d+)$/.exec(v);
  if (!m) return null;
  const w = +m[1], h = +m[2];
  if (!w || !h) return null;
  return { w, h };
}

// =============================================================================
// STARTBILDSCHIRM (Menü)
// =============================================================================
type MenuView = 'main' | 'new' | 'load' | 'settings';

function MainMenu({ settings, onNewGame, onLoad, onUpdateSettings }: {
  settings: AppSettings;
  onNewGame: (o: NewGameOptions) => void;
  onLoad: (slot: string) => void;
  onUpdateSettings: (s: AppSettings) => void;
}) {
  const [view, setView] = useState<MenuView>('main');
  const [saves, setSaves] = useState<SaveMeta[]>(() => listSaves());
  const refreshSaves = () => setSaves(listSaves());

  return (
    <div className="menu-bg">
      <div className="menu-wrap">
        <div className="menu-hero">
          {/* Wiederverwendbares SVG-Logo (public/assets/logo-1975.svg).
              Beide Zeilen sind im SVG bereits exakt gleich breit — dadurch
              braucht es keine Laufzeit-Breitenmessung mehr, und das Logo liegt
              als eigenes DOM-Element über dem Hintergrund, sodass das Menü es
              bei keiner Auflösung überdecken kann. */}
          <img
            className="menu-logo"
            src="/assets/logo-1975.svg"
            alt="1975 – A Football Manager"
            draggable={false}
          />
        </div>

        {view === 'main' && (
          <div className="menu-panel">
            <button className="menu-btn primary" onClick={() => setView('new')}>
              <span className="mi"><Icon name="newGame" /></span><span>Neues Spiel</span>
            </button>
            <button className="menu-btn" disabled={saves.length === 0} onClick={() => { refreshSaves(); setView('load'); }}>
              <span className="mi"><Icon name="loadGame" /></span><span>Spiel laden</span>
              {saves.length > 0 && <span className="menu-tag">{saves.length}</span>}
            </button>
            <button className="menu-btn" onClick={() => setView('settings')}>
              <span className="mi"><Icon name="settings" /></span><span>Einstellungen</span>
            </button>
            <button className="menu-btn danger" onClick={() => {
              // "Spiel verlassen": Tab/Fenster schließen; sonst Hinweis.
              window.open('', '_self');
              window.close();
              setTimeout(() => alert('Du kannst den Tab jetzt schließen. Dein Fortschritt ist gespeichert, sofern du gespeichert hast.'), 50);
            }}>
              <span className="mi"><Icon name="quit" /></span><span>Spiel verlassen</span>
            </button>
            {!storageAvailable() && (
              <div className="mini red mt12" style={{ textAlign: 'center' }}>
                ⚠ Speichern/Laden ist in dieser Umgebung nicht verfügbar (localStorage gesperrt).
              </div>
            )}
          </div>
        )}

        {view === 'new' && (
          <NewGameScreen defaults={settings} onBack={() => setView('main')} onStart={onNewGame} />
        )}

        {view === 'load' && (
          <LoadGameScreen
            saves={saves}
            onBack={() => setView('main')}
            onLoad={onLoad}
            onDelete={(slot) => { deleteSave(slot); refreshSaves(); }}
          />
        )}

        {view === 'settings' && (
          <SettingsScreen settings={settings} onBack={() => setView('main')} onSave={onUpdateSettings} />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// NEUES SPIEL: Managerprofil + Verein + Optionen
// -----------------------------------------------------------------------------
const STYLE_DE: Record<ManagerStyle, string> = { defensive: 'Defensiv', balanced: 'Ausgeglichen', attacking: 'Offensiv' };
const BG_DE: Record<ManagerBackground, { label: string; desc: string }> = {
  legend: { label: 'Trainer-Legende', desc: 'Großer Name, hohes Ansehen beim Vorstand.' },
  ex_pro: { label: 'Ex-Profi', desc: 'Selbst gespielt – gute Draht zur Mannschaft.' },
  tactician: { label: 'Taktik-Fuchs', desc: 'Analytiker mit Sinn für Details.' },
  rookie: { label: 'Newcomer', desc: 'Unbeschriebenes Blatt mit Ambitionen.' },
};

function NewGameScreen({ defaults, onBack, onStart }: {
  defaults: AppSettings; onBack: () => void; onStart: (o: NewGameOptions) => void;
}) {
  const seeds = getClubSeeds();
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('Deutschland');
  const [birthYear, setBirthYear] = useState(1940);
  const [style, setStyle] = useState<ManagerStyle>('balanced');
  const [background, setBackground] = useState<ManagerBackground>('ex_pro');
  const [clubId, setClubId] = useState(seeds[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [injuries, setInjuries] = useState(true);
  const [realistic, setRealistic] = useState(true);
  const [speedMs, setSpeedMs] = useState(defaults.speedMs);

  const canStart = name.trim().length >= 2;

  const start = () => {
    const manager: ManagerProfile = {
      name: name.trim(), nationality, birthYear, style, background,
      avatarSeed: name.trim().toLowerCase(),
    };
    onStart({
      managedClubId: clubId, manager, difficulty,
      realisticSquads: realistic, injuriesEnabled: injuries, speedMs,
    });
  };

  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Neues Spiel</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>

      {/* Managerprofil */}
      <div className="card mt16">
        <div className="card-title"><span className="ico">👤</span> Dein Managerprofil</div>
        <div className="form-grid">
          <label>Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Max Mustermann" />
          </label>
          <label>Nationalität
            <input value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </label>
          <label>Geburtsjahr
            <input type="number" min={1910} max={1962} value={birthYear} onChange={(e) => setBirthYear(+e.target.value)} />
          </label>
          <label>Bevorzugter Spielstil
            <select value={style} onChange={(e) => setStyle(e.target.value as ManagerStyle)}>
              {(Object.keys(STYLE_DE) as ManagerStyle[]).map((s) => <option key={s} value={s}>{STYLE_DE[s]}</option>)}
            </select>
          </label>
        </div>
        <label className="dim mini mt12" style={{ display: 'block' }}>Trainer-Hintergrund</label>
        <div className="chip-row">
          {(Object.keys(BG_DE) as ManagerBackground[]).map((b) => (
            <button key={b} className={`chip ${background === b ? 'active' : ''}`} onClick={() => setBackground(b)} title={BG_DE[b].desc}>
              {BG_DE[b].label}
            </button>
          ))}
        </div>
        <div className="dim2 mini mt8">{BG_DE[background].desc}</div>
      </div>

      {/* Verein */}
      <div className="card mt16">
        <div className="card-title"><span className="ico">🛡️</span> Verein wählen</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
          {seeds.map((s) => (
            <div key={s.id} className={`card club-pick ${clubId === s.id ? 'sel' : ''}`} onClick={() => setClubId(s.id)}>
              {/* ClubCrest statt Inline-SVG, damit ein spielweit hochgeladenes Wappen
                  auch in der Vereinsauswahl beim Spielstart erscheint. */}
              <ClubCrest club={{ id: s.id, name: s.name, shortName: s.shortName, city: s.city, colors: { primary: s.primary, secondary: s.secondary } } as any} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{s.shortName}</div>
                <div className="dim2 mini" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div className="dim2 mini">{s.city} · Ansehen {s.reputation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optionen */}
      <div className="card mt16">
        <div className="card-title"><span className="ico"><Icon name="settings" /></span> Spieloptionen</div>
        <div className="form-grid">
          <label>Schwierigkeit
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Leicht</option>
              <option value="normal">Normal</option>
              <option value="hard">Schwer</option>
            </select>
          </label>
        </div>
        <div className="toggle-row mt12">
          <label className="toggle-item">
            <input type="checkbox" checked={injuries} onChange={(e) => setInjuries(e.target.checked)} />
            <span className={`toggle ${injuries ? 'on' : ''}`}></span>
            Verletzungen aktiviert
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={realistic} onChange={(e) => setRealistic(e.target.checked)} />
            <span className={`toggle ${realistic ? 'on' : ''}`}></span>
            Realistische Kader
          </label>
        </div>
        <label className="dim mini mt12" style={{ display: 'block' }}>Spieltempo: <b className="accent-text">{speedMs} ms/Tag</b> ({speedMs <= 600 ? 'schnell' : speedMs >= 1200 ? 'langsam' : 'mittel'})</label>
        <input type="range" min={300} max={1600} step={100} value={speedMs} onChange={(e) => setSpeedMs(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <button className="btn-primary btn-continue mt16" style={{ alignSelf: 'center', padding: '13px 40px', fontSize: 16 }} disabled={!canStart} onClick={start}>
        <Icon name="newGame" /> SAISON STARTEN
      </button>
      {!canStart && <div className="dim2 mini" style={{ textAlign: 'center', marginTop: 6 }}>Bitte gib deinen Managernamen ein (min. 2 Zeichen).</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SPIEL LADEN
// -----------------------------------------------------------------------------
function LoadGameScreen({ saves, onBack, onLoad, onDelete }: {
  saves: SaveMeta[]; onBack: () => void; onLoad: (slot: string) => void; onDelete: (slot: string) => void;
}) {
  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Spiel laden</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      {saves.length === 0 ? (
        <div className="card mt16 dim" style={{ textAlign: 'center', padding: 30 }}>Keine Speicherstände vorhanden.</div>
      ) : (
        <div className="mt16" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {saves.map((s) => (
            <div key={s.slot} className="card hoverable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{s.clubName} <span className="dim2 mini">· {s.season}</span></div>
                <div className="dim mini">Manager: {s.managerName} · Spieldatum: {CalendarEngine.formatDate(s.gameDate)}</div>
                <div className="dim2 mini">Gespeichert: {new Date(s.savedAt).toLocaleString('de-DE')}</div>
              </div>
              <button className="btn-sm btn-primary" onClick={() => onLoad(s.slot)}>Laden</button>
              <button className="btn-sm danger" onClick={() => { if (confirm(`Speicherstand "${s.clubName}" löschen?`)) onDelete(s.slot); }}>Löschen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// EINSTELLUNGEN
// -----------------------------------------------------------------------------
function SettingsScreen({ settings, onBack, onSave }: {
  settings: AppSettings; onBack: () => void; onSave: (s: AppSettings) => void;
}) {
  const [s, setS] = useState<AppSettings>(settings);
  const save = () => { onSave(s); onBack(); };
  return (
    <div className="menu-panel wide">
      <div className="row"><h2 style={{ margin: 0 }}>Einstellungen</h2><button className="btn-sm" onClick={onBack}>← Zurück</button></div>
      <div className="card mt16">
        <label className="dim mini" style={{ display: 'block' }}>Standard-Spieltempo: <b className="accent-text">{s.speedMs} ms/Tag</b></label>
        <input type="range" min={300} max={1600} step={100} value={s.speedMs} onChange={(e) => setS({ ...s, speedMs: +e.target.value })} style={{ width: '100%' }} />
        <div className="toggle-row mt16">
          <label className="toggle-item">
            <input type="checkbox" checked={s.autosave} onChange={(e) => setS({ ...s, autosave: e.target.checked })} />
            <span className={`toggle ${s.autosave ? 'on' : ''}`}></span>
            Automatisch speichern (Saisonende &amp; Meilensteine)
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={s.soundEnabled} onChange={(e) => setS({ ...s, soundEnabled: e.target.checked })} />
            <span className={`toggle ${s.soundEnabled ? 'on' : ''}`}></span>
            Ton/Effekte (Platzhalter)
          </label>
        </div>
      </div>

      {/* --- Anzeige & Auflösung --- */}
      <div className="card mt16">
        <h3 style={{ margin: '0 0 4px' }}>Anzeige</h3>
        <p className="dim mini" style={{ margin: '0 0 14px' }}>
          Auflösung, Anzeige-Modus und UI-Skalierung. Für die spätere Steam-Version vorbereitet.
        </p>

        <label className="dim mini" style={{ display: 'block' }}>Auflösung</label>
        <select
          value={s.resolution}
          onChange={(e) => setS({ ...s, resolution: e.target.value })}
          style={{ marginTop: 4 }}
        >
          <option value="auto">Automatisch (native Desktop-Auflösung)</option>
          {RESOLUTION_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o} value={o}>{o.replace('x', ' × ')}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <label className="dim mini mt16" style={{ display: 'block' }}>Anzeige-Modus</label>
        <div className="seg-group mt4">
          {([
            ['window', 'Fenster'],
            ['borderless', 'Randlos'],
            ['fullscreen', 'Vollbild'],
          ] as [DisplayMode, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`seg-btn ${s.displayMode === val ? 'active' : ''}`}
              onClick={() => setS({ ...s, displayMode: val })}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="dim mini mt16" style={{ display: 'block' }}>
          UI-Skalierung: <b className="accent-text">{s.uiScale}%</b>
        </label>
        <input
          type="range"
          min={80}
          max={150}
          step={5}
          value={s.uiScale}
          onChange={(e) => setS({ ...s, uiScale: +e.target.value })}
          style={{ width: '100%' }}
        />
        <div className="row-between dim micro" style={{ marginTop: 2 }}>
          <span>80%</span><span>100%</span><span>150%</span>
        </div>
      </div>

      <button className="btn-primary mt16" style={{ alignSelf: 'center', padding: '11px 34px' }} onClick={save}>Speichern</button>
    </div>
  );
}

// =============================================================================
// SPIEL-SHELL (In-Game UI)
// =============================================================================
function GameShell({ game, rerender, currentSlot, setCurrentSlot, settings, onExit, onLoad, onUpdateSettings }: {
  game: Game; rerender: () => void; currentSlot: string | null;
  setCurrentSlot: (s: string | null) => void; settings: AppSettings; onExit: () => void;
  onLoad: (slot: string) => void; onUpdateSettings: (s: AppSettings) => void;
}) {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [running, setRunning] = useState(false);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  const [textMatchId, setTextMatchId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [devReveal, setDevReveal] = useState<PlayerDevReveal[] | null>(null);
  const [ratingCeremony, setRatingCeremony] = useState<{ results: RatingResult[]; type: 'medium' | 'large'; anlass: string } | null>(null);
  // In-Game-Overlays: Menü-Dropdown, Einstellungen, Speichern/Laden-Popup.
  const [menuOpen, setMenuOpen] = useState(false);
  // Das Zahnrad-Menü öffnet/schließt NUR per Klick (kein Hover). Ein Klick
  // außerhalb des Menüs schließt es wieder.
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  // Vereins-Editor (kosmetisch): erreichbar über das Zahnrad-Menü UND über den
  // „Bearbeiten"-Button im VEREINSÜBERBLICK. Auf GameShell-Ebene gehalten,
  // damit beide Zugänge dasselbe Modal öffnen.
  const [clubEditorOpen, setClubEditorOpen] = useState(false);
  const runningRef = useRef(false);
  useEffect(() => { runningRef.current = running; }, [running]);

  const g = game;
  const myClub = g.clubs[g.managedClubId];

  // --- Speichern ---
  const doSave = useCallback((slot?: string, name?: string) => {
    const useSlot = slot ?? currentSlot ?? nextFreeSlot();
    const ok = saveGame(useSlot, {
      name: (name && name.trim()) ? name.trim() : `${myClub.name} · ${g.season}`,
      managerName: g.manager.name,
      clubName: myClub.name,
      clubId: g.managedClubId,
      season: g.season,
      gameDate: g.calendar.currentDate,
    }, g);
    if (ok) {
      setCurrentSlot(useSlot);
      setSaveMsg('✓ Spiel gespeichert');
    } else {
      setSaveMsg('⚠ Speichern fehlgeschlagen');
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }, [currentSlot, g, myClub, setCurrentSlot]);

  // ---------------------------------------------------------------------------
  // Kalender-Logik: einen Tag verarbeiten
  // ---------------------------------------------------------------------------
  const processDay = useCallback((): boolean => {
    const cal = g.calendar;
    // Wurde der Vorlauf zuletzt für eine Aktion angehalten (z.B. AM Spieltag),
    // blieb das Datum stehen. Der fällige Tageswechsel wird jetzt – beim
    // Fortsetzen – nachgeholt, BEVOR der neue Tag verarbeitet wird. So bleibt
    // jeder Tag genau einmal dran und die Pause landet auf dem richtigen Tag.
    if (cal.pendingAdvance) {
      cal.pendingAdvance = false;
      cal.currentDate = CalendarEngine.nextDay(cal.currentDate);
      // Diesen Tick hier beenden: der nachgeholte Tag wird jetzt nur angezeigt
      // und erst im naechsten Tick verarbeitet. So schaltet der Kalender beim
      // Fortsetzen genau EINEN Tag weiter (kein Doppelsprung) und kein Tag wird
      // doppelt verarbeitet.
      if (CalendarEngine.isSeasonOver(cal)) { setRunning(false); return false; }
      return true;
    }
    if (CalendarEngine.isSeasonOver(cal)) { setRunning(false); return false; }

    const today = cal.currentDate;
    setDisplayYear(yearOf(today));
    setTransferDate(today);
    const todaysEvents = CalendarEngine.eventsOn(cal, today).filter((e) => !e.processed);
    let stopForAction = false;

    for (const ev of todaysEvents) {
      ev.processed = true;
      switch (ev.type) {
        case 'matchday': {
          if (ev.matchId) {
            const match = g.fixtures.find((m) => m.id === ev.matchId);
            if (match && match.status === 'scheduled') {
              const md = match.matchday;
              const playerMatch = g.fixtures.find((m) => m.matchday === md && m.involvesPlayerClub);
              simulateMatchday(g, md);
              if (playerMatch && playerMatch.result) {
                emitMatchMessage(g, playerMatch);
                setTextMatchId(playerMatch.id); // Textmodus öffnen
                stopForAction = true;
              }
            }
          }
          break;
        }
        case 'rating_update': {
          const isLarge = ev.description.includes('Große');
          // JEDER Spieler der Liga wird bewertet (jeder bekommt seine Chance),
          // enthüllt wird in der Zeremonie aber nur der eigene Verein.
          // Wichtig: runRatingCeremony mutiert die Spielerwerte SOFORT – die
          // Auf-/Abwertungen wirken also in jedem Fall.
          const results = runRatingCeremony(
            g.players, g.clubs, g.managedClubId,
            isLarge ? 'large' : 'medium', today,
          );
          // Nur die große Saison-Bewertung wird sichtbar gemacht (Zeremonie +
          // Meldung + Pause). Kleine/periodische Bewertungen laufen still im
          // Hintergrund – die Werte ändern sich, ohne den Vorlauf zu unterbrechen.
          if (isLarge) {
            setRatingCeremony({ results, type: 'large', anlass: ev.description });
            pushMessage(g.messages, makeMessage({
              date: today, category: 'training', from: 'Trainerstab',
              subject: 'Leistungsbewertung abgeschlossen',
              shortText: 'Die Spielerwerte wurden neu bewertet.',
              bodyText: `Der Trainerstab hat die große Saison-Leistungsbewertung durchgeführt (${ev.description}). Die aktuellen Werte und Entwicklungen findest du im Kader.`,
            }));
            stopForAction = true;
          }
          break;
        }
        case 'transfer_window_open':
          pushMessage(g.messages, makeMessage({
            date: today, category: 'transfer', from: 'Sportdirektor',
            subject: ev.title, shortText: 'Das Transferfenster ist geöffnet.',
            bodyText: `${ev.title}. Du kannst jetzt auf dem Transfermarkt aktiv werden und Spieler verpflichten oder abgeben.`,
          }));
          break;
        case 'transfer_window_close': {
          const tnews = runAITransfers(g.clubs, g.players, g.managedClubId);
          pushMessage(g.messages, makeMessage({
            date: today, category: 'transfer', from: 'Sportdirektor',
            subject: ev.title,
            shortText: 'Das Transferfenster ist geschlossen.',
            bodyText: `${ev.title}.\n\nAktuelle Marktbewegungen:\n${tnews.slice(0, 6).map((n) => '• ' + n).join('\n') || '• Keine nennenswerten Transfers.'}`,
          }));
          break;
        }
        case 'season_end':
          pushMessage(g.messages, makeMessage({
            date: today, category: 'board', from: 'Vereinsvorstand',
            subject: 'Die Saison ist beendet!',
            shortText: 'Endstand und Saisonfazit.',
            bodyText: `Die Saison ${g.season} ist beendet. Den Endstand findest du in der Tabelle. Der Vorstand wird das Saisonziel auswerten.\n\nÜber den Button „Neue Saison“ oben rechts startest du die nächste Spielzeit – Spielplan, DFB-Pokal und die fälligen Chronik-Meilensteine werden dann neu aufgesetzt.`,
          }));
          if (settings.autosave) doSave();
          stopForAction = true;
          break;
        case 'cup_matchday': {
          const cup = g.cup;
          const ri = ev.cupRoundIndex;
          if (cup && ri != null && cup.rounds[ri] && cup.rounds[ri].drawn) {
            const round = cup.rounds[ri];
            const prize = cup.prizeByRound[ri];
            const mid = g.managedClubId;
            // Alle noch nicht gespielten Begegnungen der Runde simulieren.
            for (const tie of round.ties) {
              if (tie.played) continue;
              simulateCupTie(tie, g.clubs, g.players, g.pointSystem, cup.seed);
              const home = g.clubs[tie.homeClubId];
              const away = g.clubs[tie.awayClubId];
              if (tie.match?.result) {
                // Heimspiel-Einnahmen des Ausrichters + Preisgeld des Siegers.
                bookCupHomeMatch(home, tie.match.result, tie.date, tie.homeClubId === mid, economyScale(yearOf(tie.date)));
                if (tie.winnerClubId) {
                  bookCupPrize(g.clubs[tie.winnerClubId], prize, round.name, tie.date, tie.winnerClubId === mid);
                }
                // Form & Fitness beider Mannschaften (Pokal kennt kein Remis).
                const homeWon = tie.winnerClubId === tie.homeClubId;
                applyMatchEffects(home, g.players, homeWon ? 'W' : 'L');
                applyMatchEffects(away, g.players, homeWon ? 'L' : 'W');
              }
            }
            // Eigene Begegnung: Ergebnis-Nachricht + Textmodus zum Nachverfolgen.
            const myTie = round.ties.find((t) => t.involvesPlayerClub);
            if (myTie && myTie.match) {
              pushMessage(g.messages, cupResultMessage(cup, g.clubs, mid, myTie, ri, prize));
              setTextMatchId(myTie.match.id);
              stopForAction = true;
            }
            // Nächste Runde auslosen (bzw. Sieger küren) und Nachricht erzeugen.
            if (ri < cup.rounds.length - 1) {
              const winners = roundWinners(round);
              drawRound(cup, ri + 1, winners, mid);
              cup.currentRoundIndex = ri + 1;
              pushMessage(g.messages, cupNextDrawMessage(cup, g.clubs, mid, ri + 1, today));
            } else {
              cup.winnerClubId = round.ties[0]?.winnerClubId ?? null;
              if (cup.winnerClubId && cup.winnerClubId !== mid) {
                pushMessage(g.messages, makeMessage({
                  date: today, category: 'cup', from: 'DFB-Pokal-Kommission',
                  subject: `DFB-Pokalsieger ${cup.season}: ${g.clubs[cup.winnerClubId]?.name ?? ''}`,
                  shortText: `${g.clubs[cup.winnerClubId]?.name ?? ''} gewinnt den DFB-Pokal.`,
                  bodyText: `Das Finale des DFB-Pokals ${cup.season} ist entschieden. ${g.clubs[cup.winnerClubId]?.name ?? ''} sichert sich den Titel.`,
                }));
              }
            }
          }
          break;
        }
        case 'euro_matchday': {
          const comp = ev.euroComp;
          const cup = comp ? g.euroCups?.[comp] : null;
          const ri = ev.cupRoundIndex;
          if (comp && cup && ri != null && cup.rounds[ri] && cup.rounds[ri].drawn) {
            const round = cup.rounds[ri];
            const prize = cup.prizeByRound[ri];
            const mid = g.managedClubId;
            // Alle noch offenen Begegnungen der Runde simulieren.
            for (const tie of round.ties) {
              if (tie.played) continue;
              simulateEuroTie(g, cup, tie, cup.seed);
              // Finanz-/Formeffekte nur für materialisierte (volle) Vereine.
              if (tie.match?.result) {
                const home = g.clubs[tie.homeClubId];
                const away = g.clubs[tie.awayClubId];
                const homeWon = tie.winnerClubId === tie.homeClubId;
                if (home) {
                  bookCupHomeMatch(home, tie.match.result, tie.date, tie.homeClubId === mid, economyScale(yearOf(tie.date)));
                  applyMatchEffects(home, g.players, homeWon ? 'W' : 'L');
                }
                if (away) applyMatchEffects(away, g.players, homeWon ? 'L' : 'W');
              }
              // Preisgeld an den Sieger (nur falls voller Club vorhanden).
              if (tie.winnerClubId && g.clubs[tie.winnerClubId]) {
                book(
                  g.clubs[tie.winnerClubId].finances, tie.date, prize, 'prize_money',
                  `${EURO_COMP_NAMES[comp]} - Praemie (${round.name})`,
                  tie.winnerClubId === mid,
                );
              }
            }
            // Eigene Begegnung: Ergebnis-Nachricht + Textmodus zum Nachverfolgen.
            const myTie = round.ties.find((t) => t.involvesPlayerClub);
            if (myTie && myTie.played) {
              pushMessage(g.messages, euroResultMessage(comp, cup, g.clubs, g.euroClubs ?? {}, mid, myTie, ri, prize));
              if (myTie.match) { setTextMatchId(myTie.match.id); stopForAction = true; }
            }
            // Nächste Runde auslosen (bzw. Sieger küren) und Nachricht erzeugen.
            if (ri < cup.rounds.length - 1) {
              const winners = roundWinners(round);
              drawEuroRound(cup, comp, ri + 1, winners, mid);
              cup.currentRoundIndex = ri + 1;
              const dmsg = euroDrawMessage(comp, cup, g.clubs, g.euroClubs ?? {}, mid, ri + 1, today);
              if (dmsg) pushMessage(g.messages, dmsg);
            } else {
              cup.winnerClubId = round.ties[0]?.winnerClubId ?? null;
              // Dezente Chronik-Notiz, sofern nicht der Spielerverein Sieger ist.
              if (cup.winnerClubId && cup.winnerClubId !== mid) {
                pushMessage(g.messages, euroWinnerChronicle(comp, cup, g.clubs, g.euroClubs ?? {}, today));
              }
            }
          }
          break;
        }
        default:
          pushMessage(g.messages, makeMessage({
            date: today, category: 'general', from: 'Verein',
            subject: ev.title, shortText: ev.description || ev.title,
            bodyText: ev.description || ev.title,
          }));
      }
    }

    // -------------------------------------------------------------------------
    // TRAINING & REGENERATION
    // -------------------------------------------------------------------------
    const userIds = new Set(myClub.playerIds);
    // Wochentag als Plan-Index (0=Mo … 6=So), UTC-basiert.
    const utcDay = new Date(today + 'T00:00:00Z').getUTCDay(); // 0=So … 6=Sa
    const planIdx = (utcDay + 6) % 7;
    // War heute ein Pflichtspiel des Manager-Vereins? Dann kein Training.
    const isMyMatchDay = todaysEvents.some(
      (ev) => ev.type === 'matchday' && (() => {
        const m = g.fixtures.find((x) => x.id === ev.matchId);
        return !!m && m.involvesPlayerClub;
      })(),
    );

    if (!isMyMatchDay) {
      // Manager-Verein trainiert gemäß Wochenplan (füllt den Entwicklungs-Akku).
      applyDailyTraining(myClub, g.players, g.trainingPlan.days[planIdx], false);
      // Übrige Liga regeneriert normal; Manager-Verein ist über das Training abgedeckt.
      dailyRecovery(g.players, userIds);
    } else {
      // An Spieltagen regenerieren alle normal (Startelf hat Match-Ermüdung).
      dailyRecovery(g.players);
    }
    updateAges(g.players, today);

    // -------------------------------------------------------------------------
    // MEDIZINISCHE ABTEILUNG: zusätzliche Regeneration + schnellere Reha für den
    // Manager-Verein (Effekt der Infrastruktur, real & beobachtbar).
    // -------------------------------------------------------------------------
    {
      const medLvl = myClub.infrastructure?.medical ?? 1;
      const rehaLvl = myClub.infrastructure?.rehaCenter ?? 1;
      // Mitarbeiter-Effekte (Block p11): Reha-Verkürzung (Anteil) + Regeneration (Punkte).
      const staffFx = computeStaffEffects(g.hiredStaff ?? []);
      // Tägliche Regeneration: Medizin + Reha-Zentrum + medizinisches Personal.
      const recoverBonus = medicalRecoveryBonus(medLvl) + rehaRecoveryBonus(rehaLvl) + (staffFx.recovery ?? 0);
      // Reha-Tage pro Tag: Gebäude (ganze Tage) + Personal-Anteil (auf Reha-Downtime).
      const rehabBonus = medicalRehabBonus(medLvl) + rehaRehabBonus(rehaLvl)
        + (staffFx.rehabReduction > 0 ? 1 : 0);
      if (recoverBonus > 0 || rehabBonus > 0) {
        for (const pid of myClub.playerIds) {
          const p = g.players[pid];
          if (!p) continue;
          if (recoverBonus > 0 && p.attributes.fitness < 100) {
            p.attributes.fitness = Math.min(100, p.attributes.fitness + recoverBonus);
          }
          if (rehabBonus > 0 && p.injury && p.injury.daysRemaining > 0) {
            p.injury.daysRemaining = Math.max(0, p.injury.daysRemaining - rehabBonus);
            if (p.injury.daysRemaining <= 0) {
              p.injury = null;
              p.availability = 'available';
              p.attributes.fitness = Math.max(p.attributes.fitness, 70);
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // JÄHRLICHER NACHWUCHS-JAHRGANG: zum 1. Juli neue Talente in allen Akademien.
    // -------------------------------------------------------------------------
    {
      const utcMon = new Date(today + 'T00:00:00Z').getUTCMonth() + 1; // 1–12
      const domNow = new Date(today + 'T00:00:00Z').getUTCDate();
      const yearNow = new Date(today + 'T00:00:00Z').getUTCFullYear();
      if (utcMon === 7 && domNow === 1) {
        for (const club of Object.values(g.clubs)) {
          if ((club.infrastructure.lastYouthIntakeYear ?? 0) >= yearNow) continue;
          club.infrastructure.lastYouthIntakeYear = yearNow;
          const isMine = club.id === g.managedClubId;

          // 1) Alle Talente rücken einen Jahrgang auf (Alter +1, Altersklasse steigt).
          ageYouthPlayers(club, g.youthPlayers);
          // 2) Jahrgangsabschluss: A-Jugend (nun ≥20) verlässt die Akademie –
          //    die Besten werden hochgezogen, der Rest verlässt den Verein.
          const grad = graduateYouth(club, g.players, g.youthPlayers, isMine);
          // 3) Neuer jüngster Jahrgang (G-Jugend/Bambini, 7 Jahre) rückt nach.
          const cohort = academyIntake(club, today, `${yearNow}`);
          for (const yp of cohort) {
            g.youthPlayers[yp.id] = yp;
            club.youthPlayerIds.push(yp.id);
          }

          if (isMine) {
            if (cohort.length > 0) {
              pushMessage(g.messages, makeMessage({
                date: today, category: 'training', from: 'Leiter Jugendakademie',
                subject: 'Neuer G-Jugend-Jahrgang (Bambini) in der Jugendakademie',
                shortText: `${cohort.length} neue(s) Talent(e) (G-Jugend/Bambini, 7 Jahre) sind eingetroffen.`,
                bodyText: `Unsere Jugendakademie (Stufe ${club.infrastructure.youthAcademy}) hat einen neuen G-Jugend-Jahrgang (Bambini) aufgenommen: `
                  + `${cohort.length} Nachwuchsspieler im Alter von 7 Jahren.\n\n`
                  + cohort.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`).join('\n')
                  + `\n\nSo junge Talente lassen sich kaum einschätzen – unsere Scouts geben eine sehr breite Potenzial-Spanne an, die sich über die Jahre präzisiert. Schau im Bereich „Jugend“ vorbei.`,
              }));
            }
            if (grad.promoted.length > 0 || grad.released.length > 0) {
              const lines: string[] = [];
              if (grad.promoted.length > 0) {
                lines.push('In den Profikader hochgezogen:');
                lines.push(...grad.promoted.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
              }
              if (grad.released.length > 0) {
                if (lines.length > 0) lines.push('');
                lines.push('Haben den Verein verlassen (kein Vertrag):');
                lines.push(...grad.released.map((y) => `• ${y.fullName} (${y.naturalPosition}, ${y.age} Jahre)`));
              }
              pushMessage(g.messages, makeMessage({
                date: today, category: 'training', from: 'Leiter Jugendakademie',
                subject: 'Jahrgangsabschluss der A-Jugend',
                shortText: `${grad.promoted.length} hochgezogen, ${grad.released.length} abgegeben.`,
                bodyText: `Die A-Jugend hat den Jahrgang abgeschlossen. `
                  + `Die vielversprechendsten Talente wurden in den Profikader übernommen, die übrigen verlassen den Verein.\n\n`
                  + lines.join('\n'),
              }));
            }
            if (cohort.length > 0 || grad.promoted.length > 0 || grad.released.length > 0) {
              stopForAction = true;
            }
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // MONATSABSCHLUSS: am 1. eines Monats Gehälter, Fixkosten, Sponsoring buchen.
    // -------------------------------------------------------------------------
    const utcDom = new Date(today + 'T00:00:00Z').getUTCDate();
    const curMonth = today.slice(0, 7);
    if (utcDom === 1) {
      for (const club of Object.values(g.clubs)) {
        if (club.finances.lastMonthlyBooking === curMonth) continue;
        const isMine = club.id === g.managedClubId;
        const m = bookMonthly(club, g.players, today, g.table, isMine, economyScale(yearOf(today)));
        if (isMine) {
          const net = m.net;
          pushMessage(g.messages, makeMessage({
            date: today, category: 'board', from: 'Finanzabteilung',
            subject: `Monatsabschluss – Kontostand ${fmtDM(club.finances.balance)}`,
            shortText: `${net >= 0 ? 'Überschuss' : 'Fehlbetrag'}: ${fmtDM(Math.abs(net))} im Monat.`,
            bodyText: `Der Monatsabschluss wurde gebucht.\n\n`
              + `Trikotsponsoring: +${fmtDM(m.sponsorship)}\n`
              + `Bandenwerbung: +${fmtDM(m.advertising)}\n`
              + `Mitgliedsbeitraege: +${fmtDM(m.membership)}\n`
              + (m.cateringLease > 0 ? `Catering-Pacht: +${fmtDM(m.cateringLease)}\n` : '')
              + (m.placementBonus > 0 ? `Platzierungsbonus: +${fmtDM(m.placementBonus)}\n` : '')
              + `Spielergehälter: -${fmtDM(m.wages)}\n`
              + `Betreuerstab: -${fmtDM(m.staffWages)}\n`
              + `Stadionunterhalt: -${fmtDM(m.stadiumMaintenance)}\n`
              + `Gebäude-Fixkosten: -${fmtDM(m.facilities)}\n`
              + `Sonstige Kosten: -${fmtDM(m.otherFixed)}\n\n`
              + `Monatssaldo: ${net >= 0 ? '+' : '-'}${fmtDM(Math.abs(net))}\n`
              + `Neuer Kontostand: ${fmtDM(club.finances.balance)}\n\n`
              + `Details findest du im Bereich Finanzen.`,
          }));
          if (club.finances.balance < 0) {
            pushMessage(g.messages, makeMessage({
              date: today, category: 'board', from: 'Vereinsvorstand',
              subject: '⚠️ Konto im Minus!',
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
        const staffCost = staffMonthlyTotal(g.hiredStaff ?? [], scale);
        if (staffCost > 0 && mine) {
          book(mine.finances, today, -staffCost, 'staff_wages', 'Gehälter Mitarbeiterstab (Monat)', true);
        }
        // 2) Marketing-Ausgaben (linear) → 'other'; kleine Zusatzerlöse → merch/sponsor.
        const mkt = g.marketing ?? {};
        const mktCost = Math.round(marketingMonthlyBase(mkt) * scale);
        if (mktCost > 0 && mine) {
          book(mine.finances, today, -mktCost, 'other', 'Marketing & Werbung (Monat)', true);
          const inc = marketingIncomeBase(mkt);
          const merch = Math.round(inc.merch * scale);
          const sponsor = Math.round(inc.sponsor * scale);
          if (merch > 0) book(mine.finances, today, merch, 'merchandise', 'Merchandising aus Marketing (Monat)', true);
          if (sponsor > 0) book(mine.finances, today, sponsor, 'sponsorship', 'Sponsoring aus Marketing (Monat)', true);
          // Sehr kleiner Reputations-Impuls (max +0,05/Monat).
          const rep = marketingReputationNudge(mkt);
          if (rep > 0 && typeof mine.reputation === 'number') {
            mine.reputation = Math.min(100, mine.reputation + rep);
          }
        }
      }
      stopForAction = true;
    }

    // -------------------------------------------------------------------------
    // WOCHEN-ENTWICKLUNG: sonntags Auswertung des versteckten Entwicklungs-Akkus
    // -------------------------------------------------------------------------
    if (utcDay === 0) {
      // Wochen-Entwicklung läuft still im Hintergrund: die Spielerwerte werden
      // direkt verändert (runWeeklyDevelopment mutiert die Attribute/OVR), aber
      // es erscheint KEIN Popup und der Lauf pausiert nicht mehr. Eine Meldung
      // gibt es nur noch bei den großen Auf-/Abwertungsrunden (rating_update).
      runWeeklyDevelopment(g.players, userIds);
      // Jugendentwicklung aller Vereine (Talente wachsen; Scouting präzisiert sich).
      // Manager-Verein erhält Boni aus Mitarbeitern (Scouting) und Zukunfts-Bauten
      // (NLZ → Wachstum, Datenanalyse-Zentrum → Scouting) — Block p11.
      const myStaffFx = computeStaffEffects(g.hiredStaff ?? []);
      const myInfra = g.clubs[g.managedClubId]?.infrastructure;
      const myGrowthBonus = nlzGrowthBonus(myInfra?.nlz ?? 1);
      const myScoutBonus = (myStaffFx.scouting ?? 0) + dataScoutingBonus(myInfra?.dataCenter ?? 1);
      for (const club of Object.values(g.clubs)) {
        if (club.id === g.managedClubId) {
          developYouthWeekly(club, g.youthPlayers, { growthBonus: myGrowthBonus, scoutBonus: myScoutBonus });
        } else {
          developYouthWeekly(club, g.youthPlayers);
        }
      }
    }

    // -------------------------------------------------------------------------
    // BLOCK p11 — Geplante Aktivitäten: Effekt anwenden, sobald das Enddatum
    // erreicht ist (Fitness/Form/Moral auf den Kader; Freundschaftsspiel-Erlös).
    // Kosten wurden bereits bei der Planung gebucht.
    // -------------------------------------------------------------------------
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
          subject: `${def.icon} ${act.label} abgeschlossen`,
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

    if (stopForAction) {
      // Auf dem heutigen Datum stehen bleiben (z.B. AM Spieltag), damit die
      // Zentrale den korrekten Tag zeigt. Der Tageswechsel wird beim Fortsetzen
      // des Vorlaufs nachgeholt (siehe Anfang von processDay).
      cal.pendingAdvance = true;
      setRunning(false);
      return false;
    }
    cal.currentDate = CalendarEngine.nextDay(today);
    return true;
  }, [g, settings.autosave, doSave, myClub]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { processDay(); rerender(); }, g.calendar.speedMs);
    return () => clearInterval(id);
  }, [running, processDay, rerender, g.calendar.speedMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !liveMatchId && !textMatchId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [liveMatchId, textMatchId]);

  const nextEv = CalendarEngine.nextEvent(g.calendar);
  const seasonOver = CalendarEngine.isSeasonOver(g.calendar);

  // Button-Label: "Simulieren" NUR, wenn ein Klick das eigene Spiel DIREKT öffnet,
  // d.h. das eigene nächste Spiel liegt am AKTUELLEN Kalendertag (kein Tagesvorlauf nötig).
  // Muss bis zum Spiel erst vorgespult werden, bleibt es "Weiter".
  const nextIsMyMatch = !!nextEv && nextEv.date === g.calendar.currentDate && (
    (nextEv.type === 'matchday' && (() => {
      const m = g.fixtures.find((x) => x.id === nextEv.matchId);
      return !!m && m.involvesPlayerClub;
    })()) ||
    (nextEv.type === 'cup_matchday' && nextEv.cupRoundIndex != null && (() => {
      const round = g.cup?.rounds[nextEv.cupRoundIndex!];
      return !!round && round.ties.some((t) => t.involvesPlayerClub && !t.played);
    })())
  );
  // Header-Button: nur Text (kein Icon/Datum) – Zustand bleibt sprechend.
  const hdrBtnLabel = seasonOver ? 'Neue Saison' : running ? 'Pause' : nextIsMyMatch ? 'Simulieren' : 'Weiter';
  // Aktive Hauptkategorie für die Header-Navigation.
  const navMatched = MENU_STRUCTURE.find((c) => c.dash === screen || c.subs.some((s) => s.screen === screen));

  const isZentrale = screen === 'dashboard';
  // Dashboard-aehnliche Seiten: Zentrale + die 6 Kategorie-Dashboards. Teilen sich
  // das fuellende Flex-Layout (Boxen mit fixer Geometrie, Kalenderstreifen oben).
  const isDashLike = isZentrale || screen.startsWith('cat-');

  return (
    <div className={`app-shell ${isZentrale ? 'shell-zentrale' : ''} ${isDashLike ? 'shell-dashlike' : ''}`}>
      {/* ---------------- HEADER (eine Leiste) ---------------- */}
      <header className={`hd-bar ${isZentrale ? 'hd-bar--zentrale' : ''}`}>
        {/* Logo */}
        <div className="hd-logo">
          <span className="hd-logo-year">1975</span>
          <span className="hd-logo-div" aria-hidden="true" />
          <span className="hd-logo-title"><span>A Football</span><span>Manager</span></span>
        </div>

        {/* Hauptnavigation (7 Kategorien) */}
        <nav className="hd-nav">
          {MENU_STRUCTURE.map((cat) => {
            const active = !!navMatched && cat.key === navMatched.key;
            return (
              <button
                key={cat.key}
                className={`hd-nav-item ${active ? 'active' : ''}`}
                onClick={() => setScreen(cat.dash)}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Rechter Block: Kontostand, Verein, Weiter, Einstellungen */}
        <div className="hd-right">
          {saveMsg && <span className="save-toast">{saveMsg}</span>}
          <div className="hd-club" title={myClub.name}>
            <ClubCrest club={myClub} size={60} />
            <span className="hd-club-name">{myClub.name}</span>
          </div>
          <span className="hd-sep" aria-hidden="true" />
          <div className="hd-balance">
            <span className="hd-balance-ico"><Icon name="finances" /></span>
            <span className="hd-balance-lbl">Kontostand:</span>
            <span className="hd-balance-val">{fmtDMfull(myClub.finances.balance)}</span>
          </div>
          <span className="hd-sep" aria-hidden="true" />
          <div className="hdr-menu" ref={menuRef}>
            <button
              className="hd-gear"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              title="Menü & Einstellungen"
            >
              <Icon name="settings" />
            </button>
            {menuOpen && (
              <div className="menu-dropdown" role="menu">
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setShowSettings(true); }}>
                  <Icon name="settings" /> <span>Einstellungen</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setScreen('wiki'); }}>
                  <Icon name="wiki" /> <span>Wiki / Spielhilfe</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setClubEditorOpen(true); }}>
                  <Icon name="dashVerein" /> <span>Editor</span>
                </button>
                <div className="menu-dd-sep" />
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setSaveLoadMode('save'); }}>
                  <Icon name="save" /> <span>Speichern</span>
                </button>
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); setSaveLoadMode('load'); }}>
                  <Icon name="loadGame" /> <span>Laden</span>
                </button>
                <div className="menu-dd-sep" />
                <button className="menu-dd-item" role="menuitem" onClick={() => { setMenuOpen(false); if (confirm('Zurück zum Hauptmenü? Nicht gespeicherter Fortschritt geht verloren.')) onExit(); }}>
                  <Icon name="mainmenu" /> <span>Hauptmenü</span>
                </button>
                <button className="menu-dd-item danger" role="menuitem" onClick={() => { setMenuOpen(false); if (confirm('Spiel wirklich beenden? Nicht gespeicherter Fortschritt geht verloren.')) onExit(); }}>
                  <Icon name="quit" /> <span>Spiel beenden</span>
                </button>
              </div>
            )}
          </div>
          <span className="hd-sep" aria-hidden="true" />
          <button
            className={`hd-continue ${running ? 'running' : ''} ${seasonOver ? 'season' : ''}`}
            onClick={() => {
              if (seasonOver) { startNextSeason(g); setRunning(false); rerender(); }
              else setRunning((r) => !r);
            }}
            title={seasonOver ? 'Nächste Saison starten' : 'Leertaste'}
          >
            <span className="hd-continue-ico" aria-hidden="true">
              {running ? (
                <svg viewBox="0 0 24 24" width="38" height="38"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="45" height="45"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
              )}
            </span>
            <span className="hd-continue-txt">
              <span className="hd-continue-lbl">{hdrBtnLabel}</span>
            </span>
          </button>
        </div>
      </header>

      {/* ---------------- UNTERMENÜ (Unterpunkte der aktiven Kategorie) ---------------- */}
      <TopNav screen={screen} setScreen={setScreen} dateLabel={fmtDateFull(g.calendar.currentDate)} />

      {/* ---------------- HAUPTINHALT ---------------- */}
      <main className="app-main">
        {/* Universeller Kalender-Streifen: identisch auf JEDER Seite (wie Header/Footer). */}
        <CalendarStrip g={g} onGoto={setScreen} />
        {screen === 'dashboard' && <Dashboard g={g} onGoto={setScreen} onWatch={(id) => setLiveMatchId(id)} onOpenEditor={() => setClubEditorOpen(true)} />}
        {screen === 'table' && <TableView g={g} />}
        {screen === 'fixtures' && <FixturesView g={g} onWatch={(id) => setLiveMatchId(id)} />}
        {screen === 'squad' && <SquadView g={g} />}
        {screen === 'lineup' && <LineupView g={g as any} onChange={rerender} />}
        {screen === 'training' && <TrainingView g={g} onTrained={rerender} />}
        {screen === 'transfers' && <TransfersView g={g} onDone={rerender} />}
        {screen === 'finances' && <FinancesView g={g} />}
        {screen === 'youth' && <YouthView g={g} onChange={rerender} />}
        {screen === 'facilities' && <FacilitiesView g={g} onChange={rerender} />}
        {screen === 'staff' && <StaffView g={g} onChange={rerender} />}
        {screen === 'marketing' && <MarketingView g={g} onChange={rerender} />}
        {screen === 'calendar' && <CalendarView g={g} onChange={rerender} onGoto={setScreen} />}
        {screen === 'cup' && <CupView g={g} onWatch={(id) => setLiveMatchId(id)} />}
        {screen === 'chronicle' && <ChronicleView g={g} />}
        {screen === 'news' && <NewsView g={g} onRead={rerender} />}
        {screen === 'wiki' && <WikiView g={g} />}
        {screen === 'tactics' && <TacticsView g={g as any} onChange={rerender} />}
        {screen === 'stadium' && <StadiumView g={g} onChange={rerender} />}
        {/* Kategorie-Dashboards */}
        {screen === 'cat-spieltag' && <SpieltagDashboard g={g} onGoto={setScreen} onWatch={(id) => setLiveMatchId(id)} />}
        {screen === 'cat-kader' && <KaderDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-transfers' && <TransfersDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-finanzen' && <FinanzenDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-verein' && <VereinDashboard g={g} onGoto={setScreen} />}
        {screen === 'cat-statistiken' && <StatistikenDashboard g={g} onGoto={setScreen} />}
        {/* Rudimentäre Einzelseiten */}
        {screen === 'presse' && <PresseView g={g} />}
        {screen === 'vertraege' && <VertraegeView g={g} />}
        {screen === 'beobachtung' && <BeobachtungView />}
        {screen === 'verhandlungen' && <VerhandlungenView />}
        {screen === 'sponsoring' && <SponsoringView g={g} onGoto={setScreen} onChange={rerender} />}
        {screen === 'fans' && <FansView g={g} />}
        {screen === 'international' && <InternationalView g={g} onWatch={(id) => setLiveMatchId(id)} />}
      </main>

      {/* Persistenter Footer auf ALLEN Seiten (Dashboard inklusive) - voll buendig
          am unteren Rand, Shell-Ebene, einheitlich. */}
      <footer className="dashx-foot">
        <span className="dashx-foot-l">1975 A FOOTBALL MANAGER</span>
        <span className="dashx-foot-c">SAISON {g.season}</span>
        <span className="dashx-foot-r">DEUTSCHE FUSSBALLKULTUR. FÜR IMMER.</span>
      </footer>

      {/* ---------------- IN-GAME-OVERLAYS ---------------- */}
      {showSettings && (
        <SettingsModal settings={settings} onClose={() => setShowSettings(false)} onSave={onUpdateSettings} />
      )}
      {saveLoadMode && (
        <SaveLoadModal
          mode={saveLoadMode}
          currentSlot={currentSlot}
          onClose={() => setSaveLoadMode(null)}
          onSave={(slot, name) => { doSave(slot, name); setSaveLoadMode(null); }}
          onLoad={(slot) => { setSaveLoadMode(null); onLoad(slot); }}
        />
      )}
      {clubEditorOpen && (
        <ClubEditorModal
          club={myClub}
          clubs={Object.values(g.clubs)}
          onClose={() => setClubEditorOpen(false)}
          onSaved={(clubId, patch) => { if (clubId === g.managedClubId) Object.assign(myClub, patch); rerender(); doSave(); }}
        />
      )}

      {textMatchId && (
        <MatchLiveView g={g as any} matchId={textMatchId}
          onClose={() => { const id = textMatchId; setTextMatchId(null); setLiveMatchId(id); rerender(); }} />
      )}

      {liveMatchId && (
        <MatchModal g={g} matchId={liveMatchId} onClose={() => { setLiveMatchId(null); rerender(); }} />
      )}

      {devReveal && (
        <DevelopmentReveal
          g={g}
          reveals={devReveal}
          onClose={() => { setDevReveal(null); rerender(); }}
        />
      )}

      {ratingCeremony && (
        <RatingCeremony
          results={ratingCeremony.results}
          type={ratingCeremony.type}
          anlass={ratingCeremony.anlass}
          onClose={() => { setRatingCeremony(null); rerender(); }}
        />
      )}
    </div>
  );
}

// =============================================================================
// MENÜ-STRUKTUR (zweistufige Top-Navigation)
// =============================================================================
// Reihe 1 = 7 Hauptkategorien (Klick öffnet das jeweilige Kategorie-Dashboard),
// Reihe 2 = Unterpunkte der aktiven Kategorie. Alle Symbole im Set-C-Stil.
interface SubItem { screen: Screen; label: string; icon: IconName }
interface MainCat { key: string; label: string; icon: IconName; dash: Screen; subs: SubItem[] }

// Jede Kategorie bekommt als ERSTEN Unterpunkt einen gleichnamigen Eintrag, der auf das
// Kategorie-Dashboard (`dash`) zeigt. Dadurch ist er automatisch aktiv, sobald man im
// Obermenue auf die Kategorie klickt (Header navigiert auf `dash`, TopNav markiert den
// Unterpunkt mit `screen === s.screen`). Reihenfolge: Selbst-Eintrag zuerst, dann die Views.
const MENU_STRUCTURE: MainCat[] = [
  { key: 'zentrale', label: 'Zentrale', icon: 'zentrale', dash: 'dashboard', subs: [
    { screen: 'dashboard', label: 'Zentrale', icon: 'zentrale' },
    { screen: 'news', label: 'Nachrichten', icon: 'news' },
    { screen: 'presse', label: 'Presse', icon: 'presse' },
    { screen: 'calendar', label: 'Kalender', icon: 'kalender' },
  ] },
  { key: 'spieltag', label: 'Spieltag', icon: 'lineup', dash: 'cat-spieltag', subs: [
    { screen: 'cat-spieltag', label: 'Spieltag', icon: 'lineup' },
    { screen: 'lineup', label: 'Aufstellung', icon: 'lineup' },
    { screen: 'tactics', label: 'Taktik', icon: 'tactics' },
    { screen: 'fixtures', label: 'Spielplan', icon: 'schedule' },
  ] },
  { key: 'kader', label: 'Kader', icon: 'squad', dash: 'cat-kader', subs: [
    { screen: 'cat-kader', label: 'Kader', icon: 'squad' },
    { screen: 'squad', label: 'Übersicht', icon: 'squad' },
    { screen: 'vertraege', label: 'Verträge', icon: 'contracts' },
    { screen: 'training', label: 'Training', icon: 'training' },
    { screen: 'youth', label: 'Jugend', icon: 'youth' },
  ] },
  { key: 'transfers', label: 'Transfers', icon: 'transfers', dash: 'cat-transfers', subs: [
    { screen: 'cat-transfers', label: 'Transfers', icon: 'transfers' },
    { screen: 'transfers', label: 'Transfermarkt', icon: 'transfers' },
    { screen: 'beobachtung', label: 'Beobachtungsliste', icon: 'watchlist' },
    { screen: 'verhandlungen', label: 'Aktive Verhandlungen', icon: 'negotiations' },
  ] },
  { key: 'finanzen', label: 'Finanzen', icon: 'finances', dash: 'cat-finanzen', subs: [
    { screen: 'cat-finanzen', label: 'Finanzen', icon: 'finances' },
    { screen: 'finances', label: 'Bilanz', icon: 'finances' },
    { screen: 'sponsoring', label: 'Sponsoring', icon: 'sponsoring' },
    { screen: 'marketing', label: 'Marketing', icon: 'marketing' },
  ] },
  { key: 'verein', label: 'Verein', icon: 'stadium', dash: 'cat-verein', subs: [
    { screen: 'cat-verein', label: 'Verein', icon: 'stadium' },
    { screen: 'staff', label: 'Mitarbeiter', icon: 'staff' },
    { screen: 'facilities', label: 'Vereinsgelände', icon: 'facilities' },
    { screen: 'stadium', label: 'Stadion', icon: 'stadium' },
    { screen: 'fans', label: 'Fans', icon: 'fans' },
  ] },
  { key: 'statistiken', label: 'Statistiken', icon: 'stats', dash: 'cat-statistiken', subs: [
    { screen: 'cat-statistiken', label: 'Statistiken', icon: 'stats' },
    { screen: 'table', label: 'Liga', icon: 'stats' },
    { screen: 'cup', label: 'Pokal', icon: 'trophy' },
    { screen: 'international', label: 'International', icon: 'international' },
    { screen: 'chronicle', label: 'Chronik', icon: 'chronicle' },
  ] },
];

/** Zweistufige Top-Navigation: Hauptkategorien + Unterpunkte der aktiven Kategorie. */
function TopNav({ screen, setScreen, dateLabel }: { screen: Screen; setScreen: (s: Screen) => void; dateLabel?: string }) {
  const matched = MENU_STRUCTURE.find((c) => c.dash === screen || c.subs.some((s) => s.screen === screen));
  const activeCat = matched ?? MENU_STRUCTURE[0];
  return (
    <nav className="top-nav sub-only">
      <div className="tn-sub">
        {activeCat.subs.map((s) => (
          <button key={s.screen} className={`tn-sub-item ${screen === s.screen ? 'active' : ''}`} onClick={() => setScreen(s.screen)}>
            <span>{s.label}</span>
          </button>
        ))}
        {dateLabel && <span className="tn-date">{dateLabel}</span>}
      </div>
    </nav>
  );
}

// =============================================================================
// KALENDER-ZEITSTRAHL (Header) — 7 „Kalenderblatt"-Kacheln
// =============================================================================
// Spiegelt die Events aus „Zentrale → Kalender" (Liga-/Pokalspiele, Transfer-
// fenster, Bewertungen, Winterpause, Saisonende + geplante Aktivitäten). Kachel
// 2 von links ist IMMER „heute"; links davon das jüngste vergangene Event, rechts
// die nächsten kommenden Events. Alles wird rein aus g.calendar/g.activities +
// g.calendar.currentDate abgeleitet und schreibt so automatisch mit den Tagen fort.
const CAL_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const CAL_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Zerlegt ein ISO-Datum (UTC) in Tag/Monatskürzel/Wochentag. */
function calParts(iso: string): { day: number; mon: string; wd: string } {
  const d = new Date(iso + 'T00:00:00Z');
  return { day: d.getUTCDate(), mon: CAL_MONTHS[d.getUTCMonth()], wd: CAL_DAYS[d.getUTCDay()] };
}

type StripAccent = 'orange' | 'gold' | undefined;
interface StripEvent {
  date: string;
  icon: IconName;
  line: string;
  accent: StripAccent;
  isMatch: boolean;
  prio: number;
}

/** Baut eine pro Datum ein-eindeutige Event-Map (wichtigstes Event je Tag) für den Zeitstrahl. */
function buildStripEventMap(g: Game): Map<string, StripEvent> {
  const full = (id: string) => g.clubs[id]?.name ?? id;
  const byDate = new Map<string, StripEvent>();
  const consider = (e: StripEvent) => {
    const prev = byDate.get(e.date);
    if (!prev || e.prio > prev.prio) byDate.set(e.date, e);
  };

  // Quelle A — Kalender-Events
  for (const ev of g.calendar.events) {
    switch (ev.type) {
      case 'matchday': {
        const m = g.fixtures.find((x) => x.id === ev.matchId);
        if (m && m.involvesPlayerClub) {
          const heim = m.homeClubId === g.managedClubId;
          const opp = heim ? m.awayClubId : m.homeClubId;
          consider({ date: ev.date, icon: 'matchball', line: `${full(opp)} (${heim ? 'H' : 'A'})`, accent: 'orange', isMatch: true, prio: 100 });
        } else if (m) {
          consider({ date: ev.date, icon: 'schedule', line: `Spieltag ${m.matchday}`, accent: undefined, isMatch: false, prio: 40 });
        }
        break;
      }
      case 'cup_matchday': {
        const round = ev.cupRoundIndex != null ? g.cup?.rounds[ev.cupRoundIndex] : undefined;
        let line = 'DFB-Pokal';
        if (round?.drawn) {
          const tie = round.ties.find((t) => t.homeClubId === g.managedClubId || t.awayClubId === g.managedClubId);
          if (tie) {
            const heim = tie.homeClubId === g.managedClubId;
            line = `${full(heim ? tie.awayClubId : tie.homeClubId)} (${heim ? 'H' : 'A'})`;
          } else {
            line = round.name;
          }
        } else if (round) {
          line = round.name;
        }
        consider({ date: ev.date, icon: 'trophy', line, accent: 'gold', isMatch: true, prio: 95 });
        break;
      }
      case 'transfer_window_open':
        consider({ date: ev.date, icon: 'transfers', line: 'Transferfenster', accent: undefined, isMatch: false, prio: 30 });
        break;
      case 'transfer_window_close':
        consider({ date: ev.date, icon: 'transfers', line: 'Transfer schließt', accent: undefined, isMatch: false, prio: 30 });
        break;
      case 'rating_update':
        consider({ date: ev.date, icon: 'stats', line: 'Bewertung', accent: undefined, isMatch: false, prio: 25 });
        break;
      case 'winter_break':
        consider({ date: ev.date, icon: 'kalender', line: 'Winterpause', accent: undefined, isMatch: false, prio: 20 });
        break;
      case 'season_end':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonende', accent: undefined, isMatch: false, prio: 20 });
        break;
      case 'season_start':
        consider({ date: ev.date, icon: 'kalender', line: 'Saisonstart', accent: undefined, isMatch: false, prio: 15 });
        break;
    }
  }

  // Quelle B — geplante Aktivitäten: NUR Freundschaftsspiele erscheinen im
  // Streifen (das sind echte Spiele). Trainingslager, Teambuilding & Reisen
  // werden bewusst NICHT angezeigt.
  for (const act of g.activities ?? []) {
    if (act.type !== 'friendly') continue;
    consider({
      date: act.startDate,
      icon: 'matchball',
      line: ACTIVITY_DEFS[act.type]?.name ?? act.label,
      accent: undefined,
      isMatch: true,
      prio: 50,
    });
  }

  return byDate;
}

const WD_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MON_FULL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
function fmtDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${WD_FULL[d.getUTCDay()]}, ${d.getUTCDate()}. ${MON_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function fmtDateShort(iso: string): { wd: string; dmy: string } {
  const d = new Date(iso + 'T00:00:00Z');
  const p2 = (n: number) => String(n).padStart(2, '0');
  return { wd: WD_SHORT[d.getUTCDay()], dmy: `${p2(d.getUTCDate())}.${p2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}` };
}
function upcomingStripEvents(g: Game, max: number): StripEvent[] {
  const map = buildStripEventMap(g);
  const out: StripEvent[] = [];
  let cur = g.calendar.currentDate;
  for (let i = 0; i < 220 && out.length < max; i++) {
    const ev = map.get(cur);
    if (ev) out.push(ev);
    cur = addDaysUTC(cur, 1);
  }
  return out;
}

/** Nachrichten-Kategorie -> UI-Icon (emojifrei, nur <Icon>-Set). */
const MSG_CAT_ICON: Record<MessageCategory, IconName> = {
  transfer: 'transfers',
  injury: 'squad',
  match: 'matchball',
  board: 'zentrale',
  contract: 'contracts',
  training: 'training',
  media: 'presse',
  cup: 'trophy',
  milestone: 'chronicle',
  general: 'news',
};

/**
 * 7 Kalenderblatt-Kacheln im Header, strikt an aufeinanderfolgenden KALENDERTAGEN
 * orientiert (UTC): Slot 1 = gestern, Slot 2 = heute (Akzent), Slots 3–7 = die
 * nächsten 5 Tage. Jede Kachel zeigt ihr Datum; fällt ein Ereignis auf den Tag,
 * wird es (wichtigstes zuerst) mit Farbcodierung angezeigt und ist klickbar.
 */
function CalendarStrip({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  // 7-Tage-Kalenderstreifen: Gestern, Heute (2. v. l., groesser), +5 kommende Tage.
  // Universeller Streifen: identisch auf JEDER Seite (Shell-Ebene), nicht nur Zentrale.
  const calStripDays = (() => {
    const map = buildStripEventMap(g);
    const arr: { date: string; wd: string; day: number; mon: string; isToday: boolean; ev: StripEvent | null }[] = [];
    for (let i = -1; i <= 5; i++) {
      const date = addDaysUTC(g.calendar.currentDate, i);
      const dt = new Date(date + 'T00:00:00Z');
      arr.push({
        date,
        wd: WD_SHORT[dt.getUTCDay()].toUpperCase(),
        day: dt.getUTCDate(),
        mon: MON_FULL[dt.getUTCMonth()].toUpperCase(),
        isToday: i === 0,
        ev: map.get(date) ?? null,
      });
    }
    return arr;
  })();
  return (
    <div className="dashx-caltop">
      <div className="kbstrip" onClick={() => onGoto('calendar')} role="button" tabIndex={0}>
        {calStripDays.map((dd) => {
          const ev = dd.ev;
          const isMatch = ev?.isMatch ?? false;
          const cls = ['kbsheet'];
          if (dd.isToday) cls.push('is-today');
          if (ev) cls.push('has-ev');
          if (isMatch) cls.push('is-match');
          return (
            <div key={dd.date} className={cls.join(' ')}>
              <div className="kbsheet-head">
                <span className="kbday">{dd.day}</span>
                <span className="kbwd">{dd.isToday ? 'HEUTE' : dd.wd}</span>
              </div>
              <div className="kbsheet-ico">
                {ev ? <Icon name={isMatch ? 'matchballwhite' : ev.icon} size={isMatch ? 52 : 26} /> : null}
              </div>
              <div className="kbsheet-lbl">{ev ? ev.line : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Spieltag simulieren + Form/Fitness-Effekte + Nachrichten
// -----------------------------------------------------------------------------
function simulateMatchday(game: Game, matchday: number): void {
  const dayMatches = game.fixtures.filter((m) => m.matchday === matchday && m.status === 'scheduled');
  for (const match of dayMatches) {
    const home = game.clubs[match.homeClubId];
    const away = game.clubs[match.awayClubId];
    const engine = new MatchEngine(home, away, game.players, game.pointSystem);
    const { result, events } = engine.simulate();
    match.result = result;
    match.events = events;
    match.status = 'finished';

    // Form & Fitness beider Mannschaften aktualisieren.
    const homeSide: SideResult = result.homeGoals > result.awayGoals ? 'W' : result.homeGoals < result.awayGoals ? 'L' : 'D';
    const awaySide: SideResult = homeSide === 'W' ? 'L' : homeSide === 'L' ? 'W' : 'D';
    applyMatchEffects(home, game.players, homeSide);
    applyMatchEffects(away, game.players, awaySide);

    // Finanz-Buchungen: Heimspiel-Einnahmen + Leistungsprämien beider Vereine.
    const mid = game.managedClubId;
    const mScale = economyScale(yearOf(match.date));
    bookHomeMatch(home, result, true, homeSide === 'W', homeSide === 'D', match.date, home.id === mid, mScale);
    bookHomeMatch(away, result, false, awaySide === 'W', awaySide === 'D', match.date, away.id === mid, mScale);
  }
  game.table = calculateTable(leagueClubs(game), game.fixtures, game.pointSystem, game.table.season, game.table);

  // Nicht-Spieler-Ligen (2. Liga Nord/Süd) performant per Stärke um einen
  // Spieltag weiterführen. Kein voller Match-Engine-Lauf → kein Tick-Lag.
  if (game.leagues) {
    for (const div of game.leagues.otherDivisions) {
      advanceDivision(div, game.simClubs, game.pointSystem, game.season);
    }
  }
}

/** Nur die Bundesliga-Vereine (ohne die Pokal-Amateurvereine mit Präfix "am"). */
function leagueClubs(game: Game): Club[] {
  return Object.values(game.clubs).filter((c) => !c.id.startsWith('am'));
}

// -----------------------------------------------------------------------------
// EPOCHEN-/TIMELINE-SYSTEM — Meilensteine auslösen & Effekte anwenden
// -----------------------------------------------------------------------------

/** Wendet den Spiel-Effekt eines Meilensteins an (Punktesystem, Feature-Flag). */
function applyTimelineEffect(g: Game, ev: TimelineEvent): void {
  if (!ev.effect) return;
  if (ev.effect.pointSystem) {
    g.pointSystem = ev.effect.pointSystem;
    // Tabelle mit dem neuen Punktesystem SOFORT neu berechnen, damit z. B. die
    // Umstellung auf 3 Punkte 1995/96 die Tabellenrechnung wirklich verändert.
    g.table = calculateTable(leagueClubs(g), g.fixtures, g.pointSystem, g.season, g.table);
  }
  if (ev.effect.unlock && !g.unlockedFeatures.includes(ev.effect.unlock)) {
    g.unlockedFeatures.push(ev.effect.unlock);
  }
}

/**
 * Löst alle für `season` fälligen Meilensteine aus: Effekt anwenden, in
 * firedMilestones vermerken und (außer bei silent) eine Chronik-Nachricht in die
 * Inbox legen. Gibt die ausgelösten Ereignisse zurück.
 */
function fireTimelineForSeason(g: Game, season: string, dateISO: string, silent = false): TimelineEvent[] {
  const due = dueTimelineEvents(season, g.firedMilestones);
  for (const ev of due) {
    g.firedMilestones.push(ev.id);
    applyTimelineEffect(g, ev);
    if (!silent) {
      const meta = TIMELINE_TYPE_META[ev.type];
      pushMessage(g.messages, makeMessage({
        date: dateISO, category: 'milestone', from: 'Fußball-Chronik',
        subject: `${meta.icon} ${ev.year}: ${ev.title}`,
        shortText: `${meta.label}-Meilenstein ${ev.season}: ${ev.title}.`,
        bodyText: `${ev.title}  (${ev.season} · ${meta.label})\n\n${ev.description}\n\n`
          + `Diesen und alle weiteren Meilensteine findest du im Bereich „Chronik“.`,
      }));
    }
  }
  return due;
}

/**
 * Startet die nächste Saison: Spielplan, Kalender, Tabelle und DFB-Pokal werden
 * neu erzeugt, das Saison-Label hochgezählt und die zu Saisonbeginn fälligen
 * Chronik-Meilensteine ausgelöst. Der Kaderbestand, die Finanzen und die
 * Jugendakademien bleiben erhalten (Nachwuchs rückt am 1. Juli automatisch nach).
 */
// Aktuelle Stärke eines Vereins (Sim-Wert oder Durchschnitts-Overall des Kaders).
function clubStrengthFor(g: Game, id: string): number {
  const sc = g.simClubs[id];
  if (sc) return sc.strength;
  const c = g.clubs[id];
  if (c) {
    const ovs = c.playerIds.map((pid) => g.players[pid]?.overall ?? 50);
    return ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : c.reputation;
  }
  return 50;
}

// Anzeigename eines Vereins (voll oder Sim) für Auf-/Abstiegs-Nachrichten.
function clubDisplayName(g: Game, id: string): string {
  return g.clubs[id]?.name ?? g.simClubs[id]?.name ?? id;
}

// Deterministisches Aufstiegs-Playoff (Hin-/Rückspiel) zwischen den beiden
// Staffel-Zweiten. Gesamt-Tore entscheiden, bei Gleichstand die Stärke.
function decidePlayoff(g: Game, aId: string, bId: string, season: string): string {
  const aStr = clubStrengthFor(g, aId);
  const bStr = clubStrengthFor(g, bId);
  const rnd = mulberry32(hashStr(`playoff:${season}:${aId}:${bId}`));
  const leg1 = simMatchGoals(aStr, bStr, rnd); // a heim
  const leg2 = simMatchGoals(bStr, aStr, rnd); // b heim
  const aTotal = leg1.home + leg2.away;
  const bTotal = leg1.away + leg2.home;
  if (aTotal !== bTotal) return aTotal > bTotal ? aId : bId;
  return aStr >= bStr ? aId : bId;
}

// Endstand (geordnete Verein-IDs) einer Division – Spielerliga aus game.table,
// alle anderen aus ihrer Sim-Tabelle.
function finalOrder(g: Game, divId: string): string[] {
  if (g.leagues.playerDivision.id === divId) return g.table.rows.map((r) => r.clubId);
  const d = g.leagues.otherDivisions.find((x) => x.id === divId);
  return d ? d.table.rows.map((r) => r.clubId) : [];
}

function startNextSeason(g: Game): void {
  const oldSeason = g.season;
  const nextStartYear = seasonStartYear(g.season) + 1;
  const nextEndYear = nextStartYear + 1;
  const newSeason = seasonLabel(nextStartYear);
  const seasonStart = `${nextStartYear}-07-01`;
  const fixturesStart = `${nextStartYear}-08-15`;
  const seasonEnd = `${nextEndYear}-06-30`;

  // Europapokal-Starter der neuen Saison AUS der abgelaufenen Saison ableiten
  // (Endtabelle + DFB-Pokalsieger) – VOR dem Überschreiben von g.table/g.cup.
  const euroQuals = computeGermanEuroQualifiers(g, false);

  // --- 1) Sim-Ligen zu Ende simulieren, damit alle Endtabellen feststehen ---
  for (const div of g.leagues.otherDivisions) {
    flushDivision(div, g.simClubs, g.pointSystem, g.season);
  }

  const oldPlayerTier = g.leagues.playerDivision.tier;

  // --- 2) Endstände ALLER aktuellen Divisionen einlesen (Spielerliga + Sim) ---
  const pd = g.leagues.playerDivision;
  const current: CurrentDivision[] = [
    { id: pd.id, tier: pd.tier, group: pd.group, name: pd.name, orderedIds: finalOrder(g, pd.id) },
  ];
  // DDR-Divisionen (tier 101/102) laufen normalerweise SEPARAT und dürfen den
  // West-Auf-/Abstieg nicht berühren – daher aus `current` heraushalten. NUR zur
  // Wiedervereinigungs-Saison 1991/92 werden sie mitgegeben, damit migrate1991
  // die DDR-Endstände in die gesamtdeutsche Pyramide integrieren kann.
  const isReunify = newSeason === '1991/92'
    && !g.appliedReforms.includes('reform-1991-reunification');
  const ddrDivs = g.leagues.otherDivisions.filter((d) => d.id.startsWith('ddr-'));
  for (const div of g.leagues.otherDivisions) {
    if (div.id.startsWith('ddr-') && !isReunify) continue;
    current.push({ id: div.id, tier: div.tier, group: div.group, name: div.name, orderedIds: finalOrder(g, div.id) });
  }

  // --- 3) Auf-/Abstieg + evtl. Ligareform datengetrieben berechnen ---
  // Liegt für die neue Saison eine noch nicht angewandte Reform vor (z. B. 1981/82
  // eingleisige 2. Liga), führt computeSeasonTransition die Struktur-Migration aus;
  // sonst den generischen, strukturunabhängigen Auf-/Abstieg.
  const res: TransitionResult = computeSeasonTransition({
    newSeason,
    current,
    strengthOf: (id) => clubStrengthFor(g, id),
    cityOf: (id) => g.clubs[id]?.city ?? g.simClubs[id]?.city ?? '',
    appliedReforms: g.appliedReforms,
    protectedId: g.managedClubId,
  });

  // Neu erzeugte fiktive Platzhalter aufnehmen, entfallene Vereine austragen.
  for (const ph of res.placeholders) g.simClubs[ph.id] = ph;
  for (const id of res.dropped) delete g.simClubs[id];

  const promoted = res.promotedTop;
  const relegated = res.relegatedTop;

  // --- 4) Mitgliedschaften + Spielerliga bestimmen ---
  const membership: Record<string, { ids: string[]; meta: DivisionMeta }> = {};
  for (const d of res.divisions) membership[d.meta.id] = { ids: d.ids, meta: d.meta };
  const playerDivId = Object.keys(membership).find((k) => membership[k].ids.includes(g.managedClubId))
    || res.divisions[0].meta.id;
  const playerIds = membership[playerDivId].ids;
  const playerSet = new Set(playerIds);

  // Reverse-Map: Verein-ID → Tier/Gruppe der neuen Saison.
  const divOf: Record<string, { tier: number; group: LeagueGroup }> = {};
  for (const key of Object.keys(membership)) {
    for (const id of membership[key].ids) divOf[id] = { tier: membership[key].meta.tier, group: membership[key].meta.group };
  }

  // --- 5) Repräsentation abgleichen: NUR die Spielerliga hat volle Kader ---
  // 5a) Sim → Voll für Vereine, die in die Spielerliga aufsteigen/einziehen.
  for (const id of playerIds) {
    if (!g.clubs[id]) {
      const sc = g.simClubs[id];
      if (sc) {
        g.clubs[id] = buildProClub(sc, g.managedClubId, seasonStart, g.players, g.youthPlayers);
        delete g.simClubs[id];
      }
    }
  }
  // 5b) Voll → Sim für volle Vereine, die die Spielerliga verlassen (Amateur-
  //     vereine des Pokals bleiben unangetastet).
  for (const c of Object.values(g.clubs)) {
    if (c.id.startsWith('am')) continue;
    if (playerSet.has(c.id)) continue;
    const dest = divOf[c.id] ?? { tier: 2, group: 'nord' as LeagueGroup };
    g.simClubs[c.id] = simClubFromClub(c, g.players, dest.tier, dest.group);
    for (const pid of c.playerIds) delete g.players[pid];
    for (const yid of (c.youthPlayerIds || [])) delete g.youthPlayers[yid];
    delete g.clubs[c.id];
  }
  // 5c) Tier/Gruppe aller Sim-Vereine auf die neue Saison aktualisieren.
  for (const id of Object.keys(g.simClubs)) {
    if (divOf[id]) { g.simClubs[id].tier = divOf[id].tier; g.simClubs[id].group = divOf[id].group; }
  }

  // --- 6) Spielerliga: neuer Spielplan + Tabelle (volle Engine) ---
  const playerClubList = playerIds.map((id) => g.clubs[id]).filter(Boolean) as Club[];
  const fixtures = generateFixtures(playerClubList, fixturesStart);
  for (const m of fixtures) {
    m.involvesPlayerClub = m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId;
  }
  g.fixtures = fixtures;
  g.table = calculateTable(playerClubList, fixtures, g.pointSystem, newSeason);

  // --- 7) Übrige Divisionen als Sim-Ligen neu aufbauen ---
  const otherDivisions: LeagueDivision[] = [];
  for (const key of Object.keys(membership)) {
    if (key === playerDivId) continue;
    otherDivisions.push(buildDivision(membership[key].meta, membership[key].ids, g.pointSystem, newSeason, fixturesStart));
  }
  // DDR-Ligen bleiben bis zur Wiedervereinigung SEPARAT bestehen: mit gleicher
  // Mannschaftsbesetzung für die neue Saison neu aufbauen. Ab 1991/92 (isReunify)
  // sind die DDR-Vereine integriert und die separate Struktur ist aufgelöst.
  if (nextStartYear < 1991 && !isReunify) {
    for (const d of ddrDivs) {
      otherDivisions.push(buildDivision(
        { id: d.id, name: d.name, tier: d.tier, group: d.group },
        d.clubIds, g.pointSystem, newSeason, fixturesStart,
      ));
    }
  }
  g.leagues = { playerDivision: membership[playerDivId].meta, otherDivisions, season: newSeason };

  const calendar = generateSeasonCalendar(fixtures, seasonStart, seasonEnd);
  calendar.speedMs = g.calendar.speedMs;

  // --- 8) DFB-Pokal der neuen Saison (Feld bleibt 32: volle Ligavereine + Amateure) ---
  const allAm = Object.keys(g.clubs).filter((id) => id.startsWith('am'));
  const blClubIds = playerClubList.map((c) => c.id);
  const amateurIds = allAm.slice(0, Math.max(0, 32 - blClubIds.length));
  const cup = createCup(
    blClubIds, amateurIds, leagueDateSet(fixtures),
    hashSeed(g.managedClubId + ':' + nextStartYear), calendar.seasonStartDate, g.managedClubId,
  );
  addCupCalendarEvents(calendar, cup);
  g.cup = cup;
  g.calendar = calendar;
  g.season = newSeason;

  // --- 7c) Kommerz-Vertraege (Trikot/Banden) fortschreiben ---------------------
  // Restlaufzeiten verringern, abgelaufene Vertraege entfernen, je Saison neue
  // Angebote erzeugen. KI-Vereine verlaengern automatisch mit dem besten Angebot,
  // damit ihre Bilanz stimmt; der Manager erhaelt Angebote zum Unterschreiben.
  for (const club of Object.values(g.clubs)) {
    if (!club.commerce) club.commerce = migrateCommerce(club, club.id === g.managedClubId);
    const com = club.commerce;
    const seed = `${club.id}:${newSeason}`;
    if (com.shirtSponsor) {
      com.shirtSponsor.yearsLeft -= 1;
      if (com.shirtSponsor.yearsLeft <= 0) com.shirtSponsor = undefined;
    }
    if (com.banden) {
      com.banden.yearsLeft -= 1;
      if (com.banden.yearsLeft <= 0) com.banden = undefined;
    }
    const shirtOffers = generateShirtOffers(club, `shirt-${seed}`);
    const bandenOffers = generateBandenOffers(club, `banden-${seed}`);
    if (club.id === g.managedClubId) {
      // Angebote nur speichern, wenn (noch) kein laufender Vertrag besteht.
      com.shirtOffers = shirtOffers;
      com.bandenOffers = bandenOffers;
    } else {
      if (!com.shirtSponsor) {
        const s = bestOffer(shirtOffers);
        if (s) com.shirtSponsor = offerToContract(s);
      }
      if (!com.banden) {
        const b = bestOffer(bandenOffers);
        if (b) com.banden = offerToContract(b);
      }
    }
  }

  // --- 8a) Europapokale der neuen Saison (drei Wettbewerbe, EC/CWC/UEFA) ---
  const euroClubs = g.euroClubs ?? allEuroClubs();
  g.euroClubs = euroClubs;
  g.euroCups = buildEuroCupsForSeason(
    euroQuals, euroClubs, leagueDateSet(fixtures), cupDateSet(cup),
    g.managedClubId + ':' + nextStartYear, calendar.seasonStartDate, g.managedClubId, calendar,
  );
  for (const comp of ['ec', 'cwc', 'uefa'] as EuroCompId[]) {
    const ec = g.euroCups[comp];
    if (!ec) continue;
    const dmsg = euroDrawMessage(comp, ec, g.clubs, euroClubs, g.managedClubId, 0, calendar.currentDate);
    if (dmsg) pushMessage(g.messages, dmsg);
  }

  // --- 8b) Ligareform: Meilenstein-Nachricht + Reform als angewandt vormerken ---
  // Wurde diese Saison eine Struktur-Reform ausgeführt, meldet die Fußball-Chronik
  // den Umbau. Die Reform wird gespeichert, damit sie beim erneuten Laden eines
  // Spielstands nicht ein zweites Mal migriert (Doppel-Migration verhindert).
  if (res.reform) {
    const rf = res.reform;
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'milestone', from: 'Fußball-Chronik',
      subject: `🏗️ ${seasonStartYear(newSeason)}: ${rf.title}`,
      shortText: `Ligareform ${rf.effectiveSeason}: ${rf.title}.`,
      bodyText: `${rf.title}  (Ligareform ${rf.effectiveSeason})\n\n${rf.description}\n\n`
        + `Qualifikation & Zuordnung: ${rf.qualificationRule}\n\n`
        + `Details zum Reformsystem findest du im Bereich „Wiki“ (Ligastruktur & Auf-/Abstieg).`,
    }));
    if (!g.appliedReforms.includes(rf.reformId)) g.appliedReforms.push(rf.reformId);
  }

  // Meilensteine dieser Saison auslösen (z. B. 1995/96 → 3-Punkte-Regel).
  fireTimelineForSeason(g, newSeason, calendar.currentDate);

  // --- 9) Nachrichten: Auf-/Abstieg des eigenen Vereins + Ligaüberblick ---
  const newPlayerTier = membership[playerDivId].meta.tier;
  const playerDivName = membership[playerDivId].meta.name;
  if (newPlayerTier < oldPlayerTier) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
      subject: `Aufstieg! Willkommen in der ${playerDivName}`,
      shortText: 'Der Verein ist aufgestiegen – ein historischer Erfolg!',
      bodyText: `Herzlichen Glückwunsch! ${g.clubs[g.managedClubId].name} hat den Aufstieg geschafft und `
        + `spielt in der Saison ${newSeason} in der ${playerDivName}. `
        + `Der Vorstand ist stolz auf die Mannschaft und das Trainerteam.`,
    }));
  } else if (newPlayerTier > oldPlayerTier) {
    pushMessage(g.messages, makeMessage({
      date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
      subject: `Abstieg in die ${playerDivName}`,
      shortText: 'Der Verein ist abgestiegen – jetzt gilt der direkte Wiederaufstieg.',
      bodyText: `Die Saison endete mit dem Abstieg. ${g.clubs[g.managedClubId].name} tritt ${newSeason} in der `
        + `${playerDivName} an. Der Vorstand erwartet den `
        + `sofortigen Wiederaufstieg – Kader und Etat werden angepasst.`,
    }));
  }
  const ruleText = res.reform
    ? `Aufstiegsregel: ${res.reform.qualificationRule}`
    : `Aufstiegsregel: Die Staffelmeister der unteren Ebene steigen auf, die Schlechtesten der oberen `
      + `Ebene ab; alle Staffelgrößen bleiben konstant.`;
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'media', from: 'Sportredaktion',
    subject: `Auf- und Abstieg ${oldSeason} → ${newSeason}`,
    shortText: 'Aufsteiger in die 1. Liga und Absteiger stehen fest.',
    bodyText: `Aufsteiger in die 1. Liga: ${promoted.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n`
      + `Absteiger aus der 1. Liga: ${relegated.map((id) => clubDisplayName(g, id)).join(', ') || '—'}.\n\n`
      + `${ruleText}`,
  }));

  pushMessage(g.messages, cupDrawMessage(cup, g.clubs, g.managedClubId, calendar.currentDate));
  pushMessage(g.messages, makeMessage({
    date: calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
    subject: `Die neue Saison ${newSeason} beginnt`,
    shortText: `Spielplan und DFB-Pokal für ${newSeason} stehen fest.`,
    bodyText: `Willkommen zur Saison ${newSeason}! Der Spielplan der Liga und die 1. Runde des `
      + `DFB-Pokals wurden ausgelost. Die Vorbereitung läuft – nutze die Transferphase und das Training.`,
  }));
}

/** Erzeugt eine Spielbericht-Nachricht für das Spiel des Nutzers. */
function emitMatchMessage(game: Game, m: Match): void {
  if (!m.result) return;
  const h = game.clubs[m.homeClubId]; const a = game.clubs[m.awayClubId];
  const myHome = m.homeClubId === game.managedClubId;
  const myGoals = myHome ? m.result.homeGoals : m.result.awayGoals;
  const oppGoals = myHome ? m.result.awayGoals : m.result.homeGoals;
  const outcome = myGoals > oppGoals ? 'Sieg' : myGoals < oppGoals ? 'Niederlage' : 'Unentschieden';
  const opp = myHome ? a : h;
  pushMessage(game.messages, makeMessage({
    date: m.date, category: 'match', from: 'Spielbericht',
    subject: `${m.matchday}. Spieltag: ${h.shortName} ${m.result.homeGoals}:${m.result.awayGoals} ${a.shortName}`,
    shortText: `${outcome} ${myGoals}:${oppGoals} gegen ${opp.shortName}.`,
    bodyText: `Am ${m.matchday}. Spieltag ${myHome ? 'empfing' : 'gastierte'} ${myHome ? h.name + ' ' + a.name : h.name + ' gegen ' + a.name}.\n\nEndstand: ${h.name} ${m.result.homeGoals}:${m.result.awayGoals} ${a.name} — ein ${outcome} aus deiner Sicht.\n\nBallbesitz: ${m.result.homePossession}% : ${100 - m.result.homePossession}%\nSchüsse: ${m.result.homeShots} : ${m.result.awayShots}\nZuschauer: ${m.result.attendance.toLocaleString('de-DE')}\n\nDen ausführlichen Spielbericht öffnest du über den Spielplan.`,
    relatedId: m.id,
  }));
}

// =============================================================================
// DASHBOARD
// =============================================================================
// Kleiner Donut-Ring (Ø Stärke / Ø Alter / Teamchemie) im Mockup-Stil.
// ring=false zeigt nur die blanke Zahl (in der Akzentfarbe) ohne Kringel.
function Donut({ value, frac, color, label, ring = true }: { value: string; frac: number; color: string; label: string; ring?: boolean }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.max(0, Math.min(1, frac)));
  return (
    <div className="ckd-donut">
      {ring ? (
        <div className="ckd-donut-ring">
          <svg viewBox="0 0 60 60" className="ckd-donut-svg">
            <circle className="ckd-donut-bg" cx="30" cy="30" r={r} />
            <circle
              className="ckd-donut-fg"
              cx="30" cy="30" r={r}
              style={{ stroke: color, strokeDasharray: circ, strokeDashoffset: off }}
            />
          </svg>
          <span className="ckd-donut-val">{value}</span>
        </div>
      ) : (
        <div className="ckd-donut-plain"><span className="ckd-donut-num" style={{ color }}>{value}</span></div>
      )}
      <span className="ckd-donut-lbl">{label}</span>
    </div>
  );
}

function Dashboard({ g, onGoto, onWatch, onOpenEditor }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
  onOpenEditor: () => void;
}) {
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const myClub = g.clubs[g.managedClubId];
  const myRow = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const rows = g.table.rows;
  // Tabellen-Ausschnitt fuer das Dashboard-Panel: max. 10 Zeilen, eigenes Team
  // immer sichtbar. Echte Ligaplaetze bleiben erhalten (nur slicen, nicht neu sortieren).
  const tableRows = (() => {
    const total = rows.length;
    if (total <= 10) return rows;
    const p = rows.findIndex((r) => r.clubId === g.managedClubId); // 0-basiert
    if (p < 0) return rows.slice(0, 10);
    const pos = p + 1; // 1-basierter Platz
    let start: number, end: number;
    if (pos <= 7) { start = 0; end = 9; }
    else if (pos >= total - 2) { start = total - 10; end = total - 1; }
    else { start = p - 6; end = p + 3; }
    return rows.slice(start, end + 1);
  })();
  const leagueName = divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group);
  const nextLeague = g.fixtures.find((m) => m.status === 'scheduled' && m.involvesPlayerClub);
  const nextTie = g.cup ? nextPlayerTie(g.cup, g.managedClubId) : null;
  // Chronologisch nächstes Spiel: Liga oder Pokal – das frühere Datum gewinnt.
  const nextIsCup = !!nextTie && (!nextLeague || nextTie.date < nextLeague.date);
  const nextMatch = nextIsCup ? nextTie : nextLeague;
  // Wettbewerb (rechts oben) + Detailzeile darunter: Liga → "XX. Spieltag", Pokal → Runde.
  const nextCompName = nextIsCup ? 'DFB-Pokal' : leagueName;
  const nextCompDetail = nextIsCup
    ? (nextTie ? (ROUND_NAMES[nextTie.round] ?? 'Pokal') : 'Pokal')
    : (nextLeague ? `${nextLeague.matchday}. Spieltag` : '');
  const squad = myClub.playerIds.map((id) => g.players[id]).filter(Boolean);
  const monthly = computeMonthly(myClub, g.players, g.table);
  const monIncome = monthly.sponsorship + monthly.advertising + monthly.membership + monthly.cateringLease + monthly.placementBonus;
  const monExpense = monthly.wages + monthly.staffWages + monthly.stadiumMaintenance + monthly.facilities + monthly.otherFixed;
  const bal = myClub.finances.balance;
  const finStatus = bal >= Math.max(1, myClub.finances.transferBudget) ? 'Solide' : bal > 0 ? 'Stabil' : 'Angespannt';
  const bc = myClub.boardConfidence;
  const boardLabel = bc >= 66 ? 'Zufrieden' : bc >= 40 ? 'Neutral' : 'Unzufrieden';
  const boardCls = bc >= 66 ? 'cvb-good' : bc >= 40 ? 'cvb-mid' : 'cvb-bad';
  const repGold = Math.max(0, Math.min(5, Math.round(myClub.reputation / 20)));
  const homeClub = nextMatch ? g.clubs[nextMatch.homeClubId] : null;
  const awayClub = nextMatch ? g.clubs[nextMatch.awayClubId] : null;
  // Gegenüberstellung für "Nächstes Spiel": echte Werte beider Vereine.
  const clubCompareStat = (club: typeof myClub | null) => {
    if (!club) return null;
    const ps = (club.playerIds ?? []).map((id) => g.players[id]).filter(Boolean);
    const ovr = ps.length ? Math.round(ps.reduce((s, p) => s + p.overall, 0) / ps.length) : 0;
    const row = g.table.rows.find((r) => r.clubId === club.id) ?? null;
    return {
      ovr,
      pos: row?.position ?? null,
      form: row?.form ?? [],
      gf: row?.goalsFor ?? 0,
      ga: row?.goalsAgainst ?? 0,
      gd: row?.goalDifference ?? 0,
    };
  };
  const homeStat = clubCompareStat(homeClub);
  const awayStat = clubCompareStat(awayClub);
  const news = (g.messages ?? []).slice(0, 6);
  const totalPlayers = squad.length;
  const avgAge = totalPlayers ? squad.reduce((s, p) => s + p.age, 0) / totalPlayers : 0;
  const avgOvr = totalPlayers ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / totalPlayers) : 0;
  const posCount = { GK: 0, DEF: 0, MID: 0, ATT: 0 } as Record<'GK' | 'DEF' | 'MID' | 'ATT', number>;
  squad.forEach((p) => { const grp = POSITION_GROUPS[p.naturalPosition]; if (grp) posCount[grp]++; });
  const jerseyPattern: JerseyPattern = (myClub.colors.secondary && myClub.colors.secondary.toLowerCase() !== myClub.colors.primary.toLowerCase()) ? 'stripes' : 'solid';
  void jerseyPattern;
  // Heim-/Auswärtstrikot (spielweiter Override zuerst: Bild oder Design, sonst
  // aus Vereinsfarben abgeleitet).
  const homeKit = getClubKitDisplay(myClub, 'home');
  const awayKit = getClubKitDisplay(myClub, 'away');
  // Teamchemie DETERMINISTISCH aus echten Spielerdaten (Moral + Form) – kein Zufall.
  const MORALE_CHEM: Record<string, number> = { very_low: 20, low: 40, okay: 55, good: 75, excellent: 92 };
  const teamChemie = totalPlayers
    ? Math.round(squad.reduce((s, p) => s + 0.7 * (MORALE_CHEM[p.morale] ?? 55) + 0.3 * Math.max(0, Math.min(100, p.form ?? 60)), 0) / totalPlayers)
    : 0;
  // Positionszaehler im Mockup-Stil (TW/ABW/MF/ST) mit je eigener Akzentfarbe.
  const posMeta: { key: 'GK' | 'DEF' | 'MID' | 'ATT'; label: string; color: string }[] = [
    { key: 'GK', label: 'TW', color: '#00d9ff' },
    { key: 'DEF', label: 'ABW', color: '#3ddc84' },
    { key: 'MID', label: 'MF', color: '#4aa8ff' },
    { key: 'ATT', label: 'ST', color: '#9b7cff' },
  ];

  const colorFarben = [myClub.colors.primary, myClub.colors.secondary].filter((c, i, a) => c && a.indexOf(c) === i);
  // Vereinsgelaende-Box: Stufen der ersten (bis zu 6) freigeschalteten Gebaeude.
  const curYear = yearOf(g.calendar.currentDate);
  const FAC_SHORT: Record<string, string> = {
    stadium: 'Stadion', trainingCenter: 'Training', youthAcademy: 'Jugend',
    medical: 'Medizin', merchandising: 'Fanshop', rehaCenter: 'Reha',
    nlz: 'NLZ', performanceCenter: 'Leistung', dataCenter: 'Datenanalyse',
  };
  const facRows = FACILITIES
    .filter((def) => !def.unlockYear || curYear >= def.unlockYear)
    .slice(0, 6)
    .map((def) => ({ key: def.key, name: FAC_SHORT[def.key] ?? def.name, level: (myClub.infrastructure?.[def.key] as number) ?? 0 }));
  return (
    <div className="zentrale-wrap">
      <div className="dashx">

        {/* ZEILE 1, SPALTE 1 — VEREINSÜBERBLICK */}
        <div className="card dashx-verein clickable" onClick={() => onGoto('cat-verein')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashVerein" size={20} /></span>
            <span className="dxh-title">Vereinsüberblick</span>
            <button
              className="cvb2-edit"
              title="Editor"
              onClick={(e) => { e.stopPropagation(); onOpenEditor(); }}
            >
              Bearbeiten
            </button>
          </div>
          <div className="cvb2-head">
            <div className="cvb2-crest"><ClubCrest club={myClub} size={148} /></div>
            <div className="cvb2-headfields">
              <div className="cvb2-name">{myClub.name}</div>
              <div className="cvb2-row"><span className="cvb2-k">Gegründet</span><span className="cvb2-v">{myClub.founded}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Stadion</span><span className="cvb2-v">{myClub.stadium.name}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Kapazität</span><span className="cvb2-v">{myClub.stadium.capacity.toLocaleString('de-DE')}</span></div>
              <div className="cvb2-row"><span className="cvb2-k">Liga</span><span className="cvb2-v">{leagueName}</span></div>
            </div>
          </div>
          <div className="cvb2-sep" />
          <div className="cvb2-cols">
          <div className="cvb2-list">
            <div className="cvb2-lrow"><span className="cvb2-lk">Ziele</span><span className="cvb2-lv">{myClub.boardExpectation}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Stadt</span><span className="cvb2-lv">{myClub.city}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Ruf National</span><span className="cvb2-lv cvb-stars">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < repGold ? 'on' : ''}>★</span>)}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Finanzstatus</span><span className="cvb2-lv">{finStatus}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Vorstand</span><span className={`cvb2-lv ${boardCls}`}><i className="cvb-dot" />{boardLabel}</span></div>
            <div className="cvb2-lrow"><span className="cvb2-lk">Vereinsfarben</span><span className="cvb2-lv cvb2-colors">{colorFarben.map((c, i) => <i key={i} className="cvb2-swatch" style={{ background: c }} />)}</span></div>
          </div>
          <div className="cvb2-facs">
            {facRows.map((f) => (
              <div key={f.key} className="cvb2-frow">
                <span className="cvb2-fname">{f.name}</span>
                <span className="cvb2-fpips">
                  {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                    <i key={i} className={`cvb2-fpip ${i < f.level ? 'on' : ''}`} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* ZEILE 1, SPALTE 2 — TABELLE */}
        <div className="card dashx-tabelle clickable" onClick={() => onGoto('table')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashTabelle" size={20} /></span>
            <span className="dxh-title">Tabelle</span>
            <span className="dxh-right">{leagueName}</span>
          </div>
          <table className="dxt">
            <thead>
              <tr><th>#</th><th className="dxt-club">Verein</th><th>Pl</th><th>V</th><th>U</th><th>N</th><th>TD</th><th>Pkt</th></tr>
            </thead>
            <tbody>
              {tableRows.map((r) => {
                const c = g.clubs[r.clubId];
                const me = r.clubId === g.managedClubId;
                return (
                  <tr
                    key={r.clubId}
                    className={`dxt-row ${zoneClass(r.position, rows.length)} ${me ? 'me' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setClubModalId(r.clubId); }}
                    title="Vereinsprofil öffnen"
                  >
                    <td className="dxt-pos">{r.position}</td>
                    <td className="dxt-club">
                      {c && <ClubCrest club={c} size={18} />}
                      <span className="dxt-club-name">{c?.name ?? r.clubId}</span>
                    </td>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{(r.goalDifference > 0 ? '+' : '') + r.goalDifference}</td>
                    <td className="dxt-pkt">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ZEILE 1, SPALTE 3 — NÄCHSTES SPIEL */}
        <div className="card dashx-naechstes clickable" onClick={() => onGoto('fixtures')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashBall" size={20} /></span>
            <span className="dxh-title">Nächstes Spiel</span>
            <span className="dxh-right dxh-right-stack">
              <span className="dxh-comp">{nextCompName}</span>
              {nextMatch && nextCompDetail && <span className="dxh-round">{nextCompDetail}</span>}
            </span>
          </div>
          {nextMatch && homeClub && awayClub ? (
            <>
              <div className="cns-photo">
                <div className="cns-photo-crests">
                  <div className="cns-vs-side">
                    <ClubCrest club={homeClub} size={96} />
                    <span className="cns-nm">{homeClub.name}</span>
                  </div>
                  <span className="cns-vs">VS</span>
                  <div className="cns-vs-side">
                    <ClubCrest club={awayClub} size={96} />
                    <span className="cns-nm">{awayClub.name}</span>
                  </div>
                </div>
              </div>
              {homeStat && awayStat && (
                <div className="cns-cmp">
                  <div className="cns-cmp-row">
                    <span className={`cns-cmp-v${homeStat.ovr > awayStat.ovr ? ' better' : ''}`}>{homeStat.ovr}</span>
                    <span className="cns-cmp-l">Ø Stärke</span>
                    <span className={`cns-cmp-v${awayStat.ovr > homeStat.ovr ? ' better' : ''}`}>{awayStat.ovr}</span>
                  </div>
                  <div className="cns-cmp-row">
                    <span className={`cns-cmp-v${homeStat.pos != null && awayStat.pos != null && homeStat.pos < awayStat.pos ? ' better' : ''}`}>{homeStat.pos != null ? homeStat.pos + '.' : '–'}</span>
                    <span className="cns-cmp-l">Tabelle</span>
                    <span className={`cns-cmp-v${homeStat.pos != null && awayStat.pos != null && awayStat.pos < homeStat.pos ? ' better' : ''}`}>{awayStat.pos != null ? awayStat.pos + '.' : '–'}</span>
                  </div>
                  <div className="cns-cmp-row">
                    <span className="cns-form">
                      {homeStat.form.length ? homeStat.form.slice(-5).map((f, i) => <span key={i} className={`cns-fp cns-fp-${f}`}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>) : <span className="cns-cmp-v" style={{ color: 'var(--text-3)' }}>–</span>}
                    </span>
                    <span className="cns-cmp-l">Form</span>
                    <span className="cns-form">
                      {awayStat.form.length ? awayStat.form.slice(-5).map((f, i) => <span key={i} className={`cns-fp cns-fp-${f}`}>{f === 'W' ? 'S' : f === 'D' ? 'U' : 'N'}</span>) : <span className="cns-cmp-v" style={{ color: 'var(--text-3)' }}>–</span>}
                    </span>
                  </div>
                </div>
              )}
              <div className="cns-dsep" aria-hidden="true"><span /><span /></div>
              <div className="cns-meta">
                <div className="cns-meta-row"><span className="cns-meta-ico"><Icon name="kalender" size={22} /></span><span>{fmtDateFull(nextMatch.date)}, 15:30 Uhr</span></div>
                <div className="cns-meta-row"><span className="cns-meta-ico"><Icon name="stadium" size={22} /></span><span>{homeClub.stadium.name}, {homeClub.city}</span></div>
              </div>
            </>
          ) : (
            <div className="dim" style={{ padding: '24px 0', textAlign: 'center' }}>Kein weiteres Spiel angesetzt.</div>
          )}
        </div>

        {/* ZEILE 2, SPALTE 1 — FINANZEN */}
        <div className="card dashx-finanzen clickable" onClick={() => onGoto('finances')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashFinanzen" size={20} /></span>
            <span className="dxh-title">Finanzen</span>
          </div>
          <div className="dxf-top">
            <div className="dxf-balance">
              <span className="dxf-balance-lbl">Aktueller Kontostand</span>
              <span className={`dxf-balance-val ${bal < 0 ? 'neg' : ''}`}>{fmtDMfull(bal)}</span>
            </div>
            <div className="dxf-stats">
              <div className="dxf-stat">
                <span className="dxf-lbl">Einnahmen (Monat)</span>
                <span className="dxf-val green">{fmtDMfull(monIncome)}</span>
              </div>
              <div className="dxf-stat">
                <span className="dxf-lbl">Ausgaben (Monat)</span>
                <span className="dxf-val red">{fmtDMfull(monExpense)}</span>
              </div>
              <div className="dxf-stat">
                <span className="dxf-lbl">Saldo</span>
                <span className={`dxf-val ${monIncome - monExpense >= 0 ? 'green' : 'red'}`}>{(monIncome - monExpense >= 0 ? '+' : '') + fmtDMfull(monIncome - monExpense)}</span>
              </div>
            </div>
          </div>
          <div className="dxf-chart">
            <BalanceChart points={myClub.finances.balanceHistory ?? []} current={bal} currentDate={g.calendar.currentDate} />
          </div>
        </div>

        {/* ZEILE 2, SPALTE 2 — KADER */}
        <div className="card dashx-kader clickable" onClick={() => onGoto('squad')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashKader" size={20} /></span>
            <span className="dxh-title">Kader</span>
            <span className="dxh-right">{totalPlayers} Spieler</span>
          </div>
          <div className="ckd3">
            {/* Spalte 1 — Heimtrikot */}
            <div className="ckd3-col">
              <div className="ckd3-jwrap"><JerseySVG image={homeKit.image} primary={homeKit.primary} secondary={homeKit.secondary} pattern={homeKit.pattern} size={220} /></div>
              <span className="ckd3-cap">Heim</span>
            </div>
            {/* Spalte 2 — Auswärtstrikot */}
            <div className="ckd3-col">
              <div className="ckd3-jwrap"><JerseySVG image={awayKit.image} primary={awayKit.primary} secondary={awayKit.secondary} pattern={awayKit.pattern} size={220} /></div>
              <span className="ckd3-cap">Auswärts</span>
            </div>
            {/* Spalte 3 — Kaderinfos */}
            <div className="ckd3-col ckd3-info">
              <div className="ckd3-pos">
                {posMeta.map((pm) => (
                  <div key={pm.key} className="ckd3-pos-row">
                    <span className="ckd3-pos-bar" style={{ background: pm.color }} />
                    <span className="ckd3-pos-lbl">{pm.label}</span>
                    <span className="ckd3-pos-num">{posCount[pm.key]}</span>
                  </div>
                ))}
              </div>
              <div className="ckd3-donuts">
                <Donut value={String(avgOvr)} frac={avgOvr / 100} color="#00d9ff" label="Ø Stärke" ring={false} />
                <Donut value={String(Math.round(avgAge))} frac={avgAge / 40} color="#4aa8ff" label="Ø Alter" ring={false} />
                <Donut value={String(teamChemie)} frac={teamChemie / 100} color="#3ddc84" label="Teamchemie" />
              </div>
            </div>
          </div>
        </div>

        {/* ZEILE 2, SPALTE 3 — NACHRICHTEN */}
        <div className="card dashx-termine clickable" onClick={() => onGoto('news')}>
          <div className="dxh">
            <span className="dxh-ico"><Icon name="dashNews" size={20} /></span>
            <span className="dxh-title">Nachrichten</span>
          </div>
          <div className="cnw">
            {news.length === 0 && <div className="dim" style={{ padding: '18px 0', textAlign: 'center' }}>Keine Nachrichten.</div>}
            {news.map((m) => {
              const sd = fmtDateShort(m.date);
              return (
                <div key={m.id} className={`cnw-row${m.read ? '' : ' is-unread'}`}>
                  <span className="cnw-ico"><Icon name={MSG_CAT_ICON[m.category] ?? 'news'} size={22} /></span>
                  <span className="cnw-body">
                    <span className="cnw-subj">{m.subject}</span>
                    <span className="cnw-text">{m.shortText}</span>
                  </span>
                  <span className="cnw-date">{sd.dmy}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}

function zoneClass(pos: number, rowCount: number): string {
  if (pos <= 1) return 'zone-cl';
  if (pos <= 4) return 'zone-eu';
  if (pos >= rowCount - 2) return 'zone-rel';
  return '';
}

function NextMatchCard({ g, m }: { g: Game; m: Match }) {
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  const isHome = m.homeClubId === g.managedClubId;
  const opp = isHome ? a : h;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <ClubCrest club={opp} size={44} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{opp.name}</div>
          <div className="mini">
            <span className={`pill ${isHome ? 'home' : 'away'}`}>{isHome ? 'HEIM' : 'AUSWÄRTS'}</span>
            <span className="dim" style={{ marginLeft: 8 }}>{m.matchday}. Spieltag</span>
          </div>
        </div>
      </div>
      <div className="dim mini mt12"><Icon name="schedule" /> {CalendarEngine.formatDate(m.date)}</div>
    </div>
  );
}

function MatchLine({ g, m, onWatch }: { g: Game; m: Match; onWatch?: (id: string) => void }) {
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  return (
    <div className="row" onClick={(e) => { e.stopPropagation(); if (onWatch && m.status === 'finished') onWatch(m.id); }}
      style={{ cursor: onWatch && m.status === 'finished' ? 'pointer' : 'default', padding: '4px 0' }}>
      <span className="dim mini" style={{ minWidth: 40 }}>{m.matchday}. ST</span>
      <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{h.shortName}</span>
      <b style={{ minWidth: 54, textAlign: 'center', color: 'var(--accent)' }}>
        {m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : 'vs'}
      </b>
      <span style={{ flex: 1, fontWeight: 600 }}>{a.shortName}</span>
    </div>
  );
}

// =============================================================================
// KATEGORIE-DASHBOARDS & NEUE EINZELSEITEN
// =============================================================================
// Kompakte Übersichtsseiten je Hauptkategorie (Reihe-1-Klick) sowie neue,
// eigenständige bzw. rudimentäre Seiten. Alle Texte deutsch, Set-C-Icons.
const TAC_STYLE_DE: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Ausgewogen', attacking: 'Offensiv', counter: 'Konter',
};

// --- SPIELTAG ---------------------------------------------------------------
function SpieltagDashboard({ g, onGoto, onWatch }: {
  g: Game; onGoto: (s: Screen) => void; onWatch: (id: string) => void;
}) {
  const myClub = g.clubs[g.managedClubId];
  const t = myClub.tactics;
  const nextMatch = g.fixtures.find((m) => m.status === 'scheduled' && m.involvesPlayerClub);
  const lastPlayed = [...g.fixtures].reverse().find((m) => m.status === 'finished' && m.involvesPlayerClub);
  const xiCount = t.startingXI.filter(Boolean).length;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('lineup')}>
          <div className="card-title"><span className="ico"><Icon name="lineup" /></span> Aufstellung</div>
          <div className="row mt8"><span className="dim">Formation</span><b className="accent-text">{t.formation}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Startelf</span><b className={xiCount === 11 ? 'green' : 'red'}>{xiCount}/11</b></div>
          <div className="dim2 mini mt8">Startelf & Bank bearbeiten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('tactics')}>
          <div className="card-title"><span className="ico"><Icon name="tactics" /></span> Taktik</div>
          <div className="row mt8"><span className="dim">Ausrichtung</span><b className="accent-text">{TAC_STYLE_DE[t.style] ?? t.style}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Tempo</span><b>{t.tempo}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Pressing</span><b>{t.pressing}</b></div>
          <div className="dim2 mini mt8">Ausrichtung & Verhalten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fixtures')}>
          <div className="card-title"><span className="ico"><Icon name="schedule" /></span> Nächstes Spiel</div>
          {nextMatch ? <NextMatchCard g={g} m={nextMatch} /> : <div className="dim">Kein weiteres Spiel.</div>}
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fixtures')}>
          <div className="card-title"><span className="ico">✓</span> Letztes Ergebnis</div>
          {lastPlayed ? <MatchLine g={g} m={lastPlayed} onWatch={onWatch} /> : <div className="dim">Noch kein Spiel absolviert.</div>}
          <div className="dim2 mini mt12">Gesamten Spielplan öffnen →</div>
        </div>
    </div>
  );
}

// --- KADER ------------------------------------------------------------------
function KaderDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const squad = myClub.playerIds.map((id) => g.players[id]);
  const avg = squad.length ? Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length) : 0;
  const top5 = [...squad].sort((a, b) => b.overall - a.overall).slice(0, 5);
  const talents = [...squad].filter((p) => p.age <= 21).sort((a, b) => b.potentialStars - a.potentialStars).slice(0, 4);
  const injured = squad.filter((p) => p.availability === 'injured');
  const suspended = squad.filter((p) => p.suspensionMatches > 0);
  const youthCount = myClub.youthPlayerIds.length;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('squad')}>
          <div className="card-title"><span className="ico"><Icon name="squad" /></span> Übersicht</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{squad.length}</div><div className="dim mini">Spieler</div></div>
            <div><div className="big-num accent-text" style={{ fontSize: 28 }}>{avg}</div><div className="dim mini">Ø Stärke</div></div>
          </div>
          <div className="mt12">
            {top5.map((p) => (
              <div key={p.id} className="row" style={{ padding: '3px 0' }}>
                <span className="pos-badge">{p.naturalPosition}</span>
                <span style={{ flex: 1, marginLeft: 8 }}>{p.lastName}</span>
                <b className="accent-text">{p.overall}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('vertraege')}>
          <div className="card-title"><span className="ico"><Icon name="contracts" /></span> Verträge</div>
          <div className="dim mini mt8">Laufzeiten & Gehälter des A-Kaders verwalten.</div>
          <div className="row mt12"><span className="dim">Kaderspieler</span><b>{squad.length}</b></div>
          <div className="dim2 mini mt8">Zur Vertragsübersicht →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('training')}>
          <div className="card-title"><span className="ico"><Icon name="training" /></span> Training</div>
          <div className="dim mini mt8">Talente (≤ 21 Jahre):</div>
          {talents.length ? talents.map((p) => (
            <div key={p.id} className="row" style={{ padding: '3px 0' }}>
              <span style={{ flex: 1 }}>{p.lastName} <span className="dim2 mini">({p.age})</span></span>
              <b className="accent-text">{renderStars(p.potentialStars)}</b>
            </div>
          )) : <div className="dim mini">Keine jungen Spieler im Kader.</div>}
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('youth')}>
          <div className="card-title"><span className="ico"><Icon name="youth" /></span> Jugend</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{youthCount}</div><div className="dim mini">im NLZ</div></div>
            <div><div className="big-num red" style={{ fontSize: 28 }}>{injured.length}</div><div className="dim mini">Verletzt</div></div>
            <div><div className="big-num red" style={{ fontSize: 28 }}>{suspended.length}</div><div className="dim mini">Gesperrt</div></div>
          </div>
          <div className="dim2 mini mt12">Jugendakademie öffnen →</div>
        </div>
    </div>
  );
}

// --- TRANSFERS --------------------------------------------------------------
function TransfersDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('transfers')}>
          <div className="card-title"><span className="ico"><Icon name="transfers" /></span> Transfermarkt</div>
          <div className="row mt8"><span className="dim">Transferbudget</span><b className="green">{fmtDM(fin.transferBudget)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kontostand</span><b className={fin.balance >= 0 ? 'green' : 'red'}>{fmtDM(fin.balance)}</b></div>
          <div className="dim2 mini mt8">Spieler suchen & Angebote abgeben →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('beobachtung')}>
          <div className="card-title"><span className="ico"><Icon name="watchlist" /></span> Beobachtungsliste</div>
          <div className="dim mini mt8">Merke dir interessante Spieler und behalte ihre Entwicklung im Blick.</div>
          <div className="dim2 mini mt12">Beobachtungsliste öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('verhandlungen')}>
          <div className="card-title"><span className="ico"><Icon name="negotiations" /></span> Aktive Verhandlungen</div>
          <div className="dim mini mt8">Laufende Vertrags- und Transfergespräche im Überblick.</div>
          <div className="dim2 mini mt12">Verhandlungen öffnen →</div>
        </div>
    </div>
  );
}

// --- FINANZEN ---------------------------------------------------------------
function FinanzenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const fin = myClub.finances;
  const m = computeMonthly(myClub, g.players, g.table);
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('finances')}>
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Bilanz</div>
          <div className="row mt8"><span className="dim">Kontostand</span><b className={fin.balance >= 0 ? 'green' : 'red'}>{fmtDM(fin.balance)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Monatssaldo</span><b className={m.net >= 0 ? 'green' : 'red'}>{fmtDM(m.net)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Gehälter/Monat</span><b className="red">{fmtDM(m.wages + m.staffWages)}</b></div>
          <div className="dim2 mini mt8">Detaillierte Bilanz öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('sponsoring')}>
          <div className="card-title"><span className="ico"><Icon name="sponsoring" /></span> Sponsoring</div>
          <div className="row mt8"><span className="dim">Einnahmen/Monat</span><b className="green">{fmtDM(m.sponsorship)}</b></div>
          <div className="dim2 mini mt12">Sponsoren-Übersicht öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('marketing')}>
          <div className="card-title"><span className="ico"><Icon name="marketing" /></span> Marketing</div>
          <div className="dim mini mt8">Werbeflächen, Merchandising und Kampagnen steuern.</div>
          <div className="dim2 mini mt12">Marketing öffnen →</div>
        </div>
    </div>
  );
}

// --- VEREIN -----------------------------------------------------------------
function VereinDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const infra = myClub.infrastructure;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('staff')}>
          <div className="card-title"><span className="ico"><Icon name="staff" /></span> Mitarbeiter</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
            <div><div className="big-num" style={{ fontSize: 28 }}>{g.hiredStaff.length}</div><div className="dim mini">angestellt</div></div>
          </div>
          <div className="dim2 mini mt12">Trainer- & Funktionsteam →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('facilities')}>
          <div className="card-title"><span className="ico"><Icon name="facilities" /></span> Vereinsgelände</div>
          <div className="row mt8"><span className="dim">Trainingszentrum</span><b>Stufe {infra.trainingCenter}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Jugendakademie</span><b>Stufe {infra.youthAcademy}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Medizin</span><b>Stufe {infra.medical}</b></div>
          <div className="dim2 mini mt8">Ausbaustufen verwalten →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('stadium')}>
          <div className="card-title"><span className="ico"><Icon name="stadium" /></span> Stadion</div>
          <div className="row mt8"><span className="dim">{myClub.stadium.name}</span></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b className="accent-text">{myClub.stadium.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {infra.stadium}</b></div>
          <div className="dim2 mini mt8">Stadion ausbauen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('fans')}>
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Fans</div>
          <div className="row mt8"><span className="dim">Ø Auslastung</span><b className="accent-text">{Math.round(myClub.stadium.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ansehen</span><b>{myClub.reputation}</b></div>
          <div className="dim2 mini mt8">Fan-Stimmung öffnen →</div>
        </div>
    </div>
  );
}

// --- STATISTIKEN ------------------------------------------------------------
function StatistikenDashboard({ g, onGoto }: { g: Game; onGoto: (s: Screen) => void }) {
  const myClub = g.clubs[g.managedClubId];
  const myRow = g.table.rows.find((r) => r.clubId === g.managedClubId);
  const cup = g.cup;
  const myTie = cup ? nextPlayerTie(cup, g.managedClubId) : null;
  return (
    <div className="dashx-cat">
        <div className="card hoverable clickable" onClick={() => onGoto('table')}>
          <div className="card-title"><span className="ico"><Icon name="stats" /></span> Liga</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span className="big-num accent-text">{myRow?.position ?? '-'}.</span>
            <span className="dim">Platz · <b style={{ color: 'var(--text)' }}>{myRow?.points ?? 0}</b> Pkt.</span>
          </div>
          <div className="row mt12"><span className="dim">Bilanz</span><b>{myRow?.won ?? 0}-{myRow?.drawn ?? 0}-{myRow?.lost ?? 0}</b></div>
          <div className="dim2 mini mt8">Ganze Tabelle öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('cup')}>
          <div className="card-title"><span className="ico"><Icon name="trophy" /></span> Pokal</div>
          {cup && myTie ? (
            <div className="dim mini mt8">Nächste Runde: <b style={{ color: 'var(--text)' }}>{ROUND_NAMES[myTie.round] ?? 'Pokal'}</b></div>
          ) : (
            <div className="dim mini mt8">Aktuell kein aktives Pokalspiel.</div>
          )}
          <div className="dim2 mini mt12">Pokalwettbewerb öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('international')}>
          <div className="card-title"><span className="ico"><Icon name="international" /></span> International</div>
          <div className="dim mini mt8">Europapokal-Ergebnisse und internationale Wettbewerbe.</div>
          <div className="dim2 mini mt12">International öffnen →</div>
        </div>
        <div className="card hoverable clickable" onClick={() => onGoto('chronicle')}>
          <div className="card-title"><span className="ico"><Icon name="chronicle" /></span> Chronik</div>
          <div className="dim mini mt8">Meilensteine, Titel und Vereinsgeschichte.</div>
          <div className="dim2 mini mt12">Chronik öffnen →</div>
        </div>
    </div>
  );
}

// --- STADION (eigenständige Seite) ------------------------------------------
function StadiumView({ g, onChange }: { g: Game; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const check = canUpgrade(myClub, 'stadium');
  const doExpand = () => {
    if (!check.ok) return;
    if (myClub.finances.balance < check.cost) { alert('Nicht genügend Guthaben für den Ausbau.'); return; }
    if (!confirm(`Stadion für ${fmtDM(check.cost)} auf Stufe ${check.nextLevel} ausbauen? (+${CAPACITY_PER_LEVEL.toLocaleString('de-DE')} Plätze)`)) return;
    const res = upgradeFacility(myClub, 'stadium', g.calendar.currentDate, true);
    if (res.ok) { myClub.finances.balance -= res.cost; onChange(); }
    else alert(res.reason ?? 'Ausbau nicht möglich.');
  };
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const setTicket = (delta: number) => {
    st.ticketPrice = Math.max(4, Math.min(60, st.ticketPrice + delta));
    onChange();
  };
  const cateringMode: CateringMode = myClub.commerce?.cateringMode ?? 'verpachtung';
  const cateringLevel = Math.max(1, Math.min(5, Math.round(myClub.infrastructure?.catering ?? 1)));
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  // Vorschau erwartete Auslastung/Erloese bei aktuellem Ticketpreis (Elastizitaet).
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticketRev = Math.round(expVisitors * st.ticketPrice * scale);
  const cateringRev = cateringMatchIncome(myClub, expVisitors, scale);
  const programmeRev = matchdayIncome(expVisitors, scale);
  return (
    <div className="page">
      <PageHead icon="stadium" title={<>Stadion — <span className="accent">{st.name}</span></>} />
      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="stadium" /></span> Kenndaten</div>
          <div className="row mt8"><span className="dim">Name</span><b>{st.name}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b className="accent-text">{st.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {myClub.infrastructure.stadium} / {MAX_LEVEL}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Zustand</span><b>{st.condition}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ø Auslastung</span><b>{Math.round(st.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ticketpreis</span><b>{fmtDM(st.ticketPrice)}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Ausbau</div>
          {check.ok ? (
            <>
              <div className="dim mini mt8">Nächste Ausbaustufe erhöht die Kapazität um <b style={{ color: 'var(--text)' }}>{CAPACITY_PER_LEVEL.toLocaleString('de-DE')}</b> Plätze.</div>
              <div className="row mt12"><span className="dim">Neue Stufe</span><b className="accent-text">Stufe {check.nextLevel}</b></div>
              <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kosten</span><b className="red">{fmtDM(check.cost)}</b></div>
              <div className="row" style={{ padding: '6px 0' }}><span className="dim">Guthaben</span><b className={myClub.finances.balance >= check.cost ? 'green' : 'red'}>{fmtDM(myClub.finances.balance)}</b></div>
              <button className="btn-sm btn-primary mt12" onClick={doExpand} disabled={myClub.finances.balance < check.cost}>Stadion ausbauen</button>
            </>
          ) : (
            <div className="dim mt8">{check.reason ?? 'Kein weiterer Ausbau möglich.'}</div>
          )}
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Ticketpreis & Auslastung</div>
          <div className="row mt8" style={{ alignItems: 'center' }}>
            <span className="dim">Ticketpreis</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn-sm btn-ghost" onClick={() => setTicket(-1)}>−1</button>
              <b className="accent-text" style={{ minWidth: 84, textAlign: 'center' }}>{fmtDM(st.ticketPrice * scale)}</b>
              <button className="btn-sm btn-ghost" onClick={() => setTicket(1)}>+1</button>
            </span>
          </div>
          <div className="dim2 mini mt8">Höherer Preis → weniger Zuschauer, niedriger Preis → mehr (Elastizität).</div>
          <div className="row mt12"><span className="dim">Erwartete Auslastung</span><b className="accent-text">{Math.round(expRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erw. Zuschauer</span><b>{expVisitors.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="dim">Eintritt / Heimspiel</span><b className="green">{fmtDM(ticketRev)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Catering / Heimspiel</span><b className="green">{fmtDM(cateringRev)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Programm / Heimspiel</span><b className="green">{fmtDM(programmeRev)}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="catering" /></span> Catering-Status</div>
          <div className="row mt8"><span className="dim">Betriebsform</span><b>{CATERING_MODE_LABEL[cateringMode]}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ausbaustufe</span><b>Stufe {cateringLevel} / {MAX_LEVEL}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Netto / Besucher</span><b>{fmtDM(Math.round(CATERING_NETPERHEAD[cateringMode][cateringLevel] * scale))}</b></div>
          <div className="dim2 mini mt12">Betriebsform &amp; Ausbau steuerst du unter „Anlagen" bzw. „Marketing".</div>
        </div>
      </div>
    </div>
  );
}

// --- Kleine Helferkomponente für rudimentäre Seiten -------------------------
// --- GEMEINSAMER SEITENKOPF -------------------------------------------------
// Einheitlicher Kopf fuer alle Content-Seiten, optisch am Dashboard (.dxh)
// orientiert. Standardformate liegen zentral in index.css (:root-Tokens +
// .page/.page-head). Entweder `icon` (IconName) ODER `left` (z.B. <ClubCrest/>)
// als linkes Symbol; `right` nimmt Meta-Infos/Buttons auf.
function PageHead({ icon, left, title, right }: { icon?: IconName; left?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      {left ? (
        <span className="page-head-ico">{left}</span>
      ) : icon ? (
        <span className="page-head-ico"><Icon name={icon} /></span>
      ) : null}
      <div className="page-head-title">{title}</div>
      {right != null ? <div className="page-head-right">{right}</div> : null}
    </div>
  );
}

function PagePlaceholder({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="page">
      <PageHead icon={icon} title={title} />
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title"><span className="ico"><Icon name={icon} /></span> {title}</div>
        <div className="dim mt8" style={{ lineHeight: 1.6 }}>{children}</div>
        <div className="pill mt16" style={{ display: 'inline-block' }}>In Arbeit</div>
      </div>
    </div>
  );
}

// --- PRESSE -----------------------------------------------------------------
function PresseView({ g }: { g: Game }) {
  const items = g.messages.slice(0, 12);
  return (
    <div className="page">
      <PageHead icon="presse" title="Presse & Medien" />
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-title"><span className="ico"><Icon name="presse" /></span> Aktuelle Schlagzeilen</div>
        <div className="ticker mt8" style={{ maxHeight: 360 }}>
          {items.length ? items.map((msg) => (
            <div key={msg.id} className="ticker-item">
              <span className="dot">{msg.read ? '▹' : '▸'}</span>
              <span style={{ fontWeight: msg.read ? 400 : 700 }}>{msg.subject}</span>
            </div>
          )) : <div className="dim">Derzeit keine Meldungen.</div>}
        </div>
        <div className="dim2 mini mt12">Pressekonferenzen und Interviews folgen in einem späteren Ausbau.</div>
      </div>
    </div>
  );
}

// --- VERTRÄGE ---------------------------------------------------------------
function VertraegeView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const squad = myClub.playerIds.map((id) => g.players[id]).sort((a, b) => b.overall - a.overall);
  return (
    <div className="page">
      <PageHead icon="contracts" title={<>Verträge — <span className="accent">{myClub.name}</span></>} />
      <div className="card">
        <div className="card-title"><span className="ico"><Icon name="contracts" /></span> Laufende Verträge</div>
        <table className="mt12" style={{ width: '100%' }}>
          <thead>
            <tr className="dim mini">
              <th style={{ textAlign: 'left' }}>Spieler</th>
              <th style={{ textAlign: 'center' }}>Pos.</th>
              <th style={{ textAlign: 'right' }}>Gehalt/Wo.</th>
              <th style={{ textAlign: 'right' }}>Laufzeit bis</th>
              <th style={{ textAlign: 'right' }}>Wert</th>
            </tr>
          </thead>
          <tbody>
            {squad.map((p) => (
              <tr key={p.id}>
                <td>{p.fullName}</td>
                <td style={{ textAlign: 'center' }}><span className="pos-badge">{p.naturalPosition}</span></td>
                <td style={{ textAlign: 'right' }}>{fmtDM(p.contract.weeklyWage)}</td>
                <td style={{ textAlign: 'right' }}>{CalendarEngine.formatDate(p.contract.expiryDate)}</td>
                <td style={{ textAlign: 'right' }} className="accent-text">{fmtDM(p.contract.transferValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dim2 mini mt12">Vertragsverhandlungen und -verlängerungen folgen in einem späteren Ausbau.</div>
      </div>
    </div>
  );
}

// --- BEOBACHTUNGSLISTE ------------------------------------------------------
function BeobachtungView() {
  return (
    <PagePlaceholder icon="watchlist" title="Beobachtungsliste">
      Hier sammelst du künftig Spieler, die du im Auge behalten möchtest. Du kannst
      Kandidaten aus dem Transfermarkt hinzufügen und ihre Form, ihren Wert und ihre
      Vertragssituation verfolgen.
    </PagePlaceholder>
  );
}

// --- AKTIVE VERHANDLUNGEN ---------------------------------------------------
function VerhandlungenView() {
  return (
    <PagePlaceholder icon="negotiations" title="Aktive Verhandlungen">
      In diesem Bereich laufen künftig alle offenen Transfer- und Vertragsgespräche
      zusammen — inklusive Angeboten, Gegenangeboten und Fristen.
    </PagePlaceholder>
  );
}

// --- SPONSORING -------------------------------------------------------------
function SponsoringView({ g, onGoto, onChange }: { g: Game; onGoto: (s: Screen) => void; onChange: () => void }) {
  const myClub = g.clubs[g.managedClubId];
  const m = computeMonthly(myClub, g.players, g.table);
  const scale = economyScale(yearOf(g.calendar.currentDate));
  const com = myClub.commerce ?? (myClub.commerce = { cateringMode: 'verpachtung' });

  const signShirt = (o: SponsorOffer) => {
    com.shirtSponsor = offerToContract(o);
    com.shirtOffers = [];
    onChange();
  };
  const signBanden = (o: SponsorOffer) => {
    com.banden = offerToContract(o);
    com.bandenOffers = [];
    onChange();
  };

  const ContractCard = ({
    title, icon, contract, monthly, offers, onSign, kind,
  }: {
    title: string; icon: IconName; contract?: SponsorContract; monthly: number;
    offers?: SponsorOffer[]; onSign: (o: SponsorOffer) => void; kind: string;
  }) => (
    <div className="card">
      <div className="card-title"><span className="ico"><Icon name={icon} /></span> {title}</div>
      {contract ? (
        <>
          <div className="row mt8"><span className="dim">Partner</span><b>{contract.name}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Jahreswert</span><b className="green">{fmtDM(contract.annualValue * scale)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Monatsrate</span><b className="green">{fmtDM(monthly)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Restlaufzeit</span><b>{contract.yearsLeft} {contract.yearsLeft === 1 ? 'Saison' : 'Saisons'}</b></div>
        </>
      ) : (
        <div className="pill mt8" style={{ display: 'inline-block', background: 'rgba(255,120,80,0.15)', color: 'var(--orange)' }}>
          Kein laufender Vertrag – wähle ein Angebot!
        </div>
      )}
      {offers && offers.length > 0 && (
        <div className="mt12">
          <div className="dim mini" style={{ marginBottom: 6 }}>Angebote dieser Saison ({kind}):</div>
          {offers.map((o, i) => (
            <div key={`${o.name}-${i}`} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ flex: 1 }}>
                <b>{o.name}</b>
                <span className="dim2 mini"> · {fmtDM(o.annualValue * scale)}/Jahr · {o.years} {o.years === 1 ? 'Saison' : 'Saisons'}</span>
              </span>
              <button className="btn-sm btn-primary" onClick={() => onSign(o)}>Unterschreiben</button>
            </div>
          ))}
        </div>
      )}
      {(!offers || offers.length === 0) && !contract && (
        <div className="dim2 mini mt8">Neue Angebote erscheinen zum Saisonwechsel.</div>
      )}
    </div>
  );

  return (
    <div className="page">
      <PageHead icon="sponsoring" title={<>Sponsoring — <span className="accent">{myClub.name}</span></>} />
      <div className="dash-grid">
        <ContractCard
          title="Trikotsponsor" icon="sponsoring" contract={com.shirtSponsor} monthly={m.sponsorship}
          offers={com.shirtOffers} onSign={signShirt} kind="Trikot"
        />
        <ContractCard
          title="Bandenwerbung" icon="marketing" contract={com.banden} monthly={m.advertising}
          offers={com.bandenOffers} onSign={signBanden} kind="Banden"
        />
      </div>
      <div className="card mt16" style={{ maxWidth: 720 }}>
        <div className="card-title"><span className="ico"><Icon name="finances" /></span> Sponsoring-Einnahmen (Monat)</div>
        <div className="row mt8"><span className="dim">Trikotsponsoring</span><b className="green">{fmtDM(m.sponsorship)}</b></div>
        <div className="row" style={{ padding: '6px 0' }}><span className="dim">Bandenwerbung</span><b className="green">{fmtDM(m.advertising)}</b></div>
        <div className="row" style={{ padding: '6px 0' }}><span className="dim">Vereinsansehen</span><b>{myClub.reputation}</b></div>
        <div className="dim mt12" style={{ lineHeight: 1.6 }}>
          Trikot- und Bandenwerte richten sich nach Ansehen, Stadionkapazität und Tabellenlage.
          Höhere Reputation bringt bessere Angebote zum Saisonwechsel.
        </div>
        <button className="btn-sm btn-ghost mt16" onClick={() => onGoto('marketing')}>Zum Marketing →</button>
      </div>
    </div>
  );
}

// --- FANS -------------------------------------------------------------------
function FansView({ g }: { g: Game }) {
  const myClub = g.clubs[g.managedClubId];
  const st = myClub.stadium;
  const scale = economyScale(yearOf(g.calendar.currentDate));
  // Erwartete Auslastung bei aktuellem Ticketpreis (mit Elastizitaet).
  const expRate = expectedAttendanceRate(myClub);
  const expVisitors = expectedAttendance(myClub);
  const ticket = Math.round(expVisitors * st.ticketPrice * scale);
  const catering = cateringMatchIncome(myClub, expVisitors, scale);
  const programme = matchdayIncome(expVisitors, scale);
  const perMatchTotal = ticket + catering + programme;
  // Mitglieder-Schaetzung: Beitraege / typischer Jahresbeitrag (~40 DM 1975-Basis).
  const memberYear = Math.round((30000 + myClub.reputation * 1000));
  const estMembers = Math.round(memberYear / 40);
  return (
    <div className="page">
      <PageHead icon="fans" title={<>Fans — <span className="accent">{myClub.name}</span></>} />
      <div className="dash-grid">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Zuschauer & Auslastung</div>
          <div className="row mt8"><span className="dim">Ø Auslastung (Basis)</span><b className="accent-text">{Math.round(st.averageAttendanceRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erwartete Auslastung</span><b className="accent-text">{Math.round(expRate * 100)}%</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Erw. Zuschauer</span><b>{expVisitors.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Kapazität</span><b>{st.capacity.toLocaleString('de-DE')}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Ticketpreis</span><b>{fmtDM(st.ticketPrice * scale)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Geschätzte Mitglieder</span><b>{estMembers.toLocaleString('de-DE')}</b></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Spieltags-Einnahmen (erwartet)</div>
          <div className="dim2 mini mt8">Pro Heimspiel bei {expVisitors.toLocaleString('de-DE')} Zuschauern:</div>
          <div className="row mt8"><span className="dim">Eintritt</span><b className="green">{fmtDM(ticket)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Catering / Würstchenbuden</span><b className="green">{fmtDM(catering)}</b></div>
          <div className="row" style={{ padding: '6px 0' }}><span className="dim">Programmhefte & Spieltag</span><b className="green">{fmtDM(programme)}</b></div>
          <div className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="dim">Summe je Heimspiel</span><b className="green">{fmtDM(perMatchTotal)}</b></div>
          <div className="dim2 mini mt12">Mehr Zuschauer → mehr Eintritt, Catering und Programmhefte. Der Ticketpreis (Stadion) steuert die Auslastung.</div>
        </div>
      </div>
    </div>
  );
}

// --- INTERNATIONAL ----------------------------------------------------------
function InternationalView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const euroCups = g.euroCups;
  const [comp, setComp] = useState<EuroCompId>('ec');
  // Eingeklappte Runden merken (key = comp-roundIndex). Gespielte Runden sind
  // per Default zu, aktuelle/kommende offen — die Map haelt nur Abweichungen.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Alt-Save ohne Europapokal-Struktur -> sauberer Hinweis statt Absturz.
  if (!euroCups || (!euroCups.ec && !euroCups.cwc && !euroCups.uefa)) {
    return (
      <div className="page">
        <PageHead icon="international" title="International" />
        <div className="card">
          <p className="dim" style={{ margin: 0 }}>
            Für diesen Spielstand sind noch keine Europapokal-Wettbewerbe hinterlegt.
            Sie erscheinen automatisch, sobald eine neue Saison mit europäischer Qualifikation beginnt.
          </p>
        </div>
      </div>
    );
  }

  const mid = g.managedClubId;
  const cup = euroCups[comp] ?? null;

  // Team-Sicht: deutsche/volle Vereine via clubView (mit Wappen), auslaendische
  // eu_-Vereine aus g.euroClubs (Farbpunkt statt Wappen, mit Land).
  const teamInfo = (id: string) => {
    const euro = g.euroClubs?.[id];
    if (euro) {
      return { name: euro.name, short: euro.shortName, colors: euro.colors, foreign: true, country: euro.country, club: null as any };
    }
    const cv = clubView(g, id);
    return { name: cv.name, short: cv.shortName, colors: cv.colors, foreign: false, country: '', club: g.clubs[id] ?? null };
  };

  const TeamSide = ({ id, won }: { id: string; won: boolean }) => {
    const t = teamInfo(id);
    return (
      <div className={`cup-team ${won ? 'cup-win' : ''}`}>
        {t.foreign ? (
          <span title={t.country} style={{
            width: 14, height: 14, borderRadius: '50%', flex: '0 0 auto',
            background: t.colors.primary, border: '1px solid rgba(255,255,255,0.35)', display: 'inline-block',
          }} />
        ) : (
          t.club && <ClubCrest club={t.club} size={18} />
        )}
        <span className="cup-team-name" title={t.foreign ? `${t.name} (${t.country})` : t.name}>{t.short}</span>
      </div>
    );
  };

  const TieRow = ({ tie }: { tie: CupTie }) => {
    const mine = tie.involvesPlayerClub || tie.homeClubId === mid || tie.awayClubId === mid;
    const homeWon = tie.played && tie.winnerClubId === tie.homeClubId;
    const awayWon = tie.played && tie.winnerClubId === tie.awayClubId;
    const badge = decisionBadge(tie);
    return (
      <div className={`cup-tie ${mine ? 'cup-tie-mine' : ''} ${tie.match ? 'cup-tie-clickable' : ''}`}
        onClick={() => { if (tie.match) onWatch(tie.match.id); }}>
        <TeamSide id={tie.homeClubId} won={homeWon} />
        <div className="cup-score">
          {tie.played ? (
            <>
              <b>{tie.homeGoals}:{tie.awayGoals}</b>
              {badge && <span className="cup-badge">{badge}</span>}
              {tie.penalties && <span className="cup-pens">{tie.penalties.home}:{tie.penalties.away}</span>}
            </>
          ) : (
            <span className="dim mini">{CalendarEngine.formatDate(tie.date)}</span>
          )}
        </div>
        <TeamSide id={tie.awayClubId} won={awayWon} />
      </div>
    );
  };

  const winnerName = (id: string | null) => (id ? teamInfo(id).name : '');
  const myNext = cup ? nextPlayerEuroTie(cup, mid) : null;
  const winner = cup?.winnerClubId ?? null;

  return (
    <div className="page">
      <PageHead icon="international" title={<>International{cup && <> <span className="accent">{cup.season}</span></>}</>} />

      {/* Wettbewerbs-Umschalter */}
      <div className="seg-group" style={{ display: 'inline-flex', marginBottom: 12 }}>
        {(['ec', 'cwc', 'uefa'] as EuroCompId[]).map((c) => (
          <button key={c} className={`seg-btn ${comp === c ? 'active' : ''}`}
            disabled={!euroCups[c]} onClick={() => setComp(c)}>
            {EURO_COMP_SHORT[c]}
          </button>
        ))}
      </div>

      {!cup ? (
        <div className="card"><p className="dim" style={{ margin: 0 }}>Dieser Wettbewerb ist in dieser Saison nicht hinterlegt.</p></div>
      ) : (
        <>
          {/* Info + eigener Weg */}
          <div className="card">
            <div style={{ fontWeight: 800, marginBottom: 4 }}>{EURO_COMP_NAMES[comp]}</div>
            <p className="mini dim" style={{ margin: 0 }}>
              K.-o.-Wettbewerb mit {cup.participantIds.length} Teilnehmern. Ein Spiel entscheidet —
              bei Gleichstand Verlängerung, dann Elfmeterschießen. Nach jeder Runde wird neu ausgelost.
            </p>
            {winner && (
              <p className="mt12" style={{ margin: '10px 0 0' }}>
                <b style={{ color: 'var(--gold)' }}>Sieger {cup.season}: {winnerName(winner)}</b>
                {winner === mid && ' — das ist dein Verein!'}
              </p>
            )}
            {!winner && myNext && (
              <div className="mt12" style={{ margin: '10px 0 0' }}>
                <span className="dim mini">Dein nächstes Europapokal-Spiel — {cup.rounds[myNext.round]?.name}, {CalendarEngine.formatDate(myNext.date)}:</span><br />
                <b>{myNext.homeClubId === mid ? 'Heim gegen ' : 'Auswärts bei '}{teamInfo(myNext.homeClubId === mid ? myNext.awayClubId : myNext.homeClubId).name}</b>
                {myNext.match && (
                  <div className="mt8">
                    <button className="btn-sm btn-primary" onClick={() => onWatch(myNext.match!.id)}>Partie ansehen</button>
                  </div>
                )}
              </div>
            )}
            {!winner && !myNext && (
              <p className="mt12 dim mini" style={{ margin: '10px 0 0' }}>Dein Verein ist in diesem Wettbewerb nicht (mehr) vertreten.</p>
            )}
          </div>

          {/* Runden — aktuelle/kommende offen, gespielte einklappbar */}
          <div className="mt12" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cup.rounds.map((round) => {
              const allPlayed = round.drawn && round.ties.length > 0 && round.ties.every((t) => t.played);
              const key = `${comp}-${round.index}`;
              const isCollapsed = key in collapsed ? collapsed[key] : allPlayed;
              const winners = allPlayed ? roundWinners(round) : [];
              return (
                <div className="card" key={round.index} style={{ padding: 12 }}>
                  <div className="row" style={{ cursor: allPlayed ? 'pointer' : 'default' }}
                    onClick={() => { if (allPlayed) setCollapsed((s) => ({ ...s, [key]: !isCollapsed })); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {allPlayed && <span className="dim" style={{ fontSize: 11 }}>{isCollapsed ? '\u25B8' : '\u25BE'}</span>}
                      <b>{round.name}</b>
                      <span className="dim mini">{CalendarEngine.formatDate(round.date)}</span>
                    </div>
                    <span className="dim mini">{(cup.prizeByRound[round.index] / 1000).toLocaleString('de-DE')} Tsd. DM</span>
                  </div>
                  {!round.drawn ? (
                    <div className="cup-tie cup-tie-pending mt8"><span className="dim mini">Noch nicht ausgelost</span></div>
                  ) : isCollapsed ? (
                    <div className="dim mini mt8">
                      Abgeschlossen — weiter: {winners.map((w) => teamInfo(w).short).join(', ')}
                    </div>
                  ) : (
                    <div className="mt8" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- EINSTELLUNGEN (als Overlay) --------------------------------------------
function SettingsModal({ settings, onClose, onSave }: {
  settings: AppSettings; onClose: () => void; onSave: (s: AppSettings) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <SettingsScreen settings={settings} onBack={onClose} onSave={onSave} />
      </div>
    </div>
  );
}

// --- SPEICHERN / LADEN (gemeinsames Overlay) --------------------------------
function SaveLoadModal({ mode, currentSlot, onClose, onSave, onLoad }: {
  mode: 'save' | 'load';
  currentSlot: string | null;
  onClose: () => void;
  onSave: (slot: string, name: string) => void;
  onLoad: (slot: string) => void;
}) {
  const [saves, setSaves] = useState<SaveMeta[]>(() => listSaves());
  const current = saves.find((s) => s.slot === currentSlot);
  const [name, setName] = useState<string>(current?.name ?? '');
  const refresh = () => setSaves(listSaves());
  const del = (slot: string, label: string) => {
    if (confirm(`Speicherstand "${label}" wirklich löschen?`)) { deleteSave(slot); refresh(); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="row"><h2 style={{ margin: 0 }}>{mode === 'save' ? 'Spiel speichern' : 'Spiel laden'}</h2>
          <button className="btn-sm" onClick={onClose}>✕ Schließen</button></div>

        {mode === 'save' && (
          <div className="card mt16">
            <div className="card-title"><span className="ico"><Icon name="save" /></span> Neuer Spielstand</div>
            <input className="mt8" style={{ width: '100%' }} placeholder="Name des Spielstands (optional)"
              value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-sm btn-primary mt12" onClick={() => onSave(nextFreeSlot(), name)}>Neu speichern</button>
          </div>
        )}

        <div className="mt16" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
          {saves.length === 0 ? (
            <div className="card dim" style={{ textAlign: 'center', padding: 24 }}>Keine Speicherstände vorhanden.</div>
          ) : saves.map((s) => (
            <div key={s.slot} className="card hoverable" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{s.name || s.clubName} {s.slot === currentSlot && <span className="pill" style={{ marginLeft: 6 }}>aktuell</span>}</div>
                <div className="dim mini">{s.clubName} · {s.season} · {s.managerName}</div>
                <div className="dim2 mini">Spieldatum: {CalendarEngine.formatDate(s.gameDate)} · Gespeichert: {new Date(s.savedAt).toLocaleString('de-DE')}</div>
              </div>
              {mode === 'save' ? (
                <button className="btn-sm" onClick={() => { if (confirm(`Speicherstand "${s.name || s.clubName}" überschreiben?`)) onSave(s.slot, name || s.name); }}>Überschreiben</button>
              ) : (
                <button className="btn-sm btn-primary" onClick={() => onLoad(s.slot)}>Laden</button>
              )}
              <button className="btn-sm danger" onClick={() => del(s.slot, s.name || s.clubName)}>Löschen</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TABELLE
// =============================================================================
// Optik-/Namens-Sicht eines Vereins – funktioniert für volle Vereine (g.clubs)
// wie für aggregierte Sim-Vereine (g.simClubs). Für ClubCrest ausreichend.
function clubView(g: Game, id: string, year?: number): { id: string; name: string; shortName: string; city: string; colors: { primary: string; secondary: string }; customCrest?: string } {
  const c = g.clubs[id];
  // id + city + customCrest mitgeben, damit <ClubCrest> das spielweite Wappen-
  // Override zuverlässig auflösen kann (sonst zeigt die Tabelle das Standardwappen).
  if (c) return { id: c.id, name: c.name, shortName: c.shortName, city: c.city, colors: c.colors, customCrest: c.customCrest };
  const s = g.simClubs[id];
  // Zeit-korrekter Name (z. B. „Karl-Marx-Stadt" vor 1990, sonst „Chemnitz").
  if (s) return { id: s.id, name: year != null ? simDisplayName(s, year) : s.name, shortName: s.shortName, city: s.city, colors: s.colors };
  return { id, name: id, shortName: id.slice(0, 3).toUpperCase(), city: '', colors: { primary: '#444', secondary: '#fff' } };
}

// Zonen-Markierung je Ebene: 1. Liga = Meister/Europa/Abstieg; 2. Liga =
// Direktaufstieg (Platz 1) + Playoff (Platz 2).
function divisionZone(pos: number, tier: number, rowCount: number): string {
  if (tier === 1) {
    if (pos <= 1) return 'zone-cl';
    if (pos <= 4) return 'zone-eu';
    if (pos >= rowCount - 2) return 'zone-rel';
    return '';
  }
  if (tier === 2) {
    if (pos <= 1) return 'zone-cl';
    if (pos === 2) return 'zone-eu';
    return '';
  }
  return '';
}

// Baut die vollständigen Anzeigedaten eines Vereins für die ClubModal-Detailseite.
// Funktioniert für volle Vereine (mit Kader/Stadion) und reine Sim-Vereine.
function buildClubProfile(g: Game, clubId: string): ClubProfileData {
  const year = seasonStartYear(g.season);
  const view = clubView(g, clubId, year);
  const full = g.clubs[clubId];
  const sim = g.simClubs[clubId];

  // Division + Tabellenzeile ermitteln (Spielerliga zuerst, dann Sim-Ligen).
  let divisionLabelStr: string | undefined;
  let tablePosition: number | undefined;
  let form: ('W' | 'D' | 'L')[] | undefined;
  const pd = g.leagues.playerDivision;
  const findRow = (table: LeagueTable) => table.rows.find((r) => r.clubId === clubId);
  let row = findRow(g.table);
  if (row) {
    divisionLabelStr = divisionLabel(pd.tier, pd.group);
  } else {
    for (const d of g.leagues.otherDivisions) {
      const r = findRow(d.table);
      if (r) { row = r; divisionLabelStr = d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group); break; }
    }
  }
  if (row) { tablePosition = row.position; form = row.form; }

  // Kader (nur bei vollen Vereinen), absteigend nach Stärke.
  const squad = full
    ? full.playerIds.map((id) => g.players[id]).filter(Boolean).sort((a, b) => b.overall - a.overall)
    : [];

  // Spiele aus allen Liga-Spielplänen (Spielerliga + Sim-Ligen) einsammeln.
  const allFixtures: Match[] = [...g.fixtures];
  for (const d of g.leagues.otherDivisions) allFixtures.push(...d.fixtures);
  const seen = new Set<string>();
  const uniq = allFixtures.filter((m) => {
    if (m.homeClubId !== clubId && m.awayClubId !== clubId) return false;
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const toLine = (m: Match): ClubMatchLine => {
    const home = m.homeClubId === clubId;
    const oppId = home ? m.awayClubId : m.homeClubId;
    const opp = clubView(g, oppId, year).name;
    const finished = m.status === 'finished' && !!m.result;
    let score: string | null = null;
    let won: boolean | null | undefined = undefined;
    if (finished && m.result) {
      const gf = home ? m.result.homeGoals : m.result.awayGoals;
      const ga = home ? m.result.awayGoals : m.result.homeGoals;
      score = `${gf}:${ga}`;
      won = gf > ga ? true : gf < ga ? false : null;
    }
    return { date: m.date, opponent: opp, homeAway: home ? 'H' : 'A', score, won, upcoming: !finished };
  };

  const finishedM = uniq.filter((m) => m.status === 'finished' && m.result).sort((a, b) => b.date.localeCompare(a.date));
  const upcomingM = uniq.filter((m) => !(m.status === 'finished' && m.result)).sort((a, b) => a.date.localeCompare(b.date));

  return {
    clubId,
    name: view.name,
    shortName: view.shortName,
    colors: view.colors,
    city: full?.city ?? sim?.city ?? '',
    founded: full?.founded,
    reputation: full?.reputation,
    stadium: full ? { name: full.stadium.name, capacity: full.stadium.capacity } : undefined,
    strength: clubStrengthFor(g, clubId),
    divisionLabel: divisionLabelStr,
    tablePosition,
    form,
    isPlayerClub: clubId === g.managedClubId,
    fullClub: full,
    squad,
    lastMatches: finishedM.slice(0, 6).map(toLine),
    nextMatches: upcomingM.slice(0, 6).map(toLine),
  };
}

function TableView({ g }: { g: Game }) {
  // Alle wählbaren Ligen/Staffeln: Spielerliga (volle Tabelle) + Sim-Ligen.
  const divisions: { id: string; label: string; tier: number; group: LeagueGroup; table: LeagueTable }[] = [
    { id: g.leagues.playerDivision.id, label: divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group), tier: g.leagues.playerDivision.tier, group: g.leagues.playerDivision.group, table: g.table },
    // DDR-Ligen tragen einen eigenen Namen (tier 101/102) und werden klar als
    // solche beschriftet; alle anderen nutzen das generische Ebenen-/Staffel-Label.
    ...g.leagues.otherDivisions.map((d) => ({ id: d.id, label: d.id.startsWith('ddr-') ? d.name : divisionLabel(d.tier, d.group), tier: d.tier, group: d.group, table: d.table })),
  ];
  // Sortierung: Ebene, dann Nord vor Süd.
  divisions.sort((a, b) => a.tier - b.tier || (a.group === 'nord' ? -1 : a.group === 'sued' ? 1 : 0) - (b.group === 'nord' ? -1 : b.group === 'sued' ? 1 : 0));

  const [selId, setSelId] = useState(g.leagues.playerDivision.id);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const sel = divisions.find((d) => d.id === selId) || divisions[0];
  const rowCount = sel.table.rows.length;

  return (
    <div className="page">
      <PageHead icon="dashTabelle" title={<>Tabelle <span className="accent">{g.season}</span></>} />

      {/* Liga-/Staffel-Umschalter */}
      <div className="card" style={{ padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {divisions.map((d) => {
            const active = d.id === sel.id;
            const isPlayer = d.id === g.leagues.playerDivision.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelId(d.id)}
                className="btn"
                style={{
                  padding: '6px 14px', fontWeight: active ? 800 : 600,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#06121a' : 'var(--text)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                {d.label}{isPlayer ? ' ★' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>#</th><th>Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th><th>Form</th></tr>
            </thead>
            <tbody>
              {sel.table.rows.map((r) => {
                const c = clubView(g, r.clubId, seasonStartYear(g.season));
                const mine = r.clubId === g.managedClubId;
                return (
                  <tr key={r.clubId} className={mine ? 'me' : ''}>
                    <td><span className={`pos-badge ${divisionZone(r.position, sel.tier, rowCount)}`}>{r.position}</span></td>
                    <td>
                      <div
                        className="club-link"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => setClubModalId(r.clubId)}
                        title="Vereinsprofil öffnen"
                      >
                        <ClubCrest club={c as any} size={22} />
                        <span style={{ fontWeight: mine ? 800 : 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
                    <td className="dim">{r.goalsFor}:{r.goalsAgainst}</td>
                    <td>{r.goalDifference > 0 ? '+' : ''}{r.goalDifference}</td>
                    <td><b className="accent-text">{r.points}</b></td>
                    <td><div className="form-row">{r.form.map((f, i) => <span key={i} className={`form-pill ${f}`}>{f}</span>)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mini dim2 mt12" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {sel.tier === 1 ? (
            <>
              <span><span className="pos-badge zone-cl" style={{ width: 16, height: 16 }}></span> Landesmeister-Pokal</span>
              <span><span className="pos-badge zone-eu" style={{ width: 16, height: 16 }}></span> UEFA-Pokal</span>
              <span><span className="pos-badge zone-rel" style={{ width: 16, height: 16 }}></span> Abstieg</span>
              <span className="dim2">Pokalsieger-Pokal: über den DFB-Pokal</span>
            </>
          ) : (
            <>
              <span><span className="pos-badge zone-cl" style={{ width: 16, height: 16 }}></span> Direktaufstieg</span>
              <span><span className="pos-badge zone-eu" style={{ width: 16, height: 16 }}></span> Aufstiegs-Playoff</span>
            </>
          )}
        </div>
      </div>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}

// =============================================================================
// SPIELPLAN
// =============================================================================
function FixturesView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const myMatches = g.fixtures.filter((m) => m.involvesPlayerClub).sort((a, b) => a.matchday - b.matchday);
  const [clubModalId, setClubModalId] = useState<string | null>(null);
  const mid = g.managedClubId;
  return (
    <div className="page">
      <PageHead icon="schedule" title={<>Spielplan — <span className="accent">{g.clubs[g.managedClubId].name}</span></>} />
      <div className="card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>ST</th><th>Datum</th><th>Heim</th><th style={{ textAlign: 'center' }}>Erg.</th><th>Auswärts</th><th></th></tr></thead>
            <tbody>
              {myMatches.map((m) => {
                const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
                const isMyHome = m.homeClubId === g.managedClubId;
                const homeCls = m.homeClubId !== mid ? 'club-link' : '';
                const awayCls = m.awayClubId !== mid ? 'club-link' : '';
                return (
                  <tr key={m.id}>
                    <td><b>{m.matchday}</b></td>
                    <td className="dim mini">{CalendarEngine.formatDate(m.date)}</td>
                    <td className={homeCls} style={{ fontWeight: isMyHome ? 800 : 600, cursor: m.homeClubId !== mid ? 'pointer' : 'default' }}
                        onClick={() => { if (m.homeClubId !== mid) setClubModalId(m.homeClubId); }}
                        title={m.homeClubId !== mid ? 'Vereinsprofil öffnen' : undefined}>{h.shortName}</td>
                    <td style={{ textAlign: 'center' }}><b className="accent-text">{m.result ? `${m.result.homeGoals}:${m.result.awayGoals}` : '–:–'}</b></td>
                    <td className={awayCls} style={{ fontWeight: !isMyHome ? 800 : 600, cursor: m.awayClubId !== mid ? 'pointer' : 'default' }}
                        onClick={() => { if (m.awayClubId !== mid) setClubModalId(m.awayClubId); }}
                        title={m.awayClubId !== mid ? 'Vereinsprofil öffnen' : undefined}>{a.shortName}</td>
                    <td>{m.status === 'finished' && <button className="btn-sm" onClick={() => onWatch(m.id)}>Bericht</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {clubModalId && <ClubModal data={buildClubProfile(g, clubModalId)} onClose={() => setClubModalId(null)} />}
    </div>
  );
}

// =============================================================================
// DFB-POKAL (Turnierbaum + eigener Weg)
// =============================================================================
function CupView({ g, onWatch }: { g: Game; onWatch: (id: string) => void }) {
  const cup = g.cup;
  const mid = g.managedClubId;
  if (!cup) {
    return (
      <div className="page">
        <PageHead icon="trophy" title="DFB-Pokal" />
        <div className="card"><p className="dim">Für diesen Spielstand ist kein Pokal-Wettbewerb hinterlegt.</p></div>
      </div>
    );
  }
  const name = (id: string) => g.clubs[id]?.name ?? id;
  const short = (id: string) => g.clubs[id]?.shortName ?? name(id);
  const myNext = nextPlayerTie(cup, mid);
  const winner = cup.winnerClubId;

  const TieRow = ({ tie }: { tie: CupTie }) => {
    const mine = tie.involvesPlayerClub;
    const home = g.clubs[tie.homeClubId]; const away = g.clubs[tie.awayClubId];
    const badge = decisionBadge(tie);
    const homeWon = tie.played && tie.winnerClubId === tie.homeClubId;
    const awayWon = tie.played && tie.winnerClubId === tie.awayClubId;
    return (
      <div className={`cup-tie ${mine ? 'cup-tie-mine' : ''} ${tie.match ? 'cup-tie-clickable' : ''}`}
        onClick={() => { if (tie.match) onWatch(tie.match.id); }}>
        <div className={`cup-team ${homeWon ? 'cup-win' : ''}`}>
          {home && <ClubCrest club={home} size={18} />}
          <span className="cup-team-name">{short(tie.homeClubId)}</span>
        </div>
        <div className="cup-score">
          {tie.played ? (
            <>
              <b>{tie.homeGoals}:{tie.awayGoals}</b>
              {badge && <span className="cup-badge">{badge}</span>}
              {tie.penalties && <span className="cup-pens">{tie.penalties.home}:{tie.penalties.away}</span>}
            </>
          ) : (
            <span className="dim mini">{CalendarEngine.formatDate(tie.date)}</span>
          )}
        </div>
        <div className={`cup-team ${awayWon ? 'cup-win' : ''}`}>
          {away && <ClubCrest club={away} size={18} />}
          <span className="cup-team-name">{short(tie.awayClubId)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <PageHead icon="trophy" title={<>DFB-Pokal <span className="accent">{cup.season}</span></>} />

      {/* Info + eigener Weg */}
      <div className="card">
        <p className="mini" style={{ margin: 0 }}>
          K.-o.-Wettbewerb mit <b>32 Teilnehmern</b> (18 Bundesligisten + 14 Amateurvereine) über 5 Runden.
          Ein Spiel entscheidet — bei Gleichstand Verlängerung, dann Elfmeterschießen. Nach jeder Runde wird neu ausgelost.
        </p>
        {winner && (
          <p className="mt12" style={{ margin: '10px 0 0' }}>
            <b className="accent-text">Pokalsieger {cup.season}: {name(winner)}</b>
            {winner === mid && ' — Glückwunsch, das ist dein Verein! 🎉'}
          </p>
        )}
        {!winner && myNext && (
          <p className="mt12" style={{ margin: '10px 0 0' }}>
            <span className="dim mini">Dein nächstes Pokalspiel — {cup.rounds[myNext.round].name}, {CalendarEngine.formatDate(myNext.date)}:</span><br />
            <b>{myNext.homeClubId === mid ? 'Heim gegen' : 'Auswärts bei'} {myNext.homeClubId === mid ? name(myNext.awayClubId) : name(myNext.homeClubId)}</b>
          </p>
        )}
        {!winner && !myNext && (
          <p className="mt12 dim mini" style={{ margin: '10px 0 0' }}>Dein Verein ist im Pokal ausgeschieden.</p>
        )}
      </div>

      {/* Turnierbaum */}
      <div className="cup-bracket mt12">
        {cup.rounds.map((round) => (
          <div className="cup-col" key={round.index}>
            <div className="cup-col-head">
              <span>{round.name}</span>
              <span className="dim mini">{CalendarEngine.formatDate(round.date)} · {(cup.prizeByRound[round.index] / 1000).toLocaleString('de-DE')} Tsd. DM</span>
            </div>
            {round.drawn ? (
              round.ties.map((tie) => <TieRow key={tie.id} tie={tie} />)
            ) : (
              <div className="cup-tie cup-tie-pending"><span className="dim mini">Noch nicht ausgelost</span></div>
            )}
          </div>
        ))}
      </div>

      {/* Preisgeld-Leiter */}
      <div className="card mt12">
        <div className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>Preisgeld pro gewonnener Runde</div>
        <div className="cup-prizes">
          {cup.rounds.map((r) => (
            <div className="cup-prize" key={r.index}>
              <span className="dim mini">{r.name}</span>
              <b>{fmtDMfull(cup.prizeByRound[r.index])}</b>
            </div>
          ))}
        </div>
        <p className="dim mini" style={{ marginTop: 8, marginBottom: 0 }}>
          Zusätzlich erhält der Ausrichter (zuerst gezogener Verein) die Heimeinnahmen aus Eintritt, Fanartikeln und TV-Geldern.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// KADER (Tabelle, kein Avatar)
// =============================================================================
type SquadSort = 'ovr' | 'pot' | 'form' | 'fit' | 'age';

function SquadView({ g }: { g: Game }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SquadSort>('ovr');
  const club = g.clubs[g.managedClubId];
  const squad = club.playerIds.map((id) => g.players[id]).sort((a, b) => {
    switch (sortBy) {
      case 'pot': return (b.potentialStars - a.potentialStars) || (b.overall - a.overall);
      case 'form': return b.form - a.form;
      case 'fit': return b.attributes.fitness - a.attributes.fitness;
      case 'age': return a.age - b.age;
      default: return b.overall - a.overall;
    }
  });
  const p = sel ? g.players[sel] : null;

  const SortBtn = ({ k, label }: { k: SquadSort; label: string }) => (
    <button className={`btn-sm ${sortBy === k ? 'active' : ''}`} onClick={() => setSortBy(k)}>{label}</button>
  );

  return (
    <div className="page">
      <PageHead
        icon="squad"
        title={<>Kader <span className="accent">({squad.length})</span></>}
        right={<>
          <span className="dim mini">Sortieren:</span>
          <SortBtn k="ovr" label="OVR" />
          <SortBtn k="pot" label="Potenzial" />
          <SortBtn k="form" label="Form" />
          <SortBtn k="fit" label="Fitness" />
          <SortBtn k="age" label="Alter" />
        </>}
      />

      <div className="card">
        <div className="table-scroll">
          <table className="squad-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Potenzial</th>
                <th>Form</th><th>Fit</th>
                <th title="Tempo">TMP</th><th title="Technik">TEC</th><th title="Passspiel">PAS</th>
                <th title="Zweikampf">ZWK</th><th title="Torschuss">TOR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((pl) => {
                const fi = formIndicator(pl.form);
                return (
                  <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
                    <td className="dim">{pl.shirtNumber}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{pl.fullName}</td>
                    <td><span className="pos-tag">{pl.naturalPosition}</span></td>
                    <td>{pl.age}</td>
                    <td><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="stars" style={{ fontSize: 12 }}>{renderStars(pl.potentialStars)}</span>
                      <span className="dim2 mini" style={{ marginLeft: 6 }}>max {starsToPotential(pl.potentialStars)}</span>
                    </td>
                    <td title={`${fi.label} (${Math.round(pl.form)})`} style={{ color: fi.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {fi.arrow} <span className="dim2 mini">{Math.round(pl.form)}</span>
                    </td>
                    <td style={{ color: vColor(pl.attributes.fitness), fontWeight: 700 }}>{Math.round(pl.attributes.fitness)}</td>
                    <td style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
                    <td style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
                    <td style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
                    <td style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
                    <td style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
                    <td className={pl.availability === 'injured' ? 'red' : pl.suspensionMatches > 0 ? 'orange-text' : 'green'} style={{ whiteSpace: 'nowrap' }}>
                      {pl.availability === 'injured' ? `verletzt (${pl.injury?.daysRemaining}d)` : pl.suspensionMatches > 0 ? `gesperrt (${pl.suspensionMatches})` : 'fit'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="dim2 mini mt12">
          Klicke eine Zeile für Details. TMP=Tempo · TEC=Technik · PAS=Passspiel · ZWK=Zweikampf · TOR=Torschuss.
          Farben: <span style={{ color: 'var(--green)' }}>Grün &gt;75</span>, <span style={{ color: 'var(--yellow)' }}>Gelb 60–75</span>, <span style={{ color: 'var(--red)' }}>Rot &lt;60</span>.
        </div>
      </div>

      {p && <PlayerModal player={p} club={club} onClose={() => setSel(null)} />}
    </div>
  );
}

// =============================================================================
// TRAINING
// =============================================================================
const DAY_NAMES_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const SLOT_LABELS: { key: keyof DaySlots; label: string }[] = [
  { key: 'slot1', label: 'Einheit 1' },
  { key: 'slot2', label: 'Einheit 2' },
  { key: 'extra', label: 'Extraeinheit' },
];

/** Farbcodierung eines Fitness-Deltas (positiv = Erholung, negativ = Ermüdung). */
function fitDeltaColor(d: number): string {
  if (d >= 3) return 'var(--green)';
  if (d >= 0) return 'var(--yellow)';
  if (d >= -4) return 'var(--orange)';
  return 'var(--red)';
}

function TrainingView({ g, onTrained }: { g: Game; onTrained: () => void }) {
  const club = g.clubs[g.managedClubId];
  const plan = g.trainingPlan;
  const [, setLocalTick] = useState(0);
  const refresh = () => { setLocalTick((t) => t + 1); onTrained(); };

  // Aktuelle Kalenderwoche (Mo–So) rund um das aktuelle Datum ermitteln (UTC).
  const cur = new Date(g.calendar.currentDate + 'T00:00:00Z');
  const monday = new Date(cur);
  monday.setUTCDate(cur.getUTCDate() - ((cur.getUTCDay() + 6) % 7));
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  // Pflichtspiele des Manager-Vereins in dieser Woche (Index Mo=0 … So=6).
  const matchByIdx: Record<number, Match> = {};
  for (let i = 0; i < 7; i++) {
    const m = g.fixtures.find((x) => x.involvesPlayerClub && x.date === weekDates[i]);
    if (m) matchByIdx[i] = m;
  }
  const todayIdx = (cur.getUTCDay() + 6) % 7;

  const setSlot = (dayIdx: number, slot: keyof DaySlots, val: string) => {
    plan.days[dayIdx][slot] = val === '' ? null : val;
    refresh();
  };

  // Wochenbilanz (nur Nicht-Spieltage zählen als Trainingstage).
  let weekLoad = 0;
  let trainDays = 0;
  for (let i = 0; i < 7; i++) {
    if (matchByIdx[i]) continue;
    weekLoad += dayLoad(plan.days[i]);
    trainDays++;
  }
  const avgDelta = trainDays > 0 ? Math.round((DAILY_BASE_RECOVERY_UI * trainDays - weekLoad) / trainDays * 10) / 10 : 0;

  return (
    <div className="page">
      <PageHead icon="training" title="Wochen-Trainingsplaner" />
      <div className="dim2 mini" style={{ marginBottom: 12 }}>
        Lege für jeden Tag bis zu drei Einheiten fest. An Spieltagen wird nicht trainiert.
        Zwei mittlere Einheiten pro Tag ≈ leichte Regeneration — hohe Intensität und Extraeinheiten kosten Fitness.
        Gezieltes Training lässt die Werte langfristig steigen (in kleinen, zunächst unsichtbaren Schritten).
      </div>

      {/* Wochenbilanz */}
      <div className="week-summary">
        <div className="ws-item">
          <span className="dim mini">Trainingstage</span>
          <b>{trainDays}</b>
        </div>
        <div className="ws-item">
          <span className="dim mini">Spieltage</span>
          <b>{Object.keys(matchByIdx).length}</b>
        </div>
        <div className="ws-item">
          <span className="dim mini">Ø Fitness/Tag</span>
          <b style={{ color: fitDeltaColor(avgDelta) }}>{avgDelta > 0 ? '+' : ''}{avgDelta}</b>
        </div>
      </div>

      {/* Planer-Raster */}
      <div className="planner-grid">
        {plan.days.map((day, idx) => {
          const match = matchByIdx[idx];
          const delta = expectedFitnessDelta(day);
          return (
            <div key={idx} className={`planner-day ${match ? 'is-matchday' : ''} ${idx === todayIdx ? 'is-today' : ''}`}>
              <div className="pd-head">
                <span className="pd-name">{DAY_NAMES_SHORT[idx]}<span className="pd-full"> · {DAY_NAMES_LONG[idx]}</span></span>
                {idx === todayIdx && <span className="pd-today-badge">heute</span>}
              </div>
              {match ? (
                <div className="pd-matchday">
                  <div className="pd-md-ico"><Icon name="matchball" /></div>
                  <div className="pd-md-txt">Spieltag {match.matchday}</div>
                  <div className="pd-md-sub">
                    {match.homeClubId === club.id
                      ? `vs. ${g.clubs[match.awayClubId]?.shortName ?? g.clubs[match.awayClubId]?.name ?? '???'}`
                      : `@ ${g.clubs[match.homeClubId]?.shortName ?? g.clubs[match.homeClubId]?.name ?? '???'}`}
                  </div>
                  <div className="pd-md-note">Kein Training</div>
                </div>
              ) : (
                <>
                  {SLOT_LABELS.map(({ key, label }) => {
                    const val = day[key] ?? '';
                    const block = val ? BLOCKS_BY_ID[val] : null;
                    return (
                      <div key={key} className={`pd-slot ${key === 'extra' ? 'is-extra' : ''}`}>
                        <label className="pd-slot-lbl">{key === 'extra' ? '＋ ' : ''}{label}</label>
                        <select
                          className="pd-select"
                          value={val}
                          onChange={(e) => setSlot(idx, key, e.target.value)}
                        >
                          <option value="">— frei —</option>
                          {TRAINING_BLOCKS.map((b) => (
                            <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                          ))}
                        </select>
                        {block && (
                          <div className="pd-block-meta">
                            <span className={`int-tag int-${block.intensity}`}>{INTENSITY_LABELS[block.intensity]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="pd-fitness" style={{ color: fitDeltaColor(delta) }}>
                    Fitness: {delta > 0 ? '+' : ''}{delta}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Trainingsblock-Legende */}
      <div className="section-title" style={{ marginTop: 22 }}>Trainingsblöcke</div>
      <div className="block-legend">
        {TRAINING_BLOCKS.map((b) => (
          <div key={b.id} className="block-card">
            <div className="bc-head">
              <span className="bc-ico">{b.icon}</span>
              <span className="bc-name">{b.name}</span>
              <span className={`int-tag int-${b.intensity}`}>{INTENSITY_LABELS[b.intensity]}</span>
            </div>
            <div className="bc-desc">{b.description}</div>
            <div className="bc-attrs">
              {Object.keys(b.attributes).length === 0
                ? <span className="bc-attr rec">Nur Erholung</span>
                : Object.entries(b.attributes)
                    .sort((a, c) => (c[1] as number) - (a[1] as number))
                    .map(([attr, w]) => (
                      <span key={attr} className={`bc-attr ${(w as number) >= 0.8 ? 'primary' : ''}`}>
                        {ATTRIBUTE_LABELS_DE[attr as keyof typeof ATTRIBUTE_LABELS_DE]}
                      </span>
                    ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Referenzwert für die UI-Wochenbilanz (Grund-Regeneration pro Tag). */
const DAILY_BASE_RECOVERY_UI = 10;

// =============================================================================
// AUF-/ABWERTUNGS-SCREEN (Trommelwirbel)
// =============================================================================
function DevelopmentReveal({ g, reveals, onClose }: {
  g: Game; reveals: PlayerDevReveal[]; onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'roll' | 'done'>('roll');

  // Trommelwirbel je Spieler, dann Enthüllung.
  useEffect(() => {
    setPhase('roll');
    const t = setTimeout(() => setPhase('done'), 1400);
    return () => clearTimeout(t);
  }, [idx]);

  const rev = reveals[idx];
  const player = g.players[rev.playerId];
  const club = g.clubs[g.managedClubId];
  const isLast = idx >= reveals.length - 1;

  const dir = rev.netOvr > 0 ? 'up' : rev.netOvr < 0 ? 'down' : 'mixed';
  const dirLabel = dir === 'up' ? 'AUFWERTUNG' : dir === 'down' ? 'ABWERTUNG' : 'VERÄNDERUNG';
  const dirArrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '●';

  const ovrChange = rev.changes.find((c) => c.attribute === 'overall');
  const attrChanges = rev.changes.filter((c) => c.attribute !== 'overall');

  const next = () => { if (isLast) onClose(); else setIdx((i) => i + 1); };

  return (
    <div className="reveal-overlay" role="dialog" aria-modal="true">
      <button className="reveal-close" onClick={onClose} title="Schließen">✕</button>
      <div className="reveal-progress">Spieler {idx + 1} / {reveals.length}</div>

      <div className={`reveal-card dir-${dir} phase-${phase}`}>
        <div className="reveal-avatar">
          <PlayerAvatar player={player} club={club} size="large" />
        </div>
        <div className="reveal-name">{player.fullName}</div>
        <div className="reveal-pos">{player.position} · {player.age} Jahre</div>

        {phase === 'roll' ? (
          <div className="reveal-roll">
            <div className="drumroll">
              <span></span><span></span><span></span>
            </div>
            <div className="drumroll-txt">Trommelwirbel …</div>
          </div>
        ) : (
          <div className="reveal-result">
            <div className={`reveal-badge dir-${dir}`}>{dirArrow} {dirLabel}</div>

            {ovrChange && (
              <div className="reveal-ovr">
                <span className="ro-lbl">Gesamtstärke</span>
                <span className="ro-vals">
                  <b style={{ color: vColor(ovrChange.oldValue) }}>{ovrChange.oldValue}</b>
                  <span className="ro-arrow">→</span>
                  <b style={{ color: vColor(ovrChange.newValue) }}>{ovrChange.newValue}</b>
                </span>
              </div>
            )}

            {attrChanges.length > 0 && (
              <div className="reveal-attrs">
                {attrChanges.map((c, i) => (
                  <div key={i} className={`ra-row ${c.direction}`}>
                    <span className="ra-name">{c.attributeLabel}</span>
                    <span className="ra-vals">
                      {c.oldValue} <span className="ra-arrow">{c.direction === 'up' ? '▲' : '▼'}</span> {c.newValue}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={`reveal-reason ${rev.isLifeEvent ? 'life-event' : ''}`}>
              {rev.isLifeEvent && <span className="le-tag">Privat</span>}
              „{rev.reason}"
            </div>

            <button className="btn-continue paused reveal-next" onClick={next}>
              {isLast ? '✓ Fertig' : 'Weiter →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LEISTUNGSBEWERTUNGS-ZEREMONIE (sequenzielle Enthüllung, nur eigener Verein)
// -----------------------------------------------------------------------------
// x1  = nächsten Spieler einzeln enthüllen
// x2  = zwei Spieler pro Schritt enthüllen (schneller)
// Überspringen = sofort alle Ergebnisse zeigen
// Die Werte sind bereits im Game-State angewandt; hier werden sie nur enthüllt.
// =============================================================================
function RatingCeremony({ results, type, anlass, onClose }: {
  results: RatingResult[]; type: 'medium' | 'large'; anlass: string; onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const total = results.length;
  const done = revealed >= total;

  const step = (n: number) => setRevealed((r) => Math.min(total, r + n));
  const skip = () => setRevealed(total);

  // Enthüllte Spieler, neueste zuerst (so verfolgt man den Fortschritt oben).
  const shown = results.slice(0, revealed).slice().reverse();
  const ups = results.filter((r) => r.change > 0).length;
  const downs = results.filter((r) => r.change < 0).length;
  const flats = total - ups - downs;

  const title = type === 'large' ? 'Große Saison-Bewertung' : 'Leistungsbewertung';

  return (
    <div className="reveal-overlay" role="dialog" aria-modal="true">
      <div className="rc-panel">
        <div className="rc-head">
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>{title}</div>
            <div className="dim mini">{anlass} · dein Verein</div>
          </div>
          {done && <button className="reveal-close" onClick={onClose} title="Schließen">✕</button>}
        </div>

        <div className="rc-progress">
          <span className="dim mini">{Math.min(revealed, total)} / {total} enthüllt</span>
          {done && total > 0 && (
            <span className="rc-summary">
              <span className="green">▲ {ups}</span>
              <span className="red">▼ {downs}</span>
              <span className="dim">● {flats}</span>
            </span>
          )}
        </div>

        {total === 0 ? (
          <div className="dim" style={{ padding: '32px 0', textAlign: 'center' }}>
            Keine Spieler zu bewerten.
          </div>
        ) : (
          <div className="rc-list">
            {shown.map((r, i) => {
              const cls = r.change > 0 ? 'up' : r.change < 0 ? 'down' : 'flat';
              return (
                <div key={r.playerId} className={`rc-row ${cls} ${i === 0 && !done ? 'newest' : ''}`}>
                  <div className="rc-info">
                    <span className="rc-name">{r.playerName}</span>
                    <span className="dim mini">{r.clubShort} · {r.position} · {r.age} J.</span>
                  </div>
                  <div className="rc-ovr">
                    <b className="rc-old">{r.oldOverall}</b>
                    <span className="rc-arrow">→</span>
                    <b className={r.change > 0 ? 'green' : r.change < 0 ? 'red' : 'accent-text'}>{r.newOverall}</b>
                    <span className={`rc-delta ${cls}`}>
                      {r.change > 0 ? `▲ +${r.change}` : r.change < 0 ? `▼ ${r.change}` : '●'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rc-controls">
          {!done ? (
            <>
              <button className="btn-sm rc-btn" onClick={() => step(1)}>x1</button>
              <button className="btn-sm rc-btn" onClick={() => step(2)}>x2</button>
              <button className="btn-sm btn-ghost" onClick={skip}>Überspringen</button>
            </>
          ) : (
            <button className="btn-continue paused" onClick={onClose}>✓ Fertig</button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TRANSFERS
// =============================================================================
function TransfersView({ g, onDone }: { g: Game; onDone: () => void }) {
  const available = getAvailablePlayers(g.players, g.managedClubId).slice(0, 40);
  const club = g.clubs[g.managedClubId];
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<string | null>(null);

  const buy = (p: Player) => {
    const amount = Math.round(p.contract.transferValue * 1.05);
    const wage = Math.round(p.contract.weeklyWage * 1.1);
    const res = makeOffer(club, p, g.clubs, g.players, amount, wage);
    setMsg(res.message);
    onDone();
  };

  const selP = sel ? g.players[sel] : null;

  return (
    <div className="page">
      <PageHead
        icon="transfers"
        title="Transfermarkt"
        right={<span className="pill" style={{ fontSize: 13 }}>Budget: <b className="accent-text" style={{ marginLeft: 4 }}>{fmtDM(club.finances.transferBudget)}</b></span>}
      />
      {msg && <div className={`card ${msg.includes('abgeschlossen') ? 'green' : 'red'}`} style={{ padding: 12 }}>{msg}</div>}
      <div className="card">
        <div className="table-scroll">
          <table>
            <thead><tr><th></th><th>Name</th><th>Verein</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Pot.</th><th>Wert</th><th></th></tr></thead>
            <tbody>
              {available.map((p) => {
                const c = g.clubs[p.clubId];
                return (
                  <tr key={p.id}>
                    <td className="clickable" style={{ width: 34 }} onClick={() => setSel(p.id)}>{c && <PlayerAvatar player={p} club={c} size="small" />}</td>
                    <td className="clickable" style={{ fontWeight: 600 }} onClick={() => setSel(p.id)}>{p.fullName}</td>
                    <td className="dim">{c?.shortName}</td>
                    <td>{p.naturalPosition}</td>
                    <td>{p.age}</td>
                    <td><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
                    <td className="stars" style={{ fontSize: 11 }}>{renderStars(p.potentialStars)}</td>
                    <td className="dim">{fmtDM(p.contract.transferValue)}</td>
                    <td><button className="btn-sm btn-primary" onClick={() => buy(p)}>Angebot</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selP && <PlayerModal player={selP} club={g.clubs[selP.clubId]} onClose={() => setSel(null)} />}
    </div>
  );
}

// =============================================================================
// NACHRICHTEN (Liste + E-Mail-Detailansicht)
// =============================================================================
function NewsView({ g, onRead }: { g: Game; onRead: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const list = filter === 'unread' ? g.messages.filter((m) => !m.read) : g.messages;
  const open = openId ? g.messages.find((m) => m.id === openId) ?? null : null;
  const unread = unreadCount(g.messages);

  const openMsg = (m: InboxMessage) => {
    if (!m.read) { m.read = true; onRead(); }
    setOpenId(m.id);
  };
  const markAllRead = () => { g.messages.forEach((m) => (m.read = true)); onRead(); };

  return (
    <div className="page">
      <PageHead
        icon="news"
        title={<>Nachrichten {unread > 0 && <span className="accent">({unread} ungelesen)</span>}</>}
        right={<>
          <button className={`btn-sm ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Alle</button>
          <button className={`btn-sm ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Ungelesen</button>
          <button className="btn-sm" onClick={markAllRead} disabled={unread === 0}>Alle gelesen</button>
        </>}
      />

      <div className="card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div className="dim" style={{ padding: 24, textAlign: 'center' }}>Keine Nachrichten.</div>
        ) : (
          <div className="msg-list">
            {list.map((m) => {
              const meta = CATEGORY_META[m.category];
              return (
                <div key={m.id} className={`msg-item ${m.read ? '' : 'unread'}`} onClick={() => openMsg(m)}>
                  <div className="msg-ico">{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="msg-top">
                      <span className="msg-from">{m.from}</span>
                      <span className="msg-cat">{meta.label}</span>
                      <span className="msg-date">{CalendarEngine.formatDate(m.date)}</span>
                    </div>
                    <div className="msg-subject">{!m.read && <span className="unread-dot" />}{m.subject}</div>
                    <div className="msg-preview dim">{m.shortText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && <MessageModal msg={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MessageModal({ msg, onClose }: { msg: InboxMessage; onClose: () => void }) {
  const meta = CATEGORY_META[msg.category];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div className="row">
            <span className="pill">{meta.icon} {meta.label}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <h2 style={{ margin: '12px 0 6px', fontSize: 20 }}>{msg.subject}</h2>
          <div className="dim mini" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Von: <b style={{ color: 'var(--text)' }}>{msg.from}</b></span>
            <span>Datum: {CalendarEngine.formatDate(msg.date)}</span>
          </div>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {msg.bodyText}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ENTWICKLER-WIKI (durchsuchbar, Kategorien)
// =============================================================================
/**
 * Synthetischer Wiki-Eintrag, der beim Öffnen die interaktive Chronik-Zeitleiste
 * (ChronicleView) rendert statt Markdown. So ist die „Chronik der Epochen" direkt
 * über die Wiki-Kapitelnavigation erreichbar.
 */
const CHRONICLE_WIKI_ID = 'chronicle-timeline';
const CHRONICLE_WIKI_ENTRY: WikiArticle = {
  id: CHRONICLE_WIKI_ID,
  category: 'chronicle',
  title: 'Chronik der Epochen – Historische Zeitleiste',
  keywords: ['chronik', 'epoche', 'epochen', 'zeitleiste', 'meilenstein', 'meilensteine', 'timeline', 'historie', 'geschichte', '3-punkte-regel'],
  body: 'Interaktive Zeitleiste aller historischen Meilensteine von 1975 bis in die 2030er.',
};

function WikiView({ g }: { g: Game }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  // Passt der Chronik-Eintrag zum aktuellen Suchtext?
  const q = query.trim().toLowerCase();
  const chronMatches = !q
    || CHRONICLE_WIKI_ENTRY.title.toLowerCase().includes(q)
    || (CHRONICLE_WIKI_ENTRY.keywords ?? []).some((k) => k.includes(q));

  let results = searchWiki(query);
  if (cat !== 'all') results = results.filter((a) => a.category === cat);
  // Chronik-Zeitleiste als ersten Eintrag der Chronik-Kategorie einblenden.
  if ((cat === 'all' || cat === 'chronicle') && chronMatches) {
    results = [CHRONICLE_WIKI_ENTRY, ...results];
  }
  const open = openId
    ? (openId === CHRONICLE_WIKI_ID ? CHRONICLE_WIKI_ENTRY : WIKI_ARTICLES.find((a) => a.id === openId) ?? null)
    : null;

  // Kategorien, die tatsächlich Treffer haben (bei aktiver Suche).
  const catsWithHits = new Set(searchWiki(query).map((a) => a.category));
  if (chronMatches) catsWithHits.add('chronicle');

  return (
    <div className="page">
      <PageHead icon="wiki" title={<>Entwickler-Wiki <span className="accent">· Spielmechaniken</span></>} />
      <div className="wiki-layout">
        {/* Sidebar */}
        <aside className="wiki-side card">
          <input
            className="wiki-search"
            placeholder="🔎 Suchen…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
          />
          <button className={`wiki-cat ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
            📚 Alle Kategorien
          </button>
          {WIKI_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`wiki-cat ${cat === c.id ? 'active' : ''} ${query && !catsWithHits.has(c.id) ? 'faded' : ''}`}
              onClick={() => setCat(c.id)}
            >
              {c.icon} {c.title}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="wiki-content">
          {open ? (
            <div className="card">
              <button className="btn-sm mb12" onClick={() => setOpenId(null)}>← Zurück zur Liste</button>
              {open.id === CHRONICLE_WIKI_ID ? <ChronicleView g={g} embedded /> : <WikiBody text={open.body} />}
            </div>
          ) : results.length === 0 ? (
            <div className="card dim" style={{ textAlign: 'center', padding: 30 }}>Keine Treffer für „{query}".</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((a) => {
                const c = WIKI_CATEGORIES.find((x) => x.id === a.category);
                return (
                  <div key={a.id} className="card hoverable clickable" onClick={() => setOpenId(a.id)}>
                    <div className="dim2 mini">{c?.icon} {c?.title}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2 }}>{a.title}</div>
                    <div className="dim mini mt8">{firstLine(a.body)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Extrahiert eine kurze Vorschauzeile aus dem Markdown-Body. */
function firstLine(body: string): string {
  const line = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('```'));
  return (line ?? '').replace(/[*`|]/g, '').slice(0, 120);
}

/** Leichtgewichtiger Markdown-Renderer für Wiki-Artikel. */
function WikiBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  let tableRows: string[][] = [];
  let code: string[] = [];
  let inCode = false;
  let key = 0;

  const flushList = () => {
    if (list.length) {
      blocks.push(<ul key={key++} className="wiki-ul">{list.map((li, i) => <li key={i}>{inline(li)}</li>)}</ul>);
      list = [];
    }
  };
  const flushTable = () => {
    if (tableRows.length) {
      const [head, ...body] = tableRows;
      blocks.push(
        <div key={key++} className="table-scroll"><table className="wiki-table">
          <thead><tr>{head.map((h, i) => <th key={i}>{inline(h)}</th>)}</tr></thead>
          <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      tableRows = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim().startsWith('```')) {
      if (inCode) { blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>); code = []; inCode = false; }
      else { flushList(); flushTable(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }

    if (line.startsWith('## ')) { flushList(); flushTable(); blocks.push(<h4 key={key++} className="wiki-h">{inline(line.slice(3))}</h4>); continue; }
    if (line.startsWith('### ')) { flushList(); flushTable(); blocks.push(<h5 key={key++} className="wiki-h5">{inline(line.slice(4))}</h5>); continue; }
    if (line.startsWith('- ')) { flushTable(); list.push(line.slice(2)); continue; }
    if (line.trim().startsWith('|')) {
      flushList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // Trennzeile
      tableRows.push(cells);
      continue;
    }
    flushList(); flushTable();
    if (line.trim()) blocks.push(<p key={key++} className="wiki-p">{inline(line)}</p>);
  }
  flushList(); flushTable();
  if (code.length) blocks.push(<pre key={key++} className="wiki-code">{code.join('\n')}</pre>);

  return <div className="wiki-body">{blocks}</div>;
}

/** Inline-Formatierung: **fett** und `code`. */
function inline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<b key={k++}>{tok.slice(2, -2)}</b>);
    else parts.push(<code key={k++} className="wiki-inline-code">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// =============================================================================
// MATCH-BERICHT / LIVE-TICKER
// =============================================================================
function MatchModal({ g, matchId, onClose }: { g: Game; matchId: string; onClose: () => void }) {
  const cupTie = matchId.startsWith('cup_') ? findTie(g.cup, matchId) : null;
  const m = (g.fixtures.find((x) => x.id === matchId) ?? cupTie?.match)!;
  const h = g.clubs[m.homeClubId]; const a = g.clubs[m.awayClubId];
  const headerLabel = cupTie ? `DFB-Pokal · ${ROUND_NAMES[cupTie.round]}` : `${m.matchday}. Spieltag`;
  const keyEvents = m.events.filter((e) =>
    ['goal', 'penalty_goal', 'own_goal', 'red_card', 'yellow_red_card', 'half_time', 'full_time', 'kickoff', 'injury',
     'extra_time_start', 'extra_time_half', 'extra_time_end', 'shootout_start', 'shootout_goal', 'shootout_miss', 'shootout_end'].includes(e.type));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div className="row">
            <span className="dim mini">{headerLabel}</span>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '14px 0 6px' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <ClubCrest club={h} size={48} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>{h.shortName}</div>
            </div>
            <div className="big-num" style={{ color: 'var(--accent)' }}>
              {m.result?.homeGoals}:{m.result?.awayGoals}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <ClubCrest club={a} size={48} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>{a.shortName}</div>
            </div>
          </div>
          {m.result && (
            <div className="dim mini" style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
              <span>Ballbesitz {m.result.homePossession}%</span>
              <span>Schüsse {m.result.homeShots}:{m.result.awayShots}</span>
              <span>Zuschauer {m.result.attendance.toLocaleString('de-DE')}</span>
            </div>
          )}
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <div className="ticker" style={{ maxHeight: 'none' }}>
            {keyEvents.map((e) => (
              <div key={e.id} className="ticker-item"><span className="accent-text" style={{ marginRight: 8, fontWeight: 700 }}>{e.minute}'</span>{e.commentary}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// =============================================================================
// FINANZEN
// =============================================================================
/** Voller DM-Betrag mit Tausenderpunkten (z.B. "1.240.000 DM"). */
const fmtFullDM = (n: number) => `${Math.round(n).toLocaleString('de-DE')} DM`;
/** Kompakte DM-Darstellung: Tsd. für kleine, Mio. für große Beträge. */
const fmtCompactDM = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. DM`;
  return `${Math.round(n / 1000).toLocaleString('de-DE')} Tsd. DM`;
};

const INCOME_ROWS: { key: keyof ClubFinances['income']; label: string; icon: ReactNode }[] = [
  { key: 'ticketSales', label: 'Stadioneinnahmen', icon: '🎟️' },
  { key: 'catering', label: 'Catering / Würstchenbuden', icon: <Icon name="catering" /> },
  { key: 'matchday', label: 'Programmhefte & Spieltag', icon: <Icon name="marketing" /> },
  { key: 'merchandise', label: 'Fanartikel', icon: '🧣' },
  { key: 'tvMoney', label: 'TV- & Mediengelder', icon: '📺' },
  { key: 'sponsorship', label: 'Trikotsponsoring', icon: '🤝' },
  { key: 'advertising', label: 'Bandenwerbung', icon: <Icon name="sponsoring" /> },
  { key: 'membership', label: 'Mitgliedsbeiträge', icon: <Icon name="fans" /> },
  { key: 'prizeMoney', label: 'Prämien', icon: <Icon name="trophy" /> },
  { key: 'transferIncome', label: 'Transfererlöse', icon: '📈' },
  { key: 'other', label: 'Sonstiges', icon: '💼' },
];
const EXPENSE_ROWS: { key: keyof ClubFinances['expenses']; label: string; icon: ReactNode }[] = [
  { key: 'wages', label: 'Spielergehälter', icon: '👤' },
  { key: 'staffWages', label: 'Betreuerstab', icon: '🧑‍🏫' },
  { key: 'stadiumMaintenance', label: 'Stadionunterhalt', icon: <Icon name="stadium" /> },
  { key: 'facilities', label: 'Gebäude-Fixkosten', icon: <Icon name="facilities" /> },
  { key: 'trainingFacilities', label: 'Trainingsbetrieb (alt)', icon: '🎯' },
  { key: 'other', label: 'Sonstige Fixkosten', icon: '🧾' },
  { key: 'transferExpense', label: 'Transferausgaben', icon: '📉' },
];

/** Selbstgebauter SVG-Linien-Graph für den Kontostand-Verlauf (Dark-Theme). */
function BalanceChart({ points, current, currentDate }: {
  points: { date: string; balance: number }[]; current: number; currentDate: string;
}) {
  const data = [...points, { date: currentDate, balance: Math.round(current) }];
  const W = 640, H = 200, PL = 8, PR = 8, PT = 16, PB = 24;
  if (data.length < 2) {
    // Spielstart: noch keine Historie -> einen Startpunkt einen Monat vor dem aktuellen
    // Datum auf dem Startkontostand synthetisieren, damit sofort ein Verlauf sichtbar ist
    // (zunaechst flache Linie, die sich mit jedem Monatsabschluss fuellt).
    const d0 = new Date(currentDate + 'T00:00:00Z');
    d0.setUTCMonth(d0.getUTCMonth() - 1);
    data.unshift({ date: d0.toISOString().slice(0, 10), balance: Math.round(current) });
  }
  const vals = data.map((d) => d.balance);
  let min = Math.min(...vals, 0), max = Math.max(...vals, 0);
  if (min === max) { min -= 1; max += 1; }
  const iw = W - PL - PR, ih = H - PT - PB;
  const x = (i: number) => PL + (i / (data.length - 1)) * iw;
  const y = (v: number) => PT + (1 - (v - min) / (max - min)) * ih;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.balance).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(PT + ih).toFixed(1)} L ${PL} ${(PT + ih).toFixed(1)} Z`;
  const zeroY = y(0);
  const mmLabel = (iso: string) => {
    const d = new Date(iso + 'T00:00:00Z');
    return `${['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][d.getUTCMonth()]}`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="balArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {min < 0 && max > 0 && (
        <line x1={PL} y1={zeroY} x2={W - PR} y2={zeroY} stroke="var(--red)" strokeDasharray="3 3" strokeOpacity="0.6" />
      )}
      <path d={area} fill="url(#balArea)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.balance)} r={i === data.length - 1 ? 4 : 2.5}
            fill={d.balance < 0 ? 'var(--red)' : 'var(--accent)'} />
          {(i === 0 || i === data.length - 1 || i % 2 === 0) && (
            <text x={x(i)} y={H - 6} fill="var(--text-3)" fontSize="10" textAnchor="middle">{mmLabel(d.date)}</text>
          )}
        </g>
      ))}
      <text x={PL} y={11} fill="var(--text-3)" fontSize="10">{fmtCompactDM(max)}</text>
      <text x={PL} y={PT + ih + 0} fill="var(--text-3)" fontSize="10">{fmtCompactDM(min)}</text>
    </svg>
  );
}

/** Horizontaler Balken für einen Einnahme-/Ausgabeposten. */
function FinBar({ label, icon, value, max, color }: {
  label: string; icon: ReactNode; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="fin-bar-row">
      <div className="fin-bar-label"><span>{icon}</span> {label}</div>
      <div className="fin-bar-track"><div className="fin-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <div className="fin-bar-val">{value > 0 ? fmtCompactDM(value) : '–'}</div>
    </div>
  );
}

function FinancesView({ g }: { g: Game }) {
  const club = g.clubs[g.managedClubId];
  const fin = club.finances;
  const income = totalIncome(fin);
  const expense = totalExpense(fin);
  const net = income - expense;

  const monthly = computeMonthly(club, g.players, g.table);
  const homeRemaining = g.fixtures.filter(
    (m) => m.homeClubId === g.managedClubId && m.status === 'scheduled',
  ).length;
  const forecast = forecastSeasonEnd(
    club, g.players, g.table, g.calendar.currentDate, g.calendar.seasonEndDate, homeRemaining,
  );

  const weekly = weeklyWageBill(club, g.players);
  const wageBudget = fin.wageBudget;
  const wagePct = wageBudget > 0 ? Math.min(100, (weekly / wageBudget) * 100) : 0;

  const maxIncome = Math.max(1, ...INCOME_ROWS.map((r) => fin.income[r.key]));
  const maxExpense = Math.max(1, ...EXPENSE_ROWS.map((r) => fin.expenses[r.key]));

  const warnings: string[] = [];
  if (fin.balance < 0) warnings.push(`Das Konto ist mit ${fmtFullDM(fin.balance)} im Minus.`);
  if (forecast.projectedEndBalance < 0) warnings.push(`Die Hochrechnung sagt zum Saisonende ${fmtFullDM(forecast.projectedEndBalance)} voraus – ein negatives Ergebnis.`);
  if (weekly > wageBudget) warnings.push(`Die Gehaltssumme (${fmtCompactDM(weekly)}/Woche) übersteigt das Gehaltsbudget (${fmtCompactDM(wageBudget)}/Woche).`);
  if (monthly.net < 0) warnings.push(`Die laufenden Monatskosten übersteigen die festen Monatserträge um ${fmtCompactDM(-monthly.net)} – Heimspiele müssen dies ausgleichen.`);

  return (
    <div className="fin-wrap">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Finanzen"
        right={<span className="dim">Saison {g.season} · in Deutscher Mark (DM)</span>}
      />

      {/* KONTOSTAND & BUDGETS */}
      <div className="fin-hero">
        <div className="fin-hero-main">
          <div className="dim mini">Kontostand</div>
          <div className="fin-balance" style={{ color: fin.balance < 0 ? 'var(--red)' : 'var(--accent)' }}>
            {fmtFullDM(fin.balance)}
          </div>
          <div className="fin-hero-sub">
            <span>Saldo Saison: <b style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{fmtCompactDM(net)}</b></span>
            <span>Monatssaldo (fix): <b style={{ color: monthly.net >= 0 ? 'var(--green)' : 'var(--red)' }}>{monthly.net >= 0 ? '+' : ''}{fmtCompactDM(monthly.net)}</b></span>
          </div>
        </div>
        <div className="fin-budgets">
          <div className="fin-budget-card">
            <div className="dim mini">Transferbudget</div>
            <div className="fin-budget-val accent-text">{fmtCompactDM(fin.transferBudget)}</div>
          </div>
          <div className="fin-budget-card">
            <div className="dim mini">Gehaltsbudget / Woche</div>
            <div className="fin-budget-val">{fmtCompactDM(wageBudget)}</div>
            <div className="fin-bar-track" style={{ marginTop: 6 }}>
              <div className="fin-bar-fill" style={{ width: `${wagePct}%`, background: vColor(100 - wagePct) }} />
            </div>
            <div className="dim mini" style={{ marginTop: 3 }}>
              belegt: {fmtCompactDM(weekly)} ({Math.round(wagePct)}%)
            </div>
          </div>
        </div>
      </div>

      {/* WARNUNGEN */}
      {warnings.length > 0 && (
        <div className="fin-warn">
          <div className="fin-warn-title">⚠️ Warnungen</div>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {/* GRAPH */}
      <div className="card fin-chart-card">
        <div className="card-title">📊 Kontostand-Verlauf (Monatsabschlüsse)</div>
        <BalanceChart points={fin.balanceHistory ?? []} current={fin.balance} currentDate={g.calendar.currentDate} />
      </div>

      {/* EINNAHMEN / AUSGABEN */}
      <div className="fin-cols">
        <div className="card">
          <div className="card-title">Einnahmen (Saison) · <span className="accent-text">{fmtCompactDM(income)}</span></div>
          {INCOME_ROWS.map((r) => (
            <FinBar key={r.key} label={r.label} icon={r.icon} value={fin.income[r.key]} max={maxIncome} color="var(--green)" />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Ausgaben (Saison) · <span style={{ color: 'var(--red)' }}>{fmtCompactDM(expense)}</span></div>
          {EXPENSE_ROWS.map((r) => (
            <FinBar key={r.key} label={r.label} icon={r.icon} value={fin.expenses[r.key]} max={maxExpense} color="var(--orange)" />
          ))}
        </div>
      </div>

      {/* PROGNOSE */}
      <div className="card">
        <div className="card-title">🔮 Prognose bis Saisonende</div>
        <div className="fin-forecast">
          <div className="fin-fc-item"><div className="dim mini">Verbleibende Monate</div><div className="fin-fc-val">{forecast.monthsRemaining.toLocaleString('de-DE')}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Heimspiele übrig</div><div className="fin-fc-val">{forecast.homeMatchesRemaining}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Erwartete Einnahmen</div><div className="fin-fc-val" style={{ color: 'var(--green)' }}>+{fmtCompactDM(forecast.projectedIncome)}</div></div>
          <div className="fin-fc-item"><div className="dim mini">Erwartete Ausgaben</div><div className="fin-fc-val" style={{ color: 'var(--red)' }}>-{fmtCompactDM(forecast.projectedExpense)}</div></div>
          <div className="fin-fc-item fin-fc-highlight">
            <div className="dim mini">Erwarteter Endkontostand</div>
            <div className="fin-fc-val" style={{ color: forecast.projectedEndBalance < 0 ? 'var(--red)' : 'var(--accent)' }}>
              {fmtFullDM(forecast.projectedEndBalance)}
            </div>
          </div>
        </div>
        <div className="dim mini" style={{ marginTop: 8 }}>
          Hochrechnung: aktueller Kontostand + (fester Monatssaldo × Restmonate) + (erwartete Heimspiel-Einnahmen × Restheimspiele).
        </div>
      </div>

      {/* LETZTE BUCHUNGEN */}
      <div className="card">
        <div className="card-title">🧾 Letzte Buchungen</div>
        {fin.transactions.length === 0 ? (
          <div className="dim" style={{ padding: 8 }}>Noch keine Buchungen in dieser Saison.</div>
        ) : (
          <table className="fin-tx-table">
            <tbody>
              {fin.transactions.slice(0, 25).map((t) => (
                <tr key={t.id}>
                  <td className="dim mini" style={{ whiteSpace: 'nowrap' }}>{CalendarEngine.formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: t.amount >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                    {t.amount >= 0 ? '+' : '−'}{fmtFullDM(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}



// =============================================================================
// JUGEND (Jugendakademie) — Talentliste + Detail mit verstecktem Potenzial
// =============================================================================
type YouthSort = 'pot' | 'ovr' | 'age';

/** Rendert die Scouting-Einschätzung als GOLDENE Sterne-Spanne (min–max). */
function ScoutRange({ p }: { p: Player }) {
  const min = p.scoutedPotentialMin ?? p.potentialStars;
  const max = p.scoutedPotentialMax ?? p.potentialStars;
  if (Math.abs(max - min) < 0.001) {
    return <span className="stars" title={`Potenzial: ${min.toFixed(1)} Sterne`}>{renderStars(min)}</span>;
  }
  return (
    <span title={`Scouting-Spanne: ${min.toFixed(1)}–${max.toFixed(1)} Sterne`} style={{ whiteSpace: 'nowrap' }}>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(min)}</span>
      <span className="dim2 mini" style={{ margin: '0 4px' }}>bis</span>
      <span className="stars" style={{ fontSize: 11 }}>{renderStars(max)}</span>
    </span>
  );
}

function YouthView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<YouthSort>('pot');
  const [classFilter, setClassFilter] = useState<YouthAgeClass | 'ALL'>('ALL');
  const club = g.clubs[g.managedClubId];
  const acadLevel = club.infrastructure.youthAcademy;

  const sortFn = (a: Player, b: Player) => {
    switch (sortBy) {
      case 'ovr': return b.overall - a.overall;
      case 'age': return a.age - b.age;
      default: {
        const am = a.scoutedPotentialMax ?? a.potentialStars;
        const bm = b.scoutedPotentialMax ?? b.potentialStars;
        return (bm - am) || (b.overall - a.overall);
      }
    }
  };

  const youth = club.youthPlayerIds
    .map((id) => g.youthPlayers[id])
    .filter(Boolean);

  // Talente nach Altersklasse G–A gruppieren.
  const byClass: Record<YouthAgeClass, Player[]> = { G: [], F: [], E: [], D: [], C: [], B: [], A: [] };
  for (const pl of youth) {
    const cls = youthAgeClass(pl.age);
    if (cls) byClass[cls].push(pl);
  }
  for (const cls of YOUTH_AGE_CLASS_ORDER) byClass[cls].sort(sortFn);

  const visibleClasses = YOUTH_AGE_CLASS_ORDER.filter(
    (cls) => (classFilter === 'ALL' || classFilter === cls) && byClass[cls].length > 0,
  );

  const p = sel ? g.youthPlayers[sel] : null;

  const SortBtn = ({ k, label }: { k: YouthSort; label: string }) => (
    <button className={`btn-sm ${sortBy === k ? 'active' : ''}`} onClick={() => setSortBy(k)}>{label}</button>
  );

  const YouthTable = ({ rows }: { rows: Player[] }) => (
    <div className="table-scroll">
      <table className="squad-table">
        <thead>
          <tr>
            <th>Name</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Potenzial (Scouting)</th>
            <th title="Tempo">TMP</th><th title="Technik">TEC</th><th title="Passspiel">PAS</th>
            <th title="Zweikampf">ZWK</th><th title="Torschuss">TOR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pl) => (
            <tr key={pl.id} className="clickable" onClick={() => setSel(pl.id)}>
              <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{pl.fullName}</td>
              <td><span className="pos-tag">{pl.naturalPosition}</span></td>
              <td>{pl.age}</td>
              <td><b style={{ color: vColor(pl.overall) }}>{pl.overall}</b></td>
              <td><ScoutRange p={pl} /></td>
              <td style={{ color: vColor(pl.attributes.speed) }}>{pl.attributes.speed}</td>
              <td style={{ color: vColor(pl.attributes.technique) }}>{pl.attributes.technique}</td>
              <td style={{ color: vColor(pl.attributes.passing) }}>{pl.attributes.passing}</td>
              <td style={{ color: vColor(pl.attributes.tackling) }}>{pl.attributes.tackling}</td>
              <td style={{ color: vColor(pl.attributes.shooting) }}>{pl.attributes.shooting}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="youth-academy">
      <div className="youth-hero card">
        <div className="youth-hero-title">🧒 Jugendakademie</div>
        <div className="youth-hero-sub dim">
          {club.name} · Jahrgänge von der G-Jugend (Bambini) bis zur A-Jugend
        </div>
        <div className="youth-hero-pills">
          <span className="pill">Akademie-Stufe <b style={{ marginLeft: 4 }}>{acadLevel}/{MAX_LEVEL}</b></span>
          <span className="pill">Talente gesamt <b style={{ marginLeft: 4 }}>{youth.length}</b></span>
        </div>
        <div className="dim mini mt8">
          Neue G-Jugend-Talente (Bambini, 7 Jahre) treffen jeweils zum <b>1. Juli</b> ein; alle Jahrgänge rücken
          dann eine Altersklasse auf. Am Ende der A-Jugend (mit ~19&nbsp;Jahren) verlassen die Talente die
          Akademie – die besten werden in den Profikader hochgezogen. Anzahl, Qualität und Lernrate hängen
          von der Akademie-Stufe ab (Ausbau im Bereich <b>Gelände</b>).
        </div>
      </div>

      <div className="row mt12">
        <div className="youth-class-tabs">
          <button
            className={`btn-sm ${classFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setClassFilter('ALL')}
          >
            Alle <span className="dim2">({youth.length})</span>
          </button>
          {YOUTH_AGE_CLASS_ORDER.map((cls) => (
            <button
              key={cls}
              className={`btn-sm ${classFilter === cls ? 'active' : ''}`}
              onClick={() => setClassFilter(cls)}
              disabled={byClass[cls].length === 0}
            >
              {YOUTH_AGE_CLASS_LABEL[cls]} <span className="dim2">({byClass[cls].length})</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="dim mini">Sortieren:</span>
          <SortBtn k="pot" label="Potenzial" />
          <SortBtn k="ovr" label="OVR" />
          <SortBtn k="age" label="Alter" />
        </div>
      </div>

      {youth.length === 0 ? (
        <div className="card mt12 dim" style={{ padding: 16 }}>
          Aktuell befinden sich keine Talente in der Akademie. Der nächste G-Jugend-Jahrgang (Bambini) trifft zum 1. Juli ein.
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className="card mt12 dim" style={{ padding: 16 }}>
          In dieser Altersklasse befinden sich derzeit keine Talente.
        </div>
      ) : (
        visibleClasses.map((cls) => (
          <div key={cls} className="youth-class-section card mt12">
            <div className="youth-class-head">
              <div className="youth-class-badge">{cls}</div>
              <div>
                <div className="youth-class-name">{YOUTH_AGE_CLASS_LABEL[cls]}</div>
                <div className="dim2 mini">{YOUTH_AGE_CLASS_RANGE[cls]}</div>
              </div>
              <span className="pill" style={{ marginLeft: 'auto' }}>{byClass[cls].length} Talent(e)</span>
            </div>
            <YouthTable rows={byClass[cls]} />
          </div>
        ))
      )}

      {youth.length > 0 && (
        <div className="dim2 mini mt12">
          Das echte Potenzial eines Talents ist verborgen – die Scouts geben nur eine <b>Sterne-Spanne</b> an.
          Je jünger das Talent (G/F/E-Jugend), desto breiter die Spanne; mit steigendem Alter und höherer
          Akademie-Stufe engt sie sich an den wahren Wert an. Klicke eine Zeile für Details und zum Hochziehen
          in den Profikader.
        </div>
      )}

      {p && (
        <YouthModal
          g={g} player={p} club={club}
          onClose={() => setSel(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}

const YOUTH_ATTR_GROUPS: { title: string; keys: (keyof Player['attributes'])[] }[] = [
  { title: 'Technisch', keys: ['technique', 'firstTouch', 'shooting', 'shotPower', 'longShots', 'passing', 'longPassing', 'crossing', 'dribbling', 'ballControl', 'heading'] },
  { title: 'Defensiv', keys: ['tackling', 'marking', 'positioning', 'interceptions'] },
  { title: 'Physisch', keys: ['stamina', 'speed', 'acceleration', 'strength', 'jumping', 'agility', 'balance'] },
  { title: 'Mental', keys: ['vision', 'composure', 'concentration', 'decisions', 'workRate', 'teamwork', 'flair'] },
];
const YOUTH_GK_GROUP: { title: string; keys: (keyof Player['attributes'])[] } =
  { title: 'Torwart', keys: ['reflexes', 'handling', 'kicking', 'aerialReach', 'oneOnOnes', 'communication'] };

function YouthModal({ g, player, club, onClose, onChange }: {
  g: Game; player: Player; club: Club; onClose: () => void; onChange: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const p = player;
  const groups = p.naturalPosition === 'TW' ? [YOUTH_GK_GROUP, ...YOUTH_ATTR_GROUPS] : YOUTH_ATTR_GROUPS;
  const squadFull = club.playerIds.length >= 26;

  const doPromote = () => {
    const res = promoteYouth(club, p.id, g.players, g.youthPlayers, 26);
    if (res.ok) {
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'training', from: 'Leiter Jugendakademie',
        subject: `${p.fullName} in den Profikader hochgezogen`,
        shortText: `${p.fullName} ist jetzt Teil der A-Mannschaft.`,
        bodyText: `${p.fullName} (${p.naturalPosition}, ${p.age} Jahre) wurde aus der Jugendakademie in den Profikader hochgezogen. `
          + `Das endgültige Potenzial steht nun fest: ${renderStars(p.potentialStars)} (max. Gesamtstärke ${starsToPotential(p.potentialStars)}).`,
      }));
      onChange();
      onClose();
    } else {
      setMsg(res.reason ?? 'Hochziehen nicht möglich');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 18, padding: 20, borderBottom: '1px solid var(--border)',
          background: `linear-gradient(120deg, ${club.colors.primary}22, transparent)` }}>
          <div style={{ flexShrink: 0 }}>
            <PlayerAvatar player={p} club={club} size="large" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 24 }}>{p.fullName}</h2>
                <div className="dim mt8" style={{ fontSize: 14 }}>
                  {(() => { const cls = youthAgeClass(p.age); return cls ? `${YOUTH_AGE_CLASS_LABEL[cls]} (${YOUTH_AGE_CLASS_RANGE[cls]})` : 'Jungtalent'; })()}
                  {' '}&middot; {p.naturalPosition} &middot; {p.age} Jahre &middot; {p.nationality}
                </div>
                <div className="mt8" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="pill" style={{ color: vColor(p.overall) }}>OVR <b style={{ marginLeft: 4 }}>{p.overall}</b></span>
                  <span className="pill">Potenzial (Scouting): <span style={{ marginLeft: 6 }}><ScoutRange p={p} /></span></span>
                  <span className="pill">{p.height} cm · {p.weight} kg</span>
                </div>
              </div>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px 22px', overflowY: 'auto' }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="dim mini">
              🔎 <b>Verstecktes Potenzial:</b> Die Scouts schätzen das Potenzial dieses Talents auf eine Spanne
              von <b>{(p.scoutedPotentialMin ?? p.potentialStars).toFixed(2)}</b> bis
              <b> {(p.scoutedPotentialMax ?? p.potentialStars).toFixed(2)}</b> Sternen. Je länger das Talent gefördert wird
              (und je besser die Akademie), desto genauer wird diese Einschätzung – bis der wahre Wert feststeht.
            </div>
          </div>

          {groups.map((grp) => (
            <div key={grp.title} style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: 13, marginBottom: 6 }}>{grp.title}</div>
              <div className="youth-attr-grid">
                {grp.keys.map((k) => {
                  const val = p.attributes[k] as number;
                  return (
                    <div key={k} className="youth-attr-row">
                      <span className="youth-attr-label">{ATTRIBUTE_LABELS_DE[k]}</span>
                      <span className="attr-bar" style={{ flex: 1 }}>
                        <span className="attr-bar-fill" style={{ width: `${val}%`, background: vColor(val), display: 'block', height: '100%' }} />
                      </span>
                      <b style={{ color: vColor(val), width: 24, textAlign: 'right' }}>{val}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: 8 }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Hochziehen in den Profikader</div>
                <div className="dim mini">
                  {squadFull
                    ? 'Der Profikader ist voll (max. 26 Spieler). Gib zuerst einen Spieler ab.'
                    : 'Übernimmt das Talent in die A-Mannschaft. Das Potenzial wird dabei offengelegt.'}
                </div>
                {msg && <div className="red mini mt8">{msg}</div>}
              </div>
              <button className="btn" disabled={squadFull} onClick={doPromote} style={{ marginLeft: 'auto' }}>
                ⬆ Hochziehen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CHRONIK — Epochen & Meilensteine des deutschen Fußballs (1975 → 2030er)
// =============================================================================
function ChronicleView({ g, embedded = false }: { g: Game; embedded?: boolean }) {
  const curYear = seasonStartYear(g.season);
  // Chronologisch nach Saison sortiert.
  const events = [...TIMELINE].sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));
  const fired = new Set(g.firedMilestones);
  const passedCount = events.filter((e) => seasonStartYear(e.season) <= curYear).length;

  return (
    <div className={embedded ? undefined : 'page'}>
      {embedded ? (
        <div className="section-title">Chronik der Epochen – Historische Zeitleiste</div>
      ) : (
        <PageHead icon="chronicle" title="Chronik der Epochen" />
      )}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="dim" style={{ margin: 0 }}>
          Die großen Regel-, Wettbewerbs- und Wirtschafts-Meilensteine des Fußballs von 1975 bis in die 2030er.
          Jeder Meilenstein wird zu Beginn seiner Saison wirksam – erreichte Ereignisse verändern das Spiel real
          (z. B. die 3-Punkte-Regel 1995/96). Aktuelle Saison: <b>{g.season}</b> · {passedCount}/{events.length} Meilensteine erreicht.
        </p>
      </div>

      <div className="chronicle-list">
        {events.map((e) => {
          const meta = TIMELINE_TYPE_META[e.type];
          const evYear = seasonStartYear(e.season);
          const isFired = fired.has(e.id);
          const isPast = evYear < curYear;
          const isCurrent = evYear === curYear;
          const state = isCurrent ? 'current' : isFired || isPast ? 'past' : 'future';
          return (
            <div key={e.id} className={`chronicle-item ${state}`}>
              <div className="chronicle-rail">
                <div className="chronicle-dot" style={{ background: state === 'future' ? 'var(--border)' : meta.color }}>
                  {state === 'future' ? '' : '✓'}
                </div>
              </div>
              <div className="chronicle-body">
                <div className="chronicle-head">
                  <span className="chronicle-icon" title={meta.label}>{meta.icon}</span>
                  <span className="chronicle-year">{e.year}</span>
                  <span className="chronicle-season">Saison {e.season}</span>
                  <span className="chronicle-tag" style={{ borderColor: meta.color, color: meta.color }}>{meta.label}</span>
                  {isCurrent && <span className="chronicle-badge now">Aktuell</span>}
                  {state === 'future' && <span className="chronicle-badge soon">Bevorstehend</span>}
                  {state === 'past' && <span className="chronicle-badge done">Erreicht</span>}
                </div>
                <div className="chronicle-title">{e.title}</div>
                <div className="chronicle-desc">{e.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// VEREINSGELÄNDE (Infrastruktur) — Einrichtungen ausbauen
// =============================================================================
function FacilitiesView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [showFuture, setShowFuture] = useState(false);
  const club = g.clubs[g.managedClubId];
  const infra = club.infrastructure;
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  const FUTURE_UPKEEP_KEYS: FacilityKey[] = ['rehaCenter', 'nlz', 'performanceCenter', 'dataCenter'];

  // Monatliche Fixkosten (Unterhalt) einer einzelnen Einrichtung (era-skaliert).
  const facMonthlyUpkeep = (key: FacilityKey, level: number): number => {
    const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
    if (key === 'catering') return Math.round(CATERING_UPKEEP[cateringMode][lvl] * scale);
    if (key === 'stadium') return 0; // im Stadionunterhalt enthalten
    const base = FAC_UPKEEP_BASE[key];
    if (!base) return 0;
    if (FUTURE_UPKEEP_KEYS.includes(key) && lvl < 2) return 0;
    return Math.round(base * LEVEL_MULT[lvl] * scale);
  };

  const setCateringMode = (mode: CateringMode) => {
    const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
    com.cateringMode = mode;
    onChange();
  };

  const doUpgrade = (key: typeof FACILITIES[number]['key']) => {
    const res = upgradeFacility(club, key, g.calendar.currentDate, club.id === g.managedClubId);
    if (res.ok) {
      const def = FACILITY_BY_KEY[key];
      pushMessage(g.messages, makeMessage({
        date: g.calendar.currentDate, category: 'board', from: 'Vereinsvorstand',
        subject: `Ausbau abgeschlossen: ${def.name} (Stufe ${res.newLevel})`,
        shortText: `${def.name} wurde auf Stufe ${res.newLevel} ausgebaut.`,
        bodyText: `Der Ausbau der Einrichtung „${def.name}" auf Stufe ${res.newLevel} ist abgeschlossen.\n\n`
          + `Kosten: ${fmtDM(res.cost)}\n`
          + `Neuer Effekt: ${def.effectAt(res.newLevel)}\n`
          + `Neuer Kontostand: ${fmtDM(club.finances.balance)}`,
      }));
      setMsg(`✔ ${def.name} auf Stufe ${res.newLevel} ausgebaut (${fmtDM(res.cost)}).`);
      onChange();
    } else {
      setMsg(`⚠ ${res.reason}`);
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Vereinsgelände"
        right={<span className="dim">Kontostand: <b style={{ color: 'var(--accent)' }}>{fmtDM(club.finances.balance)}</b></span>}
      />

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt noch nicht verfügbare Einrichtungen späterer Epochen (ausgegraut).</span>
      </label>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      <div className="fac-grid mt12">
        {FACILITIES.filter((def) => {
          const unlocked = !def.unlockYear || curYear >= def.unlockYear;
          return unlocked || showFuture;
        }).map((def) => {
          const unlocked = !def.unlockYear || curYear >= def.unlockYear;
          const level = infra[def.key] as number;
          const check = canUpgrade(club, def.key);
          const atMax = level >= MAX_LEVEL;
          const nextCost = atMax ? 0 : upgradeCost(def.key, level + 1);
          const affordable = check.ok && unlocked;
          if (!unlocked) {
            return (
              <div key={def.key} className="card fac-card fac-locked">
                <div className="fac-head">
                  <span className="fac-ico">{def.iconName ? <Icon name={def.iconName} /> : def.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fac-name">{def.name}</div>
                    <div className="fac-level">
                      <span className="pill" style={{ color: 'var(--yellow)' }}>ab {def.unlockYear}</span>
                    </div>
                  </div>
                </div>
                <div className="dim mini fac-desc">{def.desc}</div>
                <div className="fac-foot">
                  <span className="dim2 mini">Noch nicht verfügbar — schaltet sich {def.unlockYear} frei.</span>
                </div>
              </div>
            );
          }
          return (
            <div key={def.key} className="card fac-card">
              <div className="fac-head">
                <span className="fac-ico">{def.iconName ? <Icon name={def.iconName} /> : def.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="fac-name">{def.name}</div>
                  <div className="fac-level">
                    {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                      <span key={i} className={`fac-pip ${i < level ? 'on' : ''}`} />
                    ))}
                    <span className="dim mini" style={{ marginLeft: 8 }}>Stufe {level}/{MAX_LEVEL}</span>
                  </div>
                </div>
              </div>
              <div className="dim mini fac-desc">{def.desc}</div>

              <div className="fac-effect">
                <div className="fac-effect-row">
                  <span className="dim2 mini">Aktuell:</span>
                  <span className="mini">{def.effectAt(level)}</span>
                </div>
                {!atMax && (
                  <div className="fac-effect-row">
                    <span className="dim2 mini">Nach Ausbau:</span>
                    <span className="mini accent-text">{def.effectAt(level + 1)}</span>
                  </div>
                )}
                <div className="fac-effect-row">
                  <span className="dim2 mini">Fixkosten / Monat:</span>
                  <span className="mini red">
                    {facMonthlyUpkeep(def.key, level) > 0 ? `−${fmtDM(facMonthlyUpkeep(def.key, level))}` : (def.key === 'stadium' ? 'im Stadionunterhalt' : '—')}
                  </span>
                </div>
              </div>

              {def.key === 'catering' && (
                <div className="fac-effect" style={{ marginTop: 6 }}>
                  <div className="dim2 mini" style={{ marginBottom: 4 }}>Betriebsform (Netto/Besucher · Fixkosten/Monat):</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
                      <button
                        key={m}
                        className={`btn btn-sm ${cateringMode === m ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setCateringMode(m)}
                        title={`${fmtDM(Math.round(CATERING_NETPERHEAD[m][level] * scale))}/Besucher · −${fmtDM(Math.round(CATERING_UPKEEP[m][level] * scale))}/Monat${m === 'verpachtung' ? ` · +${fmtDM(Math.round(CATERING_LEASE[level] * scale))} Pacht/Monat` : ''}`}
                      >
                        {CATERING_MODE_LABEL[m]}
                      </button>
                    ))}
                  </div>
                  <div className="mini dim" style={{ marginTop: 4 }}>
                    Aktuell <b>{CATERING_MODE_LABEL[cateringMode]}</b>: {fmtDM(Math.round(CATERING_NETPERHEAD[cateringMode][level] * scale))}/Besucher
                    {cateringMode === 'verpachtung' && <> · +{fmtDM(Math.round(CATERING_LEASE[level] * scale))} Pacht/Monat</>}
                  </div>
                </div>
              )}

              <div className="fac-foot">
                {atMax ? (
                  <span className="pill" style={{ color: 'var(--green)' }}>Maximalstufe erreicht</span>
                ) : (
                  <>
                    <span className="mini">
                      Ausbau auf Stufe {level + 1}: <b className={affordable ? 'accent-text' : 'red'}>{fmtDM(nextCost)}</b>
                    </span>
                    <button className="btn btn-sm" disabled={!affordable} onClick={() => doUpgrade(def.key)} style={{ marginLeft: 'auto' }}>
                      🔨 Ausbauen
                    </button>
                  </>
                )}
              </div>
              {!atMax && !affordable && (
                <div className="red mini" style={{ marginTop: 6 }}>{check.reason}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dim2 mini mt12">
        Alle Ausbaukosten werden sofort vom Vereinskonto abgebucht (Währung ära-gerecht: {currencyForYear(yearOf(g.calendar.currentDate))}). Effekte:
        <b> Stadion</b> → mehr Zuschauerkapazität & Stadioneinnahmen · <b>Trainingszentrum</b> → schnellere Kaderentwicklung ·
        <b> Jugendakademie</b> → mehr & bessere Talente · <b>Medizin</b> → schnellere Regeneration & kürzere Ausfälle ·
        <b> Fanshop</b> → höherer Fanartikel-Erlös · <b>Catering</b> → Pro-Kopf-Erlös je Heimspiel (Betriebsform waehlbar).
        Jede gebaute Einrichtung verursacht monatliche <b>Fixkosten</b> (oben je Einrichtung ausgewiesen), die im Monatsabschluss gebucht werden.
      </div>
    </div>
  );
}


// =============================================================================
// MITARBEITER (Personal) — anstellbare Rollen, epochenabhängig (Block p11)
// =============================================================================
function StaffView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [showFuture, setShowFuture] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const hired = new Set(g.hiredStaff ?? []);
  const monthly = staffMonthlyTotal(g.hiredStaff ?? [], scale);
  const fx = computeStaffEffects(g.hiredStaff ?? []);

  const toggle = (id: string) => {
    const role = STAFF_BY_ID[id];
    if (!role) return;
    const list = g.hiredStaff ?? (g.hiredStaff = []);
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
      setMsg(`✔ ${role.name} entlassen.`);
    } else {
      list.push(id);
      setMsg(`✔ ${role.name} angestellt (${fmtDM(staffMonthlySalary(role, scale))}/Monat).`);
    }
    onChange();
    setTimeout(() => setMsg(null), 3500);
  };

  const groups: StaffGroupKey[] = ['trainer', 'medical', 'scouting', 'media', 'admin'];

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Mitarbeiter"
        right={<span className="dim">Personalkosten: <b style={{ color: 'var(--accent)' }}>{fmtDM(monthly)}</b>/Monat</span>}
      />

      {/* Aggregierte, gedeckelte Effekte */}
      <div className="card mt12">
        <div className="section-title">Wirkung des Mitarbeiterstabs</div>
        <div className="staff-fx-grid">
          <StaffFxPill label="Verletzungsrisiko" value={`−${Math.round(fx.injuryReduction * 100)} %`} cap={`max −${Math.round(STAFF_CAPS.injuryReduction * 100)} %`} />
          <StaffFxPill label="Ausfallzeit (Reha)" value={`−${Math.round(fx.rehabReduction * 100)} %`} cap={`max −${Math.round(STAFF_CAPS.rehabReduction * 100)} %`} />
          <StaffFxPill label="Regeneration" value={`+${fx.recovery.toFixed(1)}/Tag`} cap={`max +${STAFF_CAPS.recovery}`} />
          <StaffFxPill label="Scouting-Genauigkeit" value={`+${Math.round(fx.scouting * 100)} %`} cap={`max +${Math.round(STAFF_CAPS.scouting * 100)} %`} />
          <StaffFxPill label="Reichweite / Fanbindung" value={`+${Math.round(fx.reach * 100)} %`} cap={`max +${Math.round(STAFF_CAPS.reach * 100)} %`} />
        </div>
        <div className="dim2 mini" style={{ marginTop: 8 }}>
          Alle Effekte sind gedeckelt und wirken nur für deinen Verein. Reha-Verkürzung und Regeneration
          sind im Spiel direkt spürbar (kürzere Ausfälle, schnellere Fitness), die Scouting-Genauigkeit
          präzisiert die Talentbewertung im Nachwuchs. Es gibt bewusst KEINEN direkten Sieg-Bonus.
        </div>
      </div>

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt Rollen späterer Epochen (ausgegraut, noch nicht anstellbar).</span>
      </label>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      {groups.map((grp) => {
        const roles = STAFF_ROLES.filter((r) => r.group === grp)
          .filter((r) => staffAvailable(r, curYear) || showFuture);
        if (roles.length === 0) return null;
        const meta = STAFF_GROUP_META[grp];
        return (
          <div key={grp} className="mt12">
            <div className="section-title">{meta.icon} {meta.label}</div>
            <div className="staff-grid">
              {roles.map((r) => {
                const avail = staffAvailable(r, curYear);
                const isHired = hired.has(r.id);
                const salary = staffMonthlySalary(r, scale);
                return (
                  <div key={r.id} className={`card staff-card ${!avail ? 'fac-locked' : ''} ${isHired ? 'staff-hired' : ''}`}>
                    <div className="staff-card-head">
                      <span className="staff-name">{r.name}</span>
                      <span className="pill staff-cc">{r.costClass}</span>
                    </div>
                    <div className="dim mini staff-effect">{r.effect}</div>
                    <div className="staff-card-foot">
                      {avail ? (
                        <>
                          <span className="mini">{fmtDM(salary)}<span className="dim2">/Monat</span></span>
                          <button
                            className={`btn btn-sm ${isHired ? 'btn-danger' : ''}`}
                            style={{ marginLeft: 'auto' }}
                            onClick={() => toggle(r.id)}
                          >
                            {isHired ? '✕ Entlassen' : '＋ Anstellen'}
                          </button>
                        </>
                      ) : (
                        <span className="pill" style={{ color: 'var(--yellow)' }}>ab {r.unlockYear}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type StaffGroupKey = 'trainer' | 'medical' | 'scouting' | 'media' | 'admin';

function StaffFxPill({ label, value, cap }: { label: string; value: string; cap: string }) {
  return (
    <div className="staff-fx">
      <div className="staff-fx-val accent-text">{value}</div>
      <div className="mini">{label}</div>
      <div className="dim2 mini">{cap}</div>
    </div>
  );
}

// =============================================================================
// MARKETING — Werbe-Regler je Kanal, epochenabhängig (Block p11)
// =============================================================================
function MarketingView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [showFuture, setShowFuture] = useState(false);
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const budgets = g.marketing ?? (g.marketing = {});

  const setUnits = (id: string, units: number) => {
    const area = MARKETING_BY_ID[id];
    if (!area) return;
    const u = Math.max(0, Math.min(area.maxUnits, Math.round(units)));
    if (u <= 0) delete budgets[id];
    else budgets[id] = u;
    onChange();
  };

  const monthlyCost = Math.round(marketingMonthlyBase(budgets) * scale);
  const inc = marketingIncomeBase(budgets);
  const incMerch = Math.round(inc.merch * scale);
  const incSponsor = Math.round(inc.sponsor * scale);
  const netMonthly = incMerch + incSponsor - monthlyCost;

  // --- Mitgliedsbeitraege, Catering-Betriebsform, Programmhefte (Finanzsystem) ---
  const cateringLevel = Math.max(1, Math.min(MAX_LEVEL, Math.round(club.infrastructure?.catering ?? 1)));
  const cateringMode: CateringMode = club.commerce?.cateringMode ?? 'verpachtung';
  const CATERING_MODE_LABEL: Record<CateringMode, string> = {
    eigenbetrieb: 'Eigenbetrieb', umsatz: 'Umsatzbeteiligung', verpachtung: 'Verpachtung',
  };
  const setCateringMode = (m: CateringMode) => {
    const com = club.commerce ?? (club.commerce = { cateringMode: 'verpachtung' });
    com.cateringMode = m;
    onChange();
  };
  // Mitgliedsbeitraege (mirror finances.computeMonthly).
  const membershipMonth = Math.round((Math.round((30000 + club.reputation * 1000) * scale)) / 12);
  // Erwartete Zuschauer & abgeleitete Spieltagserloese.
  const expAtt = expectedAttendance(club);
  const expCatering = cateringMatchIncome(club, expAtt, scale);
  const expProgramme = matchdayIncome(expAtt, scale);

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Marketing"
        right={<span className="dim">Werbebudget: <b style={{ color: 'var(--accent)' }}>{fmtDM(monthlyCost)}</b>/Monat</span>}
      />

      <div className="card mt12">
        <div className="mkt-summary">
          <div><div className="dim2 mini">Kosten (Monat)</div><div className="red">−{fmtDM(monthlyCost)}</div></div>
          <div><div className="dim2 mini">Merchandising</div><div className="accent-text">+{fmtDM(incMerch)}</div></div>
          <div><div className="dim2 mini">Sponsoring</div><div className="accent-text">+{fmtDM(incSponsor)}</div></div>
          <div><div className="dim2 mini">Netto (Monat)</div><div style={{ color: netMonthly >= 0 ? 'var(--green)' : 'var(--red)' }}>{netMonthly >= 0 ? '+' : '−'}{fmtDM(Math.abs(netMonthly))}</div></div>
        </div>
        <div className="dim2 mini" style={{ marginTop: 8 }}>
          Die Kosten steigen LINEAR mit der Reglerstufe, der Nutzen folgt einer Sättigungskurve
          (jede weitere Stufe bringt weniger). Marketing erzeugt kleine Zusatzerträge und einen
          sehr geringen Ansehens-Impuls – sportlicher Erfolg bleibt der Haupttreiber.
        </div>
      </div>

      {/* --- Weitere Erloesquellen: Mitglieder, Catering-Betriebsform, Programmhefte --- */}
      <div className="dash-grid mt12">
        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="fans" /></span> Mitgliedsbeitraege</div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Einnahme / Monat</span>
            <b className="accent-text">{fmtDM(membershipMonth)}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Einnahme / Jahr</span>
            <b>{fmtDM(membershipMonth * 12)}</b>
          </div>
          <div className="dim2 mini mt8">
            Die Beitraege wachsen mit dem <b>Ansehen</b> des Vereins ({club.reputation}) und werden im
            Monatsabschluss automatisch gebucht. Sportlicher Erfolg und Reichweite heben das Ansehen langfristig.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="catering" /></span> Catering-Betriebsform</div>
          <div className="dim2 mini" style={{ marginBottom: 6 }}>Stufe {cateringLevel} · Netto/Besucher &amp; Fixkosten je Modell:</div>
          {(['eigenbetrieb', 'umsatz', 'verpachtung'] as CateringMode[]).map((m) => (
            <div
              key={m}
              className="row"
              style={{ padding: '6px 0', cursor: 'pointer', borderLeft: cateringMode === m ? '3px solid var(--accent)' : '3px solid transparent', paddingLeft: 6 }}
              onClick={() => setCateringMode(m)}
            >
              <span className={cateringMode === m ? 'accent-text' : 'dim'}>
                {cateringMode === m ? '● ' : '○ '}{CATERING_MODE_LABEL[m]}
              </span>
              <span className="mini">
                {fmtDM(Math.round(CATERING_NETPERHEAD[m][cateringLevel] * scale))}/Besucher · <span className="red">−{fmtDM(Math.round(CATERING_UPKEEP[m][cateringLevel] * scale))}</span>
                {m === 'verpachtung' && <> · <span className="accent-text">+{fmtDM(Math.round(CATERING_LEASE[cateringLevel] * scale))} Pacht</span></>}
              </span>
            </div>
          ))}
          <div className="dim2 mini mt8">
            <b>Eigenbetrieb</b>: hoechster Pro-Kopf-Erloes, aber hohe Fixkosten. <b>Umsatzbeteiligung</b>: mittlerer Erloes,
            mittlere Kosten. <b>Verpachtung</b>: geringer Pro-Kopf-Erloes, dafuer feste Monatspacht &amp; kaum Fixkosten.
          </div>
        </div>

        <div className="card">
          <div className="card-title"><span className="ico"><Icon name="finances" /></span> Programmhefte / Spieltag</div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Erw. Zuschauer</span>
            <b>{expAtt.toLocaleString('de-DE')}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Programmhefte / Spieltag</span>
            <b className="accent-text">{fmtDM(expProgramme)}</b>
          </div>
          <div className="row" style={{ padding: '6px 0' }}>
            <span className="dim">Catering / Spieltag ({CATERING_MODE_LABEL[cateringMode]})</span>
            <b className="accent-text">{fmtDM(expCatering)}</b>
          </div>
          <div className="dim2 mini mt8">
            Spieltagserloese aus Programmheften und Catering skalieren direkt mit der Zuschauerzahl. Mehr Auslastung
            (guenstigerer Ticketpreis, sportlicher Erfolg) hebt beide Posten je Heimspiel.
          </div>
        </div>
      </div>

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt Werbekanäle späterer Epochen (ausgegraut).</span>
      </label>

      <div className="mkt-grid mt12">
        {MARKETING_AREAS.filter((a) => marketingAvailable(a, curYear) || showFuture).map((a) => {
          const avail = marketingAvailable(a, curYear);
          const units = budgets[a.id] ?? 0;
          const cost = Math.round(areaMonthlyCostBase(a, units) * scale);
          const benefit = areaBenefit(a, units);
          const benefitPct = Math.round((benefit / a.maxBenefit) * 100);
          return (
            <div key={a.id} className={`card mkt-card ${!avail ? 'fac-locked' : ''}`}>
              <div className="mkt-head">
                <span className="fac-ico">{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="fac-name">{a.name}</div>
                  {avail
                    ? <div className="dim2 mini">{fmtDM(cost)}/Monat · Stufe {units}/{a.maxUnits}</div>
                    : <span className="pill" style={{ color: 'var(--yellow)' }}>ab {a.unlockYear}</span>}
                </div>
              </div>
              <div className="dim mini fac-desc">{a.desc}</div>
              {avail && (
                <>
                  <input
                    type="range" min={0} max={a.maxUnits} step={1} value={units}
                    className="mkt-slider"
                    onChange={(e) => setUnits(a.id, Number(e.target.value))}
                  />
                  <div className="mkt-bar"><div className="mkt-bar-fill" style={{ width: `${benefitPct}%` }} /></div>
                  <div className="dim2 mini">Nutzen (Reichweite): {benefitPct} % des Maximums</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// KALENDER — Monatsansicht, planbare Aktivitäten (Block p11)
// =============================================================================
const WD_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_LABELS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function CalendarView({ g, onChange, onGoto }: { g: Game; onChange: () => void; onGoto: (s: Screen) => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const todayY = Number(today.slice(0, 4));
  const todayM = Number(today.slice(5, 7)) - 1;
  const [viewY, setViewY] = useState(todayY);
  const [viewM, setViewM] = useState(todayM);
  const [planType, setPlanType] = useState<ActivityType>('camp');
  const [planDays, setPlanDays] = useState(5);
  const [selStart, setSelStart] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // Planungsmodus: nur wenn aktiv, wählt ein Klick im Kalender einen Starttag für
  // eine Aktivität. Standardmäßig AUS → ein einfacher Klick springt zum Event.
  const [planMode, setPlanMode] = useState(false);

  // Gemeinsame Event-Quelle mit dem Header-Kalender: pro Tag das wichtigste Event
  // (Gegner H/A, Pokal, Transferfenster, Bewertung, …) inkl. Icon + Farbakzent.
  const eventMap = buildStripEventMap(g);

  // Blockierte Tage (Pflichtspiele + Pokal + bereits geplante Aktivitäten).
  const blocked = new Map<string, string>(); // iso → Grund
  for (const ev of g.calendar.events) {
    if (ev.type === 'matchday' || ev.type === 'cup_matchday') {
      blocked.set(ev.date, ev.type === 'matchday' ? 'Ligaspiel' : 'Pokalspiel');
    }
  }
  for (const act of g.activities ?? []) {
    for (const d of daysInRange(act.startDate, act.endDate)) {
      if (!blocked.has(d)) blocked.set(d, ACTIVITY_DEFS[act.type].name);
    }
  }

  const def = ACTIVITY_DEFS[planType];
  const days = planType === 'friendly' ? 1 : Math.max(def.minDays, Math.min(def.maxDays, planDays));
  const scale = economyScale(yearOf(today));
  const plannedCost = Math.round(activityCostBase(planType, days) * scale);
  const plannedIncome = Math.round(activityIncomeBase(planType) * scale);

  // Kandidaten-Tage der aktuellen Planung (für Vorschau-Markierung).
  const previewDays = new Set<string>();
  let previewValid = false;
  let previewEnd = '';
  if (selStart) {
    previewEnd = addDaysUTC(selStart, days - 1);
    const range = daysInRange(selStart, previewEnd);
    previewValid = selStart >= today && range.every((d) => !blocked.has(d));
    for (const d of range) previewDays.add(d);
  }

  const dayIsFree = (iso: string) => iso >= today && !blocked.has(iso);

  // Sprungziel für einen Tag: das wichtigste Event des Tages → passender Screen.
  // Gibt null zurück, wenn es kein anspringbares Event gibt.
  const screenForDate = (iso: string): Screen | null => {
    let best: { screen: Screen; prio: number } | null = null;
    const consider = (screen: Screen, prio: number) => {
      if (!best || prio > best.prio) best = { screen, prio };
    };
    for (const ev of g.calendar.events) {
      if (ev.date !== iso) continue;
      switch (ev.type) {
        case 'matchday': consider('fixtures', 100); break;
        case 'cup_matchday': consider('cup', 95); break;
        case 'transfer_window_open':
        case 'transfer_window_close': consider('transfers', 30); break;
        case 'rating_update': consider('table', 25); break;
        // winter_break / season_end / season_start haben kein eigenes Sprungziel
      }
    }
    return best ? best.screen : null;
  };

  const clickDay = (iso: string) => {
    // Planungsmodus: Klick wählt einen freien Starttag für die Aktivität.
    if (planMode) {
      if (!dayIsFree(iso)) return;
      setSelStart(iso);
      setMsg(null);
      return;
    }
    // Normalmodus: einfacher Klick springt zum jeweiligen Event des Tages.
    const target = screenForDate(iso);
    if (target) onGoto(target);
  };

  const startPlanning = () => { setPlanMode(true); setSelStart(null); setMsg(null); };
  const cancelPlanning = () => { setPlanMode(false); setSelStart(null); setMsg(null); };

  const confirmPlan = () => {
    if (!selStart) { setMsg('⚠ Bitte zuerst einen freien Starttag im Kalender wählen.'); return; }
    const end = addDaysUTC(selStart, days - 1);
    const range = daysInRange(selStart, end);
    if (selStart < today || !range.every((d) => !blocked.has(d))) {
      setMsg('⚠ Der gewählte Zeitraum kollidiert mit einem Spiel oder einer anderen Planung.');
      return;
    }
    if (club.finances.balance < plannedCost) {
      setMsg('⚠ Kontostand zu niedrig für diese Aktivität.');
      return;
    }
    const label = `${def.name} ${selStart.slice(8, 10)}.${selStart.slice(5, 7)}.`;
    if (plannedCost > 0) {
      book(club.finances, today, -plannedCost, 'other', `${def.name} (geplant)`, true);
    }
    (g.activities ?? (g.activities = [])).push({
      id: activityId(), type: planType, startDate: selStart, endDate: end,
      label, cost: plannedCost, applied: false,
    });
    pushMessage(g.messages, makeMessage({
      date: today, category: 'board', from: 'Trainerstab',
      subject: `${def.icon} ${def.name} eingeplant`,
      shortText: `${def.name} vom ${fmtDay(selStart)} bis ${fmtDay(end)} geplant.`,
      bodyText: `Die Aktivität „${def.name}" ist eingeplant.\n\n`
        + `Zeitraum: ${fmtDay(selStart)} – ${fmtDay(end)} (${days} Tag(e))\n`
        + (plannedCost > 0 ? `Kosten (sofort gebucht): ${fmtDM(plannedCost)}\n` : 'Kosten: keine\n')
        + `\nDie Wirkung auf den Kader (Fitness/Form/Moral) tritt am Ende des Zeitraums ein.`,
    }));
    setSelStart(null);
    setPlanMode(false);
    setMsg(`✔ ${def.name} geplant (${plannedCost > 0 ? fmtDM(plannedCost) : 'kostenlos'}).`);
    onChange();
    setTimeout(() => setMsg(null), 4000);
  };

  const cancelActivity = (id: string) => {
    const list = g.activities ?? [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const act = list[idx];
    if (act.applied || act.startDate <= today) {
      setMsg('⚠ Bereits laufende oder abgeschlossene Aktivitäten können nicht storniert werden.');
      setTimeout(() => setMsg(null), 3500);
      return;
    }
    // Kosten erstatten (Planung rückgängig).
    if (act.cost > 0) book(club.finances, today, act.cost, 'other', `Storno ${ACTIVITY_DEFS[act.type].name}`, true);
    list.splice(idx, 1);
    setMsg('✔ Aktivität storniert, Kosten erstattet.');
    onChange();
    setTimeout(() => setMsg(null), 3500);
  };

  // Monatsraster aufbauen (Mo=0).
  const firstOfMonth = new Date(Date.UTC(viewY, viewM, 1));
  const startWd = (firstOfMonth.getUTCDay() + 6) % 7; // Mo=0..So=6
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  const prevMonth = () => { if (viewM === 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(viewM - 1); };
  const nextMonth = () => { if (viewM === 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(viewM + 1); };

  const upcoming = (g.activities ?? []).filter((a) => a.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Kalender"
        right={<span className="dim">Kontostand: <b style={{ color: 'var(--accent)' }}>{fmtDM(club.finances.balance)}</b></span>}
      />

      {/* === KALENDER (zuerst) ================================================ */}
      {/* Monatsnavigation */}
      <div className="cal-nav mt12">
        <button className="btn btn-sm btn-ghost" onClick={prevMonth}>‹ Vormonat</button>
        <div className="cal-month-title">{MONTH_LABELS[viewM]} {viewY}</div>
        <button className="btn btn-sm btn-ghost" onClick={nextMonth}>Folgemonat ›</button>
      </div>

      {/* Hinweis: aktueller Klick-Modus */}
      <div className="dim2 mini mt4" style={{ textAlign: 'center' }}>
        {planMode
          ? 'Planungsmodus: Klicke einen freien Tag als Starttag der Aktivität an.'
          : 'Klicke auf einen Tag mit Event, um direkt dorthin zu springen.'}
      </div>

      {/* Wochentagsköpfe */}
      <div className="cal-grid cal-head-row">
        {WD_LABELS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
      </div>

      {/* Tagesraster */}
      <div className="cal-grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} className="cal-cell cal-empty" />;
          const dom = Number(iso.slice(8, 10));
          const isToday = iso === today;
          const reason = blocked.get(iso);
          const past = iso < today;
          const free = dayIsFree(iso);
          const inPreview = previewDays.has(iso);
          const ev = eventMap.get(iso);
          const accentCls = ev?.accent === 'orange' ? 'cal-acc-orange' : ev?.accent === 'gold' ? 'cal-acc-gold' : '';
          const jumpable = !planMode && !!screenForDate(iso);
          const cls = ['cal-cell'];
          if (isToday) cls.push('cal-today');
          if (past) cls.push('cal-past');
          if (reason) cls.push('cal-blocked');
          else if (free) cls.push('cal-free');
          if (accentCls) cls.push(accentCls);
          if (inPreview) cls.push(previewValid ? 'cal-preview' : 'cal-preview-bad');
          if (jumpable) cls.push('cal-jumpable');
          if (planMode && free) cls.push('cal-selectable');
          const title = planMode
            ? (free ? 'Als Starttag wählen' : (ev ? `${fmtDay(iso)} — ${ev.line}` : reason ? `${fmtDay(iso)} — ${reason}` : fmtDay(iso)))
            : (ev ? `${fmtDay(iso)} — ${ev.line} (klicken zum Springen)` : reason ? `${fmtDay(iso)} — ${reason}` : fmtDay(iso));
          return (
            <div key={iso} className={cls.join(' ')} onClick={() => clickDay(iso)} title={title}>
              <span className="cal-dom">{dom}</span>
              {ev ? (
                <span className="cal-cell-ev">
                  <Icon name={ev.icon} className="cal-cell-ico" />
                  <span className="cal-cell-ev-txt">{ev.line}</span>
                </span>
              ) : reason ? (
                <span className="cal-cell-ev cal-cell-ev-generic">
                  <Icon name="kalender" className="cal-cell-ico" />
                  <span className="cal-cell-ev-txt">{reason}</span>
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="cal-legend dim2 mini mt12">
        <span><i className="lg lg-free" /> frei</span>
        <span><i className="lg lg-block" /> Spiel/Planung</span>
        <span><i className="lg lg-today" /> heute</span>
        <span><i className="lg lg-prev" /> Auswahl</span>
      </div>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      {/* === TRAININGSLAGER & AKTIVITÄTEN PLANEN (darunter) ==================== */}
      <div className="card mt12">
        <div className="section-title">Trainingslager & Aktivitäten planen</div>
        <div className="cal-plan">
          <div className="cal-plan-types">
            {(['camp', 'friendly', 'teambuilding'] as ActivityType[]).map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${planType === t ? '' : 'btn-ghost'}`}
                onClick={() => { setPlanType(t); setSelStart(null); }}
              >
                {ACTIVITY_DEFS[t].icon} {ACTIVITY_DEFS[t].name}
              </button>
            ))}
          </div>
          <div className="dim mini">{def.desc}</div>
          {planType !== 'friendly' && (
            <label className="cal-days">
              Dauer: <b>{days}</b> Tag(e)
              <input type="range" min={def.minDays} max={def.maxDays} step={1} value={days}
                onChange={(e) => setPlanDays(Number(e.target.value))} />
            </label>
          )}
          <div className="cal-plan-info">
            <span className="mini">Kosten: <b className="red">{plannedCost > 0 ? fmtDM(plannedCost) : 'keine'}</b></span>
            {plannedIncome > 0 && <span className="mini">Erlös: <b className="accent-text">+{fmtDM(plannedIncome)}</b></span>}
            {!planMode ? (
              <>
                <span className="mini dim2">Starttag oben im Kalender festlegen ↑</span>
                <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={startPlanning}>
                  Starttag wählen
                </button>
              </>
            ) : (
              <>
                <span className="mini">
                  {selStart
                    ? <>Zeitraum: <b>{fmtDay(selStart)} – {fmtDay(previewEnd)}</b> {previewValid ? '✅' : '⛔'}</>
                    : <span className="dim2">Klicke oben einen freien Starttag an ↑</span>}
                </span>
                <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={cancelPlanning}>
                  Abbrechen
                </button>
                <button className="btn btn-sm" disabled={!selStart || !previewValid} onClick={confirmPlan}>
                  ✓ Einplanen
                </button>
              </>
            )}
          </div>
          <div className="dim2 mini">
            Effekte: {def.fitness ? `Fitness +${def.fitness} ` : ''}{def.form ? `· Form +${def.form} ` : ''}{def.morale ? '· Moral ↑' : ''}
            — die Wirkung tritt am Ende des Zeitraums ein. Planung nur an freien Tagen (kein Spiel, keine andere Aktivität).
          </div>
        </div>
      </div>

      {/* Geplante Aktivitäten */}
      {upcoming.length > 0 && (
        <div className="mt12">
          <div className="section-title">Geplante Aktivitäten</div>
          <div className="cal-list">
            {upcoming.map((a) => {
              const ad = ACTIVITY_DEFS[a.type];
              const running = a.startDate <= today && !a.applied;
              return (
                <div key={a.id} className="card cal-list-item">
                  <span className="fac-ico">{ad.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="fac-name">{ad.name}</div>
                    <div className="dim2 mini">{fmtDay(a.startDate)} – {fmtDay(a.endDate)} · {a.cost > 0 ? fmtDM(a.cost) : 'kostenlos'}{running ? ' · läuft' : ''}</div>
                  </div>
                  {!running && a.startDate > today && (
                    <button className="btn btn-sm btn-danger" onClick={() => cancelActivity(a.id)}>Stornieren</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Kurzes Datum "15.08.1980" (UTC). */
function fmtDay(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}
