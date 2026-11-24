// =============================================================================
// Vereinsfarben für Chancen-Meter und Momentum-Säulen im Textmodus (Wunsch
// Pascal: „Balken des Momentums in der Hauptvereinsfarbe der Clubs“).
// Grund ist die dunkle Bühne (--panel #1a1d23). Regeln:
//  - Hauptfarbe, solange sie sich vom dunklen Grund abhebt; ist sie zu dunkel, aber
//    bunt (Königsblau, Dunkelrot), dieselbe Farbe aufgehellt; ist sie unbunt
//    (Schwarz, Dunkelgrau), die Zweitfarbe; sonst die Hauptfarbe aufgehellt.
//  - Liegen Heim- und Gastfarbe zu nah beieinander, weicht der Gast aus (wie beim
//    Trikot): erst seine Zweitfarbe, dann eine aufgehellte bzw. abgedunkelte
//    Fassung, zuletzt ein neutrales Hellgrau.
// =============================================================================
import type { Club } from '../../../types';
import { colorDistance, contrast, hexToRgb } from '../../../ui/clubAccent';

type RGB = [number, number, number];

/** Dunkler Bühnengrund (--panel in .ms-root / .modal.mr2). */
const STAGE: RGB = [26, 29, 35];
/** Mindestkontrast einer Fläche zum Grund (gut sichtbar, nicht nur „gerade so“). */
const MIN_CONTRAST = 3;
/** Ab diesem OKLab-Abstand gelten zwei Farben als klar unterscheidbar. */
const MIN_DIST = 0.16;
const NEUTRAL: RGB = [162, 172, 184];

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (c: RGB) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Zu dunkle Farbe schrittweise aufhellen, bis sie sich vom Grund abhebt. */
function lift(c: RGB): RGB {
  let out = c;
  for (let i = 0; i < 14 && contrast(out, STAGE) < MIN_CONTRAST; i++) out = mix(out, [255, 255, 255], 0.12);
  return out;
}
const readable = (c: RGB) => contrast(c, STAGE) >= MIN_CONTRAST;
/** Bunt genug, dass die aufgehellte Fassung noch nach Vereinsfarbe aussieht. */
const colorful = (c: RGB) => Math.max(...c) - Math.min(...c) >= 40;

/** Lesbare Vereinsfarbe auf dunklem Grund (Hauptfarbe, ggf. aufgehellt, sonst Zweitfarbe). */
function baseColor(club: Club): RGB {
  const p = hexToRgb(club.colors?.primary ?? '');
  const s = hexToRgb(club.colors?.secondary ?? '');
  if (p && readable(p)) return p;
  if (p && colorful(p)) return lift(p);
  if (s && readable(s)) return s;
  return lift(p ?? s ?? NEUTRAL);
}

/** Farben [Heim, Gast] für Meter und Momentum-Säulen (Hex). */
export function stageColors(home: Club, away: Club): [string, string] {
  const h = baseColor(home);
  const far = (c: RGB) => colorDistance(c, h) >= MIN_DIST;
  const ap = hexToRgb(away.colors?.primary ?? '');
  const as = hexToRgb(away.colors?.secondary ?? '');
  const cands: RGB[] = [];
  for (const c of [ap, as]) if (c) cands.push(lift(c));
  const a0 = baseColor(away);
  // Zu nah? Hellere bzw. dunklere Fassung der Gastfarbe, die noch lesbar bleibt.
  for (let t = 0.25; t <= 0.75; t += 0.25) {
    cands.push(mix(a0, [255, 255, 255], t));
    const d = mix(a0, [0, 0, 0], t);
    if (readable(d)) cands.push(d);
  }
  const a = (far(a0) ? a0 : cands.find(far)) ?? (far(NEUTRAL) ? NEUTRAL : [255, 255, 255] as RGB);
  return [hex(h), hex(a)];
}
