// Spielstand für die UI-Stichprobe der Legenden (tests/legends-ui.mjs): neues Spiel mit Legenden,
// eine Profi-Legende und eine Jugend-Legende werden NUR FÜR DEN TEST in den eigenen Verein gelegt.
//   node scripts/run-ts.mjs tests/legends-prep.ts <ausgabe.txt>
import { writeFileSync } from 'node:fs';
import { compressToUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { LEGENDS } from '../src/data/legends';
import { SAVE_VERSION } from '../src/engine/save';

const out = process.argv[2] ?? 'test-output/legends-save.txt';
let seed = 4711;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const g = createNewGame({ managedClubId: 'fra', manager: { name: 'Test Tester', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer', avatarSeed: 't' }, difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 300 } as any);
const own = g.clubs.fra;
const done = g.legends2!.done;
const pro = LEGENDS.map((l) => g.players[done[l.id]]).find((p) => p && !p.isYouth)!;
const youth = LEGENDS.map((l) => g.youthPlayers[done[l.id]]).find((p) => p && p.clubId !== 'fra');
const move = (p: any, youthList: boolean) => {
  const from = g.clubs[p.clubId];
  if (youthList) { from.youthPlayerIds = from.youthPlayerIds.filter((x) => x !== p.id); own.youthPlayerIds.push(p.id); }
  else { from.playerIds = from.playerIds.filter((x) => x !== p.id); own.playerIds.push(p.id); }
  p.clubId = 'fra';
};
move(pro, false);
if (youth) move(youth, true);
const meta = { slot: 'sim', name: 'Legenden', managerName: 'Test Tester', clubName: own.name, clubId: own.id, season: g.season, gameDate: g.calendar.currentDate, savedAt: new Date().toISOString(), version: SAVE_VERSION };
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify({ meta, game: g })));
writeFileSync(out + '.json', JSON.stringify({ pro: pro.fullName, youth: youth?.fullName ?? null, hidden: [pro.development.consistency, pro.development.bigMatchTemperament, pro.development.injuryProneness, pro.development.tempo, pro.development.professionalism] }));
console.log('Spielstand mit Legenden:', out, pro.fullName, youth?.fullName);
