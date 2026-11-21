// Desktop-Fassung läuft ohne Netz (Steam, Steam Deck im Flugmodus): Die Web-Fassung lädt ihre
// Schriften von Google Fonts (@import in src/styles/00-base.css). Dieser Schritt ersetzt in
// ../dist die @import-Zeilen durch lokale @font-face-Regeln und legt die Schriftdateien nach
// dist/fonts/. Quelle: Fontsource-Pakete (SIL Open Font License, Lizenztexte liegen bei).
// Aufruf nach jedem Spiel-Build (`npm run game`); mehrfaches Ausführen schadet nicht.
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, '..', 'dist');
const OUT = path.join(DIST, 'fonts');
// Nur lateinische Zeichensätze (mit unicode-range, wie bei Google Fonts) – Kyrillisch/Vietnamesisch braucht das Spiel nicht.
const ONLY = /-(latin|latin-ext)-/;
const FONTS = [
  { pkg: '@fontsource/antonio', css: [500, 600, 700].map((w) => `${w}.css`) },
  { pkg: '@fontsource/archivo', css: [400, 500, 600, 700, 800].map((w) => `${w}.css`) },
  // Variable Schrift mit allen Achsen (Laufweite/optische Größe/Stärke), aufrecht + kursiv.
  { pkg: '@fontsource-variable/roboto-serif', css: ['full.css', 'full-italic.css'], family: 'Roboto Serif' },
];

function collect() {
  const rules = [];
  const files = new Map();
  for (const f of FONTS) {
    const dir = path.dirname(require.resolve(`${f.pkg}/package.json`));
    fs.mkdirSync(OUT, { recursive: true });
    fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(OUT, `LICENSE-${path.basename(f.pkg)}.txt`));
    for (const css of f.css) {
      const text = fs.readFileSync(path.join(dir, css), 'utf8');
      for (const m of text.matchAll(/\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
        if (!ONLY.test(m[1])) continue;
        if (!/unicode-range/.test(m[2])) throw new Error(`unicode-range fehlt in ${f.pkg}/${css} (${m[1]})`);
        const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)\s*format\('([^']+)'\)/.exec(m[2]);
        if (!woff2) throw new Error(`Keine woff2-Datei in ${f.pkg}/${css} (${m[1]})`);
        files.set(woff2[1], path.join(dir, 'files', woff2[1]));
        let body = m[2].replace(/src:[^;]+;/, `src: url(__FONTS__/${woff2[1]}) format('${woff2[2]}');`);
        if (f.family) body = body.replace(/font-family:[^;]+;/, `font-family: '${f.family}';`);
        rules.push(`@font-face{${body.replace(/\s+/g, ' ').trim()}}`);
      }
    }
  }
  return { rules, files };
}

function patchCss(file, prefix, rules) {
  if (!fs.existsSync(file)) return false;
  let css = fs.readFileSync(file, 'utf8');
  const before = css;
  css = css.replace(/@import\s*(?:url\()?["']?https:\/\/fonts\.googleapis\.com[^;]*;/g, '');
  if (css === before && css.includes('/*offline-fonts*/')) return true; // schon ersetzt
  if (/fonts\.(googleapis|gstatic)\.com/.test(css)) throw new Error(`${file}: Verweis auf Google Fonts nicht ersetzbar`);
  fs.writeFileSync(file, `/*offline-fonts*/${rules.join('').replaceAll('__FONTS__', prefix)}\n${css}`);
  return true;
}

const { rules, files } = collect();
for (const [name, src] of files) fs.copyFileSync(src, path.join(OUT, name));
const done = [['app.css', 'fonts'], ['editor/editor.css', '../fonts']].filter(([f, p]) => patchCss(path.join(DIST, f), p, rules));
if (!done.length) { console.error('dist/app.css fehlt – erst „npm run build“ im Hauptordner.'); process.exit(1); }
const kb = Math.round([...files.values()].reduce((s, f) => s + fs.statSync(f).size, 0) / 1024);
console.log(`Schriften lokal: ${files.size} Dateien (${kb} kB), ${rules.length} Regeln in ${done.map((d) => d[0]).join(', ')}`);
