// Screenshots Finanzen › Werbung (Werbung 2.0): ohne Werbung, Regler gesetzt, Box „Wirkung der Werbung“.
//   node tests/marketing-shots.mjs [ausgabeordner] [kürzel]   (SAVE=… lädt einen Spielstand)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/marketing';
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
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const close = page.locator('.modal button:has-text("Los geht")');
  if (await close.count()) await close.first().click().catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
} else { await startNewGame(page); await page.waitForTimeout(800); }
await page.locator('.hd-nav-item:has-text("Finanzen")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Werbung"), .tn-sub-item:has-text("Marketing")').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_1_start.png` });
const box0 = await page.locator('.dbox:has-text("Wirkung der Werbung")').boundingBox();
const sliders = page.locator('.dmkt-ctrl input[type=range]');
for (let i = 0; i < await sliders.count(); i++) {
  const max = Number(await sliders.nth(i).getAttribute('max'));
  await sliders.nth(i).fill(String(Math.ceil(max / 2)));
}
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_2_regler.png` });
const box1 = await page.locator('.dbox:has-text("Wirkung der Werbung")').boundingBox();
if (!box0 || !box1 || Math.abs(box0.height - box1.height) > 1 || Math.abs(box0.width - box1.width) > 1) errors.push('Box „Wirkung der Werbung“ ändert ihre Größe');
if (await page.locator('.dmkt-fx-row:not(.sum)').count() !== 6) errors.push('Sechs Werbeziele erwartet');
if (!await page.locator('.dmkt-goals i').count()) errors.push('Kanäle ohne Werbeziele');
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
