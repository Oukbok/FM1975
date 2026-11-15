// Bereitet einen Spielstand mit offenem KI-Angebot für einen eigenen Spieler vor
// (Screenshots Newscenter + Transfers › Verhandlungen, tests/aioffer-shots.mjs).
//   node scripts/run-ts.mjs tests/aioffer-prep.ts <ein.txt> <aus.txt>
// Spielt ohne UI bis zum nächsten Stichtag der KI-Angebote (game/aiOffers.ts) und
// erzwingt dort ein Angebot.
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { HEADLESS_UI, processDay } from '../src/game/day';
import { migratePositions2 } from '../src/game/positions2Migration';
import { rollAiOffers } from '../src/game/aiOffers';

const [inp, out] = process.argv.slice(2);
const raw = readFileSync(inp, 'utf8');
const data = JSON.parse(raw.startsWith('LZ1:') ? decompressFromUTF16(raw.slice(4))! : raw);
const g = data.game;
migratePositions2(g);
g.simAutoManage = true;
const OFFER = ['07-08', '07-22', '08-05', '08-19', '01-06', '01-20'];
let guard = 0;
do processDay(g, HEADLESS_UI);
while (!OFFER.includes(g.calendar.currentDate.slice(5)) && guard++ < 400);
delete g.simAutoManage;
const has = () => g.messages.some((m: any) => m.eventRef?.type === 'ai_offer' && !m.eventRef.resolved);
const rnd = Math.random;
for (let i = 0; i < 40 && !has(); i++) {
  let k = 0;
  Math.random = () => (k++ < 3 ? 0.001 : rnd());
  rollAiOffers(g, g.calendar.currentDate);
}
Math.random = rnd;
if (!has()) { console.error('Kein KI-Angebot'); process.exit(1); }
data.meta.gameDate = g.calendar.currentDate; data.meta.season = g.season;
writeFileSync(out, 'LZ1:' + compressToUTF16(JSON.stringify(data)));
const m = g.messages.find((x: any) => x.eventRef?.type === 'ai_offer' && !x.eventRef.resolved);
console.log(g.calendar.currentDate, m.subject, '→', out);
