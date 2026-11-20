// Ethnie & Name (Wunsch Pascal) ohne UI: Anteil abweichender Ethnien je Land und
// Jahrzehnt steigt plausibel, Nachname passt zur Ethnie, ohne Abweichung gleicher
// Name wie bisher, Zufallsfolge unverändert, Migration einer Vorlage ändert keine
// Namen und ist idempotent, Ethnie aus dem Datensatz (Spielerbilder & Fotos).
//   npm run test:ethnicity
import { readFileSync } from 'node:fs';
import { decompressFromUTF16 } from 'lz-string';
import type { Game } from '../src/game/state';
import { builtinDataset } from '../src/data/dataset/builtin';
import { applyDataset } from '../src/data/dataset/apply';
import { ORIGINS, makeName, faceFor } from '../src/data/origins';
import { heritageName, isLocalFace, lastNameGroups, nameAndFace } from '../src/data/ethnicity';
import { createPlayer } from '../src/engine/playerFactory';
import { generateYouthPlayer } from '../src/engine/youth';
import { faceForName, migrateFaceNames } from '../src/game/faceNameMigration';
import { setPortraitGame, shownFace } from '../src/game/playerPortraits';
import { mulberry32, hashStr } from '../src/engine/leagues';

let fails = 0;
const ok = (c: unknown, msg: string) => { if (!c) { fails++; console.log('FEHLER: ' + msg); } };
applyDataset(null);

// 1) Anteil abweichender Ethnien je Land und Jahrzehnt (erzeugte 20-Jährige).
const COUNTRIES = ['fra', 'eng', 'ned', 'bel', 'sui', 'swe', 'por', 'esp', 'ita', 'ger_modern', 'aut', 'den', 'pol', 'rus'];
const YEARS = [1975, 1985, 1995, 2005, 2015, 2025];
const N = 500;
const examples: string[] = [];
console.log('Anteil abweichender Ethnie je Land und Jahr (in Klammern: davon mit Namen aus anderer Herkunft):');
console.log('           ' + YEARS.map((y) => String(y).padStart(11)).join(''));
for (const cc of COUNTRIES) {
  const o = ORIGINS[cc];
  const shares: number[] = [];
  const named: number[] = [];
  for (const y of YEARS) {
    let dev = 0, div = 0, shown = 0;
    for (let i = 0; i < N; i++) {
      const id = `eth_${cc}_${y}_${i}`;
      const p = createPlayer({ id, clubId: 'x', pos: 'ZM', age: 20, strength: 60, year: y, date: `${y}-07-01`, rng: mulberry32(hashStr(id)), origin: o });
      ok(p.nationality === o.nationality, `${id}: Nationalität ${p.nationality} statt ${o.nationality}`);
      if (p.face !== o.face) div++;
      if (!isLocalFace(o, p.face)) {
        dev++;
        const groups = lastNameGroups(p.lastName);
        ok(groups.has(p.face as never), `${id}: Nachname ${p.lastName} passt nicht zu ${p.face}`);
        ok(faceForName(p.lastName, p.nationality, p.face) === null, `${id}: Migration würde ${p.fullName} (${p.face}) umstellen`);
        if (shown < 2 && (y === 1985 || y === 2005 || y === 2025)) { shown++; examples.push(`${cc} ${y}: ${p.fullName} (${p.face})`); }
      } else if (p.face !== o.face && shown < 1 && y === 2025) { shown++; examples.push(`${cc} ${y}: ${p.fullName} (${p.face}, einheimisch)`); }
    }
    shares.push(div / N); named.push(dev / N);
  }
  console.log(cc.padEnd(11) + shares.map((s, i) => `${(s * 100).toFixed(0)}% (${(named[i] * 100).toFixed(0)})`.padStart(11)).join(''));
  // Plausibel steigend (Stichprobenrauschen erlaubt) und am Ende über dem Anfang.
  for (let i = 1; i < shares.length; i++) ok(shares[i] >= shares[i - 1] - 0.04, `${cc}: Anteil fällt ${YEARS[i - 1]} → ${YEARS[i]} (${shares[i - 1]} → ${shares[i]})`);
  if (cc !== 'pol' && cc !== 'rus') ok(shares[shares.length - 1] > shares[0] + 0.05, `${cc}: Anteil steigt nicht über die Jahrzehnte`);
  if (cc === 'pol' || cc === 'rus') ok(shares[0] === 0 && shares[1] === 0, `${cc}: vor 1990 abweichende Ethnie`);
}
console.log('\nBeispiele:\n  ' + examples.join('\n  '));

// 2) Ohne abweichende Ethnie: Name identisch mit makeName, Zufallsfolge gleich.
for (const cc of ['ger', 'eng', 'fra', 'bra']) {
  const o = ORIGINS[cc];
  for (let i = 0; i < 300; i++) {
    const id = `same_${cc}_${i}`;
    const r1 = mulberry32(hashStr(id)); const r2 = mulberry32(hashStr(id));
    const a = nameAndFace(o, r1, 1990, id);
    const b = makeName(o, r2, 1990);
    ok(r1() === r2(), `${id}: Zufallsfolge verschoben`);
    ok(a.face === faceFor(o, 1990, id), `${id}: Ethnie anders als faceFor`);
    if (isLocalFace(o, a.face)) ok(a.firstName === b.firstName && a.lastName === b.lastName, `${id}: Name geändert ohne abweichende Ethnie`);
    else ok(!!heritageName(o, a.face, 1990, id), `${id}: kein Herkunftsname`);
  }
}
ok(ORIGINS.ger.faceMix == null, 'ger ohne Ethnie-Mischung (Vielfalt über die Herkünfte)');

