// =============================================================================
// Vereinsfarbe als Akzent (Look „Akte“, styles/31-akte.css)
// -----------------------------------------------------------------------------
// Wunsch Pascal: Die Hauptfarbe des eigenen Vereins färbt wichtige und gewählte
// Knöpfe. Liegt sie zu nah am Dunkelblau der Kopfleiste/Boxköpfe (--navy), nimmt
// das Spiel die Zweitfarbe. Zu helle Farben (Weiß, Gelb …) verschwinden auf dem
// Papier und werden abgedunkelt; taugt keine der beiden, bleibt die Hauptfarbe in
// einer kräftigeren, helleren Fassung (damit sie sich vom Dunkelblau abhebt).
// Ergebnis als CSS-Variablen am <html>: --club-accent, --club-accent-rgb,
// --club-accent-ink (Schrift auf der Akzentfläche), --club-accent-hover.
// =============================================================================

/** Dunkelblau der Kopfleiste/Boxköpfe – gleicher Wert wie --navy in 31-akte.css. */
export const AKTE_NAVY = '#1b2a44';
/** Ersatz, wenn keine Vereinsfarbe geht (Startbildschirm, fehlende Daten). */
export const AKTE_DEFAULT_ACCENT = '#c8202a';

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Relative Leuchtdichte nach WCAG. */
export function luminance([r, g, b]: RGB): number {
  const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Farbabstand im OKLab-Raum (wahrnehmungsnah; 0 = gleich, ~0,1 = gut unterscheidbar).
function oklab([r, g, b]: RGB): [number, number, number] {
  const lin = (v: number) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function colorDistance(a: RGB, b: RGB): number {
  const [l1, a1, b1] = oklab(a), [l2, a2, b2] = oklab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const PAPER: RGB = [236, 234, 229];
const NAVY = hexToRgb(AKTE_NAVY)!;
/** Ab diesem OKLab-Abstand gilt eine Farbe als „nicht nah am Dunkelblau“. */
const NAVY_MIN_DIST = 0.12;
/** Mindestkontrast der Akzentfläche zum Papier (Knopf bleibt als Fläche erkennbar). */
const PAPER_MIN_CONTRAST = 2.6;

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Zu helle Farbe schrittweise abdunkeln, bis sie sich vom Papier abhebt. */
function darkenForPaper(c: RGB): RGB {
  let out = c;
  for (let i = 0; i < 12 && contrast(out, PAPER) < PAPER_MIN_CONTRAST; i++) out = mix(out, [0, 0, 0], 0.12);
  return out;
}

function fromOklab([L, A, B]: [number, number, number]): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const Bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const enc = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
  return [enc(R), enc(G), enc(Bl)];
}

/** Nah am Dunkelblau: geringer Abstand ODER ein dunkler bis mittlerer Blauton (z. B. Königsblau),
 *  der im aktiven Menüpunkt auf der dunkelblauen Kopfleiste untergehen würde. */
export function nearNavy(c: RGB): boolean {
  if (colorDistance(c, NAVY) < NAVY_MIN_DIST) return true;
  const [L, a, b] = oklab(c);
  const hue = (Math.atan2(b, a) * 180) / Math.PI; // OKLab: Blau ≈ -110° … -80°
  return Math.hypot(a, b) > 0.05 && hue > -125 && hue < -70 && L < 0.62;
}

/** Farbe taugt als Akzent: nicht nah am Dunkelblau, nicht grau, nach dem Abdunkeln auf Papier sichtbar. */
function usable(c: RGB): RGB | null {
  if (nearNavy(c)) return null;
  const d = darkenForPaper(c);
  const [, a, b] = oklab(d);
  if (Math.hypot(a, b) < 0.04) return null; // Weiß/Grau/Schwarz
  if (nearNavy(d)) return null;
  return d;
}

/** Hauptfarbe nah am Dunkelblau und Zweitfarbe untauglich: Hauptfarbe heller und kräftiger,
 *  damit sie sich von der Kopfleiste abhebt (Hamburg Blau bleibt blau, aber klar heller). */
function liftFromNavy(c: RGB): RGB {
  const [L, a, b] = oklab(c);
  const ch = Math.hypot(a, b) || 1;
  const C = Math.max(ch, 0.15);
  return fromOklab([Math.max(L, 0.6), (a / ch) * C, (b / ch) * C]);
}

export interface ClubAccent { accent: string; rgb: string; ink: string; hover: string; source: 'primary' | 'secondary' | 'lifted' | 'default' }

export function clubAccent(colors?: { primary?: string; secondary?: string } | null): ClubAccent {
  const p = colors?.primary ? hexToRgb(colors.primary) : null;
  const s = colors?.secondary ? hexToRgb(colors.secondary) : null;
  let pick: RGB | null = null;
  let source: ClubAccent['source'] = 'default';
  if (p && (pick = usable(p))) source = 'primary';
  else if (s && (pick = usable(s))) source = 'secondary';
  else if (p && nearNavy(p) && Math.hypot(oklab(p)[1], oklab(p)[2]) > 0.04) { pick = liftFromNavy(p); source = 'lifted'; }
  else if (s && nearNavy(s) && Math.hypot(oklab(s)[1], oklab(s)[2]) > 0.04) { pick = liftFromNavy(s); source = 'lifted'; }
  if (!pick) { pick = hexToRgb(AKTE_DEFAULT_ACCENT)!; source = 'default'; }
  const ink = contrast(pick, [255, 255, 255]) >= 3.6 ? '#ffffff' : '#141a24';
  const hover = luminance(pick) > 0.18 ? mix(pick, [0, 0, 0], 0.14) : mix(pick, [255, 255, 255], 0.14);
  return { accent: toHex(pick), rgb: pick.map(Math.round).join(', '), ink, hover: toHex(hover), source };
}

/** Akzent am <html> setzen (gilt auch für Fenster, die per Portal am <body> hängen). */
export function applyClubAccent(colors?: { primary?: string; secondary?: string } | null) {
  if (typeof document === 'undefined') return;
  const a = clubAccent(colors);
  const st = document.documentElement.style;
  st.setProperty('--club-accent', a.accent);
  st.setProperty('--club-accent-rgb', a.rgb);
  st.setProperty('--club-accent-ink', a.ink);
  st.setProperty('--club-accent-hover', a.hover);
}
