// Alle Fenster über der Spiel-Shell, in fester DOM-Reihenfolge (= Stapelung):
// Menü-Fenster (Chronik, Einstellungen, Speichern/Laden, Editor), Kalender-Overlay,
// dann die Fensterkette aus shell/usePopupQueue.ts. Große Fenster werden nachgeladen.
import type { AppSettings } from '../engine/save';
import { completeOwnMatch, OwnMatchInfo } from '../game/ownMatch';
import { compCup } from '../game/cupDraw';
import type { Game } from '../game/state';
import { SaveLoadModal, SettingsModal } from '../views/modals/SaveLoadModal';
import { CalendarOverlay } from './CalendarOverlay';
import { LazyWin } from './LazyFallback';
import * as P from './lazyParts';
import type { Screen } from './navigation';
import { ChainFlags, markShownRead, PopupQueue } from './usePopupQueue';
import type { ContractOpenReq } from '../screens/contract/contractOpen';

export interface MenuWindows {
  chronicleOpen: boolean; closeChronicle: () => void;
  showSettings: boolean; closeSettings: () => void;
  saveLoadMode: 'save' | 'load' | null; closeSaveLoad: () => void;
  clubEditorOpen: boolean; closeClubEditor: () => void;
  currentSlot: string | null;
  doSave: (slot?: string, name?: string) => void;
  onLoad: (slot: string) => void;
  /** Verhandlungstisch (screens/contract/), liegt über allem. */
  contractReq: (ContractOpenReq & { n: number }) | null;
  closeContract: () => void;
}

