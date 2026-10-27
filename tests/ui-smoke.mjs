// UI-Rauchtest: startet ein Spiel, klickt jede Seite an, macht Screenshots und
// meldet JS-Fehler. Danach laesst er die Zeit laufen und prueft, ob Tage vergehen.
//   node tests/ui-smoke.mjs [ausgabeordner] [sekundenZeitlauf]
// Voraussetzung: `npm run build` (dist/) und Playwright (npx playwright install chromium).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output';
const runSeconds = Number(process.argv[3] ?? 25);
await mkdir(outDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join('dist', path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
// Deterministischer Zufall -> Screenshots sind zwischen zwei Builds vergleichbar.
await page.addInitScript(() => {
  let a = 1975;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
// Externe Schriften blockieren (sonst Wartezeiten ohne Netz).
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

await page.goto(url);
await page.click('text=Neues Spiel');
await page.fill('input[placeholder*="Mustermann"]', 'Test');
await page.click('.club-pick >> nth=0');
await page.locator('input[type=range]').fill('300');
await page.click('text=SAISON STARTEN');
await page.waitForTimeout(800);

let shots = 0;
const mains = await page.locator('.hd-nav-item').count();
for (let m = 0; m < mains; m++) {
  await page.locator('.hd-nav-item').nth(m).click();
  await page.waitForTimeout(250);
  const subs = await page.locator('.tn-sub-item').count();
  for (let s = 0; s < subs; s++) {
    const item = page.locator('.tn-sub-item').nth(s);
    const label = (await item.innerText()).trim().replace(/[^A-Za-z0-9]+/g, '_');
    await item.click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${outDir}/${String(m)}${String(s).padStart(2, '0')}_${label}.png` });
    shots++;
  }
}

// Zeit laufen lassen
await page.locator('.hd-nav-item').first().click();
const dateBefore = await page.locator('body').innerText();
const weiter = page.getByRole('button', { name: /weiter/i }).first();
const deadline = Date.now() + runSeconds * 1000;
while (Date.now() < deadline) {
  // Modals (Spielbericht, Nachrichten ...) schliessen und weiterlaufen lassen
  for (const sel of ['button:has-text("Spiel simulieren")', 'button:has-text("Schließen")', 'button:has-text("Weiter zum")', 'button:has-text("OK")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
  if (await weiter.isVisible().catch(() => false)) await weiter.click().catch(() => {});
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: `${outDir}/zz_nach_zeitlauf.png` });
const dateAfter = await page.locator('body').innerText();
const dateRe = /\d{1,2}\. \w+ 19\d\d/;
console.log(`Screenshots: ${shots}`);
console.log(`Datum vorher: ${dateBefore.match(dateRe)?.[0]}  nachher: ${dateAfter.match(dateRe)?.[0]}`);
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
