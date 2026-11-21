// =============================================================================
// Gesichtsbilder einlesen und das Register src/data/faceImages.ts neu schreiben.
//
//   node scripts/faces-register.mjs            (prüfen + schreiben)
//   node scripts/faces-register.mjs --check    (nur prüfen, nichts schreiben)
//   FACES_DIR=… node scripts/faces-register.mjs (anderer Bildordner, z. B. für Tests)
//
// Erwartet: images/faces/<ordner>/<epoche>/<nr>[-<alter>].webp
//   + optional <nr>[-<alter>]-maske.webp (Trikotfläche, nur Alpha zählt)
// <ordner> = englischer Ordner der Gesichtsgruppe (src/data/faceDirs.json, z. B.
// central-europe = mitteleuropa); im Register steht die Gruppen-ID wie im Spielstand.
// Anleitung: docs/images/BILDER.md, Abschnitt 2.
// =============================================================================
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.env.FACES_DIR ?? 'images/faces';
const OUT = process.env.FACES_OUT ?? 'src/data/faceImages.ts';
const CHECK = process.argv.includes('--check');

const GROUPS = ['mitteleuropa', 'nordeuropa', 'suedeuropa', 'osteuropa', 'balkan', 'tuerkei', 'westafrika', 'lateinamerika', 'ostasien', 'nordafrika'];
// Ordner (englisch) → Gruppen-ID: eine Quelle mit dem Spiel (src/data/faceDirs.json).
const FACE_DIRS = JSON.parse(readFileSync(new URL('../src/data/faceDirs.json', import.meta.url), 'utf8'));
const GROUP_OF_DIR = Object.fromEntries(Object.entries(FACE_DIRS).map(([id, dir]) => [dir, id]));
const EPOCHS = [1970, 1980, 1990, 2000, 2010, 2020];
const AGES = { player: [18, 25, 32, 38], staff: [35, 45, 55, 65] };

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = [];
const masks = [];
const problems = [];
const ignored = new Set(['README.md', '.gitkeep', '.DS_Store', 'Thumbs.db']);

for (const abs of walk(ROOT)) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  const base = rel.split('/').pop();
  if (ignored.has(base)) continue;
  const dir = rel.split('/')[0];
  if (rel.includes('/') && !GROUP_OF_DIR[dir]) { problems.push(`${rel}: unbekannter Ordner „${dir}“ (erlaubt: ${Object.values(FACE_DIRS).join(', ')})`); continue; }
  if (!rel.toLowerCase().endsWith('.webp')) { problems.push(`${rel}: kein WebP – bitte als .webp speichern (z. B. mit squoosh.app).`); continue; }
  // Schlüssel mit Gruppen-ID statt Ordnername (Register/Spielstand unverändert).
  let key = (rel.includes('/') ? GROUP_OF_DIR[dir] + rel.slice(dir.length) : rel).slice(0, -5);
  const isMask = key.endsWith('-maske');
  if (isMask) key = key.slice(0, -6);
  const m = key.match(/^([a-z_]+)\/(\d{4})\/(\d{1,4})(?:-(\d{2}))?$/);
  if (!m) { problems.push(`${rel}: Name passt nicht zu <ordner>/<epoche>/<nr>[-<alter>].webp`); continue; }
  const [, group, epoch, , age] = m;
  const isStaff = group === 'staff';
  if (!isStaff && !GROUPS.includes(group)) { problems.push(`${rel}: unbekannte Gruppe „${group}“ (erlaubt: ${GROUPS.join(', ')}, staff)`); continue; }
  if (!EPOCHS.includes(Number(epoch))) { problems.push(`${rel}: Epoche ${epoch} nicht erlaubt (${EPOCHS.join(', ')})`); continue; }
  if (age && !AGES[isStaff ? 'staff' : 'player'].includes(Number(age))) {
    problems.push(`${rel}: Altersstufe ${age} nicht erlaubt (${AGES[isStaff ? 'staff' : 'player'].join(', ')})`); continue;
  }
  const size = statSync(abs).size;
  if (size > 400_000) problems.push(`${rel}: ${Math.round(size / 1024)} KB – bitte unter 150 KB (WebP-Qualität ~80).`);
  (isMask ? masks : files).push(key);
}

for (const k of masks) if (!files.includes(k)) problems.push(`${k}-maske.webp: Maske ohne Bild ${k}.webp`);

const byNum = (a, b) => a.localeCompare(b, undefined, { numeric: true });
files.sort(byNum);
const realMasks = masks.filter((k) => files.includes(k)).sort(byNum);

// Übersicht Gruppe × Epoche (Personen = verschiedene Nummern)
const table = {};
for (const k of files) {
  const [g, e, n] = k.split('/');
  ((table[g] ??= {})[e] ??= new Set()).add(n.split('-')[0]);
}
console.log(`Gesichtsbilder in ${ROOT}: ${files.length} Bilder, ${realMasks.length} Trikot-Masken`);
for (const g of [...GROUPS, 'staff']) {
  if (!table[g]) continue;
  console.log(`  ${g.padEnd(14)} ${EPOCHS.map((e) => `${e}: ${String(table[g][e]?.size ?? 0).padStart(3)}`).join('  ')}`);
}
// Gesichtet? (docs/images/faces-gesichtet.txt – jedes Bild einmal angesehen und seiner Ethnie zugeordnet)
const REVIEW = process.env.FACES_REVIEW ?? 'docs/images/faces-gesichtet.txt';
if (existsSync(REVIEW)) {
  const seen = new Set(readFileSync(REVIEW, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
  const fresh = files.filter((k) => !seen.has(k) && !k.startsWith('staff/'));
  if (fresh.length) {
    console.log(`\n${fresh.length} Bild(er) noch nicht gesichtet – Ethnie prüfen (python3 scripts/faces-sheet.py), dann in ${REVIEW} eintragen:`);
    for (const k of fresh.slice(0, 40)) console.log('  · ' + k);
    if (fresh.length > 40) console.log(`  … und ${fresh.length - 40} weitere`);
  }
}
if (problems.length) {
  console.log(`\n${problems.length} Hinweis(e):`);
  for (const p of problems) console.log('  - ' + p);
}

if (CHECK) process.exit(problems.length ? 1 : 0);

const src = readFileSync(OUT, 'utf8');
const head = src.slice(0, src.indexOf('export const FACE_FILES'));
const list = (a) => a.map((k) => `  '${k}',`).join('\n') + (a.length ? '\n' : '');
writeFileSync(OUT, `${head}export const FACE_FILES: string[] = [\n${list(files)}];\n\nexport const FACE_MASKS: string[] = [\n${list(realMasks)}];\n`);
console.log(`\nRegister geschrieben: ${OUT}`);
