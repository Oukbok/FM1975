// Screenshots des Neues-Spiel-Assistenten in zwei Auflösungen (Start in der 1. und 2. Liga).
//   node tests/newgame-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/newgame';
await mkdir(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
const runs = [[1920, 1080, undefined, 0], [1280, 720, '2. Liga Süd', 3]];
for (const [w, h, league, clubIndex] of runs) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url);
  await startNewGame(page, { league, clubIndex, shots: (n) => page.screenshot({ path: `${out}/${w}x${h}_${n}.png` }) });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${w}x${h}_4_spiel.png` });
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
