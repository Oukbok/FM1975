// Screenshots der Winter-Seiten (Statistiken › Halle, Kader › Trainingslager, Kalender)
// und Prüfung auf waagerechten Überlauf / Seiten-Scroll.
//   npm run build && node tests/winter-shots.mjs [ausgabeordner]
//   Mitten in der Hallenrunde 1990/91:
//     DUMP=test-output/winter/save1990.txt UNTIL=1990-12-19 node scripts/sim.mjs 15
//     SAVE=test-output/winter/save1990.txt node tests/winter-shots.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/winter';
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
const prefix = process.env.SAVE ? 'save' : 'neu';
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
async function closeModals() {
  for (let k = 0; k < 8 && await page.locator('.modal-overlay').count(); k++) {
    const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK"), button:has-text("Weiter")').first();
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
    await page.waitForTimeout(300);
  }
}
await closeModals();

async function layoutReport() {
  return page.evaluate(() => {
    const out = [];
    const main = document.querySelector('.app-main');
    if (main && main.scrollHeight > main.clientHeight + 2) out.push(`Seite scrollt (${main.scrollHeight - main.clientHeight}px)`);
    for (const b of document.querySelectorAll('.app-main .dbox')) {
      const body = b.querySelector('.dbox-body');
      const title = b.querySelector('.dxh-title')?.textContent;
      if (body && body.scrollWidth > body.clientWidth + 2) out.push(`${title}: waagerechter Überlauf ${body.scrollWidth - body.clientWidth}px`);
    }
    return out;
  });
}

async function go(cat, sub, file) {
  await page.locator(`.hd-nav-item:has-text("${cat}")`).click();
  await page.waitForTimeout(250);
  await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${prefix}_${file}.png` });
  const rep = await layoutReport();
  console.log(`${sub}: ${rep.length ? rep.join('; ') : 'ok'}`);
}

await go('Statistiken', 'Halle', '1_halle');
// Ein gespieltes Turnier auswählen (Detailbox) und offene Einladung zusagen.
const played = page.locator('.app-main .dlist-row.clickable:has-text("Sieger")').first();
if (await played.count()) { await played.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${prefix}_2_halle_turnier.png` }); }
const youth = page.locator('.app-main .dlist-row .dchip:has-text("Jugend")').first();
if (await youth.count()) { await youth.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${prefix}_3_halle_zusage.png` }); }

await go('Kader', 'Trainingslager', '4_trainingslager');
// Winter-Reiter, Ziel wählen und buchen (falls möglich).
await page.locator('.app-main .dchip:has-text("Winter")').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${prefix}_5_trainingslager_winter.png` });
const bookBtn = page.locator('.app-main button:has-text("Buchen")').first();
if (await bookBtn.count() && await bookBtn.isEnabled()) {
  await bookBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${prefix}_6_trainingslager_gebucht.png` });
  console.log('Buchung:', await page.locator('.app-main .dnote[style*="accent"]').first().textContent().catch(() => '-'));
}
await go('Zentrale', 'Kalender', '7_kalender');
await page.locator('.hd-nav-item').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${prefix}_8_zentrale.png` });

console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
