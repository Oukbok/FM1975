import Icon, { type IconName } from '../components/Icon';
import { applyDataset, setCrestDate } from '../data/dataset/apply';
import { activeDatasetIdCached, cachedDataset } from '../data/dataset/storage';
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
import { leaguePreview, sortClubs } from './newgame/clubPreview';
import { playableCountries } from '../game/worldCompose';
import { seasonLabelOf } from '../data/world/countries';
import { jobNationFor } from '../game/national/jobNations';

// -----------------------------------------------------------------------------
// NEUES SPIEL — Assistent in sechs Schritten (Vorbild: große Managerspiele):
//   1. Manager  2. Spielmodus  3. Spielwelt  4. Verein  5. Ligensystem  6. Willkommen
// Im letzten Schritt wird die Spielwelt schon erzeugt (Kader, Vorstand, Fans), damit
// „Willkommen beim Verein“ echte Werte zeigt; „Karriere starten“ übernimmt genau
// dieses Spiel (App.tsx `startGame(opts, prebuilt)`).
// -----------------------------------------------------------------------------
export type { NewGameDraft } from './newgame/draft';

type StepDef = { label: string; sub: string; icon: IconName; title: string; lead: string; fill?: boolean };
function stepsFor(year: number): StepDef[] {
  const se = seasonLabelOf(year);
  return [
    { label: 'Manager', sub: 'Persönliches & Profil', icon: 'squad', title: 'Dein Manager', lead: `Wer übernimmt im Sommer ${year} die Trainerbank? Name, Herkunft und dein Profil als Trainer.` },
    { label: 'Spielmodus', sub: 'Modus & Optionen', icon: 'settings', title: 'Spielmodus wählen', lead: 'Wie beginnt deine Karriere – und mit welchen Einstellungen spielst du?' },
    { label: 'Spielwelt', sub: 'Startjahr & Länder', icon: 'international', title: 'Die Spielwelt', lead: 'Startjahr, Datensatz, alle Länder, deren Ligen mitspielen – und wie historisch sich die Welt entwickelt.', fill: true },
    { label: 'Verein', sub: 'Land, Liga, Verein', icon: 'dashVerein', title: 'Verein auswählen', lead: 'Bei welchem Verein beginnst du? Du bleibst ihm treu – über alle Jahrzehnte.', fill: true },
    { label: 'Ligensystem', sub: 'Übersicht', icon: 'stats', title: 'Übersicht Ligensystem', lead: `So ist der Fußball ${se} aufgebaut. Klick auf eine Liga, um ihre Vereine zu sehen.`, fill: true },
    { label: 'Start', sub: 'Willkommen', icon: 'newGame', title: 'Dein erster Arbeitstag', lead: `Mannschaft, Vorstand und Fans warten. Alles bereit für die Saison ${se}.` },
  ];
}

/** Stärkster Verein der 1. Liga eines Landes im Startjahr. */
const topClub = (cc = 'ger', year = 1975) => sortClubs(leaguePreview('tier1', cc, year), 'reputation')[0]?.id ?? '';

