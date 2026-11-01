// Screenshots der Nachwuchs-Seiten (Jugend → Akademie, Jugend → Mannschaften).
//   node tests/youth-shots.mjs [ausgabeordner]   (SAVE=… lädt einen Spielstand, z. B. aus DUMP=… node scripts/sim.mjs 30)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/youth';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1920), height: Number(process.env.H || 1080) } });
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
await page.locator('.hd-nav-item:has-text("Jugend")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Akademie")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_1_akademie.png` });
// Ersten möglichen Ausbau beauftragen und Etat erhöhen.
const up = page.locator('.ac-act .btn-primary:enabled').first();
if (await up.count()) await up.click();
const range = page.locator('.ac-range');
if (await range.count()) await range.evaluate((el) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, '90000'); el.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_2_ausbau.png` });
// Seitenscroll prüfen (die Seite selbst darf nie scrollen).
const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
if (scroll > 2) errors.push(`Akademie-Seite scrollt (${scroll}px)`);
await page.locator('.tn-sub-item:has-text("Mannschaften")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_3_jugend.png` });
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
