// Screenshots Footer-Link „Chronik des deutschen Fußballs“ + Chronik-Popup.
//   npm run build && node tests/chronicle-shots.mjs [ordner]   (SAVE=… für spätere Saisons)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/chronik';
const prefix = process.argv[3] || 'neu';
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
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
} else {
  await startNewGame(page);
}
const shot = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${prefix}_${n}.png` }); };
await page.locator('.dashx-foot-link').hover();
await shot('footer');
if (await page.locator('.tn-sub-item:has-text("Chronik")').count()) errors.push('Chronik steht noch im Menü');
await page.locator('.dashx-foot-link').click();
await page.waitForSelector('.chm-modal');
await shot('popup');
await page.fill('.chm-search', 'Bosman');
await shot('suche');
await page.fill('.chm-search', '');
await page.locator('.chm-dec').last().click();
await shot('sprung');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
if (await page.locator('.chm-modal').count()) errors.push('Escape schließt das Popup nicht');
// Kategorie-Übersicht Statistiken: Box „Chronik“ öffnet das Popup
await page.locator('.hd-nav-item:has-text("Statistiken")').first().click();
await page.waitForTimeout(300);
await page.locator('.dbox:has-text("Chronik")').last().click().catch(() => {});
await page.waitForTimeout(300);
if (!await page.locator('.chm-modal').count()) errors.push('Box „Chronik“ öffnet das Popup nicht');
await browser.close(); server.close();
console.log(errors.length ? errors.join('\n') : 'OK – keine Fehler');
process.exit(errors.length ? 1 : 0);
