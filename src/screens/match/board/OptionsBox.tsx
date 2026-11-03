// =============================================================================
// „Optionen“ des Textmodus: Co-Trainer-Wechsel, Anhalten bei …, Tempo und
// Spannungsmoment. Gespeichert in den Einstellungen (AppSettings).
// =============================================================================
import type { AppSettings } from '../../../engine/save';
import { InfoTip } from '../../../ui/InfoTip';
import { SPEEDS, type TextSpeed } from '../useTicker';

const SPEED_LABEL: Record<TextSpeed, string> = { langsam: 'Langsam', normal: 'Normal', schnell: 'Schnell', rasant: 'Rasant' };

type BoolKey = 'matchAutoSubs' | 'matchStopSubs' | 'matchHalftimeTalk' | 'matchStopLate' | 'matchStopBehind' | 'matchSuspense';
const OPTS: [BoolKey, string, boolean][] = [
  ['matchAutoSubs', 'Automatische Auswechslungen', false],
  ['matchHalftimeTalk', 'Zur Halbzeit anhalten', true],
  ['matchStopSubs', 'Bei Auswechslungen anhalten', true],
  ['matchStopLate', 'Zur Schlussphase anhalten (75.)', false],
  ['matchSuspense', 'Spannungsmomente', true],
  ['matchStopBehind', 'Bei Rückstand anhalten', false],
];

export const optOn = (s: AppSettings, k: BoolKey): boolean => {
  const d = OPTS.find((o) => o[0] === k)?.[2] ?? false;
  const v = s[k];
  return v == null ? d : v;
};

export function OptionsBox({ settings, onSettings, speed, onSpeed }: {
  settings: AppSettings; onSettings: (s: AppSettings) => void; speed: TextSpeed; onSpeed: (s: TextSpeed) => void;
}) {
  const idx = Math.max(0, SPEEDS.indexOf(speed));
  return (
    <div className="ms-panel tm-options">
      <div className="tm-box-head"><span>Optionen <InfoTip k="textmodusOptionen" /></span></div>
      <div className="tm-opt-grid">
        {OPTS.map(([k, label]) => (
          <label key={k} className="tm-check">
            <input type="checkbox" checked={optOn(settings, k)} onChange={(e) => onSettings({ ...settings, [k]: e.target.checked })} />
            <span className="tm-box" aria-hidden />
            {label}
          </label>
        ))}
      </div>
      <div className="tm-speed">
        <span>Schnelligkeit</span>
        <input type="range" min={0} max={SPEEDS.length - 1} step={1} value={idx}
          onChange={(e) => onSpeed(SPEEDS[Number(e.target.value)])} aria-label="Schnelligkeit des Tickers" />
        <b>{SPEED_LABEL[SPEEDS[idx]]}</b>
      </div>
    </div>
  );
}
