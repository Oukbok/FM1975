// Prüft: Standard-Datensatz exportieren, ändern, anwenden, neues Spiel starten.
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset } from '../src/data/dataset/apply';
import { validateDataset } from '../src/data/dataset/schema';
import { createNewGame } from '../src/game/newGame';
import { TIMELINE } from '../src/data/timeline';
import { STAFF_BY_ID } from '../src/data/staff';
import { CLUB_SEEDS } from '../src/data/generate';

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
applyDataset(null);
if (CLUB_SEEDS[0].name === 'Teststadt Grün') fail('Zurücksetzen auf Standard fehlgeschlagen');
console.log('Datensatz-Test bestanden.');
