// Stärke-Verlauf je Monat (game/ovHistory.ts): Aufzeichnung, Lücken, Ausdünnen auf Jahreswerte.
import { ovPoints, recordMonthlyOv } from '../src/game/ovHistory';
import type { Game } from '../src/game/state';
import type { Player } from '../src/types';
const fail = (m: string) => { console.error('FEHLER', m); process.exit(1); };
const p = { id: 'x', overall: 50 } as unknown as Player;
const g = { players: { x: p }, youthPlayers: {} } as unknown as Game;
let ov = 50;
for (let y = 1975; y < 2000; y++) for (let m = 1; m <= 12; m++) {
  if (y === 1975 && m < 8) continue;
  p.overall = ov = Math.min(99, ov + (m === 7 ? 1 : 0));
  recordMonthlyOv(g, `${y}-${String(m).padStart(2, '0')}-01`);
}
const o = p.history!.ovm!;
if (o.m.length > 132) fail(`zu viele Monatswerte: ${o.m.length}`);
const pts = ovPoints(o);
if (pts[pts.length - 1].d !== '1999-12-01' || pts[pts.length - 1].ov !== p.overall) fail('letzter Punkt falsch');
if (!o.y || o.sy !== 1975) fail(`Jahreswerte fehlen: ${o.sy}`);
for (let i = 1; i < pts.length; i++) if (pts[i].d <= pts[i - 1].d) fail(`Reihenfolge ${pts[i - 1].d} ${pts[i].d}`);
const bytes = JSON.stringify(o).length;
console.log(`25 Jahre: ${o.y.length} Jahreswerte + ${o.m.length} Monatswerte, ${bytes} Zeichen JSON`);
// Lücke: zwei Monate ausgelassen
const q = { id: 'q', overall: 60 } as unknown as Player;
const g2 = { players: { q }, youthPlayers: {} } as unknown as Game;
recordMonthlyOv(g2, '2000-01-01'); q.overall = 62; recordMonthlyOv(g2, '2000-04-01');
if (q.history!.ovm!.m.length !== 4) fail('Lücke nicht gefüllt');
console.log('Stärke-Verlauf-Test bestanden.');
