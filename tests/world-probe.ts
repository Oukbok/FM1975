// Schnellprobe (Entwicklung): neue Spiele in verschiedenen Jahren/Ländern, n Tage laufen lassen.
import { createNewGame } from '../src/game/newGame';
import { processDay, DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { registerCountryData } from '../src/data/world/index';
import { CLUBS_ENG, SEASONS_ENG } from './fixtures/world/eng';
import type { Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ui: DayUi = { onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {}, onCupDraw: () => false, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
function tick(g: Game) { if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } } }
const [club, year, country, days, reg] = process.argv.slice(2);
if (reg) registerCountryData('eng', CLUBS_ENG, SEASONS_ENG);
const { composeHome } = await import('../src/game/worldCompose');
const autoClub = club === 'auto' ? composeHome(country, Number(year))?.tier1[Number(process.env.PICK ?? 3)]?.id ?? 'fra' : club;
const t0 = Date.now();
const g = createNewGame({ managedClubId: autoClub, manager: { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'rookie' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, startYear: Number(year), country, ...(process.env.FULL ? { fullCountries: process.env.FULL.split(',') } : {}) } as any);
(g as any).simAutoManage = true;
console.log('neu', Date.now() - t0, 'ms', g.season, g.leagues.playerDivision.name, Object.keys(g.clubs).length, g.leagues.otherDivisions.map((d) => `${d.id}:${d.clubIds.length}`).join(' '), g.pointSystem);
console.log('euro', Object.entries(g.euroCups ?? {}).map(([k, c]) => `${k}:${c?.participantIds.length ?? '-'} eigene ${c?.participantIds.filter((id) => g.clubs[id] || g.simClubs[id]).map((id) => g.clubs[id]?.name ?? g.simClubs[id]?.name).join('/')} fremd ${c?.participantIds.filter((id) => !g.clubs[id] && !g.simClubs[id]).slice(0, 4).map((id) => g.euroClubs?.[id]?.name + '(' + g.euroClubs?.[id]?.country + ')').join(',')}`).join(' | '));
const t1 = Date.now();
for (let i = 0; i < Number(days || 30); i++) tick(g);
console.log('tage', Number(days || 30), Date.now() - t1, 'ms', g.calendar.currentDate, g.table.rows.slice(0, 3).map((r) => g.clubs[r.clubId]?.name).join(', '));
if (process.env.NEXT) {
  const { startNextSeason } = await import('../src/game/season');
  let guard = 0;
  while (g.calendar.currentDate < `${Number(year) + 1}-06-29` && guard++ < 400) tick(g);
  const t2 = Date.now();
  startNextSeason(g);
  console.log('wechsel', Date.now() - t2, 'ms', g.season, g.leagues.playerDivision.name, g.table.rows.length, g.leagues.otherDivisions.map((d) => `${d.id}:${d.clubIds.length}`).join(' '), g.pointSystem);
  for (let i = 0; i < 60; i++) tick(g);
  console.log('weiter', g.calendar.currentDate, 'eigener', g.clubs[g.managedClubId]?.name, 'Liga', g.leagues.playerDivision.name);
}
