// Optik-Screenshots (Vorher/Nachher-Vergleich): Zentrale, Kader, Tabelle, Finanzen,
// Vereinsprofil, Briefing und alle Reiter des Spielerprofils inkl. Positionswechsel.
//   npm run build && node tests/look-shots.mjs [ausgabeordner]
//   Mit Schriften aus dem Netz: FONTS=1 node tests/look-shots.mjs …
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/look';
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
if (!process.env.FONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
};

await startNewGame(page, { keepBriefing: true });
await page.waitForSelector('.bf-modal');
await page.waitForTimeout(300);
await shot('01_briefing');
await page.locator('.bf-continue').click();
await page.waitForTimeout(400);
await shot('02_zentrale');
await nav('Kader'); await shot('03_kader_dashboard');
await nav('Kader', 'Übersicht'); await shot('04_kader');
await nav('Statistiken', 'Liga'); await shot('05_tabelle');
await nav('Finanzen', 'Bilanz'); await shot('06_finanzen');
await nav('Spieltag', 'Aufstellung'); await shot('07_aufstellung');

// Vereinsprofil (Gegner aus der Tabelle)
await nav('Statistiken', 'Liga');
await page.locator('.dtable tbody tr.clickable').nth(2).click().catch(() => {});
await page.waitForTimeout(400);
if (await page.locator('.cmx-modal').count()) {
  await shot('08_vereinsprofil');
  await page.locator('.cmx-modal > .mx-head > .modal-close').click();
  await page.waitForTimeout(250);
}

// Spielerprofil: Torwart (erste Zeile) + ein Feldspieler mit Nebenpositionen
async function profile(rowIdx, tag) {
  await nav('Kader', 'Übersicht');
  await page.locator('.dtable tbody tr.clickable').nth(rowIdx).click();
  await page.waitForSelector('.pp-modal');
  const tabs = page.locator('.pp-tabs .tab');
  const n = await tabs.count();
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click();
    await page.waitForTimeout(200);
    const label = (await tabs.nth(i).innerText()).replace(/[^A-Za-zÄÖÜäöü]+/g, '_');
    await shot(`10_profil_${tag}_${i}_${label}`);
    if (label === 'Attribute') {
      const pos = page.locator('.pp-posbtn');
      const m = await pos.count();
      for (let j = 1; j < Math.min(m, 4); j++) {
        await pos.nth(j).click();
        await page.waitForTimeout(150);
        await shot(`10_profil_${tag}_${i}_${label}_pos${j}`);
      }
      if (m) await pos.nth(0).click();
    }
  }
  await page.locator('.pp-modal .modal-close').click();
  await page.waitForTimeout(250);
}
await profile(0, 'a');
await profile(9, 'b');
await profile(16, 'c');

console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
