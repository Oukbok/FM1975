// Screenshots der Gala-Auslosung mit großem künstlichem Feld (Standard 64 Vereine, 2 Töpfe):
//   SAVE=…/save.txt node tests/draw-big-shots.mjs [ordner]   (N=…, POTS=…, VIEW=1366x768)
// Baut tests/draw-harness/main.tsx mit esbuild, Start, mitten in der Ziehung, Ende.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import * as esbuild from 'esbuild';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/draw-big';
const tmp = 'test-output/draw-harness';
await mkdir(outDir, { recursive: true }); await mkdir(tmp, { recursive: true });
await esbuild.build({ entryPoints: ['tests/draw-harness/main.tsx'], bundle: true, outfile: `${tmp}/main.js`, jsx: 'automatic', loader: { '.png': 'file', '.jpg': 'file', '.svg': 'file', '.woff2': 'file' }, logLevel: 'error', external: ['assets/*'], define: { 'process.env.NODE_ENV': '"production"' } });
await writeFile(`${tmp}/index.html`, '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="main.css"><div id="root"></div><script src="main.js"></script>');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html');
  let body; try { body = await readFile(join(tmp, path)); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
}).listen(0);
const [vw, vh] = (process.env.VIEW ?? '1920x1080').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
let ready = false;
page.on('pageerror', (e) => { if (!ready) return; errors.push(e.message); console.log('JS-Fehler:', e.message); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const base = `http://127.0.0.1:${server.address().port}/`;
await page.goto(base + 'index.html?leer');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); }, await readFile(process.env.SAVE, 'utf8'));
ready = true;
await page.goto(`${base}?n=${process.env.N ?? 64}&pots=${process.env.POTS ?? 2}`);
await page.waitForSelector('.dg-board');
const pre = `${process.env.N ?? 64}_${vw}`;
const shot = async (name) => { await page.screenshot({ path: `${outDir}/${pre}_${name}.png` }); console.log('  ', `${outDir}/${pre}_${name}.png`); };
await page.waitForTimeout(600);
await shot('01_start');
await page.click('.dg-go');
const total = await page.locator('.dg-cell').count();
for (let i = 0; i < total; i++) { await page.click('.dg-go'); await page.waitForTimeout(25); }
await page.waitForTimeout(1500);
await shot('02_mitten');
// Überlauf prüfen: Raster und Liste dürfen nicht aus ihrer Fläche ragen.
const over = await page.evaluate(() => [...document.querySelectorAll('.dg-pool, .dg-lower, .dg-board')].map((el) => [el.className, el.scrollHeight - el.clientHeight]));
console.log('Überlauf (px):', JSON.stringify(over));
for (let i = 0; i < total; i++) { if (await page.locator('.dg-prow').count() && await page.locator('.dg-cell:not(.out)').count() <= 1) break; await page.click('.dg-go'); await page.waitForTimeout(25); }
await page.waitForTimeout(800);
await shot('03_ende_der_ziehung');
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
