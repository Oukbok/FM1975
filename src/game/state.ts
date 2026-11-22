import { PlannedActivity } from '../data/activities';
import { COUNTRY_BY_CC } from '../data/world/countries';
import { EuroClub } from '../data/europe';
import type { WorldState } from '../engine/world';
import type { NationalJob, NationalOffer } from './national/nationalJob';
import type { SeasonPhase, StaffMember, TrainingFocus } from '../engine/staffPeople';
import type { ClubEnvironment } from '../engine/environment';
import { generateBandenOffers, generateShirtOffers } from '../engine/finances';
import { LeagueSystem, SimClub } from '../engine/leagues';
import { Club, ClubCommerce, CupState, Difficulty, GameCalendar, InboxMessage, LeagueTable, ManagerProfile, Match, Player, PointSystem, SponsorContract, SponsorOffer, WeeklyTrainingPlan } from '../types';

// -----------------------------------------------------------------------------
// Kommerz-Helfer (Trikot/Banden-Vertraege) — modulweit, fuer Migration & Saisonstart.
// -----------------------------------------------------------------------------
/** Waehlt aus einer Angebotsliste das wertvollste Angebot. */
export function bestOffer(offers: SponsorOffer[]): SponsorOffer | undefined {
  return offers.slice().sort((a, b) => b.annualValue - a.annualValue)[0];
}

/** Macht aus einem Angebot einen laufenden Vertrag. */
export function offerToContract(o: SponsorOffer): SponsorContract {
  return { name: o.name, annualValue: o.annualValue, yearsTotal: o.years, yearsLeft: o.years };
}

