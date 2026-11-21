// Lesbare Schrift auf kleinen Bildschirmen (Steam Deck 1280×800, 1366×768; Wunsch Pascal):
// erzeugt src/styles/34-compact-fonts.css aus allen Stylesheets in src/styles/index.ts.
//
// Unter einem effektiven Maßstab von 0,7 (Bildschirm-Pixel je CSS-Pixel) setzt der Spielrahmen
// `data-fs="lift"` (ui/DisplayFrame.tsx). Jede `font-size`-Angabe des Spiels wird dafür einmal
// gespiegelt: `[data-fs] <selektor>` mit derselben Reihenfolge und genau einem Attribut mehr an
// Spezifität – damit gewinnt unter den gespiegelten Regeln dieselbe wie im Original, nur mit
// angehobener Größe (`lift`). Werte in var()/calc()/em bleiben, wie sie sind (sie stehen
// trotzdem in der Datei, damit die Kaskade stimmt). 1920×1080 und größer sind nicht betroffen.
//
//   node scripts/compact-fonts.mjs          (läuft auch in scripts/build.mjs)
//   node scripts/compact-fonts.mjs --check  (Exit 1, wenn die Datei veraltet ist)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIR = 'src/styles';
const OUT_NAME = '34-compact-fonts.css';
const ATTR = '[data-fs]';
/** Haupttext ≥ 17,6 CSS-px = 11 px auf dem Bildschirm bei 0,625. */
const MAIN = 17.6;
/** Nicht anheben: dichte Raster mit fest berechneter Zeilenhöhe (Fähigkeiten im Spielerprofil,
 *  `--sk-lh` passt die Zeilen in die feste Box) – größer überlappen die Zeilen. */
const NO_LIFT = /\.pp2-s(row|val)\b|\.pp-attr-lbl\b/;

/** Neue Größe in CSS-px: Text ab 12 px auf die Lesegrenze, kleinere Nebentexte (Etiketten,
 *  Fußnoten, Achsen) um 4 px größer, aber unter der Grenze. */
export function lift(px) {
  if (px >= MAIN) return px;
  if (px >= 12) return MAIN;
  return Math.round(Math.min(MAIN, px + 4) * 10) / 10;
}

const order = [...readFileSync(`${DIR}/index.ts`, 'utf8').matchAll(/import '\.\/([^']+\.css)'/g)].map((m) => m[1]).filter((f) => f !== OUT_NAME);

/** Kommentare entfernen, Zeichenketten bleiben stehen. */
function stripComments(s) {
  let out = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < s.length && s[j] !== c) j += s[j] === '\\' ? 2 : 1; out += s.slice(i, j + 1); i = j + 1; continue; }
    out += c; i++;
  }
  return out;
}

/** Blöcke lesen: [{ prelude, body }] bzw. Deklarationen; verschachtelte At-Regeln rekursiv. */
function parseBlocks(s) {
  const items = [];
  let i = 0;
  while (i < s.length) {
    const open = s.indexOf('{', i);
    if (open < 0) break;
    const semi = s.indexOf(';', i);
    if (semi >= 0 && semi < open && s.slice(i, semi).trim().startsWith('@')) { i = semi + 1; continue; } // @import …;
    let depth = 1, j = open + 1;
    while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
    items.push({ prelude: s.slice(i, open).trim(), body: s.slice(open + 1, j - 1) });
    i = j;
  }
  return items;
}

/** Kommas auf oberster Ebene (nicht in Klammern). */
function splitTop(sel) {
  const parts = []; let depth = 0, cur = '';
  for (const c of sel) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ',' && !depth) { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function mirrorSelector(sel) {
  return splitTop(sel).map((p) => {
    const root = p.match(/^(?:html|body|:root)(?:[.#:[][^\s>+~]*)?\s*(?:>\s*)?/);
    if (root) { const rest = p.slice(root[0].length).trim(); return rest ? `${ATTR} ${rest}` : ATTR; } // Grundgröße → Spielrahmen
    if (p.includes('[data-ui')) return p.replace('[data-ui', `${ATTR}[data-ui`); // gleiches Element (Spielrahmen)
    return `${ATTR} ${p}`;
  }).join(',\n');
}

function liftValue(v) {
  return v.replace(/(^|[\s/])(\d+(?:\.\d+)?)px\b/, (m, pre, n) => `${pre}${lift(Number(n))}px`);
}

/** font-size aus einer Deklarationsliste (auch aus der Kurzform `font:`). */
function fontSizes(body) {
  const out = [];
  for (const d of body.split(';')) {
    const k = d.indexOf(':');
    if (k < 0) continue;
    const prop = d.slice(0, k).trim().toLowerCase();
    let val = d.slice(k + 1).trim();
    const imp = /!important\s*$/.test(val) ? ' !important' : '';
    val = val.replace(/!important\s*$/, '').trim();
    // Schriftgrößen in eigenen Variablen (--rl-fs, --btn-font, --font-size-base …)
    if (/^--[\w-]*(-fs|font-size|-font)$/.test(prop) && /^\d+(\.\d+)?px$/.test(val)) out.push(`${prop}: ${liftValue(val)}${imp}`);
    else if (prop === 'font-size') out.push(`font-size: ${/^\d+(\.\d+)?px$/.test(val) ? liftValue(val) : val}${imp}`);
    else if (prop === 'font') {
      const m = val.match(/(?:^|\s)(\d+(?:\.\d+)?px)(?:\/[^\s]+)?\s/);
      if (m) out.push(`font-size: ${lift(parseFloat(m[1]))}px${imp}`);
    }
  }
  return out;
}

function walk(css, indent = '') {
  let out = '';
  for (const { prelude, body } of parseBlocks(css)) {
    if (prelude.startsWith('@')) {
      if (/^@(media|supports|container|layer)\b/.test(prelude)) {
        const inner = walk(body, indent + '  ');
        if (inner) out += `${indent}${prelude} {\n${inner}${indent}}\n`;
      }
      continue; // @keyframes, @font-face, @property …
    }
    const decl = fontSizes(body);
    // Regeln mit [data-fs] (33-compact.css) gelten schon nur für angehobene Schrift – nicht spiegeln.
    if (!decl.length || !prelude || prelude.includes('[data-fs') || NO_LIFT.test(prelude)) continue;
    out += `${indent}${mirrorSelector(prelude).split('\n').join('\n' + indent)} { ${decl.join('; ')}; }\n`;
  }
  return out;
}

let gen = `/* ERZEUGT von scripts/compact-fonts.mjs – nicht von Hand ändern.\n   Kleine Bildschirme (Maßstab < 0,7, Spielrahmen data-fs="lift"): Schrift ab 12 CSS-px auf ${MAIN} px\n   (= 11 px bei 0,625), kleinere Nebentexte +4 px. Reihenfolge und Spezifität wie im Original + [data-fs]. */\n`;
let n = 0;
for (const f of order) {
  const css = stripComments(readFileSync(`${DIR}/${f}`, 'utf8')).replace(/@(import|charset|namespace)\s+(url\([^)]*\)|'[^']*'|"[^"]*")[^;]*;/g, '');
  const part = walk(css);
  if (part) { gen += `\n/* ${f} */\n${part}`; n += part.split('\n').filter((l) => l.includes('font-size')).length; }
}

const path = `${DIR}/${OUT_NAME}`;
const old = existsSync(path) ? readFileSync(path, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (old !== gen) { console.error(`${path} ist veraltet – node scripts/compact-fonts.mjs`); process.exit(1); }
} else if (old !== gen) {
  writeFileSync(path, gen);
  console.log(`${path}: ${n} Regeln`);
}
