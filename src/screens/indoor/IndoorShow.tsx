// =============================================================================
// HALLEN-SHOW – Vollbild am Turniertag deines Vereins im hellen Akte-Look
// (Papier, dunkelblaue Köpfe; die gezeichnete Halle IndoorHall.tsx erscheint als
// Bild bei „Nächstes Spiel“ und in der Siegerehrung). Ablauf: Startseite (Regeln, Teilnehmer,
// Hallenkader) → Spiel für Spiel: eigene Spiele mit kleiner Entscheidung
// (Ausrichtung, Einsatz, Torwart raus) als kurzer Textmodus oder Ergebnis, fremde
// Spiele laufen als Ergebnisse durch, Tabellen live → Siegerehrung mit Prämie
// und Wirkungen. „Alles simulieren“ jederzeit. Feste Fenstergröße, Inhalte
// scrollen intern. Rechnung: engine/indoorLive.ts + engine/indoorMatch.ts,
// Verbuchung: finishIndoorShow (game/indoorGame.ts), Auslöser: game.indoor.current.live
// (DayUi.onIndoorShow → GameShell). CSS 28-indoor.css (.ix-*).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import type { AppSettings } from '../../engine/save';
import type { IndoorResult } from '../../engine/indoor';
import {
  autoPlaySlot, createIndoorLive, liveOver, liveResult, nextSlot, playRest, setSlotMatch, type LiveSlot,
} from '../../engine/indoorLive';
import { DEFAULT_INDOOR_PLAN, playIndoorMatch, type IndoorPlan, type IndoorPlay } from '../../engine/indoorMatch';
import { hashStr, mulberry32 } from '../../engine/leagues';
import { candidatesOf, finishIndoorShow, indoorWinPts, tournamentEntrants, type IndoorOutcome } from '../../game/indoorGame';
import type { Game } from '../../game/state';
import type { IndoorTournament } from '../../game/winterShared';
import { countryName } from '../../game/worldPool';
import { fmtDateFull } from '../../ui/format';
import { IndoorMatchPanel, type TickSpeed } from './IndoorMatchPanel';
import { GroupTablesPanel, SchedulePanel } from './IndoorPanels';
import { CeremonyStage, IntroStage, NextStage, roundOf, type IndoorRound } from './IndoorStageParts';
import { indoorSide, narrate, type TickLine } from './indoorScript';

type Phase = 'intro' | 'board' | 'match' | 'done';
const KIND_LABEL: Record<IndoorTournament['kind'], string> = {
  invite: 'Einladungsturnier', qualifier: 'DFB-Hallenpokal · Qualifikation', masters: 'DFB-Hallenpokal · Endrunde', regional: 'Regionalturnier',
  abroad: 'Internationales Hallenturnier',
};

