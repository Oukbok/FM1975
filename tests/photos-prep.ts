// Vorbereitung für tests/photos-shots.mjs: Vorlage „Test 3 Jahre“ mit eigenem Datensatz „fototest“,
// der zu dem Spieler der jüngsten Nachricht mit Spielerbezug und dem Spieler eines Zeitungsartikels Fotos hat.
//   node scripts/run-ts.mjs tests/photos-prep.ts <ausgabe.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { builtinDataset } from '../src/data/dataset/builtin';
import { messagePlayers } from '../src/game/messagePlayers';
import { buildEdition, pressIssues } from '../src/game/press/edition';
import type { Game } from '../src/game/state';

const out = process.argv[2] || 'test-output/photos-prep.json';
const txt = readFileSync('public/saves/test-3-jahre.txt', 'utf8');
const wrap = JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game };
const g = wrap.game;
const files = ['bilder/faces/mitteleuropa', 'bilder/faces/nordeuropa'].map((d) => `${d}/1970`);
const { readdirSync } = await import('node:fs');
const img = (dir: string, i: number) => `data:image/webp;base64,${readFileSync(`${dir}/${readdirSync(dir)[i]}`).toString('base64')}`;
const msg = g.messages.find((m) => messagePlayers(g, m).length && !(m.choices?.length && m.eventRef && !m.eventRef.resolved));
if (!msg) throw new Error('keine Nachricht mit Spielerbezug');
const mp = messagePlayers(g, msg)[0];
const ed = buildEdition(g, pressIssues(g)[0]);
const story = [ed.lead, ...ed.stories].find((s) => s?.image?.kind === 'player' && (s.image as { id: string }).id !== mp.id)!;
const sp = g.players[(story.image as { id: string }).id] ?? g.youthPlayers[(story.image as { id: string }).id];
const ds = builtinDataset();
ds.meta = { ...ds.meta, id: 'fototest', name: 'Fototest' };
ds.playerPhotos = [
  { id: 'f1', name: mp.fullName, born: Number(mp.dateOfBirth.slice(0, 4)), photos: [{ pose: 'general', img: img(files[0], 0) }] },
  { id: 'f2', name: sp.fullName, photos: [{ pose: 'general', img: img(files[1], 1) }] },
];
g.datasetId = 'fototest';
const save = 'LZ1:' + compressToUTF16(JSON.stringify(wrap));
writeFileSync(out, JSON.stringify({ save, dataset: ds, subject: msg.subject, player: mp.fullName, story: story.headline, storyPlayer: sp.fullName }));
console.log(`Nachricht „${msg.subject}“ → ${mp.fullName}; Artikel „${story.headline}“ → ${sp.fullName}`);
