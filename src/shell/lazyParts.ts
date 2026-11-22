// =============================================================================
// Nachgeladene Teile des laufenden Spiels (Code-Splitting, scripts/build.mjs mit
// `splitting`). Jede Seite außer der Zentrale und jedes große Fenster/jede Show
// liegt in einem eigenen Stück und wird erst beim ersten Öffnen geladen; kurz nach
// dem Spielstart lädt `preloadShellParts` alles im Leerlauf vor, damit später
// nichts mehr wartet. Platzhalter beim Laden: shell/LazyFallback.tsx.
// =============================================================================
import { lazyNamed } from '../ui/lazyNamed';

const loaders: (() => Promise<unknown>)[] = [];
const preloadOf = new Map<unknown, () => Promise<unknown>>();

/** Benannter Export als nachgeladene Komponente (ui/lazyNamed.ts) – behält die Props-Typen. */
function lz<M, K extends keyof M>(load: () => Promise<M>, key: K): M[K] {
  const n = lazyNamed(load, key);
  loaders.push(n.preload);
  preloadOf.set(n.component, n.preload);
  return n.component;
}

/**
 * Fenster, die gleich zu Spielbeginn bzw. am ersten Spieltag kommen (Briefing, Budget, Erstes
 * Training, Vorschau, Spielbericht, Auslosung): sofort laden – vom Hauptmenü aus (App.tsx) und
 * beim Start der Shell –, damit dort nie ein Platzhalter vor einem Pflicht-Fenster steht.
 */
export function preloadEarlyParts(): void {
  for (const c of [BriefingModal, BudgetModal, FirstTrainingModal, PrematchScreen, MatchModal, DrawShow]) preloadOf.get(c)?.().catch(() => {});
}

/** Alle Stücke im Leerlauf vorladen (nacheinander, damit der Zeitlauf nicht ruckelt). */
export function preloadShellParts(): () => void {
  let stop = false, i = 0;
  const idle = (cb: () => void) => {
    const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2000 }); else setTimeout(cb, 50);
  };
  const next = () => {
    if (stop || i >= loaders.length) return;
    loaders[i++]().catch(() => {}).finally(() => idle(next));
  };
  const t = setTimeout(() => idle(next), 1200);
  return () => { stop = true; clearTimeout(t); };
}

