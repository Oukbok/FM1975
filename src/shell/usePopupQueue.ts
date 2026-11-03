// =============================================================================
// Fensterkette des laufenden Spiels (Pausen-Fenster): Zustand, Fälligkeiten und
// die feste Reihenfolge. Immer nur EIN Pausen-Fenster zur Zeit:
//   Spielbericht/Textmodus/Bewertung/Briefing/Budget → Auslosung → Trainingslager
//   → Hallenturnier → Transferbilanz → Erstes Training → Goldener Ball
//   → Die Besten der Saison → Vorschau „Nächstes Spiel“.
// Solange eines offen ist, steht die Zeit. Gezeichnet in shell/PopupLayer.tsx.
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RatingResult } from '../engine/development';
import type { AppSettings } from '../engine/save';
import type { MatchSim } from '../engine/match/sim';
import type { DayUi } from '../game/day';
import type { OwnMatchInfo } from '../game/ownMatch';
import { clearPendingAwards, pendingAwards } from '../game/seasonAwardsGame';
import { clearPendingGoldenBall, pendingGoldenBall } from '../game/goldenBallGame';
import { pendingIndoorShow, playIndoorShowHeadless } from '../game/indoorGame';
import { briefingLog, briefingOfRecord, clearPendingBriefing } from '../game/seasonBriefing';
import { pendingSeasonPromises } from '../game/seasonPromisesGame';
import type { Game } from '../game/state';
import type { PlayerDevReveal } from '../types';
import type { DrawComp } from '../types/draw';

/**
 * Fenster gesehen → passende Nachricht der letzten Tage als gelesen markieren, damit dieselbe
 * Information nicht gleich danach noch einmal als „ungelesen“ im Newscenter wartet.
 */
export function markShownRead(g: Game, prefix: string, contains = ''): void {
  const today = g.calendar.currentDate;
  const from = new Date(Date.parse(today.slice(0, 10) + 'T00:00:00Z') - 3 * 86400000).toISOString().slice(0, 10);
  for (const m of g.messages ?? []) {
    if (!m.read && !m.choices?.length && m.date >= from && m.date <= today && m.subject.startsWith(prefix) && m.subject.includes(contains)) m.read = true;
  }
}

export interface DrawItem { comp: DrawComp; roundIndex: number; replay?: boolean; n: number }
export type RatingCeremonyState = { results: RatingResult[]; type: 'medium' | 'large'; anlass: string };

