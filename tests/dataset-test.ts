// Prüft: Standard-Datensatz exportieren, ändern, anwenden, neues Spiel starten.
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset, datasetPlayerPhotos } from '../src/data/dataset/apply';
import { messagePlayerPhoto, photoIndex, playerPhotoFor } from '../src/game/playerPhotos';
import { messagePoses } from '../src/data/pressPhotos';
import { validateDataset } from '../src/data/dataset/schema';
import { createNewGame } from '../src/game/newGame';
import { TIMELINE } from '../src/data/timeline';
import { STAFF_BY_ID } from '../src/data/staff';
import { CLUB_SEEDS } from '../src/data/generate';
import { portraitOf, setPortraitGame } from '../src/game/playerPortraits';
import { datasetBlob, freeDatasetId, readDatasetFile, slugId } from '../src/data/dataset/storage';

const fail = (m: string) => { console.error('FEHLER:', m); process.exit(1); };
const ds = builtinDataset();
if (validateDataset(ds).length) fail('Standard-Datensatz ungültig: ' + validateDataset(ds).join(' '));
const json = JSON.stringify(ds);
console.log('Standard-Datensatz:', (json.length / 1024).toFixed(0), 'KB,', ds.clubs.tier1.length, 'Erstligisten,', ds.timeline.length, 'Chronik-Ereignisse');

const mod = JSON.parse(json);
mod.meta = { ...mod.meta, id: 'test', name: 'Test' };
mod.clubs.tier1[0].name = 'Teststadt Grün';
mod.timeline.find((e: any) => e.id === 'threepoints-1995').season = '1980/81';
mod.staff.find((r: any) => r.id === 'sportdirektor').unlockYear = 1976;
mod.crests = { [mod.clubs.tier1[0].id]: 'data:image/svg+xml;base64,PHN2Zy8+' };
if (validateDataset(mod).length) fail('Geänderter Datensatz ungültig');
applyDataset(mod);
if (CLUB_SEEDS[0].name !== 'Teststadt Grün') fail('Vereinsname nicht übernommen');
if (TIMELINE.find((e) => e.id === 'threepoints-1995')?.season !== '1980/81') fail('Chronik nicht übernommen');
if (STAFF_BY_ID.sportdirektor.unlockYear !== 1976) fail('Mitarbeiter-Jahr nicht übernommen');
const g = createNewGame({ managedClubId: mod.clubs.tier1[0].id, manager: { name: 'T', nationality: 'D', birthYear: 1940, style: 'balanced', background: 'ex_pro', avatarSeed: 't' }, difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 0 } as any);
const c = g.clubs[mod.clubs.tier1[0].id];
if (c.name !== 'Teststadt Grün') fail('Neues Spiel nutzt den Datensatz nicht');
if (!c.customCrest) fail('Wappen aus dem Datensatz fehlt');

