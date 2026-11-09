// =============================================================================
// Weiche Kurven für Liniendiagramme (Wunsch Pascal: abgerundet statt zackig)
// -----------------------------------------------------------------------------
// Monotone kubische Interpolation (Fritsch-Carlson): Die Kurve läuft durch jeden
// Messpunkt und schießt zwischen zwei Punkten nie über den höheren bzw. unter den
// niedrigeren Wert hinaus – ein Diagramm zeigt also keine Spitzen, die es nie gab.
// Erwartet Punkte mit aufsteigendem x (Bildschirmkoordinaten).
// =============================================================================

export type Pt = [number, number];

const f = (v: number) => v.toFixed(1);

/** SVG-Pfad (`M … C …`) durch alle Punkte. */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (!n) return '';
  if (n === 1) return `M${f(pts[0][0])},${f(pts[0][1])}`;
  if (n === 2) return `M${f(pts[0][0])},${f(pts[0][1])}L${f(pts[1][0])},${f(pts[1][1])}`;
  const dx: number[] = [], sl: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    sl[i] = dx[i] ? (pts[i + 1][1] - pts[i][1]) / dx[i] : 0;
  }
  // Tangenten je Punkt
  const m: number[] = [sl[0]];
  for (let i = 1; i < n - 1; i++) m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
  m[n - 1] = sl[n - 2];
  // Überschwingen begrenzen
  for (let i = 0; i < n - 1; i++) {
    if (sl[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / sl[i], b = m[i + 1] / sl[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * sl[i]; m[i + 1] = t * b * sl[i]; }
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3;
    d += `C${f(x0 + h)},${f(y0 + m[i] * h)} ${f(x1 - h)},${f(y1 - m[i + 1] * h)} ${f(x1)},${f(y1)}`;
  }
  return d;
}

/** Geschlossene Fläche unter der Kurve bis zur Grundlinie `baseY` (für Verlaufsfüllungen). */
export function smoothArea(pts: Pt[], baseY: number): string {
  if (pts.length < 2) return '';
  return `${smoothPath(pts)}L${f(pts[pts.length - 1][0])},${f(baseY)}L${f(pts[0][0])},${f(baseY)}Z`;
}
