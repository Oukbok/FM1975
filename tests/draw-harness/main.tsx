// Prüfstand der Gala-Auslosung für große Felder (64 Vereine gibt es im Spiel derzeit nicht:
// Landespokal 32, Europapokal höchstens 48). Lädt den Spielstand „sim“ aus dem localStorage
// und baut aus seinen Vereinen eine künstliche Ziehung mit N Vereinen (?n=64&pots=2).
// Gebaut und fotografiert von tests/draw-big-shots.mjs.
import { createRoot } from 'react-dom/client';
import '../../src/styles/index';
import { loadGame, loadSettings } from '../../src/engine/save';
import type { Game } from '../../src/game/state';
import type { DrawRecord } from '../../src/types/draw';
import { DrawShow } from '../../src/screens/draw/DrawShow';
import { DisplayFrame } from '../../src/ui/DisplayFrame';

const q = new URLSearchParams(location.search);
const n = Number(q.get('n') ?? 64), potsN = Number(q.get('pots') ?? 2);
const slot = loadGame<Game>('sim');
if (!slot) throw new Error('Kein Spielstand „sim“ im localStorage');
const g = slot.game;
const ids = [...Object.keys(g.clubs), ...Object.keys(g.euroClubs ?? {})].filter((id) => id !== g.managedClubId).slice(0, n - 1).concat(g.managedClubId);
const per = Math.ceil(n / potsN);
const pots = Array.from({ length: potsN }, (_, i) => ({ label: potsN > 1 ? (i ? 'Profis' : 'Amateure') : 'Lostopf', ids: ids.slice(i * per, (i + 1) * per) }));
const order = [...ids].sort((a, b) => (a.charCodeAt(a.length - 1) * 7) % 13 - (b.charCodeAt(b.length - 1) * 7) % 13);
const pairs = Array.from({ length: n / 2 }, (_, i) => ({ home: order[2 * i], away: order[2 * i + 1] }));
const potOf = (id: string) => pots.findIndex((p) => p.ids.includes(id));
const rec: DrawRecord = {
  comp: 'cup', roundIndex: 0, roundName: '1. Hauptrunde', date: '1983-07-16', matchDate: '1983-08-27', venue: 'Fernsehstudio',
  stage: 'studio70', pots, rules: [],
  balls: pairs.flatMap((p, i) => [p.home, p.away].map((id) => ({ id, pot: potOf(id), no: pots[potOf(id)].ids.indexOf(id) + 1, pair: i }))),
  pairs,
};
const s = loadSettings();
createRoot(document.getElementById('root')!).render(
  <DisplayFrame resolution={s.resolution} uiScale={s.uiScale}>
    <DrawShow g={g} rec={rec} settings={{ ...s, drawSpeed: 'schnell' }} onSettings={() => {}} onClose={() => {}} />
  </DisplayFrame>,
);
