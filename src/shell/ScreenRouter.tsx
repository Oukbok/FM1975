// Routing der Seiten im laufenden Spiel (Inhalt von <main className="app-main">).
// Die Zentrale ist fest im Hauptstück, alle anderen Seiten werden nachgeladen
// (shell/lazyParts.ts); solange füllt `PageLoading` die Fläche.
import { Suspense } from 'react';
import type { Game } from '../game/state';
import type { DrawComp } from '../types/draw';
import { Dashboard } from '../views/office/Dashboard';
import { PageLoading } from './LazyFallback';
import type { Screen } from './navigation';
import * as P from './lazyParts';

export interface RouterProps {
  screen: Screen;
  g: Game;
  rerender: () => void;
  setScreen: (s: Screen) => void;
  onWatch: (matchId: string) => void;
  onReplayDraw: (comp: DrawComp, roundIndex: number) => void;
  onOpenEditor: () => void;
  onPause: () => void;
  wikiArticle: { id: string; n: number } | null;
  /** Ansicht Verein/Nationalteam (shell/viewMode.ts). */
  view?: 'club' | 'national';
}

export function ScreenRouter(r: RouterProps) {
  return <Suspense fallback={<PageLoading />}>{page(r)}</Suspense>;
}

function page({ screen, g, rerender, setScreen, onWatch, onReplayDraw, onOpenEditor, onPause, wikiArticle, view }: RouterProps) {
  const ch = rerender;
  switch (screen) {
    case 'dashboard': return <Dashboard g={g} national={view === 'national'} onGoto={setScreen} onWatch={onWatch} onChange={ch} onOpenEditor={onOpenEditor} />;
    case 'nationalteam': return <P.NationalTeamView g={g} onChange={ch} onGoto={setScreen} />;
    case 'table': return <P.TableView g={g} />;
    case 'fixtures': return <P.FixturesView g={g} onWatch={onWatch} onGoto={setScreen} />;
    case 'squad': return <P.SquadView g={g} onChange={ch} />;
    case 'lineup': return <P.LineupView g={g as never} onChange={ch} onGoto={setScreen} />;
    case 'training': return <P.TrainingPlanView g={g} onChange={ch} onGoto={setScreen} />;
    case 'transfers': return <P.TransfersView g={g} onDone={ch} />;
    case 'finances': return <P.FinancesView g={g} />;
    case 'budget': return <P.BudgetView g={g} onChange={ch} />;
    case 'youth': return <P.YouthView g={g} onChange={ch} />;
    case 'akademie': return <P.AcademyView g={g} onChange={ch} />;
    case 'facilities': return <P.FacilitiesView g={g} onChange={ch} onGoto={setScreen} />;
    case 'staff': return <P.StaffView g={g} onChange={ch} />;
    case 'marketing': return <P.MarketingView g={g} onChange={ch} />;
    case 'calendar': return <P.CalendarView g={g} onChange={ch} onGoto={setScreen} />;
    case 'karriere': return <P.CareerView g={g} onChange={ch} />;
    case 'familie': return <P.FamilyView g={g} onChange={ch} />;
    case 'freizeit': return <P.LeisureView g={g} onChange={ch} />;
    case 'vermoegen': return <P.WealthView g={g} onChange={ch} />;
    case 'briefing': return <P.BriefingView g={g} onGoto={setScreen} onOpen={onPause} />;
    case 'supercup': // Sprungziel, wird in useScreenHistory zu 'cup' (Reiter Gipfelpokal)
    case 'cup': return <P.CupView g={g} onWatch={onWatch} onReplayDraw={(ri) => onReplayDraw('cup', ri)} />;
    case 'ruhmeshalle': return <P.AchievementsView g={g} />;
    case 'wiki': return <P.WikiView key={wikiArticle?.n ?? 0} g={g} openArticle={wikiArticle?.id} onGoto={setScreen} />;
    case 'tactics': return <P.TacticsView g={g as never} onChange={ch} />;
    case 'stadium': return <P.StadiumView g={g} onChange={ch} onGoto={setScreen} />;
    // Kategorie-Dashboards (nur noch Training/Finanzen/Verein; Gegner = Aufstellung › Gegner)
    case 'cat-spieltag': return <P.OpponentView g={g} onGoto={setScreen} onWatch={onWatch} />;
    case 'cat-finanzen': return <P.FinanzenDashboard g={g} onGoto={setScreen} />;
    case 'cat-verein': return <P.VereinDashboard g={g} onGoto={setScreen} onChange={ch} />;
    case 'cat-training': return <P.TrainingDashboard g={g} onGoto={setScreen} />;
    // Einzelseiten
    case 'presse': return <P.PressView g={g} onWatch={onWatch} onGoto={setScreen} />;
    case 'vertraege': return <P.ContractsView g={g} onChange={ch} />;
    case 'nationalteams': return <P.NationalView g={g} onGoto={setScreen} />;
    case 'meldung': return <P.RegistrationView g={g} onChange={ch} />;
    case 'reserve': return <P.ReserveTeamView g={g} onChange={ch} onGoto={setScreen} />;
    case 'beobachtung': return <P.BeobachtungView g={g} onChange={ch} />;
    case 'spielerpool': return <P.PlayerPoolView g={g} onChange={ch} />;
    case 'scouting': return <P.ScoutingView g={g} onChange={ch} />;
    case 'verhandlungen': return <P.VerhandlungenView g={g} onChange={ch} />;
    case 'leihen': return <P.LoansView g={g} onChange={ch} />;
    case 'sponsoring': return <P.SponsoringView g={g} onGoto={setScreen} onChange={ch} />;
    case 'fanartikel': return <P.MerchView g={g} onChange={ch} />;
    case 'fans': return <P.FansView g={g} />;
    case 'kartenverkauf': return <P.TicketsView g={g} onChange={ch} onGoto={setScreen} />;
    case 'vorstand': return <P.VereinDashboard g={g} onGoto={setScreen} onChange={ch} />; // Vorstand entfällt (Wunsch Pascal): alte Verweise → Verein
    case 'international': return <P.InternationalView g={g} onWatch={onWatch} onReplayDraw={onReplayDraw} />;
    case 'halle': return <P.IndoorView g={g} onChange={ch} />;
    case 'auszeichnungen': return <P.AwardsView g={g} />;
    case 'ligensystem': return <P.LeagueSystemView g={g} onChange={ch} onGoto={setScreen} />;
    case 'trainingslager': return <P.TrainingCampView g={g} onChange={ch} />;
    case 'kabine': return <P.DressingRoomView g={g} onChange={ch} />;
    case 'trainerteam': return <P.TrainerTeamView g={g} onChange={ch} />;
    case 'jugendwettbewerbe': return <P.YouthCompetitionsView g={g} />;
    case 'jugendcamps': return <P.YouthCampsView g={g} onChange={ch} />;
    default: return null;
  }
}
