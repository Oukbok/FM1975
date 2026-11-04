import Icon, { type IconName } from '../components/Icon';
import { getClubSeeds } from '../data/generate';
import { applyDataset } from '../data/dataset/apply';
import { BUILTIN_ID } from '../data/dataset/builtin';
import { cachedDataset } from '../data/dataset/storage';
import { AppSettings } from '../engine/save';
import { createNewGame } from '../game/newGame';
import type { Game } from '../game/state';
import { NewGameOptions } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { NewGameDraft, careerOffers, fullName, gameOptions, nameOk } from './newgame/draft';
import { StepManager } from './newgame/StepManager';
import { StepMode } from './newgame/StepMode';
import { StepWorld } from './newgame/StepWorld';
import { StepClub } from './newgame/StepClub';
import { StepLeagues } from './newgame/StepLeagues';
import { StepWelcome } from './newgame/StepWelcome';

// -----------------------------------------------------------------------------
// NEUES SPIEL — Assistent in sechs Schritten (Vorbild: große Managerspiele):
//   1. Manager  2. Spielmodus  3. Spielwelt  4. Verein  5. Ligensystem  6. Willkommen
// Im letzten Schritt wird die Spielwelt schon erzeugt (Kader, Vorstand, Fans), damit
// „Willkommen beim Verein“ echte Werte zeigt; „Karriere starten“ übernimmt genau
// dieses Spiel (App.tsx `startGame(opts, prebuilt)`).
// -----------------------------------------------------------------------------
export type { NewGameDraft } from './newgame/draft';

const STEPS: { label: string; sub: string; icon: IconName; title: string; lead: string; fill?: boolean }[] = [
  { label: 'Manager', sub: 'Persönliches & Profil', icon: 'squad', title: 'Dein Manager', lead: 'Wer übernimmt im Sommer 1975 die Trainerbank? Name, Herkunft und dein Profil als Trainer.' },
  { label: 'Spielmodus', sub: 'Modus & Optionen', icon: 'settings', title: 'Spielmodus wählen', lead: 'Wie beginnt deine Karriere – und nach welchen Regeln entwickelt sich die Welt um dich herum?' },
  { label: 'Spielwelt', sub: 'Datensatz & Länder', icon: 'international', title: 'Die Spielwelt', lead: 'Datensatz und alle Länder, deren Ligen im Hintergrund mitspielen.', fill: true },
  { label: 'Verein', sub: 'Land, Liga, Verein', icon: 'dashVerein', title: 'Verein auswählen', lead: 'Bei welchem Verein beginnst du? Du bleibst ihm treu – über alle Jahrzehnte.', fill: true },
  { label: 'Ligensystem', sub: 'Übersicht', icon: 'stats', title: 'Übersicht Ligensystem', lead: 'So ist der Fußball 1975/76 aufgebaut. Klick auf eine Liga, um ihre Vereine zu sehen.', fill: true },
  { label: 'Start', sub: 'Willkommen', icon: 'newGame', title: 'Dein erster Arbeitstag', lead: 'Mannschaft, Vorstand und Fans warten. Alles bereit für die Saison 1975/76.' },
];

const topClub = () => [...getClubSeeds()].sort((a, b) => b.reputation - a.reputation)[0]?.id ?? '';

