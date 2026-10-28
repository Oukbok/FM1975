import { PlannedActivity } from '../data/activities';
import { EuroClub } from '../data/europe';
import type { WorldState } from '../engine/world';
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
  /** Sperrzeiten der Vereinsereignisse (Typ → Datum). */
  eventCooldowns?: Record<string, string>;
  /** WM-Euphorie: Zuschauer-Faktor für einen Zeitraum. */
  euphoria?: { from: string; to: string; factor: number };
  leagueBalance?: { shift: number; history: { season: string; avg: number; shift: number }[] };
  /** Bereits erschienene Legenden (IDs aus data/legends.ts). */
  spawnedLegends?: string[];
  /** Datensatz, mit dem dieses Spiel begonnen wurde. */
  datasetId?: string;
  datasetName?: string;
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
