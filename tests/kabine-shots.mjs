// Screenshots der Kabine (Kader › Kabine): Kreis, Spieler im Fokus, Gespräch,
// Vorfälle, Verlauf – mit Prüfung auf Überlauf/Seiten-Scroll.
//   npm run build && SAVE=… node tests/kabine-shots.mjs [ausgabeordner] [präfix]
//   Spielstand z. B. HUMAN=1 DUMP=save.txt UNTIL=1990-03-01 node scripts/sim.mjs 15
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/kabine';
const prefix = process.argv[3] || (process.env.SAVE ? 'save' : 'neu');
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
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
  const rep = await page.evaluate(() => {
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
  console.log(`${name}: ${rep.length ? rep.join('; ') : 'ok'}`);
}
await page.locator('.hd-nav-item:has-text("Kader")').click();
await page.waitForTimeout(250);
await page.locator('.tn-sub-item:has-text("Kabine")').click();
await shot('1_uebersicht');
await page.locator('.kb-node').nth(8).click();
await shot('2_spieler');
const talk = page.locator('.kb-talk:not([disabled])').first();
if (await talk.count()) { await talk.click(); await shot('3_gespraech'); }
await page.locator('.dchip:has-text("Zusammenhalt")').click();
await page.locator('.dchip:has-text("Vorfälle")').click();
await shot('4_vorfaelle');
await page.locator('.dchip:has-text("Verlauf")').click();
await page.locator('.dchip:has-text("Moral")').first().click();
await shot('5_verlauf');
await page.locator('.dchip:has-text("Maßnahmen")').click();
const ev = page.locator('.dlist-row button:has-text("Ausrichten")').first();
if (await ev.isEnabled().catch(() => false)) { await ev.click(); await shot('6_teamevent'); }
console.log(errors.length ? errors.join('\n') : 'keine JS-Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
