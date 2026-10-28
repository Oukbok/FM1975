// Oberflächentest Textmodus + Spielbericht: spielt bis zum ersten eigenen Spiel,
// verfolgt es im Textmodus (inkl. Spannungsmoment, Halbzeit, Wechsel, Taktik),
// simuliert das nächste Spiel schnell und öffnet den Bericht.
//   node tests/match-ui.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/match';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
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
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(url);
await startNewGame(page);
await page.waitForTimeout(800);

const closeModals = async () => {
  for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
};
async function untilMatchDue() {
  for (let i = 0; i < 120; i++) {
    if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) return true;
    await closeModals();
    const w = page.getByRole('button', { name: /weiter/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  return false;
}

if (!(await untilMatchDue())) { console.log('Kein eigenes Spiel erreicht'); process.exit(1); }
await page.screenshot({ path: `${outDir}/01_kopf_knoepfe.png` });
await page.click('button:has-text("Textmodus")');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/02_textmodus_start.png` });
await page.click('.ms-speed >> text=Schnell');

// Spannungsmoment abfangen: mehrere Bilder während des Flimmerns + Auflösung
let caught = false;
for (let i = 0; i < 1200 && !caught; i++) {
  if (await page.locator('.ms-susp').isVisible().catch(() => false)) {
    for (let f = 0; f < 3; f++) { await page.locator('.ms-now').screenshot({ path: `${outDir}/03_spannung_${f}.png` }).catch(() => {}); await page.waitForTimeout(250); }
    await page.locator('.ms-reveal').waitFor({ timeout: 4000 }).catch(() => {});
    await page.locator('.ms-now').screenshot({ path: `${outDir}/04_aufloesung_box.png` }).catch(() => {});
    await page.screenshot({ path: `${outDir}/04_aufloesung.png` });
    caught = true;
  }
  if (await page.locator('.ms-dialog').isVisible().catch(() => false)) break;
  await page.waitForTimeout(100);
}
// Taktik + Zuruf
await page.click('.ms-chip >> text=Offensiv').catch(() => {});
await page.click('.ms-shout >> nth=0').catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/05_taktik_zuruf.png` });
// Statistik-Reiter
await page.click('.ms-tabs >> text=Statistik');
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/06_statistik.png` });
// Wechsel: erster Feldspieler → erster Bankspieler
const rows = page.locator('.ms-lineup .ms-rows').first().locator('.ms-row');
await rows.nth(5).click().catch(() => {});
await page.waitForTimeout(200);
await page.locator('.ms-benchrow.pickable').first().click().catch(() => {});
await page.waitForTimeout(900);
await page.screenshot({ path: `${outDir}/07_wechsel.png` });
// Bis zur Pause
if (!(await page.locator('.ms-dialog').isVisible().catch(() => false))) await page.click('button:has-text("Bis zur Pause")').catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/08_halbzeit.png` });
await page.click('.ms-talk >> nth=2').catch(() => {});
await page.waitForTimeout(1500);
await page.click('.ms-tabs >> text=Gegner');
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/09_zweite_halbzeit.png` });
await page.click('button:has-text("Bis zum Ende")').catch(() => {});
await page.waitForTimeout(1500);
for (let i = 0; i < 6; i++) { if (await page.locator('.ms-continue').isVisible().catch(() => false)) break; await page.click('button:has-text("Auflösen")').catch(() => {}); await page.click('button:has-text("Bis zum Ende")').catch(() => {}); await page.waitForTimeout(800); }
await page.screenshot({ path: `${outDir}/10_ende.png` });
await page.click('.ms-continue');
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/11_zurueck.png` });

// Nächstes Spiel schnell simulieren → Spielbericht
if (await untilMatchDue()) {
  await page.click('button:has-text("Schnell simulieren")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/12_bericht.png` });
}
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
