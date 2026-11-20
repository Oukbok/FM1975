// =============================================================================
// Klickgeräusch (Wunsch Pascal): kurzer Klick bei jedem Druck auf etwas Klickbares.
// Ein globaler pointerdown-Hörer; Web Audio (Puffer einmal geladen, kein Verzug).
// An/aus + Lautstärke in den Einstellungen (soundEnabled, clickVolume).
// =============================================================================
import { loadSettings, onSettingsSaved, type AppSettings } from '../engine/save';

const SRC = 'assets/sound/click.wav';
const CLICKABLE = [
  'button', 'a[href]', '[role="button"]', '[role="tab"]', '[role="option"]', '[role="menuitem"]', 'summary', 'label',
  'input[type="checkbox"]', 'input[type="radio"]', 'input[type="range"]', 'select', '[data-pid]', '[data-club]',
  '.clickable', '.sel3', '[tabindex="0"]',
].join(',');

let enabled = true;
let volume = 0.6;
let ctx: AudioContext | null = null;
let buf: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
let last = 0;

function apply(s: AppSettings) {
  enabled = s.soundEnabled !== false;
  volume = Math.max(0, Math.min(100, s.clickVolume ?? 60)) / 100;
}

function load(): Promise<void> {
  if (loading) return loading;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return (loading = Promise.resolve());
  ctx = new AC();
  loading = fetch(SRC)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('click'))))
    .then((a) => ctx!.decodeAudioData(a))
    .then((b) => { buf = b; })
    .catch(() => { /* ohne Ton weiter */ });
  return loading;
}

/** Spielt den Klick (auch für Tests/Vorschau in den Einstellungen). */
export function playClick(force = false): void {
  if ((!enabled && !force) || volume <= 0) return;
  const now = performance.now();
  if (now - last < 45) return;
  last = now;
  if (!buf || !ctx) { void load(); return; }
  const c = ctx, b = buf, v = volume;
  const go = () => {
    const src = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = v;
    src.buffer = b;
    src.connect(gain).connect(c.destination);
    src.start();
  };
  // Der Kontext startet stumm (Autoplay-Regeln); erst nach dem Aufwecken abspielen.
  if (c.state !== 'running') { void c.resume().then(() => { if (c.state === 'running') go(); }).catch(() => undefined); return; }
  go();
}

/** Browser (vor allem Safari/iOS) lassen Ton erst nach einer „echten“ Nutzer-Geste zu – pointerdown zählt
 *  dort nicht, touchend/click/keydown schon. Bei jeder solchen Geste den Kontext aufwecken. */
function unlock(): void {
  if (!ctx) { void load(); return; }
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
}

function isClickable(t: EventTarget | null): boolean {
  const el = t instanceof Element ? t.closest(CLICKABLE) : null;
  if (!el) return false;
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return false;
  return true;
}

let installed = false;
/** Einmal beim Start aufrufen. */
export function installClickSound(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  apply(loadSettings());
  onSettingsSaved(apply);
  void load(); // Puffer vorab laden (Kontext startet stumm, der erste Klick weckt ihn)
  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !enabled) return;
    if (!buf) void load();
    if (isClickable(e.target)) playClick();
  }, { capture: true, passive: true });
  for (const ev of ['touchend', 'click', 'keydown'] as const) window.addEventListener(ev, unlock, { capture: true, passive: true });
}

/** Probeklick mit einer Lautstärke (Regler in den Einstellungen, vor dem Speichern). */
export function previewClick(vol: number): void {
  const keep = volume;
  volume = Math.max(0, Math.min(100, vol)) / 100;
  last = 0;
  playClick(true);
  volume = keep;
}
