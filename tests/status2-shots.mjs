// Screenshots Zustand 2: Form-Daumen (Grünstufen) + Fitness-Hantel in Kader/Aufstellung mit Hover,
// Spielerprofil-Kopf (verdeckte Werte als Einschätzung), Attribute mit i-Hilfe, Medizin, Bericht.
//   npm run build && node tests/status2-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/status2';
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
await nav('Kader', 'Übersicht');
await shot('01_kader');
await page.locator('.dtable .st-form').first().hover(); await page.waitForTimeout(150); await shot('02_hover_form');
await page.locator('.dtable .st-fitness').first().hover(); await page.waitForTimeout(150); await shot('03_hover_fitness');
await page.mouse.move(5, 5);
await page.locator('.dtable tbody tr.clickable').nth(9).click();
await page.waitForSelector('.pp-modal');
await page.waitForTimeout(200);
await shot('04_profil_kopf');
await shot('05_attribute');
const tips = page.locator('.pp2-skills .itip-attr');
for (const [i, n] of [[0, 'a'], [4, 'b'], [12, 'c']]) {
  if (await tips.count() > i) { await tips.nth(i).hover(); await page.waitForTimeout(400); await shot(`06_attr_tip_${n}`); }
}
await page.mouse.move(5, 5);
await page.locator('.pp-tabs .tab:has-text("Allgemein")').click(); await page.waitForTimeout(200);
const ot = page.locator('.itip-attr');
if (await ot.count()) { await ot.first().hover(); await page.waitForTimeout(400); await shot('07_uebersicht_tip'); }
await page.mouse.move(5, 5);
await page.locator('.pp-tabs .tab:has-text("Medizin")').click(); await page.waitForTimeout(200); await shot('08_medizin');
await page.locator('.pp-tabs .tab:has-text("Bericht")').click(); await page.waitForTimeout(200); await shot('09_bericht');
await page.locator('.pp-tabs .tab:has-text("Entwicklung")').click(); await page.waitForTimeout(200); await shot('10_entwicklung');
await page.locator('.pp-modal .pp2-close').click();
await page.waitForTimeout(250);
await nav('Aufstellung', 'Aufstellung'); await shot('11_aufstellung');
const lf = page.locator('.st-form');
if (await lf.count()) { await lf.first().hover(); await page.waitForTimeout(150); await shot('12_aufstellung_hover'); }

console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
