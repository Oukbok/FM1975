// =============================================================================
// Modul-Zustand zurücksetzen (Wunsch Pascal: ein zweites „Neues Spiel“ in derselben
// Sitzung startet genau wie nach dem Neuladen der Seite).
//
// Viele Engine-Module halten Werte auf Modulebene, die der Spielablauf setzt
// (Epoche, Liga-Gleichgewicht, Trainerteams, Auszeichnungen, Heimatland …) oder
// die als Zwischenspeicher dienen. `resetModuleState` bringt alle auf den Zustand
// nach dem Laden der Seite; danach setzen newGame bzw. prepareLoadedGame/processDay
// die Werte des Spielstands wieder. Aufruf am Anfang von `createNewGame` und
// `prepareLoadedGame`.
//
// Bewusst NICHT zurückgesetzt: Datensatz (applyDataset, Wappen-Datum, Welt-
// Überschreibung des Editors – setzt App/Assistent vor dem Spielaufbau) und
// App-Einstellungen (Ereignis-Häufigkeit, Gehaltsanzeige, Klickgeräusch).
//
// IDs: laufende Nummer im Spielstand (`Game.ids`, engine/idSeq.ts), gebunden von
// `bindGameIds` (newGame, Laden, jeder processDay, Saisonwechsel).
// =============================================================================
import type { Game } from './state';
import { setHomeNationKey } from '../data/origins';
import { clearNationSync } from './nationSync';
import { bindIdCounter, resetIdCounter } from '../engine/idSeq';
import { resetTransferDate } from '../engine/transfers';
import { resetDevelopmentState } from '../engine/development';
import { resetYouthState } from '../engine/youth';
import { resetTalentSupply } from '../engine/talent';
import { resetStarRng } from '../engine/clubStars';
import { resetGenerateState } from '../data/generate';
import { resetPositionsState } from '../engine/positions';
import { refreshSkills } from '../engine/match/skills';
import { clearPreparedMatches } from '../engine/match';
import { resetInjuryRiskHook } from '../engine/injuryRisk';
import { setPortraitGame } from './playerPortraits';
import { setAttendanceEuphoria } from '../data/history';
import { setCurrencyDate, setHomeCurrency } from '../engine/economy';
import { resetRegistrationState } from '../engine/registration';
import { resetHonourEffects } from '../engine/honourEffects';
import { resetClubHonoursState } from './clubHonours';
import { resetLocalClubs } from './youthComps/localClubs';
import { setFormationYear } from '../data/formations';
import { setHomeLabel } from '../engine/leagues';
import { setHomeOrigin } from '../data/origins';
import { setTransferSink } from '../engine/history';
import { clearCohesionCache } from '../engine/cohesion';
import { clearPlotCache } from '../engine/groundsPlots';
import { clearSellerCache } from './transferTalks';
import { clearPoolCache } from './playerPool';
import { clearNationalCache } from './national/pool';
import { clearLegendCache } from './legendsGame';
import { clearHomeDeepCache } from './homeDeep';
import { setDisplayYear } from '../ui/format';
import { clearWorldRosters } from '../engine/euroLight';
import { clearLeanMemo } from './worldScorers';
import { setCompetitionDate } from '../data/competitions/overrides';

/** Alle Module auf den Ausgangszustand (wie nach dem Laden der Seite). */
export function resetModuleState(): void {
  // --- Zustand, der Ergebnisse beeinflusst ---
  resetIdCounter();            // laufende Nummer für IDs (bis newGame/Laden den Zähler des Spielstands bindet)
  resetTransferDate();         // engine/transfers.ts: Datum der Transferbuchungen (früher die Uhrzeit beim Seitenstart)
  resetDevelopmentState();     // Trainerteams je Verein, Weltklasse-Bremse, Epochen-Ausgleich
  resetYouthState();           // Jugendpotenzial-Verschiebung, Talent-Salz
  resetTalentSupply();         // Talent-Angebot (Liga-Gleichgewicht)
  resetStarRng();              // Sterne-Würfel der Startkader
  resetGenerateState();        // Startwert/Erzeugungsdatum des Welt-Generators
  resetPositionsState();       // Spieljahr der Positionsgewichte
  resetInjuryRiskHook();       // Verletzungsrisiko-Haken (hing am vorigen Spielstand)
  setPortraitGame(null);       // Spielerbilder: Spielstand der Zuordnung (GameShell setzt den neuen)
  setAttendanceEuphoria(null); // WM-Euphorie
  setHomeCurrency('ger'); setCurrencyDate(null); setDisplayYear(1975); setCompetitionDate(null);
  resetRegistrationState();    // Heimat-Nationalität, Europapokal-Meldelisten
  resetHonourEffects();        // Auszeichnungen/Werbung/Stab-Faktor
  resetClubHonoursState();     // gebundener Spielstand, Spielbeginn
  resetLocalClubs();           // Stadt der Ortsvereine (Jugend)
  setFormationYear(1975);
  setHomeLabel('Deutschland'); setHomeOrigin(null); setHomeNationKey(null); clearNationSync();
  setTransferSink(null);       // Transferprotokoll (hing am vorigen Spielstand)
  clearPreparedMatches();      // vorbereitete eigene Spiele (Schlüssel = Vereine + Datum)
  // --- reine Zwischenspeicher (harmlos, aber Schlüssel kennen den Spielstand nicht) ---
  refreshSkills();
  clearCohesionCache();
  clearPlotCache();
  clearSellerCache();
  clearPoolCache();
  clearNationalCache();
  clearLegendCache();
  clearHomeDeepCache(); // 3./4. Ebene des Heimatlandes (game/homeDeep.ts)
  clearWorldRosters();  // Weltspieler je Verein für Hintergrundspiele (engine/euroLight.ts)
  clearLeanMemo();      // Verteilung der Auslandsstatistik im Saisonwechsel (game/worldScorers.ts)
}

/** Zähler des Spielstands für IDs binden (fehlt bei älteren Spielständen → beginnt bei 0, neues ID-Format). */
export function bindGameIds(g: Game): void {
  bindIdCounter(g.ids ??= { n: 0 });
}