export function usePopupQueue(g: Game, settings: AppSettings, rerender: () => void, setRunning: (r: boolean) => void) {
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  // Textmodus: laufende Live-Simulation des eigenen Spiels (eigene Oberfläche ohne Menü)
  const [textMatch, setTextMatch] = useState<{ sim: MatchSim; info: OwnMatchInfo } | null>(null);
  const watchedRef = useRef(false);
  const [devReveal, setDevReveal] = useState<PlayerDevReveal[] | null>(null);
  // Pokalauslosungen: Warteschlange der Shows (live am Auslosungstag oder Wiederholung).
  const [drawQueue, setDrawQueue] = useState<DrawItem[]>([]);
  const drawSeq = useRef(0);
  const replayDraw = useCallback((comp: DrawComp, roundIndex: number) => setDrawQueue((q) => [...q, { comp, roundIndex, replay: true, n: ++drawSeq.current }]), []);
  // Rückkehr aus dem Trainingslager: Buchungs-IDs für die animierte Zusammenfassung.
  const [campQueue, setCampQueue] = useState<string[]>([]);
  const [twKey, setTwKey] = useState<string | null>(null); // Transferbilanz nach Fensterschluss
  // Vorschau „Nächstes Spiel“: für dieses Spiel weggeklickt (Match-ID).
  const [prematchClosed, setPrematchClosed] = useState<string | null>(null);
  const [ratingCeremony, setRatingCeremony] = useState<RatingCeremonyState | null>(null);

  // Saison-Briefing: zu Spielbeginn und nach dem Saisonwechsel automatisch zeigen
  // (game/seasonBriefing.ts merkt es in g.briefing.pending vor; Laden setzt es zurück).
  const pendingSeason = g.briefing?.pending;
  const autoBriefing = settings.briefingAuto !== false;
  const pendingRec = pendingSeason && autoBriefing ? briefingLog(g).records.find((r) => r.season === pendingSeason) : undefined;
  useEffect(() => {
    if (pendingSeason && (!autoBriefing || !pendingRec)) { clearPendingBriefing(g); rerender(); }
  }, [pendingSeason, autoBriefing, pendingRec, g, rerender]);
  useEffect(() => { if (pendingRec) setRunning(false); }, [pendingRec]);
  const pendingBriefing = useMemo(() => (pendingRec ? briefingOfRecord(pendingRec) : null), [pendingRec]);
  const closeBriefing = useCallback(() => { markShownRead(g, 'Saison-Briefing '); clearPendingBriefing(g); rerender(); }, [g, rerender]);
  // Saisonbudget (game/budgetPlan.ts): nach dem Briefing; `popupHold` hält alle späteren Fenster zurück.
  const budgetDue = !pendingBriefing && !!g.budget?.pending && g.budget.pending === g.season;
  useEffect(() => { if (budgetDue) setRunning(false); }, [budgetDue]);
  const popupHold = !!pendingBriefing || budgetDue;
  // Die Besten der Saison (game/seasonAwardsGame.ts): Popup nach dem letzten Ligaspieltag.
  const awardsDue = pendingAwards(g);
  useEffect(() => { if (awardsDue) setRunning(false); }, [awardsDue]);
  const closeAwards = useCallback(() => { markShownRead(g, 'Die Besten der Saison'); clearPendingAwards(g); rerender(); }, [g, rerender]);
  // Goldener Ball (game/goldenBallGame.ts): Gala am 20. Dezember.
  const galaDue = pendingGoldenBall(g);
  useEffect(() => { if (galaDue) setRunning(false); }, [galaDue]);
  const closeGala = useCallback(() => { if (galaDue) markShownRead(g, `${galaDue.title} ${galaDue.year}`); clearPendingGoldenBall(g); rerender(); }, [g, rerender, galaDue]);
  // Einstellung „Ehrungen als Fenster“ aus: nur Nachricht, Vormerkung sofort löschen.
  useEffect(() => {
    if (settings.awardsShow !== 'aus') return;
    if (awardsDue) clearPendingAwards(g);
    if (galaDue) clearPendingGoldenBall(g);
    if (awardsDue || galaDue) rerender();
  }, [settings.awardsShow, awardsDue, galaDue, g, rerender]);
  const showAwards = settings.awardsShow !== 'aus';
  // Hallenturnier deines Vereins als Show (game/indoorGame.ts → screens/indoor/); Einstellung aus = Hintergrund.
  const indoorDue = pendingIndoorShow(g);
  const indoorOn = settings.indoorShow !== 'aus';
  useEffect(() => { if (indoorDue) setRunning(false); }, [indoorDue]);
  useEffect(() => { if (indoorDue && !indoorOn) { playIndoorShowHeadless(g); rerender(); } }, [indoorDue, indoorOn, g, rerender]);
  // Erstes Training (game/seasonPromisesGame.ts): Versprechen-Popup; unter Playwright nur mit window.__FM_PROMISES__.
  const promisesDue = !!pendingSeasonPromises(g) && (!navigator.webdriver || !!(window as { __FM_PROMISES__?: boolean }).__FM_PROMISES__);
  // Solange ein Pausen-Fenster offen ist (Bewertungsrunde, Entwicklung, Transferbilanz, Erstes Training),
  // steht die Zeit – sonst liefen im Hintergrund Tage weiter.
  useEffect(() => { if (ratingCeremony || devReveal || twKey || promisesDue) setRunning(false); }, [ratingCeremony, devReveal, twKey, promisesDue]);

  /** Rückrufe des Tagesablaufs (game/day.ts) → Fenster vormerken. */
  const dayUi = useCallback((onSeasonEnd: () => void): DayUi => ({
    // Spielbericht nach „Schnell simulieren“; nach dem Textmodus nicht nochmal.
    onOwnMatch: (id) => {
      if (watchedRef.current) { watchedRef.current = false; return; }
      // Einstellung „Spielbericht nach dem Simulieren“: nur Pokal/Europapokal bzw. nie (weniger Pflicht-Klicks).
      const rep = settings.matchReport ?? 'immer';
      if (rep === 'nie' || (rep === 'pokal' && g.fixtures.some((f) => f.id === id))) return;
      setLiveMatchId(id);
    },
    onOwnMatchDue: () => setRunning(false),
    onRatingCeremony: (c) => setRatingCeremony(c),
    onSeasonEnd,
    onCupDraw: (d) => {
      const mode = settings.drawShow ?? 'eigener';
      if (mode === 'aus' || (mode === 'eigener' && !d.involvesMe)) return false;
      setDrawQueue((q) => [...q, { comp: d.comp, roundIndex: d.roundIndex, n: ++drawSeq.current }]);
      return true;
    },
    onCampEnd: (id) => { setCampQueue((q) => [...q, id]); return true; },
    onTransferWindow: (k) => { if (settings.transferWindowShow === false) return false; setTwKey(k); return true; },
    onIndoorShow: () => settings.indoorShow !== 'aus',
  }), [g, settings.matchReport, settings.drawShow, settings.transferWindowShow, settings.indoorShow]);

  return {
    liveMatchId, setLiveMatchId, textMatch, setTextMatch, watchedRef, devReveal, setDevReveal,
    drawQueue, setDrawQueue, replayDraw, campQueue, setCampQueue, twKey, setTwKey,
    prematchClosed, setPrematchClosed, ratingCeremony, setRatingCeremony,
    pendingBriefing, closeBriefing, budgetDue, popupHold, awardsDue, closeAwards, galaDue, closeGala, showAwards,
    indoorDue, indoorOn, promisesDue, dayUi,
  };
}
export type PopupQueue = ReturnType<typeof usePopupQueue>;

