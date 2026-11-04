// Screenshots Fanartikel (Finanzen › Fanartikel): Reiter Allgemein + Statistiken, Artikel- und
// Spielerauswahl, Diagramm „Saisons“, je in 1920×1080 und 1366×768.
//   npm run build && node tests/merch-shots.mjs [ordner] [präfix]
//   Standard: Vorlage „Test 3 Jahre“ (public/saves/test-3-jahre.txt); später mit SAVE=… aus
//   TESTSAVE=1 UNTIL=1995-11-20 DUMP=… node scripts/sim.mjs 20   (bzw. 40 / 2015-11-20)
// Meldet JS-Fehler und Seiten, die scrollen.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/merch';
const prefix = process.argv[3] || (process.env.SAVE ? 'spaet' : 'y1978');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  let body;
  try { body = await readFile(join('dist', path)); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch();
const errors = [];

for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); localStorage.removeItem('fm1975.merchTab'); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  const shot = async (n) => {
    await page.waitForTimeout(350);
    const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    if (scroll > 2) errors.push(`${w}×${h} ${n}: Seite scrollt (${scroll}px)`);
    await page.screenshot({ path: `${outDir}/${prefix}_${w}_${n}.png` });
  };
  await page.locator('.hd-nav-item:has-text("Finanzen")').first().click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Fanartikel")').first().click();
  await page.waitForTimeout(500);
  await shot('allgemein');
  // Zweiten Artikel wählen, Assistent aus (Bestellknöpfe sichtbar)
  const rows = page.locator('.mc-table tbody tr');
  if (await rows.count() > 1) await rows.nth(0).click();
  await page.locator('.mc-auto input').click();
  await shot('allgemein_manuell');
  await page.locator('.mc-auto input').click();
  // Statistiken
  await page.locator('.sub3-tabs .tab:has-text("Statistiken")').first().click();
  await page.waitForTimeout(400);
  const bar = page.locator('.mc-chart-plot svg g').last();
  if (await bar.count()) await bar.hover().catch(() => {});
  await shot('statistik');
  const prow = page.locator('.mc-face + table tbody tr');
  if (await prow.count() > 1) { await prow.nth(1).click(); await shot('statistik_spieler'); }
  await page.locator('.seg-btn:has-text("Saisons")').click();
  await shot('statistik_saisons');
  await page.close();
}

console.log(errors.length ? errors.join('\n') : `Fanartikel-Screenshots (${prefix}) ohne Fehler`);
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
