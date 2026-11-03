// Screenshots aller Seiten mit Tabellen/Listen (Listenstil „Paarungen“, 28-rows.css).
//   npm run build && node tests/rows-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“ (public/saves/test-3-jahre.txt); anderer mit SAVE=…
// Meldet Seiten, die scrollen, und JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/mailbtn';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
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
const shot = async (n) => {
  await page.waitForTimeout(300);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${n}: Seite scrollt (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${n}.png` });
};

const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }

const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
};
// Weiter-Knopf: feste Breite + Sperre bei offener Entscheidung (roter Brief).
const w = async () => page.evaluate(() => Math.round(document.querySelector('.hd-right > .hd-continue')?.getBoundingClientRect().width ?? 0));
console.log('Breite Weiter:', await w());
await page.screenshot({ path: `${outDir}/weiter.png`, clip: { x: 1100, y: 0, width: 820, height: 80 } });
let found = false;
for (let i = 0; i < 120 && !found; i++) {
  if (await page.locator('.hd-continue.mail').count()) { found = true; break; }
  const b = page.locator('.hd-right > .hd-continue:not(.running)').first();
  if (await b.count()) await b.click().catch(() => {});
  await page.waitForTimeout(1500);
  for (const sel of ['.pm-btn-sim', 'button:has-text("Simulieren")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-overlay .modal-close']) {
    const x = page.locator(sel).first(); if (await x.isVisible().catch(() => false)) await x.click().catch(() => {});
  }
}
console.log('Brief-Zustand gefunden:', found, 'Breite:', await w());
if (found) {
  await page.screenshot({ path: `${outDir}/brief.png`, clip: { x: 1100, y: 0, width: 820, height: 80 } });
  await page.locator('.hd-continue.mail').click(); await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/newscenter.png` });
}
await browser.close(); server.close();
