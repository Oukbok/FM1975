// =============================================================================
// Datensatz › Wettbewerbe (Editor › Wettbewerbe, Wunsch Pascal) ohne UI:
//  1. leerer Datensatz / Perioden ohne Werte = identischer Fingerabdruck wie der Standard,
//  2. Standard-Perioden aus den eingebauten Daten (Grenzen an den bekannten Wechseln),
//  3. Name, Startplätze, Format, Supercup, Landespokal, Trophäe wirken – im neuen Spiel,
//  4. Zurück auf den Standard.
//   Teil von `npm run test:dataset`.
// =============================================================================
import { createHash } from 'node:crypto';
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset } from '../src/data/dataset/apply';
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import type { Game } from '../src/game/state';
import { accessSlots, cupReplay, euroCompName, euroFormat } from '../src/data/euroFormats';
import { superEra, uefaSuperName } from '../src/data/superCups';
import { competitionDefs, compDef, defaultPeriods } from '../src/data/competitions/registry';
import { cupName } from '../src/data/competitions/overrides';
import { leagueName } from '../src/data/leagueNames';
import { compLabel } from '../src/data/youthCompetitions';
import { icName } from '../src/data/world/continents/intercontinental';
import { germanQualifiersV2 } from '../src/game/euroSetup';
import { addTitleRecord } from '../src/game/clubRecords';
import { trophiesOf } from '../src/game/trophyCabinet';
import { checkDataset } from '../src/editor/validate';
import { splitAt, moveStart, ensurePeriods, setValue, tidy } from '../src/editor/sections/competitions/model';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null), setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); }, key: (i: number) => [...store.keys()][i] ?? null, get length() { return store.size; }, clear: () => store.clear(),
};
let seed = 11;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const fail = (m: string) => { console.error('FEHLER:', m); process.exit(1); };
const ui = {
  onOwnMatch: () => {}, onRatingCeremony: () => {}, onSeasonEnd: () => {}, onOwnMatchDue: () => {},
  onCupDraw: (d: { involvesMe: boolean }) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false,
} as unknown as DayUi;
const mgr = { name: 'T', nationality: 'GER', birthYear: 1940, style: 'balanced', background: 'newcomer' };
function newGame(year = 1975, club = 'fra'): Game {
  seed = 11;
  const g = createNewGame({ managedClubId: club, manager: mgr, difficulty: 'normal', realisticSquads: true, injuriesEnabled: true, speedMs: 0, ...(year !== 1975 ? { startYear: year } : {}) } as any);
  (g as any).simAutoManage = true;
  return g;
}
function fingerprint(ds: unknown, days: number, year = 1975): string {
  applyDataset(ds as never);
  const g = newGame(year);
  for (let i = 0; i < days; i++) if (!processDay(g, ui)) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
  return createHash('sha1').update(JSON.stringify(g)).digest('hex');
}
const named = (base: any, id: string) => ({ ...base, meta: { ...base.meta, id, name: id } });

// --- 1. Fingerabdruck ------------------------------------------------------------
const std = builtinDataset();
const DAYS = Number(process.env.COMP_DAYS ?? 75);
const fpStd = fingerprint(null, DAYS);
const empty = named(JSON.parse(JSON.stringify(std)), 'leer');
delete empty.competitions;
const noop = named(JSON.parse(JSON.stringify(std)), 'noop');
noop.competitions = {};
for (const d of competitionDefs()) if (['ec', 'cwc', 'uefa', 'cup', 'super:Deutschland', 'league:ger:1'].includes(d.id)) noop.competitions[d.id] = defaultPeriods(d).map((p) => ({ ...p }));
if (fingerprint(empty, DAYS) !== fpStd) fail('Datensatz ohne Feld competitions weicht vom Standard ab');
if (fingerprint(noop, DAYS) !== fpStd) fail('Perioden ohne Werte verändern das Spiel');
console.log(`Fingerabdruck ${DAYS} Tage 1975: Standard = ohne Feld = Perioden ohne Werte (${fpStd.slice(0, 10)}).`);

// --- 2. Standard-Perioden ---------------------------------------------------------
applyDataset(null);
const starts = (id: string) => defaultPeriods(compDef(id)!).map((p) => p.from);
for (const [id, must] of [['ec', [1975, 1991, 1992, 1997, 1999, 2021, 2024]], ['uefa', [1971, 1997, 2009, 2024]], ['cwc', [1999, 2021]], ['cup', [1977, 1991]], ['super:Deutschland', [1987, 1997, 2008, 2010]]] as const) {
  const s = starts(id);
  for (const y of must) if (!s.includes(y)) fail(`Standard-Perioden ${id}: keine Grenze ${y} (${s.join(',')})`);
  const ps = defaultPeriods(compDef(id)!);
  if (ps[0].from !== 1960 || ps[ps.length - 1].to !== 9999 || ps.some((p, i) => i && p.from !== ps[i - 1].to + 1)) fail(`Standard-Perioden ${id} nicht lückenlos`);
}
console.log(`Standard-Perioden: ${competitionDefs().length} Wettbewerbe, Landesmeister ${starts('ec').length} Perioden.`);

