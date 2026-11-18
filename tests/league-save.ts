// =============================================================================
// Vorlage mit einem Verein aus einer bestimmten Liga (Wunsch Pascal: Vorlagen aus
// unterschiedlichen Ligen). Startet ein neues Spiel im Land/Jahr, wählt einen Verein
// der gewünschten Ebene, spielt bis zum Stichtag und legt die Vorlage ab.
//   node scripts/run-ts.mjs tests/league-save.ts <land> <jahr> <ebene> <nr> <datei> [bis]
//   ebene 1/2 = aus den Weltdaten, ab 3 = untere Liga (nur Deutschland, lowerTierPlan)
// Ausgabe (letzte Zeile): JSON mit clubName/league/season/gameDate für index.json.
// =============================================================================
import { createNewGame } from '../src/game/newGame';
import { processDay } from '../src/game/day';
import { HEADLESS_UI } from '../src/game/dayUi';
import { composeHome } from '../src/game/worldCompose';
import { lowerTierPlan } from '../src/game/lowerTierStart';
import { CalendarEngine } from '../src/engine/calendar';
import type { Game } from '../src/game/state';

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); }, key: () => null, length: 0, clear: () => store.clear() };
let seed = Number(process.env.SEED ?? 1975);
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const [cc, yearS, tierS, pickS, out, untilArg] = process.argv.slice(2);
const year = Number(yearS), tier = Number(tierS), pick = Number(pickS);
const until = untilArg ?? `${year}-12-10`;

function pickClub(): string {
  if (tier >= 3) {
    const div = lowerTierPlan(cc, year).find((d) => d.meta.tier === tier);
    const c = div?.clubs[pick];
    if (!c) throw new Error(`keine Liga auf Ebene ${tier} in ${cc} ${year}`);
    return c.id;
  }
  const comp = composeHome(cc, year);
  if (!comp) throw new Error(`keine Weltdaten für ${cc} ${year}`);
  const list = tier === 1 ? comp.tier1.map((s) => s.id) : comp.second.flatMap((s) => s.clubs.map((x: any) => x.id ?? x));
  const id = list[pick];
  if (!id) throw new Error(`Verein Nr. ${pick} auf Ebene ${tier} fehlt`);
  return id;
}

const g: Game = createNewGame({
  managedClubId: pickClub(),
  manager: { name: 'Test', nationality: 'GER', birthYear: year - 35, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
  startYear: year, country: cc, legends: true,
} as any);
(g as any).simAutoManage = true;
let guard = 0;
while (g.calendar.currentDate < until && !CalendarEngine.isSeasonOver(g.calendar) && guard++ < 400) {
  const t = g.clubs[g.managedClubId]?.tactics;
  if (t && t.startingXI?.length) { t.startingXI = []; t.lineupMap = undefined; }
  processDay(g, HEADLESS_UI);
}
const { compressToUTF16 } = await import('lz-string');
const { writeFileSync } = await import('node:fs');
const { SAVE_VERSION } = await import('../src/engine/save');
const copy = JSON.parse(JSON.stringify(g));
delete copy.simAutoManage;
const my = copy.clubs[copy.managedClubId];
const meta = { slot: 'sim', name: 'Vorlage', managerName: 'Test', clubName: my.name, clubId: my.id, season: copy.season, gameDate: copy.calendar.currentDate, savedAt: new Date().toISOString(), version: SAVE_VERSION };
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: copy })));
console.log(JSON.stringify({ clubName: my.name, league: g.leagues.playerDivision.name, season: copy.season, gameDate: copy.calendar.currentDate }));