// Spielerfotos (Wunsch Pascal): Zuordnung über Name (+ Geburtsjahr/Verein) und Legenden-ID, Posen, Rückfall.
{
  const IMG = (t: string) => `data:image/webp;base64,${Buffer.from(t).toString('base64')}`;
  const squad = c.playerIds.map((id) => g.players[id]);
  const pl = squad.find((p) => squad.filter((x) => x.fullName === p.fullName).length === 1)!;
  const leg = Object.entries(g.legends2?.done ?? {}).find(([, pid]) => pid !== '-' && (g.players[pid] || g.youthPlayers[pid]));
  const photoDs = JSON.parse(JSON.stringify(mod));
  photoDs.playerPhotos = [
    { id: 'foto1', name: `  ${pl.fullName.toUpperCase()} `, born: Number(pl.dateOfBirth.slice(0, 4)), photos: [{ pose: 'general', img: IMG('allg') }, { pose: 'verletzung', img: IMG('verl') }] },
    { id: 'foto2', name: pl.fullName, born: 1800, photos: [{ pose: 'general', img: IMG('falsch') }] },
    { id: 'foto3', name: 'Niemand Unbekannt', photos: [{ pose: 'torjubel', img: 'javascript:alert(1)' }] },
    ...(leg ? [{ id: 'foto4', legendId: leg[0], photos: [{ pose: 'torjubel', img: IMG('jubel') }, { pose: 'quatsch', img: IMG('legallg') }] }] : []),
  ];
  applyDataset(photoDs);
  const sets = datasetPlayerPhotos();
  if (sets.length !== (leg ? 3 : 2)) fail(`Spielerfotos: ${sets.length} gültige Einträge statt ${leg ? 3 : 2}`);
  if (leg && sets.find((x) => x.id === 'foto4')!.photos[1].pose !== 'general') fail('Unbekannte Pose nicht als „Allgemein“ übernommen');
  const idx = photoIndex(g);
  if (idx.get(pl.id)?.id !== 'foto1') fail('Spielerfoto nicht über Name + Geburtsjahr zugeordnet');
  const src = (pid: string, poses: string[]) => Buffer.from((playerPhotoFor(g, pid, poses as never, 'x') ?? 'data:,').split(',')[1] ?? '', 'base64').toString();
  if (src(pl.id, ['verletzung']) !== 'verl') fail('Pose „Verletzung“ nicht gewählt');
  if (src(pl.id, ['vertrag']) !== 'allg') fail('Ohne passende Pose nicht das allgemeine Foto');
  if (leg) {
    if (idx.get(leg[1])?.id !== 'foto4') fail('Legenden-Foto nicht über die Legenden-ID zugeordnet');
    if (src(leg[1], ['torjubel', 'torschuss']) !== 'jubel') fail('Legende: Torjubel nicht gewählt');
  } else console.log('Hinweis: keine erschienene Legende im Testspiel – Legenden-Zuordnung übersprungen.');
  const msg = { id: 'm1', date: g.calendar.currentDate, category: 'injury', from: 'Arzt', subject: `${pl.fullName} verletzt`, shortText: '', bodyText: `${pl.fullName} fällt aus.`, read: false } as never;
  const hit = messagePlayerPhoto(g, msg, () => messagePoses(msg));
  if (!hit || hit.pid !== pl.id || Buffer.from(hit.src.split(',')[1], 'base64').toString() !== 'verl') fail('Newscenter: Verletzungsfoto nicht über den Namen im Text gefunden');
  applyDataset(mod);
  if (photoIndex(g).size !== 0) fail('Ohne Spielerfotos im Datensatz trotzdem Zuordnungen');
  console.log(`Spielerfotos: ${sets.length} Einträge, Name/Pose/Legende/Newscenter geprüft.`);
}
// Spielerbilder (Porträt, Wunsch Pascal): ersetzen das Gesicht, Zuordnung wie die Fotos.
{
  const IMG = (t: string) => `data:image/webp;base64,${Buffer.from(t).toString('base64')}`;
  const squad = c.playerIds.map((id) => g.players[id]);
  const pl = squad.find((p) => squad.filter((x) => x.fullName === p.fullName).length === 1)!;
  const other = squad.find((p) => p.id !== pl.id)!;
  const leg = Object.entries(g.legends2?.done ?? {}).find(([, pid]) => pid !== '-' && (g.players[pid] || g.youthPlayers[pid]));
  const pd = JSON.parse(JSON.stringify(mod));
  pd.playerPhotos = [
    { id: 'p1', name: pl.fullName, photos: [], portrait: IMG('kopf') },
    { id: 'p2', name: other.fullName, photos: [{ pose: 'general', img: IMG('foto') }], portrait: 'javascript:alert(1)' },
    { id: 'p3', name: 'Niemand Da', photos: [] },
    ...(leg ? [{ id: 'p4', legendId: leg[0], photos: [], portrait: IMG('legende') }] : []),
  ];
  applyDataset(pd);
  const sets = datasetPlayerPhotos();
  if (sets.length !== (leg ? 3 : 2)) fail(`Spielerbilder: ${sets.length} gültige Einträge statt ${leg ? 3 : 2} (nur Porträt muss reichen, leer fällt weg)`);
  if (sets.find((x) => x.id === 'p2')?.portrait) fail('Ungültiges Spielerbild nicht verworfen');
  const dec = (u: string | null) => (u ? Buffer.from(u.split(',')[1], 'base64').toString() : null);
  if (portraitOf(pl.id) !== null) fail('Spielerbild ohne laufendes Spiel');
  setPortraitGame(g);
  if (dec(portraitOf(pl.id)) !== 'kopf') fail('Spielerbild nicht über den Namen zugeordnet');
  if (portraitOf(other.id) !== null) fail('Spieler ohne Spielerbild bekommt eines');
  if (leg && dec(portraitOf(leg[1])) !== 'legende') fail('Spielerbild der Legende nicht über die Legenden-ID zugeordnet');
  setPortraitGame(null);
  // Datei: Export → Import (gleiche Daten), verständliche Fehler.
  const back = await readDatasetFile(new File([datasetBlob(pd)], 'test.fm1975'));
  if (!back.data || JSON.stringify(back.data) !== JSON.stringify(pd)) fail(`Export → Import nicht verlustfrei: ${back.errors.join(' ')}`);
  const bad = await readDatasetFile(new File(['{kaputt'], 'kaputt.fm1975'));
  if (bad.data || !bad.errors[0].includes('keine Datensatz-Datei')) fail(`Kaputte Datei: ${bad.errors.join(' ')}`);
  const empty = await readDatasetFile(new File([''], 'leer.fm1975'));
  if (!empty.errors[0]?.includes('leer')) fail('Leere Datei nicht erkannt');
  const save = await readDatasetFile(new File([JSON.stringify({ calendar: {}, managedClubId: 'x' })], 'stand.json'));
  if (!save.errors[0]?.includes('Spielstand')) fail('Spielstand als Datensatz nicht erkannt');
  const gz = await readDatasetFile(new File([await new Response(new Blob([JSON.stringify(pd)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()], 'test.fm1975.gz'));
  if (!gz.data) fail(`Gepackte Datei nicht gelesen: ${gz.errors.join(' ')}`);
  if (slugId('Meine Liga – Größe 1975') !== 'meine-liga-groesse-1975') fail(`ID aus Namen: ${slugId('Meine Liga – Größe 1975')}`);
  if (freeDatasetId('test', ['test', 'test-2']) !== 'test-3' || freeDatasetId('builtin', []) !== 'builtin-2') fail('Freie ID falsch');
  console.log(`Spielerbilder: ${sets.filter((x) => x.portrait).length} zugeordnet; Export/Import + Fehlermeldungen geprüft.`);
}
applyDataset(null);
if (CLUB_SEEDS[0].name === 'Teststadt Grün') fail('Zurücksetzen auf Standard fehlgeschlagen');
console.log('Datensatz-Test bestanden.');
