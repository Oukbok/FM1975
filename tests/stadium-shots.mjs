// Screenshots der Stadionseite: Übersicht, Bau-Popover am Block mit Vorschau,
// Kartenverkauf, Umfeld-Popover (Würstchenbuden), Filter „Tribünen“.
//   node tests/stadium-shots.mjs [ausgabeordner] [kürzel]   (SAVE=… lädt einen Spielstand)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/stadium';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
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
const tag = process.argv[3] || (process.env.SAVE ? 'late' : 'new');
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const close = page.locator('.modal button:has-text("Los geht")');
  if (await close.count()) await close.first().click().catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
} else { await startNewGame(page); await page.waitForTimeout(800); }
await page.locator('.hd-nav-item:has-text("Verein")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Stadion")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/${tag}_1_uebersicht.png` });
// Haupttribüne Mitte anklicken (vorne, Mitte)
const block = (id) => page.locator(`.gr-svg g.gr-obj:not(.sv-venue)`).nth(id);
const n = await page.locator('.gr-svg g.gr-obj:not(.sv-venue)').count();
await block(n - 1).click({ force: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_2_block.png` });
const add = page.locator('.sv-pop button:has-text("Rang aufstocken")');
if (await add.isVisible() && await add.isEnabled()) await add.click();
const roof = page.locator('.sv-pop .sv-seg button:has-text("volles Dach")');
if (await roof.count()) await roof.first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_3_planung.png` });
await page.locator('.sv-pop .sv-x').first().click();
// Kartenverkauf (eigene Seite, Verein › Kartenverkauf) und zurück
await page.locator('.sv-bar button:has-text("Kartenverkauf")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_4_tickets.png` });
await page.locator('.tn-sub-item:has-text("Stadion")').click();
await page.waitForTimeout(400);
// Gastronomie-Filter + Würstchenbuden
await page.locator('.sv-modes button:has-text("Gastronomie")').click();
await page.waitForTimeout(200);
await page.locator('.gr-svg g[data-venue=catering]').click({ force: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_5_buden.png` });
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
