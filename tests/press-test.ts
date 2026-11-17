// Presse ohne UI: Ausgaben aus der Vorlage „Test 3 Jahre“ (und optional SAVE=…)
// rekonstruieren – stabil, ohne Platzhalter-Reste, alle Verweise gültig.
//   npm run test:press            PRINT=1 zeigt die aktuelle Ausgabe als Text
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import { createNewGame } from '../src/game/newGame';
import { processDay, HEADLESS_UI } from '../src/game/day';
import { buildEdition, pressIssues } from '../src/game/press/edition';
import { isIssueDay, issueNumber, mastheadFor } from '../src/game/press/calendar';
import type { Game } from '../src/game/state';
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset } from '../src/data/dataset/apply';
import { keeperOf, playerPhotoFor } from '../src/game/playerPhotos';
import { storyPoses } from '../src/data/pressPhotos';
import type { PressEdition, PressStory } from '../src/game/press/types';

let seed = 1975;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fail(msg: string): never { console.error('FEHLER:', msg); process.exit(1); }
const expect = (cond: unknown, msg: string) => { if (!cond) fail(msg); };

function load(path: string): Game {
  const txt = readFileSync(path, 'utf8');
  return (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
}

const storiesOf = (e: PressEdition): PressStory[] => [...(e.lead ? [e.lead] : []), ...e.stories, ...e.briefs];

function check(g: Game, label: string): PressEdition[] {
  const dates = pressIssues(g);
  expect(dates[0] === g.calendar.currentDate, `${label}: aktuelle Ausgabe nicht von heute`);
  expect(dates.slice(1).every(isIssueDay), `${label}: Archiv enthält Tage außer Mo/Do`);
  const eds = dates.map((d) => buildEdition(g, d));
  const again = JSON.stringify(buildEdition(g, dates[0]));
  expect(again === JSON.stringify(eds[0]), `${label}: Ausgabe nicht stabil`);
  const kinds: Record<string, number> = {};
  for (const e of eds) {
    for (const s of storiesOf(e)) {
      kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
      const text = [s.headline, s.dek ?? '', ...s.body].join(' ');
      expect(!/[#{}]|undefined|NaN|\[|\]/.test(text), `${label} ${e.date}: Platzhalter-Rest in „${text.slice(0, 160)}“`);
      expect(s.headline.trim().length > 3, `${label}: leere Schlagzeile (${s.kind})`);
      for (const pid of s.people) expect(g.players[pid] || g.youthPlayers[pid], `${label}: unbekannter Spieler ${pid}`);
      if (s.image?.kind === 'player') expect(g.players[s.image.id] || g.youthPlayers[s.image.id], `${label}: Bild zeigt unbekannten Spieler`);
      for (const t of s.targets) if (t.kind === 'match') expect(t.id, `${label}: Spielverweis ohne ID`);
    }
    if (e.matchday) expect(e.matchday.results.length > 0, `${label}: Spieltag ohne Ergebnisse`);
  }
  const cur = eds[0];
  console.log(`${label}: ${eds.length} Ausgaben (${cur.masthead.name} Nr. ${cur.number}, ${cur.volume}. Jahrgang), Arten: ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  return eds;
}

function print(e: PressEdition) {
  console.log(`\n=== ${e.masthead.name.toUpperCase()} – ${e.date} (Nr. ${e.number}) – Bericht ab ${e.from}`);
  for (const s of storiesOf(e).slice(0, 14)) console.log(`[${s.rubric}] ${s.headline}${s.dek ? ` | ${s.dek}` : ''}\n    ${s.body.join(' ').slice(0, 260)}`);
}

// 1) Kalender & Kopf
expect(isIssueDay('1978-12-11') && isIssueDay('1978-12-14') && !isIssueDay('1978-12-10'), 'Mo/Do falsch erkannt');
expect(issueNumber('1978-01-02') === 1, 'Nummer am ersten Montag ≠ 1');
expect(mastheadFor(1975).name !== mastheadFor(2015).name, 'Zeitungskopf ändert sich nicht über die Epochen');

// 2) Vorlage „Test 3 Jahre“ (Mitte 1978/79)
const g = load('public/saves/test-3-jahre.txt');
const eds = check(g, 'Vorlage 1978/79');
const allKinds = new Set(eds.flatMap(storiesOf).map((s) => s.kind));
for (const k of ['spiel', 'spieltag', 'tabelle', 'kommentar']) expect(allKinds.has(k as never), `Vorlage: keine Artikel der Art „${k}“ im Archiv`);
// „trainer“ hängt davon ab, ob in der Vorlage bisher ein Trainer entlassen wurde (Zufall) – nicht Pflicht.
expect(eds.some((e) => e.lead?.image), 'Kein Aufmacher mit Bild');
expect(eds.flatMap(storiesOf).some((s) => s.image?.kind === 'player'), 'Keine Gesichter in den Ausgaben');
if (process.env.PRINT) { print(eds[0]); print(eds.find((e) => e.matchday) ?? eds[1]); }

// 2b) Eigene Spielerfotos aus dem Datensatz: Artikel mit Spielerbild bekommt das Foto passend zur Art.
{
  const IMG = (t: string) => `data:image/webp;base64,${Buffer.from(t).toString('base64')}`;
  const stories = eds.flatMap(storiesOf).filter((s) => s.image?.kind === 'player');
  const s0 = stories.find((s) => s.kind === 'spiel' || s.kind === 'rekord') ?? stories[0];
  const pid = (s0.image as { id: string }).id;
  const p = g.players[pid] ?? g.youthPlayers[pid];
  const ds = builtinDataset();
  ds.meta.id = 'fototest';
  ds.playerPhotos = [{ id: 'f1', name: p.fullName, born: Number(p.dateOfBirth.slice(0, 4)), club: p.clubId,
    photos: [{ pose: 'general', img: IMG('allg') }, { pose: 'torjubel', img: IMG('jubel') }, { pose: 'torwart', img: IMG('parade') }, { pose: 'verletzung', img: IMG('verl') }] }];
  applyDataset(ds);
  const got = playerPhotoFor(g, pid, storyPoses(s0.kind, { keeper: keeperOf(g, pid) }), s0.id);
  const txt = got ? Buffer.from(got.split(',')[1], 'base64').toString() : null;
  const want = s0.kind === 'spiel' || s0.kind === 'rekord' ? (keeperOf(g, pid) ? 'parade' : 'jubel') : s0.kind === 'verletzung' ? 'verl' : 'allg';
  expect(txt === want, `Presse: Foto für „${s0.kind}“ ist „${txt}“ statt „${want}“`);
  expect(storyPoses('transfer')[0] === 'vertrag' && storyPoses('verletzung')[0] === 'verletzung', 'Presse: Posen je Artikelart falsch');
  const other = stories.find((s) => (s.image as { id: string }).id !== pid);
  if (other) expect(!playerPhotoFor(g, (other.image as { id: string }).id, storyPoses(other.kind), other.id), 'Presse: Foto bei einem anderen Spieler');
  applyDataset(null);
  console.log(`Spielerfotos in der Zeitung: ${s0.kind} → ${txt}`);
}

// 3) Neues Spiel: vor dem ersten Spieltag und nach 40 Tagen
const fresh = createNewGame({
  managedClubId: 'fra',
  manager: { name: 'Test', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' } as any,
  difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300,
} as any);
check(fresh, 'Neues Spiel (Start)');
for (let d = 0; d < 40; d++) processDay(fresh, HEADLESS_UI);
check(fresh, 'Neues Spiel (+40 Tage)');

// 4) Optional: später Spielstand
if (process.env.SAVE) {
  const late = load(process.env.SAVE);
  const le = check(late, `Spielstand ${late.season}`);
  if (process.env.PRINT) print(le.find((e) => e.matchday) ?? le[0]);
}
console.log('Presse-Test bestanden.');
