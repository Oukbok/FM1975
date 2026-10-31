// Prüft die Briefing-Daten 1975/76–1999/2000 und den Katalog „Damals vs. heute“.
//   node scripts/run-ts.mjs tests/briefing-data-test.ts
import { SEASONS_1975 } from '../src/data/briefings/seasons1975';
import { DIFFERENCES } from '../src/data/briefings/differences';
import type { BriefingItem } from '../src/data/briefings/types';

const errors: string[] = [];
const fail = (m: string) => errors.push(m);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const TOPICS = new Set(['regeln', 'liga', 'geld', 'taktik', 'medien', 'politik', 'alltag', 'kultur']);
const label = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
const seasonLabel = (y: number) => (y === 1999 ? '1999/2000' : label(y));

function checkText(where: string, s: string | undefined, required = true) {
  if (s === undefined) { if (required) fail(`${where}: fehlt`); return; }
  if (!s.trim()) fail(`${where}: leer`);
  if (EMOJI.test(s)) fail(`${where}: Emoji gefunden`);
}
function checkItems(where: string, items: BriefingItem[]) {
  if (items.length < 3 || items.length > 6) fail(`${where}: ${items.length} Punkte (erlaubt 3–6)`);
  items.forEach((it, i) => {
    const w = `${where}[${i}]`;
    if (!TOPICS.has(it.topic)) fail(`${w}: unbekanntes Thema ${it.topic}`);
    checkText(`${w}.title`, it.title);
    checkText(`${w}.text`, it.text);
    checkText(`${w}.inGame`, it.inGame, false);
  });
}

if (SEASONS_1975.length !== 25) fail(`erwartet 25 Saisons, gefunden ${SEASONS_1975.length}`);
SEASONS_1975.forEach((e, i) => {
  const want = seasonLabel(1975 + i);
  if (e.season !== want) fail(`Saison ${i}: „${e.season}“ statt „${want}“`);
  checkText(`${e.season}.headline`, e.headline);
  checkItems(`${e.season}.football`, e.football);
  checkItems(`${e.season}.society`, e.society);
});

DIFFERENCES.forEach((d, i) => {
  const w = `DIFFERENCES[${i}] ${d.title}`;
  if (!TOPICS.has(d.topic)) fail(`${w}: unbekanntes Thema`);
  if (!(d.from <= d.to)) fail(`${w}: from > to`);
  if (d.from < 1975) fail(`${w}: from < 1975`);
  if (d.to > 2025) fail(`${w}: to > 2025`);
  checkText(`${w}.title`, d.title);
  checkText(`${w}.then`, d.then);
  checkText(`${w}.today`, d.today);
});
const titles = DIFFERENCES.map((d) => d.title);
titles.forEach((t, i) => { if (titles.indexOf(t) !== i) fail(`doppelter Titel: ${t}`); });

const nFb = SEASONS_1975.reduce((s, e) => s + e.football.length, 0);
const nSo = SEASONS_1975.reduce((s, e) => s + e.society.length, 0);
console.log(`Saisons: ${SEASONS_1975.length}, Fußball-Punkte: ${nFb}, Gesellschaft: ${nSo}, Unterschiede: ${DIFFERENCES.length}`);
console.log(`Gültig 1975/76: ${DIFFERENCES.filter((d) => d.from <= 1975 && d.to >= 1975).length}`);
if (errors.length) { console.error(errors.join('\n')); console.error(`FEHLER: ${errors.length}`); process.exit(1); }
console.log('OK');