// --- 3. Änderungen wirken ---------------------------------------------------------
const mod = named(JSON.parse(JSON.stringify(std)), 'wettbewerbe');
const def = (id: string) => compDef(id)!;
// Editor-Funktionen bauen die Perioden (wie die Oberfläche).
const ecList = ensurePeriods(mod, def('ec'));
const i85 = ecList.findIndex((p) => p.from <= 1985 && p.to >= 1985);
setValue(mod, def('ec'), i85, 'name', 'Meistercup');
setValue(mod, def('ec'), i85, 'legs', { hf: 1 });
setValue(mod, def('ec'), i85, 'stageNames', { af: 'Runde der 16' });
setValue(mod, def('ec'), i85, 'trophy', 'welt');
const i95 = ecList.findIndex((p) => p.from <= 1995 && p.to >= 1995);
setValue(mod, def('ec'), i95, 'slots', [[99, 3]]);
const n = splitAt(mod, def('ec'), i85, 1980);
if (n == null || !moveStart(mod, def('ec'), n, 1981)) fail('Teilen/Verschieben der Periode fehlgeschlagen');
const cupL = ensurePeriods(mod, def('cup'));
setValue(mod, def('cup'), 0, 'name', 'Ehrenpokal');
cupL.splice(0, cupL.length, { from: 1960, to: 9999, name: 'Ehrenpokal', replayRounds: false, cupTo: 'uefa', trophyImg: 'data:image/png;base64,iVBORw0KGgo=' });
mod.competitions['super:England'] = [{ from: 1960, to: 9999, superFormat: 'legs2', name: 'Schild' }];
mod.competitions['super:Deutschland'] = [{ from: 1960, to: 2009, held: true, name: 'Frühpokal' }, { from: 2010, to: 9999, held: false }];
mod.competitions.uefasuper = [{ from: 1960, to: 9999, name: 'Kontinentalfinale' }];
mod.competitions.weltpokal = [{ from: 1960, to: 9999, name: 'Weltcup der Vereine' }];
mod.competitions['league:ger:1'] = [{ from: 1960, to: 9999, name: 'Oberhaus' }];
mod.competitions['league:eng:1'] = [{ from: 1960, to: 1991, name: 'Old First' }, { from: 1992, to: 9999 }];
mod.competitions['youth:u19'] = [{ from: 1960, to: 9999, name: 'Juniorenmeisterschaft' }];
const errs = checkDataset(mod).filter((x) => x.level === 'error' && x.area === 'Wettbewerbe');
if (errs.length) fail(`Prüfung meldet Fehler: ${errs.map((e) => e.text).join(' ')}`);
const bad = JSON.parse(JSON.stringify(mod));
bad.competitions.cwc = [{ from: 1960, to: 1990 }, { from: 1990, to: 2000 }, { from: 2005, to: 9999 }];
const badErr = checkDataset(bad).filter((x) => x.area === 'Wettbewerbe' && x.level === 'error').map((x) => x.text).join(' | ');
if (!/überschneiden/.test(badErr) || !/Lücke/.test(badErr)) fail(`Prüfung erkennt Überschneidung/Lücke nicht: ${badErr}`);

applyDataset(mod);
if (euroCompName('ec', 1985) !== 'Meistercup' || euroCompName('ec', 1978) !== 'Meistercup' || euroCompName('ec', 1995) !== 'Meisterliga') fail(`Name je Periode: ${euroCompName('ec', 1978)} / ${euroCompName('ec', 1985)} / ${euroCompName('ec', 1995)}`);
const f85 = euroFormat('ec', 1985)!;
const hf = f85.stages.find((s) => s.key === 'hf')!;
if (hf.legs !== 1 || hf.dates.length !== 1 || f85.stages[0].name !== 'Runde der 16') fail('Format: Halbfinale/Rundenname nicht übernommen');
if (euroFormat('ec', 1979)!.stages.find((s) => s.key === 'hf')!.legs !== 1) fail('Format: Werte gelten nach dem Teilen nicht in beiden Teilen');
if (accessSlots(1995, 20).ec !== 3 || accessSlots(1985, 20).ec !== 1) fail(`Startplätze: ${accessSlots(1995, 20).ec}/${accessSlots(1985, 20).ec}`);
if (accessSlots(1980, 1).cupTo !== 'uefa' || cupReplay(1980, false) !== false || cupReplay(1976, true) !== true) fail('Landespokal: Regeln nicht übernommen');
if (cupName(1980) !== 'Ehrenpokal' || leagueName('ger', 1, 1980) !== 'Oberhaus' || leagueName('eng', 1, 1985) !== 'Old First' || leagueName('eng', 1, 1995) !== '1. League') fail('Namen Landespokal/Ligen');
if (superEra('England', 1980)?.format !== 'legs2' || superEra('England', 1980)?.name !== 'Schild' || superEra('Deutschland', 2012) !== null) fail('Supercup: Modus/Name/abgeschafft');
const early = superEra('Deutschland', 1980);
if (!early || early.name !== 'Frühpokal' || early.format !== 'final') fail('Supercup: eingeführter Wettbewerb ohne Standard-Epoche fehlt');
if (uefaSuperName(1990) !== 'Kontinentalfinale' || icName('wp', 1985) !== 'Weltcup der Vereine' || compLabel('u19', 1990) !== 'Juniorenmeisterschaft') fail('Namen Supercup Europa/Weltpokal/Jugend');
// Startplätze im Ablauf: deutsche Starter nach Rang (Qualifikation aus der Tabelle).
const rows = Array.from({ length: 18 }, (_, i) => ({ clubId: `c${i}` }));
const q = germanQualifiersV2({ clubs: Object.fromEntries(rows.map((r) => [r.clubId, {}])), table: { rows } as never, cup: null }, 1995, 20, false);
if (q.ec.length !== 3) fail(`Qualifikation 1995 Rang 20: ${q.ec.length} Meisterliga-Starter statt 3`);

