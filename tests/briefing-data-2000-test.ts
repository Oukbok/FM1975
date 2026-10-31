// Prüft die Saison-Briefings 2000/01–2034/35 (reine Daten, ohne UI).
//   node scripts/run-ts.mjs tests/briefing-data-2000-test.ts
import { SEASONS_2000 } from '../src/data/briefings/seasons2000';

const errors: string[] = [];
const err = (m: string) => errors.push(m);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const TOPICS = new Set(['regeln', 'liga', 'geld', 'taktik', 'medien', 'politik', 'alltag', 'kultur']);

if (SEASONS_2000.length !== 35) err(`Erwartet 35 Saisons, gefunden ${SEASONS_2000.length}`);
let items = 0;
SEASONS_2000.forEach((e, i) => {
  const y = 2000 + i;
  const want = `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  if (e.season !== want) err(`Eintrag ${i}: Saison ${e.season}, erwartet ${want}`);
  if (!/^\d{4}\/\d{2}$/.test(e.season)) err(`${e.season}: Format falsch`);
  const hw = e.headline.trim().split(/\s+/).length;
  if (!e.headline.trim() || hw < 3 || hw > 8) err(`${e.season}: Überschrift ${hw} Wörter`);
  if (EMOJI.test(e.headline)) err(`${e.season}: Emoji in Überschrift`);
  if (e.football.length < 3 || e.football.length > 6) err(`${e.season}: ${e.football.length} Fußball-Punkte`);
  const minSoc = y <= 2025 ? 3 : 2;
  if (e.society.length < minSoc || e.society.length > 6) err(`${e.season}: ${e.society.length} Gesellschafts-Punkte`);
  for (const it of [...e.football, ...e.society]) {
    items++;
    if (!TOPICS.has(it.topic)) err(`${e.season}: unbekanntes Thema ${it.topic}`);
    if (!it.title.trim() || !it.text.trim()) err(`${e.season}: leerer Titel/Text`);
    const tw = it.title.trim().split(/[\s-]+/).length; // Bindestrich-Teile zählen (z. B. „Drei-Punkte-Regel“)
    if (tw < 2 || tw > 6) err(`${e.season}: Titel „${it.title}“ hat ${tw} Wörter`);
    if (it.inGame !== undefined && !it.inGame.trim()) err(`${e.season}: leeres inGame`);
    for (const s of [it.title, it.text, it.inGame ?? '']) if (EMOJI.test(s)) err(`${e.season}: Emoji in „${it.title}“`);
  }
});

if (errors.length) {
  console.error(errors.map((m) => 'FEHLER: ' + m).join('\n'));
  process.exit(1);
}
const inGame = SEASONS_2000.flatMap((e) => [...e.football, ...e.society]).filter((x) => x.inGame).length;
console.log(`OK: ${SEASONS_2000.length} Saisons, ${items} Punkte (${inGame} mit Spielbezug).`);