// Jugend: abweichende Ethnie bekommt passenden Namen.
let youthDev = 0;
for (let i = 0; i < 400; i++) {
  const y = generateYouthPlayer('fra', `t${i}`, '2024-07-01', 3, 17);
  const o = ORIGINS[y.origin!];
  if (o && !isLocalFace(o, y.face)) { youthDev++; ok(lastNameGroups(y.lastName).has(y.face as never), `Jugend ${y.fullName}: Name passt nicht zu ${y.face}`); }
}
console.log(`\nJugend 2024 (Deutschland): ${youthDev} von 400 mit abweichender Ethnie und passendem Namen`);

// 3) Einzelfälle der Migration.
ok(faceForName('Schneider', 'GER', 'westafrika') === 'mitteleuropa', '„Schneider“ (GER, westafrika) → mitteleuropa');
// Karibische Familien in England tragen englische Nachnamen (eng_car) → bleibt.
ok(faceForName('Smith', 'ENG', 'westafrika') === null, '„Smith“ (ENG, westafrika) karibische Familie → bleibt');
ok(faceForName('Mensah', 'GER', 'mitteleuropa') === 'westafrika', '„Mensah“ (GER) → westafrika');
ok(faceForName('Yilmaz', 'SUI', 'mitteleuropa') === 'tuerkei', '„Yilmaz“ (SUI) → tuerkei');
ok(faceForName('Kowalski', 'GER', 'mitteleuropa') === 'osteuropa', '„Kowalski“ (GER) → osteuropa');
ok(faceForName('Nowak', 'GER', 'mitteleuropa') === null, '„Nowak“ (GER) mehrdeutig → bleibt');
ok(faceForName('da Silva', 'BRA', 'westafrika') === null, '„da Silva“ (BRA, westafrika) einheimisch → bleibt');
ok(faceForName('Mensah', 'GER', 'westafrika') === null, 'passt schon → bleibt');
ok(faceForName('Unbekanntname', 'GER', 'westafrika') === null, 'unbekannter Name → bleibt');

// 4) Migration einer Vorlage: Namen unverändert, idempotent.
const load = (path: string): Game => {
  const txt = readFileSync(path, 'utf8');
  return (JSON.parse(txt.startsWith('LZ1:') ? decompressFromUTF16(txt.slice(4))! : txt) as { game: Game }).game;
};
for (const file of ['public/saves/test-20-jahre.txt', 'public/saves/england-1992.txt']) {
  const g = load(file);
  delete g.faceNameV;
  const names = () => JSON.stringify([Object.values(g.players).map((p) => p.fullName), Object.values(g.youthPlayers ?? {}).map((p) => p.fullName), (g.worldPool?.p ?? []).map((w) => `${w[2]} ${w[3]}`)]);
  const faces = () => JSON.stringify([Object.values(g.players).map((p) => p.face), (g.worldPool?.p ?? []).map((w) => w[5])]);
  const before = names();
  const total = Object.keys(g.players).length + Object.keys(g.youthPlayers ?? {}).length + (g.worldPool?.p.length ?? 0);
  const n = migrateFaceNames(g);
  ok(names() === before, `${file}: Namen geändert`);
  ok(g.faceNameV === 1, `${file}: Markierung fehlt`);
  const f1 = faces();
  ok(migrateFaceNames(g) === 0 && faces() === f1, `${file}: zweiter Lauf ändert etwas`);
  delete g.faceNameV;
  ok(migrateFaceNames(g) === 0 && faces() === f1, `${file}: nicht idempotent (zweiter Lauf ohne Markierung)`);
  console.log(`Migration ${file}: ${n} von ${total} Spielern umgestellt`);
  // Neu erzeugte Vorlagen haben schon passende Gesichter (0 umgestellt) – nur zu viele wären falsch.
  ok(n < total * 0.2, `${file}: unplausible Zahl umgestellter Spieler (${n})`);
}

// 5) Ethnie aus dem Datensatz überschreibt das Gesicht.
{
  const g = load('public/saves/test-20-jahre.txt');
  const p = Object.values(g.players).find((x) => x.face === 'mitteleuropa' && Object.values(g.players).filter((y) => y.fullName === x.fullName).length === 1)!;
  const ds = builtinDataset();
  ds.playerPhotos = [{ id: 'foto1', name: p.fullName, photos: [], face: 'ostasien' }];
  applyDataset(ds);
  setPortraitGame(g);
  ok(shownFace(p) === 'ostasien', `Ethnie aus dem Datensatz greift nicht (${shownFace(p)})`);
  ok(p.face === 'mitteleuropa', 'Spielstand darf nicht verändert werden');
  ds.playerPhotos = [{ id: 'foto1', name: p.fullName, photos: [], face: 'kein' }];
  applyDataset(ds);
  ok(shownFace(p) === 'mitteleuropa', 'ungültige Ethnie wird nicht verworfen');
  setPortraitGame(null);
  applyDataset(null);
}

if (fails) { console.log(`\n${fails} Fehler`); process.exit(1); }
console.log('\nEthnie-Test ok');
