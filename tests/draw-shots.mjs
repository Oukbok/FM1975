// Bildfolge der Ziehungs-Show: Einleitung, Kugel rollt, Kugel offen, Verein,
// Paarung, eigener Verein, Zusammenfassung, Wiederholung, reduzierte Bewegung.
//   node tests/draw-shots.mjs [ausgabeordner]           (neues Spiel, Juli 1975)
//   SAVE=…/save1976.txt node tests/draw-shots.mjs …     (Spielstand kurz vor einer Ziehung,
//     z. B. DUMP=…/save1976.txt UNTIL=1976-07-12 node scripts/sim.mjs 1)
//   SHOW=immer zeigt auch Ziehungen ohne eigenen Verein; SKIP=n überspringt die ersten n Shows.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/draw';
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
await page.evaluate((show) => localStorage.setItem('fm1980_settings', JSON.stringify({ speedMs: 300, drawShow: show, drawSpeed: 'langsam' })), process.env.SHOW ?? 'eigener');
await page.reload();
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const bf = page.locator('.bf-modal .bf-continue');
  if (await bf.isVisible().catch(() => false)) await bf.click();
} else {
  await startNewGame(page);
}
await page.waitForTimeout(600);

// Zeit laufen lassen, bis die Show aufgeht (Spielberichte schließen).
let found = false;
let skip = Number(process.env.SKIP ?? 0); // erste n Shows überspringen (z. B. für die Europapokal-Ziehung)
for (let i = 0; i < 300 && !found; i++) {
  if (await page.locator('.dr-root').isVisible().catch(() => false)) {
    if (skip-- > 0) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }
    found = true; break;
  }
  for (const sel of ['button:has-text("Schnell simulieren")', '.modal-close']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
  const w = page.locator('.hd-continue:not(.running)').first();
  if (await w.isVisible().catch(() => false)) await w.click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(400);
}
if (!found) { console.log('Keine Ziehung erreicht'); process.exit(1); }
const year = (await page.locator('.dr-top-l').innerText()).match(/(19|20)\d\d/)?.[0] ?? 'x';
const shot = async (name) => { await page.screenshot({ path: `${outDir}/${year}_${name}.png` }); console.log('  ', `${outDir}/${year}_${name}.png`); };
const waitFor = async (sel, ms = 15000) => page.locator(sel).first().waitFor({ state: 'visible', timeout: ms }).then(() => true).catch(() => false);

console.log('Ziehung', (await page.locator('.dr-comp').innerText()).trim());
await shot('01_start');
if (await waitFor('.dr-roll')) { await page.waitForTimeout(450); await shot('02_kugel_rollt'); }
if (await waitFor('.dr-open')) { await page.waitForTimeout(250); await shot('03_kugel_offen'); }
if (await waitFor('.dr-card')) { await page.waitForTimeout(500); await shot('04_verein'); }
if (await waitFor('.dr-pairing', 20000)) { await page.waitForTimeout(600); await shot('05_paarung'); }
const mineBtn = page.locator('button:has-text("Bis zu meiner Ziehung")');
if (await mineBtn.isVisible().catch(() => false)) {
  await mineBtn.click();
  if (await waitFor('.dr-card.mine, .dr-side.mine', 30000)) { await page.waitForTimeout(600); await shot('06_eigener_verein'); }
  if (await waitFor('.dr-pairing.mine', 15000)) { await page.waitForTimeout(700); await shot('07_eigene_paarung'); }
}
// Pause per Leertaste
await page.keyboard.press('Space');
await page.waitForTimeout(300);
await shot('08_pause');
await page.keyboard.press('Space');
await page.keyboard.press('Escape');
if (await waitFor('.dr-summary')) { await page.waitForTimeout(1000); await shot('09_zusammenfassung'); }
await page.click('.dr-close');
await page.waitForTimeout(400);
const closed = !(await page.locator('.dr-root').isVisible().catch(() => false));
console.log('Show geschlossen:', closed);

// Wiederholung aus Statistiken › Pokal / International
const isEuro = /Landesmeister|Pokalsieger|Europa-Pokal/.test(await page.locator('body').innerText().catch(() => ''));
await page.click('.hd-nav-item:has-text("Statistiken")');
await page.waitForTimeout(300);
await page.click(`.tn-sub-item:has-text("${isEuro ? 'International' : 'Pokal'}")`).catch(() => {});
await page.waitForTimeout(400);
await shot('10_statistik_pokal');
const rep = page.locator('.cup-draw-replay').first();
if (await rep.isVisible().catch(() => false)) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await rep.click();
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Schnell")').first().click();
  await waitFor('.dr-card', 8000);
  await shot('11_wiederholung_reduziert');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
}
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