export function NewGameScreen({ defaults, onBack, onStart, onSettings }: {
  defaults: AppSettings; onBack: () => void;
  onStart: (o: NewGameOptions, prebuilt?: Game) => void;
  onSettings?: (s: AppSettings) => void;
}) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<NewGameDraft>(() => {
    applyDataset(cachedDataset(BUILTIN_ID)); // Vorschau immer auf dem gewählten Datensatz
    return {
      datasetId: BUILTIN_ID, difficulty: 'normal', injuries: true, history: 'off', speedMs: defaults.speedMs,
      briefingAuto: defaults.briefingAuto !== false, briefingIntro: defaults.briefingIntro !== false, legends: true,
      mode: 'manager', offerSeed: Math.floor(Math.random() * 2 ** 31),
      league: 'tier1', clubId: topClub(),
      firstName: '', lastName: '', birthDay: 1, birthMonth: 1, birthYear: 1940,
      nationality: 'Deutschland', nationality2: '', avatarSeed: Math.random().toString(36).slice(2, 8),
      favoriteClubId: '', avoidClubId: '', style: 'balanced', background: 'ex_pro',
    };
  });
  const set = (p: Partial<NewGameDraft>) => setD((x) => ({ ...x, ...p }));

  const chooseDataset = (id: string) => {
    applyDataset(cachedDataset(id));
    set({ datasetId: id, league: 'tier1', clubId: topClub(), favoriteClubId: '', avoidClubId: '' });
  };
  const offers = useMemo(() => careerOffers(d.offerSeed, d.avoidClubId), [d.offerSeed, d.avoidClubId, d.datasetId]);
  const chooseMode = (m: NewGameDraft['mode']) => {
    if (m === d.mode) return;
    if (m === 'career' && offers[0]) set({ mode: m, clubId: offers[0].club.id, league: offers[0].league });
    else set({ mode: m });
  };

  // --- Spielwelt für „Willkommen“ vorab erzeugen (≈ 0,5 s) ---
  const optsKey = JSON.stringify({ ...gameOptions(d), speedMs: 0 });
  const [built, setBuilt] = useState<{ key: string; game: Game } | null>(null);
  useEffect(() => {
    if (step !== STEPS.length - 1 || built?.key === optsKey) return;
    const t = setTimeout(() => {
      applyDataset(cachedDataset(d.datasetId));
      setBuilt({ key: optsKey, game: createNewGame(gameOptions(d)) });
    }, 60);
    return () => clearTimeout(t);
  }, [step, optsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = built?.key === optsKey ? built.game : null;

  const canNext = step === 0 ? nameOk(d) : step === 3 ? !!d.clubId && (d.mode === 'manager' || offers.some((o) => o.club.id === d.clubId)) : true;
  const last = step === STEPS.length - 1;
  const start = () => {
    if (!ready) return;
    onSettings?.({ ...defaults, speedMs: d.speedMs, briefingAuto: d.briefingAuto, briefingIntro: d.briefingIntro });
    ready.calendar.speedMs = d.speedMs;
    onStart(gameOptions(d), ready);
  };
  const hint = step === 0 && !canNext ? 'Gib Vor- und Nachnamen ein (Nachname mindestens 2 Zeichen).'
    : last && !ready ? 'Die Spielwelt wird aufgebaut …' : `Schritt ${step + 1} von ${STEPS.length}`;

  return (
    <div className="ng-root">
      <div className="ng-bg" aria-hidden><img src="assets/start-tribuene.jpg" alt="" draggable={false} /></div>
      <header className="ng-head">
        <div className="ng-brand">
          <span className="ng-brand-y">1975</span>
          <span className="ng-brand-t">Neue Karriere{step > 0 && fullName(d) ? <small> · {fullName(d)}</small> : null}</span>
        </div>
        <nav className="ng-steps" aria-label="Schritte">
          {STEPS.map((s, i) => (
            <button key={s.label} className={`ng-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
              disabled={i > step} onClick={() => i < step && setStep(i)}>
              <span className="ng-step-no">{i + 1}</span>
              <span className="ng-step-txt"><b>{s.label}</b><small>{s.sub}</small></span>
            </button>
          ))}
          <span className="ng-progress" aria-hidden><i style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} /></span>
        </nav>
        <button className="ng-btn ghost" onClick={onBack}><Icon name="mainmenu" size={18} /> Hauptmenü</button>
      </header>

      <main className="ng-body">
        <div key={step} className={`ng-stage ${STEPS[step].fill ? 'fill' : 'fit'}`}>
          <div className="ng-title">
            <h1>{step === 3 && d.mode === 'career' ? 'Deine Angebote' : STEPS[step].title}</h1>
            <p>{step === 3 && d.mode === 'career' ? 'Drei Vereine trauen dir den Job zu. Sieh sie dir an und nimm ein Angebot an.' : STEPS[step].lead}</p>
          </div>
          {step === 0 && <StepManager d={d} set={set} />}
          {step === 1 && <StepMode d={d} set={set} chooseMode={chooseMode} />}
          {step === 2 && <StepWorld d={d} chooseDataset={chooseDataset} />}
          {step === 3 && <StepClub d={d} set={set} offers={offers} />}
          {step === 4 && <StepLeagues d={d} />}
          {step === 5 && <StepWelcome d={d} game={ready} />}
        </div>
      </main>

      <footer className="ng-foot">
        <button className="ng-btn ghost" onClick={() => (step === 0 ? onBack() : setStep(step - 1))}><Icon name="navPrev" size={16} /> Zurück</button>
        <div className="ng-foot-info">{hint}</div>
        {last
          ? <button className="ng-btn primary" disabled={!ready} onClick={start}>Karriere starten <Icon name="newGame" size={18} /></button>
          : <button className="ng-btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Weiter <Icon name="navNext" size={16} /></button>}
      </footer>
    </div>
  );
}