// --- Seiten -----------------------------------------------------------------
export const LineupView = lz(() => import('../components/LineupView'), 'default');
export const TacticsView = lz(() => import('../components/TacticsView'), 'default');
export const TableView = lz(() => import('../views/stats/TableView'), 'TableView');
export const FixturesView = lz(() => import('../views/matchday/FixturesView'), 'FixturesView');
export const SquadView = lz(() => import('../views/squad/SquadView'), 'SquadView');
export const TrainingPlanView = lz(() => import('../views/training/TrainingPlanView'), 'TrainingPlanView');
export const TrainerTeamView = lz(() => import('../views/training/TrainerTeamView'), 'TrainerTeamView');
export const TrainingDashboard = lz(() => import('../views/training/TrainingDashboard'), 'TrainingDashboard');
export const TransfersView = lz(() => import('../views/transfers/TransfersView'), 'TransfersView');
export const BeobachtungView = lz(() => import('../views/transfers/TransfersView'), 'BeobachtungView');
export const SpielerpoolView = lz(() => import('../views/transfers/pool/SpielerpoolView'), 'SpielerpoolView');
export const ScoutingView = lz(() => import('../views/transfers/pool/ScoutingView'), 'ScoutingView');
export const VerhandlungenView = lz(() => import('../views/transfers/TransfersView'), 'VerhandlungenView');
export const LoansView = lz(() => import('../views/transfers/loans/LoansView'), 'LoansView');
export const FinancesView = lz(() => import('../views/finance/FinancesView'), 'FinancesView');
export const BudgetView = lz(() => import('../views/finance/BudgetView'), 'BudgetView');
export const MarketingView = lz(() => import('../views/finance/MarketingView'), 'MarketingView');
export const SponsoringView = lz(() => import('../views/finance/SponsoringView'), 'SponsoringView');
export const MerchView = lz(() => import('../views/finance/MerchView'), 'MerchView');
export const YouthView = lz(() => import('../views/squad/YouthView'), 'YouthView');
export const AcademyView = lz(() => import('../views/squad/AcademyView'), 'AcademyView');
export const VertraegeView = lz(() => import('../views/squad/VertraegeView'), 'VertraegeView');
export const ReserveTeamView = lz(() => import('../views/youth/ReserveTeamView'), 'ReserveTeamView');
export const YouthCampsView = lz(() => import('../views/youth/YouthCampsView'), 'YouthCampsView');
export const NationalView = lz(() => import('../views/stats/NationalView'), 'NationalView');
export const NationalTeamView = lz(() => import('../views/national/NationalTeamView'), 'NationalTeamView');
export const PrivatView = lz(() => import('../views/private/PrivatView'), 'PrivatView');
export const FamilieView = lz(() => import('../views/private/FamilieView'), 'FamilieView');
export const FreizeitView = lz(() => import('../views/private/FreizeitView'), 'FreizeitView');
export const VermoegenView = lz(() => import('../views/private/VermoegenView'), 'VermoegenView');
export const SuperCupView = lz(() => import('../views/stats/SuperCupView'), 'SuperCupView');
export const RegistrationView = lz(() => import('../views/squad/RegistrationView'), 'RegistrationView');
export const TrainingCampView = lz(() => import('../views/squad/TrainingCampView'), 'TrainingCampView');
export const DressingRoomView = lz(() => import('../views/squad/DressingRoomView'), 'DressingRoomView');
export const JugendDashboard = lz(() => import('../views/youth/JugendDashboard'), 'JugendDashboard');
export const YouthCompetitionsView = lz(() => import('../views/youth/YouthCompetitionsView'), 'YouthCompetitionsView');
export const FacilitiesView = lz(() => import('../views/club/FacilitiesView'), 'FacilitiesView');
export const FansView = lz(() => import('../views/club/FansView'), 'FansView');
export const StadiumView = lz(() => import('../views/club/StadiumView'), 'StadiumView');
export const TicketsView = lz(() => import('../views/club/TicketsView'), 'TicketsView');
export const StaffView = lz(() => import('../views/club/StaffView'), 'StaffView');
export const ErfolgeView = lz(() => import('../views/club/ErfolgeView'), 'ErfolgeView');
export const CupView = lz(() => import('../views/stats/CupView'), 'CupView');
export const InternationalView = lz(() => import('../views/stats/InternationalView'), 'InternationalView');
export const IndoorView = lz(() => import('../views/stats/IndoorView'), 'IndoorView');
export const AwardsView = lz(() => import('../views/stats/awards/AwardsView'), 'AwardsView');
export const LeagueSystemView = lz(() => import('../views/stats/LeagueSystemView'), 'LeagueSystemView');
export const WikiView = lz(() => import('../views/wiki/WikiView'), 'WikiView');
export const CalendarView = lz(() => import('../views/office/CalendarView'), 'CalendarView');
export const CareerView = lz(() => import('../views/office/CareerView'), 'CareerView');
export const BriefingView = lz(() => import('../views/office/BriefingView'), 'BriefingView');
export const PresseView = lz(() => import('../views/office/PresseView'), 'PresseView');
export const SpieltagDashboard = lz(() => import('../views/categoryDashboards'), 'SpieltagDashboard');
export const GegnerView = lz(() => import('../views/matchday/GegnerView'), 'GegnerView');
export const KaderDashboard = lz(() => import('../views/categoryDashboards'), 'KaderDashboard');
export const TransfersDashboard = lz(() => import('../views/categoryDashboards'), 'TransfersDashboard');
export const FinanzenDashboard = lz(() => import('../views/categoryDashboards'), 'FinanzenDashboard');
export const VereinDashboard = lz(() => import('../views/categoryDashboards'), 'VereinDashboard');
export const StatistikenDashboard = lz(() => import('../views/categoryDashboards'), 'StatistikenDashboard');

// --- Fenster & Shows ------------------------------------------------------
export const MatchScreen = lz(() => import('../screens/match/MatchScreen'), 'MatchScreen');
export const PrematchScreen = lz(() => import('../screens/prematch/PrematchScreen'), 'PrematchScreen');
export const ContractScreen = lz(() => import('../screens/contract/ContractScreen'), 'ContractScreen');
export const GameOverScreen = lz(() => import('../screens/GameOverScreen'), 'GameOverScreen');
export const MatchModal = lz(() => import('../views/matchday/MatchModal'), 'MatchModal');
export const DrawShow = lz(() => import('../screens/draw/DrawShow'), 'DrawShow');
export const RatingShow = lz(() => import('../screens/rating/RatingShow'), 'RatingShow');
export const GalaShow = lz(() => import('../screens/gala/GalaShow'), 'GalaShow');
export const IndoorShow = lz(() => import('../screens/indoor/IndoorShow'), 'IndoorShow');
export const CampRecap = lz(() => import('../views/squad/camp/CampRecap'), 'CampRecap');
export const TransferWindowModal = lz(() => import('../views/transfers/window/TransferWindowModal'), 'TransferWindowModal');
export const FirstTrainingModal = lz(() => import('../views/squad/promises/FirstTrainingModal'), 'FirstTrainingModal');
export const AwardsModal = lz(() => import('../views/stats/awards/AwardsModal'), 'AwardsModal');
export const BriefingModal = lz(() => import('../views/office/BriefingModal'), 'BriefingModal');
export const BudgetModal = lz(() => import('../views/finance/budget/BudgetModal'), 'BudgetModal');
export const DevelopmentReveal = lz(() => import('../views/squad/DevelopmentReveal'), 'DevelopmentReveal');
export const RatingCeremony = lz(() => import('../views/squad/DevelopmentReveal'), 'RatingCeremony');
export const ChronicleModal = lz(() => import('../views/stats/ChronicleModal'), 'ChronicleModal');
export const CountryModal = lz(() => import('../components/country/CountryModal'), 'CountryModal');
export const ClubEditorModal = lz(() => import('../components/ClubEditorModal'), 'default');