/** Erzeugt Default-Kommerz fuer einen Altstand-Verein (Migration). */
export function migrateCommerce(club: Club, isManaged: boolean): ClubCommerce {
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
export interface Game {
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
  /** Entwicklung der anderen Vereine: frei (off) oder an der echten Geschichte orientiert (game/historicSteer.ts); fehlt = off. */
  historyMode?: import('./historicSteer').HistoryMode;
  /** Entwicklung der Ligen: Ligaruf je Land frei oder historisch gelenkt (game/leagueRepGame.ts); fehlt = bisheriges Landesniveau. */
  leagueRepMode?: import('../engine/leagueRep').LeagueRepMode;
  injuriesEnabled: boolean;
  messages: InboxMessage[];
  /** Wochen-Trainingsplan des Manager-Vereins (7 Tage × 3 Slots). */
  trainingPlan: WeeklyTrainingPlan;
  /** Landespokal-Wettbewerb (parallel zur 1. Liga). */
  cup: CupState;
  /** Europapokal-Wettbewerbe (optional -> abwaertskompatibel mit Alt-Saves). */
  euroCups?: { ec: CupState | null; cwc: CupState | null; uefa: CupState | null };
  /** Leichte auslaendische Europapokal-Vereine (aus allEuroClubs()). */
  euroClubs?: Record<string, EuroClub>;
  /** Europa im Hintergrund: ausländische Ligen, Koeffizienten (engine/world.ts). */
  world?: WorldState;
  /** IDs bereits ausgelöster Chronik-Meilensteine (Epochen-/Timeline-System). */
  firedMilestones: string[];
  /** Freigeschaltete Features (durch Meilensteine, z. B. "champions_league"). */
  unlockedFeatures: string[];
  /** IDs der aktuell angestellten Mitarbeiter (Block p11, Bereich „Mitarbeiter"). */
  hiredStaff: string[];
  /** Mitarbeiter 2.0: angestellte Personen (Rollen-IDs bleiben in hiredStaff gespiegelt). */
  staff?: StaffMember[];
  /** Trainingsphilosophie je Saisonphase. */
  trainingFocus?: Partial<Record<SeasonPhase, TrainingFocus>>;
  /** Förderspieler (max. 3) mit besonderer Aufmerksamkeit im Training. */
  foerderSpieler?: string[];
  /** Stand der Entwicklungspunkte beim letzten Monatsbericht (Spieler-ID → Punkte). */
  devReportSnapshot?: Record<string, number>;
  /** Angesprochene fremde Talente: Spieler-ID → Saison (Startjahr). */
  youthApproaches?: Record<string, number>;
  /** Vereinsumfeld des eigenen Vereins (Fans, Mitglieder, Medien, Leitbild). */
  environment?: ClubEnvironment;
  /** Liga-Gleichgewicht: Verschiebung des Jugend-Potenzials (Sterne) + Verlauf (game/leagueBalance.ts). */
  /** Spieler-Archiv (Karriereende, game/archive.ts). */
  archive?: import('./archive').ArchivedPlayer[];
  /** Volle Jugendmannschaften wurden einmalig hergestellt (game/youthTeams.ts). */
  youthTeamsReady?: boolean;
  /** Wettbewerb um Talente des letzten Sommers (game/youthInvest.ts). */
  youthRace?: import('./youthInvest').YouthRaceLog;
  /** Monat der letzten Nachwuchs-Buchung (game/youthInvest.ts). */
  youthInvestTick?: string;
  /** Glaubwürdigkeit deiner Versprechen (0–100, Start 70; game/promises.ts). */
  promiseTrust?: number;
  /** Fällige Raten und Erfolgsprämien aus Transfers (1975-Basis). */
  transferInstallments?: { due: string; amount: number; from: string; to: string; name: string; kind: 'rate' | 'bonus' | 'euro' | 'friendly'; playerId?: string }[];
  /** Vertragsverhandlung 2.0: Liga-Ebene/Klassenerhalt-Prämien (game/contractClausesGame.ts). */
  contracts2?: import('./contractClausesGame').Contracts2State;
  /** Verhandlungen mit Mitarbeitern am Verhandlungstisch (game/staffTalk.ts), je Person. */
  staffTalks?: Record<string, import('./staffTalk').StaffTalkState>;
  /** Verhandlungen mit Sponsoren am Verhandlungstisch (game/sponsorTalk.ts), je Angebot bzw. `naming:<Firma>`. */
  sponsorTalks?: Record<string, import('./sponsorTalk').SponsorTalkState>;
  /** Laufende Transferverhandlungen (game/transferTalks.ts). */
  transferTalks?: import('./transferTalks').TransferTalk[];
  /** Leihgespräche (du leihst aus, game/loanTalks.ts). */
  loanTalks?: import('./loanTalks').LoanTalk[];
  /** Sperrzeiten der Vereinsereignisse (Typ → Datum). */
  eventCooldowns?: Record<string, string>;
  /** WM-Euphorie: Zuschauer-Faktor für einen Zeitraum. */
  euphoria?: { from: string; to: string; factor: number };
  leagueBalance?: { shift: number; history: { season: string; avg: number; shift: number; n85?: number; elite?: number }[]; /** Verschiebung der Weltklasse-Bremse in OVR-Punkten (−5 … +4, engine/development.ts). */ elite?: number; /** Gedächtnisanteil des Reglers (±2). */ eliteI?: number };
  /** Salz der Talent-Würfel (engine/youth.ts `setYouthSalt`); fehlt bei alten Spielständen. */
  youthSalt?: string;
  /** Laufende Nummer für IDs (Nachrichten, Buchungen, Termine …; engine/idSeq.ts) – fehlt bei alten Spielständen. */
  ids?: import('../engine/idSeq').IdCounter;
  /** Datensatz, mit dem dieses Spiel begonnen wurde. */
  datasetId?: string;
  datasetName?: string;
  /** Marketing-Budget je Bereich: Bereichs-ID → Anzahl Einheiten (0 = aus). */
  marketing: Record<string, number>;
  /** Werbung 2.0: tatsächliche Wirkung je Werbeziel, läuft den Reglern hinterher (game/marketingGame.ts). */
  marketingFx?: Partial<Record<'att' | 'members' | 'merch' | 'reg' | 'nat' | 'intl', number>>;
  /** Werbung 2.0: Markenpunkte, die die Werbung derzeit in `club.brand` gelegt hat. */
  marketingBrand?: Partial<Record<'reg' | 'nat' | 'intl', number>>;
  /** Geplante Aktivitäten (Trainingslager, Freundschaftsspiele, Teambuilding). */
  activities: PlannedActivity[];
  /** Mehrstufiges Ligasystem (Ebenen/Staffeln oberhalb der Spielerliga). */
  leagues: LeagueSystem;
  /** Aggregierte Nicht-Spieler-Vereine (2. Liga usw.), rein per Stärke simuliert. */
  simClubs: Record<string, SimClub>;
  /** IDs bereits angewandter Ligareformen (verhindert Doppel-Migration beim Laden). */
  appliedReforms: string[];
  /** Arbeitslose Trainer (Trainerkarussell, game/coachCarousel.ts). */
  coachPool?: import('../types').ClubCoach[];
  /** Arbeitsmarkt für Trainerteam/Mitarbeiter aller Vereine (game/staffWorld.ts). */
  staffWorld?: import('./staffWorld').StaffWorld;
  /** Kaderplanung der KI-Vereine in der laufenden Saison (game/aiClubs.ts). */
  aiMarket?: import('./aiClubs').AiMarketState;
  /**
   * Finanzniveau des Spielstands (fehlt = 1: bis v10, rund das Dreifache der Recherche;
   * 2 = realistisch, Erstligist 1975 ≈ 4,5 Mio. DM). Umstellung: game/financeMigration.ts.
   */
  financeLevel?: number;
  /** Saison-Briefings: Archiv (Saison + Ausgangslage) und offenes Popup (game/seasonBriefing.ts). */
  briefing?: import('./seasonBriefing').BriefingLog;
  /** Saisonbudget: Pläne je Saison (Prognose, Budgets, Bilanz) und offenes Popup (game/budgetPlan.ts). */
  budget?: import('./budgetPlan').BudgetState;
  /** Transferprotokoll je Fenster (game/transferLog.ts); fehlt = alter Spielstand. */
  transferLog?: import('./transferLog').TransferLog;
  /** Transferarchiv je Saison (game/clubTransfers.ts, Reiter „Transfers“ im Vereinsprofil). */
  clubTransfers?: import('./clubTransfers').ClubTransferArchive;
  /** Bilanz der letzten Bewertungsrunden des eigenen Kaders (Vergleich in der Bewertungs-Show). */
  ratingRounds?: { date: string; label: string; n: number; ups: number; downs: number; sum: number }[];
  /** Kaderplanung der KI über die Saisons: Verlängerungen, Bosman, Leihen (game/aiSquadLog.ts). */
  aiSquadLog?: import('./aiSquadLog').AiSquadLogEntry[];
  /** Spielende nach dem Abstieg aus der untersten Liga (game/relegationGame.ts): Karrierebilanz; gesetzt = kein Weiterspielen. */
  over?: import('./relegationGame').GameOver;
  /** Deine Managerkarriere: Ansehen, Trainer-Historie, Vorstandsdruck, Managerbilanz (game/careerGame.ts). */
  career?: import('./careerState').CareerState;
  /** Ausnahmetalente der Fußballgeschichte: an/aus und bereits erschienene (game/legendsGame.ts). Fehlt = keine. */
  legends2?: import('./legendsGame').LegendsState;
  /** Startjahr der Karriere (Weltdaten); fehlt = 1975. */
  startYear?: number;
  /** Heimatland (data/world/countries.ts); fehlt = 'ger'. */
  homeCountry?: string;
  /** Start in der DDR (game/ddrHome.ts): Spielerliga ist DDR-Oberliga/DDR-Liga, Deutschland (BRD) läuft simuliert;
   *  entfällt mit der Wiedervereinigung 1991/92 (danach gesamtdeutsch, Heimatland Deutschland). Fehlt = kein DDR-Start. */
  ddrHome?: true;
  /** Abgelöst (nur ältere Spielstände): frühere „Spiel für Spiel“-Länder; `retireFullCountries` entfernt sie beim Laden. */
  fullCountries?: string[];
  /** Abgelöst (nur ältere Spielstände), siehe `fullCountries`. */
  fullAll?: boolean;
  /** Weltspieler der Vereine ohne vollen Kader (game/worldPool.ts); fehlt = wird beim Laden angelegt. */
  worldPool?: import('./worldPool').WorldPool;
  /** Transfers und Leihen der Weltspieler je Saison (game/worldTransfers.ts, Vereinsprofil › Transfers); fehlt = noch keine. */
  worldTransfers?: import('./worldTransfers').WorldTransferStore;
  /** 1 = Rückennummern aller KI-Kader nach Position vergeben (game/shirtMigration.ts); fehlt = alte Nummern „kleinste freie“. */
  shirtsV?: 1;
  /** 1 = Ethnie alter Spieler einmalig an ihren Nachnamen angepasst (game/faceNameMigration.ts); fehlt = noch nicht. Neue Spiele: 1. */
  faceNameV?: number;
  /** Einzel-Scouting und Berichte (game/scoutingGame.ts). */
  scouting?: import('./scoutingGame').ScoutingState;
  /** Jugendcamps im Ausland + KI-Zähler (game/youthCamps.ts); fehlt = keine. */
  youthCamps?: import('./youthCamps').YouthCampsState;
  /** Privatleben: Familie, Freizeit, Vermögen, Generationen (game/private/). */
  private?: import('./private/privateState').PrivateState;
  /** Gespeicherte Aufstellungen (components/lineup/SavedLineups.tsx). */
  savedLineups?: import('../components/lineup/SavedLineups').SavedLineup[];
  /** Spielticker der letzten eigenen Spiele für den Spielbericht (game/matchTicker.ts); fehlt = bisheriges Layout. */
  matchTickers?: import('./matchTicker').MatchTicker[];
  /** Gespeicherte Taktiken (Anweisungen ohne Aufstellung, components/tactics/savedTactics.ts; höchstens 12). */
  savedTactics?: import('../components/tactics/savedTactics').SavedTactic[];
  /** Privatleben beim Start abgeschaltet. */
  privateOff?: boolean;
  /** Nationaltrainer (game/national/nationalJob.ts): laufende/letzte Amtszeit; fehlt = nie Nationaltrainer. */
  nationalJob?: NationalJob;
  /** Entlassung als Nationaltrainer möglich (Option im Assistenten); fehlt = an. */
  nationalSackable?: boolean;
  /** Offenes Angebot eines Verbandes / abgelehnte Angebote (Nation → Datum). */
  nationalOffer?: NationalOffer;
  nationalDeclined?: Record<string, string>;
}

/** Heimatland des Spielstands (fehlt = Deutschland). */
export const homeCountryOf = (g: { homeCountry?: string }): string => g.homeCountry ?? 'ger';
/** Länder-Schlüssel des Heimatlandes wie `EuroClub.country` („Deutschland“, „England“ …). */
export const homeCountryKey = (g: { homeCountry?: string }): string => COUNTRY_BY_CC[homeCountryOf(g)]?.key ?? 'Deutschland';

// Moral-Stufen in aufsteigender Reihenfolge (für Aktivitäts-Effekte, Block p11).
export const MORALE_ORDER: import('../types').PlayerMorale[] = ['very_low', 'low', 'okay', 'good', 'excellent'];

/** Hebt die Moral um `steps` Stufen an (begrenzt auf „excellent"). */
export function bumpMorale(m: import('../types').PlayerMorale, steps: number): import('../types').PlayerMorale {
  const i = MORALE_ORDER.indexOf(m);
  if (i < 0) return m;
  return MORALE_ORDER[Math.max(0, Math.min(MORALE_ORDER.length - 1, i + steps))];
}

// -----------------------------------------------------------------------------
// Landespokal — Hilfsfunktionen für Kalender & Nachrichten
// -----------------------------------------------------------------------------

/** Kleiner FNV-1a-Hash für stabile Seeds aus Strings. */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Ligaebene der Spielerliga für Finanzen/Ziele/Kader: DDR-Oberliga (101) = 1, DDR-Liga (102) = 2, sonst wie gespeichert. */
export const playerLevel = (g: { leagues?: { playerDivision?: { tier: number } } }): number => {
  const t = g.leagues?.playerDivision?.tier ?? 1;
  return t > 100 && t < 109 ? t - 100 : t;
};