// Neues Spiel 1985: Kalender, Runden und Ligabeschriftung nutzen den Datensatz.
const g = newGame(1985);
const ecCup = g.euroCups?.ec;
if (!ecCup) fail('Neues Spiel 1985 ohne Landesmeister-Wettbewerb');
const r = ecCup!.rounds.find((x) => x.key === 'hf');
if (r?.legs !== 1 || ecCup!.rounds[0].name !== 'Runde der 16') fail(`Neues Spiel: Runden aus dem Datensatz fehlen (hf ${r?.legs}, ${ecCup!.rounds[0].name})`);
if (!g.calendar.events.some((e) => e.type === 'euro_matchday' && e.title.startsWith('Meistercup'))) fail('Neues Spiel: Kalender nennt den neuen Namen nicht');
const json = JSON.stringify(g);
if (!json.includes('Ehrenpokal') && !g.calendar.events.some((e) => /Ehrenpokal/.test(e.title))) console.log('Hinweis: Landespokal-Name erscheint erst mit Wiederholungs-/Siegertexten im Spielstand.');
// Neues Spiel 1995: Startplätze schon beim Spielstart (Starter aus Weltdaten + Startplätze des Rangs).
const g95 = newGame(1995);
const ger95 = (g95.euroCups?.ec?.participantIds ?? []).filter((id) => !!g95.clubs[id] || !!g95.simClubs[id]).length;
applyDataset(null);
const s95 = newGame(1995);
const gerStd = (s95.euroCups?.ec?.participantIds ?? []).filter((id) => !!s95.clubs[id] || !!s95.simClubs[id]).length;
console.log(`Neues Spiel 1995: deutsche Meisterliga-Starter Standard ${gerStd}, mit Datensatz (3 Plätze) ${ger95}.`);
if (ger95 !== 3) fail(`Startplätze: neues Spiel 1995 mit 3 Plätzen hat ${ger95} deutsche Meisterliga-Starter`);
applyDataset(mod);
// Vitrine: Titel mit neuem Namen, Form und eigenem Bild.
addTitleRecord(g, g.managedClubId, 'ec', '1985/86');
addTitleRecord(g, g.managedClubId, 'pokal', '1985/86');
const tro = trophiesOf(g, g.managedClubId);
const tEc = tro.find((t) => t.kind === 'ec'), tCup = tro.find((t) => t.kind === 'pokal');
if (tEc?.title !== 'Meistercup' || tEc.shape !== 'welt') fail(`Vitrine Europapokal: ${tEc?.title} / ${tEc?.shape}`);
if (tCup?.title !== 'Ehrenpokal' || !tCup.img?.startsWith('data:image/png')) fail('Vitrine Landespokal: Name/Bild');

// --- 4. Zurück auf den Standard ------------------------------------------------------
applyDataset(null);
if (euroCompName('ec', 1985) !== 'Pokal der Landesmeister' || cupName(1980) !== 'Landespokal' || euroFormat('ec', 1985)!.stages.find((s) => s.key === 'hf')!.legs !== 2 || accessSlots(1995, 20).ec !== 1) fail('Standard nach dem Zurücksetzen nicht wiederhergestellt');
// Editor: Perioden wieder wie Standard → Eintrag verschwindet aus dem Datensatz.
const t = named(JSON.parse(JSON.stringify(std)), 'tidy');
ensurePeriods(t, def('uefa'));
setValue(t, def('uefa'), 0, 'name', 'X');
setValue(t, def('uefa'), 0, 'name', undefined);
tidy(t, def('uefa'));
if (t.competitions?.uefa) fail('Editor: unveränderter Wettbewerb bleibt im Datensatz stehen');
console.log('Wettbewerbe im Datensatz: Namen, Startplätze, Format, Supercup, Landespokal, Vitrine, Prüfung, Zurücksetzen geprüft.');
