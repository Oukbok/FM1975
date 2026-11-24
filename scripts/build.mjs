// Build-Skript (esbuild). Ersetzt Vite: ein einziges, schnelles Werkzeug.
//   node scripts/build.mjs          -> Produktions-Build nach dist/
//   node scripts/build.mjs --serve  -> Entwicklungsserver mit Auto-Rebuild (http://localhost:5173)
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const serve = process.argv.includes('--serve');
const out = 'dist';

// Versionsnummer (package.json) + Build-Kennung (Git-Kurzhash · Datum) für das Hauptmenü
// (src/engine/appVersion.ts) und dist/version.json (Desktop-Build, Fehlerberichte).
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
let commit = process.env.GITHUB_SHA?.slice(0, 7) ?? '';
if (!commit) { try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* ohne Git */ } }
const buildId = [commit, new Date().toISOString().slice(0, 10)].filter(Boolean).join(' · ');

// Lesbare Schrift auf kleinen Bildschirmen: styles/34-compact-fonts.css aus allen Stylesheets erzeugen.
execFileSync(process.execPath, ['scripts/compact-fonts.mjs'], { stdio: 'inherit' });
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('public', out, { recursive: true });
// Alle Bilder liegen im Ordner images/ (Wunsch Pascal: ein Ort zum Finden und als Referenz);
// im Spiel heißen sie weiter assets/… – deshalb nach dist/assets kopieren.
// Nicht mitkopiert (Wunsch Pascal: Originale bleiben in images/ als Referenz): Bilder, die das Spiel nicht
// (mehr) zeigt bzw. für die es eine verkleinerte Fassung gibt (scripts/optimize-images.mjs). Spart ≈ 7 MB
// im Desktop-/Steam-Paket. Wer eines davon wieder nutzen will: hier austragen.
const NOT_SHIPPED = new Set([
  'images/office-background.png',   // 3,5 MB – früherer Zentrale-Hintergrund, vom Look „Akte“ überdeckt
  'images/stadium-background.jpg',  // früherer Seitenhintergrund, vom Look „Akte“ überdeckt
  'images/stadium-crowd.jpg',       // 1,9 MB – alte Zentrale-Box, nicht mehr im Spiel
  'images/shirt-base.png',          // alte Kader-Box, nicht mehr im Spiel
  'images/menu-bg-3.jpg',           // nirgends verwendet
  'images/start-grandstand.jpg',    // ersetzt durch start-grandstand.webp
  'images/faces-sm/manifest.json',  // nur für scripts/face-thumbs.mjs (welche Quelle hatte die Miniatur)
]);
cpSync('images', `${out}/assets`, { recursive: true, filter: (src) => !NOT_SHIPPED.has(src.replaceAll('\\', '/')) });
writeFileSync(`${out}/version.json`, JSON.stringify({ version, build: buildId }) + '\n');
writeFileSync(`${out}/index.html`, `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>1975 – A Football Manager</title>
    <link rel="stylesheet" href="app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="app.js"></script>
  </body>
</html>
`);

// Datensatz-Editor: eigene Seite unter /editor/. <base href="../"> sorgt dafür,
// dass relative Pfade (assets/…, editor/editor.js) wie im Spiel aufgelöst werden –
// online unter /editor/ ebenso wie später in einer lokalen Windows-Fassung.
mkdirSync(`${out}/editor`, { recursive: true });
writeFileSync(`${out}/editor/index.html`, `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="../" />
    <title>1975 – Datensatz-Editor</title>
    <link rel="stylesheet" href="editor/editor.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="editor/editor.js"></script>
  </body>
</html>
`);

const options = {
  entryPoints: { app: 'src/main.tsx', 'editor/editor': 'src/editor/main.tsx' },
  bundle: true,
  outdir: out,
  // Code-Splitting: Seiten/Fenster, die per import() nachgeladen werden (src/shell/lazyParts.ts),
  // landen als eigene Stücke in dist/chunks/. ES-Module laufen unter http(s) (Cloudflare) und
  // im Electron-Protokoll app:// (desktop/main.cjs), nicht unter file://.
  format: 'esm',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  target: 'es2020',
  jsx: 'automatic',
  // Bilder liegen in images/ und werden im Spiel relativ als "assets/..." referenziert.
  external: ['assets/*'],
  minify: !serve,
  sourcemap: serve,
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"', __APP_VERSION__: JSON.stringify(version), __APP_BUILD__: JSON.stringify(buildId) },
  logLevel: 'info',
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: 5173 });
  console.log(`\n  Spiel laeuft auf http://localhost:${port}\n`);
} else {
  await esbuild.build(options);
}
