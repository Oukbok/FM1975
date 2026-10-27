import ClubCrest from '../components/ClubCrest';
import ClubEditorModal from '../components/ClubEditorModal';
import Icon from '../components/Icon';
import LineupView from '../components/LineupView';
import MatchLiveView from '../components/MatchLiveView';
import TacticsView from '../components/TacticsView';
import { ACTIVITY_DEFS, activityIncomeBase } from '../data/activities';
import { EURO_COMP_NAMES } from '../data/europe';
import { marketingIncomeBase, marketingMonthlyBase, marketingReputationNudge } from '../data/marketing';
import { computeStaffEffects, staffMonthlyTotal } from '../data/staff';
import { CalendarEngine } from '../engine/calendar';
import { drawRound, roundWinners, simulateCupTie } from '../engine/cup';
import { RatingResult, runRatingCeremony, runWeeklyDevelopment, updateAges } from '../engine/development';
import { economyScale, yearOf } from '../engine/economy';
import { drawEuroRound, simulateEuroTie } from '../engine/euro';
import { book, bookCupHomeMatch, bookCupPrize, bookMonthly } from '../engine/finances';
import { applyMatchEffects } from '../engine/form';
import { dataScoutingBonus, medicalRecoveryBonus, medicalRehabBonus, nlzGrowthBonus, rehaRecoveryBonus, rehaRehabBonus } from '../engine/infrastructure';
import { makeMessage, pushMessage } from '../engine/messages';
import { AppSettings, nextFreeSlot, saveGame } from '../engine/save';
import { dailyRecovery } from '../engine/training';
import { runAITransfers, setTransferDate } from '../engine/transfers';
import { applyDailyTraining } from '../engine/weeklyTraining';
import { academyIntake, ageYouthPlayers, developYouthWeekly, graduateYouth } from '../engine/youth';
import { cupNextDrawMessage, cupResultMessage, euroDrawMessage, euroResultMessage, euroWinnerChronicle } from '../game/competitions';
import { emitMatchMessage, simulateMatchday, startNextSeason } from '../game/season';
import { Game, bumpMorale } from '../game/state';
import { PlayerDevReveal } from '../types';
import { fmtDM, fmtDMfull, fmtDateFull, setDisplayYear } from '../ui/format';
import { FinanzenDashboard, KaderDashboard, SpieltagDashboard, StatistikenDashboard, TransfersDashboard, VereinDashboard } from '../views/categoryDashboards';
import { FinancesView } from '../views/finanzen/FinancesView';
import { MarketingView } from '../views/finanzen/MarketingView';
import { SponsoringView } from '../views/finanzen/SponsoringView';
import { DevelopmentReveal, RatingCeremony } from '../views/kader/DevelopmentReveal';
import { SquadView } from '../views/kader/SquadView';
import { TrainingView } from '../views/kader/TrainingView';
import { VertraegeView } from '../views/kader/VertraegeView';
import { YouthView } from '../views/kader/YouthView';
import { SaveLoadModal, SettingsModal } from '../views/modals/SaveLoadModal';
import { FixturesView } from '../views/spieltag/FixturesView';
import { MatchModal } from '../views/spieltag/MatchModal';
import { ChronicleView } from '../views/statistiken/ChronicleView';
import { CupView } from '../views/statistiken/CupView';
import { InternationalView } from '../views/statistiken/InternationalView';
import { TableView } from '../views/statistiken/TableView';
import { BeobachtungView, TransfersView, VerhandlungenView } from '../views/transfers/TransfersView';
import { FacilitiesView } from '../views/verein/FacilitiesView';
import { FansView } from '../views/verein/FansView';
import { StadiumView } from '../views/verein/StadiumView';
import { StaffView } from '../views/verein/StaffView';
import { WikiView } from '../views/wiki/WikiView';
import { CalendarView } from '../views/zentrale/CalendarView';
import { Dashboard } from '../views/zentrale/Dashboard';
import { NewsView } from '../views/zentrale/NewsView';
import { PresseView } from '../views/zentrale/PresseView';
import { CalendarStrip } from './CalendarStrip';
import { MENU_STRUCTURE, Screen, TopNav } from './navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// SPIEL-SHELL (In-Game UI)
// =============================================================================
export function GameShell({ game, rerender, currentSlot, setCurrentSlot, settings, onExit, onLoad, onUpdateSettings }: {
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
