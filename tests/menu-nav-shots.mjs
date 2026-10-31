// Screenshots der Kopfzeile (Ober- + Untermenü) für jede Hauptkategorie und
// Messung der Unterpunkt-Positionen: die Plätze sollen beim Wechsel der
// Hauptkategorie gleich bleiben.  node tests/menu-nav-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/menu-nav';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await startNewGame(page);
await page.waitForTimeout(600);
const mains = await page.locator('.hd-nav-item').count();
const rows = [];
for (let m = 0; m < mains; m++) {
  await page.locator('.hd-nav-item').nth(m).click();
  await page.waitForTimeout(300);
  const boxes = await page.locator('.tn-sub-item').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.width)]; }));
  rows.push(boxes);
  const nav = await page.locator('.tn-sub').boundingBox();
  await page.screenshot({ path: `${outDir}/nav_${m}.png`, clip: { x: 0, y: 0, width: 1920, height: Math.ceil(nav.y + nav.height + 20) } });
}
for (const r of rows) console.log(r.map(([x, w]) => `${x}+${w}`).join('  '));
const firstX = new Set(rows.map((r) => r[0][0]));
const gaps = new Set(rows.flatMap((r) => r.slice(1).map((b, i) => b[0] - r[i][0])));
console.log(`Erster Unterpunkt x: ${[...firstX].join(', ')} | Schrittweiten: ${[...gaps].join(', ')}`);
console.log(errors.length ? 'JS-Fehler: ' + errors.join('; ') : 'Keine JS-Fehler.');
await browser.close(); server.close();
