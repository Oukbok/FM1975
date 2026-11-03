// Gesichter-Zuordnung ohne UI: stabil je ID, Epoche aus dem Geburtsjahr (nächste
// vorhandene), Altersstufe, Masken, Mitarbeiter, leeres Register = kein Foto.
//   npm run test:faces
import { FACE_FILES, FACE_MASKS } from '../src/data/faceImages';
import { faceImageFor, parseFaceKey } from '../src/components/faces/faceLookup';
import { makeName, ORIGINS, firstNamesFor } from '../src/data/origins';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c) { fails++; console.log('FEHLER: ' + msg); } };

ok(faceImageFor({ id: 'x', face: 'mitteleuropa', birthYear: 1950, age: 25 }) === null || FACE_FILES.length > 0, 'leeres Register liefert kein Foto');
ok(parseFaceKey('mitteleuropa/1970/01-25')?.age === 25, 'Schlüssel mit Alter');
ok(parseFaceKey('mitteleuropa/1965/01') === null, 'ungültige Epoche abgelehnt');

FACE_FILES.splice(0, FACE_FILES.length,
  'mitteleuropa/1970/01-18', 'mitteleuropa/1970/01-25', 'mitteleuropa/1970/01-32', 'mitteleuropa/1970/01-38',
  'mitteleuropa/1970/02-25', 'mitteleuropa/1990/01-25', 'staff/1980/01', 'staff/2010/01');
FACE_MASKS.splice(0, FACE_MASKS.length, 'mitteleuropa/1970/01-25');

const a = faceImageFor({ id: 'fra_p3', face: 'mitteleuropa', birthYear: 1952, age: 26 });
const b = faceImageFor({ id: 'fra_p3', face: 'mitteleuropa', birthYear: 1952, age: 26 });
ok(!!a && a.src === b?.src, 'gleicher Spieler = gleiches Bild');
ok(!!a && a.key.startsWith('mitteleuropa/1970/'), `Jahrgang 1952 → Epoche 1970 (${a?.key})`);
// Altern: dieselbe Person, andere Stufe
const ids = Array.from({ length: 40 }, (_, i) => `p${i}`);
const p1 = ids.find((id) => faceImageFor({ id, face: 'mitteleuropa', birthYear: 1950, age: 25 })?.key.includes('/01-'))!;
ok(faceImageFor({ id: p1, face: 'mitteleuropa', birthYear: 1950, age: 19 })?.key === 'mitteleuropa/1970/01-18', 'Alter 19 → Stufe 18');
ok(faceImageFor({ id: p1, face: 'mitteleuropa', birthYear: 1950, age: 36 })?.key === 'mitteleuropa/1970/01-38', 'Alter 36 → Stufe 38');
ok(!!faceImageFor({ id: p1, face: 'mitteleuropa', birthYear: 1950, age: 25 })?.mask, 'Maske erkannt');
ok(!faceImageFor({ id: p1, face: 'mitteleuropa', birthYear: 1950, age: 32 })?.mask, 'Stufe ohne Maske');
// Person 02 hat nur Stufe 25 → bleibt bei jedem Alter
const p2 = ids.find((id) => faceImageFor({ id, face: 'mitteleuropa', birthYear: 1950, age: 25 })?.key.includes('/02-'))!;
ok(faceImageFor({ id: p2, face: 'mitteleuropa', birthYear: 1950, age: 37 })?.key === 'mitteleuropa/1970/02-25', 'nur eine Stufe');
// Epoche fehlt → nächste vorhandene
ok(faceImageFor({ id: 'q', face: 'mitteleuropa', birthYear: 1958, age: 25 })?.key.startsWith('mitteleuropa/1970/') === true, '1980 fehlt → 1970 (Gleichstand früher)');
ok(faceImageFor({ id: 'q', face: 'mitteleuropa', birthYear: 1985, age: 25 })?.key === 'mitteleuropa/1990/01-25', '2010 fehlt → 1990');
ok(faceImageFor({ id: 'q', face: 'westafrika', birthYear: 1985, age: 25 }) === null, 'Gruppe ohne Bilder → Zeichnung');
ok(faceImageFor({ id: 'c', staff: true, year: 2014 })?.key === 'staff/2010/01', 'Mitarbeiter 2014 → staff/2010');
ok(faceImageFor({ id: 'c', staff: true, year: 1975 })?.key === 'staff/1980/01', 'Mitarbeiter 1975 → nächste Epoche 1980');
// Verteilung: beide Personen kommen vor
const used = new Set(ids.map((id) => faceImageFor({ id, face: 'mitteleuropa', birthYear: 1950, age: 25 })?.key));
ok(used.size === 2, 'Spieler verteilen sich auf alle Personen');

// Namen: Jahrgang wählt die Kohorte, Zufallszahlen-Verbrauch unverändert
let n = 0; const rng = () => { n++; return 0.37; };
makeName(ORIGINS.ger, rng); const plain = n; n = 0; makeName(ORIGINS.ger, rng, 2008);
ok(plain === n, 'gleich viele Zufallszahlen mit/ohne Jahrgang');
ok(firstNamesFor(ORIGINS.ger, 1945).includes('Horst') && !firstNamesFor(ORIGINS.ger, 1945).includes('Finn'), 'Jahrgang 1945: Horst, kein Finn');
ok(firstNamesFor(ORIGINS.ger, 2012).includes('Finn') && !firstNamesFor(ORIGINS.ger, 2012).includes('Horst'), 'Jahrgang 2012: Finn, kein Horst');
ok(firstNamesFor(ORIGINS.ger_ost, 1975).includes('Ronny'), 'DDR-Jahrgang 1975: Ronny');
ok(firstNamesFor(ORIGINS.gha, 1975) === ORIGINS.gha.first, 'Herkunft ohne Kohorten: Grundliste');

console.log(fails ? `${fails} Fehler` : 'Gesichter-/Namen-Test bestanden.');
process.exit(fails ? 1 : 0);
