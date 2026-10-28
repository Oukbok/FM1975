import Icon from '../components/Icon';
import { getClubSeeds } from '../data/generate';
import { applyDataset } from '../data/dataset/apply';
import { BUILTIN_ID } from '../data/dataset/builtin';
import { cachedDataset } from '../data/dataset/storage';
import { AppSettings } from '../engine/save';
import { loadLegendNames } from '../data/legendNames';
import { Difficulty, ManagerBackground, ManagerProfile, ManagerStyle, NewGameOptions } from '../types';
import { LeagueKey } from './newgame/clubPreview';
import { StepSetup } from './newgame/StepSetup';
import { StepClub } from './newgame/StepClub';
import { StepManager } from './newgame/StepManager';
import { useState } from 'react';

// -----------------------------------------------------------------------------
// NEUES SPIEL — Assistent in drei Schritten (wie bei den großen Managerspielen):
//   1. Datensatz & Optionen   2. Liga & Verein   3. Manager & Start
// -----------------------------------------------------------------------------
export const STYLE_DE: Record<ManagerStyle, string> = { defensive: 'Defensiv', balanced: 'Ausgeglichen', attacking: 'Offensiv' };

export const BG_DE: Record<ManagerBackground, { label: string; desc: string }> = {
  legend: { label: 'Trainer-Legende', desc: 'Großer Name, hohes Ansehen beim Vorstand.' },
  ex_pro: { label: 'Ex-Profi', desc: 'Selbst gespielt – guter Draht zur Mannschaft.' },
  tactician: { label: 'Taktik-Fuchs', desc: 'Analytiker mit Sinn für Details.' },
  rookie: { label: 'Newcomer', desc: 'Unbeschriebenes Blatt mit Ambitionen.' },
};

export type LegendMode = 'off' | 'fictional' | 'custom';

/** Gemeinsamer Zustand aller Schritte. */
export interface NewGameDraft {
  datasetId: string;
  difficulty: Difficulty;
  injuries: boolean;
  realistic: boolean;
  speedMs: number;
  legendMode: LegendMode;
  league: LeagueKey;
  clubId: string;
  name: string;
  nationality: string;
  birthYear: number;
  style: ManagerStyle;
  background: ManagerBackground;
}

const STEPS: { label: string; sub: string; icon: 'settings' | 'dashVerein' | 'squad' }[] = [
  { label: 'Spielwelt', sub: 'Datensatz & Optionen', icon: 'settings' },
  { label: 'Verein', sub: 'Liga & Verein wählen', icon: 'dashVerein' },
  { label: 'Manager', sub: 'Profil & Start', icon: 'squad' },
];

export function NewGameScreen({ defaults, onBack, onStart }: {
  defaults: AppSettings; onBack: () => void; onStart: (o: NewGameOptions) => void;
}) {
  const customNames = Object.keys(loadLegendNames()).length;
  const [step, setStep] = useState(0);
  const [d, setD] = useState<NewGameDraft>(() => ({
    datasetId: BUILTIN_ID, difficulty: 'normal', injuries: true, realistic: true, speedMs: defaults.speedMs,
    legendMode: customNames ? 'custom' : 'fictional',
    league: 'tier1', clubId: [...getClubSeeds()].sort((a, b) => b.reputation - a.reputation)[0]?.id ?? '',
    name: '', nationality: 'Deutschland', birthYear: 1940, style: 'balanced', background: 'ex_pro',
  }));
  const set = (p: Partial<NewGameDraft>) => setD((x) => ({ ...x, ...p }));

  const chooseDataset = (id: string) => {
    applyDataset(cachedDataset(id));
    const first = [...getClubSeeds()].sort((a, b) => b.reputation - a.reputation)[0]?.id ?? '';
    set({ datasetId: id, league: 'tier1', clubId: first });
  };

  const canStart = d.name.trim().length >= 2 && !!d.clubId;
  const start = () => {
    const manager: ManagerProfile = {
      name: d.name.trim(), nationality: d.nationality, birthYear: d.birthYear, style: d.style, background: d.background,
      avatarSeed: d.name.trim().toLowerCase(),
    };
    onStart({
      managedClubId: d.clubId, manager, difficulty: d.difficulty, realisticSquads: d.realistic,
      injuriesEnabled: d.injuries, speedMs: d.speedMs, datasetId: d.datasetId, legendMode: d.legendMode,
    });
  };
  const last = step === STEPS.length - 1;

  return (
    <div className="ng-root">
      <header className="ng-head">
        <div className="ng-title">
          <span className="ng-title-main">Neues Spiel</span>
          <span className="ng-title-sub">Saison 1975/76</span>
        </div>
        <nav className="ng-steps">
          {STEPS.map((s, i) => (
            <button key={s.label} className={`ng-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
              disabled={i > step} onClick={() => i < step && setStep(i)}>
              <span className="ng-step-no">{i + 1}</span>
              <span className="ng-step-txt"><b>{s.label}</b><small>{s.sub}</small></span>
            </button>
          ))}
        </nav>
        <button className="ng-btn ghost" onClick={onBack}><Icon name="mainmenu" size={18} /> Hauptmenü</button>
      </header>

      <main className={`ng-body ${step === 1 ? '' : 'center'}`}>
        {step === 0 && <StepSetup d={d} set={set} customNames={customNames} chooseDataset={chooseDataset} />}
        {step === 1 && <StepClub d={d} set={set} />}
        {step === 2 && <StepManager d={d} set={set} />}
      </main>

      <footer className="ng-foot">
        <button className="ng-btn ghost" onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>Zurück</button>
        <div className="ng-foot-info">
          {last && !canStart ? 'Gib deinen Namen ein (mindestens 2 Zeichen).' : `Schritt ${step + 1} von ${STEPS.length}`}
        </div>
        {last
          ? <button className="ng-btn primary" disabled={!canStart} onClick={start}><Icon name="newGame" size={18} /> Karriere starten</button>
          : <button className="ng-btn primary" disabled={step === 1 && !d.clubId} onClick={() => setStep(step + 1)}>Weiter</button>}
      </footer>
    </div>
  );
}
