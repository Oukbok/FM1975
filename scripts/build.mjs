// Build-Skript (esbuild). Ersetzt Vite: ein einziges, schnelles Werkzeug.
//   node scripts/build.mjs          -> Produktions-Build nach dist/
//   node scripts/build.mjs --serve  -> Entwicklungsserver mit Auto-Rebuild (http://localhost:5173)
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const out = 'dist';

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('public', out, { recursive: true });
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
    <script src="app.js"></script>
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
    <script src="editor/editor.js"></script>
  </body>
</html>
`);

const options = {
  entryPoints: { app: 'src/main.tsx', 'editor/editor': 'src/editor/main.tsx' },
  bundle: true,
  outdir: out,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  // Bilder liegen in public/assets und werden relativ referenziert ("assets/...").
  external: ['assets/*'],
  minify: !serve,
  sourcemap: serve,
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"' },
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
