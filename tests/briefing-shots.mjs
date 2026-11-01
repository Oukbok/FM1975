// Screenshots des Saison-Briefings: Popup (alle Reiter) zu Spielbeginn und das Archiv
// Zentrale › Briefing; mit SAVE=… zusätzlich eine spätere Saison aus dem Archiv.
//   npm run build && node tests/briefing-shots.mjs [ausgabeordner]
//   Spätere Saison: DUMP=test-output/briefing/save.txt node scripts/sim.mjs 21
//                   SAVE=test-output/briefing/save.txt node tests/briefing-shots.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { skipIntro, startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/briefing';
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
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });

async function modalTabs(prefix) {
  await page.waitForSelector('.bf-modal');
  const n = await page.locator('.bf-tabs .tab').count();
  for (let i = 0; i < n; i++) {
    await page.locator('.bf-tabs .tab').nth(i).click();
    await page.waitForTimeout(200);
    const label = (await page.locator('.bf-tabs .tab').nth(i).innerText()).replace(/\d+/g, '').trim().replace(/[^A-Za-zÄÖÜäöü]+/g, '_');
    await shot(`${prefix}_${i}_${label}`);
    // Aufklappbaren Bereich „Noch anders als heute“ zusätzlich offen zeigen.
    if (await page.locator('.bf-toggle').count()) { await page.locator('.bf-toggle').click(); await page.waitForTimeout(150); await shot(`${prefix}_${i}_${label}_offen`); }
  }
  const over = await page.evaluate(() => { const b = document.querySelector('.bf-body'); return b ? b.scrollWidth - b.clientWidth : 0; });
  if (over > 2) errors.push(`${prefix}: waagerechter Überlauf ${over}px`);
}

async function archive(prefix) {
  await page.locator('.hd-nav-item').first().click();
  await page.locator('.tn-sub-item:has-text("Briefing")').click();
  await page.waitForTimeout(300);
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  if (scroll > 2) errors.push(`${prefix}: Archivseite scrollt (${scroll}px)`);
  await shot(`${prefix}_archiv`);
}

if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  if (await page.locator('.bf-modal').count()) errors.push('Popup beim Laden geöffnet');
  await archive('spaet');
  await page.locator('.dxh-right button:has-text("Briefing öffnen")').click();
  await modalTabs('spaet_popup');
  await page.locator('.bf-continue').click();
  // Saison mit Regelwechsel (Drei-Punkte-Regel) aus dem Archiv.
  const s95 = page.locator('.bf-arch-item:has-text("1995/96")');
  if (await s95.count()) {
    await s95.click();
    await page.waitForTimeout(200);
    await shot('spaet_archiv_1995');
    await page.locator('.dxh-right button:has-text("Briefing öffnen")').click();
    await modalTabs('s1995_popup');
  }
} else {
  await startNewGame(page, { keepBriefing: true });
  await skipIntro(page);
  await modalTabs('start_popup');
  await page.locator('.bf-continue').click();
  await page.waitForTimeout(300);
  await archive('start');
}
console.log(errors.length ? errors.join('\n') : 'Briefing-Screenshots ohne Fehler');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
