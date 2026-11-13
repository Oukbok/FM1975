// Screenshots Positionsvertrautheit: Spielerprofil › Attribute (Feld mit allen Positionen,
// Positionswahl, Vertrautheitsbalken, Positionstraining) und Spieltag › Taktik (Einsatz-Regler).
//   npm run build && node tests/positions-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/positions';
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
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.addInitScript(() => {
  let a = 1975;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
};

await startNewGame(page);
await nav('Aufstellung', 'Taktik'); await shot('01_taktik');

for (const [row, tag] of [[0, 'tw'], [9, 'b'], [16, 'c']]) {
  await nav('Kader', 'Übersicht');
  await page.locator('.dtable tbody tr.clickable').nth(row).click();
  await page.waitForSelector('.pp-modal');
  await page.waitForTimeout(250);
  await shot(`02_attr_${tag}`);
  const chips = page.locator('.pp2-spot');
  if (await chips.count() > 3) { await chips.nth(3).click(); await page.waitForTimeout(150); await shot(`03_attr_${tag}_andere`); }
  const train = page.locator('.psk-train');
  if (tag === 'b' && await train.count()) { await train.click(); await page.waitForTimeout(150); await shot(`04_attr_${tag}_training`); }
  await page.locator('.pp-modal .pp2-close').click();
  await page.waitForTimeout(250);
}

console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
