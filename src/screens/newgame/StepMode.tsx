import Icon from '../../components/Icon';
import { rangePct, type NewGameDraft, type StartMode } from './draft';
import { STORIES } from '../../data/privateLife';

// Schritt 2: Spielmodus — Teammanager oder Karriere, dazu die Spieloptionen
/** Ton der Segment-Wahl nach Bedeutung (Farben in 24-newgame.css, Tokens --ng-*). */

const MODES: { k: StartMode; title: string; text: string; icon: 'dashVerein' | 'contracts' | 'home' }[] = [
  { k: 'manager', title: 'Teammanager', text: 'Du wählst selbst, welchen Verein du übernimmst – vom Meisterschaftsfavoriten bis zum Zweitligisten.', icon: 'dashVerein' },
  { k: 'career', title: 'Karriere', text: 'Als unbekannter Manager bekommst du Angebote von drei schwächeren Vereinen und suchst dir eines aus.', icon: 'contracts' },
  { k: 'young', title: 'Junger Manager', text: 'Mit 20 auf der Bank – mit einer Geschichte, warum. Ein ganzes Leben vor dir: Familie, Kinder, Nachfolger über Generationen.', icon: 'home' },
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

      {d.mode === 'young' && (
        <section className="ng-card ng-stories" data-mode="young">
          <h3 className="ng-h">Deine Geschichte – warum so jung?</h3>
          <div className="ng-story-list">
            {STORIES.map((st) => (
              <button key={st.id} type="button" className={`ng-opt ng-story ${d.story === st.id ? 'on' : ''}`} onClick={() => set({ story: st.id })}>
                <b>{st.title}</b><small>{st.teaser}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="ng-cols ng-cols-2">
        <section className="ng-card">
          <h3 className="ng-h">Spieltempo</h3>
          <div className="ng-speed">
            <input className="ng-range" style={rangePct(d.speedMs, 300, 1600)} type="range" min={300} max={1600} step={100} value={d.speedMs} onChange={(e) => set({ speedMs: +e.target.value })} />
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
            <Toggle on={d.legends} onChange={(v) => set({ legends: v })} label="Ausnahmetalente der Geschichte" text="Große Talente der Fußballgeschichte wachsen irgendwo in der Spielwelt heran – unerkannt wie alle anderen." />
            <Toggle on={d.privateLife} onChange={(v) => set({ privateLife: v || d.mode === 'young' })} label="Privatleben" text="Familie, Freizeit, Vermögen – mit Folgen für den Verein. Beim Jungen Manager immer an." />
          </div>
          <p className="ng-note ng-hint ng-push">Es gibt keinen Vereinswechsel und keine Entlassung: Du führst deinen Verein als Manager durch die Jahrzehnte und stellst deine Trainer selbst ein. Sinkt das Vertrauen des Vorstands stark, kürzt er dein Transferbudget und legt dir einen Trainerwechsel nahe.</p>
        </section>
      </div>
    </div>
  );
}
