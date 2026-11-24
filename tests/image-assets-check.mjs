// Prüfung Bilder/Vorladen (ohne Browser, schnell):  npm run test:images
// 1. Jede CSS-Adresse url('assets/…') zeigt auf eine Datei in images/, die auch ausgeliefert wird
//    (nicht in NOT_SHIPPED von scripts/build.mjs).
// 2. Jede Akten-Textur aus styles/31-dossier.css steht in UI_TEXTURES (ui/imagePreload.ts) – sonst wird
//    sie nicht vorgeladen und erscheint verzögert.
// 3. Jede Adresse in UI_TEXTURES existiert; Ziele von scripts/optimize-images.mjs existieren.
// 4. Gesichts-Miniaturen (images/faces-sm, scripts/face-thumbs.mjs): zu jedem Gesicht in images/faces gibt es
//    eine Miniatur, sie stammt von der heutigen Quelle (SHA-1 im Manifest) und keine ist verwaist.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { faceThumbStatus } from '../scripts/face-thumbs.mjs';

const errors = [];
const strip = (u) => u.replace(/[?#].*$/, '');
const toFile = (u) => join('images', strip(u).replace(/^assets\//, ''));

const build = readFileSync('scripts/build.mjs', 'utf8');
const notShipped = new Set([...build.matchAll(/'(images\/[^']+)'/g)].map((m) => m[1]));

const cssUrls = new Map();
for (const f of readdirSync('src/styles').filter((x) => x.endsWith('.css') && !x.startsWith('34-'))) {
  const css = readFileSync(join('src/styles', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/url\(\s*['"]?(assets\/[^'")\s]+)['"]?\s*\)/g)) cssUrls.set(m[1], f);
}
for (const [u, f] of cssUrls) {
  const file = toFile(u);
  if (!existsSync(file)) errors.push(`${f}: ${u} – Datei ${file} fehlt`);
  else if (notShipped.has(file)) errors.push(`${f}: ${u} – steht in NOT_SHIPPED (scripts/build.mjs), wird nicht ausgeliefert`);
}

const pre = readFileSync('src/ui/imagePreload.ts', 'utf8');
const list = pre.slice(pre.indexOf('UI_TEXTURES'), pre.indexOf('];', pre.indexOf('UI_TEXTURES')));
const textures = new Set([...list.matchAll(/'(assets\/[^']+)'/g)].map((m) => m[1]));
for (const t of textures) if (!existsSync(toFile(t))) errors.push(`UI_TEXTURES: ${t} – Datei fehlt`);
for (const [u, f] of cssUrls) {
  if (f === '31-dossier.css' && !textures.has(u)) errors.push(`31-dossier.css: ${u} fehlt in UI_TEXTURES (src/ui/imagePreload.ts)`);
}

const opt = readFileSync('scripts/optimize-images.mjs', 'utf8');
for (const m of opt.matchAll(/out: '([^']+)'/g)) if (!existsSync(m[1])) errors.push(`optimize-images: ${m[1]} fehlt – node scripts/optimize-images.mjs`);

const thumbs = await faceThumbStatus();
for (const r of thumbs.missing) errors.push(`faces-sm: Miniatur zu images/faces/${r} fehlt – node scripts/face-thumbs.mjs`);
for (const r of thumbs.stale) errors.push(`faces-sm: Miniatur zu images/faces/${r} veraltet (Quelle geändert) – node scripts/face-thumbs.mjs`);
for (const r of thumbs.orphans) errors.push(`faces-sm: ${r} ohne Quelle in images/faces – node scripts/face-thumbs.mjs`);
if (notShipped.has('images/faces-sm') || notShipped.has('images/faces')) errors.push('faces/faces-sm dürfen nicht in NOT_SHIPPED stehen');

console.log(`Gesichter ${thumbs.srcs.length}, Miniaturen aktuell ${thumbs.srcs.length - thumbs.missing.length - thumbs.stale.length}`);
console.log(`CSS-Bilder ${cssUrls.size}, vorgeladene Texturen ${textures.size}, nicht ausgeliefert ${notShipped.size}`);
if (errors.length) { console.log(errors.map((e) => '  FEHLER ' + e).join('\n')); process.exit(1); }
console.log('OK');