export function NewGameScreen({ defaults, onBack, onStart, onSettings }: {
  defaults: AppSettings; onBack: () => void;
  onStart: (o: NewGameOptions, prebuilt?: Game) => void;
  onSettings?: (s: AppSettings) => void;
}) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<NewGameDraft>(() => {
    // Vorauswahl = „Im Spiel aktiv“ (Editor › Datensätze bzw. Hauptmenü › Datensätze); Vorschau immer auf dem gewählten Datensatz.
    const ds0 = activeDatasetIdCached();
    applyDataset(cachedDataset(ds0));
    return {
      datasetId: ds0, difficulty: 'normal', injuries: true, historic: 'historic', speedMs: defaults.speedMs,
      briefingAuto: defaults.briefingAuto !== false, briefingIntro: defaults.briefingIntro !== false, legends: true,
      mode: 'manager', offerSeed: Math.floor(Math.random() * 2 ** 31),
      league: 'tier1', clubId: topClub(), startYear: 1975, country: 'ger',
      firstName: '', lastName: '', birthDay: 1, birthMonth: 1, birthYear: 1940,
      nationality: 'Deutschland', nationality2: '', avatarSeed: Math.random().toString(36).slice(2, 8),
      favoriteClubId: '', avoidClubId: '', style: 'balanced', background: 'ex_pro', story: 'erbe', privateLife: true,
      nationalOn: false, nationalTeam: 'GER', nationalSackable: true,
    };
  });
  const set = (p: Partial<NewGameDraft>) => setD((x) => ({ ...x, ...p }));
  setCrestDate(`${d.startYear}-07-01`); // Vorschau zeigt das Wappen, das zum Startjahr gilt

  /** Verein passend zu Modus/Land/Jahr: Karriere = erstes der (neu erzeugten) Angebote, sonst Spitzenverein der 1. Liga.
   *  Wer Startjahr, Land oder Datensatz ändert, bekommt so immer eine gültige Auswahl (vorher blieb im Karrieremodus
   *  der alte Verein stehen, der nicht mehr unter den Angeboten war → „Weiter“ gesperrt). */
  const clubFor = (mode: NewGameDraft['mode'], cc: string, y: number, avoid: string): Pick<NewGameDraft, 'league' | 'clubId'> => {
    if (mode !== 'career') return { league: 'tier1', clubId: topClub(cc, y) };
    const o = careerOffers(d.offerSeed, avoid, cc, y)[0];
    return { league: o?.league ?? 'tier1', clubId: o?.club.id ?? '' };
  };
  const chooseDataset = (id: string) => {
    applyDataset(cachedDataset(id));
    const cc = playableCountries(d.startYear).includes(d.country) ? d.country : 'ger';
    set({ datasetId: id, country: cc, ...clubFor(d.mode, cc, d.startYear, ''), favoriteClubId: '', avoidClubId: '' });
  };
  /** Startjahr wählen: Land bleibt, wenn es im Jahr spielbar ist; Verein = Spitzenverein bzw. erstes Angebot. */
  const chooseYear = (y: number) => {
    const cc = playableCountries(y).includes(d.country) ? d.country : 'ger';
    set({ startYear: y, birthYear: d.birthYear + (y - d.startYear), country: cc, ...clubFor(d.mode, cc, y, d.avoidClubId), nationalTeam: jobNationFor(d.nationalTeam, y, 'GER') });
  };
  const chooseCountry = (cc: string) => {
    if (cc === d.country) return;
    set({ country: cc, ...clubFor(d.mode, cc, d.startYear, d.avoidClubId) });
  };
  const offers = useMemo(() => careerOffers(d.offerSeed, d.avoidClubId, d.country, d.startYear), [d.offerSeed, d.avoidClubId, d.datasetId, d.country, d.startYear]);
  // Sicherung (z. B. „niemals“-Verein in Schritt 1 nachträglich geändert): Auswahl im Karrieremodus
  // immer auf ein gültiges Angebot ziehen, bzw. leeren, wenn es keines gibt.
  useEffect(() => {
    if (d.mode !== 'career' || offers.some((o) => o.club.id === d.clubId)) return;
    set(offers[0] ? { clubId: offers[0].club.id, league: offers[0].league } : { clubId: '' });
  }, [d.mode, d.clubId, offers]); // eslint-disable-line react-hooks/exhaustive-deps
  const STEPS = stepsFor(d.startYear);
  const chooseMode = (m: NewGameDraft['mode']) => {
    if (m === d.mode) return;
    if (m === 'career') set({ mode: m, clubId: offers[0]?.club.id ?? '', league: offers[0]?.league ?? 'tier1' });
    // Junger Manager: 20 Jahre alt, Werdegang Newcomer, Privatleben an (Hintergrundgeschichte in StepMode).
    else if (m === 'young') set({ mode: m, birthYear: d.startYear - 20, birthMonth: Math.min(d.birthMonth, 6), background: 'rookie', privateLife: true });
    else set({ mode: m, ...(d.mode === 'young' ? { birthYear: d.startYear - 40 } : {}) });
  };

  // --- Spielwelt für „Willkommen“ vorab erzeugen (≈ 0,5 s) ---
  const optsKey = JSON.stringify({ ...gameOptions(d), speedMs: 0 });
  const [built, setBuilt] = useState<{ key: string; game: Game } | null>(null);
  useEffect(() => {
    // Ab „Ligensystem“ vorab bauen: die Übersicht zeigt dann genau die Welt des Startjahres.
    if (step < STEPS.length - 2 || built?.key === optsKey) return;
    const t = setTimeout(() => {
      applyDataset(cachedDataset(d.datasetId));
      setBuilt({ key: optsKey, game: createNewGame(gameOptions(d)) });
    }, 60);
    return () => clearTimeout(t);
  }, [step, optsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = built?.key === optsKey ? built.game : null;

  const canNext = step === 0 ? nameOk(d) : step === 3 ? !!d.clubId && (d.mode !== 'career' || offers.some((o) => o.club.id === d.clubId)) : true;
  const last = step === STEPS.length - 1;
  const start = () => {
    if (!ready) return;
    onSettings?.({ ...defaults, speedMs: d.speedMs, briefingAuto: d.briefingAuto, briefingIntro: d.briefingIntro });
    ready.calendar.speedMs = d.speedMs;
    onStart(gameOptions(d), ready);
  };
  const hint = step === 0 && !canNext ? 'Gib Vor- und Nachnamen ein (Nachname mindestens 2 Zeichen).'
    : step === 3 && !canNext ? (d.mode === 'career' && !offers.length ? 'Für dieses Land und Startjahr gibt es keine Angebote – wähle ein anderes Startjahr oder Land.' : 'Wähle einen Verein.')
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
              <span className="ng-step-no">{i < step ? <Icon name="check" size={16} /> : i + 1}</span>
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
          {step === 2 && <StepWorld d={d} set={set} chooseDataset={chooseDataset} chooseYear={chooseYear} />}
          {step === 3 && <StepClub d={d} set={set} offers={offers} chooseCountry={chooseCountry} />}
          {step === 4 && <StepLeagues d={d} game={ready} />}
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