export function PopupLayer({ g, settings, onSettings, rerender, q, f, due, calLive, setRunning, quickSim, startText, finishText, setScreen, w }: {
  g: Game; settings: AppSettings; onSettings: (s: AppSettings) => void; rerender: () => void;
  q: PopupQueue; f: ChainFlags; due: OwnMatchInfo | null; calLive: boolean; setRunning: (r: boolean) => void;
  quickSim: () => void; startText: () => void; finishText: () => void; setScreen: (s: Screen) => void; w: MenuWindows;
}) {
  const myClub = g.clubs[g.managedClubId];
  const draw = q.drawQueue[0];
  return (
    <>
      {w.chronicleOpen && <LazyWin><P.ChronicleModal g={g} onClose={w.closeChronicle} /></LazyWin>}
      <CalendarOverlay g={g} show={calLive} speedMs={g.calendar.speedMs} delayMs={150} onPause={() => setRunning(false)} />
      {w.showSettings && <SettingsModal settings={settings} onClose={w.closeSettings} onSave={onSettings} />}
      {w.saveLoadMode && (
        <SaveLoadModal mode={w.saveLoadMode} currentSlot={w.currentSlot} onClose={w.closeSaveLoad}
          onSave={(slot, name) => { w.doSave(slot, name); w.closeSaveLoad(); }}
          onLoad={(slot) => { w.closeSaveLoad(); w.onLoad(slot); }} />
      )}
      {w.clubEditorOpen && (
        <LazyWin>
          <P.ClubEditorModal club={myClub} clubs={Object.values(g.clubs)} onClose={w.closeClubEditor}
            onSaved={(clubId, patch) => { if (clubId === g.managedClubId) Object.assign(myClub, patch); rerender(); w.doSave(); }} />
        </LazyWin>
      )}

      {f.showPrematch && due && (
        <LazyWin>
          <P.PrematchScreen g={g} info={due} settings={settings} onSettings={onSettings}
            onStart={(mode) => { q.setPrematchClosed(due.matchId); if (mode === 'sim') quickSim(); else startText(); }}
            onLineup={() => { q.setPrematchClosed(due.matchId); setScreen('lineup'); }}
            onClose={() => q.setPrematchClosed(due.matchId)} />
        </LazyWin>
      )}

      {q.textMatch && (
        <LazyWin>
          <P.MatchScreen g={g} sim={q.textMatch.sim} info={q.textMatch.info} settings={settings} onSettings={onSettings}
            onComplete={() => completeOwnMatch(g, q.textMatch!.info, q.textMatch!.sim, true)}
            onFinish={finishText} />
        </LazyWin>
      )}

      {/* Ziehungs-Show: erst wenn Spielbericht/Textmodus/Zeremonie/Briefing zu sind. */}
      {draw && f.drawOn && (() => {
        const rec = compCup(g, draw.comp)?.rounds[draw.roundIndex]?.draw;
        if (!rec) { setTimeout(() => q.setDrawQueue((x) => x.slice(1)), 0); return null; }
        return (
          <LazyWin>
            <P.DrawShow key={draw.n} g={g} rec={rec} replay={draw.replay} settings={settings} onSettings={onSettings}
              onClose={() => { if (!draw.replay) markShownRead(g, `Auslosung ${rec.roundName}`); q.setDrawQueue((x) => x.slice(1)); rerender(); }} />
          </LazyWin>
        );
      })()}

      {/* Bilanz des Trainingslagers: nach Spielbericht/Zeremonie/Briefing/Auslosung. */}
      {f.campOn && q.campQueue[0] && (
        <LazyWin><P.CampRecap key={q.campQueue[0]} g={g} bookingId={q.campQueue[0]} onClose={() => { q.setCampQueue((x) => x.slice(1)); rerender(); }} /></LazyWin>
      )}

      {/* Hallenturnier als Show: nach Spielbericht/Zeremonie/Briefing/Auslosung/Trainingslager. */}
      {f.indoorShowOn && q.indoorDue && (
        <LazyWin><P.IndoorShow key={q.indoorDue.id} g={g} t={q.indoorDue} settings={settings} onSettings={onSettings} onClose={rerender} /></LazyWin>
      )}

      {/* Top-Transfers + Transferbilanz nach dem Fensterschluss: nach allen anderen Pausen-Fenstern. */}
      {f.twOn && q.twKey && (
        <LazyWin>
          <P.TransferWindowModal key={q.twKey} g={g} initialKey={q.twKey} auto settings={settings} onSettings={onSettings}
            onClose={() => { q.setTwKey(null); rerender(); }} />
        </LazyWin>
      )}
      {f.promisesOn && <LazyWin><P.FirstTrainingModal g={g} onClose={rerender} /></LazyWin>}
      {/* Goldener Ball, danach Die Besten der Saison. */}
      {f.galaOn && q.galaDue && <LazyWin><P.GalaShow g={g} y={q.galaDue} onClose={q.closeGala} /></LazyWin>}
      {f.awardsOn && q.awardsDue && (
        <LazyWin><P.AwardsModal g={g} s={q.awardsDue} onClose={q.closeAwards} onArchive={() => { q.closeAwards(); setScreen('auszeichnungen'); }} /></LazyWin>
      )}

      {q.liveMatchId && <LazyWin><P.MatchModal g={g} matchId={q.liveMatchId} onClose={() => { q.setLiveMatchId(null); rerender(); }} /></LazyWin>}

      {q.devReveal && <LazyWin><P.DevelopmentReveal g={g} reveals={q.devReveal} onClose={() => { q.setDevReveal(null); rerender(); }} /></LazyWin>}

      {q.pendingBriefing && (
        <LazyWin>
          <P.BriefingModal b={q.pendingBriefing} g={g} auto intro={settings.briefingIntro !== false} onClose={q.closeBriefing} onGoto={setScreen} />
        </LazyWin>
      )}

      {q.budgetDue && !q.textMatch && !q.liveMatchId && <LazyWin><P.BudgetModal g={g} auto onClose={rerender} /></LazyWin>}

      {q.ratingCeremony && (settings.ratingShow ?? 'an') !== 'aus' && (
        <LazyWin>
          <P.RatingShow g={g} results={q.ratingCeremony.results} anlass={q.ratingCeremony.anlass} settings={settings} onSettings={onSettings}
            onClose={() => { markShownRead(g, `${q.ratingCeremony!.anlass}: `, 'Aufwertungen'); q.setRatingCeremony(null); rerender(); }} />
        </LazyWin>
      )}
      {q.ratingCeremony && settings.ratingShow === 'aus' && (
        <LazyWin>
          <P.RatingCeremony results={q.ratingCeremony.results} type={q.ratingCeremony.type} anlass={q.ratingCeremony.anlass}
            onClose={() => { q.setRatingCeremony(null); rerender(); }} />
        </LazyWin>
      )}

      {/* Verhandlungstisch: aus Profil/Rechtsklick/Nachrichten/Transferverhandlung geöffnet, über allen Fenstern. */}
      {w.contractReq && (
        <LazyWin><P.ContractScreen key={w.contractReq.n} g={g} req={w.contractReq} onClose={w.closeContract} onChange={rerender} /></LazyWin>
      )}
    </>
  );
}