export function IndoorShow({ g, t, settings, onSettings, onClose }: {
  g: Game; t: IndoorTournament; settings: AppSettings; onSettings: (s: AppSettings) => void; onClose: () => void;
}) {
  const mid = g.managedClubId;
  const year = parseInt(t.date.slice(0, 4), 10);
  const seed = `${g.season}|${t.id}|${mid}|live`;
  const first = useMemo(() => tournamentEntrants(g, t), [g, t]);
  const [squads, setSquads] = useState(first.squads);
  const live = useRef(createIndoorLive(first.entrants, indoorWinPts(g), seed)).current;
  // Hallenkader vor Turnierbeginn wählen (Wunsch Pascal): Auswahl am Turnier merken, Hallenstärke neu.
  const pickSquad = (ids: string[]) => {
    t.ownIds = ids;
    const next = tournamentEntrants(g, t);
    const me = next.entrants.find((e) => e.id === mid);
    if (me) live.strength[mid] = me.strength;
    setSquads(next.squads);
  };
  const [, setVer] = useState(0);
  const bump = () => setVer((v) => v + 1);
  const [phase, setPhase] = useState<Phase>('intro');
  const [plan, setPlan] = useState<IndoorPlan>(DEFAULT_INDOOR_PLAN);
  const [speed, setSpeed] = useState<TickSpeed>(settings.indoorSpeed ?? 'normal');
  const [cur, setCur] = useState<{ slot: LiveSlot; play: IndoorPlay; lines: TickLine[] } | null>(null);
  const [last, setLast] = useState<LiveSlot | undefined>();
  const [fresh, setFresh] = useState<number | undefined>();
  // Fremde Spiele laufen: 'own' = bis du wieder dran bist, sonst nur die genannte Runde (Wunsch Pascal: „Zum Halbfinale“).
  const [running, setRunning] = useState<false | 'own' | IndoorRound>(false);
  const [final, setFinal] = useState<{ res: IndoorResult; out?: IndoorOutcome } | null>(null);
  const blockGames = useRef(0);

  useEffect(() => { if (speed !== (settings.indoorSpeed ?? 'normal')) onSettings({ ...settings, indoorSpeed: speed }); }, [speed]);

  const isOwn = (s?: LiveSlot) => !!s && (s.a === mid || s.b === mid);
  const isOwnLeft = () => live.slots.some((s) => !s.match && (s.a === mid || s.b === mid));
  const ownPlay = (s: LiveSlot): IndoorPlay => {
    const own: 0 | 1 = s.a === mid ? 0 : 1;
    const a = indoorSide(s.a!, live.strength[s.a!], squads.get(s.a!));
    const b = indoorSide(s.b!, live.strength[s.b!], squads.get(s.b!));
    if (plan.block) blockGames.current++;
    return playIndoorMatch(a, b, s.stage, own, plan, year, mulberry32(hashStr(`${seed}|own|${s.no}`)));
  };
  const finish = () => {
    if (final) return;
    const res = liveResult(live);
    const out = finishIndoorShow(g, t.id, res, blockGames.current);
    setFinal({ res, out });
    setPhase('done');
  };
  const afterSlot = (s: LiveSlot) => {
    setLast(s); setFresh(s.no);
    if (liveOver(live)) finish(); else bump();
  };

  // Fremde Spiele nacheinander aufdecken, bis du wieder dran bist (oder Turnierende).
  useEffect(() => {
    if (!running) return;
    const s = nextSlot(live);
    if (!s || isOwn(s)) { setRunning(false); if (!s) finish(); return; }
    // Runde zu Ende: Bist du in der nächsten Runde dabei (z. B. Halbfinale 2), laufen die Spiele davor
    // ohne weiteren Klick bis zu deinem Spiel (Wunsch Pascal), sonst Halt vor der neuen Runde.
    if (running !== 'own' && roundOf(s.stage) !== running) { setRunning(isOwnLeft() ? 'own' : false); return; }
    const timer = setTimeout(() => { autoPlaySlot(live, s); afterSlot(s); }, speed === 'schnell' ? 220 : speed === 'langsam' ? 900 : 480);
    return () => clearTimeout(timer);
  });

  const slot = phase === 'board' ? nextSlot(live) : undefined;
  const startText = () => {
    if (!slot) return;
    const play = ownPlay(slot);
    const lines = narrate(g, play, slot.a === mid ? 0 : 1, { hall: t.hall, city: t.city, year, seed: `${seed}|${slot.no}` });
    setCur({ slot, play, lines });
    setPhase('match');
  };
  const quickResult = () => { if (!slot) return; setSlotMatch(live, slot, ownPlay(slot).match); afterSlot(slot); };
  const endText = () => {
    if (!cur) return;
    setSlotMatch(live, cur.slot, cur.play.match);
    setCur(null);
    setPhase('board');
    afterSlot(cur.slot);
  };
  const simAll = () => {
    setRunning(false);
    if (cur) { setSlotMatch(live, cur.slot, cur.play.match); setCur(null); }
    playRest(live, (s) => (isOwn(s) ? ownPlay(s).match : null));
    finish();
  };

  // Enter/Leertaste auf der Übersicht: Hauptknopf.
  useEffect(() => {
    if (phase !== 'board' && phase !== 'intro' && phase !== 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.cmx-overlay') || running) return;
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      e.preventDefault();
      if (phase === 'intro') setPhase('board');
      else if (phase === 'done') onClose();
      else if (isOwn(slot)) startText();
      else if (slot) setRunning(isOwnLeft() ? 'own' : roundOf(slot.stage));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const masters = t.kind === 'masters';
  return (
    <div className={`ix-root phase-${phase}`} role="dialog" aria-label={t.name}>
      <header className="ix-top">
        <div className="ix-top-l">
          <span className="ix-kicker">{t.kind === 'abroad' && t.cc ? `${KIND_LABEL[t.kind]} · ${countryName(t.cc)}` : KIND_LABEL[t.kind]}</span>
          <h1 className="ix-title">{t.name}</h1>
          <span className="ix-sub">{t.hall}, {t.city} · {fmtDateFull(t.date)}{masters ? ' · zwei Tage' : ''}</span>
        </div>
        {phase !== 'done' && (
          <div className="ix-top-r">
            <button className="ix-btn" onClick={simAll} disabled={!!running}><Icon name="skip" size={22} /> Alles simulieren</button>
          </div>
        )}
      </header>
      <div className="ix-main">
        <aside className="ix-panel ix-left">
          <GroupTablesPanel g={g} live={live} />
        </aside>
        <main className="ix-panel ix-center">
          {phase === 'intro' && <IntroStage g={g} t={t} live={live} squad={squads.get(mid) ?? []} squads={squads} cands={candidatesOf(g, mid)} onSquad={pickSquad} onStart={() => setPhase('board')} onAll={simAll} />}
          {phase === 'board' && slot && (
            <NextStage g={g} live={live} slot={slot} plan={plan} onPlan={setPlan} year={year} last={last}
              onText={startText} onResult={quickResult} onOthers={() => setRunning(isOwnLeft() ? 'own' : roundOf(slot.stage))} />
          )}
          {phase === 'match' && cur && (
            <IndoorMatchPanel key={cur.slot.no} g={g} play={cur.play} lines={cur.lines} speed={speed} onSpeed={setSpeed}
              minutesLabel={`1 × ${cur.play.minutes} Min.`} onDone={endText} />
          )}
          {phase === 'done' && final && <CeremonyStage g={g} t={t} res={final.res} out={final.out} onClose={onClose} />}
        </main>
        <aside className="ix-panel ix-right">
          <h3 className="ix-h">Spielplan</h3>
          <div className="ix-scroll"><SchedulePanel g={g} live={live} current={phase === 'match' ? cur?.slot : slot} fresh={fresh} /></div>
        </aside>
      </div>
    </div>
  );
}
