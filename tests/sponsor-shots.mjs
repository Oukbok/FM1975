// Screenshots Sponsoring 2.0 (Finanzen › Sponsoring, Verhandlung, Marketing) zu Spielbeginn 1975
// oder aus einem späteren Spielstand.
//   npm run build && node tests/sponsor-shots.mjs [ausgabeordner] [präfix]
//   Später: HUMAN=1 DUMP=test-output/sponsor/s1995.txt node scripts/sim.mjs 20
//           SAVE=test-output/sponsor/s1995.txt node tests/sponsor-shots.mjs test-output/sponsor y1995
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/sponsor';
const prefix = process.argv[3] || (process.env.SAVE ? 'spaet' : 'y1975');
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
const shot = (n) => page.screenshot({ path: `${outDir}/${prefix}_${n}.png` });

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  if (await page.locator('.bf-modal').count()) await page.locator('.bf-continue').click();
} else {
  await startNewGame(page);
}

async function open(cat, sub) {
  await page.locator(`.hd-nav-item:has-text("${cat}")`).click();
  await page.waitForTimeout(200);
  await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(400);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${sub}: Seite scrollt (${scroll}px)`);
}

await open('Finanzen', 'Sponsoring');
await shot('sponsoring');
// Vertrag anklicken (Detail), dann Verhandlung öffnen.
if (await page.locator('.sp-row:not(.free)').count()) {
  await page.locator('.sp-row:not(.free)').first().click();
  await page.waitForTimeout(200);
  await shot('sponsoring_vertrag');
  await page.locator('.sp-row:not(.free)').first().click();
}
if (await page.locator('.sp-offer button:has-text("Verhandeln")').count()) {
  await page.locator('.sp-offer button:has-text("Verhandeln")').first().click();
  await page.waitForTimeout(300);
  await shot('verhandlung');
  await page.locator('.modal button:has-text("Gegenangebot senden")').click();
  await page.waitForTimeout(300);
  await shot('verhandlung_antwort');
  await page.locator('.modal-close').first().click().catch(() => {});
  await page.waitForTimeout(200);
}
await open('Finanzen', 'Marketing');
await shot('marketing');
await open('Finanzen', 'Bilanz');
await shot('bilanz');

console.log(errors.length ? errors.join('\n') : `Sponsoring-Screenshots (${prefix}) ohne Fehler`);
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
