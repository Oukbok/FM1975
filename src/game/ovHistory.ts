// =============================================================================
// STÄRKE-VERLAUF ALLER SPIELER (Wunsch Pascal): jeden Monat die Stärke festhalten
// -----------------------------------------------------------------------------
// Am 1. jedes Monats bekommt jeder Spieler (Profis + Jugend) einen Messpunkt.
// Platzsparend als Zeichenkette: ein Zeichen je Monat (Stärke + OFFSET), Beginn
// im Feld `s` ('YYYY-MM'). Älter als zehn Jahre: nur noch ein Wert je Jahr
// (`y`, ab Jahr `sy`) – im Diagramm wäre feiner ohnehin nicht zu sehen. Das
// Ausdünnen kostet nur einmal im Jahr ein `slice` je Spieler.
// Optionales `Player.history.ovm`; alte Spielstände beginnen beim nächsten Monat.
// =============================================================================
import type { OvMonthly, Player } from '../types';
import type { Game } from './state';

const OFFSET = 40;
const KEEP_MONTHS = 120;

const enc = (ov: number) => String.fromCharCode(OFFSET + Math.max(0, Math.min(99, Math.round(ov))));
const dec = (c: string) => c.charCodeAt(0) - OFFSET;
const monthIndex = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const ymOf = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

function record(p: Player, ym: string): void {
  const h = (p.history ??= {});
  const cur = enc(p.overall);
  const o = h.ovm;
  if (!o) { h.ovm = { s: ym, m: cur }; return; }
  const at = monthIndex(ym) - monthIndex(o.s);
  if (at < o.m.length) { if (at >= 0) o.m = o.m.slice(0, at) + cur + o.m.slice(at + 1); return; }
  // Lücken (Spieler war nicht im Spiel, alter Spielstand) mit dem letzten Wert füllen.
  o.m += o.m.slice(-1).repeat(at - o.m.length) + cur;
  // Älter als zehn Jahre: ganze Jahre auf einen Wert (Juli = Saisonbeginn bzw. erster Wert) eindampfen.
  while (o.m.length > KEEP_MONTHS + 12) {
    const startIdx = monthIndex(o.s);
    const yearLeft = 12 - (startIdx % 12); // Monate bis zum Jahreswechsel
    const chunk = o.m.slice(0, yearLeft);
    const year = Math.floor(startIdx / 12);
    if (o.sy == null) { o.sy = year; o.y = ''; }
    const pad = year - (o.sy + (o.y ?? '').length);
    o.y = (o.y ?? '') + (pad > 0 ? (o.y?.slice(-1) ?? chunk[0]).repeat(pad) : '') + chunk[Math.max(0, 6 - (startIdx % 12))];
    o.m = o.m.slice(yearLeft);
    o.s = ymOf(startIdx + yearLeft);
  }
}

/** Am Monatsersten aus processDay. */
export function recordMonthlyOv(g: Game, today: string): void {
  const ym = today.slice(0, 7);
  for (const p of Object.values(g.players)) record(p, ym);
  for (const p of Object.values(g.youthPlayers ?? {})) record(p, ym);
}

/** Verlauf als Punkte (Datum, Stärke): Jahreswerte (Juli), dann Monatswerte. */
export function ovPoints(o: OvMonthly | undefined): { d: string; ov: number }[] {
  if (!o) return [];
  const out: { d: string; ov: number }[] = [];
  if (o.sy != null && o.y) for (let i = 0; i < o.y.length; i++) out.push({ d: `${o.sy + i}-07-01`, ov: dec(o.y[i]) });
  const s = monthIndex(o.s);
  for (let i = 0; i < o.m.length; i++) out.push({ d: `${ymOf(s + i)}-01`, ov: dec(o.m[i]) });
  return out;
}
