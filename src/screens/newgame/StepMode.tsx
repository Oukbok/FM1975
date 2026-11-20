import Icon from '../../components/Icon';
import { rangePct, type NewGameDraft, type StartMode } from './draft';
import { InfoTip } from '../../ui/InfoTip';
import { jobNationFor } from '../../game/national/jobNations';
import { countryInfo } from '../../data/countryFlags';

/** Zusätzlich Nationaltrainer (Wunsch Pascal): nur der Schalter; die Nation wählt man im eigenen Schritt „Nationalteam“ nach dem Verein. */
function NationalPick({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const own = countryInfo(d.nationality).code;
  return (
    <div className="ng-nat">
      <h3 className="ng-h">Nationalmannschaft <InfoTip k="nationaltrainer" /></h3>
      <Toggle on={d.nationalOn} onChange={(v) => set({ nationalOn: v, ...(v && !d.nationalOn ? { nationalTeam: jobNationFor(d.nationalTeam === 'GER' && own ? own : d.nationalTeam, d.startYear, 'GER') } : {}) })}
        label="Zusätzlich Nationaltrainer" text="Neben dem Verein eine Nationalmannschaft betreuen. Die Nation wählst du in einem eigenen Schritt." />
    </div>
  );
}

// Schritt 2: Spielmodus — Teammanager oder Karriere, dazu die Spieloptionen
/** Ton der Segment-Wahl nach Bedeutung (Farben in 24-newgame.css, Tokens --ng-*). */

const MODES: { k: Exclude<StartMode, 'young'>; title: string; text: string; icon: 'dashVerein' | 'contracts' }[] = [
  { k: 'manager', title: 'Teammanager', text: 'Du wählst deinen Verein selbst und bleibst ihm über Jahrzehnte treu – du allein bist für ihn verantwortlich.', icon: 'dashVerein' },
  { k: 'career', title: 'Karriere', text: 'Als unbekannter Manager bekommst du Angebote von drei schwächeren Vereinen und suchst dir eines aus.', icon: 'contracts' },
];

export function Toggle({ on, onChange, label, text }: { on: boolean; onChange: (v: boolean) => void; label: string; text: string }) {
  return (
    <button type="button" className={`ng-toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="ng-switch" />
      <span className="ng-toggle-txt"><b>{label}</b><small>{text}</small></span>
    </button>
  );
}

export function StepMode({ d, set, chooseMode }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; chooseMode: (m: StartMode) => void }) {
  return (
    <div className="ng-mode">
      <div className="ng-modes">
        {MODES.map((m) => (
          <button key={m.k} type="button" className={`ng-modecard ${d.mode === m.k ? 'on' : ''}`} data-mode={m.k} onClick={() => chooseMode(m.k)}>
            <span className="ng-modecard-ico"><Icon name={m.icon} size={30} /></span>
            <span className="ng-modecard-txt"><b>{m.title}</b><small>{m.text}</small></span>
            <span className="ng-radio" aria-hidden />
          </button>
        ))}
      </div>


      <div className="ng-cols ng-cols-2">
        <section className="ng-card">
          <h3 className="ng-h">Spieltempo</h3>
          <div className="ng-speed">
            <input className="ng-range" style={rangePct(d.speedMs, 300, 1600)} type="range" min={300} max={1600} step={100} value={d.speedMs} onChange={(e) => set({ speedMs: +e.target.value })} />
            <span className="ng-speed-val"><b>{d.speedMs}</b> ms je Tag · {d.speedMs <= 600 ? 'schnell' : d.speedMs >= 1200 ? 'langsam' : 'mittel'}</span>
          </div>
          <p className="ng-note">Wie schnell die Tage ablaufen. Jederzeit im Spiel änderbar.</p>
          <NationalPick d={d} set={set} />
        </section>

        <section className="ng-card">
          <h3 className="ng-h">Einstellungen</h3>
          <div className="ng-toggles">
            <Toggle on={d.injuries} onChange={(v) => set({ injuries: v })} label="Verletzungen" text="Spieler können sich in Spielen und im Training verletzen." />
            <Toggle on={d.briefingAuto} onChange={(v) => set({ briefingAuto: v })} label="Saison-Briefing & Tipps" text="Zu jedem Saisonstart: was neu ist, deine Aufgaben und Tipps zur Epoche." />
            <Toggle on={d.briefingIntro} onChange={(v) => set({ briefingIntro: v && d.briefingAuto })} label="Auftakt-Animation" text="Kurze Einstimmung vor dem Briefing." />
            <Toggle on={d.legends} onChange={(v) => set({ legends: v })} label="Ausnahmetalente der Geschichte" text="Große Talente der Fußballgeschichte wachsen irgendwo in der Spielwelt heran – unerkannt wie alle anderen." />
            <Toggle on={d.privateLife} onChange={(v) => set({ privateLife: v })} label="Privatleben" text="Familie, Freizeit, Vermögen – mit Folgen für den Verein." />
          </div>
          <p className="ng-note ng-hint ng-push">Es gibt keinen Vereinswechsel und keine Entlassung: Du führst deinen Verein als Manager durch die Jahrzehnte und stellst deine Trainer selbst ein. Sinkt das Vertrauen des Vorstands stark, kürzt er dein Transferbudget und legt dir einen Trainerwechsel nahe.</p>
        </section>
      </div>
    </div>
  );
}
