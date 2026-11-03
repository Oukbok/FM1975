import Icon from '../../components/Icon';
import { HISTORY_MODES } from '../../game/historicSteer';
import type { NewGameDraft, StartMode } from './draft';

// Schritt 2: Spielmodus — Teammanager oder Karriere, dazu die Spieloptionen
const MODES: { k: StartMode; title: string; text: string; icon: 'dashVerein' | 'contracts' }[] = [
  { k: 'manager', title: 'Teammanager', text: 'Du wählst selbst, welchen Verein du übernimmst – vom Meisterschaftsfavoriten bis zum Zweitligisten.', icon: 'dashVerein' },
  { k: 'career', title: 'Karriere', text: 'Als unbekannter Trainer bekommst du Angebote von drei schwächeren Vereinen und suchst dir eines aus.', icon: 'contracts' },
];

function Toggle({ on, onChange, label, text }: { on: boolean; onChange: (v: boolean) => void; label: string; text: string }) {
  return (
    <button type="button" className={`ng-toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="ng-switch" />
      <span className="ng-toggle-txt"><b>{label}</b><small>{text}</small></span>
    </button>
  );
}

export function StepMode({ d, set, chooseMode }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; chooseMode: (m: StartMode) => void }) {
  const hm = HISTORY_MODES.find((m) => m.id === d.history)!;
  return (
    <div className="ng-mode">
      <div className="ng-modes">
        {MODES.map((m) => (
          <button key={m.k} type="button" className={`ng-modecard ${d.mode === m.k ? 'on' : ''}`} onClick={() => chooseMode(m.k)}>
            <span className="ng-modecard-ico"><Icon name={m.icon} size={30} /></span>
            <span className="ng-modecard-txt"><b>{m.title}</b><small>{m.text}</small></span>
            <span className="ng-radio" aria-hidden />
          </button>
        ))}
      </div>

      <div className="ng-cols ng-cols-2">
        <section className="ng-card">
          <h3 className="ng-h">Entwicklung der anderen Vereine</h3>
          <div className="ng-seg">
            {HISTORY_MODES.map((m) => (
              <button key={m.id} type="button" className={d.history === m.id ? 'on' : ''} onClick={() => set({ history: m.id })}>{m.label}</button>
            ))}
          </div>
          <p className="ng-note">{hm.desc} Gilt nur für die anderen Vereine, nie für deinen – und steht ab Spielstart fest.</p>
          <h3 className="ng-h">Spieltempo</h3>
          <div className="ng-speed">
            <input type="range" min={300} max={1600} step={100} value={d.speedMs} onChange={(e) => set({ speedMs: +e.target.value })} />
            <span className="ng-speed-val"><b>{d.speedMs}</b> ms je Tag · {d.speedMs <= 600 ? 'schnell' : d.speedMs >= 1200 ? 'langsam' : 'mittel'}</span>
          </div>
          <p className="ng-note">Wie schnell die Tage ablaufen. Jederzeit im Spiel änderbar.</p>
        </section>

        <section className="ng-card">
          <h3 className="ng-h">Einstellungen</h3>
          <div className="ng-toggles">
            <Toggle on={d.injuries} onChange={(v) => set({ injuries: v })} label="Verletzungen" text="Spieler können sich in Spielen und im Training verletzen." />
            <Toggle on={d.briefingAuto} onChange={(v) => set({ briefingAuto: v })} label="Saison-Briefing & Tipps" text="Zu jedem Saisonstart: was neu ist, deine Aufgaben und Tipps zur Epoche." />
            <Toggle on={d.briefingIntro} onChange={(v) => set({ briefingIntro: v && d.briefingAuto })} label="Auftakt-Animation" text="Kurze Einstimmung vor dem Briefing." />
          </div>
          <p className="ng-note ng-push">Es gibt keinen Vereinswechsel und keine Entlassung: Du führst deinen Verein durch die Jahrzehnte. Sinkt das Vertrauen des Vorstands stark, kürzt er aber dein Transferbudget.</p>
        </section>
      </div>
    </div>
  );
}
