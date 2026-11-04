// Screenshots der Presse (Zentrale › Presse): Zeitungsseite, Artikel, Spielerprofil
// aus einem Gesicht, ältere Ausgabe – mit Prüfung auf Seiten-Scroll/Überlauf.
//   npm run build && SAVE=public/saves/test-3-jahre.txt node tests/presse-shots.mjs [ordner] [präfix]
//   später Spielstand: HUMAN=1 DUMP=… UNTIL=2005-11-07 node scripts/sim.mjs 30
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/presse';
const prefix = process.argv[3] || (process.env.SAVE ? 'save' : 'neu');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1920), height: Number(process.env.H || 1080) } });
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
} else {
  await startNewGame(page);
  await page.waitForTimeout(800);
}
for (let k = 0; k < 8 && await page.locator('.modal-overlay').count(); k++) {
  const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK"), button:has-text("Weiter")').first();
  if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
  await page.waitForTimeout(300);
}
async function shot(name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate(() => {
    const out = [];
    const main = document.querySelector('.app-main');
    if (main && main.scrollHeight > main.clientHeight + 2) out.push(`Seite scrollt (${main.scrollHeight - main.clientHeight}px)`);
    const body = document.querySelector('.np-box .dbox-body');
    if (body && body.scrollWidth > body.clientWidth + 2) out.push(`Zeitung: waagerechter Überlauf ${body.scrollWidth - body.clientWidth}px`);
    for (const el of document.querySelectorAll('.np-res-name, .np-h3, .np-h1')) if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).textOverflow !== 'ellipsis') out.push('Text läuft über: ' + el.textContent.slice(0, 40));
    return out;
  });
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
await page.locator('.tn-sub-item:has-text("Presse")').click().catch(async () => {
  await page.locator('.hd-nav-item:has-text("Zentrale")').click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Presse")').click();
});
await shot('1_zeitung');
const body = page.locator('.np-box .dbox-body');
await body.evaluate((el) => el.scrollTo(0, el.scrollHeight));
await shot('2_zeitung_unten');
await body.evaluate((el) => el.scrollTo(0, 0));
await page.locator('.np-lead, .np-teaser').first().click();
await shot('3_artikel');
const face = page.locator('.np-article .np-who').first();
if (await face.count()) { await face.click(); await shot('4_profil'); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
for (let k = 0; k < 3 && await page.locator('.modal-overlay').count(); k++) { await page.locator('.modal-close').last().click().catch(() => {}); await page.waitForTimeout(250); }
const older = page.locator('.sub3-tabs .tab').nth(2);
if (await older.count()) { await older.click(); await shot('5_aeltere_ausgabe'); }
const res = page.locator('.np-res.clickable').first();
if (await res.count()) { await res.click(); await shot('6_spielbericht'); }
console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
