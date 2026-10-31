// Screenshots des Vereinsprofils (alle Reiter, Gegner / Sim-Verein / eigener Verein)
// und Prüfung auf waagerechten Überlauf in den Boxen.
//   npm run build && node tests/club-profile-shots.mjs [ausgabeordner]
//   Mit Historie: DUMP=test-output/club/save.txt node scripts/sim.mjs 6
//                 SAVE=test-output/club/save.txt node tests/club-profile-shots.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/club';
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
// Begrüßungs-/Ereignisfenster schließen
for (let k = 0; k < 6 && await page.locator('.modal-overlay').count(); k++) {
  const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK")').first();
  if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
  await page.waitForTimeout(300);
}

/** Waagerechter Überlauf / abgeschnittene Boxen im offenen Profil. */
async function overflowReport() {
  return page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll('.cmx-modal .dbox')) {
      const body = b.querySelector('.dbox-body');
      const title = b.querySelector('.dxh-title')?.textContent;
      if (body && body.scrollWidth > body.clientWidth + 2) out.push(`${title}: waagerechter Überlauf ${body.scrollWidth - body.clientWidth}px`);
      if (body && !body.textContent.trim() && !body.querySelector('svg')) out.push(`${title}: leer`);
    }
    return out;
  });
}

async function shootProfile(tag) {
  const tabs = ['Übersicht', 'Kader', 'Verein', 'Historie'];
  for (let i = 0; i < tabs.length; i++) {
    await page.locator('.cmx-tabs .tab').nth(i).click();
    await page.waitForTimeout(250);
    const file = `${outDir}/${prefix}_${tag}_${i + 1}_${tabs[i].replace(/[^A-Za-z]/g, '')}.png`;
    await page.screenshot({ path: file });
    const rep = await overflowReport();
    console.log(`${tag} / ${tabs[i]}: ${rep.length ? rep.join('; ') : 'ok'}`);
  }
}
const closeProfile = async () => { await page.locator('.cmx-modal > .mx-head > .modal-close').click(); await page.waitForTimeout(250); };

// 1) Gegner aus der Tabelle
await page.locator('.hd-nav-item:has-text("Statistiken")').click();
await page.waitForTimeout(250);
await page.locator('.tn-sub-item:has-text("Liga")').first().click();
await page.waitForTimeout(300);
const rows = page.locator('.dtable tbody tr.clickable');
const n = await rows.count();
let idx = 0;
for (let i = 0; i < n; i++) { if (!(await rows.nth(i).getAttribute('class')).includes('me')) { idx = i; break; } }
await rows.nth(idx).click();
await page.waitForSelector('.cmx-modal');
await shootProfile('gegner');

// Spielerprofil aus dem Kader + zurück über den Vereinsnamen
await page.locator('.cmx-tabs .tab').nth(1).click();
await page.locator('.cmx-modal .dtable tbody tr').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${prefix}_gegner_5_Spielerprofil.png` });
await page.locator('.pp-club .club-link').click();
await page.waitForTimeout(300);
console.log('Spielerprofil → Verein:', (await page.locator('.pp-modal').count()) === 0 ? 'ok (Spielerprofil geschlossen)' : 'Spielerprofil noch offen');
await closeProfile();

// 2) Sim-Verein (andere Liga)
const sel = page.locator('select.dselect').first();
const opts = await sel.locator('option').count();
if (opts > 1) {
  await sel.selectOption({ index: 1 });
  await page.waitForTimeout(300);
  await page.locator('.dtable tbody tr.clickable').first().click();
  await page.waitForSelector('.cmx-modal');
  await shootProfile('simverein');
  await closeProfile();
  await sel.selectOption({ index: 0 });
  await page.waitForTimeout(200);
}

// 3) Eigener Verein
await page.locator('.dtable tbody tr.me').first().click();
await page.waitForSelector('.cmx-modal');
await shootProfile('eigener');
await closeProfile();

// 4) Aufruf aus der Zentrale (Tabelle) und dem Spielplan
await page.locator('.hd-nav-item').first().click();
await page.waitForTimeout(300);
await page.locator('.dxt-row').nth(1).click();
await page.waitForTimeout(300);
console.log('Zentrale → Profil:', (await page.locator('.cmx-modal').count()) ? 'ok' : 'FEHLT');
await closeProfile();
await page.locator('.hd-nav-item:has-text("Spieltag")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Spielplan")').first().click();
await page.waitForTimeout(300);
const link = page.locator('.dtable .club-link').first();
if (await link.count()) {
  await link.click();
  await page.waitForTimeout(300);
  console.log('Spielplan → Profil:', (await page.locator('.cmx-modal').count()) ? 'ok' : 'FEHLT');
  await page.screenshot({ path: `${outDir}/${prefix}_spielplan.png` });
}

console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
