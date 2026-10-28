// Screenshots der Stadionseite (Übersicht, Block-Konfigurator mit Planung).
//   node tests/stadium-shots.mjs [ausgabeordner]   (SAVE=… lädt einen Spielstand)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/stadium';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const tag = process.env.SAVE ? 'late' : 'new';
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
} else { await startNewGame(page); await page.waitForTimeout(800); }
await page.locator('.hd-nav-item:has-text("Verein")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Stadion")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_1_uebersicht.png` });
// Gegengerade (hinterer Block) anklicken und planen
await page.locator('.gr-svg .gr-obj').first().click({ force: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_2_block.png` });
const add = page.locator('button:has-text("+ Rang aufstocken")');
if (await add.isVisible() && await add.isEnabled()) await add.click();
const roof = page.locator('.st-panel button:has-text("volles Dach")');
if (await roof.isVisible()) await roof.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_3_planung.png` });
// Haupttribüne (vorne)
await page.locator('.gr-svg .gr-obj').last().click({ force: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_4_haupttribuene.png` });
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