/** Welche Fenster jetzt dran sind (feste Reihenfolge, s. Kopf). */
export function chainFlags(q: PopupQueue, due: OwnMatchInfo | null, prematchOn: boolean) {
  const chainBase = !q.textMatch && !q.liveMatchId && !q.ratingCeremony && !q.popupHold && !q.devReveal;
  const draws = q.drawQueue.length > 0, camps = q.campQueue.length > 0;
  const drawOn = chainBase && draws;
  const campOn = chainBase && !draws && camps;
  // Hallenturnier als Show (screens/indoor/) nach Auslosung/Trainingslager, vor der Transferbilanz.
  const indoorBusy = !!q.indoorDue && q.indoorOn;
  const indoorShowOn = indoorBusy && chainBase && !draws && !camps;
  const twOn = !!q.twKey && chainBase && !draws && !camps && !indoorBusy;
  const promisesOn = q.promisesDue && chainBase && !draws && !camps && !indoorBusy && !q.twKey;
  const galaOn = !!q.galaDue && q.showAwards && chainBase && !draws && !camps && !indoorBusy && !q.twKey && !q.promisesDue;
  const awardsOn = !!q.awardsDue && q.showAwards && !q.galaDue && chainBase && !draws && !camps && !indoorBusy && !q.twKey && !q.promisesDue;
  const showPrematch = !!due && prematchOn && q.prematchClosed !== due.matchId && chainBase
    && !draws && !camps && !indoorBusy && !q.twKey && !promisesOn && !galaOn && !awardsOn;
  return { chainBase, drawOn, campOn, indoorShowOn, twOn, promisesOn, galaOn, awardsOn, showPrematch };
}
export type ChainFlags = ReturnType<typeof chainFlags>;
