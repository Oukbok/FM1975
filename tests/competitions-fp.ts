// =============================================================================
// Fingerabdruck eines neuen Spiels nach n Tagen (Editor › Wettbewerbe: „leerer
// Datensatz = identisch zu vorher“). Läuft auch in älteren Ständen des Projekts:
//   node scripts/run-ts.mjs tests/competitions-fp.ts <jahr> <tage> [datensatz.json]
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { applyDataset } from '../src/data/dataset/apply';
import { Game } from '../src/game/state';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null), setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; }, clear: () => store.clear(),
};
const RealDate = Date;
let NOW = RealDate.UTC(2026, 0, 1);
(globalThis as any).Date = class extends RealDate {
  constructor(...a: any[]) { if (a.length) super(...(a as [any])); else super(NOW); }
  static now() { return (NOW += 7); }
};
let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const year = Number(process.argv[2]) || 1975;
const days = Number(process.argv[3]) || 60;
const dsFile = process.argv[4];
if (dsFile) applyDataset(JSON.parse(readFileSync(dsFile, 'utf8')));
const ui: DayUi = {
  onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {},
  onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false,
} as DayUi;
const g: Game = createNewGame({
  managedClubId: 'fra', manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' },
  difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...(year !== 1975 ? { startYear: year } : {}),
} as any);
(g as any).simAutoManage = true;
for (let i = 0; i < days; i++) {
  if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
}
const json = JSON.stringify(g);
console.log(`FP ${year} ${days} ${g.calendar.currentDate} ${createHash('sha1').update(json).digest('hex')} ${json.length}`);
