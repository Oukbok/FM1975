// Screenshots Match-Engine 2: Taktik (gemessene Wirkung, Flankenart) und Spielbericht mit Einzelwerten.
//   node tests/engine-shots.mjs [ordner]      (SAVE=… für spätere Epochen; Voraussetzung: npm run build)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { walkToPrematch } from './prematch-walk.mjs';

const outDir = process.argv[2] || 'test-output/engine';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
} else await startNewGame(page);
await page.waitForTimeout(800);
const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};
await closeModals();
await page.locator('.hd-nav-item:has-text("Aufstellung")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Taktik")').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/01_taktik.png` });
// Breite auf Flügel, hohe Flanken → Messung aktualisiert sich
await page.locator('.txi-row[data-instr=width] .txi-step').nth(4).click();
await page.click('.lu-seg button:has-text("Hoch")', { timeout: 2000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outDir}/02_taktik_fluegel_hoch.png` });
await page.locator('.txi-row[data-instr=width] .txi-step').nth(2).click();
await page.click('.lu-seg button:has-text("Gemischt")', { timeout: 2000 }).catch(() => {});
await page.waitForTimeout(500);

// Bis zum eigenen Spiel (Vorschau „Nächstes Spiel“), simulieren, Spielbericht
await walkToPrematch(page, 'Nächstes eigenes Spiel', 200);
await page.click('.pm-go-btn:has-text("Simulieren")').catch(() => {});
await page.waitForSelector('.mr-modal', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);
if (await page.locator('.mr-modal').isVisible().catch(() => false)) {
  await page.screenshot({ path: `${outDir}/03_bericht.png` });
  // Neuer Bericht (report/TickerReport.tsx): Reiter rechts; altes Layout: Umschalter
  if (await page.locator('.mr2').isVisible().catch(() => false)) {
    await page.click('.mr2-side .tm-tabs button:has-text("Aufstellungen")').catch(() => {});
    await page.click('.mr2 .tm-ticker .tm-tabs button:has-text("Highlights")').catch(() => {});
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/03b_bericht_aufstellung.png` });
    await page.click('.mr2-side .tm-tabs button:has-text("Einzelwerte")').catch(() => {});
  } else await page.click('.mr-lu-toggle button:has-text("Einzelwerte")').catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/04_bericht_einzelwerte.png` });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/05_bericht_1366.png` });
} else console.log('Spielbericht nicht gefunden');
console.log(errors.length ? `JS-Fehler:\n${errors.join('\n')}` : 'keine JS-Fehler');
await browser.close();
server.close();
